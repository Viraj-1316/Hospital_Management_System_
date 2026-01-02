import React, { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../layouts/DoctorLayout";
import { useNavigate } from "react-router-dom";
import { MdEditCalendar } from "react-icons/md";
import "../styles/DoctorPatients.css";
import PdfPreviewModal from "../components/PdfPreviewModal";
import "../styles/PdfPreviewModal.css";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";
import API_BASE from "../../config";
import { 
  FaFileImport, FaPlus, FaEnvelope, FaPhone, 
  FaCalendarAlt, FaPen, FaEye, FaCalendarCheck, 
  FaFilePdf, FaTrash, FaMapMarkerAlt 
} from "react-icons/fa";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [toggling, setToggling] = useState({});
  const navigate = useNavigate();
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedAppointmentForPdf, setSelectedAppointmentForPdf] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, title: "", message: "", action: null, confirmText: "Delete", confirmVariant: "danger"
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = React.useRef(null);

  // --- Fetch Logic (Same as before) ---
  useEffect(() => {
    let mounted = true;
    const normalize = (p, idx) => {
      const id = p._id ?? p.id ?? p.patientId ?? null;
      const name = p.name ?? (`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()) ?? "-";
      return {
        ...p, _id: id, id, name,
        email: p.email ?? "-", mobile: p.phone ?? "-", clinic: p.clinic ?? "-",
        createdAt: p.createdAt ?? null,
        isActive: typeof p.isActive === "boolean" ? p.isActive : (p.status?.toLowerCase() === "active"),
        friendlyIndex: p.customId ?? (idx + 1),
      };
    };

    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/patients`);
        if (!mounted) return;
        const raw = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        setPatients(raw.map((p, i) => normalize(p, i)));
      } catch (error) {
        if (mounted) setErr("Failed to load patients");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPatients();
    return () => { mounted = false; };
  }, []);

  // --- Action Handlers (Same as before) ---
  const handleDelete = (id) => {
    setConfirmModal({
      show: true, title: "Delete Patient", message: "Delete this patient?",
      action: () => executeDelete(id), confirmText: "Delete", confirmVariant: "danger"
    });
  };

  const executeDelete = async (id) => {
    const prev = patients;
    setPatients((p) => p.filter((x) => (x._id || x.id) !== id));
    try {
      await axios.delete(`${API_BASE}/patients/${id}`);
      toast.success("Patient deleted");
    } catch (err) {
      toast.error("Failed to delete.");
      setPatients(prev);
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => setConfirmModal({ show: false, title: "", message: "", action: null });

  const toggleStatus = async (patient) => {
    const id = patient._id || patient.id;
    if (!id || toggling[id]) return;
    setToggling((s) => ({ ...s, [id]: true }));

    const newActive = !patient.isActive;
    const prevPatients = patients;
    setPatients((prev) => prev.map((p) => ((p._id || p.id) === id ? { ...p, isActive: newActive } : p)));

    try {
      await axios.patch(`${API_BASE}/patients/${id}`, { isActive: newActive });
    } catch (err) {
      setPatients(prevPatients);
      toast.error("Status update failed");
    }
    setToggling((s) => { const copy = { ...s }; delete copy[id]; return copy; });
  };

  const openPdfPreview = async (p) => {
    try {
      const res = await axios.get(`${API_BASE}/patients/${p._id || p.id}/latest-appointment`);
      setSelectedAppointmentForPdf(res.data._id);
      setPdfModalOpen(true);
    } catch (err) {
      toast.error("No appointment found.");
    }
  };

  // --- Import Logic ---
  const handleImportSubmit = async () => {
    if (!importFile) return toast.error("Select a file");
    const formData = new FormData();
    formData.append("file", importFile);
    const toastId = toast.loading("Importing...");
    try {
        await axios.post(`${API_BASE}/patients/import`, formData);
        toast.success("Imported!", { id: toastId });
        setIsImportModalOpen(false);
        window.location.reload(); 
    } catch (err) {
        toast.error("Failed to import", { id: toastId });
    }
  };

  return (
    <DoctorLayout>
      {/* MOBILE CARD CSS 
         - Hides Table Header on Mobile
         - Transforms Rows into clean Cards
         - Uses Flexbox for layout
      */}
      <style>{`
        @media (max-width: 768px) {
           .mobile-table thead { display: none; }
           .mobile-table, .mobile-table tbody, .mobile-table tr, .mobile-table td {
              display: block; width: 100%;
           }
           .mobile-table tr {
              margin-bottom: 16px;
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.04);
              border: 1px solid #f0f0f0;
              padding: 16px;
              position: relative;
           }
           /* Hide desktop cells we don't want in the card list flow */
           .mobile-table td { display: none; }
           
           /* Only show the custom "Mobile Card Content" cell */
           .mobile-table td.mobile-card-view {
              display: block;
              padding: 0;
              border: none;
           }
        }
        @media (min-width: 769px) {
           .mobile-card-view { display: none; }
        }
      `}</style>

      <div className="container-fluid py-4">
        
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
          <h3 className="fw-bold text-primary mb-0">Patients</h3>
          <div className="d-flex gap-2 w-100 w-md-auto">
            <button className="btn btn-outline-primary flex-grow-1 flex-md-grow-0 d-flex align-items-center justify-content-center gap-2" onClick={() => { setIsImportModalOpen(true); setImportFile(null); }}>
              <FaFileImport /> <span>Import</span>
            </button>
            <button className="btn btn-primary flex-grow-1 flex-md-grow-0 d-flex align-items-center justify-content-center gap-2" onClick={() => navigate("/doctor/AddPatient")}>
              <FaPlus /> <span>Add Patient</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted">Loading patients...</div>
        ) : (
          <div className="card border-0 shadow-sm bg-transparent bg-md-white">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 mobile-table">
                  <thead className="bg-light">
                    <tr>
                      <th style={{width:"60px"}}>ID</th>
                      <th>Name</th>
                      <th>Clinic</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, idx) => {
                      const id = p._id || p.id;
                      const initials = (p.name || "U").slice(0, 2).toUpperCase();

                      return (
                        <tr key={id ?? idx} className="bg-white">
                          
                          {/* --- DESKTOP CELLS (Hidden on Mobile via CSS) --- */}
                          <td className="fw-bold text-secondary">#{p.friendlyIndex}</td>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold" style={{width:'35px', height:'35px', fontSize:'0.85rem'}}>
                                {initials}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{p.name}</div>
                                <small className="text-muted">{p.age ? `${p.age} yrs` : p.gender}</small>
                              </div>
                            </div>
                          </td>
                          <td>{p.clinic}</td>
                          <td>{p.email}</td>
                          <td>{p.mobile}</td>
                          <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td>
                             <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                                  {p.isActive ? "Active" : "Inactive"}
                                </span>
                                <div role="button" onClick={() => toggleStatus(p)} className={`status-toggle ${p.isActive ? "on" : "off"}`}>
                                  <span className="toggle-handle" />
                                </div>
                             </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button title="Edit" className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/doctor/EditPatient/${id}`)}><FaPen /></button>
                              <button title="View" className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/doctor/patients/view/${id}`)}><FaEye /></button>
                              <button title="Delete" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(id)}><FaTrash /></button>
                            </div>
                          </td>

                          {/* --- MOBILE CARD VIEW (Visible Only on Mobile) --- */}
                          <td className="mobile-card-view">
                             {/* Card Header: Name, ID, Avatar */}
                             <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                                <div className="d-flex align-items-center gap-3">
                                   <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold" style={{width:'45px', height:'45px', fontSize:'1.1rem'}}>
                                      {initials}
                                   </div>
                                   <div>
                                      <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '1rem'}}>{p.name}</h6>
                                      <span className="badge bg-light text-secondary border rounded-pill mt-1">#{p.friendlyIndex}</span>
                                   </div>
                                </div>
                                <span className={`badge ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                                   {p.isActive ? "Active" : "Inactive"}
                                </span>
                             </div>

                             {/* Card Details: Grid Layout */}
                             <div className="row g-2 mb-3">
                                <div className="col-6">
                                   <small className="text-muted d-block mb-1">Mobile</small>
                                   <div className="d-flex align-items-center gap-2">
                                      <FaPhone className="text-success small" /> <span className="fw-medium text-dark">{p.mobile}</span>
                                   </div>
                                </div>
                                <div className="col-6">
                                   <small className="text-muted d-block mb-1">Clinic</small>
                                   <div className="d-flex align-items-center gap-2">
                                      <FaMapMarkerAlt className="text-danger small" /> <span className="fw-medium text-dark">{p.clinic}</span>
                                   </div>
                                </div>
                                <div className="col-12 mt-2">
                                   <small className="text-muted d-block mb-1">Email</small>
                                   <div className="d-flex align-items-center gap-2 text-break">
                                      <FaEnvelope className="text-primary small" /> <span className="text-dark">{p.email}</span>
                                   </div>
                                </div>
                             </div>

                             {/* Card Actions: Icon Bar */}
                             <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                <div className="d-flex gap-3">
                                   <button className="btn btn-link p-0 text-secondary" onClick={() => navigate(`/doctor/EditPatient/${id}`)}><FaPen size={18} /></button>
                                   <button className="btn btn-link p-0 text-info" onClick={() => navigate(`/doctor/appointments?patient=${id}`)}><FaCalendarCheck size={18} /></button>
                                   <button className="btn btn-link p-0 text-success" onClick={() => navigate(`/doctor/billing?patient=${id}`)}><MdEditCalendar size={20} /></button>
                                   <button className="btn btn-link p-0 text-dark" onClick={() => openPdfPreview(p)}><FaFilePdf size={18} /></button>
                                </div>
                                <button className="btn btn-link p-0 text-danger" onClick={() => handleDelete(id)}><FaTrash size={18} /></button>
                             </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <PdfPreviewModal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} appointmentId={selectedAppointmentForPdf} defaultFilename="file.pdf" />
      <ConfirmationModal show={confirmModal.show} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.action} onCancel={closeConfirmModal} />
      
      {isImportModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered p-3">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="fw-bold">Import Patients</h5>
                  <button type="button" className="btn-close" onClick={() => setIsImportModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                   <div className="p-4 border rounded bg-light text-center mb-3">
                      <FaFileImport size={30} className="text-primary mb-3" />
                      <input type="file" className="form-control" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} ref={fileInputRef} />
                      <small className="text-muted d-block mt-2">Upload CSV file only</small>
                   </div>
                   <button className="btn btn-primary w-100" onClick={handleImportSubmit}>Upload & Import</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DoctorLayout>
  );
}