const { google } = require("googleapis");
const axios = require("axios");
const DoctorModel = require("../models/Doctor");
const logger = require("./logger");

/**
 * Get authenticated Google OAuth client for a doctor
 */
async function getGoogleClient(doctorId) {
  const doctor = await DoctorModel.findById(doctorId);
  
  if (!doctor || !doctor.googleConnected || !doctor.googleTokens?.refreshToken) {
    throw new Error("Doctor not connected to Google");
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: doctor.googleTokens.accessToken,
    refresh_token: doctor.googleTokens.refreshToken,
    expiry_date: doctor.googleTokens.expiresAt?.getTime()
  });
  
  // Refresh token if expired
  if (doctor.googleTokens.expiresAt && new Date() > doctor.googleTokens.expiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await DoctorModel.findByIdAndUpdate(doctorId, {
        'googleTokens.accessToken': credentials.access_token,
        'googleTokens.expiresAt': new Date(credentials.expiry_date)
      });
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      logger.error("Failed to refresh Google token", { doctorId, error: err.message });
      throw new Error("Google authentication expired. Please reconnect.");
    }
  }
  
  return oauth2Client;
}

/**
 * Create a Google Calendar event with Meet conferencing
 */
async function createGoogleMeetEvent(doctorId, appointmentDetails) {
  try {
    const oauth2Client = await getGoogleClient(doctorId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const { patientName, date, time, services, clinicName } = appointmentDetails;
    
    // Parse date and time
    const [month, day, year] = date.includes('/') ? date.split('/') : [null, null, null];
    const appointmentDate = year ? new Date(`${year}-${month}-${day}`) : new Date(date);
    
    // Parse time (e.g., "10:00 AM")
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const ampm = timeParts[3]?.toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      appointmentDate.setHours(hours, minutes, 0, 0);
    }
    
    // End time (30 min later by default)
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    const event = {
      summary: `Appointment: ${patientName}`,
      description: `Online appointment with ${patientName}\nClinic: ${clinicName}\nServices: ${services || 'General Consultation'}`,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Kolkata'
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      attendees: appointmentDetails.patientEmail ? [
        { email: appointmentDetails.patientEmail }
      ] : []
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });
    
    const meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;
    
    logger.info("Google Meet event created", { 
      doctorId, 
      eventId: response.data.id,
      meetLink 
    });
    
    return {
      success: true,
      eventId: response.data.id,
      meetingLink: meetLink,
      htmlLink: response.data.htmlLink
    };
  } catch (err) {
    logger.error("Failed to create Google Meet event", { doctorId, error: err.message });
    throw err;
  }
}

/**
 * Refresh Zoom access token if expired
 */
async function refreshZoomToken(doctorId) {
  const doctor = await DoctorModel.findById(doctorId);
  
  if (!doctor?.zoomTokens?.refreshToken) {
    throw new Error("No Zoom refresh token available");
  }
  
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', doctor.zoomTokens.refreshToken);

    const response = await axios.post('https://zoom.us/oauth/token', params, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const tokens = response.data;
    
    await DoctorModel.findByIdAndUpdate(doctorId, {
      'zoomTokens.accessToken': tokens.access_token,
      'zoomTokens.refreshToken': tokens.refresh_token || doctor.zoomTokens.refreshToken,
      'zoomTokens.expiresAt': new Date(Date.now() + (tokens.expires_in * 1000))
    });
    
    return tokens.access_token;
  } catch (err) {
    logger.error("Failed to refresh Zoom token", { 
      doctorId, 
      error: err.message,
      responseData: err.response?.data 
    });
    throw new Error("Zoom authentication expired. Please reconnect.");
  }
}

/**
 * Create a Zoom meeting
 */
async function createZoomMeeting(doctorId, appointmentDetails) {
  try {
    const doctor = await DoctorModel.findById(doctorId);
    
    if (!doctor || !doctor.zoomConnected) {
      throw new Error("Doctor not connected to Zoom");
    }
    
    let accessToken = doctor.zoomTokens.accessToken;
    
    // Refresh token if expired
    if (doctor.zoomTokens.expiresAt && new Date() > doctor.zoomTokens.expiresAt) {
      accessToken = await refreshZoomToken(doctorId);
    }
    
    const { patientName, date, time, services, clinicName } = appointmentDetails;
    
    // Parse date and time
    const appointmentDate = new Date(date);
    const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const ampm = timeParts[3]?.toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      appointmentDate.setHours(hours, minutes, 0, 0);
    }
    
    const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
      topic: `Appointment: ${patientName}`,
      type: 2, // Scheduled meeting
      start_time: appointmentDate.toISOString(),
      duration: 30,
      timezone: 'Asia/Kolkata',
      agenda: `Online appointment with ${patientName}\nClinic: ${clinicName}\nServices: ${services || 'General Consultation'}`,
      settings: {
        join_before_host: true,
        waiting_room: false,
        auto_recording: 'none'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const meeting = response.data;
    
    logger.info("Zoom meeting created", { 
      doctorId, 
      meetingId: meeting.id,
      joinUrl: meeting.join_url 
    });
    
    return {
      success: true,
      meetingId: String(meeting.id),
      meetingLink: meeting.join_url,
      startUrl: meeting.start_url
    };
  } catch (err) {
    logger.error("Failed to create Zoom meeting", { doctorId, error: err.message, details: err.response?.data });
    throw err;
  }
}

/**
 * Check if doctor has connected platforms
 */
async function getDoctorPlatforms(doctorId) {
  const doctor = await DoctorModel.findById(doctorId).select('googleConnected zoomConnected');
  
  return {
    google_meet: doctor?.googleConnected || false,
    zoom: doctor?.zoomConnected || false
  };
}

module.exports = {
  createGoogleMeetEvent,
  createZoomMeeting,
  getDoctorPlatforms
};
