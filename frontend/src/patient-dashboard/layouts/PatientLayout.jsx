// src/layouts/PatientLayout.jsx
import React from "react";
import PatientSidebar from "../components/PatientSidebar";
import PatientNavbar from "../components/PatientNavbar";
import "../styles/PatientSidebar.css";
import "../styles/PatientNavbar.css";

import PageTransition from "../../components/PageTransition";

export default function PatientLayout({
  children,
  sidebarCollapsed,
  toggleSidebar,
}) {
  return (
    <div className="patient-layout d-flex" style={{ background: "#f5f7fb" }}>

      {/* Mobile Overlay - Close sidebar when clicking outside */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-overlay d-md-none"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <PatientSidebar isOpen={!sidebarCollapsed} />

      <div className={`patient-main ${sidebarCollapsed ? 'expanded' : ''}`}>

        {/* Top blue navbar */}
        <PatientNavbar toggleSidebar={toggleSidebar} />

        <div
          className="patient-content-wrapper"
          style={{
            padding: "0px",
          }}
        >
          <div
            className="content-card shadow-sm"
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              minHeight: "85vh" // Ensure card takes reasonable height
            }}
          >
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
    </div>
  );
}
