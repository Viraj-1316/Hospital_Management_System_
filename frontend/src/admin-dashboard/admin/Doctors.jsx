import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaPlus, FaTrash, FaEdit, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import "bootstrap/dist/css/bootstrap.min.css";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("csv");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // --------------- FETCH DOCTORS ---------------
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

  // --------------- DELETE DOCTOR ---------------
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await axios.delete(`http://localhost:3001/doctors/${id}`);
        setDoctors((prev) => prev.filter((doc) => doc._id !== id));
        alert("Doctor deleted successfully!");
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Error deleting doctor. Check console for details.");
      }
    }
  };

  // --------------- IMPORT MODAL HANDLERS ---------------
  const openImportModal = () => {
    setImportOpen(true);
    setImportFile(null);
    setImportType("csv");
  };

  const closeImportModal = () => {
    if (importing) return;
    setImportOpen(false);
    setImportFile(null);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0] || null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert("Please choose a CSV file first.");
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("type", importType);

      const res = await axios.post(
        "http://localhost:3001/doctors/import",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(`Imported ${res.data?.count || 0} doctors`);
      closeImportModal();
      fetchDoctors();
    } catch (err) {
      console.error("Error importing doctors:", err);
      alert("Error importing doctors. Check backend logs.");
    } finally {
      setImporting(false);
    }
  };

  // --------------- FILTERED LIST ---------------
  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchTerm) return true;
    const text = searchTerm.toLowerCase();
    return (
      (doctor.firstName || "").toLowerCase().includes(text) ||
      (doctor.lastName || "").toLowerCase().includes(text) ||
      (doctor.email || "").toLowerCase().includes(text) ||
      (doctor.clinic || "").toLowerCase().includes(text) ||
      (doctor.specialization || "").toLowerCase().includes(text)
    );
  });

  // --------------- JSX ---------------
  return (
    <AdminLayout>
      <div className="container-fluid">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary m-0">Doctors List</h4>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={openImportModal}
            >
              <FaDownload /> Import Doctors
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => navigate("/AddDoctor")}
            >
              <FaPlus /> Add Doctor
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card shadow-sm p-3 mb-4">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search doctor by name, email, clinic or specialization"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Doctors Table */}
        <div className="card shadow-sm p-3">
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
                    <td>
                      {doctor.firstName} {doctor.lastName}
                    </td>
                    <td>{doctor.clinic}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.specialization || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          doctor.status === "Active" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {doctor.status === "Active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-primary">
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(doctor._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-muted">
                    No doctors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
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

        {/* IMPORT MODAL */}
        {importOpen && (
          <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-primary">Doctors Import</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeImportModal}
                    ></button>
                  </div>
                  <form onSubmit={handleImportSubmit}>
                    <div className="modal-body">
                      <div className="row g-3 align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-1">Select type</label>
                          <select
                            className="form-select"
                            value={importType}
                            onChange={(e) => setImportType(e.target.value)}
                          >
                            <option value="csv">CSV</option>
                          </select>
                        </div>
                        <div className="col-md-8">
                          <label className="form-label mb-1">Upload File</label>
                          <div className="input-group">
                            <input
                              type="file"
                              className="form-control"
                              accept=".csv"
                              onChange={handleFileChange}
                            />
                          </div>
                        </div>
                      </div>

                      

                      <p className="mb-2 fw-semibold">
                        Following fields are required in CSV file
                      </p>
                      <ul className="mb-0">
                        <li>firstName</li>
                        <li>lastName</li>
                        <li>clinic</li>
                        <li>email</li>
                        <li>phone</li>
                        <li>dob (YYYY-MM-DD)</li>
                        <li>specialization</li>
                        <li>gender</li>
                        <li>status (Active / Inactive)</li>
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
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={importing}
                      >
                        {importing ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Doctors;
