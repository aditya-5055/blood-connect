const mongoose = require("mongoose");

const proactiveDonationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: [true, "Donor ID is required"],
    },
    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Blood bank ID is required"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    // ✅ Status expanded to handle real-world logistics
    status: {
      type: String,
      enum: ["pending", "invited", "confirmed", "completed", "declined", "expired", "no-show","cancelled"],
      default: "pending",
    },
    // ✅ NEW: Fields for Scheduling & Expiry
    appointmentDate: {
      type: Date, // The specific day the bank invites the donor
    },
    slotTime: {
      type: String, // "Morning" or "Afternoon"
      enum: ["Morning", "Afternoon", null],
      default: null
    },
    declineReason: {
      type: String, // "Inventory Full", "Medical", etc.
      default: null
    },
    expiresAt: {
      type: Date,
      // Auto-set to 72 hours from now to allow for auto-cleanup logic
      default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) 
    },
    declinedBanks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProactiveDonation", proactiveDonationSchema);