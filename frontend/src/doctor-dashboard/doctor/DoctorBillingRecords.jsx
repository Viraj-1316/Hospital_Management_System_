import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DoctorLayout from "../layouts/DoctorLayout"; 
import { FaSearch, FaPlus, FaTrash, FaEdit, FaFilePdf, FaUser, FaClinicMedical, FaReceipt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../../config";

const BASE = API_BASE;

export default function DoctorBillingRecords() {
  const navigate = useNavigate();

  // Data
  const [bills, setBills] = useState([]);
  const [encountersList, setEncountersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);

  // Filters
  const [filter, setFilter] = useState({
    id: "", encounterId: "", clinic: "", patient: "", date: "", status: "",
  });

  // --- FETCH DATA (Scoped to Doctor) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const doctor = JSON.parse(localStorage.getItem("doctor"));
        const doctorId = doctor?._id || doctor?.id;

        if (!doctorId) {
          toast.error("Doctor not found. Please login.");
          return;
        }

        const [billsRes, encRes] = await Promise.all([
          axios.get(`${BASE}/bills?doctorId=${doctorId}`),
          axios.get(`${BASE}/encounters`),
        ]);

        setBills(billsRes.data || []);
        setEncountersList(Array.isArray(encRes.data) ? encRes.data : encRes.data.encounters || []);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load records.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- DELETE LOGIC ---
  const openDeleteModal = (id) => {
    setBillToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!billToDelete) return;
    setShowDeleteModal(false);
    try {
      await axios.delete(`${BASE}/bills/${billToDelete}`);
      setBills((p) => p.filter((b) => b._id !== billToDelete));
      setBillToDelete(null);
      toast.success("Bill deleted successfully");
    } catch {
      toast.error("Failed to delete bill");
    }
  };

  // --- HELPERS ---
  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const lookupCustomId = (bill) => {
    // Check encounterCustomId first (set by backend)
    if (bill.encounterCustomId) {
      return bill.encounterCustomId;
    }
    // Check encounterId
    if (bill.encounterId) {
      const encId = bill.encounterId;
      if (typeof encId === 'string') {
        if (encId.startsWith("ENC-")) return encId;
        if (encId.length === 24) return `ENC-${encId.substring(0, 6)}`;
        return encId;
      }
      if (typeof encId === 'object' && encId._id) {
        return encId.encounterId || `ENC-${encId._id.toString().substring(0, 6)}`;
      }
    }
    return "-";
  };

  // --- FILTERING ---
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bills.filter((bill) => {
      const customEncId = lookupCustomId(bill);
      const combined = `${bill._id} ${customEncId} ${bill.clinicName} ${bill.patientName} ${bill.status}`.toLowerCase();

      if (q && !combined.includes(q)) return false;

      if (filter.id && !bill._id?.toLowerCase().includes(filter.id.toLowerCase())) return false;
      if (filter.encounterId && !customEncId.toLowerCase().includes(filter.encounterId.toLowerCase())) return false;
      if (filter.clinic && !bill.clinicName?.toLowerCase().includes(filter.clinic.toLowerCase())) return false;
      if (filter.patient && !bill.patientName?.toLowerCase().includes(filter.patient.toLowerCase())) return false;
      if (filter.date && bill.date !== filter.date) return false;
      if (filter.status && filter.status !== "Filter" && bill.status?.toLowerCase() !== filter.status.toLowerCase()) return false;

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bills, encountersList, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <DoctorLayout>
      <Toaster position="top-right" />
      
      {/* MOBILE CSS: Transform Table to Cards */}
      <style>{`
        @media (max-width: 768px) {
           .mobile-table thead { display: none; }
           .mobile-table tr { 
              display: block; 
              margin-bottom: 1rem; 
              background: #fff; 
              border-radius: 12px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              border: 1px solid #eee;
              padding: 16px;
              position: relative;
           }
           .mobile-table td { 
              display: none; /* Hide default cells */
           }
           .mobile-table td.mobile-card-view {
              display: block; /* Show our custom card view */
              padding: 0;
              border: none;
           }
        }
        @media (min-width: 769px) {
           .mobile-card-view { display: none; }
        }
        /* Desktop styles specific to this page */
        .enc-badge { color: #0d6efd; background-color: #f0f9ff; border: 1px solid #cce5ff; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; font-family: monospace; }
        .badge-status { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .status-paid { background-color: #d1e7dd; color: #0f5132; }
        .status-unpaid { background-color: #f8d7da; color: #dc3545; }
        .filter-input { width: 100%; padding: 4px 8px; font-size: 0.85rem; border: 1px solid #ced4da; border-radius: 4px; }
      `}</style>

      <div className="container-fluid py-4">
        
        {/* Header - Mobile Friendly */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
          <h3 className="fw-bold text-primary mb-0">Billing Records</h3>
          <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={() => navigate("/doctor/add-bill")}>
            <FaPlus /> <span className="d-none d-sm-inline">Add Bill</span><span className="d-inline d-sm-none">Add</span>
          </button>
        </div>

        {/* Search & Filter Card */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
             <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted"/></span>
                <input 
                   type="text" 
                   className="form-control border-start-0" 
                   placeholder="Search bills by patient, clinic, ID..." 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)} 
                />
             </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="card border-0 shadow-sm bg-transparent bg-md-white">
          <div className="card-body p-0">
            {loading ? (
               <div className="text-center py-5 text-muted">Loading records...</div>
            ) : filtered.length === 0 ? (
               <div className="text-center py-5 text-muted bg-white rounded">No billing records found.</div>
            ) : (
               <div className="table-responsive">
                 <table className="table table-hover align-middle mb-0 mobile-table">
                   <thead className="bg-light">
                     <tr>
                       <th style={{ width: '50px' }} className="ps-4">ID</th>
                       <th>Encounter ID</th>
                       <th>Clinic</th>
                       <th>Patient</th>
                       <th>Services</th>
                       <th className="text-end">Total</th>
                       <th className="text-end">Due</th>
                       <th>Date</th>
                       <th>Status</th>
                       <th className="text-center">Action</th>
                     </tr>
                     {/* Filter Row (Hidden on Mobile for simplicity, rely on Search bar) */}
                     <tr className="d-none d-md-table-row bg-white">
                        <td></td>
                        <td><input className="filter-input" placeholder="Enc ID" onChange={(e) => handleFilterChange("encounterId", e.target.value)} /></td>
                        <td><input className="filter-input" placeholder="Clinic" onChange={(e) => handleFilterChange("clinic", e.target.value)} /></td>
                        <td><input className="filter-input" placeholder="Patient" onChange={(e) => handleFilterChange("patient", e.target.value)} /></td>
                        <td colSpan={3}></td>
                        <td><input type="date" className="filter-input" onChange={(e) => handleFilterChange("date", e.target.value)} /></td>
                        <td>
                           <select className="filter-input" onChange={(e) => handleFilterChange("status", e.target.value)}>
                              <option value="">All</option>
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid</option>
                           </select>
                        </td>
                        <td></td>
                     </tr>
                   </thead>
                   <tbody>
                     {pageItems.map((bill, i) => (
                       <tr key={bill._id || i} className="bg-white">
                         
                         {/* --- DESKTOP CELLS --- */}
                         <td className="ps-4 fw-bold text-secondary">{(page - 1) * rowsPerPage + i + 1}</td>
                         <td><span className="enc-badge">{lookupCustomId(bill)}</span></td>
                         <td>{bill.clinicName}</td>
                         <td>{bill.patientName}</td>
                         <td>
                            <span className="d-inline-block text-truncate" style={{maxWidth: '150px'}}>
                               {Array.isArray(bill.services) ? bill.services.map(s => (typeof s === 'string' ? s : s.name)).join(", ") : (bill.services || "-")}
                            </span>
                         </td>
                         <td className="text-end fw-bold">{bill.totalAmount}</td>
                         <td className="text-end text-danger">{bill.amountDue}</td>
                         <td>{bill.date ? new Date(bill.date).toLocaleDateString() : "-"}</td>
                         <td><span className={bill.status === 'paid' ? "badge-status status-paid" : "badge-status status-unpaid"}>{bill.status?.toUpperCase()}</span></td>
                         <td className="text-center">
                           <div className="d-flex justify-content-center gap-2">
                             <button className="btn btn-sm btn-link text-primary p-0" onClick={() => navigate(`/doctor/edit-bill/${bill._id}`)}><FaEdit /></button>
                             <button className="btn btn-sm btn-link text-danger p-0" onClick={() => openDeleteModal(bill._id)}><FaTrash /></button>
                             <a href={`${BASE}/bills/${bill._id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link text-success p-0"><FaFilePdf /></a>
                           </div>
                         </td>

                         {/* --- MOBILE CARD VIEW --- */}
                         <td className="mobile-card-view">
                            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                               <div>
                                  <h6 className="fw-bold text-dark mb-1">{bill.patientName}</h6>
                                  <div className="text-muted small d-flex align-items-center gap-1">
                                     <FaClinicMedical size={12}/> {bill.clinicName}
                                  </div>
                               </div>
                               <span className={bill.status === 'paid' ? "badge bg-success" : "badge bg-danger"}>{bill.status?.toUpperCase()}</span>
                            </div>

                            <div className="row g-2 mb-3">
                               <div className="col-6">
                                  <small className="text-muted d-block">Date</small>
                                  <span className="fw-medium text-dark">{bill.date ? new Date(bill.date).toLocaleDateString() : "-"}</span>
                               </div>
                               <div className="col-6">
                                  <small className="text-muted d-block">Encounter</small>
                                  <span className="badge bg-light text-dark border">{lookupCustomId(bill)}</span>
                               </div>
                               <div className="col-6">
                                  <small className="text-muted d-block">Total</small>
                                  <span className="fw-bold text-dark">{bill.totalAmount}</span>
                               </div>
                               <div className="col-6">
                                  <small className="text-muted d-block">Due</small>
                                  <span className="fw-bold text-danger">{bill.amountDue}</span>
                               </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                               <div className="d-flex gap-3">
                                  <button className="btn btn-link p-0 text-primary d-flex align-items-center gap-1 text-decoration-none" onClick={() => navigate(`/doctor/edit-bill/${bill._id}`)}>
                                     <FaEdit /> <small>Edit</small>
                                  </button>
                                  <a href={`${BASE}/bills/${bill._id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-link p-0 text-success d-flex align-items-center gap-1 text-decoration-none">
                                     <FaFilePdf /> <small>PDF</small>
                                  </a>
                               </div>
                               <button className="btn btn-link p-0 text-danger" onClick={() => openDeleteModal(bill._id)}><FaTrash size={16} /></button>
                            </div>
                         </td>

                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
          </div>
          
          {/* Pagination Footer */}
          {filtered.length > 0 && (
             <div className="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center py-3">
                <div className="small text-muted mb-2 mb-md-0">
                   Page {page} of {totalPages}
                </div>
                <div className="d-flex align-items-center gap-2">
                   <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                   <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered p-3">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-body text-center py-5">
                  <div className="mb-3 text-danger opacity-75"><FaTrash size={40} /></div>
                  <h5 className="fw-bold mb-2">Delete Bill?</h5>
                  <p className="text-muted mb-4">This action cannot be undone.</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-light px-4" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    <button className="btn btn-danger px-4" onClick={confirmDelete}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DoctorLayout>
  );
}