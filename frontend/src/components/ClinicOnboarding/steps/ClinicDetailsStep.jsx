// src/components/ClinicOnboarding/steps/ClinicDetailsStep.jsx
// Step 2: Clinic details including logo, address, hours, social media, etc.
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FiArrowLeft, FiArrowRight, FiUpload, FiImage, FiMapPin, FiPhone, 
  FiMail, FiGlobe, FiClock, FiPlus, FiX, FiInstagram, FiTwitter, 
  FiLinkedin, FiYoutube, FiFacebook, FiAlertCircle, FiDollarSign,
  FiMessageCircle, FiSettings
} from 'react-icons/fi';
import API_BASE from '../../../config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PAYMENT_OPTIONS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Insurance'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati'];

export default function ClinicDetailsStep({ data, updateData, onNext, onBack }) {
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  const [clinicDetails, setClinicDetails] = useState({
    logo: data?.clinicDetails?.logo || '',
    name: data?.clinicDetails?.name || '',
    about: data?.clinicDetails?.about || '',
    address: {
      street: data?.clinicDetails?.address?.street || '',
      city: data?.clinicDetails?.address?.city || '',
      state: data?.clinicDetails?.address?.state || '',
      zip: data?.clinicDetails?.address?.zip || '',
      country: data?.clinicDetails?.address?.country || 'India'
    },
    phone: data?.clinicDetails?.phone || '',
    email: data?.clinicDetails?.email || '',
    website: data?.clinicDetails?.website || '',
    emergencyContact: data?.clinicDetails?.emergencyContact || '',
    socialMedia: {
      facebook: data?.clinicDetails?.socialMedia?.facebook || '',
      instagram: data?.clinicDetails?.socialMedia?.instagram || '',
      twitter: data?.clinicDetails?.socialMedia?.twitter || '',
      linkedin: data?.clinicDetails?.socialMedia?.linkedin || '',
      youtube: data?.clinicDetails?.socialMedia?.youtube || ''
    },
    operatingHours: data?.clinicDetails?.operatingHours || DAYS.map(day => ({
      day,
      isOpen: day !== 'Sunday',
      openTime: '09:00',
      closeTime: day === 'Saturday' ? '14:00' : '18:00'
    })),
    specializations: data?.clinicDetails?.specializations || [],
    languagesSpoken: data?.clinicDetails?.languagesSpoken || ['English'],
    acceptedPayments: data?.clinicDetails?.acceptedPayments || ['Cash', 'UPI'],
    gallery: data?.clinicDetails?.gallery || [],
    appointmentSettings: {
      defaultSlotDuration: data?.clinicDetails?.appointmentSettings?.defaultSlotDuration || 30,
      bufferTime: data?.clinicDetails?.appointmentSettings?.bufferTime || 5,
      advanceBookingDays: data?.clinicDetails?.appointmentSettings?.advanceBookingDays || 30,
      allowOnlineBooking: data?.clinicDetails?.appointmentSettings?.allowOnlineBooking ?? true
    }
  });

  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (field, value) => {
    setClinicDetails(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested object change
  const handleNestedChange = (parent, field, value) => {
    setClinicDetails(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/onboarding/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        handleChange('logo', res.data.imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle operating hours change
  const handleHoursChange = (index, field, value) => {
    const updated = [...clinicDetails.operatingHours];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('operatingHours', updated);
  };

  // Add tag (specialization or language)
  const addTag = (field, value) => {
    if (value && !clinicDetails[field].includes(value)) {
      handleChange(field, [...clinicDetails[field], value]);
    }
    setNewTag('');
  };

  // Remove tag
  const removeTag = (field, value) => {
    handleChange(field, clinicDetails[field].filter(t => t !== value));
  };

  // Toggle payment/language option
  const toggleOption = (field, value) => {
    if (clinicDetails[field].includes(value)) {
      handleChange(field, clinicDetails[field].filter(t => t !== value));
    } else {
      handleChange(field, [...clinicDetails[field], value]);
    }
  };

  // Validate and continue
  const handleContinue = () => {
    const newErrors = {};
    if (!clinicDetails.name.trim()) newErrors.name = 'Clinic name is required';
    if (!clinicDetails.address.city.trim()) newErrors.city = 'City is required';
    if (!clinicDetails.phone.trim()) newErrors.phone = 'Phone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext({ clinicDetails });
  };

  return (
    <div className="clinic-details-step">
      <div className="step-header">
        <h2>📋 Tell Us About Your Clinic</h2>
        <p>This information will be displayed on your clinic website</p>
      </div>

      {/* Logo Upload */}
      <div className="section">
        <div className="section-title"><FiImage className="icon" /> Clinic Logo</div>
        <div className="image-upload">
          <div className="image-preview" onClick={() => fileInputRef.current?.click()}>
            {clinicDetails.logo ? (
              <img src={`${API_BASE}${clinicDetails.logo}`} alt="Logo" />
            ) : (
              <div className="placeholder"><FiUpload /></div>
            )}
          </div>
          <div>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Recommended: 200x200px, PNG or JPG
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Basic Info */}
      <div className="section">
        <div className="section-title"><FiMapPin className="icon" /> Basic Information</div>
        
        <div className="form-group">
          <label>Clinic Name <span className="required">*</span></label>
          <input
            type="text"
            value={clinicDetails.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your Clinic Name"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text"><FiAlertCircle /> {errors.name}</span>}
        </div>

        <div className="form-group">
          <label>About Your Clinic <span className="optional">(Optional)</span></label>
          <textarea
            value={clinicDetails.about}
            onChange={(e) => handleChange('about', e.target.value)}
            placeholder="Tell patients about your clinic, experience, and what makes you special..."
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              value={clinicDetails.address.street}
              onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="form-group">
            <label>City <span className="required">*</span></label>
            <input
              type="text"
              value={clinicDetails.address.city}
              onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
              placeholder="Mumbai"
              className={errors.city ? 'error' : ''}
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={clinicDetails.address.state}
              onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
              placeholder="Maharashtra"
            />
          </div>
          <div className="form-group">
            <label>ZIP Code</label>
            <input
              type="text"
              value={clinicDetails.address.zip}
              onChange={(e) => handleNestedChange('address', 'zip', e.target.value)}
              placeholder="400001"
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={clinicDetails.address.country}
              onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
              placeholder="India"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="section">
        <div className="section-title"><FiPhone className="icon" /> Contact Information</div>
        
        <div className="form-row">
          <div className="form-group">
            <label><FiPhone className="icon" /> Phone <span className="required">*</span></label>
            <input
              type="tel"
              value={clinicDetails.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className={errors.phone ? 'error' : ''}
            />
          </div>
          <div className="form-group">
            <label><FiMail className="icon" /> Email</label>
            <input
              type="email"
              value={clinicDetails.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="clinic@example.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label><FiGlobe className="icon" /> Website <span className="optional">(Optional)</span></label>
            <input
              type="url"
              value={clinicDetails.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.yourclinic.com"
            />
          </div>
          <div className="form-group">
            <label><FiPhone className="icon" /> Emergency Contact</label>
            <input
              type="tel"
              value={clinicDetails.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              placeholder="After-hours emergency number"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="section">
        <div className="section-title"><FiInstagram className="icon" /> Social Media</div>
        <div className="form-row">
          <div className="form-group">
            <label><FiFacebook className="icon" /> Facebook</label>
            <input
              type="url"
              value={clinicDetails.socialMedia.facebook}
              onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
              placeholder="https://facebook.com/yourclinic"
            />
          </div>
          <div className="form-group">
            <label><FiInstagram className="icon" /> Instagram</label>
            <input
              type="url"
              value={clinicDetails.socialMedia.instagram}
              onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
              placeholder="https://instagram.com/yourclinic"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FiTwitter className="icon" /> Twitter</label>
            <input
              type="url"
              value={clinicDetails.socialMedia.twitter}
              onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
              placeholder="https://twitter.com/yourclinic"
            />
          </div>
          <div className="form-group">
            <label><FiLinkedin className="icon" /> LinkedIn</label>
            <input
              type="url"
              value={clinicDetails.socialMedia.linkedin}
              onChange={(e) => handleNestedChange('socialMedia', 'linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourclinic"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="section">
        <div className="section-title"><FiClock className="icon" /> Operating Hours</div>
        <div className="hours-grid">
          {clinicDetails.operatingHours.map((hour, index) => (
            <div key={hour.day} className={`hours-row ${!hour.isOpen ? 'closed' : ''}`}>
              <span className="day-name">{hour.day}</span>
              {hour.isOpen ? (
                <>
                  <input
                    type="time"
                    value={hour.openTime}
                    onChange={(e) => handleHoursChange(index, 'openTime', e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={hour.closeTime}
                    onChange={(e) => handleHoursChange(index, 'closeTime', e.target.value)}
                  />
                </>
              ) : (
                <span style={{ color: '#dc2626', fontWeight: 500 }}>Closed</span>
              )}
              <label className="closed-toggle">
                <input
                  type="checkbox"
                  checked={!hour.isOpen}
                  onChange={(e) => handleHoursChange(index, 'isOpen', !e.target.checked)}
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Specializations */}
      <div className="section">
        <div className="section-title"><FiMessageCircle className="icon" /> Specializations & Tags</div>
        <div className="tags-container">
          {clinicDetails.specializations.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button onClick={() => removeTag('specializations', tag)}><FiX /></button>
            </span>
          ))}
          <input
            type="text"
            className="tags-input"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag('specializations', newTag);
              }
            }}
            placeholder="Type and press Enter..."
          />
        </div>
      </div>

      {/* Languages & Payments */}
      <div className="section">
        <div className="form-row">
          <div className="form-group">
            <label><FiMessageCircle className="icon" /> Languages Spoken</label>
            <div className="checkbox-group">
              {LANGUAGE_OPTIONS.map(lang => (
                <label key={lang} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={clinicDetails.languagesSpoken.includes(lang)}
                    onChange={() => toggleOption('languagesSpoken', lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label><FiDollarSign className="icon" /> Accepted Payments</label>
            <div className="checkbox-group">
              {PAYMENT_OPTIONS.map(payment => (
                <label key={payment} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={clinicDetails.acceptedPayments.includes(payment)}
                    onChange={() => toggleOption('acceptedPayments', payment)}
                  />
                  {payment}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Settings */}
      <div className="section">
        <div className="section-title"><FiSettings className="icon" /> Appointment Settings</div>
        <div className="form-row-3">
          <div className="form-group">
            <label>Default Slot Duration (mins)</label>
            <select
              value={clinicDetails.appointmentSettings.defaultSlotDuration}
              onChange={(e) => handleNestedChange('appointmentSettings', 'defaultSlotDuration', parseInt(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Buffer Time (mins)</label>
            <select
              value={clinicDetails.appointmentSettings.bufferTime}
              onChange={(e) => handleNestedChange('appointmentSettings', 'bufferTime', parseInt(e.target.value))}
            >
              <option value={0}>No buffer</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Advance Booking (days)</label>
            <select
              value={clinicDetails.appointmentSettings.advanceBookingDays}
              onChange={(e) => handleNestedChange('appointmentSettings', 'advanceBookingDays', parseInt(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="step-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Continue <FiArrowRight />
        </button>
      </div>

    </div>
  );
}
