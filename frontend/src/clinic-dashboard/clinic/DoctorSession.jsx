import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileImport,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../shared/styles/shared-components.css";
import "../../shared/styles/shared-tables.css";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";
import API_BASE from "../../config";

const DAYS_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const formatRange = (start, end) => {
  if (!start || !end) return "-";
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const DoctorSessions = ({ sidebarCollapsed, toggleSidebar }) => {
  // Get clinic info from localStorage for auto-detecting clinic
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const clinicName = authUser?.clinicName || "";

  const [sessions, setSessions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [filterDay, setFilterDay] = useState("");

  const rowsPerPage = 10;

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    confirmText: "Delete",
    confirmVariant: "danger",
  });

  const [form, setForm] = useState({
    doctorId: "",
    doctorName: "",
    clinic: clinicName, // Auto-fill clinic
    days: [],
    timeSlotMinutes: 30,
    morningStart: "",
    morningEnd: "",
    eveningStart: "",
    eveningEnd: "",
  });

  // FETCH
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/doctor-sessions`);
      // Filter sessions by clinic if clinicName is available
      const allSessions = res.data || [];
      const filteredSessions = clinicName
        ? allSessions.filter(
            (s) => (s.clinic || "").toLowerCase() === clinicName.toLowerCase()
          )
        : allSessions;
      setSessions(filteredSessions);
    } catch (err) {
      console.error("Error fetching doctor sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/doctors`);
      // Backend already filters doctors by clinic for clinic users
      // No additional frontend filtering needed
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchDoctors();
  }, []);

  // FORM HANDLERS
  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      doctorId: "",
      doctorName: "",
      clinic: clinicName, // Auto-fill clinic
      days: [],
      timeSlotMinutes: 30,
      morningStart: "",
      morningEnd: "",
      eveningStart: "",
      eveningEnd: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (session) => {
    setEditingId(session._id);
    setForm({
      doctorId: session.doctorId || "",
      doctorName: session.doctorName || "",
      clinic: session.clinic || "",
      days: session.days || [],
      timeSlotMinutes: session.timeSlotMinutes || 30,
      morningStart: session.morningStart || "",
      morningEnd: session.morningEnd || "",
      eveningStart: session.eveningStart || "",
      eveningEnd: session.eveningEnd || "",
    });
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doc = doctors.find((d) => d._id === doctorId);
    setForm((prev) => ({
      ...prev,
      doctorId,
      doctorName: doc ? `${doc.firstName} ${doc.lastName}` : "",
      clinic: doc?.clinic || prev.clinic,
    }));
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...form };

      if (payload.doctorId && !payload.doctorName) {
        const doc = doctors.find((d) => d._id === payload.doctorId);
        if (doc) payload.doctorName = `${doc.firstName} ${doc.lastName}`;
      }

      if (editingId) {
        await axios.put(`${API_BASE}/doctor-sessions/${editingId}`, payload);
        toast.success("Doctor session updated");
      } else {
        await axios.post(`${API_BASE}/doctor-sessions`, payload);
        toast.success("Doctor session created");
      }

      closeForm();
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error("Error saving session");
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: "Delete Session",
      message: "Delete this session?",
      action: () => executeDelete(id),
      confirmText: "Delete",
      confirmVariant: "danger",
    });
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/doctor-sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast.success("Session deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: "", message: "", action: null });
  };

  // Import CSV
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await axios.post(
        `${API_BASE}/doctor-sessions/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success(
        `Successfully imported ${response.data.count} doctor sessions`
      );
      setShowImportModal(false);
      setImportFile(null);
      fetchSessions();
    } catch (err) {
      console.error("Import error:", err);
      toast.error(
        "Import failed: " + (err.response?.data?.message || err.message)
      );
    }
  };

  // FILTERING
  const filteredSessions = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return sessions.filter((s) => {
      if (q) {
        const merged = `${s.doctorName} ${s.clinic} ${(s.days || []).join(
          ", "
        )}`.toLowerCase();
        if (!merged.includes(q)) return false;
      }

      if (
        filterDoctor &&
        !s.doctorName?.toLowerCase().includes(filterDoctor.toLowerCase())
      )
        return false;

      if (
        filterClinic &&
        !s.clinic?.toLowerCase().includes(filterClinic.toLowerCase())
      )
        return false;

      if (filterDay && !(s.days || []).includes(filterDay)) return false;

      return true;
    });
  }, [sessions, searchTerm, filterDoctor, filterClinic, filterDay]);

  return (
    <div>
      {/* SIDEBAR */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* MAIN CONTENT CONTAINER */}
      <div
        className="main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          background: "#f5f6fa",
          minHeight: "100vh",
        }}
      >
        {/* NAVBAR */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* PAGE CONTAINER */}
        <div className="container-fluid mt-3">
          {/* BLUE HEADER LIKE SERVICES */}
          <div className="services-topbar services-card d-flex justify-content-between">
            <h5 className="fw-bold text-white mb-0">Doctor Sessions</h5>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowImportModal(true)}
              >
                <FaFileImport /> Import data
              </button>

              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-2"
                onClick={openCreateForm}
              >
                <FaPlus /> Doctor Session
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="card services-card p-3 mt-3">
            <div className="input-group" style={{ maxWidth: 400 }}>
              <span className="input-group-text bg-white border-end-0">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search table…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="card services-card p-3 mt-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Sr</th>
                    <th>Doctor</th>
                    <th>Clinic</th>
                    <th>Days</th>
                    <th>Slot</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Action</th>
                  </tr>

                  {/* FILTER ROW */}
                  <tr className="small">
                    <th></th>

                    <th>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Filter doctor"
                        value={filterDoctor}
                        onChange={(e) => setFilterDoctor(e.target.value)}
                      />
                    </th>

                    <th>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Filter clinic"
                        value={filterClinic}
                        onChange={(e) => setFilterClinic(e.target.value)}
                      />
                    </th>

                    <th>
                      <select
                        className="form-select form-select-sm"
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                      >
                        <option value="">Days</option>
                        {DAYS_OPTIONS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </th>

                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted">
                        No data
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s, i) => (
                      <tr key={s._id}>
                        <td>{i + 1}</td>
                        <td>{s.doctorName}</td>
                        <td>{s.clinic}</td>
                        <td>{s.days.join(", ")}</td>
                        <td>{s.timeSlotMinutes}</td>
                        <td>{formatRange(s.morningStart, s.morningEnd)}</td>
                        <td>{formatRange(s.eveningStart, s.eveningEnd)}</td>

                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditForm(s)}
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(s._id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="d-flex justify-content-between mt-3">
              <span>Rows per page: 10</span>
              <span className="d-flex align-items-center gap-2">
                Page <b>1</b> of <b>1</b>
              </span>
            </div>
          </div>
        </div>

        {/* ADD/EDIT MODAL */}
        {formOpen && (
          <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-primary">
                      {editingId ? "Edit Doctor Session" : "Add Doctor Session"}
                    </h5>
                    <button className="btn-close" onClick={closeForm} />
                  </div>

                  <form onSubmit={handleSave}>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Doctor *</label>
                          <select
                            className="form-select"
                            name="doctorId"
                            value={form.doctorId}
                            onChange={handleDoctorChange}
                            required
                          >
                            <option value="">Select Doctor</option>
                            {doctors.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.firstName} {d.lastName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Clinic {clinicName ? "(Auto-detected)" : "*"}
                          </label>
                          <input
                            className={`form-control ${
                              clinicName ? "bg-light" : ""
                            }`}
                            name="clinic"
                            value={form.clinic}
                            onChange={handleFormChange}
                            required
                            readOnly={!!clinicName}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Days *</label>
                          <div className="d-flex flex-wrap gap-2">
                            {DAYS_OPTIONS.map((d) => (
                              <label key={d} className="form-check-label me-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input me-1"
                                  checked={form.days.includes(d)}
                                  onChange={() => toggleDay(d)}
                                />
                                {d}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Time Slot (min)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="timeSlotMinutes"
                            value={form.timeSlotMinutes}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Morning Session</label>
                          <div className="d-flex gap-2">
                            <input
                              type="time"
                              className="form-control"
                              name="morningStart"
                              value={form.morningStart}
                              onChange={handleFormChange}
                            />
                            <input
                              type="time"
                              className="form-control"
                              name="morningEnd"
                              value={form.morningEnd}
                              onChange={handleFormChange}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Evening Session</label>
                          <div className="d-flex gap-2">
                            <input
                              type="time"
                              className="form-control"
                              name="eveningStart"
                              value={form.eveningStart}
                              onChange={handleFormChange}
                            />
                            <input
                              type="time"
                              className="form-control"
                              name="eveningEnd"
                              value={form.eveningEnd}
                              onChange={handleFormChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeForm}
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
            </div>
          </>
        )}

        {/* IMPORT MODAL */}
        {showImportModal && (
          <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-primary">
                      Import Doctor Sessions
                    </h5>
                    <button
                      className="btn-close"
                      onClick={() => setShowImportModal(false)}
                    />
                  </div>

                  <div className="modal-body">
                    <form onSubmit={handleImport}>
                      <label className="form-label">Upload CSV File</label>
                      <input
                        type="file"
                        accept=".csv"
                        className="form-control mb-3"
                        onChange={(e) => setImportFile(e.target.files[0])}
                      />

                      <div className="mb-3">
                        <p className="fw-semibold mb-2">CSV Required Fields:</p>
                        <ul className="small text-muted">
                          <li>doctorId</li>
                          <li>doctorName</li>
                          <li>clinic</li>
                          <li>days (comma-separated: Mon,Tue,Wed,...)</li>
                          <li>timeSlotMinutes</li>
                          <li>morningStart (HH:MM format)</li>
                          <li>morningEnd (HH:MM format)</li>
                          <li>eveningStart (HH:MM format)</li>
                          <li>eveningEnd (HH:MM format)</li>
                        </ul>
                      </div>

                      <div className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary me-2"
                          onClick={() => setShowImportModal(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Import
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <ConfirmationModal
          show={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.action}
          onCancel={closeConfirmModal}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
        />
      </div>
    </div>
  );
};

export default DoctorSessions;
