import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import "./OneCareAuth.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await axios.post(`${API_BASE}/reset-password/${token}`, {
        newPassword
      });
      setMessage(data.message);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Failed to reset password. Link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onecare-auth-page">
      <div className="bg-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-wrapper" style={{ width: '450px', minHeight: 'auto', padding: '30px 0', flexDirection: 'column' }}>
        <div className="auth-form-box" style={{ width: '100%', position: 'relative', height: 'auto', padding: '0 30px' }}>
          <form onSubmit={handleSubmit}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Reset Password</h1>
            <span className="animate-enter" style={{ '--i': 1, marginBottom: '20px', display: 'block' }}>
              Please enter your new password below.
            </span>

            {message && (
              <div className="animate-enter" style={{ '--i': 1.5, width: '100%', marginBottom: '15px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9',
                  fontSize: '13px'
                }}>
                  {message}
                </div>
              </div>
            )}

            {error && (
              <div className="animate-enter" style={{ '--i': 1.5, width: '100%', marginBottom: '15px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  border: '1px solid #ffcdd2',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              </div>
            )}

            <div className="input-group animate-enter" style={{ '--i': 2 }}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
              />
              <i className="fas fa-lock input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 3 }}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <i className="fas fa-lock input-icon"></i>
            </div>

            <button
              type="submit"
              className="animate-enter"
              style={{ '--i': 4, width: '100%' }}
              disabled={loading}
            >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : "Set New Password"}
            </button>

            <div className="mobile-switch animate-enter" style={{ '--i': 5, display: 'block', marginTop: '20px' }}>
              <p>Back to Login?</p>
              <button type="button" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
