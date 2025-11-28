import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFilePdf, FaEye } from "react-icons/fa"; 
import Navbar from "../components/PatientNavbar";
import Sidebar from "../components/PatientSidebar";

const api = axios.create({ baseURL: "http://127.0.0.1:3001" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const reportStyles = `
  .report-scope { font-family: 'Segoe UI', sans-serif; background-color: #f8f9fa; }
  .report-scope .main-content { min-height: 100vh; transition: margin-left 0.3s; }
  .report-scope .report-header-card { background: #fff; padding: 15px 20px; border-bottom: 1px solid #e9ecef; }
  .report-scope .report-title { color: #495057; font-weight: 600; font-size: 1.1rem; margin: 0; }
  .report-scope .content-card { background: #fff; min-height: 200px; border-top: 1px solid #e9ecef; padding: 0; }
  .report-scope .table-header-row { display: flex; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #dee2e6; }
  .report-scope .table-header-text { font-size: 0.75rem; font-weight: 700; color: #6c757d; text-transform: uppercase; }
  .report-scope .empty-state { padding: 40px; text-align: center; color: #dc3545; font-weight: 500; font-size: 0.95rem; }
  .report-scope .footer-text { color: #3b82f6; font-size: 0.8rem; font-weight: 600; padding: 20px; }
  .report-scope .report-link { text-decoration: none; color: #3b82f6; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .report-scope .report-link:hover { text-decoration: underline; }
`;

export default function MedicalReport({ sidebarCollapsed, toggleSidebar }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // 1. Fetch ALL Encounters
        const { data } = await api.get("/encounters");

        // ---------------------------------------------------------
        // BYPASS: SHOW ALL DATA (FOR TESTING ONLY)
        // ---------------------------------------------------------
        const myEncounters = data; 
        // We removed the .filter() here so you can see the UI works
        // ---------------------------------------------------------

        // 2. Extract Reports
        const aggregatedReports = myEncounters.flatMap(encounter => 
            (encounter.medicalReports || []).map(report => ({
                ...report,
                encounterDate: encounter.date 
            }))
        );

        setReports(aggregatedReports);
      } catch (e) {
        console.error("Error fetching reports:", e);
        setReports([]); 
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="d-flex report-scope">
      <style>{reportStyles}</style>
      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex-grow-1 main-content" style={{ marginLeft: sidebarCollapsed ? 64 : 250 }}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="report-header-card">
          <h5 className="report-title">Medical Report</h5>
        </div>

        <div className="content-card">
          <div className="table-header-row">
             <span className="table-header-text" style={{ flex: 1 }}>NAME</span>
             <span className="table-header-text" style={{ width: '150px', textAlign: 'right' }}>DATE</span>
          </div>

          {loading ? (
             <div className="text-center py-4 text-muted">Loading...</div>
          ) : reports.length > 0 ? (
             reports.map((r, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                   <div style={{ flex: 1 }}>
                     <a 
                        href={`http://127.0.0.1:3001${r.file}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="report-link"
                     >
                        <FaFilePdf /> {r.name} <FaEye size={12} className="text-muted ms-2"/>
                     </a>
                   </div>
                   <div style={{ width: '150px', textAlign: 'right', color: '#666' }}>
                     {formatDate(r.date)}
                   </div>
                </div>
             ))
          ) : (
             <div className="empty-state">
                No patient report found
             </div>
          )}
        </div>

        <div className="footer-text">
           © Western State Pain Institute
        </div>
      </div>
    </div>
  );
}