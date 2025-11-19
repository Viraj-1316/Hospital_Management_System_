import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import "./settings.css";

import PdfTemplate from "./PdfTemplate/PdfTemplate";

const Settings = ({ sidebarCollapsed, toggleSidebar }) => {
  const [activeMenu, setActiveMenu] = useState("pdf-template");

  const renderContent = () => {
    switch (activeMenu) {
      case "pdf-template":
        return <PdfTemplate />;
      default:
        return (
          <div className="coming-soon-box">
            Coming soon...
          </div>
        );
    }
  };

  return (
    <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <div className="settings-container">

        {/* LEFT MENU */}
        <div className="settings-sidebar">
          <div
            className={activeMenu === "general" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("general")}
          >
            General Settings
          </div>

          <div
            className={activeMenu === "holidays" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("holidays")}
          >
            Holidays
          </div>

          <div
            className={activeMenu === "config" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("config")}
          >
            Configurations
          </div>

          <div
            className={activeMenu === "appconfig" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("appconfig")}
          >
            App Configurations
          </div>

          <div
            className={activeMenu === "email" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("email")}
          >
            Email Template
          </div>

          <div
            className={activeMenu === "sms" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("sms")}
          >
            SMS / WhatsApp Template
          </div>

          <div
            className={activeMenu === "webhooks" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("webhooks")}
          >
            Webhooks
          </div>

          <div
            className={activeMenu === "forms" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("forms")}
          >
            Custom Form
          </div>

          <div
            className={activeMenu === "chart" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("chart")}
          >
            Encounter Body Chart
          </div>

          <div
            className={activeMenu === "patient" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("patient")}
          >
            Patient Setting
          </div>

          <div
            className={activeMenu === "widget" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("widget")}
          >
            Widget Setting
          </div>

          <div
            className={activeMenu === "pdf-template" ? "settings-item active" : "settings-item"}
            onClick={() => setActiveMenu("pdf-template")}
          >
            PDF Template
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="settings-content">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
