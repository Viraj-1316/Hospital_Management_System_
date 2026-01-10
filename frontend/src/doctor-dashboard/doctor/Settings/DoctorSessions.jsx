import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  FaPlus, FaSearch, FaEdit, FaTrash, FaFileExcel, 
  FaFileCsv, FaFilePdf, FaTimes, FaFileImport, 
  FaQuestionCircle, FaChevronLeft, FaChevronRight 
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
// xlsx, jsPDF, and autoTable now loaded dynamically in export handlers
import API_BASE from "../../../config";

const BASE_URL = API_BASE;
const DAYS_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DoctorSessions() {
  // Data
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ day: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    doctorId: "", doctorName: "", clinic: "", days: [],
    timeSlotMinutes: 30,
    morningStart: "", morningEnd: "",
    eveningStart: "", eveningEnd: ""
  });

  // Import/Delete Modals
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Current Doctor Info
  const [currentDoctor, setCurrentDoctor] = useState(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const doc = JSON.parse(localStorage.getItem("doctor"));
        if (!doc) {
             toast.error("Please login first");
             return;
        }
        setCurrentDoctor(doc);
        const doctorId = doc._id || doc.id;

        const res = await axios.get(`${BASE_URL}/doctor-sessions`);
        
        const mySessions = res.data.filter(s => 
            (s.doctorId === doctorId) || (s.doctorName === `${doc.firstName} ${doc.lastName}`)
        );

        setSessions(mySessions);
      } catch (error) {
        toast.error("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. Handlers ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          ...form,
          doctorId: currentDoctor._id || currentDoctor.id,
          doctorName: `${currentDoctor.firstName} ${currentDoctor.lastName}`,
          clinic: currentDoctor.clinic || form.clinic || "General Clinic"
      };

      let res;
      if (editingId) {
        res = await axios.put(`${BASE_URL}/doctor-sessions/${editingId}`, payload);
        setSessions(prev => prev.map(s => s._id === editingId ? res.data.data : s));
        toast.success("Session updated");
      } else {
        res = await axios.post(`${BASE_URL}/doctor-sessions`, payload);
        setSessions(prev => [res.data.data, ...prev]);
        toast.success("Session created");
      }
      toggleForm();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/doctor-sessions/${deleteId}`);
      setSessions(prev => prev.filter(s => s._id !== deleteId));
      toast.success("Deleted successfully");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingId(null);
    setForm({
      doctorId: currentDoctor?._id, 
      doctorName: currentDoctor ? `${currentDoctor.firstName} ${currentDoctor.lastName}` : "", 
      clinic: currentDoctor?.clinic || "", 
      days: [],
      timeSlotMinutes: 30,
      morningStart: "", morningEnd: "",
      eveningStart: "", eveningEnd: ""
    });
  };

  const handleEdit = (s) => {
      setEditingId(s._id);
      setForm(s);
      setShowForm(true);
      window.scrollTo({top:0, behavior:'smooth'});
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const handleSelectAllDays = (e) => {
     if(e.target.checked) setForm(prev => ({ ...prev, days: DAYS_OPTIONS }));
     else setForm(prev => ({ ...prev, days: [] }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if(!importFile) return toast.error("Please select a file");
    const fd = new FormData();
    fd.append("file", importFile);
    try {
        await axios.post(`${BASE_URL}/doctor-sessions/import`, fd);
        toast.success("Import successful");
        setShowImport(false);
        const doc = JSON.parse(localStorage.getItem("doctor"));
        const res = await axios.get(`${BASE_URL}/doctor-sessions`);
        const mySessions = res.data.filter(s => s.doctorId === (doc._id || doc.id));
        setSessions(mySessions);
    } catch(e) {
        toast.error("Import failed");
    }
  };

  // --- Export Handlers ---
  const formatRange = (start, end) => {
    const fmt = (t) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      let hours = parseInt(h);
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12 || 12;
      return `${hours}:${m} ${ampm}`;
    };
    if (!start || !end) return "-";
    return `${fmt(start)} to ${fmt(end)}`;
  };

  const handleExport = async (type) => {
      // Dynamic import for xlsx - only loads when user exports
      if(type === "Excel") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(sessions.map(s => ({
            Clinic: s.clinic, Days: s.days.join(", "), Morning: formatRange(s.morningStart, s.morningEnd), Evening: formatRange(s.eveningStart, s.eveningEnd)
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sessions");
        XLSX.writeFile(wb, "My_Sessions.xlsx");
      }
      // Add CSV/PDF logic if needed or keep existing
  };

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return sessions.filter(s => {
        if(searchTerm && !JSON.stringify(s).toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if(filters.day && !(s.days || []).includes(filters.day)) return false;
        return true;
    });
  }, [sessions, searchTerm, filters]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pageItems = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="session-scope">
      {/* MOBILE RESPONSIVE CSS */}
      <style>{`
        .session-scope { font-family: 'Segoe UI', sans-serif; background-color: #f5f7fb; }
        .table-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        
        .search-container { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 10px; flex-wrap: wrap; }
        .search-input-group { display: flex; align-items: center; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px 12px; width: 350px; background: #fff; }
        .search-input { border: none; outline: none; width: 100%; margin-left: 8px; color: #495057; }
        
        .export-group { display: flex; gap: 8px; }
        .export-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1px solid #dee2e6; background: #fff; border-radius: 4px; cursor: pointer; transition: 0.2s; }
        .export-btn.excel { color: #198754; } 
        .export-btn.csv { color: #0d6efd; } 
        .export-btn.pdf { color: #dc3545; }

        .custom-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .custom-table th { text-align: left; padding: 12px 10px; border-bottom: 2px solid #dee2e6; color: #6c757d; font-weight: 600; }
        .custom-table td { padding: 12px 10px; border-bottom: 1px solid #e9ecef; color: #333; vertical-align: middle; }
        .filter-input { width: 100%; padding: 6px 8px; font-size: 0.8rem; border: 1px solid #ced4da; border-radius: 4px; outline: none; }
        .action-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; border: 1px solid; background: #fff; cursor: pointer; transition: 0.2s; }
        .btn-edit { border-color: #0d6efd; color: #0d6efd; } 
        .btn-delete { border-color: #dc3545; color: #dc3545; }
        .slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* --- MOBILE TWEAKS --- */
        @media (max-width: 768px) {
           .table-card { padding: 15px; }
           .search-input-group { width: 100%; } /* Full width search on mobile */
           
           /* Transform Table to Cards */
           .mobile-table thead { display: none; }
           .mobile-table tr { 
              display: block; 
              margin-bottom: 1rem; 
              border: 1px solid #dee2e6; 
              border-radius: 8px; 
              padding: 10px; 
              background: #fff;
           }
           .mobile-table td { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border: none; 
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0; 
           }
           .mobile-table td:last-child { border-bottom: none; }
           
           /* Data Labels */
           .mobile-table td::before { 
              content: attr(data-label); 
              font-weight: 600; 
              color: #6c757d; 
              font-size: 0.85rem;
           }
           .mobile-table td[data-label="Action"] { justify-content: space-between; }
           
           /* Hide the filter row in table header on mobile */
           .filter-row { display: none !important; }
        }
      `}</style>
      <Toaster position="top-right" />

{/* --- Doctor Sessions Header (Blue Style) --- */}
      <div className="services-topbar services-card d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div className="d-flex align-items-center gap-2">
          {/* Changed text-dark to text-white */}
          <h5 className="mb-0 fw-bold text-white">Doctor Sessions</h5>
          <FaQuestionCircle className="text-white opacity-75" size={14} style={{ cursor: 'pointer' }} />
        </div>
        
        <div className="d-flex gap-2">
          {/* Import Button: Outline White */}
          <button 
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" 
            onClick={() => setShowImport(true)}
          >
            <FaFileImport /> 
            <span className="d-none d-md-inline">Import</span>
          </button>
          
          {/* Add Session Button: White Background */}
          <button 
            className="btn btn-light btn-sm d-flex align-items-center gap-2" 
            onClick={toggleForm}
          >
            {showForm ? (
              <>
                <FaTimes /> 
                <span className="d-none d-md-inline">Close</span>
              </>
            ) : (
              <>
                <FaPlus /> 
                <span className="d-none d-md-inline">Add Session</span>
              </>
            )}
          </button>
        </div>
      </div>
        {/* Form */}
        {showForm && (
            <div className="bg-light p-4 mb-4 rounded border slide-down">
                <h6 className="fw-bold text-primary mb-3">{editingId ? "Edit Session" : "Add New Session"}</h6>
                <form onSubmit={handleSave}>
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold text-muted">Doctor</label>
                            <input className="form-control bg-white" value={form.doctorName || ""} readOnly />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold">Clinic *</label>
                            <input className="form-control" value={form.clinic} onChange={e => setForm({...form, clinic: e.target.value})} required disabled/>
                        </div>
                        
                        <div className="col-12">
                            <label className="form-label small fw-bold d-block">Days *</label>
                            <div className="form-check mb-2">
                                <input className="form-check-input" type="checkbox" id="allDays" 
                                    checked={form.days.length === DAYS_OPTIONS.length} onChange={handleSelectAllDays}/>
                                <label className="form-check-label small" htmlFor="allDays">Select All</label>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {DAYS_OPTIONS.map(day => (
                                    <button 
                                        type="button" 
                                        key={day}
                                        className={`btn btn-sm ${form.days.includes(day) ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold">Time Slot (min)</label>
                            <select className="form-select" name="timeSlotMinutes" value={form.timeSlotMinutes} onChange={handleFormChange}>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                                <option value="60">60</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold">Morning (Start - End)</label>
                            <div className="d-flex gap-2">
                                <input type="time" className="form-control" name="morningStart" value={form.morningStart} onChange={handleFormChange} />
                                <input type="time" className="form-control" name="morningEnd" value={form.morningEnd} onChange={handleFormChange} />
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold">Evening (Start - End)</label>
                            <div className="d-flex gap-2">
                                <input type="time" className="form-control" name="eveningStart" value={form.eveningStart} onChange={handleFormChange} />
                                <input type="time" className="form-control" name="eveningEnd" value={form.eveningEnd} onChange={handleFormChange} />
                            </div>
                        </div>
                    </div>
                    <div className="text-end mt-4">
                        <button className="btn btn-primary btn-sm px-4 w-100 w-md-auto">Save Session</button>
                    </div>
                </form>
            </div>
        )}

        {/* Controls */}
        <div className="search-container">
            <div className="search-input-group">
                <FaSearch className="text-muted" />
                <input className="search-input" placeholder="Search sessions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="export-group">
                <button className="export-btn excel" onClick={() => handleExport('Excel')}><FaFileExcel/></button>
                <button className="export-btn csv" onClick={() => handleExport('CSV')}><FaFileCsv/></button>
                <button className="export-btn pdf" onClick={() => handleExport('PDF')}><FaFilePdf/></button>
            </div>
        </div>

        {/* Table - Added 'mobile-table' class */}
        <div className="table-responsive border rounded bg-transparent bg-md-white border-0 border-md">
            <table className="custom-table mobile-table">
                <thead className="bg-light">
                    <tr>
                        <th style={{width:'50px'}}>Sr.</th>
                        <th>Clinic</th>
                        <th>Days</th>
                        <th>Slot</th>
                        <th>Morning</th>
                        <th>Evening</th>
                        <th className="text-end">Action</th>
                    </tr>
                    {/* Hide filter row on mobile */}
                    <tr className="filter-row">
                        <td></td>
                        <td><input className="filter-input" disabled placeholder={currentDoctor ? currentDoctor.clinic : ""} /></td>
                        <td>
                            <select className="filter-input" onChange={e => setFilters({...filters, day: e.target.value})}>
                                <option value="">All Days</option>
                                {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </td>
                        <td colSpan={4}></td>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
                    ) : pageItems.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-4 text-muted">No sessions found</td></tr>
                    ) : (
                        pageItems.map((s, i) => (
                            <tr key={s._id}>
                                <td className="text-muted ps-3" data-label="Sr.">{(page-1)*rowsPerPage + i + 1}</td>
                                <td data-label="Clinic">{s.clinic}</td>
                                <td data-label="Days">
                                    <div className="d-flex flex-wrap gap-1">
                                        {s.days.map(d => <span key={d} className="badge bg-light text-dark border fw-normal">{d}</span>)}
                                    </div>
                                </td>
                                <td data-label="Slot">{s.timeSlotMinutes} min</td>
                                <td data-label="Morning">{formatRange(s.morningStart, s.morningEnd)}</td>
                                <td data-label="Evening">{formatRange(s.eveningStart, s.eveningEnd)}</td>
                                <td className="text-end" data-label="Action">
                                    <div className="d-flex gap-2 justify-content-end">
                                        <button className="action-btn btn-edit" onClick={() => handleEdit(s)}><FaEdit /></button>
                                        <button className="action-btn btn-delete" onClick={() => { setDeleteId(s._id); setShowDeleteModal(true); }}><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        {pageItems.length > 0 && (
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-3">
                <div className="small text-muted">
                Rows per page: 
                <select className="ms-1 border rounded p-1" value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setPage(1);}}>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
                </div>
                <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><FaChevronLeft/> Prev</button>
                <span className="small mx-2">Page {page} of {totalPages || 1}</span>
                <button className="btn btn-sm btn-outline-secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next <FaChevronRight/></button>
                </div>
            </div>
        )}
      

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow">
                <div className="modal-body text-center p-4">
                    <h5 className="text-danger mb-2">Confirm Delete</h5>
                    <p className="text-muted small mb-3">Are you sure you want to delete this session?</p>
                    <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-light btn-sm px-3 border" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        <button className="btn btn-danger btn-sm px-3" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Modal */}
      {showImport && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                    <h5 className="modal-title text-primary">Import Sessions</h5>
                    <button className="btn-close" onClick={() => setShowImport(false)}></button>
                </div>
                <div className="modal-body">
                    <input type="file" className="form-control mb-3" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} />
                    <div className="text-end">
                        <button className="btn btn-primary" onClick={handleImport}>Upload & Import</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
    </div>
  );
}