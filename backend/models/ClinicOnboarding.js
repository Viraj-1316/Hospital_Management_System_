// models/ClinicOnboarding.js
// Stores clinic onboarding data and draft progress
const mongoose = require("mongoose");

const operatingHoursSchema = new mongoose.Schema({
  day: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: "09:00" },
  closeTime: { type: String, default: "18:00" }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number },
  duration: { type: Number, default: 30 } // minutes
}, { _id: true });

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  photo: { type: String }, // URL path
  specialty: { type: String, trim: true },
  qualifications: { type: String, trim: true },
  experience: { type: Number }, // years
  bio: { type: String, trim: true }
}, { _id: true });

const clinicOnboardingSchema = new mongoose.Schema({
  // Link to registration
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClinicRegistration",
    required: true,
    unique: true
  },
  
  // Step 1: Subdomain
  subdomain: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    unique: true
  },
  
  // Step 2: Clinic Details
  clinicDetails: {
    logo: { type: String }, // URL path
    name: { type: String, trim: true },
    about: { type: String, trim: true },
    
    // Address
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, default: "India", trim: true }
    },
    
    // Contact
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    
    // Social Media
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true }
    },
    
    // Operating Hours
    operatingHours: [operatingHoursSchema],
    
    // Additional Fields
    specializations: [{ type: String, trim: true }], // Tags
    languagesSpoken: [{ type: String, trim: true }],
    acceptedPayments: [{ type: String, trim: true }], // Cash, Card, UPI, Insurance
    acceptedInsurance: [{ type: String, trim: true }],
    
    // Gallery
    gallery: [{ type: String }], // Array of image URLs
    
    // Appointment Settings
    appointmentSettings: {
      defaultSlotDuration: { type: Number, default: 30 }, // minutes
      bufferTime: { type: Number, default: 5 }, // minutes
      advanceBookingDays: { type: Number, default: 30 },
      allowOnlineBooking: { type: Boolean, default: true }
    }
  },
  
  // Step 3: Services
  services: [serviceSchema],
  
  // Step 4: Staff
  staff: [staffSchema],
  
  // Status
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  
  // Timestamps
  publishedAt: { type: Date },
  createdClinicId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic"
  }
}, {
  timestamps: true
});

// Indexes
clinicOnboardingSchema.index({ status: 1 });

// Subdomain validation
clinicOnboardingSchema.path("subdomain").validate(function(value) {
  if (!value) return true; // Allow empty during draft
  const regex = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;
  return regex.test(value);
}, "Subdomain must be 3-20 characters, lowercase letters, numbers, and hyphens only");

module.exports = mongoose.model("ClinicOnboarding", clinicOnboardingSchema);
