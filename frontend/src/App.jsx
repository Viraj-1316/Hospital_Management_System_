import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";
import { setFavicon } from "./utils/setFavicon.js";

/* Auth */
import Login from "./auth/Login";
import Signup from "./auth/Signup";

/* Admin */
import AdminDashboard from "./admin-dashboard/admin/AdminDashboard";
import AddPatient from "./admin-dashboard/admin/AddPatient";
import Patients from "./admin-dashboard/admin/Patients";
import Doctors from "./admin-dashboard/admin/Doctors";
import AddDoctor from "./admin-dashboard/admin/AddDoctor";
import Appointment from "./admin-dashboard/admin/Appointments";
import BillingRecords from "./admin-dashboard/admin/BillingRecords";
import AddBill from "./admin-dashboard/admin/AddBill";
import EditBill from "./admin-dashboard/admin/EditBill";
import Services from "./admin-dashboard/admin/Services";
import Taxes from "./admin-dashboard/admin/Taxes";
import DoctorSession from "./admin-dashboard/admin/DoctorSession";
import ClinicList from "./admin-dashboard/admin/cliniclist";
import AddClinic from "./admin-dashboard/admin/AddClinic";

/* Patient */
import PatientDashboard from "./patient-dashboard/Patient/PatientDashboard";
import PatientAppointments from "./patient-dashboard/Patient/PatientAppointments";
import PatientBookAppointment from "./patient-dashboard/Patient/PatientBookAppointment";
import PatientProfileSetup from "./patient-dashboard/Patient/PatientProfileSetup";

import ReptionistDashboard from "./reptionist-dashboard/ReptionistDashboard";

/* Doctor */
import DoctorDashboard from "./doctor-dashboard/doctor/DoctorDashboard";
import DoctorPatients from "./doctor-dashboard/doctor/DoctorPatients";
import DoctorAppointments from "./doctor-dashboard/doctor/DoctorAppointments";
import DoctorServices from "./doctor-dashboard/doctor/DoctorServices";
import DoctorAppointmentDetails from "./doctor-dashboard/doctor/DoctorAppointmentDetails";

/* PDF Editor */
import PdfEditor from "./pdf-editor/PdfEditor";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((s) => !s);

  // Route detection for title + favicon
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    let title = "OneCare";
    let icon = "/favicon.ico"; // default

    if (path.startsWith("/admin-dashboard")) {
      title = "OneCare Admin Panel";
      icon = "/admin.ico";
    } else if (path.startsWith("/doctor-dashboard")) {
      title = "OneCare Doctor Portal";
      icon = "/doctor.ico";
    } else if (path.startsWith("/Patient-Dashboard")) {
      title = "OneCare Patient Portal";
      icon = "/patient.ico";
    }

    document.title = title;
    setFavicon(icon);
  }, [location.pathname]);

  return (
    <>
      {/* Toast Theme */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
            borderRadius: "8px",
            padding: "10px 14px",
          },
          success: {
            style: {
              background: "#16a34a",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#16a34a",
            },
          },
          error: {
            style: {
              background: "#b91c1c",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#b91c1c",
            },
          },
        }}
      />

      <Routes>
        {/* Admin Section */}
        <Route path="/admin-dashboard" element={
          <AdminDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/patients" element={
          <Patients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/AddPatient" element={
          <AddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctors" element={
          <Doctors sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/AddDoctor" element={
          <AddDoctor sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/Appointments" element={
          <Appointment sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/BillingRecords" element={
          <BillingRecords sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/AddBill" element={
          <AddBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/EditBill/:id" element={
          <EditBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/services" element={
          <Services sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/taxes" element={
          <Taxes sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/DoctorSession" element={
          <DoctorSession sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/clinic-list" element={
          <ClinicList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/add-clinic" element={
          <AddClinic sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />

        {/* Doctor Section */}
        <Route path="/doctor-dashboard" element={
          <DoctorDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctor/patients" element={
          <DoctorPatients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctor/appointments" element={
          <DoctorAppointments sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctor/services" element={
          <DoctorServices sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetails />} />

        {/* Patient Section */}
        <Route path="/patient-dashboard" element={
          <PatientDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/patient/appointments" element={
          <PatientAppointments sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/patient/book" element={
          <PatientBookAppointment sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/patient/profile-setup" element={<PatientProfileSetup />} />

        {/* Others */}
        <Route path="/reception-dashboard" element={<ReptionistDashboard />} />
        <Route path="/pdf-editor" element={<PdfEditor />} />

        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
