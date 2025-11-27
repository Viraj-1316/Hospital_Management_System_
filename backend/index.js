const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const receptionistRoutes = require("./routes/receptionistRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorSessionRoutes = require("./routes/doctorSessionRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const taxRoutes = require("./routes/taxRoutes");
const billingRoutes = require("./routes/billingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const encounterRoutes = require("./routes/encounterRoutes");
const encounterTemplateRoutes = require("./routes/encounterTemplateRoutes");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", authRoutes);
app.use("/doctors", doctorRoutes); 
app.use("/pdf", pdfRoutes);
app.use("/api", clinicRoutes); 
app.use("/api/receptionists", receptionistRoutes);

// New Refactored Routes
app.use("/patients", patientRoutes);
app.use("/doctor-sessions", doctorSessionRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/taxes", taxRoutes);
app.use("/bills", billingRoutes);
app.use("/dashboard-stats", dashboardRoutes);
app.use("/", userRoutes); 
app.use("/encounters", encounterRoutes);
app.use("/encounter-templates", encounterTemplateRoutes);


// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend server running on http://localhost:" + PORT);
});