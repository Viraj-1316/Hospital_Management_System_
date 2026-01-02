const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const DoctorModel = require("../models/Doctor");
const DoctorSessionModel = require("../models/DoctorSession");
const { sendEmail } = require("../utils/emailService");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../middleware/auth");

// Configure Multer for CSV import
const upload = multer({ dest: path.join(__dirname, "../uploads") });

/* ===============================
 *         DOCTOR APIs
 * =============================== */

// Create Doctor (with auto-generated password)
router.post("/", verifyToken, async (req, res) => {
  try {


    const { email, firstName, lastName } = req.body;

    // Check if email already exists
    const existing = await DoctorModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const doctorData = {
      ...req.body,
      password: hashedPassword,
      mustChangePassword: true,
      // For Admin: Use body.clinicId (allow assigning to any clinic)
      // For Clinic Admin: Force req.user.clinicId
      clinicId: req.user.role === 'admin' ? (req.body.clinicId || null) : req.user.clinicId
    };

    const doctor = await DoctorModel.create(doctorData);

    // Send email
    const fullName = `${firstName} ${lastName}`;
    const html = `
      <h3>Welcome Dr. ${fullName},</h3>
      <p>Your account has been created at OneCare.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${randomPassword}</p>
      <p>Please login and change your password immediately.</p>
    `;

    sendEmail({
      to: email,
      subject: "Your Doctor Account Credentials | OneCare",
      html,
    });

    res.json({ message: "Doctor added and credentials sent", data: doctor });
  } catch (err) {
    console.error("Error saving doctor:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all doctors
// Get all doctors
router.get("/", verifyToken, async (req, res) => {
  try {
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === 'admin') {
      currentUser = await require("../models/Admin").findById(req.user.id);
    } else {
      currentUser = await require("../models/User").findById(req.user.id);
    }

    if (currentUser) {
      safeClinicId = currentUser.clinicId;
    } else {
      safeClinicId = req.user.clinicId || null;
    }

    const effectiveRole = currentUser ? currentUser.role : req.user.role;

    // Initialize query if not present (although it was present above in original code, I should keep it or replace including it)
    // Looking at file content, const query = {}; is at line 75. 
    // And I am replacing from line 73. 
    // So I MUST include const query = {};

    const query = {};

    if (effectiveRole === "admin") {
      // Global View
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      // Fallback
      return res.json([]);
    }

    const doctors = await DoctorModel.find(query);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete doctor
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await DoctorModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting doctor", error: err.message });
  }
});

// Update Doctor
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;


    // Ensure qualifications is always an array
    if (updateData.qualifications && !Array.isArray(updateData.qualifications)) {
      updateData.qualifications = [updateData.qualifications];
    }

    const updatedDoctor = await DoctorModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor updated successfully", data: updatedDoctor });
  } catch (err) {
    console.error("Error updating doctor:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Resend Credentials (Regenerate password and email)
router.post("/:id/resend-credentials", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Generate new random password
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    doctor.password = hashedPassword;
    doctor.mustChangePassword = true;
    await doctor.save();

    // Send email
    const fullName = `${doctor.firstName} ${doctor.lastName}`;
    const html = `
      <h3>Hello Dr. ${fullName},</h3>
      <p>Your account credentials have been reset by the admin.</p>
      <p><strong>Email:</strong> ${doctor.email}</p>
      <p><strong>New Temporary Password:</strong> ${randomPassword}</p>
      <p>Please login and change your password immediately.</p>
    `;

    sendEmail({
      to: doctor.email,
      subject: "Your New Doctor Account Credentials | OneCare",
      html,
    });

    res.json({ message: "Credentials resent successfully" });
  } catch (err) {
    console.error("Error resending credentials:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Doctor Csv Import
router.post("/import", verifyToken, upload.single("file"), async (req, res) => {
  try {


    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // CSV headers:
        // firstName,lastName,clinic,email,phone,dob,specialization,gender,status
        results.push({
          firstName: row.firstName,
          lastName: row.lastName,
          clinic: row.clinic,
          email: row.email,
          phone: row.phone,
          dob: row.dob, // string is fine, your schema will cast to Date if needed
          specialization: row.specialization,
          gender: row.gender,
          status: row.status || "Active",
        });
      })
      .on("end", async () => {
        try {

          if (results.length > 0) {
            await DoctorModel.insertMany(results);
          }

          // delete temp file
          fs.unlinkSync(req.file.path);

          res.json({
            message: "Imported doctors",
            count: results.length,
          });
        } catch (err) {
          console.error("❌ Doctor import save error:", err);
          res.status(500).json({
            message: "Error saving doctors",
            error: err.message,
          });
        }
      })
      .on("error", (err) => {
        console.error("❌ CSV parse error (doctors):", err);
        res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("❌ Doctor import error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ===============================
 *      DOCTOR PROFILE APIs
 * =============================== */

// Get Doctor Profile by ID
router.get("/profile/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await DoctorModel.findById(id).select("-password -passwordPlain");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Format the response to match what frontend expects
    const profileData = {
      name: `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim(),
      email: doctor.email || "",
      avatar: doctor.avatar || "",
      phone: doctor.phone || "",
      gender: doctor.gender || "",
      dob: doctor.dob || "",
      addressLine1: doctor.addressLine1 || doctor.address || "",
      addressLine2: doctor.addressLine2 || "",
      city: doctor.city || "",
      postalCode: doctor.postalCode || "",
      qualification: doctor.qualification || "",
      specialization: doctor.specialization || "",
      experienceYears: doctor.experienceYears || doctor.experience || "",
    };

    res.json(profileData);
  } catch (err) {
    console.error("Error fetching doctor profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Doctor Profile by ID
router.put("/profile/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      avatar,
      phone,
      gender,
      dob,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      qualification,
      specialization,
      experienceYears,
    } = req.body;

    // Split name into firstName and lastName
    const nameParts = (name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const updateData = {
      firstName,
      lastName,
      avatar,
      phone,
      gender,
      dob,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      qualification,
      specialization,
      experienceYears,
      // Also update the address field (combined)
      address: [addressLine1, addressLine2, city, postalCode]
        .filter(Boolean)
        .join(", "),
    };

    const updatedDoctor = await DoctorModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password -passwordPlain");

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Return formatted response
    const profileData = {
      name: `${updatedDoctor.firstName || ""} ${updatedDoctor.lastName || ""}`.trim(),
      email: updatedDoctor.email || "",
      avatar: updatedDoctor.avatar || "",
      phone: updatedDoctor.phone || "",
      gender: updatedDoctor.gender || "",
      dob: updatedDoctor.dob || "",
      addressLine1: updatedDoctor.addressLine1 || "",
      addressLine2: updatedDoctor.addressLine2 || "",
      city: updatedDoctor.city || "",
      postalCode: updatedDoctor.postalCode || "",
      qualification: updatedDoctor.qualification || "",
      specialization: updatedDoctor.specialization || "",
      experienceYears: updatedDoctor.experienceYears || "",
    };

    res.json(profileData);
  } catch (err) {
    console.error("Error updating doctor profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
