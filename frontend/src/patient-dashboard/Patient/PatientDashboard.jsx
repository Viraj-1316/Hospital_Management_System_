// src/patient-dashboard/PatientDashboard.jsx

import React, { useEffect, useState, useRef } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../layouts/PatientLayout";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState(null);

  const [upcoming, setUpcoming] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // get patient id/token from localStorage (adjust keys to your auth)
  const storedPatient = (() => {
    try {
      return JSON.parse(localStorage.getItem("patient") || "null");
    } catch {
      return null;
    }
  })();

  const patientId =
    storedPatient?._id ||
    storedPatient?.id ||
    localStorage.getItem("patientId") ||
    null;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("patientToken") ||
    null;

  // backend base URL
  const API_BASE = "http://localhost:3001";

  // fallback demo event (if no data or error)
  const demoEvents = [
    {
      id: "demo-1",
      title: "Demo — Dr. Sharma (General)",
      start: new Date().toISOString().split("T")[0] + "T10:30:00",
      end: new Date().toISOString().split("T")[0] + "T11:00:00",
      allDay: false,
      backgroundColor: "#e74c3c",
      borderColor: "#e74c3c",
    },
  ];

  // Very simple: use only `date` → all-day event
  const mapAppointmentToEvent = (a) => {
    const id = a._id ?? a.id;

    // must have a.date, else skip this appointment
    if (!a.date) {
      console.warn("Appointment has no date, skipping:", a);
      return null;
    }

    const startDate = new Date(a.date); // e.g. "2025-11-20"

    if (isNaN(startDate.getTime())) {
      console.warn("Invalid start date for appointment, skipping:", a);
      return null;
    }

    const doctorName =
      a.doctorName ??
      a.doctor?.name ??
      (a.doctor && `${a.doctor.firstName} ${a.doctor.lastName}`) ??
      "Doctor";

    const service = a.serviceName ?? a.service ?? "Appointment";

    return {
      id,
      title: `${doctorName} — ${service}`,
      start: startDate, // FullCalendar can use Date object
      allDay: true, // whole day event
      backgroundColor: "#ff5c7c",
      borderColor: "#ff5c7c",
      extendedProps: { raw: a },
    };
  };

  // fetch events for calendar
  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setErrorEvents(null);

      try {
        let url = `${API_BASE}/appointments`;
        if (patientId) url = `${API_BASE}/appointments?patientId=${patientId}`;

        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000,
        });

        const appointments = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];

        if (!appointments || appointments.length === 0) {
          if (mounted) {
            setEvents(demoEvents);
            setErrorEvents(null);
          }
        } else {
          const mapped = appointments
            .map(mapAppointmentToEvent) // convert each appointment → event or null
            .filter(Boolean); // remove null values

          if (mounted) setEvents(mapped);
        }
      } catch (err) {
        console.error("Patient calendar fetch error:", err);
        if (mounted) {
          setErrorEvents(
            err?.response?.status
              ? `Failed to load calendar events (status ${err.response.status}).`
              : "Failed to load calendar events."
          );
          setEvents(demoEvents);
        }
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    };

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, [patientId, token]);

  // fetch upcoming list (right side)
  useEffect(() => {
    let mounted = true;

    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      try {
        let url = `${API_BASE}/appointments`;
        if (patientId) {
          url = `${API_BASE}/appointments?patientId=${patientId}&upcoming=true`;
        }

        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const appointments = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];

        if (mounted) setUpcoming(appointments.slice(0, 6)); // first 6
      } catch (err) {
        console.error("Failed to fetch upcoming appointments:", err);
        if (mounted) setUpcoming([]);
      } finally {
        if (mounted) setLoadingUpcoming(false);
      }
    };

    fetchUpcoming();
    return () => {
      mounted = false;
    };
  }, [patientId, token]);

  // calendar interactions
  const handleDateSelect = (selectInfo) => {
    const selectedDate = selectInfo.startStr;
    navigate(`/patient/book?date=${encodeURIComponent(selectedDate)}`);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    navigate(`/patient/appointments/${ev.id}`);
  };

  return (
    <PatientLayout>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-primary m-0">Appointment</h3>
          <div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                // later you can open filter modal here
              }}
            >
              Apply filters
            </button>
          </div>
        </div>

        {errorEvents && (
          <div className="alert alert-warning">
            {errorEvents} — open console/network to debug.
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-9">
            <div className="card shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => calendarRef.current?.getApi().prev()}
                  >
                    ◀
                  </button>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => calendarRef.current?.getApi().next()}
                  >
                    ▶
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => calendarRef.current?.getApi().today()}
                  >
                    today
                  </button>
                </div>
                <div className="btn-group" role="group">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      calendarRef.current?.getApi().changeView("dayGridMonth")
                    }
                  >
                    Month
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      calendarRef.current
                        ?.getApi()
                        .changeView("timeGridWeek")
                    }
                  >
                    Week
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      calendarRef.current?.getApi().changeView("timeGridDay")
                    }
                  >
                    Day
                  </button>
                </div>
              </div>

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
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

          <div className="col-lg-3">
            {/* You can render upcoming list here using `upcoming` */}
            {/* For example later: upcoming.map(...) */}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
