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

module.exports = router;
