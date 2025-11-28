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
const { sendEmail } = require("../utils/emailService");
const { appointmentBookedTemplate } = require("../utils/emailTemplates");
const { sendWhatsAppMessage } = require("../utils/whatsappService");
const upload = require("../middleware/upload");

// POST /appointments - create appointment using provided patient/doctor contact fields
router.post("/", async (req, res) => {
  try {
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

    console.log("📌 New appointment payload:", payload);
    console.log("🔍 Incoming Body:", req.body);

    //  Create appointment in DB
    const created = await AppointmentModel.create(payload);

    // Figure out patient email & phone
    let targetEmail = payload.patientEmail;
    let targetPhone = payload.patientPhone;

    // If frontend didn’t send patientEmail/Phone, try from DB
    if ((!targetEmail || !targetPhone) && payload.patientId) {
      console.log("🔍 Looking up patient in DB with ID:", payload.patientId);
      try {
        const patientDoc = await PatientModel.findById(payload.patientId);
        console.log("👤 Patient Doc found:", patientDoc);
        
        if (patientDoc) {
          if (!targetEmail && patientDoc.email) {
            targetEmail = patientDoc.email;
            console.log("👤 Fetched patient email from DB:", targetEmail);
          }
          if (!targetPhone && patientDoc.phone) {
            targetPhone = patientDoc.phone;
            console.log("👤 Fetched patient phone from DB:", targetPhone);
          }
          // Also check for 'mobile' or 'phoneNumber' just in case schema differs
          if (!targetPhone && patientDoc.mobile) {
             targetPhone = patientDoc.mobile;
             console.log("👤 Fetched patient phone (mobile) from DB:", targetPhone);
          }
        } else {
             console.log("⚠️ Patient ID provided but no document found in DB.");
        }
      } catch (e) {
        console.log("⚠️ Error fetching patient for contact info:", e.message);
      }
    }

    // Format date for notifications
    let formattedDate = payload.date;
    try {
      if (payload.date) {
        formattedDate = new Date(payload.date).toLocaleDateString("en-GB");
      }
    } catch (e) {
      console.log("⚠️ Date format issue, using raw date:", payload.date);
    }

    // --- 1. Send Email ---
    if (targetEmail) {
      const html = appointmentBookedTemplate({
        patientName: payload.patientName,
        doctorName: payload.doctorName,
        clinicName: payload.clinic,
        date: formattedDate,
        time: payload.time,
        services: payload.services,
      });

      console.log("📧 Preparing to send appointment email to:", targetEmail);
      sendEmail({
        to: targetEmail,
        subject: "Your Appointment is Confirmed | OneCare",
        html,
      });
    } else {
      console.log("🚫 No email available. Skipping email.");
    }

    // --- 2. Send WhatsApp ---
    if (targetPhone) {
      console.log("📱 Preparing to send WhatsApp to:", targetPhone);
      const whatsappBody = `Hello ${payload.patientName},\n\nYour appointment with Dr. ${payload.doctorName} at ${payload.clinic} is confirmed for ${formattedDate} at ${payload.time}.\n\nThank you for choosing OneCare!`;
      
      // We don't await this so it doesn't block the response
      sendWhatsAppMessage(targetPhone, whatsappBody);
    } else {
      console.log("🚫 No phone available. Skipping WhatsApp.");
    }

    // 4️⃣ Response stays same as before
    return res.status(201).json(created);
  } catch (err) {
    console.error("Error creating appointment:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// List appointments with optional filters (returns populated patient + doctor)
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.clinic) q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient) q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor) q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    // Filter by patientId (supports both Patient ID and User ID)
    if (req.query.patientId) {
      if (mongoose.Types.ObjectId.isValid(req.query.patientId)) {
        const p = await PatientModel.findOne({
          $or: [{ _id: req.query.patientId }, { userId: req.query.patientId }],
        });
        if (p) {
          q.patientId = p._id;
        } else {
          q.patientId = req.query.patientId;
        }
      } else {
        q.patientId = req.query.patientId;
      }
    }

    // Filter by doctorId (supports both Doctor ID and Doctor document _id)
    if (req.query.doctorId) {
      if (mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
        q.doctorId = req.query.doctorId;
      }
    }

    // find appointments and populate patientId and doctorId
    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "patients"
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors"
      })
      .lean();

    // Normalize: if patientId populated, ensure patientName exists for old UI
    const normalized = list.map(a => {
      const copy = { ...a };
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || copy.patientName;
        // also copy email/phone so front end can show them
        copy.patientEmail = copy.patientEmail || p.email || "";
        copy.patientPhone = copy.patientPhone || p.phone || "";
      }
      if (copy.doctorId && typeof copy.doctorId === "object") {
        copy.doctorName = copy.doctorName || copy.doctorId.name || "";
        copy.clinic = copy.clinic || copy.doctorId.clinic || copy.clinic;
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
        model: "patients",
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
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

    // Assuming 'date' is stored as "YYYY-MM-DD" string based on dashboard-stats
    const list = await AppointmentModel.find({ date: todayStr })
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "patients",
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
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
    console.error("Error fetching weekly stats:", err);
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
        const end = new Date(today);
        end.setDate(today.getDate() - (i * 7));
        
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
    console.error("Error fetching monthly stats:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Csv File Import data 
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

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

// Appointments pdf  section
// router.get("/:id/pdf", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const appt = await AppointmentModel.findById(id);
//     if (!appt) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     // Try to fetch doctor details from DoctorModel using doctorName
//     let doctor = null;
//     if (appt.doctorName) {
//       const parts = appt.doctorName.split(" ");
//       const first = parts[0];
//       const last = parts.slice(1).join(" ");
//       doctor = await DoctorModel.findOne({
//         firstName: first,
//         lastName: last,
//       });
//     }

//     // --------- Derived fields ---------
//     const clinicName = appt.clinic || doctor?.clinic || "Valley Clinic";
//     const clinicEmail = doctor?.email || "valley_clinic@example.com";
//     const clinicPhone = doctor?.phone || "0000000000";

//     const rawAddress =
//       doctor?.address ||
//       "Address not available\nCity, State, Country, 000000";

//     const addressLines = String(rawAddress).split(/\r?\n/);
//     const addressLine1 = addressLines[0] || "";
//     const addressLine2 = addressLines[1] || "";

//     const patientName = appt.patientName || "N/A";
//     const patientEmail = "N/A"; // wire to PatientModel later if needed

//     const apptDateObj = appt.date ? new Date(appt.date) : null;
//     const apptDateFormatted = apptDateObj
//       ? apptDateObj.toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         })
//       : "N/A";

//     const todayFormatted = new Date().toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });

//     const apptTime = appt.slot || "N/A";
//     const apptStatus = appt.status || "Booked";
//     const paymentMode = appt.paymentMode || "Manual";
//     const serviceText = appt.services || "N/A";
//     const totalBill = appt.charges ? `Rs.${appt.charges}/-` : "Not available";

//     //A4 PDF Creation

//     const pdfDoc = await PDFDocument.create();

//     const pageWidth = 595; // A4 portrait
//     const pageHeight = 842;
//     const page = pdfDoc.addPage([pageWidth, pageHeight]);

//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     const margin = 40;
//     let y = pageHeight - margin; // start near top

//     // ---------- Header: Logo + Clinic ----------
//     const logoSize = 55;
//     const logoX = margin;
//     const logoY = y - logoSize + 5;

//     // draw logo (optional)
//     try {
//       const logoPath = path.join(__dirname, "../assets", "logo.png");
//       if (fs.existsSync(logoPath)) {
//         const logoBytes = fs.readFileSync(logoPath);
//         const logoImg = await pdfDoc.embedPng(logoBytes);
//         page.drawImage(logoImg, {
//           x: logoX,
//           y: logoY,
//           width: logoSize,
//           height: logoSize,
//         });
//       }
//     } catch (e) {
//       console.warn("Logo not found or failed to load.");
//     }

//     const textStartX = logoX + logoSize + 10;

//     // Clinic name
//     page.drawText(clinicName, {
//       x: textStartX,
//       y,
//       size: 18,
//       font: bold,
//       color: rgb(0, 0, 0),
//     });

//     // Date (top-right)
//     page.drawText(`Date: ${todayFormatted}`, {
//       x: pageWidth - margin - 150,
//       y,
//       size: 11,
//       font,
//     });

//     // Doctor name
//     y -= 18;
//     page.drawText(`Dr. ${appt.doctorName || "Not specified"}`, {
//       x: textStartX,
//       y,
//       size: 11,
//       font,
//     });

//     // Address lines
//     y -= 20;
//     page.drawText(`Address: ${addressLine1}`, {
//       x: textStartX,
//       y,
//       size: 10,
//       font,
//     });

//     if (addressLine2) {
//       y -= 14;
//       page.drawText(addressLine2, {
//         x: textStartX + 60, // indent slightly so it visually continues
//         y,
//         size: 10,
//         font,
//       });
//     }

//     // Contact + Email row (ALWAYS after address lines)
//     y -= 18;
//     page.drawText(`Contact No: ${clinicPhone}`, {
//       x: textStartX,
//       y,
//       size: 10,
//       font,
//     });
//     page.drawText(`Email: ${clinicEmail}`, {
//       x: pageWidth - margin - 200,
//       y,
//       size: 10,
//       font,
//     });

//     // Divider line
//     y -= 25;
//     page.drawLine({
//       start: { x: margin, y },
//       end: { x: pageWidth - margin, y },
//       thickness: 1,
//       color: rgb(0.7, 0.7, 0.7),
//     });

//     // ---------- Patient section ----------
//     y -= 25;
//     page.drawText(`Patient Name: ${patientName}`, {
//       x: margin,
//       y,
//       size: 11,
//       font: bold,
//     });

//     y -= 16;
//     page.drawText(`Email: ${patientEmail}`, {
//       x: margin,
//       y,
//       size: 10,
//       font,
//     });

//     // ---------- Appointment Detail Title ----------
//     y -= 35;
//     page.drawText("Appointment Detail", {
//       x: pageWidth / 2 - 70,
//       y,
//       size: 13,
//       font: bold,
//     });

//     y -= 15;
//     page.drawLine({
//       start: { x: margin, y },
//       end: { x: pageWidth - margin, y },
//       thickness: 1,
//       color: rgb(0.7, 0.7, 0.7),
//     });

//     // ---------- Detail rows (NO overlap) ----------
//     y -= 25;
//     const colLeftX = margin;
//     const colRightX = pageWidth / 2 + 10;

//     // Row 1: date + time
//     page.drawText("Appointment Date:", {
//       x: colLeftX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(apptDateFormatted, {
//       x: colLeftX + 115,
//       y,
//       size: 10,
//       font,
//     });

//     page.drawText("Appointment Time:", {
//       x: colRightX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(apptTime, { x: colRightX + 115, y, size: 10, font });

//     // Row 2: status + payment
//     y -= 22;
//     page.drawText("Appointment Status:", {
//       x: colLeftX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(apptStatus, {
//       x: colLeftX + 115,
//       y,
//       size: 10,
//       font,
//     });

//     page.drawText("Payment Mode:", {
//       x: colRightX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(paymentMode, {
//       x: colRightX + 115,
//       y,
//       size: 10,
//       font,
//     });

//     // Row 3: service + total
//     y -= 22;
//     page.drawText("Service:", {
//       x: colLeftX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(serviceText, {
//       x: colLeftX + 115,
//       y,
//       size: 10,
//       font,
//     });

//     page.drawText("Total Bill Payment:", {
//       x: colRightX,
//       y,
//       size: 10,
//       font: bold,
//     });
//     page.drawText(totalBill, {
//       x: colRightX + 115,
//       y,
//       size: 10,
//       font,
//     });

//     // ---------- Send PDF ----------
//     const pdfBytes = await pdfDoc.save();
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename=appointment-${appt._id}.pdf`
//     );
//     res.send(Buffer.from(pdfBytes));
//   } catch (err) {
//     console.error("Appointment PDF error:", err);
//     res.status(500).json({ message: "PDF generation failed" });
//   }
// });

//const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
//const fs = require('fs');
//const path = require('path');

router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------------
    // 1. DATA FETCHING & PREPARATION
    // ---------------------------------------------------------
    const appt = await AppointmentModel.findById(id);
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    let doctor = null;
    if (appt.doctorName) {
      // Logic to split name and find doctor, adjust based on your exact schema
      const parts = appt.doctorName.split(" ");
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      doctor = await DoctorModel.findOne({ firstName: first, lastName: last });
    }

    // Clinic Data
    const clinicName = appt.clinic || doctor?.clinic || "Valley Clinic";
    const clinicEmail = doctor?.email || "info@medicalcenter.com";
    const clinicPhone = doctor?.phone || "+1 234 567 890";
    
    // Address
    const rawAddress = doctor?.address || "123 Health Street\nMedical District, City, 000000";
    const addressLines = String(rawAddress).split(/\r?\n/).slice(0, 2);

    // Patient Data
    const patientName = appt.patientName || "N/A";
    
    // Formatting Data
    const todayFormatted = new Date().toLocaleDateString("en-US", { 
        year: "numeric", month: "long", day: "numeric" 
    });
    
    const apptDateObj = appt.date ? new Date(appt.date) : null;
    const apptDateFormatted = apptDateObj
      ? apptDateObj.toLocaleDateString("en-US", { weekday: 'short', year: "numeric", month: "long", day: "numeric" })
      : "N/A";

    const generatedDate = new Date().toLocaleString("en-US", { 
        day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit' 
    });

    const apptId = String(appt._id).substring(0, 8).toUpperCase(); 
    const apptTime = appt.slot || "N/A";
    const apptStatus = (appt.status || "Booked").toUpperCase();
    const paymentMode = appt.paymentMode || "Manual";
    const serviceText = appt.services || "General Consultation";
    const totalBill = appt.charges ? `Rs. ${appt.charges}/-` : "Rs. 0/-";

    // ---------------------------------------------------------
    // 2. PDF GENERATION
    // ---------------------------------------------------------
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 Size
    const { width, height } = page.getSize();

    // Fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Colors
    const primaryColor = rgb(0, 0.53, 0.71); // Medical Blue
    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.92, 0.92, 0.92);

    let cursorY = height - 50;
    const margin = 50;

    // --- LOGO (Left) ---
    try {
      // Adjust path to where your logo actually is
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
      console.warn("Logo load failed:", e.message);
    }

    // --- HEADER DETAILS (Right of Logo) ---
    const textStartX = 180; 
    
    // Clinic Name
    page.drawText(clinicName.toUpperCase(), { x: textStartX, y: cursorY, size: 18, font: fontBold, color: primaryColor });
    
    // --- DATE & BOOKING ID (Top Right Corner) ---
    // Moved here to separate from the blue title bar
    page.drawText(`Date: ${todayFormatted}`, {
      x: width - margin - 130, // Fixed align right
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: black,
    });

    page.drawText(`Booking ID: #${apptId}`, {
      x: width - margin - 130, 
      y: cursorY - 15,         // Stacked below date
      size: 10,
      font: fontBold,          
      color: black,
    });

    // Clinic Contact Info
    let detailsY = cursorY - 18;
    page.drawText(addressLines.join(", "), { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });
    detailsY -= 12;
    page.drawText(`Phone: ${clinicPhone}`, { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });
    detailsY -= 12;
    page.drawText(`Email: ${clinicEmail}`, { x: textStartX, y: detailsY, size: 10, font: fontRegular, color: gray });

    cursorY -= 60; // Move down for Title Bar
    
    // --- TITLE BAR ---
    // Full width blue bar
    page.drawRectangle({ x: 0, y: cursorY - 20 , width: width, height: 30, color: primaryColor });
    
    const titleText = "APPOINTMENT CONFIRMATION";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    // Center the title
    page.drawText(titleText, { 
        x: (width - titleWidth) / 2, 
        y: cursorY, 
        size: 14, 
        font: fontBold, 
        color: rgb(1,1,1) // White text
    });

    cursorY -= 50;

    // --- PATIENT & DOCTOR GRID ---
    const col1 = margin;
    const col2 = 320;

    // Patient Column
    page.drawText("PATIENT DETAILS", { x: col1, y: cursorY, size: 10, font: fontBold, color: gray });
    cursorY -= 15;
    page.drawText(patientName, { x: col1, y: cursorY, size: 14, font: fontBold, color: black });
    cursorY -= 15;
    // You can add Patient Email/Phone here if available
    page.drawText("Patient ID: --", { x: col1, y: cursorY, size: 10, font: fontRegular, color: black });

    // Reset Y for Doctor Column
    const sectionTopY = cursorY + 30; 
    
    // Doctor Column
    page.drawText("DOCTOR DETAILS", { x: col2, y: sectionTopY, size: 10, font: fontBold, color: gray });
    page.drawText(`Dr. ${appt.doctorName}`, { x: col2, y: sectionTopY - 15, size: 14, font: fontBold, color: black });
    page.drawText("General Physician", { x: col2, y: sectionTopY - 30, size: 10, font: fontRegular, color: black });

    cursorY -= 40;
    
    // Divider Line
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });
    cursorY -= 30;

    // --- APPOINTMENT DETAILS (3 Columns) ---
    page.drawText("APPOINTMENT DETAILS", { x: margin, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    cursorY -= 20;

    const drawDetailRow = (label, value, xPos, yPos) => {
        page.drawText(label, { x: xPos, y: yPos, size: 9, font: fontRegular, color: gray });
        page.drawText(value, { x: xPos, y: yPos - 12, size: 11, font: fontBold, color: black });
    };

    drawDetailRow("Date", apptDateFormatted, margin, cursorY);
    drawDetailRow("Time", apptTime, margin + 180, cursorY);
    
    // Status Logic
    page.drawText("Status", { x: width - margin - 80, y: cursorY, size: 9, font: fontRegular, color: gray });
    
    let statusColor = black;
    if(apptStatus === 'BOOKED' || apptStatus === 'CONFIRMED') statusColor = rgb(0, 0.6, 0); // Green
    if(apptStatus === 'CANCELLED') statusColor = rgb(0.8, 0, 0); // Red

    page.drawText(apptStatus, { x: width - margin - 80, y: cursorY - 12, size: 11, font: fontBold, color: statusColor });

    cursorY -= 50;

    // --- BILLING TABLE ---
    
    // Table Header Background
    page.drawRectangle({ x: margin, y: cursorY, width: width - (margin*2), height: 25, color: lightGray });
    // Header Text
    page.drawText("Service / Description", { x: margin + 10, y: cursorY + 7, size: 10, font: fontBold, color: black });
    page.drawText("Amount", { x: width - margin - 70, y: cursorY + 7, size: 10, font: fontBold, color: black });

    cursorY -= 25;

    // Table Content
    page.drawText(serviceText, { x: margin + 10, y: cursorY + 8, size: 10, font: fontRegular, color: black });
    page.drawText(totalBill, { x: width - margin - 70, y: cursorY + 8, size: 10, font: fontRegular, color: black });
    
    // Bottom Border
    page.drawLine({ start: { x: margin, y: cursorY }, end: { x: width - margin, y: cursorY }, thickness: 1, color: lightGray });

    cursorY -= 35;

    // Totals
    page.drawText("Total Amount:", { x: width - margin - 150, y: cursorY, size: 12, font: fontBold, color: black });
    page.drawText(totalBill, { x: width - margin - 70, y: cursorY, size: 12, font: fontBold, color: primaryColor });
    
    cursorY -= 15;
    page.drawText(`Payment Mode: ${paymentMode}`, { x: width - margin - 150, y: cursorY, size: 9, font: fontRegular, color: gray });

    // --- FOOTER ---
    const footerY = 50;
    
    // Note
    page.drawText("Note:", { x: margin, y: footerY + 45, size: 9, font: fontBold, color: black });
    page.drawText("Please arrive 15 minutes prior to your appointment time. If you need to reschedule, contact us 24 hours in advance.", { x: margin, y: footerY + 33, size: 9, font: fontRegular, color: black });

    // Disclaimer
    page.drawLine({ start: { x: margin, y: footerY + 15 }, end: { x: width - margin, y: footerY + 15 }, thickness: 1, color: lightGray });
    page.drawText(`Generated on: ${generatedDate}`, { x: margin, y: footerY, size: 8, font: fontRegular, color: gray });
    page.drawText("This is a computer-generated document. No signature is required.", { x: margin, y: footerY - 10, size: 8, font: fontRegular, color: gray });

    // 3. SEND RESPONSE
    const pdfBytes = await pdfDoc.save();
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Appointment_${apptId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("Appointment PDF error:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

// Get appointment by ID (populate patient and doctor, return normalized patient info)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",                // matches your schema ref
        select: "firstName lastName email phone",
        model: "patients",                // explicit model name (optional)
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
      })
      .lean();

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Build normalized patient info with fallbacks
    let patientInfo = { name: "N/A", email: "N/A", phone: "N/A" };

    if (appt.patientId && typeof appt.patientId === "object") {
      // populated patient doc
      const p = appt.patientId;
      const nameParts = [];
      if (p.firstName) nameParts.push(p.firstName);
      if (p.lastName) nameParts.push(p.lastName);
      patientInfo.name = nameParts.join(" ") || p.name || "N/A";
      patientInfo.email = p.email || "N/A";
      patientInfo.phone = p.phone || "N/A";
    } else if (appt.patientName) {
      // fallback to stored patientName field on appointment
      patientInfo.name = appt.patientName || "N/A";
      // if you have patientEmail/patientPhone fields on appointment use them
      patientInfo.email = appt.patientEmail || appt.patientEmail || "N/A";
      patientInfo.phone = appt.patientPhone || "N/A";
    }

    // Attach a clear field for frontend convenience
    appt._patientInfo = patientInfo;

    // Also attach doctor nice info
    let doctorInfo = { name: "N/A", clinic: "N/A" };
    if (appt.doctorId && typeof appt.doctorId === "object") {
      doctorInfo.name = appt.doctorId.name || "N/A";
      doctorInfo.clinic = appt.doctorId.clinic || appt.clinic || "N/A";
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

// Cancel appointment (status: cancelled)
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) {
    console.error("Cancel error", err);
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

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment updated", data: updated });
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete appointment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AppointmentModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Error deleting appointment:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
