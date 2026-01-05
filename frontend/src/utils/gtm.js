/**
 * Google Tag Manager Utility
 * Use these functions to push events to GTM dataLayer
 */

/**
 * Push a custom event to GTM dataLayer
 * @param {string} eventName - Name of the event (e.g., 'appointment_booked')
 * @param {object} eventData - Additional event parameters
 */
export const pushEvent = (eventName, eventData = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });
};

/**
 * Track page views (useful for SPA navigation)
 * @param {string} pagePath - The page path
 * @param {string} pageTitle - The page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  pushEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

/**
 * Track user login
 * @param {string} userType - Type of user (patient, doctor, clinic, admin)
 */
export const trackLogin = (userType) => {
  pushEvent('login', {
    user_type: userType,
  });
};

/**
 * Track appointment booking
 * @param {object} appointmentData - Appointment details
 */
export const trackAppointmentBooked = (appointmentData) => {
  pushEvent('appointment_booked', {
    doctor_id: appointmentData.doctorId,
    service_type: appointmentData.serviceType,
    appointment_date: appointmentData.date,
    total_amount: appointmentData.amount,
  });
};

/**
 * Track form submissions
 * @param {string} formName - Name/identifier of the form
 */
export const trackFormSubmit = (formName) => {
  pushEvent('form_submit', {
    form_name: formName,
  });
};
