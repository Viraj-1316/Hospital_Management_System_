const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    // Change required to FALSE
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },

    // --- FIX HERE: Allow clinicId to be empty/null ---
    clinicId: { type: String, required: false },
    // -------------------------------------------------

    // backend/models/Billing.js
    encounterId: { type: String, required: false, default: null },

    doctorName: { type: String, required: true },
    clinicName: { type: String, required: true },
    patientName: { type: String, required: true },

    // ... rest of your schema
    services: { type: Array, default: [] },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    status: { type: String, default: "unpaid" },
    date: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", BillingSchema);