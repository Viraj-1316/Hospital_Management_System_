# 📅 Appointment Booking Flow

Complete documentation of the appointment booking system.

---

## 🔄 Booking Flow Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Select     │───▶│   Choose     │───▶│   Pick       │───▶│   Confirm    │
│   Doctor     │    │   Date       │    │   Time Slot  │    │   Booking    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Create     │───▶│   Send       │───▶│   Generate   │
│   Record     │    │   Emails     │    │   PDF        │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 📋 Appointment Data Model

**File**: `backend/models/Appointment.js`

```javascript
{
  appointmentId: "APT-2026-001",      // Auto-generated

  // Patient Info
  patientId: ObjectId,                 // Reference to Patient
  patientName: "John Doe",             // Denormalized

  // Doctor Info
  doctorId: ObjectId,                  // Reference to Doctor
  doctorName: "Dr. Smith",             // Denormalized

  // Clinic Info
  clinic: "Valley Clinic",
  clinicId: ObjectId,

  // Scheduling
  date: Date,                          // Appointment date
  time: "10:00 AM",                    // Time slot
  slot: "10:00 AM - 10:30 AM",         // Full slot range

  // Type & Status
  type: "in-person",                   // in-person | video
  status: "scheduled",                 // scheduled | completed | cancelled | noshow

  // Services & Billing
  services: "General Consultation",
  charges: 500,
  paymentMode: "Cash",                 // Cash | Online

  // Video Meeting (if type = video)
  meetingLink: "https://meet.google.com/xxx",
  meetingProvider: "google_meet",      // google_meet | zoom

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🏥 Step 1: Select Doctor

### Frontend

**File**: `frontend/src/patient-dashboard/Patient/PatientBookAppointment.jsx`

```javascript
const [doctors, setDoctors] = useState([]);

useEffect(() => {
  const fetchDoctors = async () => {
    const response = await axios.get(`${API_BASE}/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDoctors(response.data);
  };
  fetchDoctors();
}, []);
```

### Backend

**File**: `backend/routes/doctorRoutes.js`

```javascript
router.get("/", verifyToken, async (req, res) => {
  // Filter by clinic for non-admin users
  const query = {};
  if (req.user.role !== "admin" && req.user.clinicId) {
    query.clinicId = req.user.clinicId;
  }

  const doctors = await DoctorModel.find(query).select(
    "firstName lastName specialization consultationFee"
  );
  res.json(doctors);
});
```

---

## 📆 Step 2: Check Available Slots

### API Call

```javascript
const fetchSlots = async (doctorId, date) => {
  const response = await axios.get(
    `${API_BASE}/appointments/slots?doctorId=${doctorId}&date=${date}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.slots;
};
```

### Slot Generation Logic

**File**: `backend/routes/appointmentRoutes.js`

```javascript
router.get("/slots", verifyToken, async (req, res) => {
  const { doctorId, date } = req.query;

  // 1. Get doctor's session for this day of week
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
  });

  const session = await DoctorSessionModel.findOne({
    doctorId,
    day: dayOfWeek,
    isActive: true,
  });

  if (!session) {
    return res.json({ slots: [], message: "Doctor not available on this day" });
  }

  // 2. Generate time slots based on session times
  const slots = generateTimeSlots(
    session.startTime, // "09:00"
    session.endTime, // "17:00"
    session.slotDuration || 30 // 30 minutes
  );

  // 3. Get existing appointments for this date
  const existingAppointments = await AppointmentModel.find({
    doctorId,
    date: new Date(date),
    status: { $ne: "cancelled" },
  });

  const bookedSlots = existingAppointments.map((a) => a.time);

  // 4. Filter out booked slots
  const availableSlots = slots.filter((slot) => !bookedSlots.includes(slot));

  // 5. Check holidays
  const holiday = await HolidayModel.findOne({
    date: new Date(date),
    $or: [{ doctorId }, { clinicId: session.clinicId }],
  });

  if (holiday) {
    return res.json({ slots: [], message: "Holiday: " + holiday.description });
  }

  res.json({ slots: availableSlots });
});

// Helper function
function generateTimeSlots(startTime, endTime, intervalMins) {
  const slots = [];
  let current = parseTime(startTime);
  const end = parseTime(endTime);

  while (current < end) {
    slots.push(formatTime(current));
    current = new Date(current.getTime() + intervalMins * 60000);
  }

  return slots;
}
```

---

## ✅ Step 3: Confirm Booking

### Frontend Submission

```javascript
const handleBookAppointment = async () => {
  const appointmentData = {
    patientId: patientProfile._id,
    patientName: `${patientProfile.firstName} ${patientProfile.lastName}`,
    doctorId: selectedDoctor._id,
    doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
    date: selectedDate,
    time: selectedSlot,
    type: appointmentType, // 'in-person' or 'video'
    services: selectedServices.join(", "),
    charges: totalAmount,
  };

  const response = await axios.post(
    `${API_BASE}/appointments`,
    appointmentData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  toast.success("Appointment booked successfully!");
  navigate("/patient/appointments");
};
```

### Backend Creation

**File**: `backend/routes/appointmentRoutes.js`

```javascript
router.post("/", verifyToken, async (req, res) => {
  const {
    patientId,
    patientName,
    doctorId,
    doctorName,
    date,
    time,
    type,
    services,
    charges,
  } = req.body;

  // 1. Generate appointment ID
  const counter = await Counter.findOneAndUpdate(
    { name: "appointmentId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const appointmentId = `APT-${new Date().getFullYear()}-${String(
    counter.seq
  ).padStart(5, "0")}`;

  // 2. Check slot availability (double-check)
  const existing = await AppointmentModel.findOne({
    doctorId,
    date: new Date(date),
    time,
    status: { $ne: "cancelled" },
  });

  if (existing) {
    return res.status(400).json({ message: "Slot no longer available" });
  }

  // 3. Create video meeting if needed
  let meetingLink = null;
  if (type === "video") {
    const doctor = await DoctorModel.findById(doctorId);
    if (doctor.googleMeetToken) {
      meetingLink = await createGoogleMeetEvent(doctor, date, time);
    } else if (doctor.zoomToken) {
      meetingLink = await createZoomMeeting(doctor, date, time);
    }
  }

  // 4. Save appointment
  const appointment = await AppointmentModel.create({
    appointmentId,
    patientId,
    patientName,
    doctorId,
    doctorName,
    clinicId: req.user.clinicId,
    clinic: req.user.clinicName,
    date,
    time,
    type,
    services,
    charges,
    status: "scheduled",
    meetingLink,
  });

  // 5. Send confirmation emails
  await sendAppointmentConfirmation(appointment);

  res.status(201).json({ message: "Appointment booked", data: appointment });
});
```

---

## 📧 Email Notifications

**File**: `backend/utils/emailService.js`

```javascript
const sendAppointmentConfirmation = async (appointment) => {
  const patient = await PatientModel.findById(appointment.patientId).populate(
    "userId"
  );

  const emailHtml = `
    <h1>Appointment Confirmed</h1>
    <p>Dear ${appointment.patientName},</p>
    <p>Your appointment has been booked:</p>
    <ul>
      <li><strong>Doctor:</strong> ${appointment.doctorName}</li>
      <li><strong>Date:</strong> ${formatDate(appointment.date)}</li>
      <li><strong>Time:</strong> ${appointment.time}</li>
      <li><strong>Type:</strong> ${appointment.type}</li>
    </ul>
    ${
      appointment.meetingLink
        ? `<p><a href="${appointment.meetingLink}">Join Video Call</a></p>`
        : ""
    }
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: patient.userId?.email,
    subject: "Appointment Confirmation - OneCare",
    html: emailHtml,
  });
};
```

---

## 🎥 Video Appointment Integration

### Google Meet

**File**: `backend/utils/meetingService.js`

```javascript
const createGoogleMeetEvent = async (doctor, date, time) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(doctor.googleMeetToken);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: "Medical Consultation",
      start: { dateTime: combineDateTime(date, time) },
      end: { dateTime: addMinutes(combineDateTime(date, time), 30) },
      conferenceData: {
        createRequest: { requestId: uuid() },
      },
    },
  });

  return event.data.hangoutLink;
};
```

### Zoom

```javascript
const createZoomMeeting = async (doctor, date, time) => {
  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic: "Medical Consultation",
      type: 2,
      start_time: combineDateTime(date, time),
      duration: 30,
    },
    {
      headers: {
        Authorization: `Bearer ${doctor.zoomToken}`,
      },
    }
  );

  return response.data.join_url;
};
```

---

## 🔄 Appointment Status Flow

```
                    ┌──────────────┐
                    │  Scheduled   │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Completed  │ │  Cancelled  │ │   No-Show   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Status Update API

```javascript
router.put("/:id", verifyToken, async (req, res) => {
  const { status } = req.body;

  const appointment = await AppointmentModel.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  // Trigger notifications based on status
  if (status === "cancelled") {
    await sendCancellationEmail(appointment);
  }

  res.json({ message: "Status updated", data: appointment });
});
```
