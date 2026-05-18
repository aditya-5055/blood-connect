const ProactiveDonation = require("../models/proactiveDonationModel");
const Donor = require("../models/donorModel");
const sendNotification = require("./sendNotification");

/**
 * ✅ This function runs automatically to:
 * 1. Expire invited requests that donors ignored for too long.
 * 2. Mark missed confirmed appointments as no-show and penalize trust score.
 */
const runSystemUpdaters = async () => {
  try {
    const now = new Date();

    // 1. Auto-expire "invited" requests older than 48 hours
    const expirationLimit = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const expiredRequests = await ProactiveDonation.find({
      status: "invited",
      updatedAt: { $lt: expirationLimit },
    });

    for (const request of expiredRequests) {
      request.status = "expired";
      await request.save();

      // Unlock the donor so they can request elsewhere
      await Donor.findByIdAndUpdate(request.donorId, { eligibleToDonate: true });
    }

    if (expiredRequests.length > 0) {
      console.log(`🛡️ Janitor: Cleaned up ${expiredRequests.length} stale requests.`);
    }

    // 2. Auto mark confirmed appointments as no-show if appointment day has passed.
    const staleConfirmedRequests = await ProactiveDonation.find({
      status: "confirmed",
      appointmentDate: { $lt: now },
    });

    let autoNoShowCount = 0;
    for (const request of staleConfirmedRequests) {
      const appointment = new Date(request.appointmentDate);
      const graceDeadline = new Date(appointment.getTime() + 24 * 60 * 60 * 1000);
      if (now <= graceDeadline) {
        continue;
      }

      const donor = await Donor.findById(request.donorId);
      if (!donor) {
        continue;
      }

      request.status = "no-show";
      await request.save();

      donor.trustScore = Math.max(0, (donor.trustScore || 100) - 15);
      donor.eligibleToDonate = true;
      const lockDays = donor.trustScore < 40 ? 30 : 7;
      donor.penaltyUntil = new Date(now.getTime() + lockDays * 24 * 60 * 60 * 1000);
      await donor.save();

      await sendNotification(
        donor._id,
        "Donor",
        "Missed Appointment ⚠️",
        `You missed your confirmed donation appointment. Trust score reduced and account restricted until ${donor.penaltyUntil.toDateString()}.`,
        "/donor/donation-history"
      );

      autoNoShowCount += 1;
    }

    if (autoNoShowCount > 0) {
      console.log(`🛡️ Janitor: Auto-marked ${autoNoShowCount} confirmed requests as no-show.`);
    }
  } catch (error) {
    console.error("❌ System Updater Error:", error.message);
  }
};

module.exports = runSystemUpdaters;