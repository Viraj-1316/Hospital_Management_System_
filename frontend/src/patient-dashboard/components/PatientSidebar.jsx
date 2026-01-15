import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaFileInvoice,
  FaChartBar
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import axios from "axios";
import API_BASE from "../../config";

// Import Shared Modern Styles
import "../../shared/styles/ModernUI.css";

// Default Placeholder if no logo found
const defaultLogo = "https://via.placeholder.com/40"; 

export default function PatientSidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;

  // State for clinic details
  const [clinicDetails, setClinicDetails] = useState({
    name: "Clinic",
    logo: defaultLogo
  });

  // Get API Base URL


  useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        // Read patient data from the 'patient' localStorage key (not 'authUser')
        const patientData = JSON.parse(localStorage.getItem("patient") || "{}");
        
        // First, set clinic name from patient data immediately (no API needed)
        if (patientData.clinic) {
          setClinicDetails(prev => ({ ...prev, name: patientData.clinic }));
        }

        // If we have a clinicId, fetch full clinic details for logo
        const clinicId = patientData.clinicId;
        if (clinicId) {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/clinics/${clinicId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const clinic = res.data.clinic; // Backend returns { success: true, clinic: {...} }
          if (clinic) {
            setClinicDetails({
              name: clinic.name || patientData.clinic || "Clinic",
              logo: clinic.clinicLogo ? `${API_BASE}/uploads/${clinic.clinicLogo}` : defaultLogo
            });
          }
        }
      } catch (err) {
        console.error("Error fetching clinic details:", err);
        // Keep the fallback name from patient data
      }
    };

    fetchClinicDetails();
  }, [API_BASE]);

  const currentYear = new Date().getFullYear();

  // Helper for active class based on ModernUI.css
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

      {/* Menu Items */}
      <ul className="modern-nav" style={{ overflowY: "auto", flex: 1 }}>
        {(() => {
          const subdomain = localStorage.getItem("clinicSubdomain");
          const getLink = (path) => subdomain ? `/c/${subdomain}${path}` : path;
          
          return (
            <>
              {/* 1. Dashboard */}
              <li className="modern-nav-item">
                <NavLink to={getLink("/patient-dashboard")} className={linkClass} end>
                  <span className="modern-nav-icon">
                    <FaTachometerAlt />
                  </span>
                  {!collapsed && <span>Dashboard</span>}
                </NavLink>
              </li>

              {/* 2. Appointments */}
              <li className="modern-nav-item">
                <NavLink to={getLink("/patient/appointments")} className={linkClass}>
                  <span className="modern-nav-icon">
                    <FaCalendarAlt />
                  </span>
                  {!collapsed && <span>Appointments</span>}
                </NavLink>
              </li>

              {/* 3. Encounters */}
              <li className="modern-nav-item">
                <NavLink to={getLink("/patient/encounters")} className={linkClass}>
                  <span className="modern-nav-icon">
                    <FaClipboardList />
                  </span>
                  {!collapsed && <span>Encounters</span>}
                </NavLink>
              </li>

              {/* 4. Billing Records */}
              <li className="modern-nav-item">
                <NavLink to={getLink("/patient/billing")} className={linkClass}>
                  <span className="modern-nav-icon">
                    <FaFileInvoice />
                  </span>
                  {!collapsed && <span>Billing Records</span>}
                </NavLink>
              </li>

              {/* 5. Reports */}
              <li className="modern-nav-item">
                <NavLink to={getLink("/patient/reports")} className={linkClass}>
                  <span className="modern-nav-icon">
                    <FaChartBar />
                  </span>
                  {!collapsed && <span>Reports</span>}
                </NavLink>
              </li>
            </>
          );
        })()}
      </ul>

      {/* Footer */}
      <div className="modern-sidebar-footer">
        {!collapsed ? `© ${currentYear} ${clinicDetails.name}` : "©"}
      </div>
    </div>
  );
}
