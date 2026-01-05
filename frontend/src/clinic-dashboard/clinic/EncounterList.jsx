import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SharedEncounterList from "../../components/Encounter/SharedEncounterList";

export default function EncounterList({ sidebarCollapsed, toggleSidebar }) {
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
        <SharedEncounterList role="admin" clinicName={clinicName} />
      </div>
    </div>
  );
}
