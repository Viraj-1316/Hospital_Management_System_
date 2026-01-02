// backend/models/Service.js
const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, default: "" },
    name: { type: String, required: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    clinicName: { type: String, default: "" },
    doctor: { type: String, default: "" },

    // Changed from String to Number for calculations
    charges: { type: Number, default: 0 },

    // Duration in minutes for scheduling
    duration: { type: Number, default: 30 },

    category: { type: String, default: "" },
    active: { type: Boolean, default: true },
    isTelemed: { type: Boolean, default: false },
    allowMulti: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },

    // Optional description
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for common queries
ServiceSchema.index({ name: 1 });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ active: 1 });

module.exports = mongoose.model("Service", ServiceSchema);