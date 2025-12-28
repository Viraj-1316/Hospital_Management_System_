const twilio = require("twilio");
const logger = require("./logger");

let client = null;

/**
 * Send a WhatsApp message
 * @param {string} to - The recipient's phone number 
 * @param {string} body - The message text
 */
const sendWhatsAppMessage = async (to, body) => {

  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        client = twilio(accountSid, authToken);
        logger.debug("Twilio client initialized", { sid: accountSid.substring(0, 6) + "..." });
      } catch (err) {
        logger.error("Failed to initialize Twilio client", { error: err.message });
      }
    } else {
      logger.warn("Twilio credentials missing in environment variables");
    }
  }

  if (!client) {
    logger.warn("Twilio client not initialized, skipping WhatsApp message");
    return;
  }

  if (!to) {
    logger.warn("No recipient number provided for WhatsApp message");
    return;
  }

  let formattedTo = to.trim();

  const digitsOnly = formattedTo.replace(/\D/g, '');
  if (digitsOnly.length === 10 && !formattedTo.includes('+')) {
    formattedTo = `+91${formattedTo}`;
    logger.debug("Added country code to number", { original: to, formatted: formattedTo });
  } else if (!formattedTo.includes('+')) {
    formattedTo = `+${formattedTo}`;
  }

  if (!formattedTo.startsWith("whatsapp:")) {
    formattedTo = `whatsapp:${formattedTo}`;
  }

  let formattedFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  if (formattedFrom && !formattedFrom.startsWith("whatsapp:")) {
    formattedFrom = `whatsapp:${formattedFrom}`;
  }

  if (!formattedFrom) {
    logger.warn("TWILIO_WHATSAPP_NUMBER not set in environment");
    return;
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: formattedFrom,
      to: formattedTo,
    });
    logger.info("WhatsApp message sent", { to, sid: message.sid });
    return message;
  } catch (error) {
    logger.error("Failed to send WhatsApp message", { to, error: error.message });
  }
};

module.exports = { sendWhatsAppMessage };
