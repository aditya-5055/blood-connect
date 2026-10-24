const cron = require("node-cron");
const runBloodRequestUpdater = require("./bloodRequestUpdater");

const startBloodRequestCron = () => {
  const schedule =
    process.env.NODE_ENV === "production" ? "0 * * * *" : "* * * * *";

  cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🕒 Executing Blood Request Cron Job...`);
    try {
      await runBloodRequestUpdater();
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error executing Blood Request Cron:`, error.message);
    }
  });

  console.log(
    `🕒 Blood Request Cron started with schedule: ${schedule} (${process.env.NODE_ENV || "development"})`
  );
};

module.exports = {
  startBloodRequestCron,
};
