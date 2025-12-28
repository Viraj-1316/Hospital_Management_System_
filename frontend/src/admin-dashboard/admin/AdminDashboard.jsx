// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/AdminLayout.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { FaUserDoctor } from "react-icons/fa6";
import { FaUserInjured } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { setFavicon } from "../../utils/setFavicon.js";

import API_BASE from "../../config";

const AdminDashboard = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const navigate = useNavigate();

  // top cards
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  });

  // left list: today's / upcoming appointments
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // right side: weekly / monthly summary
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly");
  // Add this near your other useState hooks
  const [filterType, setFilterType] = useState("today"); // Options: 'today', 'upcoming', 'past', 'all'
  // Get auth config
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard-stats`, getAuthConfig());
      setStats(res.data || {});
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  const fetchAppointments = async (type = "today") => {
    setLoadingAppointments(true);
    setFilterType(type); // Update the active button state

    try {
      let url = `${API_BASE}/appointments/all`;
      if (type === "today") {
        url = `${API_BASE}/appointments/today`;
      }

      const res = await axios.get(url, getAuthConfig());
      let data = Array.isArray(res.data) ? res.data : [];

      // Client-side filtering for specific tabs
      const now = new Date();
      // Reset time to midnight for accurate day comparison
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      if (type === "upcoming") {
        data = data.filter(appt => new Date(appt.date) >= todayStart && appt.status !== 'cancelled');
      } else if (type === "past") {
        data = data.filter(appt => new Date(appt.date) < todayStart);
      }
      // "today" and "all" are handled by the URL or return raw data

      setAppointments(data);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchWeeklyStats = async (mode = "weekly") => {
    setActiveTab(mode);
    try {
      const res = await axios.get(`${API_BASE}/appointments/${mode}`, getAuthConfig());
      setWeeklyStats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading weekly stats:", err);
      setWeeklyStats([]);
    }
  };

  useEffect(() => {
    setFavicon("/favicon.ico");
    fetchDashboardStats();
    fetchAppointments("today");
    fetchWeeklyStats("weekly");
  }, []);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main content */}
      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          minHeight: "100vh",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid py-4">
          <h3 className="fw-bold text-primary mb-4">Dashboard Overview</h3>

          {/* Top four cards */}
          <div className="row g-4">
            {/* Total Patients */}
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0 p-3 text-center clickable"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/patients")}
              >
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3">
                    <FaUserInjured size={30} />
                  </div>
                  <div className="text-start">
                    <h6 className="text-muted mb-1">Total Patients</h6>
                    <h3 className="fw-bold mb-0">
                      {stats.totalPatients || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Doctors */}
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0 p-3 text-center clickable"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/Doctors")}
              >
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                    <FaUserDoctor size={30} />
                  </div>
                  <div className="text-start">
                    <h6 className="text-muted mb-1">Total Doctors</h6>
                    <h3 className="fw-bold mb-0">
                      {stats.totalDoctors || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Appointments */}
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0 p-3 text-center clickable"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/Appointments")}
              >
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                    <FaCalendarCheck size={30} />
                  </div>
                  <div className="text-start">
                    <h6 className="text-muted mb-1">Total Appointments</h6>
                    <h3 className="fw-bold mb-0">
                      {stats.totalAppointments || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0 p-3 text-center clickable"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/BillingRecords")}
              >
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle p-3">
                    <FaMoneyBill1Wave size={30} />
                  </div>
                  <div className="text-start">
                    <h6 className="text-muted mb-1">Total Revenue</h6>
                    <h3 className="fw-bold mb-0">
                      ₹{stats.totalRevenue || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: appointments + weekly summary */}
          <div className="row mt-5">
            {/* Left: Today's / upcoming appointments */}
            <div className="col-md-8 mb-4">
              <div className="card shadow-sm p-3 h-100">
                {/* <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Todays Appointment List</h5>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => fetchAppointments("all")}
                    >
                      All Upcoming Appointments
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => fetchAppointments("today")}
                    >
                      Reload
                    </button>
                  </div> */}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  {/* Dynamic Title based on selection */}
                  <h5 className="fw-bold mb-0">
                    {filterType === 'today' ? "Today's Appointment List" :
                      filterType === 'upcoming' ? "Upcoming Appointments" :
                        filterType === 'past' ? "Past Appointments" : "All Appointments"}
                  </h5>

                  {/* New Buttons Group */}
                  <div className="btn-group" role="group">
                    <button
                      className={`btn btn-sm ${filterType === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => fetchAppointments("today")}
                    >
                      Today
                    </button>
                    <button
                      className={`btn btn-sm ${filterType === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => fetchAppointments("upcoming")}
                    >
                      Upcoming
                    </button>
                    <button
                      className={`btn btn-sm ${filterType === 'past' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => fetchAppointments("past")}
                    >
                      Past
                    </button>
                    <button
                      className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => fetchAppointments("all")}
                    >
                      All
                    </button>
                  </div>
                </div>

                {loadingAppointments ? (
                  <p className="text-center mb-0">Loading...</p>
                ) : appointments.length === 0 ? (
                  <p className="text-center text-muted mb-0">
                    No Appointments Found.
                  </p>
                ) : (
                  <ul className="list-group">
                    {appointments.map((appt, index) => (
                      <li
                        key={index}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-semibold">
                            {appt.patientName || "Unknown Patient"}
                          </div>
                          <small className="text-muted">
                            {appt.doctorName
                              ? `Dr. ${appt.doctorName}`
                              : "Doctor not set"}
                          </small>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {appt.time || "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: Weekly / monthly totals */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Weekly Total Appointments</h5>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn ${activeTab === "weekly"
                        ? "btn-primary"
                        : "btn-outline-primary"
                        }`}
                      onClick={() => fetchWeeklyStats("weekly")}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      className={`btn ${activeTab === "monthly"
                        ? "btn-primary"
                        : "btn-outline-primary"
                        }`}
                      onClick={() => fetchWeeklyStats("monthly")}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {weeklyStats.length === 0 ? (
                  <p className="text-center text-muted mb-0">
                    No Appointments Found
                  </p>
                ) : (
                  <div>
                    {weeklyStats.map((item, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <span>{item.label}</span>
                        <span className="fw-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;
