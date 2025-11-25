const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    billNumber: {
      type: Number,
      required: true,
      unique: true
    },

    doctorName: { type: String, required: true },
    clinicName: { type: String, required: true },
    patientName: { type: String, required: true },

    services: {
      type: Array,
      default: [],
    },

    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },

    status: {
      type: String,
      enum: ["paid", "unpaid", "partial"],
      default: "unpaid",
    },

    date: {
      type: String,
      required: true, // yyyy-mm-dd
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Billing", BillingSchema);
