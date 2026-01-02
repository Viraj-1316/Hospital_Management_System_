// src/patient/PatientProfileSetup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import API_BASE from "../../config";

export default function PatientProfileSetup() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [form, setForm] = useState({
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("authUser");

    if (!raw) {
      setError("No 'authUser' found in localStorage.");
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (!parsed.role) {
        setError("User object has no role.");
        return;
      }

      if (parsed.role !== "patient") {
        setError(`User role is '${parsed.role}', not 'patient'.`);
        return;
      }

      setUser(parsed);

      const fullName = parsed.name || "";
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      setForm((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: parsed.email || "",
        phone: parsed.phone || "",
      }));

    } catch (err) {
      console.error("Error parsing authUser:", err);
      setError("Failed to parse 'authUser' from localStorage.");
    }
  }, []);

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/clinics`);
        const data = res.data;
        if (data.success && Array.isArray(data.clinics)) {
          setClinics(data.clinics);
          // Auto-select first if none selected
          if (!form.clinic && data.clinics.length > 0) {
            const first = data.clinics[0];
            setForm((prev) => ({
              ...prev,
              clinic: first.name,
              clinicId: first._id
            }));
          }
        } else {
          setClinics([]);
        }
      } catch (err) {
        console.error("Error fetching clinics:", err);
        setClinics([]);
      }
    };

    loadClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for clinic dropdown to capture ID
    if (name === "clinic") {
      const selectedClinic = clinics.find(c => c.name === value);
      setForm(prev => ({
        ...prev,
        clinic: value,
        clinicId: selectedClinic ? selectedClinic._id : ""
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!user) {
        setError("User not loaded. Please login again.");
        setSaving(false);
        return;
      }

      if (!form.phone) {
        setError("Mobile number is required.");
        setSaving(false);
        return;
      }

      const userId = user.id || user._id;
      const fullPhone = form.phone.startsWith("+")
        ? form.phone
        : `+${form.phone}`;

      const payload = {
        ...form,
        phone: fullPhone,
        // Ensure clinicId is sent
        clinicId: form.clinicId
      };

      const patientRes = await axios.put(
        `${API_BASE}/patients/by-user/${userId}`,
        payload
      );
      const patientDoc = patientRes.data;

      await axios.put(`${API_BASE}/users/${userId}/profile-completed`, {
        profileCompleted: true,
      });

      const updatedUser = {
        ...user,
        profileCompleted: true,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        clinicId: form.clinicId // Update local storage user
      };

      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      localStorage.setItem(
        "patient",
        JSON.stringify({
          id: patientDoc._id || patientDoc.id || userId,
          _id: patientDoc._id || patientDoc.id || userId,
          userId: patientDoc.userId || userId,
          firstName: patientDoc.firstName || form.firstName,
          lastName: patientDoc.lastName || form.lastName,
          name: `${form.firstName} ${form.lastName}`.trim(),
          email:
            patientDoc.email || form.email || updatedUser.email || "",
          phone: patientDoc.phone || fullPhone || "",
          clinic: patientDoc.clinic || form.clinic || "",
          clinicId: patientDoc.clinicId || form.clinicId,
          dob: patientDoc.dob || form.dob || "",
          address: patientDoc.address || form.address || "",
        })
      );

      alert("✅ Profile saved successfully!");
      navigate("/patient-dashboard");
    } catch (err) {
      console.error("Error saving patient profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mt-5" style={{ maxWidth: "700px" }}>
        <h4>Patient Profile Setup (Debug)</h4>
        {error && (
          <div className="alert alert-danger mt-3">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="mt-3">
          <p>localStorage.getItem("authUser"):</p>
          <pre>{localStorage.getItem("authUser") || "null"}</pre>
        </div>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Go back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: "900px" }}>
      <h3 className="text-primary mb-2">Complete Your Patient Profile</h3>
      <p className="text-muted">
        Please fill these details before accessing your dashboard. This will
        happen only on your first login.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow-sm"
      >
        <h5 className="text-primary fw-bold mb-3">Basic Details</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="firstName"
              className="form-control"
              value={form.firstName}
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
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Clinic *</label>
            <select
              name="clinic"
              className="form-select"
              value={form.clinic}
              disabled={false} // ENABLED for selection
              onChange={handleChange}
              required
            >
              <option value="">Select clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic.name}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
              disabled
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Contact No *</label>
            <PhoneInput
              country={"in"}
              value={form.phone}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, phone: value }))
              }
              inputStyle={{ width: "100%" }}
              containerStyle={{ width: "100%" }}
              enableSearch
              disabled={false}
              placeholder="Enter mobile number"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              name="dob"
              className="form-control"
              value={form.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Blood Group</label>
            <select
              name="bloodGroup"
              className="form-select"
              value={form.bloodGroup}
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
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={form.gender === "Male"}
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
                  checked={form.gender === "Female"}
                  onChange={handleChange}
                />{" "}
                Female
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Other"
                  checked={form.gender === "Other"}
                  onChange={handleChange}
                />{" "}
                Other
              </label>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <h5 className="text-primary fw-bold mb-3">Other Details</h5>

        <div className="mb-3">
          <label className="form-label">Address</label>
          <textarea
            name="address"
            className="form-control"
            rows={2}
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">City</label>
            <input
              type="text"
              name="city"
              className="form-control"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              className="form-control"
              value={form.country}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Postal Code</label>
            <input
              type="text"
              name="postalCode"
              className="form-control"
              value={form.postalCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4 gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
