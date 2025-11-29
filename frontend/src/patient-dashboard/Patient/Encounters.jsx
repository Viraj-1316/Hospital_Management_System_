import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye // View Icon
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// --- 1. Import Layout ---
import PatientLayout from "../layouts/PatientLayout"; 
import "../styles/encounters.css";

/* -------------------------------------------------------------------------- */
/* AXIOS SETUP                                                                */
/* -------------------------------------------------------------------------- */
const api = axios.create({ baseURL: "http://localhost:3001" });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------------------------- */
/* SMART HELPERS (FIXED DISPLAY LOGIC)                                        */
/* -------------------------------------------------------------------------- */

// 1. Get Doctor Name: Handles Populated Objects vs Strings
const getDoctorName = (row) => {
  // Check if doctorId is populated (is an object with names)
  if (row.doctorId && typeof row.doctorId === 'object') {
    const { firstName, lastName, name } = row.doctorId;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (name) return name;
  }
  
  // Check explicit doctorName field
  if (row.doctorName) return row.doctorName;
  
  // Legacy/Simple String Check
  if (row.doctor && typeof row.doctor === 'string') return row.doctor;
  
  return "N/A";
};

// 2. Get Clinic Name
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
    getDoctorName(r), // Use smart helper for search
    getClinicName(r), // Use smart helper for search
    r.status,
  ];
  dateVariants(r.date).forEach((dv) => parts.push(dv));
  return parts.filter(Boolean).join(" ").toLowerCase();
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */
export default function Encounters({ sidebarCollapsed, toggleSidebar }) {
  const navigate = useNavigate(); 

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
        // 1. Get Logged in Patient ID
        const patientId = localStorage.getItem("patientId") || localStorage.getItem("userId");
        if (!patientId) {
             setLoading(false);
             return;
        }

        // 2. Fetch ALL Encounters
        const { data } = await api.get("/encounters");
        
        let allEncounters = [];
        if (Array.isArray(data)) allEncounters = data;
        else if (data && (data.rows || data.encounters)) allEncounters = data.rows || data.encounters;

        // 3. Filter for THIS Patient
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

  // Search logic
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

  return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      
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
                  <th className="col-id" style={{width:'50px'}}>#</th>
                  <th className="col-id">Enc ID</th>
                  <th className="col-doctor">Doctor Name</th>
                  <th className="col-clinic">Clinic Name</th>
                  <th className="col-date">Date</th>
                  <th className="col-status">Status</th>
                  <th className="text-end pe-3 col-action">Action</th>
                </tr>
                
                {/* Filter Row */}
                <tr className="filter-row">
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
                      <td className="ps-3"><input type="checkbox" className="form-check-input" /></td>
                      
                      {/* Sequential ID */}
                      <td className="fw-bold text-secondary">{(page - 1) * limit + index + 1}</td>

                      {/* Database Custom ID */}
                      <td className="fw-bold text-primary" style={{fontFamily:'monospace'}}>
                          {row.encounterId || "Pending..."}
                      </td>

                      {/* FIXED: Uses Smart Helper for Doctor Name */}
                      <td>{getDoctorName(row)}</td>
                      
                      {/* FIXED: Uses Smart Helper for Clinic Name */}
                      <td>{getClinicName(row)}</td>
                      
                      <td>{formatDate(row.date)}</td>
                      <td><span className={`badge rounded-pill ${row.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-secondary bg-opacity-10 text-secondary"}`}>{row.status || "Unknown"}</span></td>
                      <td className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                              className="btn btn-sm p-0" 
                              style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid #cfe2ff", background: "#e7f1ff" }}
                              onClick={() => navigate(`/patient/encounters/${row._id}`)}
                              title="View Details"
                          >
                              <Eye size={13} className="text-primary"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
    </PatientLayout>
  );
}