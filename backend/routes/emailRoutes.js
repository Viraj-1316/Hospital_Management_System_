const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const { verifyToken } = require("../middleware/auth");

// POST /api/email/test-email
router.post("/test-email", verifyToken, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: "Email and message are required." });
  }

  try {
    await sendEmail({
      to,
      subject: "Test Email from OneCare",
      html: `<p>${message}</p>`,
    });

    res.status(200).json({ message: "Test email sent successfully." });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Failed to send test email." });
  }
});

// POST /api/email/send-encounter-details
router.post("/send-encounter-details", verifyToken, async (req, res) => {
  const { to, encounterDetails } = req.body;

  if (!to || !encounterDetails) {
    return res.status(400).json({ message: "Recipient email and encounter details are required." });
  }

  const {
    patientName,
    doctorName,
    clinicName,
    date,
    problems,
    observations,
    notes,
    prescriptions,
  } = encounterDetails;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb; text-align: center;">Encounter Details</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <strong>Clinic:</strong> ${clinicName}<br>
          <strong>Doctor:</strong> ${doctorName}<br>
          <strong>Date:</strong> ${new Date(date).toLocaleDateString()}
        </div>
        <div style="text-align: right;">
          <strong>Patient:</strong> ${patientName}
        </div>
      </div>

      <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 16px;">Clinical Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; width: 33%;">
            <strong>Problems:</strong><br>
            ${problems && problems.length > 0 ? problems.map(p => `• ${p}`).join('<br>') : 'None'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; width: 33%;">
            <strong>Observations:</strong><br>
            ${observations && observations.length > 0 ? observations.map(o => `• ${o}`).join('<br>') : 'None'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; width: 33%;">
            <strong>Notes:</strong><br>
            ${notes && notes.length > 0 ? notes.map(n => `• ${n}`).join('<br>') : 'None'}
          </td>
        </tr>
      </table>

      <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 16px;">Prescriptions</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #eee;">Medicine</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #eee;">Frequency</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #eee;">Duration</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #eee;">Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${prescriptions && prescriptions.length > 0 ? prescriptions.map(p => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${p.frequency}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${p.duration}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.instruction || '-'}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" style="padding: 8px; text-align: center;">No prescriptions</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated email from OneCare. Please do not reply.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to,
      subject: `Encounter Details - ${new Date(date).toLocaleDateString()}`,
      html: htmlContent,
    });

    res.status(200).json({ message: "Encounter details sent successfully." });
  } catch (error) {
    console.error("Error sending encounter details email:", error);
    res.status(500).json({ message: "Failed to send encounter details email." });
  }
});

module.exports = router;
