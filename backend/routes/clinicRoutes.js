// routes/clinicRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../config/multerConfig");
const clinicController = require("../controllers/clinicController");

// Create clinic
router.post(
  "/clinics",
  upload.fields([
    { name: "clinicLogo", maxCount: 1 },
    { name: "adminPhoto", maxCount: 1 },
  ]),
  clinicController.createClinic
);

// Get all clinics
router.get("/clinics", clinicController.getClinics);

// Get single clinic
router.get("/clinics/:id", clinicController.getClinicById);

// Update clinic
router.put(
  "/clinics/:id",
  upload.fields([
    { name: "clinicLogo", maxCount: 1 },
    { name: "adminPhoto", maxCount: 1 },
  ]),
  clinicController.updateClinic
);

// Delete clinic
router.delete("/clinics/:id", clinicController.deleteClinic);

// Resend credentials
router.post(
  "/clinics/:id/resend-credentials",
  clinicController.resendCredentials
);

router.post(
  "/clinics/import",
  upload.single("file"),
  clinicController.importClinics
);

module.exports = router;

