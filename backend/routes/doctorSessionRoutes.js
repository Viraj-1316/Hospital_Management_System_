const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const DoctorSessionModel = require("../models/DoctorSession");
const upload = require("../middleware/upload");

// Get all sessions
router.get("/", async (req, res) => {
  try {
    const list = await DoctorSessionModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching doctor sessions:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create session
router.post("/", async (req, res) => {
  try {
    const doc = await DoctorSessionModel.create(req.body);
    res.json({ message: "Doctor session created", data: doc });
  } catch (err) {
    console.error("Error creating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update session
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DoctorSessionModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session updated", data: updated });
  } catch (err) {
    console.error("Error updating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete session
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DoctorSessionModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session deleted" });
  } catch (err) {
    console.error("Error deleting doctor session:", err);
  }
});

// Import doctor sessions from CSV
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // Parse days from comma-separated string
        const daysString = row.days || "";
        const daysArray = daysString.split(",").map(d => d.trim()).filter(d => d);

        results.push({
          doctorId: row.doctorId || "",
          doctorName: row.doctorName || "",
          clinic: row.clinic || "",
          days: daysArray,
          timeSlotMinutes: parseInt(row.timeSlotMinutes) || 30,
          morningStart: row.morningStart || "",
          morningEnd: row.morningEnd || "",
          eveningStart: row.eveningStart || "",
          eveningEnd: row.eveningEnd || "",
        });
      })
      .on("end", async () => {
        try {
          await DoctorSessionModel.insertMany(results);
          fs.unlinkSync(req.file.path); // Clean up uploaded file
          res.json({ 
            message: "Imported doctor sessions successfully", 
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

module.exports = router;
