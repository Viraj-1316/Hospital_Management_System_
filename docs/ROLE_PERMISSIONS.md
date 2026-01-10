# 👥 Role-Based Access Control (RBAC)

Complete documentation of user roles and permissions.

---

## 🎭 User Roles

| Role           | Dashboard              | Description                         |
| -------------- | ---------------------- | ----------------------------------- |
| `admin`        | `/admin-dashboard`     | Super admin with system-wide access |
| `clinic_admin` | `/clinic-dashboard`    | Manages a single clinic             |
| `doctor`       | `/doctor-dashboard`    | Medical professional                |
| `patient`      | `/patient-dashboard`   | Patient with portal access          |
| `receptionist` | `/reception-dashboard` | Front desk staff                    |

---

## 🔐 Permission Matrix

### 👑 Admin (Super Admin)

| Resource         | Create | Read   | Update | Delete |
| ---------------- | ------ | ------ | ------ | ------ |
| Clinics          | ✅     | ✅ All | ✅     | ✅     |
| Doctors          | ✅     | ✅ All | ✅     | ✅     |
| Patients         | ✅     | ✅ All | ✅     | ✅     |
| Receptionists    | ✅     | ✅ All | ✅     | ✅     |
| Appointments     | ✅     | ✅ All | ✅     | ✅     |
| Billing          | ✅     | ✅ All | ✅     | ✅     |
| Services         | ✅     | ✅ All | ✅     | ✅     |
| Taxes            | ✅     | ✅ All | ✅     | ✅     |
| Settings         | ✅     | ✅ All | ✅     | ✅     |
| Payment Settings | ✅     | ✅     | ✅     | ❌     |

---

### 🏥 Clinic Admin

| Resource      | Create        | Read          | Update        | Delete        |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| Their Clinic  | ❌            | ✅ Own        | ✅ Own        | ❌            |
| Doctors       | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Patients      | ✅            | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Receptionists | ✅            | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Appointments  | ✅            | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Billing       | ✅            | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Services      | ✅            | ✅ Own Clinic | ✅ Own Clinic | ✅ Own Clinic |
| Settings      | ❌            | ✅ Own Clinic | ✅ Own Clinic | ❌            |

---

### 👨‍⚕️ Doctor

| Resource     | Create | Read        | Update        | Delete |
| ------------ | ------ | ----------- | ------------- | ------ |
| Patients     | ✅     | ✅ Assigned | ✅ Assigned   | ❌     |
| Appointments | ❌     | ✅ Own      | ✅ Own Status | ❌     |
| Encounters   | ✅     | ✅ Own      | ✅ Own        | ✅ Own |
| Billing      | ✅     | ✅ Own      | ✅ Own        | ❌     |
| Services     | ❌     | ✅ All      | ❌            | ❌     |
| Own Profile  | ❌     | ✅          | ✅            | ❌     |
| Sessions     | ✅ Own | ✅ Own      | ✅ Own        | ✅ Own |

---

### 😷 Patient

| Resource        | Create      | Read   | Update | Delete        |
| --------------- | ----------- | ------ | ------ | ------------- |
| Appointments    | ✅ Book Own | ✅ Own | ❌     | ✅ Cancel Own |
| Bills           | ❌          | ✅ Own | ❌     | ❌            |
| Encounters      | ❌          | ✅ Own | ❌     | ❌            |
| Medical Reports | ❌          | ✅ Own | ❌     | ❌            |
| Profile         | ❌          | ✅ Own | ✅ Own | ❌            |
| Pay Bills       | ✅          | ❌     | ❌     | ❌            |

---

### 💼 Receptionist

| Resource        | Create | Read      | Update         | Delete |
| --------------- | ------ | --------- | -------------- | ------ |
| Patients        | ✅     | ✅ Clinic | ✅ Clinic      | ❌     |
| Doctors         | ❌     | ✅ Clinic | ❌             | ❌     |
| Appointments    | ✅     | ✅ Clinic | ✅ Status Only | ❌     |
| Billing         | ✅     | ✅ Clinic | ✅ Clinic      | ❌     |
| Services        | ❌     | ✅ Clinic | ❌             | ❌     |
| Doctor Sessions | ❌     | ✅ Clinic | ❌             | ❌     |

---

## 🔒 Implementation

### Backend Middleware

**File**: `backend/middleware/auth.js`

```javascript
// Role-based access control
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

// Usage in routes
router.delete(
  "/clinics/:id",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    // Only admins can delete clinics
  }
);
```

### Clinic-Scoped Data Access

```javascript
// In route handlers
const getClinicScopedData = async (req, Model) => {
  const query = {};

  // Admin sees everything
  if (req.user.role === "admin") {
    return Model.find(query);
  }

  // Others see only their clinic's data
  if (req.user.clinicId) {
    query.clinicId = req.user.clinicId;
  } else {
    return []; // No clinic = no data
  }

  return Model.find(query);
};
```

### Frontend Route Protection

**File**: `frontend/src/App.jsx`

```javascript
// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Usage
<Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>;
```

### Sidebar Navigation Filtering

```javascript
const sidebarItems = [
  { label: "Dashboard", path: "/admin-dashboard", roles: ["admin"] },
  { label: "Clinics", path: "/clinic-list", roles: ["admin"] },
  { label: "Doctors", path: "/doctors", roles: ["admin", "clinic_admin"] },
  {
    label: "Patients",
    path: "/patients",
    roles: ["admin", "clinic_admin", "receptionist"],
  },
  // ...
];

const filteredItems = sidebarItems.filter((item) =>
  item.roles.includes(currentUser.role)
);
```

---

## 🔄 Role Hierarchy

```
                    ┌─────────────┐
                    │    Admin    │ ─── Full system access
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ Clinic     │ │  Doctor    │ │Receptionist│
       │ Admin      │ │            │ │            │
       └──────┬─────┘ └─────┬──────┘ └──────┬─────┘
              │             │               │
              └─────────────┼───────────────┘
                            ▼
                     ┌────────────┐
                     │  Patient   │ ─── Limited to own data
                     └────────────┘
```

---

## 🔑 First Login Password Change

Doctors and Receptionists created by admins are flagged with `mustChangePassword: true`.

```javascript
// routes/auth.js
if (doctor.mustChangePassword) {
  return res.json({
    ...doctorPayload,
    token,
    mustChangePassword: true, // Frontend redirects to change password page
  });
}

// Frontend handling
if (response.data.mustChangePassword) {
  navigate("/doctor/change-password-first");
}
```
