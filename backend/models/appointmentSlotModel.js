const mongoose = require("mongoose");

const appointmentSlotSchema = new mongoose.Schema(
  {
    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Blood Bank ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start Time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End Time is required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

appointmentSlotSchema.index({ bloodBankId: 1, date: 1 });

module.exports = mongoose.model("AppointmentSlot", appointmentSlotSchema);
