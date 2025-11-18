import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaDownload } from "react-icons/fa";
import "../styles/appointments.css";

const SLOT_OPTIONS = [
  "09:00 - 09:30 AM",
  "09:30 - 10:00 AM",
  "10:00 - 10:30 AM",
  "11:00 - 11:30 AM",
  "02:00 - 02:30 PM",
  "03:00 - 03:30 PM",
];

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // panels
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false); // add/edit panel

  // tabs
  const [tab, setTab] = useState("all"); // all | upcoming | past

  // search
  const [searchTerm, setSearchTerm] = useState("");

  // filters
  const [filters, setFilters] = useState({
    date: "",
    clinic: "",
    patient: "",
    status: "",
    doctor: "",
  });

  // dropdown data
  const [doctors, setDoctors] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [patients, setPatients] = useState([]);

  // add/edit form
  const [form, setForm] = useState({
    clinic: "",
    doctor: "",
    service: "",
    date: "",
    patient: "",
    status: "booked",
    servicesDetail: "",
    slot: "",
  });

  const [editId, setEditId] = useState(null); // null = add, otherwise edit

  // import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

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

  // ------------------ FETCH DROPDOWN DATA ------------------
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [docRes, servRes, patRes] = await Promise.all([
          axios.get("http://localhost:3001/doctors"),
          axios.get("http://localhost:3001/api/services"),
          axios.get("http://localhost:3001/patients"),
        ]);

        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
        setServicesList(Array.isArray(servRes.data) ? servRes.data : []);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);

  // close panels when tab changes
  useEffect(() => {
    setFiltersOpen(false);
    setPanelOpen(false);
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
  };

  const clearFilters = () => {
    setFilters({ date: "", clinic: "", patient: "", status: "", doctor: "" });
    fetchAppointments();
  };

  // ------------------ SEARCH + TAB FILTERING ------------------
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tab === "upcoming") {
      list = list.filter(
        (a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) > today
      );
    } else if (tab === "past") {
      list = list.filter(
        (a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) < today
      );
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        return (
          (a.patientName || "").toLowerCase().includes(q) ||
          (a.clinic || "").toLowerCase().includes(q) ||
          (a.doctorName || "").toLowerCase().includes(q) ||
          (a.services || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [appointments, tab, searchTerm]);

  // ------------------ FORM HANDLERS ------------------
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      clinic: "",
      doctor: "",
      service: "",
      date: "",
      patient: "",
      status: "booked",
      servicesDetail: "",
      slot: "",
    });
    setPanelOpen(true);
    setFiltersOpen(false);
  };

  const openEditForm = (item) => {
    setEditId(item._id);
    setForm({
      clinic: item.clinic || "",
      doctor: item.doctorName || "",
      service: item.services || "",
      date: item.date ? item.date.substring(0, 10) : "",
      patient: item.patientName || "",
      status: item.status || "booked",
      servicesDetail: item.servicesDetail || "",
      slot: item.slot || "",
    });
    setPanelOpen(true);
    setFiltersOpen(false);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clinic: form.clinic,
        doctorName: form.doctor,
        patientName: form.patient,
        services: form.service,
        date: form.date,
        status: form.status,
        servicesDetail: form.servicesDetail,
        slot: form.slot,
      };

      if (editId) {
        await axios.put(`http://localhost:3001/appointments/${editId}`, payload);
        alert("Appointment updated");
      } else {
        const res = await axios.post(
          "http://localhost:3001/appointments",
          payload
        );
        if (!res.data?.message && !res.data?._id) {
          alert("Warning: appointment saved but response not standard");
        } else {
          alert("Appointment added");
        }
      }

      fetchAppointments();
      closePanel();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving appointment. Check console.");
    }
  };

  // ------------------ DELETE / CANCEL / PDF ------------------
  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this?");
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:3001/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting");
    }
  };

  const handlePdf = (id) => {
  window.open(`http://localhost:3001/appointments/${id}/pdf`, "_blank");
};
  // ------------------ IMPORT MODAL HANDLERS ------------------
  const openImportModal = () => {
    setImportOpen(true);
    setImportFile(null);
    setImportType("csv");
  };

  const closeImportModal = () => {
    if (importing) return;
    setImportOpen(false);
    setImportFile(null);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0] || null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert("Please choose a CSV file first.");
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("type", importType);

      const res = await axios.post(
        "http://localhost:3001/appointments/import",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(`Imported ${res.data?.count || 0} appointments`);
      closeImportModal();
      fetchAppointments();
    } catch (err) {
      console.error("Error importing appointments:", err);
      alert("Error importing appointments. Check backend logs.");
    } finally {
      setImporting(false);
    }
  };

  // ------------------ AVAILABLE SLOTS LOGIC ------------------
  const isSunday =
    form.date && !Number.isNaN(new Date(form.date).getTime())
      ? new Date(form.date).getDay() === 0
      : false;

  const showSlots =
    form.service && form.date && !isSunday; // only show slots if service selected, date selected and not Sunday

  // ------------------ JSX ------------------
  return (
    <AdminLayout>
      <div className="container-fluid py-3">
        {/* header area */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold text-primary mb-1">Appointment</h4>
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
            <button className="btn btn-sm btn-primary" onClick={openAddForm}>
              {panelOpen && !editId ? "Close form" : "Add appointment"}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFiltersOpen((s) => !s)}
            >
              {filtersOpen ? "Close filter" : "Filters"}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={openImportModal}
            >
              <FaDownload /> Import data
            </button>
          </div>
        </div>

        {/* filter panel */}
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

        {/* ADD / EDIT PANEL with 2 columns */}
        <div className={`form-panel appointments-form ${panelOpen ? "open" : ""}`}>
          <div className="p-3">
            <form onSubmit={handleSave}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0 fw-bold">
                  {editId ? "Edit Appointment" : "Add Appointment"}
                </h5>
              </div>
              <div className="row g-3">
                {/* LEFT COLUMN */}
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

                {/* RIGHT COLUMN */}
                <div className="col-lg-6">
                  <label className="form-label">Available Slot *</label>
                  <div className="available-slot-box border rounded p-3 mb-3">
                    {showSlots ? (
                      <div className="d-flex flex-wrap gap-2">
                        {SLOT_OPTIONS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={`btn btn-sm ${
                              form.slot === slot
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() =>
                              setForm((p) => ({ ...p, slot: slot }))
                            }
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted">
                        No time slots found
                      </div>
                    )}
                    {isSunday && form.date && (
                      <div className="text-danger small mt-2">
                        Clinic closed on Sunday
                      </div>
                    )}
                  </div>

                  <label className="form-label">Service Detail</label>
                  <input
                    name="servicesDetail"
                    className="form-control mb-3"
                    placeholder="No service detail found.."
                    value={form.servicesDetail}
                    onChange={handleFormChange}
                  />

                  <label className="form-label">Tax</label>
                  <input
                    className="form-control mb-3"
                    value="Tax not available"
                    disabled
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? "Update" : "Save"}
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
            <div></div>
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
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => {
                      const badgeClass =
                        a.status === "upcoming"
                          ? "bg-warning"
                          : a.status === "completed"
                          ? "bg-success"
                          : a.status === "cancelled"
                          ? "bg-danger"
                          : "bg-secondary";

                      return (
                        <tr key={a._id}>
                          <td>{a.patientName}</td>
                          <td>{a.services}</td>
                          <td>{a.doctorName}</td>
                          <td>{a.date}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              {a.status || "booked"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openEditForm(a)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => handlePdf(a._id)}
                              >
                                PDF
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(a._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* IMPORT MODAL */}
        {importOpen && (
          <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-primary">
                      Appointments Import
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeImportModal}
                    ></button>
                  </div>
                  <form onSubmit={handleImportSubmit}>
                    <div className="modal-body">
                      <div className="row g-3 align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-1">Select type</label>
                          <select
                            className="form-select"
                            value={importType}
                            onChange={(e) => setImportType(e.target.value)}
                          >
                            <option value="csv">CSV</option>
                          </select>
                        </div>
                        <div className="col-md-8">
                          <label className="form-label mb-1">Upload File</label>
                          <div className="input-group">
                            <input
                              type="file"
                              className="form-control"
                              accept=".csv"
                              onChange={handleFileChange}
                            />
                          </div>
                        </div>
                      </div>

                      

                      <p className="mb-2 fw-semibold">
                        Following field is required in csv file
                      </p>
                      <ul className="mb-0">
                        <li>date (date should be less than current date)</li>
                        <li>Start time</li>
                        <li>End time</li>
                        <li>Service</li>
                        <li>Clinic name</li>
                        <li>Doctor name</li>
                        <li>Patient name</li>
                        <li>Status</li>
                      </ul>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeImportModal}
                        disabled={importing}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={importing}
                      >
                        {importing ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Appointments;
