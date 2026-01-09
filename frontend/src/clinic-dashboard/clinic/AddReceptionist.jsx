import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import {
  addReceptionist,
  updateReceptionist,
  getReceptionistById,
} from "../../utils/receptionistApi";
import axios from "axios";
import "../../shared/styles/shared-forms.css";

import API_BASE from "../../config";

export default function AddReceptionist() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const receptionistId = params.get("receptionistId");
  const isEdit = Boolean(receptionistId);

  // Get clinic info from localStorage for auto-detecting clinic
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const autoClinicName = authUser?.clinicName || "";

  const [clinics, setClinics] = useState([]);
  const [autoClinicId, setAutoClinicId] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    clinicId: "",
    mobile: "",
    dob: "",
    gender: "",
    status: "active",
    address: "",
    country: "",
    city: "",
    postalCode: "",
  });

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // -------------------------------
  // LOAD CLINICS FOR DROPDOWN
  // -------------------------------
  useEffect(() => {
    const loadClinics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/clinics`);
        const rows = Array.isArray(res.data) ? res.data : res.data.clinics ?? [];
        setClinics(rows);
        
        // Auto-detect clinic ID if clinicName is available
        if (autoClinicName) {
          const matchedClinic = rows.find(c => 
            (c.name || c.clinicName || "").toLowerCase() === autoClinicName.toLowerCase()
          );
          if (matchedClinic) {
            setAutoClinicId(matchedClinic._id);
            setForm(prev => ({ ...prev, clinicId: matchedClinic._id }));
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load clinics");
      }
    };

    loadClinics();
  }, [autoClinicName]);

  // -------------------------------
  // EDIT MODE → LOAD RECEPTIONIST
  // -------------------------------
  useEffect(() => {
    if (!isEdit) return;

    const loadReceptionist = async () => {
      try {
        const res = await getReceptionistById(receptionistId);
        const r = res.data?.data;
        if (!r) return;

        const [firstName = "", lastName = ""] = (r.name || "").split(" ");

        setForm((prev) => ({
          ...prev,
          firstName,
          lastName,
          email: r.email || "",
          clinicId: r.clinicIds?.[0]?._id || "",
          mobile: r.mobile || "",
          status: r.status ? "active" : "inactive",
          address: r.address || "",
          // these fields are UI-only; backend doesn't have them yet
          dob: r.dob || "",
          // Normalize gender to Title Case to match radio buttons
          gender: r.gender
            ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1).toLowerCase()
            : "",
          country: r.country || "",
          city: r.city || "",
          postalCode: r.postalCode || "",
        }));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load receptionist");
      }
    };

    loadReceptionist();
  }, [isEdit, receptionistId]);

  // -------------------------------
  // SUBMIT (ADD / EDIT)
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and Last name are required");
      return;
    }
    if (!form.clinicId) {
      toast.error("Select a clinic");
      return;
    }

    const payload = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      mobile: form.mobile,
      address: form.address,
      clinicIds: [form.clinicId],
      status: form.status === "active",
      dob: form.dob,
      gender: form.gender,
      country: form.country,
      city: form.city,
      postalCode: form.postalCode,
    };

    const promise = isEdit
      ? updateReceptionist(receptionistId, payload)
      : addReceptionist(payload);

    await toast.promise(promise, {
      loading: isEdit ? "Updating receptionist..." : "Creating receptionist...",
      success: isEdit ? "Receptionist updated" : "Receptionist added",
      error: "Failed to save receptionist",
    });

    navigate("/clinic-dashboard/receptionists");
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />

      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-primary mb-0">
            {isEdit ? "Edit receptionist" : "Add receptionist"}
          </h3>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card p-4 receptionist-form-card">
            <h5 className="section-title">Basic details</h5>

            <div className="row">
              {/* First Name */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={form.firstName}
                  onChange={(e) => handleInput("firstName", e.target.value)}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={form.lastName}
                  onChange={(e) => handleInput("lastName", e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => handleInput("email", e.target.value)}
                  required
                />
              </div>

              {/* Clinic */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Select Clinic {autoClinicId ? "(Auto-detected)" : ""}<span className="text-danger">*</span>
                </label>
                {autoClinicId ? (
                  <input
                    className="form-control bg-light"
                    value={autoClinicName}
                    readOnly
                  />
                ) : (
                  <select
                    className="form-select"
                    value={form.clinicId}
                    onChange={(e) => handleInput("clinicId", e.target.value)}
                    required
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Contact */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Contact No <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={form.mobile}
                  onChange={(e) => handleInput("mobile", e.target.value)}
                  placeholder="Phone number"
                  required
                />
              </div>

              {/* DOB (UI only for now) */}
              <div className="col-md-4 mb-3">
                <label className="form-label">DOB</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dob}
                  onChange={(e) => handleInput("dob", e.target.value)}
                />
              </div>

              {/* Gender (UI only) */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Gender</label>
                <div className="d-flex gap-3 mt-1">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="d-flex align-items-center gap-1">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={() => handleInput("gender", g)}
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => handleInput("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

            
            </div>

            {/* Other details */}
            <h5 className="section-title mt-4">Other details</h5>

            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.address}
                  onChange={(e) => handleInput("address", e.target.value)}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Country</label>
                <input
                  className="form-control"
                  value={form.country}
                  onChange={(e) => handleInput("country", e.target.value)}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={form.city}
                  onChange={(e) => handleInput("city", e.target.value)}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Postal Code</label>
                <input
                  className="form-control"
                  value={form.postalCode}
                  onChange={(e) => handleInput("postalCode", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="text-end my-3">
            <button type="submit" className="btn btn-primary me-2">
              Save
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/clinic-dashboard/receptionists")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
