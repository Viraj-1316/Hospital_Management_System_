// models/Clinic.js
const mongoose = require("mongoose");

const operatingHoursSchema = new mongoose.Schema({
  day: { type: String },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String },
  closeTime: { type: String }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number },
  duration: { type: Number, default: 30 }
}, { _id: true });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  photo: { type: String },
  specialty: { type: String, trim: true },
  qualifications: { type: String, trim: true },
  experience: { type: Number },
  bio: { type: String, trim: true }
}, { _id: true });

const clinicSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, unique: true, required: true },
    subdomain: { type: String, unique: true, sparse: true }, // For clinic website URL
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },

    specialties: { type: [String], default: [] },
    
    // Services offered
    services: [serviceSchema],
    
    // Doctors/Staff
    doctors: [doctorSchema],

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    clinicLogo: { type: String }, // stored as filename

    address: {
      full: { type: String },
      city: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },

    // Tax Registration Number (GSTIN for India)
    gstin: { type: String, default: "" },

    // Bill number prefix (e.g., "OC-" for OneCare)
    billPrefix: { type: String, default: "INV-" },

    // Configurable Terms & Conditions for invoices
    termsAndConditions: { 
      type: [String], 
      default: [
        "This is a computer-generated invoice and does not require a physical signature.",
        "Please preserve this receipt for future medical history and follow-up consultations.",
        "Amount once paid is non-refundable as per hospital policy."
      ]
    },

    admin: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      contact: { type: String },
      dob: { type: String },
      gender: { type: String },
      photo: { type: String }, // admin photo filename
    },

    // Additional fields from onboarding
    about: { type: String }, // Clinic description
    operatingHours: [operatingHoursSchema],
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
      youtube: { type: String }
    },
    languagesSpoken: [{ type: String }],
    acceptedPayments: [{ type: String }],
    appointmentSettings: {
      defaultSlotDuration: { type: Number, default: 30 },
      bufferTime: { type: Number, default: 5 },
      advanceBookingDays: { type: Number, default: 30 },
      allowOnlineBooking: { type: Boolean, default: true }
    },
    // Onboarding reference
    onboardingId: { type: mongoose.Schema.Types.ObjectId, ref: "ClinicOnboarding" }
  },
  { timestamps: true }
);

// Index for subdomain lookups
// Index for subdomain lookups (Removed duplicate)

module.exports = mongoose.model("Clinic", clinicSchema);

