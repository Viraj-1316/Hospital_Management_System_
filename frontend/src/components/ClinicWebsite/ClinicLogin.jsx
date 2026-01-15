// ClinicLogin.jsx - Clinic-specific login using OneCare theme
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import API_BASE from '../../config';
import { 
  clinicLogin, 
  clinicGoogleLogin, 
  saveAuthData, 
  fetchPatientData, 
  savePatientData,
  fetchDoctorData,
  saveDoctorData,
  validators 
} from '../../auth/authService';
import '../../auth/OneCareAuth.css';
import '../ClinicWebsite/ClinicAuth.css';

const ROLES = [
  { id: 'patient', label: 'Patient', icon: 'fa-user-injured' },
  { id: 'doctor', label: 'Doctor', icon: 'fa-user-md' },
  { id: 'receptionist', label: 'Staff', icon: 'fa-clinic-medical' },
];

export default function ClinicLogin() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('patient');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClinicData();
  }, [subdomain]);

  const fetchClinicData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}`);
      if (res.data.success) {
        setClinic(res.data.data);
      }
    } catch (err) {
      toast.error('Clinic not found');
      navigate('/clinic-finder');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailError = validators.email(formData.email);
    const passwordError = validators.password(formData.password);
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await clinicLogin(
        formData.email, 
        formData.password, 
        subdomain, 
        selectedRole
      );

      if (!result.success) {
        if (result.approvalStatus === 'pending') {
          toast.error('Your registration is pending approval');
        } else {
          toast.error(result.error || 'Login failed');
        }
        setSubmitting(false);
        return;
      }

      const authUser = saveAuthData(result.data, result.token, subdomain);

      if (authUser.role === 'patient') {
        const patientDoc = await fetchPatientData(authUser.id);
        if (patientDoc) {
          savePatientData(patientDoc, authUser.id);
        }
      } else if (authUser.role === 'doctor') {
        const doctorDoc = await fetchDoctorData(authUser.email);
        if (doctorDoc) {
          saveDoctorData(doctorDoc);
        }
      }

      toast.success('Login successful!');
      redirectUser(authUser);
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
    } finally {
      setSubmitting(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSubmitting(true);
      try {
        const result = await clinicGoogleLogin(tokenResponse.access_token, subdomain);
        
        if (!result.success) {
          toast.error(result.error || 'Google login failed');
          return;
        }

        const authUser = saveAuthData(result.data, result.token, subdomain);
        
        const patientDoc = await fetchPatientData(authUser.id);
        if (patientDoc) {
          savePatientData(patientDoc, authUser.id);
        }

        toast.success('Login successful!');
        redirectUser(authUser);
      } catch (err) {
        console.error('Google login error:', err);
        toast.error('Google login failed');
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => {
      toast.error('Google login failed');
    },
  });

  const redirectUser = (user) => {
    const basePath = `/c/${subdomain}`;
    
    if (user.role === 'patient' && !user.profileCompleted) {
      navigate(`${basePath}/patient/profile-setup`);
      return;
    }

    if (user.mustChangePassword) {
      if (user.role === 'doctor') {
        navigate(`${basePath}/doctor/change-password-first`);
      } else if (user.role === 'receptionist') {
        navigate(`${basePath}/receptionist/change-password-page`);
      }
      return;
    }

    switch (user.role) {
      case 'patient':
        navigate(`${basePath}/patient-dashboard`);
        break;
      case 'doctor':
        navigate(`${basePath}/doctor-dashboard`);
        break;
      case 'receptionist':
        navigate(`${basePath}/reception-dashboard`);
        break;
      default:
        navigate(`${basePath}/patient-dashboard`);
    }
  };

  if (loading) {
    return (
      <div className="onecare-auth-page">
        <div className="bg-shapes" aria-hidden="true">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
        </div>
        <div className="loading-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)' }}>
          <div className="loader-box">
            <div className="medical-cross"></div>
            <h2 className="loading-text">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (cleanPath.startsWith('uploads/')) {
        return `${API_BASE}/${cleanPath}`;
    }
    return `${API_BASE}/uploads/${cleanPath}`;
  };

  return (
    <div className="onecare-auth-page">
      {/* Background Shapes */}
      <div className="bg-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <main className="auth-wrapper clinic-auth-wrapper">
        {/* Login Form */}
        <div className="clinic-form-section">
          <form onSubmit={handleSubmit}>
            {/* Clinic Branding */}
            <div className="clinic-branding-header">
              <Link to={`/c/${subdomain}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {clinic?.logo ? (
                  <img 
                    src={getImageUrl(clinic.logo)}
                    alt={clinic.name} 
                    className="clinic-logo-img" 
                  />
                ) : (
                  <div className="medical-cross" style={{ width: 40, height: 40, margin: '0 auto 10px' }}></div>
                )}
                <span className="clinic-name-badge">{clinic?.name}</span>
              </Link>
            </div>

            <h1 className="animate-enter" style={{ '--i': 0 }}>Welcome Back</h1>
            <span className="animate-enter" style={{ '--i': 1 }}>Sign in to access your account</span>

            {/* Role Tabs */}
            <div className="role-group animate-enter" style={{ '--i': 2 }}>
              <span className="role-label">I am a:</span>
              <div className="role-options">
                {ROLES.map((role) => (
                  <label className="role-radio-btn" key={role.id}>
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={selectedRole === role.id}
                      onChange={() => setSelectedRole(role.id)}
                    />
                    <div className="role-card">
                      <i className={`fas ${role.icon}`}></i>
                      <span className="role-text">{role.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={`input-group animate-enter ${errors.email ? 'has-error' : ''}`} style={{ '--i': 3 }}>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                disabled={submitting}
              />
              <i className="fas fa-envelope input-icon"></i>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className={`input-group animate-enter ${errors.password ? 'has-error' : ''}`} style={{ '--i': 4 }}>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
              <i className="fas fa-lock input-icon"></i>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="forgot-pass-box animate-enter" style={{ '--i': 5 }}>
              <Link to="/forgot-password" className="forgot-pass-link">Forgot your password?</Link>
            </div>

            <button
              type="submit"
              className="animate-enter"
              style={{ '--i': 6 }}
              disabled={submitting}
            >
              {submitting ? <><i className="fas fa-spinner fa-spin"></i> Signing In...</> : 'Sign In'}
            </button>

            {/* Google Login for Patients */}
            {selectedRole === 'patient' && (
              <div className="social-links animate-enter" style={{ '--i': 7 }}>
                <div className="google-btn-wrapper">
                  <button
                    type="button"
                    className="google-custom-btn"
                    onClick={() => googleLogin()}
                    disabled={submitting}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
            )}

            <div className="mobile-switch animate-enter" style={{ '--i': 8 }}>
              <p>Don't have an account?</p>
              <button type="button" onClick={() => navigate(`/c/${subdomain}/signup`)}>Sign Up</button>
            </div>
          </form>
        </div>

        {/* Side Panel */}
        <div className="clinic-side-panel">
          <div className="clinic-panel-content">
            <h1>{clinic?.name || 'Clinic Portal'}</h1>
            <p>Access your appointments, medical records, and more in one secure place.</p>
            <button className="transparent-btn" type="button" onClick={() => navigate(`/c/${subdomain}/signup`)}>
              Create Account
            </button>
            <div className="back-to-clinic">
              <Link to={`/c/${subdomain}`}>← Back to Clinic Website</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
