import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaSort,
  FaTimes,
  FaFileExcel,
  FaFileCsv,
  FaFilePdf,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaCalendarAlt,
  FaQuestionCircle
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";

const BASE_URL = "http://localhost:3001";

/* ---------- SCOPED CSS ---------- */
const holidayStyles = `
  .holiday-scope { font-family: 'Segoe UI', sans-serif; background-color: #f5f7fb; padding: 20px; }

  /* Card */
  .table-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  }
  
  /* Search & Exports */
  .search-container { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px; }
  .search-input-group { border: 1px solid #dee2e6; border-radius: 4px; display: flex; align-items: center; padding: 8px 12px; background: #fff; width: 350px; }
  .search-input { border: none; margin-left: 10px; width: 100%; outline: none; color: #495057; font-size: 0.9rem; }
  
  .export-group { display: flex; gap: 8px; }
  .btn-export { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1px solid #dee2e6; background: #fff; border-radius: 4px; cursor: pointer; transition: 0.2s; }
  .btn-export:hover { background-color: #f8f9fa; }
  .btn-export.excel { color: #198754; } 
  .btn-export.csv { color: #0d6efd; } 
  .btn-export.pdf { color: #dc3545; }

  /* Table */
  .custom-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .custom-table th { padding: 12px 10px; text-align: left; border-bottom: 2px solid #dee2e6; color: #6c757d; font-weight: 700; }
  .custom-table td { padding: 10px; border-bottom: 1px solid #e9ecef; vertical-align: middle; color: #333; }
  
  .filter-input { width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; outline: none; font-size: 0.8rem; }
  
  .action-btn { border: 1px solid; border-radius: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #fff; }
  .action-btn.edit { border-color: #0d6efd; color: #0d6efd; } 
  .action-btn.delete { border-color: #dc3545; color: #dc3545; }

  .slide-down { animation: slideDown 0.3s ease-out; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;

// --- HELPER FOR PDF IMAGE ---
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

export default function HolidaySettings() {
  // State
  const [holidays, setHolidays] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ scheduleDate: [], doctorId: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters & Sort
  const [filters, setFilters] = useState({ id: "", fromDate: "", toDate: "", doctor: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resHolidays, resDoctors] = await Promise.all([
        axios.get(`${BASE_URL}/holidays`),
        axios.get(`${BASE_URL}/doctors`)
      ]);

      setHolidays(resHolidays.data.map((h) => ({
        ...h,
        id: h.autoId,
        from: new Date(h.fromDate).toLocaleDateString(),
        to: new Date(h.toDate).toLocaleDateString()
      })));

      setDoctors(Array.isArray(resDoctors.data) ? resDoctors.data : resDoctors.data.data || []);

    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.doctorId) {
      toast.error("Please select a doctor");
      return;
    }
    if (!formData.scheduleDate || formData.scheduleDate.length !== 2) {
      toast.error("Please select a date range");
      return;
    }

    try {
      const selectedDoc = doctors.find(d => d._id === formData.doctorId);
      const docName = selectedDoc ? `${selectedDoc.firstName} ${selectedDoc.lastName}` : "Unknown";

      const payload = {
        doctorId: formData.doctorId,
        doctorName: docName,
        scheduleOf: "Doctor",
        name: docName,
        fromDate: formData.scheduleDate[0],
        toDate: formData.scheduleDate[1]
      };

      if (editingItem) {
        await axios.put(`${BASE_URL}/holidays/${editingItem._id}`, payload);
        toast.success("Holiday updated");
      } else {
        await axios.post(`${BASE_URL}/holidays`, payload);
        toast.success("Holiday added");
      }
      toggleForm();
      fetchData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${BASE_URL}/holidays/${itemToDelete}`);
      toast.success("Deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
    setShowDeleteModal(false);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingItem(null);
    setFormData({ scheduleDate: [], doctorId: "" });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      scheduleDate: [new Date(item.fromDate), new Date(item.toDate)],
      doctorId: item.doctorId
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- EXPORTS ---
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedData.map(h => ({
      ID: h.id, Doctor: h.doctorName, From: h.from, To: h.to
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays");
    XLSX.writeFile(wb, "Holidays.xlsx");
  };

  const exportCSV = () => {
    const headers = ["ID,Doctor,From,To"];
    const rows = sortedData.map(h => `${h.id},${h.doctorName},${h.from},${h.to}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Holidays.csv";
    link.click();
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    try {
      const logoBase64 = await getBase64Image(`${window.location.origin}/logo.png`);
      if (logoBase64) doc.addImage(logoBase64, "PNG", 15, 10, 20, 20);
    } catch (e) { }
    doc.text("Clinic Holiday List", 14, 40);
    autoTable(doc, {
      head: [['ID', 'Doctor', 'From', 'To']],
      body: sortedData.map(h => [h.id, h.doctorName, h.from, h.to]),
      startY: 50,
    });
    doc.save("Holidays.pdf");
  };

  const handleExport = (type) => {
    if (type === "Excel") exportExcel();
    if (type === "CSV") exportCSV();
    if (type === "PDF") exportPDF();
  };

  // --- Sort & Filter Logic ---
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    return holidays.filter(item => {
      const searchMatch = !searchTerm || item.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());

      const idMatch = !filters.id || item.id.toString().includes(filters.id);
      const docMatch = !filters.doctor || item.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase());
      const fromMatch = !filters.fromDate || new Date(item.fromDate) >= new Date(filters.fromDate);
      const toMatch = !filters.toDate || new Date(item.toDate) <= new Date(filters.toDate);

      return searchMatch && idMatch && docMatch && fromMatch && toMatch;
    });
  }, [holidays, searchTerm, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key.startsWith('raw')) { valA = new Date(valA); valB = new Date(valB); }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const pageItems = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const SortIcon = ({ active, dir }) => {
    if (!active) return <FaSort size={10} className="text-muted opacity-50 ms-1" />;
    return dir === 'asc' ? <span className="ms-1">▲</span> : <span className="ms-1">▼</span>;
  };

  return (
    <div className="holiday-scope">
      <style>{holidayStyles}</style>
      <Toaster position="top-right" />

      <div className="container-fluid p-0">
        <div className="table-card">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold text-dark">Holiday List</h5>
              <FaQuestionCircle className="text-secondary opacity-50" size={14} />
            </div>
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3" onClick={toggleForm}>
              {showForm ? <><FaTimes /> Close</> : <><FaPlus /> Add Holiday</>}
            </button>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="bg-light p-4 rounded border mb-4 slide-down">
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Select Doctor *</label>
                    <select
                      className="form-select"
                      value={formData.doctorId}
                      onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                      required
                    >
                      <option value="">-- Select --</option>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Date Range *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><FaCalendarAlt className="text-muted" /></span>
                      <Flatpickr
                        className="form-control"
                        placeholder="Select Date Range"
                        options={{ mode: "range", dateFormat: "Y-m-d", minDate: "today" }}
                        value={formData.scheduleDate}
                        onChange={(date) => setFormData({ ...formData, scheduleDate: date })}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-end mt-3">
                  <button className="btn btn-primary btn-sm px-4">{editingItem ? "Update" : "Save"}</button>
                </div>
              </form>
            </div>
          )}

          {/* CONTROLS */}
          <div className="search-container">
            <div className="search-input-group">
              <FaSearch className="text-muted" />
              <input className="search-input" placeholder="Search doctor or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="export-group">
              <button className="btn-export excel" onClick={exportExcel}><FaFileExcel /></button>
              <button className="btn-export csv" onClick={exportCSV}><FaFileCsv /></button>
              <button className="btn-export pdf" onClick={exportPDF}><FaFilePdf /></button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-responsive border rounded">
            <table className="custom-table">
              <thead className="bg-light">
                <tr>
                  {/* <th style={{width:'60px'}} onClick={() => requestSort("id")} style={{cursor:'pointer'}}>ID <SortIcon active={sortConfig.key==='id'} dir={sortConfig.direction}/></th> */}
                  <th
                    style={{ width: '60px', cursor: 'pointer' }}
                    onClick={() => requestSort("id")}
                  >
                    ID <SortIcon active={sortConfig.key === "id"} direction={sortConfig.direction} />
                  </th>
                  <th onClick={() => requestSort("name")} style={{ cursor: 'pointer' }}>Doctor Name <SortIcon active={sortConfig.key === 'name'} dir={sortConfig.direction} /></th>
                  <th>From</th>
                  <th>To</th>
                  <th className="text-end">Action</th>
                </tr>
                {/* Filters */}
                <tr style={{ background: '#fff' }}>
                  <td><input className="filter-input" placeholder="ID" onChange={e => setFilters({ ...filters, id: e.target.value })} /></td>
                  <td><input className="filter-input" placeholder="Filter doctor" onChange={e => setFilters({ ...filters, doctor: e.target.value })} /></td>
                  <td><input type="date" className="filter-input" onChange={e => setFilters({ ...filters, fromDate: e.target.value })} /></td>
                  <td><input type="date" className="filter-input" onChange={e => setFilters({ ...filters, toDate: e.target.value })} /></td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No holidays found</td></tr>
                ) : (
                  pageItems.map((item, i) => (
                    <tr key={item._id}>
                      <td className="text-muted ps-3">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.from}</td>
                      <td>{item.to}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button className="action-btn edit" onClick={() => handleEdit(item)}><FaEdit /></button>
                          <button className="action-btn delete" onClick={() => { setItemToDelete(item._id); setShowDeleteModal(true); }}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">
              Rows per page:
              <select className="ms-1 border rounded p-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><FaChevronLeft /> Prev</button>
              <span className="small mx-2">Page {page} of {totalPages || 1}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <FaChevronRight /></button>
            </div>
          </div>

        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow">
                <div className="modal-body text-center p-4">
                  <h5 className="mb-2 text-danger">Confirm Delete</h5>
                  <p className="text-muted small mb-4">Are you sure?</p>
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
    </div>
  );
}