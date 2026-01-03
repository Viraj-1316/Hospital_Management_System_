import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import AdminLayout from "../layouts/AdminLayout";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import API_BASE from "../../config.js";

const EditPatient = ({ sidebarCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  // State for dynamic dropdown options
  const [clinics, setClinics] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    clinic: "",
    email: "",
    phone: "",
    dob: "",
    bloodGroup: "",
    gender: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  // ✅ 2. Fetch Data using the logic from PatientBookAppointment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Fetch Clinics & Patient in parallel
        const [patientRes, clinicRes] = await Promise.all([
          axios.get(`${API_BASE}/patients/${id}`),
          axios.get(`${API_BASE}/api/clinics`)
        ]);

        // --- B. Extract Clinics (Using your working logic) ---
        const clinicData = Array.isArray(clinicRes.data)
          ? clinicRes.data
          : (clinicRes.data?.data || clinicRes.data?.clinics || []);

        setClinics(clinicData);

        // --- C. Set Patient Data ---
        if (patientRes.data) {
          const p = patientRes.data;
          setFormData({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            clinic: p.clinic || "",
            email: p.email || "",
            phone: p.phone || "",
            // Format date for HTML input (YYYY-MM-DD)
            dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : "",
            bloodGroup: p.bloodGroup || "",
            gender: p.gender || "",
            address: p.address || "",
            city: p.city || "",
            country: p.country || "",
            postalCode: p.postalCode || "",
          });
        }

      } catch (error) {
        console.error("❌ Error fetching data:", error);
        toast.error("Error loading data. Check console.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ 3. Use API_BASE for update as well
      const res = await axios.put(`${API_BASE}/patients/${id}`, formData);
      if (res.data) {
        toast.success("Patient updated successfully!");
        navigate("/patients");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("Error updating patient.");
    }
  };

  if (loading) {
    return (
      <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
        <div className="container bg-white p-4 rounded shadow-sm text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Loading patient details...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <div className="container bg-white p-4 rounded shadow-sm">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary mb-0">Edit Patient</h4>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => navigate("/patients")}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h6 className="text-primary fw-bold mb-3">Basic Details</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            {/* ✅ 4. Dynamic Clinic Dropdown */}
            <div className="col-md-6">
              <label className="form-label">Select Clinic *</label>
              <select
                name="clinic"
                className="form-select"
                value={formData.clinic}
                onChange={handleChange}
                required
              >
                <option value="">Select clinic</option>
                {clinics.length > 0 ? (
                  clinics.map((c, idx) => {
                    // Handle various naming conventions
                    const cName = c.name || c.clinicName || c.clinic || "Clinic";
                    return (
                      <option key={c._id || idx} value={cName}>
                        {cName}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No clinics available</option>
                )}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Contact No *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Date of Birth *</label>
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
              <label className="form-label">Blood Group</label>
              <select
                name="bloodGroup"
                className="form-select"
                value={formData.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Gender *</label>
              <div className="d-flex gap-3 mt-2">
                <div>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={handleChange}
                    required
                  />{" "}
                  Male
                </div>
                <div>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={handleChange}
                  />{" "}
                  Female
                </div>
                <div>
                  <input
                    type="radio"
                    name="gender"
                    value="Other"
                    checked={formData.gender === "Other"}
                    onChange={handleChange}
                  />{" "}
                  Other
                </div>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <h6 className="text-primary fw-bold mb-3">Other Details</h6>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              rows="2"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="row g-3">
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

          <div className="d-flex justify-content-end mt-4 gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/patients")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
              <FaSave /> Update
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditPatient;