const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");

const mongoSanitize = require("./middleware/mongoSanitize");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// --- DB Connection ---
const connectDB = require("./config/db");

// --- Model Registration (Ensure models are loaded) ---
require("./models/Doctor");
require("./models/Appointment");
// (Add other models here if they rely on being registered early)

console.log("🔧 Dotenv loaded. TWILIO_ACCOUNT_SID present:", !!process.env.TWILIO_ACCOUNT_SID);

// --- Route Imports ---
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
const holidayRoutes = require("./routes/holidayRoutes");
const emailRoutes = require("./routes/emailRoutes");

// ✅ NEW: Import Listing Routes
const listingRoutes = require("./routes/listingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// Import Interface for Socket.io
const { initSocket } = require("./utils/socketServer");

// Import Error Handler
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// --- Connect to Database ---
connectDB();

// --- Security Middleware ---
// Helmet: Sets various HTTP headers for security (XSS, clickjacking protection)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for uploads
}));

// Compression: Gzip responses for faster load times
app.use(compression());

// Rate Limiting: Removed as per request



// --- CORS Configuration ---
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : []; // Default to empty if not set, or handle in .env

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // In development mode with no CORS_ORIGIN set, allow all
    if (allowedOrigins.length === 0 && !isProduction) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, block unauthorized origins
      if (isProduction) {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error("CORS origin not allowed"));
      } else {
        // In development, allow but log warning
        console.warn(`CORS warning: origin ${origin} not in allowedOrigins`);
        callback(null, true);
      }
    }
  },
  credentials: true,
}));

// --- Body Parser Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Input Sanitization (Security) ---
// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// --- Static Folder for Uploads ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Health Check Endpoint ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Route Registration ---
app.use("/", authRoutes);
app.use("/doctors", doctorRoutes);
app.use("/pdf", pdfRoutes);
app.use("/api", clinicRoutes);
app.use("/api/receptionists", receptionistRoutes);

// Application Routes
app.use("/patients", patientRoutes);
app.use("/doctor-sessions", doctorSessionRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/services", serviceRoutes);
app.use("/taxes", taxRoutes);
app.use("/bills", billingRoutes);
app.use("/dashboard-stats", dashboardRoutes);
app.use("/", userRoutes);
app.use("/encounters", encounterRoutes);
app.use("/encounter-templates", encounterTemplateRoutes);
app.use("/api/email", emailRoutes);
app.use("/holidays", holidayRoutes);

// ✅ NEW: Register Listing Routes
app.use("/listings", listingRoutes);
app.use("/api/settings", settingsRoutes);

// --- 404 Handler (Must be after all routes) ---
app.use(notFoundHandler);

// --- Global Error Handler (Must be last) ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("Backend server running on port " + PORT);
  console.log(`Security: Helmet ✓ | Compression ✓ | CORS ✓ | Sanitization ✓ | WebSockets ✓`);
});
