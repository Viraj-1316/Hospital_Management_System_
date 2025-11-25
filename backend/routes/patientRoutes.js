const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const PatientModel = require("../models/Patient");
const AppointmentModel = require("../models/Appointment");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");

// Get all patients
router.get("/", (req, res) => {
  PatientModel.find()
    .then((patients) => res.json(patients))
    .catch((err) => res.status(500).json(err));
});

router.get("/:id/latest-appointment", async (req, res) => {
  try {
    const { id } = req.params;

    // find patient doc
    const patient = await PatientModel.findById(id).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const fullName = `${patient.firstName} ${patient.lastName}`.trim();

    // find by either patientId or patientName
    const appt = await AppointmentModel.findOne({
      $or: [
        { patientId: id },
        { patientName: fullName }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!appt)
      return res.status(404).json({ message: "No appointment found" });

    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get patient by ID
router.get("/:id", async (req, res) => {
  // Check if it's looking for "by-user" which might conflict if not handled carefully, 
  // but since "by-user" is a specific path, we should put specific paths before generic :id
  // However, in the original code, they were separate. 
  // I will put specific routes before generic :id routes in this file to be safe.
  
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    // If cast error (invalid ID), check if it might be a mistake or just return 404/500
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create patient (POST)
router.post("/", async (req, res) => {
  try {
    const newPatient = await PatientModel.create(req.body);
    res.json({ message: "Patient added", data: newPatient });
  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete Patient
router.delete("/:id", async (req, res) => {
  try {
    await PatientModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update patient (PUT for full update)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await PatientModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: updated });
  } catch (err) {
    console.error("PUT /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Patch patient (for partial updates like status)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    // Accept either boolean isActive or string status for compatibility
    if (req.body.hasOwnProperty("isActive")) {
      update.isActive = !!req.body.isActive;
    }
    if (req.body.status) {
      update.status = req.body.status;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const updated = await PatientModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: updated });
  } catch (err) {
    console.error("PATCH /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Import patients from CSV
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          clinic: row.clinic || "",
          email: row.email || "",
          phone: row.phone || "",
          dob: row.dob || "",
          bloodGroup: row.bloodGroup || "",
          gender: row.gender || "",
          address: row.address || "",
          city: row.city || "",
          country: row.country || "",
          postalCode: row.postalCode || "",
        });
      })
      .on("end", async () => {
        try {
          await PatientModel.insertMany(results);
          fs.unlinkSync(req.file.path); // Clean up uploaded file
          res.json({ 
            message: "Imported patients successfully", 
            count: results.length 
          });
        } catch (err) {
          console.error("Database insertion error:", err);
          fs.unlinkSync(req.file.path); // Clean up even on error
          res.status(500).json({ message: "Database insertion failed", error: err.message });
        }
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "CSV parse error", error: err.message });
      });
  } catch (err) {
    console.error("Import error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// CREATE or UPDATE a patient profile for a given userId
router.put("/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    const updateData = req.body;

    // convert string to Mongo ObjectId (matches your Patient schema)
    try {
      userId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const patient = await PatientModel.findOneAndUpdate(
      { userId }, // find by userId (ObjectId)
      { $set: { ...updateData, userId } }, // update fields + ensure userId set
      { new: true, upsert: true } // create if not found
    );
    return res.json(patient);
  } catch (err) {
    console.error("Error updating/creating patient:", err);
    return res
      .status(500)
      .json({ message: "Failed to update patient profile" });
  }
});

// GET patient by userId (returns patient doc if exists)
router.get("/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    try { userId = new mongoose.Types.ObjectId(userId); } catch (e) { /* keep string if invalid */ }
    const patient = await PatientModel.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.json(patient);
  } catch (err) {
    console.error("GET /patients/by-user/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
