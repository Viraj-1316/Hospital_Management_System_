// backend/models/Counter.js
// Sequential ID generator for bills, patient UHID, etc.
const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  // Type of counter: "bill", "patient_uhid", etc.
  type: { type: String, required: true },
  
  // Optional clinic ID for clinic-specific counters
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", default: null },
  
  // Current counter value
  currentValue: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index for unique type + clinicId combination
CounterSchema.index({ type: 1, clinicId: 1 }, { unique: true });

/**
 * Get next sequence number atomically
 * @param {string} type - Counter type (e.g., "bill", "patient_uhid")
 * @param {string} prefix - Optional prefix (e.g., "OC-", "UHID-")
 * @param {ObjectId|null} clinicId - Optional clinic ID for clinic-specific counters
 * @param {number} padding - Number of digits to pad (default: 6)
 * @returns {Promise<string>} - Formatted sequence (e.g., "OC-000001")
 */
CounterSchema.statics.getNextSequence = async function(type, prefix = "", clinicId = null, padding = 6) {
  const counter = await this.findOneAndUpdate(
    { type, clinicId: clinicId || null },
    { $inc: { currentValue: 1 } },
    { new: true, upsert: true }
  );
  
  return `${prefix}${String(counter.currentValue).padStart(padding, '0')}`;
};

/**
 * Get current counter value without incrementing
 * @param {string} type - Counter type
 * @param {ObjectId|null} clinicId - Optional clinic ID
 * @returns {Promise<number>} - Current counter value
 */
CounterSchema.statics.getCurrentValue = async function(type, clinicId = null) {
  const counter = await this.findOne({ type, clinicId: clinicId || null });
  return counter ? counter.currentValue : 0;
};

module.exports = mongoose.model("Counter", CounterSchema);
