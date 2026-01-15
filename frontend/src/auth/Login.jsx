import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLogin, saveAuthData, validators } from './authService';
import { trackLogin } from '../utils/gtm';
import './OneCareAuth.css';

/**
 * OneCare Admin Login - For Super Admin and Clinic Admin only
 * Patients, Doctors, and Staff should use their clinic's login page
 */
function Login() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  // Check if user was redirected from clinic login attempt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('migrated') === 'true') {
      setShowMigrationNotice(true);
    }
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailError = validators.email(loginForm.email);
    const passwordError = validators.password(loginForm.password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const result = await adminLogin(loginForm.email, loginForm.password);

    if (!result.success) {
      // If redirected to clinic finder (non-admin trying to login)
      if (result.redirectToClinicFinder) {
        toast.error('This login is for administrators only');
        navigate('/clinic-finder');
        return;
      }
      toast.error(result.error || 'Login failed');
      setIsSubmitting(false);
      return;
    }

    const authUser = saveAuthData(result.data, result.token);

    toast.success('Login successful');
    trackLogin(authUser.role);

    // Redirect based on role
    if (authUser.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (authUser.role === 'clinic_admin') {
      navigate('/clinic-dashboard');
    } else {
      navigate('/clinic-finder');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="onecare-auth-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loader-box">
            <div className="medical-cross"></div>
            <h2 className="loading-text">OneCare</h2>
          </div>
        </div>
      )}

      {/* Background Shapes */}
      <div className="bg-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <main className="auth-wrapper admin-login-wrapper">
        {/* Login Form */}
        <div className="auth-form-box login-form-box admin-login-box">
          <form onSubmit={handleSubmit}>
            <div className="admin-badge">
              <i className="fas fa-shield-alt"></i>
              <span>Administrator Portal</span>
            </div>

            <h1 className="animate-enter" style={{ '--i': 0 }}>OneCare Admin</h1>
            <p className="admin-subtitle animate-enter" style={{ '--i': 1 }}>
              Super Admin and Clinic Admin access only
            </p>

            {/* Migration Notice */}
            {showMigrationNotice && (
              <div className="migration-notice animate-enter" style={{ '--i': 2 }}>
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Looking for patient/doctor login?</strong>
                  <p>Use your clinic's login page for patient, doctor, and staff access.</p>
                  <Link to="/clinic-finder">Find your clinic →</Link>
                </div>
              </div>
            )}

            <div className={`input-group animate-enter ${loginErrors.email ? 'has-error' : ''}`} style={{ '--i': 3 }}>
              <input
                type="email"
                placeholder="Admin Email"
                value={loginForm.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
              <i className="fas fa-envelope input-icon"></i>
              {loginErrors.email && <span className="error-text">{loginErrors.email}</span>}
            </div>

            <div className={`input-group animate-enter ${loginErrors.password ? 'has-error' : ''}`} style={{ '--i': 4 }}>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <i className="fas fa-lock input-icon"></i>
              {loginErrors.password && <span className="error-text">{loginErrors.password}</span>}
            </div>

            <div className="forgot-pass-box animate-enter" style={{ '--i': 5 }}>
              <Link to="/forgot-password" className="forgot-pass-link">Forgot your password?</Link>
            </div>

            <button
              type="submit"
              className="animate-enter admin-login-btn"
              style={{ '--i': 6 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Signing In...</> : 'Sign In'}
            </button>

            <div className="clinic-finder-link animate-enter" style={{ '--i': 7 }}>
              <span>Not an administrator?</span>
              <Link to="/clinic-finder">
                <i className="fas fa-hospital"></i> Find your clinic's login page
              </Link>
            </div>
          </form>
        </div>

        {/* Side Panel */}
        <div className="admin-side-panel">
          <div className="admin-panel-content">
            <div className="admin-logo">
              <div className="medical-cross-large"></div>
            </div>
            <h2>OneCare Platform</h2>
            <p>Comprehensive healthcare management for hospitals, clinics, and medical practices.</p>
            
            <div className="admin-features">
              <div className="admin-feature">
                <i className="fas fa-hospital-alt"></i>
                <span>Multi-Clinic Management</span>
              </div>
              <div className="admin-feature">
                <i className="fas fa-users-cog"></i>
                <span>Staff & Doctor Administration</span>
              </div>
              <div className="admin-feature">
                <i className="fas fa-chart-line"></i>
                <span>Analytics & Reports</span>
              </div>
            </div>

            <div className="admin-home-link">
              <Link to="/">← Back to Homepage</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;