import React from "react";
import Sidebar from "../receptionist/components/Sidebar";
import Navbar from "../receptionist/components/Navbar";
import SharedEncounterList from "../components/Encounter/SharedEncounterDetails";

export default function ReceptionistEncounterList({ sidebarCollapsed, toggleSidebar }) {
  // Get clinic info from localStorage for auto-locking clinic selection
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const clinicName = authUser?.clinicName || "";

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
        <SharedEncounterList role="receptionist" clinicName={clinicName} />
      </div>
    </div>
  );
}
