// src/receptionist-dashboard/layouts/ReceptionistLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ReceptionistNavbar from "../components/Navbar";
import ReceptionistSidebar from "../components/Sidebar";
import PageTransition from "../../components/PageTransition"; 
// Make sure to import the new Modern CSS we created
import "../styles/ReceptionistModern.css"; 

const ReceptionLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="receptionist-layout">
      {/* Navbar (Includes Profile & Notification Logic) */}
      <ReceptionistNavbar toggleSidebar={toggleSidebar} />

      {/* Sidebar (Includes Navigation Links) */}
      <ReceptionistSidebar collapsed={sidebarCollapsed} />

      {/* Main Content Area */}
      <main 
        className={`receptionist-main-content ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div className="content-container">
          {/* Keep your existing PageTransition wrapper */}
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

export default ReceptionLayout;