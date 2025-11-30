import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
import { toast, Toaster } from "react-hot-toast";

// --- 1. IMPORT EXPORT LIBRARIES ---
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Configure your base URL
const BASE_URL = "http://localhost:3001/listings";

const SharedListingSettings = () => {
  // --- Data State ---
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- UI States ---
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Pagination States ---
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [formData, setFormData] = useState({ label: "", type: "Specialization", status: "Active" });

  // Filters
  const [filters, setFilters] = useState({ id: "", name: "", type: "", status: "" });

  // --- FETCH DATA ---
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL);
      setListings(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // --- Filtering Logic (Moved up so Export can use it) ---
  const filteredListings = useMemo(() => {
    return listings.filter(item => 
        (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [listings, searchTerm]);

  // --- EXPORT FUNCTIONS ---

  // 1. Helper for PDF Logo
  const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject("Image load failed");
      img.src = url;
    });
  };

  // 2. Export to CSV
  const exportCSV = () => {
    const headers = ["ID,Name,Type,Status"];
    const rows = filteredListings.map((item, index) => [
      `${index + 1},${item.name},${item.type},${item.status}`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Listings.csv";
    link.click();
  };

  // 3. Export to Excel
  const exportExcel = () => {
    const worksheetData = filteredListings.map((item, index) => ({
      ID: index + 1,
      Name: item.name,
      Type: item.type,
      Status: item.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");
    XLSX.writeFile(workbook, "Listings.xlsx");
  };

  // 4. Export to PDF
  const exportPDF = async () => {
    const doc = new jsPDF();
    
    // Add Logo
    try {
      const logoBase64 = await getBase64Image(`${window.location.origin}/logo.png`);
      if(logoBase64) doc.addImage(logoBase64, "PNG", 15, 10, 20, 20);
    } catch(e) { console.log("No logo found"); }

    doc.setFontSize(18);
    doc.text("Listing Data", 105, 25, { align: "center" });

    const tableColumn = ["ID", "Name", "Type", "Status"];
    const tableRows = filteredListings.map((item, index) => [
      index + 1,
      item.name,
      item.type,
      item.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] } // Blue header
    });

    doc.save("Listings.pdf");
  };

  // 5. Handle Trigger
  const handleExport = (type) => {
     if(type === "Excel") exportExcel();
     if(type === "CSV") exportCSV();
     if(type === "PDF") exportPDF();
  };

  // --- Handlers ---

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(listings.map(l => l._id));
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
    setItemToDelete(null); // null means bulk delete
    setShowDeleteConfirm(true);
  };

  const handleSingleDeleteTrigger = (id) => {
      setItemToDelete(id);
      setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
        if (itemToDelete) {
            await axios.delete(`${BASE_URL}/${itemToDelete}`);
        } else {
            await Promise.all(selectedRows.map(id => axios.delete(`${BASE_URL}/${id}`)));
        }
        toast.success("Records Deleted Successfully");
        fetchListings(); 
        setSelectedRows([]);
        setItemToDelete(null);
    } catch (error) {
        console.error(error);
        toast.error("Failed to delete records");
    }
    setShowDeleteConfirm(false);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingItem(null);
    setFormData({ label: "", type: "Specialization", status: "Active" });
  };

  const handleEdit = (item) => {
    setShowForm(true);
    setEditingItem(item);
    setFormData({ label: item.name, type: item.type, status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            name: formData.label,
            type: formData.type,
            status: formData.status
        };

        if(editingItem) {
            await axios.put(`${BASE_URL}/${editingItem._id}`, payload);
            toast.success("Listing Updated");
        } else {
            await axios.post(BASE_URL, payload);
            toast.success("Listing Added");
        }
        toggleForm();
        fetchListings(); 
    } catch (error) {
        console.error("Save Error:", error.response?.data || error.message);
        toast.error("Failed to save listing. Check inputs.");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
        await axios.put(`${BASE_URL}/${id}`, { status: newStatus });
        
        setListings(prev => prev.map(item => 
            item._id === id ? { ...item, status: newStatus } : item
        ));
        toast.success("Status Updated");
    } catch (error) {
        toast.error("Failed to update status");
    }
  };

  // --- Pagination Logic ---
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredListings.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredListings.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Components ---
  const SortableHeader = ({ label }) => (
    <div className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }}>
        <span>{label}</span>
        <FaSort className="text-muted opacity-50" size={10} />
    </div>
  );

  return (
    <div className="position-relative">
      <Toaster position="top-right" />
      <style>
        {`
          .fade-in { animation: fadeIn 0.3s ease-in-out; }
          .slide-down { animation: slideDown 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          
          .custom-checkbox:checked { background-color: #0d6efd; border-color: #0d6efd; }
          .action-bar { background-color: #e9ecef; border-bottom: 1px solid #dee2e6; }
          
          .page-input { width: 35px; text-align: center; border: 1px solid #dee2e6; border-radius: 4px; font-size: 0.85rem; padding: 4px; font-weight: 600; color: #495057; }
          
          .btn-action-square { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background-color: #fff; border: 1px solid #0d6efd; color: #0d6efd; transition: all 0.2s; }
          .btn-action-square:hover { background-color: #0d6efd; color: #fff; }

          .btn-export { width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; transition: all 0.2s; cursor: pointer; }
          .btn-export:hover { background-color: #f8f9fa; border-color: #ced4da; }
          .btn-export.excel { color: #198754; }
          .btn-export.csv { color: #0d6efd; }
          .btn-export.pdf { color: #dc3545; }
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
                        <option value="Specialization">Specialization</option>
                        <option value="Service type">Service type</option>
                        <option value="Observations">Observations</option>
                        <option value="Problems">Problems</option>
                        <option value="Prescription">Prescription</option>
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
                 <button type="submit" className="btn btn-primary px-4"> Save</button>
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
                placeholder="Search listing-data by name, type..."
                style={{ fontSize: '0.95rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        {/* Export Icons */}
        <div className="d-flex gap-2">
            <button className="btn-export excel" onClick={() => handleExport('Excel')} title="Export Excel">
                <FaFileExcel className="text-success" size={18} />
            </button>
            <button className="btn-export csv" onClick={() => handleExport('CSV')} title="Export CSV">
                <FaFileCsv className="text-success" size={18} />
            </button>
            <button className="btn-export pdf" onClick={() => handleExport('PDF')} title="Export PDF">
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
                    checked={listings.length > 0 && selectedRows.length === listings.length}
                />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '80px', fontSize: '0.85rem' }}><SortableHeader label="ID" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '30%', fontSize: '0.85rem' }}><SortableHeader label="Name" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '25%', fontSize: '0.85rem' }}><SortableHeader label="Type" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '20%', fontSize: '0.85rem' }}><SortableHeader label="Status" /></th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 text-start pe-4" style={{ width: '100px', fontSize: '0.85rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
              ) : currentRows.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No data found</td></tr>
              ) : (
                  currentRows.map((item, i) => (
                    <tr key={item._id} className={`align-middle ${selectedRows.includes(item._id) ? 'table-active' : ''}`}>
                      <td className="ps-3">
                        <input 
                            type="checkbox" 
                            className="form-check-input custom-checkbox" 
                            checked={selectedRows.includes(item._id)}
                            onChange={() => handleSelectRow(item._id)}
                        />
                      </td>
                      {/* Calculate ID based on pagination */}
                      <td className="text-muted small">{(currentPage-1)*rowsPerPage + i + 1}</td>
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
                                    onChange={() => handleToggleStatus(item._id, item.status)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                            <span className={`badge ${item.status === 'Active' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'} border rounded-1`} style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', padding: '4px 6px' }}>{item.status}</span>
                        </div>
                      </td>
                      <td className="text-center pe-4">
                          <div className="d-flex justify-content-start gap-2">
                             <button className="btn-action-square" onClick={() => handleEdit(item)}>
                                <FaEdit size={14} />
                             </button>
                             <button className="btn-action-square border-danger text-danger" onClick={() => handleSingleDeleteTrigger(item._id)}>
                                <FaTrash size={14} />
                             </button>
                          </div>
                      </td>
                    </tr>
                  ))
              )}
          </tbody>
        </table>
      </div>

      {/* --- Footer (Pagination) --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 text-secondary bg-light p-3 rounded" style={{ fontSize: "0.85rem" }}>
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
             >
                 <FaChevronLeft size={10} /> Prev
             </button>
             <button 
                 className={`btn btn-sm text-secondary d-flex align-items-center gap-1 ${currentPage === totalPages ? 'disabled' : ''}`} 
                 onClick={() => handlePageChange(currentPage + 1)}
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

export default SharedListingSettings;
