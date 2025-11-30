import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
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

const BASE_URL = "http://localhost:3001/listings";

/* ---------- SCOPED CSS ---------- */
const listingStyles = `
  .listing-scope { font-family: 'Segoe UI', sans-serif; }

  .search-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 15px;
  }

  .search-input-group {
    border: 1px solid #dee2e6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #fff;
    flex-grow: 1;
    max-width: 500px;
  }
  
  .search-input {
    border: none;
    margin-left: 10px;
    width: 100%;
    outline: none;
    color: #495057;
    font-size: 0.9rem;
  }

  .export-group { display: flex; gap: 8px; }
  .btn-export {
     width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
     border: 1px solid #dee2e6; background: #fff; border-radius: 4px; cursor: pointer; transition: 0.2s;
  }
  .btn-export:hover { background-color: #f8f9fa; }
  .btn-export.excel { color: #198754; }
  .btn-export.csv { color: #0d6efd; }
  .btn-export.pdf { color: #dc3545; }

  .custom-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .custom-table thead th {
    padding: 12px 10px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    color: #6c757d;
    font-weight: 700;
    white-space: nowrap;
  }
  .custom-table tbody td {
    padding: 10px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: middle;
    color: #333;
  }

  .filter-input {
    width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.8rem; outline: none;
  }
  .filter-input:focus { border-color: #86b7fe; }

  .status-badge {
    padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  }
  .status-badge.active { background-color: #d1e7dd; color: #0f5132; }
  .status-badge.inactive { background-color: #f8d7da; color: #842029; }

  .form-switch .form-check-input { width: 2.5em; height: 1.25em; cursor: pointer; }

  .action-btn {
    border: 1px solid; border-radius: 4px; width: 28px; height: 28px; 
    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: #fff;
  }
  .action-btn.edit { border-color: #0d6efd; color: #0d6efd; }
  .action-btn.edit:hover { background: #0d6efd; color: #fff; }
  .action-btn.delete { border-color: #dc3545; color: #dc3545; }
  .action-btn.delete:hover { background: #dc3545; color: #fff; }

  .slide-down { animation: slideDown 0.3s ease-out; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;

const ListingSettings = () => {
  // Data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState({ name: "", type: "", status: "" });

  // Form Data (Default type set to Title Case)
  const [formData, setFormData] = useState({ label: "", type: "Specialization", status: "Active" });

  // Fetch Data
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL);
      setListings(res.data);
    } catch {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  /* ---------------- EXPORT FUNCTIONS ---------------- */

  const exportCSV = () => {
    const headers = ["ID", "Name", "Type", "Status"];

    const rows = filteredData.map((item, index) => [
      index + 1,
      item.name,
      item.type,
      item.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Listing_Settings.csv";
    link.click();
  };

  const exportExcel = () => {
    const worksheetData = filteredData.map((item, index) => ({
      ID: index + 1,
      Name: item.name,
      Type: item.type,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");
    XLSX.writeFile(workbook, "Listing_Settings.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");

    const tableColumn = ["ID", "Name", "Type", "Status"];
    const tableRows = filteredData.map((item, index) => [
      index + 1,
      item.name,
      item.type,
      item.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "grid",
    });

    doc.save("Listing_Settings.pdf");
  };

  const handleExport = (type) => {
    if (type === "Excel") return exportExcel();
    if (type === "CSV") return exportCSV();
    if (type === "PDF") return exportPDF();
  };

  /* -------------------------------------------------- */

  // Handlers
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: formData.label, type: formData.type, status: formData.status };
      if (editingItem) {
        await axios.put(`${BASE_URL}/${editingItem._id}`, payload);
        toast.success("Updated successfully");
      } else {
        await axios.post(BASE_URL, payload);
        toast.success("Added successfully");
      }
      setShowForm(false);
      fetchListings();
    } catch (error) {
      // Improved Error Handling: Show backend message
      console.error("Save Error:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Operation failed";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await axios.delete(`${BASE_URL}/${id}`);
      toast.success("Deleted");
      fetchListings();
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await axios.put(`${BASE_URL}/${id}`, { status: newStatus });
      setListings(prev =>
        prev.map(item => item._id === id ? { ...item, status: newStatus } : item)
      );
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ label: item.name, type: item.type, status: item.status });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    return listings.filter(item => {
      const searchMatch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      const nameMatch =
        !filters.name ||
        item.name.toLowerCase().includes(filters.name.toLowerCase());

      const typeMatch =
        !filters.type || item.type === filters.type;

      const statusMatch =
        !filters.status || item.status === filters.status;

      return searchMatch && nameMatch && typeMatch && statusMatch;
    });
  }, [listings, searchTerm, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pageItems = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="listing-scope">
      <style>{listingStyles}</style>
      <Toaster position="top-right"/>

      <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-dark m-0">Listing Settings</h4>
          <button 
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={() => { setShowForm(!showForm); setEditingItem(null); setFormData({label:"", type:"Specialization", status:"Active"}); }}
          >
            {showForm ? <><FaTimes/> Close</> : <><FaPlus/> Add Listing</>}
          </button>
      </div>

      {/* --- ADD/EDIT FORM --- */}
      {showForm && (
        <div className="bg-light p-4 rounded border mb-4 slide-down">
            <h6 className="fw-bold text-primary mb-3">{editingItem ? "Edit Listing" : "Add New Listing"}</h6>
            <form onSubmit={handleSave}>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label small fw-bold">Name *</label>
                        <input className="form-control" value={formData.label} onChange={e => setFormData({...formData, label:e.target.value})} required />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-bold">Type *</label>
                        <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type:e.target.value})}>
                            {/* UPDATED: Values match Title Case likely expected by Backend */}
                            <option value="Specialization">Specialization</option>
                            <option value="Service Type">Service Type</option>
                            <option value="Clinical Observations">Clinical Observations</option>
                            <option value="Clinical Problems">Clinical Problems</option>
                            <option value="Prescription Medicine">Prescription Medicine</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-bold">Status</label>
                        <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status:e.target.value})}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div className="text-end mt-3">
                    <button className="btn btn-primary btn-sm px-4">{editingItem ? "Update" : "Save"}</button>
                </div>
            </form>
        </div>
      )}

      {/* --- SEARCH & EXPORT --- */}
      <div className="search-container">
         <div className="search-input-group">
            <FaSearch className="text-muted" />
            <input 
                className="search-input" 
                placeholder="Search listing-data by name, type..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="export-group">
            <button className="btn-export excel" onClick={() => handleExport("Excel")}><FaFileExcel/></button>
            <button className="btn-export csv" onClick={() => handleExport("CSV")}><FaFileCsv/></button>
            <button className="btn-export pdf" onClick={() => handleExport("PDF")}><FaFilePdf/></button>
         </div>
      </div>

      {/* --- TABLE --- */}
      <div className="table-responsive border rounded">
         <table className="custom-table">
            <thead className="bg-light">
                <tr>
                    <th style={{width:'50px'}}>ID</th>
                    <th>Name <FaSort size={10}/></th>
                    <th>Type <FaSort size={10}/></th>
                    <th>Status <FaSort size={10}/></th>
                    <th className="text-end">Action</th>
                </tr>

                {/* Filter Row */}
                <tr>
                    <td></td>
                    <td><input className="filter-input" placeholder="Filter name" onChange={e => setFilters({...filters, name: e.target.value})} /></td>

                    <td>
                        <select className="filter-input" onChange={e => setFilters({...filters, type: e.target.value})}>
                            <option value="">Filter by type</option>
                            <option value="Specialization">Specialization</option>
                            <option value="Service Type">Service Type</option>
                            <option value="Clinical Observations">Clinical Observations</option>
                            <option value="Clinical Problems">Clinical Problems</option>
                            <option value="Prescription Medicine">Prescription Medicine</option>
                        </select>
                    </td>

                    <td>
                        <select className="filter-input" onChange={e => setFilters({...filters, status: e.target.value})}>
                            <option value="">Filter status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </td>

                    <td></td>
                </tr>
            </thead>

            <tbody>
                {loading ? (
                    <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                ) : pageItems.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4 text-muted">No records found</td></tr>
                ) : (
                    pageItems.map((item, i) => (
                        <tr key={item._id}>
                            <td className="text-muted ps-3">{(page-1)*rowsPerPage + i + 1}</td>
                            <td>{item.name}</td>
                            <td>{item.type}</td>
                            <td>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="form-check form-switch mb-0">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={item.status === 'Active'} 
                                            onChange={() => toggleStatus(item._id, item.status)}
                                        />
                                    </div>
                                    <span className={`status-badge ${item.status === 'Active' ? 'active' : 'inactive'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                    <button className="action-btn edit" onClick={() => handleEdit(item)}><FaEdit /></button>
                                    <button className="action-btn delete" onClick={() => handleDelete(item._id)}><FaTrash /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
         </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="d-flex justify-content-between align-items-center mt-3">
         <div className="small text-muted">
            Rows per page: 
            <select className="ms-1 border rounded p-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                <option value="10">10</option>
                <option value="20">20</option>
            </select>
         </div>

         <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>
              <FaChevronLeft/> Prev
            </button>

            <span className="small mx-2">Page {page} of {totalPages || 1}</span>

            <button className="btn btn-sm btn-outline-secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>
              Next <FaChevronRight/>
            </button>
         </div>
      </div>

    </div>
  );
};

export default ListingSettings;