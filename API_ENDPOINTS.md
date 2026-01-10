# API Endpoints Reference

Base URL: `/` or `/api` (depending on the route)

## 🔑 Authentication

| Method | Endpoint                 | Description                                           | Auth Required |
| :----- | :----------------------- | :---------------------------------------------------- | :------------ |
| `POST` | `/login`                 | Authenticate user (Admin/Doctor/Patient/Receptionist) | No            |
| `POST` | `/forgot-password`       | Initiate password reset                               | No            |
| `POST` | `/reset-password/:token` | Reset password                                        | No            |
| `POST` | `/change-password`       | Change password for logged in user                    | Yes           |

## 👨‍⚕️ Doctors

| Method   | Endpoint       | Description                     | Auth Required |
| :------- | :------------- | :------------------------------ | :------------ |
| `GET`    | `/doctors`     | List all doctors for the clinic | Yes           |
| `GET`    | `/doctors/:id` | Get specific doctor details     | Yes           |
| `POST`   | `/doctors`     | Add a new doctor                | Yes (Admin)   |
| `PUT`    | `/doctors/:id` | Update doctor profile           | Yes           |
| `DELETE` | `/doctors/:id` | Remove a doctor                 | Yes (Admin)   |

## 😷 Patients

| Method | Endpoint                    | Description                        | Auth Required |
| :----- | :-------------------------- | :--------------------------------- | :------------ |
| `GET`  | `/patients`                 | List all patients                  | Yes           |
| `POST` | `/patients`                 | Register a new patient             | Yes           |
| `GET`  | `/patients/:id`             | Get patient profile                | Yes           |
| `GET`  | `/patients/by-user/:userId` | Get patient linked to user account | Yes           |

## 📅 Appointments

| Method | Endpoint                   | Description                    | Auth Required |
| :----- | :------------------------- | :----------------------------- | :------------ |
| `GET`  | `/appointments`            | List appointments (filterable) | Yes           |
| `POST` | `/appointments`            | Book an appointment            | Yes           |
| `PUT`  | `/appointments/:id`        | Update status/details          | Yes           |
| `GET`  | `/appointments/:id/pdf`    | Download appointment PDF       | Yes           |
| `GET`  | `/appointments/:id/verify` | **Public** Verification URL    | No            |

## 🧾 Billing

| Method | Endpoint                       | Description                   | Auth Required |
| :----- | :----------------------------- | :---------------------------- | :------------ |
| `GET`  | `/bills`                       | List all bills                | Yes           |
| `POST` | `/bills`                       | Generate a new bill           | Yes           |
| `GET`  | `/bills/:id/pdf`               | Download Bill PDF             | Yes           |
| `GET`  | `/bills/:id/verify`            | **Public** Bill Verification  | No            |
| `POST` | `/api/razorpay/create-order`   | Create Razorpay payment order | Yes           |
| `POST` | `/api/razorpay/verify-payment` | Callback for payment success  | Yes           |

## 📝 Encounters (Medical Records)

| Method | Endpoint                  | Description                | Auth Required |
| :----- | :------------------------ | :------------------------- | :------------ |
| `GET`  | `/encounters`             | List patient encounters    | Yes           |
| `POST` | `/encounters`             | Create new medical record  | Yes (Doctor)  |
| `POST` | `/encounters/:id/reports` | Upload medical report file | Yes           |

## 🔧 Services & Utilities

| Method | Endpoint          | Description                  | Auth Required |
| :----- | :---------------- | :--------------------------- | :------------ |
| `GET`  | `/services`       | List clinic services         | Yes           |
| `GET`  | `/api/taxes`      | List tax configurations      | Yes           |
| `GET`  | `/pdf/preview`    | Preview PDF generated layout | Yes           |
| `POST` | `/api/email/send` | Trigger manual email         | Yes           |
