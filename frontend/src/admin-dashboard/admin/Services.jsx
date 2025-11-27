// src/admin/Services.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DurationPicker from "../components/DurationPicker";
import "../styles/services.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function Services({ sidebarCollapsed = false, toggleSidebar }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);

  // Put this just below your useState hooks in Services component

  const clinicOptions = [
    "Valley Clinic",
    "City Clinic",
    "One Care Main Clinic",
    "Downtown Clinic",
  ];

  const categoryOptions = [
    "general dentistry",
    "system service",
    "checkup",
    "telemed",
    "physiotherapy",
  ];

  const doctorOptions = [
    "Dr. Viraj Rudrawar",
    "Dr. Harshada Sohani",
    "Dr. Tanmay Mule",
    "Dr. Smith",
    "Dr. John Doe",
  ];

  const [form, setForm] = useState({
    name: "",
    clinicName: "",
    doctor: "",
    charges: "",
    duration: "00:00",
    category: "",
    active: true,
  });

  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    title: "", 
    message: "", 
    action: null,
    confirmText: "Delete",
    confirmVariant: "danger"
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      console.log("Frontend loadServices ->", res.data);   // 👈 add this line
      setServices(res.data || []);
    } catch (err) {
      console.error("loadServices error", err);
      console.error("loadServices error", err);
      toast.error("Unable to load services. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };


  // Add service
  const addService = async () => {
    if (!form.name || !form.name.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    try {
      const res = await api.post("/services", form);
      setServices((prev) => [res.data, ...prev]);
      clearForm();
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch (err) {
      console.error("addService error", err);
      console.error("addService error", err);
      if (err.response) toast.error("Server error: " + JSON.stringify(err.response.data));
      else toast.error("Network error: " + err.message);
    }
  };

  // Start edit
  const startEdit = (s) => {
    setEditId(s._id);
    setShowForm(true);
    setForm({
      name: s.name || "",
      clinicName: s.clinicName || "",
      doctor: s.doctor || "",
      charges: s.charges || "",
      duration: s.duration || "00:00",
      category: s.category || "",
      active: s.active ?? true,
    });
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Update
  const updateService = async () => {
    if (!editId) return;
    if (!form.name || !form.name.trim()) {
      toast.error("Please enter service name");
      return;
    }

    try {
      const res = await api.put(`/services/${editId}`, form);
      setServices((prev) => prev.map((s) => (s._id === editId ? res.data : s)));
      setEditId(null);
      clearForm();
    } catch (err) {
      console.error("updateService", err);
      console.error("updateService", err);
      toast.error("Update failed");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    clearForm();
  };

  // Delete
  const deleteService = (id) => {
    setConfirmModal({
      show: true,
      title: "Delete Service",
      message: "Delete this service?",
      action: () => executeDelete(id),
      confirmText: "Delete",
      confirmVariant: "danger"
    });
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success("Service deleted");
    } catch (err) {
      console.error("deleteService", err);
      toast.error("Delete failed");
    } finally {
      closeConfirmModal();
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: "", message: "", action: null });
  };

  // Toggle active
  const toggleActive = async (id) => {
    try {
      const res = await api.put(`/services/toggle/${id}`);
      setServices((prev) => prev.map((s) => (s._id === id ? res.data : s)));
    } catch (err) {
      console.error("toggleActive", err);
      console.error("toggleActive", err);
      toast.error("Toggle failed");
    }
  };

  const clearForm = () =>
    setForm({
      name: "",
      clinicName: "",
      doctor: "",
      charges: "",
      duration: "00:00",
      category: "",
      active: true,
    });

  // Filtered list
  const filtered = services
    .filter((s) => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return !!s.active;
      return !s.active;
    });

  return (
    <div>
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className="flex-grow-1 main-content-transition"
        style={{ marginLeft: sidebarCollapsed ? 64 : 250, minHeight: "100vh" }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid mt-3">
          <div className="services-topbar mb-2 services-card">
            <h5 className="fw-bold text-white mb-0">Service List</h5>
            <div className="services-actions">
              <button className="btn btn-outline-light btn-sm">
                <i className="bi bi-upload me-1"></i> Import data
              </button>

              <button
                className="btn btn-light btn-sm"
                onClick={() => {
                  setShowForm((s) => !s);
                  if (!showForm) {
                    clearForm();
                    setEditId(null);
                    setTimeout(() => window.scrollTo({ top: 120, behavior: "smooth" }), 80);
                  }
                }}
              >
                <i className="bi bi-plus-lg me-1"></i> {showForm ? "Hide Form" : "Add Service"}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="card p-3 mb-3">
              <div className="row g-2">

                <div className="col-md-2">
                  <input
                    className="form-control"
                    placeholder="Patient name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>



                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={form.clinicName}
                    onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                  >
                    <option value="">Select clinic</option>
                    {clinicOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={form.doctor}
                    onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                  >
                    <option value="">Select doctor</option>
                    {doctorOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="col-md-1">
                  <input className="form-control" placeholder="Charges" value={form.charges} onChange={(e) => setForm({ ...form, charges: e.target.value })} />
                </div>

                <div className="col-md-1">
                  <DurationPicker value={form.duration || "00:00"} onChange={(val) => setForm({ ...form, duration: val })} />
                </div>

                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select service type</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="col-md-1 d-flex align-items-center">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                    <label style={{ fontSize: 12 }}>Active</label>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                {editId ? (
                  <>
                    <button className="btn btn-success" onClick={updateService}>Update Service</button>
                    <button className="btn btn-secondary ms-2" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={addService}>Add Service</button>
                    <button className="btn btn-outline-secondary ms-2" onClick={clearForm}>Clear</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="mb-3 d-flex gap-2">
            <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          <div className="card services-card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-borderless align-middle">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Service ID</th>
                      <th>Name</th>
                      <th>Clinic Name</th>
                      <th>Doctor</th>
                      <th>Charges</th>
                      <th>Duration</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          No services found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((s, index) => (
                        <tr key={s._id}>
                          {/* checkbox */}
                          <td>
                            <input type="checkbox" />
                          </td>

                          {/* # */}
                          <td>{index + 1}</td>

                          {/* Service ID
                          <td>{s.serviceId ?? "-"}</td> */}

                          {/* Patient/Name */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="avatar-circle">
                                {(s.name || "").charAt(0).toUpperCase()}
                              </div>
                              {s.name}
                            </div>
                          </td>

                          {/* Clinic */}
                          <td>{s.clinicName}</td>

                          {/* Doctor */}
                          <td>{s.doctor}</td>

                          {/* Charges */}
                          <td>{s.charges}</td>

                          {/* Duration */}
                          <td>{s.duration}</td>

                          {/* Category */}
                          <td>{s.category}</td>

                          {/* Status */}
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!s.active}
                                  onChange={() => toggleActive(s._id)}
                                />
                              </div>
                              <span className="status-pill">
                                {s.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                          </td>

                          {/* Action */}
                          <td>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="icon-btn bg-white"
                                title="Edit"
                                onClick={() => startEdit(s)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="icon-btn bg-white"
                                title="Delete"
                                onClick={() => deleteService(s._id)}
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

              {/* Footer */}
              <div className="d-flex justify-content-between mt-3">
                <div>
                  Rows per page:
                  <select className="form-select d-inline-block ms-2" style={{ width: 80 }}>
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>

                <div>Page <input value={1} readOnly style={{ width: 40, textAlign: "center" }} /> of 1</div>
              </div>

            </div>
          </div>
        </div>
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
}
