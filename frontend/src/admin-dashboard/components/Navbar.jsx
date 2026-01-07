import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaUser, FaLock, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";
import "../../shared/styles/ModernUI.css";

const Navbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: "Admin", avatar: "" });
  const menuRef = useRef();
  const navigate = useNavigate();

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userId = authUser?.id;

  // Fetch admin profile on mount
  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      setProfileData({
        name: authUser?.name || "System Admin",
        avatar: ""
      });
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRole = authUser?.role;
      const endpoint = userRole === 'admin' ? `${API_BASE}/api/admin/${userId}` : `${API_BASE}/api/user/${userId}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name || "Admin",
          avatar: data.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
    }
  };

  // close dropdown on outside click
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
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  const letter = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  return (
    <nav className="modern-navbar">
      {/* Left section */}
      <div className="modern-navbar-left">
        <button className="modern-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1 className="modern-navbar-title">One Care Admin</h1>
      </div>

      {/* Right section */}
      <div className="modern-navbar-right">
        {/* Profile dropdown */}
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
              <button
                className="modern-dropdown-item"
                onClick={() => {
                  navigate("/admin/profile");
                  setOpen(false);
                }}
              >
                <FaUser />
                My Profile
              </button>

              <button
                className="modern-dropdown-item"
                onClick={() => {
                  navigate("/admin/change-password");
                  setOpen(false);
                }}
              >
                <FaLock />
                Change Password
              </button>

              <button
                className="modern-dropdown-item danger"
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

export default Navbar;
