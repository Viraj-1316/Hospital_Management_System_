// src/clinic-dashboard/components/Sidebar.jsx
import React, { useState } from "react";
import { Collapse } from "react-bootstrap";
import defaultLogo from "../images/Logo.png";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserInjured,
  FaUserMd,
  FaUsers,
  FaListAlt,
  FaCalendarCheck,
  FaMoneyBill,
  FaFileInvoice,
  FaChevronDown,
  FaUserCheck
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../styles/ClinicModern.css";

export default function Sidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;
  const [isEncountersOpen, setIsEncountersOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `clinic-nav-link ${isActive ? "active" : ""}`;

  const authUser = JSON.parse(localStorage.getItem('authUser')) || {};
  const clinicName = authUser.clinicName || "Clinic Dashboard";
  const clinicLogo = authUser.clinicLogo;

  // Construct the clinic logo URL from uploads folder if available
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const logoSrc = clinicLogo ? `${API_BASE}/uploads/${clinicLogo}` : defaultLogo;

  return (
    <div
      className="clinic-sidebar d-flex flex-column vh-100"
      style={{
        width: collapsed ? collapsedWidth : expandedWidth,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 1000
      }}
    >
      {/* Logo / title */}
      <div className="clinic-sidebar-logo">
        <img src={logoSrc} alt="Clinic Logo" style={{ borderRadius: 10 }} />
        {!collapsed && <h4>{clinicName}</h4>}
      </div>

      {/* Menu items */}
      <ul className="clinic-nav" style={{ overflowY: "auto", flex: 1 }}>
        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard" className={linkClass} end>
            <span className="clinic-nav-icon"><FaTachometerAlt /></span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/appointments" className={linkClass}>
            <span className="clinic-nav-icon"><FaCalendarAlt /></span>
            {!collapsed && <span>Appointments</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <div
            className={`clinic-nav-link clinic-nav-toggle ${isEncountersOpen ? 'open' : ''}`}
            onClick={() => setIsEncountersOpen(!isEncountersOpen)}
          >
            <span className="clinic-nav-icon"><FaCalendarCheck /></span>
            {!collapsed && (
              <>
                <span>Encounters</span>
                <span className="toggle-icon"><FaChevronDown /></span>
              </>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isEncountersOpen}>
              <ul className="clinic-submenu">
                <li className="clinic-nav-item">
                  <NavLink to="/clinic-dashboard/encounter-list" className={linkClass}>
                    <span className="clinic-nav-icon"><FaListAlt /></span>
                    <span>Encounter List</span>
                  </NavLink>
                </li>
                <li className="clinic-nav-item">
                  <NavLink to="/clinic-dashboard/encounter-templates" className={linkClass}>
                    <span className="clinic-nav-icon"><FaCalendarAlt /></span>
                    <span>Templates</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/patients" className={linkClass}>
            <span className="clinic-nav-icon"><FaUserInjured /></span>
            {!collapsed && <span>Patients</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/doctors" className={linkClass}>
            <span className="clinic-nav-icon"><FaUserMd /></span>
            {!collapsed && <span>Doctors</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/receptionists" className={linkClass}>
            <span className="clinic-nav-icon"><FaUsers /></span>
            {!collapsed && <span>Receptionist</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/pending-approvals" className={linkClass}>
            <span className="clinic-nav-icon"><FaUserCheck /></span>
            {!collapsed && <span>Pending Approvals</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/services" className={linkClass}>
            <span className="clinic-nav-icon"><FaListAlt /></span>
            {!collapsed && <span>Services</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/DoctorSession" className={linkClass}>
            <span className="clinic-nav-icon"><FaCalendarCheck /></span>
            {!collapsed && <span>Doctor Sessions</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/taxes" className={linkClass}>
            <span className="clinic-nav-icon"><FaMoneyBill /></span>
            {!collapsed && <span>Taxes</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/BillingRecords" className={linkClass}>
            <span className="clinic-nav-icon"><FaFileInvoice /></span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        <li className="clinic-nav-item">
          <NavLink to="/clinic-dashboard/settings" className={linkClass}>
            <span className="clinic-nav-icon"><IoMdSettings /></span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      <div className="clinic-sidebar-footer">
        {!collapsed ? "© 2024 One Care" : "©"}
      </div>
    </div>
  );
}
