const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage, sendSmsMessage } = require("../utils/whatsappService");

// POST /api/sms/test-whatsapp
router.post("/test-whatsapp", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: "Phone number and message are required." });
  }

  try {
    const result = await sendWhatsAppMessage(to, message);
    if (result) {
      res.status(200).json({ message: "Test WhatsApp sent successfully.", data: result });
    } else {
      res.status(500).json({ message: "Failed to send WhatsApp - check server logs for details." });
    }
  } catch (error) {
    console.error("Error sending test WhatsApp:", error);
    res.status(500).json({ message: "Failed to send test WhatsApp.", error: error.message });
  }
});

// POST /api/sms/test-sms
router.post("/test-sms", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: "Phone number and message are required." });
  }

  try {
    await sendSmsMessage(to, message);
    res.status(200).json({ message: "Test SMS sent successfully." });
  } catch (error) {
    console.error("Error sending test SMS:", error);
    res.status(500).json({ message: "Failed to send test SMS." });
  }
});

module.exports = router;
