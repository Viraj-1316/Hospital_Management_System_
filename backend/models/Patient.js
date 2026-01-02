const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({

  // Link to User collection (the account used to login)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Must exist now
  },

  clinic: String,
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },


  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Database Indexes for improved query performance
PatientSchema.index({ userId: 1 });
PatientSchema.index({ clinicId: 1 });
PatientSchema.index({ isActive: 1 });

const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;
