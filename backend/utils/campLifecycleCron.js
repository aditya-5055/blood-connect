const cron = require("node-cron");
const { runCampLifecycleUpdater } = require("./campLifecycleUpdater");

const startCampLifecycleCron = () => {
  // Production: Run every 5 minutes ("*/5 * * * *")
  // Development: Run every minute ("* * * * *")
  const schedule =
    process.env.NODE_ENV === "production" ? "*/5 * * * *" : "* * * * *";

  cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🕒 Executing Camp Lifecycle Cron Job...`);
    try {
      await runCampLifecycleUpdater();
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error executing Camp Lifecycle Cron:`, error.message);
    }
  });

  console.log(
    `🕒 Camp Lifecycle Cron started with schedule: ${schedule} (${process.env.NODE_ENV || "development"})`
  );
};

module.exports = {
  startCampLifecycleCron,
};
