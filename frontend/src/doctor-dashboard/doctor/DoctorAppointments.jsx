import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaPlus, FaDownload, FaFilter } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ✅ Import Doctor Layout
import DoctorLayout from "../layouts/DoctorLayout"; 
import "../../admin-dashboard/styles/appointments.css"; // Reuse existing styles

const API_BASE = "http://localhost:3001";

const DoctorAppointments = () => {
  const navigate = useNavigate();

  // --- 1. Get Logged-In Doctor Info ---
  const storedDoctor = (() => {
    try {
      const doc = localStorage.getItem("doctor");
      return doc ? JSON.parse(doc) : null;
    } catch { return null; }
  })();

  const doctorId = storedDoctor?._id || storedDoctor?.id;
  const doctorName = storedDoctor ? `${storedDoctor.firstName} ${storedDoctor.lastName}` : "Me";

  // --- State ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({ date: "", status: "", patient: "" });

  // Dropdown Data
  const [servicesList, setServicesList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);

  // Slot Data
  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form State
  const [form, setForm] = useState({
    clinic: "",
    service: "",
    date: "",
    patient: "",
    patientName: "",
    status: "booked",
    servicesDetail: "",
    slot: "",
  });

  const [editId, setEditId] = useState(null);

  // --- Fetch Data ---
  useEffect(() => {
    if (!doctorId) {
        toast.error("Doctor not authenticated");
        return;
    }
    fetchAppointments();
    fetchDropdownData();
  }, [doctorId]);

  const fetchAppointments = async (query = {}) => {
    try {
      setLoading(true);
      // ✅ Force filter by current Doctor ID
      const params = { ...query, doctorId: doctorId };
      const res = await axios.get(`${API_BASE}/appointments`, { params });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [servRes, patRes, clinicRes] = await Promise.all([
        axios.get(`${API_BASE}/services`),
        axios.get(`${API_BASE}/patients`),
        axios.get(`${API_BASE}/api/clinics`),
      ]);

      const servicesData = servRes.data.rows || servRes.data || [];
      setServicesList(Array.isArray(servicesData) ? servicesData : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      
      if (clinicRes.data?.success && Array.isArray(clinicRes.data.clinics)) {
        setClinics(clinicRes.data.clinics);
      } else {
        setClinics(Array.isArray(clinicRes.data) ? clinicRes.data : []);
      }
    } catch (err) {
      console.error("Dropdown data error:", err);
    }
  };

  // --- Slot Fetching (Server Side) ---
  useEffect(() => {
    const fetchSlots = async () => {
      if (doctorId && form.date) {
        setLoadingSlots(true);
        try {
          const res = await axios.get(`${API_BASE}/appointments/slots`, {
            params: { doctorId: doctorId, date: form.date }
          });
          if (res.data && res.data.slots) setDynamicSlots(res.data.slots);
          else if (Array.isArray(res.data)) setDynamicSlots(res.data);
        } catch (err) {
          console.error("Slot error:", err);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setDynamicSlots([]);
      }
    };
    fetchSlots();
  }, [doctorId, form.date]);

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "service") {
      const selected = servicesList.find((s) => s.name === value);
      let priceText = "";
      if (selected) {
        const price = selected.price ?? selected.charges ?? selected.fees;
        if (price !== undefined) priceText = price.toString();
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
      service: "",
      date: "",
      patient: "",
      patientName: "",
      status: "booked",
      servicesDetail: "",
      slot: "",
    });
    setPanelOpen(true);
  };

  const openEditForm = (item) => {
    setEditId(item._id);
    const pId = item.patientId && typeof item.patientId === 'object' ? item.patientId._id : (item.patientId || "");
    
    setForm({
      clinic: item.clinic || "",
      service: item.services || "",
      date: item.date ? item.date.substring(0, 10) : "",
      patient: pId,
      patientName: item.patientName || "",
      status: item.status || "booked",
      servicesDetail: item.charges || item.servicesDetail || "",
      slot: item.time || item.slot || "",
    });
    setPanelOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clinic: form.clinic,
        doctorId: doctorId, // ✅ Locked to current user
        doctorName: doctorName,
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
        await toast.promise(axios.put(`${API_BASE}/appointments/${editId}`, payload), {
            loading: "Updating...", success: "Updated!", error: "Failed."
        });
      } else {
        await toast.promise(axios.post(`${API_BASE}/appointments`, payload), {
            loading: "Booking...", success: "Booked!", error: "Failed."
        });
      }
      fetchAppointments();
      setPanelOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    }
  };

  // --- Filtering ---
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tab === "upcoming") list = list.filter((a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) > today);
    else if (tab === "past") list = list.filter((a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) < today);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) => (a.patientName || "").toLowerCase().includes(q) || (a.clinic || "").toLowerCase().includes(q));
    }
    return list;
  }, [appointments, tab, searchTerm]);

  // --- JSX ---
  return (
    <DoctorLayout>
      <div className="container-fluid py-4">
        
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
           <div>
              <h4 className="fw-bold text-primary mb-1">My Appointments</h4>
              <p className="text-muted small mb-0">Manage bookings and schedules</p>
           </div>
           <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={() => setFiltersOpen(!filtersOpen)}>
                 <FaFilter/> Filter
              </button>
              <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={openAddForm}>
                 <FaPlus/> Add Appointment
              </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="btn-group mb-4">
           {['all', 'upcoming', 'past'].map(t => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab(t)}>
                 {t.toUpperCase()}
              </button>
           ))}
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
           <div className="card p-3 mb-4 bg-light border-0">
              <div className="row g-3">
                 <div className="col-md-3">
                    <label className="form-label small">Date</label>
                    <input type="date" className="form-control form-control-sm" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
                 </div>
                 <div className="col-md-3 d-flex align-items-end">
                    <button className="btn btn-secondary btn-sm w-100" onClick={() => fetchAppointments(filters)}>Apply Filters</button>
                 </div>
              </div>
           </div>
        )}

        {/* ✅ ADD/EDIT FORM PANEL */}
        {panelOpen && (
           <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                 <h6 className="fw-bold mb-0 text-primary">{editId ? "Edit Appointment" : "New Appointment"}</h6>
              </div>
              <div className="card-body">
                 <form onSubmit={handleSave}>
                    <div className="row g-3">
                       {/* Clinic */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Clinic *</label>
                          <select name="clinic" className="form-select" value={form.clinic} onChange={handleFormChange} required>
                             <option value="">Select Clinic</option>
                             {clinics.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>

                       {/* Service */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Service *</label>
                          <select name="service" className="form-select" value={form.service} onChange={handleFormChange} required>
                             <option value="">Select Service</option>
                             {servicesList.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>

                       {/* Patient */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Patient *</label>
                          <select name="patient" className="form-select" value={form.patient} onChange={handleFormChange} required>
                             <option value="">Select Patient</option>
                             {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
                          </select>
                       </div>

                       {/* Date */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Date *</label>
                          <input type="date" name="date" className="form-control" value={form.date} onChange={handleFormChange} required />
                       </div>

                       {/* Status */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Status</label>
                          <select name="status" className="form-select" value={form.status} onChange={handleFormChange}>
                             <option value="booked">Booked</option>
                             <option value="completed">Completed</option>
                             <option value="cancelled">Cancelled</option>
                          </select>
                       </div>

                       {/* Charges */}
                       <div className="col-md-6">
                          <label className="form-label small fw-bold">Charges</label>
                          <input name="servicesDetail" className="form-control" value={form.servicesDetail} onChange={handleFormChange} />
                       </div>

                       {/* Time Slots */}
                       <div className="col-12">
                          <label className="form-label small fw-bold">Time Slot *</label>
                          <div className="border rounded p-3 bg-light" style={{minHeight:'80px'}}>
                             {!form.date ? <span className="text-muted small">Select date first</span> :
                              loadingSlots ? <span className="text-primary small">Loading slots...</span> :
                              dynamicSlots.length === 0 ? <span className="text-danger small">No slots available (Check holidays or schedule)</span> :
                              <div className="d-flex flex-wrap gap-2">
                                 {dynamicSlots.map(slot => (
                                    <button key={slot} type="button" 
                                       className={`btn btn-sm ${form.slot === slot ? 'btn-primary' : 'btn-outline-primary'}`}
                                       onClick={() => setForm(f => ({...f, slot}))}
                                    >
                                       {slot}
                                    </button>
                                 ))}
                              </div>
                             }
                          </div>
                       </div>
                    </div>
                    <div className="mt-4 text-end gap-2 d-flex justify-content-end">
                       <button type="button" className="btn btn-light border" onClick={() => setPanelOpen(false)}>Cancel</button>
                       <button type="submit" className="btn btn-primary px-4">Save Appointment</button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* Appointments Table */}
        <div className="card border-0 shadow-sm">
           <div className="card-body p-0">
              <div className="table-responsive">
                 <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                       <tr>
                          <th className="ps-4">Patient</th>
                          <th>Service</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th className="text-end pe-4">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredAppointments.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">No appointments found.</td></tr>
                       ) : filteredAppointments.map(a => (
                          <tr key={a._id}>
                             <td className="ps-4 fw-medium">{a.patientName}</td>
                             <td>{a.services}</td>
                             <td>{a.date ? new Date(a.date).toLocaleDateString("en-GB") : "N/A"}</td>
                             <td><span className="badge bg-light text-dark border">{a.time || a.slot || "-"}</span></td>
                             <td>
                                <span className={`badge ${a.status === 'booked' ? 'bg-primary' : a.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                                   {a.status}
                                </span>
                             </td>
                             <td className="text-end pe-4">
                                <button className="btn btn-sm btn-link text-decoration-none" onClick={() => openEditForm(a)}>Edit</button>
                                <button className="btn btn-sm btn-link text-decoration-none text-dark" onClick={() => window.open(`${API_BASE}/appointments/${a._id}/pdf`, '_blank')}>Receipt</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </div>
    </DoctorLayout>
  );
};

export default DoctorAppointments;