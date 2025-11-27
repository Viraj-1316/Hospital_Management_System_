const nodemailer = require("nodemailer");

async function sendReceptionistWelcomeEmail(to, name, email, password) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER, // Brevo SMTP login (xxxx@smtp-brevo.com)
        pass: process.env.EMAIL_PASS, // Brevo SMTP key
      },
    });

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

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: "Your Receptionist Account Credentials",
      html: htmlTemplate,
    });

    return true;
  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
}

module.exports = sendReceptionistWelcomeEmail;
