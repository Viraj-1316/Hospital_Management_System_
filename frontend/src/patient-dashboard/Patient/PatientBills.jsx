import React, { useEffect, useState } from "react";
import { FiSearch, FiPrinter } from "react-icons/fi";
import { FaCreditCard } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import PatientLayout from "../layouts/PatientLayout";
import API_BASE from "../../config";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function PatientBills() {
  const [rows, setRows] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [payingBillId, setPayingBillId] = useState(null);

  // Razorpay settings
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");

  // Filters State
  const [filters, setFilters] = useState({
    encounterId: "", doctor: ""
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch Razorpay settings
  useEffect(() => {
    const fetchRazorpaySettings = async () => {
      try {
        const res = await api.get("/api/razorpay/settings");
        setRazorpayEnabled(res.data.razorpayEnabled || false);
        setRazorpayKeyId(res.data.razorpayKeyId || "");
      } catch (err) {
        console.error("Error fetching Razorpay settings:", err);
      }
    };
    fetchRazorpaySettings();
    loadRazorpayScript();
  }, []);

  // Handle PDF Function
  const handlePdf = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/bills/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
    }
  };

  // Handle Pay Online
  const handlePayOnline = async (bill) => {
    if (!razorpayEnabled || !razorpayKeyId) {
      toast.error("Online payment is not configured. Please contact support.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error("Failed to load payment gateway. Please try again.");
      return;
    }

    setPayingBillId(bill._id);

    try {
      // Create order
      const orderRes = await api.post("/api/razorpay/create-order", { billId: bill._id });
      const order = orderRes.data;

      // Get patient info
      let authUser = {};
      try {
        authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      } catch (e) {}

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "OneCare Hospital",
        description: `Bill #${order.billNumber}`,
        order_id: order.id,
        prefill: {
          name: order.patientName || authUser.name || "",
          email: authUser.email || "",
          contact: authUser.phone || ""
        },
        theme: {
          color: "#0d6efd"
        },
        handler: async (response) => {
          try {
            // Verify payment
            await api.post("/api/razorpay/verify-payment", {
              billId: bill._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            toast.success("Payment successful! Bill has been marked as paid.");
            
            // Refresh bills list
            fetchBills();
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setPayingBillId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingBillId(null);
            toast.error("Payment cancelled");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setPayingBillId(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setPayingBillId(null);
    }
  };

  // Check if bill can be paid online
  const canPayOnline = (bill) => {
    return (
      razorpayEnabled &&
      bill.paymentMethod === "Online" &&
      bill.status !== "paid" &&
      (bill.amountDue > 0 || bill.totalAmount > 0)
    );
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const patientId = localStorage.getItem("patientId");

      const [billsRes, encRes] = await Promise.all([
        api.get(`/bills?patientId=${patientId}`),
        api.get("/encounters")
      ]);

      const myBills = Array.isArray(billsRes.data) ? billsRes.data : (billsRes.data.bills || []);
      const allEncounters = Array.isArray(encRes.data) ? encRes.data : (encRes.data.encounters || []);

      setEncounters(allEncounters);

      // Apply Search & Column Filters (Client-side)
      let processedBills = myBills.filter(bill => {
        const customEncId = lookupCustomId(bill, allEncounters);

        // Global Search
        if (search) {
          const str = (JSON.stringify(bill) + customEncId).toLowerCase();
          if (!str.includes(search.toLowerCase())) return false;
        }

        // Column Filters
        if (filters.encounterId && !customEncId.toLowerCase().includes(filters.encounterId.toLowerCase())) return false;
        if (filters.doctor && !bill.doctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) return false;

        return true;
      });

      setRows(processedBills);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, filters]);

  const lookupCustomId = (bill, list = encounters) => {
    // 1. Try to find in the fetched encounters list
    // bill.encounterId might be an object (populated) or string (ObjectId)
    const billEncIdStr = (typeof bill.encounterId === 'object' && bill.encounterId?._id) 
        ? bill.encounterId._id.toString() 
        : (bill.encounterId || "").toString();

    if (list && list.length > 0) {
        const found = list.find(e => (e._id || e.id).toString() === billEncIdStr);
        if (found && found.encounterId) return found.encounterId;
    }

    // 2. Check if bill has it directly (populated or stored)
    if (bill.encounterCustomId) return bill.encounterCustomId;
    
    // 3. Check if populated in bill
    if (typeof bill.encounterId === 'object' && bill.encounterId.encounterId) {
        return bill.encounterId.encounterId;
    }

    // 4. Fallback: If it's already a custom string
    if (typeof bill.encounterId === 'string' && bill.encounterId.startsWith("ENC-")) {
        return bill.encounterId;
    }

    return "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === 'paid') return <span className="badge bg-success">PAID</span>;
    if (s === 'partial') return <span className="badge bg-warning text-dark">PARTIAL</span>;
    return <span className="badge bg-danger">{(status || "UNPAID").toUpperCase()}</span>;
  };

  const paged = rows.slice((page - 1) * limit, page * limit);
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));

  return (
    <PatientLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary m-0">My Bills</h4>
        </div>

        {/* Search & Filter Card */}
        <div className="card shadow-sm p-3 mb-4">
          <h6 className="mb-3">Filters</h6>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small">Search Bills</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by doctor, clinic, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Encounter ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Filter by Encounter ID"
                value={filters.encounterId}
                onChange={(e) => handleFilter('encounterId', e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Doctor</label>
              <input
                type="text"
                className="form-control"
                placeholder="Filter by Doctor"
                value={filters.doctor}
                onChange={(e) => handleFilter('doctor', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 d-flex justify-content-end gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch("");
                setFilters({ encounterId: "", doctor: "" });
              }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { /* client-side filtering already applied */ }}
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Bills Table Card */}
        <div className="card shadow-sm p-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted mb-0">Loading bills...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-muted text-center py-4">No bills found.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Encounter ID</th>
                      <th>Doctor</th>
                      <th>Clinic</th>
                      <th>Total</th>
                      <th>Due</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row, i) => (
                      <tr key={row._id || i}>
                        <td>{(page - 1) * limit + i + 1}</td>
                        <td>
                          <span className="badge bg-light text-primary border" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {lookupCustomId(row)}
                          </span>
                        </td>
                        <td>{row.doctorName}</td>
                        <td>{row.clinicName}</td>
                        <td><strong>₹{row.totalAmount}</strong></td>
                        <td className={row.amountDue > 0 ? "text-danger fw-bold" : ""}>₹{row.amountDue}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{getStatusBadge(row.status)}</td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-dark"
                              onClick={() => handlePdf(row._id)}
                              title="Print PDF"
                            >
                              <FiPrinter className="me-1" /> Print
                            </button>
                            
                            {canPayOnline(row) && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handlePayOnline(row)}
                                disabled={payingBillId === row._id}
                                title="Pay Online"
                              >
                                <FaCreditCard className="me-1" />
                                {payingBillId === row._id ? "Processing..." : "Pay Now"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mt-3 gap-3">
                <div className="text-muted small">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, rows.length)} of {rows.length} bills
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="btn btn-primary btn-sm">{page}</div>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}