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
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentSlot",
      required: [true, "Slot ID is required"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled", "no-show"],
      default: "booked",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProactiveDonation", proactiveDonationSchema);