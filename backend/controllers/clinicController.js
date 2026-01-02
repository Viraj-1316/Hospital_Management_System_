// controllers/clinicController.js

const Clinic = require("../models/Clinic");

// code for file uploads and CSV parsing
const fs = require("fs");
const csv = require("csv-parser");

// email section
// email section
const { sendEmail } = require("../utils/emailService");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateRandomPassword = require("../utils/generatePassword");
const { clinicAddedTemplate, credentialsTemplate } = require("../utils/emailTemplates");

// Helper: Extract Initials from Clinic Name
const extractInitials = (name) => {
  if (!name) return "XXX";

  // Remove special characters and keep only letters and spaces
  const cleanName = name.replace(/[^a-zA-Z ]/g, "").toUpperCase();

  // Split by words
  const words = cleanName.split(/\s+/).filter(Boolean);

  let initials = "";
  if (words.length === 1) {
    // Single word: take first 3 chars or fewer
    initials = words[0].substring(0, 3);
  } else {
    // Multiple words: take first char of each word, max 5 chars
    initials = words.map(w => w[0]).join("").substring(0, 5);
  }

  return initials || "XXX";
};

// Helper: Generate Sequential Hospital ID
const generateHospitalId = async (clinicName) => {
  const prefix = "OC";
  const initials = extractInitials(clinicName);
  const baseId = `${prefix}-${initials}`; // e.g., OC-CGH

  // Find the last clinic with this prefix using regex
  // Matches: OC-CGH-001, OC-CGH-002, etc.
  const regex = new RegExp(`^${baseId}-(\\d{3})$`);

  const lastClinic = await Clinic.findOne({ hospitalId: regex })
    .sort({ hospitalId: -1 }) // Sort DESC to get latest
    .select("hospitalId");

  let sequence = 1;
  if (lastClinic && lastClinic.hospitalId) {
    const parts = lastClinic.hospitalId.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  // Format: OC-CGH-001
  return `${baseId}-${sequence.toString().padStart(3, "0")}`;
};

// Create clinic  POST /api/clinics
exports.createClinic = async (req, res) => {
  try {
    const {
      name,
      email,
      contact,
      specialties,
      status,
      address,
      city,
      country,
      postalCode,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminContact,
      dob,
      gender,
    } = req.body;

    const clinicLogo = req.files?.clinicLogo?.[0]?.filename || null;
    const adminPhoto = req.files?.adminPhoto?.[0]?.filename || null;

    const parsedSpecialties = specialties ? JSON.parse(specialties) : [];


    // Generate unique Hospital ID (format: OC-INITIALS-SEQ)
    const hospitalId = await generateHospitalId(name);

    const clinic = new Clinic({
      hospitalId,
      name,
      email,
      contact,
      specialties: parsedSpecialties,
      status: status || "Active",
      clinicLogo,
      address: {
        full: address,
        city,
        country,
        postalCode,
      },
      admin: {
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        contact: adminContact,
        dob,
        gender,
        photo: adminPhoto,
      },
    });

    // 1️⃣ Save clinic in DB
    await clinic.save();

    // 2️⃣ Create User for Clinic Admin if not exists
    const targetEmail = adminEmail || email;
    let password = generateRandomPassword();

    if (targetEmail) {
      let user = await User.findOne({ email: targetEmail });
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          email: targetEmail,
          password: hashedPassword,
          role: "clinic_admin", // Using a specific role
          name: `${adminFirstName} ${adminLastName}`,
          clinicId: clinic._id,
          profileCompleted: true,
        });
        await user.save();
      } else {
        password = null; // Don't send password if we didn't generate it
      }
    }

    // 3️⃣ Send email with Hospital ID
    if (targetEmail) {
      const html = password
        ? credentialsTemplate({
          name: adminFirstName || "Admin",
          email: targetEmail,
          password: password,
          hospitalId: hospitalId
        })
        : clinicAddedTemplate({
          clinicName: name,
          contactName: adminFirstName || "there",
          hospitalId: hospitalId
        });

      sendEmail({
        to: targetEmail,
        subject: password ? "Your OneCare Credentials" : "Your Clinic has been added to OneCare",
        html,
      });
    } else {
      console.log("No email found for this clinic, skipping email send.");
    }

    // 4️⃣ Send response to frontend
    return res.status(201).json({
      success: true,
      message: "Clinic created successfully",
      clinic,
    });
  } catch (error) {
    console.error("ERROR CREATE CLINIC:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while creating clinic" });
  }
};


// Get all clinics  GET /api/clinics
exports.getClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    return res.json({ success: true, clinics });
  } catch (error) {
    console.error("ERROR GET CLINICS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching clinics" });
  }
};

// Get single clinic  GET /api/clinics/:id
exports.getClinicById = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }
    return res.json({ success: true, clinic });
  } catch (error) {
    console.error("ERROR GET CLINIC BY ID:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching clinic" });
  }
};

// Update clinic  PUT /api/clinics/:id
exports.updateClinic = async (req, res) => {
  try {
    const {
      name,
      email,
      contact,
      specialties,
      status,
      address,
      city,
      country,
      postalCode,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminContact,
      dob,
      gender,
    } = req.body;

    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }

    // files
    const clinicLogo = req.files?.clinicLogo?.[0]?.filename;
    const adminPhoto = req.files?.adminPhoto?.[0]?.filename;

    const parsedSpecialties = specialties ? JSON.parse(specialties) : [];

    clinic.name = name;
    clinic.email = email;
    clinic.contact = contact;
    clinic.specialties = parsedSpecialties;
    clinic.status = status || clinic.status;

    if (clinicLogo) clinic.clinicLogo = clinicLogo;

    clinic.address = {
      full: address,
      city,
      country,
      postalCode,
    };

    clinic.admin = {
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      contact: adminContact,
      dob,
      gender,
      photo: adminPhoto || clinic.admin.photo,
    };

    await clinic.save();

    return res.json({
      success: true,
      message: "Clinic updated successfully",
      clinic,
    });
  } catch (error) {
    console.error("ERROR UPDATE CLINIC:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while updating clinic" });
  }
};

// Delete clinic  DELETE /api/clinics/:id
exports.deleteClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }
    return res.json({ success: true, message: "Clinic deleted" });
  } catch (error) {
    console.error("ERROR DELETE CLINIC:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while deleting clinic" });
  }
};

// Resend credentials  POST /api/clinics/:id/resend-credentials
exports.resendCredentials = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const adminEmail = clinic.admin?.email || clinic.email;
    if (!adminEmail) {
      return res.status(400).json({ success: false, message: "No email associated with this clinic" });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find or Create User
    let user = await User.findOne({ email: adminEmail });
    if (user) {
      user.password = hashedPassword;
      // Ensure role is set if missing (optional)
      if (!user.role) user.role = "clinic_admin";
      await user.save();
    } else {
      user = new User({
        email: adminEmail,
        password: hashedPassword,
        role: "clinic_admin",
        name: `${clinic.admin?.firstName || "Clinic"} ${clinic.admin?.lastName || "Admin"}`,
        profileCompleted: true,
      });
      await user.save();
    }

    // Send Email
    const html = credentialsTemplate({
      name: clinic.admin?.firstName || "Admin",
      email: adminEmail,
      password: newPassword,
    });

    await sendEmail({
      to: adminEmail,
      subject: "Your OneCare Credentials",
      html,
    });

    return res.json({
      success: true,
      message: `Credentials resent to ${adminEmail}`,
    });
  } catch (error) {
    console.error("ERROR RESEND CREDENTIALS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend credentials" });
  }
};


exports.importClinics = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        let created = 0;
        let failed = 0;

        for (const row of rows) {
          try {
            const specialties = row.specialties
              ? row.specialties
                .split(/[|,]/)
                .map((s) => s.trim())
                .filter(Boolean)
              : [];

            // Generate unique Hospital ID for each imported clinic
            const hospitalId = await generateHospitalId(row.name || "Unknown Clinic");

            const clinic = new Clinic({
              hospitalId,
              name: row.name,
              email: row.email,
              contact: row.contact,
              specialties,
              status: row.status || "Active",
              address: {
                full: row.address,
                city: row.city,
                country: row.country,
                postalCode: row.postalCode,
              },
              admin: {
                firstName: row.adminFirstName,
                lastName: row.adminLastName,
                email: row.adminEmail,
                contact: row.adminContact,
                dob: row.dob,
                gender: row.gender,
              },
            });

            await clinic.save();
            created++;
          } catch (err) {
            console.error("Row import failed:", err);
            failed++;
          }
        }

        return res.json({
          success: true,
          message: "Import completed",
          created,
          failed,
          total: rows.length,
        });
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to parse CSV" });
      });
  } catch (error) {
    console.error("ERROR IMPORT CLINICS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while importing clinics" });
  }
};
