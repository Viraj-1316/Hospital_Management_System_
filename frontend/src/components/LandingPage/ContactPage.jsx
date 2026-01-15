import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiMail, FiPhone, FiUser, FiMessageSquare, FiSend, 
  FiMenu, FiX, FiMapPin, FiGlobe, FiCheck, FiClock
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin, FaTwitter, FaGithub, FaHospital } from 'react-icons/fa';
import { FRONTEND_URL, WEBSITE_DOMAIN } from '../../config';
import './LegalPages.css';
import LandingFooter from './LandingFooter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ContactPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    inquiryType: 'Demo Request',
    message: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Us - OneCare HMS';
  }, []);

  const inquiryTypes = [
    'Demo Request',
    'Pricing Inquiry',
    'Technical Support',
    'Partnership',
    'Feature Request',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/contact`, formData);
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success('Your inquiry has been submitted!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          clinicName: '',
          inquiryType: 'Demo Request',
          message: ''
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="legal-page contact-page">
      {/* Navigation - Same as Home */}
      <nav className="landing-nav scrolled">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="OneCare" />
            <span>OneCare</span>
          </Link>
          
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/#features" className="nav-link">Features</Link>
            <Link to="/#how-it-works" className="nav-link">How It Works</Link>
            <Link to="/#modules" className="nav-link">Modules</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/contact" className="nav-link active">Contact Us</Link>
            <div className="nav-cta-mobile">
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/signup" className="btn-primary">Get Started</Link>
            </div>
          </div>

          <div className="nav-cta">
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/signup" className="btn-primary">Register Clinic</Link>
          </div>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="legal-hero contact-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              <h2>Contact Information</h2>
              <p>Fill out the form and our team will get back to you within 24-48 hours.</p>

              <div className="info-items">
                <div className="info-item">
                  <div className="info-icon">
                    <FiMail />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:bhargavk056@gmail.com">bhargavk056@gmail.com</a>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FiPhone />
                  </div>
                  <div>
                    <h4>Phone</h4>
                    <a href="tel:+919420530466">+91 94205 30466</a>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FaWhatsapp />
                  </div>
                  <div>
                    <h4>WhatsApp</h4>
                    <a href="https://wa.me/919420530466" target="_blank" rel="noopener noreferrer">
                      Chat with us
                    </a>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <FiGlobe />
                  </div>
                  <div>
                    <h4>Website</h4>
                    <a href={FRONTEND_URL} target="_blank" rel="noopener noreferrer">
                      {WEBSITE_DOMAIN}
                    </a>
                  </div>
                </div>
              </div>

              <div className="response-time">
                <FiClock />
                <span>Average response time: 24-48 hours</span>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              {isSubmitted ? (
                <div className="success-message">
                  <div className="success-icon">
                    <FiCheck />
                  </div>
                  <h3>Thank You!</h3>
                  <p>Your inquiry has been submitted successfully. We've sent a confirmation to your email.</p>
                  <p>Our team will review your request and get back to you within 24-48 hours.</p>
                  <button 
                    className="btn-primary btn-lg" 
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        <FiUser /> Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={errors.name ? 'error' : ''}
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        <FiMail /> Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">
                        <FiPhone /> Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="clinicName">
                        <FaHospital /> Clinic/Hospital Name
                      </label>
                      <input
                        type="text"
                        id="clinicName"
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleChange}
                        placeholder="Your clinic or hospital name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiryType">
                      Inquiry Type
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleChange}
                    >
                      {inquiryTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">
                      <FiMessageSquare /> Message <span className="required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your inquiry..."
                      rows={5}
                      className={errors.message ? 'error' : ''}
                    />
                    {errors.message && <span className="error-text">{errors.message}</span>}
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary btn-lg submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>Send Message <FiSend /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default ContactPage;
