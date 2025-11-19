// models/Appointment.js  (or wherever)
const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "patients", required: false },
  patientName: String,
  patientEmail: String,    // <- add
  patientPhone: String,    // <- add
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctors", required: false },
  doctorName: String,
  clinic: String,
  date: String,
  time: String,
  services: String,
  servicesDetail: String,
  charges: Number,
  paymentMode: String,
  status: { type: String, default: "upcoming" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("appointments", AppointmentSchema);
