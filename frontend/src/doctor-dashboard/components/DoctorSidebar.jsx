import React, { useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import { IoMdSettings } from "react-icons/io";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaCalendarCheck,
  FaUserInjured,
  FaListAlt,
  FaFileInvoice,
  FaChevronDown
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "../../shared/styles/ModernUI.css";

// Default Placeholder if no logo found
const defaultLogo = "https://via.placeholder.com/40";

export default function DoctorSidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;

  const [isEncountersOpen, setIsEncountersOpen] = useState(false);

  // State for clinic details
  const [clinicDetails, setClinicDetails] = useState({
    name: "Clinic",
    logo: defaultLogo
  });

  // Get API Base URL
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        // Read doctor data from the 'doctor' localStorage key
        const doctorData = JSON.parse(localStorage.getItem("doctor") || "{}");
        
        // First, set clinic name from doctor data immediately (no API needed)
        if (doctorData.clinicName || doctorData.clinic) {
          setClinicDetails(prev => ({ ...prev, name: doctorData.clinicName || doctorData.clinic }));
        }

        // If we have a clinicId, fetch full clinic details for logo
        const clinicId = doctorData.clinicId;
        if (clinicId) {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/clinics/${clinicId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const clinic = res.data.clinic; // Backend returns { success: true, clinic: {...} }
          if (clinic) {
            setClinicDetails({
              name: clinic.name || doctorData.clinicName || doctorData.clinic || "Clinic",
              logo: clinic.clinicLogo ? `${API_BASE}/uploads/${clinic.clinicLogo}` : defaultLogo
            });
          }
        }
      } catch (err) {
        console.error("Error fetching clinic details:", err);
        // Keep the fallback name from doctor data
      }
    };

    fetchClinicDetails();
  }, [API_BASE]);

  const currentYear = new Date().getFullYear();

  const linkClass = ({ isActive }) =>
    `modern-nav-link ${isActive ? "active" : ""}`;

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

      <ul className="modern-nav" style={{ overflowY: "auto", flex: 1 }}>
        {/* 1. Dashboard */}
        <li className="modern-nav-item">
          <NavLink to="/doctor-dashboard" className={linkClass} end>
            <span className="modern-nav-icon"><FaTachometerAlt /></span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        {/* 2. Appointments */}
        <li className="modern-nav-item">
          <NavLink to="/doctor/appointments" className={linkClass}>
            <span className="modern-nav-icon"><FaCalendarAlt /></span>
            {!collapsed && <span>Appointments</span>}
          </NavLink>
        </li>

        {/* 3. Encounters Dropdown */}
        <li className="modern-nav-item">
          <div
            className={`modern-nav-link modern-nav-toggle ${isEncountersOpen ? 'open' : ''}`}
            onClick={() => setIsEncountersOpen(!isEncountersOpen)}
          >
            <span className="modern-nav-icon"><FaCalendarCheck /></span>
            {!collapsed && (
              <>
                <span>Encounters</span>
                <span className="toggle-icon"><FaChevronDown /></span>
              </>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isEncountersOpen}>
              <ul className="modern-submenu">
                <li className="modern-nav-item">
                  <NavLink to="/doctor/encounters" className={linkClass}>
                    <span className="modern-nav-icon"><FaListAlt /></span>
                    <span>Encounter List</span>
                  </NavLink>
                </li>
                <li className="modern-nav-item">
                  <NavLink to="/doctor/encounter-templates" className={linkClass}>
                    <span className="modern-nav-icon"><FaCalendarAlt /></span>
                    <span>Templates</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* 4. Patients */}
        <li className="modern-nav-item">
          <NavLink to="/doctor/patients" className={linkClass}>
            <span className="modern-nav-icon"><FaUserInjured /></span>
            {!collapsed && <span>Patients</span>}
          </NavLink>
        </li>

        {/* 5. Services */}
        <li className="modern-nav-item">
          <NavLink to="/doctor/services" className={linkClass}>
            <span className="modern-nav-icon"><FaListAlt /></span>
            {!collapsed && <span>Services</span>}
          </NavLink>
        </li>

        {/* 6. Billing Records */}
        <li className="modern-nav-item">
          <NavLink to="/doctor/billing" className={linkClass}>
            <span className="modern-nav-icon"><FaFileInvoice /></span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        {/* 7. Settings */}
        <li className="modern-nav-item">
          <NavLink to="/doctor/settings" className={linkClass}>
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
