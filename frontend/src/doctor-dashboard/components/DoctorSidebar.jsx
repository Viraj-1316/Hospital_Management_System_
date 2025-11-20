import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../images/Logo.png";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaCalendarCheck,
  FaUserInjured,
  FaListAlt,
  FaFileInvoice
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../styles/DoctorSidebar.css";

const DoctorSidebar = ({ open = true }) => {
  const [encountersOpen, setEncountersOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    isActive
      ? "nav-link active d-flex align-items-center gap-2"
      : "nav-link text-primary d-flex align-items-center gap-2";

  return (
    <div
      className={`doctor-sidebar d-flex flex-column vh-100 p-3 ${open ? "open" : "closed"}`}
      style={{
        backgroundColor: "#fff",
        borderRight: "1px solid #ddd",
      }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center mb-4 doctor-brand">
        <img src={logo} alt="Logo" width="30" height="30" />
        {open && <h4 className="m-0 fw-bold text-primary ms-2">OneCare</h4>}
      </div>

      <ul className="nav nav-pills flex-column">
        <li className="nav-item mb-2">
          <NavLink to="../doctor-dashboard" className={linkClass}>
            <FaTachometerAlt /> {open && "Dashboard"}
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/doctor/appointments" className={linkClass}>
            <FaCalendarAlt /> {open && "Appointments"}
          </NavLink>
        </li>

     
        <li className="nav-item mb-2">
          <button
            type="button"
            className={`nav-link ${open ? "" : "justify-center"} d-flex align-items-center gap-2 encounter-toggle`}
            onClick={() => setEncountersOpen(v => !v)}
            style={{ border: "none", background: "transparent", width: "100%", textAlign: "left" }}
          >
            <FaCalendarCheck />
            {open && <span className="flex-grow-1">Encounters</span>}
            {open && <span style={{ marginLeft: "auto" }}>{encountersOpen ? "▾" : "▸"}</span>}
          </button>

          {/* submenu */}
          <ul className={`encounter-submenu list-unstyled ps-3 mt-2 ${encountersOpen ? "open" : ""}`}>
            <li className="mb-1">
              <NavLink to="/doctor/encounters/list" className={({ isActive }) => isActive ? "sub-link active" : "sub-link"}>
                {open ? "Encounter List" : "List"}
              </NavLink>
            </li>
          </ul>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/doctor/patients" className={linkClass}>
            <FaUserInjured /> {open && "Patients"}
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/doctor/services" className={linkClass}>
            <FaListAlt /> {open && "Services"}
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink to="/doctor/billing" className={linkClass}>
            <FaFileInvoice /> {open && "Billing records"}
          </NavLink>
        </li>

        <li className="nav-item mb-2 mt-auto">
          <NavLink to="/doctor/settings" className={linkClass}>
            <IoMdSettings /> {open && "Settings"}
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default DoctorSidebar;
