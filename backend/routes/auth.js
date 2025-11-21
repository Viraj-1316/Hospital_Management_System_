// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Receptionist = require("../models/Receptionist");
const PatientModel = require("../models/Patient");

// Static Admin Credentials
const ADMIN_EMAIL = "admin@onecare.com";
const ADMIN_PASSWORD = "admin123";

/* ============================================
 *                 LOGIN
 * ============================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN ATTEMPT:", email, password);

    /* -------------------------------------------
     * 1. ADMIN LOGIN
     * ------------------------------------------- */
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.json({
        id: "admin-id",
        name: "System Admin",
        email: ADMIN_EMAIL,
        role: "admin",
        profileCompleted: true,
      });
    }

    /* -------------------------------------------
     * 2. RECEPTIONIST (CHECK FIRST!)
     * ------------------------------------------- */
    const receptionist = await Receptionist.findOne({ email });

    if (receptionist) {
      console.log("FOUND IN RECEPTIONIST COLLECTION");

      const match = await bcrypt.compare(password, receptionist.password);
      console.log("Password Match:", match);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        id: receptionist._id,
        email: receptionist.email,
        role: "receptionist",
        name: receptionist.name,
        profileCompleted: true,
      });
    }

    /* -------------------------------------------
     * 3. USER COLLECTION (Patients + Doctors)
     * ------------------------------------------- */
    const user = await User.findOne({ email });

    if (user) {
      console.log("FOUND IN USER COLLECTION:", user.role);

      if (user.password !== password) {
        console.log("USER PASSWORD MISMATCH");
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileCompleted: user.profileCompleted,
      });
    }

    /* ------------------------------------------- */
    console.log("NO USER FOUND — INVALID LOGIN");
    return res.status(401).json({ message: "Invalid email or password" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* ============================================
 *                 SIGNUP (PATIENT)
 * ============================================ */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = await User.create({
      email,
      password, // plain password (as per your existing system)
      role: "patient",
      name,
      profileCompleted: false,
    });

    await PatientModel.create({
      userId: newUser._id,
      firstName: name,
      email,
    });

    res.status(201).json({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      profileCompleted: newUser.profileCompleted,
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

module.exports = router;
