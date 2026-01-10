# 💰 Billing System & Razorpay Integration

This document explains the complete billing and payment system.

---

## 🏗️ System Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Create     │───▶│   Calculate  │───▶│   Payment    │───▶│   Generate   │
│   Bill       │    │   Total+Tax  │    │   (Optional) │    │   PDF        │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │   Razorpay       │
                                    │   Gateway        │
                                    └──────────────────┘
```

---

## 📋 Bill Data Structure

**Model**: `backend/models/Billing.js`

```javascript
{
  billNumber: "INV-2026-001",      // Auto-generated
  patientId: ObjectId,             // Reference to Patient
  patientName: "John Doe",         // Denormalized for display
  doctorId: ObjectId,              // Reference to Doctor
  clinicId: ObjectId,              // Reference to Clinic
  appointmentId: ObjectId,         // Optional link to appointment

  services: [                      // Line items
    { name: "Consultation", amount: 500, quantity: 1 },
    { name: "Blood Test", amount: 300, quantity: 1 }
  ],

  subTotal: 800,                   // Sum of services
  discount: 50,                    // Discount amount
  taxDetails: [                    // Applied taxes
    { name: "GST", percentage: 18, amount: 135 }
  ],
  taxAmount: 135,                  // Total tax
  totalAmount: 885,                // Final amount

  paidAmount: 0,                   // Amount paid so far
  amountDue: 885,                  // Remaining balance

  status: "unpaid",                // unpaid | partial | paid
  paymentMethod: "Cash",           // Cash | Online
  razorpayPaymentId: null,         // For online payments
  razorpayOrderId: null,
  onlinePaymentDate: null,

  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Bill Creation Flow

### Step 1: Frontend Form Submission

**File**: `frontend/src/admin-dashboard/admin/AddBill.jsx`

```javascript
const handleSubmit = async () => {
  const billData = {
    patientId: selectedPatient._id,
    services: selectedServices,
    discount: discountAmount,
    taxDetails: appliedTaxes,
    paymentMethod: "Cash",
    status: "unpaid",
  };

  await axios.post(`${API_BASE}/bills`, billData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
```

### Step 2: Backend Processing

**File**: `backend/routes/billingRoutes.js`

```javascript
router.post("/", verifyToken, async (req, res) => {
  // 1. Calculate totals
  const subTotal = services.reduce((sum, s) => sum + s.amount * s.quantity, 0);
  const taxAmount = taxDetails.reduce((sum, t) => sum + t.amount, 0);
  const totalAmount = subTotal - discount + taxAmount;

  // 2. Auto-generate bill number
  const billPrefix = clinic.billPrefix || "INV-";
  const counter = await Counter.findOneAndUpdate(
    { name: "billNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const billNumber = `${billPrefix}${counter.seq}`;

  // 3. Create bill
  const bill = await BillingModel.create({
    billNumber,
    patientId,
    services,
    subTotal,
    taxAmount,
    totalAmount,
    status: "unpaid",
  });

  res.json({ message: "Bill created", data: bill });
});
```

---

## 💳 Razorpay Payment Integration

### Configuration

**File**: `backend/models/ProSetting.js`

```javascript
{
  razorpayEnabled: true,
  razorpayKeyId: "rzp_test_xxxxx",
  razorpayKeySecret: "encrypted_secret",
  razorpayCurrency: "INR"
}
```

### Payment Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Patient     │    │ Frontend    │    │ Backend     │    │ Razorpay    │
│ Clicks Pay  │    │ Calls API   │    │ Creates     │    │ Payment     │
│             │───▶│             │───▶│ Order       │───▶│ Page        │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
                          ┌────────────────────────────────────┘
                          ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │ Payment     │    │ Verify      │    │ Update      │
                   │ Complete    │───▶│ Signature   │───▶│ Bill Status │
                   │             │    │             │    │ to "paid"   │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

### Step 1: Create Payment Order

**File**: `backend/routes/razorpayRoutes.js`

```javascript
router.post("/create-order", verifyToken, async (req, res) => {
  const { billId } = req.body;
  const bill = await BillingModel.findById(billId);

  // Get Razorpay instance
  const settings = await ProSetting.findOne();
  const razorpay = new Razorpay({
    key_id: settings.razorpayKeyId,
    key_secret: settings.razorpayKeySecret,
  });

  // Create order (amount in paise)
  const order = await razorpay.orders.create({
    amount: bill.amountDue * 100,
    currency: settings.razorpayCurrency || "INR",
    receipt: `bill_${bill.billNumber}`,
  });

  res.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
  });
});
```

### Step 2: Frontend Payment Modal

**File**: `frontend/src/patient-dashboard/Patient/PatientBills.jsx`

```javascript
const handlePayment = async (billId) => {
  // 1. Create order
  const orderRes = await axios.post(`${API_BASE}/api/razorpay/create-order`, {
    billId,
  });

  // 2. Open Razorpay checkout
  const options = {
    key: razorpayKeyId,
    amount: orderRes.data.amount,
    currency: orderRes.data.currency,
    order_id: orderRes.data.id,
    handler: async (response) => {
      // 3. Verify payment
      await axios.post(`${API_BASE}/api/razorpay/verify-payment`, {
        billId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success("Payment successful!");
      fetchBills(); // Refresh list
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

### Step 3: Verify Payment

**File**: `backend/routes/razorpayRoutes.js`

```javascript
router.post("/verify-payment", verifyToken, async (req, res) => {
  const { billId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // Verify signature
  const settings = await ProSetting.findOne();
  const generatedSignature = crypto
    .createHmac("sha256", settings.razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Update bill
  const bill = await BillingModel.findById(billId);
  bill.razorpayPaymentId = razorpay_payment_id;
  bill.razorpayOrderId = razorpay_order_id;
  bill.onlinePaymentDate = new Date();
  bill.paymentMethod = "Online";
  bill.paidAmount = bill.totalAmount;
  bill.amountDue = 0;
  bill.status = "paid";
  await bill.save();

  res.json({ message: "Payment verified", status: "paid" });
});
```

---

## 📄 PDF Generation

### Bill PDF Structure

**File**: `backend/routes/billingRoutes.js` - `GET /:id/pdf`

```javascript
router.get("/:id/pdf", verifyToken, async (req, res) => {
  const bill = await BillingModel.findById(req.params.id)
    .populate("patientId")
    .populate("doctorId")
    .populate("clinicId");

  // Create PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  // Add clinic header
  // Add patient info
  // Add services table
  // Add totals
  // Add QR code for verification

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=bill_${bill.billNumber}.pdf`
  );
  res.send(Buffer.from(pdfBytes));
});
```

### QR Code Verification

```javascript
const QRCode = require("qrcode");
const verifyUrl = `${process.env.FRONTEND_URL}/verify/bill/${bill._id}`;
const qrDataUrl = await QRCode.toDataURL(verifyUrl);
```

---

## 📊 Payment Reports

### Transaction Summary API

**File**: `backend/routes/transactionRoutes.js`

```javascript
router.get("/summary", verifyToken, async (req, res) => {
  const summary = await BillingModel.aggregate([
    { $match: { status: { $in: ["paid", "partial"] }, clinicId } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$paidAmount" },
        cashRevenue: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$paidAmount", 0],
          },
        },
        onlineRevenue: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "Online"] }, "$paidAmount", 0],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  res.json(summary[0]);
});
```

---

## 🔧 Configuration

### Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### Frontend Script

Add to `index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```
