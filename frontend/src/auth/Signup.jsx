import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, saveAuthData, savePatientData, clearRoleData, fetchPatientData } from "./authService";
import API_BASE from "../config";
import "./OneCareAuth.css";

function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelActive, setIsPanelActive] = useState(true); // Start with signup form visible

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");
  const [hospitalId, setHospitalId] = useState("");

  const [clinics, setClinics] = useState([]);
  const [showApprovalPendingModal, setShowApprovalPendingModal] = useState(false); // Modal state

  // Fetch clinics for dropdown
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clinics`); // Updated endpoint
        const data = await res.json();
        // Handle different response structures
        if (Array.isArray(data)) setClinics(data);
        else if (data.clinics && Array.isArray(data.clinics)) setClinics(data.clinics);
        else if (data.data && Array.isArray(data.data)) setClinics(data.data);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    };
    fetchClinics();
  }, []);

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Trigger animations on panel switch
  const triggerAnimation = () => {
    const animElements = document.querySelectorAll('.animate-enter');
    animElements.forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight; // Trigger Reflow
      el.style.animation = null;
    });
  };

  const togglePanel = (active) => {
    setIsPanelActive(active);
    triggerAnimation();
  };

  // Handle role change
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "PATIENT") {
      setHospitalId(""); // Clear hospital ID if patient
    }
  };

  // State for approval pending modal
  const [showApprovalPendingModal, setShowApprovalPendingModal] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phone) {
      toast.error("All fields are required.");
      return;
    }

    // Validate Hospital ID for non-patients
    if ((role === "DOCTOR" || role === "RECEPTIONIST") && !hospitalId) {
      toast.error("Hospital ID is required for staff.");
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
          role: role.toLowerCase(), // Send as lowercase: patient, doctor, receptionist
          hospitalId: hospitalId || undefined,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(resData.message || "Signup failed");
        return;
      }

      // Check if approval is pending (doctor/staff signup)
      if (resData.approvalStatus === "pending") {
        // Show approval pending modal
        setShowApprovalPendingModal(true);

        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setRole("PATIENT");
        setHospitalId("");
        return;
      }

      // For patients - normal login flow
      toast.success("Signup successful! You can now login.");

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("PATIENT");
      setHospitalId("");

      // Navigate to login after short delay
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      console.error(err);
      toast.error("Network error: backend not responding");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    if (credentialResponse.credential) {
      const result = await googleLogin(credentialResponse.credential);

      if (!result.success) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      const authUser = saveAuthData(result.data, result.token);
      clearRoleData();

      // For signup, we might want to check profile completion or just log them in
      if (authUser.role === 'patient' && authUser.id) {
        const patientDoc = await fetchPatientData(authUser.id);
        if (patientDoc) savePatientData(patientDoc, authUser.id);
      }

      toast.success('Signup with Google successful!');

      // Redirect logic similar to Login
      if (authUser.role === 'patient') {
        navigate(authUser.profileCompleted ? '/patient-dashboard' : '/patient/profile-setup');
      } else {
        navigate('/'); // Fallback
      }
    }
    setIsLoading(false);
  };

  const handleGoogleError = () => {
    toast.error('Google Sign Up was unsuccessful.');
  };

  return (
    <div className="onecare-auth-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay" id="loadingOverlay">
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

      <main className={`auth-wrapper ${isPanelActive ? 'panel-active' : ''}`} id="authWrapper">
        {/* Register Form */}
        <div className="auth-form-box register-form-box">
          <form id="registerForm" onSubmit={handleSignup}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Create Account</h1>

            <div className="social-links animate-enter" style={{ '--i': 1 }}>
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  shape="pill"
                  text="signup_with"
                  logo_alignment="left"
                  width="300"
                />
              </div>
            </div>
            <span className="animate-enter" style={{ '--i': 2 }}>or use your email for registration</span>

            <div className="input-group animate-enter" style={{ '--i': 3 }}>
              <input
                type="text"
                placeholder="Full Name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <i className="fas fa-user input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 4 }}>
              <input
                type="email"
                placeholder="Email Address"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 5 }}>
              <input
                type="tel"
                placeholder="Phone Number (e.g. +919876543210)"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <i className="fas fa-phone input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 6 }}>
              <input
                type="password"
                placeholder="Password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i className="fas fa-lock input-icon"></i>
            </div>

            <div className="role-group animate-enter" style={{ '--i': 7 }}>
              <span className="role-label">I am a:</span>
              <div className="role-options">
                <label className="role-radio-btn">
                  <input
                    type="radio"
                    name="role"
                    value="PATIENT"
                    checked={role === "PATIENT"}
                    onChange={() => handleRoleChange("PATIENT")}
                  />
                  <div className="role-card">
                    <i className="fas fa-user-injured"></i>
                    <span className="role-text">Patient</span>
                  </div>
                </label>
                <label className="role-radio-btn">
                  <input
                    type="radio"
                    name="role"
                    value="DOCTOR"
                    checked={role === "DOCTOR"}
                    onChange={() => handleRoleChange("DOCTOR")}
                  />
                  <div className="role-card">
                    <i className="fas fa-user-md"></i>
                    <span className="role-text">Doctor</span>
                  </div>
                </label>
                <label className="role-radio-btn">
                  <input
                    type="radio"
                    name="role"
                    value="RECEPTIONIST"
                    checked={role === "RECEPTIONIST"}
                    onChange={() => handleRoleChange("RECEPTIONIST")}
                  />
                  <div className="role-card">
                    <i className="fas fa-clinic-medical"></i>
                    <span className="role-text">Staff</span>
                  </div>
                </label>
              </div>
            </div>

        </div>
    </div>

            {/* Clinic Selection - REQUIRED for all roles now */ }
  <div className="input-group animate-enter" style={{ '--i': 7.5 }}>
    <select
      className="form-select" // styles from global or bootstrap
      style={{
        width: '100%',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        outline: 'none',
        background: '#f0f0f0'
      }}
      value={hospitalId}
      onChange={(e) => setHospitalId(e.target.value)}
      required
    >
      <option value="">Select Your Clinic</option>
      {clinics.map(clinic => (
        <option key={clinic._id} value={clinic._id}>
          {clinic.name}
        </option>
      ))}
    </select>
  </div>

  {/* Hospital ID field - Hidden/Redundant now that we use dropdown */ }
  {/* <div className={`role-extra ...`} ... > ... </div> */ }

            <button type="submit" className="animate-enter" style={{ '--i': 8 }}>Sign Up</button>

            <div className="mobile-switch">
              <p>Already have an account?</p>
              <button type="button" onClick={() => navigate("/")}>Sign In</button>
            </div>
          </form >
        </div >

    {/* Login Form (Placeholder - redirect to login page) */ }
    < div className = "auth-form-box login-form-box" >
      <form>
        <h1 className="animate-enter" style={{ '--i': 0 }}>Welcome Back</h1>
        <div className="social-links animate-enter" style={{ '--i': 1 }}>
          {/* Placeholder for visuals, functional button is in Login component */}
          <div className="google-btn-wrapper" style={{ opacity: 0.7, pointerEvents: 'none' }}>
            Logged in mode only
          </div>
        </div>
        <span className="animate-enter" style={{ '--i': 2 }}>or use your account</span>

        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              color: 'var(--primary)',
              textDecoration: 'underline',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Go to Login Page →
          </Link>
        </div>

        <div className="mobile-switch">
          <p>Don't have an account?</p>
          <button type="button" onClick={() => togglePanel(true)}>Sign Up</button>
        </div>
      </form>
        </div >

    {/* Sliding Panel */ }
    < div className = "slide-panel-wrapper" >
      <div className="slide-panel">
        <div className="panel-content panel-content-left">
          <h1>OneCare</h1>
          <p>Access your medical records, appointments, and prescriptions in one secure place.</p>
          <Link to="/">
            <button className="transparent-btn" type="button">Sign In</button>
          </Link>
        </div>
        <div className="panel-content panel-content-right">
          <h1>Join Us</h1>
          <p>Connect with the best healthcare professionals. Your journey to better health starts here.</p>
          <button className="transparent-btn" type="button" onClick={() => togglePanel(true)}>Sign Up</button>
        </div>
      </div>
        </div >
      </main >

    {/* Approval Pending Modal */ }
  {
    showApprovalPendingModal && (
      <>
        <div className="modal-backdrop fade show" style={{ zIndex: 2000 }}></div>
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 2001 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
              <div className="modal-body text-center p-5">
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>📋</div>
                <h4 style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '16px' }}>Request Submitted!</h4>
                <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                  Your registration request has been sent to the <strong>hospital admin</strong>.
                </p>
                <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                  Once approved, you will be able to <strong>login</strong> using your credentials.
                </p>
                <div style={{ marginTop: '24px' }}>
                  <button
                    className="btn btn-primary px-5 py-2"
                    style={{ borderRadius: '25px', fontWeight: '600' }}
                    onClick={() => {
                      setShowApprovalPendingModal(false);
                      navigate("/");
                    }}
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
    </div >
  );
}

export default Signup;
