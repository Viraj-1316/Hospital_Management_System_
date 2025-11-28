import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPrinter
} from "react-icons/fi";
import { FaSort } from "react-icons/fa";
import axios from "axios";
import Navbar from "../components/PatientNavbar";
import Sidebar from "../components/PatientSidebar";

const api = axios.create({ baseURL: "http://127.0.0.1:3001" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const billsStyles = `
  .bills-scope { font-family: 'Segoe UI', sans-serif; }
  .bills-scope .main-content { background-color: #f8f9fa; min-height: 100vh; transition: margin-left 0.3s; }
  .bills-scope .blue-header { background-color: #fff; border-bottom: 1px solid #e9ecef; padding: 15px 20px; }
  .bills-scope .table-card { background: white; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border-radius: 4px; margin: 20px; }
  .bills-scope .search-bar-container { padding: 15px; border-bottom: 1px solid #f1f3f5; }
  .bills-scope .custom-table { font-size: 0.85rem; width: 100%; min-width: 1400px; }
  .bills-scope .custom-table th { font-weight: 700; color: #495057; background-color: #fff; border-bottom: 2px solid #dee2e6; vertical-align: middle; padding: 12px 8px; white-space: nowrap; }
  .bills-scope .filter-input { font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; border: 1px solid #ced4da; width: 100%; }
  .bills-scope .no-data { color: #3b82f6; font-weight: 500; padding: 40px; text-align: center; }
  .bills-scope .pagination-bar { padding: 10px 20px; background-color: #f8f9fa; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
  .bills-scope .status-paid { color: #198754; background-color: #d1e7dd; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
  .bills-scope .status-unpaid { color: #dc3545; background-color: #f8d7da; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
  
  /* Highlight the Encounter ID */
  .bills-scope .enc-id-text { 
      font-family: monospace; 
      font-weight: 700; 
      color: #0d6efd; 
      background: #f0f9ff; 
      padding: 2px 6px; 
      border-radius: 4px; 
  }
`;

export default function PatientBills({ sidebarCollapsed, toggleSidebar }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [filters, setFilters] = useState({
    encounterId: "", doctor: "", clinic: "", patient: "", service: "", 
    total: "", discount: "", due: "", date: "", status: ""
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const patientId = localStorage.getItem("patientId");
        // We still fetch patient details just to be safe with name matching
        const patientStr = localStorage.getItem("patient");
        const patientObj = patientStr ? JSON.parse(patientStr) : null;
        
        const myFullName = patientObj 
            ? `${patientObj.firstName || ""} ${patientObj.lastName || ""}`.trim().toLowerCase()
            : "";

        // 1. Fetch ONLY Bills (Encounters fetch removed as it's no longer needed)
        const { data } = await api.get("/bills");
        const allBills = Array.isArray(data) ? data : (data.bills || []);

        // 2. Filter for THIS patient
        const myBills = allBills.filter(b => {
            const billPId = b.patientId || b.patient?._id || b.patient;
            if (patientId && billPId && billPId.toString() === patientId.toString()) return true;
            if (b.patientName && myFullName && b.patientName.toLowerCase() === myFullName) return true;
            return false;
        });

        // 3. Apply Local Search & Filters
        let processedBills = myBills.filter(bill => {
            if(search) {
                const searchStr = JSON.stringify(bill).toLowerCase();
                if(!searchStr.includes(search.toLowerCase())) return false;
            }
            
            // Read ID directly from the bill record
            const encId = bill.encounterId || ""; 
            
            if(filters.encounterId && !encId.toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
            if(filters.doctor && !bill.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) return false;
            if(filters.status && filters.status !== "Filter" && bill.status?.toLowerCase() !== filters.status.toLowerCase()) return false;
            
            return true;
        });

        setRows(processedBills);
        setTotal(processedBills.length);

      } catch (e) {
        console.error("Error fetching bills:", e);
        setRows([]); 
      }
      setLoading(false);
    };

    fetchBills();
  }, [page, limit, search, filters]); 

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
      const s = (status || "").toLowerCase();
      if(s === 'paid') return <span className="status-paid">PAID</span>;
      return <span className="status-unpaid">{status || "UNPAID"}</span>;
  };

  return (
    <div className="d-flex bills-scope">
      <style>{billsStyles}</style>
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex-grow-1 main-content" style={{ marginLeft: sidebarCollapsed ? 64 : 250 }}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="blue-header">
           <h5 className="mb-0 fw-bold text-dark">Bills</h5>
        </div>

        <div className="table-card">
          <div className="search-bar-container">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-0"><FiSearch size={18} className="text-muted"/></span>
              <input 
                type="text" 
                className="form-control border-0 bg-transparent shadow-none" 
                placeholder="Search bills data..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{width: '50px'}}>ID <FaSort size={10}/></th>
                  <th>Encounter ID <FaSort size={10}/></th>
                  <th>Doctor Name <FaSort size={10}/></th>
                  <th>Clinic Name <FaSort size={10}/></th>
                  <th>Patient Name <FaSort size={10}/></th>
                  <th>Services</th>
                  <th style={{width: '80px'}}>Total <FaSort size={10}/></th>
                  <th>Discount <FaSort size={10}/></th>
                  <th>Amount due <FaSort size={10}/></th>
                  <th>Date <FaSort size={10}/></th>
                  <th>Status <FaSort size={10}/></th>
                  <th>Action</th>
                </tr>
                <tr className="bg-light">
                  <td className="p-2"><input className="form-control filter-input" disabled placeholder="|"/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Enc ID" onChange={e=>handleFilter('encounterId', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Doctor" onChange={e=>handleFilter('doctor', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Clinic" onChange={e=>handleFilter('clinic', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Patient" onChange={e=>handleFilter('patient', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Service" onChange={e=>handleFilter('service', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Total" onChange={e=>handleFilter('total', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Disc" onChange={e=>handleFilter('discount', e.target.value)}/></td>
                  <td className="p-2"><input className="form-control filter-input" placeholder="Due" onChange={e=>handleFilter('due', e.target.value)}/></td>
                  <td className="p-2">
                      <input type="text" className="form-control filter-input" placeholder="Date" onFocus={e=>e.target.type='date'} onBlur={e=>e.target.type='text'}/>
                  </td>
                  <td className="p-2">
                    <select className="form-select filter-input" onChange={e=>handleFilter('status', e.target.value)}>
                       <option value="Filter">Filter</option>
                       <option value="paid">Paid</option>
                       <option value="unpaid">Unpaid</option>
                    </select>
                  </td>
                  <td className="p-2"></td>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="12" className="text-center py-5">Loading...</td></tr>
                ) : rows.length === 0 ? (
                   <tr>
                     <td colSpan="12" className="no-data">No Data Found</td>
                   </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i}>
                      {/* 1. Sequential ID */}
                      <td>{(page - 1) * limit + i + 1}</td>
                      
                      {/* 2. ENCOUNTER ID FROM DATABASE */}
                      <td>
                          <span className="enc-id-text">
                             {row.encounterId || "-"}
                          </span>
                      </td>
                      
                      <td>{row.doctorName || row.doctor?.name || "-"}</td>
                      <td>{row.clinicName || row.clinic?.name || "-"}</td>
                      <td>{row.patientName || row.patient?.name || "Me"}</td>
                      <td>{Array.isArray(row.services) ? row.services.join(", ") : (row.services || "-")}</td>
                      <td>{row.totalAmount}</td>
                      <td>{row.discount}</td>
                      <td>{row.amountDue}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>{getStatusBadge(row.status)}</td>
                      <td>
                         <button className="btn btn-sm btn-link text-primary" title="Print/View">
                            <FiPrinter />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
             <div className="d-flex align-items-center gap-2">
                Rows per page:
                <select className="form-select form-select-sm" style={{width: 60}} value={limit} onChange={e=>setLimit(e.target.value)}>
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                </select>
             </div>
             <div className="d-flex align-items-center gap-3">
                <span>Page <span className="border px-2 py-1 rounded bg-white">{page}</span> of {Math.max(1, Math.ceil(total/limit))}</span>
                <div className="btn-group">
                   <button className="btn btn-sm btn-link text-secondary text-decoration-none" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><FiChevronLeft/> Prev</button>
                   <button className="btn btn-sm btn-link text-secondary text-decoration-none" disabled={page*limit >= total} onClick={()=>setPage(p=>p+1)}>Next <FiChevronRight/></button>
                </div>
             </div>
          </div>
        </div>

        <div className="px-4 py-2 small text-primary fw-bold">
           © Western State Pain Institute
        </div>

      </div>
    </div>
  );
}