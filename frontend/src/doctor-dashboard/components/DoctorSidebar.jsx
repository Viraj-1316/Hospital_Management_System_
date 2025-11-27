import React, { useState } from "react";
import { Collapse } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../images/Logo.png";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaCalendarCheck,
  FaUserInjured,
  FaListAlt,
  FaFileInvoice,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

export default function DoctorSidebar({ open = true }) {
  const expandedWidth = 250;
  const collapsedWidth = 64;

  const [isEncountersOpen, setIsEncountersOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 text-primary " +
    (isActive ? "active" : "");

  return (
    <>
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
          width: open ? expandedWidth : collapsedWidth,
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
        {/* Logo */}
        <div className="d-flex align-items-center mb-4">
          <img src={logo} alt="Logo" width="30" height="30" />
          {open && <h4 className="m-0 fw-bold text-primary ms-2">One Care</h4>}
        </div>

        <ul className="nav nav-pills flex-column">
          <li className="nav-item mb-2">
            <NavLink to="/doctor-dashboard" className={linkClass}>
              <FaTachometerAlt style={{ minWidth: 20 }} /> {open && "Dashboard"}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/doctor/appointments" className={linkClass}>
              <FaCalendarAlt style={{ minWidth: 20 }} /> {open && "Appointments"}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <div
              className="nav-link d-flex align-items-center gap-2 text-primary"
              style={{ cursor: "pointer", justifyContent: "space-between" }}
              onClick={() => setIsEncountersOpen(!isEncountersOpen)}
            >
              <div className="d-flex align-items-center gap-2">
                <FaCalendarCheck style={{ minWidth: 20 }} />
                {open && <span>Encounters</span>}
              </div>
              {open && (isEncountersOpen ? <FaChevronUp /> : <FaChevronDown />)}
            </div>

            {open && (
              <Collapse in={isEncountersOpen}>
                <ul className="nav flex-column ms-3">
                  <li className="nav-item mb-2">
                    <NavLink to="/doctor/encounters" className={linkClass}>
                      <FaListAlt style={{ minWidth: 20 }} />
                      <span>Encounter List</span>
                    </NavLink>
                  </li>
                  <li className="nav-item mb-2">
                    <NavLink to="/doctor/encounter-templates" className={linkClass}>
                      <FaCalendarAlt style={{ minWidth: 20 }} />
                      <span>Encounter Templates</span>
                    </NavLink>
                  </li>
                </ul>
              </Collapse>
            )}
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/doctor/patients" className={linkClass}>
              <FaUserInjured style={{ minWidth: 20 }} /> {open && "Patients"}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/doctor/services" className={linkClass}>
              <FaListAlt style={{ minWidth: 20 }} /> {open && "Services"}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/doctor/billing" className={linkClass}>
              <FaFileInvoice style={{ minWidth: 20 }} /> {open && "Billing records"}
            </NavLink>
          </li>

          <li className="nav-item mb-2 mt-auto">
            <NavLink to="/doctor/settings" className={linkClass}>
              <IoMdSettings style={{ minWidth: 20 }} /> {open && "Settings"}
            </NavLink>
          </li>
        </ul>
        
        <div
          style={{
            marginTop: "auto",
            padding: 12,
            fontSize: 12,
            color: "#6c757d",
            textAlign: !open ? "center" : "left"
          }}
        >
          {open ? "© One Care" : "©"}
        </div>
      </div>
    </>
  );
}
