# Frontend Developer Guide

## 🏗️ Architecture Overview

The frontend is a Single Page Application (SPA) built with **React** and **Vite**. It uses a dashboard-centric layout with specific sections for different user roles (Admin, Doctor, Patient, Receptionist, Clinic).

### 📂 Directory Structure (`src/`)

```
src/
├── admin-dashboard/     # Super Admin Interface
│   ├── admin/           # Admin pages (Doctors, Patients, Settings)
├── clinic-dashboard/    # Clinic Admin Interface
├── doctor-dashboard/    # Doctor Interface
├── patient-dashboard/   # Patient Interface
├── receptionist/        # Receptionist Interface
├── auth/                # Authentication Pages (Login, Forgot Password)
├── components/          # Shared Generic Components (Modals, Buttons)
├── context/             # React Contexts (UserContext, etc.)
├── utils/               # Helper functions
│   ├── config.js        # API Configuration
│   └── setFavicon.js    # Dynamic Favicon logic
├── App.jsx              # Main Routing Logic
└── main.jsx             # Entry point & Provider wrappers
```

---

## 🚀 Key Technologies

- **Build Tool**: Vite
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Bootstrap 5 + Custom CSS (`OneCareAuth.css` etc.)
- **HTTP Client**: Axios (implied usage)
- **Notifications**: `react-hot-toast`
- **PDF Viewing**: Browser native + `pdf-lib` (backend generated)
- **Icons**: React Icons (FontAwesome, Material, etc.)

---

## 📡 API Integration

### Configuration

All API requests should reference the backend URL dynamically.
**File**: `src/config.js`

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export default API_BASE;
```

### Making Requests

```javascript
import axios from "axios";
import API_BASE from "../utils/config";

const fetchData = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE}/api/endpoint`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
```

---

## 🔐 Authentication Flow

1.  **Login**: User posts credentials to `/login`.
2.  **Token**: Backend returns JWT + User Role + Clinic ID.
3.  **Storage**: Token is stored in `localStorage` ("token").
4.  **Routing**: `App.jsx` checks the token and redirects the user to their specific dashboard (`/admin-dashboard`, `/doctor-dashboard`, etc.) based on their role.

---

## 🛠️ Common Tasks

### 1. Creating a New Page

1.  Create Component: `src/admin-dashboard/pages/NewPage.jsx`
2.  Register Route: Add `<Route>` in `src/App.jsx`.
    ```jsx
    <Route path="/admin/new-page" element={<NewPage />} />
    ```
3.  Add Sidebar Link: Update the Sidebar component in `src/admin-dashboard/components/Sidebar.jsx`.

### 2. Styling

- **Global Styles**: Imported in `main.jsx`.
- **Component Styles**: Use CSS modules or specific CSS files (e.g., `OneCareAuth.css`).
- **Bootstrap**: Utility classes (`d-flex`, `mt-3`, `btn-primary`) are heavily used.

### 3. Environment Variables

- Create `.env` for local dev:
  ```
  VITE_API_BASE_URL=http://localhost:3001
  ```
- Create `.env.production` for build:
  ```
  VITE_API_BASE_URL=https://api.yourdomain.com
  ```

---

## 📦 Build & Deployment

To build for production:

```bash
npm run build
```

This produces a `dist/` folder which can be served statically (AWS S3, Vercel, Netlify).

See `OneCare_AWS_Deployment_Guide.md` for full deployment details.
