// backend/models/Service.js
const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, default: "" }, // Changed to String as it often comes as string from forms
    name: { type: String, required: true },
    clinicName: { type: String, default: "" },
    doctor: { type: String, default: "" },
    charges: { type: String, default: "$0/-" },
    duration: { type: String, default: "-" },
    category: { type: String, default: "" },
    active: { type: Boolean, default: true },
    isTelemed: { type: Boolean, default: false },
    allowMulti: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);