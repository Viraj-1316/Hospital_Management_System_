import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SharedEncounterDetails from "../../components/Encounter/SharedEncounterDetails";

export default function EncounterDetails({ sidebarCollapsed, toggleSidebar }) {
  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div
        className="flex-grow-1 main-content-transition fade-in"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "250px",
          minHeight: "100vh",
          background: "#f5f6fa",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <SharedEncounterDetails role="admin" />
      </div>
    </div>
  );
}
