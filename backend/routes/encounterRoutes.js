const express = require("express");
const router = express.Router();
const encounterController = require("../controllers/encounterController");

// Create encounter
router.post("/", encounterController.createEncounter);

// Get all encounters
router.get("/", encounterController.getEncounters);

// Update encounter
router.put("/:id", encounterController.updateEncounter);

// Delete encounter
router.delete("/:id", encounterController.deleteEncounter);

// Add medical report
const upload = require("../middleware/upload");
router.post("/:id/reports", upload.single("report"), encounterController.addMedicalReport);

// Delete medical report
router.delete("/:id/reports/:reportId", encounterController.deleteMedicalReport);

// Update medical report
router.put("/:id/reports/:reportId", upload.single("report"), encounterController.updateMedicalReport);

module.exports = router;
