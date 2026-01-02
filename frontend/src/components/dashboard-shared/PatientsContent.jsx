import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../config";
import "bootstrap/dist/css/bootstrap.min.css";
// We don't import shared css here, assuming parent wrapper loads it or it's global
import { FaSearch, FaPlus, FaDownload, FaCalendarAlt, FaFileMedical, FaFileAlt, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { RiDeleteBinFill } from "react-icons/ri";
import { MdEdit } from "react-icons/md";
import { toast } from "react-hot-toast";

const PatientsContent = ({ basePath = "/admin" }) => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");

    // Import modal state
    const [importOpen, setImportOpen] = useState(false);
    const [importType, setImportType] = useState("csv");
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const handleEdit = (id) => {
        // Dynamic navigation based on basePath
        navigate(`${basePath}/EditPatient/${id}`);
    };

    const confirmDelete = (id) => {
        setDeleteModal({ show: true, id });
    };

    const executeDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await axios.delete(`${API_BASE}/patients/${deleteModal.id}`);
            toast.success("Patient deleted successfully!");
            setPatients((prev) => prev.filter((p) => p._id !== deleteModal.id));
        } catch (error) {
            console.error("Error deleting patient:", error);
            toast.error("Failed to delete patient.");
        } finally {
            setDeleteModal({ show: false, id: null });
        }
    };

    const handleResendCredentials = async (id) => {
        try {
            toast.loading("Sending credentials...", { id: "resend" });
            await axios.post(`${API_BASE}/patients/${id}/resend-credentials`);
            toast.success("Credentials sent successfully!", { id: "resend" });
        } catch (error) {
            console.error("Error resending credentials:", error);
            toast.error("Failed to send credentials.", { id: "resend" });
        }
    };

    // Fetch patients
    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${API_BASE}/patients`);
            setPatients(res.data || []);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // Import modal handlers
    const openImportModal = () => {
        setImportOpen(true);
        setImportFile(null);
    };

    const closeImportModal = () => {
        if (!importing) setImportOpen(false);
    };

    const handleFileChange = (e) => {
        setImportFile(e.target.files[0] || null);
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return toast.error("Select a CSV file");

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append("file", importFile);
            formData.append("type", importType);

            const res = await axios.post(
                `${API_BASE}/patients/import`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            toast.success(`Imported ${res.data?.count || 0} patients`);
            setImportOpen(false);
            fetchPatients();
        } catch (err) {
            console.error(err);
            toast.error("Error importing patients");
        } finally {
            setImporting(false);
        }
    };

    const filteredPatients = patients.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* PAGE CONTENT */}
            <div className="container-fluid mt-3">
                {/* TOP BLUE BAR */}
                <div className="services-topbar services-card d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-white mb-0">Patients List</h5>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                            onClick={openImportModal}
                        >
                            <FaDownload /> Import Patients
                        </button>

                        <button
                            className="btn btn-light btn-sm d-flex align-items-center gap-2"
                            onClick={() => navigate(`${basePath}/AddPatient`)}
                        >
                            <FaPlus /> Add Patient
                        </button>
                    </div>
                </div>

                {/* SEARCH CARD */}
                <div className="card p-3 mt-3 services-card">
                    <div className="input-group" style={{ maxWidth: 400 }}>
                        <span className="input-group-text bg-white border-end-0">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search patient by name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* PATIENT TABLE */}
                <div className="card p-3 mt-3 services-card">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Clinic</th>
                                <th>Email</th>
                                <th>Mobile</th>
                                <th>Registered On</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">
                                        No patients found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((p, index) => (
                                    <tr key={p._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {p.firstName} {p.lastName}
                                        </td>
                                        <td>{p.clinic}</td>
                                        <td>{p.email}</td>
                                        <td>{p.phone}</td>
                                        <td>{new Date(p.createdAt).toISOString().split("T")[0]}</td>
                                        <td>
                                            <span
                                                className={`badge px-3 py-2 ${p.isActive ? "bg-success" : "bg-secondary"
                                                    }`}
                                            >
                                                {p.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Edit"
                                                    onClick={() => handleEdit(p._id)}
                                                >
                                                    <MdEdit />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    title="Appointments"
                                                    onClick={() => navigate(`${basePath}/appointments?patientId=${p._id}`)}
                                                >
                                                    <FaCalendarAlt />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Encounter"
                                                    onClick={() => {
                                                        // For clinic-dashboard, use encounter-list path
                                                        const encounterPath = basePath === "/clinic-dashboard" 
                                                            ? `${basePath}/encounter-list?patientId=${p._id}`
                                                            : `${basePath}/encounters?patientId=${p._id}`;
                                                        navigate(encounterPath);
                                                    }}
                                                >
                                                    <FaFileMedical />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    title="Reports"
                                                    onClick={() => navigate(`${basePath}/reports?patientId=${p._id}`)}
                                                >
                                                    <FaFileAlt />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    title="Resend Credentials"
                                                    onClick={() => handleResendCredentials(p._id)}
                                                >
                                                    <FaEnvelope />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Delete"
                                                    onClick={() => confirmDelete(p._id)}
                                                >
                                                    <RiDeleteBinFill />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* SIMPLE PAGINATION MOCKUP */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <span>Rows per page: 10</span>
                        <nav>
                            <ul className="pagination pagination-sm m-0">
                                <li className="page-item disabled">
                                    <button className="page-link">Prev</button>
                                </li>
                                <li className="page-item active">
                                    <button className="page-link">1</button>
                                </li>
                                <li className="page-item disabled">
                                    <button className="page-link">Next</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* IMPORT MODAL */}
            {importOpen && (
                <>
                    <div className="modal-backdrop fade show" />

                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title text-primary">Patients Import</h5>
                                    <button className="btn-close" onClick={closeImportModal}></button>
                                </div>

                                <form onSubmit={handleImportSubmit}>
                                    <div className="modal-body">

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Select Type</label>
                                                <select
                                                    className="form-select"
                                                    value={importType}
                                                    onChange={(e) => setImportType(e.target.value)}
                                                >
                                                    <option value="csv">CSV</option>
                                                </select>
                                            </div>

                                            <div className="col-md-8">
                                                <label className="form-label">Upload CSV File</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept=".csv"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>

                                        <p className="fw-semibold mb-2">CSV Required Fields:</p>
                                        <ul className="small mb-0">
                                            <li>firstName</li>
                                            <li>lastName</li>
                                            <li>clinic</li>
                                            <li>email</li>
                                            <li>phone</li>
                                            <li>dob</li>
                                            <li>bloodGroup (optional)</li>
                                            <li>gender</li>
                                            <li>address (optional)</li>
                                            <li>city (optional)</li>
                                            <li>country (optional)</li>
                                            <li>postalCode (optional)</li>
                                        </ul>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={closeImportModal}
                                            disabled={importing}
                                        >
                                            Cancel
                                        </button>

                                        <button type="submit" className="btn btn-primary" disabled={importing}>
                                            {importing ? "Saving…" : "Save"}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteModal.show && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Confirm Delete</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setDeleteModal({ show: false, id: null })}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to delete this patient? This action cannot be undone.</p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setDeleteModal({ show: false, id: null })}
                                    >
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={executeDelete}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default PatientsContent;
