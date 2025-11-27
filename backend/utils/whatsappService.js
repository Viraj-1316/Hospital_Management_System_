const twilio = require("twilio");



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
        console.log("Twilio client initialized with SID:", accountSid.substring(0, 6) + "...");
      } catch (err) {
        console.error("Error initializing Twilio client:", err.message);
      }
    } else {
      console.warn("Twilio credentials missing in .env (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN).");
      console.log("Debug - SID:", accountSid ? "Set" : "Missing", "| Token:", authToken ? "Set" : "Missing");
    }
  }

  if (!client) {
    console.warn("Twilio client not initialized. Skipping WhatsApp message.");
    return;
  }

  if (!to) {
    console.warn("No recipient number provided for WhatsApp message.");
    return;
  }


  let formattedTo = to.trim();
  
  
  const digitsOnly = formattedTo.replace(/\D/g, '');
  if (digitsOnly.length === 10 && !formattedTo.includes('+')) {
      formattedTo = `+91${formattedTo}`;
      console.log(`Added +91 to number: ${formattedTo}`);
  } else if (!formattedTo.includes('+')) {
// If number doesn't start with '+', add it
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
     console.warn("TWILIO_WHATSAPP_NUMBER not set in .env");
     return;
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: formattedFrom,
      to: formattedTo,
    });
    console.log(` WhatsApp message sent to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`Error sending WhatsApp message to ${to}:`, error.message);
  }
};

module.exports = { sendWhatsAppMessage };
