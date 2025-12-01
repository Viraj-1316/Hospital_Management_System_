import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFilePdf, FaEye } from "react-icons/fa"; 
import PatientLayout from "../layouts/PatientLayout"; 

const api = axios.create({ baseURL: "http://127.0.0.1:3001" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const reportStyles = `
  .report-scope .report-header-card { background: #fff; padding: 15px 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .report-scope .content-card { background: #fff; min-height: 200px; border: 1px solid #e9ecef; border-radius: 4px; padding: 0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .report-scope .table-header-row { display: flex; justify-content: space-between; padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
  .report-scope .table-header-text { font-size: 0.75rem; font-weight: 700; color: #6c757d; text-transform: uppercase; }
  .report-scope .report-link { text-decoration: none; color: #3b82f6; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .report-scope .report-link:hover { text-decoration: underline; }
  .report-scope .enc-id-text { font-family: monospace; font-weight: 700; color: #0d6efd; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; }
`;

export default function MedicalReport({ sidebarCollapsed, toggleSidebar }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // 1. Get ID (Try patientId first, fallback to userId)
        const patientId = localStorage.getItem("patientId") || localStorage.getItem("userId");
        


        if (!patientId) {
            console.warn("❌ No Patient ID found in localStorage");
            setLoading(false);
            return;
        }
        
        // 2. Fetch Encounters via Query Param (Server-Side Filtering)
        // We pass ?patientId=... so the backend does the filtering for us.
        // This avoids the Object vs String mismatch issues in frontend.
        const { data } = await api.get(`/encounters?patientId=${patientId}`);
        


        // 3. Extract Reports
        const aggregatedReports = data.flatMap(encounter => 
            (encounter.medicalReports || []).map(report => ({
                ...report,
                customEncounterId: encounter.encounterId || "Pending", 
                encounterDate: encounter.date 
            }))
        );


        setReports(aggregatedReports);

      } catch (e) {
        console.error("❌ Error fetching reports:", e);
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
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <style>{reportStyles}</style>
      
      <div className="container-fluid py-4 report-scope">
        
        <div className="d-flex justify-content-between align-items-center mb-3">
           <h3 className="fw-bold text-primary m-0">Medical Reports</h3>
        </div>

        <div className="content-card">
          
          {/* --- HEADERS --- */}
          <div className="table-header-row">
              <span className="table-header-text" style={{ width: '120px' }}>ENC ID</span>
              <span className="table-header-text" style={{ flex: 1 }}>REPORT NAME</span>
              <span className="table-header-text" style={{ width: '150px', textAlign: 'right' }}>DATE</span>
          </div>

          {/* --- DATA LIST --- */}
          {loading ? (
             <div className="text-center py-5 text-muted">Loading...</div>
          ) : reports.length > 0 ? (
             reports.map((r, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                   
                   {/* 1. Encounter ID Column */}
                   <div style={{ width: '120px' }}>
                      <span className="enc-id-text">
                        {r.customEncounterId}
                      </span>
                   </div>

                   {/* 2. Report Name & Link */}
                   <div style={{ flex: 1 }}>
                     <a 
                        href={`http://127.0.0.1:3001${r.file}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="report-link"
                     >
                        <FaFilePdf className="text-danger"/> {r.name || r.originalName || "Unnamed Report"} <FaEye size={12} className="text-muted ms-2"/>
                     </a>
                   </div>

                   {/* 3. Date */}
                   <div style={{ width: '150px', textAlign: 'right', color: '#666' }}>
                     {formatDate(r.date || r.encounterDate)}
                   </div>
                </div>
             ))
          ) : (
             <div className="text-center py-5 text-muted">
                No medical reports found for this patient.
             </div>
          )}
        </div>

        <div className="mt-3 text-muted small">
           © Western State Pain Institute
        </div>
      </div>
    </PatientLayout>
  );
}