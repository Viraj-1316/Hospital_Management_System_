import React, { useEffect, useState } from "react";
import axios from "axios";
import DoctorLayout from "../layouts/DoctorLayout";
import { useNavigate } from "react-router-dom";
import { MdEditCalendar } from "react-icons/md";
import "../styles/DoctorPatients.css";
import PdfPreviewModal from "../components/PdfPreviewModal"; // <- fixed import
import "../styles/PdfPreviewModal.css"; // modal styles
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";
import API_BASE from "../../config";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [toggling, setToggling] = useState({}); // { id: true } while pending
  const navigate = useNavigate();
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedAppointmentForPdf, setSelectedAppointmentForPdf] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    title: "", 
    message: "", 
    action: null,
    confirmText: "Delete",
    confirmVariant: "danger"
  });

  useEffect(() => {
    let mounted = true;

    const normalize = (p, idx) => {
      const id = p._id ?? p.id ?? p.patientId ?? null;
      const nameFromParts = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      const name = p.name ?? (nameFromParts || p.fullName || "-");
      const email = p.email ?? p.contactEmail ?? p.mail ?? "-";
      const mobile = p.phone ?? p.mobile ?? p.contact ?? "-";
      const clinic = p.clinic ?? p.clinicName ?? "-";
      const createdAt = p.createdAt ?? p.registeredAt ?? p.created ?? null;
      const isActive =
        typeof p.isActive === "boolean"
          ? p.isActive
          : p.status
          ? p.status.toLowerCase() === "active"
          : false;

      return {
        ...p,
        _id: id,
        id,
        name,
        email,
        mobile,
        clinic,
        createdAt,
        isActive,
        friendlyIndex: p.customId ?? p.patientId ?? (idx + 1),
      };
    };

    const fetchPatients = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await axios.get(`${API_BASE}/patients`);
        if (!mounted) return;
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? res.data.patients ?? [];
        const normalized = raw.map((p, i) => normalize(p, i));
        setPatients(normalized);
      } catch (error) {
        console.error("Failed fetch patients:", error);
        if (mounted) setErr("Failed to load patients");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPatients();
    return () => {
      mounted = false;
    };
  }, []);

  // delete with optimistic UI
  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: "Delete Patient",
      message: "Delete this patient?",
      action: () => executeDelete(id),
      confirmText: "Delete",
      confirmVariant: "danger"
    });
  };

  const executeDelete = async (id) => {
    const prev = patients;
    setPatients((p) => p.filter((x) => (x._id || x.id) !== id));
    try {
      await axios.delete(`${API_BASE}/patients/${id}`);
      toast.success("Patient deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete. Reverting.");
      setPatients(prev);
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: "", message: "", action: null });
  };

  // Toggle isActive with fallback endpoints and optimistic UI + rollback
  const toggleStatus = async (patient) => {
    const id = patient._id || patient.id;
    if (!id) return;

    if (toggling[id]) return;
    setToggling((s) => ({ ...s, [id]: true }));

    const newActive = !patient.isActive;
    const prevPatients = patients;
    setPatients((prev) =>
      prev.map((p) => ((p._id || p.id) === id ? { ...p, isActive: newActive } : p))
    );

    const endpoints = [
      `${API_BASE}/patients/${id}`,
      `${API_BASE}/patients/${id}/status`,
      `${API_BASE}/api/patients/${id}`,
    ];

    let success = false;
    let lastError = null;

    for (const url of endpoints) {
      try {
        await axios.patch(url, { isActive: newActive });
        success = true;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`PATCH to ${url} failed:`, err.response?.status || err.message);
        try {
          await axios.patch(url, { status: newActive ? "active" : "inactive" });
          success = true;
          break;
        } catch (err2) {
          lastError = err2;
          console.warn(`PATCH (status payload) to ${url} failed:`, err2.response?.status || err2.message);
        }
      }
    }

    if (!success) {
      setPatients(prevPatients);
      console.error("Failed to update status on all endpoints:", lastError);
      toast.error("Failed to update status. See console for details.");
    }

    setToggling((s) => {
      const copy = { ...s };
      delete copy[id];
      return copy;
    });
  };

  const openPdfPreview = async (p) => {
  const patientId = p._id || p.id;

  try {
    const res = await axios.get(`${API_BASE}/patients/${patientId}/latest-appointment`);
    const appt = res.data;

    setSelectedAppointmentForPdf(appt._id);
    setPdfModalOpen(true);
  } catch (err) {
    toast.error("No appointment found for this patient.");
  }
};


  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return d;
    return date.toLocaleDateString();
  };

  return (
    <DoctorLayout>
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="fw-bold text-primary mb-0">Patients</h3>
          <div>
            <button className="btn btn-outline-primary me-2" onClick={() => navigate("/doctor/patients/import")}>
              <i className="fa fa-file-import me-1" /> Import data
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/doctor/patients/add")}>
              <i className="fa fa-plus me-1" /> Add patient
            </button>
          </div>
        </div>

        {err && <div className="alert alert-warning">{err}</div>}

        {loading ? (
          <div>Loading patients…</div>
        ) : (
          <div className="card p-3">
            {patients.length === 0 ? (
              <div className="p-4 text-center text-muted">No patients found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle doctor-patients-table">
                  <thead>
                    <tr>
                      <th style={{ width: "90px" }}>ID</th>
                      <th>Name</th>
                      <th>Clinic</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Registered ON</th>
                      <th>Status</th>
                      <th style={{ width: "240px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, idx) => {
                      const id = p._id || p.id;
                      const initials = (p.name || "U")
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={id ?? idx}>
                          <td>{p.friendlyIndex ?? id ?? "-"}</td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {p.avatar ? (
                                <img src={p.avatar} alt={p.name} className="patient-avatar" />
                              ) : (
                                <div className="patient-avatar placeholder">{initials}</div>
                              )}
                              <div>
                                <div className="fw-semibold">{p.name ?? "-"}</div>
                                <div className="text-muted small">
                                  {p.age ? `${p.age} yrs` : p.gender ?? ""}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>{p.clinic}</td>
                          <td>{p.email}</td>
                          <td>{p.mobile}</td>
                          <td>{formatDate(p.createdAt)}</td>

                          <td>
                            <div className={`status-badge ${p.isActive ? "active" : "inactive"}`}>
                              {p.isActive ? "ACTIVE" : "INACTIVE"}
                            </div>

                            <div
                              role="button"
                              onClick={() => toggleStatus(p)}
                              className={`status-toggle ${p.isActive ? "on" : "off"} ${
                                toggling[id] ? "disabled" : ""
                              }`}
                              aria-label="Toggle status"
                              style={{ marginTop: 8 }}
                            >
                              <span className="toggle-handle" />
                            </div>
                          </td>

                          <td className="text-center">
                            <div className="action-buttons d-flex justify-content-center align-items-center gap-2">
                              <button
                                title="Edit"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/doctor/patients/edit/${id}`)}
                              >
                                <i className="fa fa-pen" />
                              </button>

                              <button
                                title="View"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => navigate(`/doctor/patients/view/${id}`)}
                              >
                                <i className="fa fa-eye" />
                              </button>

                              <button
                                title="Appointments"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => navigate(`/doctor/appointments?patient=${id}`)}
                              >
                                <i className="fa fa-calendar-check" />
                              </button>

                              <button
                                title="Billing"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => navigate(`/doctor/billing?patient=${id}`)}
                              >
                                <MdEditCalendar size={18} />
                              </button>

                              <button
                                title="PDF Preview"
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => openPdfPreview(p)}
                              >
                                <i className="fa fa-file-pdf" />
                              </button>

                              <button
                                title="Delete"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(id)}
                              >
                                <i className="fa fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setSelectedAppointmentForPdf(null);
        }}
        appointmentId={selectedAppointmentForPdf}
        defaultFilename={`appointment-${selectedAppointmentForPdf || "file"}.pdf`}
        onEditLayout={(id) => {
          navigate(`/pdf-editor?appointmentId=${id}`);
          setPdfModalOpen(false);
        }}
      />
      
      <ConfirmationModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={closeConfirmModal}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
      />
    </DoctorLayout>
  );
}
