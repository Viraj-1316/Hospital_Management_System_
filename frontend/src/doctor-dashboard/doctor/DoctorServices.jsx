// src/doctor/DoctorServices.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config";
import DoctorLayout from "../layouts/DoctorLayout";

export default function DoctorServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await axios.get(`${API_BASE}/services`);
        if (!mounted) return;
        setServices(Array.isArray(res.data) ? res.data : res.data.data ?? []);
      } catch (error) {
        console.error(error);
        if (mounted) setErr("Failed to load services");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => (mounted = false);
  }, []);

  return (
    <DoctorLayout>
      <div className="container-fluid py-4">
        <h3 className="fw-bold text-primary mb-4">Services</h3>

        {err && <div className="alert alert-warning">{err}</div>}

        {loading ? (
          <div>Loading services…</div>
        ) : (
          <div className="card p-3">
            {services.length === 0 ? (
              <div>No services found.</div>
            ) : (
              <div className="list-group">
                {services.map((s) => (
                  <div key={s._id || s.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{s.name || s.title}</div>
                      <div className="text-muted small">{s.description || s.desc || ""}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">₹{s.price ?? s.fee ?? "0"}</div>
                      <a href={`/doctor/services/${s._id || s.id}`} className="btn btn-sm btn-outline-primary mt-2">View</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
