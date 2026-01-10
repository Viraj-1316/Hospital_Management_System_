const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BillingModel = require("../models/Billing");
const { verifyToken } = require("../middleware/auth");
const logger = require("../utils/logger");

// Helper to get clinic scope for query
const getClinicQuery = async (req) => {
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

  // Admin sees all, others see only their clinic
  // Ensure clinicId is properly converted to ObjectId for aggregation pipeline
  if (effectiveRole !== 'admin' && safeClinicId) {
    // Convert to ObjectId if it's a string
    if (typeof safeClinicId === 'string') {
      query.clinicId = new mongoose.Types.ObjectId(safeClinicId);
    } else {
      query.clinicId = safeClinicId;
    }
  }

  return { query, effectiveRole, safeClinicId };
};

// --- GET ALL TRANSACTIONS ---
// Supports filtering by: paymentMethod, status, startDate, endDate, search
router.get("/", verifyToken, async (req, res) => {
  try {
    const { paymentMethod, status, startDate, endDate, search } = req.query;
    const { query, effectiveRole, safeClinicId } = await getClinicQuery(req);

    // Only get paid/partial bills (actual transactions)
    query.status = { $in: ["paid", "partial"] };

    // Filter by payment method
    if (paymentMethod && paymentMethod !== "all") {
      query.paymentMethod = paymentMethod; // "Cash" or "Online"
    }

    // Filter by specific status
    if (status && status !== "all") {
      query.status = status;
    }

    // Date range filter
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: end };
    }

    // Search by bill number or patient name
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { patientName: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } }
      ];
    }

    const transactions = await BillingModel.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate({ path: "patientId", select: "firstName lastName", model: "Patient" })
      .populate({ path: "clinicId", select: "name", model: "Clinic" })
      .lean();

    // Normalize response
    const normalized = transactions.map(tx => {
      const copy = { ...tx };
      if (copy.patientId && typeof copy.patientId === "object") {
        copy.patientName = copy.patientName || 
          `${copy.patientId.firstName || ""} ${copy.patientId.lastName || ""}`.trim();
      }
      if (copy.clinicId && typeof copy.clinicId === "object") {
        copy.clinicName = copy.clinicName || copy.clinicId.name || "";
      }
      return copy;
    });

    res.json(normalized);
  } catch (err) {
    logger.error("Error fetching transactions", { error: err.message });
    res.status(500).json({ message: "Error fetching transactions", error: err.message });
  }
});

// --- GET TRANSACTION SUMMARY ---
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { query } = await getClinicQuery(req);

    // Only count paid/partial bills
    query.status = { $in: ["paid", "partial"] };

    // Date range filter
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: end };
    }

    const summary = await BillingModel.aggregate([
      { $match: query },
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
          },
          transactionCount: { $sum: 1 },
          cashCount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "Cash"] }, 1, 0]
            }
          },
          onlineCount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "Online"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalRevenue: 0,
      cashRevenue: 0,
      onlineRevenue: 0,
      transactionCount: 0,
      cashCount: 0,
      onlineCount: 0
    };

    // Calculate averages
    result.averageTransaction = result.transactionCount > 0 
      ? Math.round(result.totalRevenue / result.transactionCount) 
      : 0;

    res.json(result);
  } catch (err) {
    logger.error("Error fetching transaction summary", { error: err.message });
    res.status(500).json({ message: "Error fetching summary", error: err.message });
  }
});

// --- GET RAZORPAY TRANSACTIONS ONLY ---
router.get("/razorpay", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const { query } = await getClinicQuery(req);

    // Only Razorpay (Online) payments
    query.paymentMethod = "Online";
    query.status = { $in: ["paid", "partial"] };

    // Date range filter
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: end };
    }

    // Search
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { patientName: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } }
      ];
    }

    const transactions = await BillingModel.find(query)
      .select("billNumber patientName paidAmount totalAmount razorpayOrderId razorpayPaymentId onlinePaymentDate date status clinicId")
      .sort({ onlinePaymentDate: -1, date: -1 })
      .populate({ path: "patientId", select: "firstName lastName", model: "Patient" })
      .populate({ path: "clinicId", select: "name", model: "Clinic" })
      .lean();

    // Normalize response
    const normalized = transactions.map(tx => {
      const copy = { ...tx };
      if (copy.patientId && typeof copy.patientId === "object") {
        copy.patientName = copy.patientName || 
          `${copy.patientId.firstName || ""} ${copy.patientId.lastName || ""}`.trim();
      }
      if (copy.clinicId && typeof copy.clinicId === "object") {
        copy.clinicName = copy.clinicName || copy.clinicId.name || "";
      }
      return copy;
    });

    res.json(normalized);
  } catch (err) {
    logger.error("Error fetching Razorpay transactions", { error: err.message });
    res.status(500).json({ message: "Error fetching Razorpay transactions", error: err.message });
  }
});

module.exports = router;
