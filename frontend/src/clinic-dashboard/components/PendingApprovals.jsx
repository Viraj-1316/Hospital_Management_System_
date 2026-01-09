// src/clinic-dashboard/components/PendingApprovals.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaUserMd, FaUserNurse, FaCheck, FaTimes, FaSpinner, FaClock, FaEnvelope, FaPhone } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import API_BASE from "../../config";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../../shared/styles/shared-components.css";

// Inline styles for premium modern look
const styles = {
    pageWrapper: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
    },
    headerSection: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "20px",
        padding: "32px",
        marginBottom: "28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(102, 126, 234, 0.25)",
    },
    headerPattern: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "300px",
        height: "100%",
        background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        opacity: 0.6,
    },
    headerContent: {
        position: "relative",
        zIndex: 1,
    },
    headerTitle: {
        color: "#fff",
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    headerSubtitle: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "15px",
        fontWeight: "400",
    },
    clinicBadge: {
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "50px",
        padding: "8px 20px",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
    },
    statsContainer: {
        display: "flex",
        gap: "12px",
        marginTop: "20px",
    },
    statCard: {
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "12px 20px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    statNumber: {
        color: "#fff",
        fontSize: "24px",
        fontWeight: "700",
    },
    statLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    cardsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
        gap: "20px",
    },
    requestCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default",
    },
    requestCardHover: {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
    },
    avatarLarge: {
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
    },
    doctorAvatar: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    staffAvatar: {
        background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    },
    userName: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1a1f36",
        marginBottom: "4px",
    },
    roleBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "50px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    doctorBadge: {
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
        color: "#667eea",
        border: "1px solid rgba(102, 126, 234, 0.2)",
    },
    staffBadge: {
        background: "linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%)",
        color: "#11998e",
        border: "1px solid rgba(17, 153, 142, 0.2)",
    },
    infoRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "10px",
        fontSize: "14px",
        color: "#64748b",
    },
    infoIcon: {
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
    },
    timeRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "#94a3b8",
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid #f1f5f9",
    },
    actionButtons: {
        display: "flex",
        gap: "10px",
        marginTop: "20px",
    },
    approveBtn: {
        flex: 1,
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        border: "none",
        borderRadius: "12px",
        padding: "14px 20px",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.25)",
    },
    rejectBtn: {
        flex: 1,
        background: "#fff",
        border: "2px solid #fee2e2",
        borderRadius: "12px",
        padding: "14px 20px",
        color: "#ef4444",
        fontSize: "14px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    emptyState: {
        textAlign: "center",
        padding: "80px 40px",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
    },
    emptyIcon: {
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
        fontSize: "48px",
    },
    emptyTitle: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#1a1f36",
        marginBottom: "8px",
    },
    emptySubtitle: {
        fontSize: "15px",
        color: "#64748b",
    },
    loadingState: {
        textAlign: "center",
        padding: "80px 40px",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
    },
    loadingSpinner: {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
        animation: "pulse 1.5s infinite",
    },
};

export default function PendingApprovals({ sidebarCollapsed, toggleSidebar }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clinicName, setClinicName] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);

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
            toast.success(`${request.name} has been approved!`, {
                icon: '🎉',
                style: {
                    borderRadius: '12px',
                    background: '#10b981',
                    color: '#fff',
                },
            });
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
            toast.success(`${request.name}'s request has been rejected`, {
                style: {
                    borderRadius: '12px',
                },
            });
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

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateString);
    };

    const doctorCount = pendingRequests.filter(r => r.role === "doctor").length;
    const staffCount = pendingRequests.filter(r => r.role !== "doctor").length;

    return (
        <div>
            {/* Global Styles */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .request-card {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                .approve-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35) !important;
                }
                .reject-btn:hover {
                    background: #fef2f2 !important;
                    border-color: #fecaca !important;
                }
                .approve-btn:disabled, .reject-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
            `}</style>

            {/* SIDEBAR */}
            <Sidebar collapsed={sidebarCollapsed} />

            {/* MAIN CONTENT */}
            <div
                className="main-content-transition"
                style={{
                    marginLeft: sidebarCollapsed ? "64px" : "250px",
                    ...styles.pageWrapper,
                }}
            >
                {/* NAVBAR */}
                <Navbar toggleSidebar={toggleSidebar} />

                {/* CONTENT */}
                <div className="container-fluid py-4 px-4">
                    <Toaster position="top-right" />

                    {/* Modern Header Section */}
                    <div style={styles.headerSection}>
                        <div style={styles.headerPattern}></div>
                        <div style={styles.headerContent}>
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                <div>
                                    <h1 style={styles.headerTitle}>
                                        <HiSparkles style={{ color: "#fbbf24" }} />
                                        Staff Approval Center
                                    </h1>
                                    <p style={styles.headerSubtitle}>
                                        Review and manage pending staff registration requests
                                    </p>
                                </div>
                                {clinicName && (
                                    <span style={styles.clinicBadge}>
                                        🏥 {clinicName}
                                    </span>
                                )}
                            </div>

                            {!loading && pendingRequests.length > 0 && (
                                <div style={styles.statsContainer}>
                                    <div style={styles.statCard}>
                                        <div style={styles.statNumber}>{pendingRequests.length}</div>
                                        <div style={styles.statLabel}>Total Pending</div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statNumber}>{doctorCount}</div>
                                        <div style={styles.statLabel}>Doctors</div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statNumber}>{staffCount}</div>
                                        <div style={styles.statLabel}>Staff</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    {loading ? (
                        <div style={styles.loadingState}>
                            <div style={styles.loadingSpinner}>
                                <FaSpinner className="spin-animation" style={{ fontSize: "28px", color: "#fff" }} />
                            </div>
                            <p style={{ fontSize: "16px", color: "#64748b", fontWeight: "500" }}>
                                Loading pending requests...
                            </p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>✅</div>
                            <h3 style={styles.emptyTitle}>All Caught Up!</h3>
                            <p style={styles.emptySubtitle}>
                                There are no pending staff registration requests at the moment.
                            </p>
                        </div>
                    ) : (
                        <div style={styles.cardsGrid}>
                            {pendingRequests.map((request, index) => (
                                <div
                                    key={request._id}
                                    className="request-card"
                                    style={{
                                        ...styles.requestCard,
                                        ...(hoveredCard === request._id ? styles.requestCardHover : {}),
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                    onMouseEnter={() => setHoveredCard(request._id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    {/* Header with Avatar and Name */}
                                    <div className="d-flex gap-3 mb-3">
                                        <div
                                            style={{
                                                ...styles.avatarLarge,
                                                ...(request.role === "doctor" ? styles.doctorAvatar : styles.staffAvatar),
                                            }}
                                        >
                                            {request.role === "doctor" ? (
                                                <FaUserMd style={{ color: "#fff" }} />
                                            ) : (
                                                <FaUserNurse style={{ color: "#fff" }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={styles.userName}>{request.name}</div>
                                            <span
                                                style={{
                                                    ...styles.roleBadge,
                                                    ...(request.role === "doctor" ? styles.doctorBadge : styles.staffBadge),
                                                }}
                                            >
                                                {request.role === "doctor" ? (
                                                    <>
                                                        <FaUserMd size={10} /> Doctor
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaUserNurse size={10} /> Staff
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div style={styles.infoRow}>
                                        <div style={styles.infoIcon}>
                                            <FaEnvelope size={14} />
                                        </div>
                                        <span>{request.email}</span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <div style={styles.infoIcon}>
                                            <FaPhone size={14} />
                                        </div>
                                        <span>{request.phone || "Not provided"}</span>
                                    </div>

                                    {/* Timestamp */}
                                    <div style={styles.timeRow}>
                                        <FaClock size={12} />
                                        <span>Requested {getTimeAgo(request.createdAt)}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={styles.actionButtons}>
                                        <button
                                            className="approve-btn"
                                            style={styles.approveBtn}
                                            onClick={() => handleApprove(request)}
                                            disabled={processingId === request._id}
                                        >
                                            {processingId === request._id ? (
                                                <FaSpinner className="spin-animation" />
                                            ) : (
                                                <FaCheck />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            className="reject-btn"
                                            style={styles.rejectBtn}
                                            onClick={() => handleReject(request)}
                                            disabled={processingId === request._id}
                                        >
                                            <FaTimes />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
