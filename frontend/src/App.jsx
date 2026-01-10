import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";
import { setFavicon } from "./utils/setFavicon.js";
import { trackPageView } from "./utils/gtm";
import 'react-phone-input-2/lib/style.css';

// Loading fallback for lazy-loaded components
import LoadingFallback from "./components/LoadingFallback";

/* Auth - Loaded eagerly since it's the entry point */
import Login from "./auth/Login";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";

/* Admin Dashboard Components */
const AdminDashboard = lazy(() => import("./admin-dashboard/admin/AdminDashboard"));
const AddPatient = lazy(() => import("./admin-dashboard/admin/AddPatient"));
const EditPatient = lazy(() => import("./admin-dashboard/admin/EditPatient"));
const Patients = lazy(() => import("./admin-dashboard/admin/Patients"));
const Doctors = lazy(() => import("./admin-dashboard/admin/Doctors"));
const AddDoctor = lazy(() => import("./admin-dashboard/admin/AddDoctor"));
// Note: Appointment is eagerly loaded due to 429 error debugging - can be converted back to lazy() when stable
import Appointment from "./admin-dashboard/admin/Appointments";
import ReceptionistBillingRecords from "./receptionist/ReceptionistBillingRecords.jsx";
import ReceptionistAppointmentSettings from "./receptionist/Settings/Pages/ReceptionistAppointmentSettings.jsx";
const BillingRecords = lazy(() => import("./admin-dashboard/admin/BillingRecords"));
const AddBill = lazy(() => import("./admin-dashboard/admin/AddBill"));
const EditBill = lazy(() => import("./admin-dashboard/admin/EditBill"));
const Services = lazy(() => import("./admin-dashboard/admin/Services"));
const Taxes = lazy(() => import("./admin-dashboard/admin/Taxes"));
const DoctorSession = lazy(() => import("./admin-dashboard/admin/DoctorSession"));
const ClinicList = lazy(() => import("./admin-dashboard/admin/ClinicList"));
const AddClinic = lazy(() => import("./admin-dashboard/admin/AddClinic"));
const AdminProfile = lazy(() => import("./admin-dashboard/admin/AdminProfile"));
const AdminChangePassword = lazy(() => import("./admin-dashboard/admin/AdminChangePassword"));
const EncounterList = lazy(() => import("./admin-dashboard/admin/EncounterList"));
const EncounterTemplateList = lazy(() => import("./admin-dashboard/admin/EncounterTemplateList"));
const EncounterDetails = lazy(() => import("./admin-dashboard/admin/EncounterDetails"));
const EncounterTemplateDetails = lazy(() => import("./admin-dashboard/admin/EncounterTemplateDetails"));
const MedicalReportPage = lazy(() => import("./admin-dashboard/admin/MedicalReportPage"));
const AddReceptionist = lazy(() => import("./admin-dashboard/admin/AddReceptionist"));
const ReceptionistList = lazy(() => import("./admin-dashboard/admin/ReceptionistList"));
const PaymentReports = lazy(() => import("./admin-dashboard/admin/PaymentReports"));

/* Admin Settings */
const SettingsLayout = lazy(() => import("./admin-dashboard/admin/settings/SettingsLayout"));
const HolidaySettings = lazy(() => import("./admin-dashboard/admin/settings/pages/HolidaySettings"));
const EmailTemplates = lazy(() => import("./admin-dashboard/admin/settings/pages/EmailTemplates"));
const SmsWhatsappTemplates = lazy(() => import("./admin-dashboard/admin/settings/pages/SmsWhatsappTemplates"));
const GoogleMeetSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/GoogleMeetSettings"));
const ZoomTelemedSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/ZoomTelemedSettings"));
const ListingSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/ListingSettings"));
const ProSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/ProSettings"));
const PaymentSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/PaymentSettings"));
const AppointmentSettings = lazy(() => import("./admin-dashboard/admin/settings/pages/AppointmentSettings"));


/* Clinic Dashboard Components */
const ClinicDashboard = lazy(() => import("./clinic-dashboard/clinic/ClinicDashboard"));
const ClinicAppointments = lazy(() => import("./clinic-dashboard/clinic/Appointments"));
const ClinicPatients = lazy(() => import("./clinic-dashboard/clinic/Patients"));
const ClinicDoctors = lazy(() => import("./clinic-dashboard/clinic/Doctors"));
const ClinicReceptionists = lazy(() => import("./clinic-dashboard/clinic/ReceptionistList"));
const ClinicServices = lazy(() => import("./clinic-dashboard/clinic/Services"));
const ClinicTaxes = lazy(() => import("./clinic-dashboard/clinic/Taxes"));
const ClinicDoctorSession = lazy(() => import("./clinic-dashboard/clinic/DoctorSession"));
const ClinicBillingRecords = lazy(() => import("./clinic-dashboard/clinic/BillingRecords"));
const ClinicProfile = lazy(() => import("./clinic-dashboard/clinic/ClinicProfile"));
const ClinicChangePassword = lazy(() => import("./clinic-dashboard/clinic/ClinicChangePassword"));
const ClinicEncounterList = lazy(() => import("./clinic-dashboard/clinic/EncounterList"));
const ClinicEncounterTemplateList = lazy(() => import("./clinic-dashboard/clinic/EncounterTemplateList"));
const ClinicMedicalReportPage = lazy(() => import("./clinic-dashboard/clinic/MedicalReportPage"));
const ClinicEncounterDetails = lazy(() => import("./clinic-dashboard/clinic/EncounterDetails"));
const ClinicEncounterTemplateDetails = lazy(() => import("./clinic-dashboard/clinic/EncounterTemplateDetails"));
/* Clinic-specific Add/Edit components */
const ClinicAddPatient = lazy(() => import("./clinic-dashboard/clinic/AddPatient"));
const ClinicEditPatient = lazy(() => import("./clinic-dashboard/clinic/EditPatient"));
const ClinicAddDoctor = lazy(() => import("./clinic-dashboard/clinic/AddDoctor"));
const ClinicAddReceptionist = lazy(() => import("./clinic-dashboard/clinic/AddReceptionist"));
const ClinicAddBill = lazy(() => import("./clinic-dashboard/clinic/AddBill"));
const ClinicEditBill = lazy(() => import("./clinic-dashboard/clinic/EditBill"));
/* Clinic Settings - Reuse Admin Settings layout/pages or duplicate if needed. For now assuming reuse but mapped to clinic paths if they are generic enough, OR use copied settings if duplicated. */
const ClinicSettingsLayout = lazy(() => import("./clinic-dashboard/clinic/settings/SettingsLayout")); // Assuming copied
const ClinicHolidaySettings = lazy(() => import("./clinic-dashboard/clinic/settings/pages/HolidaySettings"));
const ClinicBillingSettings = lazy(() => import("./clinic-dashboard/clinic/settings/pages/BillingSettings"));
const ClinicListingSettings = lazy(() => import("./clinic-dashboard/clinic/settings/pages/ListingSettings"));
const PendingApprovals = lazy(() => import("./clinic-dashboard/components/PendingApprovals"));
const ClinicPaymentReports = lazy(() => import("./clinic-dashboard/clinic/PaymentReports"));
const PatientDashboard = lazy(() => import("./patient-dashboard/Patient/PatientDashboard"));
const PatientAppointments = lazy(() => import("./patient-dashboard/Patient/PatientAppointments"));
const PatientBookAppointment = lazy(() => import("./patient-dashboard/Patient/PatientBookAppointment"));
const PatientProfileSetup = lazy(() => import("./patient-dashboard/Patient/PatientProfileSetup"));
const PatientProfile = lazy(() => import("./patient-dashboard/Patient/PatientProfile"));
const PatientChangePassword = lazy(() => import("./patient-dashboard/Patient/PatientChangePassword"));
const Encounters = lazy(() => import("./patient-dashboard/Patient/Encounters"));
const PatientBilling = lazy(() => import("./patient-dashboard/Patient/PatientBills"));
const PatientReport = lazy(() => import("./patient-dashboard/Patient/MedicalReport"));
const AppointmentDetails = lazy(() => import("./patient-dashboard/Patient/PatientAppointmentDetails"));

/* Doctor Dashboard Components */
const DoctorDashboard = lazy(() => import("./doctor-dashboard/doctor/DoctorDashboard"));
const DoctorPatients = lazy(() => import("./doctor-dashboard/doctor/DoctorPatients"));
const DoctorAppointments = lazy(() => import("./doctor-dashboard/doctor/DoctorAppointments"));
const DoctorServices = lazy(() => import("./doctor-dashboard/doctor/DoctorServices"));
const DoctorAppointmentDetails = lazy(() => import("./doctor-dashboard/doctor/DoctorAppointmentDetails"));
const DoctorProfile = lazy(() => import("./doctor-dashboard/doctor/DoctorProfile"));
const DoctorChangePassword = lazy(() => import("./doctor-dashboard/doctor/DoctorChangePassword"));
const DoctorFirstLoginChangePassword = lazy(() => import("./doctor-dashboard/doctor/DoctorFirstLoginChangePassword"));
const DoctorEncounterList = lazy(() => import("./doctor-dashboard/doctor/DoctorEncounterList"));
const DoctorEncounterDetails = lazy(() => import("./doctor-dashboard/doctor/DoctorEncounterDetails"));
const DoctorEncounterTemplateList = lazy(() => import("./doctor-dashboard/doctor/DoctorEncounterTemplateList"));
const DoctorEncounterTemplateDetails = lazy(() => import("./doctor-dashboard/doctor/DoctorEncounterTemplateDetails"));
const DoctorMedicalReportPage = lazy(() => import("./doctor-dashboard/doctor/DoctorMedicalReportPage"));
const DoctorBillingRecords = lazy(() => import("./doctor-dashboard/doctor/DoctorBillingRecords"));
const DoctorEditBill = lazy(() => import("./doctor-dashboard/doctor/DoctorEditBill"));
const DoctorAddBill = lazy(() => import("./doctor-dashboard/doctor/DoctorAddBill"));
const DoctorAddPatient = lazy(() => import("./doctor-dashboard/doctor/DoctorAddPatient"));
const DoctorEditPatient = lazy(() => import("./doctor-dashboard/doctor/DoctorEditPatient"));

/* Doctor Settings */
const SettingLayout = lazy(() => import("./doctor-dashboard/doctor/Settings/SettingLayout"));
const Holidays = lazy(() => import("./doctor-dashboard/doctor/Settings/Holidays"));
const DoctorSessions = lazy(() => import("./doctor-dashboard/doctor/Settings/DoctorSessions"));
const Listings = lazy(() => import("./doctor-dashboard/doctor/Settings/Listings"));
const GoogleMeetIntegration = lazy(() => import("./doctor-dashboard/doctor/Settings/GoogleMeetIntegration"));
const ZoomIntegration = lazy(() => import("./doctor-dashboard/doctor/Settings/ZoomIntegration"));

/* Receptionist Components */
const ReceptionistChangePassword = lazy(() => import("./receptionist/ReceptionistChangePassword"));
const ReceptionistChangePasswordPage = lazy(() => import("./receptionist/ReceptionistChangePasswordPage"));
const ReceptionistProfile = lazy(() => import("./receptionist/ReceptionistProfile"));
const ReceptionistDashboard = lazy(() => import("./receptionist/ReceptionistDashboard"));
const ReceptionistAppointment = lazy(() => import("./receptionist/ReceptionistAppointment"));
const ReceptionistEncounterList = lazy(() => import("./receptionist/ReceptionistEncounterList"));
const ReceptionistEncounterDetails = lazy(() => import("./receptionist/ReceptionistEncounterDetails"));
const ReceptionistEncounterTempletList = lazy(() => import("./receptionist/ReceptionistEncounterTempletList"));
const ReceptionistEncounterTempletDetails = lazy(() => import("./receptionist/ReceptionistEncounterTempletDetails"));
const ReceptionistPatients = lazy(() => import("./receptionist/ReceptionistPatients"));
const ReceptionistAddPatient = lazy(() => import("./receptionist/ReceptionistAddPatient"));
const ReceptionistDoctor = lazy(() => import("./receptionist/ReceptionistDoctor"));
const ReceptionistAddDoctor = lazy(() => import("./receptionist/ReceptionistAddDoctor"));
const ReceptionistDoctorSession = lazy(() => import("./receptionist/ReceptionistDoctorSession"));
const ReceptionistServices = lazy(() => import("./receptionist/ReceptionistServices"));
const ReceptionistAddBill = lazy(() => import("./receptionist/ReceptionistAddBill"));
const ReceptionistEditBill = lazy(() => import("./receptionist/ReceptionistEditBill"));
//Settings Section
const ReceptionistSettingsLayout = lazy(() => import("./receptionist/Settings/ReceptionistSettingsLayout")); // Assuming copied
const ReceptionistHolidaySettings = lazy(() => import("./receptionist/Settings/Pages/ReceptionistHolidaySettings"));
const ReceptionistListingSettings = lazy(() => import("./receptionist/Settings/Pages/ReceptionistListingSettings"));
const ReceptionistPaymentReports = lazy(() => import("./receptionist/ReceptionistPaymentReports"));



/* Public Verification Pages */
const VerifyAppointment = lazy(() => import("./components/VerifyAppointment"));
const VerifyBill = lazy(() => import("./components/VerifyBill"));
// ============================================
// APP COMPONENT
// ============================================

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((s) => !s);

  // Route detection for title + favicon
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    let title = "OneCare";
    let icon = "/favicon.ico"; // default

    if (path.startsWith("/admin-dashboard") || path.startsWith("/admin") || path.startsWith("/patients") || path.startsWith("/doctors") || path.startsWith("/settings")) {
      title = "OneCare Admin Panel";
      icon = "/admin.ico";
    } else if (path.startsWith("/clinic-dashboard")) {
      title = "OneCare Clinic Portal";
      icon = "/admin.ico"; // Use admin icon for now
    } else if (path.startsWith("/doctor-dashboard") || path.startsWith("/doctor")) {
      title = "OneCare Doctor Portal";
      icon = "/doctor.ico";
    } else if (path.startsWith("/patient-dashboard") || path.startsWith("/patient")) {
      title = "OneCare Patient Portal";
      icon = "/patient.ico";
    } else if (path.startsWith("/reception-dashboard") || path.startsWith("/receptionist")) {
      title = "OneCare Receptionist Portal";
      icon = "/receptionist.ico";
    }

    document.title = title;
    setFavicon(icon);
    
    // GTM: Track SPA page views
    trackPageView(location.pathname, title);
  }, [location.pathname]);

  return (
    <>
      {/* SocketProvider removed, moved to main.jsx */}
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

      {/* Suspense wrapper for lazy-loaded components */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ==================== ADMIN SECTION ==================== */}
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
          <Route path="/admin/AddPatient" element={
            <AddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/EditPatient/:id" element={
            <EditPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/admin/EditPatient/:id" element={
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
          <Route path="/receptionists" element={
            <ReceptionistList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/add-receptionist" element={
            <AddReceptionist sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/payment-reports" element={
            <PaymentReports sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />

          {/* Admin Settings Section */}
          <Route path="/settings" element={<SettingsLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}>
            <Route index element={<HolidaySettings />} />
            <Route path="holidays" element={<HolidaySettings />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="sms-whatsapp-templates" element={<SmsWhatsappTemplates />} />
            <Route path="google-meet" element={<GoogleMeetSettings />} />
            <Route path="zoom-telemed" element={<ZoomTelemedSettings />} />
            <Route path="listings" element={<ListingSettings />} />
            <Route path="pro-settings" element={<ProSettings />} />
            <Route path="payments" element={<PaymentSettings />} />
            <Route path="appointment-settings" element={<AppointmentSettings />} />
          </Route>

          {/* ==================== CLINIC SECTION ==================== */}
          <Route path="/clinic-dashboard" element={
            <ClinicDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          {/* Clinic Specific Routes - using clinic-dashboard components */}
          <Route path="/clinic-dashboard/AddPatient" element={
            <ClinicAddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/EditPatient/:id" element={
            <ClinicEditPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/add-doctor" element={
            <ClinicAddDoctor sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/add-receptionist" element={
            <ClinicAddReceptionist sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/AddBill" element={
            <ClinicAddBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/EditBill/:id" element={
            <ClinicEditBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />

          <Route path="/clinic-dashboard/appointments" element={
            <ClinicAppointments sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/patients" element={
            <ClinicPatients sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/doctors" element={
            <ClinicDoctors sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/receptionists" element={
            <ClinicReceptionists sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/services" element={
            <ClinicServices sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/DoctorSession" element={
            <ClinicDoctorSession sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/taxes" element={
            <ClinicTaxes sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/BillingRecords" element={
            <ClinicBillingRecords sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/profile" element={
            <ClinicProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/change-password" element={
            <ClinicChangePassword sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/encounter-list" element={
            <ClinicEncounterList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/encounter-templates" element={
            <ClinicEncounterTemplateList sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/encounter-details/:id" element={
            <ClinicEncounterDetails sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/encounter-template-details/:id" element={
            <ClinicEncounterTemplateDetails sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/reports" element={
            <ClinicMedicalReportPage sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/encounters/:id/reports" element={
            <ClinicMedicalReportPage sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/pending-approvals" element={
            <PendingApprovals sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/payment-reports" element={
            <ClinicPaymentReports sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/clinic-dashboard/settings" element={<ClinicSettingsLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}>
            <Route index element={<ClinicHolidaySettings />} />
            <Route path="holidays" element={<ClinicHolidaySettings />} />
            <Route path="billing" element={<ClinicBillingSettings />} />
            <Route path="listings" element={<ClinicListingSettings />} />
          </Route>

          {/* ==================== DOCTOR SECTION ==================== */}
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
          <Route path="/doctor/patients/view/:patientId" element={<DoctorEncounterList />} />
          <Route path="/doctor/billing" element={
            <DoctorBillingRecords sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/doctor/add-bill" element={
            <DoctorAddBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/doctor/edit-bill/:id" element={
            <DoctorEditBill sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/doctor/AddPatient" element={
            <DoctorAddPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/doctor/EditPatient/:id" element={
            <DoctorEditPatient sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />

          {/* Doctor Settings */}
          <Route path="/doctor/settings" element={<SettingLayout />}>
            <Route index element={<Holidays />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="sessions" element={<DoctorSessions />} />
            <Route path="listings" element={<Listings />} />
            <Route path="integration" element={<GoogleMeetIntegration />} />
            <Route path="zoom" element={<ZoomIntegration />} />
          </Route>

          {/* ==================== PATIENT SECTION ==================== */}
          <Route path="/patient" element={
            <PatientDashboard sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
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
          <Route path="/patient/encounters" element={<Encounters sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
          <Route path="/patient/billing" element={<PatientBilling sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
          <Route path="/patient/reports" element={<PatientReport sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />} />
          <Route path="/patient/appointments/:id" element={<AppointmentDetails />} />

          {/* ==================== RECEPTIONIST SECTION ==================== */}
          <Route path="/reception-dashboard" element={<ReceptionistDashboard />} />
          <Route path="/reception-dashboard/appointments" element={<ReceptionistAppointment/>} />
          <Route path="/reception-dashboard/doctors" element={<ReceptionistDoctor/>} />
          <Route path="/receptionist-dashboard/patients" element={<ReceptionistPatients/>} />
          <Route path="/receptionist-dashboard/AddPatient" element={<ReceptionistAddPatient/>} />
          <Route path="/receptionist/add-doctor" element={<ReceptionistAddDoctor/>} />
          <Route path="/receptionist/doctor-sessions" element={<ReceptionistDoctorSession/>} />
          <Route path="/reception-dashboard/services" element={<ReceptionistServices/>} />
          <Route path="/reception-dashboard/billing" element={<ReceptionistBillingRecords/>} />
          <Route path="/reception-dashboard/payment-reports" element={
            <ReceptionistPaymentReports sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          <Route path="/receptionist/add-bill" element={<ReceptionistAddBill/>} />
          <Route path="/receptionist/edit-bill/:id" element={<ReceptionistEditBill/>} />
          <Route path="/reception-dashboard/encounters" element={<ReceptionistEncounterList/>} /> 
          <Route path="/reception-dashboard/encounters/:id" element={<ReceptionistEncounterDetails/>} />
          <Route path="/reception-dashboard/encounters/templates" element={<ReceptionistEncounterTempletList/>} />
          <Route path="/reception-dashboard/encounter-template-details/:id" element={<ReceptionistEncounterTempletDetails/>} />
          <Route path="/receptionist/change-password" element={<ReceptionistChangePassword />} />
          <Route path="/receptionist/change-password-page" element={<ReceptionistChangePasswordPage />} />
          <Route path="/receptionist/profile" element={
            <ReceptionistProfile sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          } />
          {/* Receptionist Settings */}
          <Route path="/receptionist-dashboard/settings" element={<ReceptionistSettingsLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}>
            <Route index element={<ReceptionistHolidaySettings />} />
            <Route path="holidays" element={<ReceptionistHolidaySettings />} />
            <Route path="appointment-settings" element={<ReceptionistAppointmentSettings/>} />
            <Route path="listings" element={<ReceptionistListingSettings />} />
          </Route>


          {/* ==================== PUBLIC VERIFICATION ==================== */}
          <Route path="/verify/appointment/:id" element={<VerifyAppointment />} />
          <Route path="/verify/bill/:id" element={<VerifyBill />} />

          {/* ==================== AUTH ==================== */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
