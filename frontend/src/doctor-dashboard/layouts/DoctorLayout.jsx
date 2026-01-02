import React, { useState, useEffect } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import DoctorNavbar from "../components/DoctorNavbar";
import "../styles/DoctorLayout.css";
import "../styles/doctorsidebar.css"; 

import PageTransition from "../../components/PageTransition";

export default function DoctorLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };
  const closeMobileDrawer = () => setMobileOpen(false);
  return (
    <div className="doctor-layout d-flex flex-column min-vh-100">
      <div 
        className={`backdrop ${mobileOpen ? "show" : ""}`} 
        onClick={closeMobileDrawer}
      />
      <div className={`sidebar-drawer ${mobileOpen ? "open" : ""}`}>
        <DoctorSidebar open={!sidebarCollapsed} />
      </div>
      <div className={`doctor-main ${sidebarCollapsed ? "closed" : "open"}`}>        
        <DoctorNavbar onToggle={handleToggle} /> 
        <div className="doctor-content p-4">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}