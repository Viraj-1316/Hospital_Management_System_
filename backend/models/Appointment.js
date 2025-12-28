// models/Appointment.js  (or wherever)
const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: false },
  patientName: String,
  patientEmail: String,    // <- add
  patientPhone: String,    // <- add
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: false },
  doctorName: String,
  clinic: String,
  date: { type: Date },
  time: String,
  services: String,
  servicesDetail: String,
  charges: Number,
  paymentMode: String,
  status: { type: String, default: "upcoming" },
  createdAt: { type: Date, default: Date.now },
});

// Database Indexes for improved query performance
AppointmentSchema.index({ doctorId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ date: -1 });

module.exports = mongoose.model("Appointment", AppointmentSchema);
