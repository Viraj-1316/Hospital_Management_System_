// src/pages/reception/ReceptionDashboard.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaUserFriends,
  FaUserMd,
  FaStethoscope,
  FaFileInvoiceDollar,
  FaCog,
  FaCalendarCheck,
  FaDollarSign,
} from "react-icons/fa";

import "./styles/reception.css";

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const displayName = authUser?.name || "Receptionist";

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    toast.success("Logged out successfully");
    navigate("/"); // change to "/login" if your login route is different
  };

  return (
    <div className="rc-wrapper">
      {/* ========== SIDEBAR ========== */}
      <aside className="rc-sidebar">
        <div className="rc-sidebar-logo">
          <span className="rc-logo-text">OneCare</span>
        </div>

        <nav className="rc-menu">
          <NavLink
            to="/reception"
            end
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaTachometerAlt />
            </span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/reception/appointments"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaCalendarAlt />
            </span>
            <span>Appointments</span>
          </NavLink>

          <NavLink
            to="/reception/encounters"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaClipboardList />
            </span>
            <span>Encounters</span>
          </NavLink>

          <NavLink
            to="/reception/patients"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaUserFriends />
            </span>
            <span>Patients</span>
          </NavLink>

          <NavLink
            to="/reception/doctors"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaUserMd />
            </span>
            <span>Doctors</span>
          </NavLink>

          <NavLink
            to="/reception/services"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaStethoscope />
            </span>
            <span>Services</span>
          </NavLink>

          <NavLink
            to="/reception/billing-records"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaFileInvoiceDollar />
            </span>
            <span>Billing records</span>
          </NavLink>

          <NavLink
            to="/reception/settings"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaCog />
            </span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>

      {/* ========== MAIN AREA (TOP NAV + DASHBOARD) ========== */}
      <div className="rc-main">
        {/* TOP NAVBAR (blue bar like doctor) */}
        <header className="rc-topbar">
          <div className="rc-top-left">
            <span className="rc-top-title">Reception Dashboard</span>
          </div>

          <div className="rc-top-right">
            <div
              className="rc-profile"
              onClick={() => setShowProfileMenu((v) => !v)}
            >
              <div className="rc-profile-avatar">
                {displayName?.charAt(0)?.toUpperCase() || "R"}
              </div>
              <div className="rc-profile-text">
                <div className="rc-profile-name">{displayName}</div>
                <div className="rc-profile-role">Receptionist</div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="rc-profile-menu">
                <button onClick={() => navigate("/receptionist/profile")}>
                  My profile
                </button>
                <button
                  onClick={() => navigate("/reception/change-password")}
                >
                  Change password
                </button>
                <button className="rc-logout" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="rc-content">
          {/* ===== TOP ROW STATS ===== */}
          <div className="row g-3 mb-3">
            {/* PATIENTS */}
            <div className="col-md-3">
              <div className="card rc-stat-card">
                <div className="card-body d-flex align-items-center">
                  <div className="rc-stat-icon patients me-3">
                    <FaUserFriends />
                  </div>
                  <div>
                    <div className="rc-stat-label">PATIENTS</div>
                    <div className="rc-stat-value">1</div>
                    <div className="rc-stat-sub">Total visited patients</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DOCTORS */}
            <div className="col-md-3">
              <div className="card rc-stat-card">
                <div className="card-body d-flex align-items-center">
                  <div className="rc-stat-icon doctors me-3">
                    <FaUserMd />
                  </div>
                  <div>
                    <div className="rc-stat-label">TOTAL DOCTORS</div>
                    <div className="rc-stat-value">1</div>
                    <div className="rc-stat-sub">Total clinic doctors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* APPOINTMENTS */}
            <div className="col-md-3">
              <div className="card rc-stat-card">
                <div className="card-body d-flex align-items-center">
                  <div className="rc-stat-icon appointments me-3">
                    <FaCalendarCheck />
                  </div>
                  <div>
                    <div className="rc-stat-label">
                      TOTAL BOOKED APPOINTMENTS
                    </div>
                    <div className="rc-stat-value">0</div>
                    <div className="rc-stat-sub">Total clinic appointments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* REVENUE */}
            <div className="col-md-3">
              <div className="card rc-stat-card">
                <div className="card-body d-flex align-items-center">
                  <div className="rc-stat-icon revenue me-3">
                    <FaDollarSign />
                  </div>
                  <div>
                    <div className="rc-stat-label">TOTAL REVENUE</div>
                    <div className="rc-stat-value">$0/-</div>
                    <div className="rc-stat-sub">Total clinic revenue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APPOINTMENT + CALENDAR CARD */}
          <div className="card rc-appointment-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Appointment</h6>
                <button className="btn btn-sm btn-outline-primary">
                  + Apply filters
                </button>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <button className="btn btn-sm btn-dark me-1">&lt;</button>
                  <button className="btn btn-sm btn-dark">&gt;</button>
                </div>

                <div className="fw-semibold">November 2025</div>

                <div>
                  <button className="btn btn-sm btn-light me-1">Today</button>
                  <button className="btn btn-sm btn-dark me-1">Month</button>
                  <button className="btn btn-sm btn-light me-1">Day</button>
                  <button className="btn btn-sm btn-light">Week</button>
                </div>
              </div>

              <div className="rc-calendar">
                <div className="rc-cal-header">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
                <div className="rc-cal-body">
                  {[0, 1, 2, 3, 4].map((row) => (
                    <div className="rc-cal-row" key={row}>
                      {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                        <div className="rc-cal-cell" key={col}></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
