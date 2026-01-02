import React, { useEffect, useState } from "react";
import { FiSearch, FiPrinter } from "react-icons/fi";
import axios from "axios";
import PatientLayout from "../layouts/PatientLayout";
import API_BASE from "../../config";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const billsStyles = `
  .bills-scope .table-card { background: white; border: 1px solid #e9ecef; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .bills-scope .search-bar-container { padding: 15px; border-bottom: 1px solid #f1f3f5; }
  
  /* Desktop Table Styles */
  .bills-scope .custom-table { font-size: 0.85rem; width: 100%; border-collapse: collapse; }
  .bills-scope .custom-table th { background-color: #f8f9fa; color: #495057; padding: 12px; font-weight: 700; border-bottom: 2px solid #dee2e6; text-align: left; }
  .bills-scope .custom-table td { padding: 12px; border-bottom: 1px solid #e9ecef; vertical-align: middle; }
  
  .bills-scope .filter-input { font-size: 0.75rem; padding: 4px; border-radius: 4px; border: 1px solid #ced4da; width: 100%; }
  
  /* ID Highlight */
  .bills-scope .enc-id-text { 
      font-family: monospace; font-weight: 700; color: #0d6efd; 
      background: #f0f9ff; padding: 2px 6px; border-radius: 4px; 
  }
  .bills-scope .status-paid { background-color: #d1e7dd; color: #0f5132; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; }
  .bills-scope .status-unpaid { background-color: #f8d7da; color: #842029; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; }

  /* --- MOBILE CARD VIEW CSS --- */
  @media (max-width: 768px) {
      .bills-scope .table-responsive { overflow: visible; }
      
      /* Hide the Table Header */
      .bills-scope .custom-table thead { display: none; }
      
      /* Make rows display as blocks (cards) */
      .bills-scope .custom-table tr { 
          display: block; 
          margin-bottom: 1rem; 
          border: 1px solid #dee2e6; 
          border-radius: 8px; 
          padding: 15px; 
          background: #fff; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.03); 
      }
      
      /* Make cells display flex (row inside card) */
      .bills-scope .custom-table td { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border: none; 
          padding: 8px 0; 
          border-bottom: 1px solid #f0f0f0; 
          text-align: right; 
      }
      .bills-scope .custom-table td:last-child { border-bottom: none; }
      
      /* Add Labels via data-label */
      .bills-scope .custom-table td::before { 
          content: attr(data-label); 
          font-weight: 700; 
          color: #6c757d; 
          font-size: 0.85rem; 
          text-transform: uppercase;
          margin-right: 15px;
          text-align: left;
          min-width: 100px;
      }
      
      /* Action button alignment */
      .bills-scope .custom-table td[data-label="Action"] { 
          justify-content: flex-end; 
          margin-top: 5px; 
      }
  }
`;

export default function PatientBills({ sidebarCollapsed, toggleSidebar }) {
  const [rows, setRows] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Filters State
  const [filters, setFilters] = useState({
    encounterId: "", doctor: "", clinic: "", patient: "", service: "",
    total: "", discount: "", due: "", date: "", status: ""
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  // Handle PDF Function
  const handlePdf = (id) => {
    window.open(`${API_BASE}/bills/${id}/pdf`, "_blank");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const patientId = localStorage.getItem("patientId");

        // 1. Fetch BOTH Bills (Filtered) and Encounters
        const [billsRes, encRes] = await Promise.all([
          api.get(`/bills?patientId=${patientId}`),
          api.get("/encounters")
        ]);

        const myBills = Array.isArray(billsRes.data) ? billsRes.data : (billsRes.data.bills || []);
        const allEncounters = Array.isArray(encRes.data) ? encRes.data : (encRes.data.encounters || []);

        setEncounters(allEncounters);

        // 2. Apply Search & Column Filters (Client-side)
        let processedBills = myBills.filter(bill => {
          const customEncId = lookupCustomId(bill, allEncounters);

          // Global Search
          if (search) {
            const str = (JSON.stringify(bill) + customEncId).toLowerCase();
            if (!str.includes(search.toLowerCase())) return false;
          }

          // Column Filters
          if (filters.encounterId && !customEncId.toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
          if (filters.doctor && !bill.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) return false;

          return true;
        });

        setRows(processedBills);
        setTotal(processedBills.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, limit, search, filters]);

  const lookupCustomId = (bill, list = encounters) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    return s === 'paid' ? <span className="status-paid">PAID</span> : <span className="status-unpaid">{status || "UNPAID"}</span>;
  };

  return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <style>{billsStyles}</style>

      <div className="container-fluid py-4 bills-scope">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-primary m-0">Bills</h3>
        </div>

        <div className="table-card">
          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><FiSearch className="text-muted" /></span>
              <input
                type="text"
                className="form-control border-start-0 shadow-none"
                placeholder="Search bills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive bg-transparent border-0">
            <table className="table mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>ID</th>
                  <th>Encounter ID</th>
                  <th>Doctor</th>
                  <th>Clinic</th>
                  <th>Patient</th>
                  <th>Services</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Disc</th>
                  <th>Due</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                {/* Filter Row - Hidden on Mobile via CSS */}
                <tr className="bg-light">
                  <td className="p-2"></td>
                  <td className="p-2"><input className="filter-input" placeholder="Enc ID" onChange={e => handleFilter('encounterId', e.target.value)} /></td>
                  <td className="p-2"><input className="filter-input" placeholder="Doctor" onChange={e => handleFilter('doctor', e.target.value)} /></td>
                  <td className="p-2" colSpan={10}></td>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="13" className="text-center py-5">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="13" className="text-center py-5 text-muted">No Data Found</td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="bg-white">
                      <td data-label="ID">{(page - 1) * limit + i + 1}</td>
                      <td data-label="Encounter ID"><span className="enc-id-text">{lookupCustomId(row)}</span></td>
                      <td data-label="Doctor">{row.doctorName}</td>
                      <td data-label="Clinic">{row.clinicName}</td>
                      <td data-label="Patient">{row.patientName}</td>
                      <td data-label="Services">{Array.isArray(row.services) ? row.services.map(s => (typeof s === 'string' ? s : s.name)).join(", ") : row.services}</td>
                      <td data-label="Tax">{row.taxAmount || row.tax || 0}</td>
                      <td data-label="Total">{row.totalAmount}</td>
                      <td data-label="Disc">{row.discount}</td>
                      <td data-label="Due">{row.amountDue}</td>
                      <td data-label="Date">{formatDate(row.date)}</td>
                      <td data-label="Status">{getStatusBadge(row.status)}</td>
                      <td data-label="Action">
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => handlePdf(row._id)}
                          title="Print PDF"
                        >
                          <FiPrinter /> Print PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}