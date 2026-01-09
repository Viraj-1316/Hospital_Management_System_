import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaTimes, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";
import "../../shared/styles/shared-components.css";
import API_BASE from "../../config";

export default function MedicalReport({ isEmbedded = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [medicalReports, setMedicalReports] = useState([]);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [currentEncounterId, setCurrentEncounterId] = useState(null); // Store encounter ID for the report being edited/added
  const [reportData, setReportData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0],
    file: null
  });
  const [loading, setLoading] = useState(true);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    fetchEncounterDetails();
  }, [id, patientId]);

  const fetchEncounterDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE}/encounters`);
      
      if (id) {
        // Single encounter mode
        const found = res.data.find(e => e._id === id);
        if (found) {
          setMedicalReports(found.medicalReports || []);
        }
      } else if (patientId) {
        // Patient mode: aggregate all reports
        const patientEncounters = res.data.filter(e => e.patientId === patientId || e.patient?._id === patientId);
        const allReports = patientEncounters.flatMap(e => 
          (e.medicalReports || []).map(r => ({ ...r, encounterId: e._id, encounterDate: e.date }))
        );
        setMedicalReports(allReports);
      }
    } catch (err) {
      console.error("Error fetching encounter details:", err);
      toast.error("Failed to load medical reports");
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setReportData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!reportData.name || !reportData.date) {
        toast.error("Please fill all required fields");
        return;
    }

    if (!editingReportId && !reportData.file) {
        toast.error("Please upload a file");
        return;
    }

    const formData = new FormData();
    formData.append("name", reportData.name);
    formData.append("date", reportData.date);
    if (reportData.file) {
        formData.append("report", reportData.file);
    }

    try {
      let res;
      // Use the specific encounter ID for this report, or the global ID if in single encounter mode
      const targetEncounterId = currentEncounterId || id;

      if (!targetEncounterId) {
        toast.error("Encounter ID missing");
        return;
      }

      if (editingReportId) {
         res = await axios.put(`${API_BASE}/encounters/${targetEncounterId}/reports/${editingReportId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
         });
         toast.success("Report updated successfully");
      } else {
         res = await axios.post(`${API_BASE}/encounters/${targetEncounterId}/reports`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
         });
         toast.success("Report added successfully");
      }
      
      // Refresh data
      fetchEncounterDetails();
      
      setIsReportFormOpen(false);
      setEditingReportId(null);
      setCurrentEncounterId(null);
      setReportData({ name: "", date: new Date().toISOString().split('T')[0], file: null });
    } catch (err) {
      console.error("Error saving report:", err);
      toast.error("Failed to save report");
    }
  };

  const handleEditReport = (report) => {
    setReportData({
        name: report.name,
        date: new Date(report.date).toISOString().split('T')[0],
        file: null 
    });
    setEditingReportId(report._id);
    // If we are in patient mode, the report object should have encounterId (added during fetch)
    // If in single encounter mode, use the global id
    setCurrentEncounterId(report.encounterId || id);
    setIsReportFormOpen(true);
  };

  const handleCancelReport = () => {
    setIsReportFormOpen(false);
    setEditingReportId(null);
    setCurrentEncounterId(null);
    setReportData({ name: "", date: new Date().toISOString().split('T')[0], file: null });
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    const targetEncounterId = reportToDelete.encounterId || id;
    if (!targetEncounterId) {
        toast.error("Encounter ID missing");
        setIsDeleteModalOpen(false);
        return;
    }

    try {
      await axios.delete(`${API_BASE}/encounters/${targetEncounterId}/reports/${reportToDelete._id}`);
      // Refresh data
      fetchEncounterDetails();
      toast.success("Report deleted");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report");
    } finally {
      setIsDeleteModalOpen(false);
      setReportToDelete(null);
    }
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className={isEmbedded ? "mt-3" : "container-fluid mt-3"}>
       {!isEmbedded && (
         <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
           <h5 className="fw-bold text-white mb-0">Medical Report</h5>
           <div className="d-flex gap-2">
               {!isReportFormOpen && id ? (
                  <button 
                    className="btn btn-light btn-sm d-flex align-items-center gap-1 text-primary"
                    onClick={() => {
                      setEditingReportId(null);
                      setCurrentEncounterId(id); // Only allow adding if we have a global ID (single encounter mode)
                      setReportData({ name: "", date: new Date().toISOString().split('T')[0], file: null });
                      setIsReportFormOpen(true);
                    }}
                  >
                    <FaPlus /> Add Medical Report
                  </button>
               ) : null }
                <button 
                  className="btn btn-light btn-sm d-flex align-items-center gap-1 text-dark"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>
           </div>
         </div>
       )}

       {isEmbedded && (
          <div className="d-flex justify-content-between align-items-center mb-3">
             <h6 className="fw-bold text-muted mb-0">Medical Reports</h6>
             {!isReportFormOpen && id ? (
                <button 
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => {
                    setEditingReportId(null);
                    setCurrentEncounterId(id);
                    setReportData({ name: "", date: new Date().toISOString().split('T')[0], file: null });
                    setIsReportFormOpen(true);
                  }}
                >
                  <FaPlus /> Add Report
                </button>
             ) : null}
          </div>
       )}

       <div className="bg-white shadow-sm rounded p-3">
         {isReportFormOpen && (
            <div className="mb-4 p-3 border rounded bg-light fade show">
              <h6 className="fw-bold text-primary mb-3">
                {editingReportId ? "Edit Medical Report" : "Add Medical Report"}
              </h6>
              <form onSubmit={handleSaveReport}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter report name"
                      name="name"
                      value={reportData.name}
                      onChange={handleReportChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Date <span className="text-danger">*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="date"
                      value={reportData.date}
                      onChange={handleReportChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">
                        Upload Report {editingReportId ? "" : <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <input 
                        type="file" 
                        className="form-control" 
                        onChange={handleFileChange}
                        required={!editingReportId}
                      />
                    </div>
                    {editingReportId && <small className="text-muted">Leave empty to keep existing file</small>}
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                   <button 
                     type="button" 
                     className="btn btn-outline-secondary btn-sm"
                     onClick={handleCancelReport}
                   >
                     Cancel
                   </button>
                   <button type="submit" className="btn btn-primary btn-sm">
                     <FaPlus className="me-1" /> {editingReportId ? "Update" : "Save"}
                   </button>
                </div>
              </form>
            </div>
         )}
         <div className="table-responsive">
           <table className="table align-middle">
             <thead className="table-light">
               <tr>
                 <th className="text-muted small fw-bold text-uppercase">Name</th>
                 {!id && <th className="text-muted small fw-bold text-uppercase text-center">Encounter Date</th>}
                 <th className="text-muted small fw-bold text-uppercase text-center">Date</th>
                 <th className="text-muted small fw-bold text-uppercase text-center">Action</th>
               </tr>
             </thead>
             <tbody>
               {medicalReports.length === 0 ? (
                 <tr>
                   <td colSpan={id ? "3" : "4"} className="text-center text-danger py-4">No patient report found</td>
                 </tr>
               ) : (
                 medicalReports.map((report, index) => (
                   <tr key={index}>
                     <td className="fw-semibold text-primary">{report.name}</td>
                     {!id && (
                        <td className="text-center">
                          {report.encounterDate ? new Date(report.encounterDate).toLocaleDateString() : "-"}
                        </td>
                      )}
                     <td className="text-center">
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                     </td>
                     <td className="text-center">
                       <div className="d-flex justify-content-center gap-2">
                         <button 
                           className="btn btn-sm btn-outline-primary"
                           onClick={() => handleEditReport(report)}
                           title="Edit"
                         >
                           <FaEdit />
                         </button>
                         <a 
                           href={`${API_BASE}${report.file}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="btn btn-sm btn-outline-primary"
                         >
                           <FaEye />
                         </a>
                         <button 
                           className="btn btn-sm btn-outline-danger"
                           onClick={() => handleDeleteClick(report)}
                           title="Delete"
                         >
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
       </div>

       {/* Delete Confirmation Modal */}
       {isDeleteModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => setIsDeleteModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this report?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
