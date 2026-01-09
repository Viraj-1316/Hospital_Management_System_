const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const ProSetting = require("../models/ProSetting");
const BillingModel = require("../models/Billing");
const { verifyToken } = require("../middleware/auth");
const logger = require("../utils/logger");

// Helper: Get or create ProSetting document
const getSettings = async () => {
  let settings = await ProSetting.findOne();
  if (!settings) {
    settings = await ProSetting.create({});
  }
  return settings;
};

// Helper: Initialize Razorpay instance
const getRazorpayInstance = async () => {
  const settings = await getSettings();
  
  if (!settings.razorpayEnabled || !settings.razorpayKeyId || !settings.razorpayKeySecret) {
    return null;
  }
  
  return new Razorpay({
    key_id: settings.razorpayKeyId,
    key_secret: settings.razorpayKeySecret
  });
};

// --- GET Razorpay Settings (Public Key Only) ---
router.get("/settings", verifyToken, async (req, res) => {
  try {
    const settings = await getSettings();
    
    res.json({
      razorpayEnabled: settings.razorpayEnabled,
      razorpayKeyId: settings.razorpayKeyId, // Public key is safe to expose
      razorpayCurrency: settings.razorpayCurrency
    });
  } catch (err) {
    logger.error("Error fetching Razorpay settings", { error: err.message });
    res.status(500).json({ message: "Error fetching settings", error: err.message });
  }
});

// --- GET Razorpay Settings (Full - Admin Only) ---
router.get("/settings/full", verifyToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const settings = await getSettings();
    
    res.json({
      razorpayEnabled: settings.razorpayEnabled,
      razorpayKeyId: settings.razorpayKeyId,
      razorpayKeySecret: settings.razorpayKeySecret,
      razorpayCurrency: settings.razorpayCurrency
    });
  } catch (err) {
    logger.error("Error fetching Razorpay settings", { error: err.message });
    res.status(500).json({ message: "Error fetching settings", error: err.message });
  }
});

// --- SAVE Razorpay Settings (Admin Only) ---
router.post("/settings", verifyToken, async (req, res) => {
  try {
    // Check if user is admin or super admin
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const { razorpayEnabled, razorpayKeyId, razorpayKeySecret, razorpayCurrency } = req.body;
    
    let settings = await getSettings();
    
    // Update fields
    if (razorpayEnabled !== undefined) settings.razorpayEnabled = razorpayEnabled;
    if (razorpayKeyId !== undefined) settings.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret !== undefined) settings.razorpayKeySecret = razorpayKeySecret;
    if (razorpayCurrency !== undefined) settings.razorpayCurrency = razorpayCurrency;
    
    await settings.save();
    
    logger.info("Razorpay settings updated", { by: req.user.email });
    res.json({ message: "Razorpay settings saved successfully" });
  } catch (err) {
    logger.error("Error saving Razorpay settings", { error: err.message });
    res.status(500).json({ message: "Error saving settings", error: err.message });
  }
});

// --- CREATE ORDER ---
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { billId } = req.body;
    
    if (!billId) {
      return res.status(400).json({ message: "Bill ID is required" });
    }
    
    // Get bill details
    const bill = await BillingModel.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // Check if bill is already paid
    if (bill.status === "paid") {
      return res.status(400).json({ message: "Bill is already paid" });
    }
    
    // Get Razorpay instance
    const razorpay = await getRazorpayInstance();
    if (!razorpay) {
      return res.status(400).json({ message: "Razorpay is not configured or disabled" });
    }
    
    const settings = await getSettings();
    
    // Amount in smallest currency unit (paise for INR)
    const amountToPay = bill.amountDue > 0 ? bill.amountDue : bill.totalAmount;
    const amountInSmallestUnit = Math.round(amountToPay * 100);
    
    // Razorpay minimum amount is 100 paise (₹1)
    if (amountInSmallestUnit < 100) {
      return res.status(400).json({ 
        message: "Minimum payment amount is ₹1",
        amount: amountToPay
      });
    }
    
    logger.info("Creating Razorpay order", { 
      billId, 
      amount: amountInSmallestUnit,
      currency: settings.razorpayCurrency || "INR",
      keyId: settings.razorpayKeyId ? settings.razorpayKeyId.substring(0, 10) + "..." : "NOT SET"
    });
    
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: settings.razorpayCurrency || "INR",
      receipt: `bill_${bill.billNumber}`.substring(0, 40), // Razorpay receipt max 40 chars
      notes: {
        billId: billId,
        billNumber: bill.billNumber,
        patientName: (bill.patientName || "").substring(0, 50) // Limit notes length
      }
    });
    
    // Save order ID to bill
    bill.razorpayOrderId = order.id;
    await bill.save();
    
    logger.info("Razorpay order created successfully", { orderId: order.id, billId });
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      billNumber: bill.billNumber,
      patientName: bill.patientName
    });
  } catch (err) {
    // Log the full error for debugging
    logger.error("Error creating Razorpay order", { 
      error: err.message,
      statusCode: err.statusCode,
      errorDescription: err.error?.description,
      errorCode: err.error?.code,
      fullError: JSON.stringify(err)
    });
    
    // Return more helpful error message
    const errorMsg = err.error?.description || err.message || "Error creating order";
    res.status(err.statusCode || 500).json({ 
      message: errorMsg,
      error: err.message 
    });
  }
});

// --- VERIFY PAYMENT ---
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { billId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!billId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment details" });
    }
    
    // Get settings for secret key
    const settings = await getSettings();
    if (!settings.razorpayKeySecret) {
      return res.status(400).json({ message: "Razorpay secret not configured" });
    }
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", settings.razorpayKeySecret)
      .update(body.toString())
      .digest("hex");
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      logger.warn("Payment signature verification failed", { billId, razorpay_order_id });
      return res.status(400).json({ message: "Payment verification failed" });
    }
    
    // Update bill status
    const bill = await BillingModel.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // Update payment details
    bill.razorpayPaymentId = razorpay_payment_id;
    bill.paidAmount = bill.totalAmount;
    bill.amountDue = 0;
    bill.status = "paid";
    await bill.save();
    
    logger.info("Payment verified and bill updated", { 
      billId, 
      razorpay_payment_id,
      amount: bill.totalAmount 
    });
    
    res.json({ 
      message: "Payment verified successfully",
      billNumber: bill.billNumber,
      status: "paid"
    });
  } catch (err) {
    logger.error("Error verifying payment", { error: err.message });
    res.status(500).json({ message: "Error verifying payment", error: err.message });
  }
});

module.exports = router;
