const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BillingModel = require("../models/Billing");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const ClinicModel = require("../models/Clinic");
const EncounterModel = require("../models/Encounter");
const Counter = require("../models/Counter");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const { verifyToken } = require("../middleware/auth");

// Helper: Convert string ID to ObjectId if valid, otherwise null
const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

// Helper: Format current time as "hh:mm AM/PM"
const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
};

// --- CREATE BILL (POST) ---
router.post("/", verifyToken, async (req, res) => {
  try {
    const clinicId = req.user.clinicId ? toObjectId(req.user.clinicId) : toObjectId(req.body.clinicId);
    
    let billPrefix = "INV-";
    if (clinicId) {
      const clinic = await ClinicModel.findById(clinicId).select("billPrefix").lean();
      if (clinic && clinic.billPrefix) {
        billPrefix = clinic.billPrefix;
      }
    }
    
    const generatedBillNumber = await Counter.getNextSequence("bill", billPrefix, clinicId, 6);

    let services = req.body.services || [];
    if (Array.isArray(services)) {
      services = services.map(svc => {
        if (typeof svc === 'string') {
          return { name: svc.trim(), description: "", category: "Consultation", amount: 0 };
        }
        return {
          name: svc.name || "",
          description: svc.description || "",
          category: svc.category || "Consultation",
          amount: svc.amount || 0
        };
      });
    }

    const subTotal = services.reduce((sum, svc) => sum + (Number(svc.amount) || 0), 0);
    const taxDetails = req.body.taxDetails || [];
    const taxAmount = taxDetails.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);
    const discount = Number(req.body.discount) || 0;
    const totalAmount = subTotal - discount + taxAmount;
    const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : (req.body.status === "paid" ? totalAmount : 0);
    const amountDue = Math.max(totalAmount - paidAmount, 0);

    let status = req.body.status || "unpaid";
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    const payload = {
      ...req.body,
      services,
      billNumber: generatedBillNumber,
      patientId: toObjectId(req.body.patientId),
      doctorId: toObjectId(req.body.doctorId),
      clinicId: clinicId,
      encounterId: toObjectId(req.body.encounterId),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      time: req.body.time || formatTime(),
      subTotal,
      totalAmount,
      discount,
      taxDetails,
      taxAmount,
      paidAmount,
      amountDue,
      status,
    };

    const bill = await BillingModel.create(payload);
    res.json({ message: "Bill created successfully", data: bill });
  } catch (err) {
    logger.error("Error creating bill", { error: err.message });
    res.status(500).json({ message: "Error creating bill", error: err.message });
  }
});

// --- GET ALL BILLS ---
router.get("/", verifyToken, async (req, res) => {
  try {
    const { doctorId, patientId, status } = req.query;
    let query = {};

    if (doctorId) query.doctorId = toObjectId(doctorId) || doctorId;
    if (patientId) query.patientId = toObjectId(patientId) || patientId;
    if (status) query.status = status;

    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === 'admin') {
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
       // All bills
    } else if (effectiveRole === "patient") {
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

    const bills = await BillingModel.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "patientId", select: "firstName lastName email phone", model: "Patient" })
      .populate({ path: "doctorId", select: "firstName lastName email", model: "Doctor" })
      .populate({ path: "clinicId", select: "name address", model: "Clinic" })
      .lean();

    // Normalize Data
    const normalized = bills.map(bill => {
      const copy = { ...bill };
      if (copy.patientId && typeof copy.patientId === "object") {
        copy.patientName = copy.patientName || `${copy.patientId.firstName || ""} ${copy.patientId.lastName || ""}`.trim();
      }
      if (copy.doctorId && typeof copy.doctorId === "object") {
         copy.doctorName = copy.doctorName || `${copy.doctorId.firstName || ""} ${copy.doctorId.lastName || ""}`.trim();
      }
      if (copy.clinicId && typeof copy.clinicId === "object") {
        copy.clinicName = copy.clinicName || copy.clinicId.name || "";
      }
      return copy;
    });

    res.json(normalized);
  } catch (err) {
    logger.error("Error fetching bills", { error: err.message });
    res.status(500).json({ message: "Error fetching bills", error: err.message });
  }
});

// --- GET SINGLE BILL ---
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id)
      .populate({ path: "patientId", select: "firstName lastName email phone", model: "Patient" })
      .populate({ path: "doctorId", select: "firstName lastName email", model: "Doctor" })
      .populate({ path: "clinicId", select: "name address", model: "Clinic" })
      .lean();

    if (!bill) return res.status(404).json({ message: "Bill not found" });

    // Normalize
    if (bill.patientId && typeof bill.patientId === "object") {
      bill.patientName = bill.patientName || `${bill.patientId.firstName || ""} ${bill.patientId.lastName || ""}`.trim();
    }
    if (bill.doctorId && typeof bill.doctorId === "object") {
      bill.doctorName = bill.doctorName || `${bill.doctorId.firstName || ""} ${bill.doctorId.lastName || ""}`.trim();
    }

    res.json(bill);
  } catch (err) {
    logger.error("Error fetching bill", { id: req.params.id, error: err.message });
    res.status(500).json({ message: "Error fetching bill" });
  }
});

// --- UPDATE BILL ---
router.put("/:id", verifyToken, async (req, res) => {
  try {
    let services = req.body.services;
    if (Array.isArray(services)) {
      services = services.map(svc => {
        if (typeof svc === 'string') return { name: svc.trim(), category: "Consultation", amount: 0 };
        return svc;
      });
    }

    const subTotal = services ? services.reduce((sum, svc) => sum + (Number(svc.amount) || 0), 0) : req.body.subTotal;
    const taxDetails = req.body.taxDetails;
    const taxAmount = taxDetails ? taxDetails.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0) : req.body.taxAmount;

    const updateData = {
      ...req.body,
      services,
      patientId: toObjectId(req.body.patientId),
      doctorId: toObjectId(req.body.doctorId),
      clinicId: toObjectId(req.body.clinicId),
      encounterId: toObjectId(req.body.encounterId),
      date: req.body.date ? new Date(req.body.date) : undefined,
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await BillingModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Bill not found" });

    res.json({ message: "Bill updated", data: updated });
  } catch (err) {
    logger.error("Error updating bill", { id: req.params.id, error: err.message });
    res.status(500).json({ message: "Error updating bill" });
  }
});

// --- DELETE BILL ---
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await BillingModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Bill not found" });
    res.json({ message: "Bill deleted" });
  } catch (err) {
    logger.error("Error deleting bill", { id: req.params.id, error: err.message });
    res.status(500).json({ message: "Error deleting bill" });
  }
});

// --- PDF GENERATION (Professional Medical Receipt Template) ---
router.get("/:id/pdf", verifyToken, async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id)
      .populate({ 
        path: "patientId", 
        model: "Patient",
        populate: { path: "userId", model: "User", select: "name phone gender dob email" }
      })
      .populate({ path: "doctorId", model: "Doctor" })
      .populate({ path: "clinicId", model: "Clinic" })
      .populate({ path: "encounterId", model: "Encounter", select: "encounterId date description" })
      .lean();

    if (!bill) return res.status(404).send("Bill not found");

    // PDF Setup (A4)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors (from CSS)
    const primary = rgb(0.118, 0.161, 0.231);
    const secondary = rgb(0.392, 0.455, 0.545);
    const accent = rgb(0.145, 0.388, 0.922);
    const success = rgb(0.063, 0.725, 0.506);
    const warning = rgb(0.961, 0.620, 0.043);
    const danger = rgb(0.937, 0.267, 0.267);
    const borderColor = rgb(0.886, 0.910, 0.941);
    const bgLight = rgb(0.973, 0.980, 0.988);
    const white = rgb(1, 1, 1);
    const watermarkClr = rgb(0.796, 0.835, 0.878);

    const margin = 40;

    // === TOP BORDER (8px accent) ===
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: accent });

    // =========================================
    // HEADER
    // =========================================
    let y = height - 48;
    const logoSize = 55;
    const headerTopY = y;
    
    // Logo/Initials box
    let logoDrawn = false;
    try {
      if (bill.clinicId?.clinicLogo) {
        const logoPath = path.join(__dirname, "..", "uploads", bill.clinicId.clinicLogo);
        if (fs.existsSync(logoPath)) {
          const logoBytes = fs.readFileSync(logoPath);
          const ext = bill.clinicId.clinicLogo.toLowerCase();
          const logoImg = ext.endsWith('.png') ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
          if (logoImg) {
            page.drawImage(logoImg, { x: margin, y: y - logoSize, width: logoSize, height: logoSize });
            logoDrawn = true;
          }
        }
      }
    } catch (e) {}

    if (!logoDrawn) {
      const initials = (bill.clinicId?.name || bill.clinicName || "OC").split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      page.drawRectangle({ x: margin, y: y - logoSize, width: logoSize, height: logoSize, color: accent });
      const iw = fontBold.widthOfTextAtSize(initials, 20);
      page.drawText(initials, { x: margin + (logoSize - iw) / 2, y: y - logoSize + 20, size: 20, font: fontBold, color: white });
    }

    // Hospital info (left side, next to logo)
    const infoX = margin + logoSize + 15;
    const hospitalName = bill.clinicId?.name || bill.clinicName || "OneCare";
    
    // Hospital name (24px font, accent blue) - aligned with TAX INVOICE on right
    page.drawText(hospitalName, { x: infoX, y: headerTopY - 15, size: 20, font: fontBold, color: accent });
    
    // Address, contact, GSTIN below hospital name
    let infoY = headerTopY - 32;
    const addr = bill.clinicId?.address;
    if (addr?.full) {
      let addrLine = addr.full;
      if (addr.city) addrLine += ", " + addr.city;
      if (addr.postalCode) addrLine += " - " + addr.postalCode;
      page.drawText(addrLine, { x: infoX, y: infoY, size: 9, font, color: secondary });
      infoY -= 12;
    }
    
    const phone = bill.clinicId?.contact || "";
    const email = bill.clinicId?.email || "";
    if (phone || email) {
      let contactLine = "";
      if (phone) contactLine += `Phone: ${phone}`;
      if (email) contactLine += (contactLine ? " | " : "") + `Email: ${email}`;
      page.drawText(contactLine, { x: infoX, y: infoY, size: 9, font, color: secondary });
      infoY -= 13;
    }
    
    if (bill.clinicId?.gstin) {
      page.drawText(`GSTIN: ${bill.clinicId.gstin}`, { x: infoX, y: infoY, size: 9, font: fontBold, color: primary });
    }

    // Invoice meta (right side) - TAX INVOICE aligned with hospital name
    const rightEdge = width - margin;
    
    // TAX INVOICE title - same Y as hospital name
    const txInv = "TAX INVOICE";
    page.drawText(txInv, { x: rightEdge - fontBold.widthOfTextAtSize(txInv, 18), y: headerTopY - 15, size: 18, font: fontBold, color: primary });
    
    // Bill # (bold, accent color to highlight)
    const billNumStr = bill.billNumber || "INV-" + bill._id.toString().slice(-6);
    const billNumLine = `Bill #: ${billNumStr}`;
    page.drawText(billNumLine, { x: rightEdge - fontBold.widthOfTextAtSize(billNumLine, 11), y: headerTopY - 32, size: 11, font: fontBold, color: accent });
    
    // Date
    const dateObj = bill.date ? new Date(bill.date) : new Date();
    const dateLine = `Date: ${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    page.drawText(dateLine, { x: rightEdge - font.widthOfTextAtSize(dateLine, 10), y: headerTopY - 46, size: 10, font, color: primary });
    
    // Time
    if (bill.time) {
      const timeLine = `Time: ${bill.time}`;
      page.drawText(timeLine, { x: rightEdge - font.widthOfTextAtSize(timeLine, 10), y: headerTopY - 59, size: 10, font, color: primary });
    }

    // Header separator line
    y = headerTopY - logoSize - 22;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 2, color: bgLight });

    // =========================================
    // PATIENT INFO GRID (2 rows x 3 cols)
    // =========================================
    y -= 12;
    const gridTop = y;
    const gridH = 60;
    const gridPad = 12;
    const colW = (width - 2 * margin) / 3;
    
    page.drawRectangle({ x: margin, y: gridTop - gridH, width: width - 2 * margin, height: gridH, color: bgLight });

    const patientUser = bill.patientId?.userId;
    const pName = patientUser?.name || bill.patientName || "N/A";
    const pUHID = bill.patientId?.uhid || "N/A";
    let pAge = "";
    if (patientUser?.dob) {
      const dob = new Date(patientUser.dob);
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
      if (!isNaN(age) && age >= 0) pAge = `${age}Y`;
    }
    const ageGender = [pAge, patientUser?.gender || ""].filter(Boolean).join(" / ") || "N/A";
    
    const dName = bill.doctorId?.firstName ? `Dr. ${bill.doctorId.firstName} ${bill.doctorId.lastName || ""}`.trim() : bill.doctorName || "N/A";
    const dept = bill.doctorId?.specialization || bill.doctorId?.department || "General Medicine";
    const payMode = bill.paymentMethod || "Cash";

    // Row 1
    const r1Y = gridTop - gridPad;
    [[0, "PATIENT NAME", pName], [1, "PATIENT ID", pUHID], [2, "AGE / GENDER", ageGender]].forEach(([i, label, value]) => {
      const cx = margin + i * colW + gridPad;
      page.drawText(label, { x: cx, y: r1Y, size: 8, font: fontBold, color: secondary });
      page.drawText(value, { x: cx, y: r1Y - 12, size: 10, font: fontBold, color: primary });
    });

    // Row 2 - now includes Encounter ID
    const r2Y = r1Y - 28;
    const encId = bill.encounterId?.encounterId || (bill.encounterId?._id ? bill.encounterId._id.toString().slice(-6) : "N/A");
    [[0, "CONSULTING DOCTOR", dName], [1, "ENCOUNTER ID", encId], [2, "PAYMENT MODE", payMode]].forEach(([i, label, value]) => {
      const cx = margin + i * colW + gridPad;
      page.drawText(label, { x: cx, y: r2Y, size: 8, font: fontBold, color: secondary });
      page.drawText(value, { x: cx, y: r2Y - 12, size: 10, font: fontBold, color: primary });
    });

    y = gridTop - gridH - 18;

    // =========================================
    // SERVICES TABLE
    // =========================================
    const tableW = width - 2 * margin;
    // Column positions: Sr (6%), Description (45%), Category (22%), Amount (22%)
    const c1 = margin;                          // Sr.
    const c2 = margin + tableW * 0.06;          // Service Description
    const c3 = margin + tableW * 0.52;          // Category
    const c4 = width - margin;                  // Amount (right-aligned)
    
    // Max widths for text truncation
    const maxDescWidth = tableW * 0.44;         // Max width for description
    const maxCatWidth = tableW * 0.20;          // Max width for category

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 2, color: primary });
    y -= 13;

    page.drawText("Sr.", { x: c1, y, size: 9, font: fontBold, color: secondary });
    page.drawText("Service Description", { x: c2, y, size: 9, font: fontBold, color: secondary });
    page.drawText("Category", { x: c3, y, size: 9, font: fontBold, color: secondary });
    const amtH = "Amount (INR)";
    page.drawText(amtH, { x: c4 - font.widthOfTextAtSize(amtH, 9), y, size: 9, font: fontBold, color: secondary });

    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: borderColor });
    y -= 14;

    // Helper to truncate text if too wide
    const truncateText = (text, maxWidth, fontSize, fontObj) => {
      if (!text) return "";
      let truncated = text;
      while (fontObj.widthOfTextAtSize(truncated, fontSize) > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      if (truncated.length < text.length && truncated.length > 3) {
        truncated = truncated.slice(0, -3) + "...";
      }
      return truncated;
    };

    if (Array.isArray(bill.services)) {
      bill.services.forEach((svc, i) => {
        const name = typeof svc === 'string' ? svc : svc.name || "";
        const desc = typeof svc === 'object' ? svc.description || "" : "";
        const cat = typeof svc === 'object' ? svc.category || "-" : "-";
        const amt = typeof svc === 'object' ? (svc.amount || 0).toFixed(2) : "0.00";

        // Truncate if needed
        const displayName = truncateText(name, maxDescWidth, 10, fontBold);
        const displayCat = truncateText(cat, maxCatWidth, 10, font);

        page.drawText(String(i + 1).padStart(2, '0'), { x: c1, y, size: 10, font, color: primary });
        page.drawText(displayName, { x: c2, y, size: 10, font: fontBold, color: primary });
        page.drawText(displayCat, { x: c3, y, size: 10, font, color: primary });
        page.drawText(amt, { x: c4 - font.widthOfTextAtSize(amt, 10), y, size: 10, font, color: primary });

        if (desc) {
          y -= 11;
          const displayDesc = truncateText(desc, maxDescWidth, 8, font);
          page.drawText(displayDesc, { x: c2, y, size: 8, font, color: secondary });
        }

        y -= 15;
        page.drawLine({ start: { x: margin, y: y + 6 }, end: { x: width - margin, y: y + 6 }, thickness: 0.5, color: borderColor });
      });
    }

    y -= 18;

    // =========================================
    // SUMMARY SECTION
    // =========================================
    const sumY = y;
    
    // Payment Status Stamp (left)
    const status = bill.status || "unpaid";
    let stampText = "PENDING";
    let stampColor = danger;
    if (status === "paid") { stampText = "PAID"; stampColor = success; }
    else if (status === "partial") { stampText = "PARTIAL"; stampColor = warning; }

    const stampFS = 22;
    const stampPadX = 16;
    const stampPadY = 6;
    const stampTW = fontBold.widthOfTextAtSize(stampText, stampFS);
    const stampW = stampTW + stampPadX * 2;
    const stampH = stampFS + stampPadY * 2;
    
    page.drawRectangle({ x: margin, y: sumY - stampH, width: stampW, height: stampH, borderColor: stampColor, borderWidth: 3, color: white });
    page.drawText(stampText, { x: margin + stampPadX, y: sumY - stampH + stampPadY + 2, size: stampFS, font: fontBold, color: stampColor });

    // QR Code
    const qrSize = 60;
    const qrX = margin;
    const qrY = sumY - stampH - 15 - qrSize;
    
    try {
      const verifyUrl = bill.verificationUrl || `${process.env.FRONTEND_URL || 'https://onecare.bhargavkarande.dev'}/verify/bill/${bill._id}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });
      const qrImg = await pdfDoc.embedPng(qrDataUrl);
      page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    } catch (e) {}
    
    page.drawText("VERIFY RECEIPT", { x: qrX + qrSize + 10, y: qrY + qrSize - 10, size: 8, font: fontBold, color: primary });
    page.drawText("Scan for digital copy", { x: qrX + qrSize + 10, y: qrY + qrSize - 22, size: 7, font, color: secondary });

    // Totals (right)
    const totW = 170;
    const totX = width - margin - totW;
    let totY = sumY - 6;
    const totLH = 17;

    page.drawText("Sub-Total", { x: totX, y: totY, size: 11, font, color: primary });
    const subVal = `Rs. ${(bill.subTotal || 0).toFixed(2)}`;
    page.drawText(subVal, { x: width - margin - font.widthOfTextAtSize(subVal, 11), y: totY, size: 11, font, color: primary });
    totY -= totLH;

    if (bill.discount > 0) {
      page.drawText("Discount Applied", { x: totX, y: totY, size: 11, font, color: danger });
      const discVal = `- Rs. ${bill.discount.toFixed(2)}`;
      page.drawText(discVal, { x: width - margin - font.widthOfTextAtSize(discVal, 11), y: totY, size: 11, font, color: danger });
      totY -= totLH;
    }

    if (bill.taxDetails?.length > 0) {
      bill.taxDetails.forEach(t => {
        const tLabel = `Tax (${t.name} ${t.rate}%)`;
        page.drawText(tLabel, { x: totX, y: totY, size: 11, font, color: primary });
        const tVal = `Rs. ${(t.amount || 0).toFixed(2)}`;
        page.drawText(tVal, { x: width - margin - font.widthOfTextAtSize(tVal, 11), y: totY, size: 11, font, color: primary });
        totY -= totLH;
      });
    } else {
      page.drawText("Tax (GST 0%)", { x: totX, y: totY, size: 11, font, color: primary });
      page.drawText("Rs. 0.00", { x: width - margin - font.widthOfTextAtSize("Rs. 0.00", 11), y: totY, size: 11, font, color: primary });
      totY -= totLH;
    }

    totY -= 4;
    page.drawLine({ start: { x: totX, y: totY + 9 }, end: { x: width - margin, y: totY + 9 }, thickness: 2, color: primary });
    totY -= 6;
    
    const gtLabel = status === "paid" ? "Total Paid" : "Grand Total";
    page.drawText(gtLabel, { x: totX, y: totY, size: 14, font: fontBold, color: accent });
    const gtVal = `Rs. ${(bill.totalAmount || 0).toFixed(2)}`;
    page.drawText(gtVal, { x: width - margin - fontBold.widthOfTextAtSize(gtVal, 14), y: totY, size: 14, font: fontBold, color: accent });

    // =========================================
    // FOOTER
    // =========================================
    const footerY = 110;
    
    page.drawLine({ start: { x: margin, y: footerY + 38 }, end: { x: width - margin, y: footerY + 38 }, thickness: 1, color: borderColor });
    page.drawText("Terms & Conditions:", { x: margin, y: footerY + 23, size: 10, font: fontBold, color: primary });
    
    const defaultTerms = [
      "1. This is a computer-generated invoice and does not require a physical signature.",
      "2. Please preserve this receipt for future medical history and follow-up consultations.",
      "3. Amount once paid is non-refundable as per hospital policy."
    ];
    const terms = bill.clinicId?.termsAndConditions?.length > 0 
      ? bill.clinicId.termsAndConditions.map((t, i) => `${i + 1}. ${t}`)
      : defaultTerms;
    
    let termY = footerY + 8;
    terms.slice(0, 3).forEach(t => {
      page.drawText(t, { x: margin, y: termY, size: 8, font, color: secondary });
      termY -= 10;
    });

    const wishText = "WISH YOU A SPEEDY RECOVERY!";
    const wishW = fontBold.widthOfTextAtSize(wishText, 11);
    page.drawText(wishText, { x: (width - wishW) / 2, y: 40, size: 11, font: fontBold, color: accent });

    const wmText = "OneCare Hospital Management System";
    const wmW = font.widthOfTextAtSize(wmText, 7);
    page.drawText(wmText, { x: width - margin - wmW, y: 18, size: 7, font, color: watermarkClr });

    // Send PDF
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Invoice-${bill.billNumber || bill._id}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    logger.error("Error generating bill PDF", { id: req.params.id, error: err.message, stack: err.stack });
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;