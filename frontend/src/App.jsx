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

/* Settings */
import Settings from "./admin-dashboard/admin/Settings/Settings";
import PdfTemplate from "./admin-dashboard/admin/Settings/PdfTemplate/PdfTemplate.jsx";

/* Patient */
import PatientDashboard from "./patient-dashboard/Patient/PatientDashboard";
import PatientAppointments from "./patient-dashboard/Patient/PatientAppointments";
import PatientBookAppointment from "./patient-dashboard/Patient/PatientBookAppointment";

import ReptionistDashboard from "./reptionist-dashboard/ReptionistDashboard";

import DoctorDashboard from "./doctor-dashboard/doctor/DoctorDashboard";
import DoctorPatients from "./doctor-dashboard/doctor/DoctorPatients";
import DoctorAppointments from "./doctor-dashboard/doctor/DoctorAppointments";
import DoctorServices from "./doctor-dashboard/doctor/DoctorServices";


function App() {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((s) => !s);

  return (
    <Routes>

      {/* Admin */}
      <Route path="/admin-dashboard"
        element={<AdminDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}
      />

      {/* Doctor */}
      <Route path="/doctor-dashboard"
        element={<DoctorDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}
      />
      <Route path="/doctor/patients" element={<DoctorPatients />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/doctor/services" element={<DoctorServices />} />

      {/* Patient */}
      <Route path="/patient-dashboard"
        element={<PatientDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}
      />
      <Route path="/patient/appointments" element={<PatientAppointments />} />
      <Route path="/patient/book" element={<PatientBookAppointment />} />

      {/* Reception */}
      <Route path="/reception-dashboard" element={<ReptionistDashboard />} />

      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Billing */}
      <Route path="/BillingRecords" element={<BillingRecords />} />
      <Route path="/AddBill" element={<AddBill />} />
      <Route path="/EditBill/:id" element={<EditBill />} />

      {/* Services */}
      <Route path="/services" element={<Services />} />

      {/* Taxes */}
      <Route path="/taxes" element={<Taxes />} />

      {/* Settings (Nested Routes) */}
      <Route
        path="/settings"
        element={<Settings sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}
      >
        <Route path="pdf-template" element={<PdfTemplate />} />
      </Route>

    </Routes>
  );
}

export default App;
