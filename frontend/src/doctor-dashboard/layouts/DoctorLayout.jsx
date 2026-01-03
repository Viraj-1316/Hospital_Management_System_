import React, { useState } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import DoctorNavbar from "../components/DoctorNavbar";
import "../styles/DoctorLayout.css";
// import "../styles/doctorsidebar.css"; // Comment this out to prevent conflicts

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
    // CHANGE 1: Changed 'flex-column' to 'flex-row' to fix the Big Gap
    // CHANGE 2: Added 'w-100' and 'overflow-hidden' to contain the layout
    <div className="doctor-layout d-flex flex-row min-vh-100 w-100 overflow-hidden">
      
      {/* This is the Backdrop (Overlay). 
         onClick={closeMobileDrawer} ensures sidebar closes when you click the background.
      */}
      <div 
        className={`backdrop ${mobileOpen ? "show" : ""}`} 
        onClick={closeMobileDrawer}
      />

      {/* Sidebar Wrapper */}
      <div className={`sidebar-drawer ${mobileOpen ? "open" : ""}`}>
        <DoctorSidebar open={!sidebarCollapsed} />
      </div>

      {/* Main Content Area */}
      <div className={`doctor-main ${sidebarCollapsed ? "closed" : "open"}`}>        
        <DoctorNavbar onToggle={handleToggle} /> 
        
        {/* Added overflow-auto so only this part scrolls */}
        <div className="doctor-content p-4 flex-grow-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}