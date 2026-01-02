const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { verifyToken } = require("../middleware/auth");

/**
 * Helper to convert duration string (HH:mm or numeric) to minutes
 */
const parseDuration = (val) => {
  if (!val) return 30; // Default
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (s.includes(':')) {
    const parts = s.split(':');
    const h = parseInt(parts[0] || 0, 10);
    const m = parseInt(parts[1] || 0, 10);
    return (h * 60) + m;
  }
  const n = parseInt(s, 10);
  return isNaN(n) ? 30 : n;
};

// --- 1. CONFIGURATION FOR IMAGE/FILE UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
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

// --- 2. DEFINING CSV HEADERS (MUST MATCH YOUR CSV) ---
const REQUIRED_HEADERS = [
  "category",
  "name",
  "charges",
  "isTelemed",
  "clinicName",
  "doctor",
  "duration",
  "active",
  "allowMulti"
];

// --- 3. ROUTES ---

// GET /services (Fetch with Filters)
router.get("/", verifyToken, async (req, res) => {
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

    // Multi-tenant filtering
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === 'admin') {
      currentUser = await require("../models/Admin").findById(req.user.id);
    } else if (req.user.role === 'doctor') {
      // Doctors are stored in Doctor model
      const Doctor = require("../models/Doctor");
      currentUser = await Doctor.findById(req.user.id);
      if (currentUser?.clinicId) {
        safeClinicId = currentUser.clinicId;
      }
    } else {
      currentUser = await require("../models/User").findById(req.user.id);

      // If clinicId not found in User, check Patient model (for patients)
      if (currentUser && !currentUser.clinicId && (req.user.role === 'patient' || currentUser.role === 'patient')) {
        const Patient = require("../models/Patient");
        const patientRecord = await Patient.findOne({ userId: req.user.id });
        if (patientRecord && patientRecord.clinicId) {
          safeClinicId = patientRecord.clinicId;
        }
      }
    }

    if (!safeClinicId && currentUser) {
      safeClinicId = currentUser.clinicId;
    }
    if (!safeClinicId) {
      safeClinicId = req.user.clinicId || null;
    }

    const effectiveRole = currentUser ? currentUser.role : req.user.role;

    if (effectiveRole === "admin") {
      // Global View
    } else if (safeClinicId) {
      filter.clinicId = safeClinicId;
    } else {
      return res.json({ rows: [], total: 0 });
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

// POST /services/import (CSV Import)
router.post("/import", verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const results = [];
  const errors = [];
  let headersValidated = false;

  // Use absolute path safely
  const filePath = path.resolve(req.file.path);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("headers", (headers) => {
      // Clean headers (remove BOM which looks like ï»¿, trim whitespace, remove quotes)
      const fileHeaders = headers.map((h) => h.trim().replace(/^"|"$/g, "").replace(/^\uFEFF/, ''));

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
        // Helper to check truthy strings loosely
        const isTrue = (val) => {
          const s = String(val).trim().toLowerCase();
          return s === "active" || s === "true" || s === "yes" || s === "1";
        };

        results.push({
          serviceId: data.serviceId || `SVC-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Auto-generate if missing
          name: data.name,
          category: data.category,
          clinicName: data.clinicName, // This is just a string name, but we might want clinicId too?
          // Strict Isolation: Only Admins can manually set clinicId
          clinicId: req.user.role === 'admin' ? (req.body.clinicId || null) : req.user.clinicId,
          doctor: data.doctor,
          charges: data.charges,
          duration: parseDuration(data.duration),
          active: isTrue(data.active),
          isTelemed: isTrue(data.isTelemed),
          allowMulti: isTrue(data.allowMulti),
          imageUrl: ""
        });
      }
    })
    .on("end", async () => {
      // Delete temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "File is empty or contains no valid data rows." });
      }

      try {
        await Service.insertMany(results);
        res.status(200).json({ message: `Successfully imported ${results.length} services.` });
      } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ message: "Database error during import.", error: err.message });
      }
    })
    .on("error", (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ message: "Error parsing CSV file.", error: err.message });
    });
});

// POST /services (Create Single)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    // Resolve clinicId properly from multiple sources
    let resolvedClinicId = null;
    const User = require("../models/User");
    const Doctor = require("../models/Doctor");
    const Clinic = require("../models/Clinic");

    if (req.user.role === 'admin') {
      // Admin can specify any clinicId, or we resolve from clinicName
      resolvedClinicId = req.body.clinicId || null;

      // If admin didn't provide clinicId but provided clinicName, look it up
      if (!resolvedClinicId && req.body.clinicName) {
        const clinic = await Clinic.findOne({
          $or: [
            { name: new RegExp(`^${req.body.clinicName}$`, 'i') },
            { clinicName: new RegExp(`^${req.body.clinicName}$`, 'i') }
          ]
        });
        if (clinic) {
          resolvedClinicId = clinic._id;
        }
      }
    } else if (req.user.role === 'doctor') {
      // Doctors are stored in Doctor model
      const doctor = await Doctor.findById(req.user.id);
      resolvedClinicId = doctor?.clinicId || req.user.clinicId || null;
    } else {
      // For other roles (clinic_admin, receptionist, etc.), get clinicId from User record
      const currentUser = await User.findById(req.user.id);
      resolvedClinicId = currentUser?.clinicId || req.user.clinicId || null;
    }

    // Final fallback: if still no clinicId, try to resolve from clinicName
    if (!resolvedClinicId && req.body.clinicName) {
      const clinic = await Clinic.findOne({
        $or: [
          { name: new RegExp(`^${req.body.clinicName}$`, 'i') },
          { clinicName: new RegExp(`^${req.body.clinicName}$`, 'i') }
        ]
      });
      if (clinic) {
        resolvedClinicId = clinic._id;
      }
    }

    const payload = {
      ...req.body,
      // Explicit string-to-boolean conversion for FormData
      active: req.body.active === "true" || req.body.active === true,
      isTelemed: req.body.isTelemed === "true" || req.body.isTelemed === true,
      allowMulti: req.body.allowMulti === "true" || req.body.allowMulti === true,
      // Enforce Isolation with properly resolved clinicId
      clinicId: resolvedClinicId,
      // Parse duration to number (minutes)
      duration: parseDuration(req.body.duration)
    };

    // Auto-generate ID if not provided
    if (!payload.serviceId) {
      payload.serviceId = `SVC-${Date.now()}`;
    }

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get("host");
      payload.imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const created = await Service.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("Create Error:", err);
    res.status(400).json({ message: "Database Save Failed", error: err.message });
  }
});

// PUT /services/:id (Update)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const payload = { ...req.body };

    // Safe boolean conversion
    if (payload.active !== undefined) payload.active = payload.active === "true" || payload.active === true;
    if (payload.isTelemed !== undefined) payload.isTelemed = payload.isTelemed === "true" || payload.isTelemed === true;
    if (payload.allowMulti !== undefined) payload.allowMulti = payload.allowMulti === "true" || payload.allowMulti === true;
    if (payload.duration !== undefined) payload.duration = parseDuration(payload.duration);

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

// DELETE /services/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;