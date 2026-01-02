// models/Clinic.js
const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },

    specialties: { type: [String], default: [] },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    clinicLogo: { type: String }, // stored as filename

    address: {
      full: { type: String },
      city: { type: String },
      country: { type: String },
      postalCode: { type: String },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clinic", clinicSchema);
