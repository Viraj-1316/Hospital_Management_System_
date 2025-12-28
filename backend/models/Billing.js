const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    billNumber: {
      type: Number,
      required: true,
      unique: true
    },

    // ObjectId references for proper population
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false // Allow bills without linked patient
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false // Allow bills without linked doctor
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: false
    },
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      required: false,
      default: null
    },

    // Denormalized names for display (fallback if population fails)
    doctorName: { type: String, required: false, default: "" },
    clinicName: { type: String, required: false, default: "" },
    patientName: { type: String, required: false, default: "" },

    // Billing details
    services: [{
      name: { type: String },
      amount: { type: Number, default: 0 }
    }],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    status: {
      type: String,
      enum: ["unpaid", "paid", "partial", "cancelled"],
      default: "unpaid"
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for common queries
BillingSchema.index({ patientId: 1 });
BillingSchema.index({ doctorId: 1 });
BillingSchema.index({ date: -1 });
BillingSchema.index({ status: 1 });

module.exports = mongoose.model("Billing", BillingSchema);