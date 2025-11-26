import React, { useEffect, useState, useRef } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
  FiSearch,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaSort } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/services.css";

/* ---------- Local axios instance ---------- */
// Using 127.0.0.1 prevents connection errors on Node v17+
const api = axios.create({ baseURL: "http://127.0.0.1:3001" });

/* ---------- CONFIGURATION: CSV Headers ---------- */
const REQUIRED_HEADERS = [
  "category", "name", "charges", "isTelemed", "clinicName", 
  "doctor", "duration", "active", "allowMulti"
];

/* ---------- Helper: Status Toggle Switch ---------- */
function StatusToggle({ active, onClick }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div 
        onClick={() => onClick(!active)}
        className={`status-toggle-track ${active ? "active" : ""}`}
      >
        <div className="status-toggle-thumb" />
      </div>
      <span className={`badge border status-badge ${active ? "active" : ""}`}>
        {active ? "ACTIVE" : "INACTIVE"}
      </span>
    </div>
  );
}

/* ---------- Component: Duration Picker ---------- */
function DurationPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [hh, mm] = (value || "00:00").split(":");
  const hours = Array.from({ length: 13 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const handleSelect = (type, val) => {
    const newH = type === "h" ? val : hh || "00";
    const newM = type === "m" ? val : mm || "00";
    onChange(`${newH}:${newM}`);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="duration-picker-wrapper" ref={containerRef}>
      <input
        type="text"
        className="form-control duration-input"
        placeholder="HH:MM"
        value={value}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="duration-dropdown">
          <div className="duration-column">
            <div className="duration-header">HH</div>
            {hours.map((h) => (
              <div key={h} className={`duration-item ${hh === h ? "selected" : ""}`} onClick={() => handleSelect("h", h)}>{h}</div>
            ))}
          </div>
          <div className="duration-column">
            <div className="duration-header">mm</div>
            {minutes.map((m) => (
              <div key={m} className={`duration-item ${mm === m ? "selected" : ""}`} onClick={() => { handleSelect("m", m); setIsOpen(false); }}>{m}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Service Form (Modal) ---------- */
function ServiceForm({ initial, onClose, onSave }) {
  const defaultCategories = ["System Service", "General Dentistry", "Telemed"];
  
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [categories, setCategories] = useState(defaultCategories);
  const [form, setForm] = useState(
    initial || { 
      serviceId: "", name: "", category: defaultCategories[0] || "", 
      charges: "", isTelemed: "No", clinicName: "", doctor: "", 
      duration: "00:00", active: true, allowMulti: "Yes", imageFile: null, imagePreview: "" 
    }
  );

  useEffect(() => { 
    if (initial && initial.imageUrl) {
        setForm((prev) => ({ ...prev, imagePreview: initial.imageUrl })); 
    }
  }, [initial]);

  // --- FETCH REAL DATA (FIXED URLS) ---
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        console.log("Fetching form options...");

        // 1. Fetch Clinics (Updated URL to /api/clinics based on your index.js)
        const clinicRes = await api.get("/api/clinics");
        console.log("Clinics Data:", clinicRes.data);
        
        // Robust data extraction
        const clinicData = Array.isArray(clinicRes.data) 
          ? clinicRes.data 
          : (clinicRes.data?.data || clinicRes.data?.clinics || []);

        // 2. Fetch Doctors (URL remains /doctors)
        const doctorRes = await api.get("/doctors");
        console.log("Doctors Data:", doctorRes.data);

        const doctorData = Array.isArray(doctorRes.data) 
          ? doctorRes.data 
          : (doctorRes.data?.data || doctorRes.data?.doctors || []);

        setClinics(clinicData);
        setDoctors(doctorData);
      } catch (err) {
        console.error("Error fetching options:", err);
        if (err.code === "ERR_NETWORK") {
           toast.error("Cannot connect to server. Is Backend running?");
        }
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Filter doctors based on selected Clinic
  const filteredDoctors = form.clinicName
    ? doctors.filter(d => (d.clinic || "").toLowerCase() === form.clinicName.toLowerCase())
    : doctors;

  const change = (k) => (e) => {
    const val = e.target.value;
    setForm(prev => {
        const updates = { ...prev, [k]: val };
        if (k === 'clinicName') updates.doctor = ""; // Reset doctor if clinic changes
        return updates;
    });
  };
  
  const changeDuration = (val) => setForm({ ...form, duration: val });
  const changeBool = (k) => (e) => setForm({ ...form, [k]: e.target.value === "ACTIVE" });
  
  const onPickImage = (e) => { 
    const file = e.target.files?.[0]; 
    if (!file) return; 
    const url = URL.createObjectURL(file); 
    setForm({ ...form, imageFile: file, imagePreview: url }); 
  };

  const submit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key !== 'imageFile' && key !== 'imagePreview') {
        if (key === 'active') formData.append(key, form[key]);
        else if (key === 'isTelemed' || key === 'allowMulti') formData.append(key, form[key] === "Yes");
        else formData.append(key, form[key]);
      }
    });
    if (form.imageFile) formData.append("image", form.imageFile);

    try { 
      await onSave(formData); 
    } catch (err) { 
      toast.error(err?.response?.data?.message || "Failed to save service"); 
    }
  };

  return (
    <div className="modal fade show d-block custom-modal-overlay" tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title">{initial ? "Edit Service" : "Add Service"}</h5>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light btn-sm" onClick={onClose}>close form</button>
            </div>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-lg-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Category*</label>
                    <select className="form-select" value={form.category} onChange={change("category")}>{categories.map(c=><option key={c}>{c}</option>)}</select>
                  </div>
                  <div className="col-md-6"><label className="form-label">Name*</label><input className="form-control" value={form.name} onChange={change("name")} required /></div>
                  <div className="col-md-6"><label className="form-label">Charges*</label><input className="form-control" value={form.charges} onChange={change("charges")} required /></div>
                  <div className="col-md-6"><label className="form-label">Telemed?*</label><select className="form-select" value={form.isTelemed} onChange={change("isTelemed")}><option>No</option><option>Yes</option></select></div>
                  
                  {/* --- DYNAMIC CLINIC SELECT --- */}
                  <div className="col-md-6">
                    <label className="form-label">Clinic*</label>
                    <select className="form-select" value={form.clinicName} onChange={change("clinicName")} required>
                      <option value="">Select Clinic</option>
                      {loadingOptions ? <option disabled>Loading...</option> : 
                        clinics.map((c, i) => {
                           // Check multiple properties for name
                           const cName = c.name || c.clinicName || c.title || "Clinic "+(i+1);
                           return <option key={c._id || i} value={cName}>{cName}</option>;
                        })
                      }
                    </select>
                  </div>

                  {/* --- DYNAMIC DOCTOR SELECT --- */}
                  <div className="col-md-6">
                    <label className="form-label">Doctor*</label>
                    <select className="form-select" value={form.doctor} onChange={change("doctor")} required disabled={!form.clinicName}>
                      <option value="">{form.clinicName ? "Select Doctor" : "Select Clinic First"}</option>
                      {filteredDoctors.map(d => {
                         const dName = d.firstName ? `${d.firstName} ${d.lastName} ${d.specialization ? `(${d.specialization})` : ''}` : d.name;
                         // Using Name as value because your Service schema likely stores doctor Name string
                         return <option key={d._id} value={dName}>{dName}</option>;
                      })}
                    </select>
                  </div>

                  <div className="col-md-6"><label className="form-label">Duration</label><DurationPicker value={form.duration} onChange={changeDuration} /></div>
                  <div className="col-md-6"><label className="form-label">Status*</label><select className="form-select" value={form.active?"ACTIVE":"INACTIVE"} onChange={changeBool("active")}><option>ACTIVE</option><option>INACTIVE</option></select></div>
                  <div className="col-md-6"><label className="form-label">Multi?*</label><select className="form-select" value={form.allowMulti} onChange={change("allowMulti")}><option>Yes</option><option>No</option></select></div>
                </div>
              </div>
              <div className="col-lg-3 d-flex flex-column align-items-center">
                 <div className="image-upload-wrapper">
                   <div className="image-preview-circle">
                     {form.imagePreview ? <img src={form.imagePreview} className="image-preview-img" alt=""/> : <span className="image-placeholder-icon">🖼️</span>}
                   </div>
                   <label className="image-edit-btn"><input type="file" accept="image/*" hidden onChange={onPickImage} /><FiEdit2 size={14}/></label>
                 </div>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" type="submit">Save</button><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button></div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Main Services Component ---------- */
export default function Services({ sidebarCollapsed = false, toggleSidebar }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ serviceId: "", name: "", clinicName: "", doctor: "", charges: "", duration: "", category: "", status: "" });

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFilterChange = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setPage(1); };

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit, q: search, ...filters };
      const { data } = await api.get("/services", { params });
      if (Array.isArray(data)) { setRows(data); setTotal(data.length); }
      else { setRows(data.rows || []); setTotal(data.total || 0); }
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, limit]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 400); return () => clearTimeout(t); }, [search, filters]);

  const onAdd = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (r) => { setEditing(r); setModalOpen(true); };
  
  const save = async (fd) => {
    const cfg = { headers: { "Content-Type": "multipart/form-data" } };
    try {
      if (editing) await api.put(`/services/${editing._id}`, fd, cfg);
      else await api.post("/services", fd, cfg);
      
      toast.success(editing ? "Service updated successfully" : "Service created successfully");
      setModalOpen(false); 
      load();
    } catch (e) { 
      toast.error("Operation failed. Please try again.");
    }
  };
  
  const del = async (id) => { 
    if (window.confirm("Are you sure you want to delete this service?")) { 
      try {
        await api.delete(`/services/${id}`); 
        toast.success("Service deleted");
        load(); 
      } catch (e) {
        toast.error("Delete failed");
      }
    } 
  };
  
  const toggleActive = async (r, val) => {
    setRows(p => p.map(x => x._id === r._id ? { ...x, active: val } : x));
    try { 
      await api.put(`/services/${r._id}`, { active: val });
      toast.success(`Service marked as ${val ? 'active' : 'inactive'}`);
    } catch { 
      load();
      toast.error("Status update failed");
    }
  };

  /* --- FILE IMPORT LOGIC START --- */
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Invalid file type. Please upload a .csv file");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const firstLine = text.split('\n')[0];
      
      if (!firstLine) { 
        toast.error("The selected file is empty"); 
        return; 
      }
      
      const fileHeaders = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const missingHeaders = REQUIRED_HEADERS.filter(req => !fileHeaders.includes(req));

      if (missingHeaders.length > 0) {
        toast.error(`Validation Failed! Missing columns:\n${missingHeaders.join(", ")}`, { duration: 5000 });
        e.target.value = null;
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        setLoading(true);
        await toast.promise(
          api.post("/services/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          }),
          {
            loading: 'Importing data...',
            success: (res) => res.data.message || 'Import successful!',
            error: (err) => err?.response?.data?.message || 'Import failed',
          }
        );
        load();
      } catch (error) {
        // Error handled by toast.promise
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };
  /* --- FILE IMPORT LOGIC END --- */

  return (
    <div className="d-flex">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-grow-1 main-content-transition" style={{ marginLeft: sidebarCollapsed ? 64 : 250 }}>
        <Navbar toggleSidebar={toggleSidebar} />
        
        <div className="container-fluid py-3">
          
          <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
            <h5 className="mb-0 fw-bold text-secondary">Service List</h5>
            <div className="d-flex gap-2">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />

              <button 
                className="btn btn-primary btn-sm px-3 fw-bold btn-primary-custom"
                onClick={handleImportClick}
              >
                 <FiUpload className="me-1"/> Import data
              </button>

              <button className="btn btn-primary btn-sm px-3 fw-bold btn-primary-custom" onClick={onAdd}>
                 <FiPlus className="me-1"/> Add Service
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow-sm border mb-3">
            <div className="d-flex gap-3 align-items-center">
              <div className="input-group">
                 <span className="input-group-text bg-white border-end-0 text-muted"><FiSearch/></span>
                 <input 
                   className="form-control border-start-0 ps-0 search-input" 
                   placeholder="Search..."
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 custom-table">
                <thead className="bg-light text-secondary">
                  <tr>
                    <th className="py-3 ps-3" style={{width: '40px'}}><input type="checkbox" className="form-check-input"/></th>
                    <th className="py-3" style={{width: '60px'}}>ID <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3" style={{width: '100px'}}>Service ID <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Name <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Clinic Name <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Doctor <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Charges <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Duration <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Category <FaSort className="ms-1 small text-muted"/></th>
                    <th className="py-3">Status <FaSort className="ms-1 small text-muted"/></th>
                    <th className="text-end pe-3" style={{width: '80px'}}>Action <FaSort className="ms-1 small text-muted"/></th>
                  </tr>
                  
                  {/* Filter Row */}
                  <tr className="bg-white align-middle">
                      <td className="ps-3 border-bottom"></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" disabled /></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="Service ID" value={filters.serviceId} onChange={(e) => handleFilterChange("serviceId", e.target.value)}/></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="Filter Name" value={filters.name} onChange={(e) => handleFilterChange("name", e.target.value)}/></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="Filter Clinic" value={filters.clinicName} onChange={(e) => handleFilterChange("clinicName", e.target.value)}/></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="Filter doctor" value={filters.doctor} onChange={(e) => handleFilterChange("doctor", e.target.value)}/></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="Filter Charge" value={filters.charges} onChange={(e) => handleFilterChange("charges", e.target.value)}/></td>
                      <td className="border-bottom p-1"><input className="form-control form-control-sm table-filter-input" placeholder="HH:mm" value={filters.duration} onChange={(e) => handleFilterChange("duration", e.target.value)}/></td>
                      <td className="border-bottom p-1">
                         <select className="form-select form-select-sm table-filter-input" value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)}>
                            <option value="">Filter Name</option>
                            <option value="System Service">System Service</option>
                            <option value="General Dentistry">General Dentistry</option>
                            <option value="Telemed">Telemed</option>
                         </select>
                      </td>
                      <td className="border-bottom p-1">
                         <select className="form-select form-select-sm table-filter-input" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                            <option value="">Filter status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                         </select>
                      </td>
                      <td className="border-bottom"></td>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="11" className="text-center py-5">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan="11" className="text-center py-5">No services found.</td></tr>
                  ) : (
                    rows.map((r, i) => {
                      const displayName = r.isTelemed ? "Telemed" : "Checkup";
                      const displayInitial = displayName.charAt(0);
                      return (
                        <tr key={r._id}>
                          <td className="ps-3"><input type="checkbox" className="form-check-input"/></td>
                          <td className="fw-bold text-secondary">{total - ((page-1)*limit) - i}</td>
                          <td className="text-muted">{r.serviceId || (i+1)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                               <div className="service-avatar-circle">
                                 {r.imageUrl ? <img src={r.imageUrl} alt="" className="service-avatar-img"/> : displayInitial}
                               </div>
                               <span className="fw-semibold text-dark">{displayName}</span>
                            </div>
                          </td>
                          <td>{r.clinicName}</td>
                          <td>{r.doctor}</td>
                          <td>{r.charges}</td>
                          <td>{r.duration || "-"}</td>
                          <td><span className="badge bg-light text-dark border fw-normal">{r.category}</span></td>
                          <td><StatusToggle active={r.active} onClick={(val) => toggleActive(r, val)} /></td>
                          <td className="text-end pe-3">
                            <div className="d-flex justify-content-end gap-1">
                               <button className="btn btn-outline-primary btn-sm rounded-1 action-btn" onClick={() => onEdit(r)}><FiEdit2 size={12}/></button>
                               <button className="btn btn-outline-danger btn-sm rounded-1 action-btn" onClick={() => del(r._id)}><FiTrash2 size={12}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light text-secondary">
               <div className="d-flex align-items-center gap-2 small">
                 <span>Rows per page:</span>
                 <select className="form-select form-select-sm pagination-select" value={limit} onChange={e=>setLimit(Number(e.target.value))}>
                   <option value={5}>5</option>
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                 </select>
               </div>
               <div className="d-flex align-items-center gap-2 small">
                 <span>Page</span>
                 <div className="border bg-white px-2 py-1 rounded">{page}</div>
                 <span>of {Math.ceil(total/limit)}</span>
                 <div className="btn-group">
                     <button className="btn btn-sm btn-link text-decoration-none text-secondary" disabled={page <= 1} onClick={()=>setPage(p=>p-1)}><FiChevronLeft/> Prev</button>
                     <button className="btn btn-sm btn-link text-decoration-none text-secondary" disabled={page * limit >= total} onClick={()=>setPage(p=>p+1)}>Next <FiChevronRight/></button>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="mt-3 text-secondary small">© Western State Pain Institute</div>

          {modalOpen && <ServiceForm initial={editing} onClose={() => setModalOpen(false)} onSave={save} />}
        </div>
      </div>
    </div>
  );
}