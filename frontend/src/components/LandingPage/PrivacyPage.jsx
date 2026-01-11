import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMenu, FiX } from 'react-icons/fi';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import './LegalPages.css';

const PrivacyPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy - OneCare HMS';
  }, []);

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
            <Link to="/about" className="nav-link">About Us</Link>
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
      <section className="legal-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>Last updated: January 11, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="legal-content">
        <div className="container">
          <div className="content-wrapper">
            <article className="legal-article">
              <h2>1. Introduction</h2>
              <p>
                OneCare ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our Hospital Management System platform at onecare.bhargavkarande.dev.
              </p>
              <p>
                By using OneCare, you agree to the collection and use of information in accordance 
                with this policy. If you do not agree with our policies, please do not use our services.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Professional qualifications, specializations (for doctors), medical history (for patients)</li>
                <li><strong>Contact Information:</strong> Address, emergency contacts</li>
                <li><strong>Payment Information:</strong> Billing details processed through Razorpay (we do not store card numbers)</li>
              </ul>

              <h3>2.2 Health Information</h3>
              <p>As a healthcare management platform, we process Protected Health Information (PHI) including:</p>
              <ul>
                <li>Medical records and encounter history</li>
                <li>Prescriptions and treatment plans</li>
                <li>Appointment details</li>
                <li>Lab reports and medical documents</li>
              </ul>

              <h3>2.3 Technical Information</h3>
              <ul>
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Usage patterns and analytics (via Google Tag Manager)</li>
                <li>Cookies and session data</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul>
                <li>Provide and maintain our HMS services</li>
                <li>Process appointments and medical encounters</li>
                <li>Generate bills and process payments</li>
                <li>Send appointment reminders via WhatsApp and email</li>
                <li>Improve our platform and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>

              <h2>4. Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul>
                <li><strong>Healthcare Providers:</strong> Doctors and clinic staff as necessary for your care</li>
                <li><strong>Payment Processors:</strong> Razorpay for payment processing</li>
                <li><strong>Communication Services:</strong> WhatsApp Business API for notifications</li>
                <li><strong>Analytics Providers:</strong> Google Analytics for usage insights</li>
                <li><strong>Legal Authorities:</strong> When required by law or legal process</li>
              </ul>
              <p>We do NOT sell your personal or health information to third parties for marketing purposes.</p>

              <h2>5. Data Security</h2>
              <p>We implement industry-standard security measures including:</p>
              <ul>
                <li>JWT-based authentication</li>
                <li>Password hashing with bcrypt</li>
                <li>HTTPS encryption for all data transmission</li>
                <li>MongoDB security best practices</li>
                <li>Role-based access control (RBAC)</li>
                <li>Regular security audits</li>
              </ul>

              <h2>6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed 
                to provide services. Medical records are retained as per applicable healthcare regulations 
                in India. You may request deletion of your data by contacting us.
              </p>

              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Withdraw consent for optional data processing</li>
                <li>Export your data in a portable format</li>
              </ul>

              <h2>8. Cookies</h2>
              <p>
                We use cookies and similar technologies to maintain sessions, remember preferences, 
                and analyze usage. You can control cookies through your browser settings.
              </p>

              <h2>9. Third-Party Links</h2>
              <p>
                Our platform may contain links to third-party websites. We are not responsible for 
                the privacy practices of these external sites.
              </p>

              <h2>10. Children's Privacy</h2>
              <p>
                OneCare is not intended for children under 13. We do not knowingly collect information 
                from children. Patient accounts for minors should be managed by parents or guardians.
              </p>

              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant 
                changes via email or platform notification. Your continued use after changes 
                constitutes acceptance.
              </p>

              <h2>12. Contact Us</h2>
              <p>For questions about this Privacy Policy, contact us at:</p>
              <ul>
                <li><strong>Email:</strong> bhargavk056@gmail.com</li>
                <li><strong>Phone:</strong> +91 94205 30466</li>
                <li><strong>Website:</strong> onecare.bhargavkarande.dev</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src="/logo.png" alt="OneCare" />
                <span>OneCare</span>
              </Link>
              <p>Modern hospital management for modern healthcare.</p>
            </div>
            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/">Home</Link>
                <Link to="/about">About Us</Link>
                <Link to="/login">Login</Link>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
              <div className="footer-column">
                <h4>Contact</h4>
                <a href="mailto:bhargavk056@gmail.com"><FiMail /> bhargavk056@gmail.com</a>
                <a href="tel:+919420530466"><FiPhone /> +91 94205 30466</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} OneCare. All rights reserved.</p>
            <div className="footer-social">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
