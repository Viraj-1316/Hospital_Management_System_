const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const mongoose = require("mongoose");

const AppointmentModel = require("../models/Appointment");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const HolidayModel = require("../models/Holiday");
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
// GET AVAILABLE SLOTS
// ==========================================
router.get("/slots", verifyToken, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res
        .status(400)
        .json({ message: "Doctor ID and Date are required" });
    }

    const requestDate = new Date(date);
    const holiday = await HolidayModel.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate },
    });

    if (holiday) {
      return res.json({
        message: "Doctor is on holiday",
        slots: [],
        isHoliday: true,
      });
    }

    const allSlots = generateTimeSlots("09:00:00", "17:00:00", 30);
    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctorId,
      date: date,
      status: { $ne: "cancelled" },
    }).select("time");

    const bookedTimes = bookedAppointments.map((a) => a.time);
    const availableSlots = allSlots.filter(
      (time) => !bookedTimes.includes(time)
    );

    res.json({ slots: availableSlots, isHoliday: false });
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
      services: req.body.services || req.body.servicesDetail || "",
      servicesDetail: req.body.servicesDetail || "",
      charges: req.body.charges || 0,
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "upcoming",
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

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
        subject: "Your Appointment is Confirmed | OneCare",
        html: appointmentBookedTemplate({
          patientName: payload.patientName,
          doctorName: payload.doctorName,
          clinicName: payload.clinic,
          date: formattedDate,
          time: payload.time,
          services: payload.services,
        }),
      });
    }

    if (targetPhone) {
      const whatsappBody = `Hello ${payload.patientName},\n\nYour appointment with Dr. ${payload.doctorName} at ${payload.clinic} is confirmed for ${formattedDate} at ${payload.time}.\n\nThank you for choosing OneCare!`;
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

// PDF Generation
router.get("/:id/pdf", allowUrlToken, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id);
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    let doctor = null;
    if (appt.doctorName) {
      const parts = appt.doctorName.split(" ");
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      doctor = await DoctorModel.findOne({ firstName: first, lastName: last });
    }

    const clinicName = appt.clinic || doctor?.clinic || "Valley Clinic";
    const clinicEmail = doctor?.email || "info@medicalcenter.com";
    const clinicPhone = doctor?.phone || "+1 234 567 890";
    const rawAddress =
      doctor?.address || "123 Health Street\nMedical District, City, 000000";
    const addressLines = String(rawAddress).split(/\r?\n/).slice(0, 2);
    const patientName = appt.patientName || "N/A";

    const todayFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const apptDateObj = appt.date ? new Date(appt.date) : null;
    const apptDateFormatted = apptDateObj
      ? apptDateObj.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";
    const generatedDate = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const apptId = String(appt._id).substring(0, 8).toUpperCase();
    const apptTime = appt.slot || appt.time || "N/A";
    const apptStatus = (appt.status || "Booked").toUpperCase();
    const paymentMode = appt.paymentMode || "Manual";
    const serviceText = Array.isArray(appt.services)
      ? appt.services.join(", ")
      : appt.services || "General Consultation";
    const totalBill = appt.charges ? `Rs. ${appt.charges}/-` : "Rs. 0/-";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0, 0.53, 0.71);
    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.92, 0.92, 0.92);

    let cursorY = height - 50;
    const margin = 50;

    // Logo
    try {
      const logoPath = path.join(__dirname, "../assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoDims = logoImg.scale(0.25);
        page.drawImage(logoImg, {
          x: margin,
          y: cursorY - logoDims.height + 10,
          width: logoDims.width,
          height: logoDims.height,
        });
      }
    } catch (e) {
      logger.debug("Could not embed logo in PDF", { error: e.message });
    }

    const textStartX = 180;
    page.drawText(clinicName.toUpperCase(), {
      x: textStartX,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText(`Date: ${todayFormatted}`, {
      x: width - margin - 130,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: black,
    });
    page.drawText(`Booking ID: #${apptId}`, {
      x: width - margin - 130,
      y: cursorY - 15,
      size: 10,
      font: fontBold,
      color: black,
    });

    let detailsY = cursorY - 18;
    page.drawText(addressLines.join(", "), {
      x: textStartX,
      y: detailsY,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    detailsY -= 12;
    page.drawText(`Phone: ${clinicPhone}`, {
      x: textStartX,
      y: detailsY,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    detailsY -= 12;
    page.drawText(`Email: ${clinicEmail}`, {
      x: textStartX,
      y: detailsY,
      size: 10,
      font: fontRegular,
      color: gray,
    });

    cursorY -= 80;
    page.drawRectangle({
      x: 0,
      y: cursorY - 10,
      width: width,
      height: 30,
      color: primaryColor,
    });
    const titleText = "APPOINTMENT CONFIRMATION";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: cursorY,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    cursorY -= 50;
    const col1 = margin;
    const col2 = 320;

    page.drawText("PATIENT DETAILS", {
      x: col1,
      y: cursorY + 15,
      size: 10,
      font: fontBold,
      color: gray,
    });
    cursorY -= 15;
    page.drawText(patientName, {
      x: col1,
      y: cursorY + 15,
      size: 14,
      font: fontBold,
      color: black,
    });

    const sectionTopY = cursorY + 30;
    page.drawText("DOCTOR DETAILS", {
      x: col2,
      y: sectionTopY,
      size: 10,
      font: fontBold,
      color: gray,
    });
    page.drawText(`Dr. ${appt.doctorName}`, {
      x: col2,
      y: sectionTopY - 15,
      size: 14,
      font: fontBold,
      color: black,
    });
    page.drawText("General Physician", {
      x: col2,
      y: sectionTopY - 30,
      size: 10,
      font: fontRegular,
      color: black,
    });

    cursorY -= 40;
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 1,
      color: lightGray,
    });
    cursorY -= 30;

    page.drawText("APPOINTMENT DETAILS", {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: primaryColor,
    });
    cursorY -= 20;

    const drawDetailRow = (label, value, xPos, yPos) => {
      page.drawText(label, {
        x: xPos,
        y: yPos,
        size: 9,
        font: fontRegular,
        color: gray,
      });
      page.drawText(value, {
        x: xPos,
        y: yPos - 12,
        size: 11,
        font: fontBold,
        color: black,
      });
    };

    drawDetailRow("Date", apptDateFormatted, margin, cursorY);
    drawDetailRow("Time", apptTime, margin + 180, cursorY);

    let statusColor = black;
    if (apptStatus === "BOOKED" || apptStatus === "CONFIRMED")
      statusColor = rgb(0, 0.6, 0);
    if (apptStatus === "CANCELLED") statusColor = rgb(0.8, 0, 0);
    page.drawText("Status", {
      x: width - margin - 80,
      y: cursorY,
      size: 9,
      font: fontRegular,
      color: gray,
    });
    page.drawText(apptStatus, {
      x: width - margin - 80,
      y: cursorY - 12,
      size: 11,
      font: fontBold,
      color: statusColor,
    });

    cursorY -= 50;
    page.drawRectangle({
      x: margin,
      y: cursorY,
      width: width - margin * 2,
      height: 25,
      color: lightGray,
    });
    page.drawText("Service / Description", {
      x: margin + 10,
      y: cursorY + 7,
      size: 10,
      font: fontBold,
      color: black,
    });
    page.drawText("Amount", {
      x: width - margin - 70,
      y: cursorY + 7,
      size: 10,
      font: fontBold,
      color: black,
    });

    cursorY -= 25;
    page.drawText(serviceText, {
      x: margin + 10,
      y: cursorY + 8,
      size: 10,
      font: fontRegular,
      color: black,
    });
    page.drawText(totalBill, {
      x: width - margin - 70,
      y: cursorY + 8,
      size: 10,
      font: fontRegular,
      color: black,
    });
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 1,
      color: lightGray,
    });

    cursorY -= 35;
    page.drawText("Total Amount:", {
      x: width - margin - 150,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: black,
    });
    page.drawText(totalBill, {
      x: width - margin - 70,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: primaryColor,
    });

    cursorY -= 15;
    page.drawText(`Payment Mode: ${paymentMode}`, {
      x: width - margin - 150,
      y: cursorY,
      size: 9,
      font: fontRegular,
      color: gray,
    });

    const footerY = 50;
    page.drawText("Note:", {
      x: margin,
      y: footerY + 45,
      size: 9,
      font: fontBold,
      color: black,
    });
    page.drawText(
      "Please arrive 15 minutes prior to your appointment time. If you need to reschedule, contact us 24 hours in advance.",
      { x: margin, y: footerY + 33, size: 9, font: fontRegular, color: black }
    );

    page.drawLine({
      start: { x: margin, y: footerY + 15 },
      end: { x: width - margin, y: footerY + 15 },
      thickness: 1,
      color: lightGray,
    });
    page.drawText(`Generated on: ${generatedDate}`, {
      x: margin,
      y: footerY,
      size: 8,
      font: fontRegular,
      color: gray,
    });
    page.drawText(
      "This is a computer-generated document. No signature is required.",
      { x: margin, y: footerY - 10, size: 8, font: fontRegular, color: gray }
    );

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Appointment_${apptId}.pdf`
    );
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Appointment PDF error:", err.message);
    res.status(500).json({ message: "PDF generation failed" });
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
