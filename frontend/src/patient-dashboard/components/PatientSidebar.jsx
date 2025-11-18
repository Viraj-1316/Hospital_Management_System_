
import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaFileInvoice, FaChartBar } from "react-icons/fa";
import logo from "../images/Logo.png";
import "../styles/PatientSidebar.css";

export default function PatientSidebar({ isOpen = true }) {
  const item = (to, Icon, label) => (
    <li className="nav-item">
      <NavLink
        to={to}
        className={({ isActive }) =>
          isActive
            ? "nav-link active d-flex align-items-center gap-2"
            : "nav-link d-flex align-items-center gap-2"
        }
      >
        <Icon className="icon" />
        {isOpen && <span>{label}</span>}
      </NavLink>
    </li>
  );

  return (
    <aside className={`patient-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <img src={logo} width={30} alt="logo" />
        {isOpen && <h4 className="title">OneCare</h4>}
      </div>

      <ul className="nav flex-column">
        {/* {item("/patient-dashboard", FaHome, "Home")} */}
        {item("/patient-dashboard", FaTachometerAlt, "Dashboard")}
        {item("/patient/appointments", FaCalendarAlt, "Appointments")}  {/* <-- fixed path */}
        {item("/patient/encounters", FaClipboardList, "Encounters")}
        {item("/patient/billing", FaFileInvoice, "Billing records")}
        {item("/patient/reports", FaChartBar, "Reports")}
      </ul>
    </aside>
  );
}
