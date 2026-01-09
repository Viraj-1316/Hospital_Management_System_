// src/receptionist-dashboard/components/ReceptionistSidebar.jsx
import React, { useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserInjured,
  FaClipboardList,
  FaChevronDown,
  FaCheckCircle,
  FaClock,
  FaFileInvoice,
  FaListAlt,
  FaUserMd, 
  FaList, 
  FaRegCalendarAlt 
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import axios from "axios";

// Import Shared Modern Styles
import "../../shared/styles/ModernUI.css";

// Define or Import a default logo
const defaultLogo = "https://via.placeholder.com/40"; 

export default function Sidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72; 
  
  // State for collapsible menus
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);
  const [isEncountersOpen, setIsEncountersOpen] = useState(false);

  // State for clinic details
  const [clinicDetails, setClinicDetails] = useState({
    name: "Clinic",
    logo: defaultLogo
  });

  // Helper for active class based on ModernUI.css
  const linkClass = ({ isActive }) =>
    `modern-nav-link ${isActive ? "active" : ""}`;

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  // Get API Base URL
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchReceptionistDetails = async () => {
      try {
        const userId = authUser.id || authUser._id;
        if (!userId) return;
        
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/receptionists/${userId}`, {
             headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data.data;
        if (data && data.clinicIds && data.clinicIds.length > 0) {
            // clinicIds is populated with { _id, name, clinicLogo }
            const clinic = data.clinicIds[0];
            setClinicDetails({
                name: clinic.name || "Clinic",
                logo: clinic.clinicLogo ? `${API_BASE}/uploads/${clinic.clinicLogo}` : defaultLogo
            });
        }
      } catch (err) {
        console.error("Error fetching receptionist clinic details:", err);
      }
    };

    fetchReceptionistDetails();
  }, [authUser.id, authUser._id, API_BASE]);

  const currentYear = new Date().getFullYear();

  return (
    <div
      className="modern-sidebar d-flex flex-column vh-100"
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
      {/* Logo / Title */}
      <div className="modern-sidebar-logo">
        <img 
          src={clinicDetails.logo} 
          alt="Clinic Logo" 
          style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
          onError={(e) => { e.target.onerror = null; e.target.src = defaultLogo; }} 
        />
        {!collapsed && <h4 className="text-truncate" style={{maxWidth: "180px"}}>{clinicDetails.name}</h4>}
      </div>

      {/* Menu Items */}
      <ul className="modern-nav" style={{ overflowY: "auto", flex: 1 }}>
        
        {/* 1. Dashboard */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard" className={linkClass} end>
            <span className="modern-nav-icon">
              <FaTachometerAlt />
            </span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        {/* 2. Appointments Dropdown */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard/appointments" className={linkClass}>
            <span className="clinic-nav-icon"><FaCalendarAlt /></span>
            {!collapsed && <span>Appointments</span>}
          </NavLink>
        </li>

        {/* 3. Encounters Dropdown */}
        <li className="modern-nav-item">
          <div
            className={`modern-nav-link modern-nav-toggle ${isEncountersOpen ? "open" : ""}`}
            onClick={() => setIsEncountersOpen(!isEncountersOpen)}
          >
            <span className="modern-nav-icon">
              <FaClipboardList />
            </span>
            {!collapsed && (
              <>
                <span>Encounters</span>
                <span className="toggle-icon">
                  <FaChevronDown />
                </span>
              </>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isEncountersOpen}>
              <ul className="modern-submenu">
                <li className="modern-nav-item">
                  <NavLink to="/reception-dashboard/encounters" className={linkClass} end>
                    <span className="modern-nav-icon"><FaListAlt /></span>
                    <span>Encounter List</span>
                  </NavLink>
                </li>
                <li className="modern-nav-item">
                  <NavLink to="/reception-dashboard/encounters/templates" className={linkClass}>
                    <span className="modern-nav-icon"><FaRegCalendarAlt /></span>
                    <span>Encounter Templates</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* 4. Patients Dropdown */}
        <li className="modern-nav-item">
          <div
            className={`modern-nav-link modern-nav-toggle ${isPatientsOpen ? "open" : ""}`}
            onClick={() => setIsPatientsOpen(!isPatientsOpen)}
          >
            <span className="modern-nav-icon">
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
              <ul className="modern-submenu">
                <li className="modern-nav-item">
                  <NavLink to="/reception-dashboard/patients" className={linkClass} end>
                    <span className="modern-nav-icon"><FaListAlt /></span>
                    <span>Patient List</span>
                  </NavLink>
                </li>
                <li className="modern-nav-item">
                  <NavLink to="/reception-dashboard/patients/new" className={linkClass}>
                    <span className="modern-nav-icon"><FaUserInjured /></span>
                    <span>Register Patient</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* 5. Doctors */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard/doctors" className={linkClass}>
            <span className="modern-nav-icon"><FaUserMd /></span>
            {!collapsed && <span>Doctors</span>}
          </NavLink>
        </li>

        {/* 6. Services - Updated Icon to FaList */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard/services" className={linkClass}>
            <span className="modern-nav-icon"><FaList /></span>
            {!collapsed && <span>Services</span>}
          </NavLink>
        </li>

        {/* 7. Billing Records */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard/billing" className={linkClass}>
            <span className="modern-nav-icon"><FaFileInvoice /></span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        {/* 8. Settings */}
        <li className="modern-nav-item">
          <NavLink to="/reception-dashboard/settings" className={linkClass}>
            <span className="modern-nav-icon"><IoMdSettings /></span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      <div className="modern-sidebar-footer">
        {!collapsed ? `© ${currentYear} ${clinicDetails.name}` : "©"}
      </div>
    </div>
  );
}