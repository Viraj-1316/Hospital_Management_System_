// backend/routes/services.js
const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser"); // <--- IMPORT CSV-PARSER

// --- 1. CONFIGURATION FOR IMAGE/FILE UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `service-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// --- DEFINING CSV HEADERS FOR VALIDATION ---
// These must match the columns in your CSV file
const REQUIRED_HEADERS = [
  "category",
  "name",
  "charges",
  "isTelemed",
  "clinicName",
  "doctor",
  "duration",
  "active", // or 'status', depending on your CSV header name
  "allowMulti"
];

// --- 2. ROUTES ---

// GET /services (Existing Code)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      q = "",
      serviceId, name, clinicName, doctor, charges, duration, category, status
    } = req.query;

    const filter = {};

    // 1. Global Search
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { doctor: new RegExp(q, "i") },
        { clinicName: new RegExp(q, "i") },
        { category: new RegExp(q, "i") },
      ];
    }

    // 2. Specific Filters
    if (serviceId) filter.serviceId = new RegExp(serviceId, "i");
    if (name) filter.name = new RegExp(name, "i");
    if (clinicName) filter.clinicName = new RegExp(clinicName, "i");
    if (doctor) filter.doctor = new RegExp(doctor, "i");
    if (charges) filter.charges = new RegExp(charges, "i");
    if (duration) filter.duration = new RegExp(duration, "i");
    if (category && category !== "Filter Name") filter.category = new RegExp(category, "i");

    if (status && status !== "Filter status") {
      if (status.toLowerCase() === "active") filter.active = true;
      if (status.toLowerCase() === "inactive") filter.active = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      Service.find(filter).sort({ [sort]: order === "asc" ? 1 : -1 }).skip(skip).limit(Number(limit)),
      Service.countDocuments(filter),
    ]);
    res.json({ rows, total });
  } catch (err) {
    console.error("GET /services error:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// --- NEW ROUTE: POST /services/import (CSV Import) ---
router.post("/import", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const results = [];
  const errors = [];
  let headersValidated = false;

  // Read the uploaded file
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("headers", (headers) => {
      // Clean headers (remove BOM, trim whitespace)
      const fileHeaders = headers.map((h) => h.trim().replace(/^"|"$/g, ""));
      
      // Check if required headers exist
      const missingHeaders = REQUIRED_HEADERS.filter(
        (reqHeader) => !fileHeaders.includes(reqHeader)
      );

      if (missingHeaders.length > 0) {
        errors.push(`Invalid CSV. Missing columns: ${missingHeaders.join(", ")}`);
      } else {
        headersValidated = true;
      }
    })
    .on("data", (data) => {
      if (headersValidated) {
        // Map CSV string data to Mongoose Schema types
        results.push({
          serviceId: data.serviceId || "", // Optional in CSV
          name: data.name,
          category: data.category,
          clinicName: data.clinicName,
          doctor: data.doctor,
          charges: data.charges,
          duration: data.duration,
          // Convert "ACTIVE" or "Yes" to Boolean true
          active: (data.active === "ACTIVE" || data.active === "true" || data.active === "Yes"),
          isTelemed: (data.isTelemed === "Yes" || data.isTelemed === "true"),
          allowMulti: (data.allowMulti === "Yes" || data.allowMulti === "true"),
          imageUrl: "" // CSV usually doesn't carry images, set default
        });
      }
    })
    .on("end", async () => {
      // Clean up the temp file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "File is empty or contains no data." });
      }

      try {
        // Bulk Insert into MongoDB
        await Service.insertMany(results);
        res.status(200).json({ message: `Successfully imported ${results.length} services.` });
      } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ message: "Database error during import.", error: err.message });
      }
    })
    .on("error", (err) => {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: "Error parsing CSV file.", error: err.message });
    });
});

// POST /services (Create - Existing Code)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      active: req.body.active === "true",
      isTelemed: req.body.isTelemed === "true",
      allowMulti: req.body.allowMulti === "true",
    };

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get("host");
      payload.imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const created = await Service.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: "Database Save Failed", error: err.message });
  }
});

// PUT /services/:id (Update - Existing Code)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const payload = { ...req.body };
    // Handle Boolean conversions if sending as FormData strings
    if (payload.active !== undefined) payload.active = payload.active === "true";
    if (payload.isTelemed !== undefined) payload.isTelemed = payload.isTelemed === "true";
    if (payload.allowMulti !== undefined) payload.allowMulti = payload.allowMulti === "true";

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get("host");
      payload.imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Service not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update service" });
  }
});

// DELETE /services/:id (Existing Code)
router.delete("/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;