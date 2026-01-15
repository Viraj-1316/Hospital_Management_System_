function clinicAddedTemplate({ clinicName, contactName, hospitalId }) {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
    <h2 style="color:#2563eb;">Welcome to OneCare 👋</h2>
    
    <p>Hi ${contactName || "there"},</p>
    <p>Your clinic <strong>${clinicName}</strong> has been successfully added to the OneCare system.</p>

    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; display: inline-block; margin: 10px 0;">
      <p style="margin: 4px 0;"><strong>Hospital ID:</strong> ${hospitalId}</p>
    </div>

    <p><strong>Important:</strong> Share this Hospital ID with doctors and staff who want to register for your clinic.</p>

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
  appointmentMode,
  onlinePlatform,
  meetingLink,
}) {
  // Platform display name
  const platformName = onlinePlatform === 'google_meet' ? 'Google Meet' : 
                       onlinePlatform === 'zoom' ? 'Zoom' : '';
  
  // Mode display
  const modeDisplay = appointmentMode === 'online' ? '🖥️ Online Consultation' : 
                      appointmentMode === 'offline' ? '🏥 In-Clinic Visit' : '';
  
  // Meeting link section (only for online appointments)
  const meetingSection = appointmentMode === 'online' && meetingLink ? `
    <div style="background: #e7f5ff; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
      <p style="margin: 0 0 12px 0; font-weight: bold; color: #1971c2;">
        📹 Your ${platformName} Meeting Link
      </p>
      <a href="${meetingLink}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Join Meeting
      </a>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #666;">
        Or copy this link: <a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a>
      </p>
    </div>
  ` : '';

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
        ${modeDisplay ? `<strong>Mode:</strong> ${modeDisplay} <br/>` : ""}
        ${services
      ? `<strong>Services:</strong> ${services}`
      : ""
    }
      </p>

      ${meetingSection}

      <p>You can view or manage this appointment from your OneCare patient portal.</p>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

// Email confirmation for clinic registration
function clinicRegistrationConfirmationTemplate({ ownerName, clinicName, applicationId }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">OneCare</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Hospital Management System</p>
      </div>
      
      <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #22c55e; margin: 0 0 20px 0;">Registration Received ✅</h2>
        
        <p>Hi ${ownerName || "there"},</p>
        <p>Thank you for registering <strong>${clinicName}</strong> with OneCare. Your application has been successfully submitted for review.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Your Application ID</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a; letter-spacing: 1px;">${applicationId}</p>
        </div>

        <h3 style="color: #1f2937; margin: 24px 0 12px 0;">What happens next?</h3>
        <ol style="color: #4b5563; line-height: 1.8;">
          <li>Our team will review your registration within <strong>24-48 hours</strong></li>
          <li>You'll receive an email notification once your registration is approved</li>
          <li>After approval, you'll get login credentials to access your OneCare dashboard</li>
        </ol>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>💡 Tip:</strong> Save your Application ID for future reference. You may need it when contacting support.
          </p>
        </div>

        <p style="margin-top: 24px;">If you have any questions, feel free to reply to this email or contact us at <a href="mailto:support@onecare.app" style="color: #2563eb;">support@onecare.app</a></p>
      </div>

      <div style="padding: 20px; background: #f9fafb; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          &copy; ${new Date().getFullYear()} OneCare. All rights reserved.
        </p>
      </div>
    </div>
  `;
}


module.exports = {
  clinicAddedTemplate,
  appointmentBookedTemplate,
  credentialsTemplate,
  staffSignupRequestTemplate,
  staffApprovedTemplate,
  staffRejectedTemplate,
  clinicRegistrationConfirmationTemplate,
  clinicApprovalTemplate,
  clinicRejectionTemplate,
};

// Email to hospital admin when doctor/staff signs up
function staffSignupRequestTemplate({ staffName, staffEmail, staffRole, clinicName, hospitalId }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#f59e0b;">New ${staffRole} Registration Request 📋</h2>
      
      <p>Hello,</p>
      <p>A new <strong>${staffRole}</strong> has requested to join your clinic on OneCare.</p>

      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 10px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${staffName}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${staffEmail}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${staffRole}</p>
        <p style="margin: 4px 0;"><strong>Clinic:</strong> ${clinicName}</p>
        <p style="margin: 4px 0;"><strong>Hospital ID:</strong> ${hospitalId}</p>
      </div>

      <p>Please login to your OneCare dashboard to <strong>approve or reject</strong> this request.</p>

      <p style="margin-top:16px; color: #666;">
        If you do not recognize this request, please reject it and contact OneCare support.
      </p>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

// Email to staff when their signup is approved
function staffApprovedTemplate({ staffName, clinicName }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#22c55e;">Registration Approved ✅</h2>
      
      <p>Hi ${staffName || "there"},</p>
      <p>Great news! Your registration request for <strong>${clinicName}</strong> has been <strong>approved</strong>.</p>

      <p>You can now login to OneCare using the credentials you created during signup.</p>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://onecare.app'}" 
           style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Login Now
        </a>
      </div>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

// Email to staff when their signup is rejected
function staffRejectedTemplate({ staffName, clinicName }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#ef4444;">Registration Request Declined ❌</h2>
      
      <p>Hi ${staffName || "there"},</p>
      <p>Unfortunately, your registration request for <strong>${clinicName}</strong> has been <strong>declined</strong>.</p>

      <p>If you believe this was a mistake, please contact the hospital administrator directly.</p>

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

function credentialsTemplate({ name, email, password, hospitalId }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px;">
      <h2 style="color:#2563eb;">Your OneCare Credentials 🔐</h2>
      
      <p>Hi ${name || "there"},</p>
      <p>Here are your login credentials for the OneCare system:</p>

      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; display: inline-block; margin: 10px 0;">
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Password:</strong> ${password}</p>
        ${hospitalId ? `<p style="margin: 4px 0;"><strong>Hospital ID:</strong> ${hospitalId}</p>` : ''}
      </div>

      <p>Please log in and change your password immediately.</p>
      ${hospitalId ? `<p><strong>Important:</strong> Share the Hospital ID with doctors and staff who want to register for your clinic.</p>` : ''}

      <br/>
      <p>Regards,<br/>OneCare Team</p>
    </div>
  `;
}

// ============================================
// CLINIC REGISTRATION ADMIN APPROVAL EMAILS
// ============================================

// Email when admin approves a clinic registration
function clinicApprovalTemplate({ ownerName, clinicName, applicationId, registrationId }) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://onecare.app';
  const onboardingLink = `${frontendUrl}/onboarding/${registrationId}`;
  
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">OneCare</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Hospital Management System</p>
      </div>
      
      <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #22c55e; margin: 0 0 20px 0;">🎉 Congratulations! Your Registration is Approved</h2>
        
        <p>Dear ${ownerName || "Clinic Administrator"},</p>
        
        <p>We are delighted to inform you that your clinic registration for <strong>${clinicName}</strong> has been <strong style="color: #16a34a;">approved</strong>!</p>
        
        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">Application ID</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #16a34a; letter-spacing: 1px;">${applicationId}</p>
        </div>

        <h3 style="color: #1e40af; margin: 24px 0 12px 0;">🚀 Next Steps:</h3>
        <ol style="padding-left: 20px; line-height: 1.8;">
          <li><strong>Complete your clinic setup</strong> - Click the button below to set up your clinic website</li>
          <li>Choose your clinic subdomain (e.g., yourClinic.onecare.clinic)</li>
          <li>Add your clinic details, services, and team members</li>
          <li>Once completed, you'll receive login credentials for your dashboard</li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${onboardingLink}" 
             style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
            🏥 Set Up My Clinic Now
          </a>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>⏰ Note:</strong> Please complete your clinic setup within 30 days. After that, you may need to contact support.
          </p>
        </div>

        <p style="margin-top: 24px;">If you have any questions, feel free to contact us at <a href="mailto:support@onecare.app" style="color: #2563eb;">support@onecare.app</a></p>
      </div>

      <div style="padding: 20px; background: #f9fafb; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          &copy; ${new Date().getFullYear()} OneCare. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

// Email when admin rejects a clinic registration
function clinicRejectionTemplate({ ownerName, clinicName, applicationId, reason }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">OneCare</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Hospital Management System</p>
      </div>
      
      <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #ef4444; margin: 0 0 20px 0;">Registration Application Update</h2>
        
        <p>Dear ${ownerName || "Applicant"},</p>
        
        <p>Thank you for your interest in OneCare. After careful review, we regret to inform you that your clinic registration for <strong>${clinicName}</strong> could not be approved at this time.</p>
        
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">Application ID</p>
          <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #ef4444; letter-spacing: 1px;">${applicationId}</p>
          
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">Reason for Rejection</p>
          <p style="margin: 0; font-size: 14px; color: #b91c1c; font-weight: 500;">${reason}</p>
        </div>

        <h3 style="color: #1e40af; margin: 24px 0 12px 0;">What Can You Do?</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Review the rejection reason above carefully.</li>
          <li>Make the necessary corrections to your documentation.</li>
          <li>Submit a new application with the corrected information.</li>
          <li>Reference your Application ID <strong>(${applicationId})</strong> in your new submission for faster processing.</li>
        </ul>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>💡 Tip:</strong> If you believe this was a mistake or need clarification, please reply to this email with your Application ID.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://onecare.app'}/register-clinic" 
             style="background-color: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Submit New Application
          </a>
        </div>

        <p style="margin-top: 24px;">If you have any questions, feel free to contact us at <a href="mailto:support@onecare.app" style="color: #2563eb;">support@onecare.app</a></p>
      </div>

      <div style="padding: 20px; background: #f9fafb; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          &copy; ${new Date().getFullYear()} OneCare. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
