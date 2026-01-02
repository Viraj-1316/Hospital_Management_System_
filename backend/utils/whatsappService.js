const logger = require("./logger");

/**
 * Send a WhatsApp message using Meta WhatsApp Cloud API
 * @param {string} to - The recipient's phone number
 * @param {string} body - The message text
 */
const sendWhatsAppMessage = async (to, body) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    logger.warn("Meta WhatsApp API credentials missing in environment variables");
    return null;
  }

  if (!to) {
    logger.warn("No recipient number provided for WhatsApp message");
    return null;
  }

  // Format phone number (remove 'whatsapp:' prefix if present, ensure country code)
  let formattedTo = to.trim().replace(/^whatsapp:/, '');
  const digitsOnly = formattedTo.replace(/\D/g, '');

  // Add India country code if 10 digits without country code
  if (digitsOnly.length === 10 && !formattedTo.includes('+')) {
    formattedTo = `91${digitsOnly}`;
  } else {
    formattedTo = digitsOnly;
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: formattedTo,
    type: "text",
    text: { body: body }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Meta WhatsApp API error", {
        to: formattedTo,
        status: response.status,
        error: data
      });
      return null;
    }

    logger.info("WhatsApp message sent via Meta API", {
      to: formattedTo,
      messageId: data.messages?.[0]?.id
    });
    return data;
  } catch (error) {
    logger.error("Failed to send WhatsApp message", {
      to: formattedTo,
      error: error.message
    });
    return null;
  }
};

module.exports = { sendWhatsAppMessage };
