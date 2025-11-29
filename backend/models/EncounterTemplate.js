const mongoose = require("mongoose");

const EncounterTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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

module.exports = mongoose.model("EncounterTemplate", EncounterTemplateSchema);
