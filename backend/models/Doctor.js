const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  clinic: String,
  phone: String,
  dob: String,
  specialization: String,
  experience: String,
  gender: String,
  status: String,
  address: String,
  city: String,
  country: String,
  postalCode: String,
  avatar: String, // Profile photo
  addressLine1: String,
  addressLine2: String,
  qualification: String,
  experienceYears: String,
  qualifications: [
    {
      degree: String,
      university: String,
      year: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  password: { type: String },
  passwordPlain: { type: String }, 
  mustChangePassword: { type: Boolean, default: true },
});

const DoctorModel = mongoose.model("Doctor", DoctorSchema);
module.exports = DoctorModel;
