import React, { useState, useRef, useEffect } from "react";
import "../styles/DoctorLayout.css"; 
import Docimg from "../images/doctor.png";
import { useNavigate } from "react-router-dom";

export default function DoctorNavbar({ onToggle, open }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Logout logic
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="doctor-navbar" ref={menuRef}>
      {/* Left Section */}
      <div className="doctor-nav-left">
        <button
          className="doctor-hamburger"
          onClick={onToggle}
          aria-label="toggle sidebar"
        >
          ☰
        </button>

        <h4 className="text-white fw-bold mb-0">One Care Doctor</h4>
      </div>

      {/* Right Section (Profile + Dropdown) */}
      <div className="doctor-nav-right">
        <div
          className="doctor-profile"
          style={{ cursor: "pointer" }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img src={Docimg} alt="doctor" className="doctor-avatar" />
          <span className="doctor-name">Doctor</span>
        </div>

        {dropdownOpen && (
          <div
            className="doctor-dropdown shadow"
            style={{
              position: "absolute",
              top: "60px",
              right: "20px",
              background: "white",
              borderRadius: "8px",
              width: "180px",
              zIndex: 1000,
            }}
          >
            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/doctor/profile");
                setDropdownOpen(false);
              }}
            >
              <i className="fa fa-user"></i> My Profile
            </button>

            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/doctor/change-password");
                setDropdownOpen(false);
              }}
            >
              <i className="fa fa-lock"></i> Change Password
            </button>

            <button
              className="dropdown-item text-danger d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <i className="fa fa-sign-out-alt"></i> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
