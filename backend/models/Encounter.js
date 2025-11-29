const mongoose = require("mongoose");

const EncounterSchema = new mongoose.Schema({
  encounterId: { type: String }, // Removed 'unique' to prevent crashes if you aren't generating this manually yet
  
  date: {
    type: Date,
    required: true,
  },
  
  clinic: {
    type: String,
    required: true,
  },

  // --- CRITICAL FIXES HERE ---
  // 1. We use the correct capitalized refs ("Patient", "Doctor")
  // 2. We make these the primary way to link data
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    required: true 
  },

  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor',
    required: true 
  },

  // 3. We keep these as optional strings for display purposes (if needed), 
  // but removed 'required: true' to prevent validation errors if only ID is sent.
  patientName: { 
    type: String 
  },
  
  doctorName: { 
    type: String 
  },
  // ---------------------------

  description: {
    type: String,
  },
  
  status: {
    type: String,
    default: "active",
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

module.exports = mongoose.model("Encounter", EncounterSchema);