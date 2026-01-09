import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FiCalendar, FiClock, FiUser, FiMapPin, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const VerifyAppointment = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        // Public endpoint - no auth required for verification
        const response = await axios.get(`${API_URL}/appointments/${id}/verify`);
        setAppointment(response.data);
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError(err.response?.data?.message || "Appointment not found or invalid");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAppointment();
    }
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <span className="status-badge completed">
            <FiCheckCircle /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="status-badge cancelled">
            <FiXCircle /> Cancelled
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="status-badge upcoming">
            <FiAlertCircle /> Upcoming
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="verify-container">
        <div className="verify-card loading">
          <div className="spinner"></div>
          <p>Verifying appointment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-container">
        <div className="verify-card error">
          <FiXCircle className="error-icon" />
          <h2>Verification Failed</h2>
          <p>{error}</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <style>{`
        .verify-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .verify-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          max-width: 500px;
          width: 100%;
          overflow: hidden;
        }
        
        .verify-card.loading,
        .verify-card.error {
          padding: 60px 40px;
          text-align: center;
        }
        
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-icon {
          font-size: 48px;
          color: #dc2626;
          margin-bottom: 16px;
        }
        
        .verify-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .verify-header h1 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        
        .verify-header p {
          font-size: 13px;
          opacity: 0.8;
          margin: 0;
        }
        
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 12px;
        }
        
        .verify-body {
          padding: 24px;
        }
        
        .info-section {
          margin-bottom: 20px;
        }
        
        .info-section h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .info-item svg {
          color: #2563eb;
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .info-item .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }
        
        .info-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .status-badge.upcoming {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .status-badge.completed {
          background: #d1fae5;
          color: #059669;
        }
        
        .status-badge.cancelled {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .btn-primary {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.2s;
        }
        
        .btn-primary:hover {
          background: #1d4ed8;
        }
        
        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 16px 0;
        }
        
        .footer-note {
          text-align: center;
          font-size: 12px;
          color: #64748b;
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-note b {
          color: #2563eb;
        }
      `}</style>

      <div className="verify-card">
        <div className="verify-header">
          <h1>Appointment Verified</h1>
          <p>ID: <strong>{appointment?.appointmentId || "N/A"}</strong></p>
          <div className="verified-badge">
            <FiCheckCircle /> Verified
          </div>
        </div>

        <div className="verify-body">
          <div className="info-section">
            <h3>Appointment Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <FiCalendar />
                <div>
                  <div className="label">Date</div>
                  <div className="value">
                    {appointment?.date 
                      ? new Date(appointment.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="info-item">
                <FiClock />
                <div>
                  <div className="label">Time</div>
                  <div className="value">{appointment?.time || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="info-section">
            <h3>Patient</h3>
            <div className="info-grid">
              <div className="info-item">
                <FiUser />
                <div>
                  <div className="label">Name</div>
                  <div className="value">{appointment?.patientName || "N/A"}</div>
                </div>
              </div>
              <div className="info-item">
                <FiUser />
                <div>
                  <div className="label">Patient ID</div>
                  <div className="value">{appointment?.patientPid || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="info-section">
            <h3>Doctor & Location</h3>
            <div className="info-grid">
              <div className="info-item">
                <FiUser />
                <div>
                  <div className="label">Doctor</div>
                  <div className="value">{appointment?.doctorName || "N/A"}</div>
                </div>
              </div>
              <div className="info-item">
                <FiMapPin />
                <div>
                  <div className="label">Department</div>
                  <div className="value">{appointment?.department || "General"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="info-section">
            <h3>Status</h3>
            {getStatusBadge(appointment?.status)}
          </div>
        </div>

        <div className="footer-note">
          Powered by <b>OneCare</b> Hospital Management System
        </div>
      </div>
    </div>
  );
};

export default VerifyAppointment;
