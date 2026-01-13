// src/components/ClinicOnboarding/steps/PreviewStep.jsx
// Step 5: Preview and publish
import React from 'react';
import { 
  FiArrowLeft, FiGlobe, FiCheck, FiMapPin, FiPhone, FiMail, 
  FiClock, FiExternalLink, FiUser, FiList 
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import API_BASE from '../../../config';

// Get the frontend URL from environment for clinic websites
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// Helper to generate the clinic website URL
const getClinicWebsiteUrl = (subdomain) => {
  return `${FRONTEND_URL}/c/${subdomain}`;
};

// Helper to get display URL (for showing in UI)
const getDisplayUrl = (subdomain) => {
  try {
    const url = new URL(FRONTEND_URL);
    return `${url.host}/c/${subdomain}`;
  } catch {
    return `${window.location.host}/c/${subdomain}`;
  }
};

export default function PreviewStep({ data, onBack, onPublish, publishing }) {
  const isPublished = data?.status === 'published';
  const websiteUrl = getClinicWebsiteUrl(data?.subdomain);
  const displayUrl = getDisplayUrl(data?.subdomain);

  // If already published, show success
  if (isPublished) {
    return (
      <div className="preview-step">
        <div className="publish-success">
          <div className="success-icon">
            <FiCheck />
          </div>
          <h2>🎉 Congratulations!</h2>
          <p>Your clinic is now set up and ready to go!</p>
          
          <div className="website-url-box">
            <FiGlobe className="globe-icon" />
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
              {displayUrl}
            </a>
          </div>
          
          <div className="credentials-info">
            <p><strong>📧 Login credentials have been sent to your email!</strong></p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Use your registered email and the password from the email to login.
            </p>
          </div>
          
          <div className="success-actions">
            <a href="/login" className="btn btn-primary">
              <FiExternalLink /> Login to Dashboard
            </a>
            <a 
              href={websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              View Website
            </a>
          </div>
          
          <p style={{ marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
            You can manage your clinic, appointments, and website from your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-step">
      <div className="step-header">
        <h2>👁️ Preview Your Website</h2>
        <p>Review everything before publishing</p>
      </div>

      {/* Browser Preview Container */}
      <div className="preview-container">
        <div className="preview-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <div className="preview-url">
            🔒 {displayUrl}
          </div>
        </div>

        <div className="preview-frame">
          {/* Mock Website Preview */}
          <div className="website-preview">
            {/* Header */}
            <div className="preview-site-header">
              <div className="preview-logo">
                {data?.clinicDetails?.logo ? (
                  <img src={`${API_BASE}${data.clinicDetails.logo}`} alt="Logo" />
                ) : (
                  <div className="logo-placeholder">{data?.clinicDetails?.name?.[0] || 'C'}</div>
                )}
                <span>{data?.clinicDetails?.name || 'Your Clinic'}</span>
              </div>
            </div>

            {/* Hero */}
            <div className="preview-hero">
              <h1>{data?.clinicDetails?.name || 'Your Clinic Name'}</h1>
              <p>{data?.clinicDetails?.about?.slice(0, 150) || 'Welcome to our clinic. We provide quality healthcare services.'}{data?.clinicDetails?.about?.length > 150 ? '...' : ''}</p>
              <div className="preview-location">
                <FiMapPin /> {data?.clinicDetails?.address?.city || 'Your City'}, {data?.clinicDetails?.address?.state || 'State'}
              </div>
            </div>

            {/* Services Preview */}
            <div className="preview-section">
              <h3><FiList /> Our Services</h3>
              <div className="preview-services">
                {data?.services?.slice(0, 4).map((service, i) => (
                  <div key={i} className="preview-service-card">
                    <h4>{service.name}</h4>
                    {service.price && (
                      <span className="price"><FaRupeeSign />{service.price}</span>
                    )}
                  </div>
                ))}
                {(!data?.services || data.services.length === 0) && (
                  <p style={{ color: '#94a3b8' }}>No services added yet</p>
                )}
              </div>
            </div>

            {/* Team Preview */}
            <div className="preview-section">
              <h3><FiUser /> Our Team</h3>
              <div className="preview-team">
                {data?.staff?.slice(0, 4).map((member, i) => (
                  <div key={i} className="preview-staff-card">
                    <div className="staff-avatar">
                      {member.photo ? (
                        <img src={`${API_BASE}${member.photo}`} alt={member.name} />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <h4>{member.name}</h4>
                    <span>{member.specialty}</span>
                  </div>
                ))}
                {(!data?.staff || data.staff.length === 0) && (
                  <p style={{ color: '#94a3b8' }}>No team members added yet</p>
                )}
              </div>
            </div>

            {/* Contact Preview */}
            <div className="preview-section preview-contact">
              <h3>Contact Us</h3>
              <div className="contact-items">
                <span><FiPhone /> {data?.clinicDetails?.phone || 'Phone number'}</span>
                <span><FiMail /> {data?.clinicDetails?.email || 'Email'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Website URL</span>
            <span className="value">{displayUrl}</span>
          </div>
          <div className="summary-item">
            <span className="label">Clinic Name</span>
            <span className="value">{data?.clinicDetails?.name}</span>
          </div>
          <div className="summary-item">
            <span className="label">Services</span>
            <span className="value">{data?.services?.length || 0} services</span>
          </div>
          <div className="summary-item">
            <span className="label">Team Members</span>
            <span className="value">{data?.staff?.length || 0} members</span>
          </div>
        </div>
      </div>

      <div className="step-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <FiArrowLeft /> Go Back to Edit
        </button>
        <button 
          className="btn btn-success"
          onClick={onPublish}
          disabled={publishing}
        >
          {publishing ? (
            <>
              <span className="btn-spinner"></span> Publishing...
            </>
          ) : (
            <>
              <FiGlobe /> Publish Website
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .website-preview {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .preview-site-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .preview-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 18px;
          color: #1e293b;
        }
        
        .preview-logo img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        .logo-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .preview-hero {
          padding: 40px 24px;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: #fff;
          text-align: center;
        }
        
        .preview-hero h1 {
          font-size: 24px;
          margin: 0 0 12px 0;
        }
        
        .preview-hero p {
          font-size: 14px;
          margin: 0 0 16px 0;
          opacity: 0.9;
        }
        
        .preview-location {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          opacity: 0.8;
        }
        
        .preview-section {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .preview-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: #1e293b;
          margin: 0 0 16px 0;
        }
        
        .preview-services {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .preview-service-card {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .preview-service-card h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }
        
        .preview-service-card .price {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 13px;
          color: #16a34a;
          font-weight: 600;
        }
        
        .preview-team {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .preview-staff-card {
          text-align: center;
        }
        
        .staff-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          overflow: hidden;
          color: #94a3b8;
          font-size: 24px;
        }
        
        .staff-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .preview-staff-card h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1e293b;
        }
        
        .preview-staff-card span {
          font-size: 11px;
          color: #64748b;
        }
        
        .preview-contact {
          background: #f8fafc;
        }
        
        .contact-items {
          display: flex;
          gap: 24px;
        }
        
        .contact-items span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #475569;
        }
        
        .summary-section {
          margin-top: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .summary-section h3 {
          font-size: 16px;
          color: #1e293b;
          margin: 0 0 16px 0;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .summary-item .label {
          font-size: 12px;
          color: #64748b;
        }
        
        .summary-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .success-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
        }
        
        .credentials-info {
          background: #f0fdf4;
          border: 1px solid #22c55e;
          border-radius: 10px;
          padding: 16px 24px;
          margin-top: 24px;
          text-align: center;
        }
        
        .credentials-info p {
          margin: 0;
        }
        
        @media (max-width: 640px) {
          .preview-services,
          .preview-team,
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
