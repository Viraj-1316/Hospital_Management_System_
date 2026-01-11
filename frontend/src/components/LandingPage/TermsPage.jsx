import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMenu, FiX } from 'react-icons/fi';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import './LegalPages.css';

const TermsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service - OneCare HMS';
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
          <h1>Terms of Service</h1>
          <p>Last updated: January 11, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="legal-content">
        <div className="container">
          <div className="content-wrapper">
            <article className="legal-article">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using OneCare Hospital Management System ("Service") at 
                onecare.bhargavkarande.dev, you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>OneCare is a cloud-based Hospital Management System (HMS) that provides:</p>
              <ul>
                <li>Patient and appointment management</li>
                <li>Electronic Health Records (EHR)</li>
                <li>Billing and payment processing</li>
                <li>Doctor and staff management</li>
                <li>Multi-tenant clinic administration</li>
                <li>Communication tools (WhatsApp, Email)</li>
              </ul>

              <h2>3. User Accounts</h2>
              <h3>3.1 Account Creation</h3>
              <p>
                To use certain features, you must create an account. You agree to provide accurate, 
                current, and complete information during registration and to update such information 
                to keep it accurate.
              </p>
              
              <h3>3.2 Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities under your account. You must immediately notify us of any 
                unauthorized use.
              </p>

              <h3>3.3 Account Types</h3>
              <ul>
                <li><strong>Super Admin:</strong> Full platform access and multi-clinic management</li>
                <li><strong>Clinic Admin:</strong> Single clinic administration</li>
                <li><strong>Doctor:</strong> Patient care and appointment management</li>
                <li><strong>Receptionist:</strong> Front desk operations</li>
                <li><strong>Patient:</strong> Personal health records and appointments</li>
              </ul>

              <h2>4. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul>
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code or harmful content</li>
                <li>Impersonate another person or entity</li>
                <li>Share login credentials with unauthorized parties</li>
                <li>Use the Service to store false or misleading medical information</li>
                <li>Violate any applicable healthcare regulations</li>
              </ul>

              <h2>5. Healthcare Disclaimer</h2>
              <p>
                <strong>OneCare is a management tool, not a medical device.</strong> The Service 
                does not provide medical advice, diagnosis, or treatment. All medical decisions 
                should be made by qualified healthcare professionals. We are not responsible for 
                any medical outcomes resulting from the use of our platform.
              </p>

              <h2>6. Data Ownership</h2>
              <h3>6.1 Your Data</h3>
              <p>
                You retain ownership of all data you input into OneCare. This includes patient 
                records, appointments, and billing information managed by your clinic.
              </p>
              
              <h3>6.2 Our Rights</h3>
              <p>
                We may use anonymized, aggregated data for analytics and service improvement. 
                No personally identifiable information is shared without consent.
              </p>

              <h2>7. Payment Terms</h2>
              <h3>7.1 Billing</h3>
              <p>
                Patient payments are processed through Razorpay. Clinic billing and payment processing 
                are subject to Razorpay's terms of service.
              </p>
              
              <h3>7.2 Refunds</h3>
              <p>
                Refund policies for medical services are determined by individual clinics. OneCare 
                does not process refunds for services rendered by healthcare providers.
              </p>

              <h2>8. Service Availability</h2>
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted service. We may 
                perform maintenance that temporarily affects availability. We will provide advance 
                notice when possible.
              </p>

              <h2>9. Intellectual Property</h2>
              <p>
                The OneCare platform, including its design, features, and code, is owned by us 
                and protected by intellectual property laws. You may not copy, modify, distribute, 
                or reverse engineer any part of the Service.
              </p>

              <h2>10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, OneCare and its developers shall not be 
                liable for any indirect, incidental, special, consequential, or punitive damages, 
                including loss of profits, data, or other intangible losses.
              </p>
              <p>
                Our total liability shall not exceed the amount paid by you (if any) for using 
                the Service in the twelve months preceding the claim.
              </p>

              <h2>11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless OneCare, its developers, and affiliates 
                from any claims, damages, or expenses arising from your use of the Service or 
                violation of these Terms.
              </p>

              <h2>12. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice, for 
                conduct that we believe violates these Terms or is harmful to other users, us, 
                or third parties.
              </p>
              <p>
                Upon termination, you may request export of your data within 30 days. After this 
                period, we may delete your data.
              </p>

              <h2>13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of 
                significant changes via email or platform notification. Continued use after changes 
                constitutes acceptance.
              </p>

              <h2>14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of 
                India. Any disputes shall be subject to the exclusive jurisdiction of courts 
                in Maharashtra, India.
              </p>

              <h2>15. Contact Information</h2>
              <p>For questions about these Terms, please contact:</p>
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

export default TermsPage;
