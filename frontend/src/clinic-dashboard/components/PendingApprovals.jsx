// src/clinic-dashboard/components/PendingApprovals.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaUserMd, FaUserNurse, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import API_BASE from "../../config";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/admin-shared.css";

export default function PendingApprovals({ sidebarCollapsed, toggleSidebar }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clinicName, setClinicName] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const getAuthConfig = () => {
        const token = localStorage.getItem("token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/approvals/pending`, getAuthConfig());
            setPendingRequests(res.data.pendingRequests || []);
            setClinicName(res.data.clinicName || "");
        } catch (error) {
            console.error("Failed to fetch pending approvals:", error);
            toast.error("Failed to load pending requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleApprove = async (request) => {
        setProcessingId(request._id);
        try {
            await axios.put(
                `${API_BASE}/api/approvals/${request._id}/approve`,
                { role: request.role },
                getAuthConfig()
            );
            toast.success(`${request.name} has been approved!`);
            // Remove from list
            setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
        } catch (error) {
            console.error("Failed to approve:", error);
            toast.error("Failed to approve request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request) => {
        if (!window.confirm(`Are you sure you want to reject ${request.name}'s registration request?`)) {
            return;
        }

        setProcessingId(request._id);
        try {
            await axios.put(
                `${API_BASE}/api/approvals/${request._id}/reject`,
                { role: request.role },
                getAuthConfig()
            );
            toast.success(`${request.name}'s request has been rejected`);
            // Remove from list
            setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
        } catch (error) {
            console.error("Failed to reject:", error);
            toast.error("Failed to reject request");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div>
            {/* SIDEBAR */}
            <Sidebar collapsed={sidebarCollapsed} />

            {/* MAIN CONTENT */}
            <div
                className="main-content-transition"
                style={{
                    marginLeft: sidebarCollapsed ? "64px" : "250px",
                    minHeight: "100vh",
                    background: "#f5f6fa",
                }}
            >
                {/* NAVBAR */}
                <Navbar toggleSidebar={toggleSidebar} />

                {/* CONTENT */}
                <div className="container-fluid py-4">
                    <Toaster position="top-right" />

                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <FaUserMd className="me-2" />
                                Pending Staff Approvals
                            </h5>
                            {clinicName && <span className="badge bg-light text-primary">{clinicName}</span>}
                        </div>

                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <FaSpinner className="fa-spin fa-2x text-primary" />
                                    <p className="mt-3 text-muted">Loading pending requests...</p>
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <div className="text-center py-5">
                                    <div style={{ fontSize: "48px", opacity: 0.5 }}>✅</div>
                                    <h5 className="text-muted mt-3">No Pending Requests</h5>
                                    <p className="text-muted">All staff registration requests have been processed.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                                <th>Requested</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRequests.map((request) => (
                                                <tr key={request._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div
                                                                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-2"
                                                                style={{ width: "40px", height: "40px" }}
                                                            >
                                                                {request.role === "doctor" ? (
                                                                    <FaUserMd className="text-primary" />
                                                                ) : (
                                                                    <FaUserNurse className="text-info" />
                                                                )}
                                                            </div>
                                                            <strong>{request.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td>{request.email}</td>
                                                    <td>{request.phone || "-"}</td>
                                                    <td>
                                                        <span className={`badge ${request.role === "doctor" ? "bg-primary" : "bg-info"}`}>
                                                            {request.role === "doctor" ? "Doctor" : "Staff"}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted small">{formatDate(request.createdAt)}</td>
                                                    <td className="text-center">
                                                        <div className="btn-group">
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={processingId === request._id}
                                                                title="Approve"
                                                            >
                                                                {processingId === request._id ? (
                                                                    <FaSpinner className="fa-spin" />
                                                                ) : (
                                                                    <FaCheck />
                                                                )}
                                                                <span className="ms-1 d-none d-md-inline">Approve</span>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleReject(request)}
                                                                disabled={processingId === request._id}
                                                                title="Reject"
                                                            >
                                                                <FaTimes />
                                                                <span className="ms-1 d-none d-md-inline">Reject</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

