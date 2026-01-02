const express = require("express");
const router = express.Router();
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const AppointmentModel = require("../models/Appointment");

const ServiceModel = require("../models/Service");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
  try {
    // 1) Format today's date: YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const query = {};
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === 'admin') {
      currentUser = await require("../models/Admin").findById(req.user.id);
    } else {
      currentUser = await require("../models/User").findById(req.user.id);
    }

    if (currentUser) {
      safeClinicId = currentUser.clinicId;
    } else {
      safeClinicId = req.user.clinicId || null;
    }

    const effectiveRole = currentUser ? currentUser.role : req.user.role;

    if (effectiveRole === 'admin') {
      // Global View
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      // Fallback: Return 0s
      return res.json({
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        totalServices: 0,
      });
    }

    // 2) Count data in parallel
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalServices,
    ] = await Promise.all([
      PatientModel.countDocuments(query),
      DoctorModel.countDocuments(query),
      AppointmentModel.countDocuments(query),
      AppointmentModel.countDocuments({
        ...query,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      ServiceModel.countDocuments(query),
    ]);

    // 3) Send response only once
    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalServices,
    });
  } catch (err) {
    console.error("dashboard-stats error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
