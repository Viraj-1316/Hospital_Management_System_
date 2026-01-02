import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  loginUser,
  signupUser,
  fetchPatientData,
  fetchDoctorData,
  validators,
  formatPhone,
  clearRoleData,
  saveAuthData,
  savePatientData,
  saveDoctorData,
  googleLogin,
} from './authService';
import { useGoogleLogin } from '@react-oauth/google';
import './OneCareAuth.css';

/**
 * OneCare Auth Page - Combined Login and Signup
 */
function Login() {
  const navigate = useNavigate();

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Login Form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  // Signup Form
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'PATIENT',
    hospitalId: '',
  });
  const [signupErrors, setSignupErrors] = useState({});

  // Initial loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Toggle panel with animation re-trigger
  const togglePanel = useCallback((active) => {
    setIsPanelActive(active);
    setAnimationKey(prev => prev + 1); // Forces re-render of animated elements
    // Clear errors when switching
    setLoginErrors({});
    setSignupErrors({});
  }, []);

  // Handle login form changes
  const handleLoginChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle signup form changes
  const handleSignupChange = (field, value) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
    // Clear hospital ID if switching to patient
    if (field === 'role' && value === 'PATIENT') {
      setSignupForm(prev => ({ ...prev, hospitalId: '' }));
    }
    // Clear error on change
    if (signupErrors[field]) {
      setSignupErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate login form
  const validateLoginForm = () => {
    const errors = {};
    const emailError = validators.email(loginForm.email);
    const passwordError = validators.password(loginForm.password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate signup form
  const validateSignupForm = () => {
    const errors = {};

    const nameError = validators.name(signupForm.name);
    const emailError = validators.email(signupForm.email);
    const phoneError = validators.phone(signupForm.phone);
    const passwordError = validators.password(signupForm.password);

    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (phoneError) errors.phone = phoneError;
    if (passwordError) errors.password = passwordError;

    // Hospital ID required for staff
    if ((signupForm.role === 'DOCTOR' || signupForm.role === 'RECEPTIONIST') && !signupForm.hospitalId) {
      errors.hospitalId = 'Hospital ID is required for staff';
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    const result = await loginUser(loginForm.email, loginForm.password);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    const user = result.data;
    const authUser = saveAuthData(user, result.token);

    // Fetch and save role-specific data
    clearRoleData();

    if (authUser.role === 'patient' && authUser.id) {
      const patientDoc = await fetchPatientData(authUser.id);
      if (patientDoc) {
        savePatientData(patientDoc, authUser.id);
      }
    }


    if (authUser.role === 'doctor') {
      const doctorDoc = await fetchDoctorData(authUser.email);
      if (doctorDoc) {
        saveDoctorData(doctorDoc);
      }
    }

    // Redirect based on role
    toast.success('Login successful');
    redirectUser(authUser);

    setIsSubmitting(false);
  };

  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      console.log("Google response:", tokenResponse);

      if (tokenResponse.access_token) {
        // Send access token to backend
        const result = await googleLogin(tokenResponse.access_token);

        if (!result.success) {
          toast.error(result.error);
          setIsSubmitting(false);
          return;
        }

        const authUser = saveAuthData(result.data, result.token);
        clearRoleData();

        if (authUser.role === 'patient' && authUser.id) {
          const patientDoc = await fetchPatientData(authUser.id);
          if (patientDoc) savePatientData(patientDoc, authUser.id);
        }

        toast.success('Login successful');
        redirectUser(authUser);
      }
      setIsSubmitting(false);
    },
    onError: () => {
      toast.error('Google Sign In was unsuccessful. Please try again.');
      setIsSubmitting(false);
    },
    flow: 'implicit', // Get access token directly
  });

  // Handle signup submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!validateSignupForm()) return;

    setIsSubmitting(true);

    const result = await signupUser({
      name: signupForm.name,
      email: signupForm.email,
      password: signupForm.password,
      phone: formatPhone(signupForm.phone),
      role: signupForm.role.toLowerCase(),
      hospitalId: signupForm.hospitalId || undefined,
    });

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Signup successful! You can now login.');

    // Reset form and switch to login
    setSignupForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'PATIENT',
      hospitalId: '',
    });

    setTimeout(() => togglePanel(false), 1500);
    setIsSubmitting(false);
  };

  // Redirect user based on role
  const redirectUser = (authUser) => {
    switch (authUser.role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'clinic_admin':
        navigate('/clinic-dashboard');
        break;
      case 'doctor':
        if (authUser.mustChangePassword) {
          toast('Please change your default password.', { icon: '🔐' });
          navigate('/doctor/change-password-first');
        } else {
          navigate('/doctor-dashboard');
        }
        break;
      case 'receptionist':
        if (authUser.mustChangePassword) {
          toast('Please change your default password.', { icon: '🔐' });
          navigate('/receptionist/change-password');
        } else {
          navigate('/reception-dashboard');
        }
        break;
      case 'patient':
        navigate(authUser.profileCompleted ? '/patient-dashboard' : '/patient/profile-setup');
        break;
      default:
        navigate('/');
    }
  };

  // Role options for signup
  const roles = [
    { value: 'PATIENT', icon: 'fa-user-injured', label: 'Patient' },
    { value: 'DOCTOR', icon: 'fa-user-md', label: 'Doctor' },
    { value: 'RECEPTIONIST', icon: 'fa-clinic-medical', label: 'Staff' },
  ];

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

      <main className={`auth-wrapper ${isPanelActive ? 'panel-active' : ''}`}>

        {/* ===== REGISTER FORM ===== */}
        <div className="auth-form-box register-form-box">
          <form onSubmit={handleSignupSubmit} key={`signup-${animationKey}`}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Create Account</h1>

            <div className="social-links animate-enter" style={{ '--i': 1 }}>
              <div className="google-btn-wrapper">
                <button
                  type="button"
                  className="google-custom-btn"
                  onClick={() => googleLoginAction()}
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
            <span className="animate-enter" style={{ '--i': 2 }}>or use your email for registration</span>

            <div className={`input-group animate-enter ${signupErrors.name ? 'has-error' : ''}`} style={{ '--i': 3 }}>
              <input
                type="text"
                placeholder="Full Name"
                value={signupForm.name}
                onChange={(e) => handleSignupChange('name', e.target.value)}
                autoComplete="name"
              />
              <i className="fas fa-user input-icon"></i>
              {signupErrors.name && <span className="error-text">{signupErrors.name}</span>}
            </div>

            <div className={`input-group animate-enter ${signupErrors.email ? 'has-error' : ''}`} style={{ '--i': 4 }}>
              <input
                type="email"
                placeholder="Email Address"
                value={signupForm.email}
                onChange={(e) => handleSignupChange('email', e.target.value)}
                autoComplete="email"
              />
              <i className="fas fa-envelope input-icon"></i>
              {signupErrors.email && <span className="error-text">{signupErrors.email}</span>}
            </div>

            <div className={`input-group animate-enter ${signupErrors.phone ? 'has-error' : ''}`} style={{ '--i': 5 }}>
              <div className="phone-input-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span className="phone-prefix" style={{
                  padding: '0 10px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '8px 0 0 8px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666',
                  fontWeight: '500',
                  fontSize: '14px',
                  minHeight: '44px'
                }}>+91</span>
                <input
                  type="tel"
                  placeholder="10-digit Phone Number"
                  value={signupForm.phone}
                  onChange={(e) => {
                    // Only allow digits and limit to 10
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleSignupChange('phone', value);
                  }}
                  autoComplete="tel"
                  style={{ borderRadius: '0 8px 8px 0', paddingLeft: '12px' }}
                  maxLength={10}
                />
              </div>
              {signupErrors.phone && <span className="error-text">{signupErrors.phone}</span>}
            </div>

            <div className={`input-group animate-enter ${signupErrors.password ? 'has-error' : ''}`} style={{ '--i': 6 }}>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={signupForm.password}
                onChange={(e) => handleSignupChange('password', e.target.value)}
                autoComplete="new-password"
              />
              <i className="fas fa-lock input-icon"></i>
              {signupErrors.password && <span className="error-text">{signupErrors.password}</span>}
            </div>

            <div className="role-group animate-enter" style={{ '--i': 7 }}>
              <span className="role-label">I am a:</span>
              <div className="role-options">
                {roles.map((role) => (
                  <label className="role-radio-btn" key={role.value}>
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={signupForm.role === role.value}
                      onChange={() => handleSignupChange('role', role.value)}
                    />
                    <div className="role-card">
                      <i className={`fas ${role.icon}`}></i>
                      <span className="role-text">{role.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hospital ID - shown for Doctor/Receptionist */}
            <div className={`role-extra ${(signupForm.role === 'DOCTOR' || signupForm.role === 'RECEPTIONIST') ? 'show' : ''}`}>
              <div className={`input-group ${signupErrors.hospitalId ? 'has-error' : ''}`}>
                <input
                  type="text"
                  placeholder="Hospital ID"
                  value={signupForm.hospitalId}
                  onChange={(e) => handleSignupChange('hospitalId', e.target.value)}
                />
                <i className="fas fa-id-badge input-icon"></i>
                {signupErrors.hospitalId && <span className="error-text">{signupErrors.hospitalId}</span>}
              </div>
            </div>

            <button
              type="submit"
              className="animate-enter"
              style={{ '--i': 8 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Signing Up...</> : 'Sign Up'}
            </button>

            <div className="mobile-switch">
              <p>Already have an account?</p>
              <button type="button" onClick={() => togglePanel(false)}>Sign In</button>
            </div>
          </form>
        </div>

        {/* ===== LOGIN FORM ===== */}
        <div className="auth-form-box login-form-box">
          <form onSubmit={handleLoginSubmit} key={`login-${animationKey}`}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Welcome Back</h1>

            <div className="social-links animate-enter" style={{ '--i': 1 }}>
              <div className="google-btn-wrapper">
                <button
                  type="button"
                  className="google-custom-btn"
                  onClick={() => googleLoginAction()}
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
            <span className="animate-enter" style={{ '--i': 2 }}>or use your account</span>

            <div className={`input-group animate-enter ${loginErrors.email ? 'has-error' : ''}`} style={{ '--i': 3 }}>
              <input
                type="email"
                placeholder="Email Address"
                value={loginForm.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
                autoComplete="email"
              />
              <i className="fas fa-envelope input-icon"></i>
              {loginErrors.email && <span className="error-text">{loginErrors.email}</span>}
            </div>

            <div className={`input-group animate-enter ${loginErrors.password ? 'has-error' : ''}`} style={{ '--i': 4 }}>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => handleLoginChange('password', e.target.value)}
                autoComplete="current-password"
              />
              <i className="fas fa-lock input-icon"></i>
              {loginErrors.password && <span className="error-text">{loginErrors.password}</span>}
            </div>

            <div className="forgot-pass-box animate-enter" style={{ '--i': 5 }}>
              <Link to="/forgot-password" className="forgot-pass-link">Forgot your password?</Link>
            </div>

            <button
              type="submit"
              className="animate-enter"
              style={{ '--i': 6 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Signing In...</> : 'Sign In'}
            </button>

            <div className="mobile-switch">
              <p>Don't have an account?</p>
              <button type="button" onClick={() => togglePanel(true)}>Sign Up</button>
            </div>
          </form>
        </div>

        {/* ===== SLIDING PANEL ===== */}
        <div className="slide-panel-wrapper">
          <div className="slide-panel">
            <div className="panel-content panel-content-left">
              <h1>OneCare</h1>
              <p>Access your medical records, appointments, and prescriptions in one secure place.</p>
              <button className="transparent-btn" type="button" onClick={() => togglePanel(false)}>Sign In</button>
            </div>
            <div className="panel-content panel-content-right">
              <h1>Join Us</h1>
              <p>Connect with the best healthcare professionals. Your journey to better health starts here.</p>
              <button className="transparent-btn" type="button" onClick={() => togglePanel(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;