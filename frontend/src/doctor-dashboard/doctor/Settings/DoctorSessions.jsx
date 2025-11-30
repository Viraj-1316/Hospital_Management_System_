import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaFileExcel, 
  FaFileCsv, 
  FaFilePdf,
  FaTimes,
  FaFileImport
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE_URL = "http://localhost:3001";
const DAYS_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- SCOPED CSS (No Sidebar/Navbar layout needed) ---------- */
const sessionStyles = `
  .session-scope { font-family: 'Segoe UI', sans-serif; background-color: #f5f7fb; min-height: 100vh; padding: 20px; }
  
  /* Top Bar */
  .session-scope .page-title-bar {
    background-color: #fff;
    padding: 15px 30px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
  }
  .session-scope .page-title {
    color: #333;
    font-weight: 700;
    font-size: 1.2rem;
    margin: 0;
  }

  /* Card */
  .session-scope .table-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 0 0 8px 8px; /* Connect to title bar */
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  }

  /* Controls */
  .session-scope .controls-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 10px;
  }
  .session-scope .search-group {
    display: flex;
    align-items: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 6px 12px;
    width: 100%;
    max-width: 400px;
    background: #fff;
  }
  .session-scope .search-input {
    border: none;
    outline: none;
    width: 100%;
    margin-left: 8px;
    color: #495057;
  }
  .session-scope .export-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid #dee2e6;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    color: #555;
    transition: 0.2s;
  }
  .session-scope .export-btn:hover { background: #f8f9fa; }
  .session-scope .export-btn.excel { color: #198754; }
  .session-scope .export-btn.csv { color: #0d6efd; }
  .session-scope .export-btn.pdf { color: #dc3545; }

  /* Table */
  .session-scope .custom-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .session-scope .custom-table thead th {
    text-align: left;
    padding: 12px 10px;
    border-bottom: 2px solid #dee2e6;
    color: #6c757d;
    font-weight: 600;
    white-space: nowrap;
    vertical-align: middle;
  }
  .session-scope .custom-table tbody td {
    padding: 12px 10px;
    border-bottom: 1px solid #e9ecef;
    color: #333;
    vertical-align: middle;
  }
  
  /* Filter Inputs */
  .session-scope .filter-row td {
    padding: 5px 10px;
    background: #fff;
  }
  .session-scope .filter-input {
    width: 100%;
    padding: 6px 8px;
    font-size: 0.8rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    outline: none;
  }
  .session-scope .filter-input:focus { border-color: #86b7fe; }

  /* Actions */
  .session-scope .action-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    border: 1px solid;
    background: #fff;
    cursor: pointer;
    transition: 0.2s;
  }
  .session-scope .btn-edit { border-color: #0d6efd; color: #0d6efd; }
  .session-scope .btn-edit:hover { background: #0d6efd; color: #fff; }
  .session-scope .btn-delete { border-color: #dc3545; color: #dc3545; }
  .session-scope .btn-delete:hover { background: #dc3545; color: #fff; }

  /* Footer */
  .session-scope .table-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 15px; font-size: 0.85rem; color: #6c757d;
  }
  .session-scope .page-btn {
    border: none; background: none; cursor: pointer; color: #6c757d; font-weight: 500; margin-left: 5px;
  }
  .session-scope .page-btn:disabled { opacity: 0.5; cursor: default; }

  /* Form Animation */
  .slide-down { animation: slideDown 0.3s ease-out; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;

// Helper for time formatting (24h -> 12h AM/PM)
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
  return `${formatTime(start)} to ${formatTime(end)}`;
};

export default function DoctorSessions() {
  // --- Data ---
  const [sessions, setSessions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Filters & Search ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    doctor: "",
    clinic: "",
    day: ""
  });

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Form State ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    doctorId: "", doctorName: "", clinic: "", days: [],
    timeSlotMinutes: 30,
    morningStart: "", morningEnd: "",
    eveningStart: "", eveningEnd: ""
  });

  // --- Import Modal ---
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // --- Delete State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessRes, docRes] = await Promise.all([
          axios.get(`${BASE_URL}/doctor-sessions`),
          axios.get(`${BASE_URL}/doctors`)
        ]);
        setSessions(sessRes.data || []);
        setDoctors(docRes.data || docRes.data.data || []); // Handle varied API structures
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Form Handlers ---
  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingId(null);
    setForm({
      doctorId: "", doctorName: "", clinic: "", days: [],
      timeSlotMinutes: 30,
      morningStart: "", morningEnd: "",
      eveningStart: "", eveningEnd: ""
    });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      doctorId: item.doctorId || "",
      doctorName: item.doctorName || "",
      clinic: item.clinic || "",
      days: item.days || [],
      timeSlotMinutes: item.timeSlotMinutes || 30,
      morningStart: item.morningStart || "",
      morningEnd: item.morningEnd || "",
      eveningStart: item.eveningStart || "",
      eveningEnd: item.eveningEnd || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/doctor-sessions/${deleteId}`);
      setSessions(prev => prev.filter(s => s._id !== deleteId));
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
    setShowDeleteModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorSelect = (e) => {
    const docId = e.target.value;
    const doc = doctors.find(d => d._id === docId);
    setForm(prev => ({
        ...prev,
        doctorId: docId,
        doctorName: doc ? `${doc.firstName} ${doc.lastName}` : "",
        clinic: doc ? doc.clinic || "" : ""
    }));
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }));
  };

  const handleSelectAllDays = (e) => {
     if(e.target.checked) setForm(prev => ({ ...prev, days: DAYS_OPTIONS }));
     else setForm(prev => ({ ...prev, days: [] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        let res;
        if (editingId) {
            res = await axios.put(`${BASE_URL}/doctor-sessions/${editingId}`, form);
            toast.success("Session updated");
            setSessions(prev => prev.map(s => s._id === editingId ? res.data.data : s));
        } else {
            res = await axios.post(`${BASE_URL}/doctor-sessions`, form);
            toast.success("Session created");
            setSessions(prev => [res.data.data, ...prev]);
        }
        // Refresh full list to be safe
        const refresh = await axios.get(`${BASE_URL}/doctor-sessions`);
        setSessions(refresh.data);
        toggleForm();
    } catch (err) {
        toast.error("Save failed");
    }
  };

  // --- Import Logic ---
  const handleImport = async (e) => {
    e.preventDefault();
    if(!importFile) return toast.error("Please select a file");
    const fd = new FormData();
    fd.append("file", importFile);
    try {
        await axios.post(`${BASE_URL}/doctor-sessions/import`, fd);
        toast.success("Import successful");
        setShowImport(false);
        const refresh = await axios.get(`${BASE_URL}/doctor-sessions`);
        setSessions(refresh.data);
    } catch(e) {
        toast.error("Import failed");
    }
  };

  // --- Export Logic ---
  const handleExport = (type) => {
    if(type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(sessions);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sessions");
        XLSX.writeFile(wb, "doctor_sessions.xlsx");
    } else if (type === 'csv') {
        const headers = ["Doctor,Clinic,Days,Morning,Evening"];
        const rows = sessions.map(s => 
            `"${s.doctorName}","${s.clinic}","${s.days.join('|')}","${s.morningStart}-${s.morningEnd}","${s.eveningStart}-${s.eveningEnd}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "doctor_sessions.csv");
        document.body.appendChild(link);
        link.click();
    } else if (type === 'pdf') {
        const doc = new jsPDF();
        doc.text("Doctor Sessions", 14, 10);
        autoTable(doc, {
            head: [['Doctor', 'Clinic', 'Days', 'Morning', 'Evening']],
            body: sessions.map(s => [s.doctorName, s.clinic, s.days.join(', '), `${s.morningStart}-${s.morningEnd}`, `${s.eveningStart}-${s.eveningEnd}`]),
        });
        doc.save('doctor_sessions.pdf');
    }
  };

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return sessions.filter(s => {
        if(searchTerm && !JSON.stringify(s).toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if(filters.doctor && !s.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) return false;
        if(filters.clinic && !s.clinic?.toLowerCase().includes(filters.clinic.toLowerCase())) return false;
        if(filters.day && !(s.days || []).includes(filters.day)) return false;
        return true;
    });
  }, [sessions, searchTerm, filters]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pageItems = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="session-scope">
      <style>{sessionStyles}</style>
      <Toaster position="top-right" />

      <div className="page-title-bar">
        <h5 className="page-title">Doctor Sessions</h5>
        <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" onClick={() => setShowImport(true)}>
                <FaFileImport /> Import
            </button>
            <button 
              className="btn btn-sm btn-primary d-flex align-items-center gap-2"
              onClick={toggleForm}
            >
              {showForm ? <><FaTimes /> Close</> : <><FaPlus /> Doctor Session</>}
            </button>
        </div>
      </div>

      <div className="table-card">
        
        {/* --- FORM SECTION --- */}
        {showForm && (
          <div className="bg-light p-4 mb-4 rounded border slide-down">
              <h6 className="fw-bold text-primary mb-3">{editingId ? "Edit Session" : "Add New Session"}</h6>
              <form onSubmit={handleSave}>
                  <div className="row g-3">
                      <div className="col-md-6">
                          <label className="form-label small fw-bold">Doctor *</label>
                          <select className="form-select" value={form.doctorId} onChange={handleDoctorSelect} required>
                              <option value="">Select Doctor</option>
                              {doctors.map(d => (
                                  <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                              ))}
                          </select>
                      </div>
                      <div className="col-md-6">
                          <label className="form-label small fw-bold">Clinic *</label>
                          <input className="form-control" name="clinic" value={form.clinic} onChange={handleFormChange} required />
                      </div>
                      
                      <div className="col-md-12">
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

                      <div className="col-md-4">
                          <label className="form-label small fw-bold">Time Slot (min)</label>
                          <select className="form-select" name="timeSlotMinutes" value={form.timeSlotMinutes} onChange={handleFormChange}>
                              <option value="10">10</option>
                              <option value="15">15</option>
                              <option value="30">30</option>
                              <option value="45">45</option>
                              <option value="60">60</option>
                          </select>
                      </div>

                      <div className="col-md-4">
                          <label className="form-label small fw-bold">Morning (Start - End)</label>
                          <div className="d-flex gap-2">
                              <input type="time" className="form-control" name="morningStart" value={form.morningStart} onChange={handleFormChange} />
                              <input type="time" className="form-control" name="morningEnd" value={form.morningEnd} onChange={handleFormChange} />
                          </div>
                      </div>

                      <div className="col-md-4">
                          <label className="form-label small fw-bold">Evening (Start - End)</label>
                          <div className="d-flex gap-2">
                              <input type="time" className="form-control" name="eveningStart" value={form.eveningStart} onChange={handleFormChange} />
                              <input type="time" className="form-control" name="eveningEnd" value={form.eveningEnd} onChange={handleFormChange} />
                          </div>
                      </div>
                  </div>
                  <div className="mt-4 d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-light border" onClick={toggleForm}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Session</button>
                  </div>
              </form>
          </div>
        )}

        {/* --- CONTROLS --- */}
        <div className="controls-row">
          <div className="search-group">
             <FaSearch className="text-muted" />
             <input 
               className="search-input" 
               placeholder="Search Table" 
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
             />
          </div>
          <div className="d-flex gap-2">
             <button className="export-btn excel" onClick={() => handleExport('excel')}><FaFileExcel size={18}/></button>
             <button className="export-btn csv" onClick={() => handleExport('csv')}><FaFileCsv size={18}/></button>
             <button className="export-btn pdf" onClick={() => handleExport('pdf')}><FaFilePdf size={18}/></button>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{width: '50px'}}>Sr.</th>
                <th>Doctor</th>
                <th>Clinic Name</th>
                <th>Days</th>
                <th>Time Slot</th>
                <th>Morning Session</th>
                <th>Evening Session</th>
                <th style={{textAlign: 'right'}}>Action</th>
              </tr>
              {/* Filter Row */}
              <tr className="filter-row">
                  <td></td>
                  <td><input className="filter-input" placeholder="Filter doctor session" onChange={(e) => setFilters({...filters, doctor: e.target.value})}/></td>
                  <td><input className="filter-input" placeholder="Filter Clinic" onChange={(e) => setFilters({...filters, clinic: e.target.value})}/></td>
                  <td>
                      <select className="filter-input" onChange={(e) => setFilters({...filters, day: e.target.value})}>
                          <option value="">Filter Day</option>
                          {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr><td colSpan="8" className="text-center py-5">Loading...</td></tr>
               ) : pageItems.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5 text-muted">No data found</td></tr>
               ) : (
                  pageItems.map((s, i) => (
                      <tr key={s._id}>
                          <td className="text-secondary pl-3">{(page - 1) * rowsPerPage + i + 1}</td>
                          <td>{s.doctorName}</td>
                          <td>{s.clinic}</td>
                          <td>
                              <div className="d-flex flex-wrap gap-1">
                                  {s.days.map(d => <span key={d} className="badge bg-light text-dark border" style={{fontSize:'0.7rem', fontWeight: 'normal'}}>{d}</span>)}
                              </div>
                          </td>
                          <td>{s.timeSlotMinutes}</td>
                          <td>{formatRange(s.morningStart, s.morningEnd)}</td>
                          <td>{formatRange(s.eveningStart, s.eveningEnd)}</td>
                          <td style={{textAlign: 'right'}}>
                              <div className="d-flex justify-content-end gap-2">
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
        
        {/* --- PAGINATION --- */}
        <div className="table-footer">
           <div className="d-flex align-items-center gap-2">
              Rows per page:
              <select className="form-select form-select-sm" style={{width:'70px'}} value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
              </select>
           </div>
           <div className="d-flex align-items-center gap-3">
              Page <span className="fw-bold border px-2 rounded bg-light">{page}</span> of {totalPages || 1}
              <div>
                  <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                  <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next</button>
              </div>
           </div>
        </div>

      </div>
      
      {/* Import Modal */}
      {showImport && (
        <>
          <div className="modal-backdrop fade show" style={{zIndex: 1050}}></div>
          <div className="modal fade show d-block" style={{zIndex: 1055}} tabIndex="-1">
             <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header">
                        <h5 className="modal-title text-primary">Import Doctor Sessions</h5>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{zIndex: 1040}}></div>
          <div className="modal fade show d-block" style={{zIndex: 1050}}>
             <div className="modal-dialog modal-dialog-centered modal-sm">
                 <div className="modal-content border-0 shadow">
                     <div className="modal-body text-center p-4">
                         <h5 className="text-danger mb-2">Confirm Delete</h5>
                         <p className="text-muted small mb-3">Are you sure you want to delete this session?</p>
                         <div className="d-flex justify-content-center gap-2">
                             <button className="btn btn-light btn-sm px-3" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                             <button className="btn btn-danger btn-sm px-3" onClick={confirmDelete}>Delete</button>
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