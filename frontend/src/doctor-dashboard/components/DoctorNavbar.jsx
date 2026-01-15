import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaUser, FaLock, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";
import "../../shared/styles/ModernUI.css";

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
    <nav className="modern-navbar">
      {/* Left section */}
      <div className="modern-navbar-left">
        <button className="modern-menu-btn" onClick={onToggle}>
          <FaBars />
        </button>
        <h1 className="modern-navbar-title">Doctor Portal</h1>
      </div>

      {/* Right section */}
      <div className="modern-navbar-right">
        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="modern-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {profileData.avatar ? (
              <div className="modern-profile-avatar">
                <img src={profileData.avatar} alt="Avatar" />
              </div>
            ) : (
              <div className="modern-profile-avatar">{letter}</div>
            )}
            <span className="modern-profile-name">{profileData.name}</span>
          </button>

          {dropdownOpen && (
            <div className="modern-dropdown">
              {(() => {
                  const subdomain = localStorage.getItem("clinicSubdomain");
                  const getLink = (path) => subdomain ? `/c/${subdomain}${path}` : path;
                  
                  return (
                    <>
                      <button
                        className="modern-dropdown-item"
                        onClick={() => {
                          navigate(getLink("/doctor/profile"));
                          setDropdownOpen(false);
                        }}
                      >
                        <FaUser />
                        My Profile
                      </button>

                      <button
                        className="modern-dropdown-item"
                        onClick={() => {
                          navigate(getLink("/doctor/change-password"));
                          setDropdownOpen(false);
                        }}
                      >
                        <FaLock />
                        Change Password
                      </button>
                    </>
                  );
              })()}

              <button
                className="modern-dropdown-item danger"
                onClick={() => {
                   const subdomain = localStorage.getItem("clinicSubdomain");
                   localStorage.removeItem("token");
                   localStorage.removeItem("role");
                   localStorage.removeItem("authUser");
                   navigate(subdomain ? `/c/${subdomain}/login` : "/");
                }}
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
}