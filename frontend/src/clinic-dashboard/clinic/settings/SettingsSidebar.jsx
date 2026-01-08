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
  FaFileInvoice,
} from "react-icons/fa";
import { SiGooglemeet, SiZoom } from "react-icons/si";

const SettingsSidebar = () => {
  const menuItems = [
    { label: "Holidays", path: "/clinic-dashboard/settings/holidays", icon: <FaCalendarAlt /> },
    { label: "Billing Settings", path: "/clinic-dashboard/settings/billing", icon: <FaFileInvoice /> },
    { label: "Listings", path: "/clinic-dashboard/settings/listings", icon: <FaList /> },
  ];

  return (
    <div className="card shadow-sm border-0 h-20 ms-3">
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${isActive ? "active-setting" : "text-secondary"
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
