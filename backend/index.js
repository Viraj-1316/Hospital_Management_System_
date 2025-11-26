// 1. Import required libraries
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const csv = require("csv-parser");
require("dotenv").config();

// Models
const User = require("./models/User");
const PatientModel = require("./models/Patient");
const DoctorModel = require("./models/Doctor");
const BillingModel = require("./models/Billing");
const AppointmentModel = require("./models/Appointment");
const DoctorSessionModel = require("./models/DoctorSession");
const TaxModel = require("./models/Tax");
const Service = require("./models/Service");

// PDF Libraries
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");

// Utils
const { sendEmail } = require("./utils/emailService");
const { appointmentBookedTemplate } = require("./utils/emailTemplates");

// Routes Imports
const authRoutes = require("./routes/auth");
const receptionistRoutes = require("./routes/receptionistRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const serviceRoutes = require("./routes/services"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve Static Uploads (Crucial for images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CSV Upload Config
const upload = multer({ dest: path.join(__dirname, "uploads") });

// ===============================
//        DB CONNECTION
// ===============================
mongoose
  .connect("mongodb://127.0.0.1:27017/hospital_auth")
  .then(() => {
    console.log("✅ Connected to MongoDB (hospital_auth)");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ===============================
//        MOUNT ROUTES
// ===============================

// Auth
app.use("/", authRoutes);

// Doctors
app.use("/doctors", doctorRoutes);

// Services (This uses your new file with Image Upload support)
app.use("/services", serviceRoutes);

// PDF Editor
app.use("/pdf", pdfRoutes);

// Clinic
app.use("/api", clinicRoutes);

// Receptionists
app.use("/api/receptionists", receptionistRoutes);


// ===============================
//      PROFILE APIs
// ===============================

// 1) by email
app.get("/api/user/email/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await User.findOne({ email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile GET by email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2) by id
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3) update by id
app.put("/api/user/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    console.error("Profile UPDATE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK user.profileCompleted = true
app.put("/users/:id/profile-completed", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { profileCompleted: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile status" });
  }
});


// ===============================
//      PATIENT APIs
// ===============================

app.get("/patients", (req, res) => {
  PatientModel.find()
    .then((patients) => res.json(patients))
    .catch((err) => res.status(500).json(err));
});

app.get("/patients/:id", async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET patient by userId (User ID -> Patient Profile)
app.get("/patients/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    // Validate ID format before querying to prevent crashes
    if (mongoose.Types.ObjectId.isValid(userId)) {
       userId = new mongoose.Types.ObjectId(userId);
    } 
    const patient = await PatientModel.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.json(patient);
  } catch (err) {
    console.error("GET /patients/by-user/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// CREATE or UPDATE a patient profile for a given userId
app.put("/patients/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    const updateData = req.body;

    if(!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({ message: "Invalid userId" });
    }

    const patient = await PatientModel.findOneAndUpdate(
      { userId }, 
      { $set: { ...updateData, userId } }, 
      { new: true, upsert: true } 
    );
    return res.json(patient);
  } catch (err) {
    console.error("Error updating/creating patient:", err);
    return res.status(500).json({ message: "Failed to update patient profile" });
  }
});

app.post("/patients", async (req, res) => {
  try {
    const newPatient = await PatientModel.create(req.body);
    res.json({ message: "Patient added", data: newPatient });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.delete("/patients/:id", async (req, res) => {
  try {
    await PatientModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put("/patients/:id", async (req, res) => {
  try {
    const updated = await PatientModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Patient not found" });
    return res.json({ success: true, patient: updated });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.patch("/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (req.body.hasOwnProperty("isActive")) update.isActive = !!req.body.isActive;
    if (req.body.status) update.status = req.body.status;

    if (Object.keys(update).length === 0) return res.status(400).json({ message: "No updatable fields provided" });

    const updated = await PatientModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Patient not found" });
    return res.json({ success: true, patient: updated });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Import patients CSV
app.post("/patients/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          clinic: row.clinic || "",
          email: row.email || "",
          phone: row.phone || "",
          dob: row.dob || "",
          bloodGroup: row.bloodGroup || "",
          gender: row.gender || "",
          address: row.address || "",
          city: row.city || "",
          country: row.country || "",
          postalCode: row.postalCode || "",
        });
      })
      .on("end", async () => {
        try {
          await PatientModel.insertMany(results);
          fs.unlinkSync(req.file.path);
          res.json({ message: "Imported patients successfully", count: results.length });
        } catch (err) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: "Database insertion failed", error: err.message });
        }
      })
      .on("error", (err) => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "CSV parse error", error: err.message });
      });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ===============================
//    DASHBOARD STATISTICS
// ===============================
app.get("/dashboard-stats", async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const [totalPatients, totalDoctors, totalAppointments, todayAppointments] = await Promise.all([
      PatientModel.countDocuments(),
      DoctorModel.countDocuments(),
      AppointmentModel.countDocuments(),
      AppointmentModel.countDocuments({ date: todayStr }),
    ]);

    res.json({ totalPatients, totalDoctors, totalAppointments, todayAppointments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ===============================
//      DOCTOR SESSIONS
// ===============================

app.get("/doctor-sessions", async (req, res) => {
  try {
    const list = await DoctorSessionModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/doctor-sessions", async (req, res) => {
  try {
    const doc = await DoctorSessionModel.create(req.body);
    res.json({ message: "Doctor session created", data: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put("/doctor-sessions/:id", async (req, res) => {
  try {
    const updated = await DoctorSessionModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Doctor session not found" });
    res.json({ message: "Doctor session updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.delete("/doctor-sessions/:id", async (req, res) => {
  try {
    const deleted = await DoctorSessionModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Doctor session not found" });
    res.json({ message: "Doctor session deleted" });
  } catch (err) {
    console.error("Error deleting doctor session:", err);
  }
});

// Import sessions CSV
app.post("/doctor-sessions/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        const daysString = row.days || "";
        const daysArray = daysString.split(",").map(d => d.trim()).filter(d => d);
        results.push({
          doctorId: row.doctorId || "",
          doctorName: row.doctorName || "",
          clinic: row.clinic || "",
          days: daysArray,
          timeSlotMinutes: parseInt(row.timeSlotMinutes) || 30,
          morningStart: row.morningStart || "",
          morningEnd: row.morningEnd || "",
          eveningStart: row.eveningStart || "",
          eveningEnd: row.eveningEnd || "",
        });
      })
      .on("end", async () => {
        try {
          await DoctorSessionModel.insertMany(results);
          fs.unlinkSync(req.file.path);
          res.json({ message: "Imported doctor sessions successfully", count: results.length });
        } catch (err) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: "Database insertion failed", error: err.message });
        }
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===============================
//   DYNAMIC SLOT GENERATION LOGIC (FIXED)
// ===============================

// Helper: Convert "10:00 am" string to a Date object
const parseTime = (timeStr, dateStr) => {
  if (!timeStr) return null;
  const d = new Date(dateStr);
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier && modifier.toLowerCase() === 'pm') hours = parseInt(hours, 10) + 12;
  d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return d;
};

// Helper: Convert Date object back to "10:00 am" string
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', minute: '2-digit', hour12: true 
  }).toLowerCase();
};

// API: Get Real-Time Slots
app.get("/doctor-sessions/available-slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query; 
    console.log(`\n🔍 Checking Slots for Doctor: ${doctorId} on Date: ${date}`);

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // 1. Fetch Session
    const session = await DoctorSessionModel.findOne({ doctorId });
    if (!session) {
      console.log("❌ No session found for this doctor ID.");
      return res.json([]); 
    }

    // 2. Robust Day Checking
    // Parse date safely to avoid timezone shifting to previous day
    // We append T00:00:00 to force local time parsing if just YYYY-MM-DD is sent
    const inputDate = new Date(date.includes("T") ? date : date + "T00:00:00"); 
    
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = inputDate.getDay();
    const longDay = daysMap[dayIndex];       // e.g., "Tuesday"
    const shortDay = longDay.substring(0, 3); // e.g., "Tue"

    console.log(`📅 Date Calculation: ${date} is a ${longDay} (${shortDay})`);
    console.log(`👨‍⚕️ Doctor works on:`, session.days);

    // Check if doctor works today (Matches "Tuesday" OR "Tue")
    const isWorkingDay = session.days.some(d => {
      const cleanDay = d.trim();
      return cleanDay.toLowerCase() === longDay.toLowerCase() || 
             cleanDay.toLowerCase() === shortDay.toLowerCase();
    });

    if (!isWorkingDay) {
      console.log("❌ Doctor does not work on this day.");
      return res.json([]);
    }

    // 3. Generate Slots
    const allSlots = [];
    const interval = parseInt(session.timeSlotMinutes) || 30;

    const ranges = [
      { start: session.morningStart, end: session.morningEnd },
      { start: session.eveningStart, end: session.eveningEnd }
    ];

    ranges.forEach(range => {
      if (range.start && range.end && range.start !== "-" && range.end !== "-") {
        let current = parseTime(range.start, date);
        let endTime = parseTime(range.end, date);

        // Handle crossing midnight or bad parsing
        if (current && endTime && current < endTime) {
           while (current < endTime) {
            allSlots.push(formatTime(current));
            current.setMinutes(current.getMinutes() + interval);
          }
        }
      }
    });

    console.log(`✅ Generated ${allSlots.length} potential slots.`);

    // 4. Filter Booked Slots
    const bookedApps = await AppointmentModel.find({
      doctorId,
      date: date, 
      status: { $ne: "cancelled" }
    }).select("time");

    const bookedTimes = bookedApps.map(a => a.time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    console.log(`🎉 Returning ${availableSlots.length} available slots.`);
    res.json(availableSlots);

  } catch (err) {
    console.error("🔥 Slot Error:", err);
    res.status(500).json({ message: "Error generating slots" });
  }
});

// ===============================
//       APPOINTMENTS
// ===============================

// Create Appointment
app.post("/appointments", async (req, res) => {
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
      charges: req.body.charges || 0,
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "upcoming",
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

    const created = await AppointmentModel.create(payload);

    // Email Logic
    let targetEmail = payload.patientEmail;
    if (!targetEmail && payload.patientId) {
      try {
        const patientDoc = await PatientModel.findById(payload.patientId);
        if (patientDoc?.email) targetEmail = patientDoc.email;
      } catch (e) { console.log("Error fetching patient email"); }
    }

    if (targetEmail) {
      let formattedDate = payload.date;
      try { if (payload.date) formattedDate = new Date(payload.date).toLocaleDateString("en-GB"); } catch (e) {}
      
      const html = appointmentBookedTemplate({
        patientName: payload.patientName,
        doctorName: payload.doctorName,
        clinicName: payload.clinic,
        date: formattedDate,
        time: payload.time,
        services: payload.services,
      });

      sendEmail({ to: targetEmail, subject: "Your Appointment is Confirmed | OneCare", html });
    }

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// List appointments (with filters)
app.get("/appointments", async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.clinic) q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient) q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor) q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    if (req.query.patientId) {
      if (mongoose.Types.ObjectId.isValid(req.query.patientId)) {
        const p = await PatientModel.findOne({ $or: [{ _id: req.query.patientId }, { userId: req.query.patientId }] });
        q.patientId = p ? p._id : req.query.patientId;
      } else {
        q.patientId = req.query.patientId;
      }
    }

    if (req.query.doctorId && mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
      q.doctorId = req.query.doctorId;
    }

    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate({ path: "patientId", select: "firstName lastName email phone", model: "patients" })
      .populate({ path: "doctorId", select: "name clinic", model: "doctors" })
      .lean();

    const normalized = list.map(a => {
      const copy = { ...a };
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || copy.patientName;
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Other Appointment Endpoints
app.get("/appointments/all", async (req, res) => {
  try {
    const list = await AppointmentModel.find()
      .sort({ createdAt: -1 })
      .populate({ path: "patientId", select: "firstName lastName email phone", model: "patients" })
      .populate({ path: "doctorId", select: "name clinic", model: "doctors" })
      .lean();
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/appointments/today", async (req, res) => {
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const list = await AppointmentModel.find({ date: todayStr })
      .sort({ createdAt: -1 })
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "name clinic");
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Import appointments
app.post("/appointments/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
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
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

app.put("/appointments/:id", async (req, res) => {
  try {
    const updated = await AppointmentModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment updated", data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/patients/:id/latest-appointment", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await PatientModel.findById(id).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const fullName = `${patient.firstName} ${patient.lastName}`.trim();
    const appt = await AppointmentModel.findOne({
      $or: [{ patientId: id }, { patientName: fullName }]
    }).sort({ createdAt: -1 }).lean();

    if (!appt) return res.status(404).json({ message: "No appointment found" });
    res.json(appt);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Appointment PDF
app.get("/appointments/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await AppointmentModel.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    let doctor = null;
    if (appt.doctorName) {
      const parts = appt.doctorName.split(" ");
      doctor = await DoctorModel.findOne({ firstName: parts[0], lastName: parts.slice(1).join(" ") });
    }

    const clinicName = appt.clinic || doctor?.clinic || "Valley Clinic";
    const patientName = appt.patientName || "N/A";
    const apptDateFormatted = appt.date ? new Date(appt.date).toLocaleDateString("en-US") : "N/A";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    page.drawText(clinicName, { x: 50, y, size: 18, font: bold });
    y -= 30;
    page.drawText(`Patient: ${patientName}`, { x: 50, y, size: 12, font });
    y -= 20;
    page.drawText(`Date: ${apptDateFormatted}`, { x: 50, y, size: 12, font });
    y -= 20;
    page.drawText(`Doctor: ${appt.doctorName || "N/A"}`, { x: 50, y, size: 12, font });
    y -= 20;
    page.drawText(`Services: ${appt.services || "N/A"}`, { x: 50, y, size: 12, font });
    y -= 20;
    page.drawText(`Total Bill: ${appt.charges || "0"}`, { x: 50, y, size: 12, font });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ message: "PDF generation failed" });
  }
});

app.get("/appointments/:id", async (req, res) => {
  try {
    const appt = await AppointmentModel.findById(req.params.id)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "name clinic")
      .lean();
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    res.json(appt);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/appointments/:id/cancel", async (req, res) => {
  try {
    const appt = await AppointmentModel.findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/appointments/:id", async (req, res) => {
  try {
    const deleted = await AppointmentModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ===============================
//      TAX APIs
// ===============================

app.get("/taxes", async (req, res) => {
  try {
    const list = await TaxModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/taxes", async (req, res) => {
  try {
    const payload = req.body;
    if (typeof payload.taxRate === "string") payload.taxRate = parseFloat(payload.taxRate) || 0;
    const doc = await TaxModel.create(payload);
    res.json({ message: "Tax created", data: doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/taxes/:id", async (req, res) => {
  try {
    const payload = req.body;
    if (typeof payload.taxRate === "string") payload.taxRate = parseFloat(payload.taxRate) || 0;
    const updated = await TaxModel.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: "Tax not found" });
    res.json({ message: "Tax updated", data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/taxes/:id", async (req, res) => {
  try {
    const deleted = await TaxModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Tax not found" });
    res.json({ message: "Tax deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ===============================
//      BILL APIs
// ===============================

app.post("/bills", async (req, res) => {
  try {
    const bill = await BillingModel.create(req.body);
    res.json({ message: "Bill created successfully", data: bill });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

app.get("/bills", async (req, res) => {
  try {
    const bills = await BillingModel.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bills", error: err.message });
  }
});

app.get("/bills/:id", async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bill" });
  }
});

app.put("/bills/:id", async (req, res) => {
  try {
    const updated = await BillingModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Bill updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating bill" });
  }
});

app.delete("/bills/:id", async (req, res) => {
  try {
    await BillingModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting bill" });
  }
});


// Start Server
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend server running on http://localhost:" + PORT);
});