# Route Migration Guide

This document outlines the recent refactoring of `backend/index.js`. The monolithic file has been split into modular route files to improve maintainability.

## 📂 New Directory Structure

Routes are now located in `backend/routes/`.

| Feature             | New File Path                           | Mount Point in `index.js` |
| :------------------ | :-------------------------------------- | :------------------------ |
| **Patients**        | `backend/routes/patientRoutes.js`       | `/patients`               |
| **Doctor Sessions** | `backend/routes/doctorSessionRoutes.js` | `/doctor-sessions`        |
| **Appointments**    | `backend/routes/appointmentRoutes.js`   | `/appointments`           |
| **Services**        | `backend/routes/serviceRoutes.js`       | `/api/services`           |
| **Taxes**           | `backend/routes/taxRoutes.js`           | `/taxes`                  |
| **Bills**           | `backend/routes/billingRoutes.js`       | `/bills`                  |
| **Dashboard Stats** | `backend/routes/dashboardRoutes.js`     | `/dashboard-stats`        |
| **User Profile**    | `backend/routes/userRoutes.js`          | `/` (Root)                |

## 🔄 Route Mapping Table

Here is a detailed mapping of where specific routes have moved.

| HTTP Method | Original Route                 | New Location                                      | Notes                                 |
| :---------- | :----------------------------- | :------------------------------------------------ | :------------------------------------ |
| **GET**     | `/patients`                    | `patientRoutes.js` -> `/`                         |                                       |
| **GET**     | `/patients/:id`                | `patientRoutes.js` -> `/:id`                      |                                       |
| **POST**    | `/patients`                    | `patientRoutes.js` -> `/`                         |                                       |
| **PUT**     | `/patients/:id`                | `patientRoutes.js` -> `/:id`                      |                                       |
| **DELETE**  | `/patients/:id`                | `patientRoutes.js` -> `/:id`                      |                                       |
| **POST**    | `/patients/import`             | `patientRoutes.js` -> `/import`                   |                                       |
| **GET**     | `/doctor-sessions`             | `doctorSessionRoutes.js` -> `/`                   |                                       |
| **POST**    | `/doctor-sessions`             | `doctorSessionRoutes.js` -> `/`                   |                                       |
| **GET**     | `/appointments`                | `appointmentRoutes.js` -> `/`                     |                                       |
| **POST**    | `/appointments`                | `appointmentRoutes.js` -> `/`                     |                                       |
| **GET**     | `/appointments/:id/pdf`        | `appointmentRoutes.js` -> `/:id/pdf`              |                                       |
| **GET**     | `/api/services`                | `serviceRoutes.js` -> `/`                         |                                       |
| **GET**     | `/taxes`                       | `taxRoutes.js` -> `/`                             |                                       |
| **GET**     | `/bills`                       | `billingRoutes.js` -> `/`                         |                                       |
| **GET**     | `/dashboard-stats`             | `dashboardRoutes.js` -> `/`                       |                                       |
| **GET**     | `/api/user/:id`                | `userRoutes.js` -> `/api/user/:id`                | Mounted at root to preserve full path |
| **PUT**     | `/users/:id/profile-completed` | `userRoutes.js` -> `/users/:id/profile-completed` | Mounted at root to preserve full path |

## 🛠️ How to Add New Routes

1.  **Identify the Feature**: Determine which domain the new route belongs to (e.g., Patients, Billing).
2.  **Open the Corresponding File**: Go to `backend/routes/[feature]Routes.js`.
3.  **Add the Route**: Define the route using `router.get()`, `router.post()`, etc.
    - _Note_: Most files are mounted with a prefix (e.g., `/patients`). So `router.get('/')` becomes `GET /patients`.
4.  **Create New File (If needed)**: If it's a completely new feature:
    - Create `backend/routes/newFeatureRoutes.js`.
    - Define routes and export the router.
    - Import and mount it in `backend/index.js`.

## ⚙️ Configuration Changes

- **Database**: MongoDB connection logic is now in `backend/config/db.js`.
- **Uploads**: Multer configuration is now in `backend/middleware/upload.js`.
