// src/doctor/Doctor-dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserInjured,
  FaCalendarAlt,
  FaCalendarCheck,
  FaListAlt,
} from "react-icons/fa";

// ✅ Simple base URL for backend
const API_BASE = "http://localhost:3001";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  // ---------- STATS ----------
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalServices: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ---------- CALENDAR ----------
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // 1) MAP ONE APPOINTMENT → EVENT
  // -----------------------------
  // Keep it VERY simple: use only "date" from your appointment.
  // Example appointment from your logs:
  // { _id: '...', patientName: 'Patient', doctorName: 'viraj ...', clinic: 'Valley Clinic', date: '2025-11-20', ... }
  const mapAppointmentToEvent = (a) => {
    const id = a._id || a.id || Math.random().toString(36).slice(2);

    // 1) Get a safe title
    const patientName =
      a.patientName ||
      a.patient?.name ||
      (a.patient && `${a.patient.firstName} ${a.patient.lastName}`) ||
      "Patient";

    const doctorName = a.doctorName || "Doctor";
    const serviceName = a.serviceName || a.service || "Appointment";

    // 2) Build start date (full-day event)
    if (!a.date) {
      console.warn("DoctorDashboard: appointment has NO date, skip:", a);
      return null;
    }

    // a.date should be like "2025-11-20"
    const startDate = new Date(a.date);

    if (isNaN(startDate.getTime())) {
      console.warn("DoctorDashboard: INVALID date, skip:", a.date, a);
      return null;
    }

    // 3) Return FullCalendar event object
    return {
      id,
      title: `${patientName} — ${serviceName} — ${doctorName}`,
      start: startDate, // pass Date object
      allDay: true, // full day event
      backgroundColor: "#1560ff",
      borderColor: "#1560ff",
      extendedProps: { raw: a },
    };
  };

  // -----------------------------
  // 2) FETCH STATS FROM BACKEND
  // -----------------------------
  useEffect(() => {
  let mounted = true;

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE}/dashboard-stats`);

      // ✅ now we read all 3 values from backend
      const {
        totalPatients,
        totalAppointments,
        todayAppointments,
      } = res.data || {};

      if (mounted) {
        setStats({
          totalPatients: totalPatients || 0,
          totalAppointments: totalAppointments || 0,
          todayAppointments: todayAppointments || 0,
          totalServices: 2, // still dummy for now
        });
      }
    } catch (err) {
      console.error("DoctorDashboard: failed to fetch stats", err);
      if (mounted) {
        setStats({
          totalPatients: 0,
          totalAppointments: 0,
          todayAppointments: 0,
          totalServices: 0,
        });
      }
    } finally {
      if (mounted) setLoadingStats(false);
    }
  };

  fetchStats();
  return () => {
    mounted = false;
  };
}, []);


  // -----------------------------
  // 3) FETCH APPOINTMENTS → EVENTS
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError(null);

      try {
    
        const res = await axios.get(`${API_BASE}/appointments`);

        const appointments = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? [];

        console.log("DoctorDashboard /appointments :", appointments);

        const mapped = appointments
          .map(mapAppointmentToEvent)
          .filter(Boolean); // remove null

        if (mounted) setEvents(mapped);
      } catch (err) {
        console.error("DoctorDashboard: failed to fetch appointments", err);
        if (mounted) {
          setError("Failed to load calendar events");
          setEvents([]);
        }
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    };

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, []); // run once on mount

  // -----------------------------
  // 4) CALENDAR INTERACTIONS
  // -----------------------------
  const handleDateSelect = (selectInfo) => {
    const d = selectInfo.startStr;
    navigate(`/doctor/appointments?date=${encodeURIComponent(d)}`);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    navigate(`/doctor/appointments/${ev.id}`);
  };

  // -----------------------------
  // 5) RENDER
  // -----------------------------
  return (
    <DoctorLayout>
      <div className="container-fluid py-4">
        <h3 className="fw-bold text-primary mb-3">Doctor Dashboard</h3>

        {/* Widgets Row */}
        <div className="row g-4">
          {/* Total Patients */}
          <div className="col-md-3">
            <div
              className="card shadow-sm border-0 p-3 text-center clickable"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/doctor/patients")}
            >
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3">
                  <FaUserInjured size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Patients</h6>
                  <h3 className="fw-bold mb-0">
                    {loadingStats ? "…" : stats.totalPatients}
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
              onClick={() => navigate("/doctor/appointments")}
            >
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                  <FaCalendarAlt size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Appointments</h6>
                  <h3 className="fw-bold mb-0">
                    {loadingStats ? "…" : stats.totalAppointments}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Appointments (we'll calculate later if needed) */}
          <div className="col-md-3">
            <div
              className="card shadow-sm border-0 p-3 text-center clickable"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/doctor/appointments")}
            >
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                  <FaCalendarCheck size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Today's Appointments</h6>
                  <h3 className="fw-bold mb-0">
                    {loadingStats ? "…" : stats.todayAppointments}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Total Services */}
          <div className="col-md-3">
            <div
              className="card shadow-sm border-0 p-3 text-center clickable"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/doctor/services")}
            >
              <div className="d-flex justify-content-center align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                  <FaListAlt size={30} />
                </div>
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Services</h6>
                  <h3 className="fw-bold mb-0">
                    {loadingStats ? "…" : stats.totalServices}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Appointment</h5>
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-2">
                    Apply filters
                  </button>
                  <span className="text-muted small">
                    {loadingEvents
                      ? "Loading events…"
                      : events.length === 0
                      ? "No appointments found"
                      : `${events.length} events`}
                  </span>
                </div>
              </div>

              {error && <div className="alert alert-warning">{error}</div>}

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                selectable={true}
                selectMirror={true}
                select={handleDateSelect}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                dayMaxEvents={3}
              />
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
