// models/ClinicRegistration.js
const mongoose = require("mongoose");

const clinicRegistrationSchema = new mongoose.Schema(
  {
    // Sequential Application ID: OC-YYYYMMDD-0001, OC-YYYYMMDD-0002, etc.
    applicationId: { 
      type: String, 
      unique: true, 
      required: true 
    },
    
    // Clinic Owner/Contact Details
    ownerName: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    clinicName: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    phone: { 
      type: String, 
      required: true,
      trim: true 
    },
    
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
    },
    
    // Clinic Type with "Other" support
    clinicType: { 
      type: String, 
      required: true 
    },
    
    // If clinicType is "Other", this field stores the custom type
    clinicTypeOther: { 
      type: String,
      trim: true 
    },
    
    // Medical Registration / License Number
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    },
    
    // City / Location
    city: {
      type: String,
      required: true,
      trim: true
    },
    
    // Optional message to admin (Why OneCare?)
    messageToAdmin: {
      type: String,
      trim: true,
      maxlength: 500
    },
    
    // Registration Status for admin review
    status: { 
      type: String, 
      enum: ["Pending", "Approved", "Rejected"], 
      default: "Pending" 
    },
    
    // Admin review fields (for Phase 2)
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    rejectionReason: { type: String },
    
    // If approved, link to the created clinic
    approvedClinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    
    // Track onboarding completion
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster lookups
clinicRegistrationSchema.index({ status: 1 });

module.exports = mongoose.model("ClinicRegistration", clinicRegistrationSchema);
