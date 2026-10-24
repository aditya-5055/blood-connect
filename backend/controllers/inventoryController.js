// no use case in muy project


const InventoryLog = require("../models/inventoryLogModel");
const Facility = require("../models/facilityModel");

exports.updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, reason } = req.body;
    const bankId = req.user.id;

    // 1. Find the bank's inventory and update the count
    const bank = await Facility.findById(bankId);
    if (!bank) return res.status(404).json({ success: false, message: "Bank not found" });

    // Update the actual count in your main inventory object
    bank.inventory[bloodGroup] += parseInt(units);
    await bank.save();

    // 2. ✅ PLACE THE LOGGING CODE HERE
    // This creates the "paper trail" for your report
    await InventoryLog.create({
      bankId: bankId,
      bloodGroup: bloodGroup,
      action: units > 0 ? "add" : "remove",
      quantity: Math.abs(units),
      reason: reason || "Manual Adjustment",
      date: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Inventory updated and transaction logged.`,
      newCount: bank.inventory[bloodGroup]
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};