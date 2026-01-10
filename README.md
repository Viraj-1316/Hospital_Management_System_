# 🏥 OneCare - Hospital Management System

A comprehensive hospital management system built with **React (Vite)** frontend and **Node.js/Express** backend with **MongoDB** database.

---

## 📁 Project Structure

```
Hospital_Management_System_/
├── backend/                 # Express.js API Server
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # MongoDB Mongoose schemas
│   ├── routes/              # API route definitions
│   ├── utils/               # Utility functions & services
│   └── uploads/             # Uploaded files storage
├── frontend/                # React (Vite) Application
│   └── src/
│       ├── admin-dashboard/     # Admin panel components
│       ├── clinic-dashboard/    # Clinic admin components
│       ├── doctor-dashboard/    # Doctor portal components
│       ├── patient-dashboard/   # Patient portal components
│       ├── receptionist/        # Receptionist portal
│       ├── auth/                # Login, forgot/reset password
│       ├── components/          # Shared components
│       └── utils/               # Frontend utilities
└── docs/                    # Additional documentation
```

---

## 🔌 Backend API Routes

All routes are registered in `backend/index.js`. Below is the complete API reference:

### Authentication (`/` - auth.js)

| Method | Endpoint                 | Description                                       |
| ------ | ------------------------ | ------------------------------------------------- |
| POST   | `/login`                 | User login (admin, doctor, patient, receptionist) |
| POST   | `/google`                | Google OAuth login (patients only)                |
| POST   | `/forgot-password`       | Request password reset email                      |
| POST   | `/reset-password/:token` | Reset password with token                         |
| POST   | `/change-password`       | Change current password                           |

### Users (`/` - userRoutes.js)

| Method | Endpoint    | Description            |
| ------ | ----------- | ---------------------- |
| GET    | `/user/:id` | Get user profile by ID |
| PUT    | `/user/:id` | Update user profile    |

### Doctors (`/doctors` - doctorRoutes.js)

| Method | Endpoint                          | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/doctors`                        | Get all doctors (clinic-scoped) |
| GET    | `/doctors/:id`                    | Get single doctor               |
| POST   | `/doctors`                        | Create new doctor               |
| PUT    | `/doctors/:id`                    | Update doctor                   |
| DELETE | `/doctors/:id`                    | Delete doctor                   |
| POST   | `/doctors/:id/resend-credentials` | Resend login credentials        |
| POST   | `/doctors/import`                 | CSV import doctors              |
| GET    | `/doctors/profile/:id`            | Get doctor profile              |
| PUT    | `/doctors/profile/:id`            | Update doctor profile           |

### Doctor Sessions (`/doctor-sessions` - doctorSessionRoutes.js)

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| GET    | `/doctor-sessions`     | Get all sessions  |
| GET    | `/doctor-sessions/:id` | Get session by ID |
| POST   | `/doctor-sessions`     | Create session    |
| PUT    | `/doctor-sessions/:id` | Update session    |
| DELETE | `/doctor-sessions/:id` | Delete session    |

### Patients (`/patients` - patientRoutes.js)

| Method | Endpoint                           | Description                      |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/patients`                        | Get all patients (clinic-scoped) |
| GET    | `/patients/:id`                    | Get single patient               |
| POST   | `/patients`                        | Create patient                   |
| PUT    | `/patients/:id`                    | Update patient                   |
| DELETE | `/patients/:id`                    | Delete patient                   |
| GET    | `/patients/by-user/:userId`        | Get patient by user ID           |
| PUT    | `/patients/by-user/:userId`        | Update patient by user ID        |
| POST   | `/patients/import`                 | CSV import patients              |
| POST   | `/patients/:id/resend-credentials` | Resend login credentials         |

### Appointments (`/appointments` - appointmentRoutes.js)

| Method | Endpoint                   | Description                     |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/appointments`            | Get all appointments            |
| GET    | `/appointments/:id`        | Get single appointment          |
| POST   | `/appointments`            | Create appointment              |
| PUT    | `/appointments/:id`        | Update appointment              |
| DELETE | `/appointments/:id`        | Delete appointment              |
| GET    | `/appointments/slots`      | Get available time slots        |
| GET    | `/appointments/:id/pdf`    | 📄 **Generate appointment PDF** |
| GET    | `/appointments/:id/verify` | Public verification endpoint    |
| POST   | `/appointments/import`     | CSV import appointments         |

### Billing (`/bills` - billingRoutes.js)

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/bills`            | Get all bills            |
| GET    | `/bills/:id`        | Get single bill          |
| POST   | `/bills`            | Create bill              |
| PUT    | `/bills/:id`        | Update bill              |
| DELETE | `/bills/:id`        | Delete bill              |
| GET    | `/bills/:id/pdf`    | 📄 **Generate bill PDF** |
| GET    | `/bills/:id/verify` | Public bill verification |

### PDF Generation (`/pdf` - pdfRoutes.js)

| Method | Endpoint                       | Description                                  |
| ------ | ------------------------------ | -------------------------------------------- |
| POST   | `/pdf/preview`                 | 📄 **Generate PDF preview for appointment**  |
| POST   | `/pdf/create-next-appointment` | Create follow-up appointment from PDF editor |

### Services (`/services` - serviceRoutes.js)

| Method | Endpoint           | Description                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/services`        | Get all services (paginated) |
| GET    | `/services/:id`    | Get single service           |
| POST   | `/services`        | Create service               |
| PUT    | `/services/:id`    | Update service               |
| DELETE | `/services/:id`    | Delete service               |
| POST   | `/services/import` | CSV import services          |

### Taxes (`/api/taxes` - taxRoutes.js)

| Method | Endpoint         | Description   |
| ------ | ---------------- | ------------- |
| GET    | `/api/taxes`     | Get all taxes |
| POST   | `/api/taxes`     | Create tax    |
| PUT    | `/api/taxes/:id` | Update tax    |
| DELETE | `/api/taxes/:id` | Delete tax    |

### Clinics (`/api` - clinicRoutes.js)

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/clinics`     | Get all clinics   |
| GET    | `/api/clinics/:id` | Get single clinic |
| POST   | `/api/clinics`     | Create clinic     |
| PUT    | `/api/clinics/:id` | Update clinic     |
| DELETE | `/api/clinics/:id` | Delete clinic     |

### Receptionists (`/api/receptionists` - receptionistRoutes.js)

| Method | Endpoint                                    | Description           |
| ------ | ------------------------------------------- | --------------------- |
| GET    | `/api/receptionists`                        | Get all receptionists |
| POST   | `/api/receptionists`                        | Create receptionist   |
| PUT    | `/api/receptionists/:id`                    | Update receptionist   |
| DELETE | `/api/receptionists/:id`                    | Delete receptionist   |
| POST   | `/api/receptionists/:id/resend-credentials` | Resend credentials    |

### Encounters (`/encounters` - encounterRoutes.js)

| Method | Endpoint                                     | Description          |
| ------ | -------------------------------------------- | -------------------- |
| GET    | `/encounters`                                | Get all encounters   |
| GET    | `/encounters/:id`                            | Get single encounter |
| POST   | `/encounters`                                | Create encounter     |
| PUT    | `/encounters/:id`                            | Update encounter     |
| DELETE | `/encounters/:id`                            | Delete encounter     |
| POST   | `/encounters/:id/reports`                    | Add medical report   |
| PUT    | `/encounters/:encounterId/reports/:reportId` | Update report        |
| DELETE | `/encounters/:encounterId/reports/:reportId` | Delete report        |

### Encounter Templates (`/encounter-templates` - encounterTemplateRoutes.js)

| Method | Endpoint                   | Description       |
| ------ | -------------------------- | ----------------- |
| GET    | `/encounter-templates`     | Get all templates |
| POST   | `/encounter-templates`     | Create template   |
| PUT    | `/encounter-templates/:id` | Update template   |
| DELETE | `/encounter-templates/:id` | Delete template   |

### Dashboard Stats (`/dashboard-stats` - dashboardRoutes.js)

| Method | Endpoint                            | Description              |
| ------ | ----------------------------------- | ------------------------ |
| GET    | `/dashboard-stats`                  | Get dashboard statistics |
| GET    | `/dashboard-stats/clinic/:clinicId` | Clinic-specific stats    |

### Holidays (`/holidays` - holidayRoutes.js)

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/holidays`     | Get all holidays |
| POST   | `/holidays`     | Create holiday   |
| DELETE | `/holidays/:id` | Delete holiday   |

### Listings (`/listings` - listingRoutes.js)

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/listings`     | Get all listings |
| PUT    | `/listings/:id` | Update listing   |

### Settings (`/api/settings` - settingsRoutes.js)

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| GET    | `/api/settings` | Get system settings |
| PUT    | `/api/settings` | Update settings     |

### Approvals (`/api/approvals` - approvalRoutes.js)

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/api/approvals`             | Get pending approvals |
| POST   | `/api/approvals/:id/approve` | Approve request       |
| POST   | `/api/approvals/:id/reject`  | Reject request        |

### Email (`/api/email` - emailRoutes.js)

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| POST   | `/api/email/send`          | Send email          |
| GET    | `/api/email/templates`     | Get email templates |
| PUT    | `/api/email/templates/:id` | Update template     |

### SMS (`/api/sms` - smsRoutes.js)

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/sms/send`      | Send SMS via WhatsApp |
| GET    | `/api/sms/templates` | Get SMS templates     |

### Google OAuth (`/api/auth/google/doctor` - googleOAuthRoutes.js)

| Method | Endpoint                             | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/api/auth/google/doctor/connect`    | Initiate Google Meet connection |
| GET    | `/api/auth/google/doctor/callback`   | OAuth callback                  |
| POST   | `/api/auth/google/doctor/disconnect` | Disconnect integration          |

### Zoom OAuth (`/api/auth/zoom/doctor` - zoomOAuthRoutes.js)

| Method | Endpoint                           | Description              |
| ------ | ---------------------------------- | ------------------------ |
| GET    | `/api/auth/zoom/doctor/connect`    | Initiate Zoom connection |
| GET    | `/api/auth/zoom/doctor/callback`   | OAuth callback           |
| POST   | `/api/auth/zoom/doctor/disconnect` | Disconnect integration   |

### Razorpay Payments (`/api/razorpay` - razorpayRoutes.js)

| Method | Endpoint                       | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/api/razorpay/settings`       | Get Razorpay configuration     |
| POST   | `/api/razorpay/settings`       | Save Razorpay settings (admin) |
| POST   | `/api/razorpay/create-order`   | Create payment order           |
| POST   | `/api/razorpay/verify-payment` | Verify and complete payment    |

### Transactions (`/api/transactions` - transactionRoutes.js)

| Method | Endpoint                     | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/transactions`          | Get all transactions           |
| GET    | `/api/transactions/summary`  | Get revenue summary            |
| GET    | `/api/transactions/razorpay` | Get Razorpay-only transactions |

---

## 📄 PDF Generation Logic

PDF generation is implemented in **three locations** using `pdf-lib`:

### 1. `backend/routes/pdfRoutes.js`

- **POST `/pdf/preview`** - Creates customizable appointment PDF preview
- Layout configuration: header, footer, notes, next appointment, services
- Uses clinic logo from `backend/assets/logo.png`
- Returns PDF as Base64 string

### 2. `backend/routes/billingRoutes.js`

- **GET `/bills/:id/pdf`** - Generates professional medical receipt PDF
- Includes: clinic header, patient info, services table, tax breakdown
- QR code with verification URL: `${FRONTEND_URL}/verify/bill/:id`
- Razorpay payment details for online transactions

### 3. `backend/routes/appointmentRoutes.js`

- **GET `/appointments/:id/pdf`** - Generates appointment confirmation PDF
- Includes: clinic info, patient details, appointment time/date
- QR code with verification URL: `${FRONTEND_URL}/verify/appointment/:id`

---

## 🖥️ Frontend Routes (App.jsx)

### Admin Section (`/admin-dashboard/*`)

| Path                     | Component             | Description          |
| ------------------------ | --------------------- | -------------------- |
| `/admin-dashboard`       | AdminDashboard        | Main admin dashboard |
| `/admin/profile`         | AdminProfile          | Admin profile page   |
| `/admin/change-password` | AdminChangePassword   | Password change      |
| `/patients`              | Patients              | Patient management   |
| `/admin/AddPatient`      | AddPatient            | Add new patient      |
| `/EditPatient/:id`       | EditPatient           | Edit patient         |
| `/doctors`               | Doctors               | Doctor management    |
| `/AddDoctor`             | AddDoctor             | Add new doctor       |
| `/Appointments`          | Appointment           | Appointment list     |
| `/BillingRecords`        | BillingRecords        | Billing management   |
| `/AddBill`               | AddBill               | Create new bill      |
| `/EditBill/:id`          | EditBill              | Edit bill            |
| `/services`              | Services              | Service management   |
| `/taxes`                 | Taxes                 | Tax configuration    |
| `/DoctorSession`         | DoctorSession         | Doctor sessions      |
| `/clinic-list`           | ClinicList            | Clinic management    |
| `/add-clinic`            | AddClinic             | Add new clinic       |
| `/encounter-list`        | EncounterList         | Encounter records    |
| `/encounter-templates`   | EncounterTemplateList | Templates            |
| `/receptionists`         | ReceptionistList      | Receptionist list    |
| `/add-receptionist`      | AddReceptionist       | Add receptionist     |
| `/payment-reports`       | PaymentReports        | Financial reports    |
| `/settings/*`            | SettingsLayout        | Admin settings       |

### Clinic Section (`/clinic-dashboard/*`)

| Path                                | Component            | Description      |
| ----------------------------------- | -------------------- | ---------------- |
| `/clinic-dashboard`                 | ClinicDashboard      | Clinic dashboard |
| `/clinic-dashboard/appointments`    | ClinicAppointments   | Appointments     |
| `/clinic-dashboard/patients`        | ClinicPatients       | Patient list     |
| `/clinic-dashboard/doctors`         | ClinicDoctors        | Doctor list      |
| `/clinic-dashboard/receptionists`   | ClinicReceptionists  | Receptionists    |
| `/clinic-dashboard/services`        | ClinicServices       | Services         |
| `/clinic-dashboard/BillingRecords`  | ClinicBillingRecords | Billing          |
| `/clinic-dashboard/profile`         | ClinicProfile        | Clinic profile   |
| `/clinic-dashboard/payment-reports` | ClinicPaymentReports | Reports          |
| `/clinic-dashboard/settings/*`      | ClinicSettingsLayout | Settings         |

### Doctor Section (`/doctor-dashboard/*`)

| Path                       | Component                | Description      |
| -------------------------- | ------------------------ | ---------------- |
| `/doctor-dashboard`        | DoctorDashboard          | Doctor dashboard |
| `/doctor/patients`         | DoctorPatients           | Patient list     |
| `/doctor/appointments`     | DoctorAppointments       | Appointments     |
| `/doctor/appointments/:id` | DoctorAppointmentDetails | Details          |
| `/doctor/services`         | DoctorServices           | Services         |
| `/doctor/profile`          | DoctorProfile            | Profile          |
| `/doctor/encounters`       | DoctorEncounterList      | Encounters       |
| `/doctor/billing`          | DoctorBillingRecords     | Billing          |
| `/doctor/settings/*`       | SettingLayout            | Settings         |

### Patient Section (`/patient/*`)

| Path                    | Component              | Description              |
| ----------------------- | ---------------------- | ------------------------ |
| `/patient`              | PatientDashboard       | Patient dashboard        |
| `/patient/appointments` | PatientAppointments    | My appointments          |
| `/patient/book`         | PatientBookAppointment | Book appointment         |
| `/patient/profile`      | PatientProfile         | My profile               |
| `/patient/encounters`   | Encounters             | My encounters            |
| `/patient/billing`      | PatientBilling         | My bills (with Razorpay) |
| `/patient/reports`      | MedicalReport          | My reports               |

### Receptionist Section (`/reception-dashboard/*`)

| Path                                   | Component                  | Description  |
| -------------------------------------- | -------------------------- | ------------ |
| `/reception-dashboard`                 | ReceptionistDashboard      | Dashboard    |
| `/reception-dashboard/appointments`    | ReceptionistAppointment    | Appointments |
| `/reception-dashboard/doctors`         | ReceptionistDoctor         | Doctors      |
| `/receptionist-dashboard/patients`     | ReceptionistPatients       | Patients     |
| `/reception-dashboard/billing`         | ReceptionistBillingRecords | Billing      |
| `/reception-dashboard/payment-reports` | ReceptionistPaymentReports | Reports      |
| `/receptionist-dashboard/settings/*`   | ReceptionistSettingsLayout | Settings     |

### Public Routes

| Path                      | Component         | Description              |
| ------------------------- | ----------------- | ------------------------ |
| `/`                       | Login             | Login page               |
| `/login`                  | Login             | Login page               |
| `/signup`                 | Login             | Signup (same as login)   |
| `/forgot-password`        | ForgotPassword    | Password recovery        |
| `/reset-password/:token`  | ResetPassword     | Reset with token         |
| `/verify/appointment/:id` | VerifyAppointment | Public verification      |
| `/verify/bill/:id`        | VerifyBill        | Public bill verification |

---

## 📊 Database Models (`backend/models/`)

| Model              | File                    | Description             |
| ------------------ | ----------------------- | ----------------------- |
| Admin              | `Admin.js`              | System administrators   |
| Appointment        | `Appointment.js`        | Patient appointments    |
| AppointmentSetting | `AppointmentSetting.js` | Booking settings        |
| Billing            | `Billing.js`            | Bills and invoices      |
| Clinic             | `Clinic.js`             | Hospital/clinic records |
| Counter            | `Counter.js`            | Auto-increment counters |
| Doctor             | `Doctor.js`             | Doctor profiles         |
| DoctorSession      | `DoctorSession.js`      | Doctor availability     |
| Encounter          | `Encounter.js`          | Patient encounters      |
| EncounterTemplate  | `EncounterTemplate.js`  | Encounter templates     |
| Holiday            | `Holiday.js`            | Holiday calendar        |
| Listing            | `Listing.js`            | Listing settings        |
| Patient            | `Patient.js`            | Patient profiles        |
| ProSetting         | `ProSetting.js`         | Pro/payment settings    |
| Receptionist       | `Receptionist.js`       | Receptionist accounts   |
| Service            | `Service.js`            | Medical services        |
| SmsTemplate        | `SmsTemplate.js`        | SMS templates           |
| Tax                | `Tax.js`                | Tax configurations      |
| User               | `User.js`               | User accounts           |

---

## 🛠️ Backend Utilities (`backend/utils/`)

| Utility              | File                              | Description                  |
| -------------------- | --------------------------------- | ---------------------------- |
| Cache                | `cache.js`                        | In-memory caching            |
| Email Service        | `emailService.js`                 | Nodemailer config            |
| Email Templates      | `emailTemplates.js`               | HTML email templates         |
| Password Generator   | `generatePassword.js`             | Random password creation     |
| Keep Alive           | `keepAlive.js`                    | Render deployment ping       |
| Logger               | `logger.js`                       | Winston logging              |
| Meeting Service      | `meetingService.js`               | Google Meet/Zoom integration |
| Populate Helper      | `populateHelper.js`               | MongoDB population helpers   |
| Receptionist Welcome | `sendReceptionistWelcomeEmail.js` | Welcome email                |
| Socket Server        | `socketServer.js`                 | Socket.io for real-time      |
| WhatsApp Service     | `whatsappService.js`              | WhatsApp Business API        |

---

## 🔧 Backend Middleware (`backend/middleware/`)

| Middleware     | File               | Description                |
| -------------- | ------------------ | -------------------------- |
| Auth           | `auth.js`          | JWT token verification     |
| Error Handler  | `errorHandler.js`  | Global error handling      |
| Mongo Sanitize | `mongoSanitize.js` | NoSQL injection prevention |
| Upload         | `upload.js`        | Multer file upload         |
| Validation     | `validation.js`    | Input validation rules     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
# Create .env with required variables
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend `.env`:**

```env
PORT=3001
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email
EMAIL_PASS=your_password
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

**Frontend `.env`:**

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## 📚 Documentation

### 📖 Quick Start Guides

| Document                                    | Description             |
| ------------------------------------------- | ----------------------- |
| [Development Setup](./DEVELOPMENT_SETUP.md) | Local environment setup |
| [Deployment Guide](./DEPLOYMENT_GUIDE.md)   | AWS EC2 + S3 deployment |
| [Contributing](./CONTRIBUTING.md)           | Contribution guidelines |

### 🏗️ Architecture & Technical

| Document                                | Description               |
| --------------------------------------- | ------------------------- |
| [Architecture](./ARCHITECTURE.md)       | System design & data flow |
| [Database Schema](./DATABASE_SCHEMA.md) | MongoDB models            |
| [API Endpoints](./API_ENDPOINTS.md)     | Complete API reference    |

### 📂 Deep Documentation (`docs/` folder)

| Document                                             | Description                     |
| ---------------------------------------------------- | ------------------------------- |
| [Documentation Index](./docs/INDEX.md)               | 📌 Start here for all docs      |
| [File Structure](./docs/FILE_STRUCTURE.md)           | Complete file-by-file breakdown |
| [Authentication Flow](./docs/AUTHENTICATION_FLOW.md) | Login, JWT, OAuth               |
| [Billing System](./docs/BILLING_SYSTEM.md)           | Billing & Razorpay              |
| [PDF Generation](./docs/PDF_GENERATION.md)           | PDF creation logic              |
| [Appointment Flow](./docs/APPOINTMENT_FLOW.md)       | Booking system                  |
| [Role Permissions](./docs/ROLE_PERMISSIONS.md)       | RBAC documentation              |
| [Integrations](./docs/INTEGRATIONS.md)               | Google Meet, Zoom, WhatsApp     |
| [Frontend Components](./docs/FRONTEND_COMPONENTS.md) | React components                |
| [Backend Routes Deep](./docs/BACKEND_ROUTES_DEEP.md) | Route logic details             |
| [Environment Config](./docs/ENVIRONMENT_CONFIG.md)   | All env variables               |
| [Troubleshooting](./docs/TROUBLESHOOTING.md)         | Common issues & fixes           |

### 📋 Developer Guides

| Document                                                  | Description               |
| --------------------------------------------------------- | ------------------------- |
| [Backend Developer Guide](./Backend_Developer_Guide.md)   | Backend architecture      |
| [Frontend Developer Guide](./Frontend_Developer_Guide.md) | Frontend structure        |
| [Razorpay Integration](./README_RAZORPAY.md)              | Payment gateway           |
| [AWS Deployment Guide](./OneCare_AWS_Deployment_Guide.md) | AWS specific guide        |
| [Route Migration Guide](./route_migration_guide.md)       | Route refactoring history |

---

## 🔒 Security Features

- **Helmet.js** - HTTP security headers
- **CORS** - Cross-origin protection
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Mongo Sanitize** - NoSQL injection prevention
- **Input Validation** - Request validation

---

## 📱 Role-Based Access

| Role             | Dashboard              | Capabilities                       |
| ---------------- | ---------------------- | ---------------------------------- |
| **Admin**        | `/admin-dashboard`     | Full system access, all clinics    |
| **Clinic Admin** | `/clinic-dashboard`    | Single clinic management           |
| **Doctor**       | `/doctor-dashboard`    | Patients, appointments, billing    |
| **Patient**      | `/patient`             | Book, view appointments, pay bills |
| **Receptionist** | `/reception-dashboard` | Front desk operations              |

---

_OneCare Hospital Management System - Version 2.0_
