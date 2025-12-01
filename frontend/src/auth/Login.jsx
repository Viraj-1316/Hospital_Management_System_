// src/Login.jsx
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API_BASE from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const navigate = useNavigate();



  const handleRoleClick = (newRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      const msg = "Please enter both email and password.";
      setError(msg);
      toast.error(msg);
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
        const msg = errData.message || "Login failed";
        setError(msg);
        toast.error(msg);
        return;
      }

      const data = await res.json();
      const user = data.user || data;

      console.log("Login response user:", user);

      if (user.role !== role) {
        const msg = "Invalid Credentials";
        setError(msg);
        toast.error(msg);
        return;
      }

      // --- FIX START: Save Token & User ID ---
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Important: Save the ID as a standalone string for Navbar/Reports to find
      const userId = user.id || user._id;
      if (userId) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("userRole", user.role); 
      }
      // --- FIX END ---

      const authUser = {
        id: userId || null,
        _id: userId || null,
        email: user.email || "",
        role: user.role || "",
        name: user.name || "",
        profileCompleted: !!user.profileCompleted,
        mustChangePassword:
          typeof user.mustChangePassword === "boolean"
            ? user.mustChangePassword
            : false,
      };

      console.log("Saving authUser to localStorage:", authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));

      // Try to fetch patient doc by userId
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
              name: (patientDoc.firstName || patientDoc.lastName)
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
            
            // --- FIX: Save patientId specifically ---
            localStorage.setItem("patientId", patientObj.id); 
            // ----------------------------------------

          } else {
            localStorage.removeItem("patient");
            localStorage.removeItem("patientId"); // Clean up
          }
        }
      } catch (errFetchPatient) {
        console.warn("Could not fetch patient doc:", errFetchPatient);
      }

      // Try to fetch doctor doc (if doctor)
      if (authUser.role === "doctor") {
        try {
          const doctorRes = await fetch(
            `${API_BASE}/doctors?email=${encodeURIComponent(authUser.email)}`
          );
          if (doctorRes.ok) {
            const doctorsData = await doctorRes.json();
            const doctorDoc = Array.isArray(doctorsData)
              ? doctorsData.find((d) => d.email === authUser.email)
              : null;

            if (doctorDoc) {
              const doctorObj = {
                id: doctorDoc._id || doctorDoc.id,
                _id: doctorDoc._id || doctorDoc.id,
                firstName: doctorDoc.firstName || "",
                lastName: doctorDoc.lastName || "",
                name: doctorDoc.firstName || doctorDoc.lastName
                    ? `${doctorDoc.firstName || ""} ${doctorDoc.lastName || ""}`.trim()
                    : authUser.name || "",
                email: doctorDoc.email || authUser.email || "",
                phone: doctorDoc.phone || "",
                clinic: doctorDoc.clinic || "",
                specialization: doctorDoc.specialization || "",
              };
              console.log("Saving doctor to localStorage:", doctorObj);
              localStorage.setItem("doctor", JSON.stringify(doctorObj));
            } else {
              localStorage.removeItem("doctor");
            }
          } else {
            localStorage.removeItem("doctor");
          }
        } catch (errFetchDoctor) {
          console.warn("Could not fetch doctor doc:", errFetchDoctor);
        }
      }

      // Redirect Logic
      if (authUser.role === "admin") {
        navigate("/admin-dashboard");
      } else if (authUser.role === "doctor") {
        if (authUser.mustChangePassword) {
          toast("Please change your default password.", { icon: "🔐" });
          navigate("/doctor/change-password-first");
        } else {
          navigate("/doctor-dashboard");
        }
      } else if (authUser.role === "receptionist") {
        if (authUser.mustChangePassword) {
          toast("Please change your default password.", { icon: "🔐" });
          navigate("/receptionist/change-password");
        } else {
          navigate("/reception-dashboard");
        }
      } else if (authUser.role === "patient") {
        if (!authUser.profileCompleted) navigate("/patient/profile-setup");
        else navigate("/patient-dashboard");
      } else {
        navigate("/");
      }

      toast.success("Login successful");
    } catch (err) {
      console.error("Network/login error:", err);
      const msg = "Network error: backend not responding";
      setError(msg);
      toast.error(msg);
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
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
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
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
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

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "space-between" }}>
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
                backgroundColor: role === "receptionist" ? "#0d6efd" : "#6c757d",
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

          <div style={{ display: "flex", marginBottom: "16px", justifyContent: "center" }}>
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
            <div style={{ color: "red", fontSize: "13px", textAlign: "center", marginBottom: "8px" }}>
              {error}
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "12px", marginTop: "8px" }}>
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