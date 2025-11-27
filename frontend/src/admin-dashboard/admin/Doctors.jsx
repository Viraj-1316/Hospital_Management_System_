import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearch, FaPlus, FaTrash, FaEdit, FaDownload, FaEnvelope, FaCalendarAlt, FaBriefcaseMedical } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/services.css";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";

const Doctors = ({ sidebarCollapsed, toggleSidebar }) => {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Add Service modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    charges: "",
    duration: "00:30",
    clinic: "",
    isTelemedicine: false,
    status: "Active",
    allowMultiSelection: true,
  });
  const [clinics, setClinics] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    title: "", 
    message: "", 
    action: null,
    confirmText: "Delete",
    confirmVariant: "danger"
  });

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:3001/doctors");
      setDoctors(res.data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Delete doctor
  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: "Delete Doctor",
      message: "Are you sure you want to delete this doctor?",
      action: () => executeDelete(id),
      confirmText: "Delete",
      confirmVariant: "danger"
    });
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/doctors/${id}`);
      setDoctors((prev) => prev.filter((doc) => doc._id !== id));
      toast.success("Doctor deleted successfully!");
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Error deleting doctor");
    } finally {
      closeConfirmModal();
    }
  };

  // Resend Credentials
  const handleResendCredentials = (id) => {
    setConfirmModal({
      show: true,
      title: "Resend Credentials",
      message: "Resend login credentials to this doctor? This will reset their password.",
      action: () => executeResend(id),
      confirmText: "Resend",
      confirmVariant: "warning"
    });
  };

  const executeResend = async (id) => {
    try {
      await axios.post(`http://localhost:3001/doctors/${id}/resend-credentials`);
      toast.success("Credentials resent successfully!");
    } catch (error) {
      console.error("Error resending credentials:", error);
      toast.error("Failed to resend credentials.");
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: "", message: "", action: null });
  };

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
        "http://localhost:3001/doctors/import",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success(`Imported ${res.data?.count || 0} doctors`);
      setImportOpen(false);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error("Error importing doctors");
    } finally {
      setImporting(false);
    }
  };

  // Edit Doctor handlers
  const handleEditClick = (doctor) => {
    navigate("/AddDoctor", { state: { editDoctor: doctor } });
  };

  // Doctor Session navigation
  const handleDoctorSession = (doctor) => {
    navigate("/DoctorSession", { 
      state: { doctorFilter: `${doctor.firstName} ${doctor.lastName}` } 
    });
  };

  // Add Service handlers
  const handleAddServiceClick = (doctor) => {
    setSelectedDoctor(doctor);
    setServiceForm({
      name: "",
      category: "",
      charges: "",
      duration: "00:30",
      clinic: doctor.clinic || "",
      isTelemedicine: false,
      status: "Active",
      allowMultiSelection: true,
    });
    setServiceModalOpen(true);
  };

  const handleServiceFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.category) {
      return toast.error("Please fill required fields");
    }

    try {
      const payload = {
        ...serviceForm,
        doctor: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        doctorId: selectedDoctor._id,
        clinicName: serviceForm.clinic,
        active: serviceForm.status === "Active",
      };

      await axios.post("http://localhost:3001/services", payload);
      toast.success("Service added successfully!");
      setServiceModalOpen(false);
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("Error adding service");
    }
  };

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    setSelectedDoctor(null);
  };

  // Load categories and clinics for service modal
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const categoriesData = [
          "general dentistry",
          "system service",
          "checkup",
          "telemed",
          "physiotherapy",
        ];
        setCategories(categoriesData);

        const clinicsRes = await axios.get("http://localhost:3001/api/clinics");
        if (clinicsRes.data.success) {
          setClinics(clinicsRes.data.clinics || []);
        }
      } catch (error) {
        console.error("Error loading options:", error);
      }
    };
    loadOptions();
  }, []);

  // Filter doctors
  const filteredDoctors = doctors.filter((doc) => {
    const text = searchTerm.toLowerCase();
    return (
      (doc.firstName || "").toLowerCase().includes(text) ||
      (doc.lastName || "").toLowerCase().includes(text) ||
      (doc.email || "").toLowerCase().includes(text) ||
      (doc.clinic || "").toLowerCase().includes(text) ||
      (doc.specialization || "").toLowerCase().includes(text)
    );
  });

  return (
    <div>
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main container */}
      <div
        className="main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "250px",
          minHeight: "100vh",
          background: "#f5f6fa",
        }}
      >
        {/* Navbar */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* PAGE CONTENT */}
        <div className="container-fluid mt-3">

          {/* TOP BLUE HEADER */}
          <div className="services-topbar services-card d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-white mb-0">Doctors List</h5>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                onClick={openImportModal}
              >
                <FaDownload /> Import Doctors
              </button>

              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-2"
                onClick={() => navigate("/AddDoctor")}
              >
                <FaPlus /> Add Doctor
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="card p-3 mt-3 services-card">
            <div className="input-group" style={{ maxWidth: 400 }}>
              <span className="input-group-text bg-white border-end-0">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search doctor by name, email, clinic or specialization"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* DOCTORS TABLE */}
          <div className="card p-3 mt-3 services-card">
            <table className="table table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Clinic</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor, index) => (
                    <tr key={doctor._id}>
                      <td>{index + 1}</td>
                      <td>{doctor.firstName} {doctor.lastName}</td>
                      <td>{doctor.clinic}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.specialization || "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            doctor.status === "Active" ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Doctor"
                            onClick={() => handleEditClick(doctor)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="Doctor Sessions"
                            onClick={() => handleDoctorSession(doctor)}
                          >
                            <FaCalendarAlt />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Add Service"
                            onClick={() => handleAddServiceClick(doctor)}
                          >
                            <FaBriefcaseMedical />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Doctor"
                            onClick={() => handleDelete(doctor._id)}
                          >
                            <FaTrash />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="Resend Credentials"
                            onClick={() => handleResendCredentials(doctor._id)}
                          >
                            <FaEnvelope />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted py-3">
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
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
                    <h5 className="modal-title text-primary">Doctors Import</h5>
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
                        <li>specialization</li>
                        <li>gender</li>
                        <li>status</li>
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

        {/* ADD SERVICE MODAL */}
        {serviceModalOpen && (
          <>
            <div className="modal-backdrop fade show" />

            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">

                  <div className="modal-header">
                    <h5 className="modal-title text-primary">Add Service</h5>
                    <button className="btn-close" onClick={closeServiceModal}></button>
                  </div>

                  <form onSubmit={handleServiceSubmit}>
                    <div className="modal-body">
                      
                      {/* Service Image Upload Section */}
                      <div className="row mb-4">
                        <div className="col-12 text-center">
                          <div className="d-inline-block position-relative">
                            <div 
                              className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow-sm"
                              style={{ 
                                width: "130px", 
                                height: "130px", 
                                border: "3px solid #e0e0e0",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                              }}
                            >
                              <div className="text-center">
                                <i className="bi bi-camera" style={{ fontSize: "36px", color: "#999" }}></i>
                                <div style={{ fontSize: "11px", color: "#999", marginTop: "5px" }}>Upload Image</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary position-absolute d-flex align-items-center justify-content-center"
                              style={{ 
                                bottom: "5px", 
                                right: "5px", 
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                padding: "0",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                              }}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Service Category *</label>
                          <select
                            name="category"
                            className="form-select"
                            value={serviceForm.category}
                            onChange={handleServiceFormChange}
                            required
                          >
                            <option value="">Select service category</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">Type and press enter to add new category</small>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Service Name *</label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter service name"
                            value={serviceForm.name}
                            onChange={handleServiceFormChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Charges *</label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              name="charges"
                              className="form-control"
                              placeholder="Enter charges"
                              value={serviceForm.charges}
                              onChange={handleServiceFormChange}
                              required
                            />
                            <span className="input-group-text">/-</span>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Duration</label>
                          <input
                            type="time"
                            name="duration"
                            className="form-control"
                            placeholder="HH:MM"
                            value={serviceForm.duration}
                            onChange={handleServiceFormChange}
                          />
                        </div>

                        <div className="col-md-12">
                          <label className="form-label">Is this a telemedicine service? *</label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="isTelemedicine"
                                id="telemed-no"
                                value="false"
                                checked={!serviceForm.isTelemedicine}
                                onChange={() => setServiceForm({ ...serviceForm, isTelemedicine: false })}
                              />
                              <label className="form-check-label" htmlFor="telemed-no">
                                No
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="isTelemedicine"
                                id="telemed-yes"
                                value="true"
                                checked={serviceForm.isTelemedicine}
                                onChange={() => setServiceForm({ ...serviceForm, isTelemedicine: true })}
                              />
                              <label className="form-check-label" htmlFor="telemed-yes">
                                Yes
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-12">
                          <label className="form-label">Clinic *</label>
                          <select
                            name="clinic"
                            className="form-select"
                            value={serviceForm.clinic}
                            onChange={handleServiceFormChange}
                            required
                          >
                            <option value="">Select clinic</option>
                            {clinics.map((clinic) => (
                              <option key={clinic._id} value={clinic.name}>
                                {clinic.name}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">Select all</small>
                        </div>

                        <div className="col-md-12">
                          <label className="form-label">Status *</label>
                          <select
                            name="status"
                            className="form-select"
                            value={serviceForm.status}
                            onChange={handleServiceFormChange}
                            required
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="col-md-12">
                          <label className="form-label">Allow multi selection while booking *</label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="allowMultiSelection"
                                id="multi-yes"
                                checked={serviceForm.allowMultiSelection}
                                onChange={() => setServiceForm({ ...serviceForm, allowMultiSelection: true })}
                              />
                              <label className="form-check-label" htmlFor="multi-yes">
                                Yes
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="allowMultiSelection"
                                id="multi-no"
                                checked={!serviceForm.allowMultiSelection}
                                onChange={() => setServiceForm({ ...serviceForm, allowMultiSelection: false })}
                              />
                              <label className="form-check-label" htmlFor="multi-no">
                                No
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeServiceModal}
                      >
                        Cancel
                      </button>

                      <button type="submit" className="btn btn-primary">
                        Save
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        <ConfirmationModal
          show={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.action}
          onCancel={closeConfirmModal}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
        />
      </div>
    </div>
  );
};

export default Doctors;
