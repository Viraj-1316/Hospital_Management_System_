const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const { verifyToken } = require("../middleware/auth");

// 1) Admin profile by id
router.get("/api/admin/:id", verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (err) {
    console.error("Admin GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2) Update Admin profile
router.put("/api/admin/:id", verifyToken, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { name, phone, avatar },
      { new: true }
    ).select("-password");

    if (!updatedAdmin) return res.status(404).json({ message: "Admin not found" });

    res.json(updatedAdmin);
  } catch (err) {
    console.error("Admin UPDATE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3) by email – this MUST come first
router.get("/api/user/email/:email", verifyToken, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await User.findOne({ email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile GET by email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2) by id
router.get("/api/user/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 3) update by id (unchanged)
router.put("/api/user/:id", verifyToken, async (req, res) => {
  try {
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
      bloodGroup,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
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
        bloodGroup,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile UPDATE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK user.profileCompleted = true
router.put("/users/:id/profile-completed", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { profileCompleted: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update profile status" });
  }
});

module.exports = router;
