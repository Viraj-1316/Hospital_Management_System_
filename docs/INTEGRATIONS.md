# 🔌 External Integrations

Documentation for all third-party service integrations.

---

## 🎥 Google Meet Integration

### Purpose

Enable video consultations for telemedicine appointments.

### OAuth Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Doctor    │───▶│   Backend   │───▶│   Google    │
│   Clicks    │    │   Redirect  │    │   OAuth     │
│   Connect   │    │   to Google │    │   Consent   │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
     ┌──────────────────────────────────────┘
     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Google    │───▶│   Backend   │───▶│   Store     │
│   Callback  │    │   Exchange  │    │   Tokens    │
│   with Code │    │   for Token │    │   in DB     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Configuration

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/doctor/callback
```

### Backend Routes

**File**: `backend/routes/googleOAuthRoutes.js`

```javascript
// Initiate OAuth
router.get("/connect", verifyToken, (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: req.user.id // Pass doctor ID
  });

  res.redirect(authUrl);
});

// Handle callback
router.get("/callback", async (req, res) => {
  const { code, state: doctorId } = req.query;

  const oauth2Client = new google.auth.OAuth2(...);
  const { tokens } = await oauth2Client.getToken(code);

  await DoctorModel.findByIdAndUpdate(doctorId, {
    googleMeetToken: tokens,
    googleMeetConnected: true
  });

  res.redirect(`${process.env.FRONTEND_URL}/doctor/settings/integration?success=true`);
});
```

### Creating Meeting

```javascript
const createGoogleMeetEvent = async (doctor, appointment) => {
  const oauth2Client = new google.auth.OAuth2(...);
  oauth2Client.setCredentials(doctor.googleMeetToken);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Consultation: ${appointment.patientName}`,
      start: { dateTime: appointment.startDateTime },
      end: { dateTime: appointment.endDateTime },
      conferenceData: {
        createRequest: { requestId: uuidv4() }
      }
    }
  });

  return event.data.hangoutLink;
};
```

---

## 📹 Zoom Integration

### OAuth Flow

Similar to Google Meet but with Zoom's OAuth endpoints.

### Configuration

```env
ZOOM_CLIENT_ID=xxxxxx
ZOOM_CLIENT_SECRET=xxxxxx
ZOOM_REDIRECT_URI=http://localhost:3001/api/auth/zoom/doctor/callback
```

### Routes

**File**: `backend/routes/zoomOAuthRoutes.js`

```javascript
router.get("/connect", verifyToken, (req, res) => {
  const authUrl =
    `https://zoom.us/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.ZOOM_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.ZOOM_REDIRECT_URI)}&` +
    `state=${req.user.id}`;

  res.redirect(authUrl);
});
```

---

## 💳 Razorpay Payment Gateway

### Configuration

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxx
```

### Orders Flow

```javascript
// 1. Create Order
const order = await razorpay.orders.create({
  amount: 50000, // ₹500 in paise
  currency: "INR",
  receipt: "bill_123",
});

// 2. Frontend shows Razorpay checkout
// 3. After payment, verify signature
const generatedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(`${order_id}|${payment_id}`)
  .digest("hex");

if (generatedSignature === razorpay_signature) {
  // Payment verified
}
```

See `docs/BILLING_SYSTEM.md` for full details.

---

## 📧 Email Service (SMTP)

### Configuration

```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=no-reply@yourhospital.com
```

### Implementation

**File**: `backend/utils/emailService.js`

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};
```

### Email Templates

**File**: `backend/utils/emailTemplates.js`

```javascript
const appointmentConfirmationTemplate = (data) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      .container { font-family: Arial, sans-serif; max-width: 600px; }
      .header { background: #4e54c8; color: white; padding: 20px; }
      .content { padding: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Appointment Confirmed</h1>
      </div>
      <div class="content">
        <p>Dear ${data.patientName},</p>
        <p>Your appointment has been scheduled:</p>
        <ul>
          <li><strong>Doctor:</strong> ${data.doctorName}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
        </ul>
      </div>
    </div>
  </body>
  </html>
`;
```

---

## 📱 WhatsApp Business API

### Configuration

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
```

### Implementation

**File**: `backend/utils/whatsappService.js`

```javascript
const sendWhatsAppMessage = async (to, templateName, templateParams) => {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: templateParams.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
```

---

## 🌐 MongoDB Atlas

### Connection

**File**: `backend/config/db.js`

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
```

### Connection String Format

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hospital_db?retryWrites=true&w=majority
```

---

## 🔄 Socket.io (Real-time)

### Server Setup

**File**: `backend/utils/socketServer.js`

```javascript
const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-clinic", (clinicId) => {
      socket.join(`clinic-${clinicId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

const emitToClinic = (clinicId, event, data) => {
  if (io) {
    io.to(`clinic-${clinicId}`).emit(event, data);
  }
};
```

### Frontend Usage

**File**: `frontend/src/context/SocketContext.jsx`

```javascript
import { io } from "socket.io-client";

const socket = io(API_BASE, { withCredentials: true });

socket.emit("join-clinic", user.clinicId);

socket.on("new-appointment", (data) => {
  toast.info(`New appointment: ${data.patientName}`);
});
```
