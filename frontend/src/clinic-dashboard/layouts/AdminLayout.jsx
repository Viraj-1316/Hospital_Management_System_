import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/AdminLayout.css";

import PageTransition from "../../components/PageTransition";

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((s) => !s);
  const closeSidebar = () => setIsOpen(false);

  // Prevent body scrolling when drawer is open (nice UX)
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  return (
    <div className="d-flex flex-column">
      {/* Top navbar (stays visible) */}
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Sidebar drawer overlays EVERYTHING (including navbar) */}
      <div className={`sidebar-drawer ${isOpen ? "open" : ""}`}>
        <Sidebar />
      </div>

      {/* Click backdrop to close */}
      <div
        className={`backdrop ${isOpen ? "show" : ""}`}
        onClick={closeSidebar}
      />

      {/* Page content */}
      <div className="content-container p-4">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
};

export default AdminLayout;
