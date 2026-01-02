// backend/models/DoctorSession.js
const mongoose = require("mongoose");

const DoctorSessionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    doctorName: String,
    clinic: String,
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },

    // e.g. ["Mon","Tue","Wed"]
    days: [String],

    // each appointment slot duration (in minutes)
    timeSlotMinutes: { type: Number, default: 30 },

    // "HH:MM" 24h format
    morningStart: String, // e.g. "09:00"
    morningEnd: String,   // e.g. "13:00"
    eveningStart: String, // optional
    eveningEnd: String,   // optional
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorSession", DoctorSessionSchema);
