# 🔐 Authentication Flow Documentation

This document explains the complete authentication system used in OneCare.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Frontend      │────▶│   Backend API    │────▶│   MongoDB       │
│   (React)       │     │   (Express)      │     │   (Atlas)       │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │ JWT Token             │ bcrypt hash
        │ localStorage          │ verification
        └───────────────────────┘
```

---

## 🔑 Authentication Methods

### 1. Email/Password Login

Standard authentication for all user types.

### 2. Google OAuth

Available for **Patients only**. Uses Google's OAuth 2.0 API.

---

## 📝 Login Flow (Email/Password)

### Step 1: User Submits Credentials

```
Frontend: POST /login
Body: { email: "user@example.com", password: "secret123" }
```

### Step 2: Backend Validation

**File**: `backend/routes/auth.js`

```javascript
// Order of checks:
1. Check Admin collection
2. Check Receptionist collection
3. Check Doctor collection
4. Check User collection (Patients, Clinic Admins)
```

### Step 3: Password Verification

```javascript
const bcrypt = require("bcryptjs");
const isMatch = await bcrypt.compare(inputPassword, storedHash);
```

### Step 4: JWT Token Generation

```javascript
const jwt = require("jsonwebtoken");
const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role, clinicId: user.clinicId },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
```

### Step 5: Response to Frontend

```json
{
  "id": "60f7c2e1c4f2a3001c8b4f",
  "email": "user@example.com",
  "role": "patient",
  "name": "John Doe",
  "clinicId": "60f7c2e1c4f2a3001c8b50",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 6: Frontend Token Storage

```javascript
// frontend/src/auth/Login.jsx
localStorage.setItem("token", response.data.token);
localStorage.setItem("user", JSON.stringify(response.data));
```

### Step 7: Redirect Based on Role

```javascript
switch (user.role) {
  case "admin":
    navigate("/admin-dashboard");
    break;
  case "clinic_admin":
    navigate("/clinic-dashboard");
    break;
  case "doctor":
    navigate("/doctor-dashboard");
    break;
  case "patient":
    navigate("/patient-dashboard");
    break;
  case "receptionist":
    navigate("/reception-dashboard");
    break;
}
```

---

## 🔒 Token Verification (Protected Routes)

### Middleware: `backend/middleware/auth.js`

```javascript
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, clinicId }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
```

### Usage in Routes

```javascript
router.get("/protected-data", verifyToken, async (req, res) => {
  // req.user contains decoded token data
  const userId = req.user.id;
  const userRole = req.user.role;
  // ... fetch data
});
```

---

## 🌐 Google OAuth Flow (Patients)

### Step 1: Frontend Initiates

```javascript
// Using @react-oauth/google
const handleGoogleSuccess = async (credentialResponse) => {
  const response = await axios.post(`${API_BASE}/google`, {
    token: credentialResponse.access_token,
    clinicId: selectedClinicId,
  });
};
```

### Step 2: Backend Verification

**File**: `backend/routes/auth.js` - `/google` endpoint

```javascript
// Verify Google token
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();

client.setCredentials({ access_token: token });
const userInfo = await userInfoClient.request({
  url: "https://www.googleapis.com/oauth2/v3/userinfo",
});
```

### Step 3: Create/Update User

```javascript
let user = await User.findOne({ email: userInfo.email });
if (!user) {
  // Create new patient account
  user = await User.create({
    email: userInfo.email,
    name: userInfo.name,
    googleId: userInfo.sub,
    role: "patient",
    clinicId: clinicId,
  });
}
```

---

## 🔄 Password Reset Flow

### Step 1: Request Reset

```
POST /forgot-password
Body: { email: "user@example.com" }
```

### Step 2: Generate Token

```javascript
const crypto = require("crypto");
const resetToken = crypto.randomBytes(32).toString("hex");
const resetTokenHash = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

user.resetPasswordToken = resetTokenHash;
user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
await user.save();
```

### Step 3: Send Email

```javascript
const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
await sendEmail({
  to: user.email,
  subject: "Password Reset",
  html: `<a href="${resetUrl}">Click to reset password</a>`,
});
```

### Step 4: Reset Password

```
POST /reset-password/:token
Body: { password: "newPassword123" }
```

---

## 👥 User Roles & Collections

| Role           | Collection         | Description                     |
| -------------- | ------------------ | ------------------------------- |
| `admin`        | `Admin`            | Super admin, system-wide access |
| `clinic_admin` | `User`             | Manages single clinic           |
| `doctor`       | `Doctor`           | Medical professional            |
| `patient`      | `User` + `Patient` | Patient with medical records    |
| `receptionist` | `Receptionist`     | Front desk staff                |

---

## 🛡️ Security Best Practices

1. **Token Expiry**: Tokens expire in 7 days
2. **Password Hashing**: bcrypt with salt rounds (10)
3. **HTTPS Only**: All production traffic encrypted
4. **Rate Limiting**: Can be enabled in production
5. **Clinic Isolation**: Users can only access their clinic's data

---

## 🔧 Configuration

### Environment Variables

```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Frontend Token Handling

```javascript
// Add token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
