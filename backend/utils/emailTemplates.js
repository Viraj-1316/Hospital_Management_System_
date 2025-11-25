function clinicAddedTemplate({ clinicName, contactName }) {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
    <h2 style="color:#2563eb;">Welcome to OneCare 👋</h2>
    
    <p>Hi ${contactName || "there"},</p>
    <p>Your clinic <strong>${clinicName}</strong> has been successfully added to the OneCare system.</p>

    <p>You can now start managing appointments, doctors, and patients from your OneCare dashboard.</p>

    <p style="margin-top:16px;">
      If this was not done by you, please contact the OneCare admin immediately.
    </p>

    <br/>
    <p>Regards,<br/>OneCare Team</p>
  </div>
  `;
}
function appointmentBookedTemplate({
  patientName,
  doctorName,
  clinicName,
  date,
  time,
  services,
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#2563eb;">Your Appointment is Confirmed ✔️</h2>
      
      <p>Hi ${patientName || "Patient"},</p>
      <p>Your appointment has been booked successfully.</p>

      <p>
        <strong>Doctor:</strong> ${doctorName || "Doctor"} <br/>
        <strong>Clinic:</strong> ${clinicName || "OneCare"} <br/>
        <strong>Date:</strong> ${date || "-"} <br/>
        <strong>Time:</strong> ${time || "-"} <br/>
        ${
          services
            ? `<strong>Services:</strong> ${services}`
            : ""
        }
      </p>

      <p>You can view or manage this appointment from your OneCare patient portal.</p>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

module.exports = {
  clinicAddedTemplate,      
  appointmentBookedTemplate,
  credentialsTemplate
};

function credentialsTemplate({ name, email, password }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#2563eb;">Your OneCare Credentials 🔐</h2>
      
      <p>Hi ${name || "there"},</p>
      <p>Here are your login credentials for the OneCare system:</p>

      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; display: inline-block; margin: 10px 0;">
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Password:</strong> ${password}</p>
      </div>

      <p>Please log in and change your password immediately.</p>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}
