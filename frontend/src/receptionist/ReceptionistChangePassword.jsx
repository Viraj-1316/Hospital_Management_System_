// src/pages/receptionist/ReceptionistChangePassword.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API_BASE from "../config";

function ReceptionistChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (!stored) {
      toast.error("Unauthorized access");
      navigate("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setAuthUser(parsed);

      // Only for receptionist
      if (parsed.role !== "receptionist") {
        toast.error("Only receptionist can access this page");
        navigate("/");
        return;
      }

      // If already changed password, go to dashboard
      if (parsed.mustChangePassword === false) {
        navigate("/reception-dashboard");
      }
    } catch {
      toast.error("Invalid session. Please login again.");
      navigate("/");
    }
  }, [navigate]);

 
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!authUser) return;

  if (!newPassword || !confirmPassword) {
    toast.error("Please fill all fields");
    return;
  }

  if (newPassword.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  try {
    setSubmitting(true);

    // ✅ Correct URL (no /auth prefix because app.use("/", authRoutes))
    const url = `${API_BASE}/receptionists/change-password/${authUser.id}`;


    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.message || "Failed to update password");
      setSubmitting(false);
      return;
    }

    toast.success("Password updated successfully");

    const updatedUser = { ...authUser, mustChangePassword: false };
    localStorage.setItem("authUser", JSON.stringify(updatedUser));

    setTimeout(() => {
      navigate("/reception-dashboard");
    }, 800);
  } catch (err) {
    console.error("Change password error:", err);
    toast.error("Server error while updating password");
  } finally {
    setSubmitting(false);
  }
};


  if (!authUser) {
    return null; // or a loader
  }

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
          Reset Your Password
        </h3>

        <p
          style={{
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "center",
            color: "#555",
          }}
        >
          You are using a system-generated password. Please set your own secure
          password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "8px 0",
              backgroundColor: submitting ? "#6c757d" : "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "15px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Updating..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReceptionistChangePassword;
