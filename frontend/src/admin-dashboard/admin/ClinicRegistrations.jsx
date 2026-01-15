// src/admin-dashboard/admin/ClinicRegistrations.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { openConfirmModal } from "../../toasterjsfiles/confirmAPI";
import { 
  FiSearch, FiFilter, FiEye, FiCheck, FiX, FiClock, 
  FiCheckCircle, FiXCircle, FiRefreshCw, FiMail, FiPhone,
  FiMapPin, FiFileText, FiCalendar, FiUser, FiHome
} from "react-icons/fi";
import { FaHospital, FaIdCard } from "react-icons/fa";
import API_BASE from "../../config";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../../shared/styles/shared-components.css";

// Rejection reason templates
const REJECTION_REASONS = [
  "Incomplete documentation submitted",
  "Invalid medical license number",
  "Duplicate registration detected",
  "Unable to verify clinic information",
  "Incorrect contact information provided",
  "Other"
];

export default function ClinicRegistrations({ sidebarCollapsed, toggleSidebar }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      const res = await axios.get(
        `${API_BASE}/api/clinic-registration?${params.toString()}`,
        getAuthConfig()
      );
      
      if (res.data.success) {
        setRegistrations(res.data.registrations);
        setCounts(res.data.counts);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Handle approve
  const handleApprove = async (registration) => {
    const confirmed = await openConfirmModal({
      title: "Approve Registration?",
      message: `Are you sure you want to approve the registration for "${registration.clinicName}"? An approval email will be sent to ${registration.email}.`,
      confirmText: "Approve",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await axios.put(
        `${API_BASE}/api/clinic-registration/${registration._id}/approve`,
        {},
        getAuthConfig()
      );
      
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRegistrations();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error approving registration:", error);
      toast.error(error.response?.data?.message || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject submission
  const submitReject = async () => {
    if (!rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    if (rejectReason === "Other" && !customReason.trim()) {
      toast.error("Please provide a custom reason");
      return;
    }

    try {
      setActionLoading(true);
      const res = await axios.put(
        `${API_BASE}/api/clinic-registration/${selectedRegistration._id}/reject`,
        { 
          reason: rejectReason, 
          customReason: rejectReason === "Other" ? customReason : undefined 
        },
        getAuthConfig()
      );
      
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRegistrations();
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason("");
        setCustomReason("");
      }
    } catch (error) {
      console.error("Error rejecting registration:", error);
      toast.error(error.response?.data?.message || "Failed to reject registration");
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = (registration) => {
    setSelectedRegistration(registration);
    setRejectReason("");
    setCustomReason("");
    setShowRejectModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      Pending: { bg: "#fef3c7", color: "#d97706", icon: <FiClock /> },
      Approved: { bg: "#dcfce7", color: "#16a34a", icon: <FiCheckCircle /> },
      Rejected: { bg: "#fee2e2", color: "#dc2626", icon: <FiXCircle /> }
    };
    const s = styles[status] || styles.Pending;
    
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "6px 12px", borderRadius: "20px",
        background: s.bg, color: s.color,
        fontSize: "12px", fontWeight: 600
      }}>
        {s.icon} {status}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fa" }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div style={{ flex: 1, marginLeft: sidebarCollapsed ? "80px" : "260px", transition: "margin 0.3s" }}>
        <Navbar toggleSidebar={toggleSidebar} />
        
        <div style={{ padding: "24px" }}>
          {/* Header */}
          <div style={{ 
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            borderRadius: "16px", padding: "24px", marginBottom: "24px", color: "#fff"
          }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
              <FaHospital style={{ marginRight: "12px" }} />
              Clinic Registrations
            </h1>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>
              Review and manage clinic registration applications
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total", count: counts.total, color: "#3b82f6", icon: <FiFileText /> },
              { label: "Pending", count: counts.pending, color: "#d97706", icon: <FiClock /> },
              { label: "Approved", count: counts.approved, color: "#16a34a", icon: <FiCheckCircle /> },
              { label: "Rejected", count: counts.rejected, color: "#dc2626", icon: <FiXCircle /> }
            ].map((stat, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: "12px", padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${stat.color}`
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>{stat.label}</p>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "1.75rem", color: stat.color }}>{stat.count}</h3>
                  </div>
                  <div style={{ fontSize: "24px", color: stat.color, opacity: 0.3 }}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ 
            background: "#fff", borderRadius: "12px", padding: "16px", 
            marginBottom: "20px", display: "flex", gap: "16px", alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by clinic name, owner, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px 10px 40px",
                  border: "1.5px solid #e2e8f0", borderRadius: "8px",
                  fontSize: "14px", outline: "none"
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiFilter style={{ color: "#64748b" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 16px", border: "1.5px solid #e2e8f0",
                  borderRadius: "8px", fontSize: "14px", outline: "none",
                  cursor: "pointer", background: "#fff"
                }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchRegistrations}
              style={{
                padding: "10px 16px", background: "#f1f5f9", border: "none",
                borderRadius: "8px", cursor: "pointer", display: "flex",
                alignItems: "center", gap: "6px", fontSize: "14px", color: "#475569"
              }}
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{ 
            background: "#fff", borderRadius: "12px", overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                Loading registrations...
              </div>
            ) : registrations.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                <FiFileText style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }} />
                <p>No registrations found</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Clinic Name</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Owner</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Email</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>City</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Type</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Date</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#475569" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#1e293b" }}>
                        {reg.clinicName}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "14px", color: "#475569" }}>
                        {reg.ownerName}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {reg.email}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {reg.city}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {reg.clinicType === "Other" ? reg.clinicTypeOther : reg.clinicType}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {formatDate(reg.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={reg.status} />
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => { setSelectedRegistration(reg); setShowDetailModal(true); }}
                            style={{
                              padding: "6px 12px", background: "#eff6ff", border: "none",
                              borderRadius: "6px", cursor: "pointer", color: "#2563eb",
                              display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                            }}
                          >
                            <FiEye /> View
                          </button>
                          {reg.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(reg)}
                                style={{
                                  padding: "6px 12px", background: "#dcfce7", border: "none",
                                  borderRadius: "6px", cursor: "pointer", color: "#16a34a",
                                  display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                                }}
                              >
                                <FiCheck /> Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(reg)}
                                style={{
                                  padding: "6px 12px", background: "#fee2e2", border: "none",
                                  borderRadius: "6px", cursor: "pointer", color: "#dc2626",
                                  display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                                }}
                              >
                                <FiX /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px"
        }} onClick={() => setShowDetailModal(false)}>
          <div style={{
            background: "#fff", borderRadius: "16px", maxWidth: "600px",
            width: "100%", maxHeight: "90vh", overflow: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: "24px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
                Registration Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Application ID */}
              <div style={{
                background: "#f0f9ff", border: "2px dashed #3b82f6",
                borderRadius: "12px", padding: "16px", textAlign: "center", marginBottom: "24px"
              }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Application ID</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.25rem", fontWeight: 700, color: "#1e40af", letterSpacing: "1px" }}>
                  {selectedRegistration.applicationId}
                </p>
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <DetailItem icon={<FiUser />} label="Owner Name" value={selectedRegistration.ownerName} />
                <DetailItem icon={<FaHospital />} label="Clinic Name" value={selectedRegistration.clinicName} />
                <DetailItem icon={<FiMail />} label="Email" value={selectedRegistration.email} />
                <DetailItem icon={<FiPhone />} label="Phone" value={selectedRegistration.phone} />
                <DetailItem icon={<FiMapPin />} label="City/Location" value={selectedRegistration.city} />
                <DetailItem icon={<FiHome />} label="Clinic Type" value={selectedRegistration.clinicType === "Other" ? selectedRegistration.clinicTypeOther : selectedRegistration.clinicType} />
                <DetailItem icon={<FaIdCard />} label="License Number" value={selectedRegistration.licenseNumber} />
                <DetailItem icon={<FiCalendar />} label="Submitted On" value={formatDate(selectedRegistration.createdAt)} />
              </div>

              {/* Message to Admin */}
              {selectedRegistration.messageToAdmin && (
                <div style={{ marginTop: "20px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Message to Admin</p>
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px", fontSize: "14px", color: "#475569" }}>
                    {selectedRegistration.messageToAdmin}
                  </div>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedRegistration.status === "Rejected" && selectedRegistration.rejectionReason && (
                <div style={{ marginTop: "20px", background: "#fef2f2", borderRadius: "8px", padding: "12px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#b91c1c", fontWeight: 600 }}>Rejection Reason</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>
                    {selectedRegistration.rejectionReason}
                  </p>
                </div>
              )}

              {/* Status */}
              <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>Current Status:</span>
                <StatusBadge status={selectedRegistration.status} />
              </div>
            </div>

            {/* Modal Footer - Actions for Pending */}
            {selectedRegistration.status === "Pending" && (
              <div style={{
                padding: "20px 24px", borderTop: "1px solid #e2e8f0",
                display: "flex", gap: "12px", justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: "10px 20px", background: "#f1f5f9", border: "none",
                    borderRadius: "8px", cursor: "pointer", fontSize: "14px", color: "#475569"
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => openRejectModal(selectedRegistration)}
                  disabled={actionLoading}
                  style={{
                    padding: "10px 20px", background: "#fee2e2", border: "none",
                    borderRadius: "8px", cursor: "pointer", fontSize: "14px", color: "#dc2626",
                    fontWeight: 600, display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <FiX /> Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedRegistration)}
                  disabled={actionLoading}
                  style={{
                    padding: "10px 20px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none", borderRadius: "8px", cursor: "pointer",
                    fontSize: "14px", color: "#fff", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <FiCheck /> Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRegistration && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1001, padding: "20px"
        }} onClick={() => setShowRejectModal(false)}>
          <div style={{
            background: "#fff", borderRadius: "16px", maxWidth: "500px", width: "100%"
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: "24px", borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #fef2f2, #fff)"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiXCircle /> Reject Registration
              </h2>
              <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                Rejecting: <strong>{selectedRegistration.clinicName}</strong>
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                Select Rejection Reason *
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: "100%", padding: "12px", border: "1.5px solid #e2e8f0",
                  borderRadius: "8px", fontSize: "14px", marginBottom: "16px"
                }}
              >
                <option value="">-- Select a reason --</option>
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>

              {rejectReason === "Other" && (
                <>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Custom Reason *
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    style={{
                      width: "100%", padding: "12px", border: "1.5px solid #e2e8f0",
                      borderRadius: "8px", fontSize: "14px", minHeight: "100px",
                      resize: "vertical", fontFamily: "inherit"
                    }}
                  />
                </>
              )}

              <div style={{
                background: "#eff6ff", border: "1px solid #bfdbfe",
                borderRadius: "8px", padding: "12px", marginTop: "16px"
              }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#1e40af" }}>
                  <strong>Note:</strong> The applicant will receive an email with the rejection reason and instructions to fix issues and reapply with their Application ID.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "20px 24px", borderTop: "1px solid #e2e8f0",
              display: "flex", gap: "12px", justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: "10px 20px", background: "#f1f5f9", border: "none",
                  borderRadius: "8px", cursor: "pointer", fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={actionLoading || !rejectReason}
                style={{
                  padding: "10px 20px", background: "#dc2626", border: "none",
                  borderRadius: "8px", cursor: "pointer", fontSize: "14px",
                  color: "#fff", fontWeight: 600, opacity: (!rejectReason || actionLoading) ? 0.6 : 1
                }}
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for detail items
function DetailItem({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "8px",
        background: "#eff6ff", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#2563eb", flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{label}</p>
        <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#1e293b", fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}
