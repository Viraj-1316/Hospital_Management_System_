// src/doctor-dashboard/doctor/DoctorAppointmentDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DoctorLayout from "../layouts/DoctorLayout";
import { API_BASE } from "../../config";

// const API_BASE = "http://localhost:3001";

export default function DoctorAppointmentDetails() {
  const { id } = useParams();          // appointment id from URL
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppt = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`${API_BASE}/appointments/${id}`);
        setAppointment(res.data);      // one appointment document
      } catch (err) {
        console.error("Failed to load appointment", err);

        if (err.response?.status === 404) {
          setError("Appointment not found (maybe deleted).");
        } else {
          setError("Failed to load appointment details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppt();
  }, [id]);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="p-4">Loading appointment…</div>
      </DoctorLayout>
    );
  }

  if (error || !appointment) {
    return (
      <DoctorLayout>
        <div className="p-4">
          <p className="text-danger mb-3">
            {error || "Appointment not found"}
          </p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </DoctorLayout>
    );
  }

  const a = appointment;

  return (
    <DoctorLayout>
      <div className="container py-4">
        <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>
          ← Back to calendar
        </button>

        <h3 className="mb-4">Appointment Details</h3>

        {/* Patient info card */}
        <div className="card p-3 mb-3">
          <h5 className="mb-2">Patient information</h5>
          <p className="mb-1">
            <strong>Name:</strong> {a.patientName || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Email:</strong> {a.patientEmail || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Phone:</strong> {a.patientPhone || "N/A"}
          </p>
        </div>

        {/* Appointment info card */}
        <div className="card p-3 mb-3">
          <h5 className="mb-2">Appointment details</h5>
          <p className="mb-1">
            <strong>Doctor:</strong> {a.doctorName || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Clinic:</strong> {a.clinic || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Date:</strong> {a.date || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Time:</strong> {a.time || "N/A"}
          </p>
          <p className="mb-1">
            <strong>Service:</strong>{" "}
            {a.serviceName || a.service || "Appointment"}
          </p>
          <p className="mb-1">
            <strong>Status:</strong> {a.status || "scheduled"}
          </p>
          <p className="mb-1">
            <strong>Notes:</strong> {a.notes || "-"}
          </p>
        </div>
      </div>
    </DoctorLayout>
  );
}
