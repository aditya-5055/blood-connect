const BloodRequest = require("../models/bloodRequestModel");
const Facility = require("../models/facilityModel");
const Donor = require("../models/donorModel");
const ProactiveDonation = require("../models/proactiveDonationModel"); // ✅ Added Proactive Model
const mailSender = require("../utils/mailSender");
const bloodRequestExpiredTemplate = require("../mail/templates/bloodRequestExpiredTemplate");
const sendNotification = require("./sendNotification");

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
        $near: { $geometry: request.location, $maxDistance: 10000 },
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
  // 1️⃣ Expire stale "Pending" requests (Bank ignored donor for 72h)
  const staleRequests = await ProactiveDonation.find({
    status: "pending",
    expiresAt: { $lt: now }
  });

  for (const req of staleRequests) {
    req.status = "expired";
    await req.save();
    await sendNotification(req.donorId, "Donor", "Request Expired ⏳", "The blood bank didn't respond in time. Please try another bank.", "/donor/my-requests");
  }

  // 2️⃣ Expire "Invited" requests (Donor ghosted bank's invite for 24h)
  const staleInvites = await ProactiveDonation.find({
    status: "invited",
    expiresAt: { $lt: now }
  });

  for (const req of staleInvites) {
    req.status = "expired";
    await req.save();
    
    // Minor penalty for ignoring an invite
    const donor = await Donor.findById(req.donorId);
    if (donor) {
      donor.trustScore = Math.max(0, (donor.trustScore || 100) - 2); 
      donor.eligibleToDonate = true; // Unlock them to try elsewhere
      await donor.save();
      await sendNotification(req.donorId, "Donor", "Invite Expired ⚠️", "Your invitation has expired. Try registering again.", "/donor/my-requests");
    }
  }

  // 3️⃣ Auto-detect "No-Shows" (Appointment date + 12-hour grace period passed)
  const gracePeriod = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const noShows = await ProactiveDonation.find({
    status: "confirmed",
    appointmentDate: { $lt: gracePeriod }
  });

  for (const req of noShows) {
    req.status = "no-show";
    await req.save();

    const donor = await Donor.findById(req.donorId);
    if (donor) {
      // ✅ UBER LOGIC: -10 Points, NO BAN, Unlock donor
      donor.trustScore = Math.max(0, (donor.trustScore || 100) - 10);
      donor.eligibleToDonate = true; 
      await donor.save();
      
      await sendNotification(
        donor._id, 
        "Donor", 
        "Trust Score Reduced 📉", 
        "You missed your confirmed appointment. Your trust score was reduced, but you can book a new appointment anytime.", 
        "/donor/profile"
      );
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// 🔄 MAIN WRAPPER: Runs all updaters
// ─────────────────────────────────────────────────────────────────
const runSystemUpdaters = async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] 🛡️ Running System Updaters...`);
    
    await updateBloodRequestStages(now);
    await updateProactiveDonationStages(now);
    
    console.log(`[${now.toISOString()}] ✅ Cleanup Complete.`);
  } catch (error) {
    console.error("Critical Error in runSystemUpdaters:", error.message);
  }
};

module.exports = runSystemUpdaters;