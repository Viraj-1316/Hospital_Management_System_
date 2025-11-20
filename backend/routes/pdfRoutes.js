// backend/routes/pdfRoutes.js
const express = require("express");
const router = express.Router();
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const AppointmentModel = require("../models/Appointment");
const DoctorModel = require("../models/Doctor");
const PatientModel = require("../models/Patient");
const fs = require("fs");
const path = require("path");

// convert #RRGGBB → pdf-lib color
function colorFromHex(hex = "#000000") {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/**
 * POST /pdf/preview
 * body: { appointmentId, layout }
 * returns: { pdfBase64 }
 */
router.post("/preview", async (req, res) => {
  try {
    const { appointmentId, layout = {} } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: "Missing appointmentId" });
    }

    const appt = await AppointmentModel.findById(appointmentId)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone dob",
        model: "patients",
      })
      .lean();

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // doctor info
    let doctor = null;
    if (appt.doctorName) {
      const parts = appt.doctorName.split(" ");
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      doctor = await DoctorModel.findOne({ firstName: first, lastName: last }).lean();
    }

    // ----- LAYOUT CONFIG -----
    const headerCfg = layout.header || {};
    const footerCfg = layout.footer || {};
    const notesCfg = layout.notes || {};
    const nextApptCfg = layout.nextAppointment || {};
    const servicesCfg = layout.servicesSection || {};

    // header values
    const clinicName =
      headerCfg.clinicName || appt.clinic || doctor?.clinic || "Valley Clinic";

    const doctorName =
      headerCfg.doctorName || appt.doctorName || "Not specified";

    const headerAddress =
      headerCfg.address ||
      doctor?.address ||
      "Address not available\nCity, State, Country, 000000";

    const clinicEmail = headerCfg.email || doctor?.email || "valley_clinic@example.com";
    const clinicPhone = headerCfg.phone || doctor?.phone || "0000000000";

    const headerTextColor = colorFromHex("#000000");

    // PATIENT INFO (from patientId if populated)
    let patientName = appt.patientName || "N/A";
    let patientEmail = "N/A";
    let patientPhone = "N/A";
    let patientDobText = "N/A";

    if (appt.patientId && typeof appt.patientId === "object") {
      const p = appt.patientId;
      const nameParts = [];
      if (p.firstName) nameParts.push(p.firstName);
      if (p.lastName) nameParts.push(p.lastName);
      if (nameParts.length > 0) patientName = nameParts.join(" ");
      if (p.email) patientEmail = p.email;
      if (p.phone) patientPhone = p.phone;
      if (p.dob) {
        const dobDate = new Date(p.dob);
        if (!isNaN(dobDate)) {
          patientDobText = dobDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }
    }

    // appointment info
    const apptDateObj = appt.date ? new Date(appt.date) : null;
    const apptDateFormatted = apptDateObj
      ? apptDateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const todayFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const apptTime = appt.time || appt.slot || "N/A";
    const apptStatus = appt.status || "Booked";
    const paymentMode = appt.paymentMode || "Manual";

    // services from editor or fallback to appointment.services
    const selectedServices = Array.isArray(servicesCfg.selectedServices)
      ? servicesCfg.selectedServices
      : [];
    const serviceText =
      selectedServices.length > 0
        ? selectedServices.join(", ")
        : appt.services || "N/A";

    const totalBill = appt.charges ? `₹${appt.charges}/-` : "Not available";

    const notesText = notesCfg.text || "";

    // next appointment layout
    const nextApptDateStr =
      nextApptCfg.date || nextApptCfg.text || ""; // for backward safety
    const nextApptNote = nextApptCfg.note || "";
    const showNextAppt = !!nextApptCfg.enabled;

    let nextApptDisplay = "";
    if (nextApptDateStr) {
      const d = new Date(nextApptDateStr);
      const formatted = !isNaN(d)
        ? d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : nextApptDateStr;
      nextApptDisplay = formatted;
    }
    if (nextApptNote) {
      nextApptDisplay = nextApptDisplay
        ? `${nextApptDisplay} – ${nextApptNote}`
        : nextApptNote;
    }

    // footer
    const footerText = footerCfg.text || "";
    const footerTextColor = colorFromHex(footerCfg.textColor || "#777777");

    // =========================================
    //        CREATE A4 PORTRAIT PDF
    // =========================================
    const pdfDoc = await PDFDocument.create();
    const pageWidth = 595;
    const pageHeight = 842;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    let y = pageHeight - margin;

    // ---------- Header: Logo + Clinic ----------
    const logoSize = 55;
    const logoX = margin;
    const logoY = y - logoSize + 5;

    try {
      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        page.drawImage(logoImg, {
          x: logoX,
          y: logoY,
          width: logoSize,
          height: logoSize,
        });
      }
    } catch (e) {
      console.warn("Logo not found or failed to load for preview.");
    }

    const textStartX = logoX + logoSize + 10;

    // Clinic name
    page.drawText(clinicName, {
      x: textStartX,
      y,
      size: 18,
      font: bold,
      color: headerTextColor,
    });

    // Date (top-right)
    page.drawText(`Date: ${todayFormatted}`, {
      x: pageWidth - margin - 150,
      y,
      size: 11,
      font,
      color: headerTextColor,
    });

    // Doctor name
    y -= 18;
    page.drawText(`Dr. ${doctorName}`, {
      x: textStartX,
      y,
      size: 11,
      font,
      color: headerTextColor,
    });

    // Address lines
    const addressLines = String(headerAddress).split(/\r?\n/);
    const addressLine1 = addressLines[0] || "";
    const addressLine2 = addressLines[1] || "";

    y -= 20;
    page.drawText(`Address: ${addressLine1}`, {
      x: textStartX,
      y,
      size: 10,
      font,
      color: headerTextColor,
    });

    if (addressLine2) {
      y -= 14;
      page.drawText(addressLine2, {
        x: textStartX + 60,
        y,
        size: 10,
        font,
        color: headerTextColor,
      });
    }

    // Contact + Email
    y -= 18;
    page.drawText(`Contact No: ${clinicPhone}`, {
      x: textStartX,
      y,
      size: 10,
      font,
      color: headerTextColor,
    });
    page.drawText(`Email: ${clinicEmail}`, {
      x: pageWidth - margin - 200,
      y,
      size: 10,
      font,
      color: headerTextColor,
    });

    // Divider
    y -= 25;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // ---------- Patient section ----------
    y -= 25;
    page.drawText(`Patient Name: ${patientName}`, {
      x: margin,
      y,
      size: 11,
      font: bold,
    });

    y -= 16;
    page.drawText(`Email: ${patientEmail}`, {
      x: margin,
      y,
      size: 10,
      font,
    });

    y -= 14;
    page.drawText(`Phone: ${patientPhone}`, {
      x: margin,
      y,
      size: 10,
      font,
    });

    y -= 14;
    page.drawText(`Date of Birth: ${patientDobText}`, {
      x: margin,
      y,
      size: 10,
      font,
    });

    // ---------- Appointment Detail title ----------
    y -= 30;
    page.drawText("Appointment Detail", {
      x: pageWidth / 2 - 70,
      y,
      size: 13,
      font: bold,
    });

    y -= 15;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // ---------- Detail rows ----------
    y -= 25;
    const colLeftX = margin;
    const colRightX = pageWidth / 2 + 10;

    // Row 1: date + time
    page.drawText("Appointment Date:", {
      x: colLeftX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(apptDateFormatted, {
      x: colLeftX + 115,
      y,
      size: 10,
      font,
    });

    page.drawText("Appointment Time:", {
      x: colRightX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(apptTime, {
      x: colRightX + 115,
      y,
      size: 10,
      font,
    });

    // Row 2: status + payment
    y -= 22;
    page.drawText("Appointment Status:", {
      x: colLeftX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(apptStatus, {
      x: colLeftX + 115,
      y,
      size: 10,
      font,
    });

    page.drawText("Payment Mode:", {
      x: colRightX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(paymentMode, {
      x: colRightX + 115,
      y,
      size: 10,
      font,
    });

    // Row 3: service + total
    y -= 22;
    page.drawText("Service:", {
      x: colLeftX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(serviceText, {
      x: colLeftX + 115,
      y,
      size: 10,
      font,
    });

    page.drawText("Total Bill Payment:", {
      x: colRightX,
      y,
      size: 10,
      font: bold,
    });
    page.drawText(totalBill, {
      x: colRightX + 115,
      y,
      size: 10,
      font,
    });

    // Notes
    if (notesText) {
      y -= 28;
      page.drawText("Notes:", {
        x: colLeftX,
        y,
        size: 10,
        font: bold,
      });
      page.drawText(notesText, {
        x: colLeftX + 50,
        y,
        size: 10,
        font,
      });
    }

    // Next appointment
    if (showNextAppt && nextApptDisplay) {
      y -= 22;
      page.drawText("Next Appointment:", {
        x: colLeftX,
        y,
        size: 10,
        font: bold,
      });
      page.drawText(nextApptDisplay, {
        x: colLeftX + 115,
        y,
        size: 10,
        font,
      });
    }

    // Footer text (bottom center)
    if (footerText) {
      const footerSize = 9;
      const textWidth = font.widthOfTextAtSize(footerText, footerSize);
      page.drawText(footerText, {
        x: (pageWidth - textWidth) / 2,
        y: 20,
        size: footerSize,
        font,
        color: footerTextColor,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    return res.json({ pdfBase64 });
  } catch (err) {
    console.error("PDF preview error:", err);
    return res.status(500).json({ message: "Preview PDF failed" });
  }
});

/**
 * POST /pdf/create-next-appointment
 * body: { appointmentId, layout }
 * creates new Appointment in DB based on layout.nextAppointment.date
 */
router.post("/create-next-appointment", async (req, res) => {
  try {
    const { appointmentId, layout = {} } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: "Missing appointmentId" });
    }

    const nextCfg = layout.nextAppointment || {};
    const nextDateStr = nextCfg.date || nextCfg.text;
    if (!nextCfg.enabled || !nextDateStr) {
      return res.status(400).json({ message: "Next appointment date not set" });
    }

    const appt = await AppointmentModel.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ message: "Original appointment not found" });
    }

    const newAppt = await AppointmentModel.create({
      patientId: appt.patientId || null,
      patientName: appt.patientName,
      doctorId: appt.doctorId || null,
      doctorName: appt.doctorName,
      clinic: appt.clinic,
      date: nextDateStr,
      time: appt.time || "",
      services: appt.services,
      charges: appt.charges || 0,
      paymentMode: appt.paymentMode || "Manual",
      status: "upcoming",
    });

    return res.json({
      message: "Next appointment created",
      data: newAppt,
    });
  } catch (err) {
    console.error("create-next-appointment error:", err);
    return res.status(500).json({ message: "Failed to create next appointment" });
  }
});

module.exports = router;
