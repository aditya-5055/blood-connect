const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const donorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: { type: String, required: [true, "Phone number is required"] },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Must be at least 18 years old"],
      max: [65, "Age limit is 65 years"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    weight: { type: Number, min: [45, "Minimum weight should be 45kg"] },
    address: {
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      pincode: { type: String, required: [true, "Pincode is required"] },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isAvailable: { type: Boolean, default: true },
    lastDonationDate: { type: Date },

    // ✅ This field will be manually toggled by Admin/System if needed
    eligibleToDonate: { type: Boolean, default: true },

    // ✅ NEW: Accountability & Lock Fields
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    penaltyUntil: {
      type: Date, // Lockout for "No-Shows"
      default: null,
    },
    medicalLockUntil: {
      type: Date, // Lockout for Medical Decline
      default: null,
    },

    donationHistory: [
      {
        donationDate: { type: Date, default: Date.now },
        facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
        donatedTo: { type: String, enum: ["blood-bank", "hospital"] },
        bloodGroup: {
          type: String,
          enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        },
        units: { type: Number, default: 1 },
      },
    ],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    token: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals show up in API responses
    toObject: { virtuals: true },
  },
);

// Hash password
donorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password.trim(), 12);
});

// Compare password
donorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword.trim(), this.password);
};

// ✅ UPDATED VIRTUAL: Check 90-day cooldown AND Penalties
donorSchema.virtual("isCurrentlyEligible").get(function () {
  const now = new Date();

  // 1. Check if the user is manually disabled
  if (!this.eligibleToDonate) return false;

  // 2. Check Penalty Lock (No-Shows)
  if (this.penaltyUntil && this.penaltyUntil > now) return false;

  // 3. Check Medical Lock
  if (this.medicalLockUntil && this.medicalLockUntil > now) return false;

  // 4. Check 90-day Donation Cooldown
  if (this.lastDonationDate) {
    const diff =
      (now - new Date(this.lastDonationDate)) / (1000 * 60 * 60 * 24);
    if (diff < 90) return false;
  }

  // 5. Check Trust Score (If score is too low, say < 40, they are banned)
  if (this.trustScore < 40) return false;

  return true;
});

donorSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Donor", donorSchema);
