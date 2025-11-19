// src/patient/PatientProfileSetup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE = "http://localhost:3001";

export default function PatientProfileSetup() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    clinic: "Valley Clinic",
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
    console.log("🔍 ProfileSetup - localStorage authUser:", raw);

    if (!raw) {
      setError("No 'authUser' found in localStorage.");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      console.log("🔍 Parsed authUser:", parsed);

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
      }));
    } catch (err) {
      console.error("❌ Error parsing authUser:", err);
      setError("Failed to parse 'authUser' from localStorage.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setSaving(true);
  //   setError("");

  //   try {
  //     if (!user) {
  //       setError("User not loaded. Please login again.");
  //       setSaving(false);
  //       return;
  //     }

  //     const userId = user.id; // from your login response

  //     await axios.put(`${API_BASE}/patients/by-user/${userId}`, form);

  //     await axios.put(`${API_BASE}/users/${userId}/profile-completed`, {
  //       profileCompleted: true,
  //     });

  //     const updatedUser = {
  //       ...user,
  //       profileCompleted: true,
  //       name: `${form.firstName} ${form.lastName}`.trim(),
  //       email: form.email,
  //     };

  //     localStorage.setItem("authUser", JSON.stringify(updatedUser));

  //     alert("✅ Profile saved successfully!");
  //     navigate("/patient-dashboard");
  //   } catch (err) {
  //     console.error("❌ Error saving patient profile:", err);
  //     setError("Failed to save profile. Please try again.");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

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

    const userId = user.id || user._id;

    // Save/update patient record on backend and get patient doc back
    const patientRes = await axios.put(`${API_BASE}/patients/by-user/${userId}`, form);
    // patientRes.data should be the saved patient document (because our backend upsert returns it)
    const patientDoc = patientRes.data;

    // Mark user profileCompleted = true
    await axios.put(`${API_BASE}/users/${userId}/profile-completed`, {
      profileCompleted: true,
    });

    // Update authUser (so UI still sees profileCompleted)
    const updatedUser = {
      ...user,
      profileCompleted: true,
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
    };

    // IMPORTANT: save both keys so other pages can rely on either
    localStorage.setItem("authUser", JSON.stringify(updatedUser));
    localStorage.setItem("patient", JSON.stringify({
      // Normalize patient storage to include id/_id, email, phone
      id: patientDoc._id || patientDoc.id || userId,
      _id: patientDoc._id || patientDoc.id || userId,
      userId: patientDoc.userId || userId,
      firstName: patientDoc.firstName || form.firstName,
      lastName: patientDoc.lastName || form.lastName,
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: patientDoc.email || form.email || updatedUser.email || "",
      phone: patientDoc.phone || form.phone || "",
      clinic: patientDoc.clinic || form.clinic || "",
      // store whatever else might be useful later:
      dob: patientDoc.dob || form.dob || "",
      address: patientDoc.address || form.address || "",
    }));

    alert("✅ Profile saved successfully!");
    navigate("/patient-dashboard");
  } catch (err) {
    console.error("❌ Error saving patient profile:", err);
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

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm">
        {/* Basic Details */}
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
            <label className="form-label">Clinic</label>
            <input
              type="text"
              className="form-control"
              value={form.clinic}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
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
              value={form.phone}
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

        {/* Other Details */}
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
