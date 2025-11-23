import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";

const API_BASE = "http://localhost:3001";

function Signup() {
  const [name, setName] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [clinics, setClinics] = useState([]);
  const [phone, setPhone] = useState(""); // value like "919876543210"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clinics`);
        const data = await res.json();
        if (data.success && Array.isArray(data.clinics)) {
          setClinics(data.clinics);
        } else {
          setClinics([]);
        }
      } catch (err) {
        console.error("Error fetching clinics:", err);
        setClinics([]);
      }
    };

    loadClinics();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phone) {
      setError("All fields including mobile are required.");
      setSuccess("");
      return;
    }

    if (!clinicId) {
      setError("Please select a clinic.");
      setSuccess("");
      return;
    }

    if (phone.replace(/\D/g, "").length < 6) {
      setError("Please enter a valid mobile number.");
      setSuccess("");
      return;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: formattedPhone,
          clinicId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Signup failed");
        setSuccess("");
        return;
      }

      await res.json().catch(() => ({}));

      setSuccess("Signup successful! You can now login.");
      setError("");
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setClinicId("");
    } catch (err) {
      console.error(err);
      setError("Network error: backend not responding");
      setSuccess("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "380px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: "24px 28px",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
          Patient Signup
        </h3>

        <form onSubmit={handleSignup}>
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <label>Clinic</label>
          <select
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select clinic</option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name}
              </option>
            ))}
          </select>

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label>Mobile Number</label>
          <PhoneInput
            country={"in"}
            value={phone}
            onChange={(value) => setPhone(value)}
            inputStyle={{
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            containerStyle={{ marginBottom: "10px" }}
            enableSearch
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "6px" }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ color: "green", fontSize: "13px", marginTop: "6px" }}>
              {success}
            </p>
          )}

          <button type="submit" style={btnStyle}>
            Signup
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              marginTop: "10px",
            }}
          >
            <Link to="/" style={{ color: "blue" }}>
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const btnStyle = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#198754",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginTop: "8px",
};

export default Signup;
