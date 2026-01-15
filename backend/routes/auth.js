// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Auth Middleware
const { generateToken } = require("../middleware/auth");

// Validation Middleware
const { loginValidation, signupValidation, changePasswordValidation } = require("../middleware/validation");

// Email Service
const { sendEmail } = require("../utils/emailService");

// Logger
const logger = require("../utils/logger");

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

// Google Login Route (Patients Only)
router.post("/google", async (req, res) => {
  try {
    const { token, clinicId } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify Google Token (Access Token flow)
    client.setCredentials({ access_token: token });

    const userinfo = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { name, email, picture, sub: googleId } = userinfo.data;

    logger.debug("Google Login Attempt", { email });

    // Check if user exists in other roles (Doctor, Receptionist, Admin) - RESTRICT ACCESS
    const existingDoctor = await DoctorModel.findOne({ email });
    const existingReceptionist = await Receptionist.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingDoctor || existingReceptionist || existingAdmin) {
      logger.warn("Google login blocked for non-patient role", { email });
      return res.status(403).json({
        message: "Google Login is restricted to Patients only. Please use your email and password to log in."
      });
    }

    // Check User collection (Patients)
    let user = await User.findOne({ email });

    if (!user) {
      // Create new patient user
      logger.info("Creating new user from Google Login", { email });

      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        name,
        password: hashedPassword,
        role: "patient",
        profileCompleted: false,
        googleId: googleId,
        avatar: picture,
        clinicId: clinicId || null // Save clinicId if provided
      });

      // Create linked Patient model
      await PatientModel.create({
        userId: user._id,
        clinicId: clinicId || null // Save clinicId if provided
      });
    } else {
      // Ensure existing user is a patient
      if (user.role !== 'patient') {
        return res.status(403).json({
          message: "Account exists but is not a Patient account. Google Login is for Patients only."
        });
      }

      let userUpdated = false;
      // Update googleId if not present (linking existing account)
      if (!user.googleId) {
        user.googleId = googleId;
        userUpdated = true;
      }

      // Update clinicId if missing in User profile and provided in request
      if (!user.clinicId && clinicId) {
        user.clinicId = clinicId;
        userUpdated = true;
      }

      if (userUpdated) await user.save();
    }

    // Generate JWT
    const userPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      profileCompleted: user.profileCompleted,
      clinicId: user.clinicId, // Include clinicId in token payload
      googleId: user.googleId // Include googleId to identify Google login users
    };

    const jwtToken = generateToken(userPayload);

    return res.json({
      ...userPayload,
      token: jwtToken,
    });

  } catch (err) {
    logger.error("Google Login Error", { error: err.message });
    res.status(500).json({ message: "Google authentication failed" });
  }
});

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
        clinicId: null, // Global admin has no specific clinic
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

      // Check approval status for self-registered receptionists
      if (receptionist.approvalStatus === "pending") {
        return res.status(403).json({
          message: "Your registration is pending approval from the hospital admin. You will be able to login once approved.",
          approvalStatus: "pending"
        });
      }
      if (receptionist.approvalStatus === "rejected") {
        return res.status(403).json({
          message: "Your registration request has been rejected. Please contact the hospital admin.",
          approvalStatus: "rejected"
        });
      }

      // Fetch clinic name for sidebar
      const Clinic = require("../models/Clinic");
      let clinicName = "";
      if (receptionist.clinicIds && receptionist.clinicIds.length > 0) {
        const clinic = await Clinic.findById(receptionist.clinicIds[0]);
        if (clinic) clinicName = clinic.name;
      }

      const receptionistPayload = {
        id: receptionist._id,
        email: receptionist.email,
        role: "receptionist",
        name: receptionist.name,
        mustChangePassword: receptionist.mustChangePassword,
        profileCompleted: true,
        clinicId: receptionist.clinicIds?.[0], // Default to first clinic
        clinicName, // Include clinic name
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

      // Check approval status for self-registered doctors
      if (doctor.approvalStatus === "pending") {
        return res.status(403).json({
          message: "Your registration is pending approval from the hospital admin. You will be able to login once approved.",
          approvalStatus: "pending"
        });
      }
      if (doctor.approvalStatus === "rejected") {
        return res.status(403).json({
          message: "Your registration request has been rejected. Please contact the hospital admin.",
          approvalStatus: "rejected"
        });
      }

      // Fetch clinic name for sidebar
      const Clinic = require("../models/Clinic");
      let clinicName = "";
      if (doctor.clinicId) {
        const clinic = await Clinic.findById(doctor.clinicId);
        if (clinic) clinicName = clinic.name;
      }

      const doctorPayload = {
        id: doctor._id,
        email: doctor.email,
        role: "doctor",
        name: `${doctor.firstName} ${doctor.lastName}`,
        mustChangePassword: doctor.mustChangePassword,
        profileCompleted: true,
        clinicId: doctor.clinicId,
        clinicName, // Include clinic name
      };

      const token = generateToken(doctorPayload);

      return res.json({
        ...doctorPayload,
        token,
      });
    }

    // 4) If not receptionist or doctor, check User collection (patients, clinic_admin)
    logger.debug("Checking User collection for login");
    const user = await User.findOne({ email });

    if (user) {
      // User found, verify password (no logging of match result for security)
      logger.debug("Login attempt for user", { userId: user._id.toString(), role: user.role });
      const match = await checkPassword(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Fetch clinic details for clinic_admin users
      const Clinic = require("../models/Clinic");
      let clinicName = "";
      let clinicLogo = "";
      let clinicId = user.clinicId;

      if (user.role === "clinic_admin") {
        // For clinic_admin, find clinic by admin.email matching user's email
        const clinic = await Clinic.findOne({ "admin.email": user.email });
        if (clinic) {
          clinicName = clinic.name || "";
          clinicLogo = clinic.clinicLogo || "";
          clinicId = clinic._id; // Use clinic's _id as clinicId
        }
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
        clinicId: clinicId,
        clinicName: clinicName, // Include clinic name for sidebar
        clinicLogo: clinicLogo, // Include clinic logo for sidebar
      };

      const token = generateToken(userPayload);

      return res.json({
        ...userPayload,
        token,
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    logger.error("Login error", { error: err.message });
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
      // Validate hospitalId is provided for Doctor signup
      if (!hospitalId) {
        return res.status(400).json({ message: "Hospital ID is required for doctor registration" });
      }

      // Find the clinic by hospitalId (ObjectId or String)
      const Clinic = require("../models/Clinic");
      let clinic;

      // Check if hospitalId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        clinic = await Clinic.findById(hospitalId);
      }

      // If not found by ID or not an ObjectId, try finding by string hospitalId
      if (!clinic) {
        clinic = await Clinic.findOne({ hospitalId: hospitalId });
      }

      if (!clinic) {
        return res.status(400).json({ message: "Invalid Hospital ID. Please check with your clinic admin." });
      }

      // Create Doctor record with pending approval
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
        clinicId: clinic._id, // Link to clinic via ObjectId
        approvalStatus: "pending", // Require admin approval
      });

      // Send notification email to hospital admin
      const adminEmail = clinic.admin?.email || clinic.email;
      if (adminEmail) {
        const { staffSignupRequestTemplate } = require("../utils/emailTemplates");
        sendEmail({
          to: adminEmail,
          subject: "New Doctor Registration Request - OneCare",
          html: staffSignupRequestTemplate({
            staffName: name,
            staffEmail: email,
            staffRole: "Doctor",
            clinicName: clinic.name,
            hospitalId: clinic.hospitalId,
          }),
        });
      }

      // Return success WITHOUT token (pending approval)
      return res.status(201).json({
        success: true,
        message: "Your registration request has been sent to the hospital admin. You will be able to login once approved.",
        approvalStatus: "pending",
      });

    } else if (normalizedRole === "receptionist") {
      // Validate hospitalId is provided for Staff signup
      if (!hospitalId) {
        return res.status(400).json({ message: "Hospital ID is required for staff registration" });
      }

      // Find the clinic by _id or hospitalId
      const Clinic = require("../models/Clinic");
      let clinic;

      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        clinic = await Clinic.findById(hospitalId);
      }

      if (!clinic) {
        clinic = await Clinic.findOne({ hospitalId: hospitalId });
      }

      if (!clinic) {
        return res.status(400).json({ message: "Invalid Clinic selected. Please check with your clinic admin." });
      }

      // Create Receptionist record with pending approval
      const newReceptionist = await Receptionist.create({
        name,
        email,
        mobile: phone,
        password: hashedPassword,
        mustChangePassword: true,
        status: true,
        clinicIds: [clinic._id], // Link to clinic
        approvalStatus: "pending", // Require admin approval
      });

      // Send notification email to hospital admin
      const adminEmail = clinic.admin?.email || clinic.email;
      if (adminEmail) {
        const { staffSignupRequestTemplate } = require("../utils/emailTemplates");
        sendEmail({
          to: adminEmail,
          subject: "New Staff Registration Request - OneCare",
          html: staffSignupRequestTemplate({
            staffName: name,
            staffEmail: email,
            staffRole: "Staff/Receptionist",
            clinicName: clinic.name,
            hospitalId: clinic.hospitalId,
          }),
        });
      }

      // Return success WITHOUT token (pending approval)
      return res.status(201).json({
        success: true,
        message: "Your registration request has been sent to the hospital admin. You will be able to login once approved.",
        approvalStatus: "pending",
      });

    } else {
      // Default: Create Patient (existing logic)
      const newUser = await User.create({
        email,
        password: hashedPassword,
        role: "patient",
        name,
        phone,
        clinicId: hospitalId, // Save the selected clinic info
        profileCompleted: false,
      });

      // Create basic patient record linked with this user
      await PatientModel.create({
        userId: newUser._id,
        clinicId: hospitalId, // Save the selected clinic info
        // Removed redundant fields: firstName, email, phone. Now only linking userId.
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
    logger.error("Signup error", { error: err.message });
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

// Set Password for Google Login Users (who don't have a known password)
// Requires authentication to prevent unauthorized password setting
router.post("/set-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Verify authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Ensure the logged-in user is setting their own password
    if (decoded.email !== email) {
      return res.status(403).json({ message: "You can only set your own password" });
    }

    // Only allow this for Google login users in User collection
    // Use decoded.id from token for secure user lookup
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Double-check email matches (additional security)
    if (user.email !== email) {
      return res.status(403).json({ message: "Email mismatch" });
    }

    // Verify user has googleId (Google login user)
    if (!user.googleId) {
      return res.status(400).json({
        message: "This feature is only available for Google login users. Please use the regular change password form."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password set successfully. You can now login with email and password." });
  } catch (err) {
    console.error("Set password error:", err.message);
    res.status(500).json({ message: "Server error while setting password" });
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
// ==========================================
// Admin-Only Login (Super Admin and Clinic Admin)
// ==========================================
router.post("/admin-login", loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check Admin collection first (Super Admin)
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const adminPayload = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
        profileCompleted: true,
        clinicId: null,
      };

      const token = generateToken(adminPayload);
      return res.json({ ...adminPayload, token });
    }

    // 2) Check User collection for clinic_admin
    const user = await User.findOne({ email, role: "clinic_admin" });
    if (user) {
      const match = await checkPassword(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Fetch clinic details
      const Clinic = require("../models/Clinic");
      const clinic = await Clinic.findOne({ "admin.email": user.email });
      
      const userPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
        clinicId: clinic?._id || null,
        clinicName: clinic?.name || "",
        clinicLogo: clinic?.clinicLogo || "",
      };

      const token = generateToken(userPayload);
      return res.json({ ...userPayload, token });
    }

    // Not an admin or clinic_admin
    return res.status(403).json({ 
      message: "This login is for administrators only. Please use your clinic's login page.",
      redirectToClinicFinder: true
    });
  } catch (err) {
    logger.error("Admin login error", { error: err.message });
    res.status(500).json({ message: "Server error during login" });
  }
});

// ==========================================
// Clinic-Specific Login (Patient, Doctor, Staff)
// ==========================================
router.post("/clinic-login/:subdomain", loginValidation, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { email, password, role: requestedRole } = req.body;

    // Validate clinic exists
    const Clinic = require("../models/Clinic");
    const clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
    
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const clinicId = clinic._id;

    // Check based on requested role
    if (requestedRole === "patient") {
      const user = await User.findOne({ email, role: "patient" });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify patient belongs to this clinic (or has no clinic set)
      if (user.clinicId && user.clinicId.toString() !== clinicId.toString()) {
        return res.status(403).json({ message: "This account is not registered with this clinic" });
      }

      const match = await checkPassword(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update clinicId if not set
      if (!user.clinicId) {
        user.clinicId = clinicId;
        await user.save();
      }

      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
        clinicId: clinicId,
        clinicSubdomain: subdomain,
        clinicName: clinic.name,
      };

      return res.json({ ...payload, token: generateToken(payload) });
    }

    if (requestedRole === "doctor") {
      const doctor = await DoctorModel.findOne({ email, clinicId: clinicId });
      if (!doctor || !doctor.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const match = await checkPassword(password, doctor.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check approval status
      if (doctor.approvalStatus === "pending") {
        return res.status(403).json({
          message: "Your registration is pending approval. You will be able to login once approved.",
          approvalStatus: "pending"
        });
      }
      if (doctor.approvalStatus === "rejected") {
        return res.status(403).json({
          message: "Your registration has been rejected. Please contact the clinic admin.",
          approvalStatus: "rejected"
        });
      }

      const payload = {
        id: doctor._id,
        email: doctor.email,
        role: "doctor",
        name: `${doctor.firstName} ${doctor.lastName}`,
        mustChangePassword: doctor.mustChangePassword,
        profileCompleted: true,
        clinicId: clinicId,
        clinicSubdomain: subdomain,
        clinicName: clinic.name,
      };

      return res.json({ ...payload, token: generateToken(payload) });
    }

    if (requestedRole === "receptionist" || requestedRole === "staff") {
      const receptionist = await Receptionist.findOne({ 
        email, 
        clinicIds: { $in: [clinicId] } 
      });
      
      if (!receptionist) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const match = await checkPassword(password, receptionist.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check approval status
      if (receptionist.approvalStatus === "pending") {
        return res.status(403).json({
          message: "Your registration is pending approval. You will be able to login once approved.",
          approvalStatus: "pending"
        });
      }
      if (receptionist.approvalStatus === "rejected") {
        return res.status(403).json({
          message: "Your registration has been rejected. Please contact the clinic admin.",
          approvalStatus: "rejected"
        });
      }

      const payload = {
        id: receptionist._id,
        email: receptionist.email,
        role: "receptionist",
        name: receptionist.name,
        mustChangePassword: receptionist.mustChangePassword,
        profileCompleted: true,
        clinicId: clinicId,
        clinicSubdomain: subdomain,
        clinicName: clinic.name,
      };

      return res.json({ ...payload, token: generateToken(payload) });
    }

    return res.status(400).json({ message: "Invalid role specified" });
  } catch (err) {
    logger.error("Clinic login error", { error: err.message });
    res.status(500).json({ message: "Server error during login" });
  }
});

// ==========================================
// Clinic-Specific Signup (Patient, Doctor, Staff)
// ==========================================
router.post("/clinic-signup/:subdomain", signupValidation, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { name, email, password, phone, role } = req.body;

    // Validate clinic exists
    const Clinic = require("../models/Clinic");
    const clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
    
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const clinicId = clinic._id;
    const normalizedRole = (role || "patient").toLowerCase();

    // Check for existing email in all collections
    const existingUser = await User.findOne({ email });
    const existingDoctor = await DoctorModel.findOne({ email });
    const existingReceptionist = await Receptionist.findOne({ email });

    if (existingUser || existingDoctor || existingReceptionist) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (normalizedRole === "doctor") {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await DoctorModel.create({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        mustChangePassword: true,
        status: "Active",
        clinicId: clinicId,
        approvalStatus: "pending",
      });

      // Notify clinic admin
      const adminEmail = clinic.admin?.email || clinic.email;
      if (adminEmail) {
        const { staffSignupRequestTemplate } = require("../utils/emailTemplates");
        sendEmail({
          to: adminEmail,
          subject: "New Doctor Registration Request - OneCare",
          html: staffSignupRequestTemplate({
            staffName: name,
            staffEmail: email,
            staffRole: "Doctor",
            clinicName: clinic.name,
            hospitalId: clinic.hospitalId,
          }),
        });
      }

      return res.status(201).json({
        success: true,
        message: "Your registration request has been sent to the clinic admin. You will be able to login once approved.",
        approvalStatus: "pending",
      });

    } else if (normalizedRole === "receptionist" || normalizedRole === "staff") {
      await Receptionist.create({
        name,
        email,
        mobile: phone,
        password: hashedPassword,
        mustChangePassword: true,
        status: true,
        clinicIds: [clinicId],
        approvalStatus: "pending",
      });

      // Notify clinic admin
      const adminEmail = clinic.admin?.email || clinic.email;
      if (adminEmail) {
        const { staffSignupRequestTemplate } = require("../utils/emailTemplates");
        sendEmail({
          to: adminEmail,
          subject: "New Staff Registration Request - OneCare",
          html: staffSignupRequestTemplate({
            staffName: name,
            staffEmail: email,
            staffRole: "Staff/Receptionist",
            clinicName: clinic.name,
            hospitalId: clinic.hospitalId,
          }),
        });
      }

      return res.status(201).json({
        success: true,
        message: "Your registration request has been sent to the clinic admin. You will be able to login once approved.",
        approvalStatus: "pending",
      });

    } else {
      // Patient registration (immediate access)
      const newUser = await User.create({
        email,
        password: hashedPassword,
        role: "patient",
        name,
        phone,
        clinicId: clinicId,
        profileCompleted: false,
      });

      await PatientModel.create({
        userId: newUser._id,
        clinicId: clinicId,
      });

      const payload = {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        profileCompleted: newUser.profileCompleted,
        clinicId: clinicId,
        clinicSubdomain: subdomain,
        clinicName: clinic.name,
      };

      return res.status(201).json({ ...payload, token: generateToken(payload) });
    }
  } catch (err) {
    logger.error("Clinic signup error", { error: err.message });
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ==========================================
// Clinic-Specific Google Login (Patients Only)
// ==========================================
router.post("/clinic-google/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Validate clinic exists
    const Clinic = require("../models/Clinic");
    const clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
    
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const clinicId = clinic._id;

    // Verify Google Token
    client.setCredentials({ access_token: token });
    const userinfo = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { name, email, picture, sub: googleId } = userinfo.data;

    // Check if email exists in non-patient roles
    const existingDoctor = await DoctorModel.findOne({ email });
    const existingReceptionist = await Receptionist.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });

    if (existingDoctor || existingReceptionist || existingAdmin) {
      return res.status(403).json({
        message: "This email is registered as Doctor/Staff. Please use email login."
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new patient
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        name,
        password: hashedPassword,
        role: "patient",
        profileCompleted: false,
        googleId,
        avatar: picture,
        clinicId: clinicId,
      });

      await PatientModel.create({
        userId: user._id,
        clinicId: clinicId,
      });
    } else {
      // Verify patient role
      if (user.role !== "patient") {
        return res.status(403).json({
          message: "This account is not a patient account."
        });
      }

      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      profileCompleted: user.profileCompleted,
      clinicId: clinicId,
      clinicSubdomain: subdomain,
      clinicName: clinic.name,
      googleId: user.googleId,
    };

    return res.json({ ...payload, token: generateToken(payload) });
  } catch (err) {
    logger.error("Clinic Google login error", { error: err.message });
    res.status(500).json({ message: "Google authentication failed" });
  }
});

module.exports = router;

