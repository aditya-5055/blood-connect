const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Admin = require("../models/adminModel");
const Donor = require("../models/donorModel");
const Facility = require("../models/facilityModel");

dotenv.config();

// ─────────────────────────────────────────────────────────
// General Authentication Middleware
// ─────────────────────────────────────────────────────────
exports.auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token =
      req.cookies?.token ||
      req.body?.token ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Missing",
      });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      // ✅ This is key: ensures id and role are available in all following controllers
      req.user = decode; 
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong while validating token",
    });
  }
};

// ─────────────────────────────────────────────────────────
// Role-Based Authorization Middlewares
// ─────────────────────────────────────────────────────────

exports.isAdmin = async (req, res, next) => {
  try {
    const userDetails = await Admin.findById(req.user.id);
    if (!userDetails || req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role can't be verified" });
  }
};

exports.isDonor = async (req, res, next) => {
  try {
    // Ensure we are checking the donor model
    const userDetails = await Donor.findById(req.user.id);
    if (!userDetails || req.user.role !== "donor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Donors only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role can't be verified" });
  }
};

exports.isHospital = async (req, res, next) => {
  try {
    const userDetails = await Facility.findById(req.user.id);
    
    // ✅ Check case-insensitive role to be safe
    if (!userDetails || req.user.role.toLowerCase() !== "hospital") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Hospitals only",
      });
    }

    if (userDetails.status !== "approved") {
      return res.status(403).json({ success: false, message: "Your account is not approved yet" });
    }

    // ✅ Crucial: Ensure next is a function before calling
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    console.error("Middleware Error:", error);
    return res.status(500).json({ success: false, message: "User role can't be verified" });
  }
};

exports.isBloodBank = async (req, res, next) => {
  try {
    const userDetails = await Facility.findById(req.user.id);
    if (!userDetails || req.user.role !== "blood-bank") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Blood Banks only",
      });
    }
    if (userDetails.status !== "approved") {
      return res.status(403).json({ success: false, message: "Your account is not approved yet" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role can't be verified" });
  }
};