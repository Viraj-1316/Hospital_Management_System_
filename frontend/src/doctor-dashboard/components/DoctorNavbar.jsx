import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";

export default function DoctorNavbar({ onToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Doctor",
    avatar: ""
  });

  const navigate = useNavigate();
  const menuRef = useRef();

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userId = authUser?.id;

  // Fetch doctor profile
  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/doctors/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name || "Doctor",
          avatar: data.avatar || ""
        });
      }
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  const letter = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "D";

  return (
    <nav className="navbar navbar-dark bg-primary px-3 d-flex justify-content-between align-items-center">
      {/* LEFT SECTION */}
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-light border-0" onClick={onToggle}>
          <FaBars size={22} />
        </button>
        <h4 className="text-white fw-bold mb-0">One Care Doctor</h4>
      </div>

      {/* RIGHT SECTION */}
      <div className="position-relative" ref={menuRef}>
        <div
          className="d-flex align-items-center"
          style={{ cursor: "pointer" }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {profileData.avatar ? (
            <img
              src={profileData.avatar}
              width="35"
              height="35"
              alt="doctor"
              className="rounded-circle"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center"
              style={{
                width: 35,
                height: 35,
                fontSize: 18
              }}
            >
              {letter}
            </div>
          )}

          <span className="text-white ms-2 fw-semibold">{profileData.name}</span>
        </div>

        {dropdownOpen && (
          <div
            className="admin-dropdown"
            style={{
              position: "absolute",
              top: "48px",
              right: 0,
              zIndex: 2000,
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
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
    </nav>
  );
}
