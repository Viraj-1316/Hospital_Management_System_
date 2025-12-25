import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API_BASE from "../config";
import "./OneCareAuth.css";

function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelActive, setIsPanelActive] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("PATIENT");
  const [signupHospitalId, setSignupHospitalId] = useState("");

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Toggle between login and signup panels
  const togglePanel = (active) => {
    setIsPanelActive(active);
    // Trigger animation on elements
    setTimeout(() => {
      const animElements = document.querySelectorAll('.animate-enter');
      animElements.forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; // Trigger Reflow
        el.style.animation = null;
      });
    }, 100);
  };

  // Handle role change for signup
  const handleRoleChange = (newRole) => {
    setSignupRole(newRole);
    if (newRole === "PATIENT") {
      setSignupHospitalId("");
    }
  };

  // Login submit handler
  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Login failed");
        return;
      }

      const data = await res.json();
      const user = data.user || data;

      console.log("Login response user:", user);

      // Save Token & User ID
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      const userId = user.id || user._id;
      if (userId) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("userRole", user.role);
      }

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

      localStorage.setItem("authUser", JSON.stringify(authUser));

      // Fetch patient data if role is patient
      if (authUser.role === "patient" && userId && userId !== "admin-id") {
        try {
          const pRes = await fetch(`${API_BASE}/patients/by-user/${userId}`);
          if (pRes.ok) {
            const patientDoc = await pRes.json();
            const patientObj = {
              id: patientDoc._id || patientDoc.id || userId,
              _id: patientDoc._id || patientDoc.id || userId,
              userId: patientDoc.userId || userId,
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
            localStorage.setItem("patient", JSON.stringify(patientObj));
            localStorage.setItem("patientId", patientObj.id);
          } else {
            localStorage.removeItem("patient");
            localStorage.removeItem("patientId");
          }
        } catch (errFetchPatient) {
          console.warn("Could not fetch patient doc:", errFetchPatient);
        }
      }

      // Fetch doctor data if role is doctor
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

      // Redirect based on role
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
      toast.error("Network error: backend not responding");
    }
  };

  // Signup submit handler
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!signupName || !signupEmail || !signupPassword || !signupPhone) {
      toast.error("All fields are required.");
      return;
    }

    // Validate Hospital ID for non-patients
    if ((signupRole === "DOCTOR" || signupRole === "RECEPTIONIST") && !signupHospitalId) {
      toast.error("Hospital ID is required for staff.");
      return;
    }

    if (signupPhone.replace(/\D/g, "").length < 6) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    const formattedPhone = signupPhone.startsWith("+") ? signupPhone : `+${signupPhone}`;

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          phone: formattedPhone,
          role: signupRole.toLowerCase(),
          hospitalId: signupHospitalId || undefined,
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
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupPhone("");
      setSignupRole("PATIENT");
      setSignupHospitalId("");

      // Switch to login panel after signup
      setTimeout(() => togglePanel(false), 1500);

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

        {/* ========== REGISTER FORM ========== */}
        <div className="auth-form-box register-form-box">
          <form id="registerForm" onSubmit={handleSignupSubmit}>
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
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
              <i className="fas fa-user input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 4 }}>
              <input
                type="email"
                placeholder="Email Address"
                required
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 5 }}>
              <input
                type="tel"
                placeholder="Phone Number"
                required
                autoComplete="tel"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
              />
              <i className="fas fa-phone input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 6 }}>
              <input
                type="password"
                placeholder="Password"
                required
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
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
                    checked={signupRole === "PATIENT"}
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
                    checked={signupRole === "DOCTOR"}
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
                    checked={signupRole === "RECEPTIONIST"}
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
              className={`role-extra ${(signupRole === "DOCTOR" || signupRole === "RECEPTIONIST") ? 'show' : ''}`}
              id="professionalFields"
            >
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Hospital ID"
                  value={signupHospitalId}
                  onChange={(e) => setSignupHospitalId(e.target.value)}
                />
                <i className="fas fa-id-badge input-icon"></i>
              </div>
            </div>

            <button type="submit" className="animate-enter" style={{ '--i': 8 }}>Sign Up</button>

            <div className="mobile-switch">
              <p>Already have an account?</p>
              <button type="button" onClick={() => togglePanel(false)}>Sign In</button>
            </div>
          </form>
        </div>

        {/* ========== LOGIN FORM ========== */}
        <div className="auth-form-box login-form-box">
          <form id="loginForm" onSubmit={handleLoginSubmit}>
            <h1 className="animate-enter" style={{ '--i': 0 }}>Welcome Back</h1>

            <div className="social-links animate-enter" style={{ '--i': 1 }}>
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Google"><i className="fab fa-google"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span className="animate-enter" style={{ '--i': 2 }}>or use your account</span>

            <div className="input-group animate-enter" style={{ '--i': 3 }}>
              <input
                type="email"
                placeholder="Email Address"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            <div className="input-group animate-enter" style={{ '--i': 4 }}>
              <input
                type="password"
                placeholder="Password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <i className="fas fa-lock input-icon"></i>
            </div>

            <div className="forgot-pass-box animate-enter" style={{ '--i': 5 }}>
              <a href="#" className="forgot-pass-link">Forgot your password?</a>
            </div>

            <button type="submit" className="animate-enter" style={{ '--i': 6 }}>Sign In</button>

            <div className="mobile-switch">
              <p>Don't have an account?</p>
              <button type="button" onClick={() => togglePanel(true)}>Sign Up</button>
            </div>
          </form>
        </div>

        {/* ========== SLIDING PANEL ========== */}
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