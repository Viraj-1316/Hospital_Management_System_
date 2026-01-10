import React from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import SharedServices from "../components/Shared/SharedServices";

/* ---------- Main Services Component ---------- */
export default function Services({ sidebarCollapsed = false, toggleSidebar }) {
  // Get clinic info from localStorage for auto-detecting clinic
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const clinicInfo = {
    clinicName: authUser?.clinicName || "",
    clinicId: authUser?.clinicId || authUser?.id || ""
  };

  const currentYear = new Date().getFullYear();
  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-grow-1 main-content-transition" style={{ marginLeft: sidebarCollapsed ? 64 : 250, transition: "margin-left 0.3s ease", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <SharedServices isDoctor={false} isClinic={true} clinicInfo={clinicInfo} />
      </div>
    </div>
    
  );
}