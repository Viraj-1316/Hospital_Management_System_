// routes/receptionistRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken } = require("../middleware/auth");

const {
  addReceptionist,
  getReceptionists,
  getReceptionistById,
  updateReceptionist,
  deleteReceptionist,
  toggleReceptionistStatus,
  resendCredentials,
  importReceptionists,
  changePassword,
} = require("../controllers/receptionistController");

// Multer setup for CSV import
const upload = multer({ dest: "uploads/" });

// ----------------------------------------------------
// ROUTES (All require authentication)
// ----------------------------------------------------

// List all receptionists
router.get("/", verifyToken, getReceptionists);

// Get single receptionist
router.get("/:id", verifyToken, getReceptionistById);

// Add receptionist
router.post("/", verifyToken, addReceptionist);

// Update receptionist
router.put("/:id", verifyToken, updateReceptionist);

// Delete receptionist
router.delete("/:id", verifyToken, deleteReceptionist);

// Toggle status
router.patch("/:id/status", verifyToken, toggleReceptionistStatus);

// Resend login credentials
router.post("/:id/resend-credentials", verifyToken, resendCredentials);

// Change password
router.put("/change-password/:id", verifyToken, changePassword);

// Import CSV
router.post("/import", verifyToken, upload.single("file"), importReceptionists);

module.exports = router;
