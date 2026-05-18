const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Who is receiving this notification?
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel", // Dynamic reference (can be Donor, Facility, or Admin)
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ["Donor", "Facility", "Admin"], 
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Has the user seen it?
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional: Used to redirect the user when they click the notification
    link: {
      type: String,
      default: "",
    },
    // Optional: Link notification to a blood request for cleanup/sync scenarios.
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, relatedRequest: 1 });

module.exports = mongoose.model("Notification", notificationSchema);