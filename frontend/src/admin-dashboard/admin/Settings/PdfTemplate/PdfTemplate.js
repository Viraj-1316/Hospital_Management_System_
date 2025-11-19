// backend/models/PdfTemplate.js
const mongoose = require("mongoose");

const PdfTemplateSchema = new mongoose.Schema({
  clinicName: { type: String, default: "" },
  clinicAddress: { type: String, default: "" },
  clinicPhone: { type: String, default: "" },
  clinicEmail: { type: String, default: "" },
  logoPath: { type: String, default: "" }, // server path or filename
  footerMessage: { type: String, default: "" },
  qrEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PdfTemplate", PdfTemplateSchema);
