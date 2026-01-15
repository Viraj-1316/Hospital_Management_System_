# Backend Developer Guide

## 🏗️ Architecture Overview

The backend is built using **Node.js** and **Express.js**, following a modular architecture. It serves as the REST API for the frontend and handles business logic, database interactions, and third-party integrations.

### 📂 Directory Structure

```
backend/
├── config/              # Configuration files
│   └── db.js            # MongoDB connection setup
├── controllers/         # (Optional) Route logic separated from routes
├── middleware/          # Request processing middleware
│   ├── auth.js          # JWT verification
│   ├── errorHandler.js  # Global error handling
│   ├── upload.js        # Multer file upload config
│   └── validation.js    # Input validation schemas
├── models/              # Mongoose Data Models
│   ├── User.js          # Generic user (patients, clinic admins)
│   ├── Doctor.js        # Doctor specific profiles
│   ├── Appointment.js   # Appointment records
│   └── ... (see Database Schema doc)
├── routes/              # API Route Definitions
│   ├── auth.js          # Authentication routes
│   ├── appointmentRoutes.js # Appointment management
│   ├── billingRoutes.js # Billing & Invoicing
│   └── ... (one file per domain)
├── utils/               # Helper functions
│   ├── emailService.js  # Email sending (Nodemailer)
│   ├── pdfRoutes.js     # PDF generation logic
│   └── socketServer.js  # Real-time WebSocket setup
├── uploads/             # Local storage for uploaded files
├── index.js             # Application entry point
└── .env                 # Environment variables
```

---

## 🚀 Key Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JSON Web Tokens (JWT)
- **File Uploads**: Multer
- **PDF Generation**: `pdf-lib` (Backend-side generation)
- **Payments**: Razorpay
- **Real-time**: Socket.io
- **Validation**: Joi (or custom validators)
- **Logging**: Winston (`utils/logger.js`)

---

## 🛠️ Common Tasks

### 1. Adding a New API Route

To add a new feature, e.g., "Inventory":

1.  **Create Model**: `models/Inventory.js`
2.  **Create Route File**: `routes/inventoryRoutes.js`
3.  **Define Endpoints**:

    ```javascript
    const express = require("express");
    const router = express.Router();
    const { verifyToken } = require("../middleware/auth");

    router.get("/", verifyToken, async (req, res) => {
      // Implementation
    });

    module.exports = router;
    ```

4.  **Register in `index.js`**:
    ```javascript
    const inventoryRoutes = require("./routes/inventoryRoutes");
    app.use("/api/inventory", inventoryRoutes);
    ```

### 2. Database Migrations

We use Mongoose schemas. To "migrate", simply update the Schema definition in `models/YourModel.js`. Mongoose handles the structure for new documents. For existing documents, you may need to write a one-time script in `scripts/` if data transformation is needed.

### 3. PDF Generation

We use `pdf-lib` for generating PDFs.

- **Preview Logic**: `routes/pdfRoutes.js` (for temporary previews)
- **Permanent Records**: Specific logic in `billingRoutes.js` and `appointmentRoutes.js`.
- **Assets**: Logos and fonts are loaded from `backend/assets/`.

---

## 🔒 Security Best Practices

1.  **Always use `verifyToken` middleware** for protected routes.
2.  **Sanitize Inputs**: The `mongoSanitize` middleware is active globally.
3.  **Environment Variables**: Never commit secrets. Use `.env`.
4.  **Role Checks**: Inside routes, check `req.user.role` before performing sensitive actions.

---

## 🧪 Testing

Currently, the project relies on manual API testing using Postman.

- **Collection**: `OneCare_API.postman_collection.json` (Import this into Postman)

---

## 📦 Deployment

See `DEPLOYMENT_GUIDE.md` for detailed VPS deployment instructions using Nginx and PM2.
