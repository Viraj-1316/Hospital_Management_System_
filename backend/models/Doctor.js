const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  clinic: String, // Legacy string field
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" }, // New Multi-Tenant ID
  phone: String,
  dob: String,
  specialization: String,
  experience: String,
  gender: String,
  status: String,
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved"  // Admins create doctors as approved, self-signup = pending
  },
  address: String,
  city: String,
  country: String,
  postalCode: String,
  avatar: String, // Profile photo
  addressLine1: String,
  addressLine2: String,
  qualification: String,
  experienceYears: String,
  
  // Clinic location details (for appointment PDF)
  cabin: String,   // e.g., "Cabin-C2"
  floor: String,   // e.g., "2nd Floor"
  qualifications: [
    {
      degree: String,
      university: String,
      year: String,
    },
  ],
  
  // Google OAuth Integration
  googleConnected: { type: Boolean, default: false },
  googleTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    email: String
  },
  
  // Zoom OAuth Integration
  zoomConnected: { type: Boolean, default: false },
  zoomTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    accountId: String
  },
  
  createdAt: { type: Date, default: Date.now },

  password: { type: String },
  mustChangePassword: { type: Boolean, default: true },
});

// Database Indexes for improved query performance
DoctorSchema.index({ email: 1 });
DoctorSchema.index({ clinicId: 1 });
DoctorSchema.index({ status: 1 });

const DoctorModel = mongoose.model("Doctor", DoctorSchema);
module.exports = DoctorModel;
