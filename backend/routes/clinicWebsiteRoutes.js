// routes/clinicWebsiteRoutes.js
// Public-facing routes for clinic websites
const express = require("express");
const router = express.Router();
const Clinic = require("../models/Clinic");
const ClinicOnboarding = require("../models/ClinicOnboarding");
const Doctor = require("../models/Doctor");
const Service = require("../models/Service");
const DoctorSession = require("../models/DoctorSession");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const logger = require("../utils/logger");
const { verifyToken } = require("../middleware/auth");
const { sendEmail } = require("../utils/emailService");
const { appointmentBookedTemplate } = require("../utils/emailTemplates");

// Helper: Resolve clinic from subdomain
const getClinicBySubdomain = async (subdomain) => {
  let clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
  let onboarding = null;
  
  if (clinic) {
    onboarding = await ClinicOnboarding.findOne({ 
      createdClinicId: clinic._id,
      status: "published" 
    });
  } else {
    onboarding = await ClinicOnboarding.findOne({ 
      subdomain: subdomain.toLowerCase(),
      status: "published" 
    });
    
    if (onboarding && onboarding.createdClinicId) {
      clinic = await Clinic.findById(onboarding.createdClinicId);
    }
  }
  
  return { clinic, onboarding };
};

// Helper: Parse time string to Date object
const parseSessionTime = (timeStr, dateStr) => {
  if (!timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  
  // Handle both "HH:MM" and "HH:MM AM/PM" formats
  let hours, minutes;
  if (timeStr.includes(' ')) {
    const [time, modifier] = timeStr.split(' ');
    [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier && modifier.toLowerCase() === 'pm') hours += 12;
  } else {
    [hours, minutes] = timeStr.split(':').map(Number);
  }
  
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

// Helper: Format Date to "10:00 am"
const formatSlotTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

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

    const { clinic, onboarding } = await getClinicBySubdomain(subdomain);

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Build response with all available data
    const websiteData = {
      // Basic Info
      _id: clinic?._id || onboarding?.createdClinicId,
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
      services: clinic?.services || onboarding?.services || [],
      
      // Staff/Doctors
      staff: clinic?.doctors || onboarding?.staff || [],
      
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

/**
 * @route GET /api/clinic-website/:subdomain/doctors
 * @desc Get all doctors for a clinic (public)
 * @access Public
 */
router.get("/:subdomain/doctors", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { clinic, onboarding } = await getClinicBySubdomain(subdomain);

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinicId = clinic?._id || onboarding?.createdClinicId;
    
    // Fetch doctors from Doctor model
    let doctors = [];
    if (clinicId) {
      doctors = await Doctor.find({ clinicId })
        .select("firstName lastName name specialization experience email photo qualifications")
        .lean();
    }
    
    // Also include staff from onboarding if available
    const onboardingStaff = onboarding?.staff || [];
    
    // Merge and format doctor data
    const formattedDoctors = doctors.map(doc => ({
      _id: doc._id,
      name: doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim(),
      specialty: doc.specialization || 'General',
      experience: doc.experience || 0,
      email: doc.email,
      photo: doc.photo,
      qualifications: doc.qualifications
    }));
    
    // Add onboarding staff that aren't already in doctors list
    onboardingStaff.forEach(staff => {
      if (!formattedDoctors.find(d => d.email === staff.email)) {
        formattedDoctors.push({
          _id: staff._id || staff.email,
          name: staff.name,
          specialty: staff.specialty || 'General',
          experience: staff.experience || 0,
          email: staff.email,
          photo: staff.photo
        });
      }
    });

    res.json({ success: true, data: formattedDoctors });
  } catch (error) {
    logger.error("Error fetching clinic doctors", { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({ success: false, message: "Error fetching doctors" });
  }
});

/**
 * @route GET /api/clinic-website/:subdomain/services
 * @desc Get all services for a clinic (public)
 * @access Public
 */
router.get("/:subdomain/services", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { doctorId } = req.query;
    const { clinic, onboarding } = await getClinicBySubdomain(subdomain);

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinicId = clinic?._id || onboarding?.createdClinicId;
    
    // Build query
    const query = { active: true };
    if (clinicId) {
      query.clinicId = clinicId;
    }
    if (doctorId) {
      query.doctor = doctorId;
    }
    
    // Fetch services from Service model
    let services = await Service.find(query)
      .select("name category charges duration description imageUrl")
      .lean();
    
    // Also include services from onboarding if available
    const onboardingServices = onboarding?.services || [];
    
    // Group services by category
    const servicesByCategory = {};
    
    services.forEach(svc => {
      const category = svc.category || 'General';
      if (!servicesByCategory[category]) {
        servicesByCategory[category] = [];
      }
      servicesByCategory[category].push({
        _id: svc._id,
        name: svc.name,
        price: svc.charges,
        duration: svc.duration,
        description: svc.description,
        image: svc.imageUrl
      });
    });
    
    // Add onboarding services
    onboardingServices.forEach(svc => {
      const category = svc.category || 'General';
      if (!servicesByCategory[category]) {
        servicesByCategory[category] = [];
      }
      if (!servicesByCategory[category].find(s => s.name === svc.name)) {
        servicesByCategory[category].push({
          _id: svc._id || svc.name,
          name: svc.name,
          price: svc.price || svc.charges,
          duration: svc.duration,
          description: svc.description
        });
      }
    });

    res.json({ success: true, data: servicesByCategory });
  } catch (error) {
    logger.error("Error fetching clinic services", { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({ success: false, message: "Error fetching services" });
  }
});

/**
 * @route GET /api/clinic-website/:subdomain/slots
 * @desc Get available time slots for a doctor on a date (public)
 * @access Public
 */
router.get("/:subdomain/slots", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "doctorId and date are required" });
    }

    const { clinic, onboarding } = await getClinicBySubdomain(subdomain);

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Check for holidays
    const requestDate = new Date(date);
    const holiday = await Holiday.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate },
    });

    if (holiday) {
      return res.json({
        success: true,
        data: {
          slots: [],
          isHoliday: true,
          message: `Doctor is on holiday: ${holiday.reason || 'Holiday'}`
        }
      });
    }

    // Fetch doctor's session settings
    const session = await DoctorSession.findOne({ doctorId });
    
    if (!session) {
      return res.json({
        success: true,
        data: {
          slots: [],
          isHoliday: false,
          message: "Doctor has not configured their schedule"
        }
      });
    }

    // Check if doctor works on this day
    const [y, m, d] = date.split('-').map(Number);
    const inputDate = new Date(y, m - 1, d);
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const longDay = daysMap[inputDate.getDay()];
    const shortDay = longDay.substring(0, 3);

    const isWorkingDay = (session.days || []).some((day) => {
      const cleanDay = String(day || "").trim().toLowerCase();
      return cleanDay === longDay.toLowerCase() || cleanDay === shortDay.toLowerCase();
    });

    if (!isWorkingDay) {
      return res.json({
        success: true,
        data: {
          slots: [],
          isHoliday: false,
          message: `Doctor does not work on ${longDay}s`
        }
      });
    }

    // Generate slots
    const interval = parseInt(session.timeSlotMinutes, 10) || 30;
    const allSlots = [];

    const ranges = [
      { start: session.morningStart, end: session.morningEnd },
      { start: session.eveningStart, end: session.eveningEnd },
    ];

    for (const range of ranges) {
      if (range.start && range.end && range.start !== "-" && range.end !== "-") {
        let current = parseSessionTime(range.start, date);
        const endTime = parseSessionTime(range.end, date);

        if (current && endTime && current < endTime) {
          while (current < endTime) {
            allSlots.push(formatSlotTime(current));
            current.setMinutes(current.getMinutes() + interval);
          }
        }
      }
    }

    // Filter out booked slots
    const bookedApps = await Appointment.find({
      doctorId,
      date,
      status: { $ne: "cancelled" },
    }).select("time");

    const bookedTimes = bookedApps.map((a) => (a.time || "").toLowerCase());
    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot.toLowerCase()));

    res.json({
      success: true,
      data: {
        slots: availableSlots,
        isHoliday: false,
        slotDuration: interval,
        timezone: "UTC+05:30"
      }
    });
  } catch (error) {
    logger.error("Error fetching available slots", { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({ success: false, message: "Error fetching slots" });
  }
});

/**
 * @route POST /api/clinic-website/:subdomain/book
 * @desc Book an appointment (requires patient auth)
 * @access Private (Patient)
 */
router.post("/:subdomain/book", verifyToken, async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { doctorId, serviceIds, date, time, description } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: "doctorId, date, and time are required" });
    }

    const { clinic, onboarding } = await getClinicBySubdomain(subdomain);

    if (!clinic && !onboarding) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const clinicId = clinic?._id || onboarding?.createdClinicId;
    const clinicName = clinic?.name || onboarding?.clinicDetails?.name;

    // Get patient info and linked User
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found. Please complete your registration." });
    }

    // Get User info for name, email, phone
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get doctor info
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // Check for holiday
    const requestDate = new Date(date);
    const holiday = await Holiday.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate },
    });

    if (holiday) {
      return res.status(400).json({
        success: false,
        message: `Doctor is on holiday from ${new Date(holiday.fromDate).toLocaleDateString()} to ${new Date(holiday.toDate).toLocaleDateString()}`
      });
    }

    // Check if slot is still available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time: { $regex: new RegExp(`^${time}$`, 'i') },
      status: { $ne: "cancelled" }
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: "This time slot is no longer available" });
    }

    // Get services info
    let servicesDetail = "General Consultation";
    let serviceNames = [];
    let totalCharges = 0;
    if (serviceIds && serviceIds.length > 0) {
      const services = await Service.find({ _id: { $in: serviceIds } });
      serviceNames = services.map(s => s.name);
      servicesDetail = serviceNames.join(", ");
      totalCharges = services.reduce((sum, s) => sum + (s.charges || s.price || 0), 0);
    }

    // Generate queue token
    const startOfDay = new Date(requestDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCount = await Appointment.countDocuments({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    // Build patient name from User model
    const patientName = user.name || 'Patient';
    const patientEmail = user.email;
    const patientPhone = user.phone || '';
    const doctorFullName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';

    // Create appointment with proper data
    const appointment = await Appointment.create({
      patientId: patient._id,
      patientName,
      patientEmail,
      patientPhone,
      doctorId: doctor._id,
      doctorName: doctorFullName,
      clinicId,
      clinic: clinicName,
      date,
      time,
      services: serviceIds || [],
      servicesDetail,
      charges: totalCharges,
      status: "upcoming",
      department: doctor.specialization || doctor.specialty || '',
      queueToken: existingCount + 1,
      description: description || "",
      createdAt: new Date()
    });

    // Send confirmation email to patient
    if (patientEmail) {
      try {
        const emailHtml = appointmentBookedTemplate({
          patientName,
          doctorName: doctorFullName,
          clinicName,
          date: appointment.date,
          time: appointment.time,
          services: servicesDetail || 'General Consultation',
          appointmentMode: 'offline',
          onlinePlatform: null,
          meetingLink: null
        });

        await sendEmail({
          to: patientEmail,
          subject: `Appointment Confirmed - ${clinicName}`,
          html: emailHtml
        });
        logger.info("Appointment confirmation email sent", { patientEmail, appointmentId: appointment._id });
      } catch (emailErr) {
        logger.error("Failed to send appointment confirmation email", { error: emailErr.message });
        // Don't fail the booking if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: {
        appointmentId: appointment._id,
        date: appointment.date,
        time: appointment.time,
        doctorName: appointment.doctorName,
        queueToken: appointment.queueToken
      }
    });
  } catch (error) {
    logger.error("Error booking appointment", { error: error.message, subdomain: req.params.subdomain });
    res.status(500).json({ success: false, message: "Error booking appointment" });
  }
});

module.exports = router;
