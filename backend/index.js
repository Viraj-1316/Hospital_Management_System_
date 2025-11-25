// 1. Import required libraries
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Added bcrypt
const User = require("./models/User");
const PatientModel = require("./models/Patient");
const DoctorModel = require("./models/Doctor");
const BillingModel = require("./models/Billing");
const AppointmentModel = require("./models/Appointment");
const Service = require("./models/Service");
const DoctorSessionModel = require("./models/DoctorSession");
const TaxModel = require("./models/Tax");

require("dotenv").config();

const { sendEmail } = require("./utils/emailService");
const { appointmentBookedTemplate } = require("./utils/emailTemplates");

//Authentication Routes
const authRoutes = require("./routes/auth");


//Receptionist Routes
const receptionistRoutes = require("./routes/receptionistRoutes");
const doctorRoutes = require("./routes/doctorRoutes");


// PDF Libraries
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// Csv Import Libraries
const multer = require("multer");
const csv = require("csv-parser");
const upload = multer({ dest: path.join(__dirname, "uploads") });

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Authentication routes
app.use("/", authRoutes);
app.use("/doctors", doctorRoutes);

// PDF Editor section
const pdfRoutes = require("./routes/pdfRoutes");
app.use("/pdf", pdfRoutes);

// connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/hospital_auth")
  .then(() => {
    console.log("✅ Connected to MongoDB (hospital_auth)");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Profile Section

// 1) by email – this MUST come first
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

// 3) update by id (unchanged)
app.put("/api/user/:id", async (req, res) => {
  try {
    const {
      name,
      avatar,
      phone,
      gender,
      dob,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      qualification,
      specialization,
      experienceYears,
      bloodGroup,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        avatar,
        phone,
        gender,
        dob,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        qualification,
        specialization,
        experienceYears,
        bloodGroup,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile UPDATE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/patients", (req, res) => {
  PatientModel.find()
    .then((patients) => res.json(patients))
    .catch((err) => res.status(500).json(err));
});

// Delete Patient
app.delete("/patients/:id", async (req, res) => {
  try {
    await PatientModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


app.patch("/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    // Accept either boolean isActive or string status for compatibility
    if (req.body.hasOwnProperty("isActive")) {
      update.isActive = !!req.body.isActive;
    }
    if (req.body.status) {
      update.status = req.body.status;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const updated = await PatientModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Patient not found" });

    return res.json({ success: true, patient: updated });
  } catch (err) {
    console.error("PATCH /patients/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});
// ---------------------------------------------------------------------------------------------

// Clinic 

const clinicRoutes = require("./routes/clinicRoutes");

// JSON + form parsing middleware (you probably already have these)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount clinic routes
app.use("/api", clinicRoutes);

// ===============================
//     DASHBOARD STATISTICS
// ===============================
app.get("/dashboard-stats", async (req, res) => {
  try {
    // 1) Format today's date: YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 2) Count data in parallel
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
    ] = await Promise.all([
      PatientModel.countDocuments(),
      DoctorModel.countDocuments(),
      AppointmentModel.countDocuments(),
      AppointmentModel.countDocuments({ date: todayStr }),
    ]);

    // 3) Send response only once
    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
    });
  } catch (err) {
    console.error("dashboard-stats error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ===============================
 *         DOCTOR APIs
 * =============================== */

// Doctor routes are now handled in ./routes/doctorRoutes.js

// ===============================
//        DOCTOR SESSIONS
// ===============================

// Get all sessions
app.get("/doctor-sessions", async (req, res) => {
  try {
    const list = await DoctorSessionModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching doctor sessions:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create session
app.post("/doctor-sessions", async (req, res) => {
  try {
    const doc = await DoctorSessionModel.create(req.body);
    res.json({ message: "Doctor session created", data: doc });
  } catch (err) {
    console.error("Error creating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update session
app.put("/doctor-sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DoctorSessionModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session updated", data: updated });
  } catch (err) {
    console.error("Error updating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete session
app.delete("/doctor-sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DoctorSessionModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session deleted" });
  } catch (err) {
    console.error("Error deleting doctor session:", err);
  }
});

// Import doctor sessions from CSV
app.post("/doctor-sessions/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // Parse days from comma-separated string
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
          fs.unlinkSync(req.file.path); // Clean up uploaded file
          res.json({ 
            message: "Imported doctor sessions successfully", 
            count: results.length 
          });
        } catch (err) {
          console.error("Database insertion error:", err);
          fs.unlinkSync(req.file.path); // Clean up even on error
          res.status(500).json({ message: "Database insertion failed", error: err.message });
        }
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "CSV parse error", error: err.message });
      });
  } catch (err) {
    console.error("Import error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ===============================
//          APPOINTMENTS
// ===============================





// Csv File Import data 
app.post("/appointments/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

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
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE appointment
app.put("/appointments/:id", async (req, res) => {
  try {
    const updated = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment updated", data: updated });
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/patients/:id/latest-appointment", async (req, res) => {
  try {
    const { id } = req.params;

    // find patient doc
    const patient = await PatientModel.findById(id).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const fullName = `${patient.firstName} ${patient.lastName}`.trim();

    // find by either patientId or patientName
    const appt = await AppointmentModel.findOne({
      $or: [
        { patientId: id },
        { patientName: fullName }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!appt)
      return res.status(404).json({ message: "No appointment found" });

    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Appointments pdf  section

app.get("/appointments/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findById(id);
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Try to fetch doctor details from DoctorModel using doctorName
    let doctor = null;
    if (appt.doctorName) {
      const parts = appt.doctorName.split(" ");
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      doctor = await DoctorModel.findOne({
        firstName: first,
        lastName: last,
      });
    }

    // --------- Derived fields ---------
    const clinicName = appt.clinic || doctor?.clinic || "Valley Clinic";
    const clinicEmail = doctor?.email || "valley_clinic@example.com";
    const clinicPhone = doctor?.phone || "0000000000";

    const rawAddress =
      doctor?.address ||
      "Address not available\nCity, State, Country, 000000";

    const addressLines = String(rawAddress).split(/\r?\n/);
    const addressLine1 = addressLines[0] || "";
    const addressLine2 = addressLines[1] || "";

    const patientName = appt.patientName || "N/A";
    const patientEmail = "N/A"; // wire to PatientModel later if needed

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

    const apptTime = appt.slot || "N/A";
    const apptStatus = appt.status || "Booked";
    const paymentMode = appt.paymentMode || "Manual";
    const serviceText = appt.services || "N/A";
    const totalBill = appt.charges ? `Rs.${appt.charges}/-` : "Not available";

    //A4 PDF Creation

    const pdfDoc = await PDFDocument.create();

    const pageWidth = 595; // A4 portrait
    const pageHeight = 842;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    let y = pageHeight - margin; // start near top

    // ---------- Header: Logo + Clinic ----------
    const logoSize = 55;
    const logoX = margin;
    const logoY = y - logoSize + 5;

    // draw logo (optional)
    try {
      const logoPath = path.join(__dirname, "assets", "logo.png");
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
      console.warn("Logo not found or failed to load.");
    }

    const textStartX = logoX + logoSize + 10;

    // Clinic name
    page.drawText(clinicName, {
      x: textStartX,
      y,
      size: 18,
      font: bold,
      color: rgb(0, 0, 0),
    });

    // Date (top-right)
    page.drawText(`Date: ${todayFormatted}`, {
      x: pageWidth - margin - 150,
      y,
      size: 11,
      font,
    });

    // Doctor name
    y -= 18;
    page.drawText(`Dr. ${appt.doctorName || "Not specified"}`, {
      x: textStartX,
      y,
      size: 11,
      font,
    });

    // Address lines
    y -= 20;
    page.drawText(`Address: ${addressLine1}`, {
      x: textStartX,
      y,
      size: 10,
      font,
    });

    if (addressLine2) {
      y -= 14;
      page.drawText(addressLine2, {
        x: textStartX + 60, // indent slightly so it visually continues
        y,
        size: 10,
        font,
      });
    }

    // Contact + Email row (ALWAYS after address lines)
    y -= 18;
    page.drawText(`Contact No: ${clinicPhone}`, {
      x: textStartX,
      y,
      size: 10,
      font,
    });
    page.drawText(`Email: ${clinicEmail}`, {
      x: pageWidth - margin - 200,
      y,
      size: 10,
      font,
    });

    // Divider line
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

    // ---------- Appointment Detail Title ----------
    y -= 35;
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

    // ---------- Detail rows (NO overlap) ----------
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
    page.drawText(apptTime, { x: colRightX + 115, y, size: 10, font });

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

    // ---------- Send PDF ----------
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=appointment-${appt._id}.pdf`
    );
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Appointment PDF error:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

// ===============================
//         SERVICE APIs
// ===============================

// GET all services
app.get("/api/services", async (req, res) => {
  try {
    const all = await Service.find();
    res.json(all);
  } catch (err) {
    console.error("GET /api/services error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ADD service
app.post("/api/services", async (req, res) => {
  try {
    console.log("POST /api/services body:", req.body); // 👈 log incoming data
    const data = new Service(req.body);
    const saved = await data.save();
    console.log("Saved service:", saved); // 👈 log saved doc
    res.json(saved);
  } catch (err) {
    console.error("Error saving service:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE service
app.delete("/api/services/:id", async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// TOGGLE Active status
app.put("/api/services/toggle/:id", async (req, res) => {
  const service = await Service.findById(req.params.id);
  service.active = !service.active;
  await service.save();
  res.json(service);
});

// UPDATE service (very simple)
app.put("/api/services/:id", async (req, res) => {
  try {
    // find and update, return the updated document
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Docotor Related stuff here
app.post("/doctors", async (req, res) => {
  try {
    console.log(" Incoming doctor data:", req.body);
    const doctor = await DoctorModel.create(req.body);
    res.json({ message: "Doctor added", data: doctor });
  } catch (err) {
    console.error(" Error saving doctor:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all doctors
app.get("/doctors", async (req, res) => {
  try {
    const doctors = await DoctorModel.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete doctor
app.delete("/doctors/:id", async (req, res) => {
  try {
    await DoctorModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting doctor", error: err.message });
  }
});

/* ===============================
 *          APPOINTMENTS
 * =============================== */

// POST /appointments - create appointment using provided patient/doctor contact fields
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
      servicesDetail: req.body.servicesDetail || "",
      charges: req.body.charges || 0,
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "upcoming",
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
    };

    console.log("📌 New appointment payload:", payload);

    // 1️⃣ Create appointment in DB
    const created = await AppointmentModel.create(payload);

    // 2️⃣ Figure out patient email
    let targetEmail = payload.patientEmail;

    // If frontend didn’t send patientEmail, try from DB
    if (!targetEmail && payload.patientId) {
      try {
        const patientDoc = await PatientModel.findById(payload.patientId);
        if (patientDoc && patientDoc.email) {
          targetEmail = patientDoc.email;
          console.log("👤 Fetched patient email from DB:", targetEmail);
        } else {
          console.log("⚠️ Patient found but no email field.");
        }
      } catch (e) {
        console.log("⚠️ Error fetching patient for email:", e.message);
      }
    }

    if (targetEmail) {
      // Optional: format date to dd/mm/yyyy
      let formattedDate = payload.date;
      try {
        if (payload.date) {
          formattedDate = new Date(payload.date).toLocaleDateString("en-GB");
        }
      } catch (e) {
        console.log("⚠️ Date format issue, using raw date:", payload.date);
      }

      const html = appointmentBookedTemplate({
        patientName: payload.patientName,
        doctorName: payload.doctorName,
        clinicName: payload.clinic,
        date: formattedDate,
        time: payload.time,
        services: payload.services,
      });

      console.log("📧 Preparing to send appointment email to:", targetEmail);

      // 3️⃣ Fire email (non-blocking)
      sendEmail({
        to: targetEmail,
        subject: "Your Appointment is Confirmed | OneCare",
        html,
      });
    } else {
      console.log(
        "🚫 No email available for this appointment (no patientEmail and no email in DB). Skipping email."
      );
    }

    // 4️⃣ Response stays same as before
    return res.status(201).json(created);
  } catch (err) {
    console.error("Error creating appointment:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// List appointments with optional filters (returns populated patient + doctor)
app.get("/appointments", async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.clinic) q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient) q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor) q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    // Filter by patientId (supports both Patient ID and User ID)
    if (req.query.patientId) {
      if (mongoose.Types.ObjectId.isValid(req.query.patientId)) {
        const p = await PatientModel.findOne({
          $or: [{ _id: req.query.patientId }, { userId: req.query.patientId }],
        });
        if (p) {
          q.patientId = p._id;
        } else {
          q.patientId = req.query.patientId;
        }
      } else {
        q.patientId = req.query.patientId;
      }
    }

    // Filter by doctorId (supports both Doctor ID and Doctor document _id)
    if (req.query.doctorId) {
      if (mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
        q.doctorId = req.query.doctorId;
      }
    }

    // find appointments and populate patientId and doctorId
    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "patients"
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors"
      })
      .lean();

    // Normalize: if patientId populated, ensure patientName exists for old UI
    const normalized = list.map(a => {
      const copy = { ...a };
      if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || copy.patientName;
        // also copy email/phone so front end can show them
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
    console.error("appointments list error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/all
app.get("/appointments/all", async (req, res) => {
  try {
    const list = await AppointmentModel.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "patients",
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
      })
      .lean();
    res.json(list);
  } catch (err) {
    console.error("Error fetching all appointments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/today
app.get("/appointments/today", async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Assuming 'date' is stored as "YYYY-MM-DD" string based on dashboard-stats
    const list = await AppointmentModel.find({ date: todayStr })
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        select: "firstName lastName email phone",
        model: "patients",
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
      })
      .lean();
    res.json(list);
  } catch (err) {
    console.error("Error fetching today's appointments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/weekly
app.get("/appointments/weekly", async (req, res) => {
  try {
   
    const stats = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const count = await AppointmentModel.countDocuments({ date: dateStr });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      stats.push({ label: dayName, count });
    }
    
    res.json(stats);
  } catch (err) {
    console.error("Error fetching weekly stats:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /appointments/monthly
app.get("/appointments/monthly", async (req, res) => {
  try {
    
    const stats = [];
    const today = new Date();
    
    
    for (let i = 3; i >= 0; i--) {
       
        const start = new Date(today);
        start.setDate(today.getDate() - (i * 7) - 6);
        const end = new Date(today);
        end.setDate(today.getDate() - (i * 7));
        
        let count = 0;
        for (let j=0; j<7; j++) {
            const d = new Date(start);
            d.setDate(start.getDate() + j);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;
            count += await AppointmentModel.countDocuments({ date: dateStr });
        }
        
        stats.push({ label: `Week ${4-i}`, count });
    }

    res.json(stats);
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get appointment by ID (populate patient and doctor, return normalized patient info)
app.get("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findById(id)
      .populate({
        path: "patientId",                // matches your schema ref
        select: "firstName lastName email phone",
        model: "patients",                // explicit model name (optional)
      })
      .populate({
        path: "doctorId",
        select: "name clinic",
        model: "doctors",
      })
      .lean();

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Build normalized patient info with fallbacks
    let patientInfo = { name: "N/A", email: "N/A", phone: "N/A" };

    if (appt.patientId && typeof appt.patientId === "object") {
      // populated patient doc
      const p = appt.patientId;
      const nameParts = [];
      if (p.firstName) nameParts.push(p.firstName);
      if (p.lastName) nameParts.push(p.lastName);
      patientInfo.name = nameParts.join(" ") || p.name || "N/A";
      patientInfo.email = p.email || "N/A";
      patientInfo.phone = p.phone || "N/A";
    } else if (appt.patientName) {
      // fallback to stored patientName field on appointment
      patientInfo.name = appt.patientName || "N/A";
      // if you have patientEmail/patientPhone fields on appointment use them
      patientInfo.email = appt.patientEmail || appt.patientEmail || "N/A";
      patientInfo.phone = appt.patientPhone || "N/A";
    }

    // Attach a clear field for frontend convenience
    appt._patientInfo = patientInfo;

    // Also attach doctor nice info
    let doctorInfo = { name: "N/A", clinic: "N/A" };
    if (appt.doctorId && typeof appt.doctorId === "object") {
      doctorInfo.name = appt.doctorId.name || "N/A";
      doctorInfo.clinic = appt.doctorId.clinic || appt.clinic || "N/A";
    } else if (appt.doctorName) {
      doctorInfo.name = appt.doctorName;
      doctorInfo.clinic = appt.clinic || "N/A";
    }
    appt._doctorInfo = doctorInfo;

    return res.json(appt);
  } catch (err) {
    console.error("Error fetching appointment by id:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Cancel appointment (status: cancelled)
app.put("/appointments/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) {
    console.error("Cancel error", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete appointment
app.delete("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AppointmentModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Error deleting appointment:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ===============================
 *         SERVICE APIs
 * =============================== */

// GET all services
app.get("/api/services", async (req, res) => {
  try {
    const all = await Service.find();
    console.log("GET /api/services ->", all.length, "items");
    res.json(all);
  } catch (err) {
    console.error("GET /api/services error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//Tax realted stuff

// Get all taxes
app.get("/taxes", async (req, res) => {
  try {
    const list = await TaxModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching taxes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create new tax
app.post("/taxes", async (req, res) => {
  try {
    const payload = req.body;

    // ensure number
    if (typeof payload.taxRate === "string") {
      payload.taxRate = parseFloat(payload.taxRate) || 0;
    }

    const doc = await TaxModel.create(payload);
    res.json({ message: "Tax created", data: doc });
  } catch (err) {
    console.error("Error creating tax:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update tax (edit or toggle)
app.put("/taxes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (typeof payload.taxRate === "string") {
      payload.taxRate = parseFloat(payload.taxRate) || 0;
    }

    const updated = await TaxModel.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Tax not found" });
    }

    res.json({ message: "Tax updated", data: updated });
  } catch (err) {
    console.error("Error updating tax:", err);
    res.status(500).json({ message: "Error updating tax", error: err.message });
  }
});

// Delete tax
app.delete("/taxes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TaxModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.json({ message: "Tax deleted" });
  } catch (err) {
    console.error("Error deleting tax:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===================================================
//                      BILL APIs
// ===================================================

// Create Bill
app.post("/bills", async (req, res) => {
  try {
    console.log("POST /api/services body:", req.body);
    const data = new Service(req.body);
    const saved = await data.save();
    console.log("Saved service:", saved);
    res.json(saved);
  } catch (err) {
    console.error("Error saving service:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE service
app.delete("/api/services/:id", async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// TOGGLE active status
app.put("/api/services/toggle/:id", async (req, res) => {
  const service = await Service.findById(req.params.id);
  service.active = !service.active;
  await service.save();
  res.json(service);
});

// UPDATE service
app.put("/api/services/:id", async (req, res) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ===============================
 *         BILL APIs
 * =============================== */

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
    res
      .status(500)
      .json({ message: "Error fetching bills", error: err.message });
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

app.delete("/bills/:id", async (req, res) => {
  try {
    await BillingModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting bill" });
  }
});

// CREATE or UPDATE a patient profile for a given userId
app.put("/patients/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    const updateData = req.body;

    // convert string to Mongo ObjectId (matches your Patient schema)
    try {
      userId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const patient = await PatientModel.findOneAndUpdate(
      { userId }, // find by userId (ObjectId)
      { $set: { ...updateData, userId } }, // update fields + ensure userId set
      { new: true, upsert: true } // create if not found
    );
    return res.json(patient);
  } catch (err) {
    console.error("Error updating/creating patient:", err);
    return res
      .status(500)
      .json({ message: "Failed to update patient profile" });
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update profile status" });
  }
});

// new appointment 
// GET patient by userId (returns patient doc if exists)
app.get("/patients/by-user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;
    try { userId = new mongoose.Types.ObjectId(userId); } catch (e) { /* keep string if invalid */ }
    const patient = await PatientModel.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.json(patient);
  } catch (err) {
    console.error("GET /patients/by-user/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Receptionist 

app.use("/api/receptionists", receptionistRoutes);


// Start the server 
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend server running on http://localhost:" + PORT);
});
