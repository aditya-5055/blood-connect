const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
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
    // ✅ NEW: Support for the Navbar Avatar
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"], // Strictly restrict to admin
    },
    // ✅ NEW: Tracks when password was last changed for security (JWT invalidation)
    passwordChangedAt: Date,
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function () {
  // If password is not modified, just return (Mongoose handles the rest)
  if (!this.isModified("password")) return;
  
  // Hash the password
  this.password = await bcrypt.hash(this.password.trim(), 12);
  
  // Update passwordChangedAt if the password was modified (not on creation)
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token works
  }
});

// Compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  // candidatePassword comes from req.body, this.password comes from DB
  return await bcrypt.compare(candidatePassword.trim(), this.password);
};

module.exports = mongoose.model("Admin", adminSchema);