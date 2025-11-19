import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUserDoctor } from "react-icons/fa6";
import { FaUserInjured } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { FaMoneyBill1Wave } from "react-icons/fa6";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalPatients: 0 });
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    axios
      .get("http://localhost:3001/dashboard-stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error fetching dashboard stats:", err));
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid py-4">
        <h3 className="fw-bold text-primary mb-4">Dashboard Overview</h3>

        {/* Widgets Row */}
        <div className="row g-4">
          {/* 🧍 Total Patients */}
          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-3 text-center clickable "
             style={{ cursor: "pointer" }}
              onClick={() => navigate("/patients")}>

              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3">
                  <FaUserInjured  size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Patients</h6>
                  <h3 className="fw-bold mb-0">{stats.totalPatients}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-3 text-center clickable "
             style={{ cursor: "pointer" }}
              onClick={() => navigate("/Doctors")}>

              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                  <FaUserDoctor size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Doctors</h6>
                  <h3 className="fw-bold mb-0">{stats.totalDoctors}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
           <div className="card shadow-sm border-0 p-3 text-center clickable "
             style={{ cursor: "pointer" }}
              onClick={() => navigate("/patients")}>
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                  <i className="fa fa-calendar-check fa-lg"></i>
                  <FaCalendarCheck size={30}/>
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Appointments</h6>
                  <h3 className="fw-bold mb-0">{stats.totalAppointments}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm border-0 p-3 text-center clickable "
             style={{ cursor: "pointer" }}
              onClick={() => navigate("/patients")}>
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-info bg-opacity-10 text-info rounded-circle p-3">
                  <i className="fa fa-rupee-sign fa-lg"></i>
                  <FaMoneyBill1Wave size={30}/>
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Revenue</h6>
                  <h3 className="fw-bold mb-0">₹0</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
