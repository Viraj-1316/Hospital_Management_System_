const { sendEmail } = require("./emailService");
const logger = require("./logger");

async function sendReceptionistWelcomeEmail(to, name, email, password) {
  try {
    const htmlTemplate = `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color:#2563eb;">Welcome to OneCare!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your receptionist account has been created successfully.</p>

        <h3>Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>

        <br />
        <p>You can now log in to your account.</p>
        <p>Regards,<br/>OneCare Team</p>
      </div>
    `;

    const result = await sendEmail({
      to,
      subject: "Your Receptionist Account Credentials",
      html: htmlTemplate,
    });

    if (result.success) {
      logger.info("Receptionist welcome email sent successfully", { to, email });
      return true;
    } else {
      logger.error("Receptionist email sending failed", { to, error: result.error });
      return false;
    }
  } catch (err) {
    logger.error("Receptionist email sending error", { 
      to, 
      error: err.message,
    });
    return false;
  }
}

module.exports = sendReceptionistWelcomeEmail;
