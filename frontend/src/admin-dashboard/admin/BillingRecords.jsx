import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearch, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/services.css"; // for topbar & layout spacing

const BASE = "http://localhost:3001";

export default function BillingRecords({ sidebarCollapsed = false, toggleSidebar }) {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filter, setFilter] = useState({
    id: "",
    doctor: "",
    clinic: "",
    patient: "",
    service: "",
    total: "",
    discount: "",
    due: "",
    date: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load bills
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${BASE}/bills`);
      setBills(res.data || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError("Failed to load bills.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await axios.delete(`${BASE}/bills/${id}`);
      setBills((p) => p.filter((b) => b._id !== id && b.id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  // Filtering logic preserved
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return bills
      .filter((bill) => {
        if (q) {
          const combined =
            `${bill._id || ""} ${bill.doctorName || ""} ${bill.clinicName || ""} ${bill.patientName || ""} ${(bill.services || []).join(" ")} ${bill.status || ""}`
              .toLowerCase();
          if (!combined.includes(q)) return false;
        }

        if (filter.doctor && !bill.doctorName.toLowerCase().includes(filter.doctor.toLowerCase())) return false;
        if (filter.clinic && !bill.clinicName.toLowerCase().includes(filter.clinic.toLowerCase())) return false;
        if (filter.patient && !bill.patientName.toLowerCase().includes(filter.patient.toLowerCase())) return false;
        if (filter.service && !(Array.isArray(bill.services) ? bill.services.join(" ") : "")
          .toLowerCase()
          .includes(filter.service.toLowerCase()))
          return false;

        if (filter.status && bill.status !== filter.status) return false;

        return true;
      })
      .sort((a, b) => a.billNumber - b.billNumber);
  }, [bills, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const statusBadge = (status) => {
    if (status === "paid") return "badge bg-success";
    if (status === "unpaid") return "badge bg-danger";
    return "badge bg-warning";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar identical to Services.jsx */}
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 250,
          minHeight: "100vh",
        }}
      >
        {/* Navbar identical to Services.jsx */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Page container EXACT like Services.jsx */}
        <div className="container-fluid mt-3">

          {/* ⭐ TOP BLUE ACTION BAR SAME AS SERVICES.JSX ⭐ */}
          <div className="services-topbar mb-2 services-card">
            <div style={{ fontWeight: 600 }}>Billing Records</div>

            <div className="services-actions">
              <button
                className="btn btn-light btn-sm"
                onClick={() => navigate("/AddBill")}
              >
                <FaPlus className="me-1" /> Add Bill
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card p-3 shadow-sm mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch />
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                className="form-control"
                placeholder="Search by id, doctor, patient, clinic..."
              />
            </div>
          </div>

          {/* Table Block */}
          <div className="card shadow-sm p-3">
            {loading ? (
              <div className="text-center py-5">Loading bills...</div>
            ) : error ? (
              <div className="text-danger py-3">{error}</div>
            ) : (
              <>
                <table className="table table-hover text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Doctor</th>
                      <th>Clinic</th>
                      <th>Patient</th>
                      <th>Services</th>
                      <th>Total</th>
                      <th>Discount</th>
                      <th>Due</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.length > 0 ? (
                      pageItems.map((bill, i) => (
                        <tr key={bill.billNumber || i}>
                          <td>{bill.billNumber}</td>
                          <td>{bill.doctorName}</td>
                          <td>{bill.clinicName}</td>
                          <td>{bill.patientName}</td>
                          <td>{bill.services?.join(", ")}</td>
                          <td>₹{bill.totalAmount}</td>
                          <td>₹{bill.discount}</td>
                          <td>₹{bill.amountDue}</td>
                          <td>{bill.date}</td>

                          <td>
                            <span className={statusBadge(bill.status)}>
                              {bill.status}
                            </span>
                          </td>

                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  navigate(`/EditBill/${bill._id}`)
                                }
                              >
                                <FaEdit />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(bill._id)}
                              >
                                <FaTrash />
                              </button>

                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  window.open(`${BASE}/bills/${bill._id}/pdf`)
                                }
                              >
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="py-5 text-muted">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Rows per page:
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                      className="form-select form-select-sm d-inline-block ms-2"
                      style={{ width: 80 }}
                    >
                      <option>5</option>
                      <option>10</option>
                      <option>25</option>
                    </select>
                  </div>

                  <div>
                    Page {page} of {totalPages}
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Prev
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
