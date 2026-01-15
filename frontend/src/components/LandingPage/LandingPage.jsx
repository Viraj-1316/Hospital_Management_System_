import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiMenu, FiX, FiCheck, FiArrowRight, FiUsers, FiCalendar, 
  FiFileText, FiDollarSign, FiShield, FiTrendingUp,
  FiMail, FiPhone, FiGlobe, FiHeart, FiActivity, FiVideo,
  FiClock, FiStar, FiZap, FiLayers, FiDatabase
} from 'react-icons/fi';
import { 
  FaWhatsapp, FaUserMd, FaUserInjured, FaHospital, 
  FaClipboardList, FaPrescriptionBottle,
  FaLinkedin, FaTwitter, FaGithub, FaGoogle
} from 'react-icons/fa';
import './LandingPage.css';
import LandingFooter from './LandingFooter';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animatedNumbers, setAnimatedNumbers] = useState({});

  useEffect(() => {
    document.title = 'OneCare - Hospital Management System | HMS Software for Clinics';
    window.scrollTo(0, 0); // Scroll to top on page load
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Animate stats numbers on load
    const animateNumbers = () => {
      const statValues = { patients: 1000, clinics: 50, uptime: 99.9 };
      Object.entries(statValues).forEach(([key, target]) => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedNumbers(prev => ({ ...prev, [key]: Math.floor(current) }));
        }, 30);
      });
    };
    
    setTimeout(animateNumbers, 500);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <FaWhatsapp />,
      title: 'WhatsApp Notifications',
      description: 'Automated appointment reminders, prescription alerts, and billing notifications via WhatsApp Business API.'
    },
    {
      icon: <FiFileText />,
      title: 'Electronic Health Records',
      description: 'Comprehensive digital patient records with encounter history, prescriptions, and medical reports.'
    },
    {
      icon: <FiDollarSign />,
      title: 'Razorpay Billing',
      description: 'Streamlined invoice generation with GST support, payment tracking, and online payment gateway.'
    },
    {
      icon: <FiCalendar />,
      title: 'Smart Scheduling',
      description: 'Intelligent appointment booking with doctor availability, holiday management, and session planning.'
    },
    {
      icon: <FiShield />,
      title: 'Multi-Tenant Security',
      description: 'Isolated data for each clinic with role-based access control and JWT authentication.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Analytics Dashboard',
      description: 'Real-time insights on revenue, appointments, and patient trends with visual reports.'
    },
    {
      icon: <FiVideo />,
      title: 'Telemedicine Ready',
      description: 'Google Meet and Zoom integration for virtual consultations and remote patient care.'
    },
    {
      icon: <FiLayers />,
      title: 'Encounter Templates',
      description: 'Pre-built clinical templates for faster documentation and consistent care protocols.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Register Your Clinic',
      description: 'Sign up in minutes with our simple onboarding. Add your clinic details and logo.',
      icon: <FaHospital />
    },
    {
      number: '02',
      title: 'Configure Services',
      description: 'Set up departments, services, tax rates, and customize your clinic settings.',
      icon: <FaClipboardList />
    },
    {
      number: '03',
      title: 'Invite Your Team',
      description: 'Add doctors, receptionists, and staff with role-specific access and permissions.',
      icon: <FiUsers />
    },
    {
      number: '04',
      title: 'Go Live',
      description: 'Start scheduling appointments, managing patients, and accepting online payments.',
      icon: <FiActivity />
    }
  ];

  const modules = [
    {
      role: 'Clinic Admin',
      icon: <FaHospital />,
      color: 'admin',
      description: 'Complete clinic management',
      features: [
        'Doctor & staff management',
        'Revenue & financial reports',
        'Appointment oversight',
        'Billing & tax configuration',
        'Custom clinic settings'
      ]
    },
    {
      role: 'Doctor',
      icon: <FaUserMd />,
      color: 'doctor',
      description: 'Clinical workflow management',
      features: [
        'Appointment calendar',
        'Digital prescriptions (Rx)',
        'Patient encounter history',
        'Medical report generation',
        'Google Meet/Zoom integration'
      ]
    },
    {
      role: 'Patient',
      icon: <FaUserInjured />,
      color: 'patient',
      description: 'Self-service portal',
      features: [
        'Online appointment booking',
        'Medical records access',
        'Prescription history',
        'Bill payments via Razorpay',
        'WhatsApp notifications'
      ]
    },
    {
      role: 'Receptionist',
      icon: <FaClipboardList />,
      color: 'receptionist',
      description: 'Front desk operations',
      features: [
        'Appointment scheduling',
        'Patient check-in/out',
        'Bill generation & payments',
        'Patient registration',
        'Daily reports'
      ]
    }
  ];

  const stats = [
    { value: '100%', label: 'Cloud Based', icon: <FiDatabase /> },
    { value: '24/7', label: 'Availability', icon: <FiClock /> },
    { value: '5+', label: 'User Roles', icon: <FiUsers /> },
    { value: 'HIPAA', label: 'Compliant', icon: <FiShield /> }
  ];

  const techStack = [
    { name: 'React', desc: 'Modern UI' },
    { name: 'Node.js', desc: 'Backend' },
    { name: 'MongoDB', desc: 'Database' },
    { name: 'Razorpay', desc: 'Payments' },
    { name: 'WhatsApp', desc: 'Messaging' },
    { name: 'JWT', desc: 'Security' }
  ];

  const testimonials = [
    {
      quote: "OneCare has transformed how we manage our clinic. The WhatsApp integration alone has reduced no-shows by 35%.",
      author: "Dr. Priya Sharma",
      role: "Clinic Owner, Mumbai",
      rating: 5
    },
    {
      quote: "Finally, an HMS that's actually easy to use. Our staff picked it up in a day. The billing module is exceptional.",
      author: "Rajesh Kumar",
      role: "Hospital Administrator, Delhi",
      rating: 5
    },
    {
      quote: "The patient portal is a game-changer. Our patients love booking appointments online and accessing their records.",
      author: "Dr. Anil Patel",
      role: "General Physician, Pune",
      rating: 5
    },
    {
      quote: "Seamless Razorpay integration made collecting payments so much easier. Highly recommend for any clinic.",
      author: "Dr. Meera Reddy",
      role: "Dental Clinic, Bangalore",
      rating: 5
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="OneCare HMS" />
            <span>OneCare</span>
          </Link>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <button onClick={scrollToTop} className="nav-link">Home</button>
            <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link">How It Works</button>
            <button onClick={() => scrollToSection('modules')} className="nav-link">Modules</button>
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
            <Link to="/register-clinic" className="btn-primary">Register Clinic</Link>
          </div>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                <FiHeart /> Complete Healthcare Management Platform
              </div>
              <h1 className="hero-title">
                <span className="word word-1">All-in-One</span>{' '}
                <span className="word word-2 gradient-text">Hospital</span>{' '}
                <span className="word word-3 gradient-text">Management</span>{' '}
                <span className="word word-4">System</span>
              </h1>
              <p className="hero-description">
                Empower your clinic with OneCare – the modern, cloud-based HMS designed for 
                private practices and hospitals in India. Streamline appointments, digitize records, 
                automate billing, and connect with patients via WhatsApp.
              </p>
              <div className="hero-cta">
                <button onClick={() => scrollToSection('contact')} className="btn-primary btn-lg">
                  Request a Demo <FiArrowRight />
                </button>
                <Link to="/register-clinic" className="btn-outline btn-lg">
                  Register Your Clinic
                </Link>
              </div>
              <div className="hero-trust">
                <span>Trusted by healthcare providers across India</span>
                <div className="trust-badges">
                  {stats.map((stat, index) => (
                    <div key={index} className="trust-badge">
                      <div className="trust-icon">{stat.icon}</div>
                      <div className="trust-info">
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-card hero-card-main">
                <div className="dashboard-preview">
                  <div className="preview-header">
                    <div className="preview-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span className="preview-title">OneCare Dashboard</span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-sidebar">
                      <div className="sidebar-item active"></div>
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item"></div>
                    </div>
                    <div className="preview-main">
                      <div className="stat-cards">
                        <div className="mini-card blue"><FiUsers /></div>
                        <div className="mini-card teal"><FiCalendar /></div>
                        <div className="mini-card green"><FiDollarSign /></div>
                      </div>
                      <div className="chart-placeholder"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-card hero-card-float-1">
                <FaWhatsapp className="float-icon whatsapp" />
                <span>WhatsApp Ready</span>
              </div>
              <div className="hero-card hero-card-float-2">
                <FaPrescriptionBottle className="float-icon rx" />
                <span>Digital Rx</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><FiZap /> Features</span>
            <h2>Everything Your Clinic Needs</h2>
            <p>Comprehensive tools designed specifically for modern healthcare practices</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="steps-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Getting Started</span>
            <h2>Go Live in 4 Simple Steps</h2>
            <p>From signup to managing patients – get your clinic online in minutes</p>
          </div>
          
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < steps.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="modules-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Role-Based Access</span>
            <h2>Tailored Dashboards for Every Role</h2>
            <p>Each user gets a personalized experience based on their responsibilities</p>
          </div>
          
          <div className="modules-grid">
            {modules.map((module, index) => (
              <div key={index} className={`module-card module-${module.color}`}>
                <div className="module-header">
                  <div className="module-icon">{module.icon}</div>
                  <div>
                    <h3>{module.role}</h3>
                    <span className="module-desc">{module.description}</span>
                  </div>
                </div>
                <ul className="module-features">
                  {module.features.map((feature, fIndex) => (
                    <li key={fIndex}>
                      <FiCheck /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Integration Highlight */}
      <section className="whatsapp-section">
        <div className="container">
          <div className="whatsapp-grid">
            <div className="whatsapp-text">
              <span className="section-badge whatsapp-badge">
                <FaWhatsapp /> WhatsApp Business API
              </span>
              <h2>Connect with Patients Where They Are</h2>
              <p>
                Leverage the power of WhatsApp to send automated appointment reminders, 
                prescription notifications, and billing alerts. Keep your patients informed 
                and reduce no-shows by up to 40%.
              </p>
              <ul className="whatsapp-features">
                <li><FiCheck /> Automated appointment reminders</li>
                <li><FiCheck /> Prescription delivery notifications</li>
                <li><FiCheck /> Payment & billing alerts</li>
                <li><FiCheck /> Custom message templates</li>
              </ul>
            </div>
            <div className="whatsapp-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="wa-header">
                    <FaWhatsapp />
                    <span>OneCare Clinic</span>
                  </div>
                  <div className="wa-messages">
                    <div className="wa-message">
                      <p>🏥 <strong>Appointment Reminder</strong></p>
                      <p>Your appointment with Dr. Sharma is scheduled for tomorrow at 10:00 AM.</p>
                      <span className="wa-time">10:30 AM</span>
                    </div>
                    <div className="wa-message">
                      <p>💊 <strong>Prescription Ready</strong></p>
                      <p>Your prescription has been generated. View it in your patient portal.</p>
                      <span className="wa-time">2:15 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="integrations-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><FiGlobe /> Integrations</span>
            <h2>Seamlessly Connected</h2>
            <p>Integrate with best-in-class tools to streamline your clinic operations</p>
          </div>
          
          <div className="integrations-content">
            <div className="integrations-grid">
              <div className="integration-card">
                <div className="integration-icon-wrapper whatsapp">
                  <FaWhatsapp className="integration-icon" />
                </div>
                <h4>WhatsApp Business</h4>
                <p>Automated patient notifications, reminders & alerts</p>
              </div>
              <div className="integration-card">
                <div className="integration-icon-wrapper google">
                  <FaGoogle className="integration-icon" />
                </div>
                <h4>Google Meet</h4>
                <p>Seamless video consultations from dashboard</p>
              </div>
              <div className="integration-card">
                <div className="integration-icon-wrapper zoom">
                  <FiVideo className="integration-icon" />
                </div>
                <h4>Zoom</h4>
                <p>Professional telemedicine video calls</p>
              </div>
              <div className="integration-card">
                <div className="integration-icon-wrapper razorpay">
                  <FiDollarSign className="integration-icon" />
                </div>
                <h4>Razorpay</h4>
                <p>Secure online payment collection</p>
              </div>
              <div className="integration-card">
                <div className="integration-icon-wrapper email">
                  <FiMail className="integration-icon" />
                </div>
                <h4>Email</h4>
                <p>Encounter details & prescription delivery</p>
              </div>
              <div className="integration-card">
                <div className="integration-icon-wrapper pdf">
                  <FiFileText className="integration-icon" />
                </div>
                <h4>PDF Generation</h4>
                <p>Bills, prescriptions & reports</p>
              </div>
            </div>
            
            <div className="integrations-cta">
              <p>All integrations work out of the box. No complex setup required.</p>
              <Link to="/contact" className="btn-outline btn-md">
                Request Custom Integration <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-badge"><FiStar /> Testimonials</span>
            <h2>What Our Users Say</h2>
            <p>Trusted by healthcare providers across India</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((item, index) => (
              <div key={index} className={`testimonial-card animate-on-scroll delay-${index + 1}`}>
                <div className="testimonial-stars">
                  {[...Array(item.rating)].map((_, i) => (
                    <FiStar key={i} className="star-filled" />
                  ))}
                </div>
                <p className="testimonial-quote">"{item.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{item.author.charAt(0)}</div>
                  <div>
                    <strong>{item.author}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Practice?</h2>
            <p>
              Join healthcare providers across India who trust OneCare for their daily operations.
              Get started today with a free demo.
            </p>
            <div className="cta-buttons">
              <Link to="/register-clinic" className="btn-primary btn-lg">
                Register Your Clinic <FiArrowRight />
              </Link>
              <a href="mailto:bhargavk056@gmail.com" className="btn-outline btn-lg">
                Request Demo
              </a>
            </div>
            <div className="cta-contact">
              <a href="mailto:bhargavk056@gmail.com">
                <FiMail /> bhargavk056@gmail.com
              </a>
              <a href="tel:+919420530466">
                <FiPhone /> +91 94205 30466
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
