# Local Development Setup

Follow these steps to set up the project on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local) or MongoDB Atlas (Cloud)
- Git

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Hospital_Management_System_.git
cd Hospital_Management_System_
```

## 2. Backend Setup

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file in `backend/`:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/hospital_db  # or your Atlas URI
JWT_SECRET=supersecretkey123
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
# Optional: Email/Razorpay keys for full feature test
```

### Start Server

```bash
npm start
# Server runs at http://localhost:3001
```

## 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### Start Frontend

```bash
npm run dev
# App runs at http://localhost:5173
```

## 4. Verification

1.  Open `http://localhost:5173` in your browser.
2.  Login with default credentials (if seeded) or Register a new user.
3.  Check backend console to ensure database connected successfully.
