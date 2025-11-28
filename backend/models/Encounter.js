const mongoose = require("mongoose");

const EncounterSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  clinic: {
    type: String,
    required: true,
  },
  doctor: {
    type: String, 
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "doctors",
  },
  patient: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "patients",
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    default: "active", // active or inactive
  },
  problems: [{
    type: String
  }],
  observations: [{
    type: String
  }],
  notes: [{
    type: String
  }],
  prescriptions: [{
    name: String,
    frequency: String,
    duration: String,
    instruction: String
  }],
  medicalReports: [{
    name: String,
    date: Date,
    file: String,
    originalName: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("encounters", EncounterSchema);
