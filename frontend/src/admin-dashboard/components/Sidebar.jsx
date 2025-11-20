// src/components/Sidebar.jsx
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../images/Logo.png";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaClinicMedical,
  FaUserInjured,
  FaUserMd,
  FaUsers,
  FaListAlt,
  FaCalendarCheck,
  FaMoneyBill,
  FaFileInvoice
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

export default function Sidebar({ collapsed = false }) {
  const expandedWidth = 250;
  const collapsedWidth = 64;

  const linkClass = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 text-primary " + (isActive ? "active" : "");

  return (
    <>
      {/* FIX: Make active text white so it doesn't disappear */}
      <style>
        {`
          .nav-pills .nav-link.active {
            background-color: #0d6efd !important;
            color: #fff !important;
            font-weight: 600;
          }
          .nav-pills .nav-link.active svg {
            color: #fff !important;
          }
        `}
      </style>

      <div
        className="d-flex flex-column vh-100 p-3"
        style={{
          width: collapsed ? collapsedWidth : expandedWidth,
          backgroundColor: "#fff",
          borderRight: "1px solid #ddd",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          transition: "width 180ms ease",
          overflow: "hidden",
          zIndex: 1000
        }}
      >
        {/* Logo / title */}
        <div className="d-flex align-items-center mb-4">
          <img src={logo} alt="Logo" width="30" height="30" />
          {!collapsed && <h4 className="m-0 fw-bold text-primary ms-2">One Care</h4>}
        </div>

        {/* Menu items */}
        <ul className="nav nav-pills flex-column">
          <li className="nav-item mb-2">
            <NavLink to="/admin-dashboard" className={linkClass}>
              <FaTachometerAlt style={{ minWidth: 20 }} />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/appointments" className={linkClass}>
              <FaCalendarAlt style={{ minWidth: 20 }} />
              {!collapsed && <span>Appointments</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/encounters" className={linkClass}>
              <FaCalendarCheck style={{ minWidth: 20 }} />
              {!collapsed && <span>Encounters</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/clinic-list" className={linkClass}>
              <FaClinicMedical style={{ minWidth: 20 }} />
              {!collapsed && <span>Clinic</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/patients" className={linkClass}>
              <FaUserInjured style={{ minWidth: 20 }} />
              {!collapsed && <span>Patients</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/doctors" className={linkClass}>
              <FaUserMd style={{ minWidth: 20 }} />
              {!collapsed && <span>Doctors</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/receptionist" className={linkClass}>
              <FaUsers style={{ minWidth: 20 }} />
              {!collapsed && <span>Receptionist</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/services" className={linkClass}>
              <FaListAlt style={{ minWidth: 20 }} />
              {!collapsed && <span>Services</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/DoctorSession" className={linkClass}>
              <FaCalendarCheck style={{ minWidth: 20 }} />
              {!collapsed && <span>Doctor Sessions</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/taxes" className={linkClass}>
              <FaMoneyBill style={{ minWidth: 20 }} />
              {!collapsed && <span>Taxes</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/BillingRecords" className={linkClass}>
              <FaFileInvoice style={{ minWidth: 20 }} />
              {!collapsed && <span>Billing Records</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/settings" className={linkClass}>
              <IoMdSettings style={{ minWidth: 20 }} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>

        <div
          style={{
            marginTop: "auto",
            padding: 12,
            fontSize: 12,
            color: "#6c757d",
            textAlign: collapsed ? "center" : "left"
          }}
        >
          {!collapsed ? "© One Care" : "©"}
        </div>
      </div>
    </>
  );
}
