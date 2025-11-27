const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,                      
  auth: {
    user: process.env.EMAIL_USER,     // loginn email
    pass: process.env.EMAIL_PASS,     // your Brevo SMTP key
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    console.log("📧 Trying to send email to:", to, "| Subject:", subject);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,   
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully to:", to);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
}

module.exports = { sendEmail };
