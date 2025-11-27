import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";
import { setFavicon } from "./utils/setFavicon.js";
import 'react-phone-input-2/lib/style.css';


/* Auth */
import Login from "./auth/Login";
import Signup from "./auth/Signup";

/* Admin */
import AdminDashboard from "./admin-dashboard/admin/AdminDashboard";
import AddPatient from "./admin-dashboard/admin/AddPatient";
import EditPatient from "./admin-dashboard/admin/EditPatient";
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
import AdminProfile from "./admin-dashboard/admin/AdminProfile";
import AdminChangePassword from "./admin-dashboard/admin/AdminChangePassword";
import EncounterList from "./admin-dashboard/admin/EncounterList";
import EncounterTemplateList from "./admin-dashboard/admin/EncounterTemplateList";
import EncounterDetails from "./admin-dashboard/admin/EncounterDetails";
import EncounterTemplateDetails from "./admin-dashboard/admin/EncounterTemplateDetails";
import MedicalReportPage from "./admin-dashboard/admin/MedicalReportPage";

/* Patient */
import PatientDashboard from "./patient-dashboard/Patient/PatientDashboard";
import PatientAppointments from "./patient-dashboard/Patient/PatientAppointments";
import PatientBookAppointment from "./patient-dashboard/Patient/PatientBookAppointment";
import PatientProfileSetup from "./patient-dashboard/Patient/PatientProfileSetup";
import PatientProfile from "./patient-dashboard/Patient/PatientProfile.jsx";
import PatientChangePassword from "./patient-dashboard/Patient/PatientChangePassword";


/* Doctor */
import DoctorDashboard from "./doctor-dashboard/doctor/DoctorDashboard";
import DoctorPatients from "./doctor-dashboard/doctor/DoctorPatients";
import DoctorAppointments from "./doctor-dashboard/doctor/DoctorAppointments";
import DoctorServices from "./doctor-dashboard/doctor/DoctorServices";
import DoctorAppointmentDetails from "./doctor-dashboard/doctor/DoctorAppointmentDetails";
import DoctorProfile from "./doctor-dashboard/doctor/DoctorProfile.jsx";
import DoctorChangePassword from "./doctor-dashboard/doctor/DoctorChangePassword";
import DoctorFirstLoginChangePassword from "./doctor-dashboard/doctor/DoctorFirstLoginChangePassword";
import DoctorEncounterList from "./doctor-dashboard/doctor/DoctorEncounterList";
import DoctorEncounterDetails from "./doctor-dashboard/doctor/DoctorEncounterDetails";
import DoctorEncounterTemplateList from "./doctor-dashboard/doctor/DoctorEncounterTemplateList";
import DoctorEncounterTemplateDetails from "./doctor-dashboard/doctor/DoctorEncounterTemplateDetails";
import DoctorMedicalReportPage from "./doctor-dashboard/doctor/DoctorMedicalReportPage";


// Receptionist
import AddReceptionist from "./admin-dashboard/admin/AddReceptionist.jsx";
import ReceptionistList from "./admin-dashboard/admin/ReceptionistList.jsx";
import ReceptionistChangePassword from "./reptionist/ReceptionistChangePassword.jsx";
import ReceptionistChangePasswordPage from "./reptionist/ReceptionistChangePasswordPage.jsx";
import ReceptionistProfile from "./reptionist/ReceptionistProfile.jsx";
import ReptionistDashboard from "./reptionist/ReptionistDashboard";

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
    } else if (path.startsWith("/patient-dashboard")) {
      title = "OneCare Patient Portal";
      icon = "/patient.ico";
    }else if (path.startsWith("/reception-dashboard")) {
      title = "OneCare Receptionist Portal";
      icon = "/receptionist.ico";
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
        <Route path="/admin/profile" element={
          <AdminProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/admin/change-password" element={
          <AdminChangePassword sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/patients" element={
          <Patients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/AddPatient" element={
          <AddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/EditPatient/:id" element={
          <EditPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
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
        <Route path="/admin/appointments" element={
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
        <Route path="/encounter-list" element={
          <EncounterList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/encounter-templates" element={
          <EncounterTemplateList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/encounter-details/:id" element={
          <EncounterDetails sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/encounter-template-details/:id" element={
          <EncounterTemplateDetails sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/admin/encounters" element={
          <EncounterList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/admin/reports" element={
          <MedicalReportPage sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/encounters/:id/reports" element={
          <MedicalReportPage sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
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
        <Route path="/doctor/profile" element={
          <DoctorProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/doctor/change-password" element={<DoctorChangePassword />} />
        <Route path="/doctor/change-password-first" element={<DoctorFirstLoginChangePassword />} />
        <Route path="/doctor/encounters" element={<DoctorEncounterList />} />
        <Route path="/doctor/encounters/:id" element={<DoctorEncounterDetails />} />
        <Route path="/doctor/encounter-templates" element={<DoctorEncounterTemplateList />} />
        <Route path="/doctor/encounter-template-details/:id" element={<DoctorEncounterTemplateDetails />} />
        <Route path="/doctor/encounters/:id/reports" element={<DoctorMedicalReportPage />} />

        {/* Patient Section */}

        <Route path="/patient" element={
          <PatientDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}/>
        }/>
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
        <Route path="/patient/profile" element={<PatientProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
        <Route path="/patient/change-password" element={<PatientChangePassword sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />

        {/* Others */}

        <Route path="/reception-dashboard" element={<ReptionistDashboard />} />
        <Route path="/pdf-editor" element={<PdfEditor />} />
        
        {/* Receptionist Section */}

        <Route path="/receptionists" element={
          <ReceptionistList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/add-receptionist" element={
          <AddReceptionist sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />
        <Route path="/receptionist/change-password" element={<ReceptionistChangePassword />} />
        <Route path="/reception/change-password" element={<ReceptionistChangePasswordPage />} />
        <Route path="/receptionist/profile" element={
        <ReceptionistProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        } />

        {/* Auth */}

        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
