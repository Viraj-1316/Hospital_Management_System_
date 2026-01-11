import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCheck, FiX, FiArrowRight, FiMenu, FiChevronDown, FiChevronUp,
  FiMail, FiPhone, FiHelpCircle, FiStar
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import './LegalPages.css';
import LandingFooter from './LandingFooter';

const PricingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Pricing - OneCare HMS';
  }, []);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small clinics',
      monthlyPrice: 1499,
      yearlyPrice: 1199,
      features: [
        { text: 'Up to 2 Doctors', included: true },
        { text: 'Up to 500 Patients', included: true },
        { text: 'Appointment Management', included: true },
        { text: 'Basic Billing', included: true },
        { text: 'Email Support', included: true },
        { text: 'WhatsApp Notifications', included: false },
        { text: 'Custom Reports', included: false },
        { text: 'Multi-branch Support', included: false }
      ],
      popular: false
    },
    {
      name: 'Professional',
      description: 'For growing practices',
      monthlyPrice: 3999,
      yearlyPrice: 3199,
      features: [
        { text: 'Up to 10 Doctors', included: true },
        { text: 'Unlimited Patients', included: true },
        { text: 'Advanced Scheduling', included: true },
        { text: 'GST Billing & Invoicing', included: true },
        { text: 'Priority Support', included: true },
        { text: 'WhatsApp Notifications', included: true },
        { text: 'Custom Reports', included: true },
        { text: 'Multi-branch Support', included: false }
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large hospitals',
      monthlyPrice: 7999,
      yearlyPrice: 6399,
      features: [
        { text: 'Unlimited Doctors', included: true },
        { text: 'Unlimited Patients', included: true },
        { text: 'Full EHR System', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: '24/7 Dedicated Support', included: true },
        { text: 'WhatsApp Business API', included: true },
        { text: 'Custom Reports & Dashboards', included: true },
        { text: 'Multi-branch Support', included: true }
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 14-day free trial on all plans. No credit card required to start. You can explore all features and decide which plan works best for your clinic.'
    },
    {
      question: 'Can I change my plan later?',
      answer: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, the change will take effect at the end of your billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and Razorpay. For Enterprise plans, we also offer bank transfer and invoice-based billing.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, security is our top priority. We use bank-level encryption (256-bit SSL), HIPAA-compliant infrastructure, and regular security audits. Your data is backed up daily and stored securely in India.'
    },
    {
      question: 'Do you provide training and support?',
      answer: 'All plans include email support and access to our knowledge base. Professional and Enterprise plans include priority support with faster response times. Enterprise plans also get dedicated onboarding and training sessions.'
    },
    {
      question: 'Can I get a custom solution for my hospital?',
      answer: 'Yes! For hospitals with specific requirements, we offer customized solutions. Contact our sales team to discuss your needs and get a tailored quote.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="legal-page pricing-page">
      {/* Navigation */}
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
            <Link to="/pricing" className="nav-link active">Pricing</Link>
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
      <section className="legal-hero pricing-hero">
        <div className="container">
          <span className="section-badge">Pricing</span>
          <h1>Simple, Transparent <span className="gradient-text">Pricing</span></h1>
          <p>Choose the perfect plan for your clinic. No hidden fees, no surprises.</p>
          
          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
            <button 
              className="toggle-switch"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              <span className={`toggle-slider ${billingCycle === 'yearly' ? 'yearly' : ''}`}></span>
            </button>
            <span className={billingCycle === 'yearly' ? 'active' : ''}>
              Yearly <span className="save-badge">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-content">
        <div className="container">
          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <div className="pricing-header">
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className="price">
                    <span className="currency">₹</span>
                    <span className="amount">
                      {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="period">/month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="billed-text">Billed annually</p>
                  )}
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className={feature.included ? '' : 'disabled'}>
                      {feature.included ? <FiCheck className="check" /> : <FiX className="cross" />}
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/signup" 
                  className={`btn-lg ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                >
                  Get Started <FiArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><FiHelpCircle /> FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Got questions? We've got answers.</p>
          </div>
          
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  {openFaq === index ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-cta">
            <p>Still have questions?</p>
            <Link to="/contact" className="btn-primary">
              Contact Us <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default PricingPage;
