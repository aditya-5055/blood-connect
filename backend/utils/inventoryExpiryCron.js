const cron = require("node-cron");
const { runInventoryExpiryUpdater } = require("./inventoryExpiryUpdater");

/**
 * Registers the cron job that automatically handles blood inventory expiration.
 */
const startInventoryExpiryCron = () => {
  // Production: Run hourly ("0 * * * *")
  // Development: Run every minute ("* * * * *")
  const schedule =
    process.env.NODE_ENV === "production" ? "0 * * * *" : "* * * * *";

  cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🕒 Executing Inventory Expiry Cron Job...`);
    try {
      await runInventoryExpiryUpdater();
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error executing Inventory Expiry Cron:`, error.message);
    }
  });

  console.log(
    `🕒 Inventory Expiry Cron started with schedule: ${schedule} (${process.env.NODE_ENV || "development"})`
  );
};

module.exports = {
  startInventoryExpiryCron,
};
