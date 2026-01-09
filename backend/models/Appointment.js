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
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
  date: { type: Date },
  time: String,
  services: { type: [String], default: [] },
  servicesDetail: String,
  charges: Number,
  paymentMode: String,
  status: { type: String, default: "upcoming" },
  
  // Queue token - auto-generated per doctor per day
  queueToken: { type: Number, default: null },
  
  // Department - copied from doctor's specialization at booking
  department: { type: String, default: null },
  
  // Appointment Mode (Online/Offline)
  appointmentMode: { 
    type: String, 
    enum: ['online', 'offline', null], 
    default: null  // null for backward compatibility
  },
  onlinePlatform: { 
    type: String, 
    enum: ['google_meet', 'zoom', null], 
    default: null 
  },
  meetingLink: { type: String, default: null },
  googleEventId: { type: String, default: null },
  zoomMeetingId: { type: String, default: null },
  
  createdAt: { type: Date, default: Date.now },

});

// Database Indexes for improved query performance
AppointmentSchema.index({ doctorId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ clinicId: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ date: -1 });

module.exports = mongoose.model("Appointment", AppointmentSchema);
