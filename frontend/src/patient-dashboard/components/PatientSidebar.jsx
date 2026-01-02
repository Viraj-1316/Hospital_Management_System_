import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaFileInvoice,
  FaChartBar
} from "react-icons/fa";
import logo from "../images/Logo.png";

export default function PatientSidebar({ isOpen = true }) {
  const widthExpanded = 250;
  const widthCollapsed = 64;

  const linkClass = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 " +
    (isActive ? "active" : "text-primary");

  return (
    <aside className={`patient-sidebar ${isOpen ? "open" : "closed"} d-flex flex-column vh-100`}>
      {/* LOGO + TITLE */}
      <div className="d-flex align-items-center mb-4 px-2">
        <img src={logo} alt="Logo" width="30" height="30" />
        <h4 className={`m-0 fw-bold text-primary ms-2 title-text ${isOpen ? "show" : "hide"}`}>One Care</h4>
      </div>

      {/* MENU */}
      <ul className="nav nav-pills flex-column flex-grow-1">
        <li className="nav-item mb-2">
          <NavLink to="/patient-dashboard" className={linkClass}>
            <div className="icon-wrapper"><FaTachometerAlt /></div>
            <span className={`link-text ${isOpen ? "show" : "hide"}`}>Dashboard</span>
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/patient/appointments" className={linkClass}>
            <div className="icon-wrapper"><FaCalendarAlt /></div>
            <span className={`link-text ${isOpen ? "show" : "hide"}`}>Appointments</span>
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/patient/encounters" className={linkClass}>
            <div className="icon-wrapper"><FaClipboardList /></div>
            <span className={`link-text ${isOpen ? "show" : "hide"}`}>Encounters</span>
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/patient/billing" className={linkClass}>
            <div className="icon-wrapper"><FaFileInvoice /></div>
            <span className={`link-text ${isOpen ? "show" : "hide"}`}>Billing Records</span>
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/patient/reports" className={linkClass}>
            <div className="icon-wrapper"><FaChartBar /></div>
            <span className={`link-text ${isOpen ? "show" : "hide"}`}>Reports</span>
          </NavLink>
        </li>
      </ul>

      {/* FOOTER */}
      <div className="sidebar-footer mt-auto p-2 text-center text-muted small">
        {isOpen ? "© One Care" : "©"}
      </div>
    </aside>
  );
}
