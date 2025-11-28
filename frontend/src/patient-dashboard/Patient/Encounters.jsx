import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

import Navbar from "../components/PatientNavbar";
import Sidebar from "../components/PatientSidebar";
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

const getName = (data) => {
  if (!data) return null;
  if (typeof data === "string") return data; 
  if (typeof data === "object") {
    return data.fullName || data.name || data.firstName || data.clinicName || "Unknown";
  }
  return "Unknown";
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
  const clinic = r.clinicName || r?.clinic?.name || "";
  // Search against both encounterId (ENC-1001) and internal _id
  const parts = [
    r.encounterId,
    r.doctorName,
    clinic,
    r.status,
  ];
  dateVariants(r.date).forEach((dv) => parts.push(dv));
  return parts.filter(Boolean).join(" ").toLowerCase();
};

export default function Encounters({ sidebarCollapsed, toggleSidebar }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ doctorName: "", clinicName: "", date: "", status: "active" });

  const [filters, setFilters] = useState({ encounterId: "", doctorName: "", clinicName: "", date: "", status: "" });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearDate = () => setFilters((prev) => ({ ...prev, date: "" }));

  /* -------------------------- LOAD FROM SERVER -------------------------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, limit, q: search, search, ...filters };
      const { data } = await api.get("/encounters", { params });

      let fetchedRows = [];
      let fetchedTotal = 0;

      if (Array.isArray(data)) {
        fetchedRows = data;
        fetchedTotal = data.length;
      } else if (data && (data.rows || data.encounters)) {
        fetchedRows = data.rows || data.encounters;
        fetchedTotal = data.total || data.count || fetchedRows.length;
      }

      setRows(fetchedRows);
      setTotal(fetchedTotal);
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotal(0);
      toast.error("Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, limit]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadData(); }, 400);
    return () => clearTimeout(t);
  }, [search, filters]);

  // Client-side filtering
  const clientFiltered = useMemo(() => {
    const tokens = (search || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      const hay = buildHaystack(r);
      if (tokens.length && !tokens.every((t) => hay.includes(t))) return false;
      // Filter by the new Encounter ID field
      if (filters.encounterId && !String(r.encounterId || "").toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
      if (filters.doctorName && !String(r.doctorName || "").toLowerCase().includes(filters.doctorName.toLowerCase())) return false;
      if (filters.clinicName && !String(r.clinicName || "").toLowerCase().includes(filters.clinicName.toLowerCase())) return false;
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

  const initiateDelete = (id) => { setDeleteId(id); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setDeleteId(null); };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/encounters/${encodeURIComponent(deleteId)}`);
      toast.success("Encounter deleted");
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== deleteId));
    } catch (e) { toast.error("Failed to delete"); } finally { closeDeleteModal(); }
  };

  const openEditModal = (row) => {
    const id = row._id || row.id;
    setEditingId(id);
    setEditForm({
      doctorName: row.doctorName || row?.doctor?.name || "",
      clinicName: row.clinicName || row?.clinic?.name || "",
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
      status: row.status || "active",
    });
    setShowEditModal(true);
  };
  const closeEditModal = () => { setShowEditModal(false); setEditingId(null); };
  const saveEdit = async () => {
    if (!editingId) return;
    const payload = {
      doctorName: editForm.doctorName?.trim(),
      clinicName: editForm.clinicName?.trim(),
      date: editForm.date ? new Date(editForm.date).toISOString() : null,
      status: editForm.status,
    };
    try {
      const { data: updated } = await api.put(`/encounters/${encodeURIComponent(editingId)}`, payload);
      setRows((prev) => prev.map((r) => (r._id || r.id) === editingId ? { ...r, ...updated, ...payload } : r));
      toast.success("Encounter updated");
      closeEditModal();
    } catch (e) { toast.error("Failed to update encounter"); }
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-grow-1 encounters-main-content" style={{ marginLeft: sidebarCollapsed ? 64 : 250, transition: "margin-left 0.3s" }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="container-fluid py-4 position-relative">
          <div className="encounters-card">
            <div className="encounters-header"><h5 className="encounters-title">Patients Encounter List</h5></div>
            <div className="encounters-search-container">
              <div className="input-group encounters-search-group">
                <span className="input-group-text"><Search size={18} /></span>
                <input type="text" className="form-control" placeholder="Search by doctor, clinic, date, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="encounters-table-container">
              <table className="table table-hover table-encounters">
                <thead>
                  <tr>
                    <th className="ps-3 col-checkbox"><input type="checkbox" className="form-check-input" /></th>
                    <th className="col-id">ID</th>
                    <th className="col-doctor">Doctor Name</th>
                    <th className="col-clinic">Clinic Name</th>
                    <th className="col-date">Date</th>
                    <th className="col-status">Status</th>
                    <th className="text-end pe-3 col-action">Action</th>
                  </tr>
                  <tr className="filter-row">
                    <td className="ps-3"></td>
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
                    <tr><td colSpan="7" className="text-center py-5">Loading...</td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4 text-muted">No Data Found</td></tr>
                  ) : (
                    paged.map((row) => (
                      <tr key={row._id || row.id}>
                        <td className="ps-3"><input type="checkbox" className="form-check-input" /></td>
                        
                        {/* --- FIXED: DISPLAY DB ID (ENC-1001) --- */}
                        <td className="fw-bold text-primary" style={{fontFamily:'monospace'}}>
                           {row.encounterId || "Pending..."}
                        </td>
                        {/* --------------------------------------- */}

                        <td>{row.doctorName || getName(row.doctor) || "N/A"}</td>
                        <td>{row.clinicName || getName(row.clinic) || "N/A"}</td>
                        <td>{formatDate(row.date)}</td>
                        <td><span className={`badge rounded-pill ${row.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-secondary bg-opacity-10 text-secondary"}`}>{row.status || "Unknown"}</span></td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-sm p-0" style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid #cfe2ff", background: "#e7f1ff" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(row); }}>
                              <Edit2 size={13} className="text-primary" />
                            </button>
                            <button type="button" className="btn btn-sm p-0" style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "1px solid #f8d7da", background: "#f8d7da" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); initiateDelete(row._id || row.id); }}>
                              <Trash2 size={13} className="text-danger" />
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
        
        {showDeleteModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header"><h5 className="modal-title text-danger d-flex align-items-center gap-2"><AlertTriangle size={20} /> Delete Encounter</h5><button type="button" className="btn-close" onClick={closeDeleteModal}></button></div>
                <div className="modal-body"><p>Are you sure?</p></div>
                <div className="modal-footer"><button className="btn btn-light" onClick={closeDeleteModal}>Cancel</button><button className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button></div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header"><h5 className="modal-title">Edit Encounter</h5><button type="button" className="btn-close" onClick={closeEditModal}></button></div>
                <div className="modal-body">
                   <div className="mb-3"><label className="form-label">Doctor Name</label><input type="text" className="form-control" value={editForm.doctorName} onChange={(e)=>setEditForm(p=>({...p, doctorName: e.target.value}))}/></div>
                   <div className="mb-3"><label className="form-label">Clinic Name</label><input type="text" className="form-control" value={editForm.clinicName} onChange={(e)=>setEditForm(p=>({...p, clinicName: e.target.value}))}/></div>
                   <div className="mb-3"><label className="form-label">Date</label><input type="date" className="form-control" value={editForm.date} onChange={(e)=>setEditForm(p=>({...p, date: e.target.value}))}/></div>
                   <div className="mb-2"><label className="form-label">Status</label><select className="form-select" value={editForm.status} onChange={(e)=>setEditForm(p=>({...p, status: e.target.value}))}><option value="active">active</option><option value="inactive">inactive</option></select></div>
                </div>
                <div className="modal-footer"><button className="btn btn-light" onClick={closeEditModal}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}