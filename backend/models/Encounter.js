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
    type: String, // Storing name or ID depending on how we want to display it, usually name for simple display or ID for relation. 
                  // Based on other models, it seems mixed. Let's store name but also keep ID if possible. 
                  // The screenshot shows "Doctor Name" in the table.
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("encounters", EncounterSchema);
