import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/ReceptionistLayout.css";
import PageTransition from "../../components/PageTransition";

const ReceptionistLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) setMobileOpen(false);
  };

  return (
    <div className="d-flex bg-light min-vh-100">
      {/* Sidebar Wrapper */}
      <div
        className={`sidebar-wrapper ${isMobile ? "mobile-drawer" : ""} ${
          mobileOpen ? "open" : ""
        }`}
      >
        <Sidebar collapsed={isMobile ? false : sidebarCollapsed} />
      </div>

      {/* Backdrop for Mobile */}
      {isMobile && (
        <div
          className={`backdrop ${mobileOpen ? "show" : ""}`}
          onClick={closeMobileSidebar}
        />
      )}

      {/* Main Content Area */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: isMobile ? 0 : sidebarCollapsed ? "72px" : "260px",
          transition: "margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        {/* Navbar inside content flow, but normally configured as sticky in component CSS */}
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="p-4 flex-grow-1">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistLayout;
