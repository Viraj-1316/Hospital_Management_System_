import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, FiCheck, FiUsers, FiTarget, FiAward, 
  FiHeart, FiGlobe, FiMail, FiPhone, FiMenu, FiX
} from 'react-icons/fi';
import { FaLinkedin, FaTwitter, FaGithub, FaHospital } from 'react-icons/fa';
import './LegalPages.css';
import LandingFooter from './LandingFooter';

const AboutPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'About Us - OneCare HMS';
  }, []);

  const values = [
    {
      icon: <FiTarget />,
      title: 'Our Mission',
      description: 'To democratize healthcare technology by providing affordable, intuitive hospital management solutions that empower medical professionals to focus on patient care.'
    },
    {
      icon: <FiHeart />,
      title: 'Patient-Centric',
      description: 'Every feature we build is designed with the patient experience in mind. From easy appointment booking to transparent billing.'
    },
    {
      icon: <FiGlobe />,
      title: 'Cloud-First',
      description: 'Built for the modern healthcare landscape with cloud-native architecture, ensuring accessibility and security from anywhere.'
    },
    {
      icon: <FiAward />,
      title: 'Excellence',
      description: 'We maintain the highest standards in software development, security practices, and customer support.'
    }
  ];

  const features = [
    'Multi-tenant architecture for clinics and hospitals',
    '5 role-based portals (Super Admin, Clinic Admin, Doctor, Patient, Receptionist)',
    'Electronic Health Records (EHR) with encounter management',
    'Smart appointment scheduling with conflict detection',
    'Automated billing with GST support and Razorpay integration',
    'WhatsApp Business API for patient notifications',
    'Google Meet & Zoom integration for telemedicine',
    'PDF generation for prescriptions and bills',
    'Real-time dashboard analytics',
    'Mobile-responsive design'
  ];

  return (
    <div className="legal-page">
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
            <Link to="/about" className="nav-link active">About Us</Link>
            <Link to="/contact" className="nav-link">Contact Us</Link>
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
      <section className="legal-hero about-hero">
        <div className="container">
          <h1>About <span>OneCare</span></h1>
          <p>Building the future of healthcare management, one clinic at a time.</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>
                OneCare was born from a simple observation: healthcare providers spend too much 
                time on administrative tasks and not enough on patient care. We set out to change that.
              </p>
              <p>
                Built by developers who understand the unique challenges of healthcare IT, OneCare 
                is a comprehensive Hospital Management System designed specifically for private 
                clinics and hospitals in India. Our platform combines powerful features with an 
                intuitive interface, making it accessible to practices of all sizes.
              </p>
              <p>
                From appointment scheduling to billing, from electronic health records to WhatsApp 
                notifications, OneCare handles the complexity so healthcare professionals can 
                focus on what they do best – caring for patients.
              </p>
            </div>
            <div className="story-visual">
              <div className="visual-card">
                <FaHospital className="visual-icon" />
                <h3>100+</h3>
                <p>Clinics Supported</p>
              </div>
              <div className="visual-card">
                <FiUsers className="visual-icon" />
                <h3>5</h3>
                <p>User Roles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="container">
          <h2>What Makes OneCare Special</h2>
          <div className="features-list">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <FiCheck className="check-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <h2>Ready to Transform Your Practice?</h2>
          <p>Join hundreds of healthcare providers who trust OneCare for their daily operations.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary btn-lg">
              Get Started Free <FiArrowRight />
            </Link>
            <a href="mailto:bhargavk056@gmail.com" className="btn-outline btn-lg">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default AboutPage;
