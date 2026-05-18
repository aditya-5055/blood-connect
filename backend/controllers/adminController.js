const Facility = require("../models/facilityModel");
const Donor = require("../models/donorModel");
const BloodRequest = require("../models/bloodRequestModel");
const Admin = require("../models/adminModel"); // Added Admin model
const mailSender = require("../utils/mailSender");
const sendNotification = require("../utils/sendNotification"); // ✅ Notification Utility
const facilityApprovedTemplate = require("../mail/templates/facilityApprovedTemplate");
const facilityRejectedTemplate = require("../mail/templates/facilityRejectedTemplate");

// ─────────────────────────────────
// @route  GET /api/admin/pending-facilities
// @access Admin only
// ─────────────────────────────────
exports.getPendingFacilities = async (req, res) => {
  try {
    const pendingFacilities = await Facility.find({
      status: "pending",
    }).select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Pending facilities fetched successfully",
      count: pendingFacilities.length,
      facilities: pendingFacilities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending facilities",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/admin/approve-facility/:id
// @access Admin only
// ─────────────────────────────────
exports.approveFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    if (facility.status === "approved") {
      return res.status(400).json({ success: false, message: "Facility is already approved" });
    }

    facility.status = "approved";
    facility.approvedBy = req.user.id;
    facility.approvedAt = new Date();
    await facility.save();

    // 📧 1. Email Notification
    try {
      await mailSender(
        facility.email,
        "Your account has been approved - BloodConnect",
        facilityApprovedTemplate(facility.name, facility.facilityType)
      );
    } catch (emailError) {
      console.error("Approval email failed:", emailError.message);
    }

    // 🔔 2. In-App Notification to the Facility (Hospital/Bank)
    const approvedLink = facility.facilityType === "hospital"
      ? "/hospital/dashboard"
      : "/bloodbank/dashboard";

    await sendNotification(
      facility._id,
      "Facility",
      "Account Verified! 🎊",
      `Welcome to BloodConnect! Your ${facility.facilityType} account is now approved. You can start saving lives now.`,
      approvedLink
    );

    return res.status(200).json({
      success: true,
      message: "Facility approved successfully",
      facility,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve facility",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/admin/reject-facility/:id
// @access Admin only
// ─────────────────────────────────
exports.rejectFacility = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    facility.status = "rejected";
    facility.rejectionReason = rejectionReason;
    await facility.save();

    // 📧 1. Email Notification
    try {
      await mailSender(
        facility.email,
        "Registration Update - BloodConnect",
        facilityRejectedTemplate(facility.name, facility.facilityType, rejectionReason)
      );
    } catch (emailError) {
      console.error("Rejection email failed:", emailError.message);
    }

    // 🔔 2. In-App Notification (Even if rejected, they see why when they log in)
    await sendNotification(
      facility._id,
      "Facility",
      "Application Status ℹ️",
      `Your registration was rejected. Reason: ${rejectionReason}. Please contact support for details.`,
      "/login"
    );

    return res.status(200).json({
      success: true,
      message: "Facility rejected successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject facility",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/admin/donors
// @access Admin only
// ─────────────────────────────────
exports.getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Donors fetched successfully",
      count: donors.length,
      donors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donors",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/admin/facilities
// @access Admin only
// ─────────────────────────────────
exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({
      status: "approved",
    }).select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Approved facilities fetched successfully",
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch facilities",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/admin/requests
// @access Admin only
// ─────────────────────────────────
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate("hospitalId", "name email phone address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All blood requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message,
    });
  }
};