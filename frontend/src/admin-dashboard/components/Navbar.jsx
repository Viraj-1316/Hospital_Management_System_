import React, { useState, useRef, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import admin from "../images/admin.png";

const Navbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const menuRef = useRef();
  const navigate = useNavigate();

  // Load user name from localStorage
  useEffect(() => {
    const authUserStr = localStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr);
        if (authUser.name) {
          setUserName(authUser.name);
        }
      } catch (err) {
        // Failed to parse authUser from localStorage - using default name
        console.debug("Could not parse authUser:", err);
      }
    }
  }, []);

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
        <h4 className="text-white fw-bold mb-0">One Care Admin</h4>
      </div>

      {/* right (profile + dropdown) */}
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
          <span className="text-white ms-2 fw-semibold">{userName}</span>
        </div>

        {open && (
          <div className="admin-dropdown">
            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/admin/profile");
                setOpen(false);
              }}
            >
              <i className="fa fa-user"></i>
              My Profile
            </button>

            <button
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => {
                navigate("/admin/change-password");
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
    </nav>
  );
};

export default Navbar;
