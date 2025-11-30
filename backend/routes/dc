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

// --- HELPER: Generate Time Slots ---
const generateTimeSlots = (startStr, endStr, intervalMins) => {
  const slots = [];
  let current = new Date(`2000-01-01T${startStr}`);
  const end = new Date(`2000-01-01T${endStr}`);

  while (current < end) {
    const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + intervalMins);
  }
  return slots;
};

// ==========================================
// 1. GET AVAILABLE SLOTS (Logic for Frontend)
// ==========================================
router.get("/slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Doctor ID and Date are required" });
    }

    // 1. CHECK IF DOCTOR IS ON HOLIDAY
    // We convert the requested date to a Date object
    const requestDate = new Date(date); 
    
    // Check if the requested date falls within any holiday range for this doctor
    const holiday = await HolidayModel.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate }
    });

    if (holiday) {
      // If on holiday, return empty array immediately
      return res.json({ 
        message: "Doctor is on holiday", 
        slots: [], 
        isHoliday: true 
      });
    }

    // 2. IF NOT ON HOLIDAY, GENERATE SLOTS
    // (Assuming standard 9 AM - 5 PM for now, customize based on DoctorModel if needed)
    const allSlots = generateTimeSlots("09:00:00", "17:00:00", 30);

    // 3. REMOVE BOOKED SLOTS
    // Find existing appointments for this doctor on this date
    // Note: Assuming 'date' in AppointmentModel is stored as YYYY-MM-DD string or Date object. 
    // Adjust query matches your DB format.
    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctorId,
      date: date, // Ensuring string match "YYYY-MM-DD"
      status: { $ne: "cancelled" }
    }).select("time");

    const bookedTimes = bookedAppointments.map(a => a.time);

    // Filter out booked times
    const availableSlots = allSlots.filter(time => !bookedTimes.includes(time));

    res.json({ slots: availableSlots, isHoliday: false });

  } catch (err) {
    console.error("Error fetching slots:", err);
    res.status(500).json({ message: "Server error checking slots" });
  }
});


// ==========================================
// 2. CREATE APPOINTMENT (With Holiday Block)
// ==========================================
router.post("/", async (req, res) => {
  try {
    // --- STEP 1: HOLIDAY VALIDATION ---
    if (req.body.doctorId && req.body.date) {
        const apptDate = new Date(req.body.date);
        
        // Check if date falls in a holiday range
        const onHoliday = await HolidayModel.findOne({
            doctorId: req.body.doctorId,
            fromDate: { $lte: apptDate },
            toDate: { $gte: apptDate }
        });

        if (onHoliday) {
            return res.status(400).json({ 
                message: `Doctor is on holiday from ${new Date(onHoliday.fromDate).toLocaleDateString()} to ${new Date(onHoliday.toDate).toLocaleDateString()}. Please choose another date.` 
            });
        }
    }
    // ----------------------------------

    const payload = {
      patientId: req.body.patientId || null,
      patientName: req.body.patientName || req.body.patient || "Patient",
      patientEmail: req.body.patientEmail || req.body.email || "",
      patientPhone: req.body.patientPhone || req.body.phone || "",

      doctorId: req.body.doctorId || null,
      doctorName: req.body.doctorName || req.body.doctor || "",

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

    // Logic to fetch email/phone if missing
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
        console.log("Warning: Could not fetch patient details for notification");
      }
    }

    // Notifications
    let formattedDate = payload.date;
    try {
        if (payload.date) formattedDate = new Date(payload.date).toLocaleDateString("en-GB");
    } catch (e) {}

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

    return res.status(201).json(created);
  } catch (err) {
    console.error("Error creating appointment:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// List appointments with optional filters
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.clinic) q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient) q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor) q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    // Filter by patientId
    if (req.query.patientId) {
      if (mongoose.Types.ObjectId.isValid(req.query.patientId)) {
        const p = await PatientModel.findOne({
          $or: [{ _id: req.query.patientId }, { userId: req.query.patientId }],
        });
        if (p) q.patientId = p._id;
        else q.patientId = req.query.patientId;
      } else {
        q.patientId = req.query.patientId;
      }
    }

    // Filter by doctorId
    if (req.query.doctorId && mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
        q.doctorId = req.query.doctorId;
    }

    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient" 
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName", 
        model: "Doctor"
      })
      .lean();

    // Normalize data for frontend
    const normalized = list.map(a => {
      const copy = { ...a };
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || copy.patientName;
        copy.patientEmail = copy.patientEmail || p.email || "";
        copy.patientPhone = copy.patientPhone || p.phone || "";
      }
      if (copy.doctorId && typeof copy.doctorId === "object") {
        const d = copy.doctorId;
        const docName = d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim();
        copy.doctorName = copy.doctorName || docName || "";
        copy.clinic = copy.clinic || d.clinic || copy.clinic;
      }
      return copy;
    });

    res.json(normalized);
  } catch (err) {
    console.error("appointments list error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/all
router.get("/all", async (req, res) => {
  try {
    const list = await AppointmentModel.find()
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
    console.error("Error fetching all appointments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/today
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const list = await AppointmentModel.find({ date: todayStr })
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
    console.error("Error fetching today's appointments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/weekly
router.get("/weekly", async (req, res) => {
  try {
    const stats = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = await AppointmentModel.countDocuments({ date: dateStr });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      stats.push({ label: dayName, count });
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/monthly
router.get("/monthly", async (req, res) => {
  try {
    const stats = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
        const start = new Date(today);
        start.setDate(today.getDate() - (i * 7) - 6);
        let count = 0;
        for (let j=0; j<7; j++) {
            const d = new Date(start);
            d.setDate(start.getDate() + j);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;
            count += await AppointmentModel.countDocuments({ date: dateStr });
        }
        stats.push({ label: `Week ${4-i}`, count });
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Csv File Import data 
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          date: row.date,
          clinic: row["Clinic name"],
          services: row.Service,
          doctorName: row["Doctor name"],
          patientName: row["Patient name"],
          status: row.Status || "booked",
        });
      })
      .on("end", async () => {
        await AppointmentModel.insertMany(results);
        fs.unlinkSync(req.file.path);
        res.json({ message: "Imported appointments", count: results.length });
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PDF Generation
router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

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
    const rawAddress = doctor?.address || "123 Health Street\nMedical District, City, 000000";
    const addressLines = String(rawAddress).split(/\r?\n/).slice(0, 2);
    const patientName = appt.patientName || "N/A";
    
    // Dates
    const todayFormatted = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const apptDateObj = appt.date ? new Date(appt.date) : null;
    const apptDateFormatted = apptDateObj ? apptDateObj.toLocaleDateString("en-US", { weekday: 'short', year: "numeric", month: "long", day: "numeric" }) : "N/A";
    const generatedDate = new Date().toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit' });

    const apptId = String(appt._id).substring(0, 8).toUpperCase(); 
    const apptTime = appt.slot || appt.time || "N/A";
    const apptStatus = (appt.status || "Booked").toUpperCase();
    const paymentMode = appt.paymentMode || "Manual";
    const serviceText = appt.services || "General Consultation";
    const totalBill = appt.charges ? `Rs. ${appt.charges}/-` : "Rs. 0/-";

    // PDF Creation
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
        page.drawImage(logoImg, { x: margin, y: cursorY - logoDims.height + 10, width: logoDims.width, height: logoDims.height });
      }
    } catch (e) {}

    const textStartX = 180; 
    page.drawText(clinicName.toUpperCase(), { x: textStartX, y: cursorY, size: 18, font: fontBold, color: primaryColor });
    
    page.drawText(`Date: ${todayFormatted}`, { x: width - margin - 130, y: cursorY, size: 10, font: fontRegular, color: black });
    page.drawText(`Booking ID: #${apptId}`, { x: width - margin - 130, y: cursorY - 15, size: 10, font: fontBold, color: black });

    let detailsY = cursorY - 18;
    page.drawText(addressLines.join(", "), { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });
    detailsY -= 12;
    page.drawText(`Phone: ${clinicPhone}`, { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });
    detailsY -= 12;
    page.drawText(`Email: ${clinicEmail}`, { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });

    cursorY -= 80;
    page.drawRectangle({ x: 0, y: cursorY - 10 , width: width, height: 30, color: primaryColor });
    const titleText = "APPOINTMENT CONFIRMATION";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    page.drawText(titleText, { x: (width - titleWidth) / 2, y: cursorY, size: 14, font: fontBold, color: rgb(1,1,1) });

    cursorY -= 50;
    const col1 = margin;
    const col2 = 320;

    page.drawText("PATIENT DETAILS", { x: col1, y: cursorY+15, size: 10, font: fontBold, color: gray });
    cursorY -= 15;
    page.drawText(patientName, { x: col1, y: cursorY+15, size: 14, font: fontBold, color: black });
    // cursorY -= 15;
    // page.drawText("Patient ID: --", { x: col1, y: cursorY, size: 10, font: fontRegular, color: black });

    const sectionTopY = cursorY + 30; 
    page.drawText("DOCTOR DETAILS", { x: col2, y: sectionTopY, size: 10, font: fontBold, color: gray });
    page.drawText(`Dr. ${appt.doctorName}`, { x: col2, y: sectionTopY - 15, size: 14, font: fontBold, color: black });
    page.drawText("General Physician", { x: col2, y: sectionTopY - 30, size: 10, font: fontRegular, color: black });

    cursorY -= 40;
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });
    cursorY -= 30;

    page.drawText("APPOINTMENT DETAILS", { x: margin, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    cursorY -= 20;

    const drawDetailRow = (label, value, xPos, yPos) => {
       page.drawText(label, { x: xPos, y: yPos, size: 9, font: fontRegular, color: gray });
       page.drawText(value, { x: xPos, y: yPos - 12, size: 11, font: fontBold, color: black });
    };

    drawDetailRow("Date", apptDateFormatted, margin, cursorY);
    drawDetailRow("Time", apptTime, margin + 180, cursorY);
    
    let statusColor = black;
    if(apptStatus === 'BOOKED' || apptStatus === 'CONFIRMED') statusColor = rgb(0, 0.6, 0);
    if(apptStatus === 'CANCELLED') statusColor = rgb(0.8, 0, 0);
    page.drawText("Status", { x: width - margin - 80, y: cursorY, size: 9, font: fontRegular, color: gray });
    page.drawText(apptStatus, { x: width - margin - 80, y: cursorY - 12, size: 11, font: fontBold, color: statusColor });

    cursorY -= 50;
    page.drawRectangle({ x: margin, y: cursorY, width: width - (margin*2), height: 25, color: lightGray });
    page.drawText("Service / Description", { x: margin + 10, y: cursorY + 7, size: 10, font: fontBold, color: black });
    page.drawText("Amount", { x: width - margin - 70, y: cursorY + 7, size: 10, font: fontBold, color: black });

    cursorY -= 25;
    page.drawText(serviceText, { x: margin + 10, y: cursorY + 8, size: 10, font: fontRegular, color: black });
    page.drawText(totalBill, { x: width - margin - 70, y: cursorY + 8, size: 10, font: fontRegular, color: black });
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });

    cursorY -= 35;
    page.drawText("Total Amount:", { x: width - margin - 150, y: cursorY, size: 12, font: fontBold, color: black });
    page.drawText(totalBill, { x: width - margin - 70, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    
    cursorY -= 15;
    page.drawText(`Payment Mode: ${paymentMode}`, { x: width - margin - 150, y: cursorY, size: 9, font: fontRegular, color: gray });

    const footerY = 50;
    page.drawText("Note:", { x: margin, y: footerY + 45, size: 9, font: fontBold, color: black });
    page.drawText("Please arrive 15 minutes prior to your appointment time. If you need to reschedule, contact us 24 hours in advance.", { x: margin, y: footerY + 33, size: 9, font: fontRegular, color: black });

    page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 1, color: lightGray });
    page.drawText(`Generated on: ${generatedDate}`, { x: margin, y: footerY, size: 8, font: fontRegular, color: gray });
    page.drawText("This is a computer-generated document. No signature is required.", { x: margin, y: footerY - 10, size: 8, font: fontRegular, color: gray });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Appointment_${apptId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("Appointment PDF error:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

// Get appointment by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "Patient", // FIX
      })
      .populate({
        path: "doctorId",
        select: "name clinic firstName lastName",
        model: "Doctor", // FIX
      })
      .lean();

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Normalize patient info
    let patientInfo = { name: "N/A", email: "N/A", phone: "N/A" };
    if (appt.patientId && typeof appt.patientId === "object") {
      const p = appt.patientId;
      patientInfo.name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "N/A";
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
      doctorInfo.name = d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "N/A";
      doctorInfo.clinic = d.clinic || appt.clinic || "N/A";
    } else if (appt.doctorName) {
      doctorInfo.name = appt.doctorName;
      doctorInfo.clinic = appt.clinic || "N/A";
    }
    appt._doctorInfo = doctorInfo;

    return res.json(appt);
  } catch (err) {
    console.error("Error fetching appointment by id:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Cancel appointment
router.put("/:id/cancel", async (req, res) => {
  try {
    const appt = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE appointment
router.put("/:id", async (req, res) => {
  try {
    const updated = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete appointment
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await AppointmentModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
