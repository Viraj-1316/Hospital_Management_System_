# 📁 Complete File Structure Documentation

This document provides a complete breakdown of every file and folder in the OneCare Hospital Management System.

---

## 📂 Root Directory

```
Hospital_Management_System_/
├── backend/                          # Express.js API Server
├── frontend/                         # React (Vite) Application
├── docs/                             # Documentation folder
├── .gitignore                        # Git ignore rules
├── README.md                         # Main project overview
├── ARCHITECTURE.md                   # System architecture
├── DATABASE_SCHEMA.md                # MongoDB models
├── API_ENDPOINTS.md                  # API reference
├── DEPLOYMENT_GUIDE.md               # Deployment instructions
├── DEVELOPMENT_SETUP.md              # Local setup guide
├── Backend_Developer_Guide.md        # Backend development guide
├── Frontend_Developer_Guide.md       # Frontend development guide
├── README_RAZORPAY.md                # Razorpay integration docs
├── OneCare_AWS_Deployment_Guide.md   # AWS specific deployment
├── Production_Upgrade_Guide.md       # Production upgrade steps
├── route_migration_guide.md          # Route refactoring history
└── OneCare_API.postman_collection.json  # Postman API collection
```

---

## 📂 Backend Directory (`backend/`)

```
backend/
├── index.js                 # 🚀 Main entry point - Express app setup
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not in git)
│
├── config/                  # Configuration files
│   └── db.js                # MongoDB connection setup
│
├── controllers/             # Business logic controllers
│   ├── clinicController.js      # Clinic CRUD operations
│   ├── encounterTemplateController.js  # Encounter templates
│   ├── holidayController.js     # Holiday management
│   ├── receptionistController.js # Receptionist operations
│   └── settingsController.js    # System settings
│
├── middleware/              # Express middleware
│   ├── auth.js              # JWT token verification
│   ├── errorHandler.js      # Global error handling
│   ├── mongoSanitize.js     # NoSQL injection prevention
│   ├── upload.js            # Multer file upload config
│   └── validation.js        # Input validation schemas
│
├── models/                  # Mongoose schemas (19 models)
│   ├── Admin.js             # Super admin accounts
│   ├── Appointment.js       # Appointment records
│   ├── AppointmentSetting.js # Booking configuration
│   ├── Billing.js           # Invoice/bill records
│   ├── Clinic.js            # Clinic/hospital entities
│   ├── Counter.js           # Auto-increment counters
│   ├── Doctor.js            # Doctor profiles
│   ├── DoctorSession.js     # Doctor availability slots
│   ├── Encounter.js         # Medical encounter records
│   ├── EncounterTemplate.js # Reusable encounter templates
│   ├── Holiday.js           # Clinic holidays
│   ├── Listing.js           # Doctor listing settings
│   ├── Patient.js           # Patient profiles
│   ├── ProSetting.js        # Payment gateway settings
│   ├── Receptionist.js      # Receptionist accounts
│   ├── Service.js           # Medical services
│   ├── SmsTemplate.js       # SMS/WhatsApp templates
│   ├── Tax.js               # Tax configurations
│   └── User.js              # Generic user accounts
│
├── routes/                  # API route definitions (25 files)
│   ├── auth.js              # Authentication & login
│   ├── appointmentRoutes.js # Appointment management
│   ├── approvalRoutes.js    # Pending approvals
│   ├── billingRoutes.js     # Billing & invoicing
│   ├── clinicRoutes.js      # Clinic management
│   ├── dashboardRoutes.js   # Dashboard statistics
│   ├── doctorRoutes.js      # Doctor management
│   ├── doctorSessionRoutes.js # Doctor sessions
│   ├── emailRoutes.js       # Email sending
│   ├── encounterRoutes.js   # Medical encounters
│   ├── encounterTemplateRoutes.js # Encounter templates
│   ├── googleOAuthRoutes.js # Google Meet OAuth
│   ├── holidayRoutes.js     # Holiday management
│   ├── listingRoutes.js     # Listing settings
│   ├── patientRoutes.js     # Patient management
│   ├── pdfRoutes.js         # PDF generation
│   ├── razorpayRoutes.js    # Payment gateway
│   ├── receptionistRoutes.js # Receptionist management
│   ├── serviceRoutes.js     # Service management
│   ├── settingsRoutes.js    # System settings
│   ├── smsRoutes.js         # SMS/WhatsApp
│   ├── taxRoutes.js         # Tax management
│   ├── transactionRoutes.js # Transaction reports
│   ├── userRoutes.js        # User profile
│   └── zoomOAuthRoutes.js   # Zoom OAuth
│
├── utils/                   # Utility functions (11 files)
│   ├── cache.js             # In-memory caching
│   ├── emailService.js      # Nodemailer configuration
│   ├── emailTemplates.js    # HTML email templates
│   ├── generatePassword.js  # Random password generation
│   ├── keepAlive.js         # Server keep-alive ping
│   ├── logger.js            # Winston logging setup
│   ├── meetingService.js    # Google Meet/Zoom integration
│   ├── populateHelper.js    # MongoDB population helpers
│   ├── sendReceptionistWelcomeEmail.js # Welcome emails
│   ├── socketServer.js      # Socket.io real-time
│   └── whatsappService.js   # WhatsApp Business API
│
├── uploads/                 # Uploaded files storage
│   └── [dynamic files]      # User uploaded images, reports
│
├── assets/                  # Static assets
│   └── logo.png             # Clinic logo for PDFs
│
└── scripts/                 # Utility scripts
    └── [migration scripts]  # Database migration scripts
```

---

## 📂 Frontend Directory (`frontend/`)

```
frontend/
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies and scripts
├── eslint.config.js         # ESLint configuration
├── .env                     # Development environment
├── .env.production          # Production environment
│
├── public/                  # Static public assets
│   ├── favicon.ico          # Default favicon
│   ├── admin.ico            # Admin panel favicon
│   ├── doctor.ico           # Doctor portal favicon
│   ├── patient.ico          # Patient portal favicon
│   └── receptionist.ico     # Receptionist favicon
│
├── dist/                    # Production build output
│
└── src/                     # Source code
    ├── App.jsx              # 🚀 Main routing component
    ├── main.jsx             # React entry point
    ├── config.js            # API base URL config
    │
    ├── auth/                # Authentication pages
    │   ├── Login.jsx        # Login/Signup page
    │   ├── ForgotPassword.jsx # Password recovery
    │   ├── ResetPassword.jsx  # Password reset
    │   └── OneCareAuth.css  # Auth page styles
    │
    ├── admin-dashboard/     # Admin portal (46 files)
    │   ├── admin/           # Admin pages
    │   │   ├── AdminDashboard.jsx
    │   │   ├── Patients.jsx
    │   │   ├── AddPatient.jsx
    │   │   ├── EditPatient.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── AddDoctor.jsx
    │   │   ├── Appointments.jsx
    │   │   ├── BillingRecords.jsx
    │   │   ├── AddBill.jsx
    │   │   ├── EditBill.jsx
    │   │   ├── Services.jsx
    │   │   ├── Taxes.jsx
    │   │   ├── DoctorSession.jsx
    │   │   ├── ClinicList.jsx
    │   │   ├── AddClinic.jsx
    │   │   ├── EncounterList.jsx
    │   │   ├── EncounterDetails.jsx
    │   │   ├── EncounterTemplateList.jsx
    │   │   ├── EncounterTemplateDetails.jsx
    │   │   ├── ReceptionistList.jsx
    │   │   ├── AddReceptionist.jsx
    │   │   ├── PaymentReports.jsx
    │   │   ├── AdminProfile.jsx
    │   │   ├── AdminChangePassword.jsx
    │   │   └── settings/    # Settings sub-pages
    │   │       ├── SettingsLayout.jsx
    │   │       └── pages/
    │   │           ├── HolidaySettings.jsx
    │   │           ├── EmailTemplates.jsx
    │   │           ├── SmsWhatsappTemplates.jsx
    │   │           ├── GoogleMeetSettings.jsx
    │   │           ├── ZoomTelemedSettings.jsx
    │   │           ├── ListingSettings.jsx
    │   │           ├── ProSettings.jsx
    │   │           ├── PaymentSettings.jsx
    │   │           └── AppointmentSettings.jsx
    │   ├── components/      # Admin-specific components
    │   │   └── Sidebar.jsx
    │   ├── layouts/         # Layout wrappers
    │   └── styles/          # Admin styles
    │
    ├── clinic-dashboard/    # Clinic admin portal (38 files)
    │   ├── clinic/          # Clinic pages
    │   │   ├── ClinicDashboard.jsx
    │   │   ├── Patients.jsx
    │   │   ├── AddPatient.jsx
    │   │   ├── EditPatient.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── AddDoctor.jsx
    │   │   ├── Appointments.jsx
    │   │   ├── BillingRecords.jsx
    │   │   ├── AddBill.jsx
    │   │   ├── EditBill.jsx
    │   │   ├── Services.jsx
    │   │   ├── Taxes.jsx
    │   │   ├── DoctorSession.jsx
    │   │   ├── ReceptionistList.jsx
    │   │   ├── AddReceptionist.jsx
    │   │   ├── EncounterList.jsx
    │   │   ├── EncounterDetails.jsx
    │   │   ├── PaymentReports.jsx
    │   │   ├── ClinicProfile.jsx
    │   │   ├── ClinicChangePassword.jsx
    │   │   └── settings/
    │   │       ├── SettingsLayout.jsx
    │   │       └── pages/
    │   │           ├── HolidaySettings.jsx
    │   │           ├── BillingSettings.jsx
    │   │           └── ListingSettings.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── PendingApprovals.jsx
    │   └── layouts/
    │
    ├── doctor-dashboard/    # Doctor portal (33 files)
    │   ├── doctor/          # Doctor pages
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── DoctorPatients.jsx
    │   │   ├── DoctorAddPatient.jsx
    │   │   ├── DoctorEditPatient.jsx
    │   │   ├── DoctorAppointments.jsx
    │   │   ├── DoctorAppointmentDetails.jsx
    │   │   ├── DoctorBillingRecords.jsx
    │   │   ├── DoctorAddBill.jsx
    │   │   ├── DoctorEditBill.jsx
    │   │   ├── DoctorServices.jsx
    │   │   ├── DoctorEncounterList.jsx
    │   │   ├── DoctorEncounterDetails.jsx
    │   │   ├── DoctorEncounterTemplateList.jsx
    │   │   ├── DoctorEncounterTemplateDetails.jsx
    │   │   ├── DoctorMedicalReportPage.jsx
    │   │   ├── DoctorProfile.jsx
    │   │   ├── DoctorChangePassword.jsx
    │   │   ├── DoctorFirstLoginChangePassword.jsx
    │   │   └── Settings/
    │   │       ├── SettingLayout.jsx
    │   │       ├── Holidays.jsx
    │   │       ├── DoctorSessions.jsx
    │   │       ├── Listings.jsx
    │   │       ├── GoogleMeetIntegration.jsx
    │   │       └── ZoomIntegration.jsx
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   └── layouts/
    │
    ├── patient-dashboard/   # Patient portal (17 files)
    │   ├── Patient/         # Patient pages
    │   │   ├── PatientDashboard.jsx
    │   │   ├── PatientAppointments.jsx
    │   │   ├── PatientAppointmentDetails.jsx
    │   │   ├── PatientBookAppointment.jsx
    │   │   ├── PatientBills.jsx
    │   │   ├── PatientProfile.jsx
    │   │   ├── PatientProfileSetup.jsx
    │   │   ├── PatientChangePassword.jsx
    │   │   ├── Encounters.jsx
    │   │   └── MedicalReport.jsx
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   └── layouts/
    │
    ├── receptionist/        # Receptionist portal (30 files)
    │   ├── ReceptionistDashboard.jsx
    │   ├── ReceptionistAppointment.jsx
    │   ├── ReceptionistPatients.jsx
    │   ├── ReceptionistAddPatient.jsx
    │   ├── ReceptionistDoctor.jsx
    │   ├── ReceptionistAddDoctor.jsx
    │   ├── ReceptionistDoctorSession.jsx
    │   ├── ReceptionistBillingRecords.jsx
    │   ├── ReceptionistAddBill.jsx
    │   ├── ReceptionistEditBill.jsx
    │   ├── ReceptionistServices.jsx
    │   ├── ReceptionistEncounterList.jsx
    │   ├── ReceptionistEncounterDetails.jsx
    │   ├── ReceptionistEncounterTempletList.jsx
    │   ├── ReceptionistEncounterTempletDetails.jsx
    │   ├── ReceptionistPaymentReports.jsx
    │   ├── ReceptionistProfile.jsx
    │   ├── ReceptionistChangePassword.jsx
    │   ├── ReceptionistChangePasswordPage.jsx
    │   ├── Settings/
    │   │   ├── ReceptionistSettingsLayout.jsx
    │   │   └── Pages/
    │   │       ├── ReceptionistHolidaySettings.jsx
    │   │       ├── ReceptionistListingSettings.jsx
    │   │       └── ReceptionistAppointmentSettings.jsx
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   └── layouts/
    │
    ├── components/          # Shared components
    │   ├── LoadingFallback.jsx  # Lazy loading spinner
    │   ├── VerifyAppointment.jsx # Public verification
    │   ├── VerifyBill.jsx       # Public bill verification
    │   └── [other shared components]
    │
    ├── shared/              # Shared utilities
    │   ├── SharedListingSettings.jsx
    │   ├── SharedEncounterList.jsx
    │   ├── SharedEncounterDetails.jsx
    │   └── SharedEncounterTemplateDetails.jsx
    │
    ├── context/             # React Context providers
    │   └── SocketContext.jsx # Socket.io context
    │
    ├── utils/               # Frontend utilities
    │   ├── config.js        # API URL configuration
    │   ├── setFavicon.js    # Dynamic favicon
    │   ├── gtm.js           # Google Tag Manager
    │   └── [other utilities]
    │
    └── toasterjsfiles/      # Toast notification styles
        └── [toast styles]
```

---

## 📊 File Count Summary

| Directory                         | Files | Description           |
| --------------------------------- | ----- | --------------------- |
| `backend/routes/`                 | 25    | API route definitions |
| `backend/models/`                 | 19    | MongoDB schemas       |
| `backend/utils/`                  | 11    | Utility functions     |
| `backend/middleware/`             | 5     | Express middleware    |
| `backend/controllers/`            | 5     | Business logic        |
| `frontend/src/admin-dashboard/`   | 46    | Admin portal          |
| `frontend/src/clinic-dashboard/`  | 38    | Clinic portal         |
| `frontend/src/doctor-dashboard/`  | 33    | Doctor portal         |
| `frontend/src/patient-dashboard/` | 17    | Patient portal        |
| `frontend/src/receptionist/`      | 30    | Receptionist portal   |
| **Total Backend**                 | ~70   |                       |
| **Total Frontend**                | ~200  |                       |

---

## 🔗 Key Entry Points

| Purpose             | File                     |
| ------------------- | ------------------------ |
| Backend Server      | `backend/index.js`       |
| Frontend App        | `frontend/src/App.jsx`   |
| React Mount         | `frontend/src/main.jsx`  |
| Database Connection | `backend/config/db.js`   |
| API Configuration   | `frontend/src/config.js` |
