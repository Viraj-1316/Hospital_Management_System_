import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/AdminLayout.css";
import PageTransition from "../../components/PageTransition";

const AdminLayout = ({ children, sidebarCollapsed = false, toggleSidebar }) => {
  // Mobile drawer state remains local
  const [isOpen, setIsOpen] = useState(false);

  // Mobile drawer toggles
  const toggleMobileSidebar = () => setIsOpen((s) => !s);
  const closeMobileSidebar = () => setIsOpen(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  // Pass sidebarCollapsed to children (optional, but consistent with previous logic)
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { sidebarCollapsed, toggleSidebar });
    }
    return child;
  });

  const handleToggle = () => {
    if (window.innerWidth <= 768) {
      toggleMobileSidebar();
    } else {
      if (toggleSidebar && typeof toggleSidebar === 'function') {
        toggleSidebar();
      } else {
        console.warn("toggleSidebar prop is missing or not a function in AdminLayout");
      }
    }
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Mobile Drawer Wrapper - ONLY on mobile */}
      <div className={`sidebar-drawer d-md-none ${isOpen ? "open" : ""}`}>
        <Sidebar collapsed={false} />
      </div>

      {/* Overlay for mobile - ONLY on mobile */}
      <div
        className={`backdrop d-md-none ${isOpen ? "show" : ""}`}
        onClick={closeMobileSidebar}
      />

      {/* Desktop Sidebar (Always visible on desktop) */}
      <div className="d-none d-md-block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main Content Wrapper */}
      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 72 : 260,
          minHeight: "100vh",
          transition: "margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          width: "auto"
        }}
      >
        {/* Navbar */}
        <Navbar toggleSidebar={handleToggle} />

        {/* Page Content */}
        <div className="content-container p-4">
          <PageTransition>
            {childrenWithProps}
          </PageTransition>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;