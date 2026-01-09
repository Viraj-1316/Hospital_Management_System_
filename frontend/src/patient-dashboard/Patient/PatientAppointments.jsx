import React, { useEffect, useState } from "react";
import axios from "axios";
import PatientLayout from "../layouts/PatientLayout";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaPrint,
  FaCalendarPlus,
  FaCalendarAlt,
  FaFileInvoice,
  FaStop,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";

export default function PatientAppointments() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("patientToken");
  const patientStored = (() => {
    try {
      return JSON.parse(localStorage.getItem("patient") || "null");
    } catch {
      return null;
    }
  })();
  const patientId =
    patientStored?._id ||
    patientStored?.id ||
    localStorage.getItem("patientId") ||
    null;

  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState(null);

  // filters state
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    let mounted = true;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/appointments`;
        if (patientId) url += `?patientId=${patientId}`;
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? [];
        if (!mounted) return;
        setAppointments(data);
        setFiltered(data);
      } catch (err) {
        console.error("Error loading appointments:", err);
        if (mounted) setError("Failed to load appointments");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await axios.get(`${API_BASE}/doctors`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? [];
        if (!mounted) return;
        setDoctors(data);
      } catch (err) {
        console.error("Error loading doctors:", err);
      } finally {
        if (mounted) setLoadingDoctors(false);
      }
    };

    fetchAppointments();
    fetchDoctors();
    return () => (mounted = false);
  }, [patientId]);

  useEffect(() => {
    let list = [...appointments];
    if (filterDate) {
      list = list.filter((a) => {
        const apDate = a.date || a.start || a.datetime || "";
        if (!apDate) return false;
        const d = new Date(apDate);
        if (Number.isNaN(d.getTime())) return false;
        const yyyy = d.getFullYear();
        const mm = `${d.getMonth() + 1}`.padStart(2, "0");
        const dd = `${d.getDate()}`.padStart(2, "0");
        return `${yyyy}-${mm}-${dd}` === filterDate;
      });
    }
    if (filterStatus) {
      list = list.filter(
        (a) =>
          (a.status || "").toLowerCase() ===
          filterStatus.toLowerCase()
      );
    }
    if (filterDoctor) {
      list = list.filter((a) => {
        const did =
          a.doctorId ||
          a.doctor?._id ||
          a.doctor?.id ||
          a.doctorId;
        return `${did}` === `${filterDoctor}`;
      });
    }
    setFiltered(list);
    setPage(1);
  }, [filterDate, filterStatus, filterDoctor, appointments]);

  // Cancel / delete appointment
  const handleCancel = async (id) => {
    const confirmed = await window.confirm("Cancel this appointment?");
    if (!confirmed) return;
    try {
      await axios.put(
        `${API_BASE}/appointments/${id}/cancel`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setAppointments((prev) =>
        prev.map((p) =>
          p._id === id || p.id === id
            ? { ...p, status: "Cancelled" }
            : p
        )
      );
      alert("Appointment cancelled");
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel. Check console.");
    }
  };

  const handlePdf = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/appointments/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  // --------- Date + Time helpers ----------
  const getDateObj = (a) => {
    // Case 1: If we have separate date and time fields (How your booking saves it)
    if (a.date && a.time) {
      const datePart = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
      // Create a string like "2025-11-28 11:30 am"
      const combinedString = `${datePart} ${a.time}`;
      const d = new Date(combinedString);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // Case 2: Fallback logic for ISO strings or other formats
    let base = null;
    if (a.start || a.datetime) {
      base = a.start || a.datetime;
    } else if (a.date) {
      if (typeof a.date === "string" && a.date.length <= 10 && !a.date.includes("T")) {
        // Default fallback if no specific time field exists
        base = `${a.date}T09:00:00`;
      } else {
        base = a.date;
      }
    }

    if (!base) return null;
    const d = new Date(base);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const fmtDateTime = (a) => {
    // If we have a specific time string stored (e.g. "11:30 am"), prioritize displaying that directly
    // This prevents timezone shifting issues completely
    if (a.date && a.time) {
      const d = new Date(a.date);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy} (${a.time})`;
    }

    // Fallback for older data
    const d = getDateObj(a);
    if (!d) return "-";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    return `${dateStr} (${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })})`;
  };



  const paged = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / perPage)
  );

  return (
    <PatientLayout>
      <div className="container-fluid py-4">
        {/* Filters card */}
        <div className="card shadow-sm p-3 mb-4">
          <h6 className="mb-3">Filters</h6>
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <label className="form-label small">Select Date</label>
              <input
                type="date"
                className="form-control"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Select status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="booked">Booked</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Select doctor</label>
              <select
                className="form-select"
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
              >
                <option value="">All doctors</option>
                {loadingDoctors ? (
                  <option>Loading…</option>
                ) : (
                  doctors.map((d) => (
                    <option
                      key={d._id || d.id}
                      value={d._id || d.id}
                    >
                      {d.firstName
                        ? `${d.firstName} ${d.lastName || ""}`
                        : d.name || d.email}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <div className="mt-3 d-flex justify-content-end gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setFilterDate("");
                setFilterStatus("");
                setFilterDoctor("");
              }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                /* client-side only for now */
              }}
            >
              Apply filters
            </button>
          </div>
        </div>

        {/* Appointment header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <h4 className="fw-bold text-primary m-0">Appointment</h4>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => navigate("/patient/book")}
            >
              <FaPlus /> Add appointment
            </button>
            {/* <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => handlePdf(a._id)}
            >
              PDF
            </button> */}
          </div>
        </div>

        {/* Appointment list */}
        {error && <div className="alert alert-warning">{error}</div>}

        <div className="card shadow-sm p-3">
          {loading ? (
            <div>Loading appointments…</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted">No appointments found.</div>
          ) : (
            paged.map((a) => {
              const id = a._id || a.id;
              const patientName =
                a.patientName ||
                (a.patient &&
                  (a.patient.firstName
                    ? `${a.patient.firstName} ${a.patient.lastName || ""
                    }`
                    : a.patient.name)) ||
                patientStored?.name ||
                "You";
              const doctorName =
                a.doctorName ||
                (a.doctor &&
                  (a.doctor.firstName
                    ? `${a.doctor.firstName} ${a.doctor.lastName || ""
                    }`
                    : a.doctor.name)) ||
                "Doctor";
              const clinic =
                a.clinic ||
                a.clinicName ||
                (a.clinic && a.clinic.name) ||
                "Clinic";
              const service =
                a.serviceName || a.service || a.services || "Service";
              const charges =
                a.charges ?? a.fee ?? a.price ?? "—";
              const payMode =
                a.paymentMode ?? a.payment?.mode ?? "Manual";
              const status = (a.status || "Booked").toString();

              return (
                <div
                  key={id}
                  className="appointment-card card mb-3 p-3"
                >
                  <div className="d-flex gap-3 align-items-start">
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2c6bd6",
                        fontWeight: "700",
                      }}
                    >
                      {patientName?.charAt(0)?.toUpperCase() || "P"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="small text-muted">
                            {fmtDateTime(a)}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              fontWeight: 700,
                              color: "#1560ff",
                            }}
                          >
                            {patientName}
                          </div>
                          <div className="small text-muted">
                            Doctor :{" "}
                            <span style={{ color: "#2c6bd6" }}>
                              {doctorName}
                            </span>{" "}
                            &nbsp; Clinic :{" "}
                            <span style={{ color: "#2c6bd6" }}>
                              {clinic}
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="fw-semibold">
                            ₹{charges}
                          </div>
                          <div className="small text-muted">
                            {payMode}
                          </div>
                        </div>
                      </div>

                      {/* second row: service, status, calendar, actions */}
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mt-3 gap-3">
                        <div className="small text-muted">
                          {service}
                        </div>

                        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3 w-100 justify-content-md-end">
                          <div>
                            <span
                              className={`badge ${status.toLowerCase() === "booked"
                                ? "bg-primary"
                                : status.toLowerCase() ===
                                  "confirmed"
                                  ? "bg-success"
                                  : "bg-secondary"
                                }`}
                            >
                              {status.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* action buttons */}
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="View"
                              onClick={() =>
                                navigate(
                                  `/patient/appointments/${id}`
                                )
                              }
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title="Edit"
                              onClick={() =>
                                navigate(
                                  `/patient/book?edit=${id}`
                                )
                              }
                            >
                              <FaEdit />
                            </button>
                            <button
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => handlePdf(a._id)}
                                >
                              <FaPrint />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              title="Cancel"
                              onClick={() => handleCancel(id)}
                            >
                              <FaStop />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mt-3 gap-3">
          <div>Rows per page: {perPage}</div>
          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
            >
              Prev
            </button>
            <div className="btn btn-primary btn-sm">{page}</div>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
