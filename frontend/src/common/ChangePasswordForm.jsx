import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API_BASE from "../config";

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      
      // 1. Try to get email from 'authUser' (set by Login.jsx)
      let email = "";
      const authUserStr = localStorage.getItem("authUser");
      if (authUserStr) {
        try {
          const authUser = JSON.parse(authUserStr);
          email = authUser.email;
        } catch (e) {
          console.error("Error parsing authUser", e);
        }
      }

      // 2. Fallback: check 'email' key directly
      if (!email) {
        email = localStorage.getItem("email");
      }

      // 3. Fallback: check 'user' key
      if (!email) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            email = user.email;
          } catch (e) {
            console.error("Error parsing user", e);
          }
        }
      }

      // 4. Special case for hardcoded admin if still missing
      // (Though Login.jsx saves admin to authUser too)
      const role = localStorage.getItem("role");
      if (!email && role === "admin") {
        email = "admin@onecare.com";
      }

      if (!email) {
        toast.error("User email not found. Please login again.");
        return;
      }



// ... inside component
      const res = await axios.post(`${API_BASE}/change-password`, {
        email,
        oldPassword,
        newPassword,
      });

      toast.success(res.data.message);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 p-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h4 className="mb-4 fw-bold text-primary">Change Password</h4>
      <form onSubmit={handleSubmit}>
        {/* Old Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Current Password</label>
          <div className="input-group">
            <input
              type={showPassword.old ? "text" : "password"}
              className="form-control"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => toggleVisibility("old")}
            >
              {showPassword.old ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold">New Password</label>
          <div className="input-group">
            <input
              type={showPassword.new ? "text" : "password"}
              className="form-control"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => toggleVisibility("new")}
            >
              {showPassword.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Confirm New Password</label>
          <div className="input-group">
            <input
              type={showPassword.confirm ? "text" : "password"}
              className="form-control"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => toggleVisibility("confirm")}
            >
              {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 py-2 fw-bold"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
