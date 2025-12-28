// routes/clinicRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../config/multerConfig");
const clinicController = require("../controllers/clinicController");
const { verifyToken } = require("../middleware/auth");

// Create clinic
router.post(
  "/clinics",
  verifyToken,
  upload.fields([
    { name: "clinicLogo", maxCount: 1 },
    { name: "adminPhoto", maxCount: 1 },
  ]),
  clinicController.createClinic
);

// Get all clinics
router.get("/clinics", verifyToken, clinicController.getClinics);

// Get single clinic
router.get("/clinics/:id", verifyToken, clinicController.getClinicById);

// Update clinic
router.put(
  "/clinics/:id",
  verifyToken,
  upload.fields([
    { name: "clinicLogo", maxCount: 1 },
    { name: "adminPhoto", maxCount: 1 },
  ]),
  clinicController.updateClinic
);

// Delete clinic
router.delete("/clinics/:id", verifyToken, clinicController.deleteClinic);

// Resend credentials
router.post(
  "/clinics/:id/resend-credentials",
  verifyToken,
  clinicController.resendCredentials
);

router.post(
  "/clinics/import",
  verifyToken,
  upload.single("file"),
  clinicController.importClinics
);

module.exports = router;

