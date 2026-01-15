import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiMail, FiPhone, FiGlobe, FiHeart
} from 'react-icons/fi';
import { 
  FaLinkedin, FaTwitter, FaGithub
} from 'react-icons/fa';
import { FRONTEND_URL, WEBSITE_DOMAIN } from '../../config';
import './LandingPage.css';

const LandingFooter = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const scrollToSection = (sectionId) => {
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      
    }
  };

  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/logo.png" alt="OneCare" />
              <span>OneCare</span>
            </Link>
            <p>
              Modern hospital management system designed for clinics and healthcare 
              providers in India. Streamline your practice with our all-in-one solution.
            </p>
            <div className="footer-social">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FaGithub />
              </a>
            </div>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Product</h4>
              {isHomePage ? (
                <>
                  <button onClick={() => scrollToSection('features')}>Features</button>
                  <button onClick={() => scrollToSection('modules')}>Modules</button>
                  <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
                  <button onClick={() => scrollToSection('contact')}>Contact</button>
                </>
              ) : (
                <>
                  <Link to="/#features">Features</Link>
                  <Link to="/#modules">Modules</Link>
                  <Link to="/#how-it-works">How It Works</Link>
                  <Link to="/contact">Contact</Link>
                </>
              )}
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
            <div className="footer-column">
              <h4>Get Started</h4>
              <Link to="/login">Login</Link>
              <Link to="/signup">Register Clinic</Link>
              <a href="mailto:bhargavk056@gmail.com">Request Demo</a>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <a href="mailto:bhargavk056@gmail.com">
                <FiMail /> bhargavk056@gmail.com
              </a>
              <a href="tel:+919420530466">
                <FiPhone /> +91 94205 30466
              </a>
              <a href={FRONTEND_URL} target="_blank" rel="noopener noreferrer">
                <FiGlobe /> {WEBSITE_DOMAIN}
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} OneCare. All rights reserved.</p>
          <p>Made with <FiHeart className="heart-icon" /> in India</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
