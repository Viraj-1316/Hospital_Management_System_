import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

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

/* Patient */
import PatientDashboard from "./patient-dashboard/Patient/PatientDashboard";
import PatientAppointments from "./patient-dashboard/Patient/PatientAppointments";
import PatientBookAppointment from "./patient-dashboard/Patient/PatientBookAppointment";
import PatientProfileSetup from "./patient-dashboard/Patient/PatientProfileSetup";

import ReptionistDashboard from "./reptionist-dashboard/ReptionistDashboard";

import DoctorDashboard from "./doctor-dashboard/doctor/DoctorDashboard";
import DoctorPatients from "./doctor-dashboard/doctor/DoctorPatients";
import DoctorAppointments from "./doctor-dashboard/doctor/DoctorAppointments";
import DoctorServices from "./doctor-dashboard/doctor/DoctorServices";
import DoctorAppointmentDetails from "./doctor-dashboard/doctor/DoctorAppointmentDetails";


// Pdf Editor Section


import PdfEditor from "./pdf-editor/PdfEditor";

function App() {

  // Sidebar state lives here
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((s) => !s);

  return (
    <Routes>
      {/* Pass props to pages that render Navbar + Sidebar */}
      <Route path="/admin-dashboard" element={<AdminDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      <Route path="/doctor-dashboard" element={<DoctorDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/doctor/patients" element={<DoctorPatients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/doctor/services" element={<DoctorServices sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetails />} />


      {/* Patient section */}
      <Route path="/patient-dashboard" element={<PatientDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/patient/appointments" element={<PatientAppointments sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/patient/book" element={<PatientBookAppointment sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/patient/profile-setup" element={<PatientProfileSetup />} />

      <Route path="/reception-dashboard" element={<ReptionistDashboard />} />

      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/patients" element={<Patients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/AddPatient" element={<AddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/doctors" element={<Doctors sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/AddDoctor" element={<AddDoctor sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/Appointments" element={<Appointment sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      {/*Billing section */}
      <Route path="/BillingRecords" element={<BillingRecords sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/AddBill" element={<AddBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
      <Route path="/EditBill/:id" element={<EditBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      {/* Services route receives the props too */}
      <Route path="/services" element={<Services sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      {/*Tax section */}
      <Route path="/taxes" element={<Taxes sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      {/*Doctor Session section */}
      <Route path="/DoctorSession" element={<DoctorSession sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

      {/* PDF Section */}

       <Route path="/pdf-editor" element={<PdfEditor />} />
    </Routes>

    
  );
}

export default App;
