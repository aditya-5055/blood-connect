const BloodRequest = require("../models/bloodRequestModel");
const Facility = require("../models/facilityModel");
const Donor = require("../models/donorModel");
const ProactiveDonation = require("../models/proactiveDonationModel");
const AppointmentSlot = require("../models/appointmentSlotModel");
const mailSender = require("../utils/mailSender");
const bloodRequestExpiredTemplate = require("../mail/templates/bloodRequestExpiredTemplate");
const sendNotification = require("./sendNotification");
const { getDonorRadius } = require("./requestRadius");

// ─────────────────────────────────────────────────────────────────
// 🚀 HELPER: Notify nearby donors when a request escalates
// ─────────────────────────────────────────────────────────────────
const notifyEscalatedDonors = async (request) => {
  try {
    const hospital = await Facility.findById(request.hospitalId);
    if (!hospital) return;

    const nearbyDonors = await Donor.find({
      bloodGroup: request.bloodGroup,
      isAvailable: true,
      eligibleToDonate: true,
      location: {
        $near: { $geometry: request.location, $maxDistance: getDonorRadius(request.urgencyLevel) },
      },
    });

    Promise.all(
      nearbyDonors.map((donor) =>
        sendNotification(
          donor._id, "Donor", "URGENT: Blood Needed 🚨",
          `Emergency: ${hospital.name} desperately needs ${request.bloodGroup} blood. Can you donate directly?`,
          "/donor/nearby-requests"
        )
      )
    ).catch((err) => console.error("Escalation notification error:", err));
  } catch (error) {
    console.error("Failed to notify escalated donors:", error);
  }
};

// ─────────────────────────────────────────────────────────────────
// 🏥 PART 1: Update Blood Request Stages (Hospital Requests)
// ─────────────────────────────────────────────────────────────────
const updateBloodRequestStages = async (now) => {
  // 1️⃣ Expire requests past total deadline
  const expiredRequests = await BloodRequest.find({
    status: "active",
    deadline: { $lt: now },
  });

  for (const request of expiredRequests) {
    request.status = "expired";
    request.expiryReason = "Request deadline passed — no response in time";
    await request.save();
    const hospital = await Facility.findById(request.hospitalId);
    if (hospital) {
      await mailSender(hospital.email, "Request Expired", bloodRequestExpiredTemplate(hospital.name, request.bloodGroup, request.units, request.urgencyLevel));
      await sendNotification(hospital._id, "Facility", "Request Expired ❌", `Your request for ${request.bloodGroup} expired.`, "/hospital/my-requests");
    }
  }

  // 2️⃣ Escalate to Donors (Stage: "bloodbank" -> "both")
  const bankDeadlineExpired = await BloodRequest.find({
    status: "active",
    stage: "bloodbank",
    units: 1,
    bankStageDeadline: { $lt: now },
  });

  for (const request of bankDeadlineExpired) {
    request.stage = "both";
    request.stageUpdatedAt = now;
    await request.save();
    await notifyEscalatedDonors(request);
  }
};

// ─────────────────────────────────────────────────────────────────
// 🩸 PART 2: Update Proactive Donation Lifecycle (Real-World Logic)
// ─────────────────────────────────────────────────────────────────
const updateProactiveDonationStages = async (now) => {
  const bookings = await ProactiveDonation.find({ status: "booked" }).populate("slotId");

  for (const booking of bookings) {
    if (!booking.slotId) continue;

    const slot = booking.slotId;
    const slotStart = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(":").map(Number);
    slotStart.setHours(hours, minutes, 0, 0);

    if (now > slotStart) {
      booking.status = "no-show";
      await booking.save();

      const donor = await Donor.findById(booking.donorId);
      if (donor) {
        donor.trustScore = Math.max(0, (donor.trustScore || 100) - 10);
        donor.eligibleToDonate = true; 
        await donor.save();

        await sendNotification(
          donor._id, 
          "Donor", 
          "Missed Appointment ⚠️", 
          `You missed your booked appointment on ${new Date(slot.date).toDateString()} at ${slot.startTime}. Your trust score was reduced by 10 points.`, 
          "/donor/profile"
        );
      }
    }
  }
};

// 🔄 MAIN WRAPPER: Runs all updaters
// ─────────────────────────────────────────────────────────────────
const runBloodRequestUpdater = async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] 🛡️ Running Blood Request Updater...`);
    
    await updateBloodRequestStages(now);
    await updateProactiveDonationStages(now);
    
    console.log(`[${now.toISOString()}] ✅ Cleanup Complete.`);
  } catch (error) {
    console.error("Critical Error in runBloodRequestUpdater:", error.message);
  }
};

module.exports = runBloodRequestUpdater;