const mongoose = require("mongoose");
const ProactiveDonation = require("../models/proactiveDonationModel");
const Camp = require("../models/campModel");
const BloodRequest = require("../models/bloodRequestModel");
// Assuming you have an InventoryLog model for manual adjustments
const InventoryLog = require("../models/inventoryLogModel"); 

// Helper to calculate date ranges based on type (Day, Month, Year, Custom)
const getRange = (query) => {
  const { type, year, month, startDate, endDate } = query;
  let start, end;
  if (type === "daily") {
    start = new Date(new Date().setHours(0,0,0,0));
    end = new Date(new Date().setHours(23,59,59,999));
  } else if (type === "monthly") {
    start = new Date(year, month, 1);
    end = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);
  } else if (type === "yearly") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else {
    start = new Date(startDate);
    end = new Date(new Date(endDate).setHours(23,59,59));
  }
  return { start, end };
};

// 1. Camp History Report
exports.getCampReport = async (req, res) => {
  try {
    const camps = await Camp.find({ bloodBankId: req.user.id })
      .populate("registeredDonors.donorId", "fullName email phone")
      .sort({ campDate: -1 });
    res.status(200).json({ success: true, reportData: camps });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 2. Proactive Donor Report (Custom Date Logic)
exports.getProactiveReport = async (req, res) => {
  try {
    const { start, end } = getRange(req.query);
    const data = await ProactiveDonation.find({
      bloodBankId: req.user.id,
      status: "completed",
      updatedAt: { $gte: start, $lte: end }
    }).populate("donorId", "fullName bloodGroup phone");
    res.status(200).json({ success: true, reportData: data });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 3. Inventory & Hospital Fulfillment Report
exports.getInventoryTransactionReport = async (req, res) => {
  try {
    const { start, end } = getRange(req.query);
    
    // Get Hospital fulfillments
    const fulfillments = await BloodRequest.find({
      "respondedBy.responderId": req.user.id,
      status: "completed",
      updatedAt: { $gte: start, $lte: end }
    }).populate("hospitalId", "name");

    // Get Manual Adjustments (If you track them)
    // const manualLogs = await InventoryLog.find({ bankId: req.user.id, createdAt: ... });

    res.status(200).json({ success: true, fulfillments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getSingleCampDetailedReport = async (req, res) => {
  try {
    const { campId } = req.params;

    const camp = await Camp.findById(campId)
      .populate("registeredDonors.donorId", "fullName email phone gender age bloodGroup");

    if (!camp) return res.status(404).json({ success: false, message: "Camp not found" });

    // Calculate Blood Group Stats
    const stats = {
      totalRegistered: camp.registeredDonors.length,
      actualDonations: 0,
      inventorySummary: {
        "A+": 0, "A-": 0, "B+": 0, "B-": 0,
        "O+": 0, "O-": 0, "AB+": 0, "AB-": 0
      }
    };

    camp.registeredDonors.forEach(donor => {
      // Logic: Only count if they actually showed up and donated
      if (donor.status === "donated") {
        stats.actualDonations++;
        const bg = donor.donorId.bloodGroup;
        if (stats.inventorySummary[bg] !== undefined) {
          stats.inventorySummary[bg]++;
        }
      }
    });

    res.status(200).json({ success: true, camp, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};