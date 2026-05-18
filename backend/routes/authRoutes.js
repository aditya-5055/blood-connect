// const express = require("express");
// const router = express.Router();
// const {
//   adminLogin,
//   donorRegister,
//   donorLogin,
//   facilityRegister,
//   facilityLogin,
//     sendDonorOTP, 
//   sendFacilityOTP,   
//     googleDonorLogin,
//   googleFacilityLogin,
// } = require("../controllers/authController");

// // Admin routes
// router.post("/admin/login", adminLogin);

// // Donor routes
// router.post("/donor/register", donorRegister);
// router.post("/donor/login", donorLogin);

// // Facility routes
// router.post("/facility/register", facilityRegister);
// router.post("/facility/login", facilityLogin);

// // OTP routes ✅ Make sure these exist
// router.post("/donor/send-otp", sendDonorOTP);
// router.post("/facility/send-otp", sendFacilityOTP);

// // Google OAuth routes
// router.post("/donor/google", googleDonorLogin);
// router.post("/facility/google", googleFacilityLogin);

// module.exports = router;




 const express = require("express");
const router = express.Router();
const {
  adminLogin,
  donorRegister,
  donorLogin,
  facilityRegister,
  facilityLogin,
  sendDonorOTP,
  sendFacilityOTP,
  googleDonorLogin,
  googleFacilityLogin,
  // ✅ NEW — Forgot Password
  resetPasswordToken,
  resetPassword,
} = require("../controllers/authController");

// Admin routes
router.post("/admin/login", adminLogin);

// Donor routes
router.post("/donor/register", donorRegister);
router.post("/donor/login", donorLogin);

// Facility routes
router.post("/facility/register", facilityRegister);
router.post("/facility/login", facilityLogin);

// OTP routes (for registration)
router.post("/donor/send-otp", sendDonorOTP);
router.post("/facility/send-otp", sendFacilityOTP);

// Google OAuth routes
router.post("/donor/google", googleDonorLogin);
router.post("/facility/google", googleFacilityLogin);

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD ROUTES
// Step 1 → Send reset link to email
// Step 2 → Use token from link to set new password
// ─────────────────────────────────────────────────────────

// POST /api/auth/reset-password-token
// Body: { email, userType }   ← userType = "donor" or "facility"
router.post("/reset-password-token", resetPasswordToken);

// POST /api/auth/reset-password
// Body: { password, confirmPassword, token, userType }
router.post("/reset-password", resetPassword);

module.exports = router;