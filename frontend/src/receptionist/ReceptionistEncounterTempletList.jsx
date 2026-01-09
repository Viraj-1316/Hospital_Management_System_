import React from "react";
import Sidebar from "../receptionist/components/Sidebar";
import Navbar from "../receptionist/components/Navbar";
import SharedEncounterTemplateList from "../components/Encounter/SharedEncounterTemplateList";

export default function EncounterTemplateList({ sidebarCollapsed, toggleSidebar }) {
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
        <SharedEncounterTemplateList role="admin" />
      </div>
    </div>
  );
}
