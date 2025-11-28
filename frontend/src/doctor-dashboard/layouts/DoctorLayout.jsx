// src/layouts/DoctorLayout.jsx
import React, { useState } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import DoctorNavbar from "../components/DoctorNavbar";
import "../styles/DoctorLayout.css";

export default function DoctorLayout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="doctor-layout d-flex">

      {/* Sidebar */}
      <div
        className="doctor-sidebar-container"
        style={{
          width: open ? "240px" : "0px",
          transition: "0.2s ease",
          overflow: "hidden",
          borderRight: "none",
        }}
      >
        <DoctorSidebar open={open} />
      </div>

      {/* Main */}
      <div className="doctor-main flex-grow-1">
        <DoctorNavbar onToggle={() => setOpen(!open)} open={open} />
        <div className="doctor-content">{children}</div>
      </div>

    </div>
  );
}
