const mongoose = require("mongoose");

const TaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    taxRate: { type: Number, required: true },   // e.g. 5 for 5%
    clinicName: { type: String, default: "" },
    doctor: { type: String, default: "" },
    serviceName: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", TaxSchema);
