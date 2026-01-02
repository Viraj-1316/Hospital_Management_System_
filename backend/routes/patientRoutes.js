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

// Helper to merge User and Patient data
const mergePatientUser = (patient) => {
  if (!patient || !patient.userId) return patient;
  const user = patient.userId;
  // Handle case where populate wasn't called or userId is raw ID
  if (!user.email && !user.name) return patient;

  // Explicitly selecting fields to prevent data leaks (internal fields, passwords, etc.)
  const patientObj = patient.toObject();

  return {
    _id: patientObj._id,
    userId: user._id, // Only return ID of the user link
    // Patient Data (Merged with User Data where applicable)
    firstName: user.name ? user.name.split(" ")[0] : (patientObj.firstName || ""),
    lastName: user.name ? user.name.split(" ").slice(1).join(" ") : (patientObj.lastName || ""),
    name: user.name || `${patientObj.firstName || ""} ${patientObj.lastName || ""}`.trim(),
    email: user.email || patientObj.email || "",
    phone: user.phone || patientObj.phone || "",
    dob: user.dob || patientObj.dob,
    gender: user.gender || patientObj.gender,
    bloodGroup: user.bloodGroup || patientObj.bloodGroup,
    address: user.addressLine1 || patientObj.address || "",
    city: user.city || patientObj.city || "",
    country: user.country || patientObj.country || "",
    postalCode: user.postalCode || patientObj.postalCode || "",
    // Metadata
    clinicId: patientObj.clinicId,
    clinic: patientObj.clinic,
    isActive: patientObj.isActive,
    createdAt: patientObj.createdAt
  };
};

// GET patient by userId (returns patient doc if exists)
router.get("/by-user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const patient = await PatientModel.findOne({ userId }).populate("userId");

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    return res.json(mergePatientUser(patient));
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
      { $set: { ...updateData, userId } }, // Mongoose will ignore fields not in schema
      { new: true, upsert: true }
    );

    // Sync demographic fields to User model
    const userUpdate = {};
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.gender) userUpdate.gender = updateData.gender;
    if (updateData.dob) userUpdate.dob = updateData.dob;
    if (updateData.bloodGroup) userUpdate.bloodGroup = updateData.bloodGroup;
    if (updateData.address) userUpdate.addressLine1 = updateData.address;
    if (updateData.city) userUpdate.city = updateData.city;
    if (updateData.country) userUpdate.country = updateData.country;
    if (updateData.country) userUpdate.country = updateData.country;
    if (updateData.postalCode) userUpdate.postalCode = updateData.postalCode;

    // Sync clinicId if provided (Critical for Google Auth users)
    if (updateData.clinicId) {
      userUpdate.clinicId = updateData.clinicId;
      // Also update patient record to match
      await PatientModel.findOneAndUpdate({ userId }, { $set: { clinicId: updateData.clinicId } });
    }

    if (updateData.firstName || updateData.lastName) {
      const currentName = updateData.firstName + " " + updateData.lastName;
      // Or handle split if provided separately. 
      // If one is missing, we might want to fetch user, but usually formatted form sends both.
      if (updateData.firstName && updateData.lastName) {
        userUpdate.name = `${updateData.firstName} ${updateData.lastName}`.trim();
      } else if (updateData.name) {
        userUpdate.name = updateData.name;
      }
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate });
    }

    // Return merged result so frontend sees the update immediately
    const updatedPatient = await PatientModel.findOne({ userId }).populate("userId");
    return res.json(mergePatientUser(updatedPatient));
  } catch (err) {
    console.error("Error updating/creating patient:", err);
    return res.status(500).json({ message: "Failed to update patient profile" });
  }
});

// Get all patients
router.get("/", verifyToken, async (req, res) => {
  try {
    const query = {};

    // Verify user from DB to ensure fresh clinicId (bypassing potentially stale token)
    let currentUser = null;
    let safeClinicId = null;

    // 1. Resolve User based on Role
    if (req.user.role === 'admin') {
      currentUser = await require("../models/Admin").findById(req.user.id);
    } else {
      currentUser = await require("../models/User").findById(req.user.id);
    }

    // 2. Determine Safe Clinic ID
    if (currentUser) {
      safeClinicId = currentUser.clinicId;
    } else {
      // Fallback for Doctor/Receptionist who might not be in 'User' collection
      safeClinicId = req.user.clinicId || null;
    }

    // 3. Determine Effective Role
    const effectiveRole = currentUser ? currentUser.role : req.user.role;

    console.log("GET /patients - Effective Role:", effectiveRole);
    console.log("GET /patients - Safe ClinicId:", safeClinicId);

    if (effectiveRole === 'admin') {
      // Global View for Super Admin
      console.log("GET /patients - Global View (Admin)");
    } else if (safeClinicId) {
      // Scoped View for Clinic Admin / Doctor / Staff
      query.clinicId = safeClinicId;
      console.log("GET /patients - Filtering by SafeClinicId:", query.clinicId);
    } else {
      // SAFETY FALLBACK: Non-admin user with NO clinicId should see NOTHING.
      console.log("GET /patients - BLOCKED: Non-admin user with no Clinic ID triggered safety fallback.");
      return res.json([]); // Return empty list instead of full leak
    }

    const patients = await PatientModel.find(query).populate("userId");
    const mergedPatients = patients.map(p => mergePatientUser(p));
    res.json(mergedPatients);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Resend credentials
router.post("/:id/resend-credentials", verifyToken, async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id).populate("userId");
    if (!patient) {
      console.log("Resend Creds: Patient not found", req.params.id);
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log("Resend Creds: Found patient:", patient._id);
    console.log("Resend Creds: Linked userId:", patient.userId);

    const email = patient.userId ? patient.userId.email : patient.email;
    console.log("Resend Creds: Resolved email:", email);

    if (!email) {
      return res.status(400).json({ message: "Patient has no email address linked" });
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
        name: patient.userId ? patient.userId.name : `${patient.firstName} ${patient.lastName}`,
        profileCompleted: true,
      });
      await user.save();

      if (!patient.userId) {
        patient.userId = user._id;
        await patient.save();
      }
    }

    const patientName = patient.userId ? patient.userId.name : `${patient.firstName} ${patient.lastName}`;

    const html = credentialsTemplate({
      name: patientName,
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
    const patient = await PatientModel.findById(req.params.id).populate("userId");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(mergePatientUser(patient));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete Patient
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Delete linked User account first
    if (patient.userId) {
      await User.findByIdAndDelete(patient.userId);
    }

    // Delete Patient record
    await PatientModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Patient and associated user account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create patient (POST)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, gender, dob, bloodGroup, address, city, country, postalCode, ...patientData } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if doesn't exist
      const password = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      const name = `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0];

      user = await User.create({
        email,
        password: hashedPassword, // Auto-generated
        role: "patient",
        name,
        phone,
        gender,
        dob,
        bloodGroup,
        addressLine1: address,
        city,
        country,
        postalCode
      });

      // Ideally send email with credentials here
      // await sendEmail(...) 
    }

    // Log to debug isolation
    console.log("Create Patient - User:", req.user._id, "Role:", req.user.role);
    console.log("Create Patient - Token ClinicId:", req.user.clinicId);
    console.log("Create Patient - Body Clinic:", req.body.clinic);

    // Fetch fresh user to guarantee clinicId accuracy
    const creatorUser = await User.findById(req.user.id);
    let guaranteedClinicId = creatorUser ? creatorUser.clinicId : null;

    // Fallback: If no ID found, try to look up by name in Body
    if (!guaranteedClinicId && !req.body.clinicId && req.body.clinic) {
      const foundClinic = await Clinic.findOne({ name: req.body.clinic });
      if (foundClinic) {
        guaranteedClinicId = foundClinic._id;
        console.log("Create Patient - Fallback: Found ClinicId by Name:", guaranteedClinicId);
      }
    }

    // Create Patient linked to User
    const finalClinicId = req.user.role === 'admin'
      ? (req.body.clinicId || guaranteedClinicId)
      : (guaranteedClinicId || req.user.clinicId);

    const newPatient = await PatientModel.create({
      ...patientData,
      userId: user._id,
      clinic: req.body.clinic,
      clinicId: finalClinicId
    });

    const populated = await PatientModel.findById(newPatient._id).populate("userId");
    res.json({ message: "Patient added", data: mergePatientUser(populated) });

  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update patient (PUT for full update)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, gender, dob, bloodGroup, address, city, country, postalCode, ...patientData } = req.body;

    const patient = await PatientModel.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Update Patient specific fields
    const updatedPatient = await PatientModel.findByIdAndUpdate(id, patientData, {
      new: true,
      runValidators: true,
    }); // This ignores User fields if strict mode is on

    // Update User fields
    if (patient.userId) {
      const userUpdate = {};
      if (firstName || lastName) userUpdate.name = `${firstName || ""} ${lastName || ""}`.trim();
      if (phone) userUpdate.phone = phone;
      if (gender) userUpdate.gender = gender;
      if (dob) userUpdate.dob = dob;
      if (bloodGroup) userUpdate.bloodGroup = bloodGroup;
      if (address) userUpdate.addressLine1 = address;
      if (city) userUpdate.city = city;
      if (country) userUpdate.country = country;
      if (postalCode) userUpdate.postalCode = postalCode;

      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(patient.userId, userUpdate);
      }
    }

    const finalPatient = await PatientModel.findById(id).populate("userId");
    return res.json({ success: true, patient: mergePatientUser(finalPatient) });
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
    }).populate("userId");

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: mergePatientUser(updated) });
  } catch (err) {
    console.error("PATCH /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;