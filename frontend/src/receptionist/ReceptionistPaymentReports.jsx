// src/receptionist/ReceptionistPaymentReports.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { 
  FaSearch, 
  FaFilter, 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaCoins, 
  FaReceipt,
  FaCalendarAlt,
  FaExternalLinkAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import API_BASE from "../config";

/* ---------- SCOPED CSS ---------- */
const paymentStyles = `
  .payment-scope { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fb; }
  .payment-scope .main-content { min-height: 100vh; transition: margin-left 0.3s; }
  
  /* --- Summary Cards --- */
  .payment-scope .summary-card {
    border-radius: 16px;
    padding: 24px;
    color: #fff;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: default;
  }
  .payment-scope .summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  }
  .payment-scope .summary-card .card-icon {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.2;
    font-size: 4rem;
  }
  .payment-scope .summary-card h6 { 
    font-weight: 500; 
    opacity: 0.9; 
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  .payment-scope .summary-card h2 { 
    font-weight: 700; 
    margin-bottom: 4px;
    font-size: 1.8rem;
  }
  .payment-scope .summary-card small { 
    opacity: 0.8; 
    font-size: 0.8rem;
  }
  
  .payment-scope .card-total { 
    background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%); 
  }
  .payment-scope .card-cash { 
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
  }
  .payment-scope .card-online { 
    background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); 
  }
  .payment-scope .card-count { 
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); 
  }

  /* --- Filter Bar --- */
  .payment-scope .filter-bar {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .payment-scope .filter-bar .form-control,
  .payment-scope .filter-bar .form-select {
    border-radius: 8px;
    border: 1px solid #e0e5ec;
    padding: 10px 14px;
    font-size: 0.9rem;
  }
  .payment-scope .filter-bar .form-control:focus,
  .payment-scope .filter-bar .form-select:focus {
    border-color: #0891b2;
    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
  }

  /* --- Table --- */
  .payment-scope .table-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .payment-scope .table-header {
    padding: 20px 24px;
    border-bottom: 1px solid #eef2f7;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .payment-scope .custom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .payment-scope .custom-table thead th {
    font-weight: 600;
    color: #5a6a85;
    padding: 14px 20px;
    text-align: left;
    background: #f8fafc;
    border-bottom: 2px solid #eef2f7;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }
  .payment-scope .custom-table tbody tr {
    transition: background 0.2s;
  }
  .payment-scope .custom-table tbody tr:hover {
    background: #f8fafc;
  }
  .payment-scope .custom-table tbody td {
    padding: 16px 20px;
    border-bottom: 1px solid #eef2f7;
    vertical-align: middle;
  }

  /* --- Badges --- */
  .payment-scope .badge-cash {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: #fff;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .payment-scope .badge-online {
    background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
    color: #fff;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .payment-scope .badge-status-paid {
    background: #dcfce7;
    color: #16a34a;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
  }
  .payment-scope .badge-status-partial {
    background: #fef3c7;
    color: #d97706;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  /* --- Razorpay ID Styling --- */
  .payment-scope .razorpay-id {
    font-family: 'Monaco', 'Consolas', monospace;
    background: #f0f4ff;
    color: #5046e5;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* --- Empty State --- */
  .payment-scope .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #94a3b8;
  }
  .payment-scope .empty-state svg {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  /* --- Pagination --- */
  .payment-scope .pagination-bar {
    padding: 16px 24px;
    border-top: 1px solid #eef2f7;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #64748b;
    font-size: 0.85rem;
  }
  .payment-scope .pagination-btn {
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .payment-scope .pagination-btn:hover:not(:disabled) {
    background: #0891b2;
    color: #fff;
    border-color: #0891b2;
  }
  .payment-scope .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Animated Number Component with count-up effect
const AnimatedNumber = ({ value, duration = 1000, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const startTimeRef = React.useRef(null);
  const startValueRef = React.useRef(0);
  
  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.floor(
        startValueRef.current + (value - startValueRef.current) * easeOutQuart
      );
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return (
    <span>
      {prefix}{displayValue.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

export default function ReceptionistPaymentReports({ sidebarCollapsed = false, toggleSidebar }) {
  const navigate = useNavigate();

  // Summary stats
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    cashRevenue: 0,
    onlineRevenue: 0,
    transactionCount: 0,
    cashCount: 0,
    onlineCount: 0
  });

  // Transactions list
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    paymentMethod: "all",
    startDate: "",
    endDate: "",
    search: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch summary stats
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await axios.get(`${API_BASE}/api/transactions/summary?${params}`, getAuthConfig());
      setSummary(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.paymentMethod !== "all") params.append("paymentMethod", filters.paymentMethod);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);

      const res = await axios.get(`${API_BASE}/api/transactions?${params}`, getAuthConfig());
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  // Re-fetch when filters change (debounced for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSummary();
      fetchTransactions();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return transactions.slice(start, start + rowsPerPage);
  }, [transactions, currentPage]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  return (
    <>
      <style>{paymentStyles}</style>
      <Toaster position="top-right" />

      <div className="payment-scope d-flex">
        <Sidebar collapsed={sidebarCollapsed} />

        <div
          className="flex-grow-1 main-content"
          style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
        >
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid py-4 px-4">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="fw-bold text-dark mb-1">Payment Reports</h3>
                <p className="text-muted mb-0">Track all cash and online transactions</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="summary-card card-total">
                  <FaMoneyBillWave className="card-icon" />
                  <h6>Total Revenue</h6>
                  <h2><AnimatedNumber value={summary.totalRevenue || 0} prefix="₹" duration={1200} /></h2>
                  <small><AnimatedNumber value={summary.transactionCount || 0} duration={800} /> transactions</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card card-cash">
                  <FaCoins className="card-icon" />
                  <h6>Cash Payments</h6>
                  <h2><AnimatedNumber value={summary.cashRevenue || 0} prefix="₹" duration={1200} /></h2>
                  <small><AnimatedNumber value={summary.cashCount || 0} duration={800} /> transactions</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card card-online">
                  <FaCreditCard className="card-icon" />
                  <h6>Online Payments</h6>
                  <h2><AnimatedNumber value={summary.onlineRevenue || 0} prefix="₹" duration={1200} /></h2>
                  <small><AnimatedNumber value={summary.onlineCount || 0} duration={800} /> transactions</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="summary-card card-count">
                  <FaReceipt className="card-icon" />
                  <h6>Average Transaction</h6>
                  <h2><AnimatedNumber value={summary.averageTransaction || 0} prefix="₹" duration={1200} /></h2>
                  <small>per transaction</small>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-semibold text-muted small">Payment Method</label>
                  <select
                    className="form-select"
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  >
                    <option value="all">All Payments</option>
                    <option value="Cash">Cash Only</option>
                    <option value="Online">Online Only (Razorpay)</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold text-muted small">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold text-muted small">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-muted small">Search</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Bill number, patient name, payment ID..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary w-100"
                    style={{ height: '42px' }}
                    onClick={() => setFilters({ paymentMethod: "all", startDate: "", endDate: "", search: "" })}
                    title="Clear filters"
                  >
                    <FaFilter />
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="table-card">
              <div className="table-header">
                <h5 className="fw-bold mb-0">Transaction History</h5>
                <span className="text-muted">{transactions.length} records</span>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <FaReceipt />
                  <h5>No transactions found</h5>
                  <p>Try adjusting your filters or date range</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Bill #</th>
                          <th>Patient</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Razorpay ID</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((tx) => (
                          <tr key={tx._id}>
                            <td>
                              <span className="fw-semibold">{tx.billNumber}</span>
                            </td>
                            <td>{tx.patientName || "-"}</td>
                            <td>
                              {tx.paymentMethod === "Online" ? (
                                <span className="badge-online">
                                  <FaCreditCard size={12} /> Online
                                </span>
                              ) : tx.paymentMethod === "Cash" ? (
                                <span className="badge-cash">
                                  <FaCoins size={12} /> Cash
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="fw-semibold">{formatCurrency(tx.paidAmount)}</td>
                            <td>
                              {tx.razorpayPaymentId ? (
                                <span className="razorpay-id">{tx.razorpayPaymentId}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <FaCalendarAlt className="text-muted" size={12} />
                                {tx.onlinePaymentDate ? formatDate(tx.onlinePaymentDate) : formatDate(tx.date)}
                              </div>
                            </td>
                            <td>
                              <span className={tx.status === "paid" ? "badge-status-paid" : "badge-status-partial"}>
                                {tx.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/receptionist/edit-bill/${tx._id}`)}
                                title="View Bill"
                              >
                                <FaExternalLinkAlt size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination-bar">
                    <span>
                      Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, transactions.length)} of {transactions.length}
                    </span>
                    <div className="d-flex gap-2">
                      <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </button>
                      <button
                        className="pagination-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
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
    </>
  );
}
