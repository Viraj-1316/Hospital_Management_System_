import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaBell, FaUser, FaLock, FaSignOutAlt, FaClipboardList, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../../config";
import "../styles/ReceptionistModern.css";
import "../../shared/styles/ModernUI.css";

const ReceptionistNavbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const menuRef = useRef();
  const notificationRef = useRef();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({ name: "Receptionist", avatar: "" });

  // Get authUser from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const receptionist = JSON.parse(localStorage.getItem("receptionist") || "{}");
  const userId = authUser?.id || receptionist?._id;

  // Fetch profile on mount
  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      setProfileData({
        name: authUser?.name || receptionist?.name || "Receptionist",
        avatar: ""
      });
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
      const res = await fetch(`${API_BASE}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}` 
            : data.name || "Receptionist",
          avatar: data.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error fetching receptionist profile:", err);
      // Fallback to stored data
      setProfileData({
        name: receptionist?.firstName && receptionist?.lastName
          ? `${receptionist.firstName} ${receptionist.lastName}`
          : authUser?.name || "Receptionist",
        avatar: receptionist?.avatar || ""
      });
    }
  };

  // Get first letter for avatar fallback
  const letter = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "R";

  // Fetch pending appointments for notifications
  const fetchPendingAppointments = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
      const clinic = receptionist?.clinic || authUser?.clinic;
      
      let url = `${API_BASE}/appointments`;
      if (clinic) {
        url += `?clinic=${encodeURIComponent(clinic)}&status=booked`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointments = Array.isArray(res.data) ? res.data : res.data.data || [];
      
      // Filter for today's and upcoming appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today;
      }).slice(0, 10);

      setPendingAppointments(upcomingAppointments);
      setNotificationCount(upcomingAppointments.length);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setPendingAppointments([]);
      setNotificationCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and refresh every 30 seconds
  useEffect(() => {
    fetchPendingAppointments();
    const interval = setInterval(fetchPendingAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("receptionistToken");
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
    localStorage.removeItem("receptionist");
    navigate("/");
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatAppointmentTime = (dateString, timeString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(dateString);
    aptDate.setHours(0, 0, 0, 0);

    let dateLabel = "";
    if (aptDate.getTime() === today.getTime()) {
      dateLabel = "Today";
    } else {
      dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return `${dateLabel} at ${timeString || "TBA"}`;
  };

  return (
    <nav className="receptionist-navbar">
      {/* Left section */}
      <div className="receptionist-navbar-left">
        <button className="receptionist-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1 className="receptionist-navbar-title">Receptionist Dashboard</h1>
      </div>

      {/* Right section */}
      <div className="receptionist-navbar-right">
        {/* Notification Bell */}
        <div style={{ position: "relative" }} ref={notificationRef}>
          <button
            className="receptionist-notification-btn"
            onClick={() => setNotificationOpen(!notificationOpen)}
            title="Upcoming Appointments"
          >
            <FaBell size={18} />
            {notificationCount > 0 && (
              <span className="receptionist-notification-badge">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="receptionist-dropdown" style={{ minWidth: 360, right: 0 }}>
              {/* Notification Header */}
              <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                padding: "14px 16px",
                borderRadius: "12px 12px 0 0",
                margin: "-8px -8px 8px -8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  📅 Upcoming Appointments
                </span>
                {notificationCount > 0 && (
                  <span style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    color: "#fff",
                    fontWeight: 600
                  }}>
                    {notificationCount} upcoming
                  </span>
                )}
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {loadingNotifications ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                    Loading appointments...
                  </div>
                ) : pendingAppointments.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                    <div style={{ color: "#334155", fontWeight: 600, fontSize: 14 }}>No upcoming appointments</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>You're all set!</div>
                  </div>
                ) : (
                  pendingAppointments.map((appointment, index) => (
                    <div
                      key={appointment._id}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        borderRadius: 10,
                        transition: "background 0.2s",
                        marginBottom: 4,
                        borderLeft: "3px solid #10b981"
                      }}
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/receptionist/appointments");
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#f0fdf4"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <FaClock style={{ color: "#fff", fontSize: 16 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                          {appointment.patientName || "Patient"}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
                          Dr. {appointment.doctorName || "Doctor"}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: 11,
                            color: "#10b981",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            <FaClipboardList size={10} />
                            {appointment.clinic || "Clinic"}
                          </span>
                          <span style={{ color: "#94a3b8", fontSize: 10 }}>
                            {formatAppointmentTime(appointment.date, appointment.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {pendingAppointments.length > 0 && (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    borderTop: "1px solid #f1f5f9",
                    marginTop: 4,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate("/receptionist/appointments");
                  }}
                >
                  <span style={{
                    background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 600,
                    fontSize: 12
                  }}>
                    View All Appointments →
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="receptionist-profile-btn" onClick={() => setOpen(!open)}>
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="Avatar"
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div className="receptionist-profile-avatar">{letter}</div>
            )}
            <span className="receptionist-profile-name">{profileData.name}</span>
          </button>

          {open && (
            <div className="receptionist-dropdown">
              <button
                className="receptionist-dropdown-item"
                onClick={() => {
                  navigate("/receptionist/profile");
                  setOpen(false);
                }}
              >
                <FaUser />
                My Profile
              </button>

              <button
                className="receptionist-dropdown-item"
                onClick={() => {
                  navigate("/receptionist/change-password");
                  setOpen(false);
                }}
              >
                <FaLock />
                Change Password
              </button>

              <button
                className="receptionist-dropdown-item danger"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ReceptionistNavbar;