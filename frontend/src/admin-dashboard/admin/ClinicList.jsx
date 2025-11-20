// src/admin-dashboard/admin/ClinicList.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaFileImport,
  FaPen,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import "../styles/ClinicList.css";

const API_BASE_URL = "http://localhost:3001";

export default function ClinicList() {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [search, setSearch] = useState("");

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

  // -------- Import modal state --------
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState("csv"); // only CSV for now

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let mounted = true;

    const fetchClinics = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/clinics`);
        if (!mounted) return;
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data.clinics ?? [];
        setClinics(raw);
      } catch (error) {
        console.error("Failed to load clinics:", error);
        if (mounted) setErr("Failed to load clinics");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchClinics();
    return () => {
      mounted = false;
    };
  }, []);

  const specializationOptions = useMemo(() => {
    const set = new Set();
    clinics.forEach((c) => {
      if (Array.isArray(c.specialties) && c.specialties.length > 0) {
        set.add(c.specialties[0]);
      }
    });
    return [...set];
  }, [clinics]);

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
        logo: c.clinicLogo ? `${API_BASE_URL}/uploads/${c.clinicLogo}` : null,
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
            row.tableId +
            " " +
            row.name +
            " " +
            row.email +
            " " +
            row.adminEmail +
            " " +
            row.contact +
            " " +
            row.specialization +
            " " +
            row.address +
            " " +
            row.status
          ).toLowerCase();
          if (!combined.includes(global)) return false;
        }

        const idMatch =
          !filters.id || String(row.tableId).startsWith(filters.id);

        const statusMatch =
          !filters.status || filters.status === row.status;

        const specializationMatch =
          !filters.specialization ||
          row.specialization === filters.specialization;

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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this clinic?")) return;

    const promise = axios
      .delete(`${API_BASE_URL}/api/clinics/${id}`)
      .then(() => {
        setClinics((list) => list.filter((c) => c._id !== id));
      });

    await toast.promise(promise, {
      loading: "Deleting clinic...",
      success: "Clinic deleted",
      error: "Failed to delete clinic",
    });
  };

  const handleResend = async (row) => {
    const promise = axios.post(
      `${API_BASE_URL}/api/clinics/${row._id}/resend-credentials`
    );

    await toast.promise(promise, {
      loading: "Sending credentials...",
      success: `Credentials resent to ${row.email}`,
      error: "Failed to resend credentials",
    });
  };

  // -------- Import modal logic --------
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Please choose a CSV file");
      return;
    }

    const form = new FormData();
    form.append("file", importFile);

    const promise = axios.post(
      `${API_BASE_URL}/api/clinics/import`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    try {
      const res = await toast.promise(promise, {
        loading: "Importing clinics...",
        success: (r) => {
          const d = r.data;
          return `Imported ${d.created} of ${d.total} clinics`;
        },
        error: "Failed to import clinics",
      });

      // refresh list
      const reload = await axios.get(`${API_BASE_URL}/api/clinics`);
      const raw = Array.isArray(reload.data)
        ? reload.data
        : reload.data.clinics ?? [];
      setClinics(raw);

      setShowImportModal(false);
      setImportFile(null);
    } catch (err) {
      console.error("Import error:", err);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="fw-bold text-primary mb-0">Clinic List</h3>

          <div>
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => setShowImportModal(true)}
            >
              <FaFileImport className="me-1" /> Import data
            </button>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/add-clinic")}
            >
              <FaPlus className="me-1" /> Add clinic
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="clinic-search-bar mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search clinic data by id, name, email, admin-email, speciality, address and status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {err && <div className="alert alert-warning">{err}</div>}

        {loading ? (
          <div>Loading clinics…</div>
        ) : (
          <div className="card p-3 clinic-card">
            {filteredClinics.length === 0 ? (
              <div className="p-4 text-center text-muted">
                No clinics found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle clinic-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Clinic Admin Email</th>
                      <th>Contact</th>
                      <th>Specialization</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th style={{ width: "170px", textAlign: "center" }}>
                        Action
                      </th>
                    </tr>

                    {/* Filter row */}
                    <tr className="clinic-filter-row">
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="ID"
                          value={filters.id}
                          onChange={(e) =>
                            handleFilterChange("id", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Name"
                          value={filters.name}
                          onChange={(e) =>
                            handleFilterChange("name", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Email"
                          value={filters.email}
                          onChange={(e) =>
                            handleFilterChange("email", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Admin Email"
                          value={filters.adminEmail}
                          onChange={(e) =>
                            handleFilterChange("adminEmail", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Contact"
                          value={filters.contact}
                          onChange={(e) =>
                            handleFilterChange("contact", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <select
                          className="form-select form-select-sm"
                          value={filters.specialization}
                          onChange={(e) =>
                            handleFilterChange(
                              "specialization",
                              e.target.value
                            )
                          }
                        >
                          <option value="">All</option>
                          {specializationOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Address"
                          value={filters.address}
                          onChange={(e) =>
                            handleFilterChange("address", e.target.value)
                          }
                        />
                      </th>
                      <th>
                        <select
                          className="form-select form-select-sm"
                          value={filters.status}
                          onChange={(e) =>
                            handleFilterChange("status", e.target.value)
                          }
                        >
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
                      const initials = (row.name || "C")
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={row._id}>
                          <td>{row.tableId}</td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {row.logo ? (
                                <img
                                  src={row.logo}
                                  alt={row.name}
                                  className="clinic-avatar"
                                />
                              ) : (
                                <div className="clinic-avatar placeholder">
                                  {initials}
                                </div>
                              )}
                              <div className="fw-semibold">{row.name}</div>
                            </div>
                          </td>

                          <td>{row.email}</td>
                          <td>{row.adminEmail}</td>
                          <td>{row.contact}</td>
                          <td>{row.specialization || "-"}</td>
                          <td>{row.address || "-"}</td>

                          <td>
                            <div
                              className={`status-badge ${
                                row.status === "active" ? "active" : "inactive"
                              }`}
                            >
                              {row.status === "active"
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </div>
                          </td>

                          <td className="text-center">
                            <div className="clinic-actions d-flex justify-content-center gap-2">
                              <button
                                title="Edit"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  navigate(`/add-clinic?clinicId=${row._id}`)
                                }
                              >
                                <FaPen />
                              </button>

                              <button
                                title="Resend credentials"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleResend(row)}
                              >
                                <FaSyncAlt />
                              </button>

                              <button
                                title="Delete"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(row._id)}
                              >
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
        )}
      </div>

      {/* ---------- IMPORT MODAL ---------- */}
      {showImportModal && (
        <div className="clinic-import-backdrop">
          <div className="clinic-import-modal">
            <div className="clinic-import-header">
              <h5 className="mb-0">Clinic Import</h5>
              <button
                className="btn-close"
                onClick={() => setShowImportModal(false)}
              />
            </div>

            <div className="clinic-import-body">
              <form onSubmit={handleImportSubmit}>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Select type</label>
                    <select
                      className="form-select"
                      value={importType}
                      onChange={(e) => setImportType(e.target.value)}
                    >
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label">Upload file</label>
                    <div className="input-group">
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="form-control"
                        onChange={(e) =>
                          setImportFile(e.target.files[0] || null)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="fw-semibold mb-1">
                    Following fields are required in CSV file:
                  </div>
                  <ul className="small text-muted mb-0">
                    <li>Clinic name</li>
                    <li>Email</li>
                    <li>Country Calling Code</li>
                    <li>Country Code</li>
                    <li>Contact</li>
                    <li>Specialization</li>
                    <li>Address</li>
                    <li>City</li>
                    <li>Country</li>
                    <li>Postal code</li>
                    <li>Clinic admin First Name</li>
                    <li>Clinic admin Last Name</li>
                    <li>Clinic Admin Email</li>
                    <li>Clinic admin contact</li>
                    <li>Clinic admin DOB</li>
                    <li>Clinic admin gender</li>
                  </ul>
                </div>

                <div className="clinic-import-footer text-end mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={() => setShowImportModal(false)}
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
      )}
    </AdminLayout>
  );
}
