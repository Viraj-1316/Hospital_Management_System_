# 🛣️ Backend Routes Deep Dive

Detailed documentation of all backend route logic.

---

## 📂 Route Files Overview

| File                   | Mount Point         | Lines | Purpose                |
| ---------------------- | ------------------- | ----- | ---------------------- |
| `auth.js`              | `/`                 | 886   | Authentication         |
| `appointmentRoutes.js` | `/appointments`     | 1402  | Appointment management |
| `billingRoutes.js`     | `/bills`            | 691   | Billing & PDF          |
| `doctorRoutes.js`      | `/doctors`          | 446   | Doctor management      |
| `patientRoutes.js`     | `/patients`         | 534   | Patient management     |
| `serviceRoutes.js`     | `/services`         | 350   | Service catalog        |
| `pdfRoutes.js`         | `/pdf`              | 558   | PDF preview/generation |
| `razorpayRoutes.js`    | `/api/razorpay`     | 252   | Payment gateway        |
| `encounterRoutes.js`   | `/encounters`       | 193   | Medical records        |
| `transactionRoutes.js` | `/api/transactions` | 236   | Financial reports      |

---

## 🔐 auth.js - Authentication Routes

### POST `/login`

**Purpose**: Authenticate users across all roles

**Logic Flow**:

```
1. Check Admin collection
   └─▶ If found → verify password → return token
2. Check Receptionist collection
   └─▶ If found → verify password → return token + mustChangePassword flag
3. Check Doctor collection
   └─▶ If found → verify password → return token + mustChangePassword flag
4. Check User collection (patients, clinic admins)
   └─▶ If found → verify password → return token
5. Return 401 if no match
```

**Response Structure**:

```javascript
{
  id: "60f7c2...",
  email: "user@example.com",
  role: "patient",
  name: "John Doe",
  clinicId: "60f7c2...",
  clinicName: "Valley Clinic",
  token: "eyJhbGci...",
  mustChangePassword: false
}
```

---

### POST `/google`

**Purpose**: Google OAuth for patients

**Logic**:

1. Verify Google access token
2. Extract user info from Google
3. Find or create User document
4. Generate JWT
5. Return user data + token

---

### POST `/forgot-password`

**Logic**:

1. Find user by email (check all collections)
2. Generate crypto random token
3. Hash token and save to user with expiry
4. Send email with reset link
5. Return success message

---

### POST `/reset-password/:token`

**Logic**:

1. Hash the URL token
2. Find user with matching token and valid expiry
3. Update password (bcrypt hash)
4. Clear reset token fields
5. Return success

---

## 📅 appointmentRoutes.js - Appointments

### GET `/slots`

**Purpose**: Get available time slots for booking

**Query Params**: `doctorId`, `date`

**Logic**:

```javascript
1. Get day of week from date
2. Find doctor's session for that day
3. Generate all possible slots from session times
4. Find existing appointments for that date
5. Filter out booked slots
6. Check for holidays
7. Return available slots
```

---

### POST `/`

**Purpose**: Create new appointment

**Body**: `patientId`, `doctorId`, `date`, `time`, `type`, `services`

**Logic**:

```javascript
1. Generate appointment ID (APT-YYYY-NNNNN)
2. Double-check slot availability
3. If video appointment:
   - Check doctor's video platform preference
   - Create Google Meet or Zoom meeting
4. Save appointment to database
5. Send confirmation email
6. Return appointment data
```

---

### GET `/:id/pdf`

**Purpose**: Generate appointment PDF

**Logic**:

1. Fetch appointment with populated patient/doctor/clinic
2. Create PDF document using pdf-lib
3. Draw clinic header with logo
4. Draw patient information
5. Draw appointment details
6. Generate QR code for verification
7. Return PDF buffer

---

### GET `/:id/verify`

**Purpose**: Public verification (no auth required)

**Returns**: Limited appointment data for verification

---

## 🧾 billingRoutes.js - Billing

### POST `/`

**Purpose**: Create new bill

**Calculations**:

```javascript
subTotal = services.reduce((sum, s) => sum + s.amount * s.quantity, 0);
taxAmount = taxDetails.reduce((sum, t) => sum + t.amount, 0);
totalAmount = subTotal - discount + taxAmount;
amountDue = totalAmount - paidAmount;

// Determine status
if (paidAmount >= totalAmount) status = "paid";
else if (paidAmount > 0) status = "partial";
else status = "unpaid";
```

---

### GET `/`

**Purpose**: List all bills (clinic-scoped)

**Access Control**:

```javascript
if (role === 'admin') → See all bills
if (role === 'patient') → See only own bills
else → See clinic's bills only
```

---

### GET `/:id/pdf`

**Purpose**: Generate professional bill PDF

**PDF Structure**:

- Clinic header with logo
- Bill number and date
- Patient details
- Services table
- Tax breakdown
- Payment info (if online)
- QR code for verification

---

## 👨‍⚕️ doctorRoutes.js - Doctors

### POST `/`

**Purpose**: Create new doctor

**Special Logic**:

```javascript
1. Auto-generate password
2. Hash password with bcrypt
3. Save doctor with mustChangePassword: true
4. Send welcome email with credentials
5. Return doctor (without password)
```

---

### POST `/:id/resend-credentials`

**Purpose**: Regenerate and send new password

**Logic**:

1. Generate new random password
2. Update doctor's password hash
3. Send email with new credentials
4. Return success

---

### POST `/import`

**Purpose**: CSV bulk import

**CSV Headers**: `firstName`, `lastName`, `email`, `phone`, `specialization`, etc.

---

## 💰 razorpayRoutes.js - Payments

### POST `/create-order`

**Purpose**: Create Razorpay payment order

**Logic**:

```javascript
1. Get bill details
2. Load Razorpay settings
3. Initialize Razorpay SDK
4. Create order:
   - amount in smallest unit (paise)
   - currency from settings
   - receipt: bill number
5. Return order details to frontend
```

---

### POST `/verify-payment`

**Purpose**: Verify payment and update bill

**Security**:

```javascript
// Verify HMAC signature
const generatedSig = crypto
  .createHmac("sha256", razorpayKeySecret)
  .update(`${order_id}|${payment_id}`)
  .digest("hex");

if (generatedSig !== razorpay_signature) {
  throw new Error("Invalid signature");
}
```

**Bill Update**:

```javascript
bill.razorpayPaymentId = payment_id;
bill.onlinePaymentDate = new Date();
bill.paymentMethod = "Online";
bill.paidAmount = bill.totalAmount;
bill.amountDue = 0;
bill.status = "paid";
```

---

## 📊 transactionRoutes.js - Reports

### GET `/summary`

**Purpose**: Get revenue summary

**Aggregation**:

```javascript
await BillingModel.aggregate([
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
```

---

## 🔒 Common Patterns

### Authentication Middleware

```javascript
router.get("/", verifyToken, async (req, res) => {
  // req.user contains: { id, email, role, clinicId }
});
```

### Clinic Scoping

```javascript
const query = {};
if (req.user.role !== "admin") {
  query.clinicId = req.user.clinicId;
}
const data = await Model.find(query);
```

### Error Handling

```javascript
try {
  // ... logic
  res.json({ data });
} catch (err) {
  logger.error("Error message", { error: err.message });
  res.status(500).json({ message: "Error occurred", error: err.message });
}
```

### Population

```javascript
const bill = await BillingModel.findById(id)
  .populate({
    path: "patientId",
    select: "firstName lastName",
    model: "Patient",
  })
  .populate({ path: "clinicId", select: "name", model: "Clinic" });
```
