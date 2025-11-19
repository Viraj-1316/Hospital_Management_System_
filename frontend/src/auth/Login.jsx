// src/Login.jsx
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3001";

  const handleRoleClick = (newRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Login failed");
        return;
      }

      const data = await res.json();
      // backend may return user directly or inside { user: ... }
      const user = data.user || data;

      console.log("Login response user:", user);

      // role check vs button selection
      if (user.role !== role) {
        setError("Invalid Credentials");
        return;
      }

      // Normalize authUser object we'll store
      const authUser = {
        id: user.id || user._id || user._id?.toString?.() || null,
        _id: user._id || user.id || null,
        email: user.email || "",
        role: user.role || "",
        name: user.name || "",
        profileCompleted: !!user.profileCompleted,
      };

      console.log("Saving authUser to localStorage:", authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));

      // Try to fetch patient doc by userId (may 404 if not created yet)
      try {
        const pid = authUser.id || authUser._id;
        if (pid) {
          const pRes = await fetch(`${API_BASE}/patients/by-user/${pid}`);
          if (pRes.ok) {
            const patientDoc = await pRes.json();
            const patientObj = {
              id: patientDoc._id || patientDoc.id || pid,
              _id: patientDoc._id || patientDoc.id || pid,
              userId: patientDoc.userId || pid,
              firstName: patientDoc.firstName || "",
              lastName: patientDoc.lastName || "",
              name:
                (patientDoc.firstName || patientDoc.lastName)
                  ? `${patientDoc.firstName || ""} ${patientDoc.lastName || ""}`.trim()
                  : patientDoc.name || authUser.name || "",
              email: patientDoc.email || authUser.email || "",
              phone: patientDoc.phone || "",
              clinic: patientDoc.clinic || "",
              dob: patientDoc.dob || "",
              address: patientDoc.address || "",
            };
            console.log("Saving patient to localStorage:", patientObj);
            localStorage.setItem("patient", JSON.stringify(patientObj));
          } else {
            // no patient yet — ensure there's no stale patient key
            localStorage.removeItem("patient");
            console.log("No patient doc found for user — patient not saved in localStorage.");
          }
        }
      } catch (errFetchPatient) {
        console.warn("Could not fetch patient doc after login:", errFetchPatient);
        // don't block login on patient fetch failure
      }

      // Redirect based on role and profileCompleted
      if (authUser.role === "admin") {
        navigate("/admin-dashboard");
      } else if (authUser.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (authUser.role === "receptionist") {
        navigate("/reception-dashboard");
      } else if (authUser.role === "patient") {
        // If profile not completed, route to setup; otherwise dashboard
        if (!authUser.profileCompleted) navigate("/patient/profile-setup");
        else navigate("/patient-dashboard");
      } else {
        // unknown role — fallback to home
        navigate("/");
      }
    } catch (err) {
      console.error("Network/login error:", err);
      setError("Network error: backend not responding");
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
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              Username or Email Address
            </label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleClick("doctor")}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                backgroundColor: role === "doctor" ? "#0d6efd" : "#6c757d",
                color: "white",
              }}
            >
              Doctor
            </button>

            <button
              type="button"
              onClick={() => handleRoleClick("receptionist")}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                backgroundColor:
                  role === "receptionist" ? "#0d6efd" : "#6c757d",
                color: "white",
              }}
            >
              Receptionist
            </button>

            <button
              type="button"
              onClick={() => handleRoleClick("patient")}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                backgroundColor: role === "patient" ? "#0d6efd" : "#6c757d",
                color: "white",
              }}
            >
              Patient
            </button>
          </div>

          <div
            style={{
              display: "flex",
              marginBottom: "16px",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setRole("admin")}
              style={{
                padding: "6px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                backgroundColor: role === "admin" ? "#0d6efd" : "#6c757d",
                color: "white",
              }}
            >
              Admin Login
            </button>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px 0",
              backgroundColor: "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "15px",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            Login
          </button>

          {error && (
            <div
              style={{
                color: "red",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{ textAlign: "center", fontSize: "12px", marginTop: "8px" }}
          >
            <Link to="/signup" style={{ color: "blue" }}>
              Don't have an account? Signup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
