const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const PatientModel = require("../models/Patient");
const AppointmentModel = require("../models/Appointment");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateRandomPassword = require("../utils/generatePassword");
const { sendEmail } = require("../utils/emailService");
const { credentialsTemplate } = require("../utils/emailTemplates");
const { verifyToken } = require("../middleware/auth");

// =================================================================
// 1. SPECIFIC ROUTES (Must come BEFORE /:id generic routes)
// =================================================================

// Import patients from CSV
router.post("/import", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          clinic: row.clinic || "",
          email: row.email || "",
          phone: row.phone || "",
          dob: row.dob || "",
          bloodGroup: row.bloodGroup || "",
          gender: row.gender || "",
          address: row.address || "",
          city: row.city || "",
          country: row.country || "",
          postalCode: row.postalCode || "",
        });
      })
      .on("end", async () => {
        try {
          await PatientModel.insertMany(results);
          fs.unlinkSync(req.file.path); // Clean up uploaded file
          res.json({
            message: "Imported patients successfully",
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

// GET patient by userId (returns patient doc if exists)
router.get("/by-user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const patient = await PatientModel.findOne({ userId });

    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.json(patient);
  } catch (err) {
    console.error("GET /patients/by-user/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// CREATE or UPDATE a patient profile for a given userId
router.put("/by-user/:userId", verifyToken, async (req, res) => {
  try {
    let { userId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const patient = await PatientModel.findOneAndUpdate(
      { userId },
      { $set: { ...updateData, userId } },
      { new: true, upsert: true } // create if not found
    );

    // Sync common fields to User model
    const userUpdate = {};
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.gender) userUpdate.gender = updateData.gender;
    if (updateData.dob) userUpdate.dob = updateData.dob;
    if (updateData.bloodGroup) userUpdate.bloodGroup = updateData.bloodGroup;
    if (updateData.address) userUpdate.addressLine1 = updateData.address;
    if (updateData.city) userUpdate.city = updateData.city;
    if (updateData.postalCode) userUpdate.postalCode = updateData.postalCode;

    if (updateData.firstName || updateData.lastName) {
      if (updateData.firstName && updateData.lastName) {
        userUpdate.name = `${updateData.firstName} ${updateData.lastName}`.trim();
      }
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate });
    }

    return res.json(patient);
  } catch (err) {
    console.error("Error updating/creating patient:", err);
    return res.status(500).json({ message: "Failed to update patient profile" });
  }
});

// Get all patients
router.get("/", verifyToken, (req, res) => {
  PatientModel.find()
    .then((patients) => res.json(patients))
    .catch((err) => res.status(500).json(err));
});

// Resend credentials
router.post("/:id/resend-credentials", verifyToken, async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const email = patient.email;
    if (!email) {
      return res.status(400).json({ message: "Patient has no email address" });
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let user = await User.findOne({ email });
    if (user) {
      user.password = hashedPassword;
      await user.save();
    } else {
      user = new User({
        email,
        password: hashedPassword,
        role: "patient",
        name: `${patient.firstName} ${patient.lastName}`,
        profileCompleted: true,
      });
      await user.save();

      if (!patient.userId) {
        patient.userId = user._id;
        await patient.save();
      }
    }

    const html = credentialsTemplate({
      name: `${patient.firstName} ${patient.lastName}`,
      email,
      password: newPassword,
    });

    await sendEmail({
      to: email,
      subject: "Your OneCare Credentials",
      html,
    });

    res.json({ message: `Credentials sent to ${email}` });
  } catch (err) {
    console.error("Error resending credentials:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/:id/latest-appointment", async (req, res) => {
  try {
    const { id } = req.params;

    // find patient doc
    const patient = await PatientModel.findById(id).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const fullName = `${patient.firstName} ${patient.lastName}`.trim();

    // find by either patientId or patientName
    const appt = await AppointmentModel.findOne({
      $or: [
        { patientId: id },
        { patientName: fullName }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!appt)
      return res.status(404).json({ message: "No appointment found" });

    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get patient by ID (GENERIC CATCH-ALL FOR :id)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Patient ID" });
    }
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete Patient
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await PatientModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create patient (POST)
router.post("/", verifyToken, async (req, res) => {
  try {
    const newPatient = await PatientModel.create(req.body);
    res.json({ message: "Patient added", data: newPatient });
  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update patient (PUT for full update)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await PatientModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: updated });
  } catch (err) {
    console.error("PUT /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Patch patient (for partial updates like status)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    if (req.body.hasOwnProperty("isActive")) {
      update.isActive = !!req.body.isActive;
    }
    if (req.body.status) {
      update.status = req.body.status;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const updated = await PatientModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: updated });
  } catch (err) {
    console.error("PATCH /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;