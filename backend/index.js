

// 1. Import required libraries
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Patient = require('./models/Patient');
const DoctorModel = require("./models/Doctor");
const BillingModel = require("./models/Billing");
const AppointmentModel = require("./models/Appointment");
const Service = require("./models/Service");
const ADMIN_EMAIL = "admin@onecare.com";
const ADMIN_PASSWORD = "admin123";

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
app.use(express.json());    

// connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/hospital_auth")
  .then(() => {
    console.log("✅ Connected to MongoDB (hospital_auth)");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });


// ===============================
//             LOGIN
// ===============================

// 5. Login route (POST /login)
app.post("/login", async(req, res) => {
  try {
    // req.body will look like: { email: "...", password: "..." }
    const { email, password } = req.body;

     // 0) Check if this is admin login (hardcoded)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.json({
        id: "admin-id",
        name: "System Admin",
        email: ADMIN_EMAIL,
        role: "admin",
      });
    }
    
    // find user with this email
    const user = await User.findOne({ email });


    // if user not found OR password doesn't match -> error
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // success: send back user info (without password)
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ===============================
//             SIGNUP
// ===============================

app.post("/signup", async(req, res) => {
  try {
    // 1. Get data sent from frontend
    const { name, email, password } = req.body;
    // 2. Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // // 3. Check if email already exists in users array
    // const existingUser = users.find((u) => u.email === email);

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3) create new user as PATIENT
    const newUser = await User.create({
      email,
      password,          // plain for now
      role: "patient",   // signup is only for patients
      name
    });

    // 5. Send back success (without password)
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ===============================
//         PATIENT APIs
// ===============================

const PatientModel = require("./models/Patient");

// Add Patient
app.post("/patients", async (req, res) => {
  try {
    const patient = await PatientModel.create(req.body);
    res.json({ message: "Patient added", data: patient });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Patients
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


// ===============================
//     DASHBOARD STATISTICS
// ===============================

app.get("/dashboard-stats", async (req, res) => {
  try {
    const [totalPatients , totalDoctors] = await Promise.all([
      PatientModel.countDocuments(),
      DoctorModel.countDocuments()
    ]);

    res.json({totalDoctors , totalPatients});
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ===============================
//         DOCTOR APIs
// ===============================

app.post("/doctors", async (req, res) => {
  try {
    const doctor = await DoctorModel.create(req.body);
    res.json({ message: "Doctor added", data: doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/doctors", async (req, res) => {
  try {
    const doctors = await DoctorModel.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.delete("/doctors/:id", async (req, res) => {
  try {
    await DoctorModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting doctor", error: err.message });
  }
});

//doctor Csv Import

app.post("/doctors/import", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 /doctors/import hit");

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // CSV headers:
        // firstName,lastName,clinic,email,phone,dob,specialization,gender,status
        results.push({
          firstName: row.firstName,
          lastName: row.lastName,
          clinic: row.clinic,
          email: row.email,
          phone: row.phone,
          dob: row.dob, // string is fine, your schema will cast to Date if needed
          specialization: row.specialization,
          gender: row.gender,
          status: row.status || "Active",
        });
      })
      .on("end", async () => {
        try {
          console.log("Parsed doctors from CSV:", results.length);
          if (results.length > 0) {
            await DoctorModel.insertMany(results);
          }

          // delete temp file
          fs.unlinkSync(req.file.path);

          res.json({
            message: "Imported doctors",
            count: results.length,
          });
        } catch (err) {
          console.error("❌ Doctor import save error:", err);
          res.status(500).json({
            message: "Error saving doctors",
            error: err.message,
          });
        }
      })
      .on("error", (err) => {
        console.error("❌ CSV parse error (doctors):", err);
        res.status(500).json({ message: "CSV parse error" });
      });
  } catch (err) {
    console.error("❌ Doctor import error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



// ===============================
//          APPOINTMENTS
// ===============================

// Create appointment
app.post("/appointments", async (req, res) => {
  try {
    const doc = await AppointmentModel.create(req.body);
    res.json({ message: "Appointment created", data: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get appointments
app.get("/appointments", async (req, res) => {
  try {
    const list = await AppointmentModel.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

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
    const totalBill = appt.charges ? `₹${appt.charges}/-` : "Not available";

    // =========================================
    //        CREATE A4 PORTRAIT PDF
    // =========================================
    const pdfDoc = await PDFDocument.create();

    const pageWidth = 595;  // A4 portrait
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
    console.log("POST /api/services body:", req.body);   // 👈 log incoming data
    const data = new Service(req.body);
    const saved = await data.save();
    console.log("Saved service:", saved);                // 👈 log saved doc
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

//  Get All Doctors
app.get("/doctors", async (req, res) => {
  try {
    const doctors = await DoctorModel.find();
    res.json(doctors);
  } catch (err) {
    console.error(" Error fetching doctors:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//  Delete Doctor
app.delete("/doctors/:id", async (req, res) => {
  try {
    await DoctorModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting doctor", error: err.message });
  }
});

// -------------------------Appointment----------------

// create appointment
app.post("/appointments", async (req, res) => {
  try {
    const doc = await AppointmentModel.create(req.body);
    res.json({ message: "Appointment created", data: doc });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// list appointments with optional filters (query params)
app.get("/appointments", async (req, res) => {
  try {
    const q = {};
    // simple filtering - treat date as YYYY-MM-DD string
    if (req.query.date) q.date = req.query.date;
    if (req.query.clinic) q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient) q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor) q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    // add pagination later (limit/skip) if needed
    const list = await AppointmentModel.find(q).sort({ createdAt: -1 }).limit(500);
    res.json(list);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE appointment
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

// Cancel appointment 
app.put("/appointments/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await AppointmentModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    res.json({ message: "Appointment cancelled", data: appt });
  } catch (err) {
    console.error("Cancel error", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===================================================
//                      BILL APIs
// ===================================================

// Create Bill
app.post("/bills", async (req, res) => {
  try {
    const saved = await BillingModel.create(req.body);
    res.json({ message: "Bill created", data: saved });
  } catch (err) {
    res.status(500).json({ message: "Bill error" });
  }
});

// Get All Bills
app.get("/bills", async (req, res) => {
  try {
    const bills = await BillingModel.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bills" });
  }
});

// Get One Bill
app.get("/bills/:id", async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bill" });
  }
});

// Update Bill
app.put("/bills/:id", async (req, res) => {
  try {
    const updated = await BillingModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Bill update error" });
  }
});

// Delete Bill
app.delete("/bills/:id", async (req, res) => {
  try {
    await BillingModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
});


// =======================================================
//                     PDF ROUTE 
// =======================================================

app.get("/bills/:id/pdf", async (req, res) => {
  try {
    const bill = await BillingModel.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    // ============================
    //   FIXED DOCTOR LOOKUP
    // ============================
    let doctor = null;

    if (bill.doctorName) {
      const [first, last] = bill.doctorName.split(" ");

      doctor = await DoctorModel.findOne({
        firstName: first,
        lastName: last,
      });
    }

    // ============================
    // CREATE PDF
    // ============================
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([600, 780]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 740;

    // ============================
    //   CLINIC LOGO
    // ============================
    const logoPath = path.join(__dirname, "assets", "logo.png");
    if (fs.existsSync(logoPath)) {
      const bytes = fs.readFileSync(logoPath);
      const img = await pdf.embedPng(bytes);
      page.drawImage(img, {
        x: 40,
        y: 700,
        width: 70,
        height: 70,
      });
    }

    // ============================
    //   CLINIC NAME
    // ============================
    page.drawText(doctor?.clinic || "Clinic Not Set", {
      x: 130,
      y: 740,
      size: 22,
      font: bold,
      color: rgb(0, 0.3, 0.8),
    });

    // ============================
    // CLINIC EMAIL + PHONE
    // ============================
    y -= 20;
    page.drawText(`Email: ${doctor?.email || "N/A"}`, { x: 130, y, size: 12, font });
    y -= 16;
    page.drawText(`Phone: ${doctor?.phone || "N/A"}`, { x: 130, y, size: 12, font });

    // ============================
    // RIGHT SIDE - BILL INFO
    // ============================
    page.drawText(`Invoice ID: ${bill._id}`, { x: 360, y: 740, size: 11, font });
    page.drawText(`Status: ${bill.status}`, { x: 360, y: 722, size: 11, font });
    page.drawText(`Date: ${bill.date}`, { x: 360, y: 705, size: 11, font });

    // ============================
    //   PATIENT SECTION
    // ============================
    y -= 80;
    page.drawText("Patient Details", {
      x: 40,
      y,
      font: bold,
      size: 14,
      color: rgb(0, 0.2, 0.6),
    });

    y -= 22;
    page.drawText(`Name: ${bill.patientName}`, {
      x: 40,
      y,
      size: 12,
      font,
    });

    // ============================
    //   SERVICE TABLE HEADER
    // ============================
    y -= 40;
    page.drawText("Amount Due", { x: 40, y, size: 16, font: bold });

    y -= 35;
    page.drawText("SR", { x: 40, y, size: 12, font: bold });
    page.drawText("SERVICE NAME", { x: 80, y, size: 12, font: bold });
    page.drawText("PRICE", { x: 280, y, size: 12, font: bold });
    page.drawText("QTY", { x: 360, y, size: 12, font: bold });
    page.drawText("TOTAL", { x: 420, y, size: 12, font: bold });

    y -= 10;
    page.drawLine({
      start: { x: 40, y },
      end: { x: 550, y },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // ============================
    //   SERVICE ITEMS
    // ============================
    y -= 22;

    (bill.services || []).forEach((service, i) => {
      page.drawText(String(i + 1), { x: 40, y, size: 11, font });
      page.drawText(service, { x: 80, y, size: 11, font });

      // Assuming price of each service = (totalAmount / services count)
      const price = (bill.totalAmount / bill.services.length).toFixed(2);

      page.drawText(`Rs ${price}`, { x: 280, y, size: 11, font });
      page.drawText("1", { x: 360, y, size: 11, font });
      page.drawText(`Rs ${price}`, { x: 420, y, size: 11, font });

      y -= 18;
    });

    // ============================
    //   TOTAL SECTION
    // ============================
    y -= 40;
    page.drawText(`Total: Rs ${bill.totalAmount}`, { x: 360, y, size: 12, font });
    y -= 20;
    page.drawText(`Discount: Rs ${bill.discount}`, { x: 360, y, size: 12, font });
    y -= 25;
    page.drawText(`Amount Due: Rs ${bill.amountDue}`, {
      x: 360,
      y,
      size: 14,
      font: bold,
      color: rgb(0.05, 0.45, 0.05),
    });

    // ============================
    //   NOTES
    // ============================
    if (bill.notes?.trim()) {
      y -= 40;
      page.drawText("Notes:", { x: 40, y, size: 12, font: bold });
      y -= 20;
      page.drawText(bill.notes, { x: 40, y, size: 11, font });
    }

    // ============================
    //   QR CODE
    // ============================
    const qrData = `Invoice: ${bill._id}\nAmount Due: Rs ${bill.amountDue}`;
    const qrURL = await QRCode.toDataURL(qrData);
    const qrBytes = Buffer.from(qrURL.split(",")[1], "base64");
    const qrImg = await pdf.embedPng(qrBytes);

    page.drawImage(qrImg, {
      x: 40,
      y: 50,
      width: 90,
      height: 90,
    });

    // ============================
    //   FOOTER
    // ============================
    page.drawText("Thank you for choosing our clinic.", {
      x: 180,
      y: 60,
      size: 10,
      font,
    });
    page.drawText("This is a computer-generated invoice.", {
      x: 170,
      y: 45,
      size: 9,
      font,
    });

    // SEND FINAL PDF
    const pdfBytes = await pdf.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bill-${bill._id}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});



// ===================================================
//                   START SERVER
// ===================================================

// 6. Start the server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend server running on http://localhost:" + PORT);
});
