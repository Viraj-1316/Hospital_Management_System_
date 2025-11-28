import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaQuestionCircle,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaTimes,
  FaFileCsv,
  FaFilePdf,
  FaFileExcel,
  FaSave,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";

const Holidays = () => {
  // --- Data State ---
  const [holidays, setHolidays] = useState([]);

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
  const [formData, setFormData] = useState({ scheduleDate: [] });

  // --- Filters ---
  const [filters, setFilters] = useState({ id: "", fromDate: "", toDate: "" });

  // sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ---------- sorting helpers ----------
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="opacity-50" size={10} />;
    return sortConfig.direction === "asc" ? <span style={{ fontSize: "12px" }}>▲</span> : <span style={{ fontSize: "12px" }}>▼</span>;
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];

      // Date sorting support
      if (sortConfig.key === "rawFrom" || sortConfig.key === "rawTo") {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      // if undefined/null, treat as smallest
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueB == null) return sortConfig.direction === "asc" ? 1 : -1;

      if (typeof valueA === "string" && typeof valueB === "string") {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  // ---------- end sorting helpers ----------

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("doctorToken");

      const res = await axios.get("http://localhost:3001/holidays", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHolidays(
        res.data.map((h) => ({
          id: h.autoId, // for UI
          _id: h._id, // REAL mongo id for delete/edit
          scheduleOf: h.scheduleOf,
          name: h.doctorName,
          rawFrom: h.fromDate, // needed for editing & comparisons
          rawTo: h.toDate, // needed for editing & comparisons
          from: new Date(h.fromDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          to: new Date(h.toDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        }))
      );
    } catch (err) {
      console.error("Error fetching holidays:", err);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  // 1. Trigger Delete Modal
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  // 2. Confirm Delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/holidays/${itemToDelete}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("doctorToken")}`,
        },
      });

      toast.success("Holiday deleted successfully!");
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchHolidays(); // Refresh
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete holiday");
    }
  };

  // 3. Toggle Form
  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingItem(null);
    setFormData({ scheduleDate: [] });
  };

  // 4. Edit Handler
  const handleEdit = (item) => {
    setShowForm(true);
    setEditingItem(item);

    // Convert rawFrom/rawTo → Date()
    const fromDate = new Date(item.rawFrom);
    const toDate = new Date(item.rawTo);

    setFormData({
      scheduleDate: [fromDate, toDate],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.scheduleDate || formData.scheduleDate.length !== 2) {
      toast.error("Please select a valid date range");
      return;
    }
    try {
      // get range from Flatpickr
      const [fromDate, toDate] = formData.scheduleDate;

      // ✅ get logged-in doctor data from localStorage
      const doctor = JSON.parse(localStorage.getItem("doctor"));
      const doctorId = doctor?._id || doctor?.id;

      if (!doctorId) {
        toast.error("Doctor ID not found — please log in again.");
        return;
      }

      // prepare payload
      const payload = editingItem ? { fromDate, toDate } : { doctorId, fromDate, toDate };

      if (editingItem) {
        await axios.put(`http://localhost:3001/holidays/${editingItem._id}`, payload);
        toast.success("Holiday updated!");
      } else {
        await axios.post("http://localhost:3001/holidays", payload);
        toast.success("Holiday added!");
      }

      fetchHolidays();
      toggleForm();
    } catch (err) {
      console.error("Error saving holiday:", err);
      toast.error("Failed to save holiday");
    }
  };

  // --- Components ---
  const SortableHeader = ({ label, sortKey }) => (
    <div
      className="d-flex justify-content-between align-items-center"
      style={{ cursor: "pointer" }}
      onClick={() => requestSort(sortKey)}
    >
      <span>{label}</span>
      {getSortIcon(sortKey)}
    </div>
  );

  const DateInput = ({ placeholder, value, onChange }) => (
    <div className="position-relative">
      <input
        type="text"
        className="form-control form-control-sm ps-2 pe-4"
        placeholder={placeholder}
        onFocus={(e) => (e.target.type = "date")}
        onBlur={(e) => {
          if (!e.target.value) e.target.type = "text";
        }}
        value={value}
        onChange={onChange}
        style={{ fontSize: "0.85rem", color: "#6c757d", borderRadius: "4px" }}
      />
      <FaCalendarAlt
        className="text-secondary position-absolute"
        style={{
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "12px",
          pointerEvents: "none",
        }}
      />
    </div>
  );

  
  // Filter function
  const filteredData = holidays.filter((h) => {
    const matchId = filters.id ? h.id?.toString().includes(filters.id) : true;

    const matchFrom = filters.fromDate ? new Date(h.rawFrom) >= new Date(filters.fromDate) : true;

    const matchTo = filters.toDate ? new Date(h.rawTo) <= new Date(filters.toDate) : true;

    const matchSearch = `${h.id} ${h.scheduleOf} ${h.name}`.toLowerCase().includes(searchTerm.toLowerCase());

    return matchId && matchFrom && matchTo && matchSearch;
  });

  // Apply sorting
  const sortedData = sortData(filteredData);

  // ---------------------- EXPORT FUNCTIONS ----------------------------

// Export to CSV
const exportCSV = () => {
  const headers = ["ID", "Schedule Of", "Name", "From Date", "To Date"];

  const rows = sortedData.map((h) => [
    h.id,
    h.scheduleOf,
    h.name,
    h.from,
    h.to,
  ]);

  let csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "Holiday_List.csv";
  link.click();
};

// Export to Excel
const exportExcel = () => {
  const worksheetData = sortedData.map((h) => ({
    ID: h.id,
    "Schedule Of": h.scheduleOf,
    Name: h.name,
    "From Date": h.from,
    "To Date": h.to,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
  XLSX.writeFile(workbook, "Holiday_List.xlsx");
};

// Export to PDF
const exportPDF = async () => {
  const doc = new jsPDF("p", "pt", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------- Hospital Logo ----------
  const logo = `${window.location.origin}/logo.png`;

  const imgWidth = 60;
  const imgHeight = 60;
  
  doc.addImage(logo, "PNG", 40, 20, imgWidth, imgHeight);

  // ---------- Title (Centered) ----------
  doc.setFontSize(20);
  doc.text("Holiday List", pageWidth / 2, 70, { align: "center" });

  // ---------- Prepare Table ----------
  const tableColumn = ["ID", "Schedule Of", "Name", "From Date", "To Date"];
  const tableRows = sortedData.map((h) => [
    h.id,
    h.scheduleOf,
    h.name,
    h.from,
    h.to,
  ]);

  // ---------- Table ----------
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 140,
    theme: "grid",
    styles: {
      fontSize: 10,
      halign: "center",
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [0, 180, 140],
      textColor: "#fff",
      halign: "center",
    },

    // ---------- Footer on every page ----------
    didDrawPage: (data) => {
      const currentPage = doc.internal.getNumberOfPages();

      // Date in footer (left)
      const date = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 40, pageHeight - 20);

      // Page number (right)
      doc.text(`Page ${currentPage}`, pageWidth - 60, pageHeight - 20);
    },
  });

  // Save file
  doc.save("Holiday_List.pdf");
};

// Handle export trigger
const handleExport = (type) => {
  if (type === "Excel") return exportExcel();
  if (type === "CSV") return exportCSV();
  if (type === "PDF") return exportPDF();
};


  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentData = sortedData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="position-relative">
      <style>
        {`
          .slide-down { animation: slideDown 0.3s ease-out; }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          
          .fade-in { animation: fadeIn 0.2s ease-in; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          /* Action Button Styles */
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

          /* Export Button Styling (Gray Border Fix) */
          .btn-export {
             width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;
             background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; transition: all 0.2s;
          }
          .btn-export:hover { background-color: #f8f9fa; border-color: #adb5bd; }
        `}
      </style>

      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold text-dark">Holiday List</h5>
          <FaQuestionCircle className="text-secondary opacity-75" size={14} style={{ cursor: "pointer" }} />
        </div>

        <button
          className={`btn ${showForm ? "btn-secondary" : "btn-primary"} d-flex align-items-center gap-2 px-3 fw-medium`}
          style={{ fontSize: "0.9rem" }}
          onClick={toggleForm}
        >
          {showForm ? (
            <>
              <FaTimes size={12} /> Close form
            </>
          ) : (
            <>
              <FaPlus size={10} /> Add holiday
            </>
          )}
        </button>
      </div>

      {/* --- FORM SECTION (Roll Down) --- */}
      {showForm && (
        <div className="bg-white p-4 rounded shadow-sm mb-4 border slide-down">
          <h6 className="fw-bold text-dark mb-3">{editingItem ? "Edit Holiday" : "Add Holiday"}</h6>
          <form onSubmit={handleSave}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Schedule date <span className="text-danger">*</span>
                </label>
                <Flatpickr
                  className="form-control"
                  placeholder="Select Date Range"
                  options={{
                    mode: "range",
                    dateFormat: "m/d/Y",
                    minDate: "today",
                  }}
                  value={formData.scheduleDate}
                  onChange={(date) => setFormData({ ...formData, scheduleDate: date })}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
              <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2">
                <FaSave /> Save
              </button>
              <button type="button" className="btn btn-outline-primary px-4" onClick={toggleForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SEARCH & EXPORT SECTION (SAME LINE) --- */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <div className="input-group border rounded bg-light flex-grow-1" style={{ overflow: "hidden" }}>
          <span className="input-group-text bg-transparent border-0 pe-2 ps-3 text-muted">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            className="form-control border-0 bg-transparent shadow-none"
            placeholder="Search holiday data by id,schedule of,name"
            style={{ fontSize: "0.95rem" }}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        {/* Export Buttons (Styled like DoctorSessions) */}
        <div className="d-flex gap-2">
          <button className="btn-export" onClick={() => handleExport("Excel")} title="Export Excel">
            <FaFileExcel className="text-success" size={18} />
          </button>
          <button className="btn-export" onClick={() => handleExport("CSV")} title="Export CSV">
            <FaFileCsv className="text-success" size={18} />
          </button>
          <button className="btn-export" onClick={() => handleExport("PDF")} title="Export PDF">
            <FaFilePdf className="text-danger" size={18} />
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="border rounded">
        <table className="table mb-0">
          <thead className="bg-light">
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 ps-4" style={{ width: "80px", fontSize: "0.9rem" }}>
                <SortableHeader label="ID" sortKey="id" />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: "15%", fontSize: "0.9rem" }}>
                <SortableHeader label="Schedule Of" sortKey="scheduleOf" />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: "25%", fontSize: "0.9rem" }}>
                <SortableHeader label="Name" sortKey="name" />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: "21%", fontSize: "0.9rem" }}>
                <SortableHeader label="From Date" sortKey="rawFrom" />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: "21%", fontSize: "0.9rem" }}>
                <SortableHeader label="To Date" sortKey="rawTo" />
              </th>
              <th className="py-3 fw-semibold text-secondary border-bottom-0 text-center pe-4" style={{ width: "100px", fontSize: "0.9rem" }}>
                Action
              </th>
            </tr>

            {/* Filter Row */}
            <tr className="bg-white border-bottom">
              <td className="p-2 ps-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="ID"
                  value={filters.id}
                  onChange={(e) => {
                    setFilters({ ...filters, id: e.target.value });
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: "0.85rem" }}
                />
              </td>
              <td className="p-2"></td>
              <td className="p-2"></td>
              <td className="p-2">
                <DateInput
                  placeholder="dd-mm-yyyy"
                  value={filters.fromDate}
                  onChange={(e) => {
                    setFilters({ ...filters, fromDate: e.target.value });
                    setCurrentPage(1);
                  }}
                />
              </td>
              <td className="p-2">
                <DateInput
                  placeholder="dd-mm-yyyy"
                  value={filters.toDate}
                  onChange={(e) => {
                    setFilters({ ...filters, toDate: e.target.value });
                    setCurrentPage(1);
                  }}
                />
              </td>
              <td className="p-2"></td>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center p-5 text-muted">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-5 text-muted border-0">
                  <div className="py-4">No Data Found</div>
                </td>
              </tr>
            ) : (
              currentData.map((h) => (
                <tr key={h.id} className="align-middle">
                  <td className="ps-4 text-secondary">{h.id}</td>
                  <td className="text-secondary">{h.scheduleOf}</td>
                  <td className="text-secondary">{h.name}</td>
                  <td className="text-secondary">{h.from}</td>
                  <td className="text-secondary">{h.to}</td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn-action-square" onClick={() => handleEdit(h)}>
                        <FaEdit />
                      </button>

                      <button className="btn-action-danger" onClick={() => handleDeleteClick(h._id)}>
                        <FaTrash />
                      </button>
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
          <select
            className="form-select form-select-sm border-0 bg-transparent fw-bold"
            style={{ width: "60px", boxShadow: "none" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div>
            <span>Page </span>
            <span className="fw-bold border px-2 py-1 rounded bg-white mx-1">{currentPage}</span>
            <span> of {totalPages}</span>
          </div>
          <div className="d-flex gap-1">
            <button
              className={`btn btn-sm d-flex align-items-center gap-1 ${currentPage === 1 ? "text-secondary disabled" : "btn-outline-primary"}`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft size={10} /> Prev
            </button>
            <button
              className={`btn btn-sm d-flex align-items-center gap-1 ${currentPage === totalPages ? "text-secondary disabled" : "btn-outline-primary"}`}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block fade-in" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-body p-4">
                  <h5 className="mb-2 text-dark fw-bold" style={{ fontSize: "1.1rem" }}>
                    Are you sure ?
                  </h5>
                  <p className="text-secondary mb-4" style={{ fontSize: "0.9rem" }}>
                    Press yes to delete.
                  </p>
                  <div className="d-flex justify-content-end gap-2">
                    <button className="btn btn-danger btn-sm px-3 fw-bold" onClick={confirmDelete}>
                      YES
                    </button>
                    <button className="btn btn-light btn-sm px-3 fw-bold border" onClick={() => setShowDeleteModal(false)}>
                      CANCEL
                    </button>
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

export default Holidays;
