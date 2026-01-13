// routes/clinicWebsiteRoutes.js
// Public-facing routes for clinic websites
const express = require("express");
const router = express.Router();
const Clinic = require("../models/Clinic");
const ClinicOnboarding = require("../models/ClinicOnboarding");
const logger = require("../utils/logger");

/**
 * @route GET /api/clinic-website/:subdomain
 * @desc Get public clinic data by subdomain
 * @access Public
 */
router.get("/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    if (!subdomain) {
      return res.status(400).json({ success: false, message: "Subdomain required" });
    }

    // First try to find in Clinic model
    let clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
    
    // If found in Clinic, get additional data from onboarding if exists
    let onboarding = null;
    if (clinic) {
      onboarding = await ClinicOnboarding.findOne({ 
        createdClinicId: clinic._id,
        status: "published" 
      });
    } else {
      // Try finding via onboarding subdomain
      onboarding = await ClinicOnboarding.findOne({ 
        subdomain: subdomain.toLowerCase(),
        status: "published" 
      });
      
      if (onboarding && onboarding.createdClinicId) {
        clinic = await Clinic.findById(onboarding.createdClinicId);
      }
    }

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Build response with all available data
    const websiteData = {
      // Basic Info
      name: clinic?.name || onboarding?.clinicDetails?.name,
      subdomain: subdomain.toLowerCase(),
      logo: clinic?.clinicLogo || onboarding?.clinicDetails?.logo,
      about: clinic?.about || onboarding?.clinicDetails?.about,
      
      // Contact
      contact: {
        phone: clinic?.contact || onboarding?.clinicDetails?.phone,
        email: clinic?.email || onboarding?.clinicDetails?.email,
        website: onboarding?.clinicDetails?.website,
        emergencyContact: onboarding?.clinicDetails?.emergencyContact,
        address: {
          street: clinic?.address?.full || onboarding?.clinicDetails?.address?.street,
          city: clinic?.address?.city || onboarding?.clinicDetails?.address?.city,
          state: onboarding?.clinicDetails?.address?.state,
          zip: clinic?.address?.postalCode || onboarding?.clinicDetails?.address?.zip,
          country: clinic?.address?.country || onboarding?.clinicDetails?.address?.country || "India"
        }
      },
      
      // Social Media
      socialMedia: clinic?.socialMedia || onboarding?.clinicDetails?.socialMedia || {},
      
      // Operating Hours
      operatingHours: clinic?.operatingHours || onboarding?.clinicDetails?.operatingHours || [],
      
      // Services
      services: onboarding?.services || [],
      
      // Staff/Doctors
      staff: onboarding?.staff || [],
      
      // Additional Info
      specializations: clinic?.specialties || onboarding?.clinicDetails?.specializations || [],
      languagesSpoken: clinic?.languagesSpoken || onboarding?.clinicDetails?.languagesSpoken || [],
      acceptedPayments: clinic?.acceptedPayments || onboarding?.clinicDetails?.acceptedPayments || [],
      
      // Appointment Settings
      appointmentSettings: clinic?.appointmentSettings || onboarding?.clinicDetails?.appointmentSettings || {
        allowOnlineBooking: true
      },
      
      // Gallery
      gallery: onboarding?.clinicDetails?.gallery || [],
      
      // Hospital ID for booking purposes
      hospitalId: clinic?.hospitalId
    };

    res.json({ success: true, data: websiteData });
  } catch (error) {
    logger.error("Error fetching clinic website data", { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({ success: false, message: "Error fetching clinic data" });
  }
});

module.exports = router;
