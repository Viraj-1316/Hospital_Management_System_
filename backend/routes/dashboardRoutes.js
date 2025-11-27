const express = require("express");
const router = express.Router();
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const AppointmentModel = require("../models/Appointment");

router.get("/", async (req, res) => {
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

module.exports = router;
