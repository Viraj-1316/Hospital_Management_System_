import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AdminLayout from "../layouts/AdminLayout";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import API_BASE from "../../config";

const AddPatient = () => {
  const navigate = useNavigate();

  // State for fetched clinics
  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);

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

  // ✅ IMPROVED: Fetch Clinics with robust data handling
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setIsLoadingClinics(true);
        // Note: Ensure this endpoint matches your backend route exactly
        const res = await axios.get(`${API_BASE}/api/clinics`);

        // Handle different response structures
        if (Array.isArray(res.data)) {
          // Case 1: API returns [ {name: 'One Care'}, ... ]
          setClinics(res.data);
        } else if (res.data.clinics && Array.isArray(res.data.clinics)) {
          // Case 2: API returns { clinics: [ {name: 'One Care'}, ... ] }
          setClinics(res.data.clinics);
        } else if (res.data.data && Array.isArray(res.data.data)) {
          // Case 3: API returns { data: [ {name: 'One Care'}, ... ] }
          setClinics(res.data.data);
        } else {
          console.warn("Unexpected API response structure", res.data);
          toast.error("Loaded data is not a list of clinics.");
        }

      } catch (error) {
        console.error("Error fetching clinics:", error);
        toast.error("Failed to load clinics list.");
      } finally {
        setIsLoadingClinics(false);
      }
    };

    fetchClinics();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clinic) {
      toast.error("Please select a clinic.");
      return;
    }

    try {
      const promise = axios.post(`${API_BASE}/patients`, formData);

      await toast.promise(promise, {
        loading: "Saving patient...",
        success: "Patient added successfully!",
        error: "Failed to add patient.",
      });

      navigate("/patients");

    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />

      <div className="container bg-white p-4 rounded shadow-sm">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-primary mb-0">Add Patient</h4>
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
                placeholder="Enter first name"
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
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            {/* ✅ UPDATED DROPDOWN LOGIC */}
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

                {/* Render options if clinics exist */}
                {clinics.length > 0 ? (
                  clinics.map((clinic, index) => (
                    <option key={clinic._id || index} value={clinic.name}>
                      {clinic.name}
                    </option>
                  ))
                ) : (
                  // Show appropriate message based on loading state
                  <option disabled>
                    {isLoadingClinics ? "Loading clinics..." : "No clinics found"}
                  </option>
                )}
              </select>
            </div>

            <div className="col-md-6">
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

            <div className="col-md-6">
              <label className="form-label">Contact No *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="Enter phone number"
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
              placeholder="Enter address"
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
                placeholder="Enter city"
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
                placeholder="Enter country"
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
                placeholder="Enter postal code"
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
              <FaSave /> Save
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddPatient;