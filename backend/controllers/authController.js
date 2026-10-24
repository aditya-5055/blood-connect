const jwt = require("jsonwebtoken");
const Donor = require("../models/donorModel");
const Facility = require("../models/facilityModel");
require("dotenv").config();
const Admin = require("../models/adminModel");
const mailSender = require("../utils/mailSender");
const newFacilityTemplate = require("../mail/templates/newFacilityTemplate");
const donorWelcomeTemplate = require("../mail/templates/donorWelcomeTemplate");
const facilityUnderReviewTemplate = require("../mail/templates/facilityUnderReviewTemplate");
const OTP = require("../models/otpModel");
const otpGenerator = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const passwordResetTemplate = require("../mail/templates/passwordResetTemplate");

// ✅ NEW: Import the notification utility
const sendNotification = require("../utils/sendNotification");

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// ─────────────────────────────────
// @route  POST /api/auth/donor/google
// @access Public
// ─────────────────────────────────
exports.googleDonorLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    // 1️⃣ Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();

    // 2️⃣ Check if donor exists
    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "No account found. Please register first.",
      });
    }

    // 3️⃣ Check isActive
    if (!donor.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 4️⃣ Generate token
    const token = generateToken(donor._id, "donor");

    // 5️⃣ Update last login
    donor.lastLogin = new Date();
    await donor.save();

    // 6️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Google login failed. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/facility/google
// @access Public
// ─────────────────────────────────
exports.googleFacilityLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    // 1️⃣ Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email } = ticket.getPayload();

    // 2️⃣ Check if facility exists
    const facility = await Facility.findOne({ email });
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "No account found. Please register first.",
      });
    }

    // 3️⃣ Check approval status
    if (facility.status === "pending") {
      return res.status(401).json({
        success: false,
        message: "Your account is pending admin approval.",
      });
    }

    if (facility.status === "rejected") {
      return res.status(401).json({
        success: false,
        message: "Your account has been rejected. Please contact admin.",
      });
    }

    // 4️⃣ Check isActive
    if (!facility.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 5️⃣ Generate token
    const token = generateToken(facility._id, facility.role);

    // 6️⃣ Update last login
    facility.lastLogin = new Date();
    await facility.save();

    // 7️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      facility: {
        id: facility._id,
        name: facility.name,
        email: facility.email,
        facilityType: facility.facilityType,
        role: facility.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Google login failed. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/admin/login
// @access Public
// ─────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find admin
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "User not registered",
      });
    }

    // 3️⃣ Check isActive
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 4️⃣ Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // 5️⃣ Generate token
    const token = generateToken(admin._id, "admin");

    // 6️⃣ Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // 7️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/donor/register
// @access Public
// ─────────────────────────────────
exports.donorRegister = async (req, res) => {
  try {
    const {
      fullName, email, password, phone,
      bloodGroup, age, gender, weight, address, otp, location, 
    } = req.body;

    // 1️⃣ Validate input
    if (!fullName || !email || !password || !phone ||
        !bloodGroup || !age || !gender || !address || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required including OTP",
      });
    }

    // 2️⃣ Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // 3️⃣ Get latest OTP
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otp !== otpRecord.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new OTP.",
      });
    }

    // ✅ BULLETPROOF LOCATION FIX: Ensure location is strictly GeoJSON
    let validLocation = { type: "Point", coordinates: [0, 0] };
    if (location && location.coordinates && Array.isArray(location.coordinates)) {
      validLocation = location;
    }

    // 4️⃣ Create donor (With robust fallbacks so MongoDB doesn't crash)
    const donor = await Donor.create({
      fullName, 
      email, 
      password, 
      phone,
      bloodGroup, 
      age: Number(age),               // Force to Number
      gender, 
      weight: Number(weight) || 50,   // Force to Number with safe fallback
      address,
      location: validLocation,        // Use the safe GeoJSON location
      trustScore: 100, 
      eligibleToDonate: true, 
      isAvailable: true 
    });

    // 5️⃣ Delete OTP after successful registration
    await OTP.deleteMany({ email });

    // 6️⃣ Generate token
    const token = generateToken(donor._id, "donor");

    // 7️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const responsePayload = {
      success: true,
      message: "Donor registered successfully",
      token,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
      },
    };

    // Respond first for faster UX, then send welcome email in background.
    res.status(201).json(responsePayload);

    setImmediate(async () => {
      try {
        await mailSender(
          donor.email,
          "Welcome to Blood Donation System",
          donorWelcomeTemplate(donor.fullName)
        );
      } catch (emailError) {
        console.error("Donor welcome email failed:", emailError.message);
      }
    });

    return;

  } catch (error) { 

    return res.status(500).json({
      success: false,
      message: error.message, // Send the real error to the frontend network tab
    });
  }
  
};
// ─────────────────────────────────
// @route  POST /api/auth/donor/login
// @access Public
// ─────────────────────────────────
exports.donorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find donor
    const donor = await Donor.findOne({ email }).select("+password");
    if (!donor) {
      return res.status(401).json({
        success: false,
        message: "User not registered. Please signup.",
      });
    }

    // 3️⃣ Check isActive
    if (!donor.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 4️⃣ Check password
    const isPasswordValid = await donor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // 5️⃣ Generate token
    const token = generateToken(donor._id, "donor");

    // 6️⃣ Update last login
    donor.lastLogin = new Date();
    await donor.save();

    // 7️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message,
    });
  }
};

// @route  POST /api/auth/facility/register
// @access Public
// ─────────────────────────────────
exports.facilityRegister = async (req, res) => {
  try {
    const {
      name, email, password, phone, emergencyContact,
      address, registrationNumber, facilityType,
      facilityCategory, otp, location,
    } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password || !phone ||
        !emergencyContact || !address || !registrationNumber ||
        !facilityType || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required including OTP",
      });
    }

    // 2️⃣ Check if facility already exists
    const existingFacility = await Facility.findOne({
      $or: [{ email }, { registrationNumber }],
    });
    if (existingFacility) {
      return res.status(409).json({
        success: false,
        message: "Email or registration number already exists",
      });
    }

    // 3️⃣ Get latest OTP
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otp !== otpRecord.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new OTP.",
      });
    }

    // 4️⃣ Create facility
    const facility = await Facility.create({
      name, email, password, phone, emergencyContact,
      address, registrationNumber, facilityType, facilityCategory,
      location: location || { type: "Point", coordinates: [0, 0] },
    });

    // 5️⃣ Delete OTP after successful registration
    await OTP.deleteMany({ email });

    const responsePayload = {
      success: true,
      message: "Registration submitted successfully. Please wait for admin approval.",
      facility: {
        id: facility._id,
        name: facility.name,
        email: facility.email,
        facilityType: facility.facilityType,
        status: facility.status,
      },
    };

    // Respond first for better UX, then run non-critical notifications in background.
    res.status(201).json(responsePayload);

    setImmediate(async () => {
      try {
        await mailSender(
          facility.email,
          "Registration Under Review - Blood Donation System",
          facilityUnderReviewTemplate(facility.name, facility.facilityType)
        );
      } catch (emailError) {
        console.error("Facility under-review email failed:", emailError.message);
      }

      try {
        const admins = await Admin.find({ isActive: true });
        await Promise.allSettled(
          admins.map(async (admin) => {
            await mailSender(
              admin.email,
              "New Facility Registration - Action Required",
              newFacilityTemplate(
                facility.name,
                facility.facilityType,
                facility.email,
                facility.registrationNumber
              )
            );

            await sendNotification(
              admin._id,
              "Admin",
              "New Facility Alert 🏥",
              `${facility.name} registered as a ${facility.facilityType} and is awaiting approval.`,
              "/admin/pending-facilities"
            );
          })
        );
      } catch (notificationError) {
        console.error("Admin notification failed:", notificationError.message);
      }
    });

    return;

  } catch (error) {
console.log("FACILITY REGISTER ERROR:", error);

return res.status(500).json({
  success: false,
  message: error.message,
  error,
});
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/facility/login
// @access Public
// ─────────────────────────────────
exports.facilityLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find facility
    const facility = await Facility.findOne({ email }).select("+password");
    if (!facility) {
      return res.status(401).json({
        success: false,
        message: "User not registered. Please signup.",
      });
    }

    // 3️⃣ Check approval status
    if (facility.status === "pending") {
      return res.status(401).json({
        success: false,
        message: "Your account is pending admin approval.",
      });
    }

    if (facility.status === "rejected") {
      return res.status(401).json({
        success: false,
        message: "Your account has been rejected. Please contact admin.",
      });
    }

    // 4️⃣ Check isActive
    if (!facility.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // 5️⃣ Check password
    const isPasswordValid = await facility.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // 6️⃣ Generate token
    const token = generateToken(facility._id, facility.role);

    // 7️⃣ Update last login
    facility.lastLogin = new Date();
    await facility.save();

    // 8️⃣ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      facility: {
        id: facility._id,
        name: facility.name,
        email: facility.email,
        facilityType: facility.facilityType,
        role: facility.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/donor/send-otp
// @access Public
// ─────────────────────────────────
exports.sendDonorOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // 2️⃣ Generate unique OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // 3️⃣ Make sure OTP is unique
    let result = await OTP.findOne({ otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    }

    // 4️⃣ Save OTP — email auto sent by pre-save hook
    await OTP.create({ email, otp });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/facility/send-otp
// @access Public
// ─────────────────────────────────
exports.sendFacilityOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check if facility already exists
    const existingFacility = await Facility.findOne({ email });
    if (existingFacility) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // 2️⃣ Generate unique OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // 3️⃣ Make sure OTP is unique
    let result = await OTP.findOne({ otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    }

    // 4️⃣ Save OTP — email auto sent by pre-save hook
    await OTP.create({ email, otp });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────
// ✅ FORGOT PASSWORD
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────
// @route  POST /api/auth/reset-password-token
// @desc   Step 1 — User enters email, we send reset link to their email
// @body   { email, userType }   ← userType is "donor" or "facility"
// @access Public
// ─────────────────────────────────
exports.resetPasswordToken = async (req, res) => {
  try {
    const { email, userType } = req.body;

    // 1️⃣ Validate input
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email and userType are required",
      });
    }

    // 2️⃣ Validate userType
    if (!["donor", "facility"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "userType must be donor or facility",
      });
    }

    // 3️⃣ Find the user based on userType
    let user;
    if (userType === "donor") {
      user = await Donor.findOne({ email });
    } else {
      user = await Facility.findOne({ email });
    }

    // 4️⃣ Check user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `This email: ${email} is not registered with us. Please enter a valid email.`,
      });
    }

    // 5️⃣ Generate a random reset token
    const token = crypto.randomBytes(20).toString("hex");

    // 6️⃣ Save token + expiry on the user document
    user.token = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
    await user.save();

    // 7️⃣ Build the reset URL
    const resetUrl = `http://localhost:5173/update-password/${token}?userType=${userType}`;

    // 8️⃣ Send the reset link email
    await mailSender(
      email,
      "Password Reset - Blood Donation System",
      passwordResetTemplate(resetUrl)
    );

    return res.status(200).json({
      success: true,
      message: "Email sent successfully. Please check your email to continue.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending the reset email. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/auth/reset-password
// @desc   Step 2 — User submits new password using the token from the link
// @body   { password, confirmPassword, token, userType }
// @access Public
// ─────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token, userType } = req.body;

    // 1️⃣ Validate input
    if (!password || !confirmPassword || !token || !userType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2️⃣ Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // 3️⃣ Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 4️⃣ Find user by token
    let user;
    if (userType === "donor") {
      user = await Donor.findOne({ token: token }).select("+password");
    } else {
      user = await Facility.findOne({ token: token }).select("+password");
    }

    // 5️⃣ Check token is valid (user exists)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid. Please request a new password reset link.",
      });
    }

    // 6️⃣ Check token has not expired
    if (!(user.resetPasswordExpires > Date.now())) {
      return res.status(403).json({
        success: false,
        message: "Token has expired. Please request a new password reset link.",
      });
    }

    // 7️⃣ Update the password
    user.password = password;

    // 8️⃣ Clear the token fields so the link cannot be reused
    user.token = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting the password. Please try again.",
      error: error.message,
    });
  }
};