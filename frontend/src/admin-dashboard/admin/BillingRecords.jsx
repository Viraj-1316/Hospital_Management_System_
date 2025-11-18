import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { FaSearch, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE = "http://localhost:3001";

const BillingRecords = () => {
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
      setError("Failed to load bills. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      await axios.delete(`${BASE}/bills/${id}`);
      setBills((p) => p.filter((b) => b._id !== id && b.id !== id));
      alert("Bill deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete. See console.");
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bills
      .filter((bill) => {
        if (q) {
          const combined =
            `${bill._id || bill.id || ""} ${bill.doctorName || ""} ${bill.clinicName || ""} ${bill.patientName || ""} ${(Array.isArray(bill.services) ? bill.services.join(" ") : "")} ${bill.totalAmount || ""} ${bill.discount || ""} ${bill.amountDue || ""} ${bill.status || ""}`
              .toLowerCase();
          if (!combined.includes(q)) return false;
        }

        if (filter.doctor && !(bill.doctorName || "").toLowerCase().includes(filter.doctor.toLowerCase())) return false;
        if (filter.clinic && !(bill.clinicName || "").toLowerCase().includes(filter.clinic.toLowerCase())) return false;
        if (filter.patient && !(bill.patientName || "").toLowerCase().includes(filter.patient.toLowerCase())) return false;
        if (filter.service && !(Array.isArray(bill.services) ? bill.services.join(" ") : "").toLowerCase().includes(filter.service.toLowerCase())) return false;
        if (filter.status && filter.status !== "" && bill.status !== filter.status) return false;
        if (filter.date && bill.date !== filter.date) return false;
        if (filter.total && String(bill.totalAmount).indexOf(filter.total) === -1) return false;
        if (filter.discount && String(bill.discount).indexOf(filter.discount) === -1) return false;
        if (filter.due && String(bill.amountDue).indexOf(filter.due) === -1) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [bills, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const statusBadge = (status) => {
    if (status === "paid") return "badge bg-success";
    if (status === "unpaid") return "badge bg-danger";
    return "badge bg-warning";
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary m-0">Billing Records</h4>

          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => navigate("/AddBill")}
          >
            <FaPlus /> Add Bill
          </button>
        </div>

        <div className="card shadow-sm p-3 mb-4">
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

        <div className="card shadow-sm p-3">
          {loading ? (
            <div className="text-center py-5">Loading bills...</div>
          ) : error ? (
            <div className="text-danger py-3">{error}</div>
          ) : (
            <>
              <table className="table table-hover align-middle text-center">
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
                      <tr key={bill._id || bill.id || i}>
                        <td>{bill._id || bill.id}</td>
                        <td>{bill.doctorName}</td>
                        <td>{bill.clinicName}</td>
                        <td>{bill.patientName}</td>
                        <td>{Array.isArray(bill.services) ? bill.services.join(", ") : bill.services}</td>
                        <td>₹{bill.totalAmount}</td>
                        <td>₹{bill.discount}</td>
                        <td>₹{bill.amountDue}</td>
                        <td>{bill.date}</td>
                        <td>
                          <span className={statusBadge(bill.status)}>{bill.status}</span>
                        </td>

                        {/* UPDATED ACTION BUTTONS WITH PDF DOWNLOAD */}
                        <td>
                          <div className="d-flex justify-content-center gap-2">

                            {/* Edit */}
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/EditBill/${bill._id || bill.id}`)}
                            >
                              <FaEdit />
                            </button>

                            {/* Delete */}
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(bill._id || bill.id)}
                            >
                              <FaTrash />
                            </button>

                            {/* PDF Download */}
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() =>
                                window.open(`${BASE}/bills/${bill._id || bill.id}/pdf`)
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
                      <td colSpan="11" className="text-muted py-5">
                        No Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Rows per page:&nbsp;
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    className="form-select form-select-sm d-inline-block"
                    style={{ width: 80 }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>

                <div>
                  Page {page} of {totalPages} &nbsp;
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BillingRecords;
