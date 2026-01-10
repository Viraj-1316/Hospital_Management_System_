import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaQuestionCircle, FaSave } from "react-icons/fa";
import API_BASE from "../../../config";

const ReceptionistAppointmentSettings = () => {
  // State for Restrict Advance Appointment Booking
  const [bookingOpenBefore, setBookingOpenBefore] = useState(365);
  const [bookingCloseBefore, setBookingCloseBefore] = useState(0);
  const [allowSameDay, setAllowSameDay] = useState(false);

  // State for Appointment Reminder
  const [emailReminder, setEmailReminder] = useState(false);
  const [smsReminder, setSmsReminder] = useState(false);
  const [whatsappReminder, setWhatsappReminder] = useState(false);

  // Initial Fetch
  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/api/settings/appointment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data) {
        setBookingOpenBefore(data.bookingOpenBefore ?? 365);
        setBookingCloseBefore(data.bookingCloseBefore ?? 0);
        setAllowSameDay(data.allowSameDay ?? false);
        setEmailReminder(data.emailReminder ?? false);
        setSmsReminder(data.smsReminder ?? false);
        setWhatsappReminder(data.whatsappReminder ?? false);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
      // toast.error("Failed to load settings");
    }
  };

  const handleSaveBookingSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        bookingOpenBefore,
        bookingCloseBefore,
        allowSameDay,
      };
      await axios.put(`${API_BASE}/api/settings/appointment`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save booking settings");
    }
  };

  const handleSaveReminderSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        emailReminder,
        smsReminder,
        whatsappReminder,
      };
      await axios.put(`${API_BASE}/api/settings/appointment`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Reminder settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save reminder settings");
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Restrict Advance Appointment Booking Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-bold text-dark">Restrict Advance Appointment Booking</h5>
            <FaQuestionCircle className="text-secondary opacity-50" size={16} title="Configure advance booking limits" />
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary small">Booking Open Before (in Days) <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-control"
                value={bookingOpenBefore}
                onChange={(e) => setBookingOpenBefore(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary small">Booking Close Before (in Days) <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-control"
                value={bookingCloseBefore}
                onChange={(e) => setBookingCloseBefore(e.target.value)}
              />
            </div>
          </div>

          <p className="text-muted small mb-4">
            For example, Booking Open Before: 60 days, Booking Close Before: 7 days, As consideration for the current date, The appointment booking opens 60 days ago and closed 7 days ago.
          </p>

          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="allowSameDay"
                checked={allowSameDay}
                onChange={(e) => setAllowSameDay(e.target.checked)}
                style={{ width: "3em", height: "1.5em" }}
              />
            </div>
            <label className="fw-bold text-secondary small mb-0" htmlFor="allowSameDay">
              Allow Same Day Booking Only
            </label>
          </div>

          <div className="d-flex justify-content-end">
            <button className="btn btn-primary px-4 d-flex align-items-center gap-2" onClick={handleSaveBookingSettings}>
              <FaSave /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Reminder Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold text-dark">Appointment Reminder</h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailReminder"
                    checked={emailReminder}
                    onChange={(e) => setEmailReminder(e.target.checked)}
                    style={{ width: "3em", height: "1.5em" }}
                  />
                </div>
                <label className="fw-bold text-secondary small mb-0" htmlFor="emailReminder">Email Reminder</label>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="smsReminder"
                    checked={smsReminder}
                    onChange={(e) => setSmsReminder(e.target.checked)}
                    style={{ width: "3em", height: "1.5em" }}
                  />
                </div>
                <label className="fw-bold text-secondary small mb-0" htmlFor="smsReminder">Sms Reminder (Twilio)</label>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-center gap-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="whatsappReminder"
                    checked={whatsappReminder}
                    onChange={(e) => setWhatsappReminder(e.target.checked)}
                    style={{ width: "3em", height: "1.5em" }}
                  />
                </div>
                <label className="fw-bold text-secondary small mb-0" htmlFor="whatsappReminder">Whatsapp Reminder (Twilio)</label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button className="btn btn-primary px-4 d-flex align-items-center gap-2" onClick={handleSaveReminderSettings}>
              <FaSave /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistAppointmentSettings;
