import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AppointmentsContent from "../../components/dashboard-shared/AppointmentsContent";
import "../../shared/styles/shared-components.css"; // Import shared styles for components

const Appointments = ({ sidebarCollapsed, toggleSidebar }) => {
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

export default Appointments;