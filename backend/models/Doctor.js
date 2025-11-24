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
  
  qualifications: [
    {
      degree: String,
      university: String,
      year: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const DoctorModel = mongoose.model("doctors", DoctorSchema);
module.exports = DoctorModel;
