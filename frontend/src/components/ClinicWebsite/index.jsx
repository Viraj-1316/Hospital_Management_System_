// src/components/ClinicWebsite/index.jsx
// Auto-generated public website for clinics
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config';
import { logoutUser } from '../../auth/authService';
import './ClinicWebsite.css';
import AppointmentBookingModal from './AppointmentBookingModal';

// Icons
import { 
  FiPhone, FiMail, FiMapPin, FiClock, FiCalendar, FiUsers,
  FiInstagram, FiTwitter, FiFacebook, FiLinkedin, FiYoutube,
  FiChevronRight, FiChevronDown, FiMenu, FiX, FiStar, FiImage,
  FiArrowUp, FiMessageCircle, FiCheck, FiAward, FiHeart, FiShield, FiUser
} from 'react-icons/fi';
import { FaRupeeSign, FaUserMd, FaStethoscope, FaWhatsapp, FaQuoteLeft } from 'react-icons/fa';

// Default placeholder content
const DEFAULTS = {
  about: "Welcome to our healthcare facility. We are dedicated to providing exceptional medical care with compassion and expertise. Our team of experienced professionals is committed to your health and well-being. We use the latest medical technologies and follow evidence-based practices to ensure you receive the best possible treatment.",
  mission: "Our mission is to provide accessible, high-quality healthcare services to our community. We believe in treating every patient with dignity, respect, and personalized attention.",
  whyChoose: [
    { icon: FiAward, text: "Experienced and caring medical professionals" },
    { icon: FiShield, text: "State-of-the-art medical equipment" },
    { icon: FiHeart, text: "Patient-centered approach to healthcare" },
    { icon: FiCalendar, text: "Convenient appointment scheduling" },
    { icon: FiCheck, text: "Comprehensive range of medical services" }
  ],
  testimonials: [
    { name: "Rahul Sharma", rating: 5, text: "Excellent care and professional staff. The doctors are very knowledgeable and take time to explain everything.", avatar: null },
    { name: "Priya Patel", rating: 5, text: "Very clean facility with modern equipment. I felt comfortable and well-cared for throughout my visit.", avatar: null },
    { name: "Amit Kumar", rating: 4, text: "Great experience overall. The staff was friendly and efficient. Highly recommend this clinic.", avatar: null }
  ],
  faqs: [
    { q: "What are your consultation hours?", a: "We are open Monday to Saturday. Please check our Contact page for detailed timings." },
    { q: "Do I need an appointment?", a: "While walk-ins are welcome, we recommend booking an appointment to minimize wait times." },
    { q: "What payment methods do you accept?", a: "We accept Cash, Credit/Debit Cards, UPI payments, and most major insurance providers." },
    { q: "Is parking available?", a: "Yes, we have free parking available for all our patients." },
    { q: "Do you offer emergency services?", a: "Please contact our emergency number for urgent medical needs." }
  ],
  facilities: [
    { icon: "🅿️", text: "Free Parking" },
    { icon: "♿", text: "Wheelchair Access" },
    { icon: "📶", text: "Free WiFi" },
    { icon: "🧒", text: "Child-Friendly" },
    { icon: "❄️", text: "Air Conditioned" },
    { icon: "🚰", text: "Drinking Water" }
  ],
  stats: [
    { value: 10, suffix: "+", label: "Years Experience" },
    { value: 5000, suffix: "+", label: "Happy Patients" },
    { value: 20, suffix: "+", label: "Expert Doctors" },
    { value: 50, suffix: "+", label: "Services" }
  ]
};

const PAGES = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  doctors: 'Our Doctors',
  gallery: 'Gallery',
  contact: 'Contact'
};

export default function ClinicWebsite() {
  const { subdomain } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [clinicData, setClinicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Check if patient is logged in
  // Check if patient is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authUserStr = localStorage.getItem('authUser');
    const userStr = localStorage.getItem('user');

    if (token) {
      try {
        // Try standardized authUser first (used by ClinicLogin)
        if (authUserStr) {
          const userData = JSON.parse(authUserStr);
          if (userData.role === 'patient') {
            setLoggedInUser(userData);
            return;
          }
        }
        
        // Fallback to legacy user key (used by standard Login)
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData.role === 'patient') {
            setLoggedInUser(userData);
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Handle logout
  // Handle logout
  const handleLogout = () => {
    logoutUser();
    // Also clear legacy user key just in case
    localStorage.removeItem('user');
    setLoggedInUser(null);
    toast.success('Logged out successfully');
  };

  // Go to patient dashboard
  const goToDashboard = () => {
    navigate(`/c/${subdomain}/patient-dashboard`);
  };

  // SEO - Update document title
  useEffect(() => {
    if (clinicData) {
      const pageTitle = PAGES[currentPage] || 'Home';
      document.title = `${clinicData.name} | ${pageTitle}`;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = clinicData.about || DEFAULTS.about;
      }
    }
  }, [clinicData, currentPage]);

  // Get current page from hash
  useEffect(() => {
    const hash = location.hash.replace('#', '') || 'home';
    if (PAGES[hash]) {
      setCurrentPage(hash);
    }
  }, [location.hash]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch clinic data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}`);
        if (res.data.success) {
          setClinicData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Clinic not found');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchData();
    }
  }, [subdomain]);

  // Navigate to page
  const goToPage = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.history.pushState({}, '', `#${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToLogin = () => {
    navigate(`/c/${subdomain}/login`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="cw-loading">
        <div className="cw-loading-spinner"></div>
        <p>Loading clinic...</p>
      </div>
    );
  }

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (cleanPath.startsWith('uploads/')) {
        return `${API_BASE}/${cleanPath}`;
    }
    return `${API_BASE}/uploads/${cleanPath}`;
  };

  if (error) {
    return (
      <div className="cw-error">
        <h1>😔 Clinic Not Found</h1>
        <p>{error}</p>
        <a href="/" className="cw-btn-primary">Go to Homepage</a>
      </div>
    );
  }

  const d = clinicData;
  const whatsappNumber = d.contact?.phone?.replace(/\D/g, '') || '';

  return (
    <div className="clinic-website">
      {/* Navigation */}
      <nav className="cw-navbar">
        <div className="cw-nav-container">
          <div className="cw-logo" onClick={() => goToPage('home')}>
            {d.logo ? (
              <img 
                src={getImageUrl(d.logo)}
                alt={d.name} 
              />
            ) : (
              <div className="cw-logo-placeholder">
                <FaStethoscope />
              </div>
            )}
            <span>{d.name || 'Clinic'}</span>
          </div>
          
          {/* Desktop Menu */}
          <ul className="cw-nav-menu">
            {Object.entries(PAGES).map(([key, label]) => (
              <li key={key}>
                <button 
                  className={currentPage === key ? 'active' : ''}
                  onClick={() => goToPage(key)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          
          {/* Book Appointment CTA & Login/User Menu */}
          <div className="cw-nav-actions" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {loggedInUser ? (
              <>
                <button onClick={goToDashboard} className="cw-btn-login">
                  <FiUser /> Dashboard
                </button>
                <button onClick={handleLogout} className="cw-btn-login" style={{background: '#fee2e2', color: '#dc2626'}}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={goToLogin} className="cw-btn-login">
                <FiUser /> Login
              </button>
            )}
            <button onClick={() => setShowBookingModal(true)} className="cw-btn-book">
              <FiCalendar /> Book Appointment
            </button>
          </div>
          
          {/* Mobile Toggle */}
          <button className="cw-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="cw-mobile-menu">
            {Object.entries(PAGES).map(([key, label]) => (
              <button 
                key={key}
                className={currentPage === key ? 'active' : ''}
                onClick={() => goToPage(key)}
              >
                {label}
              </button>
            ))}
            <div style={{height: 1, background: '#eee', margin: '8px 0'}}></div>
            {loggedInUser ? (
              <>
                <button onClick={() => { goToDashboard(); setMobileMenuOpen(false); }}>
                  <FiUser style={{marginRight: 8}}/> My Dashboard
                </button>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{color: '#dc2626'}}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={goToLogin}>
                <FiUser style={{marginRight: 8}}/> Staff/Admin Login
              </button>
            )}
            <button onClick={() => { setShowBookingModal(true); setMobileMenuOpen(false); }} style={{color: 'var(--cw-primary)', fontWeight: 'bold'}}>
              Book Appointment
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="cw-main">
        {currentPage === 'home' && <HomePage data={d} goToPage={goToPage} onBookAppointment={() => setShowBookingModal(true)} />}
        {currentPage === 'about' && <AboutPage data={d} />}
        {currentPage === 'services' && <ServicesPage data={d} />}
        {currentPage === 'doctors' && <DoctorsPage data={d} />}
        {currentPage === 'gallery' && <GalleryPage data={d} />}
        {currentPage === 'contact' && <ContactPage data={d} />}
      </main>

      {/* Footer */}
      <footer className="cw-footer">
        <div className="cw-footer-container">
          <div className="cw-footer-section">
            <h4>{d.name}</h4>
            <p>{(d.about || DEFAULTS.about).slice(0, 150)}...</p>
          </div>
          
          <div className="cw-footer-section">
            <h4>Quick Links</h4>
            <ul>
              {Object.entries(PAGES).map(([key, label]) => (
                <li key={key}>
                  <button onClick={() => goToPage(key)}>{label}</button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="cw-footer-section">
            <h4>Contact</h4>
            <p><FiPhone /> {d.contact?.phone || 'Contact us'}</p>
            <p><FiMail /> {d.contact?.email || 'Email us'}</p>
            <p><FiMapPin /> {d.contact?.address?.city || 'Visit us'}</p>
          </div>
          
          <div className="cw-footer-section">
            <h4>Follow Us</h4>
            <div className="cw-social-links">
              {d.socialMedia?.facebook && <a href={d.socialMedia.facebook} target="_blank" rel="noopener noreferrer"><FiFacebook /></a>}
              {d.socialMedia?.instagram && <a href={d.socialMedia.instagram} target="_blank" rel="noopener noreferrer"><FiInstagram /></a>}
              {d.socialMedia?.twitter && <a href={d.socialMedia.twitter} target="_blank" rel="noopener noreferrer"><FiTwitter /></a>}
              {d.socialMedia?.linkedin && <a href={d.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"><FiLinkedin /></a>}
              {d.socialMedia?.youtube && <a href={d.socialMedia.youtube} target="_blank" rel="noopener noreferrer"><FiYoutube /></a>}
            </div>
          </div>
        </div>
        
        <div className="cw-footer-bottom">
          <p>© {new Date().getFullYear()} {d.name}. All rights reserved.</p>
          <p>Powered by <a href="/">OneCare</a></p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a 
          href={`https://wa.me/${whatsappNumber}?text=Hi, I would like to book an appointment.`}
          target="_blank"
          rel="noopener noreferrer"
          className="cw-whatsapp-btn"
          title="Chat on WhatsApp"
        >
          <FaWhatsapp />
        </a>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="cw-back-to-top" onClick={scrollToTop}>
          <FiArrowUp />
        </button>
      )}

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        subdomain={subdomain}
        clinicData={clinicData}
        onLogin={(userData) => setLoggedInUser(userData)}
      />
    </div>
  );
}

// ============ PAGE COMPONENTS ============

function HomePage({ data, goToPage, onBookAppointment }) {
  const d = data;
  
  return (
    <>
      {/* Hero */}
      <section className="cw-hero">
        <div className="cw-hero-content">
          <h1>Welcome to <span>{d.name}</span></h1>
          <p>{d.about || DEFAULTS.about}</p>
          <div className="cw-hero-buttons">
            <button className="cw-btn-primary" onClick={onBookAppointment}>
              <FiCalendar /> Book Appointment
            </button>
            <button className="cw-btn-secondary" onClick={() => goToPage('services')}>
              View Services <FiChevronRight />
            </button>
          </div>
        </div>
        <div className="cw-hero-visual">
          <div className="cw-hero-card">
            <FaStethoscope className="icon" />
            <h3>Expert Care</h3>
            <p>Quality healthcare services</p>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="cw-quick-info">
        <div className="cw-info-card">
          <FiClock />
          <div>
            <h4>Opening Hours</h4>
            <p>{getOpeningHours(d.operatingHours)}</p>
          </div>
        </div>
        <div className="cw-info-card">
          <FiPhone />
          <div>
            <h4>Call Us</h4>
            <p>{d.contact?.phone || 'Contact us'}</p>
          </div>
        </div>
        <div className="cw-info-card">
          <FiMapPin />
          <div>
            <h4>Location</h4>
            <p>{d.contact?.address?.city || 'Visit us'}</p>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <StatsSection data={d} />

      {/* Services Preview */}
      <section className="cw-section">
        <h2>Our Services</h2>
        <p className="cw-section-subtitle">We offer a wide range of healthcare services</p>
        <div className="cw-services-grid">
          {(d.services?.length > 0 ? d.services.slice(0, 6) : defaultServices()).map((service, i) => (
            <div key={i} className="cw-service-card">
              <div className="cw-service-icon"><FaStethoscope /></div>
              <h3>{service.name}</h3>
              <p>{service.description || 'Professional healthcare service tailored to your needs.'}</p>
              {service.price && (
                <span className="cw-price"><FaRupeeSign />{service.price}</span>
              )}
            </div>
          ))}
        </div>
        <button className="cw-btn-secondary cw-center-btn" onClick={() => goToPage('services')}>
          View All Services <FiChevronRight />
        </button>
      </section>

      {/* Doctors Preview */}
      <section className="cw-section cw-section-alt">
        <h2>Meet Our Doctors</h2>
        <p className="cw-section-subtitle">Experienced healthcare professionals</p>
        <div className="cw-doctors-grid">
          {(d.staff?.length > 0 ? d.staff.slice(0, 4) : defaultDoctors()).map((doc, i) => (
            <div key={i} className="cw-doctor-card">
              <div className="cw-doctor-photo">
                {doc.photo ? (
                  <img src={`${API_BASE}${doc.photo}`} alt={doc.name} />
                ) : (
                  <FaUserMd />
                )}
              </div>
              <h3>{doc.name}</h3>
              <span className="cw-specialty">{doc.specialty || 'Healthcare Professional'}</span>
              {doc.experience && <p className="cw-experience">{doc.experience} years experience</p>}
            </div>
          ))}
        </div>
        <button className="cw-btn-secondary cw-center-btn" onClick={() => goToPage('doctors')}>
          View All Doctors <FiChevronRight />
        </button>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Why Choose Us */}
      <section className="cw-section cw-why-choose">
        <h2>Why Choose Us?</h2>
        <div className="cw-features-grid">
          {DEFAULTS.whyChoose.map((item, i) => (
            <div key={i} className="cw-feature-item">
              <div className="cw-check-icon"><item.icon /></div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />
    </>
  );
}

function StatsSection({ data }) {
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
        }
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, [animated]);

  return (
    <section className="cw-stats-section" ref={sectionRef}>
      <div className="cw-stats-grid">
        {DEFAULTS.stats.map((stat, i) => (
          <div key={i} className="cw-stat-card">
            <span className="cw-stat-value">
              {animated ? <CountUp end={stat.value} /> : 0}{stat.suffix}
            </span>
            <span className="cw-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountUp({ end, duration = 2000 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <>{count}</>;
}

function TestimonialsSection() {
  return (
    <section className="cw-section cw-testimonials">
      <h2>What Our Patients Say</h2>
      <p className="cw-section-subtitle">Real experiences from our valued patients</p>
      <div className="cw-testimonials-grid">
        {DEFAULTS.testimonials.map((t, i) => (
          <div key={i} className="cw-testimonial-card">
            <FaQuoteLeft className="cw-quote-icon" />
            <p className="cw-testimonial-text">{t.text}</p>
            <div className="cw-testimonial-rating">
              {Array(t.rating).fill().map((_, j) => <FiStar key={j} className="filled" />)}
              {Array(5 - t.rating).fill().map((_, j) => <FiStar key={j} />)}
            </div>
            <div className="cw-testimonial-author">
              <div className="cw-avatar">{t.name[0]}</div>
              <span>{t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <section className="cw-section cw-faq-section">
      <h2>Frequently Asked Questions</h2>
      <p className="cw-section-subtitle">Find answers to common questions</p>
      <div className="cw-faq-list">
        {DEFAULTS.faqs.map((faq, i) => (
          <div 
            key={i} 
            className={`cw-faq-item ${openIndex === i ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className="cw-faq-question">
              <span>{faq.q}</span>
              <FiChevronDown className="cw-faq-arrow" />
            </div>
            {openIndex === i && (
              <div className="cw-faq-answer">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutPage({ data }) {
  const d = data;
  
  return (
    <section className="cw-page">
      <div className="cw-page-header">
        <h1>About Us</h1>
        <p>Learn more about our clinic and our commitment to your health</p>
      </div>
      
      <div className="cw-about-content">
        <div className="cw-about-text">
          <h2>Our Story</h2>
          <p>{d.about || DEFAULTS.about}</p>
          
          <h2>Our Mission</h2>
          <p>{DEFAULTS.mission}</p>
          
          {d.specializations?.length > 0 && (
            <>
              <h2>Our Specializations</h2>
              <div className="cw-tags">
                {d.specializations.map((spec, i) => (
                  <span key={i} className="cw-tag">{spec}</span>
                ))}
              </div>
            </>
          )}
          
          {d.languagesSpoken?.length > 0 && (
            <>
              <h2>Languages Spoken</h2>
              <div className="cw-tags">
                {d.languagesSpoken.map((lang, i) => (
                  <span key={i} className="cw-tag">{lang}</span>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="cw-about-sidebar">
          <div className="cw-sidebar-card">
            <h3>Quick Facts</h3>
            <ul>
              <li><FiUsers /> {d.staff?.length || '10+'} Healthcare Professionals</li>
              <li><FiMessageCircle /> {d.services?.length || '20+'} Services Offered</li>
              {d.contact?.address?.city && <li><FiMapPin /> Located in {d.contact.address.city}</li>}
            </ul>
          </div>
          
          <div className="cw-sidebar-card">
            <h3>Facilities</h3>
            <div className="cw-facilities-grid">
              {DEFAULTS.facilities.map((f, i) => (
                <div key={i} className="cw-facility-item">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {(d.acceptedPayments?.length > 0 || true) && (
            <div className="cw-sidebar-card">
              <h3>Accepted Payments</h3>
              <div className="cw-tags">
                {(d.acceptedPayments?.length > 0 ? d.acceptedPayments : ['Cash', 'Card', 'UPI', 'Insurance']).map((pay, i) => (
                  <span key={i} className="cw-tag">{pay}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ServicesPage({ data }) {
  const d = data;
  const services = d.services?.length > 0 ? d.services : defaultServices();
  
  return (
    <section className="cw-page">
      <div className="cw-page-header">
        <h1>Our Services</h1>
        <p>Comprehensive healthcare services tailored to your needs</p>
      </div>
      
      <div className="cw-services-list">
        {services.map((service, i) => (
          <div key={i} className="cw-service-card-large">
            <div className="cw-service-icon-large"><FaStethoscope /></div>
            <div className="cw-service-info">
              <h3>{service.name}</h3>
              <p>{service.description || 'Professional healthcare service tailored to your needs.'}</p>
              <div className="cw-service-meta">
                {service.price && (
                  <span className="cw-price"><FaRupeeSign />{service.price}</span>
                )}
                {service.duration && (
                  <span className="cw-duration"><FiClock /> {service.duration} mins</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DoctorsPage({ data }) {
  const d = data;
  const staff = d.staff?.length > 0 ? d.staff : defaultDoctors();
  
  return (
    <section className="cw-page">
      <div className="cw-page-header">
        <h1>Our Doctors</h1>
        <p>Meet our team of experienced healthcare professionals</p>
      </div>
      
      <div className="cw-doctors-list">
        {staff.map((doc, i) => (
          <div key={i} className="cw-doctor-card-large">
            <div className="cw-doctor-photo-large">
              {doc.photo ? (
                <img src={`${API_BASE}${doc.photo}`} alt={doc.name} />
              ) : (
                <FaUserMd />
              )}
            </div>
            <div className="cw-doctor-info">
              <h3>{doc.name}</h3>
              <span className="cw-specialty">{doc.specialty || 'Healthcare Professional'}</span>
              {doc.qualifications && <p className="cw-quals">{doc.qualifications}</p>}
              {doc.experience && <p className="cw-experience">{doc.experience} years of experience</p>}
              {doc.bio && <p className="cw-bio">{doc.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GalleryPage({ data }) {
  const d = data;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  // Placeholder images if no gallery
  const images = d.gallery?.length > 0 ? d.gallery : [];
  const hasImages = images.length > 0;
  
  const openLightbox = (index) => {
    setCurrentImage(index);
    setLightboxOpen(true);
  };
  
  return (
    <section className="cw-page">
      <div className="cw-page-header">
        <h1>Gallery</h1>
        <p>Take a virtual tour of our facility</p>
      </div>
      
      {hasImages ? (
        <>
          <div className="cw-gallery-grid">
            {images.map((img, i) => (
              <div key={i} className="cw-gallery-item" onClick={() => openLightbox(i)}>
                <img src={`${API_BASE}${img}`} alt={`Gallery ${i + 1}`} />
                <div className="cw-gallery-overlay">
                  <FiImage />
                </div>
              </div>
            ))}
          </div>
          
          {/* Lightbox */}
          {lightboxOpen && (
            <div className="cw-lightbox" onClick={() => setLightboxOpen(false)}>
              <button className="cw-lightbox-close"><FiX /></button>
              <img src={`${API_BASE}${images[currentImage]}`} alt="Gallery" />
            </div>
          )}
        </>
      ) : (
        <div className="cw-gallery-placeholder">
          <FiImage />
          <h3>Gallery Coming Soon</h3>
          <p>We're updating our gallery with photos of our facility. Check back soon!</p>
        </div>
      )}
    </section>
  );
}

function ContactPage({ data }) {
  const d = data;
  
  return (
    <section className="cw-page">
      <div className="cw-page-header">
        <h1>Contact Us</h1>
        <p>Get in touch with us or schedule an appointment</p>
      </div>
      
      <div className="cw-contact-content">
        <div className="cw-contact-info">
          <div className="cw-contact-card">
            <FiPhone />
            <div>
              <h4>Phone</h4>
              <p>{d.contact?.phone || 'Contact for number'}</p>
              {d.contact?.emergencyContact && (
                <p className="cw-emergency">Emergency: {d.contact.emergencyContact}</p>
              )}
            </div>
          </div>
          
          <div className="cw-contact-card">
            <FiMail />
            <div>
              <h4>Email</h4>
              <p>{d.contact?.email || 'Contact for email'}</p>
            </div>
          </div>
          
          <div className="cw-contact-card">
            <FiMapPin />
            <div>
              <h4>Address</h4>
              <p>
                {d.contact?.address?.street && `${d.contact.address.street}, `}
                {d.contact?.address?.city && `${d.contact.address.city}, `}
                {d.contact?.address?.state && `${d.contact.address.state} `}
                {d.contact?.address?.zip && d.contact.address.zip}
              </p>
            </div>
          </div>
        </div>
        
        {/* Operating Hours */}
        <div className="cw-hours-section">
          <h3><FiClock /> Operating Hours</h3>
          <div className="cw-hours-grid">
            {(d.operatingHours?.length > 0 ? d.operatingHours : defaultHours()).map((day, i) => (
              <div key={i} className={`cw-hours-row ${!day.isOpen ? 'closed' : ''}`}>
                <span className="cw-day">{day.day}</span>
                <span className="cw-time">
                  {day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ HELPERS ============

function getOpeningHours(hours) {
  if (!hours?.length) return 'Mon-Sat: 9AM-6PM';
  const openDays = hours.filter(h => h.isOpen);
  if (!openDays.length) return 'Contact for hours';
  const first = openDays[0];
  return `${first.day}: ${first.openTime} - ${first.closeTime}`;
}

function defaultHours() {
  return [
    { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00' },
    { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
  ];
}

function defaultServices() {
  return [
    { name: 'General Consultation', description: 'Comprehensive health check-up and consultation with our experienced doctors.', price: 500 },
    { name: 'Specialist Care', description: 'Specialized medical care for specific health conditions and chronic diseases.', price: 800 },
    { name: 'Diagnostic Services', description: 'Advanced diagnostic tests and imaging services with accurate results.', price: null },
    { name: 'Preventive Care', description: 'Regular health screenings and preventive care to maintain your well-being.', price: 1000 },
    { name: 'Minor Procedures', description: 'Safe and efficient minor surgical and medical procedures.', price: null },
    { name: 'Follow-up Consultation', description: 'Review your progress and adjust treatment plans as needed.', price: 300 }
  ];
}

function defaultDoctors() {
  return [
    { name: 'Dr. Anil Kumar', specialty: 'General Physician', experience: 15, bio: 'Experienced general physician with expertise in preventive care and chronic disease management.' },
    { name: 'Dr. Priya Sharma', specialty: 'Pediatrician', experience: 10, bio: 'Dedicated pediatrician providing compassionate care for children of all ages.' },
    { name: 'Dr. Rajesh Patel', specialty: 'Cardiologist', experience: 20, bio: 'Expert cardiologist specializing in heart health and cardiovascular treatments.' }
  ];
}
