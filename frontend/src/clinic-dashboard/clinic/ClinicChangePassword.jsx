import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChangePasswordForm from "../../common/ChangePasswordForm";

const AdminChangePassword = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          minHeight: "100vh",
          backgroundColor: "#f8f9fa", 
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid py-5">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;
