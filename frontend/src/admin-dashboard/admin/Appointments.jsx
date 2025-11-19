import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaDownload } from "react-icons/fa";
import "../styles/appointments.css";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // top panel toggles
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // small tabs: All / Upcoming / Past
  const [tab, setTab] = useState("all"); // 'all' | 'upcoming' | 'past'

  // search
  const [searchTerm, setSearchTerm] = useState("");

  // filters (kept minimal)
  const [filters, setFilters] = useState({
    date: "",
    clinic: "",
    patient: "",
    status: "",
    doctor: "",
  });

  // dropdown data from backend
  const [doctors, setDoctors] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [patients, setPatients] = useState([]);

  // add-form state (matching UI)
  const [form, setForm] = useState({
    clinic: "",
    doctor: "",
    service: "",
    date: "",
    patient: "",
    status: "booked", // default
    servicesDetail: "",
  });

  // ------------------ FETCH APPOINTMENTS ------------------
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async (query = {}) => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3001/appointments", {
        params: query,
      });
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ FETCH DOCTORS / SERVICES / PATIENTS ------------------
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [docRes, servRes, patRes] = await Promise.all([
          axios.get("http://localhost:3001/doctors"),
          axios.get("http://localhost:3001/api/services"),
          axios.get("http://localhost:3001/patients"),
        ]);

        console.log("Doctors API:", docRes.data);
        console.log("Services API:", servRes.data);
        console.log("Patients API:", patRes.data);

        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
        setServicesList(Array.isArray(servRes.data) ? servRes.data : []);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);

  // ------------------ TAB LOGIC (ALL / UPCOMING / PAST) ------------------
  useEffect(() => {
    const q = {};
    if (tab === "upcoming") q.status = "upcoming";
    if (tab === "past") q.status = "completed";
    fetchAppointments(q);
    // close panels when switching tabs
    setFiltersOpen(false);
    setAddOpen(false);
  }, [tab]);

  // ------------------ FILTERS ------------------
  const applyFilters = () => {
    const q = {};
    if (filters.date) q.date = filters.date;
    if (filters.clinic) q.clinic = filters.clinic;
    if (filters.patient) q.patient = filters.patient;
    if (filters.doctor) q.doctor = filters.doctor;
    if (filters.status) q.status = filters.status;
    fetchAppointments(q);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({ date: "", clinic: "", patient: "", status: "", doctor: "" });
    fetchAppointments();
    setFiltersOpen(false);
  };

  // ------------------ LOCAL SEARCH ------------------
  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((a) => {
      return (
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.clinic || "").toLowerCase().includes(q) ||
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.services || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, searchTerm]);

  // ------------------ FORM HANDLERS ------------------
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const openAddForm = () => {
    setAddOpen(true);
    setFiltersOpen(false);
  };
  const closeAddForm = () => setAddOpen(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // payload: include patientName & doctorName for simple list display
      const payload = {
        patientName: form.patient,
        doctorName: form.doctor,
        clinic: form.clinic,
        date: form.date,
        services: form.service,
        status: form.status,
        servicesDetail: form.servicesDetail,
        createdAt: new Date(),
      };
      const res = await axios.post(
        "http://localhost:3001/appointments",
        payload
      );
      if (res.data?.message) {
        alert("Appointment added");
        closeAddForm();
        // reset minimal fields, keep default status
        setForm({
          clinic: "",
          doctor: "",
          service: "",
          date: "",
          patient: "",
          status: "booked",
          servicesDetail: "",
        });
        fetchAppointments();
      } else {
        alert("Unexpected response from server");
      }
    } catch (err) {
      console.error("Error creating appointment:", err);
      alert("Error creating appointment. Check console.");
    }
  };

  // ------------------ DELETE & CANCEL HANDLERS ------------------
  const handleDeleteAppointment = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      alert("Error deleting appointment. Check console.");
    }
  };

  const handleCancelAppointment = async (id) => {
    const confirmCancel = window.confirm(
      "Mark this appointment as cancelled?"
    );
    if (!confirmCancel) return;

    try {
      await axios.put(`http://localhost:3001/appointments/${id}/cancel`);
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: "cancelled" } : a
        )
      );
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Error cancelling appointment. Check console.");
    }
  };

  // ------------------ JSX ------------------
  return (
    <AdminLayout>
      <div className="container-fluid py-3">
        {/* header area */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold text-primary mb-1">Appointment</h4>
            {/* small tabs */}
            <div className="btn-group btn-sm" role="group" aria-label="tabs">
              <button
                type="button"
                className={`btn btn-outline-primary btn-sm ${
                  tab === "all" ? "active small-tab" : ""
                }`}
                onClick={() => setTab("all")}
              >
                ALL
              </button>
              <button
                type="button"
                className={`btn btn-outline-primary btn-sm ${
                  tab === "upcoming" ? "active small-tab" : ""
                }`}
                onClick={() => setTab("upcoming")}
              >
                UPCOMING
              </button>
              <button
                type="button"
                className={`btn btn-outline-primary btn-sm ${
                  tab === "past" ? "active small-tab" : ""
                }`}
                onClick={() => setTab("past")}
              >
                PAST
              </button>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setAddOpen((s) => !s)}
            >
              {addOpen ? "Close form" : "Add appointment"}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFiltersOpen((s) => !s)}
            >
              {filtersOpen ? "Close filter" : "Filters"}
            </button>

            <button className="btn btn-outline-secondary btn-sm">
              <FaDownload /> Import data
            </button>
          </div>
        </div>

        {/* filter panel (slide) */}
        <div className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="p-3">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Select Clinic</label>
                <input
                  className="form-control"
                  value={filters.clinic}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, clinic: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Select Patient</label>
                <input
                  className="form-control"
                  value={filters.patient}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, patient: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Select Doctor</label>
                <input
                  className="form-control"
                  value={filters.doctor}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, doctor: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Select status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  <option value="">All</option>
                  <option value="booked">Booked</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-3 d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={clearFilters}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={applyFilters}>
                Apply filters
              </button>
            </div>
          </div>
        </div>

        {/* add form panel (slide) — design matches your screenshot */}
        <div className={`form-panel appointments-form ${addOpen ? "open" : ""}`}>
          <div className="p-3">
            <form onSubmit={handleAddSubmit}>
              <div className="row g-3">
                {/* left column */}
                <div className="col-lg-6">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label">Select Clinic *</label>
                      <select
                        name="clinic"
                        className="form-select"
                        value={form.clinic}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Valley Clinic">Valley Clinic</option>
                        <option value="City Care">City Care</option>
                      </select>
                    </div>

                    {/* Doctor from DB */}
                    <div className="col-md-12">
                      <label className="form-label">Doctor *</label>
                      <div className="d-flex justify-content-between align-items-center">
                        <select
                          name="doctor"
                          className="form-select"
                          value={form.doctor}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Search</option>
                          {doctors.map((d) => (
                            <option
                              key={d._id}
                              value={`${d.firstName} ${d.lastName}`}
                            >
                              {d.firstName} {d.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Service from DB */}
                    <div className="col-md-12">
                      <label className="form-label">Service *</label>
                      <div className="d-flex justify-content-between align-items-center">
                        <select
                          name="service"
                          className="form-select"
                          value={form.service}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Service</option>
                          {servicesList.map((s) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <a
                          className="ms-2 small-link"
                          href="#add-service"
                          onClick={(e) => e.preventDefault()}
                        >
                          + Add Service
                        </a>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Appointment Date *</label>
                      <input
                        name="date"
                        type="date"
                        className="form-control"
                        value={form.date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Patient from DB */}
                    <div className="col-md-12">
                      <label className="form-label">Patient *</label>
                      <div className="d-flex justify-content-between align-items-center">
                        <select
                          name="patient"
                          className="form-select"
                          value={form.patient}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Search</option>
                          {patients.map((p) => (
                            <option
                              key={p._id}
                              value={`${p.firstName} ${p.lastName}`}
                            >
                              {p.firstName} {p.lastName}
                            </option>
                          ))}
                        </select>
                        <a
                          className="ms-2 small-link"
                          href="#add-patient"
                          onClick={(e) => e.preventDefault()}
                        >
                          + Add patient
                        </a>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Status *</label>
                      <select
                        name="status"
                        className="form-select"
                        value={form.status}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="booked">Booked</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* right column */}
                <div className="col-lg-6">
                  <label className="form-label">Available Slot *</label>
                  <div className="available-slot-box border rounded p-3 mb-3">
                    <div className="text-center text-muted">No time slots found</div>
                  </div>

                  <label className="form-label">Service Detail</label>
                  <input
                    name="servicesDetail"
                    className="form-control mb-3"
                    placeholder="No service detail found.."
                    value={form.servicesDetail}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* bottom-right Save/Cancel buttons (aligned to match UI) */}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeAddForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* main card: search + table */}
        <div className="card shadow-sm p-3 mt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div style={{ maxWidth: 420, width: "100%" }}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by patient, clinic, doctor or services"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>{/* place for extra controls */}</div>
          </div>

          <div style={{ minHeight: 180 }}>
            {loading ? (
              <div className="text-center py-5">Loading...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No Appointments Found
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Services</th>
                      <th>Charges</th>
                      <th>Payment Mode</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => (
                      <tr key={a._id}>
                        <td>{a.patientName}</td>
                        <td>{a.services}</td>
                        <td>{a.charges || "-"}</td>
                        <td>{a.paymentMode || "-"}</td>
                        <td>
                          <span
                            className={`badge ${
                              a.status === "upcoming"
                                ? "bg-warning"
                                : a.status === "completed"
                                ? "bg-success"
                                : a.status === "cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary">
                              View
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleCancelAppointment(a._id)}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteAppointment(a._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* pagination placeholder */}
          <div className="d-flex justify-content-end mt-3">
            <nav>
              <ul className="pagination pagination-sm m-0">
                <li className="page-item disabled">
                  <button className="page-link">Prev</button>
                </li>
                <li className="page-item active">
                  <button className="page-link">1</button>
                </li>
                <li className="page-item disabled">
                  <button className="page-link">Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Appointments;
