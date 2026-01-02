const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  avatar: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  profileCompleted: { type: Boolean, default: false },

  phone: { type: String },
  gender: { type: String },
  dob: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  postalCode: { type: String },

  qualification: { type: String },
  specialization: { type: String },
  experienceYears: { type: String },

  bloodGroup: { type: String },

  // Password Reset Fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Added for Patient/Doctor Unification
  country: { type: String },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },

  // Google Auth Fields
  googleId: { type: String },
});

// Database Indexes
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordToken: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
