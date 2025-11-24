import React, { useEffect, useMemo, useState } from "react";
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
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  getReceptionists,
  deleteReceptionist,
  toggleReceptionistStatus,
  resendCredentials,
  importReceptionists,
} from "../utils/receptionistApi";

import "../styles/ReceptionistList.css";

export default function ReceptionistList({
  sidebarCollapsed = false,
  toggleSidebar,
}) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    id: "",
    name: "",
    clinic: "",
    email: "",
    mobile: "",
    status: "",
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Load receptionists
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getReceptionists();
        const rows = res.data?.data || [];
        setData(rows);

        const clinicSet = new Set();
        rows.forEach((r) => {
          (r.clinicIds || []).forEach((c) => clinicSet.add(c.name));
        });

        setClinics([...clinicSet]);
      } catch (err) {
        toast.error("Failed to load receptionists");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Processed rows
  const processed = useMemo(() => {
    const match = (value, filter) =>
      value?.toString().toLowerCase().includes(filter.toLowerCase());

    return data
      .map((item, index) => {
        const clinicNames = item.clinicIds?.map((c) => c.name).join(", ") || "-";
        return {
          ...item,
          tableId: index + 1,
          clinicNames,
          statusText: item.status ? "active" : "inactive",
        };
      })
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
            row.mobile +
            " " +
            row.clinicNames +
            " " +
            row.statusText
          ).toLowerCase();

          if (!combined.includes(global)) return false;
        }

        return (
          (!filters.id || String(row.tableId).startsWith(filters.id)) &&
          (!filters.name || match(row.name, filters.name)) &&
          (!filters.email || match(row.email, filters.email)) &&
          (!filters.mobile || match(row.mobile, filters.mobile)) &&
          (!filters.clinic || row.clinicNames.includes(filters.clinic)) &&
          (!filters.status || filters.status === row.statusText)
        );
      });
  }, [data, filters, search]);

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this receptionist?")) return;

    const p = deleteReceptionist(id).then(() => {
      setData((list) => list.filter((i) => i._id !== id));
    });

    await toast.promise(p, {
      loading: "Deleting...",
      success: "Deleted",
      error: "Failed",
    });
  };

  // Resend credentials
  const handleResend = async (id) => {
    const p = resendCredentials(id);
    await toast.promise(p, {
      loading: "Sending credentials...",
      success: "Credentials sent",
      error: "Failed",
    });
  };

  // Toggle status
  const handleToggleStatus = async (id) => {
    try {
      const p = toggleReceptionistStatus(id);
      const res = await toast.promise(p, {
        loading: "Updating...",
        success: "Updated",
        error: "Failed",
      });

      const newStatus = res.data.status;

      setData((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {}
  };

  // Import CSV
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Choose CSV file");
      return;
    }

    const form = new FormData();
    form.append("file", importFile);

    try {
      const p = importReceptionists(form);

      await toast.promise(p, {
        loading: "Importing...",
        success: "Done",
        error: "Failed",
      });

      window.location.reload();
    } catch (err) {}
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* MAIN WRAPPER */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar collapsed={sidebarCollapsed} />

        <div
          className="flex-grow-1 main-content-transition"
          style={{
            marginLeft: sidebarCollapsed ? 64 : 250,
            minHeight: "100vh",
          }}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          {/* MATCHING SERVICES LAYOUT EXACTLY */}
          <div className="container-fluid mt-3">
            {/* Blue Topbar identical to Services.jsx */}
            <div className="services-topbar mb-2 services-card">
              <h5 className="fw-bold text-white mb-0">Receptionist List</h5>

              <div className="services-actions">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setShowImportModal(true)}
                >
                  <FaFileImport className="me-1" /> Import data
                </button>

                <button
                  className="btn btn-light btn-sm"
                  onClick={() => navigate("/add-receptionist")}
                >
                  <FaPlus className="me-1" /> Add receptionist
                </button>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="reception-search-bar mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search receptionist by ID, name, clinic, email, mobile and status"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="card p-3 reception-card">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Clinic Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>

                    {/* FILTERS */}
                    <tr className="reception-filter-row">
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
                        <select
                          className="form-select form-select-sm"
                          value={filters.clinic}
                          onChange={(e) =>
                            handleFilterChange("clinic", e.target.value)
                          }
                        >
                          <option value="">All</option>
                          {clinics.map((c, i) => (
                            <option key={i} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
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
                          placeholder="Mobile"
                          value={filters.mobile}
                          onChange={(e) =>
                            handleFilterChange("mobile", e.target.value)
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

                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {processed.map((row) => {
                      const initials = row.name
                        ?.split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={row._id}>
                          <td>{row.tableId}</td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="reception-avatar">{initials}</div>
                              <div className="fw-semibold">{row.name}</div>
                            </div>
                          </td>

                          <td>{row.clinicNames}</td>
                          <td>{row.email}</td>
                          <td>{row.mobile || "-"}</td>

                          <td>
                            <div
                              className={`status-badge ${
                                row.status ? "active" : "inactive"
                              }`}
                            >
                              {row.status ? "ACTIVE" : "INACTIVE"}
                            </div>
                          </td>

                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  navigate(
                                    `/add-receptionist?receptionistId=${row._id}`
                                  )
                                }
                              >
                                <FaPen />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleResend(row._id)}
                              >
                                <FaSyncAlt />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(row._id)}
                              >
                                <FaTrash />
                              </button>
                            </div>

                            <div className="form-check form-switch mt-2 d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={row.status}
                                onChange={() => handleToggleStatus(row._id)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IMPORT MODAL */}
            {showImportModal && (
              <div className="reception-import-backdrop">
                <div className="reception-import-modal">
                  <div className="reception-import-header">
                    <h5 className="mb-0">Import Receptionists</h5>
                    <button
                      className="btn-close"
                      onClick={() => setShowImportModal(false)}
                    />
                  </div>

                  <div className="reception-import-body">
                    <form onSubmit={handleImport}>
                      <label className="form-label">Upload CSV File</label>
                      <input
                        type="file"
                        accept=".csv"
                        className="form-control mb-3"
                        onChange={(e) => setImportFile(e.target.files[0])}
                      />

                      <div className="mb-3">
                        <p className="fw-semibold mb-2">CSV Required Fields:</p>
                        <ul className="small mb-0 text-muted">
                          <li>name</li>
                          <li>email</li>
                          <li>mobile</li>
                          <li>address</li>
                          <li>clinics (comma separated names)</li>
                          <li>status (active/inactive)</li>
                          <li>gender</li>
                          <li>dob</li>
                          <li>country</li>
                          <li>city</li>
                          <li>postalCode</li>
                        </ul>
                      </div>

                      <div className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary me-2"
                          onClick={() => setShowImportModal(false)}
                        >
                          Cancel
                        </button>

                        <button type="submit" className="btn btn-primary">
                          Import
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
