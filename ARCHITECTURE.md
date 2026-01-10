# System Architecture

## 🔭 High-Level Overview

OneCare is a comprehensive Hospital Management System (HMS) designed to manage multi-clinic operations. It follows a **Client-Server Architecture** with role-based dashboards.

---

## 🏗️ System Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "CDN / Static Hosting"
        S3[AWS S3 / Vercel]
    end

    subgraph "Application Layer"
        API[Express.js API Server]
        Socket[Socket.io Server]
    end

    subgraph "External Services"
        Google[Google OAuth / Meet]
        Zoom[Zoom API]
        Razorpay[Razorpay Gateway]
        SMTP[SMTP Email Server]
        WhatsApp[WhatsApp Business API]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB Atlas)]
        Uploads[File Storage]
    end

    Browser --> S3
    Mobile --> S3
    S3 -->|API Requests| API
    API --> MongoDB
    API --> Uploads
    API --> Socket
    API --> Google
    API --> Zoom
    API --> Razorpay
    API --> SMTP
    API --> WhatsApp
```

---

## 🧩 Component Breakdown

### 1. Frontend (React + Vite)

| Dashboard              | Role         | Key Features                       |
| ---------------------- | ------------ | ---------------------------------- |
| `/admin-dashboard`     | Super Admin  | System-wide control, all clinics   |
| `/clinic-dashboard`    | Clinic Admin | Single clinic management           |
| `/doctor-dashboard`    | Doctor       | Patients, appointments, encounters |
| `/patient-dashboard`   | Patient      | Booking, bills, medical reports    |
| `/reception-dashboard` | Receptionist | Front-desk operations              |

**Technology Stack:**

- React 18 with Vite
- React Router v6
- Bootstrap 5 + Custom CSS
- Axios for API calls
- React Hot Toast for notifications

### 2. Backend (Node.js + Express)

```mermaid
graph LR
    Request[HTTP Request] --> Middleware

    subgraph "Middleware Pipeline"
        Middleware[CORS/Helmet] --> Auth[JWT Auth]
        Auth --> Sanitize[Mongo Sanitize]
        Sanitize --> Validate[Validation]
    end

    Validate --> Router[Route Handler]
    Router --> Controller[Business Logic]
    Controller --> Model[Mongoose Model]
    Model --> DB[(MongoDB)]
```

**Key Modules:**
| Module | Purpose |
|--------|---------|
| `auth.js` | JWT authentication & Google OAuth |
| `billingRoutes.js` | Invoicing & Razorpay payments |
| `appointmentRoutes.js` | Booking & scheduling |
| `pdfRoutes.js` | PDF generation with pdf-lib |
| `socketServer.js` | Real-time notifications |

### 3. Database (MongoDB Atlas)

- **Type**: Document-oriented NoSQL
- **Hosting**: MongoDB Atlas (managed cloud)
- **Collections**: 19 (see DATABASE_SCHEMA.md)
- **Indexes**: On `clinicId`, `date`, `email` for performance

---

## 🔄 Key Data Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    U->>F: Enter credentials
    F->>B: POST /login
    B->>DB: Find user by email
    DB-->>B: User document
    B->>B: Verify password (bcrypt)
    B->>B: Generate JWT
    B-->>F: { token, user, role }
    F->>F: Store in localStorage
    F-->>U: Redirect to dashboard
```

### Appointment Booking Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    P->>F: Select doctor & date
    F->>B: GET /appointments/slots
    B->>DB: Check existing appointments
    B-->>F: Available slots
    P->>F: Pick slot & confirm
    F->>B: POST /appointments
    B->>DB: Create appointment
    B->>B: Send email confirmation
    B-->>F: Appointment created
    F-->>P: Success message
```

### Payment Flow (Razorpay)

```mermaid
sequenceDiagram
    participant P as Patient
    participant F as Frontend
    participant B as Backend
    participant R as Razorpay

    P->>F: Click "Pay Now"
    F->>B: POST /api/razorpay/create-order
    B->>R: Create order
    R-->>B: Order ID
    B-->>F: Order details
    F->>R: Open Razorpay checkout
    P->>R: Complete payment
    R-->>F: Payment response
    F->>B: POST /api/razorpay/verify-payment
    B->>B: Verify HMAC signature
    B->>B: Update bill status
    B-->>F: Payment confirmed
```

---

## 🌐 Infrastructure (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│   CloudFront      │                    │   EC2 Instance    │
│   (CDN + SSL)     │                    │   (Ubuntu 22.04)  │
│                   │                    │                   │
│   S3 Static Site  │                    │   Node.js + PM2   │
│   (React Build)   │                    │   Nginx (Proxy)   │
└───────────────────┘                    └─────────┬─────────┘
                                                   │
                                         ┌─────────┴─────────┐
                                         │  MongoDB Atlas    │
                                         │  (Managed Cloud)  │
                                         └───────────────────┘
```

---

## 🔐 Security Architecture

| Layer              | Protection                             |
| ------------------ | -------------------------------------- |
| **Transport**      | HTTPS (SSL/TLS) via Certbot/CloudFront |
| **API**            | Helmet.js (security headers)           |
| **Authentication** | JWT with 7-day expiry                  |
| **Authorization**  | Role-based middleware checks           |
| **Data**           | Bcrypt password hashing (10 rounds)    |
| **Injection**      | MongoDB sanitization middleware        |
| **CORS**           | Whitelist-based origin control         |

---

## 📊 Performance Considerations

- **Lazy Loading**: Frontend components loaded on-demand
- **Compression**: Gzip enabled via Express middleware
- **Database Indexes**: On frequently queried fields
- **Connection Pooling**: Mongoose default pooling
- **CDN Caching**: Static assets cached at edge locations
