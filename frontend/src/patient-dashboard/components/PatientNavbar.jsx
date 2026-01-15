import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaUser, FaLock, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";
import "../../shared/styles/ModernUI.css";

export default function PatientNavbar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: "Patient", avatar: "" });
  const menuRef = useRef();
  const navigate = useNavigate();

  // CHANGE 2: Safer localStorage parsing
  let userId = null;
  try {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    userId = authUser?.id;
  } catch (e) {
    console.error("Error parsing authUser:", e);
  }

  // Fetch patient profile on mount
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name || "Patient",
          avatar: data.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const letter = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "P";

  return (
    <nav className="modern-navbar">
      {/* Left section */}
      <div className="modern-navbar-left">
        <button className="modern-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1 className="modern-navbar-title">Patient Portal</h1>
      </div>

      {/* Right section */}
      <div className="modern-navbar-right">
        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="modern-profile-btn" onClick={() => setOpen(!open)}>
            {profileData.avatar ? (
              <div className="modern-profile-avatar">
                <img src={profileData.avatar} alt="Avatar" />
              </div>
            ) : (
              <div className="modern-profile-avatar">{letter}</div>
            )}
            <span className="modern-profile-name">{profileData.name}</span>
          </button>

          {open && (
            <div className="modern-dropdown">
              {(() => {
                const subdomain = localStorage.getItem("clinicSubdomain");
                const getLink = (path) => subdomain ? `/c/${subdomain}${path}` : path;
                
                return (
                  <>
                    <button
                      className="modern-dropdown-item"
                      onClick={() => {
                        navigate(getLink("/patient/profile"));
                        setOpen(false);
                      }}
                    >
                      <FaUser />
                      My Profile
                    </button>

                    <button
                      className="modern-dropdown-item"
                      onClick={() => {
                        navigate(getLink("/patient/change-password"));
                        setOpen(false);
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
                   localStorage.clear();
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