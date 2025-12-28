const express = require("express");
const router = express.Router();
const Encounter = require("../models/Encounter");
const mongoose = require("mongoose");
// IMPORT UPLOAD MIDDLEWARE (Needed for file handling)
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");

// 1. GET ALL ENCOUNTERS
router.get("/", verifyToken, async (req, res) => {
  try {
    const { doctorId, patientId } = req.query;
    let query = {};
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    const encounters = await Encounter.find(query)
      .populate("doctorId", "firstName lastName clinic specialization")
      .populate("patientId", "firstName lastName email phone")
      .sort({ date: -1 });

    res.json(encounters);
  } catch (err) {
    console.error("Error fetching encounters:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. GET SINGLE ENCOUNTER
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id)
      .populate("doctorId", "firstName lastName clinic")
      .populate("patientId", "firstName lastName");
    if (!encounter) return res.status(404).json({ message: "Encounter not found" });
    res.json(encounter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. CREATE ENCOUNTER
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.body.patientId && !mongoose.Types.ObjectId.isValid(req.body.patientId)) {
      return res.status(400).json({ message: "Invalid Patient ID" });
    }
    const dataToSave = { ...req.body };
    if (!dataToSave.encounterId) {
      dataToSave.encounterId = `ENC-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const newEncounter = new Encounter(dataToSave);
    const savedEncounter = await newEncounter.save();
    res.status(201).json(savedEncounter);
  } catch (err) {
    console.error("Error creating encounter:", err);
    res.status(400).json({ message: err.message });
  }
});

// 4. UPDATE ENCOUNTER
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedEncounter = await Encounter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEncounter) return res.status(404).json({ message: "Encounter not found" });
    res.json(updatedEncounter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. DELETE ENCOUNTER
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedEncounter = await Encounter.findByIdAndDelete(req.params.id);
    if (!deletedEncounter) return res.status(404).json({ message: "Encounter not found" });
    res.json({ message: "Encounter deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MEDICAL REPORTS ROUTES ---

// 6. ADD REPORT (FIXED: Added upload.single middleware)
router.post("/:id/reports", verifyToken, upload.single('report'), async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ message: "Encounter not found" });

    // req.file contains the file info because of 'upload.single'
    // req.body contains the text fields (name, date)
    const newReport = {
      name: req.body.name,
      date: req.body.date,
      // If file uploaded, store path. If not, empty string.
      // We use 'path' or 'filename' depending on how you store it. 
      // Usually, we prepend '/' so frontend can access it easily.
      file: req.file ? `/uploads/${req.file.filename}` : "",
      originalName: req.file ? req.file.originalname : ""
    };

    encounter.medicalReports.push(newReport);
    await encounter.save();
    res.json(encounter);
  } catch (err) {
    console.error("Error adding report:", err);
    res.status(500).json({ message: err.message });
  }
});

// 7. UPDATE REPORT (Optional: Handling Edit with file replace)
router.put("/:encounterId/reports/:reportId", verifyToken, upload.single('report'), async (req, res) => {
  try {
    const { encounterId, reportId } = req.params;
    const encounter = await Encounter.findById(encounterId);
    if (!encounter) return res.status(404).json({ message: "Encounter not found" });

    const report = encounter.medicalReports.id(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Update fields
    if (req.body.name) report.name = req.body.name;
    if (req.body.date) report.date = req.body.date;

    // Only update file if a new one is uploaded
    if (req.file) {
      report.file = `/uploads/${req.file.filename}`;
      report.originalName = req.file.originalname;
    }

    await encounter.save();
    res.json(encounter);
  } catch (err) {
    console.error("Error updating report:", err);
    res.status(500).json({ message: err.message });
  }
});

// 8. DELETE REPORT
router.delete("/:encounterId/reports/:reportId", verifyToken, async (req, res) => {
  try {
    const { encounterId, reportId } = req.params;
    const encounter = await Encounter.findById(encounterId);
    if (!encounter) return res.status(404).json({ message: "Encounter not found" });

    encounter.medicalReports.pull(reportId);
    await encounter.save();
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting report" });
  }
});

module.exports = router;