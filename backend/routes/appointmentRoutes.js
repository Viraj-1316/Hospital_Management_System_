const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const mongoose = require("mongoose");
// const puppeteer = require("puppeteer"); // Removed in favor of singleton service
const QRCode = require("qrcode");
// PDF generation using pdf-lib (no Puppeteer dependency)

const AppointmentModel = require("../models/Appointment");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const HolidayModel = require("../models/Holiday");
const DoctorSessionModel = require("../models/DoctorSession");
const { sendEmail } = require("../utils/emailService");
const { appointmentBookedTemplate } = require("../utils/emailTemplates");
const { sendWhatsAppMessage } = require("../utils/whatsappService");
const upload = require("../middleware/upload");
const logger = require("../utils/logger");
const {
  emitToRole,
  emitToUser,
  emitToAdmin,
} = require("../utils/socketServer");
const {
  patientPopulate,
  doctorPopulate,
  normalizeDocuments,
} = require("../utils/populateHelper");
const { verifyToken } = require("../middleware/auth");
const { createGoogleMeetEvent, createZoomMeeting, getDoctorPlatforms } = require("../utils/meetingService");

const allowUrlToken = (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

// --- HELPER: Generate Time Slots ---
const generateTimeSlots = (startStr, endStr, intervalMins) => {
  const slots = [];
  let current = new Date(`2000-01-01T${startStr}`);
  const end = new Date(`2000-01-01T${endStr}`);

  while (current < end) {
    const timeString = current.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + intervalMins);
  }
  return slots;
};

// ==========================================
// GET AVAILABLE SLOTS (Dynamic from Doctor Session)
// ==========================================

// Helper: Parse "HH:MM" time string to Date object for a specific date
const parseSessionTime = (timeStr, dateStr) => {
  if (!timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const [hours, minutes] = timeStr.split(":").map(Number);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

// Helper: Format Date to "10:00 AM" style
const formatSlotTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

router.get("/slots", verifyToken, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res
        .status(400)
        .json({ message: "Doctor ID and Date are required" });
    }

    // 1. Check for Holidays first
    const requestDate = new Date(date);
    const holiday = await HolidayModel.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate },
    });

    if (holiday) {
      return res.json({
        message: `Doctor is on holiday: ${holiday.reason || 'Holiday'}`,
        slots: [],
        morningSlots: [],
        eveningSlots: [],
        isHoliday: true,
      });
    }

    // 2. Fetch Doctor's Session Settings
    const session = await DoctorSessionModel.findOne({ doctorId });
    
    if (!session) {
      // No session configured - return empty with message
      return res.json({
        message: "Doctor has not configured their session timings",
        slots: [],
        morningSlots: [],
        eveningSlots: [],
        isHoliday: false,
      });
    }

    // 3. Check if doctor works on this day
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
        message: `Doctor does not work on ${longDay}s`,
        slots: [],
        morningSlots: [],
        eveningSlots: [],
        isHoliday: false,
      });
    }

    // 4. Generate Slots for Morning and Evening Sessions
    const interval = parseInt(session.timeSlotMinutes, 10) || 30;
    const morningSlots = [];
    const eveningSlots = [];

    // Morning Session
    if (session.morningStart && session.morningEnd && session.morningStart !== "-" && session.morningEnd !== "-") {
      let current = parseSessionTime(session.morningStart, date);
      const endTime = parseSessionTime(session.morningEnd, date);

      if (current && endTime && current < endTime) {
        while (current < endTime) {
          morningSlots.push(formatSlotTime(current));
          current.setMinutes(current.getMinutes() + interval);
        }
      }
    }

    // Evening Session
    if (session.eveningStart && session.eveningEnd && session.eveningStart !== "-" && session.eveningEnd !== "-") {
      let current = parseSessionTime(session.eveningStart, date);
      const endTime = parseSessionTime(session.eveningEnd, date);

      if (current && endTime && current < endTime) {
        while (current < endTime) {
          eveningSlots.push(formatSlotTime(current));
          current.setMinutes(current.getMinutes() + interval);
        }
      }
    }

    // 5. Filter out Booked Slots
    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctorId,
      date: date,
      status: { $ne: "cancelled" },
    }).select("time");

    const bookedTimes = bookedAppointments.map((a) => (a.time || "").toLowerCase());

    const availableMorningSlots = morningSlots.filter(
      (slot) => !bookedTimes.includes(slot.toLowerCase())
    );
    const availableEveningSlots = eveningSlots.filter(
      (slot) => !bookedTimes.includes(slot.toLowerCase())
    );

    // Combined slots for backward compatibility
    const allSlots = [...availableMorningSlots, ...availableEveningSlots];

    res.json({
      slots: allSlots,
      morningSlots: availableMorningSlots,
      eveningSlots: availableEveningSlots,
      isHoliday: false,
      sessionInfo: {
        slotDuration: interval,
        morningSession: session.morningStart && session.morningEnd ? `${session.morningStart} - ${session.morningEnd}` : null,
        eveningSession: session.eveningStart && session.eveningEnd ? `${session.eveningStart} - ${session.eveningEnd}` : null,
      }
    });
  } catch (err) {
    console.error("Error fetching slots:", err.message);
    res.status(500).json({ message: "Server error checking slots" });
  }
});

// ==========================================
// CREATE APPOINTMENT
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    // Holiday validation
    if (req.body.doctorId && req.body.date) {
      const apptDate = new Date(req.body.date);
      const onHoliday = await HolidayModel.findOne({
        doctorId: req.body.doctorId,
        fromDate: { $lte: apptDate },
        toDate: { $gte: apptDate },
      });

      if (onHoliday) {
        return res.status(400).json({
          message: `Doctor is on holiday from ${new Date(
            onHoliday.fromDate
          ).toLocaleDateString()} to ${new Date(
            onHoliday.toDate
          ).toLocaleDateString()}. Please choose another date.`,
        });
      }
    }

    const payload = {
      patientId: req.body.patientId || null,
      patientName: req.body.patientName || req.body.patient || "Patient",
      patientEmail: req.body.patientEmail || req.body.email || "",
      patientPhone: req.body.patientPhone || req.body.phone || "",
      doctorId: req.body.doctorId || null,
      doctorName: req.body.doctorName || req.body.doctor || "",
      // Strict Isolation: Only Admins can manually set clinicId
      clinicId:
        req.user.role === "admin"
          ? req.body.clinicId || req.user.clinicId
          : req.user.clinicId,

      clinic: req.body.clinic || "",
      date: req.body.date || "",
      time: req.body.time || "",
      services: (() => {
        const raw = req.body.services || req.body.servicesDetail || "";
        if (Array.isArray(raw)) {
          return raw.map(s => String(s).trim()).filter(Boolean);
        }
        if (typeof raw === "string" && raw.trim()) {
          return raw.split(",").map(s => s.trim()).filter(Boolean);
        }
        return [];
      })(),
      servicesDetail: req.body.servicesDetail || "",
      charges: req.body.charges || 0,
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "upcoming",
      
      // Online Appointment Fields
      appointmentMode: req.body.appointmentMode || null,
      onlinePlatform: req.body.onlinePlatform || null,
      meetingLink: null,
      googleEventId: null,
      zoomMeetingId: null,
      
      // Queue Token and Department - will be populated below
      queueToken: null,
      department: null,
      
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

    // Auto-generate Queue Token (sequential per doctor per day)
    if (payload.doctorId && payload.date) {
      const apptDate = new Date(payload.date);
      // Get start and end of the day for the appointment
      const startOfDay = new Date(apptDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(apptDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Count existing appointments for this doctor on this day
      const existingCount = await AppointmentModel.countDocuments({
        doctorId: payload.doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      });

      payload.queueToken = existingCount + 1;
    }

    // Auto-populate Department from Doctor's Specialization
    if (payload.doctorId) {
      try {
        const doctor = await DoctorModel.findById(payload.doctorId);
        if (doctor && doctor.specialization) {
          payload.department = doctor.specialization;
        }
      } catch (docErr) {
        logger.debug("Could not fetch doctor specialization for department", { error: docErr.message });
      }
    }

    // Generate meeting link if online appointment
    if (payload.appointmentMode === 'online' && payload.onlinePlatform && payload.doctorId) {
      try {
        if (payload.onlinePlatform === 'google_meet') {
          const meetResult = await createGoogleMeetEvent(payload.doctorId, {
            patientName: payload.patientName,
            patientEmail: payload.patientEmail,
            date: payload.date,
            time: payload.time,
            services: Array.isArray(payload.services) ? payload.services.join(', ') : payload.services,
            clinicName: payload.clinic
          });
          payload.meetingLink = meetResult.meetingLink;
          payload.googleEventId = meetResult.eventId;
          logger.info("Google Meet link generated for appointment", { meetingLink: meetResult.meetingLink });
        } else if (payload.onlinePlatform === 'zoom') {
          const zoomResult = await createZoomMeeting(payload.doctorId, {
            patientName: payload.patientName,
            date: payload.date,
            time: payload.time,
            services: Array.isArray(payload.services) ? payload.services.join(', ') : payload.services,
            clinicName: payload.clinic
          });
          payload.meetingLink = zoomResult.meetingLink;
          payload.zoomMeetingId = zoomResult.meetingId;
          logger.info("Zoom meeting link generated for appointment", { meetingLink: zoomResult.meetingLink });
        }
      } catch (meetingErr) {
        logger.error("Failed to generate meeting link", { error: meetingErr.message });
        // Continue with appointment creation even if meeting generation fails
      }
    }

    const created = await AppointmentModel.create(payload);


    // Fetch email/phone if missing
    let targetEmail = payload.patientEmail;
    let targetPhone = payload.patientPhone;

    if ((!targetEmail || !targetPhone) && payload.patientId) {
      try {
        const patientDoc = await PatientModel.findById(payload.patientId);
        if (patientDoc) {
          if (!targetEmail) targetEmail = patientDoc.email;
          if (!targetPhone) targetPhone = patientDoc.phone || patientDoc.mobile;
        }
      } catch (e) {
        logger.debug("Could not fetch patient contact info for notification", {
          patientId: payload.patientId,
          error: e.message,
        });
      }
    }

    // Send notifications
    let formattedDate = payload.date;
    try {
      if (payload.date)
        formattedDate = new Date(payload.date).toLocaleDateString("en-GB");
    } catch (e) {
      logger.debug("Could not format appointment date", {
        date: payload.date,
        error: e.message,
      });
    }

    if (targetEmail) {
      sendEmail({
        to: targetEmail,
        subject: payload.appointmentMode === 'online' 
          ? "Your Online Appointment is Confirmed | OneCare" 
          : "Your Appointment is Confirmed | OneCare",
        html: appointmentBookedTemplate({
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          clinicName: payload.clinic,
          date: formattedDate,
          time: payload.time,
          services: payload.services,
          appointmentMode: payload.appointmentMode,
          onlinePlatform: payload.onlinePlatform,
          meetingLink: created.meetingLink, // Use the saved meeting link
        }),
      });
    }

    if (targetPhone) {
      let whatsappBody = `Hello ${payload.patientName},\n\nYour appointment with Dr. ${payload.doctorName} at ${payload.clinic} is confirmed for ${formattedDate} at ${payload.time}.`;
      
      // Add meeting link for online appointments
      if (payload.appointmentMode === 'online' && created.meetingLink) {
        const platformName = payload.onlinePlatform === 'google_meet' ? 'Google Meet' : 'Zoom';
        whatsappBody += `\n\n📹 This is an online appointment via ${platformName}.\nJoin here: ${created.meetingLink}`;
      }
      
      whatsappBody += `\n\nThank you for choosing OneCare!`;
      sendWhatsAppMessage(targetPhone, whatsappBody);
    }


    // Real-time Notification
    try {
      emitToAdmin("appointment:created", created);
      if (payload.doctorId) {
        emitToUser(payload.doctorId, "appointment:created", created);
      }
    } catch (err) {
      logger.error("Socket emit error:", err);
    }

    return res.status(201).json(created);
  } catch (err) {
    logger.error("Error creating appointment", { error: err.message });
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});
router.get("/", verifyToken, async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      date,
      status,
      limit = 20,
      cursor,
      search,
    } = req.query;

    let query = {};

    // Standard filters
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId))
      query.doctorId = doctorId;
    if (patientId && mongoose.Types.ObjectId.isValid(patientId))
      query.patientId = patientId;
    if (status) query.status = status;

    // Multi-tenant filtering (strict)
    // Multi-tenant filtering (strict)
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === "admin") {
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

    if (effectiveRole === "admin") {
      // Global View
    } else if (effectiveRole === "patient") {
      // Patients can only see their own appointments
      // Look up patient record by userId to get patientId
      const patientRecord = await PatientModel.findOne({ userId: req.user.id });
      if (patientRecord) {
        query.patientId = patientRecord._id;
      } else {
        // No patient record found, return empty
        return res.json({
          data: [],
          pagination: {
            nextCursor: null,
            hasMore: false,
            limit: parseInt(limit) || 20,
          },
        });
      }
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      // Fallback for paginated response
      return res.json({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
          limit: parseInt(limit) || 20,
        },
      });
    }

    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Text search (simple regex on fields if search term provided)
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { patientName: searchRegex },
        { doctorName: searchRegex },
        { clinic: searchRegex },
      ];
    }

    // Cursor-based pagination logic
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }

    const pageSize = parseInt(limit) || 20;

    const appointments = await AppointmentModel.find(query)
      .sort({ _id: -1 })
      .limit(pageSize)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient",
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName",
        model: "Doctor",
      })
      .lean();

    // Determine next cursor
    const nextCursor =
      appointments.length === pageSize
        ? appointments[appointments.length - 1]._id
        : null;

    // Normalize functionality (inline to avoid dependency issues if helper changes)
    const normalized = appointments.map((a) => {
      const copy = { ...a };
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName =
          copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
        copy.patientEmail = copy.patientEmail || p.email || "";
        copy.patientPhone = copy.patientPhone || p.phone || "";
      }
      if (copy.doctorId && typeof copy.doctorId === "object") {
        const d = copy.doctorId;
        const docName =
          d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim();
        copy.doctorName = copy.doctorName || docName;
        copy.clinic = copy.clinic || d.clinic || "";
      }
      return copy;
    });

    res.json({
      data: normalized,
      pagination: {
        nextCursor,
        hasMore: !!nextCursor,
        limit: pageSize,
      },
    });
  } catch (err) {
    console.error("Appointments list error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/all
router.get("/all", verifyToken, async (req, res) => {
  try {
    const query = {};
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === "admin") {
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

    if (effectiveRole === "admin") {
      // Global
    } else if (effectiveRole === "patient") {
      // Patients can only see their own appointments
      const patientRecord = await PatientModel.findOne({ userId: req.user.id });
      if (patientRecord) {
        query.patientId = patientRecord._id;
      } else {
        return res.json([]);
      }
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      return res.json([]);
    }
    const list = await AppointmentModel.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient",
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName",
        model: "Doctor",
      })
      .lean();
    res.json(list);
  } catch (err) {
    console.error("Error fetching all appointments:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/today
router.get("/today", verifyToken, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };

    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === "admin") {
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

    if (effectiveRole === "admin") {
      // Global
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      return res.json([]);
    }

    const list = await AppointmentModel.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient",
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName",
        model: "Doctor",
      })
      .lean();

    res.json(list);
  } catch (err) {
    console.error("Error fetching today's appointments:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/weekly
// GET /appointments/weekly
router.get("/weekly", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfPeriod = new Date(today);
    startOfPeriod.setDate(today.getDate() - 6);
    startOfPeriod.setHours(0, 0, 0, 0);

    let matchStage = {
      $expr: {
        $and: [
          { $gte: [{ $toDate: "$date" }, startOfPeriod] },
          { $lte: [{ $toDate: "$date" }, endOfDay] },
        ],
      },
    };
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === "admin") {
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

    if (effectiveRole === "admin") {
      // Global
    } else if (safeClinicId) {
      matchStage.clinicId = new mongoose.Types.ObjectId(safeClinicId);
    } else {
      return res.json([]);
    }

    const stats = await AppointmentModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          dateStr: {
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } },
          },
        },
      },
      {
        $group: {
          _id: "$dateStr",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format results to match the last 7 days (including empty days)
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const found = stats.find((s) => s._id === dateStr);
      result.push({ label: dayName, count: found ? found.count : 0 });
    }

    res.json(result);
  } catch (err) {
    console.error("Weekly stats error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/monthly
// GET /appointments/monthly
router.get("/monthly", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Calculate start and end of the month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    let matchStage = {
      $expr: {
        $and: [
          { $gte: [{ $toDate: "$date" }, startOfMonth] },
          { $lte: [{ $toDate: "$date" }, endOfMonth] },
        ],
      },
    };
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === "admin") {
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

    if (effectiveRole === "admin") {
      // Global
    } else if (safeClinicId) {
      matchStage.clinicId = new mongoose.Types.ObjectId(safeClinicId);
    } else {
      return res.json([]);
    }

    const stats = await AppointmentModel.aggregate([
      { $match: matchStage },
      {
        $project: {
          // Calculate week number within the month (simplified approximation matching previous logic)
          // Previous logic: Week 1 (1-7), Week 2 (8-14), Week 3 (15-21), Week 4 (22-end)
          dayOfMonth: { $dayOfMonth: { $toDate: "$date" } },
        },
      },
      {
        $bucket: {
          groupBy: "$dayOfMonth",
          boundaries: [1, 8, 15, 22, 32], // 32 to safely cover up to 31st
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    // Map buckets to labels
    const weekMap = {
      1: "Week 1",
      8: "Week 2",
      15: "Week 3",
      22: "Week 4",
    };

    const result = [1, 8, 15, 22].map((boundary) => {
      const found = stats.find((s) => s._id === boundary);
      return {
        label: weekMap[boundary],
        count: found ? found.count : 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Monthly stats error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// CSV File Import
router.post("/import", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          date: row.date,
          time: row.time,
          clinic: row.clinic || row["Clinic name"],
          services: row.service || row.Service,
          doctorName: row.doctor || row["Doctor name"],
          patientName: row.patient || row["Patient name"],
          status: row.status || row.Status || "booked",
        });
      })
      .on("end", async () => {
        await AppointmentModel.insertMany(results);
        fs.unlinkSync(req.file.path);
        res.json({ message: "Imported appointments", count: results.length });
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err.message);
        res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("Import error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public Verification Endpoint (No Auth Required - for QR code scans)
router.get("/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",
        populate: { path: "userId", model: "User", select: "name" }
      })
      .populate("doctorId", "firstName lastName specialization");

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Return limited info for verification (no sensitive data)
    const patientName = appt.patientId?.userId?.name || appt.patientName || "N/A";
    const patientPid = appt.patientId?.pid || appt.patientId?.uhid || "N/A";
    const doctorName = appt.doctorId?.firstName 
      ? `Dr. ${appt.doctorId.firstName} ${appt.doctorId.lastName || ""}`.trim()
      : (appt.doctorName || "N/A");
    
    // Format appointment ID like in PDF
    const uniqueId = appt._id.toString().slice(-5).toUpperCase();
    const appointmentId = `APT-${uniqueId}`;

    res.json({
      id: appt._id,
      appointmentId,
      date: appt.date,
      time: appt.time,
      patientName,
      patientPid,
      doctorName,
      department: appt.department || appt.doctorId?.specialization || "General",
      status: appt.status,
      appointmentMode: appt.appointmentMode,
      verified: true
    });

  } catch (err) {
    logger.error("Appointment verification failed", { error: err.message });
    res.status(500).json({ message: "Verification failed" });
  }
});

// PDF Generation (pdf-lib based - matches HTML template exactly)
router.get("/:id/pdf", allowUrlToken, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch Appointment with all populated fields
    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",
        populate: { path: "userId", model: "User" }
      })
      .populate("doctorId")
      .populate("clinicId");

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // === DATA PREPARATION ===
    
    // 1. Clinic/Hospital Info
    const hospitalName = appt.clinicId?.name || appt.doctorId?.clinic || appt.clinic || "OneCare Medical Center";
    let hospitalAddress = "";
    if (appt.clinicId?.address?.full) {
      hospitalAddress = appt.clinicId.address.full;
      if (appt.clinicId.address.city) hospitalAddress += ", " + appt.clinicId.address.city;
      if (appt.clinicId.address.state) hospitalAddress += ", " + appt.clinicId.address.state;
      if (appt.clinicId.address.postalCode) hospitalAddress += " - " + appt.clinicId.address.postalCode;
    }
    const hospitalContact = appt.clinicId?.contact || "";
    const hospitalEmail = appt.clinicId?.email || "";
    const hospitalGstin = appt.clinicId?.gstin || "";
    
    // 2. Patient Info
    const patientUser = appt.patientId?.userId || {};
    const patientDetails = appt.patientId || {};
    
    const nameParts = (patientUser.name || appt.patientName || "").split(" ");
    const firstName = nameParts[0] || "N/A";
    const lastName = nameParts.slice(1).join(" ") || "";
    const patientPid = patientDetails.pid || patientDetails.uhid || "N/A";
    
    const dobObj = patientUser.dob ? new Date(patientUser.dob) : null;
    const dobFormatted = dobObj ? dobObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A";
    
    let ageYears = "N/A";
    if (dobObj) {
      const now = new Date();
      let age = now.getFullYear() - dobObj.getFullYear();
      if (now.getMonth() < dobObj.getMonth() || (now.getMonth() === dobObj.getMonth() && now.getDate() < dobObj.getDate())) age--;
      if (!isNaN(age) && age >= 0) ageYears = `${age} Years`;
    }
    
    const patientGender = patientUser.gender || "N/A";
    const patientBloodGroup = patientUser.bloodGroup || "N/A";
    const patientContact = patientUser.phone || appt.patientPhone || "N/A";
    const patientEmail = patientUser.email || appt.patientEmail || "N/A";
    const patientAddress = patientUser.addressLine1 || "N/A";
    const patientCity = patientUser.city || "N/A";
    const patientPostalCode = patientUser.postalCode || "N/A";
    const patientCountry = patientUser.country || "India";

    // 3. Doctor Info
    const doctorFullName = appt.doctorId?.firstName 
      ? `Dr. ${appt.doctorId.firstName} ${appt.doctorId.lastName || ""}`.trim() 
      : (appt.doctorName ? `Dr. ${appt.doctorName}` : "Doctor");
    const doctorQualification = appt.doctorId?.qualification || appt.doctorId?.specialization || "Specialist";
    const doctorCabin = appt.doctorId?.cabin || "N/A";
    const doctorFloor = appt.doctorId?.floor || "N/A";
    const doctorLocation = `${doctorCabin}, ${doctorFloor}`;
    const doctorClinicWing = appt.clinic || "Main Diagnostic Wing";
    
    // 4. Appointment Info
    const apptDateObj = appt.date ? new Date(appt.date) : new Date();
    const apptDateFormatted = apptDateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    const apptTime = appt.time || "N/A";
    const apptDepartment = appt.department || appt.doctorId?.specialization || "General";
    const queueToken = appt.queueToken ? `#${appt.queueToken}` : "N/A";
    
    let visitCategory = "General Consultation";
    if (Array.isArray(appt.services) && appt.services.length > 0) {
      visitCategory = appt.services[0];
    } else if (appt.services) {
      visitCategory = appt.services;
    }
    
    const apptType = appt.appointmentMode === 'online' ? "Online Consultation" : "Physical / In-Person";
    
    // Generate Appointment ID
    const uniqueId = appt._id.toString().slice(-5).toUpperCase();
    const appointmentId = `APT-${uniqueId}`;
    
    const generatedDate = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });

    // === PDF CREATION (A4: 595.28 x 841.89 pts) ===
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors matching the HTML template
    const brandColor = rgb(0.059, 0.090, 0.165);     // #0f172a
    const accentBlue = rgb(0.145, 0.388, 0.922);     // #2563eb
    const primaryText = rgb(0.118, 0.161, 0.231);    // #1e293b
    const secondaryText = rgb(0.392, 0.455, 0.545);  // #64748b
    const borderColor = rgb(0.886, 0.910, 0.941);    // #e2e8f0
    const bgSoft = rgb(0.973, 0.980, 0.988);         // #f8fafc
    const white = rgb(1, 1, 1);

    const margin = 42; // ~15mm
    let y = height - margin;

    // =============================================
    // 1. HOSPITAL BRAND HEADER
    // =============================================
    const headerStartY = y;
    const logoSize = 60;
    
    // Logo/Initials box
    let logoDrawn = false;
    try {
      if (appt.clinicId?.clinicLogo) {
        const logoPath = path.join(__dirname, "..", "uploads", appt.clinicId.clinicLogo);
        if (fs.existsSync(logoPath)) {
          const logoBytes = fs.readFileSync(logoPath);
          const ext = appt.clinicId.clinicLogo.toLowerCase();
          const logoImg = ext.endsWith('.png') ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
          if (logoImg) {
            page.drawImage(logoImg, { x: margin, y: y - logoSize, width: logoSize, height: logoSize });
            logoDrawn = true;
          }
        }
      }
    } catch (e) {}

    if (!logoDrawn) {
      // Draw placeholder box with initials
      const initials = hospitalName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      page.drawRectangle({ x: margin, y: y - logoSize, width: logoSize, height: logoSize, color: brandColor });
      const iw = fontBold.widthOfTextAtSize(initials, 22);
      page.drawText(initials, { x: margin + (logoSize - iw) / 2, y: y - logoSize + 22, size: 22, font: fontBold, color: white });
    }

    // Hospital identity (left of logo)
    const textX = margin + logoSize + 15;
    page.drawText(hospitalName.toUpperCase(), { x: textX, y: y - 18, size: 20, font: fontBold, color: brandColor });
    
    let lineY = y - 34;
    if (hospitalAddress) {
      page.drawText(hospitalAddress, { x: textX, y: lineY, size: 9, font, color: secondaryText });
      lineY -= 12;
    }
    if (hospitalContact || hospitalEmail) {
      let contactLine = "";
      if (hospitalContact) contactLine += `Contact: ${hospitalContact}`;
      if (hospitalEmail) contactLine += (contactLine ? " | " : "") + `Email: ${hospitalEmail}`;
      page.drawText(contactLine, { x: textX, y: lineY, size: 9, font, color: secondaryText });
      lineY -= 12;
    }
    if (hospitalGstin) {
      page.drawText(`GSTIN: ${hospitalGstin}`, { x: textX, y: lineY, size: 8, font, color: secondaryText });
    }

    // Appointment label (right side)
    const rightEdge = width - margin;
    const slipTitle = "APPOINTMENT SLIP";
    page.drawText(slipTitle, { x: rightEdge - fontBold.widthOfTextAtSize(slipTitle, 14), y: y - 12, size: 14, font: fontBold, color: accentBlue });
    
    // ID Badge
    const idBadgeText = `ID: #${appointmentId}`;
    const idBadgeW = fontBold.widthOfTextAtSize(idBadgeText, 10) + 16;
    const idBadgeX = rightEdge - idBadgeW;
    page.drawRectangle({ x: idBadgeX, y: y - 38, width: idBadgeW, height: 18, color: brandColor });
    page.drawText(idBadgeText, { x: idBadgeX + 8, y: y - 33, size: 10, font: fontBold, color: white });
    
    // Generated date
    page.drawText(`Generated: ${generatedDate}`, { x: rightEdge - font.widthOfTextAtSize(`Generated: ${generatedDate}`, 8), y: y - 52, size: 8, font, color: secondaryText });

    // Header bottom border
    y = headerStartY - logoSize - 15;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 3, color: brandColor });
    y -= 20;

    // =============================================
    // 2. SCHEDULE BAR (4 columns)
    // =============================================
    const scheduleBarH = 45;
    const scheduleColW = (width - 2 * margin - 30) / 4;
    const scheduleItems = [
      ["Queue Token", queueToken],
      ["Appointment Date", apptDateFormatted],
      ["Reporting Time", apptTime],
      ["Department", apptDepartment]
    ];

    scheduleItems.forEach(([label, value], i) => {
      const boxX = margin + i * (scheduleColW + 10);
      // Border box
      page.drawRectangle({ x: boxX, y: y - scheduleBarH, width: scheduleColW, height: scheduleBarH, borderColor, borderWidth: 1, color: white });
      // Label
      page.drawText(label.toUpperCase(), { x: boxX + 8, y: y - 14, size: 7, font: fontBold, color: secondaryText });
      // Value
      page.drawText(String(value), { x: boxX + 8, y: y - 30, size: 12, font: fontBold, color: brandColor });
    });

    y -= scheduleBarH + 20;

    // =============================================
    // 3. PATIENT PROFILE SECTION
    // =============================================
    // Section title with left border
    const sectionTitleH = 22;
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: width - 2 * margin, height: sectionTitleH, color: bgSoft });
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: 4, height: sectionTitleH, color: brandColor });
    page.drawText("Patient Profile", { x: margin + 12, y: y - 15, size: 10, font: fontBold, color: brandColor });
    y -= sectionTitleH + 12;

    // Patient data grid (3 columns x 3 rows)
    const fieldColW = (width - 2 * margin) / 3;
    const fieldRowH = 28;
    
    const patientFields = [
      [["First Name", firstName], ["Last Name", lastName || "—"], ["Patient UHID", patientPid]],
      [["Date of Birth", dobFormatted], ["Gender", patientGender], ["Blood Group", patientBloodGroup]],
      [["Contact No", patientContact], ["Email Address", patientEmail], ["Age", ageYears]]
    ];

    patientFields.forEach((row, rowIdx) => {
      row.forEach(([label, value], colIdx) => {
        const fx = margin + colIdx * fieldColW + 10;
        const fy = y - rowIdx * fieldRowH;
        page.drawText(label.toUpperCase(), { x: fx, y: fy, size: 7, font: fontBold, color: secondaryText });
        page.drawText(String(value), { x: fx, y: fy - 12, size: 10, font, color: primaryText });
      });
    });

    y -= patientFields.length * fieldRowH + 15;

    // =============================================
    // 4. ADDRESS & COMMUNICATION SECTION
    // =============================================
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: width - 2 * margin, height: sectionTitleH, color: bgSoft });
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: 4, height: sectionTitleH, color: brandColor });
    page.drawText("Address & Communication", { x: margin + 12, y: y - 15, size: 10, font: fontBold, color: brandColor });
    y -= sectionTitleH + 12;

    // Address row 1 (address spans 2 cols)
    page.drawText("RESIDENTIAL ADDRESS", { x: margin + 10, y: y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(patientAddress, { x: margin + 10, y: y - 12, size: 10, font, color: primaryText });
    page.drawText("CITY", { x: margin + fieldColW * 2 + 10, y: y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(patientCity, { x: margin + fieldColW * 2 + 10, y: y - 12, size: 10, font, color: primaryText });
    y -= fieldRowH;

    // Address row 2
    page.drawText("POSTAL CODE", { x: margin + 10, y: y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(patientPostalCode, { x: margin + 10, y: y - 12, size: 10, font, color: primaryText });
    page.drawText("COUNTRY", { x: margin + fieldColW + 10, y: y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(patientCountry, { x: margin + fieldColW + 10, y: y - 12, size: 10, font, color: primaryText });
    y -= fieldRowH + 15;

    // =============================================
    // 5. CONSULTATION INFORMATION CARD
    // =============================================
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: width - 2 * margin, height: sectionTitleH, color: bgSoft });
    page.drawRectangle({ x: margin, y: y - sectionTitleH, width: 4, height: sectionTitleH, color: brandColor });
    page.drawText("Consultation Information", { x: margin + 12, y: y - 15, size: 10, font: fontBold, color: brandColor });
    y -= sectionTitleH + 8;

    // Consultation card (border box with 2x2 grid)
    const cardH = 85;
    const cardPad = 15;
    page.drawRectangle({ x: margin, y: y - cardH, width: width - 2 * margin, height: cardH, borderColor, borderWidth: 1, color: white });

    const halfW = (width - 2 * margin) / 2;
    
    // Row 1: Doctor + Location
    const consult1Y = y - 20;
    page.drawText("CONSULTING SPECIALIST", { x: margin + cardPad, y: consult1Y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(doctorFullName, { x: margin + cardPad, y: consult1Y - 14, size: 13, font: fontBold, color: accentBlue });
    page.drawText(doctorQualification, { x: margin + cardPad, y: consult1Y - 26, size: 9, font, color: secondaryText });

    page.drawText("LOCATION / FLOOR", { x: margin + halfW + cardPad, y: consult1Y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(doctorLocation, { x: margin + halfW + cardPad, y: consult1Y - 14, size: 11, font, color: primaryText });
    page.drawText(doctorClinicWing, { x: margin + halfW + cardPad, y: consult1Y - 26, size: 9, font, color: secondaryText });

    // Row 2: Visit Category + Appointment Type
    const consult2Y = consult1Y - 48;
    page.drawText("VISIT CATEGORY", { x: margin + cardPad, y: consult2Y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(visitCategory, { x: margin + cardPad, y: consult2Y - 12, size: 10, font, color: primaryText });

    page.drawText("APPOINTMENT TYPE", { x: margin + halfW + cardPad, y: consult2Y, size: 7, font: fontBold, color: secondaryText });
    page.drawText(apptType, { x: margin + halfW + cardPad, y: consult2Y - 12, size: 10, font, color: primaryText });

    y -= cardH + 10;

    // =============================================
    // 6. FOOTER WITH QR CODE
    // =============================================
    const footerY = 70;
    page.drawLine({ start: { x: margin, y: footerY + 30 }, end: { x: width - margin, y: footerY + 30 }, thickness: 1, color: borderColor });

    // QR Code (left) - uses FRONTEND_URL for verification
    const qrSize = 65;
    try {
      // Use FRONTEND_URL from environment (works for localhost, Render, AWS)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyUrl = `${frontendUrl}/verify/appointment/${appt._id}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });
      const qrImg = await pdfDoc.embedPng(qrDataUrl);
      // QR with border
      page.drawRectangle({ x: margin, y: footerY - qrSize + 20, width: qrSize + 10, height: qrSize + 10, borderColor, borderWidth: 1, color: white });
      page.drawImage(qrImg, { x: margin + 5, y: footerY - qrSize + 25, width: qrSize, height: qrSize });
    } catch (e) {
      logger.debug("QR code generation failed", { error: e.message });
    }

    // System tag (right) - fixed spacing
    const sysTag1 = "This is a system-generated document.";
    page.drawText(sysTag1, { x: rightEdge - font.widthOfTextAtSize(sysTag1, 8), y: footerY + 10, size: 8, font, color: secondaryText });
    
    // "Powered by OneCare Hospital Management System" - draw as parts for bold "OneCare"
    const poweredByText = "Powered by ";
    const oneCareText = "OneCare";
    const hmsText = " Hospital Management System";
    const totalWidth = font.widthOfTextAtSize(poweredByText, 8) + fontBold.widthOfTextAtSize(oneCareText, 8) + font.widthOfTextAtSize(hmsText, 8);
    const startX = rightEdge - totalWidth;
    page.drawText(poweredByText, { x: startX, y: footerY - 2, size: 8, font, color: secondaryText });
    page.drawText(oneCareText, { x: startX + font.widthOfTextAtSize(poweredByText, 8), y: footerY - 2, size: 8, font: fontBold, color: accentBlue });
    page.drawText(hmsText, { x: startX + font.widthOfTextAtSize(poweredByText, 8) + fontBold.widthOfTextAtSize(oneCareText, 8), y: footerY - 2, size: 8, font, color: secondaryText });

    // === SEND PDF ===
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Appointment_${appointmentId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    logger.error("Appointment PDF Generation failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: "Failed to generate appointment PDF. Please try again." });
  }
});

// Get appointment by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient",
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName",
        model: "Doctor",
      })
      .lean();

    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    // Normalize patient info
    let patientInfo = { name: "N/A", email: "N/A", phone: "N/A" };
    if (appt.patientId && typeof appt.patientId === "object") {
      const p = appt.patientId;
      patientInfo.name =
        `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "N/A";
      patientInfo.email = p.email || "N/A";
      patientInfo.phone = p.phone || "N/A";
    } else if (appt.patientName) {
      patientInfo.name = appt.patientName || "N/A";
      patientInfo.email = appt.patientEmail || "N/A";
      patientInfo.phone = appt.patientPhone || "N/A";
    }
    appt._patientInfo = patientInfo;

    // Normalize doctor info
    let doctorInfo = { name: "N/A", clinic: "N/A" };
    if (appt.doctorId && typeof appt.doctorId === "object") {
      const d = appt.doctorId;
      doctorInfo.name =
        d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "N/A";
      doctorInfo.clinic = d.clinic || appt.clinic || "N/A";
    } else if (appt.doctorName) {
      doctorInfo.name = appt.doctorName;
      doctorInfo.clinic = appt.clinic || "N/A";
    }
    appt._doctorInfo = doctorInfo;

    return res.json(appt);
  } catch (err) {
    console.error("Error fetching appointment by id:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// Cancel appointment
router.put("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const appt = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE appointment
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete appointment
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await AppointmentModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
