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

// Get all clinics (authenticated)
router.get("/clinics", verifyToken, clinicController.getClinics);

// Get public list of clinics (for clinic finder - no auth required)
router.get("/clinics/public-list", async (req, res) => {
  try {
    const Clinic = require("../models/Clinic");
    const clinics = await Clinic.find(
      { isActive: { $ne: false }, subdomain: { $exists: true, $ne: "" } },
      { 
        name: 1, 
        subdomain: 1, 
        "contact.address.city": 1,
        clinicLogo: 1 
      }
    ).sort({ name: 1 }).limit(100);

    const formattedClinics = clinics.map(c => ({
      _id: c._id,
      name: c.name,
      subdomain: c.subdomain,
      city: c.contact?.address?.city || "",
      logo: c.clinicLogo || ""
    }));

    res.json({ success: true, data: formattedClinics });
  } catch (err) {
    console.error("Error fetching public clinics:", err);
    res.status(500).json({ success: false, message: "Failed to fetch clinics" });
  }
});

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

