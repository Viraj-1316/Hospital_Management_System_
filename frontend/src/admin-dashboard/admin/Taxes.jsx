// src/admin/Taxes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../../shared/styles/shared-components.css";
import { FaEdit, FaTrash, FaUpload, FaPlus } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../../config";

const fadeInKeyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function Taxes({ sidebarCollapsed = false, toggleSidebar }) {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);

  // search (top big search input)
  const [searchTerm, setSearchTerm] = useState("");

  // filter row (per column – optional logic)
  const [filterName, setFilterName] = useState("");
  const [filterRate, setFilterRate] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // modal for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [form, setForm] = useState({
    name: "",
    taxRate: "",
    clinicName: "",
    doctor: "",
    serviceName: "",
    active: true,
  });

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState(null);

  // --- NEW: Dropdown Data States ---
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  // --- FETCH DROPDOWN DATA ---
  const fetchDropdownData = async () => {
    try {
      const [clinicRes, doctorRes, serviceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/clinics`),
        axios.get(`${API_BASE}/doctors`),
        axios.get(`${API_BASE}/services?limit=1000`) // Fetch enough services
      ]);

      if (clinicRes.data?.success) {
        setClinics(clinicRes.data.clinics || []);
      }

      setDoctors(doctorRes.data || []);
      setServices(serviceRes.data?.rows || []);

    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      // toast.error("Failed to load some dropdown data");
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // ---------- FETCH TAXES ----------
  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/taxes`);
      setTaxes(res.data || []);
    } catch (err) {
      console.error("Error fetching taxes:", err);
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // ---------- FILTERING ----------
  const filtered = useMemo(() => {
    return taxes.filter((t) => {
      const text = `${t.name || ""} ${t.serviceName || ""} ${
        t.taxRate ?? ""
      } ${t.clinicName || ""} ${t.doctor || ""} ${
        t.active ? "active" : "inactive"
      }`.toLowerCase();

      if (searchTerm && !text.includes(searchTerm.toLowerCase())) return false;
      if (filterName && !(t.name || "").toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterRate && String(t.taxRate ?? "").indexOf(filterRate) === -1) return false;
      if (
        filterClinic &&
        !(t.clinicName || "").toLowerCase().includes(filterClinic.toLowerCase())
      )
        return false;
      if (
        filterDoctor &&
        !(t.doctor || "").toLowerCase().includes(filterDoctor.toLowerCase())
      )
        return false;
      if (
        filterService &&
        !(t.serviceName || "").toLowerCase().includes(filterService.toLowerCase())
      )
        return false;
      if (filterStatus) {
        const isActive = t.active ? "active" : "inactive";
        if (isActive !== filterStatus.toLowerCase()) return false;
      }

      return true;
    });
  }, [
    taxes,
    searchTerm,
    filterName,
    filterRate,
    filterClinic,
    filterDoctor,
    filterService,
    filterStatus,
  ]);

  
  const openNewTax = () => {
    setEditingTax(null);
    setForm({
      name: "",
      taxRate: "",
      clinicName: "",
      doctor: "",
      serviceName: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEditTax = (tax) => {
    setEditingTax(tax);
    setForm({
      name: tax.name || "",
      taxRate: tax.taxRate !== undefined ? String(tax.taxRate) : "",
      clinicName: tax.clinicName || "",
      doctor: tax.doctor || "",
      serviceName: tax.serviceName || "",
      active: !!tax.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      taxRate: parseFloat(form.taxRate) || 0,
    };

    try {
      if (editingTax) {
        const res = await axios.put(
          `${API_BASE}/api/taxes/${editingTax._id}`,
          payload
        );
        if (res.data?.message) {
          toast.success("Tax updated successfully");
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/taxes`, payload);
        if (res.data?.message) {
          toast.success("Tax created successfully");
        }
      }
      closeModal();
      fetchTaxes();
    } catch (err) {
      console.error("Save tax error:", err);
      toast.error("Error saving tax.");    
    }
  };

  // ---------- DELETE ----------
  const openDeleteModal = (tax) => {
    setTaxToDelete(tax);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTaxToDelete(null);
  };

  const confirmDelete = async () => {
    if (!taxToDelete) return;
    try {
      const res = await axios.delete(
        `${API_BASE}/api/taxes/${taxToDelete._id}`
      );
      if (res.data?.message) {
        toast.success("Tax deleted successfully");
      }
      setTaxes((prev) => prev.filter((t) => t._id !== taxToDelete._id));
      closeDeleteModal();
    } catch (err) {
      console.error("Delete tax error:", err);
      toast.error("Error deleting tax.");
    }
  };

  // ---------- TOGGLE STATUS ----------
  const handleToggleActive = async (tax) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/taxes/${tax._id}`,
        { active: !tax.active }
      );
      const updated = res.data?.data;
      setTaxes((prev) =>
        prev.map((t) => (t._id === tax._id ? updated || { ...t, active: !t.active } : t))
      );
    } catch (err) {
      console.error("Toggle active error:", err);
      toast.error("Error updating status.");
    }
  };

  // Import modal handlers
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

      const res = await axios.post(
        `${API_BASE}/api/taxes/import`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.message) {
        toast.success(res.data.message);
        fetchTaxes();
        closeImportModal();
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Error importing taxes.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <style>{fadeInKeyframes}</style>
      <Toaster position="top-right" reverseOrder={false} />
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Right side content */}
      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          minHeight: "100vh",
        }}
      >
        {/* Navbar */}
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid mt-3">
          {/* Blue header bar */}
          <div className="services-topbar mb-2 services-card">
            <h5 className="fw-bold text-white mb-0">Tax List</h5>
            <div className="services-actions">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={openImportModal}
              >
                <FaUpload className="me-1" /> Import data
              </button>
              <button className="btn btn-light btn-sm" onClick={openNewTax}>
                <FaPlus className="me-1" /> New Tax
              </button>
            </div>
          </div>

          {/* White card with table */}
          <div className="card services-card">
            <div className="card-body">
              {/* Search row */}
              <div className="d-flex align-items-center mb-2">
                <div className="search-input me-2" style={{ flex: 1 }}>
                  <i className="bi bi-search"></i>
                  <input
                    className="form-control"
                    placeholder="Search by Name, Service Name, Tax Rate, Clinic Name, Doctor, Status (:active or :inactive)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-borderless align-middle">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e9eef6" }}>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" />
                      </th>
                      <th style={{ width: 70 }}>ID</th>
                      <th>Name</th>
                      <th>Tax Rate</th>
                      <th>Clinic Name</th>
                      <th>Doctor</th>
                      <th>Service Name</th>
                      <th>Status</th>
                      <th style={{ width: 120 }}>Action</th>
                    </tr>

                    {/* Filter row */}
                    <tr className="table-filter-row">
                      <th></th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="ID"
                          disabled
                        />
                      </th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="Name"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="Tax Rate"
                          value={filterRate}
                          onChange={(e) => setFilterRate(e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="Filter clinic"
                          value={filterClinic}
                          onChange={(e) => setFilterClinic(e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="Filter doctor"
                          value={filterDoctor}
                          onChange={(e) => setFilterDoctor(e.target.value)}
                        />
                      </th>
                      <th>
                        <input
                          className="form-control"
                          placeholder="Filter service"
                          value={filterService}
                          onChange={(e) => setFilterService(e.target.value)}
                        />
                      </th>
                      <th>
                        <select
                          className="form-select"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="">Filter by status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No Data Found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t, index) => (
                        <tr 
                          key={t._id} 
                          style={{ 
                            animation: "fadeIn 0.5s ease-out forwards",
                            animationDelay: `${index * 0.05}s`,
                            opacity: 0 // Start invisible for animation
                          }}
                        >
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{index + 1}</td>
                          <td>{t.name}</td>
                          <td>${(t.taxRate ?? 0).toFixed(2)}/-</td>
                          <td>{t.clinicName}</td>
                          <td>{t.doctor}</td>
                          <td>{t.serviceName}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!t.active}
                                  onChange={() => handleToggleActive(t)}
                                />
                              </div>
                              <span className="status-pill">
                                {t.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="icon-btn bg-white"
                                title="Edit"
                                onClick={() => openEditTax(t)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="icon-btn bg-white"
                                title="Delete"
                                onClick={() => openDeleteModal(t)}
                              >
                                <FaTrash style={{ color: "red" }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* footer */}
              <div className="table-footer">
                <div>
                  Rows per page:{" "}
                  <select
                    className="form-select d-inline-block"
                    style={{ width: 80, marginLeft: 8 }}
                    defaultValue={10}
                    disabled
                  >
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>

                <div>
                  Page{" "}
                  <input
                    value={1}
                    readOnly
                    style={{ width: 34, textAlign: "center" }}
                  />{" "}
                  of 1 &nbsp;
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    disabled
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary ms-1"
                    disabled
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Tax</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDeleteModal}
                  />
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete tax "{taxToDelete?.name}"?</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* IMPORT MODAL */}
      {importOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-primary">Taxes Import</h5>
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
                          onChange={handleImportFileChange}
                        />
                      </div>
                    </div>
                    <p className="fw-semibold mb-2">CSV Required Fields:</p>
                    <ul className="small mb-0">
                      <li>name</li>
                      <li>taxRate</li>
                      <li>clinicName</li>
                      <li>doctor</li>
                      <li>serviceName</li>
                      <li>active (true/false)</li>
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

      {/* MODAL: Add / Edit Tax */}
      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingTax ? "Edit Tax" : "New Tax"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input
                          className="form-control"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Tax Rate (%)*</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          name="taxRate"
                          value={form.taxRate}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Clinic Name</label>
                        <select
                          className="form-select"
                          name="clinicName"
                          value={form.clinicName}
                          onChange={handleFormChange}
                        >
                          <option value="">Select Clinic</option>
                          {clinics.map((c) => (
                            <option key={c._id} value={c.name || c.clinicName}>
                              {c.name || c.clinicName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Doctor</label>
                        <select
                          className="form-select"
                          name="doctor"
                          value={form.doctor}
                          onChange={handleFormChange}
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((d) => {
                            const fullName = `${d.firstName} ${d.lastName}`;
                            return (
                              <option key={d._id} value={fullName}>
                                {fullName}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Service Name</label>
                        <select
                          className="form-select"
                          name="serviceName"
                          value={form.serviceName}
                          onChange={handleFormChange}
                        >
                          <option value="">Select Service</option>
                          {services.map((s) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="tax-active"
                            name="active"
                            checked={form.active}
                            onChange={handleFormChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="tax-active"
                          >
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeModal}
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
    </div>
  );
}

export default Taxes;
