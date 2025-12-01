import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/admin-shared.css"; 
import "../styles/ClinicList.css";

import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaPen,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import API_BASE from "../../config";

const SPECIALIZATION_OPTIONS = [
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Pediatrics",
  "Gynecology"
];

export default function ClinicList({ sidebarCollapsed, toggleSidebar }) {
  const navigate = useNavigate();

  // --- States ---
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState("");

  // --- Delete Modal States ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);

  // --- Import States (✅ Added to match Patients.jsx) ---
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [filters, setFilters] = useState({
    id: "",
    name: "",
    email: "",
    adminEmail: "",
    contact: "",
    specialization: "",
    address: "",
    status: "",
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Moved fetchClinics OUTSIDE useEffect so we can call it after Import
  const fetchClinics = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await axios.get(`${API_BASE}/api/clinics`);
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data.clinics ?? [];
      setClinics(raw);
    } catch (error) {
      console.error("Failed to load clinics:", error);
      setErr("Failed to load clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // --- IMPORT HANDLERS (✅ Added) ---
  const openImportModal = () => {
    setImportOpen(true);
    setImportFile(null);
  };

  const closeImportModal = () => {
    if (!importing) setImportOpen(false);
  };

  const handleImportFileChange = (e) => {
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

      // ✅ POST to the correct Clinic Import Endpoint
      const res = await axios.post(
        `${API_BASE}/api/clinics/import`, 
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success(res.data?.message || `Imported ${res.data?.count || 0} clinics`);
      setImportOpen(false);
      fetchClinics(); // Refresh the list
    } catch (err) {
      console.error(err);
      toast.error("Error importing clinics. Check CSV format.");
    } finally {
      setImporting(false);
    }
  };

  const filteredClinics = useMemo(() => {
    const toRow = (c, index) => {
      const specialization =
        Array.isArray(c.specialties) && c.specialties.length > 0
          ? c.specialties[0]
          : "";

      const addressParts = [
        c.address?.full,
        c.address?.city,
        c.address?.country,
        c.address?.postalCode,
      ].filter(Boolean);

      return {
        tableId: index + 1,
        _id: c._id,
        name: c.name ?? "-",
        email: c.email ?? "-",
        adminEmail: c.admin?.email ?? "-",
        contact: c.contact ?? "-",
        specialization,
        address: addressParts.join(", "),
        status: (c.status || "Inactive").toLowerCase(),
        logo: c.clinicLogo ? `${API_BASE}/uploads/${c.clinicLogo}` : null,
      };
    };

    const matchText = (val, filter) =>
      val.toLowerCase().includes(filter.toLowerCase());

    return clinics
      .map((c, i) => toRow(c, i))
      .filter((row) => {
        const global = search.trim().toLowerCase();
        if (global) {
          const combined = (
            row.tableId + " " +
            row.name + " " +
            row.email + " " +
            row.adminEmail + " " +
            row.contact + " " +
            row.specialization + " " +
            row.address + " " +
            row.status
          ).toLowerCase();
          if (!combined.includes(global)) return false;
        }

        const idMatch = !filters.id || String(row.tableId).startsWith(filters.id);
        const statusMatch = !filters.status || filters.status === row.status;
        const specializationMatch = !filters.specialization || row.specialization === filters.specialization;

        return (
          idMatch &&
          matchText(row.name, filters.name || "") &&
          matchText(row.email, filters.email || "") &&
          matchText(row.adminEmail, filters.adminEmail || "") &&
          matchText(row.contact, filters.contact || "") &&
          matchText(row.address, filters.address || "") &&
          specializationMatch &&
          statusMatch
        );
      });
  }, [clinics, filters, search]);

  // --- DELETE HANDLERS ---
  const openDeleteModal = (id) => {
    setClinicToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!clinicToDelete) return;
    setShowDeleteModal(false);

    const promise = axios
      .delete(`${API_BASE}/api/clinics/${clinicToDelete}`)
      .then(() => {
        setClinics((list) => list.filter((c) => c._id !== clinicToDelete));
        setClinicToDelete(null);
      });

    await toast.promise(promise, {
      loading: "Deleting clinic...",
      success: "Clinic deleted successfully",
      error: "Failed to delete clinic",
    });
  };

  const handleResend = async (row) => {
    const promise = axios.post(
      `${API_BASE}/api/clinics/${row._id}/resend-credentials`
    );

    await toast.promise(promise, {
      loading: "Sending credentials...",
      success: `Credentials resent Successfully `,
      error: "Failed to resend credentials",
    });
  };

  return (
    <div>
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          minHeight: "100vh",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <Toaster position="top-right" />

        <div className="container-fluid mt-3">
          <div className="services-topbar mb-3 services-card">
            <h5 className="fw-bold text-white mb-0">Clinic List</h5>

            <div>
              {/* ✅ Connected onClick to openImportModal */}
              <button
                className="btn btn-outline-light btn-sm me-2"
                onClick={openImportModal}
              >
                <FaFileImport className="me-1" /> Import
              </button>

              <button
                className="btn btn-light btn-sm"
                onClick={() => navigate("/add-clinic")}
              >
                <FaPlus className="me-1" /> Add Clinic
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-3 d-flex" style={{ maxWidth: 400 }}>
            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                className="form-control"
                placeholder="Search clinic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-3 services-card">
            {err && <div className="alert alert-warning">{err}</div>}

            {loading ? (
              <div>Loading clinics…</div>
            ) : filteredClinics.length === 0 ? (
              <div className="p-4 text-center text-muted">
                No clinics found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-borderless align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Clinic Admin Email</th>
                      <th>Contact</th>
                      <th>Specialization</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                    {/* Filters Row */}
                    <tr>
                      <th><input className="form-control form-control-sm" value={filters.id} onChange={(e) => handleFilterChange("id", e.target.value)} /></th>
                      <th><input className="form-control form-control-sm" value={filters.name} onChange={(e) => handleFilterChange("name", e.target.value)} /></th>
                      <th><input className="form-control form-control-sm" value={filters.email} onChange={(e) => handleFilterChange("email", e.target.value)} /></th>
                      <th><input className="form-control form-control-sm" value={filters.adminEmail} onChange={(e) => handleFilterChange("adminEmail", e.target.value)} /></th>
                      <th><input className="form-control form-control-sm" value={filters.contact} onChange={(e) => handleFilterChange("contact", e.target.value)} /></th>
                      <th>
                        <select className="form-select form-select-sm" value={filters.specialization} onChange={(e) => handleFilterChange("specialization", e.target.value)}>
                          <option value="">All</option>
                          {SPECIALIZATION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </th>
                      <th><input className="form-control form-control-sm" value={filters.address} onChange={(e) => handleFilterChange("address", e.target.value)} /></th>
                      <th>
                        <select className="form-select form-select-sm" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClinics.map((row) => {
                      const initials = (row.name || "C").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <tr key={row._id}>
                          <td>{row.tableId}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {row.logo ? (
                                <img src={row.logo} className="clinic-avatar" alt="" />
                              ) : (
                                <div className="clinic-avatar placeholder">{initials}</div>
                              )}
                              <span>{row.name}</span>
                            </div>
                          </td>
                          <td>{row.email}</td>
                          <td>{row.adminEmail}</td>
                          <td>{row.contact}</td>
                          <td>{row.specialization}</td>
                          <td>{row.address}</td>
                          <td>
                            <span className={`status-pill ${row.status === "active" ? "active" : "inactive"}`}>
                              {row.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/add-clinic?clinicId=${row._id}`)}>
                                <FaPen />
                              </button>
                              <button className="btn btn-sm btn-outline-warning" onClick={() => handleResend(row)}>
                                <FaSyncAlt />
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => openDeleteModal(row._id)}>
                                <FaTrash />
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
        </div>
      </div>

      {/* --- IMPORT MODAL (✅ Added) --- */}
      {importOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-primary">Import Clinics (CSV)</h5>
                  <button className="btn-close" onClick={closeImportModal}></button>
                </div>
                <form onSubmit={handleImportSubmit}>
                  <div className="modal-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Select Type</label>
                        <select className="form-select" value={importType} onChange={(e) => setImportType(e.target.value)}>
                          <option value="csv">CSV</option>
                        </select>
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Upload CSV File</label>
                        <input type="file" className="form-control" accept=".csv" onChange={handleImportFileChange} required />
                      </div>
                    </div>
                    
                    {/* Instructions for Clinic CSV Fields */}
                    <p className="fw-semibold mb-2">CSV Required Fields:</p>
                    <div className="alert alert-info small">
                        <ul className="mb-0">
                            <li><strong>name</strong> (Clinic Name)</li>
                            <li><strong>email</strong> (Clinic Email)</li>
                            <li><strong>contact</strong> (Phone)</li>
                            <li><strong>specialization</strong> (e.g. Cardiology)</li>
                            <li><strong>adminFirstName</strong>, <strong>adminLastName</strong></li>
                            <li><strong>adminEmail</strong>, <strong>adminContact</strong></li>
                            <li><strong>city</strong>, <strong>country</strong>, <strong>postalCode</strong></li>
                            <li>dob (YYYY-MM-DD), gender (Male/Female)</li>
                        </ul>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeImportModal} disabled={importing}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={importing}>
                      {importing ? "Importing..." : "Upload & Import"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title fw-bold text-danger">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body text-center py-4">
                  <div className="mb-3 text-danger opacity-75">
                    <FaTrash size={40} />
                  </div>
                  <p className="mb-1 fw-bold text-dark">Are you sure you want to delete this clinic?</p>
                  <p className="text-muted small">This action cannot be undone.</p>
                </div>
                <div className="modal-footer border-top-0 justify-content-center gap-2 pb-4">
                  <button type="button" className="btn btn-light border px-4" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger px-4" onClick={confirmDelete}>Yes, Delete</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}