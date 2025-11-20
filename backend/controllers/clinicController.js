// controllers/clinicController.js
const Clinic = require("../models/Clinic");
// code for file uploads and CSV parsing
const fs = require("fs");
const csv = require("csv-parser");
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

    const clinic = new Clinic({
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

    await clinic.save();

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
    // In real app: send email / SMS here.
    console.log("Resend credentials for clinic:", req.params.id);
    return res.json({
      success: true,
      message: "Credentials resent (mock).",
    });
  } catch (error) {
    console.error("ERROR RESEND CREDENTIALS:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend credentials" });
  }
};


// Import clinics from CSV  POST /api/clinics/import
// Expected CSV headers:
// name,email,contact,status,specialties,address,city,country,postalCode,
// adminFirstName,adminLastName,adminEmail,adminContact,dob,gender
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

            const clinic = new Clinic({
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
