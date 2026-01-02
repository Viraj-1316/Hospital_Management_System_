import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/AdminLayout.css";
import PageTransition from "../../components/PageTransition";

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((s) => !s);
  const closeSidebar = () => setIsOpen(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  return (
    <div className="d-flex flex-column">
      {/* Navbar receives toggle function */}
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Drawer Wrapper: Controls visibility via CSS classes */}
      <div className={`sidebar-drawer ${isOpen ? "open" : ""}`}>
        {/* Sidebar Component: Now fills the drawer */}
        <Sidebar collapsed={false} /> 
      </div>

      {/* Overlay: Visible only when isOpen is true on mobile */}
      <div
        className={`backdrop ${isOpen ? "show" : ""}`}
        onClick={closeSidebar}
      />

      {/* Main Content */}
      <div className="content-container">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
};

export default AdminLayout;