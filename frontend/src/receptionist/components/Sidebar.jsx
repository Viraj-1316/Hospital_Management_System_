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
  FaListAlt,
  FaUserMd,
  FaList,
  FaRegCalendarAlt,
  FaFileInvoice,
  FaCreditCard
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import axios from "axios";
import API_BASE from "../../config";

// Import Shared Modern Styles
import "../../shared/styles/ModernUI.css";

// Default logo fallback
const defaultLogo = "https://via.placeholder.com/40"; 

export default function ReceptionistSidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;
  
  // State for collapsible menus
  const [isEncountersOpen, setIsEncountersOpen] = useState(false);

  // State for clinic details
  const [clinicDetails, setClinicDetails] = useState({
    name: "Clinic",
    logo: defaultLogo
  });

  // API Base URL
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- STYLING START ---
  
  // Base style for all nav items
  const navItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px", 
    width: "calc(100% - 24px)", // Width minus margins to creates the rounded floating look
    margin: "4px 12px",         // Margins to separate items
    padding: "12px 16px",
    borderRadius: "8px",        // Rounded corners as per screenshot
    textDecoration: "none",
    color: "#64748b",           // Default gray text color
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    fontSize: "15px"
  };

  // Active state style (Solid Blue Background)
  const activeStyle = {
    ...navItemStyle,
    background: "#0d6efd",      // Bootstrap Primary Blue
    color: "#ffffff",           // White text
    boxShadow: "0 4px 6px -1px rgba(13, 110, 253, 0.3)" // Subtle shadow
  };

  // --- STYLING END ---

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
 

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
      className="modern-sidebar d-flex flex-column"
      style={{
        width: collapsed ? collapsedWidth : expandedWidth,
        position: "fixed",
        top: 0,             // Removed gap (was 64px)
        left: 0,
        bottom: 0,
        height: "100vh",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 1050        // High z-index to stay above other content
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
      {/* Added marginBottom to increase gap above footer */}
      <ul className="modern-nav" style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "30px", overflowY: "auto", flex: 1 }}>
        
        {/* 1. Dashboard */}
        <li>
          <NavLink 
            to="/reception-dashboard" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
            end
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaTachometerAlt /></span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        {/* 2. Appointments */}
        <li>
          <NavLink 
            to="/reception-dashboard/appointments" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaCalendarAlt /></span>
            {!collapsed && <span>Appointments</span>}
          </NavLink>
        </li>

        {/* 3. Encounters (Dropdown) */}
        <li>
          <div
            onClick={() => setIsEncountersOpen(!isEncountersOpen)}
            style={{ ...navItemStyle, justifyContent: "space-between" }} // Use basic style for parent, managed manually
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px", display: "flex" }}><FaClipboardList /></span>
              {!collapsed && <span>Encounters</span>}
            </div>
            {!collapsed && (
              <span style={{ fontSize: "12px", display: "flex" }}>
                <FaChevronDown style={{ transform: isEncountersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </span>
            )}
          </div>

          {!collapsed && (
            <Collapse in={isEncountersOpen}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>
                  <NavLink 
                    to="/reception-dashboard/encounters" 
                    style={({ isActive }) => ({ 
                        ...navItemStyle, 
                        width: "calc(100% - 40px)",
                        margin: "4px 20px",
                        padding: "10px 16px",
                        fontSize: "14px", 
                        background: isActive ? "#eff6ff" : "transparent", // Submenu uses light blue instead of solid
                        color: isActive ? "#0d6efd" : "#64748b" 
                    })}
                    end
                  >
                    <span style={{ marginRight: "10px" }}><FaListAlt /></span>
                    <span>Encounter List</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/reception-dashboard/encounters/templates" 
                    style={({ isActive }) => ({ 
                        ...navItemStyle, 
                        width: "calc(100% - 40px)",
                        margin: "4px 20px",
                        padding: "10px 16px",
                        fontSize: "14px", 
                        background: isActive ? "#eff6ff" : "transparent",
                        color: isActive ? "#0d6efd" : "#64748b"
                    })}
                  >
                    <span style={{ marginRight: "10px" }}><FaRegCalendarAlt /></span>
                    <span>Encounter Templates</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        {/* 4. Patients */}
        <li>
          <NavLink 
            to="/receptionist-dashboard/patients" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaUserInjured /></span>
            {!collapsed && <span>Patients</span>}
          </NavLink>
        </li>

        {/* 5. Doctors */}
        <li>
          <NavLink 
            to="/reception-dashboard/doctors" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaUserMd /></span>
            {!collapsed && <span>Doctors</span>}
          </NavLink>
        </li>

        {/* 6. Services */}
        <li>
          <NavLink 
            to="/reception-dashboard/services" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaList /></span>
            {!collapsed && <span>Services</span>}
          </NavLink>
        </li>

        {/* 7. Billing Records */}
        <li>
          <NavLink 
            to="/reception-dashboard/billing" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaFileInvoice /></span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        {/* 8. Payment Reports */}
        <li>
          <NavLink 
            to="/reception-dashboard/payment-reports" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><FaCreditCard /></span>
            {!collapsed && <span>Payment Reports</span>}
          </NavLink>
        </li>

        {/* 9. Settings */}
        <li style={{ marginTop: "auto" }}> {/* Push Settings to bottom if preferred, or keep natural flow */}
          <NavLink 
            to="/receptionist-dashboard/settings" 
            style={({ isActive }) => (isActive ? activeStyle : navItemStyle)}
          >
            <span style={{ fontSize: "18px", display: "flex" }}><IoMdSettings /></span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      <div style={{ padding: "16px", textAlign: "center", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#94a3b8" }}>
        {!collapsed ? `© ${currentYear} ${clinicDetails.name}` : "©"}
      </div>
    </div>
  );
}