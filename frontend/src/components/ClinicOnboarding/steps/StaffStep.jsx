// src/components/ClinicOnboarding/steps/StaffStep.jsx
// Step 4: Add doctors and staff
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2, FiUser, FiUpload, FiAlertCircle } from 'react-icons/fi';
import API_BASE from '../../../config';

const defaultStaff = {
  name: '',
  photo: '',
  specialty: '',
  qualifications: '',
  experience: '',
  bio: ''
};

const SPECIALTY_OPTIONS = [
  'General Physician',
  'Dentist',
  'Pediatrician',
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'ENT Specialist',
  'Ophthalmologist',
  'Gynecologist',
  'Neurologist',
  'Psychiatrist',
  'Physiotherapist',
  'General Surgeon',
  'Other'
];

export default function StaffStep({ data, updateData, onNext, onBack }) {
  const [staff, setStaff] = useState(
    data?.staff?.length > 0 ? data.staff : [{ ...defaultStaff }]
  );
  const [error, setError] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(-1);
  const fileInputRefs = useRef({});

  // Add new staff member
  const addStaff = () => {
    if (staff.length >= 50) {
      setError('Maximum 50 staff members allowed');
      return;
    }
    setStaff([...staff, { ...defaultStaff }]);
    setError('');
  };

  // Remove staff member
  const removeStaff = (index) => {
    if (staff.length === 1) {
      setError('At least one doctor/staff is required');
      return;
    }
    setStaff(staff.filter((_, i) => i !== index));
    setError('');
  };

  // Update staff field
  const updateStaffField = (index, field, value) => {
    const updated = [...staff];
    updated[index] = { ...updated[index], [field]: value };
    setStaff(updated);
    setError('');
  };

  // Handle photo upload
  const handlePhotoUpload = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingIndex(index);
    try {
      const res = await axios.post(`${API_BASE}/api/onboarding/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        updateStaffField(index, 'photo', res.data.imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingIndex(-1);
    }
  };

  // Validate and continue
  const handleContinue = () => {
    // Validate at least one staff member has a name
    const hasValidStaff = staff.some(s => s.name.trim());
    if (!hasValidStaff) {
      setError('Please add at least one doctor/staff with a name');
      return;
    }
    
    // Filter out empty staff members
    const validStaff = staff.filter(s => s.name.trim());
    onNext({ staff: validStaff });
  };

  return (
    <div className="staff-step">
      <div className="step-header">
        <h2>👨‍⚕️ Add Your Team</h2>
        <p>Add doctors and staff members who will be displayed on your website</p>
      </div>

      {error && (
        <div className="error-banner">
          <FiAlertCircle /> {error}
        </div>
      )}

      <div className="staff-list">
        {staff.map((member, index) => (
          <div key={index} className="card staff-card">
            <div className="card-header">
              <span className="card-title">
                <FiUser /> {member.name || `Doctor/Staff ${index + 1}`}
              </span>
              <button 
                className="btn btn-remove"
                onClick={() => removeStaff(index)}
                disabled={staff.length === 1}
              >
                <FiTrash2 /> Remove
              </button>
            </div>

            <div className="staff-content">
              {/* Photo Upload */}
              <div className="photo-section">
                <div 
                  className="photo-preview"
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  {member.photo ? (
                    <img src={`${API_BASE}${member.photo}`} alt={member.name} />
                  ) : (
                    <div className="placeholder">
                      {uploadingIndex === index ? (
                        <div className="upload-spinner"></div>
                      ) : (
                        <FiUser />
                      )}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  disabled={uploadingIndex === index}
                >
                  <FiUpload /> {uploadingIndex === index ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                  type="file"
                  ref={el => fileInputRefs.current[index] = el}
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(index, e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Details */}
              <div className="details-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateStaffField(index, 'name', e.target.value)}
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div className="form-group">
                    <label>Specialty</label>
                    <select
                      value={member.specialty}
                      onChange={(e) => updateStaffField(index, 'specialty', e.target.value)}
                    >
                      <option value="">Select specialty...</option>
                      {SPECIALTY_OPTIONS.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Qualifications <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      value={member.qualifications}
                      onChange={(e) => updateStaffField(index, 'qualifications', e.target.value)}
                      placeholder="MBBS, MD, MS..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Experience <span className="optional">(Optional)</span></label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        value={member.experience}
                        onChange={(e) => updateStaffField(index, 'experience', e.target.value)}
                        placeholder="10"
                        min="0"
                      />
                      <span className="suffix">years</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio <span className="optional">(Optional)</span></label>
                  <textarea
                    value={member.bio}
                    onChange={(e) => updateStaffField(index, 'bio', e.target.value)}
                    placeholder="Brief bio about this doctor..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {staff.length < 50 && (
        <button className="btn-add" onClick={addStaff}>
          <FiPlus /> Add Another Doctor/Staff
        </button>
      )}

      <div className="staff-count">
        {staff.length} / 50 team members added
      </div>

      <div className="step-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Preview Website <FiArrowRight />
        </button>
      </div>

      <style jsx>{`
        .staff-list {
          margin-bottom: 20px;
        }
        
        .staff-card {
          animation: fadeIn 0.3s ease;
        }
        
        .staff-content {
          display: flex;
          gap: 24px;
        }
        
        .photo-section {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .photo-preview {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 3px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .photo-preview:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .photo-preview .placeholder {
          font-size: 36px;
          color: #94a3b8;
        }
        
        .upload-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .details-section {
          flex: 1;
        }
        
        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .input-with-suffix {
          display: flex;
          align-items: center;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }
        
        .input-with-suffix:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        .input-with-suffix input {
          border: none;
          flex: 1;
          padding: 12px;
        }
        
        .input-with-suffix input:focus {
          box-shadow: none;
        }
        
        .suffix {
          padding: 12px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 13px;
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        
        .staff-count {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          margin: 16px 0;
        }
        
        @media (max-width: 640px) {
          .staff-content {
            flex-direction: column;
          }
          
          .photo-section {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
