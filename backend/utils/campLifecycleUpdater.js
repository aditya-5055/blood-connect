const Camp = require("../models/campModel");

const runCampLifecycleUpdater = async () => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const currentHours = now.getHours().toString().padStart(2, "0");
  const currentMinutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;

  try {
    // 1. Upcoming -> Ongoing
    const upcomingToOngoing = await Camp.updateMany(
      {
        status: "upcoming",
        campDate: {
          $gte: new Date(currentDate),
          $lt: new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000),
        },
        startTime: { $lte: currentTime },
        endTime: { $gt: currentTime },
      },
      { status: "ongoing" }
    );

    // 2. Ongoing -> Completed
    const expiredOngoingCamps = await Camp.find({
      status: "ongoing",
      $or: [
        { campDate: { $lt: new Date(currentDate) } },
        {
          campDate: {
            $gte: new Date(currentDate),
            $lt: new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000),
          },
          endTime: { $lte: currentTime },
        },
      ],
    });

    for (const camp of expiredOngoingCamps) {
      camp.status = "completed";
      camp.registeredDonors.forEach((donor) => {
        if (donor.donationStatus === "registered") {
          donor.donationStatus = "no-show";
        }
      });
      await camp.save();
    }

    // 3. Missed Upcoming -> Completed
    const missedCamps = await Camp.find({
      status: "upcoming",
      campDate: { $lt: new Date(currentDate) },
    });

    for (const camp of missedCamps) {
      camp.status = "completed";
      camp.registeredDonors.forEach((donor) => {
        if (donor.donationStatus === "registered") {
          donor.donationStatus = "no-show";
        }
      });
      await camp.save();
    }

    if (upcomingToOngoing.modifiedCount > 0 || expiredOngoingCamps.length > 0 || missedCamps.length > 0) {
      console.log(
        `⛺ Camp Lifecycle: Updated ${upcomingToOngoing.modifiedCount} to ongoing, completed ${expiredOngoingCamps.length} ongoing and ${missedCamps.length} missed camps.`
      );
    }
  } catch (error) {
    console.error("❌ Camp Lifecycle Updater Error:", error.message);
  }
};

module.exports = { runCampLifecycleUpdater };
