import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaBell } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import admin from "../images/admin.png";

const Navbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const menuRef = useRef();
  const notificationRef = useRef();
  const navigate = useNavigate();

  // Get authUser from localStorage for displaying admin name
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const adminName = authUser?.name || authUser?.clinicName || "Clinic Admin";

  // close dropdown on outside click
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
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-dark bg-primary px-3 d-flex justify-content-between align-items-center">
      {/* left */}
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-light border-0"
          onClick={toggleSidebar}
        >
          <FaBars size={22} />
        </button>
        <h4 className="text-white fw-bold mb-0">Clinic Dashboard</h4>
      </div>

      {/* right (notifications + profile + dropdown) */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <div className="position-relative" ref={notificationRef}>
          <button
            className="btn btn-outline-light border-0 position-relative"
            onClick={() => setNotificationOpen(!notificationOpen)}
            title="Notifications"
          >
            <FaBell size={20} />
          </button>

          {notificationOpen && (
            <div 
              className="position-absolute bg-white rounded shadow-lg"
              style={{ 
                right: 0, 
                top: "100%", 
                marginTop: "8px",
                minWidth: "280px",
                zIndex: 1050 
              }}
            >
              <div className="p-3 border-bottom">
                <h6 className="mb-0 fw-bold text-primary">Notifications</h6>
              </div>
              <div className="p-3 text-center text-muted">
                <small>No new notifications</small>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="position-relative" ref={menuRef}>
          <div
            className="d-flex align-items-center"
            style={{ cursor: "pointer" }}
            onClick={() => setOpen(!open)}
          >
            <img
              src={admin}
              alt="User Avatar"
              width="35"
              height="35"
              className="rounded-circle"
            />
            <span className="text-white ms-2 fw-semibold">{adminName}</span>
          </div>

        {open && (
          <div className="admin-dropdown">
            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/clinic-dashboard/profile");
                setOpen(false);
              }}
            >
              <i className="fa fa-user"></i>
              My Profile
            </button>

            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/clinic-dashboard/change-password");
                setOpen(false);
              }}
            >
              <i className="fa fa-lock"></i>
              Change Password
            </button>

            <button
              className="dropdown-item text-danger d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <i className="fa fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
