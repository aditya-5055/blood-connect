const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema({
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  bloodGroup: { type: String, required: true },
  action: { type: String, enum: ["add", "remove", "consumed"], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, default: "Manual Adjustment" }, // e.g., "Expired", "Hospital Request", "Emergency"
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);