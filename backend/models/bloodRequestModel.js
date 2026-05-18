const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    // The Facility (Hospital or Bank) receiving the blood or hosting the donation
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility ID is required"],
    },
    // The Donor involved in the appointment (null if it's a general hospital request)
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      default: null,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    units: {
      type: Number,
      required: [true, "Units required"],
      min: [1, "Minimum 1 unit required"],
    },
    notes: {
      type: String,
      trim: true,
    },
    urgencyLevel: {
      type: String,
      enum: ["Critical", "High", "Moderate", "Normal"],
      required: [true, "Urgency level is required"],
    },
    
    // --- 🆕 APPOINTMENT LOGIC FIELDS ---
    appointmentDate: {
      type: Date, // Set by Bank
    },
    appointmentTime: {
      type: String, // Set by Bank (e.g., "10:30 AM")
    },
    donorResponse: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },

    deadline: {
      type: Date,
    },
    bankStageDeadline: {
      type: Date,
    },
    
    // --- 🛠 UPDATED STATUS ENUM ---
    status: {
      type: String,
      enum: [
        "active",      // Initial state
        "accepted",    // Bank gave a date/time
        "confirmed",   // Donor accepted the date/time
        "completed",   // Donation successful
        "no_show",     // Donor didn't show up (for Trust Score)
        "expired",     // Auto-expired if no action taken
        "rejected",    // Bank declined the request
        "cancelled"    // Manual cancellation
      ],
      default: "active",
    },

    stage: {
      type: String,
      enum: ["bloodbank", "donor", "both"],
      default: "bloodbank",
    },
    expiryReason: {
      type: String,
      trim: true,
    },
    stageUpdatedAt: {
      type: Date,
    },
    respondedBy: {
      responderType: {
        type: String,
        enum: ["bloodbank", "donor"],
      },
      responderId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    declinedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donor",
      },
    ],
    declinedByBloodBanks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
    completedAt: {
      type: Date,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

 // ✅ Corrected: Removed 'next' and 'next()' call
bloodRequestSchema.pre("save", async function () {
  if (this.isNew) {
    const now = new Date();
    // Default timeouts for Bank response if not set
    const deadlines = {
      Critical: { bank: 30, total: 120 },
      High: { bank: 60, total: 360 },
      Moderate: { bank: 120, total: 720 },
      Normal: { bank: 240, total: 1440 },
    };

    const selected = deadlines[this.urgencyLevel] || deadlines.Normal;
    
    this.bankStageDeadline = new Date(now.getTime() + selected.bank * 60 * 1000);
    this.deadline = new Date(now.getTime() + selected.total * 60 * 1000);
  }
  // No next() needed for async functions!
});
bloodRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);