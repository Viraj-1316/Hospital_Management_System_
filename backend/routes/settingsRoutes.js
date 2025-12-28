const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { verifyToken } = require("../middleware/auth");

// Appointment Settings
router.get("/appointment", verifyToken, settingsController.getAppointmentSettings);
router.put("/appointment", verifyToken, settingsController.updateAppointmentSettings);

// SMS Templates
router.get("/templates", verifyToken, settingsController.getAllTemplates);
router.put("/templates/:templateId", verifyToken, settingsController.updateTemplate);
router.post("/templates/seed", verifyToken, settingsController.seedTemplates); // To populate DB from frontend constants

module.exports = router;
