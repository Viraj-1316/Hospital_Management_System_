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
  .bills-scope .custom-table { font-size: 0.85rem; width: 100%; min-width: 1200px; }
  .bills-scope .custom-table th { background-color: #f8f9fa; color: #495057; padding: 12px; font-weight: 700; }
  .bills-scope .filter-input { font-size: 0.75rem; padding: 4px; border-radius: 4px; border: 1px solid #ced4da; width: 100%; }
  
  /* ID Highlight */
  .bills-scope .enc-id-text { 
      font-family: monospace; font-weight: 700; color: #0d6efd; 
      background: #f0f9ff; padding: 2px 6px; border-radius: 4px; 
  }
  .bills-scope .status-paid { background-color: #d1e7dd; color: #0f5132; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; }
  .bills-scope .status-unpaid { background-color: #f8d7da; color: #842029; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; }
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
        
        // 1. Fetch BOTH Bills and Encounters
        const [billsRes, encRes] = await Promise.all([
            api.get("/bills"),
            api.get("/encounters")
        ]);

        const allBills = Array.isArray(billsRes.data) ? billsRes.data : (billsRes.data.bills || []);
        const allEncounters = Array.isArray(encRes.data) ? encRes.data : (encRes.data.encounters || []);
        
        setEncounters(allEncounters);

        // 2. Filter Bills for THIS patient
        const myBills = allBills.filter(b => {
            const pId = b.patientId || b.patient?._id || b.patient;
            return pId?.toString() === patientId?.toString();
        });

        // 3. Apply Filters
        let processedBills = myBills.filter(bill => {
            const customEncId = lookupCustomId(bill, allEncounters);
            
            // Global Search
            if(search) {
                const str = (JSON.stringify(bill) + customEncId).toLowerCase();
                if(!str.includes(search.toLowerCase())) return false;
            }

            // Column Filters
            if(filters.encounterId && !customEncId.toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
            if(filters.doctor && !bill.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) return false;
            
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
      const refId = bill.encounterId || bill.encounter_id || bill.encounter;
      if (!refId) return "-";
      if (refId.toString().startsWith("ENC-")) return refId;
      const found = list.find(e => e._id === refId);
      return found ? (found.encounterId || "Pending") : refId.substring(0,8)+"...";
  };

  const formatDate = (dateString) => {
    if(!dateString) return "-";
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
              <span className="input-group-text bg-white border-end-0"><FiSearch className="text-muted"/></span>
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
          <div className="table-responsive">
            <table className="table table-hover mb-0 custom-table">
              <thead>
                <tr>
                   <th style={{width:'50px'}}>ID</th>
                   <th>Encounter ID</th>
                   <th>Doctor</th>
                   <th>Clinic</th>
                   <th>Patient</th>
                   <th>Services</th>
                   {/* Added Tax Column Header */}
                   <th>Tax</th>
                   <th>Total</th>
                   <th>Disc</th>
                   <th>Due</th>
                   <th>Date</th>
                   <th>Status</th>
                   <th>Action</th>
                </tr>
                <tr className="bg-light">
                   <td className="p-2"></td>
                   <td className="p-2"><input className="filter-input" placeholder="Enc ID" onChange={e=>handleFilter('encounterId', e.target.value)}/></td>
                   <td className="p-2"><input className="filter-input" placeholder="Doctor" onChange={e=>handleFilter('doctor', e.target.value)}/></td>
                   <td className="p-2"></td> {/* Clinic */}
                   <td className="p-2"></td> {/* Patient */}
                   <td className="p-2"></td> {/* Services */}
                   <td className="p-2"></td> {/* Tax placeholder */}
                   <td className="p-2"></td> {/* Total */}
                   <td className="p-2"></td> {/* Disc */}
                   <td className="p-2"></td> {/* Due */}
                   <td className="p-2"></td> {/* Date */}
                   <td className="p-2"></td> {/* Status */}
                   <td className="p-2"></td> {/* Action */}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="13" className="text-center py-5">Loading...</td></tr> : 
                 rows.length === 0 ? <tr><td colSpan="13" className="text-center py-5 text-muted">No Data Found</td></tr> :
                 rows.map((row, i) => (
                    <tr key={i}>
                        <td>{(page - 1) * limit + i + 1}</td>
                        <td><span className="enc-id-text">{lookupCustomId(row)}</span></td>
                        <td>{row.doctorName}</td>
                        <td>{row.clinicName}</td>
                        <td>{row.patientName}</td>
                        <td>{Array.isArray(row.services) ? row.services.join(", ") : row.services}</td>
                        
                        {/* Display Tax: Checks for taxAmount, tax, or defaults to 0 */}
                        <td>{row.taxAmount || row.tax || 0}</td>
                        
                        <td>{row.totalAmount}</td>
                        <td>{row.discount}</td>
                        <td>{row.amountDue}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{getStatusBadge(row.status)}</td>
                        <td>
                            <button 
                                className="btn btn-sm btn-outline-dark" 
                                onClick={() => handlePdf(row._id)}
                                title="Print PDF"
                            >
                                <FiPrinter/>
                            </button>
                        </td>
                    </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}