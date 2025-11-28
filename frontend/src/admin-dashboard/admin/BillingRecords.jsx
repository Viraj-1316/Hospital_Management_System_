import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearch, FaPlus, FaTrash, FaEdit, FaSort } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BASE = "http://localhost:3001";

/* ---------- SCOPED CSS ---------- */
const billingStyles = `
  .billing-scope { font-family: 'Segoe UI', sans-serif; background-color: #f8f9fa; }
  .billing-scope .main-content { min-height: 100vh; transition: margin-left 0.3s; }
  
  .billing-scope .page-title-bar {
    background-color: #fff;
    padding: 15px 20px;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 20px;
  }
  .billing-scope .page-title {
    color: #495057;
    font-weight: 700;
    font-size: 1.1rem;
    margin: 0;
  }

  .billing-scope .table-card {
    background: white;
    border: 1px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    border-radius: 4px;
    margin: 0 20px;
  }

  .billing-scope .search-container {
    padding: 15px;
    border-bottom: 1px solid #f1f3f5;
  }
  .billing-scope .search-input {
    background-color: #fff;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding-left: 10px;
  }

  .billing-scope .custom-table {
    font-size: 0.85rem;
    width: 100%;
    min-width: 1400px;
  }
  .billing-scope .custom-table thead th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 700;
    border-bottom: 2px solid #dee2e6;
    padding: 12px 8px;
    vertical-align: middle;
    white-space: nowrap;
  }
  .billing-scope .custom-table tbody td {
    vertical-align: middle;
    padding: 10px 8px;
    border-bottom: 1px solid #e9ecef;
    color: #495057;
  }

  .billing-scope .filter-row td {
    background-color: #f8f9fa;
    padding: 5px;
  }
  .billing-scope .filter-input {
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    width: 100%;
  }

  .billing-scope .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .billing-scope .badge-paid { background-color: #d1e7dd; color: #0f5132; }
  .billing-scope .badge-unpaid { background-color: #f8d7da; color: #842029; }
  .billing-scope .badge-pending { background-color: #fff3cd; color: #664d03; }

  .billing-scope .pagination-bar {
    padding: 10px 20px;
    background-color: #f8f9fa;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }
  
  /* Highlight Custom Encounter ID */
  .billing-scope .enc-id-text { 
      font-family: monospace; 
      font-weight: 700; 
      color: #0d6efd; 
      background: #f0f9ff; 
      padding: 2px 6px; 
      border-radius: 4px; 
  }
`;

export default function BillingRecords({ sidebarCollapsed = false, toggleSidebar }) {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [encountersList, setEncountersList] = useState([]); // To store fetched encounters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filter, setFilter] = useState({
    id: "",
    encounterId: "", // Added filter for Enc ID
    doctor: "",
    clinic: "",
    patient: "",
    service: "",
    total: "",
    discount: "",
    due: "",
    date: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch BOTH Bills and Encounters in parallel
      const [billsRes, encRes] = await Promise.all([
          axios.get(`${BASE}/bills`),
          axios.get(`${BASE}/encounters`)
      ]);

      const allBills = billsRes.data || [];
      // Handle encounter response structure (array vs {encounters: []})
      const allEncounters = Array.isArray(encRes.data) ? encRes.data : (encRes.data.encounters || []);

      setBills(allBills);
      setEncountersList(allEncounters);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await axios.delete(`${BASE}/bills/${id}`);
      setBills((p) => p.filter((b) => b._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPage(1); 
  };

  // --- LOOKUP FUNCTION (Mongo ID -> ENC-XXXX) ---
  const lookupCustomId = (bill) => {
      // If the bill already has the short ID stored (new system), use it
      if (bill.encounterId && bill.encounterId.startsWith("ENC-")) {
          return bill.encounterId;
      }

      // Otherwise, lookup using the Mongo ID (old system)
      const mongoId = bill.encounterId || bill.encounter_id || bill.encounter;
      
      if (!mongoId) return "-";

      const found = encountersList.find(e => e._id === mongoId);
      if (found && found.encounterId) {
          return found.encounterId; 
      }
      
      // Fallback
      return typeof mongoId === 'string' ? mongoId.substring(0,8) + "..." : "-";
  };

  // Filtering logic
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return bills
      .filter((bill) => {
        // Get the Readable Encounter ID for searching/filtering
        const customEncId = lookupCustomId(bill);

        // Global Search
        if (q) {
          const combined =
            `${bill._id || ""} ${customEncId} ${bill.doctorName || ""} ${bill.clinicName || ""} ${bill.patientName || ""} ${(bill.services || []).join(" ")} ${bill.status || ""}`
              .toLowerCase();
          if (!combined.includes(q)) return false;
        }

        // Column Filters
        if (filter.id && !bill._id?.toLowerCase().includes(filter.id.toLowerCase())) return false;
        
        // Filter by Custom ID (ENC-XXXX)
        if (filter.encounterId && !customEncId.toLowerCase().includes(filter.encounterId.toLowerCase())) return false;

        if (filter.doctor && !bill.doctorName?.toLowerCase().includes(filter.doctor.toLowerCase())) return false;
        if (filter.clinic && !bill.clinicName?.toLowerCase().includes(filter.clinic.toLowerCase())) return false;
        if (filter.patient && !bill.patientName?.toLowerCase().includes(filter.patient.toLowerCase())) return false;
        if (filter.service && !(Array.isArray(bill.services) ? bill.services.join(" ") : "")
          .toLowerCase()
          .includes(filter.service.toLowerCase()))
          return false;
        
        if (filter.total && bill.totalAmount?.toString() !== filter.total) return false;
        if (filter.discount && bill.discount?.toString() !== filter.discount) return false;
        if (filter.due && bill.amountDue?.toString() !== filter.due) return false;

        if (filter.status && filter.status !== "Filter" && bill.status?.toLowerCase() !== filter.status.toLowerCase()) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bills, encountersList, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return "status-badge badge-paid";
    if (s === "unpaid") return "status-badge badge-unpaid";
    return "status-badge badge-pending";
  };

  return (
    <div className="d-flex billing-scope">
      <style>{billingStyles}</style>
      
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className="flex-grow-1 main-content"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-title-bar d-flex justify-content-between align-items-center">
           <h5 className="page-title">Billing Records</h5>
           <div className="services-actions">
              <button
                className="btn btn-light btn-sm border"
                onClick={() => navigate("/AddBill")}
              >
                <FaPlus className="me-1" /> Add Bill
              </button>
            </div>
        </div>

        <div className="table-card">
          
          <div className="search-container">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                className="form-control border-start-0 search-input shadow-none"
                placeholder="Search bills data..."
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table table-hover">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>ID <FaSort size={10} className="text-muted"/></th>
                  <th>Encounter ID <FaSort size={10} className="text-muted"/></th>
                  <th>Doctor Name <FaSort size={10} className="text-muted"/></th>
                  <th>Clinic Name <FaSort size={10} className="text-muted"/></th>
                  <th>Patient Name <FaSort size={10} className="text-muted"/></th>
                  <th>Services</th>
                  <th style={{ width: '80px' }}>Total <FaSort size={10} className="text-muted"/></th>
                  <th style={{ width: '80px' }}>Discount <FaSort size={10} className="text-muted"/></th>
                  <th style={{ width: '90px' }}>Amount due <FaSort size={10} className="text-muted"/></th>
                  <th style={{ width: '120px' }}>Date <FaSort size={10} className="text-muted"/></th>
                  <th style={{ width: '80px' }}>Status <FaSort size={10} className="text-muted"/></th>
                  <th style={{ width: '100px' }}>Action</th>
                </tr>

                <tr className="filter-row">
                  <td><input className="filter-input" placeholder="ID" onChange={e => handleFilterChange('id', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Enc ID" onChange={e => handleFilterChange('encounterId', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Doctor" onChange={e => handleFilterChange('doctor', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Clinic" onChange={e => handleFilterChange('clinic', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Patient" onChange={e => handleFilterChange('patient', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Service" onChange={e => handleFilterChange('service', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Total" onChange={e => handleFilterChange('total', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Disc" onChange={e => handleFilterChange('discount', e.target.value)} /></td>
                  <td><input className="filter-input" placeholder="Due" onChange={e => handleFilterChange('due', e.target.value)} /></td>
                  <td>
                     <div className="d-flex bg-white border rounded">
                       <input type="text" className="form-control border-0 p-1 py-0 shadow-none" style={{fontSize:'0.7rem', height: 24}} placeholder="Date" onFocus={e=>e.target.type='date'} onBlur={e=>e.target.type='text'} onChange={e => handleFilterChange('date', e.target.value)} />
                     </div>
                  </td>
                  <td>
                    <select className="form-select border-secondary shadow-none p-0 ps-1" style={{fontSize:'0.7rem', height: 26}} onChange={e => handleFilterChange('status', e.target.value)}>
                       <option>Filter</option>
                       <option value="paid">Paid</option>
                       <option value="unpaid">Unpaid</option>
                    </select>
                  </td>
                  <td></td>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="12" className="text-center py-5 text-muted">Loading bills...</td></tr>
                ) : error ? (
                  <tr><td colSpan="12" className="text-center py-5 text-danger">{error}</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-5" style={{ color: '#3b82f6', fontWeight: 500 }}>
                      No Data Found
                    </td>
                  </tr>
                ) : (
                  pageItems.map((bill, i) => (
                    <tr key={bill._id || i}>
                      {/* 1. ID Column: Database _id */}
                      <td>{bill._id ? bill._id.substring(0, 6) : "-"}</td>
                      
                      {/* 2. Encounter ID Column: Custom ID lookup */}
                      <td>
                          <span className="enc-id-text">
                             {lookupCustomId(bill)}
                          </span>
                      </td>

                      <td>{bill.doctorName}</td>
                      <td>{bill.clinicName}</td>
                      <td>{bill.patientName}</td>
                      <td>{bill.services?.join(", ")}</td>
                      <td>{bill.totalAmount}</td>
                      <td>{bill.discount}</td>
                      <td>{bill.amountDue}</td>
                      <td>{bill.date ? new Date(bill.date).toLocaleDateString() : "-"}</td>
                      <td>
                        <span className={getStatusBadgeClass(bill.status)}>
                          {bill.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm text-primary p-0"
                            onClick={() => navigate(`/EditBill/${bill._id}`)}
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="btn btn-sm text-danger p-0"
                            onClick={() => handleDelete(bill._id)}
                            title="Delete"
                          >
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

          <div className="pagination-bar">
             <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Rows per page:</span>
                <select 
                  className="form-select form-select-sm border-secondary shadow-none" 
                  style={{width: 60}} 
                  value={rowsPerPage} 
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                >
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                </select>
             </div>
             
             <div className="d-flex align-items-center gap-3">
                <span className="text-muted">
                   Page <span className="border px-2 py-1 rounded bg-white text-dark fw-bold">{page}</span> of {totalPages}
                </span>
                <div className="btn-group">
                   <button 
                     className="btn btn-sm btn-link text-secondary text-decoration-none" 
                     disabled={page <= 1} 
                     onClick={() => setPage(p => p - 1)}
                   >
                     Prev
                   </button>
                   <button 
                     className="btn btn-sm btn-link text-secondary text-decoration-none" 
                     disabled={page >= totalPages} 
                     onClick={() => setPage(p => p + 1)}
                   >
                     Next
                   </button>
                </div>
             </div>
          </div>

        </div>

        <div className="px-4 py-3 text-primary fw-bold small">
           © Western State Pain Institute
        </div>

      </div>
    </div>
  );
}