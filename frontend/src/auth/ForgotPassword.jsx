import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import "./OneCareAuth.css"; // Reuse the login styling

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // To navigate back if needed or use Link
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await axios.post(`${API_BASE}/forgot-password`, { email });
      setMessage(data.message);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onecare-auth-page">
      {/* Background Shapes */}
      <div className="bg-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Main Card Container - Overriding styles for single card look */}
      <div className="auth-wrapper" style={{ width: '450px', minHeight: 'auto', padding: '30px 0', flexDirection: 'column' }}>
        <div className="auth-form-box" style={{ width: '100%', position: 'relative', height: 'auto', padding: '0 30px' }}>

          <form onSubmit={handleSubmit}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Forgot Password</h1>
            <span className="animate-enter" style={{ '--i': 1, marginBottom: '20px', display: 'block' }}>
              Enter your email to receive a password reset link.
            </span>

            {/* Alerts */}
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

            {/* Email Input */}
            <div className="input-group animate-enter" style={{ '--i': 2 }}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="animate-enter"
              style={{ '--i': 3, width: '100%' }}
              disabled={loading}
            >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : "Send Reset Link"}
            </button>

            {/* Footer Action */}
            <div className="mobile-switch animate-enter" style={{ '--i': 4, display: 'block', marginTop: '20px' }}>
              <p>Remembered your password?</p>
              <button type="button" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
