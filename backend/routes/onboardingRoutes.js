// routes/onboardingRoutes.js
// Clinic onboarding wizard API endpoints
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const ClinicOnboarding = require("../models/ClinicOnboarding");
const ClinicRegistration = require("../models/ClinicRegistration");
const Clinic = require("../models/Clinic");
const User = require("../models/User");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/emailService");
const generateRandomPassword = require("../utils/generatePassword");
const { credentialsTemplate } = require("../utils/emailTemplates");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/onboarding");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Reserved subdomains
const RESERVED_SUBDOMAINS = [
  "www", "app", "api", "admin", "dashboard", "login", "signup",
  "register", "support", "help", "blog", "docs", "mail", "email",
  "test", "demo", "staging", "dev", "onecare", "clinic", "hospital"
];

// Profanity filter (basic)
const BLOCKED_WORDS = ["admin", "fuck", "shit", "ass", "porn", "sex"];

// Helper: Extract Initials from Clinic Name
const extractInitials = (name) => {
  if (!name) return "XXX";
  const cleanName = name.replace(/[^a-zA-Z ]/g, "").toUpperCase();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = "";
  if (words.length === 1) {
    initials = words[0].substring(0, 3);
  } else {
    initials = words.map(w => w[0]).join("").substring(0, 5);
  }
  return initials || "XXX";
};

// Helper: Generate Sequential Hospital ID
const generateHospitalId = async (clinicName) => {
  const prefix = "OC";
  const initials = extractInitials(clinicName);
  const baseId = `${prefix}-${initials}`;
  const regex = new RegExp(`^${baseId}-(\\d{3})$`);

  const lastClinic = await Clinic.findOne({ hospitalId: regex })
    .sort({ hospitalId: -1 })
    .select("hospitalId");

  let sequence = 1;
  if (lastClinic && lastClinic.hospitalId) {
    const parts = lastClinic.hospitalId.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }
  return `${baseId}-${sequence.toString().padStart(3, "0")}`;
};

/**
 * @route GET /api/onboarding/check-subdomain
 * @desc Check if subdomain is available
 * @access Public (with registration token)
 */
router.get("/check-subdomain", async (req, res) => {
  try {
    const { subdomain } = req.query;
    
    if (!subdomain) {
      return res.status(400).json({ success: false, message: "Subdomain is required" });
    }
    
    const normalized = subdomain.toLowerCase().trim();
    
    // Validation
    if (normalized.length < 3 || normalized.length > 20) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "Subdomain must be 3-20 characters" 
      });
    }
    
    const validPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{3}$/;
    if (!validPattern.test(normalized)) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "Only lowercase letters, numbers, and hyphens allowed" 
      });
    }
    
    // Check reserved
    if (RESERVED_SUBDOMAINS.includes(normalized)) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "This subdomain is reserved" 
      });
    }
    
    // Check blocked words
    if (BLOCKED_WORDS.some(word => normalized.includes(word))) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "This subdomain contains inappropriate content" 
      });
    }
    
    // Check if already taken (exclude current registration if provided)
    const { registrationId } = req.query;
    const query = { subdomain: normalized };
    if (registrationId) {
      query.registrationId = { $ne: registrationId };
    }

    const existing = await ClinicOnboarding.findOne(query);
    if (existing) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "This subdomain is already taken" 
      });
    }
    
    // Also check existing clinics
    const existingClinic = await Clinic.findOne({ subdomain: normalized });
    if (existingClinic) {
      return res.json({ 
        success: true, 
        available: false, 
        message: "This subdomain is already taken" 
      });
    }
    
    res.json({ 
      success: true, 
      available: true, 
      message: "Subdomain is available!" 
    });
  } catch (error) {
    logger.error("Subdomain check error", { error: error.message });
    res.status(500).json({ success: false, message: "Error checking subdomain" });
  }
});

/**
 * @route GET /api/onboarding/:registrationId
 * @desc Get onboarding data for a registration
 * @access Public (with registration token)
 */
router.get("/:registrationId", async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    // Verify registration exists and is approved
    const registration = await ClinicRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    if (registration.status !== "Approved") {
      return res.status(403).json({ success: false, message: "Registration is not approved" });
    }
    
    // Get or create onboarding record
    let onboarding = await ClinicOnboarding.findOne({ registrationId });
    
    if (!onboarding) {
      // Create new onboarding with pre-filled data from registration
      const defaultHours = [
        { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "14:00" },
        { day: "Sunday", isOpen: false, openTime: "09:00", closeTime: "18:00" }
      ];
      
      onboarding = new ClinicOnboarding({
        registrationId,
        clinicDetails: {
          name: registration.clinicName,
          phone: registration.phone,
          email: registration.email,
          address: {
            city: registration.city
          },
          operatingHours: defaultHours
        },
        currentStep: 1,
        status: "draft"
      });
      
      await onboarding.save();
    }
    
    res.json({ 
      success: true, 
      onboarding,
      registration: {
        applicationId: registration.applicationId,
        clinicName: registration.clinicName,
        ownerName: registration.ownerName
      }
    });
  } catch (error) {
    logger.error("Get onboarding error", { error: error.message });
    res.status(500).json({ success: false, message: "Error fetching onboarding data" });
  }
});

/**
 * @route POST /api/onboarding/save-draft
 * @desc Save onboarding progress
 * @access Public (with registration token)
 */
router.post("/save-draft", async (req, res) => {
  try {
    const { registrationId, step, data } = req.body;
    
    if (!registrationId) {
      return res.status(400).json({ success: false, message: "Registration ID is required" });
    }
    
    let onboarding = await ClinicOnboarding.findOne({ registrationId });
    
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding not found" });
    }
    
    // Update based on step
    switch (step) {
      case 1:
        onboarding.subdomain = data.subdomain;
        break;
      case 2:
        onboarding.clinicDetails = { ...onboarding.clinicDetails, ...data.clinicDetails };
        break;
      case 3:
        onboarding.services = data.services;
        break;
      case 4:
        onboarding.staff = data.staff;
        break;
    }
    
    // Update current step
    if (step && step > onboarding.currentStep) {
      onboarding.currentStep = Math.min(step, 5);
    }
    
    await onboarding.save();
    
    res.json({ success: true, message: "Draft saved", onboarding });
  } catch (error) {
    logger.error("Save draft error", { error: error.message });
    res.status(500).json({ success: false, message: "Error saving draft" });
  }
});

/**
 * @route POST /api/onboarding/upload-image
 * @desc Upload image (logo, staff photo, gallery)
 * @access Public (with registration token)
 */
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    
    const imageUrl = `/uploads/onboarding/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl,
      message: "Image uploaded successfully" 
    });
  } catch (error) {
    logger.error("Image upload error", { error: error.message });
    res.status(500).json({ success: false, message: "Error uploading image" });
  }
});

/**
 * @route POST /api/onboarding/publish
 * @desc Publish the clinic website - creates Clinic, User, and sends credentials
 * @access Public (with registration token)
 */
router.post("/publish", async (req, res) => {
  try {
    const { registrationId } = req.body;
    
    const onboarding = await ClinicOnboarding.findOne({ registrationId });
    
    if (!onboarding) {
      return res.status(404).json({ success: false, message: "Onboarding not found" });
    }
    
    if (onboarding.status === "published") {
      return res.status(400).json({ success: false, message: "Already published" });
    }
    
    // Validation
    const errors = [];
    if (!onboarding.subdomain) errors.push("Subdomain is required");
    if (!onboarding.clinicDetails?.name) errors.push("Clinic name is required");
    if (!onboarding.services?.length) errors.push("At least one service is required");
    if (!onboarding.staff?.length) errors.push("At least one staff member is required");
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }
    
    // Get registration for details
    const registration = await ClinicRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    // 1️⃣ Generate unique Hospital ID
    const hospitalId = await generateHospitalId(onboarding.clinicDetails.name);
    
    // 2️⃣ Create Clinic record
    const clinicDetails = onboarding.clinicDetails;
    const clinic = new Clinic({
      hospitalId,
      subdomain: onboarding.subdomain,
      name: clinicDetails.name,
      email: clinicDetails.email || registration.email,
      contact: clinicDetails.phone || registration.phone,
      specialties: clinicDetails.specializations || [],
      status: "Active",
      clinicLogo: clinicDetails.logo ? clinicDetails.logo.replace('/uploads/', '') : null,
      address: {
        full: clinicDetails.address?.street || '',
        city: clinicDetails.address?.city || registration.city,
        country: clinicDetails.address?.country || 'India',
        postalCode: clinicDetails.address?.zip || '',
      },
      admin: {
        firstName: registration.ownerName?.split(' ')[0] || 'Clinic',
        lastName: registration.ownerName?.split(' ').slice(1).join(' ') || 'Admin',
        email: registration.email,
        contact: registration.phone,
      },
      // Store additional onboarding data
      about: clinicDetails.about,
      operatingHours: clinicDetails.operatingHours,
      socialMedia: clinicDetails.socialMedia,
      languagesSpoken: clinicDetails.languagesSpoken,
      acceptedPayments: clinicDetails.acceptedPayments,
      appointmentSettings: clinicDetails.appointmentSettings,
      services: onboarding.services,
      doctors: onboarding.staff,
    });
    
    await clinic.save();
    
    // 3️⃣ Create User account with generated password
    const targetEmail = registration.email;
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = new User({
        email: targetEmail,
        password: hashedPassword,
        role: "clinic_admin",
        name: registration.ownerName || "Clinic Admin",
        clinicId: clinic._id,
        profileCompleted: true,
        phone: registration.phone || "",
      });
      await user.save();
    } else {
      // Update existing user with new password
      user.password = hashedPassword;
      user.clinicId = clinic._id;
      await user.save();
    }
    
    // 4️⃣ Send credentials email
    const html = credentialsTemplate({
      name: registration.ownerName?.split(' ')[0] || "Admin",
      email: targetEmail,
      password: password,
      hospitalId: hospitalId
    });
    
    await sendEmail({
      to: targetEmail,
      subject: "🎉 Your OneCare Clinic is Live! - Login Credentials",
      html,
    });
    
    // 5️⃣ Update onboarding status
    onboarding.status = "published";
    onboarding.publishedAt = new Date();
    onboarding.currentStep = 5;
    onboarding.createdClinicId = clinic._id;
    
    await onboarding.save();
    
    // 6️⃣ Update registration status
    registration.onboardingCompleted = true;
    await registration.save();
    
    logger.info("Clinic created and published", { 
      subdomain: onboarding.subdomain,
      hospitalId,
      clinicId: clinic._id.toString()
    });
    
    // Generate website URL using FRONTEND_URL from environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const websiteUrl = `${frontendUrl}/c/${onboarding.subdomain}`;
    
    res.json({ 
      success: true, 
      message: "Your clinic is now live!",
      websiteUrl,
      hospitalId,
      clinicId: clinic._id,
      onboarding
    });
  } catch (error) {
    logger.error("Publish error", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Error publishing website: " + error.message });
  }
});

module.exports = router;

