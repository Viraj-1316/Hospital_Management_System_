# 📄 PDF Generation System

This document explains how PDFs are generated in OneCare.

---

## 🏗️ Technology Stack

- **Library**: `pdf-lib` (pure JavaScript PDF generation)
- **QR Codes**: `qrcode` package
- **Location**: Server-side generation (backend)

---

## 📍 PDF Generation Locations

| PDF Type                 | Route                       | File                   |
| ------------------------ | --------------------------- | ---------------------- |
| Appointment Confirmation | `GET /appointments/:id/pdf` | `appointmentRoutes.js` |
| Bill/Invoice             | `GET /bills/:id/pdf`        | `billingRoutes.js`     |
| Preview (Editor)         | `POST /pdf/preview`         | `pdfRoutes.js`         |

---

## 📋 Appointment PDF Structure

### Layout

```
┌─────────────────────────────────────────────────┐
│ [LOGO]  CLINIC NAME                  Date: xxx  │
│         Dr. Doctor Name                         │
│         Address Line 1                          │
│         Contact: xxxx  Email: xxx@xxx           │
├─────────────────────────────────────────────────┤
│ Patient Name: John Doe                          │
│ Email: john@email.com                           │
│ Phone: +91 9876543210                           │
│ DOB: January 15, 1990                           │
├─────────────────────────────────────────────────┤
│              APPOINTMENT DETAILS                │
├─────────────────────────────────────────────────┤
│ Date: January 10, 2026    Time: 10:00 AM        │
│ Status: Confirmed         Payment: Online       │
│ Service: General Checkup  Amount: Rs.500/-      │
├─────────────────────────────────────────────────┤
│                                    ┌─────────┐  │
│ Scan QR to verify appointment      │   QR    │  │
│                                    │  CODE   │  │
│                                    └─────────┘  │
├─────────────────────────────────────────────────┤
│         Thank you for choosing OneCare          │
└─────────────────────────────────────────────────┘
```

### Code Implementation

**File**: `backend/routes/appointmentRoutes.js`

```javascript
router.get("/:id/pdf", verifyToken, async (req, res) => {
  const appointment = await AppointmentModel.findById(req.params.id)
    .populate("patientId")
    .populate("doctorId");

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load clinic logo
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    page.drawImage(logoImage, { x: 40, y: 760, width: 55, height: 55 });
  }

  // Draw clinic name
  page.drawText("Valley Clinic", {
    x: 105,
    y: 800,
    size: 18,
    font: helveticaBold,
  });

  // Draw patient info, appointment details...

  // Generate QR Code
  const verifyUrl = `${process.env.FRONTEND_URL}/verify/appointment/${appointment._id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImage, { x: 480, y: 50, width: 80, height: 80 });

  // Finalize and send
  const pdfBytes = await pdfDoc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdfBytes));
});
```

---

## 🧾 Bill PDF Structure

### Layout

```
┌─────────────────────────────────────────────────┐
│ [LOGO]  CLINIC NAME                Bill #: INV-001
│         Address                    Date: xxx    │
│         GSTIN: xxxxxxxx                         │
├─────────────────────────────────────────────────┤
│ BILL TO:                                        │
│ Patient Name: John Doe                          │
│ Phone: +91 9876543210                           │
├─────────────────────────────────────────────────┤
│ # │ SERVICE              │ QTY │ RATE  │ AMOUNT │
├───┼──────────────────────┼─────┼───────┼────────┤
│ 1 │ Consultation         │  1  │ ₹500  │  ₹500  │
│ 2 │ Blood Test           │  1  │ ₹300  │  ₹300  │
├───┴──────────────────────┴─────┴───────┴────────┤
│                           Subtotal:      ₹800   │
│                           GST (18%):     ₹144   │
│                           Discount:      -₹50   │
│                           ─────────────────     │
│                           TOTAL:         ₹894   │
├─────────────────────────────────────────────────┤
│ Payment Status: PAID                            │
│ Payment Method: Online (Razorpay)               │
│ Transaction ID: pay_xxxxxxxxxxxxxx              │
│ Payment Date: January 10, 2026 10:30 AM         │
├─────────────────────────────────────────────────┤
│                                    ┌─────────┐  │
│ Scan to verify bill authenticity   │   QR    │  │
│                                    │  CODE   │  │
│                                    └─────────┘  │
└─────────────────────────────────────────────────┘
```

### Code Implementation

**File**: `backend/routes/billingRoutes.js`

```javascript
router.get("/:id/pdf", verifyToken, async (req, res) => {
  const bill = await BillingModel.findById(req.params.id)
    .populate("patientId")
    .populate("clinicId");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;

  // Header
  page.drawText(bill.clinicId?.name || "Clinic", {
    x: 40,
    y,
    size: 18,
    font: bold,
  });

  y -= 30;

  // Patient Info
  page.drawText(`Patient: ${bill.patientName}`, {
    x: 40,
    y,
    size: 11,
    font,
  });

  // Services Table
  y -= 60;
  const tableStartY = y;

  // Table headers
  page.drawText("Service", { x: 40, y, size: 10, font: bold });
  page.drawText("Qty", { x: 300, y, size: 10, font: bold });
  page.drawText("Rate", { x: 350, y, size: 10, font: bold });
  page.drawText("Amount", { x: 450, y, size: 10, font: bold });

  y -= 20;

  // Table rows
  for (const service of bill.services) {
    page.drawText(service.name, { x: 40, y, size: 10, font });
    page.drawText(String(service.quantity || 1), { x: 300, y, size: 10, font });
    page.drawText(`₹${service.amount}`, { x: 350, y, size: 10, font });
    page.drawText(`₹${service.amount * (service.quantity || 1)}`, {
      x: 450,
      y,
      size: 10,
      font,
    });
    y -= 18;
  }

  // Totals
  y -= 20;
  page.drawText(`Subtotal: ₹${bill.subTotal}`, { x: 400, y, size: 10, font });
  y -= 15;
  page.drawText(`Tax: ₹${bill.taxAmount}`, { x: 400, y, size: 10, font });
  y -= 15;
  page.drawText(`Total: ₹${bill.totalAmount}`, {
    x: 400,
    y,
    size: 12,
    font: bold,
  });

  // Payment info for online payments
  if (bill.paymentMethod === "Online" && bill.razorpayPaymentId) {
    y -= 30;
    page.drawText(`Payment ID: ${bill.razorpayPaymentId}`, {
      x: 40,
      y,
      size: 9,
      font,
    });
  }

  // QR Code
  const verifyUrl = `${process.env.FRONTEND_URL}/verify/bill/${bill._id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImage, { x: 480, y: 50, width: 80, height: 80 });

  const pdfBytes = await pdfDoc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdfBytes));
});
```

---

## 🎨 PDF Preview Editor

**File**: `backend/routes/pdfRoutes.js`

The preview endpoint allows customizing PDF layout before final generation:

```javascript
router.post("/preview", async (req, res) => {
  const { appointmentId, layout = {} } = req.body;

  // Layout options
  const headerCfg = layout.header || {};
  const footerCfg = layout.footer || {};
  const notesCfg = layout.notes || {};
  const nextApptCfg = layout.nextAppointment || {};

  // Generate PDF with custom layout...

  // Return as base64 for preview in browser
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  res.json({ pdfBase64 });
});
```

---

## 🔗 Public Verification Pages

### Appointment Verification

**File**: `frontend/src/components/VerifyAppointment.jsx`

```javascript
const VerifyAppointment = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    // Public endpoint - no auth required
    axios
      .get(`${API_BASE}/appointments/${id}/verify`)
      .then((res) => setAppointment(res.data));
  }, [id]);

  return (
    <div className="verify-container">
      <h1>✅ Appointment Verified</h1>
      <p>Patient: {appointment?.patientName}</p>
      <p>Doctor: {appointment?.doctorName}</p>
      <p>Date: {appointment?.date}</p>
    </div>
  );
};
```

---

## 📦 Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "qrcode": "^1.5.3"
}
```

---

## 🎯 Best Practices

1. **Always use server-side generation** for official documents
2. **Include QR codes** for easy verification
3. **Add clinic branding** (logo, colors)
4. **Store verification URLs** using frontend URL env variable
5. **Use A4 page size** (595 x 842 points) for print compatibility
