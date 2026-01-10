# 🧩 Frontend Components Reference

Complete documentation of all React components.

---

## 📊 Component Architecture

```
App.jsx (Router)
├── auth/
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   └── ResetPassword.jsx
│
├── admin-dashboard/
│   ├── AdminDashboard.jsx ────────▶ Sidebar.jsx
│   ├── Patients.jsx               │  Navbar.jsx
│   ├── Doctors.jsx                │
│   └── [other pages]              │
│
├── clinic-dashboard/
│   ├── ClinicDashboard.jsx ───────▶ Sidebar.jsx
│   └── [similar structure]
│
├── doctor-dashboard/
│   ├── DoctorDashboard.jsx ───────▶ Sidebar.jsx
│   └── [similar structure]
│
├── patient-dashboard/
│   ├── PatientDashboard.jsx ──────▶ Sidebar.jsx
│   └── [similar structure]
│
├── receptionist/
│   ├── ReceptionistDashboard.jsx ─▶ Sidebar.jsx
│   └── [similar structure]
│
├── components/ (Shared)
│   ├── LoadingFallback.jsx
│   ├── VerifyAppointment.jsx
│   └── VerifyBill.jsx
│
└── shared/
    ├── SharedListingSettings.jsx
    ├── SharedEncounterList.jsx
    └── SharedEncounterDetails.jsx
```

---

## 🔐 Authentication Components

### `Login.jsx`

**Path**: `src/auth/Login.jsx`

**Props**: None

**State**:

- `isLogin` (boolean) - Toggle between login/signup
- `email`, `password`, `name` - Form fields
- `loading` - API call status

**Key Functions**:

```javascript
handleSubmit(); // Validate and call /login API
handleGoogleLogin(); // Google OAuth flow
```

**API Calls**:

- `POST /login` - Email/password login
- `POST /google` - Google OAuth

---

### `ForgotPassword.jsx`

**Path**: `src/auth/ForgotPassword.jsx`

**Flow**: Email input → Send reset link → Show success message

**API Calls**:

- `POST /forgot-password`

---

## 📋 Dashboard Components

### `AdminDashboard.jsx`

**Path**: `src/admin-dashboard/admin/AdminDashboard.jsx`

**Props**:

- `sidebarCollapsed` (boolean)
- `toggleSidebar` (function)

**Features**:

- Statistics cards (patients, doctors, appointments, revenue)
- Recent appointments table
- Quick action buttons
- Charts (if implemented)

**API Calls**:

- `GET /dashboard-stats`
- `GET /appointments?limit=5`

---

### `PatientDashboard.jsx`

**Path**: `src/patient-dashboard/Patient/PatientDashboard.jsx`

**Features**:

- Upcoming appointments
- Quick book button
- Recent bills
- Health summary

---

## 👥 Patient Management

### `Patients.jsx`

**Path**: `src/admin-dashboard/admin/Patients.jsx`

**Features**:

- Patient list with pagination
- Search/filter functionality
- CSV import button
- Add/Edit/Delete actions

**State**:

```javascript
const [patients, setPatients] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [currentPage, setCurrentPage] = useState(1);
```

**API Calls**:

- `GET /patients`
- `DELETE /patients/:id`
- `POST /patients/import` (CSV)

---

### `AddPatient.jsx`

**Path**: `src/admin-dashboard/admin/AddPatient.jsx`

**Form Fields**:

- First Name, Last Name
- Email, Phone
- Date of Birth
- Gender
- Address
- Emergency Contact

**Validation**: Required fields marked, email format check

**API Calls**:

- `POST /patients`

---

### `EditPatient.jsx`

**Path**: `src/admin-dashboard/admin/EditPatient.jsx`

**Params**: `id` (from URL)

**API Calls**:

- `GET /patients/:id` (load data)
- `PUT /patients/:id` (save)

---

## 👨‍⚕️ Doctor Management

### `Doctors.jsx`

**Path**: `src/admin-dashboard/admin/Doctors.jsx`

**Features**:

- Doctor cards or table view
- Specialization filter
- Resend credentials action
- Session management link

---

### `AddDoctor.jsx`

**Form Fields**:

- Personal: Name, Email, Phone
- Professional: Specialization, Qualifications
- Practice: Consultation Fee, Experience
- Clinic assignment

**Special**: Auto-generates password, sends welcome email

---

## 📅 Appointment Components

### `Appointments.jsx`

**Path**: `src/admin-dashboard/admin/Appointments.jsx`

**Features**:

- Calendar view or list view
- Date range filter
- Status filter (Scheduled/Completed/Cancelled)
- Doctor filter
- Status update actions

---

### `PatientBookAppointment.jsx`

**Path**: `src/patient-dashboard/Patient/PatientBookAppointment.jsx`

**Booking Steps**:

1. Select Doctor
2. Choose Date (calendar)
3. Pick Time Slot
4. Select Services
5. Confirm & Pay (optional)

**State Flow**:

```javascript
const [step, setStep] = useState(1);
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [selectedDate, setSelectedDate] = useState(null);
const [availableSlots, setAvailableSlots] = useState([]);
const [selectedSlot, setSelectedSlot] = useState(null);
```

---

## 🧾 Billing Components

### `BillingRecords.jsx`

**Path**: `src/admin-dashboard/admin/BillingRecords.jsx`

**Features**:

- Bills list with status badges
- Payment status filter
- Date range filter
- Download PDF action
- View/Edit actions

---

### `AddBill.jsx`

**Path**: `src/admin-dashboard/admin/AddBill.jsx`

**Form Structure**:

```
┌─────────────────────────────────────────┐
│ PATIENT SELECTION (Dropdown/Search)     │
├─────────────────────────────────────────┤
│ SERVICE SELECTION (Multi-select)        │
│  ┌──────────────┬───────┬───────┐       │
│  │ Service Name │ Qty   │ Amount│       │
│  ├──────────────┼───────┼───────┤       │
│  │ Consultation │  1    │  500  │       │
│  │ Blood Test   │  1    │  300  │       │
│  └──────────────┴───────┴───────┘       │
├─────────────────────────────────────────┤
│ CALCULATIONS                             │
│  Subtotal:     ₹800                      │
│  Tax (18%):    ₹144                      │
│  Discount:     -₹50                      │
│  ─────────────────────                   │
│  TOTAL:        ₹894                      │
├─────────────────────────────────────────┤
│ PAYMENT                                  │
│  [Cash] [Online]                         │
│  Amount Paid: [________]                 │
└─────────────────────────────────────────┘
```

---

### `PatientBills.jsx`

**Path**: `src/patient-dashboard/Patient/PatientBills.jsx`

**Features**:

- View own bills
- Pay outstanding bills (Razorpay)
- Download PDF receipts
- Payment history

**Razorpay Integration**:

```javascript
const handlePayNow = async (billId) => {
  // 1. Create order
  const order = await axios.post(`${API_BASE}/api/razorpay/create-order`, {
    billId,
  });

  // 2. Open Razorpay checkout
  const options = {
    key: razorpayKeyId,
    amount: order.data.amount,
    order_id: order.data.id,
    handler: async (response) => {
      // 3. Verify payment
      await axios.post(`${API_BASE}/api/razorpay/verify-payment`, {
        billId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      toast.success("Payment successful!");
      fetchBills();
    },
  };
  new window.Razorpay(options).open();
};
```

---

## ⚙️ Settings Components

### `SettingsLayout.jsx`

**Path**: `src/admin-dashboard/admin/settings/SettingsLayout.jsx`

**Structure**:

```jsx
<div className="settings-container">
  <SettingsSidebar /> {/* Navigation tabs */}
  <div className="settings-content">
    <Outlet /> {/* Nested route content */}
  </div>
</div>
```

### Settings Pages:

- `HolidaySettings.jsx` - Manage holidays
- `EmailTemplates.jsx` - Edit email templates
- `SmsWhatsappTemplates.jsx` - SMS configuration
- `GoogleMeetSettings.jsx` - Google integration
- `ZoomTelemedSettings.jsx` - Zoom integration
- `PaymentSettings.jsx` - Razorpay configuration
- `ListingSettings.jsx` - Doctor listing options
- `AppointmentSettings.jsx` - Booking rules

---

## 🔗 Shared/Reusable Components

### `LoadingFallback.jsx`

```jsx
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);
```

### `Sidebar.jsx` (varies by dashboard)

Common props:

- `collapsed` (boolean)
- `onToggle` (function)

---

## 📱 Mobile Responsiveness

All dashboards use Bootstrap grid system:

```jsx
<div className="row">
  <div className="col-12 col-md-6 col-lg-3">
    <StatCard />
  </div>
</div>
```

Sidebar collapses to hamburger menu on mobile.

---

## 🎨 Styling Patterns

1. **CSS Modules**: Component-specific styles
2. **Bootstrap Classes**: Layout and utilities
3. **Custom CSS Files**: `OneCareAuth.css`, dashboard styles
4. **Inline Styles**: Dynamic styling based on state
