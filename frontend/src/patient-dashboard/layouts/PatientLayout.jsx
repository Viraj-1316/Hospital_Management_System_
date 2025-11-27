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
    <div className="patient-layout d-flex" style={{ background: "#f5f7fb"  }}>
      {/* Sidebar width changes based on collapse state */}
      <PatientSidebar isOpen={!sidebarCollapsed} />

      <div
        className="patient-main"
        style={{
          flexGrow: 1,
          // shifts screen when sidebar opens/closes
          marginLeft: sidebarCollapsed ? "64px" : "250px",
          transition: "margin-left 0.25s ease",
          backgroundColor: "#f5f7fb",
          minHeight: "100vh",
          paddingLeft: "0px",
        }}
      >
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
              padding: "25px",
              borderRadius: "8px",
            }}
          >
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
    </div>
  );
}
