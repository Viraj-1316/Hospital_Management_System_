// controllers/receptionistController.js

const Receptionist = require("../models/Receptionist");
const Clinic = require("../models/Clinic");
const bcrypt = require("bcryptjs");
const generateRandomPassword = require("../utils/generatePassword");
const sendReceptionistWelcomeEmail = require("../utils/sendReceptionistWelcomeEmail");
const csv = require("csvtojson");

// ------------------------------------------------------------
// ADD Receptionist
// ------------------------------------------------------------
exports.addReceptionist = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      clinicIds,
      status,
      dob,
      gender,
      country,
      city,
      postalCode,
    } = req.body;

    // Check duplicate email
    const existing = await Receptionist.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Generate password
    const plainPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newRecp = new Receptionist({
      name,
      email,
      mobile,
      address,
      address,
      // Isolation Logic:
      // If Admin: Use provided clinicIds (or empty)
      // If Clinic Admin: Force [req.user.clinicId]
      clinicIds: req.user.role === 'admin' ? clinicIds : [req.user.clinicId],
      status,
      password: hashedPassword,
      passwordPlain: plainPassword, // 🔑 store plain for resend
      dob,
      gender,
      country,
      city,
      postalCode,
    });

    await newRecp.save();

    // Send Welcome Email with generated password
    await sendReceptionistWelcomeEmail(email, name, email, plainPassword);

    res.json({
      message: "Receptionist added successfully",
      data: newRecp,
    });
  } catch (error) {
    console.error("Add Receptionist Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// LIST Receptionists
// ------------------------------------------------------------
exports.getReceptionists = async (req, res) => {
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
    const query = {};

    if (effectiveRole === "admin") {
      // Global View
    } else if (safeClinicId) {
      // Receptionist has clinicIds array. Matches if array contains safeClinicId.
      query.clinicIds = safeClinicId;
    } else {
      return res.json({ data: [] });
    }

    const receptionist = await Receptionist.find(query)
      .populate("clinicIds", "name")
      .sort({ createdAt: -1 });

    res.json({ data: receptionist });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// GET Single Receptionist
// ------------------------------------------------------------
exports.getReceptionistById = async (req, res) => {
  try {
    const recp = await Receptionist.findById(req.params.id).populate(
      "clinicIds",
      "name"
    );

    if (!recp) return res.status(404).json({ message: "Not found" });

    res.json({ data: recp });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// UPDATE Receptionist
// ------------------------------------------------------------
exports.updateReceptionist = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "mobile",
      "address",
      "clinicIds",
      "status",
      "avatar",
      "gender",
      "dob",
      "addressLine1",
      "addressLine2",
      "city",
      "country",
      "postalCode",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updated = await Receptionist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Updated successfully", data: updated });
  } catch (error) {
    console.error("Update Receptionist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ------------------------------------------------------------
// DELETE Receptionist
// ------------------------------------------------------------
exports.deleteReceptionist = async (req, res) => {
  try {
    await Receptionist.findByIdAndDelete(req.params.id);
    res.json({ message: "Receptionist deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// TOGGLE STATUS
// ------------------------------------------------------------
exports.toggleReceptionistStatus = async (req, res) => {
  try {
    const recp = await Receptionist.findById(req.params.id);
    if (!recp) return res.status(404).json({ message: "Not found" });

    recp.status = !recp.status;
    await recp.save();

    res.json({
      message: "Status updated",
      status: recp.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// RESEND CREDENTIALS  → send SAME password again
// ------------------------------------------------------------
exports.resendCredentials = async (req, res) => {
  try {
    const recp = await Receptionist.findById(req.params.id);
    if (!recp) return res.status(404).json({ message: "Not found" });

    // If passwordPlain not available (old records)
    if (!recp.passwordPlain) {
      return res.status(400).json({
        message:
          "Original password not available to resend. Please reset password manually.",
      });
    }

    await sendReceptionistWelcomeEmail(
      recp.email,
      recp.name,
      recp.email,
      recp.passwordPlain
    );

    res.json({ message: "Credentials resent successfully" });
  } catch (error) {
    console.error("Resend Credentials Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// IMPORT CSV
// ------------------------------------------------------------
exports.importReceptionists = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No CSV file uploaded" });

    const jsonArray = await csv().fromFile(req.file.path);

    for (let row of jsonArray) {
      const plainPassword = generateRandomPassword(10);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const clinicNames = row.clinics?.split(",") || [];

      const clinicIds = await Clinic.find({
        name: { $in: clinicNames.map((c) => c.trim()) },
      }).select("_id");

      await Receptionist.create({
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        address: row.address,
        clinicIds: clinicIds.map((c) => c._id),
        status: row.status?.toLowerCase() === "active",
        password: hashedPassword,
        passwordPlain: plainPassword, // 🔑 store for resend
        dob: row.dob || "",
        gender: row.gender || "",
        country: row.country || "",
        city: row.city || "",
        postalCode: row.postalCode || "",
      });
    }

    res.json({ message: "Import completed successfully" });
  } catch (error) {
    console.error("Import Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Change password for receptionist (first-time login)
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const id = req.params.id;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await Receptionist.findByIdAndUpdate(
      id,
      {
        password: hashed,
        mustChangePassword: false, // so next login goes directly to dashboard
        passwordPlain: "", // optional: clear plain password for security
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Server error during password change" });
  }
};
