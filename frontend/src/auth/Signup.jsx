import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Signup failed");
        return;
      }

      await res.json().catch(() => ({}));

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
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Google"><i className="fab fa-google"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
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

            {/* Hospital ID field - shown for Doctor/Receptionist */}
            <div
              className={`role-extra ${(role === "DOCTOR" || role === "RECEPTIONIST") ? 'show' : ''}`}
              id="professionalFields"
            >
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Hospital ID"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                />
                <i className="fas fa-id-badge input-icon"></i>
              </div>
            </div>

            <button type="submit" className="animate-enter" style={{ '--i': 8 }}>Sign Up</button>

            <div className="mobile-switch">
              <p>Already have an account?</p>
              <button type="button" onClick={() => navigate("/")}>Sign In</button>
            </div>
          </form>
        </div>

        {/* Login Form (Placeholder - redirect to login page) */}
        <div className="auth-form-box login-form-box">
          <form>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Welcome Back</h1>
            <div className="social-links animate-enter" style={{ '--i': 1 }}>
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Google"><i className="fab fa-google"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
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
        </div>

        {/* Sliding Panel */}
        <div className="slide-panel-wrapper">
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
        </div>
      </main>
    </div>
  );
}

export default Signup;
