# ⚙️ Environment Configuration

Complete guide to all environment variables used in the project.

---

## 🔙 Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3001
NODE_ENV=development    # development | production

# ===========================================
# DATABASE (MongoDB)
# ===========================================
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_db?retryWrites=true&w=majority

# ===========================================
# AUTHENTICATION (JWT)
# ===========================================
JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# ===========================================
# CORS (Cross-Origin Resource Sharing)
# ===========================================
# Comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# ===========================================
# FRONTEND URL (for emails & redirects)
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# EMAIL SERVICE (SMTP)
# ===========================================
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@yourhospital.com

# ===========================================
# GOOGLE OAUTH (For Google Meet)
# ===========================================
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/doctor/callback

# ===========================================
# ZOOM OAUTH (For Zoom Meetings)
# ===========================================
ZOOM_CLIENT_ID=xxxxxx
ZOOM_CLIENT_SECRET=xxxxxx
ZOOM_REDIRECT_URI=http://localhost:3001/api/auth/zoom/doctor/callback

# ===========================================
# RAZORPAY PAYMENT GATEWAY
# ===========================================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxx

# ===========================================
# WHATSAPP BUSINESS API
# ===========================================
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765

```

---

## 🖥️ Frontend Environment Variables

### Development (`.env`)

Create in `frontend/` directory:

```env
# API Base URL (Backend)
VITE_API_BASE_URL=http://localhost:3001

# Google OAuth Client ID (for patient login)
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Production (`.env.production`)

```env
# Production API URL
VITE_API_BASE_URL=https://api.yourdomain.com

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# Google Tag Manager (Optional)
VITE_GTM_ID=GTM-XXXXXX
```

---

## 🔒 Security Best Practices

### DO ✅

- Use strong, random JWT secrets (32+ characters)
- Store `.env` files outside version control
- Use different credentials for dev/staging/production
- Rotate secrets periodically

### DON'T ❌

- Commit `.env` files to Git
- Share credentials in plain text
- Use the same password for multiple services
- Hardcode secrets in source code

---

## 📝 .env Template Files

You can create template files for reference:

### `backend/.env.example`

```env
PORT=3001
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/DB_NAME
JWT_SECRET=your-secret-here
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@example.com
```

### `frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🔄 Loading Environment Variables

### Backend (Node.js)

```javascript
require("dotenv").config();

// Access variables
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI;
```

### Frontend (Vite)

```javascript
// Must prefix with VITE_
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## 🚀 Environment-Specific Configs

### Development

- Relaxed CORS
- Detailed error messages
- Console logging enabled

### Production

- Strict CORS (only allowed origins)
- Generic error messages
- Logging to file/service
- HTTPS required
