import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaSort, 
  FaChevronLeft, 
  FaChevronRight,
  FaTimes,
  FaSave,
  FaFileExcel,
  FaFileCsv,
  FaFilePdf
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const DAYS_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DoctorSessions = () => {
  // --- Data State ---
  const [sessions, setSessions] = useState([
    { id: 1, doctor: "doctorprajwalyadav21042004", clinic: "Valley Clinic", days: "Tue", timeSlot: "10", morning: "12:05 am to 1:10 am", evening: "2:10 am to 5:05 am" }
  ]);
  
  const [loading, setLoading] = useState(false);

  // --- UI States ---
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Delete Modal States ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    clinic: "",
    timeSlot: "5",
    morningStart: "",
    morningEnd: "",
    eveningStart: "",
    eveningEnd: "",
    selectedDays: []
  });

  // --- Filters ---
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDay, setFilterDay] = useState("");

  useEffect(() => {
    // fetchSessions();
  }, []);

  // --- Handlers ---

  // 1. Form Toggling
  const toggleForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditingItem(null);
      resetForm();
    } else {
      setShowForm(true);
      setEditingItem(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      clinic: "",
      timeSlot: "5",
      morningStart: "",
      morningEnd: "",
      eveningStart: "",
      eveningEnd: "",
      selectedDays: []
    });
  };

  // 2. Edit Logic
  const handleEdit = (item) => {
    setShowForm(true);
    setEditingItem(item);
    setFormData({
      clinic: item.clinic,
      timeSlot: item.timeSlot,
      morningStart: "00:05",
      morningEnd: "01:10",
      eveningStart: "02:10",
      eveningEnd: "05:05",
      selectedDays: ["Tue"]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Delete Logic
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setSessions(prev => prev.filter(s => s.id !== itemToDelete));
    setShowDeleteModal(false);
    setItemToDelete(null);
    toast.success("Session deleted successfully!");
  };

  // 4. Save Logic
  const handleSave = (e) => {
    e.preventDefault();
    toast.success(editingItem ? "Session Updated" : "Session Created");
    toggleForm();
  };

  // 5. Form Input Handlers
  const handleDayToggle = (day) => {
    setFormData(prev => {
      const newDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays: newDays };
    });
  };

  const handleSelectAllDays = (e) => {
    if(e.target.checked) {
        setFormData(prev => ({ ...prev, selectedDays: DAYS_OPTIONS }));
    } else {
        setFormData(prev => ({ ...prev, selectedDays: [] }));
    }
  };

  const handleExport = (type) => toast.success(`Exporting as ${type}...`);

  // --- Components ---
  const SortableHeader = ({ label }) => (
    <div className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }}>
        <span>{label}</span>
        <FaSort className="text-muted opacity-50" size={10} />
    </div>
  );

  return (
    <div className="position-relative">
      {/* --- Global Styles --- */}
      <style>
        {`
          .slide-down { animation: slideDown 0.3s ease-out; }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .fade-in { animation: fadeIn 0.2s ease-in; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          /* Custom Button Styles */
          .btn-action-square {
             width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
             border-radius: 4px; background-color: #fff; border: 1px solid #0d6efd; color: #0d6efd; transition: all 0.2s;
          }
          .btn-action-square:hover { background-color: #0d6efd; color: #fff; }

          .btn-action-danger {
             width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
             border-radius: 4px; background-color: #fff; border: 1px solid #dc3545; color: #dc3545; transition: all 0.2s;
          }
          .btn-action-danger:hover { background-color: #dc3545; color: #fff; }

          /* Export Button Styling (Clean Gray Border) */
          .btn-export {
             width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;
             background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; transition: all 0.2s;
          }
          .btn-export:hover { background-color: #f8f9fa; border-color: #adb5bd; }
        `}
      </style>

      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-bold text-dark">Doctor Sessions</h5>
        <button 
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'} d-flex align-items-center gap-2 px-3 fw-medium`}
            style={{ fontSize: '0.9rem' }}
            onClick={toggleForm}
        >
          {showForm ? <><FaTimes size={12} /> Close form</> : <><FaPlus size={10} /> Doctor Session</>}
        </button>
      </div>

      {/* --- ROLL-DOWN FORM SECTION --- */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow-sm mb-4 border slide-down">
           <form onSubmit={handleSave}>
              {/* Row 1: Clinic & Time Slot */}
              <div className="row g-3 mb-3">
                 <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Select Clinic <span className="text-danger">*</span></label>
                    <select 
                        className="form-select" 
                        value={formData.clinic} 
                        onChange={(e) => setFormData({...formData, clinic: e.target.value})}
                    >
                        <option value="">Search</option>
                        <option value="Valley Clinic">Valley Clinic</option>
                    </select>
                 </div>
                 <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">Time slot (in minute) <span className="text-danger">*</span></label>
                    <select 
                        className="form-select"
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                    </select>
                 </div>
              </div>

              {/* Row 2: Morning Session */}
              <div className="row g-3 mb-3">
                 <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">Morning session</label>
                    <div className="d-flex gap-3">
                        <input type="time" className="form-control" placeholder="Start time" value={formData.morningStart} onChange={(e) => setFormData({...formData, morningStart: e.target.value})} />
                        <input type="time" className="form-control" placeholder="End time" value={formData.morningEnd} onChange={(e) => setFormData({...formData, morningEnd: e.target.value})} />
                    </div>
                 </div>
              </div>

              {/* Row 3: Evening Session */}
              <div className="row g-3 mb-3">
                 <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">Evening session</label>
                    <div className="d-flex gap-3">
                        <input type="time" className="form-control" placeholder="Start time" value={formData.eveningStart} onChange={(e) => setFormData({...formData, eveningStart: e.target.value})} />
                        <input type="time" className="form-control" placeholder="End time" value={formData.eveningEnd} onChange={(e) => setFormData({...formData, eveningEnd: e.target.value})} />
                    </div>
                 </div>
              </div>

              {/* Row 4: Week Days */}
              <div className="mb-4">
                 <label className="form-label small fw-bold text-secondary">Week days <span className="text-danger">*</span></label>
                 <div className="d-flex flex-wrap gap-3 align-items-center">
                    <div className="form-check">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="day-all" 
                            checked={formData.selectedDays.length === DAYS_OPTIONS.length}
                            onChange={handleSelectAllDays}
                        />
                        <label className="form-check-label text-secondary" htmlFor="day-all">All</label>
                    </div>
                    {DAYS_OPTIONS.map(day => (
                        <div className="form-check" key={day}>
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`day-${day}`}
                                checked={formData.selectedDays.includes(day)}
                                onChange={() => handleDayToggle(day)}
                            />
                            <label className="form-check-label text-secondary" htmlFor={`day-${day}`}>{day}</label>
                        </div>
                    ))}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                 <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2">
                    <FaSave /> Save Session
                 </button>
                 <button type="button" className="btn btn-outline-secondary px-4" onClick={toggleForm}>
                    Cancel
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* --- SEARCH & EXPORT (SAME LINE) --- */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <div className="input-group border rounded bg-light flex-grow-1" style={{ overflow: 'hidden' }}>
            <span className="input-group-text bg-transparent border-0 pe-2 ps-3 text-muted">
                <FaSearch size={14} />
            </span>
            <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search Table"
                style={{ fontSize: '0.95rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {/* Export Buttons (Next to Search Bar) */}
        <div className="d-flex gap-2">
            <button className="btn-export" onClick={() => handleExport('Excel')} title="Export Excel">
                <FaFileExcel className="text-success" size={18} />
            </button>
            <button className="btn-export" onClick={() => handleExport('CSV')} title="Export CSV">
                <FaFileCsv className="text-success" size={18} />
            </button>
            <button className="btn-export" onClick={() => handleExport('PDF')} title="Export PDF">
                <FaFilePdf className="text-danger" size={18} />
            </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="border rounded">
        <table className="table mb-0">
          <thead className="bg-light">
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 ps-4" style={{ width: '60px', fontSize: '0.85rem' }}><SortableHeader label="Sr." /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Doctor" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Clinic Name" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Days" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Time Slot" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Morning Session" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ fontSize: '0.85rem' }}><SortableHeader label="Evening Session" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 text-start pe-4" style={{ width: '100px', fontSize: '0.85rem' }}>Action</th>
            </tr>
            <tr className="bg-white border-bottom">
              <td className="p-2"></td>
              <td className="p-2"><input type="text" className="form-control form-control-sm" placeholder="Filter doctor session" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} /></td>
              <td className="p-2"></td>
              <td className="p-2">
                <select className="form-select form-select-sm" value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                    <option value="">Filter Day</option>
                    {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </td>
              <td className="p-2"></td>
              <td className="p-2"></td>
              <td className="p-2"></td>
              <td className="p-2"></td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-5 text-muted">Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-5 text-muted border-0"><div className="py-4">No Data Found</div></td></tr>
            ) : (
              sessions.map((s, i) => (
                <tr key={s.id} className="align-middle">
                  <td className="ps-4 text-muted">{i + 1}</td>
                  <td className="text-muted">{s.doctor}</td>
                  <td className="text-muted">{s.clinic}</td>
                  <td className="text-muted">{s.days}</td>
                  <td className="text-muted">{s.timeSlot}</td>
                  <td className="text-muted">{s.morning}</td>
                  <td className="text-muted">{s.evening}</td>
                  <td className="text-end pe-4">
                     <div className="d-flex justify-content-end gap-2">
                        <button className="btn-action-square" onClick={() => handleEdit(s)}><FaEdit /></button>
                        <button className="btn-action-danger" onClick={() => handleDeleteClick(s.id)}><FaTrash /></button>
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Footer --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 text-secondary bg-light p-3 rounded" style={{ fontSize: "0.85rem" }}>
        <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
          <span>Rows per page:</span>
          <select className="form-select form-select-sm border-0 bg-transparent fw-bold" style={{ width: "60px", boxShadow: 'none' }} value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
            <option value="10">10</option>
            <option value="25">25</option>
          </select>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div><span>Page </span><span className="fw-bold border px-2 py-1 rounded bg-white mx-1">{currentPage}</span><span> of 1</span></div>
          <div className="d-flex gap-1">
            <button className="btn btn-sm text-secondary disabled d-flex align-items-center gap-1"><FaChevronLeft size={10} /> Prev</button>
            <button className="btn btn-sm text-secondary disabled d-flex align-items-center gap-1">Next <FaChevronRight size={10} /></button>
          </div>
        </div>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block fade-in" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-body p-4">
                   <h5 className="mb-2 text-dark fw-bold" style={{ fontSize: '1.1rem' }}>Are you sure ?</h5>
                   <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>Press yes to delete.</p>
                   <div className="d-flex justify-content-end gap-2">
                       <button className="btn btn-danger btn-sm px-3 fw-bold" onClick={confirmDelete}>YES</button>
                       <button className="btn btn-light btn-sm px-3 fw-bold border" onClick={() => setShowDeleteModal(false)}>CANCEL</button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default DoctorSessions;