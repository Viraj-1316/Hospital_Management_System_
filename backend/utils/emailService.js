const nodemailer = require("nodemailer");
const logger = require("./logger");

// Check if we should use Brevo HTTP API or SMTP
const USE_BREVO_API = !!process.env.BREVO_API_KEY;

// Log email configuration
logger.info("Email service configuration", {
  method: USE_BREVO_API ? "BREVO_HTTP_API" : "SMTP",
  host: USE_BREVO_API ? "api.brevo.com" : process.env.EMAIL_HOST,
  from: process.env.EMAIL_FROM ? "SET" : "NOT SET",
});

/**
 * Send email using Brevo HTTP API (bypasses SMTP port blocking on cloud platforms)
 */
async function sendEmailViaBrevoAPI({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set");
  }

  // Parse the from address
  const fromMatch = process.env.EMAIL_FROM?.match(/^(.+?)\s*<(.+)>$/);
  const senderName = fromMatch ? fromMatch[1].trim() : "OneCare Notifications";
  const senderEmail = fromMatch ? fromMatch[2].trim() : process.env.EMAIL_USER;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  return { messageId: result.messageId };
}

/**
 * Send email using SMTP (fallback for local development)
 */
async function sendEmailViaSMTP({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  return { messageId: result.messageId };
}

/**
 * Main email sending function - automatically uses Brevo API if configured, otherwise SMTP
 */
async function sendEmail({ to, subject, html }) {
  try {
    logger.info("Sending email", { to, subject, method: USE_BREVO_API ? "API" : "SMTP" });
    const startTime = Date.now();

    let result;
    if (USE_BREVO_API) {
      result = await sendEmailViaBrevoAPI({ to, subject, html });
    } else {
      result = await sendEmailViaSMTP({ to, subject, html });
    }

    const duration = Date.now() - startTime;
    logger.info("Email sent successfully", {
      to,
      messageId: result.messageId,
      duration: `${duration}ms`,
      method: USE_BREVO_API ? "API" : "SMTP",
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      error: error.message,
      method: USE_BREVO_API ? "API" : "SMTP",
    });
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
