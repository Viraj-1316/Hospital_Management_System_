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
// 1. GET AVAILABLE SLOTS
// ==========================================
router.get("/slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ message: "Doctor ID and Date are required" });

    const requestDate = new Date(date); 
    const holiday = await HolidayModel.findOne({
      doctorId: doctorId,
      fromDate: { $lte: requestDate },
      toDate: { $gte: requestDate }
    });

    if (holiday) return res.json({ message: "Doctor is on holiday", slots: [], isHoliday: true });

    const allSlots = generateTimeSlots("09:00:00", "17:00:00", 30);
    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctorId, date: date, status: { $ne: "cancelled" }
    }).select("time");

    const bookedTimes = bookedAppointments.map(a => a.time);
    const availableSlots = allSlots.filter(time => !bookedTimes.includes(time));

    res.json({ slots: availableSlots, isHoliday: false });
  } catch (err) {
    res.status(500).json({ message: "Server error checking slots" });
  }
});

// ==========================================
// 2. CREATE APPOINTMENT
// ==========================================
router.post("/", async (req, res) => {
  try {
    if (req.body.doctorId && req.body.date) {
        const apptDate = new Date(req.body.date);
        const onHoliday = await HolidayModel.findOne({
            doctorId: req.body.doctorId,
            fromDate: { $lte: apptDate },
            toDate: { $gte: apptDate }
        });
        if (onHoliday) return res.status(400).json({ message: `Doctor is on holiday.` });
    }

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
      charges: req.body.charges || 0,
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "upcoming",
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

    const created = await AppointmentModel.create(payload);

    // Notifications
    if (payload.patientEmail) {
      sendEmail({
        to: payload.patientEmail,
        subject: "Confirmed | OneCare",
        html: appointmentBookedTemplate(payload),
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

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==========================================
// 3. GET SINGLE APPOINTMENT (✅ THIS WAS MISSING)
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check validity of ID to prevent server crash
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Appointment ID" });
    }

    const appt = await AppointmentModel.findById(id)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "name clinic firstName lastName")
      .lean();

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Data Normalization (Essential for Frontend consistency)
    // This ensures 'doctorName' exists even if it's inside the 'doctorId' object
    if (appt.doctorId && typeof appt.doctorId === "object") {
        appt.doctorName = appt.doctorName || appt.doctorId.name || `${appt.doctorId.firstName} ${appt.doctorId.lastName}`;
        appt.clinic = appt.clinic || appt.doctorId.clinic;
    }

    if (appt.patientId && typeof appt.patientId === "object") {
        appt.patientName = appt.patientName || `${appt.patientId.firstName} ${appt.patientId.lastName}`;
        appt.patientEmail = appt.patientEmail || appt.patientId.email;
        appt.patientPhone = appt.patientPhone || appt.patientId.phone;
    }

    return res.json(appt);
  } catch (err) {
    console.error("Error fetching single appointment:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ==========================================
// 4. LIST APPOINTMENTS (With Search)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.patientId && mongoose.Types.ObjectId.isValid(req.query.patientId)) q.patientId = req.query.patientId;
    if (req.query.status) q.status = req.query.status;

    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "name clinic firstName lastName")
      .lean();

    const normalized = list.map(a => {
      const copy = { ...a };
      if (copy.doctorId && typeof copy.doctorId === "object") {
         copy.doctorName = copy.doctorName || copy.doctorId.name || "";
         copy.clinic = copy.clinic || copy.doctorId.clinic || "";
      }
      return copy;
    });

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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

// ==========================================
// 5. PDF GENERATION
// ==========================================
router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // --- Prepare Data ---
    let doctor = null;
    if (appt.doctorName) {
      const parts = appt.doctorName.split(" ");
      doctor = await DoctorModel.findOne({ firstName: parts[0] });
    }

    const clinicName = appt.clinic || doctor?.clinic || "OneCare Medical Center";
    const clinicEmail = doctor?.email || "support@onecare.com";
    const clinicPhone = doctor?.phone || "+91 12345 67890";
    
    // Dates & ID
    const todayFormatted = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const apptDateFormatted = appt.date ? new Date(appt.date).toLocaleDateString("en-US", { weekday: 'short', year: "numeric", month: "long", day: "numeric" }) : "N/A";
    const apptId = String(appt._id).substring(0, 8).toUpperCase(); 

    // --- Services & Charges Calculation ---
    let serviceLines = [];
    const rawService = appt.services || appt.serviceName || "General Consultation";
    if (typeof rawService === 'string') {
        serviceLines = rawService.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawService)) {
        serviceLines = rawService;
    } else {
        serviceLines = ["General Consultation"];
    }

    const totalCharges = Number(appt.charges) || 0;
    const serviceCount = serviceLines.length || 1;
    const perItemCost = (totalCharges / serviceCount).toFixed(0); 
    const totalBillText = `Rs. ${totalCharges}/-`;

    // --- PDF Setup ---
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

    // Header
    page.drawText(clinicName.toUpperCase(), { x: margin, y: cursorY, size: 18, font: fontBold, color: primaryColor });
    page.drawText(`Date: ${todayFormatted}`, { x: width - margin - 130, y: cursorY, size: 10, font: fontRegular, color: black });
    page.drawText(`Booking ID: #${apptId}`, { x: width - margin - 130, y: cursorY - 15, size: 10, font: fontBold, color: black });

    let detailsY = cursorY - 18;
    page.drawText(`Phone: ${clinicPhone}`, { x: margin, y: detailsY, size: 10, font: fontRegular, color: gray });
    detailsY -= 12;
    page.drawText(`Email: ${clinicEmail}`, { x: margin, y: detailsY, size: 10, font: fontRegular, color: gray });

    cursorY -= 80;

    // Title Bar
    page.drawRectangle({ x: 0, y: cursorY - 10 , width: width, height: 30, color: primaryColor });
    const titleText = "APPOINTMENT CONFIRMATION";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    page.drawText(titleText, { x: (width - titleWidth) / 2, y: cursorY, size: 14, font: fontBold, color: rgb(1,1,1) });

    cursorY -= 50;

    // Patient & Doctor
    const col2 = 320;
    page.drawText("PATIENT DETAILS", { x: margin, y: cursorY+15, size: 10, font: fontBold, color: gray });
    page.drawText(appt.patientName || "N/A", { x: margin, y: cursorY, size: 14, font: fontBold, color: black });

    page.drawText("DOCTOR DETAILS", { x: col2, y: cursorY+15, size: 10, font: fontBold, color: gray });
    page.drawText(`Dr. ${appt.doctorName || "Unknown"}`, { x: col2, y: cursorY, size: 14, font: fontBold, color: black });
    
    cursorY -= 40;
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });
    cursorY -= 30;

    // Appointment Info
    page.drawText("APPOINTMENT DETAILS", { x: margin, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    cursorY -= 20;

    const drawDetailRow = (label, value, xPos, yPos) => {
       page.drawText(label, { x: xPos, y: yPos, size: 9, font: fontRegular, color: gray });
       page.drawText(value, { x: xPos, y: yPos - 12, size: 11, font: fontBold, color: black });
    };

    drawDetailRow("Date", apptDateFormatted, margin, cursorY);
    drawDetailRow("Time", appt.time || "N/A", margin + 180, cursorY);
    
    let statusColor = black;
    const st = (appt.status || "Booked").toUpperCase();
    if(st === 'BOOKED') statusColor = rgb(0, 0.6, 0);
    if(st === 'CANCELLED') statusColor = rgb(0.8, 0, 0);
    page.drawText("Status", { x: width - margin - 80, y: cursorY, size: 9, font: fontRegular, color: gray });
    page.drawText(st, { x: width - margin - 80, y: cursorY - 12, size: 11, font: fontBold, color: statusColor });

    cursorY -= 50;

    // Table Header
    page.drawRectangle({ x: margin, y: cursorY, width: width - (margin*2), height: 25, color: lightGray });
    page.drawText("Service / Description", { x: margin + 10, y: cursorY + 7, size: 10, font: fontBold, color: black });
    page.drawText("Amount", { x: width - margin - 70, y: cursorY + 7, size: 10, font: fontBold, color: black });

    cursorY -= 20; 

    serviceLines.forEach((service, index) => {
        const lineText = `${index + 1}. ${service}`;
        const amountText = `Rs. ${perItemCost}/-`;
        page.drawText(lineText, { x: margin + 10, y: cursorY, size: 10, font: fontRegular, color: black });
        page.drawText(amountText, { x: width - margin - 70, y: cursorY, size: 10, font: fontRegular, color: black });
        cursorY -= 20; 
    });

    cursorY += 5; 
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });

    // Footer & Totals
    cursorY -= 30;
    
    page.drawText("Total Amount:", { x: width - margin - 150, y: cursorY, size: 12, font: fontBold, color: black });
    page.drawText(totalBillText, { x: width - margin - 70, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    
    cursorY -= 15;
    page.drawText(`Payment Mode: ${appt.paymentMode || "Manual"}`, { x: width - margin - 150, y: cursorY, size: 9, font: fontRegular, color: gray });

    const footerY = 50;
    page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 1, color: lightGray });
    
    const generatedDate = new Date().toLocaleString("en-US");
    page.drawText(`Generated on: ${generatedDate}`, { x: margin, y: footerY, size: 8, font: fontRegular, color: gray });
    page.drawText("Note: This assumes services are priced equally.", { x: margin, y: footerY - 10, size: 8, font: fontRegular, color: gray });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Appointment_${apptId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    res.status(500).json({ message: "PDF generation failed" });
  }
});

// // Get appointment by ID
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

// ==========================================
// 6. CANCEL APPOINTMENT (Optional but recommended)
// ==========================================
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

module.exports = router;