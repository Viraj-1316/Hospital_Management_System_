const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PdfTemplate = require("../models/PdfTemplate");


// Create folder
const uploadDir = path.join(__dirname, "..", "assets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

// GET TEMPLATE
router.get("/", async (req, res) => {
  try {
    const template = await PdfTemplate.findOne().sort({ createdAt: -1 });
    res.json({ success: true, data: template || null });
  } catch (err) {
    console.error("GET /api/pdf-template error:", err);
    res.status(500).json({ success: false });
  }
});

// SAVE TEMPLATE
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const body = req.body;

    let data = {
      clinicName: body.clinicName,
      clinicAddress: body.clinicAddress,
      clinicPhone: body.clinicPhone,
      clinicEmail: body.clinicEmail,
      footerMessage: body.footerMessage,
      qrEnabled: body.qrEnabled === "true" || body.qrEnabled === true,
    };

    if (req.file) {
      data.logoPath = "/assets/" + req.file.filename;
    }

    let existing = await PdfTemplate.findOne();
    let result;

    if (existing) {
      result = await PdfTemplate.findOneAndUpdate({}, data, { new: true });
    } else {
      result = await PdfTemplate.create(data);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("POST /api/pdf-template error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
