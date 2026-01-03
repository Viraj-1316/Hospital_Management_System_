import React from "react";
import AdminLayout from "../layouts/AdminLayout";
import PatientsContent from "../../components/dashboard-shared/PatientsContent";

const Patients = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <PatientsContent basePath="/admin" />
    </AdminLayout>
  );
};

export default Patients;
