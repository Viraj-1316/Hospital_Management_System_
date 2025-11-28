import React, { useState } from "react";
import { 
  FaPlus, 
  FaFileImport, 
  FaSearch, 
  FaEdit, 
  FaQuestionCircle, 
  FaSort,
  FaTimes,
  FaFileCsv,
  FaFilePdf,
  FaFileExcel,
  FaChevronLeft,
  FaChevronRight,
  FaTrash
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const Listings = () => {
  // --- Data State ---
  const [listings, setListings] = useState([
    { id: 16, name: "ksihan cart", type: "service type", status: "Active" },
    { id: 13, name: "ab", type: "prescription medicine", status: "Active" },
    { id: 12, name: "lmno", type: "clinical observations", status: "Active" },
    { id: 11, name: "hijk", type: "clinical observations", status: "Active" },
    { id: 10, name: "efgh", type: "clinical problems", status: "Active" },
    { id: 9, name: "abcd", type: "clinical problems", status: "Active" },
    { id: 8, name: "Other", type: "service type", status: "Active" },
    { id: 7, name: "Psychology Services", type: "service type", status: "Active" },
    { id: 6, name: "Weight Management", type: "service type", status: "Active" },
    { id: 5, name: "General Dentistry", type: "service type", status: "Active" },
    { id: 4, name: "Allergy and Immunology", type: "specialization", status: "Active" },
    { id: 3, name: "Neurology", type: "specialization", status: "Active" },
    { id: 2, name: "Family Medicine", type: "specialization", status: "Active" },
    { id: 1, name: "Dermatology", type: "specialization", status: "Active" },
  ]);
  
  // --- UI States ---
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 

  // --- Pagination States ---
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [formData, setFormData] = useState({ label: "", type: "specialization", status: "Active" });

  // Filters
  const [filters, setFilters] = useState({ id: "", name: "", type: "", status: "" });

  // --- Pagination Logic ---
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = listings.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(listings.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Handlers ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select only visible rows or all rows? Usually all rows in current view or dataset
      setSelectedRows(listings.map(l => l.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleDeleteTrigger = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setListings(prev => prev.filter(item => !selectedRows.includes(item.id)));
    setSelectedRows([]);
    setShowDeleteConfirm(false);
    toast.success("Records Deleted Successfully");
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingItem(null);
    setFormData({ label: "", type: "specialization", status: "Active" });
  };

  const handleEdit = (item) => {
    setShowForm(true);
    setEditingItem(item);
    setFormData({ label: item.name, type: item.type, status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if(editingItem) {
        setListings(prev => prev.map(item => item.id === editingItem.id ? {...item, name: formData.label, type: formData.type, status: formData.status} : item));
        toast.success("Listing Updated");
    } else {
        const newId = Math.max(...listings.map(l => l.id), 0) + 1;
        setListings([{ id: newId, name: formData.label, type: formData.type, status: formData.status }, ...listings]);
        toast.success("Listing Added");
    }
    toggleForm();
  };

  const handleToggleStatus = (id) => {
    setListings(prev => prev.map(item => 
      item.id === id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item
    ));
    toast.success("Status Updated");
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
      <style>
        {`
          .fade-in { animation: fadeIn 0.3s ease-in-out; }
          .slide-down { animation: slideDown 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          
          .custom-checkbox:checked { background-color: #0d6efd; border-color: #0d6efd; }
          .action-bar { background-color: #e9ecef; border-bottom: 1px solid #dee2e6; }
          
          /* Pagination Input Styling */
          .page-input {
             width: 35px;
             text-align: center;
             border: 1px solid #dee2e6;
             border-radius: 4px;
             font-size: 0.85rem;
             padding: 4px;
             font-weight: 600;
             color: #495057;
          }
          
          /* Custom Action Button (Blue Square Outline) */
          .btn-action-square {
             width: 32px;
             height: 32px;
             display: flex;
             align-items: center;
             justify-content: center;
             border-radius: 4px;
             background-color: #fff;
             border: 1px solid #0d6efd;
             color: #0d6efd;
             transition: all 0.2s;
          }
          .btn-action-square:hover {
             background-color: #0d6efd;
             color: #fff;
          }

          /* Export Button Styling */
          .btn-export {
             width: 35px;
             height: 35px;
             display: flex;
             align-items: center;
             justify-content: center;
             background-color: #fff;
             border: 1px solid #dee2e6;
             border-radius: 6px;
             transition: all 0.2s;
          }
          .btn-export:hover {
             background-color: #f8f9fa;
             border-color: #ced4da;
          }
        `}
      </style>

      {/* --- Top Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
           <h5 className="mb-0 fw-bold text-dark">Listing Data</h5>
           <FaQuestionCircle className="text-secondary opacity-75" size={14} style={{ cursor: 'pointer' }} />
        </div>
        <div className="d-flex gap-2">
            <button className="btn btn-primary d-flex align-items-center gap-2 px-3 fw-medium" style={{ fontSize: '0.9rem' }}>
              <FaFileImport size={12} /> Import data
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2 px-3 fw-medium" style={{ fontSize: '0.9rem' }} onClick={toggleForm}>
               {showForm ? <><FaTimes size={12} /> Close form</> : <><FaPlus size={10} /> Add List Data</>}
            </button>
        </div>
      </div>

      {/* --- ADD/EDIT FORM --- */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow-sm mb-4 border slide-down">
           <form onSubmit={handleSave}>
              <div className="row g-4">
                 <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">Label <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Dermatology" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} required />
                 </div>
                 <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">Type <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                        <option value="specialization">specialization</option>
                        <option value="service type">service type</option>
                    </select>
                 </div>
                 <div className="col-md-4">
                    <label className="form-label small fw-bold text-secondary">Status <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                 </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                 <button type="submit" className="btn btn-primary px-4"><FaFileImport size={12} className="me-2" /> Save</button>
                 <button type="button" className="btn btn-outline-primary px-4" onClick={toggleForm}>Cancel</button>
              </div>
           </form>
        </div>
      )}

      {/* --- Search Bar & Exports --- */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <div className="input-group border rounded bg-light flex-grow-1" style={{ overflow: 'hidden' }}>
            <span className="input-group-text bg-transparent border-0 pe-2 ps-3 text-muted">
                <FaSearch size={14} />
            </span>
            <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Search listing-data by name, type and status(active or :inactive)"
                style={{ fontSize: '0.95rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        {/* Export Icons */}
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

      {/* --- SELECTION ACTION BAR --- */}
      {selectedRows.length > 0 && (
        <div className="action-bar p-2 rounded mb-3 d-flex justify-content-between align-items-center fade-in text-secondary">
           <div className="fw-bold ps-2 text-primary">
              {selectedRows.length} Rows selected 
              <span className="text-dark ms-3" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'normal' }} onClick={() => setSelectedRows([])}>Clear</span>
           </div>
           <div className="d-flex gap-2">
               <button className="btn btn-primary btn-sm" onClick={handleDeleteTrigger}>Delete Selected</button>
           </div>
        </div>
      )}

      {/* --- Table Section --- */}
      <div className="border rounded">
        <table className="table mb-0">
          <thead className="bg-light">
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th className="py-3 ps-3 border-bottom-0" style={{ width: '40px' }}>
                <input 
                    type="checkbox" 
                    className="form-check-input custom-checkbox" 
                    onChange={handleSelectAll}
                />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '80px', fontSize: '0.85rem' }}><SortableHeader label="ID" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '30%', fontSize: '0.85rem' }}><SortableHeader label="Name" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '25%', fontSize: '0.85rem' }}><SortableHeader label="Type" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '20%', fontSize: '0.85rem' }}><SortableHeader label="Status" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 text-start pe-4" style={{ width: '100px', fontSize: '0.85rem' }}>Action</th>
            </tr>
            {/* Filters */}
            <tr className="bg-white border-bottom">
              <td className="p-2"></td>
              <td className="p-2"><input type="text" className="form-control form-control-sm" placeholder="ID" /></td>
              <td className="p-2"><input type="text" className="form-control form-control-sm" placeholder="Filter by name" /></td>
              <td className="p-2">
                 <select className="form-select form-select-sm"><option value="">Filter by type</option></select>
              </td>
              <td className="p-2">
                 <select className="form-select form-select-sm"><option value="">Filter by status</option></select>
              </td>
              <td className="p-2"></td>
            </tr>
          </thead>
          <tbody>
              {currentRows.map((item) => (
                <tr key={item.id} className={`align-middle ${selectedRows.includes(item.id) ? 'table-active' : ''}`}>
                  <td className="ps-3">
                    <input 
                        type="checkbox" 
                        className="form-check-input custom-checkbox" 
                        checked={selectedRows.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                    />
                  </td>
                  <td className="text-muted small">{item.id}</td>
                  <td className="text-muted small">{item.name}</td>
                  <td className="text-muted small">{item.type}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                role="switch" 
                                checked={item.status === 'Active'}
                                onChange={() => handleToggleStatus(item.id)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                        <span className={`badge ${item.status === 'Active' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'} border rounded-1`} style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', padding: '4px 6px' }}>{item.status}</span>
                    </div>
                  </td>
                  <td className="text-center pe-4">
                     {/* Square Action Button */}
                     <div className="d-flex justify-content-start">
                        <button className="btn-action-square" onClick={() => handleEdit(item)}>
                            <FaEdit size={14} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* --- Footer (Pagination) --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 text-secondary bg-light p-3 rounded" style={{ fontSize: "0.85rem" }}>
        
        {/* Rows per page selector */}
        <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
          <span>Rows per page:</span>
          <select 
             className="form-select form-select-sm border-0 bg-transparent fw-bold" 
             style={{ width: "auto", boxShadow: 'none' }} 
             value={rowsPerPage} 
             onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Page Control */}
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-2">
              <span>Page</span> 
              <input 
                  type="text" 
                  className="page-input" 
                  value={currentPage} 
                  readOnly 
              />
              <span>of {totalPages}</span>
          </div>
          <div className="d-flex gap-2">
            <button 
                className={`btn btn-sm text-secondary d-flex align-items-center gap-1 ${currentPage === 1 ? 'disabled' : ''}`} 
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ fontSize: '0.85rem', cursor: currentPage === 1 ? 'default' : 'pointer' }}
            >
                <FaChevronLeft size={10} /> Prev
            </button>
            <button 
                className={`btn btn-sm text-secondary d-flex align-items-center gap-1 ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ fontSize: '0.85rem', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
            >
                Next <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DELETE MODAL --- */}
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block fade-in" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content shadow">
                <div className="modal-body text-center p-4">
                   <h5 className="mb-2 text-dark">Are you sure ?</h5>
                   <p className="text-muted small mb-4">Press yes to delete</p>
                   <div className="d-flex justify-content-center gap-2">
                       <button className="btn btn-danger btn-sm px-4 fw-bold" onClick={confirmDelete}>YES</button>
                       <button className="btn btn-light btn-sm px-3 fw-bold border" onClick={() => setShowDeleteConfirm(false)}>CANCEL</button>
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

export default Listings;