// src/admin-dashboard/admin/AddClinic.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../styles/AddClinic.css";

import { API_BASE } from "../../config";

const API_BASE_URL = API_BASE;

const SPECIALIZATION_OPTIONS = [
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Pediatrics",
  "Gynecology"
];

export default function AddClinic() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const clinicId = searchParams.get("clinicId");
  const isEditing = Boolean(clinicId);

  // ---- Clinic Basic Details ----
  const [name, setName] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicContact, setClinicContact] = useState("");
  const [status, setStatus] = useState("Active");

  // ---- Specialization (single select) ----
  const [specialization, setSpecialization] = useState("");

  // ---- Address ----
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // ---- Admin Details ----
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminContact, setAdminContact] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  // ---- Images (file + preview) ----
  const [clinicLogoPreview, setClinicLogoPreview] = useState(null);
  const [clinicLogoFile, setClinicLogoFile] = useState(null);

  const [adminPhotoPreview, setAdminPhotoPreview] = useState(null);
  const [adminPhotoFile, setAdminPhotoFile] = useState(null);

  // Load data when editing
  useEffect(() => {
    if (!isEditing) return;

    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/clinics/${clinicId}`
        );
        const c = res.data.clinic;

        setName(c.name || "");
        setClinicEmail(c.email || "");
        setClinicContact(c.contact || "");
        setStatus(c.status || "Active");

        // specialization from first element of specialties array
        setSpecialization(
          Array.isArray(c.specialties) && c.specialties.length > 0
            ? c.specialties[0]
            : ""
        );

        setAddress(c.address?.full || "");
        setCity(c.address?.city || "");
        setCountry(c.address?.country || "");
        setPostalCode(c.address?.postalCode || "");

        setAdminFirstName(c.admin?.firstName || "");
        setAdminLastName(c.admin?.lastName || "");
        setAdminEmail(c.admin?.email || "");
        setAdminContact(c.admin?.contact || "");
        setDob(c.admin?.dob || "");
        setGender(c.admin?.gender || "");

        if (c.clinicLogo) {
          setClinicLogoPreview(`${API_BASE_URL}/uploads/${c.clinicLogo}`);
        }
        if (c.admin?.photo) {
          setAdminPhotoPreview(`${API_BASE_URL}/uploads/${c.admin.photo}`);
        }
      } catch (err) {
        console.error("Failed to load clinic:", err);
        toast.error("Failed to load clinic data");
      }
    })();
  }, [isEditing, clinicId]);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const validateForm = () => {
    if (!name || !clinicEmail || !clinicContact) {
      toast.error("Please fill clinic name, email & contact.");
      return false;
    }
    if (!specialization) {
      toast.error("Please select a specialization.");
      return false;
    }
    if (!address || !city || !country || !postalCode) {
      toast.error("Please fill complete address details.");
      return false;
    }
    if (!adminFirstName || !adminLastName || !adminEmail || !adminContact) {
      toast.error("Please fill all clinic admin details.");
      return false;
    }
    if (!dob || !gender) {
      toast.error("Please select admin DOB and gender.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const form = new FormData();

    // Clinic basic
    form.append("name", name);
    form.append("email", clinicEmail);
    form.append("contact", clinicContact);
    form.append("status", status);

    // Specialties as JSON array with single value
    form.append(
      "specialties",
      JSON.stringify(specialization ? [specialization] : [])
    );

    // Address
    form.append("address", address);
    form.append("city", city);
    form.append("country", country);
    form.append("postalCode", postalCode);

    // Admin details
    form.append("adminFirstName", adminFirstName);
    form.append("adminLastName", adminLastName);
    form.append("adminEmail", adminEmail);
    form.append("adminContact", adminContact);
    form.append("dob", dob);
    form.append("gender", gender);

    // Files
    if (clinicLogoFile) form.append("clinicLogo", clinicLogoFile);
    if (adminPhotoFile) form.append("adminPhoto", adminPhotoFile);

    try {
      const endpoint = isEditing
        ? `${API_BASE_URL}/api/clinics/${clinicId}`
        : `${API_BASE_URL}/api/clinics`;

      const method = isEditing ? axios.put : axios.post;

      const promise = method(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await toast.promise(promise, {
        loading: isEditing ? "Updating clinic..." : "Saving clinic...",
        success: isEditing
          ? "Clinic updated successfully!"
          : "Clinic added successfully!",
        error: "Failed to save clinic. Please try again.",
      });

      navigate("/clinic-list");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    navigate("/clinic-list");
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="add-clinic-card">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold">{isEditing ? "Edit Clinic" : "Add Clinic"}</h4>
          <button
            className="btn btn-blue d-flex align-items-center gap-1"
            onClick={() => navigate("/clinic-list")}
          >
            <FaArrowLeft />
            Back
          </button>
        </div>

        {/* BASIC DETAILS */}
        <div className="section-title">Basic details</div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter clinic name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email address"
              value={clinicEmail}
              onChange={(e) => setClinicEmail(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Contact No *</label>
            <div className="input-group">
              <span className="input-group-text">+91</span>
              <input
                type="text"
                className="form-control"
                placeholder="Phone number"
                value={clinicContact}
                onChange={(e) => setClinicContact(e.target.value)}
              />
            </div>
          </div>

          {/* Specialization dropdown */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Specialization *</label>
            <select
              className="form-control"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            >
              <option value="">Select specialization</option>
              {SPECIALIZATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Status *</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Clinic Logo */}
          <div className="col-md-4 mb-3 d-flex justify-content-center">
            <div className="image-upload-circle">
              {clinicLogoPreview ? (
                <img src={clinicLogoPreview} alt="clinic-logo" />
              ) : (
                <span className="text-muted">Upload</span>
              )}

              <label className="edit-icon">
                <FaEdit size={12} />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      e,
                      setClinicLogoFile,
                      setClinicLogoPreview
                    )
                  }
                />
              </label>
            </div>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className="section-title mt-4">Address</div>

        <div className="mb-3">
          <textarea
            className="form-control"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          ></textarea>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">City *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Country *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter country name"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Postal Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter postal code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
        </div>

        {/* ADMIN DETAILS */}
        <div className="section-title mt-4">Clinic Admin Detail</div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter first name"
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter last name"
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
            />
          </div>

          {/* Admin Photo */}
          <div className="col-md-4 mb-3 d-flex justify-content-center">
            <div className="image-upload-circle">
              {adminPhotoPreview ? (
                <img src={adminPhotoPreview} alt="admin-photo" />
              ) : (
                <span className="text-muted">Upload</span>
              )}

              <label className="edit-icon">
                <FaEdit size={12} />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      e,
                      setAdminPhotoFile,
                      setAdminPhotoPreview
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Contact No *</label>
            <div className="input-group">
              <span className="input-group-text">+91</span>
              <input
                type="text"
                className="form-control"
                placeholder="Phone number"
                value={adminContact}
                onChange={(e) => setAdminContact(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">DOB *</label>
            <input
              type="date"
              className="form-control"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label d-block">Gender *</label>
            <div className="d-flex gap-4">
              {["Male", "Female", "Other"].map((g) => (
                <label key={g}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                  />{" "}
                  {g}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="text-end mt-4">
          <button className="btn btn-blue me-2" onClick={handleSave}>
            {isEditing ? "Update" : "Save"}
          </button>
          <button className="btn btn-white" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
