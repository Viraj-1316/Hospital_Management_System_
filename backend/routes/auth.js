// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// JWT Auth Middleware
const { generateToken } = require("../middleware/auth");

// Validation Middleware
const { loginValidation, signupValidation, changePasswordValidation } = require("../middleware/validation");

// Email Service
const { sendEmail } = require("../utils/emailService");

// Models
const User = require("../models/User");
const Receptionist = require("../models/Receptionist");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const Admin = require("../models/Admin");

// Helper to check password for both hashed and plain text cases
async function checkPassword(inputPassword, storedPassword) {
  // Try bcrypt compare first
  try {
    const match = await bcrypt.compare(inputPassword, storedPassword);
    if (match) return true;
  } catch (err) {
    // bcrypt compare failed, try plain compare
  }

  // Fallback: plain string compare (for old records)
  if (inputPassword === storedPassword) {
    return true;
  }

  return false;
}

// Login route (admin, receptionist, patient, doctor)
router.post("/login", loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check Admin collection first (proper MongoDB lookup)
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const adminPayload = {
        id: admin._id, // Real MongoDB ObjectId
        name: admin.name,
        email: admin.email,
        role: "admin",
        profileCompleted: true,
      };

      const token = generateToken(adminPayload);

      return res.json({
        ...adminPayload,
        token,
      });
    }

    // 2) Check receptionist collection first
    const receptionist = await Receptionist.findOne({ email });

    if (receptionist) {
      const match = await checkPassword(password, receptionist.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const receptionistPayload = {
        id: receptionist._id,
        email: receptionist.email,
        role: "receptionist",
        name: receptionist.name,
        mustChangePassword: receptionist.mustChangePassword,
        profileCompleted: true,
      };

      const token = generateToken(receptionistPayload);

      return res.json({
        ...receptionistPayload,
        token,
      });
    }

    // 3) Check Doctor collection
    const doctor = await DoctorModel.findOne({ email });
    if (doctor && doctor.password) {
      const match = await checkPassword(password, doctor.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const doctorPayload = {
        id: doctor._id,
        email: doctor.email,
        role: "doctor",
        name: `${doctor.firstName} ${doctor.lastName}`,
        mustChangePassword: doctor.mustChangePassword,
        profileCompleted: true,
      };

      const token = generateToken(doctorPayload);

      return res.json({
        ...doctorPayload,
        token,
      });
    }

    // 4) If not receptionist or doctor, check User collection (patients)
    const user = await User.findOne({ email });

    if (user) {
      const match = await checkPassword(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const userPayload = {
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
      };

      const token = generateToken(userPayload);

      return res.json({
        ...userPayload,
        token,
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Signup route - supports Patient, Doctor, and Receptionist
router.post("/signup", signupValidation, async (req, res) => {
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
        mustChangePassword: true,
        status: "Active",
        hospitalId: hospitalId || "",
      });

      const doctorPayload = {
        id: newDoctor._id,
        email: newDoctor.email,
        role: "doctor",
        name: `${firstName} ${lastName}`.trim(),
        phone: newDoctor.phone,
        mustChangePassword: true,
      };

      const token = generateToken(doctorPayload);

      return res.status(201).json({
        ...doctorPayload,
        token,
      });

    } else if (normalizedRole === "receptionist") {
      // Create Receptionist record
      const newReceptionist = await Receptionist.create({
        name,
        email,
        mobile: phone,
        password: hashedPassword,
        mustChangePassword: true,
        status: true,
        hospitalId: hospitalId || "",
      });

      const receptionistPayload = {
        id: newReceptionist._id,
        email: newReceptionist.email,
        role: "receptionist",
        name: newReceptionist.name,
        phone: newReceptionist.mobile,
        mustChangePassword: true,
      };

      const token = generateToken(receptionistPayload);

      return res.status(201).json({
        ...receptionistPayload,
        token,
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

      const patientPayload = {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        profileCompleted: newUser.profileCompleted,
      };

      const token = generateToken(patientPayload);

      return res.status(201).json({
        ...patientPayload,
        token,
      });
    }
  } catch (err) {
    console.error("Signup error:", err.message);
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

    const payload = {
      id: receptionist._id,
      email: receptionist.email,
      role: "receptionist",
      name: receptionist.name,
      mustChangePassword: receptionist.mustChangePassword,
    };

    const token = generateToken(payload);

    return res.json({
      message: "Password updated successfully",
      ...payload,
      token,
    });
  } catch (err) {
    console.error("Receptionist change password error:", err.message);
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

    const payload = {
      id: doctor._id,
      email: doctor.email,
      role: "doctor",
      name: `${doctor.firstName} ${doctor.lastName}`,
      mustChangePassword: doctor.mustChangePassword,
    };

    const token = generateToken(payload);

    return res.json({
      message: "Password updated successfully",
      ...payload,
      token,
    });
  } catch (err) {
    console.error("Doctor change password error:", err.message);
    res.status(500).json({
      message: "Server error while updating password",
    });
  }
});

// General Change Password (for any logged-in user: Admin, Doctor, Patient, Receptionist)
router.post("/change-password", changePasswordValidation, async (req, res) => {
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

    // 1. Check Admin Collection first
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await admin.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
      await admin.save();

      return res.json({ message: "Password updated successfully" });
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
      receptionist.mustChangePassword = false;
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
      if (user.mustChangePassword) {
        user.mustChangePassword = false;
      }
      await user.save();

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
    console.error("Change password error:", err.message);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

// ==========================================
// Forgot Password - Request Password Reset
// ==========================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email in User collection
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether email exists for security
      return res.json({ message: "If this email exists, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL (frontend route)
    const frontendUrl = process.env.FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password for your OneCare account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated email from OneCare. Please do not reply.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Password Reset Request | OneCare",
      html,
    });

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Server error while processing request" });
  }
});

// ==========================================
// Reset Password - Set New Password with Token
// ==========================================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password and clear reset fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully. You can now login with your new password." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ message: "Server error while resetting password" });
  }
});

module.exports = router;

