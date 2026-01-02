import React, { useEffect, useState, useRef } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaSort } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

// FIX 1: Removed the naming conflict. 
// If you have a physical CSS file, import it without a name, 
// but since you use 'servicesStyles' string below, you might not need this line at all.
// import ".../Component/Shared/Services.css"; 

import API_BASE from "../../config";

/* ---------- Local axios instance ---------- */
const api = axios.create({ baseURL: API_BASE });

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const SERVICES_BASE = "/services";

/* ---------- EMBEDDED CSS STYLES (SCOPED) ---------- */
const servicesStyles = `
  .services-scope .status-toggle-track {
    width:36px;height:18px;background:#e9ecef;border-radius:20px;position:relative;cursor:pointer;transition:background-color .2s;
  }
  .services-scope .status-toggle-track.active { background:#0d6efd; }
  .services-scope .status-toggle-thumb {
    width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.2);
  }
  .services-scope .status-toggle-track.active .status-toggle-thumb { left:20px; }
  .services-scope .status-badge { font-size:9px;font-weight:600;border-radius:4px;padding:4px 6px;background:#f8f9fa;color:#0d6efd; }
  .services-scope .status-badge.active { background:#d1e7dd;color:#0f5132; }

  .services-scope .custom-modal-overlay { background:rgba(0,0,0,.5); z-index:1060!important; }
  .services-scope .image-upload-wrapper { position:relative;width:170px;height:170px; }
  .services-scope .image-preview-circle { width:100%;height:100%;border-radius:50%;overflow:hidden;background:#f8f9fa;border:1px solid #dee2e6; }
  .services-scope .image-preview-img { width:100%;height:100%;object-fit:cover; }
  .services-scope .image-placeholder-icon { display:grid;place-items:center;height:100%;font-size:40px; }
  .services-scope .image-edit-btn { position:absolute;top:0;right:0;width:32px;height:32px;background:#fff;border:1px solid #dee2e6;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer; }

  .services-scope .btn-primary-custom { background:#0d6efd;border-color:#0d6efd; }
  .services-scope .search-input { box-shadow:none;font-size:.9rem; }
  .services-scope .custom-table { font-size:.85rem;min-width:1000px; }
  .services-scope .table-filter-input { font-size:.75rem; }
  .services-scope .service-avatar-circle {
    width:28px;height:28px;font-size:12px;border-radius:50%;background:#f8f9fa;display:flex;align-items:center;justify-content:center;color:#0d6efd;font-weight:bold;border:1px solid #dee2e6;
  }
  .services-scope .service-avatar-img { width:100%;height:100%;border-radius:50%;object-fit:cover; }
  .services-scope .action-btn { width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center; }
  .services-scope .pagination-select { width:60px; }

  .services-scope .duration-picker-wrapper { position:relative;width:100%; }
  .services-scope .duration-input { cursor:pointer;background:#fff; }
  .services-scope .duration-input:focus { border-color:#86b7fe;box-shadow:0 0 0 .25rem rgba(13,110,253,.25); }
  .services-scope .duration-dropdown {
    position:absolute;top:100%;left:0;width:100%;background:#fff;border:1px solid #dee2e6;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1050;display:flex;overflow:hidden;margin-top:4px;
  }
  .services-scope .duration-column { flex:1;max-height:200px;overflow-y:auto;display:flex;flex-direction:column; }
  .services-scope .duration-column:first-child { border-right:2px solid #e9ecef; }
  .services-scope .duration-header { font-size:.75rem;font-weight:600;color:#adb5bd;text-align:center;padding:8px 0;background:#f8f9fa;position:sticky;top:0;border-bottom:1px solid #e9ecef; }
  .services-scope .duration-item { padding:8px;text-align:center;font-size:.9rem;cursor:pointer;transition:background .2s;color:#495057; }
  .services-scope .duration-item:hover { background:#f1f3f5;color:#0d6efd; }
  .services-scope .duration-item.selected { background:#e7f1ff;color:#0d6efd;font-weight:600; }
  .services-scope .duration-column::-webkit-scrollbar { width:4px; }
  .services-scope .duration-column::-webkit-scrollbar-track { background:#f1f1f1; }
  .services-scope .duration-column::-webkit-scrollbar-thumb { background:#ccc;border-radius:2px; }

  /* keep toasts on top */
  .react-hot-toast { z-index: 2147483647 !important; }
`;

/* ---------- Helper Components ---------- */
function StatusToggle({ active, onClick }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        className={`status-toggle-track ${active ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(!active);
        }}
      >
        <div className="status-toggle-thumb" />
      </div>
      <span className={`badge border status-badge ${active ? "active" : ""}`}>
        {active ? "ACTIVE" : "INACTIVE"}
      </span>
    </div>
  );
}

function DurationPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [hh, mm] = (value || "00:00").split(":");
  
  // FIX: Ensure hours go up to a reasonable number for services (e.g. 24h or more) if needed
  const hours = Array.from({ length: 13 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = ["00","05","10","15","20","25","30","35","40","45","50","55"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type, val) => {
    const newH = type === "h" ? val : hh || "00";
    const newM = type === "m" ? val : mm || "00";
    onChange(`${newH}:${newM}`);
  };

  return (
    <div className="duration-picker-wrapper" ref={containerRef}>
      <input
        type="text"
        className="form-control duration-input"
        placeholder="HH:MM"
        value={value}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="duration-dropdown">
          <div className="duration-column">
            <div className="duration-header">HH</div>
            {hours.map((h) => (
              <div
                key={h}
                className={`duration-item ${hh === h ? "selected" : ""}`}
                onClick={() => handleSelect("h", h)}
              >
                {h}
              </div>
            ))}
          </div>
          <div className="duration-column">
            <div className="duration-header">mm</div>
            {minutes.map((m) => (
              <div
                key={m}
                className={`duration-item ${mm === m ? "selected" : ""}`}
                onClick={() => {
                  handleSelect("m", m);
                  setIsOpen(false);
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------
// Service Form (Shared)
// ------------------------------------------------------
function ServiceForm({
  initial,
  onClose,
  onSave,
  availableCategories,
  isDoctor,
  doctorInfo,
}) {
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // If doctor, use doctorInfo. If admin, use empty defaults.
  const defaultClinic = isDoctor ? doctorInfo?.clinic || "" : "";
  const defaultDoctor = isDoctor
    ? `${doctorInfo?.firstName || ""} ${doctorInfo?.lastName || ""}`.trim()
    : "";

  const [form, setForm] = useState(
    initial || {
      serviceId: "",
      name: "",
      category: availableCategories.length > 0 ? availableCategories[0] : "",
      charges: "",
      isTelemed: "No",
      clinicName: defaultClinic,
      doctor: defaultDoctor,
      duration: isDoctor ? "00:30" : "00:00",
      active: true,
      allowMulti: "Yes",
      imageFile: null,
      imagePreview: "",
    }
  );

  useEffect(() => {
    if (initial && initial.imageUrl)
      setForm((prev) => ({ ...prev, imagePreview: initial.imageUrl }));
  }, [initial]);

  // FIX: Clean up object URL to prevent memory leaks when form unmounts
  useEffect(() => {
    return () => {
        if (form.imagePreview && form.imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(form.imagePreview);
        }
    }
  }, [form.imagePreview]);

  useEffect(() => {
    const fetchOptions = async () => {
      // Only fetch options if NOT doctor (or if we want to show all clinics to admin)
      if (!isDoctor) {
        try {
          setLoadingOptions(true);
          const clinicRes = await api.get("/api/clinics");
          const clinicData = Array.isArray(clinicRes.data)
            ? clinicRes.data
            : clinicRes.data?.data || clinicRes.data?.clinics || [];
          const doctorRes = await api.get("/doctors");
          const doctorData = Array.isArray(doctorRes.data)
            ? doctorRes.data
            : doctorRes.data?.data || doctorRes.data?.doctors || [];
          setClinics(clinicData);
          setDoctors(doctorData);
        } catch (err) {
          if (err.code === "ERR_NETWORK")
            toast.error("Cannot connect to server.");
        } finally {
          setLoadingOptions(false);
        }
      } else {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [isDoctor]);

  const filteredDoctors = form.clinicName
    ? doctors.filter(
        (d) => (d.clinic || "").toLowerCase() === form.clinicName.toLowerCase()
      )
    : doctors;

  const change = (k) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const updates = { ...prev, [k]: val };
      if (!isDoctor && k === "clinicName") updates.doctor = "";
      return updates;
    });
  };

  const changeDuration = (val) => setForm({ ...form, duration: val });
  const changeBool = (k) => (e) =>
    setForm({ ...form, [k]: e.target.value === "ACTIVE" });

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm({ ...form, imageFile: file, imagePreview: url });
  };

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach((k) => {
      if (k === "imageFile" || k === "imagePreview") return;
      if (k === "active") fd.append(k, form[k]);
      else if (k === "isTelemed" || k === "allowMulti")
        fd.append(k, form[k] === "Yes");
      else fd.append(k, form[k]);
    });

    // Force doctor/clinic if isDoctor
    if (isDoctor) {
      fd.set("doctor", defaultDoctor);
      fd.set("clinicName", defaultClinic);
    }

    if (form.imageFile) fd.append("image", form.imageFile);
    try {
      await onSave(fd);
    } catch {
      toast.error("Failed to save service");
    }
  };

  return (
    <div className="modal fade show d-block custom-modal-overlay" tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title">
              {initial
                ? isDoctor
                  ? "Edit My Service"
                  : "Edit Service"
                : isDoctor
                ? "Add My Service"
                : "Add Service"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-lg-9">
                <div className="row g-3">
                  {/* --- Dynamic Category Dropdown --- */}
                  <div className="col-md-6">
                    <label className="form-label">Category*</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={change("category")}
                      required
                    >
                      <option value="">Select Category</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {availableCategories.length === 0 && (
                      <small className="text-danger">
                        No categories in settings
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Name*</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={change("name")}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Charges*</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.charges}
                      onChange={change("charges")}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Telemed?*</label>
                    <select
                      className="form-select"
                      value={form.isTelemed}
                      onChange={change("isTelemed")}
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </div>

                  {isDoctor ? (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Clinic (Locked)</label>
                        <input
                          className="form-control bg-light"
                          value={form.clinicName}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Doctor (Locked)</label>
                        <input
                          className="form-control bg-light"
                          value={form.doctor}
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Clinic*</label>
                        <select
                          className="form-select"
                          value={form.clinicName}
                          onChange={change("clinicName")}
                          required
                        >
                          <option value="">Select Clinic</option>
                          {loadingOptions ? (
                            <option disabled>Loading...</option>
                          ) : (
                            clinics.map((c, i) => {
                              const cName =
                                c.name ||
                                c.clinicName ||
                                c.title ||
                                `Clinic ${i + 1}`;
                              return (
                                <option key={c._id || i} value={cName}>
                                  {cName}
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Doctor*</label>
                        <select
                          className="form-select"
                          value={form.doctor}
                          onChange={change("doctor")}
                          required
                          disabled={!form.clinicName}
                        >
                          <option value="">
                            {form.clinicName
                              ? "Select Doctor"
                              : "Select Clinic First"}
                          </option>
                          {filteredDoctors.map((d) => {
                            const dName = d.firstName
                              ? `${d.firstName} ${d.lastName} ${
                                  d.specialization
                                    ? `(${d.specialization})`
                                    : ""
                                }`
                              : d.name;
                            return (
                              <option key={d._id} value={dName}>
                                {dName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="col-md-6">
                    <label className="form-label">Duration</label>
                    <DurationPicker
                      value={form.duration}
                      onChange={changeDuration}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status*</label>
                    <select
                      className="form-select"
                      value={form.active ? "ACTIVE" : "INACTIVE"}
                      onChange={changeBool("active")}
                    >
                      <option>ACTIVE</option>
                      <option>INACTIVE</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Multi?*</label>
                    <select
                      className="form-select"
                      value={form.allowMulti}
                      onChange={change("allowMulti")}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 d-flex flex-column align-items-center">
                <div className="image-upload-wrapper">
                  <div className="image-preview-circle">
                    {form.imagePreview ? (
                      <img
                        src={form.imagePreview}
                        className="image-preview-img"
                        alt=""
                      />
                    ) : (
                      <span className="image-placeholder-icon">🖼️</span>
                    )}
                  </div>
                  <label className="image-edit-btn">
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onPickImage}
                    />
                    <FiEdit2 size={14} />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" type="submit">
              Save{isDoctor ? " Service" : ""}
            </button>
            <button type="button" className="btn btn-light" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDelete({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,.5)", zIndex: 1070 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title text-danger">Delete Service</h6>
              <button type="button" className="btn-close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <p className="mb-1">
                Are you sure you want to delete this service?
              </p>
              <small className="text-muted">
                This action cannot be undone.
              </small>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1065 }} />
    </>
  );
}

function ImportModal({ open, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && !selected.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(selected);
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,.5)", zIndex: 1070 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-primary">
                Services Import
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted">
                    Select Type
                  </label>
                  <select className="form-select">
                    <option>CSV</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-bold text-muted">
                    Upload CSV File
                  </label>
                  <div className="input-group">
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => fileRef.current.click()}
                    >
                      Choose File
                    </button>
                    <input
                      type="text"
                      className="form-control bg-white"
                      readOnly
                      value={file ? file.name : "No file chosen"}
                    />
                    <input
                      type="file"
                      ref={fileRef}
                      hidden
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-2 small fw-bold">CSV Required Fields:</p>
                <ul className="small text-muted">
                  <li>name</li>
                  <li>charges</li>
                  <li>category</li>
                  <li>status (Active/Inactive)</li>
                  <li>clinicName (if applicable)</li>
                  <li>doctor (if applicable)</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light px-4"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={() => onSave(file)}
                disabled={!file}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1065 }} />
    </>
  );
}

/* ---------- Main Shared Component ---------- */
export default function SharedServices({
  isDoctor = false,
  doctorInfo = null,
}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    serviceId: "",
    name: "",
    clinicName: "",
    doctor: "",
    charges: "",
    duration: "",
    category: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // --- Categories ---
  const [categories, setCategories] = useState([]);

  // --- Fetch Categories on Mount ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/listings?type=Service type&status=Active");
        // FIX: Added optional chaining to prevent crash if data structure differs
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const catNames = data.map((item) => item.name);
        setCategories(catNames);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit, q: search, ...filters };

      // If doctor, force doctor filter
      if (isDoctor && doctorInfo) {
        const doctorName =
          `${doctorInfo.firstName} ${doctorInfo.lastName}`.trim();
        params.doctor = doctorName;
      }

      const { data } = await api.get(SERVICES_BASE, { params });
      if (Array.isArray(data)) {
        setRows(data);
        setTotal(data.length);
      } else {
        setRows(data.rows || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
      // Optional: setRows([]) on error to clear stale data
    }
    setLoading(false);
  };

  useEffect(() => {
    // Only load if not doctor OR (is doctor AND doctorInfo is available)
    if (!isDoctor || (isDoctor && doctorInfo?.firstName)) {
      load();
    }
  }, [page, limit, isDoctor, doctorInfo]);

  // Debounced search effect
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      if (!isDoctor || (isDoctor && doctorInfo?.firstName)) load();
    }, 400);
    return () => clearTimeout(t);
  }, [search, filters, isDoctor, doctorInfo]);

  const onAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const onEdit = (r) => {
    setEditing(r);
    setModalOpen(true);
  };

  const askDelete = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    setConfirmOpen(false);
    setPendingDeleteId(null);
    if (!id) return;
    try {
      await api.delete(`${SERVICES_BASE}/${id}`);
      toast.success("Service deleted");
      load();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const save = async (fd) => {
    try {
      if (editing)
        await api.put(`${SERVICES_BASE}/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      else
        await api.post(SERVICES_BASE, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      toast.success(editing ? "Service updated" : "Service created");
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error("Operation failed.");
    }
  };

  const toggleActive = async (r, val) => {
    setRows((p) => p.map((x) => (x._id === r._id ? { ...x, active: val } : x)));
    try {
      await api.put(`${SERVICES_BASE}/${r._id}`, { active: val });
      toast.success(`Service ${val ? "active" : "inactive"}`);
    } catch {
      load(); // revert UI if api fails
      toast.error("Update failed");
    }
  };

  const handleImportClick = () => {
    setImportModalOpen(true);
  };
  const handleImportSubmit = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await toast.promise(
        api.post(`${SERVICES_BASE}/import`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        {
          loading: "Importing...",
          success: "Import successful!",
          error: "Import failed",
        }
      );
      setImportModalOpen(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="services-scope"
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA")
          e.stopPropagation();
      }}
    >
      {/* Inject Scoped Styles */}
      <style>{servicesStyles}</style>

      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 2147483647 }}
      />

      <div className="container-fluid py-2">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb- 2bg-white p-2 rounded shadow-sm border gap-2">
          <h5 className="mb-0 fw-bold text-primary">
            {isDoctor ? "My Services" : "Service List"}
          </h5>
          <div className="d-flex gap-2">
            {!isDoctor && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 fw-bold btn-primary-custom"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleImportClick();
                  }}
                >
                  <FiUpload className="me-1" /> Import data
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm px-3 fw-bold btn-primary-custom"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
              }}
            >
              <FiPlus className="me-1" />{" "}
              {isDoctor ? "Add Service" : "Add Service"}
            </button>
          </div>
        </div>

        <div className="bg-white p-2 rounded shadow-sm border mb-2">
          <div className="d-flex gap-3 align-items-center">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <FiSearch />
              </span>
              <input
                className="form-control border-start-0 ps-0 search-input"
                placeholder={isDoctor ? "Search my services..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead className="bg-light text-secondary">
                <tr>
                  <th className="py-3 ps-3" style={{ width: "40px" }}>
                    <input type="checkbox" className="form-check-input" />
                  </th>
                  <th className="py-2" style={{ width: "60px" }}>
                    ID <FaSort className="ms-1 small text-muted" />
                  </th>
                  {!isDoctor && (
                    <th className="py-2" style={{ width: "100px" }}>
                      Service ID <FaSort className="ms-1 small text-muted" />
                    </th>
                  )}
                  <th className="py-2">
                    Name <FaSort className="ms-1 small text-muted" />
                  </th>
                  {!isDoctor && (
                    <th className="py-2">
                      Clinic Name <FaSort className="ms-1 small text-muted" />
                    </th>
                  )}
                  {!isDoctor && (
                    <th className="py-2">
                      Doctor <FaSort className="ms-1 small text-muted" />
                    </th>
                  )}
                  <th className="py-2">
                    Charges <FaSort className="ms-1 small text-muted" />
                  </th>
                  <th className="py-2">
                    Duration <FaSort className="ms-1 small text-muted" />
                  </th>
                  <th className="py-2">
                    Category <FaSort className="ms-1 small text-muted" />
                  </th>
                  <th className="py-2">
                    Status <FaSort className="ms-1 small text-muted" />
                  </th>
                  <th className="text-end pe-3" style={{ width: "80px" }}>
                    Action <FaSort className="ms-1 small text-muted" />
                  </th>
                </tr>
                <tr className="bg-white align-middle">
                  <td className="ps-3 border-bottom"></td>
                  <td className="border-bottom p-1">
                    <input
                      className="form-control form-control-sm table-filter-input"
                      disabled
                    />
                  </td>
                  {!isDoctor && (
                    <td className="border-bottom p-1">
                      <input
                        className="form-control form-control-sm table-filter-input"
                        placeholder="Service ID"
                        value={filters.serviceId}
                        onChange={(e) =>
                          handleFilterChange("serviceId", e.target.value)
                        }
                      />
                    </td>
                  )}
                  <td className="border-bottom p-1">
                    <input
                      className="form-control form-control-sm table-filter-input"
                      placeholder="Filter Name"
                      value={filters.name}
                      onChange={(e) =>
                        handleFilterChange("name", e.target.value)
                      }
                    />
                  </td>
                  {!isDoctor && (
                    <td className="border-bottom p-1">
                      <input
                        className="form-control form-control-sm table-filter-input"
                        placeholder="Filter Clinic"
                        value={filters.clinicName}
                        onChange={(e) =>
                          handleFilterChange("clinicName", e.target.value)
                        }
                      />
                    </td>
                  )}
                  {!isDoctor && (
                    <td className="border-bottom p-1">
                      <input
                        className="form-control form-control-sm table-filter-input"
                        placeholder="Filter doctor"
                        value={filters.doctor}
                        onChange={(e) =>
                          handleFilterChange("doctor", e.target.value)
                        }
                      />
                    </td>
                  )}
                  <td className="border-bottom p-1">
                    <input
                      className="form-control form-control-sm table-filter-input"
                      placeholder="Filter Charge"
                      value={filters.charges}
                      onChange={(e) =>
                        handleFilterChange("charges", e.target.value)
                      }
                    />
                  </td>
                  <td className="border-bottom p-1">
                    <input
                      className="form-control form-control-sm table-filter-input"
                      placeholder="HH:mm"
                      value={filters.duration}
                      onChange={(e) =>
                        handleFilterChange("duration", e.target.value)
                      }
                    />
                  </td>
                  <td className="border-bottom p-1">
                    <select
                      className="form-select form-select-sm table-filter-input"
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                    >
                      <option value="">Filter Category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-bottom p-1">
                    <select
                      className="form-select form-select-sm table-filter-input"
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <option value="">Filter status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="border-bottom p-1"></td>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isDoctor ? 8 : 11}
                      className="text-center py-5"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isDoctor ? 8 : 11}
                      className="text-center py-5"
                    >
                      No services found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const displayName =
                      r.name || (r.isTelemed ? "Telemed" : "Service");
                    const displayInitial = displayName.charAt(0);
                    return (
                      <tr key={r._id}>
                        <td className="ps-3">
                          <input type="checkbox" className="form-check-input" />
                        </td>

                        <td data-label="#" className="fw-bold text-secondary">
                          {total - (page - 1) * limit - i}
                        </td>

                        {!isDoctor && (
                          <td data-label="Service ID" className="text-muted">
                            {r.serviceId || i + 1}
                          </td>
                        )}

                        <td data-label="Name">
                          <div className="d-flex align-items-center gap-2 justify-content-end justify-content-md-start">
                            <div className="service-avatar-circle">
                              {r.imageUrl ? (
                                <img
                                  src={r.imageUrl}
                                  alt=""
                                  className="service-avatar-img"
                                />
                              ) : (
                                displayInitial
                              )}
                            </div>
                            <span className="fw-semibold text-dark">
                              {displayName}
                            </span>
                          </div>
                        </td>

                        {!isDoctor && (
                          <td data-label="Clinic">{r.clinicName}</td>
                        )}
                        {!isDoctor && <td data-label="Doctor">{r.doctor}</td>}

                        <td data-label="Charges">{r.charges}</td>
                        <td data-label="Duration">{r.duration || "-"}</td>

                        <td data-label="Category">
                          <span className="badge bg-light text-dark border fw-normal">
                            {r.category}
                          </span>
                        </td>

                        <td data-label="Status">
                          <div className="d-flex justify-content-end">
                            <StatusToggle
                              active={r.active}
                              onClick={(val) => toggleActive(r, val)}
                            />
                          </div>
                        </td>

                        <td data-label="Actions" className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm rounded-1 action-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(r);
                              }}
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm rounded-1 action-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                askDelete(r._id);
                              }}
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-light text-secondary gap-3">
            <div className="d-flex align-items-center gap-2 small">
              <span>Rows per page:</span>
              <select
                className="form-select form-select-sm pagination-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span>Page</span>
              <div className="border bg-white px-2 py-1 rounded">{page}</div>
              <span>of {Math.ceil(total / limit) || 1}</span>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <FiChevronLeft /> Prev
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-secondary"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-secondary small">© OneCare</div>

        {modalOpen && (
          <ServiceForm
            initial={editing}
            onClose={() => setModalOpen(false)}
            onSave={save}
            availableCategories={categories}
            isDoctor={isDoctor}
            doctorInfo={doctorInfo}
          />
        )}

        <ImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSave={handleImportSubmit}
        />

        <ConfirmDelete
          open={confirmOpen}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}