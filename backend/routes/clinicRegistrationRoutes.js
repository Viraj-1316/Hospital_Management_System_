// routes/clinicRegistrationRoutes.js
// Public endpoint for clinic registration (no auth required)
const express = require("express");
const router = express.Router();
const ClinicRegistration = require("../models/ClinicRegistration");
const Clinic = require("../models/Clinic");
const Counter = require("../models/Counter");
const { sendEmail } = require("../utils/emailService");
const { clinicRegistrationConfirmationTemplate } = require("../utils/emailTemplates");
const logger = require("../utils/logger");

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Allow digits, spaces, dashes, parentheses, and + for country codes
  const phoneRegex = /^[\d\s\-\(\)\+]{6,20}$/;
  return phoneRegex.test(phone);
};

// Clinic types for validation
const VALID_CLINIC_TYPES = [
  "General Practice",
  "Dental Clinic",
  "Eye Care / Ophthalmology",
  "Pediatric Clinic",
  "Orthopedic Clinic",
  "Dermatology",
  "Cardiology",
  "Gynecology",
  "Multi-Specialty Hospital",
  "Other"
];

/**
 * @route   POST /api/clinic-registration
 * @desc    Submit a new clinic registration
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    const { ownerName, clinicName, phone, email, clinicType, clinicTypeOther, licenseNumber, city, messageToAdmin } = req.body;

    // ---- Validation ----
    const errors = [];

    if (!ownerName || ownerName.trim().length < 2) {
      errors.push("Owner/Contact Name must be at least 2 characters");
    }

    if (!clinicName || clinicName.trim().length < 2) {
      errors.push("Clinic Name must be at least 2 characters");
    }

    if (!phone || !validatePhone(phone)) {
      errors.push("Please provide a valid phone number");
    }

    if (!email || !validateEmail(email)) {
      errors.push("Please provide a valid email address");
    }

    if (!clinicType || !VALID_CLINIC_TYPES.includes(clinicType)) {
      errors.push("Please select a valid clinic type");
    }

    if (clinicType === "Other" && (!clinicTypeOther || clinicTypeOther.trim().length < 2)) {
      errors.push("Please specify your clinic type");
    }

    if (!licenseNumber || licenseNumber.trim().length < 3) {
      errors.push("Medical Registration / License Number is required");
    }

    if (!city || city.trim().length < 2) {
      errors.push("City / Location is required");
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: errors.join(". ") 
      });
    }

    // ---- Duplicate Email Check ----
    const normalizedEmail = email.toLowerCase().trim();

    // Check in pending registrations
    const existingRegistration = await ClinicRegistration.findOne({ 
      email: normalizedEmail 
    });
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: "A registration with this email already exists. Please use a different email or contact support."
      });
    }

    // Check in approved clinics
    const existingClinic = await Clinic.findOne({ email: normalizedEmail });
    if (existingClinic) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered with an existing clinic. Please login or use a different email."
      });
    }

    // ---- Generate Sequential Application ID ----
    // Format: OC-YYYYMMDD-0001, OC-YYYYMMDD-0002, etc.
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const counterType = `clinic_registration_${dateStr}`;
    
    const sequenceNum = await Counter.getNextSequence(counterType, "", null, 4);
    const applicationId = `OC-${dateStr}-${sequenceNum}`;

    // ---- Create Registration ----
    const registration = new ClinicRegistration({
      applicationId,
      ownerName: ownerName.trim(),
      clinicName: clinicName.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      clinicType,
      clinicTypeOther: clinicType === "Other" ? clinicTypeOther.trim() : undefined,
      licenseNumber: licenseNumber.trim(),
      city: city.trim(),
      messageToAdmin: messageToAdmin ? messageToAdmin.trim() : undefined,
      status: "Pending"
    });

    await registration.save();
    logger.info("New clinic registration created", { applicationId, clinicName, email: normalizedEmail });

    // ---- Send Confirmation Email ----
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `OneCare Registration Received - ${applicationId}`,
        html: clinicRegistrationConfirmationTemplate({
          ownerName: ownerName.trim(),
          clinicName: clinicName.trim(),
          applicationId
        })
      });
      logger.info("Clinic registration confirmation email sent", { applicationId, to: normalizedEmail });
    } catch (emailError) {
      // Don't fail the registration if email fails
      logger.error("Failed to send clinic registration confirmation email", { 
        applicationId, 
        error: emailError.message 
      });
    }

    // ---- Success Response ----
    res.status(201).json({
      success: true,
      message: "Registration submitted successfully! Please check your email for confirmation.",
      applicationId
    });

  } catch (error) {
    logger.error("Clinic registration error", { error: error.message, stack: error.stack });
    
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A registration with this email already exists."
      });
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while processing your registration. Please try again later."
    });
  }
});

/**
 * @route   GET /api/clinic-registration/check-email
 * @desc    Check if email is already registered
 * @access  Public
 */
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existsInRegistrations = await ClinicRegistration.exists({ email: normalizedEmail });
    const existsInClinics = await Clinic.exists({ email: normalizedEmail });

    res.json({
      success: true,
      exists: !!(existsInRegistrations || existsInClinics)
    });
  } catch (error) {
    logger.error("Email check error", { error: error.message });
    res.status(500).json({ success: false, message: "Error checking email" });
  }
});

// ============================================
// ADMIN PROTECTED ENDPOINTS
// ============================================
const { verifyToken, requireRole } = require("../middleware/auth");
const { 
  clinicApprovalTemplate, 
  clinicRejectionTemplate 
} = require("../utils/emailTemplates");

const adminAuth = requireRole("admin");

/**
 * @route   GET /api/clinic-registration
 * @desc    List all clinic registrations (with filters)
 * @access  Admin only
 */
router.get("/", verifyToken, adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      filter.status = status;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { clinicName: searchRegex },
        { ownerName: searchRegex },
        { email: searchRegex },
        { applicationId: searchRegex },
        { city: searchRegex }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [registrations, total] = await Promise.all([
      ClinicRegistration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ClinicRegistration.countDocuments(filter)
    ]);
    
    // Get counts by status
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      ClinicRegistration.countDocuments({ status: "Pending" }),
      ClinicRegistration.countDocuments({ status: "Approved" }),
      ClinicRegistration.countDocuments({ status: "Rejected" })
    ]);
    
    res.json({
      success: true,
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount
      }
    });
  } catch (error) {
    logger.error("Error fetching clinic registrations", { error: error.message });
    res.status(500).json({ success: false, message: "Error fetching registrations" });
  }
});

/**
 * @route   GET /api/clinic-registration/:id
 * @desc    Get single registration details
 * @access  Admin only
 */
router.get("/:id", verifyToken, adminAuth, async (req, res) => {
  try {
    const registration = await ClinicRegistration.findById(req.params.id).lean();
    
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    res.json({ success: true, registration });
  } catch (error) {
    logger.error("Error fetching registration details", { error: error.message });
    res.status(500).json({ success: false, message: "Error fetching registration" });
  }
});

/**
 * @route   PUT /api/clinic-registration/:id/approve
 * @desc    Approve a clinic registration
 * @access  Admin only
 */
router.put("/:id/approve", verifyToken, adminAuth, async (req, res) => {
  try {
    const registration = await ClinicRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    if (registration.status !== "Pending") {
      return res.status(400).json({ 
        success: false, 
        message: `Registration is already ${registration.status.toLowerCase()}` 
      });
    }
    
    // Update status
    registration.status = "Approved";
    registration.reviewedAt = new Date();
    registration.reviewedBy = req.user.userId;
    await registration.save();
    
    logger.info("Clinic registration approved", { 
      applicationId: registration.applicationId, 
      adminId: req.user.userId 
    });
    
    // Send approval email
    try {
      await sendEmail({
        to: registration.email,
        subject: `Congratulations! Your Clinic Registration is Approved - ${registration.applicationId}`,
        html: clinicApprovalTemplate({
          ownerName: registration.ownerName,
          clinicName: registration.clinicName,
          applicationId: registration.applicationId,
          registrationId: registration._id.toString()
        })
      });
      logger.info("Clinic approval email sent", { to: registration.email });
    } catch (emailError) {
      logger.error("Failed to send approval email", { error: emailError.message });
    }
    
    res.json({
      success: true,
      message: `${registration.clinicName} has been approved successfully!`
    });
  } catch (error) {
    logger.error("Error approving registration", { error: error.message });
    res.status(500).json({ success: false, message: "Error approving registration" });
  }
});

/**
 * @route   PUT /api/clinic-registration/:id/reject
 * @desc    Reject a clinic registration
 * @access  Admin only
 */
router.put("/:id/reject", verifyToken, adminAuth, async (req, res) => {
  try {
    const { reason, customReason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }
    
    const registration = await ClinicRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    if (registration.status !== "Pending") {
      return res.status(400).json({ 
        success: false, 
        message: `Registration is already ${registration.status.toLowerCase()}` 
      });
    }
    
    // Build full rejection reason
    const fullReason = reason === "Other" && customReason 
      ? `${reason}: ${customReason}` 
      : reason;
    
    // Update status
    registration.status = "Rejected";
    registration.reviewedAt = new Date();
    registration.reviewedBy = req.user.userId;
    registration.rejectionReason = fullReason;
    await registration.save();
    
    logger.info("Clinic registration rejected", { 
      applicationId: registration.applicationId, 
      reason: fullReason,
      adminId: req.user.userId 
    });
    
    // Send rejection email
    try {
      await sendEmail({
        to: registration.email,
        subject: `Update on Your Clinic Registration - ${registration.applicationId}`,
        html: clinicRejectionTemplate({
          ownerName: registration.ownerName,
          clinicName: registration.clinicName,
          applicationId: registration.applicationId,
          reason: fullReason
        })
      });
      logger.info("Clinic rejection email sent", { to: registration.email });
    } catch (emailError) {
      logger.error("Failed to send rejection email", { error: emailError.message });
    }
    
    res.json({
      success: true,
      message: `${registration.clinicName}'s application has been rejected.`
    });
  } catch (error) {
    logger.error("Error rejecting registration", { error: error.message });
    res.status(500).json({ success: false, message: "Error rejecting registration" });
  }
});

module.exports = router;

