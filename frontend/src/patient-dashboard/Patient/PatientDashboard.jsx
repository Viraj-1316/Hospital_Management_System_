import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../layouts/PatientLayout";
import API_BASE from "../../config";

export default function PatientDashboard({ sidebarCollapsed, toggleSidebar }) {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  // --- State for Filters & Data ---
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [rawAppointments, setRawAppointments] = useState([]); 
  const [filters, setFilters] = useState({ doctor: "", status: "" });

  // --- State for Appointment Details Modal ---
  const [selectedAppointment, setSelectedAppointment] = useState(null); 
  
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState(null);

  const [upcoming, setUpcoming] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // Auth / LocalStorage Logic
  const storedPatient = (() => {
    try { return JSON.parse(localStorage.getItem("patient") || "null"); } 
    catch { return null; }
  })();

  const patientId = storedPatient?._id || storedPatient?.id || localStorage.getItem("patientId");
  const token = localStorage.getItem("token") || localStorage.getItem("patientToken");


  // --- 1. NEW HELPER FUNCTION: FORMAT DATE ---
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Check if date is valid
    if (isNaN(date.getTime())) return isoString; 
    
    return date.toLocaleDateString("en-US", {
      month: "short", // Nov
      day: "numeric", // 30
      year: "numeric" // 2025
    });
  };

  // --- Map Data to Calendar Events ---
  const mapAppointmentToEvent = (a) => {
    const id = a._id ?? a.id;
    if (!a.date) return null;
    const startDate = new Date(a.date);
    if (isNaN(startDate.getTime())) return null;

    const doctorName = a.doctorName ?? a.doctor?.name ?? (a.doctor && `${a.doctor.firstName} ${a.doctor.lastName}`) ?? "Doctor";
    const service = a.serviceName ?? a.service ?? "Appointment";

    // Color coding
    let bgColor = "#3788d8"; // blue
    if (a.status === "completed") bgColor = "#198754"; // green
    if (a.status === "cancelled") bgColor = "#dc3545"; // red
    if (a.status === "booked") bgColor = "#ffc107"; // yellow

    return {
      id,
      title: `${doctorName} — ${service}`,
      start: startDate,
      allDay: true,
      backgroundColor: bgColor,
      borderColor: bgColor,
      extendedProps: { raw: a }, 
    };
  };

  // --- Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        let url = `${API_BASE}/appointments`;
        if (patientId) url = `${API_BASE}/appointments?patientId=${patientId}`;

        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

        if (mounted) setRawAppointments(data);
      } catch (err) {
        if (mounted) setErrorEvents("Failed to load calendar events.");
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    };
    fetchEvents();
    return () => { mounted = false; };
  }, [patientId, token]);

  // --- Filter Logic ---
  useEffect(() => {
    let filteredData = rawAppointments;
    if (filters.doctor) {
      filteredData = filteredData.filter((a) => {
        const dName = a.doctorName || (a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : "") || "";
        return dName.toLowerCase().includes(filters.doctor.toLowerCase());
      });
    }
    if (filters.status) {
      filteredData = filteredData.filter((a) => (a.status || "").toLowerCase() === filters.status.toLowerCase());
    }
    setEvents(filteredData.map(mapAppointmentToEvent).filter(Boolean));
  }, [rawAppointments, filters]);

  // --- Fetch Upcoming ---
  useEffect(() => {
    let mounted = true;
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      try {
        let url = patientId ? `${API_BASE}/appointments?patientId=${patientId}&upcoming=true` : `${API_BASE}/appointments`;
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (mounted) setUpcoming(data.slice(0, 6));
      } catch (err) { if (mounted) setUpcoming([]); } 
      finally { if (mounted) setLoadingUpcoming(false); }
    };
    fetchUpcoming();
    return () => { mounted = false; };
  }, [patientId, token]);

  // --- Handlers ---
  const handleDateSelect = (selectInfo) => {
    const selectedDate = selectInfo.startStr;
    navigate(`/patient/book?date=${encodeURIComponent(selectedDate)}`);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const rawData = clickInfo.event.extendedProps.raw;
    setSelectedAppointment(rawData);
  };

  const handleFilterChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
  return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <div className="container-fluid py-4 position-relative">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-primary m-0">Appointment</h3>
          <button className="btn btn-outline-secondary" onClick={() => setShowFilterModal(true)}>
              Apply filters
          </button>
        </div>

        {errorEvents && <div className="alert alert-warning">{errorEvents}</div>}

        <div className="row g-4">
          {/* Calendar Column */}
          <div className="col-lg-9">
            <div className="card shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-sm btn-primary me-1" onClick={() => calendarRef.current?.getApi().prev()}>◀</button>
                  <button className="btn btn-sm btn-primary me-1" onClick={() => calendarRef.current?.getApi().next()}>▶</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef.current?.getApi().today()}>today</button>
                </div>
                <div className="btn-group">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}>Month</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef.current?.getApi().changeView("timeGridWeek")}>Week</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef.current?.getApi().changeView("timeGridDay")}>Day</button>
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

          {/* Upcoming Column */}
          <div className="col-lg-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white border-0"><h6 className="mb-0 fw-bold">Upcoming appointments</h6></div>
              <div className="card-body p-2" style={{ maxHeight: 400, overflowY: "auto" }}>
                {loadingUpcoming ? <p className="text-muted small">Loading...</p> : 
                 upcoming.length === 0 ? <p className="text-muted small">No upcoming appointments.</p> : 
                 upcoming.map((a) => (
                    <div key={a._id} className="p-2 mb-2 border rounded-3 bg-light" style={{cursor:"pointer"}} onClick={() => setSelectedAppointment(a)}>
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold small">{a.doctorName || "Doctor"}</span>
                        <span className="badge bg-white text-dark border">{a.status}</span>
                      </div>
                      <div className="small text-muted">{a.clinic}</div>
                      
                      {/* --- 2. UPDATED CODE HERE --- */}
                      <div className="small mt-1 fw-semibold">
                        {formatDate(a.date)} {a.time ? `• ${a.time}` : ''}
                      </div>

                    </div>
                 ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* --- 1. FILTER MODAL --- */}
        {showFilterModal && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Filter Appointments</h5>
                  <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Doctor Name</label>
                    <input type="text" className="form-control" name="doctor" value={filters.doctor} onChange={handleFilterChange} placeholder="e.g. Sharma"/>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                      <option value="">All Statuses</option>
                      <option value="booked">Booked</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => { setFilters({doctor:"", status:""}); setShowFilterModal(false); }}>Clear</button>
                  <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>Apply</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. APPOINTMENT DETAILS MODAL --- */}
        {selectedAppointment && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-light">
                  <h5 className="modal-title text-primary fw-bold">Appointment Details</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedAppointment(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                      <div className="display-6 text-primary mb-1">
                         {new Date(selectedAppointment.date).getDate()}
                      </div>
                      <div className="text-muted text-uppercase small fw-bold">
                         {new Date(selectedAppointment.date).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="badge bg-warning text-dark mt-2">{selectedAppointment.status?.toUpperCase() || 'BOOKED'}</div>
                  </div>

                  <div className="row g-3">
                      <div className="col-6">
                         <small className="text-muted d-block">Doctor</small>
                         <span className="fw-semibold">{selectedAppointment.doctorName || "Unknown"}</span>
                      </div>
                      <div className="col-6">
                         <small className="text-muted d-block">Clinic</small>
                         <span className="fw-semibold">{selectedAppointment.clinic || "Unknown"}</span>
                      </div>
                      <div className="col-6">
                         <small className="text-muted d-block">Time</small>
                         <span className="fw-semibold">{selectedAppointment.time || "Not set"}</span>
                      </div>
                      <div className="col-6">
                         <small className="text-muted d-block">Charges</small>
                         <span className="fw-semibold">₹{selectedAppointment.charges || 0}</span>
                      </div>
                      <div className="col-12">
                         <small className="text-muted d-block">Service(s)</small>
                         <div className="p-2 bg-light rounded border mt-1">
                            {selectedAppointment.services || selectedAppointment.serviceName || "Consultation"}
                         </div>
                      </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                        const targetId = selectedAppointment._id || selectedAppointment.id;
                        if (targetId) {
                            navigate(`/patient/appointments/${targetId}`);
                        } else {
                            console.error("No valid ID found on appointment object:", selectedAppointment);
                            alert("Error: Cannot find appointment ID.");
                        }
                    }}
                  >
                    View Full Receipt
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedAppointment(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </PatientLayout>
  );
}