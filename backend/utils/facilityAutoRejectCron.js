const cron = require("node-cron");
const Facility = require("../models/facilityModel");
const mailSender = require("./mailSender");
const facilityAutoRejectedTemplate = require("../mail/templates/facilityAutoRejectedTemplate");

const AUTO_REJECTION_REASON =
  "Your registration has been rejected because you did not visit our office within 7 days. You can register again and complete verification.";

const autoRejectPendingFacilities = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pendingFacilities = await Facility.find({
      status: "pending",
      createdAt: { $lt: sevenDaysAgo },
      $or: [
        { role: { $in: ["hospital", "blood-bank"] } },
        { facilityType: { $in: ["hospital", "blood-bank"] } },
      ],
    });

    if (pendingFacilities.length === 0) {
      return;
    }

    let processedCount = 0;

    for (const facility of pendingFacilities) {
      facility.status = "rejected";
      facility.rejectionReason = AUTO_REJECTION_REASON;
      await facility.save();

      try {
        await mailSender(
          facility.email,
          "Registration Rejected - Blood Donation System",
          facilityAutoRejectedTemplate(facility.name, facility.facilityType)
        );
      } catch (mailError) {
        console.error(
          `Auto-rejection email failed for ${facility.email}:`,
          mailError.message
        );
      }

      processedCount += 1;
    }

    console.log(
      `🕒 Auto-Reject Cron: Rejected ${processedCount} pending facilities older than 7 days.`
    );
  } catch (error) {
    console.error("❌ Auto-Reject Cron Error:", error.message);
  }
};

const startFacilityAutoRejectCron = () => {
  const schedule =
    process.env.NODE_ENV === "production" ? "0 0 * * *" : "* * * * *";

  cron.schedule(schedule, autoRejectPendingFacilities);

  console.log(
    `🕒 Auto-Reject Cron started with schedule: ${schedule} (${process.env.NODE_ENV || "development"})`
  );
};

module.exports = {
  startFacilityAutoRejectCron,
  autoRejectPendingFacilities,
};