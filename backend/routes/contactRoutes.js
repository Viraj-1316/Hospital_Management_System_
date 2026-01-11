const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const logger = require("../utils/logger");

// Admin email for receiving contact inquiries
const ADMIN_EMAIL = "bhargavk056@gmail.com";

/**
 * POST /api/contact
 * Public endpoint - no authentication required
 * Handles contact form submissions from landing page
 */
router.post("/", async (req, res) => {
  const { name, email, phone, clinicName, inquiryType, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false,
      message: "Name, email, and message are required." 
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: "Please provide a valid email address." 
    });
  }

  try {
    const timestamp = new Date().toLocaleString("en-IN", { 
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short"
    });

    // 1. Send notification email to admin
    const adminEmailHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2c5282 0%, #38b2ac 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏥 New OneCare Inquiry</h1>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <p style="color: #64748b; margin-top: 0;">A new inquiry was submitted on ${timestamp}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 0; font-weight: 600; color: #475569; width: 140px;">Name</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 0 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Email</td>
              <td style="padding: 12px; background: #f8fafc;"><a href="mailto:${email}" style="color: #2c5282;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Phone</td>
              <td style="padding: 12px; background: #f8fafc;">${phone || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Clinic/Hospital</td>
              <td style="padding: 12px; background: #f8fafc;">${clinicName || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 0 0 0 8px; font-weight: 600; color: #475569;">Inquiry Type</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 0 8px 0;">${inquiryType || "General"}</td>
            </tr>
          </table>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #38b2ac;">
            <h3 style="margin: 0 0 8px 0; color: #2c5282; font-size: 16px;">Message</h3>
            <p style="margin: 0; color: #475569; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="mailto:${email}?subject=Re: Your OneCare Inquiry" 
               style="display: inline-block; background: linear-gradient(135deg, #2c5282 0%, #38b2ac 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reply to ${name}
            </a>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New OneCare Inquiry from ${name} - ${inquiryType || "General"}`,
      html: adminEmailHTML,
    });

    logger.info("Admin notification email sent", { from: email, inquiryType });

    // 2. Send confirmation email to user
    const userConfirmationHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2c5282 0%, #38b2ac 100%); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="https://onecare.bhargavkarande.dev/logo.png" alt="OneCare" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 12px;" />
          <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Contacting OneCare!</h1>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <p style="color: #1e293b; font-size: 16px; margin-top: 0;">Dear <strong>${name}</strong>,</p>
          
          <p style="color: #475569; line-height: 1.7;">
            Thank you for your interest in <strong>OneCare Hospital Management System</strong>! 
            We've received your inquiry regarding <strong>${inquiryType || "our services"}</strong>.
          </p>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="color: #166534; margin: 0; font-weight: 600;">✅ Your request has been received!</p>
            <p style="color: #15803d; margin: 8px 0 0 0; font-size: 14px;">Our team will review your inquiry and respond within 24-48 hours.</p>
          </div>

          <h3 style="color: #2c5282; font-size: 16px; margin-bottom: 12px;">Your Inquiry Details:</h3>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2c5282;">
            <p style="margin: 0; color: #475569; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>

          <p style="color: #475569; margin-top: 24px; line-height: 1.7;">
            In the meantime, you can explore our features at 
            <a href="https://onecare.bhargavkarande.dev" style="color: #2c5282; font-weight: 600;">onecare.bhargavkarande.dev</a>
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Best regards,</p>
          <p style="color: #1e293b; font-weight: 600; margin: 0;">The OneCare Team</p>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              OneCare - Complete Hospital Management System<br/>
              <a href="mailto:bhargavk056@gmail.com" style="color: #64748b;">bhargavk056@gmail.com</a> | 
              <a href="tel:+919420530466" style="color: #64748b;">+91 94205 30466</a>
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Thank you for contacting OneCare! - We've received your inquiry",
      html: userConfirmationHTML,
    });

    logger.info("User confirmation email sent", { to: email });

    res.status(200).json({ 
      success: true,
      message: "Your inquiry has been submitted successfully! Check your email for confirmation." 
    });

  } catch (error) {
    logger.error("Contact form submission failed", { error: error.message, email });
    res.status(500).json({ 
      success: false,
      message: "Failed to process your inquiry. Please try again or contact us directly." 
    });
  }
});

module.exports = router;
