// src/components/ClinicOnboarding/steps/SubdomainStep.jsx
// Step 1: Subdomain selection with availability check
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiGlobe, FiCheck, FiX, FiArrowRight, FiLoader } from 'react-icons/fi';
import API_BASE from '../../../config';

// Get frontend URL from environment - this determines the clinic website base URL
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

export default function SubdomainStep({ data, updateData, onNext }) {
  const [subdomain, setSubdomain] = useState(data?.subdomain || '');
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null); // { available: bool, message: string }
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Debounced availability check
  const checkAvailability = useCallback(async (value) => {
    if (!value || value.length < 3) {
      setAvailability(null);
      return;
    }
    
    setChecking(true);
    try {
      const res = await axios.get(`${API_BASE}/api/onboarding/check-subdomain?subdomain=${value}`);
      setAvailability({
        available: res.data.available,
        message: res.data.message
      });
    } catch (error) {
      setAvailability({
        available: false,
        message: 'Error checking availability'
      });
    } finally {
      setChecking(false);
    }
  }, []);

  // Handle input change with debounce
  const handleChange = (e) => {
    let value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Prevent starting with hyphen
    if (value.startsWith('-')) value = value.slice(1);
    
    // Limit length
    value = value.slice(0, 20);
    
    setSubdomain(value);
    setAvailability(null);
    
    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout for debounced check
    const timeout = setTimeout(() => {
      checkAvailability(value);
    }, 500);
    
    setTypingTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  // Handle continue
  const handleContinue = () => {
    if (availability?.available) {
      onNext({ subdomain });
    }
  };

  const canContinue = subdomain.length >= 3 && availability?.available;

  return (
    <div className="subdomain-step">
      <div className="step-header">
        <h2>🌐 Choose Your Website Address</h2>
        <p>Select a unique subdomain for your clinic website</p>
      </div>

      <div className="subdomain-form">
        <label className="form-label">
          Your Clinic Website URL
        </label>
        
          <div className="subdomain-input-wrapper">
            <span className="subdomain-prefix">{new URL(FRONTEND_URL).host}/c/</span>
            <input
              type="text"
              value={subdomain}
              onChange={handleChange}
              placeholder="yourclininame"
              autoFocus
            />
          </div>
        
        {/* Availability Status */}
        <div className="availability-status">
          {checking && (
            <div className="availability-badge checking">
              <FiLoader className="spin" /> Checking availability...
            </div>
          )}
          
          {!checking && availability && (
            <div className={`availability-badge ${availability.available ? 'available' : 'unavailable'}`}>
              {availability.available ? <FiCheck /> : <FiX />}
              {availability.message}
            </div>
          )}
          
          {!checking && !availability && subdomain.length > 0 && subdomain.length < 3 && (
            <div className="availability-badge unavailable">
              <FiX /> Subdomain must be at least 3 characters
            </div>
          )}
        </div>

        {/* Preview */}
        {subdomain && (
          <div className="url-preview">
            <FiGlobe />
            <span>Your website will be available at:</span>
            <strong>{FRONTEND_URL}/c/{subdomain}</strong>
          </div>
        )}

        {/* Tips */}
        <div className="subdomain-tips">
          <h4>Tips for a great subdomain:</h4>
          <ul>
            <li>Use your clinic name or abbreviation</li>
            <li>Keep it short and memorable</li>
            <li>Only lowercase letters, numbers, and hyphens allowed</li>
            <li>3-20 characters</li>
          </ul>
        </div>
      </div>

      <div className="step-buttons">
        <div></div> {/* Empty for alignment */}
        <button 
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue <FiArrowRight />
        </button>
      </div>

      <style jsx>{`
        .subdomain-form {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }
        
        .availability-status {
          margin-top: 12px;
        }
        
        .availability-badge.checking {
          background: #fef3c7;
          color: #d97706;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        .url-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 16px;
          background: #f0fdf4;
          border-radius: 10px;
          font-size: 14px;
          color: #16a34a;
        }
        
        .url-preview strong {
          color: #15803d;
        }
        
        .subdomain-tips {
          margin-top: 32px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .subdomain-tips h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }
        
        .subdomain-tips ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .subdomain-tips li {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}
