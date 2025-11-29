const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({

  // Link to User collection (the account used to login)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // will be filled for signup patients
  },

  firstName: String,
  lastName: String,
  clinic: String,
  email: String,
  phone: String,
  dob: String,
  bloodGroup: String,
  gender: String,
  address: String,
  city: String,
  country: String,
  postalCode: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;
