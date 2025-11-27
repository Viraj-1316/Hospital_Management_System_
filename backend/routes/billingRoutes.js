const express = require("express");
const router = express.Router();
const BillingModel = require("../models/Billing");

router.post("/", async (req, res) => {
  try {
    const bill = await BillingModel.create(req.body);
    res.json({ message: "Bill created successfully", data: bill });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const bills = await BillingModel.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bills", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bill" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await BillingModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "Bill updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating bill" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await BillingModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting bill" });
  }
});

const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

// Helper: Hex to PDF color
function colorFromHex(hex = "#000000") {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

router.get("/:id/pdf", async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id);
    if (!bill) {
      return res.status(404).send("Bill not found");
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // --- Header ---
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
      console.warn("Logo load failed", e);
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

    // --- Bill Info ---
    page.drawText("INVOICE / BILL", {
      x: margin,
      y,
      size: 16,
      font: bold,
      color: colorFromHex("#333333"),
    });

    y -= 30;
    page.drawText(`Bill ID: ${bill._id}`, { x: margin, y, size: 10, font });
    y -= 15;
    page.drawText(`Patient Name: ${bill.patientName}`, {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= 15;
    page.drawText(`Doctor Name: ${bill.doctorName}`, {
      x: margin,
      y,
      size: 10,
      font,
    });

    y -= 30;
    // Divider
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: colorFromHex("#cccccc"),
    });
    y -= 20;

    // --- Services Table Header ---
    page.drawText("Service / Description", {
      x: margin,
      y,
      size: 10,
      font: bold,
    });
    page.drawText("Amount", {
      x: width - margin - 60,
      y,
      size: 10,
      font: bold,
    });

    y -= 10;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: colorFromHex("#cccccc"),
    });
    y -= 20;

    // --- Services Items ---
    // If services is array of strings or objects?
    // Based on user output: "services":[""] -> it might be empty or strings
    // We'll just list them.
    if (Array.isArray(bill.services)) {
      for (const svc of bill.services) {
        const svcName = typeof svc === "string" ? svc : svc.name || JSON.stringify(svc);
        if (!svcName) continue;
        
        page.drawText(svcName, { x: margin, y, size: 10, font });
        // If we had individual prices, we'd put them here.
        // But the model seems to have totalAmount directly.
        y -= 15;
      }
    }

    // --- Totals ---
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
    page.drawText(`${bill.totalAmount}`, {
      x: rightColX + 100,
      y,
      size: 10,
      font,
    });
    y -= 15;

    if (bill.discount) {
      page.drawText("Discount:", { x: rightColX, y, size: 10, font: bold });
      page.drawText(`- ${bill.discount}`, {
        x: rightColX + 100,
        y,
        size: 10,
        font,
      });
      y -= 15;
    }

    page.drawText("Amount Due:", { x: rightColX, y, size: 12, font: bold });
    page.drawText(`${bill.amountDue}`, {
      x: rightColX + 100,
      y,
      size: 12,
      font: bold,
    });
    y -= 30;

    // Status
    page.drawText(`Status: ${bill.status}`, {
      x: margin,
      y,
      size: 10,
      font: bold,
      color:
        bill.status === "paid" ? colorFromHex("#008000") : colorFromHex("#ff0000"),
    });

    // Footer
    const footerText = "Thank you for visiting.";
    page.drawText(footerText, {
      x: margin,
      y: 30,
      size: 10,
      font,
      color: colorFromHex("#777777"),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=bill-${bill._id}.pdf`
    );
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Error generating bill PDF:", err);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;
