import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaBell, FaUserMd, FaUserNurse } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import admin from "../images/admin.png";
import API_BASE from "../../config";

const Navbar = ({ toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const menuRef = useRef();
  const notificationRef = useRef();
  const navigate = useNavigate();

  // Get authUser from localStorage for displaying admin name
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const adminName = authUser?.name || authUser?.clinicName || "Clinic Admin";

  // Fetch pending approvals for notifications
  const fetchPendingApprovals = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requests = res.data.pendingRequests || [];
      setPendingApprovals(requests);
      setNotificationCount(requests.length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setPendingApprovals([]);
      setNotificationCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchPendingApprovals();
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
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
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
            {/* Red dot indicator */}
            {notificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#dc3545",
                  borderRadius: "50%",
                  border: "2px solid #0d6efd"
                }}
              />
            )}
          </button>

          {notificationOpen && (
            <div
              className="position-absolute bg-white rounded shadow-lg"
              style={{
                right: 0,
                top: "100%",
                marginTop: "8px",
                minWidth: "320px",
                maxWidth: "380px",
                zIndex: 1050
              }}
            >
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-primary">
                  Notifications
                  {notificationCount > 0 && (
                    <span className="badge bg-danger ms-2">{notificationCount}</span>
                  )}
                </h6>
              </div>

              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {loadingNotifications ? (
                  <div className="p-3 text-center text-muted">
                    <small>Loading...</small>
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <div style={{ fontSize: "32px", opacity: 0.5 }}>✅</div>
                    <small>No pending approvals</small>
                  </div>
                ) : (
                  pendingApprovals.slice(0, 5).map((request) => (
                    <div
                      key={request._id}
                      className="p-3 border-bottom d-flex align-items-start gap-3"
                      style={{ cursor: "pointer", transition: "background 0.2s" }}
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/clinic-dashboard/pending-approvals");
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${request.role === "doctor" ? "bg-primary" : "bg-info"
                          } bg-opacity-10`}
                        style={{ width: "40px", height: "40px", flexShrink: 0 }}
                      >
                        {request.role === "doctor" ? (
                          <FaUserMd className="text-primary" />
                        ) : (
                          <FaUserNurse className="text-info" />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {request.name}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`badge ${request.role === "doctor" ? "bg-primary" : "bg-info"} bg-opacity-75`} style={{ fontSize: "10px" }}>
                            {request.role === "doctor" ? "Doctor" : "Staff"}
                          </span>
                          <small className="text-muted" style={{ fontSize: "11px" }}>
                            {formatTimeAgo(request.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {pendingApprovals.length > 0 && (
                <div
                  className="p-3 text-center border-top"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate("/clinic-dashboard/pending-approvals");
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <small className="text-primary fw-semibold">
                    View All Pending Approvals →
                  </small>
                </div>
              )}
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

