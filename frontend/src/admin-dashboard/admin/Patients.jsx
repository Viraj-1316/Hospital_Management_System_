import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PatientsContent from "../../components/dashboard-shared/PatientsContent";
import "../styles/admin-shared.css";

const Patients = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <div>
      {/* SIDEBAR */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* MAIN CONTENT */}
      <div
        className="main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "250px",
          minHeight: "100vh",
          background: "#f5f6fa",
        }}
      >
        {/* NAVBAR */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* SHARED CONTENT */}
        <PatientsContent basePath="/admin" />
      </div>
    </div>
  );
};

export default Patients;
