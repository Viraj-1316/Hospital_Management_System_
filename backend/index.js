// 1. Import required libraries
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Patient = require("./models/Patient");
const DoctorModel = require("./models/Doctor");
const BillingModel = require("./models/Billing");
const AppointmentModel = require("./models/Appointment");
const Service = require("./models/Service");
const ADMIN_EMAIL = "admin@onecare.com";
const ADMIN_PASSWORD = "admin123";

// to import logo
const multer = require("multer");

// PDF Libraries
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// 2. Create an Express app
const app = express();

// 3. Middlewares: to understand JSON body + allow CORS
app.use(cors()); // allow requests from frontend
app.use(express.json()); // parse JSON request body

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
app.post("/login", async (req, res) => {
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

app.post("/signup", async (req, res) => {
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
      password, // plain for now
      role: "patient", // signup is only for patients
      name,
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
    // 1) Make a string for today's date in format "YYYY-MM-DD"
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // 01-12
    const dd = String(today.getDate()).padStart(2, "0"); // 01-31
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 2) Count in MongoDB
    const [totalPatients, totalDoctors, totalAppointments, todayAppointments] =
      await Promise.all([
        PatientModel.countDocuments(), // all patients
        DoctorModel.countDocuments(), // all doctors
        AppointmentModel.countDocuments(), // all appointments
        AppointmentModel.countDocuments({ date: todayStr }), // only today's
      ]);

    // 3) Send all numbers to frontend
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
    res
      .status(500)
      .json({ message: "Error deleting doctor", error: err.message });
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

// ===============================
//         SERVICE APIs
// ===============================

// GET all services
app.get("/api/services", async (req, res) => {
  try {
    const all = await Service.find();
    console.log("GET /api/services ->", all.length, "items"); // 👈 log how many
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
    res
      .status(500)
      .json({ message: "Error deleting doctor", error: err.message });
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
    if (req.query.clinic)
      q.clinic = { $regex: req.query.clinic, $options: "i" };
    if (req.query.patient)
      q.patientName = { $regex: req.query.patient, $options: "i" };
    if (req.query.doctor)
      q.doctorName = { $regex: req.query.doctor, $options: "i" };
    if (req.query.status) q.status = req.query.status;

    // add pagination later (limit/skip) if needed
    const list = await AppointmentModel.find(q)
      .sort({ createdAt: -1 })
      .limit(500);
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

    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

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
    page.drawText(`Email: ${doctor?.email || "N/A"}`, {
      x: 130,
      y,
      size: 12,
      font,
    });
    y -= 16;
    page.drawText(`Phone: ${doctor?.phone || "N/A"}`, {
      x: 130,
      y,
      size: 12,
      font,
    });

    // ============================
    // RIGHT SIDE - BILL INFO
    // ============================
    page.drawText(`Invoice ID: ${bill._id}`, {
      x: 360,
      y: 740,
      size: 11,
      font,
    });
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
    page.drawText(`Total: Rs ${bill.totalAmount}`, {
      x: 360,
      y,
      size: 12,
      font,
    });
    y -= 20;
    page.drawText(`Discount: Rs ${bill.discount}`, {
      x: 360,
      y,
      size: 12,
      font,
    });
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bill-${bill._id}.pdf`
    );
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
  
});

// =============================
// PDF TEMPLATE SETTINGS (ONECARE)
// =============================

// For uploading image as BASE64 we must increase body limit
app.use(express.json({ limit: "10mb" }));

// Storage folder
const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// Save logo coming from BASE64
app.post("/settings/upload-logo", async (req, res) => {
  try {
    const { filename, dataUrl } = req.body;

    if (!filename || !dataUrl)
      return res.status(400).json({ message: "Missing file data" });

    const base64 = dataUrl.split(";base64,").pop();
    const filePath = path.join(assetsDir, filename);

    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

    res.json({ path: `/assets/${filename}` });
  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ message: "Failed to upload logo" });
  }
});

// Template JSON file
const TEMPLATE_FILE = path.join(assetsDir, "pdf_template.json");

function readTemplate() {
  if (!fs.existsSync(TEMPLATE_FILE)) return null;
  return JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf8"));
}

function writeTemplate(data) {
  fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(data, null, 2), "utf8");
}

// GET template
app.get("/settings/pdf-template", (req, res) => {
  const tpl = readTemplate();
  res.json(tpl || {});
});

// CREATE template
app.post("/settings/pdf-template", (req, res) => {
  const template = { ...req.body, _id: "one-template" };
  writeTemplate(template);
  res.json({ message: "Template saved", data: template });
});

// UPDATE template
app.put("/settings/pdf-template/:id", (req, res) => {
  const template = { ...req.body, _id: req.params.id };
  writeTemplate(template);
  res.json({ message: "Template updated", data: template });
});

// DOWNLOAD PDF TEMPLATE (as JSON file)
app.get("/settings/pdf-template/download", (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATE_FILE)) {
      return res.status(404).json({ message: "No template saved yet" });
    }

    res.download(TEMPLATE_FILE, "pdf-template.json");
  } catch (err) {
    console.error("Download template error:", err);
    res.status(500).json({ message: "Failed to download template" });
  }
});


// Expose static logos
app.use("/assets", express.static(assetsDir));

/* ---------------------------------------
   DOWNLOAD TEMPLATE (ADD THIS BELOW)
--------------------------------------- */
app.get("/settings/pdf-template/download", async (req, res) => {
  try {
    const template = readTemplate();
    if (!template) return res.status(404).json({ message: "No template saved" });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([600, 780]);

    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText("TEMPLATE PREVIEW", { x: 180, y: 740, size: 18, font });

    page.drawText(`Clinic: ${template.clinicName}`, { x: 40, y: 690, size: 12 });
    page.drawText(`Address: ${template.clinicAddress}`, { x: 40, y: 670, size: 12 });
    page.drawText(`Phone: ${template.clinicPhone}`, { x: 40, y: 650, size: 12 });
    page.drawText(`Email: ${template.clinicEmail}`, { x: 40, y: 630, size: 12 });

    if (template.footerMessage) {
      page.drawText("Footer:", { x: 40, y: 580, size: 12 });
      page.drawText(template.footerMessage, { x: 40, y: 560, size: 12 });
    }

    const pdfBytes = await pdf.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=template-preview.pdf");
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Download failed" });
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
