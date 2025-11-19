const mongoose = require("mongoose");
const PdfTemplate = require("../models/PdfTemplate");


const PdfTemplateSchema = new mongoose.Schema({
  clinicName: { type: String, default: "" },
  clinicAddress: { type: String, default: "" },
  clinicPhone: { type: String, default: "" },
  clinicEmail: { type: String, default: "" },
  logoPath: { type: String, default: "" },
  footerMessage: { type: String, default: "" },
  qrEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PdfTemplate", PdfTemplateSchema);
