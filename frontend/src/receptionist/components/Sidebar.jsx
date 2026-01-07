// src/receptionist-dashboard/components/ReceptionistSidebar.jsx
import React, { useState } from "react";
import { Collapse } from "react-bootstrap";
import defaultLogo from "../images/Logo.png";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserInjured,
  FaPhone,
  FaClipboardList,
  FaChevronDown,
  FaCheckCircle,
  FaClock,
  FaFileInvoice
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../styles/ReceptionistModern.css";

export default function ReceptionistSidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `receptionist-nav-link ${isActive ? "active" : ""}`;

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const receptionist = JSON.parse(localStorage.getItem("receptionist") || "{}");
  const clinicName = authUser.clinic || receptionist.clinic || "Clinic";
  const clinicLogo = authUser.clinicLogo || receptionist.clinicLogo;

  // Construct the clinic logo URL from uploads folder if available
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const logoSrc = clinicLogo ? `${API_BASE}/uploads/${clinicLogo}` : defaultLogo;

  return (
    <div
      className="receptionist-sidebar d-flex flex-column vh-100"
      style={{
        width: collapsed ? collapsedWidth : expandedWidth,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 1000,
        marginTop: "70px" // Account for navbar height
      }}
    >
      {/* Logo / title */}
      <div className="receptionist-sidebar-logo">
        <img src={logoSrc} alt="Clinic Logo" style={{ borderRadius: 10 }} />
        {!collapsed && <h4>{clinicName}</h4>}
      </div>

      {/* Menu items */}
      <ul className="receptionist-nav" style={{ overflowY: "auto", flex: 1 }}>
        {/* Dashboard */}
        <li className="receptionist-nav-item">
          <NavLink to="/receptionist/dashboard" className={linkClass} end>
            <span className="receptionist-nav-icon">
              <FaTachometerAlt />
            </span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        {/* Appointments with Submenu */}
        <li className="receptionist-nav-item">
          <div
            className={`receptionist-nav-link receptionist-nav-toggle ${
              isAppointmentsOpen ? "open" : ""
            }`}
            onClick={() => setIsAppointmentsOpen(!isAppointmentsOpen)}
            style={{ cursor: "pointer" }}
          >
            <span className="receptionist-nav-icon">
              <FaCalendarAlt />
            </span>
            {!collapsed && (
              <>
                <span>Appointments</span>
                <span className="toggle-icon">
                  <FaChevronDown />
                </span>
              </>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isAppointmentsOpen}>
              <ul className="receptionist-submenu">
                <li className="receptionist-nav-item">
                  <NavLink
                    to="/receptionist/appointments"
                    className={linkClass}
                  >
                    <span className="receptionist-nav-icon">
                      <FaListAlt />
                    </span>
                    <span>All Appointments</span>
                  </NavLink>
                </li>
                <li className="receptionist-nav-item">
                  <NavLink
                    to="/receptionist/appointments-today"
                    className={linkClass}
                  >
                    <span className="receptionist-nav-icon">
                      <FaClock />
                    </span>
                    <span>Today's Appointments</span>
                  </NavLink>
                </li>
                <li className="receptionist-nav-item">
                  <NavLink
                    to="/receptionist/appointments-pending"
                    className={linkClass}
                  >
                    <span className="receptionist-nav-icon">
                      <FaCheckCircle />
                    </span>
                    <span>Pending Confirmations</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* Patients with Submenu */}
        <li className="receptionist-nav-item">
          <div
            className={`receptionist-nav-link receptionist-nav-toggle ${
              isPatientsOpen ? "open" : ""
            }`}
            onClick={() => setIsPatientsOpen(!isPatientsOpen)}
            style={{ cursor: "pointer" }}
          >
            <span className="receptionist-nav-icon">
              <FaUserInjured />
            </span>
            {!collapsed && (
              <>
                <span>Patients</span>
                <span className="toggle-icon">
                  <FaChevronDown />
                </span>
              </>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isPatientsOpen}>
              <ul className="receptionist-submenu">
                <li className="receptionist-nav-item">
                  <NavLink
                    to="/receptionist/patients"
                    className={linkClass}
                  >
                    <span className="receptionist-nav-icon">
                      <FaListAlt />
                    </span>
                    <span>Patient List</span>
                  </NavLink>
                </li>
                <li className="receptionist-nav-item">
                  <NavLink
                    to="/receptionist/patients/new"
                    className={linkClass}
                  >
                    <span className="receptionist-nav-icon">
                      <FaUserInjured />
                    </span>
                    <span>Register Patient</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* Contact Management */}
        <li className="receptionist-nav-item">
          <NavLink to="/receptionist/contacts" className={linkClass}>
            <span className="receptionist-nav-icon">
              <FaPhone />
            </span>
            {!collapsed && <span>Contact Directory</span>}
          </NavLink>
        </li>

        {/* Call Logs */}
        <li className="receptionist-nav-item">
          <NavLink to="/receptionist/call-logs" className={linkClass}>
            <span className="receptionist-nav-icon">
              <FaClipboardList />
            </span>
            {!collapsed && <span>Call Logs</span>}
          </NavLink>
        </li>

        {/* Billing Records */}
        <li className="receptionist-nav-item">
          <NavLink to="/receptionist/billing" className={linkClass}>
            <span className="receptionist-nav-icon">
              <FaFileInvoice />
            </span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        {/* Settings */}
        <li className="receptionist-nav-item">
          <NavLink to="/receptionist/settings" className={linkClass}>
            <span className="receptionist-nav-icon">
              <IoMdSettings />
            </span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      <div className="receptionist-sidebar-footer">
        {!collapsed ? "© 2024 One Care" : "©"}
      </div>
    </div>
  );
}