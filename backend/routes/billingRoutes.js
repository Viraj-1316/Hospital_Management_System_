const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BillingModel = require("../models/Billing");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const {
  patientPopulate,
  doctorPopulate,
  clinicPopulate,
  normalizeDocument
} = require("../utils/populateHelper");
const { verifyToken } = require("../middleware/auth");

// Helper: Convert string ID to ObjectId if valid, otherwise null
const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

// --- CREATE BILL (POST) ---
router.post("/", verifyToken, async (req, res) => {
  try {
    const generatedBillNumber = Math.floor(100000 + Math.random() * 900000);

    // Convert string IDs to ObjectIds for proper references
    const payload = {
      ...req.body,
      billNumber: generatedBillNumber,
      patientId: toObjectId(req.body.patientId),
      doctorId: toObjectId(req.body.doctorId),
      // Force clinicId from token if available
      clinicId: req.user.clinicId ? toObjectId(req.user.clinicId) : toObjectId(req.body.clinicId),
      encounterId: toObjectId(req.body.encounterId),
      date: req.body.date ? new Date(req.body.date) : new Date(),
    };

    const bill = await BillingModel.create(payload);
    res.json({ message: "Bill created successfully", data: bill });
  } catch (err) {
    logger.error("Error creating bill", { error: err.message });
    res.status(500).json({ message: "Error creating bill", error: err.message });
  }
});

// --- GET ALL BILLS (with population) ---
router.get("/", verifyToken, async (req, res) => {
  try {
    const { doctorId, patientId, status } = req.query;
    let query = {};

    if (doctorId) {
      query.doctorId = toObjectId(doctorId) || doctorId;
    }
    if (patientId) {
      query.patientId = toObjectId(patientId) || patientId;
    }
    if (status) {
      query.status = status;
    }

    if (status) {
      query.status = status;
    }

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
      // Global View
    } else if (effectiveRole === "patient") {
      // Patients can only see their own bills
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

    // Normalize data - use populated data or fallback to stored names
    const normalized = bills.map(bill => {
      const copy = { ...bill };

      // Patient info
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
      }

      // Doctor info
      if (copy.doctorId && typeof copy.doctorId === "object") {
        const d = copy.doctorId;
        copy.doctorName = copy.doctorName || `${d.firstName || ""} ${d.lastName || ""}`.trim();
      }

      // Clinic info
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

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Normalize patient/doctor names
    if (bill.patientId && typeof bill.patientId === "object") {
      const p = bill.patientId;
      bill.patientName = bill.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
    }
    if (bill.doctorId && typeof bill.doctorId === "object") {
      const d = bill.doctorId;
      bill.doctorName = bill.doctorName || `${d.firstName || ""} ${d.lastName || ""}`.trim();
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
    // Convert string IDs to ObjectIds
    const updateData = {
      ...req.body,
      patientId: req.body.patientId ? toObjectId(req.body.patientId) : undefined,
      doctorId: req.body.doctorId ? toObjectId(req.body.doctorId) : undefined,
      clinicId: req.body.clinicId ? toObjectId(req.body.clinicId) : undefined,
      encounterId: req.body.encounterId ? toObjectId(req.body.encounterId) : undefined,
      date: req.body.date ? new Date(req.body.date) : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const updated = await BillingModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bill not found" });
    }

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
    if (!deleted) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json({ message: "Bill deleted" });
  } catch (err) {
    logger.error("Error deleting bill", { id: req.params.id, error: err.message });
    res.status(500).json({ message: "Error deleting bill" });
  }
});

// --- PDF GENERATION ---
function colorFromHex(hex = "#000000") {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

router.get("/:id/pdf", verifyToken, async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id)
      .populate({ path: "patientId", select: "firstName lastName", model: "Patient" })
      .populate({ path: "doctorId", select: "firstName lastName", model: "Doctor" })
      .lean();

    if (!bill) {
      return res.status(404).send("Bill not found");
    }

    // Get names from populated data or fallback to stored names
    let patientName = bill.patientName || "N/A";
    let doctorName = bill.doctorName || "N/A";

    if (bill.patientId && typeof bill.patientId === "object") {
      const p = bill.patientId;
      patientName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || patientName;
    }
    if (bill.doctorId && typeof bill.doctorId === "object") {
      const d = bill.doctorId;
      doctorName = `${d.firstName || ""} ${d.lastName || ""}`.trim() || doctorName;
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Logo
    try {
      const logoPath = path.join(__dirname, "..", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const logoSize = 50;
        page.drawImage(logoImg, {
          x: margin,
          y: y - logoSize,
          width: logoSize,
          height: logoSize,
        });
      }
    } catch (e) {
      logger.debug("Could not embed logo in bill PDF", { error: e.message });
    }

    // Clinic Name
    page.drawText(bill.clinicName || "Clinic Name", {
      x: margin + 60,
      y: y - 20,
      size: 20,
      font: bold,
      color: colorFromHex("#000000"),
    });

    // Date
    const dateStr = bill.date
      ? new Date(bill.date).toLocaleDateString()
      : new Date().toLocaleDateString();
    page.drawText(`Date: ${dateStr}`, {
      x: width - margin - 100,
      y: y - 20,
      size: 10,
      font,
    });

    y -= 80;

    // Bill Info
    page.drawText("INVOICE / BILL", {
      x: margin,
      y,
      size: 16,
      font: bold,
      color: colorFromHex("#333333"),
    });

    y -= 30;
    page.drawText(`Bill #: ${bill.billNumber || bill._id}`, { x: margin, y, size: 10, font });
    y -= 15;
    page.drawText(`Patient Name: ${patientName}`, { x: margin, y, size: 10, font });
    y -= 15;
    page.drawText(`Doctor Name: ${doctorName}`, { x: margin, y, size: 10, font });

    y -= 30;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: colorFromHex("#cccccc"),
    });
    y -= 20;

    // Services Table Header
    page.drawText("Service / Description", { x: margin, y, size: 10, font: bold });
    page.drawText("Amount", { x: width - margin - 60, y, size: 10, font: bold });

    y -= 10;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: colorFromHex("#cccccc"),
    });
    y -= 20;

    // Services Items
    if (Array.isArray(bill.services)) {
      for (const svc of bill.services) {
        const svcName = typeof svc === "string" ? svc : svc.name || JSON.stringify(svc);
        const svcAmount = typeof svc === "object" && svc.amount ? svc.amount : "";
        if (!svcName) continue;

        page.drawText(svcName, { x: margin, y, size: 10, font });
        if (svcAmount) {
          page.drawText(`Rs. ${svcAmount}`, { x: width - margin - 60, y, size: 10, font });
        }
        y -= 15;
      }
    }

    // Totals
    y -= 20;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: colorFromHex("#cccccc"),
    });
    y -= 25;

    const rightColX = width - margin - 150;

    page.drawText("Total Amount:", { x: rightColX, y, size: 10, font: bold });
    page.drawText(`Rs. ${bill.totalAmount || 0}`, { x: rightColX + 100, y, size: 10, font });
    y -= 15;

    if (bill.discount) {
      page.drawText("Discount:", { x: rightColX, y, size: 10, font: bold });
      page.drawText(`- Rs. ${bill.discount}`, { x: rightColX + 100, y, size: 10, font });
      y -= 15;
    }

    page.drawText("Amount Due:", { x: rightColX, y, size: 12, font: bold });
    page.drawText(`Rs. ${bill.amountDue || 0}`, { x: rightColX + 100, y, size: 12, font: bold });
    y -= 30;

    // Status
    const statusColor = bill.status === "paid" ? colorFromHex("#008000") : colorFromHex("#ff0000");
    page.drawText(`Status: ${(bill.status || "unpaid").toUpperCase()}`, {
      x: margin,
      y,
      size: 10,
      font: bold,
      color: statusColor,
    });

    // Footer
    page.drawText("Thank you for visiting.", {
      x: margin,
      y: 30,
      size: 10,
      font,
      color: colorFromHex("#777777"),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=bill-${bill.billNumber || bill._id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error("Error generating bill PDF", { id: req.params.id, error: err.message });
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;