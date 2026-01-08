const mongoose = require("mongoose");
const Counter = require("./Counter");

const PatientSchema = new mongoose.Schema({
  // Unique Health ID (auto-generated on creation)
  uhid: {
    type: String,
    unique: true,
    sparse: true,  // Allows null for existing patients temporarily
  },

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

// Pre-save hook to auto-generate UHID for new patients
PatientSchema.pre('save', async function(next) {
  if (this.isNew && !this.uhid) {
    try {
      this.uhid = await Counter.getNextSequence("patient_uhid", "UHID-", null, 5);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Database Indexes for improved query performance
PatientSchema.index({ userId: 1 });
PatientSchema.index({ clinicId: 1 });
PatientSchema.index({ isActive: 1 });


const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;

