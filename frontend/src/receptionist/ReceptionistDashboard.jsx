// src/pages/reception/ReceptionDashboard.jsx
import React from "react";
import ReceptionistLayout from "./layouts/ReceptionistLayout";

const ReceptionDashboard = () => {
  return (
    <ReceptionistLayout>
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-5 text-center">
          <h1 className="display-4 fw-bold text-primary">Hi!</h1>
          <p className="lead text-muted">
            Welcome back to the OneCare Reception Management System.
          </p>
        </div>
      </div>
    </ReceptionistLayout>
  );
};

export default ReceptionDashboard;