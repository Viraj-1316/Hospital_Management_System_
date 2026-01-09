import React from "react";
import Sidebar from "../receptionist/components/Sidebar";
import Navbar from "../receptionist/components/Navbar";
import AppointmentsContent from "../components/dashboard-shared/AppointmentsContent";
import "../admin-dashboard/styles/admin-shared.css"; // Import shared styles for components

const ReceptionistAppoitment = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div
        className="flex-grow-1 main-content-transition"
        style={{ marginLeft: sidebarCollapsed ? 64 : 250, minHeight: "100vh" }}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        {/* Shared Content Component */}
        <AppointmentsContent basePath="/clinic-dashboard" />
      </div>
    </div>
  );
};

export default ReceptionistAppoitment;