// src/admin-dashboard/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import axios from "axios";
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
  FaFileInvoice,
  FaChevronDown,
  FaCreditCard,
  FaClipboardList
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import API_BASE from "../../config";
import "../../shared/styles/ModernUI.css";

export default function Sidebar({ collapsed = false }) {
  const expandedWidth = 260;
  const collapsedWidth = 72;
  const [isEncountersOpen, setIsEncountersOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending clinic registrations count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const res = await axios.get(
          `${API_BASE}/api/clinic-registration?status=Pending&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.data.success && res.data.counts) {
          setPendingCount(res.data.counts.pending || 0);
        }
      } catch (error) {
        // Silently fail - user may not have admin access
        console.log("Could not fetch pending registrations count");
      }
    };
    
    fetchPendingCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = ({ isActive }) =>
    `modern-nav-link ${isActive ? "active" : ""}`;

  // Badge style
  const badgeStyle = {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "10px",
    marginLeft: "auto",
    minWidth: "20px",
    textAlign: "center"
  };

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
      {/* Logo / title */}
      <div className="modern-sidebar-logo">
        <img 
          src={logo} 
          alt="Logo" 
          style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} 
        />
        {!collapsed && <h4 className="text-truncate" style={{maxWidth: "180px"}}>One Care</h4>}
      </div>

      {/* Menu items */}
      <ul className="modern-nav" style={{ overflowY: "auto", flex: 1 }}>
        <li className="modern-nav-item">
          <NavLink to="/admin-dashboard" className={linkClass} end>
            <span className="modern-nav-icon"><FaTachometerAlt /></span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/appointments" className={linkClass}>
            <span className="modern-nav-icon"><FaCalendarAlt /></span>
            {!collapsed && <span>Appointments</span>}
          </NavLink>
        </li>

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
                  <NavLink to="/encounter-list" className={linkClass}>
                    <span className="modern-nav-icon"><FaListAlt /></span>
                    <span>Encounter List</span>
                  </NavLink>
                </li>
                <li className="modern-nav-item">
                  <NavLink to="/encounter-templates" className={linkClass}>
                    <span className="modern-nav-icon"><FaCalendarAlt /></span>
                    <span>Templates</span>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          )}
        </li>

        <li className="modern-nav-item">
          <NavLink to="/clinic-list" className={linkClass}>
            <span className="modern-nav-icon"><FaClinicMedical /></span>
            {!collapsed && <span>Clinic</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/clinic-registrations" className={linkClass} style={{ display: "flex", alignItems: "center" }}>
            <span className="modern-nav-icon"><FaClipboardList /></span>
            {!collapsed && (
              <>
                <span>Clinic Registrations</span>
                {pendingCount > 0 && (
                  <span style={badgeStyle}>{pendingCount}</span>
                )}
              </>
            )}
            {collapsed && pendingCount > 0 && (
              <span style={{ 
                ...badgeStyle, 
                position: "absolute", 
                top: "4px", 
                right: "8px",
                fontSize: "9px",
                padding: "1px 4px"
              }}>{pendingCount}</span>
            )}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/patients" className={linkClass}>
            <span className="modern-nav-icon"><FaUserInjured /></span>
            {!collapsed && <span>Patients</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/doctors" className={linkClass}>
            <span className="modern-nav-icon"><FaUserMd /></span>
            {!collapsed && <span>Doctors</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/receptionists" className={linkClass}>
            <span className="modern-nav-icon"><FaUsers /></span>
            {!collapsed && <span>Receptionist</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/services" className={linkClass}>
            <span className="modern-nav-icon"><FaListAlt /></span>
            {!collapsed && <span>Services</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/DoctorSession" className={linkClass}>
            <span className="modern-nav-icon"><FaCalendarCheck /></span>
            {!collapsed && <span>Doctor Sessions</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/taxes" className={linkClass}>
            <span className="modern-nav-icon"><FaMoneyBill /></span>
            {!collapsed && <span>Taxes</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/BillingRecords" className={linkClass}>
            <span className="modern-nav-icon"><FaFileInvoice /></span>
            {!collapsed && <span>Billing Records</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/payment-reports" className={linkClass}>
            <span className="modern-nav-icon"><FaCreditCard /></span>
            {!collapsed && <span>Payment Reports</span>}
          </NavLink>
        </li>

        <li className="modern-nav-item">
          <NavLink to="/settings" className={linkClass}>
            <span className="modern-nav-icon"><IoMdSettings /></span>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      <div className="modern-sidebar-footer">
        {!collapsed ? "© 2025 One Care" : "©"}
      </div>
    </div>
  );
}
