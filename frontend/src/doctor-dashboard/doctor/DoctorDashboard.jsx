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

// 🔹 Simple base URL for backend – no process.env
const API_BASE = "http://localhost:3001";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  // stats (you can replace with API fetch if you already have stats endpoint)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalServices: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // calendar events
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);

  // get doctor id & token from localStorage (adjust keys if you use different names)
  const storedDoctor = (() => {
    try {
      return JSON.parse(localStorage.getItem("doctor") || "null");
    } catch {
      return null;
    }
  })();

  const doctorId =
    storedDoctor?._id ||
    storedDoctor?.id ||
    localStorage.getItem("doctorId") ||
    null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("doctorToken") ||
    null;

  // helper mapping function: adapt to your appointment JSON shape
  const mapAppointmentToEvent = (a) => {
    const id = a._id || a.id;

    const patientName =
      a.patientName ||
      a.patient?.name ||
      (a.patient && `${a.patient.firstName} ${a.patient.lastName}`) ||
      "Patient";

    const serviceName =
      a.serviceName ||
      a.service ||
      (a.service && a.service.name) ||
      "Appointment";

    let start =
      a.start ||
      a.datetime ||
      (a.date &&
        (a.time ? `${a.date}T${a.time}` : `${a.date}T00:00:00`));

    let end =
      a.end ||
      a.endTime ||
      (a.date && (a.endTime ? `${a.date}T${a.endTime}` : null));

    const allDay =
      (!!start && typeof start === "string" && start.length === 10 && !start.includes("T")) ||
      !!a.allDay;

    if (!start && a.date) start = `${a.date}T09:00:00`;

    if (!end && start && !allDay) {
      const dt = new Date(start);
      if (!isNaN(dt.getTime())) {
        dt.setMinutes(dt.getMinutes() + 30);
        end = dt.toISOString();
      }
    }

    return {
      id,
      title: `${patientName} — ${serviceName}`,
      start,
      end,
      allDay,
      backgroundColor: "#1560ff",
      borderColor: "#1560ff",
      extendedProps: { raw: a },
    };
  };

  // fetch stats
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // You can replace this with a real API later
        setStats((s) => ({ ...s, totalServices: 2 }));
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch appointments and map to events
  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError(null);

      try {
        let url = `${API_BASE}/appointments`;
        if (doctorId) url = `${API_BASE}/appointments?doctorId=${doctorId}`;

        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const appointments = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? [];

        const mapped = appointments.map(mapAppointmentToEvent);

        if (mounted) setEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch appointments for calendar:", err);
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
  }, [doctorId, token]);

  // calendar interactions
  const handleDateSelect = (selectInfo) => {
    const d = selectInfo.startStr;
    navigate(`/doctor/appointments?date=${encodeURIComponent(d)}`);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    navigate(`/doctor/appointments/${ev.id}`);
  };

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

          {/* Today's Appointments */}
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
                    {loadingEvents ? "Loading events…" : `${events.length} events`}
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
