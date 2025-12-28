// src/pages/admin/AddDoctor.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaArrowLeft, FaSave, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminLayout from "../layouts/AdminLayout";

import API_BASE from "../../config";

const AddDoctor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const qualificationRef = useRef(null);

  const [showQualificationForm, setShowQualificationForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    clinic: "",
    phone: "",
    dob: "",
    specialization: "",
    experience: "",
    gender: "",
    status: "Active",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const [qualification, setQualification] = useState({
    degree: "",
    university: "",
    year: "",
  });

  const [qualifications, setQualifications] = useState([]);

  // clinic list state
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [clinicsError, setClinicsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we're in edit mode and populate form
  useEffect(() => {
    if (location.state?.editDoctor) {
      const doctor = location.state.editDoctor;
      setIsEditMode(true);
      setEditDoctorId(doctor._id);
      setFormData({
        firstName: doctor.firstName || "",
        lastName: doctor.lastName || "",
        email: doctor.email || "",
        clinic: doctor.clinic || "",
        phone: doctor.phone || "",
        dob: doctor.dob || "",
        specialization: doctor.specialization || "",
        experience: doctor.experience || "",
        gender: doctor.gender || "",
        status: doctor.status || "Active",
        address: doctor.address || "",
        city: doctor.city || "",
        country: doctor.country || "",
        postalCode: doctor.postalCode || "",
      });
      if (doctor.qualifications && Array.isArray(doctor.qualifications)) {
        setQualifications(doctor.qualifications);
      }
    }
  }, [location.state]);

  // load clinics from backend: GET /api/clinics -> { success, clinics }
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setClinicsLoading(true);
        setClinicsError("");

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/clinics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error("Failed to fetch clinics");
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load clinics");
        }

        const list = Array.isArray(data.clinics) ? data.clinics : [];
        setClinics(list);
      } catch (err) {
        setClinicsError("Unable to load clinics");
        toast.error("Unable to load clinics. Please check server.");
      } finally {
        setClinicsLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQualificationChange = (e) => {
    const { name, value } = e.target;
    setQualification((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddQualification = () => {
    setShowQualificationForm(true);
    setTimeout(() => {
      qualificationRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const saveQualification = () => {
    if (!qualification.degree || !qualification.university || !qualification.year) {
      toast.error("Please fill all qualification fields");
      return;
    }
    setQualifications((prev) => [...prev, qualification]);
    setQualification({ degree: "", university: "", year: "" });
    setShowQualificationForm(false);
    toast.success("Qualification added");
  };

  const cancelQualification = () => {
    setQualification({ degree: "", university: "", year: "" });
    setShowQualificationForm(false);
  };

  const handleDeleteQualification = (index) => {
    if (window.confirm("Are you sure you want to delete this qualification?")) {
      setQualifications((prev) => prev.filter((_, i) => i !== index));
      toast.success("Qualification deleted");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const doctorData = { ...formData, qualifications };

      if (isEditMode && editDoctorId) {
        // Update existing doctor
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/doctors/${editDoctorId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(doctorData),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Doctor updated successfully!");
          navigate("/doctors");
        } else {
          toast.error(data.message || "Something went wrong!");
        }
      } else {
        // Create new doctor
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/doctors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(doctorData),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Doctor added successfully!");
          navigate("/doctors");
        } else {
          toast.error(data.message || "Something went wrong!");
        }
      }
    } catch (err) {
      toast.error("Error saving doctor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container bg-white p-4 rounded shadow-sm">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary mb-0">
            {isEditMode ? "Edit Doctor" : "Add Doctor"}
          </h4>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => navigate("/doctors")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <h6 className="text-primary fw-bold mb-3">Basic Details</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                placeholder="Doctor name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Select Clinic – dynamic from /api/clinics */}
            <div className="col-md-4">
              <label className="form-label">Select Clinic *</label>
              <select
                name="clinic"
                className="form-select"
                value={formData.clinic}
                onChange={handleChange}
                required
                disabled={clinicsLoading || !!clinicsError}
              >
                <option value="">
                  {clinicsLoading
                    ? "Loading clinics..."
                    : clinicsError
                      ? "Error loading clinics"
                      : clinics.length === 0
                        ? "No clinics found"
                        : "Select clinic"}
                </option>

                {clinics.map((clinic) => (
                  <option
                    key={clinic._id}
                    value={clinic.name} // keep storing name like before
                  >
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Contact No *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">DOB *</label>
              <input
                type="date"
                name="dob"
                className="form-control"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Specialization *</label>
              <input
                type="text"
                name="specialization"
                className="form-control"
                placeholder="Add specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                className="form-control"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Status *</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Gender *</label>
              <div className="d-flex gap-3 mt-2">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={handleChange}
                    required
                  />{" "}
                  Male
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={handleChange}
                  />{" "}
                  Female
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Other"
                    checked={formData.gender === "Other"}
                    onChange={handleChange}
                  />{" "}
                  Other
                </label>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Address Details */}
          <h6 className="text-primary fw-bold mb-3">Address Details</h6>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              rows="2"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                className="form-control"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                className="form-control"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Add Qualification */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="text-primary fw-bold mb-0">Add Qualification</h6>
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-2"
              onClick={handleAddQualification}
            >
              <FaPlus /> Add Qualification
            </button>
          </div>

          {/* Qualification List */}
          {qualifications.length === 0 ? (
            <p className="text-muted">No records found</p>
          ) : (
            <table className="table table-bordered mt-3 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Sr No</th>
                  <th>Degree</th>
                  <th>University</th>
                  <th>Year</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {qualifications.map((q, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{q.degree}</td>
                    <td>{q.university}</td>
                    <td>{q.year}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger d-flex align-items-center gap-1 mx-auto"
                        onClick={() => handleDeleteQualification(index)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Qualification Form */}
          {showQualificationForm && (
            <div ref={qualificationRef} className="mt-4 border rounded p-3 bg-light">
              <h6 className="text-primary mb-3">Add Qualification</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Degree *</label>
                  <input
                    type="text"
                    name="degree"
                    className="form-control"
                    placeholder="Enter degree"
                    value={qualification.degree}
                    onChange={handleQualificationChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">University *</label>
                  <input
                    type="text"
                    name="university"
                    className="form-control"
                    placeholder="Enter university"
                    value={qualification.university}
                    onChange={handleQualificationChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Year *</label>
                  <select
                    name="year"
                    className="form-select"
                    value={qualification.year}
                    onChange={handleQualificationChange}
                  >
                    <option value="">-- Select year --</option>
                    {Array.from({ length: 30 }, (_, i) => (
                      <option key={i}>{new Date().getFullYear() - i}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveQualification}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelQualification}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4 gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/doctors")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (
                <>
                  <FaSave /> {isEditMode ? "Update Doctor" : "Save Doctor"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddDoctor;
