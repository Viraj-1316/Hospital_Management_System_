import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  User,
  MapPin,
  Activity,
  FileText,
  AlertCircle,
  Stethoscope,
  Clipboard
} from "lucide-react";
import axios from "axios";

// --- 1. Import Layout ---
import PatientLayout from "../layouts/PatientLayout"; 
import "../styles/encounters.css";
import API_BASE from "../../config";

/* -------------------------------------------------------------------------- */
/* AXIOS SETUP                                                                */
/* -------------------------------------------------------------------------- */
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------------------------- */
/* SMART HELPERS                                                              */
/* -------------------------------------------------------------------------- */
const getDoctorName = (row) => {
  if (row.doctorId && typeof row.doctorId === 'object') {
    const { firstName, lastName, name } = row.doctorId;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (name) return name;
  }
  if (row.doctorName) return row.doctorName;
  if (row.doctor && typeof row.doctor === 'string') return row.doctor;
  return "N/A";
};

const getClinicName = (row) => {
  if (row.clinicName) return row.clinicName;
  if (row.clinic && typeof row.clinic === 'object') return row.clinic.name || "N/A";
  if (row.clinic && typeof row.clinic === 'string') return row.clinic;
  return "N/A";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? dateString : d.toLocaleDateString();
};

const dateVariants = (value) => {
  if (!value) return [];
  const d = new Date(value);
  if (isNaN(d.getTime())) return [];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return [
    `${yyyy}-${mm}-${dd}`,
    d.toLocaleDateString(),
    `${dd}/${mm}/${yyyy}`,
    `${mm}/${dd}/${yyyy}`,
  ];
};

const buildHaystack = (r) => {
  const parts = [
    r.encounterId,
    getDoctorName(r),
    getClinicName(r),
    r.status,
  ];
  dateVariants(r.date).forEach((dv) => parts.push(dv));
  return parts.filter(Boolean).join(" ").toLowerCase();
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */
export default function Encounters() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedEncounter, setSelectedEncounter] = useState(null);

  const [filters, setFilters] = useState({ encounterId: "", doctorName: "", clinicName: "", date: "", status: "" });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearDate = () => setFilters((prev) => ({ ...prev, date: "" }));

  /* --- LOAD DATA --- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const patientId = localStorage.getItem("patientId") || localStorage.getItem("userId");
        if (!patientId) {
             setLoading(false);
             return;
        }

        const { data } = await api.get("/encounters");
        
        let allEncounters = [];
        if (Array.isArray(data)) allEncounters = data;
        else if (data && (data.rows || data.encounters)) allEncounters = data.rows || data.encounters;

        const myEncounters = allEncounters.filter(e => {
            const pId = e.patientId?._id || e.patientId || e.patient?._id || e.patient;
            return pId?.toString() === patientId.toString();
        });

        setRows(myEncounters);
        setTotal(myEncounters.length);

      } catch (err) {
        console.error(err);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const clientFiltered = useMemo(() => {
    const tokens = (search || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      const hay = buildHaystack(r);
      if (tokens.length && !tokens.every((t) => hay.includes(t))) return false;
      
      const docName = getDoctorName(r);
      const cliName = getClinicName(r);

      if (filters.encounterId && !String(r.encounterId || "").toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
      if (filters.doctorName && !String(docName || "").toLowerCase().includes(filters.doctorName.toLowerCase())) return false;
      if (filters.clinicName && !String(cliName || "").toLowerCase().includes(filters.clinicName.toLowerCase())) return false;
      if (filters.date) {
        const dv = dateVariants(r.date);
        if (!dv.includes(filters.date)) return false;
      }
      if (filters.status && String(r.status || "").toLowerCase() !== String(filters.status).toLowerCase()) return false;
      return true;
    });
  }, [rows, search, filters]);

  const paged = useMemo(() => {
    const start = (page - 1) * limit;
    return clientFiltered.slice(start, start + limit);
  }, [clientFiltered, page, limit]);

  const effectiveTotal = clientFiltered.length || total;

  /* --- HELPER TO RENDER LISTS (Problems/Observations/Notes) --- */
  const renderList = (data) => {
    if (!data) return <p className="text-muted small">None recorded</p>;
    
    // If it's an array (e.g. ["Fever", "Cough"])
    if (Array.isArray(data) && data.length > 0) {
      return (
        <ul className="ps-3 mb-0">
          {data.map((item, idx) => (
             <li key={idx} className="small mb-1">{typeof item === 'object' ? item.name || JSON.stringify(item) : item}</li>
          ))}
        </ul>
      );
    }
    
    // If it's just a string
    if (typeof data === 'string' && data.trim() !== "") {
        return <p className="small mb-0">{data}</p>;
    }

    return <p className="text-muted small">None recorded</p>;
  };

  return (
    <PatientLayout>
      
      <div className="container-fluid py-4 position-relative">
        <div className="encounters-card">
          
          {/* Header */}
          <div className="encounters-header">
              <h5 className="encounters-title">Patients Encounter List</h5>
          </div>

          {/* Global Search */}
          <div className="encounters-search-container">
            <div className="input-group encounters-search-group">
              <span className="input-group-text"><Search size={18} /></span>
              <input type="text" className="form-control" placeholder="Search by doctor, clinic, date, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="encounters-table-container">
            <table className="table table-hover table-encounters">
              <thead>
                <tr>
                  <th className="ps-3 col-checkbox"><input type="checkbox" className="form-check-input" /></th>
                  <th className="col-id" style={{width:'50px'}}>ID</th>
                  <th className="col-id">Enc ID</th>
                  <th className="col-doctor">Doctor Name</th>
                  <th className="col-clinic">Clinic Name</th>
                  <th className="col-date">Date</th>
                  <th className="col-status">Status</th>
                  <th className="text-end pe-3 col-action">Action</th>
                </tr>
                
                {/* Filter Row - Hidden on Mobile */}
                <tr className="filter-row d-none d-md-table-row">
                  <td className="ps-3"></td>
                  <td></td> 
                  <td><input className="form-control form-control-sm" placeholder="ID" value={filters.encounterId} onChange={(e) => handleFilterChange("encounterId", e.target.value)} /></td>
                  <td><input className="form-control form-control-sm" placeholder="Doctor" value={filters.doctorName} onChange={(e) => handleFilterChange("doctorName", e.target.value)} /></td>
                  <td><input className="form-control form-control-sm" placeholder="Clinic" value={filters.clinicName} onChange={(e) => handleFilterChange("clinicName", e.target.value)} /></td>
                  <td>
                    <div className="d-flex">
                      <input type={filters.date ? "date" : "text"} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !filters.date && (e.target.type = "text")} className="form-control form-control-sm" placeholder="Date" value={filters.date} onChange={(e) => handleFilterChange("date", e.target.value)} />
                      {filters.date && <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={clearDate}>x</button>}
                    </div>
                  </td>
                  <td>
                    <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                      <option value="">Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td></td>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-5">Loading...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No Data Found</td></tr>
                ) : (
                  paged.map((row, index) => (
                    <tr key={row._id || row.id}>
                      <td className="ps-3 col-checkbox"><input type="checkbox" className="form-check-input" /></td>
                      
                      <td data-label="ID" className="fw-bold text-secondary">
                        {(page - 1) * limit + index + 1}
                      </td>
                      
                      <td data-label="Enc ID" className="fw-bold text-primary" style={{fontFamily:'monospace'}}>
                          {row.encounterId || "Pending..."}
                      </td>
                      
                      <td data-label="Doctor Name">{getDoctorName(row)}</td>
                      
                      <td data-label="Clinic Name">{getClinicName(row)}</td>
                      
                      <td data-label="Date">{formatDate(row.date)}</td>
                      
                      <td data-label="Status">
                        <span className={`badge rounded-pill ${row.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                          {row.status || "Unknown"}
                        </span>
                      </td>
                      
                      <td data-label="Action" className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-2">
                           <button 
                                type="button"
                                className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center" 
                                style={{ width: "32px", height: "32px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEncounter(row); 
                                }}
                                title="View Details"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="encounters-footer">
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">Rows:</small>
              <select className="form-select form-select-sm w-auto" value={limit} onChange={(e) => setLimit(Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            </div>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">Page {page} of {Math.ceil(effectiveTotal / limit) || 1}</small>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page * limit >= effectiveTotal} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* --- POPUP MODAL (Same as before) --- */}
      {selectedEncounter && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1050
        }}>
          <div className="bg-white rounded-3 shadow-lg" style={{ width: '90%', maxWidth: '750px', maxHeight: '90vh', display:'flex', flexDirection:'column' }}>
            
            {/* 1. Modal Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <div>
                <h5 className="mb-0 fw-bold">Encounter Details</h5>
                <small className="text-muted">ID: {selectedEncounter.encounterId || selectedEncounter._id}</small>
              </div>
              <button className="btn btn-sm btn-light border-0" onClick={() => setSelectedEncounter(null)}>
                <X size={20} />
              </button>
            </div>

            {/* 2. Modal Body (Scrollable) */}
            <div className="p-4" style={{ overflowY: 'auto' }}>
              
              {/* --- Clinical Summary Section --- */}
              <div className="mb-4">
                  <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                     <FileText size={18}/> Clinical Summary
                  </h6>
                  <div className="bg-light p-3 rounded border">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Description / Chief Complaint</label>
                    <p className="mb-0 text-dark">
                        {selectedEncounter.description || selectedEncounter.chiefComplaint || "No description provided."}
                    </p>
                  </div>
              </div>

              {/* --- Problems / Observations / Notes (3 Column Grid) --- */}
              <div className="row g-3 mb-4">
                 {/* Column 1: Problems */}
                 <div className="col-md-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <label className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                        <AlertCircle size={14} className="text-danger"/> Problems
                      </label>
                      <div style={{maxHeight:'150px', overflowY:'auto'}}>
                         {renderList(selectedEncounter.problems)}
                      </div>
                    </div>
                 </div>

                 {/* Column 2: Observations */}
                 <div className="col-md-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <label className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                        <Stethoscope size={14} className="text-info"/> Observations
                      </label>
                      <div style={{maxHeight:'150px', overflowY:'auto'}}>
                         {renderList(selectedEncounter.observations)}
                      </div>
                    </div>
                 </div>

                 {/* Column 3: Notes */}
                 <div className="col-md-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <label className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                        <Clipboard size={14} className="text-warning"/> Notes
                      </label>
                      <div style={{maxHeight:'150px', overflowY:'auto'}}>
                         {renderList(selectedEncounter.notes)}
                      </div>
                    </div>
                 </div>
              </div>

              {/* --- Visit Information --- */}
              <div className="card border rounded-3 bg-white">
                <div className="card-body">
                   <h6 className="fw-bold mb-3 border-bottom pb-2">Visit Information</h6>
                   
                   <div className="row g-2">
                     <div className="col-6">
                       <div className="d-flex align-items-start mb-2">
                          <Calendar className="text-muted me-2 mt-1" size={16} />
                          <div>
                             <small className="text-muted d-block" style={{fontSize:'0.8rem'}}>Date</small>
                             <strong>{formatDate(selectedEncounter.date)}</strong>
                          </div>
                       </div>
                     </div>
                     <div className="col-6">
                        <div className="d-flex align-items-start mb-2">
                            <Activity className="text-muted me-2 mt-1" size={16} />
                            <div>
                                <small className="text-muted d-block" style={{fontSize:'0.8rem'}}>Status</small>
                                <span className={`badge ${selectedEncounter.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {selectedEncounter.status || "Unknown"}
                                </span>
                            </div>
                        </div>
                     </div>
                     <div className="col-12">
                        <div className="d-flex align-items-start mb-2">
                            <User className="text-muted me-2 mt-1" size={16} />
                            <div>
                                <small className="text-muted d-block" style={{fontSize:'0.8rem'}}>Doctor</small>
                                <strong>{getDoctorName(selectedEncounter)}</strong>
                            </div>
                        </div>
                     </div>
                     <div className="col-12">
                        <div className="d-flex align-items-start">
                            <MapPin className="text-muted me-2 mt-1" size={16} />
                            <div>
                                <small className="text-muted d-block" style={{fontSize:'0.8rem'}}>Clinic</small>
                                <strong>{getClinicName(selectedEncounter)}</strong>
                            </div>
                        </div>
                     </div>
                   </div>

                </div>
              </div>

            </div>

            {/* 3. Modal Footer */}
            <div className="p-3 border-top bg-light d-flex justify-content-end">
              <button className="btn btn-secondary px-4" onClick={() => setSelectedEncounter(null)}>Close</button>
            </div>

          </div>
        </div>
      )}
      {/* --- POPUP MODAL END --- */}

    </PatientLayout>
  );
}