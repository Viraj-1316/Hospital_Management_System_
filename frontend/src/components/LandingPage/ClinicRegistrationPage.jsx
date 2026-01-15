import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiUser, FiHome, FiPhone, FiMail, 
  FiCheck, FiSend, FiInfo, FiAlertCircle, FiMapPin, FiMessageSquare,
  FiCalendar, FiFileText, FiShield, FiUsers, FiTrendingUp, FiVideo
} from 'react-icons/fi';
import { FaHospital, FaIdCard, FaWhatsapp } from 'react-icons/fa';
import API_BASE from '../../config';
import './ClinicRegistrationPage.css';

// Clinic type options
const CLINIC_TYPES = [
  "General Practice",
  "Dental Clinic",
  "Eye Care / Ophthalmology",
  "Pediatric Clinic",
  "Orthopedic Clinic",
  "Dermatology",
  "Cardiology",
  "Gynecology",
  "Multi-Specialty Hospital",
  "Other"
];

// Features for the animated left panel
const FEATURES = [
  {
    icon: <FiCalendar />,
    title: "Smart Scheduling",
    description: "Intelligent appointment booking with doctor availability management"
  },
  {
    icon: <FaWhatsapp />,
    title: "WhatsApp Integration",
    description: "Automated reminders, prescription alerts, and billing notifications"
  },
  {
    icon: <FiFileText />,
    title: "Digital Records",
    description: "Comprehensive EHR with encounter history and prescriptions"
  },
  {
    icon: <FiShield />,
    title: "Secure & Compliant",
    description: "Role-based access control with HIPAA-ready security"
  },
  {
    icon: <FiTrendingUp />,
    title: "Analytics Dashboard",
    description: "Real-time insights on revenue, appointments, and trends"
  },
  {
    icon: <FiVideo />,
    title: "Telemedicine Ready",
    description: "Google Meet & Zoom integration for virtual consultations"
  }
];

const ClinicRegistrationPage = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    ownerName: '',
    clinicName: '',
    phone: '',
    email: '',
    clinicType: '',
    clinicTypeOther: '',
    licenseNumber: '',
    city: '',
    messageToAdmin: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 2) {
      newErrors.ownerName = 'Owner name must be at least 2 characters';
    }
    
    if (!formData.clinicName.trim() || formData.clinicName.trim().length < 2) {
      newErrors.clinicName = 'Clinic name must be at least 2 characters';
    }
    
    const phoneRegex = /^[\d\s\-\(\)\+]{6,20}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.clinicType) {
      newErrors.clinicType = 'Please select a clinic type';
    }
    
    if (formData.clinicType === 'Other' && (!formData.clinicTypeOther.trim() || formData.clinicTypeOther.trim().length < 2)) {
      newErrors.clinicTypeOther = 'Please specify your clinic type';
    }
    
    if (!formData.licenseNumber.trim() || formData.licenseNumber.trim().length < 3) {
      newErrors.licenseNumber = 'Medical Registration / License Number is required';
    }
    
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      newErrors.city = 'City / Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/clinic-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: data.message || 'This email is already registered' });
        } else {
          setErrors({ form: data.message || 'Registration failed. Please try again.' });
        }
        return;
      }
      
      setApplicationId(data.applicationId);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ form: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clinic-registration-page">
      {/* Navigation */}
      <nav className="registration-nav">
        <Link to="/" className="nav-logo">
          <img src="/logo.png" alt="OneCare HMS" />
          <span>OneCare</span>
        </Link>
        <Link to="/" className="back-link">
          <FiArrowLeft /> Back to Home
        </Link>
      </nav>
      
      {/* Split Layout Container */}
      <div className="registration-split-layout">
        {/* Left Panel - Features */}
        <div className="features-panel">
          <div className="features-content">
            <div className="features-header">
              <h2>Why Choose OneCare?</h2>
              <p>The complete hospital management solution trusted by healthcare providers across India</p>
            </div>
            
            <div className="features-list">
              {FEATURES.map((feature, index) => (
                <div 
                  key={index} 
                  className={`feature-item ${index === activeFeature ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="features-stats">
              <div className="stat-item">
                <strong>100%</strong>
                <span>Cloud Based</span>
              </div>
              <div className="stat-item">
                <strong>24/7</strong>
                <span>Support</span>
              </div>
              <div className="stat-item">
                <strong>5+</strong>
                <span>User Roles</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Form */}
        <div className="form-panel">
          <div className="registration-card">
            <div className="registration-header">
              <h1>Register Your Clinic</h1>
              <p>Fill out the form below to get started</p>
            </div>
            
            <form className="registration-form" onSubmit={handleSubmit}>
              {/* Form Error */}
              {errors.form && (
                <div className="info-box error-box">
                  <FiAlertCircle className="info-icon" />
                  <p>{errors.form}</p>
                </div>
              )}
              
              {/* Row 1: Owner Name & Clinic Name */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FiUser className="icon" />
                    Owner/Contact Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Dr. John Smith"
                    className={errors.ownerName ? 'error' : ''}
                  />
                  {errors.ownerName && (
                    <span className="error-text"><FiAlertCircle /> {errors.ownerName}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <FaHospital className="icon" />
                    Clinic Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    placeholder="City Medical Center"
                    className={errors.clinicName ? 'error' : ''}
                  />
                  {errors.clinicName && (
                    <span className="error-text"><FiAlertCircle /> {errors.clinicName}</span>
                  )}
                </div>
              </div>
              
              {/* Row 2: Phone & Email */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FiPhone className="icon" />
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && (
                    <span className="error-text"><FiAlertCircle /> {errors.phone}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <FiMail className="icon" />
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="clinic@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <span className="error-text"><FiAlertCircle /> {errors.email}</span>
                  )}
                </div>
              </div>
              
              {/* Row 3: License Number & City */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FaIdCard className="icon" />
                    License Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g., MCI-12345"
                    className={errors.licenseNumber ? 'error' : ''}
                  />
                  {errors.licenseNumber && (
                    <span className="error-text"><FiAlertCircle /> {errors.licenseNumber}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <FiMapPin className="icon" />
                    City / Location <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Mumbai, Maharashtra"
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && (
                    <span className="error-text"><FiAlertCircle /> {errors.city}</span>
                  )}
                </div>
              </div>
              
              {/* Row 4: Clinic Type */}
              <div className="form-group">
                <label>
                  <FiHome className="icon" />
                  Clinic Type <span className="required">*</span>
                </label>
                <select
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleChange}
                  className={errors.clinicType ? 'error' : ''}
                >
                  <option value="">Select your clinic type</option>
                  {CLINIC_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.clinicType && (
                  <span className="error-text"><FiAlertCircle /> {errors.clinicType}</span>
                )}
                
                {formData.clinicType === 'Other' && (
                  <div className="other-input-container">
                    <input
                      type="text"
                      name="clinicTypeOther"
                      value={formData.clinicTypeOther}
                      onChange={handleChange}
                      placeholder="Please specify your clinic type"
                      className={errors.clinicTypeOther ? 'error' : ''}
                    />
                    {errors.clinicTypeOther && (
                      <span className="error-text"><FiAlertCircle /> {errors.clinicTypeOther}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Row 5: Message to Admin (Optional) */}
              <div className="form-group">
                <label>
                  <FiMessageSquare className="icon" />
                  Message to Admin <span className="optional">(Optional)</span>
                </label>
                <textarea
                  name="messageToAdmin"
                  value={formData.messageToAdmin}
                  onChange={handleChange}
                  placeholder="Tell us why you're interested in OneCare..."
                  rows={3}
                  maxLength={500}
                />
                <span className="char-count">{formData.messageToAdmin.length}/500</span>
              </div>
              
              {/* Submit Button */}
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend /> Submit Registration
                  </>
                )}
              </button>
              
              <p className="review-note">
                <FiInfo /> Your registration will be reviewed within 24-48 hours
              </p>
            </form>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <FiCheck />
            </div>
            <h2>Registration Submitted!</h2>
            <p>
              Thank you for registering <strong>{formData.clinicName}</strong> with OneCare. 
              Your application has been submitted for review.
            </p>
            <div className="application-id-box">
              <span>Your Application ID</span>
              <strong>{applicationId}</strong>
            </div>
            <Link to="/" className="btn-home">
              <FiHome /> Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicRegistrationPage;
