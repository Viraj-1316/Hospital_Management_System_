const express = require("express");
const router = express.Router();
const TaxModel = require("../models/Tax");
const multer = require("multer");
const csv = require("csvtojson");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

// Get all taxes
router.get("/", async (req, res) => {
  try {
    const list = await TaxModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching taxes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create new tax
router.post("/", async (req, res) => {
  try {
    const payload = req.body;

    // ensure number
    if (typeof payload.taxRate === "string") {
      payload.taxRate = parseFloat(payload.taxRate) || 0;
    }

    const doc = await TaxModel.create(payload);
    res.json({ message: "Tax created", data: doc });
  } catch (err) {
    console.error("Error creating tax:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Import taxes from CSV
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const jsonArray = await csv().fromFile(req.file.path);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (!jsonArray || jsonArray.length === 0) {
      return res.status(400).json({ message: "CSV file is empty" });
    }

    const taxesToInsert = jsonArray.map((item) => ({
      name: item.name,
      taxRate: parseFloat(item.taxRate) || 0,
      clinicName: item.clinicName,
      doctor: item.doctor,
      serviceName: item.serviceName,
      active: item.active === "true" || item.active === true,
    }));

    await TaxModel.insertMany(taxesToInsert);

    res.json({ message: "Taxes imported successfully", count: taxesToInsert.length });
  } catch (err) {
    console.error("Error importing taxes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update tax (edit or toggle)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (typeof payload.taxRate === "string") {
      payload.taxRate = parseFloat(payload.taxRate) || 0;
    }

    const updated = await TaxModel.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Tax not found" });
    }

    res.json({ message: "Tax updated", data: updated });
  } catch (err) {
    console.error("Error updating tax:", err);
    res.status(500).json({ message: "Error updating tax", error: err.message });
  }
});

// Delete tax
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TaxModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.json({ message: "Tax deleted" });
  } catch (err) {
    console.error("Error deleting tax:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
