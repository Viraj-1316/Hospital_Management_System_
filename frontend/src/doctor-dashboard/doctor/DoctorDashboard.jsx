import React, { useEffect, useState, useRef } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

// FullCalendar Imports
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
import API_BASE from "../../config";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  // ---------- STATE ----------
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalServices: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);

  // ---------- DATA MAPPING ----------
  const mapAppointmentToEvent = (a) => {
    const id = a._id || a.id;
    const patientName =
      a.patientName ||
      a.patient?.name ||
      (a.patient && `${a.patient.firstName} ${a.patient.lastName}`) ||
      "Patient";
    const serviceName = a.serviceName || a.service || "Appointment";

    if (!a.date) return null;
    const startDate = new Date(a.date);
    if (isNaN(startDate.getTime())) return null;

    return {
      id,
      title: `${patientName} — ${serviceName}`,
      start: startDate,
      allDay: true,
      extendedProps: { raw: a },
    };
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    navigate(`/doctor/appointments/${ev.id}`);
  };

  const handleDateSelect = (selectInfo) => {
    const d = selectInfo.startStr;
    navigate(`/doctor/appointments?date=${encodeURIComponent(d)}`);
  };

  // ---------- API CALLS ----------
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await axios.get(`${API_BASE}/dashboard-stats`);
        if (mounted) {
          const {
            totalPatients,
            totalAppointments,
            todayAppointments,
            totalServices,
          } = res.data || {};
          setStats({
            totalPatients: totalPatients || 0,
            totalAppointments: totalAppointments || 0,
            todayAppointments: todayAppointments || 0,
            totalServices: totalServices || 0,
          });
        }
      } catch (err) {
        console.error("Stats Error", err);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const doctorStr = localStorage.getItem("doctor");
        let doctorId = null;
        if (doctorStr) {
          const doctor = JSON.parse(doctorStr);
          doctorId = doctor._id || doctor.id;
        }

        let url = `${API_BASE}/appointments`;
        if (doctorId) url += `?doctorId=${doctorId}`;

        const res = await axios.get(url);
        const appointments = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? [];
        const mapped = appointments.map(mapAppointmentToEvent).filter(Boolean);

        if (mounted) setEvents(mapped);
      } catch (err) {
        console.error("Events Error", err);
        if (mounted) setError("Could not load appointments.");
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    };
    fetchEvents();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- RENDER ----------
  return (
    <DoctorLayout>
      <div className="dashboard-container">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary m-0">Doctor Dashboard</h3>
        </div>

        {/* STATS WIDGETS */}
        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-md-6 col-12">
            <div
              className="stat-card clickable"
              onClick={() => navigate("/doctor/patients")}
            >
              <div className="stat-icon patients">
                <FaUserInjured />
              </div>
              <div className="stat-content">
                <h6>Total Patients</h6>
                <h3>{loadingStats ? "-" : stats.totalPatients}</h3>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 col-12">
            <div
              className="stat-card clickable"
              onClick={() => navigate("/doctor/appointments")}
            >
              <div className="stat-icon appointments">
                <FaCalendarAlt />
              </div>
              <div className="stat-content">
                <h6>Total Appointments</h6>
                <h3>{loadingStats ? "-" : stats.totalAppointments}</h3>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 col-12">
            <div
              className="stat-card clickable"
              onClick={() => navigate("/doctor/appointments")}
            >
              <div className="stat-icon today">
                <FaCalendarCheck />
              </div>
              <div className="stat-content">
                <h6>Today's Appointments</h6>
                <h3>{loadingStats ? "-" : stats.todayAppointments}</h3>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 col-12">
            <div
              className="stat-card clickable"
              onClick={() => navigate("/doctor/services")}
            >
              <div className="stat-icon services">
                <FaListAlt />
              </div>
              <div className="stat-content">
                <h6>Total Services</h6>
                <h3>{loadingStats ? "-" : stats.totalServices}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* CALENDAR SECTION */}
        <div className="row">
          <div className="col-12">
            <div className="calendar-card">
              {/* Custom Header: Title Left, Filters/Count Right */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5
                  className="m-0 text-dark"
                  style={{ fontSize: "1.2rem", fontWeight: "400" }}
                >
                  Appointment
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Apply filters
                  </button>
                  <span className="badge bg-white text-secondary border">
                    {events.length} events
                  </span>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
              )}

              {/* Calendar Component */}
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
                contentHeight="auto"
                aspectRatio={1.5}
                dayMaxEvents={3}
              />
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
