const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PatientModel = require("../models/Patient");
const DoctorModel = require("../models/Doctor");
const AppointmentModel = require("../models/Appointment");
const BillingModel = require("../models/Billing");

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
      // Convert to ObjectId for aggregation pipeline compatibility
      if (typeof safeClinicId === 'string') {
        query.clinicId = new mongoose.Types.ObjectId(safeClinicId);
      } else {
        query.clinicId = safeClinicId;
      }
    } else {
      // Fallback: Return 0s
      return res.json({
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        totalServices: 0,
        totalRevenue: 0,
        cashRevenue: 0,
        onlineRevenue: 0,
      });
    }

    // 2) Count data in parallel
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalServices,
      revenueStats,
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
      // Aggregate revenue from billing
      BillingModel.aggregate([
        { 
          $match: { 
            ...query,
            status: { $in: ["paid", "partial"] } 
          } 
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$paidAmount" },
            cashRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$paidAmount", 0]
              }
            },
            onlineRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentMethod", "Online"] }, "$paidAmount", 0]
              }
            }
          }
        }
      ]),
    ]);

    // Extract revenue values from aggregation result
    const revenue = revenueStats[0] || { totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0 };

    // 3) Send response only once
    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalServices,
      totalRevenue: revenue.totalRevenue || 0,
      cashRevenue: revenue.cashRevenue || 0,
      onlineRevenue: revenue.onlineRevenue || 0,
    });
  } catch (err) {
    console.error("dashboard-stats error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
