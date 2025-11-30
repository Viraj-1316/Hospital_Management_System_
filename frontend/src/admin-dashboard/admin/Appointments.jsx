import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaDownload } from "react-icons/fa";
import "../styles/appointments.css";
import "../styles/admin-shared.css";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfirmationModal from "../../components/ConfirmationModal";

const API_BASE = "http://localhost:3001";

const Appointments = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    date: "",
    clinic: "",
    patient: "",
    status: "",
    doctor: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);

  // ✅ New State for Server-Side Slots
  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    clinic: "",
    doctor: "",
    doctorId: "", // Important for fetching slots
    service: "",
    date: "",
    patient: "",
    patientName: "",
    status: "booked",
    servicesDetail: "",
    slot: "",
  });

  const [editId, setEditId] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    confirmText: "Delete",
    confirmVariant: "danger"
  });

  // ------------------ FETCH APPOINTMENTS ------------------
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async (query = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/appointments`, { params: query });
      setAppointments(Array.isArray(res.data) ? res.data : []);
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
        const [docRes, servRes, patRes, clinicRes] =
          await Promise.all([
            axios.get(`${API_BASE}/doctors`),
            axios.get(`${API_BASE}/services`),
            axios.get(`${API_BASE}/patients`),
            axios.get(`${API_BASE}/api/clinics`),
          ]);

        setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data.data || []);
        
        const servicesData = servRes.data.rows || servRes.data || [];
        setServicesList(Array.isArray(servicesData) ? servicesData : []);

        setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);

        if (clinicRes.data?.success && Array.isArray(clinicRes.data.clinics)) {
          setClinics(clinicRes.data.clinics);
        } else if (Array.isArray(clinicRes.data)) {
          setClinics(clinicRes.data);
        } else {
          setClinics([]);
        }

      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);

  // ------------------ ✅ NEW: FETCH SLOTS FROM BACKEND ------------------
  // This runs whenever the selected Doctor or Date changes
  useEffect(() => {
    const fetchSlots = async () => {
      // Only fetch if we have both Doctor ID and Date
      if (form.doctorId && form.date) {
        setLoadingSlots(true);
        setDynamicSlots([]); // Clear old slots
        try {
          // Using the /appointments/slots endpoint we verified earlier
          const res = await axios.get(`${API_BASE}/appointments/slots`, {
            params: { doctorId: form.doctorId, date: form.date }
          });
          
          if (res.data && res.data.slots) {
            setDynamicSlots(res.data.slots);
          } else if (Array.isArray(res.data)) {
            setDynamicSlots(res.data);
          }
        } catch (err) {
          console.error("Error fetching slots:", err);
          toast.error("Could not load time slots.");
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setDynamicSlots([]);
      }
    };

    fetchSlots();
  }, [form.doctorId, form.date]);


  // Handle patientId param from URL
  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const p = patients.find((pat) => pat._id === patientIdParam);
      if (p) {
        setFilters((prev) => ({
          ...prev,
          patient: `${p.firstName} ${p.lastName}`,
        }));
        fetchAppointments({ patient: `${p.firstName} ${p.lastName}` });
      }
    }
  }, [patientIdParam, patients]);

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
      list = list.filter((a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) > today);
    } else if (tab === "past") {
      list = list.filter((a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) < today);
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

    // ✅ Capture Doctor ID and Name correctly
    if (name === "doctor") {
      const selectedDoc = doctors.find((d) => d._id === value);
      setForm((p) => ({
        ...p,
        doctorId: value, // Save ID
        doctor: selectedDoc ? `${selectedDoc.firstName} ${selectedDoc.lastName}` : "", // Save Name
        slot: "" // Reset slot when doctor changes
      }));
      return;
    }

    if (name === "service") {
      const selected = servicesList.find((s) => s.name === value);
      let priceText = "";
      if (selected) {
        const price = selected.price ?? selected.charges ?? selected.fees;
        if (price !== undefined && price !== null) priceText = price.toString();
      }
      setForm((p) => ({ ...p, service: value, servicesDetail: priceText }));
      return;
    }

    if (name === "date") {
      setForm((p) => ({ ...p, date: value, slot: "" }));
      return;
    }

    if (name === "patient") {
      const selectedP = patients.find((p) => p._id === value);
      setForm((p) => ({
        ...p,
        patient: value,
        patientName: selectedP ? `${selectedP.firstName} ${selectedP.lastName}` : value,
      }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      clinic: "",
      doctor: "",
      doctorId: "",
      service: "",
      date: "",
      patient: "",
      patientName: "",
      status: "booked",
      servicesDetail: "",
      slot: "",
    });
    setPanelOpen(true);
    setFiltersOpen(false);
    setDynamicSlots([]);
  };

  const openEditForm = (item) => {
    setEditId(item._id);
    
    // Attempt to find doctor ID if it's populated object, else use string
    const dId = item.doctorId && typeof item.doctorId === 'object' ? item.doctorId._id : item.doctorId;

    setForm({
      clinic: item.clinic || "",
      doctor: item.doctorName || "",
      doctorId: dId || "",
      service: item.services || "",
      date: item.date ? item.date.substring(0, 10) : "",
      patient: item.patientId?._id || item.patientId || "",
      patientName: item.patientName || "",
      status: item.status || "booked",
      servicesDetail: item.charges || item.servicesDetail || "",
      slot: item.time || item.slot || "",
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
        doctorId: form.doctorId,
        doctorName: form.doctor,
        patientId: form.patient,
        patientName: form.patientName,
        services: form.service,
        date: form.date,
        status: form.status,
        charges: form.servicesDetail,
        servicesDetail: form.servicesDetail,
        time: form.slot,
        slot: form.slot,
      };

      if (editId) {
        await toast.promise(
          axios.put(`${API_BASE}/appointments/${editId}`, payload),
          { loading: "Updating...", success: "Updated!", error: "Failed." }
        );
      } else {
        await toast.promise(
          axios.post(`${API_BASE}/appointments`, payload), 
          { loading: "Saving...", success: "Booked!", error: "Failed." }
        );
      }

      fetchAppointments();
      closePanel();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Error saving appointment.");
    }
  };

  // ------------------ DELETE / PDF HANDLERS ------------------
  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: "Delete Appointment",
      message: "Are you sure you want to delete this?",
      action: () => executeDelete(id),
      confirmText: "Delete",
      confirmVariant: "danger"
    });
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      toast.success("Appointment deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting");
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: "", message: "", action: null });
  };

  const handlePdf = (id) => {
    window.open(`${API_BASE}/appointments/${id}/pdf`, "_blank");
  };

  // Import handlers omitted for brevity (same as before) ...
  // (Keep the Import Modal code exactly as you had it)
  const openImportModal = () => { setImportOpen(true); setImportFile(null); };
  const closeImportModal = () => { setImportOpen(false); setImportFile(null); };
  const handleFileChange = (e) => setImportFile(e.target.files[0] || null);
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error("Choose CSV file first.");
    try {
        setImporting(true);
        const formData = new FormData();
        formData.append("file", importFile);
        formData.append("type", importType);
        const res = await axios.post(`${API_BASE}/appointments/import`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success(`Imported ${res.data?.count} appointments`);
        closeImportModal();
        fetchAppointments();
    } catch (err) { toast.error("Import failed"); } finally { setImporting(false); }
  };

  // ------------------ JSX ------------------
  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-grow-1 main-content-transition" style={{ marginLeft: sidebarCollapsed ? 64 : 250, minHeight: "100vh" }}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid py-3">
          {/* Header & Tabs */}
          <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0">Appointments</h5>
            <div className="d-flex gap-2 appointments-header-actions">
              <button className="btn btn-light-toggle btn-sm" onClick={openAddForm}>
                {panelOpen && !editId ? "Close form" : "Add Appointment"}
              </button>
              <button className={`btn btn-filter-toggle btn-sm ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((s) => !s)}>
                Filters
              </button>
              <button className="btn btn-import btn-sm" onClick={openImportModal}>
                <FaDownload className="me-1" /> Import Data
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 appointments-header">
            <div className="btn-group btn-sm appointments-tabs">
              {['all', 'upcoming', 'past'].map(t => (
                  <button key={t} type="button" className={`btn btn-outline-primary ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                    {t.toUpperCase()}
                  </button>
              ))}
            </div>
          </div>

          {/* Filter Panel (Simplified) */}
          <div className={`filter-panel ${filtersOpen ? "open" : ""}`}>
             <div className="p-3">
                <div className="row g-3">
                   <div className="col-md-3">
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
                   </div>
                   {/* ... Other filters ... */}
                </div>
                <div className="mt-3 d-flex justify-content-end gap-2">
                   <button className="btn btn-outline-secondary" onClick={clearFilters}>Reset</button>
                   <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
                </div>
             </div>
          </div>

          {/* ADD / EDIT PANEL */}
          <div className={`form-panel appointments-form ${panelOpen ? "open" : ""}`}>
            <div className="p-3">
              <form onSubmit={handleSave}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0 fw-bold">{editId ? "Edit Appointment" : "Add Appointment"}</h5>
                </div>

                <div className="row g-3">
                  <div className="col-lg-6">
                    <div className="row g-3">
                      {/* Clinic Selection */}
                      <div className="col-md-12">
                        <label className="form-label">Select Clinic *</label>
                        <select name="clinic" className="form-select" value={form.clinic} onChange={handleFormChange} required>
                          <option value="">Select</option>
                          {clinics.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>

                      {/* Doctor Selection (Now sets ID) */}
                      <div className="col-md-12">
                        <label className="form-label">Doctor *</label>
                        <select name="doctor" className="form-select" value={form.doctorId} onChange={handleFormChange} required>
                            <option value="">Select Doctor</option>
                            {doctors.map((d) => (
                              <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                            ))}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Service *</label>
                        <select name="service" className="form-select" value={form.service} onChange={handleFormChange} required>
                            <option value="">Service</option>
                            {servicesList.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Appointment Date *</label>
                        <input name="date" type="date" className="form-control" value={form.date} onChange={handleFormChange} required />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Patient *</label>
                        <select name="patient" className="form-select" value={form.patient} onChange={handleFormChange} required>
                            <option value="">Select Patient</option>
                            {patients.map((p) => (
                              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                            ))}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Status *</label>
                        <select name="status" className="form-select" value={form.status} onChange={handleFormChange} required>
                          <option value="booked">Booked</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - SLOTS */}
                  <div className="col-lg-6">
                    <label className="form-label">Available Slot *</label>
                    <div className="available-slot-box border rounded p-3 mb-3 bg-white" style={{minHeight:'150px'}}>
                      
                      {!form.doctorId || !form.date ? (
                         <div className="text-center text-muted small mt-4">Select Doctor & Date to see slots</div>
                      ) : loadingSlots ? (
                         <div className="text-center text-primary mt-4">Loading available times...</div>
                      ) : dynamicSlots.length === 0 ? (
                         <div className="text-center text-danger mt-4">No slots available for this date.</div>
                      ) : (
                         <div className="d-flex flex-wrap gap-2">
                            {dynamicSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  className={`btn btn-sm ${form.slot === slot ? "btn-primary" : "btn-outline-primary"}`}
                                  onClick={() => setForm(p => ({ ...p, slot }))}
                                >
                                  {slot}
                                </button>
                            ))}
                         </div>
                      )}
                    </div>

                    <label className="form-label">Service Detail (Price)</label>
                    <input name="servicesDetail" className="form-control mb-3" placeholder="Service price" value={form.servicesDetail} disabled onChange={handleFormChange} />

                    <label className="form-label">Tax</label>
                    <input className="form-control mb-3" value="Tax not available" disabled />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button type="button" className="btn btn-outline-secondary" onClick={closePanel}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editId ? "Update" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>

          {/* MAIN TABLE */}
          <div className="card shadow-sm p-3 mt-3">
             <div className="d-flex justify-content-between mb-3">
                <input type="text" className="form-control w-50" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             {/* ... Table Code (Same as before) ... */}
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
                      {filteredAppointments.map((a) => (
                          <tr key={a._id}>
                            <td>{a.patientName}</td>
                            <td>{a.services}</td>
                            <td>{a.doctorName}</td>
                            <td>{a.date ? new Date(a.date).toLocaleDateString("en-GB") : "N/A"}</td>
                            <td><span className="badge bg-secondary">{a.status}</span></td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => openEditForm(a)}>Edit</button>
                                <button className="btn btn-sm btn-outline-dark" onClick={() => handlePdf(a._id)}>PDF</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a._id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
             </div>
          </div>

          {/* IMPORT MODAL & CONFIRM MODAL (Same as before) */}
          {/* ... */}
        </div>
        <ConfirmationModal
          show={confirmModal.show} title={confirmModal.title} message={confirmModal.message}
          onConfirm={confirmModal.action} onCancel={closeConfirmModal}
          confirmText={confirmModal.confirmText} confirmVariant={confirmModal.confirmVariant}
        />
      </div>
    </div>
  );
};

export default Appointments;