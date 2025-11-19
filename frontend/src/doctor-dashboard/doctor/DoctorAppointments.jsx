// src/doctor/DoctorAppointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DoctorLayout from "../layouts/DoctorLayout";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await axios.get("http://localhost:3001/appointments");
        if (!mounted) return;
        // res.data is expected to be an array after backend change
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        if (mounted) setErr("Failed to load appointments");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => (mounted = false);
  }, []);

  const formatDate = (d) => {
    if (!d) return "N/A";
    // d might be stored as "YYYY-MM-DD" or an ISO string
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d; // fallback to raw string
    return parsed.toLocaleDateString();
  };

  return (
    <DoctorLayout>
      <div className="container-fluid py-4">
        <h3 className="fw-bold text-primary mb-4">Appointments</h3>

        {err && <div className="alert alert-warning">{err}</div>}

        {loading ? (
          <div>Loading appointments…</div>
        ) : (
          <div className="card p-3">
            {appointments.length === 0 ? (
              <div>No appointments found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => {
                      const id = a._id || a.id;
                      // prefer populated patient name, then appointment patientName, then fallback
                      const patientName =
                        (a.patientId && (a.patientId.firstName || a.patientId.lastName)
                          ? `${a.patientId.firstName || ""} ${a.patientId.lastName || ""}`.trim()
                          : a.patientName) || "-";
                      const dateStr = formatDate(a.date);
                      const timeStr = a.time || a.slot || "-";
                      const service = a.serviceName || a.services || a.service || "-";
                      const status = a.status || "scheduled";

                      return (
                        <tr key={id}>
                          <td>{patientName}</td>
                          <td>{dateStr}</td>
                          <td>{timeStr}</td>
                          <td>{service}</td>
                          <td>{status}</td>
                          <td>
                            <Link
                              to={`/doctor/appointments/${id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
