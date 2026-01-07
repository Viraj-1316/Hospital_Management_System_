// src/components/ReceptionistNavbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaBell, FaUser, FaLock, FaSignOutAlt, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../../config";
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

  // --- Auth & Profile Logic ---
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const receptionist = JSON.parse(localStorage.getItem("receptionist") || "{}");
  
  const [profileData, setProfileData] = useState({ 
    name: authUser?.name || receptionist?.name || "Receptionist", 
    avatar: authUser?.avatar || receptionist?.avatar || "" 
  });

  const userId = authUser?.id || receptionist?._id || authUser?._id;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}` 
            : data.name || data.username || "Receptionist",
          avatar: data.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error fetching receptionist profile:", err);
    }
  };

  const letter = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "R";

  // --- Notification Logic ---
  const fetchPendingAppointments = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
      const clinic = receptionist?.clinic || authUser?.clinic;
      
      let url = `${API_BASE}/api/appointments`; 
      const params = { status: 'booked' };
      if (clinic) params.clinic = clinic;

      const res = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointments = Array.isArray(res.data) ? res.data : res.data.appointments || res.data.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today;
      }).slice(0, 5);

      setPendingAppointments(upcoming);
      setNotificationCount(upcoming.length);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
    const interval = setInterval(fetchPendingAppointments, 60000); 
    return () => clearInterval(interval);
  }, []);

  // --- Click Outside Handler ---
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); 
    navigate("/");
  };

  const formatAppointmentTime = (dateString, timeString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${timeString || "TBA"}`;
  };

  return (
    <nav className="modern-navbar">
      {/* LEFT: Menu Toggle & Title */}
      <div className="modern-navbar-left">
        <button className="modern-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        {/* Title kept as requested, though typically in sidebar for modern layouts */}
        <h1 className="modern-navbar-title">Reception Dashboard</h1>
      </div>

      {/* RIGHT: Notifications & Profile */}
      <div className="modern-navbar-right">
        
        {/* Notification Bell */}
        <div style={{ position: "relative" }} ref={notificationRef}>
          <button 
            className="modern-notification-btn" 
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <FaBell />
            {notificationCount > 0 && (
              <span className="modern-notification-badge">{notificationCount}</span>
            )}
          </button>

          {notificationOpen && (
            <div className="modern-dropdown" style={{ width: "300px", right: 0 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                  Upcoming Appointments
                </h6>
              </div>
              
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {loadingNotifications ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>Loading...</div>
                ) : pendingAppointments.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                    No appointments today
                  </div>
                ) : (
                  pendingAppointments.map((apt) => (
                    <div 
                      key={apt._id} 
                      className="modern-dropdown-item" 
                      onClick={() => navigate("/reception/appointments")}
                      style={{ borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}
                    >
                      <div style={{ 
                        color: "#0d6efd", 
                        background: "#eff6ff", 
                        padding: "8px", 
                        borderRadius: "8px",
                        marginTop: "2px"
                      }}>
                        <FaClock size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#334155" }}>{apt.patientName}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {formatAppointmentTime(apt.date, apt.time)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="modern-profile-btn" onClick={() => setOpen(!open)}>
            <div className="modern-profile-avatar">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="User" />
              ) : (
                <span>{letter}</span>
              )}
            </div>
            <span className="modern-profile-name">{profileData.name}</span>
          </button>

          {open && (
            <div className="modern-dropdown">
               <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                 <div style={{ fontWeight: 600, color: "#1e293b" }}>{profileData.name}</div>
                 <div style={{ fontSize: "12px", color: "#64748b" }}>Receptionist</div>
               </div>

              <button 
                className="modern-dropdown-item" 
                onClick={() => { navigate("/receptionist/profile"); setOpen(false); }}
              >
                <FaUser /> My Profile
              </button>
              
              <button 
                className="modern-dropdown-item" 
                onClick={() => { navigate("/reception/change-password"); setOpen(false); }}
              >
                <FaLock /> Change Password
              </button>
              
              <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }}></div>
              
              <button 
                className="modern-dropdown-item danger" 
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default ReceptionistNavbar;