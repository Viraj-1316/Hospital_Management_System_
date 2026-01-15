// src/patient/PatientProfileSetup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import { useNavigate, useParams } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
import API_BASE from "../../config";
import { showToast } from "../../utils/useToast";
import "./PatientProfileSetup.css";

export default function PatientProfileSetup() {
  const navigate = useNavigate();
  const { subdomain } = useParams();

  const [user, setUser] = useState(null);
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    bloodGroup: "",
    gender: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    allergies: "",
    pastHistory: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load User and Clinic Data
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Load User
        const raw = localStorage.getItem("authUser");
        if (!raw) {
          navigate("/clinic-finder");
          return;
        }
        const parsed = JSON.parse(raw);
        setUser(parsed);

        // Pre-fill Name/Email
        const fullName = parsed.name || "";
        const parts = fullName.trim().split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

        setForm(prev => ({
          ...prev,
          firstName,
          lastName,
          email: parsed.email || "",
          phone: parsed.phone || ""
        }));

        // 2. Identify Clinic
        // If subdomain exists, fetch clinic by subdomain
        if (subdomain) {
          const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}`);
          if (res.data.success) {
            setClinicId(res.data.data._id);
            setClinicName(res.data.data.name);
          }
        } 
        // Fallback: Check if user object has clinicId (e.g. from signup)
        else if (parsed.clinicId) {
           setClinicId(parsed.clinicId);
           // Might need to fetch name, but ID is what matters
        }

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [subdomain, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!user) throw new Error("User session invalid");
      if (!form.phone) throw new Error("Mobile number is mandatory");
      if (!clinicId) throw new Error("Clinic association missing. Please return to clinic website.");

      const userId = user.id || user._id;
      const fullPhone = form.phone.startsWith("+") ? form.phone : `+${form.phone}`;

      const payload = {
        ...form,
        phone: fullPhone,
        clinicId: clinicId,
        clinic: clinicName // Optional, but good for display
      };

      // Update Patient Profile
      const patientRes = await axios.put(`${API_BASE}/patients/by-user/${userId}`, payload);
      const patientDoc = patientRes.data;

      // Mark Profile Completed
      await axios.put(`${API_BASE}/users/${userId}/profile-completed`, {
        profileCompleted: true,
      });

      // Update Local Storage
      const updatedUser = {
        ...user,
        profileCompleted: true,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        clinicId: clinicId
      };
      
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      
      // Update/Create Patient LocalStorage
      localStorage.setItem("patient", JSON.stringify({
          ...patientDoc,
          // Ensure critical fields are synced
          clinicId,
          clinic: clinicName || patientDoc.clinic
      }));

      showToast.success("Profile Setup Complete!");
      
      // Navigate to Dashboard
      if (subdomain) {
        navigate(`/c/${subdomain}/patient-dashboard`);
      } else {
        navigate("/patient-dashboard");
      }

    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-setup-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Complete Your Profile</h2>
          <p>Please provide your details to finish setting up your account {clinicName && `for ${clinicName}`}</p>
        </div>

        <div className="profile-form">
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-section-title">
              <i className="fas fa-user-circle"></i> Personal Information
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input type="text" name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input type="text" name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input type="date" name="dob" className="form-control" value={form.dob} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select name="gender" className="form-select" value={form.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="bloodGroup" className="form-select" value={form.bloodGroup} onChange={handleChange}>
                  <option value="">Select Group</option>
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
            </div>

            {/* Contact Information */}
            <div className="form-section-title">
              <i className="fas fa-address-card"></i> Contact Details
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={form.email} disabled style={{opacity: 0.7, background: '#eee'}} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <PhoneInput
                  country={"in"}
                  value={form.phone}
                  onChange={(val) => setForm(prev => ({...prev, phone: val}))}
                  inputClass="form-control"
                  specialLabel=""
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <textarea name="address" rows="2" className="form-control" value={form.address} onChange={handleChange} placeholder="Street address, apartment, etc." />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input type="text" name="postalCode" className="form-control" value={form.postalCode} onChange={handleChange} />
              </div>
            </div>

            {/* Medical & Emergency */}
            <div className="form-section-title">
              <i className="fas fa-heartbeat"></i> Medical & Emergency
            </div>

            <div className="form-grid">
               <div className="form-group full-width">
                <label className="form-label">Known Allergies</label>
                <textarea name="allergies" rows="2" className="form-control" value={form.allergies} onChange={handleChange} placeholder="List any drug or food allergies..." />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Past Medical History</label>
                <textarea name="pastHistory" rows="2" className="form-control" value={form.pastHistory} onChange={handleChange} placeholder="Any previous surgeries, chronic conditions, etc." />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input type="text" name="emergencyContactName" className="form-control" value={form.emergencyContactName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input type="tel" name="emergencyContactPhone" className="form-control" value={form.emergencyContactPhone} onChange={handleChange} />
              </div>
            </div>

            <div className="action-buttons">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Saving...</span>
                ) : (
                  <span>Save & Continue <i className="fas fa-arrow-right"></i></span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
