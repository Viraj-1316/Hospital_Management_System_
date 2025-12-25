// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Receptionist = require("../models/Receptionist");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");

// Static admin credentials (simple built-in admin)
const ADMIN_EMAIL = "admin@onecare.com";
const ADMIN_PASSWORD = "admin123";

// Helper to check password for both hashed and plain text cases
async function checkPassword(inputPassword, storedPassword) {
  // Try bcrypt compare first
  try {
    const match = await bcrypt.compare(inputPassword, storedPassword);
    if (match) return true;
  } catch (err) {
    console.log("bcrypt compare error, will try plain compare");
  }

  // Fallback: plain string compare (for old records)
  if (inputPassword === storedPassword) {
    return true;
  }

  return false;
}

// Login route (admin, receptionist, patient, doctor)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN ATTEMPT:", email);

    // 1) Check static admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("ADMIN LOGIN SUCCESS");
      return res.json({
        id: "admin-id",
        name: "System Admin",
        email: ADMIN_EMAIL,
        role: "admin",
        profileCompleted: true,
      });
    }

    // 2) Check receptionist collection first
    const receptionist = await Receptionist.findOne({ email });

    if (receptionist) {
      console.log("FOUND IN RECEPTIONIST COLLECTION");

      const match = await checkPassword(password, receptionist.password);
      console.log("Receptionist password valid:", match);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        id: receptionist._id,
        email: receptionist.email,
        role: "receptionist",
        name: receptionist.name,
        mustChangePassword: receptionist.mustChangePassword,
        profileCompleted: true,
      });
    }

    // 3) Check Doctor collection
    const doctor = await DoctorModel.findOne({ email });
    if (doctor && doctor.password) {
      console.log("FOUND IN DOCTOR COLLECTION");
      const match = await checkPassword(password, doctor.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      return res.json({
        id: doctor._id,
        email: doctor.email,
        role: "doctor",
        name: `${doctor.firstName} ${doctor.lastName}`,
        mustChangePassword: doctor.mustChangePassword,
        profileCompleted: true,
      });
    }

    // 4) If not receptionist or doctor, check User collection (patients)
    const user = await User.findOne({ email });

    if (user) {
      console.log("FOUND IN USER COLLECTION:", user.role);

      const match = await checkPassword(password, user.password);
      console.log("User password valid:", match);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        profileCompleted: user.profileCompleted,
        mustChangePassword:
          typeof user.mustChangePassword === "boolean"
            ? user.mustChangePassword
            : false,
      });
    }

    console.log("NO USER FOUND — INVALID LOGIN");
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Signup route - supports Patient, Doctor, and Receptionist
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, role, hospitalId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedRole = (role || "patient").toLowerCase();

    // Check for existing email in all collections
    const existingUser = await User.findOne({ email });
    const existingDoctor = await DoctorModel.findOne({ email });
    const existingReceptionist = await Receptionist.findOne({ email });

    if (existingUser || existingDoctor || existingReceptionist) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Route to appropriate creation logic based on role
    if (normalizedRole === "doctor") {
      // Create Doctor record
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const newDoctor = await DoctorModel.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        passwordPlain: "", // Don't store plain password
        mustChangePassword: true, // Require password change on first login
        status: "Active",
        hospitalId: hospitalId || "",
      });

      console.log("DOCTOR SIGNUP SUCCESS:", email);

      return res.status(201).json({
        id: newDoctor._id,
        email: newDoctor.email,
        role: "doctor",
        name: `${firstName} ${lastName}`.trim(),
        phone: newDoctor.phone,
        mustChangePassword: true,
      });

    } else if (normalizedRole === "receptionist") {
      // Create Receptionist record
      const newReceptionist = await Receptionist.create({
        name,
        email,
        mobile: phone,
        password: hashedPassword,
        passwordPlain: "", // Don't store plain password
        mustChangePassword: true, // Require password change on first login
        status: true,
        hospitalId: hospitalId || "",
      });

      console.log("RECEPTIONIST SIGNUP SUCCESS:", email);

      return res.status(201).json({
        id: newReceptionist._id,
        email: newReceptionist.email,
        role: "receptionist",
        name: newReceptionist.name,
        phone: newReceptionist.mobile,
        mustChangePassword: true,
      });

    } else {
      // Default: Create Patient (existing logic)
      const newUser = await User.create({
        email,
        password: hashedPassword,
        role: "patient",
        name,
        phone,
        profileCompleted: false,
      });

      // Create basic patient record linked with this user
      await PatientModel.create({
        userId: newUser._id,
        firstName: name,
        email,
        phone,
      });

      console.log("PATIENT SIGNUP SUCCESS:", email);

      return res.status(201).json({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        profileCompleted: newUser.profileCompleted,
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Change password for receptionist on first login
router.put("/receptionists/change-password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const receptionist = await Receptionist.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        mustChangePassword: false,
      },
      { new: true }
    );

    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    return res.json({
      message: "Password updated successfully",
      id: receptionist._id,
      email: receptionist.email,
      role: "receptionist",
      name: receptionist.name,
      mustChangePassword: receptionist.mustChangePassword,
    });
  } catch (err) {
    console.error("Receptionist change password error:", err);
    res.status(500).json({
      message: "Server error while updating password",
    });
  }
});

// Change password for doctor on first login
router.put("/doctors/change-password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const doctor = await DoctorModel.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        mustChangePassword: false,
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.json({
      message: "Password updated successfully",
      id: doctor._id,
      email: doctor.email,
      role: "doctor",
      name: `${doctor.firstName} ${doctor.lastName}`,
      mustChangePassword: doctor.mustChangePassword,
    });
  } catch (err) {
    console.error("Doctor change password error:", err);
    res.status(500).json({
      message: "Server error while updating password",
    });
  }
});

// General Change Password (for any logged-in user: Admin, Doctor, Patient, Receptionist)
router.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    // 1. Check if it's the hardcoded admin
    if (email === ADMIN_EMAIL) {
      return res.status(403).json({
        message:
          "Default Admin password cannot be changed. Please contact support or migrate to a database admin.",
      });
    }

    // 2. Check Receptionist Collection
    const receptionist = await Receptionist.findOne({ email });
    if (receptionist) {
      const isMatch = await checkPassword(oldPassword, receptionist.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      receptionist.password = hashedPassword;
      receptionist.mustChangePassword = false; // Clear this flag if it was set
      await receptionist.save();

      return res.json({ message: "Password updated successfully" });
    }

    // 3. Check User Collection (Doctor, Patient)
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await checkPassword(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      // If user model has a flag, we could clear it here, but it's optional for general users
      if (user.mustChangePassword) {
        user.mustChangePassword = false;
      }
      await user.save();

      return res.json({ message: "Password updated successfully" });
      return res.json({ message: "Password updated successfully" });
    }

    // 4. Check Doctor Collection
    const doctor = await DoctorModel.findOne({ email });
    if (doctor) {
      const isMatch = await checkPassword(oldPassword, doctor.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      doctor.password = hashedPassword;
      doctor.mustChangePassword = false;
      await doctor.save();

      return res.json({ message: "Password updated successfully" });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

module.exports = router;
