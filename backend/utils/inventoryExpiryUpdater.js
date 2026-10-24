const BloodStock = require("../models/bloodStockModel");

/**
 * Sweeps the BloodStock collection to mark expired available blood stock items.
 */
const runInventoryExpiryUpdater = async () => {
  try {
    const now = new Date();
    const result = await BloodStock.updateMany(
      {
        status: "available",
        expiryDate: { $lt: now },
      },
      {
        status: "expired",
      }
    );

    console.log(
      `🕒 Inventory Expiry Updater: Processed inventory sweep. Marked ${result.modifiedCount || 0} blood stock records as expired.`
    );
  } catch (error) {
    console.error("❌ Inventory Expiry Updater Error:", error.message);
  }
};

module.exports = {
  runInventoryExpiryUpdater,
};
