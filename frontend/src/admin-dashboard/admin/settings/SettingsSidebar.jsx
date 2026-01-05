import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaSms,
  FaVideo,
  FaList,
  FaCrown,
  FaCreditCard,
  FaCalendarCheck,
} from "react-icons/fa";
import { SiGooglemeet, SiZoom } from "react-icons/si";

const SettingsSidebar = () => {
  const menuItems = [
    { label: "Holidays", path: "/settings/holidays", icon: <FaCalendarAlt /> },
    { label: "Email Template", path: "/settings/email-templates", icon: <FaEnvelope /> },
    { label: "SMS/WhatsApp Template", path: "/settings/sms-whatsapp-templates", icon: <FaSms /> },
    { label: "Google Meet", path: "/settings/google-meet", icon: <SiGooglemeet /> },
    { label: "Zoom Telemed", path: "/settings/zoom-telemed", icon: <SiZoom /> },
    { label: "Listings", path: "/settings/listings", icon: <FaList /> },
    { label: "Pro Settings", path: "/settings/pro-settings", icon: <FaCrown /> },
    { label: "Payments", path: "/settings/payments", icon: <FaCreditCard /> },
    { label: "Appointment Settings", path: "/settings/appointment-settings", icon: <FaCalendarCheck /> },
  ];

  return (
    <div className="card shadow-sm border-0 h-100 ms-3">
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${
                  isActive ? "active-setting" : "text-secondary"
                }`
              }
              style={({ isActive }) => ({
                borderLeft: isActive ? "4px solid #0d6efd" : "4px solid transparent",
                backgroundColor: isActive ? "#f8f9fa" : "transparent",
                color: isActive ? "#0d6efd" : "inherit",
                fontWeight: isActive ? "600" : "400",
              })}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;
