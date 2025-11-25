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
    <>
      {/* Internal CSS (same as Admin Sidebar) */}
      <style>
        {`
          .nav-pills .nav-link {
            padding: 12px 16px;
            border-radius: 10px;
            font-weight: 500;
          }
          .nav-pills .nav-link.active {
            background-color: #0d6efd !important;
            color: #fff !important;
            font-weight: 600 !important;
          }
          .nav-pills .nav-link.active svg {
            color: #fff !important;
          }
        `}
      </style>

      <aside
        className="d-flex flex-column vh-100 p-3"
        style={{
          width: isOpen ? widthExpanded : widthCollapsed,
          backgroundColor: "#fff",
          borderRight: "1px solid #ddd",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          overflow: "hidden",
          transition: "width 180ms ease",
          zIndex: 1000
        }}
      >
        {/* LOGO + TITLE */}
        <div className="d-flex align-items-center mb-4">
          <img src={logo} alt="Logo" width="30" height="30" />
          {isOpen && (
            <h4 className="m-0 fw-bold text-primary ms-2">One Care</h4>
          )}
        </div>
        
        {/* MENU */}
        <ul className="nav nav-pills flex-column">
          <li className="nav-item mb-2">
            <NavLink to="/patient-dashboard" className={linkClass}>
              <FaTachometerAlt style={{ minWidth: 20 }} />
              {isOpen && <span>Dashboard</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/patient/appointments" className={linkClass}>
              <FaCalendarAlt style={{ minWidth: 20 }} />
              {isOpen && <span>Appointments</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/patient/encounters" className={linkClass}>
              <FaClipboardList style={{ minWidth: 20 }} />
              {isOpen && <span>Encounters</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/patient/billing" className={linkClass}>
              <FaFileInvoice style={{ minWidth: 20 }} />
              {isOpen && <span>Billing Records</span>}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/patient/reports" className={linkClass}>
              <FaChartBar style={{ minWidth: 20 }} />
              {isOpen && <span>Reports</span>}
            </NavLink>
          </li>
        </ul>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "auto",
            padding: 12,
            fontSize: 12,
            color: "#6c757d",
            textAlign: isOpen ? "left" : "center"
          }}
        >
          {isOpen ? "© One Care" : "©"}
        </div>
      </aside>
    </>
  );
}
