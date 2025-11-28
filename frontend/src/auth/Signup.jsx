import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:3001";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [clinics, setClinics] = useState([]);
  const [phone, setPhone] = useState(""); // value like "919876543210"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        toast.error("Failed to load clinics");
      }
    };

    loadClinics();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phone) {
      toast.error("All fields including mobile are required.");
      return;
    }

    if (!clinicId) {
      toast.error("Please select a clinic.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 6) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

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
        const msg = errData.message || "Signup failed";
        toast.error(msg);
        return;
      }

      await res.json().catch(() => ({}));

      toast.success("Signup successful! You can now login.");
      
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setClinicId("");
      
      // Optional: Navigate to login after short delay
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      console.error(err);
      toast.error("Network error: backend not responding");
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
