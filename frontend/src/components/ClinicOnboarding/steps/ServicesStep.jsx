// src/components/ClinicOnboarding/steps/ServicesStep.jsx
// Step 3: Add clinic services
import React, { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2, FiAlertCircle, FiClock, FiDollarSign } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

const defaultService = {
  name: '',
  description: '',
  price: '',
  duration: 30
};

export default function ServicesStep({ data, updateData, onNext, onBack }) {
  const [services, setServices] = useState(
    data?.services?.length > 0 ? data.services : [{ ...defaultService }]
  );
  const [error, setError] = useState('');

  // Add new service
  const addService = () => {
    if (services.length >= 20) {
      setError('Maximum 20 services allowed');
      return;
    }
    setServices([...services, { ...defaultService }]);
    setError('');
  };

  // Remove service
  const removeService = (index) => {
    if (services.length === 1) {
      setError('At least one service is required');
      return;
    }
    setServices(services.filter((_, i) => i !== index));
    setError('');
  };

  // Update service field
  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
    setError('');
  };

  // Validate and continue
  const handleContinue = () => {
    // Validate at least one service has a name
    const hasValidService = services.some(s => s.name.trim());
    if (!hasValidService) {
      setError('Please add at least one service with a name');
      return;
    }
    
    // Filter out empty services
    const validServices = services.filter(s => s.name.trim());
    onNext({ services: validServices });
  };

  return (
    <div className="services-step">
      <div className="step-header">
        <h2>💼 Add Your Services</h2>
        <p>List the services your clinic offers to patients</p>
      </div>

      {error && (
        <div className="error-banner">
          <FiAlertCircle /> {error}
        </div>
      )}

      <div className="services-list">
        {services.map((service, index) => (
          <div key={index} className="card service-card">
            <div className="card-header">
              <span className="card-title">Service {index + 1}</span>
              <button 
                className="btn btn-remove"
                onClick={() => removeService(index)}
                disabled={services.length === 1}
              >
                <FiTrash2 /> Remove
              </button>
            </div>

            <div className="form-group">
              <label>Service Name <span className="required">*</span></label>
              <input
                type="text"
                value={service.name}
                onChange={(e) => updateService(index, 'name', e.target.value)}
                placeholder="e.g., General Consultation, Dental Cleaning, Eye Exam"
              />
            </div>

            <div className="form-group">
              <label>Description <span className="optional">(Optional)</span></label>
              <textarea
                value={service.description}
                onChange={(e) => updateService(index, 'description', e.target.value)}
                placeholder="Brief description of this service..."
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FaRupeeSign className="icon" /> Price <span className="optional">(Optional)</span></label>
                <div className="input-with-icon">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => updateService(index, 'price', e.target.value)}
                    placeholder="500"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label><FiClock className="icon" /> Duration</label>
                <select
                  value={service.duration}
                  onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                >
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length < 20 && (
        <button className="btn-add" onClick={addService}>
          <FiPlus /> Add Another Service
        </button>
      )}

      <div className="service-count">
        {services.length} / 20 services added
      </div>

      <div className="step-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={handleContinue}>
          Continue <FiArrowRight />
        </button>
      </div>

      <style jsx>{`
        .services-list {
          margin-bottom: 20px;
        }
        
        .service-card {
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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
        
        .input-with-icon {
          display: flex;
          align-items: center;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }
        
        .input-with-icon:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        .input-prefix {
          padding: 12px;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 600;
        }
        
        .input-with-icon input {
          border: none;
          flex: 1;
          padding: 12px;
        }
        
        .input-with-icon input:focus {
          box-shadow: none;
        }
        
        .service-count {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          margin: 16px 0;
        }
      `}</style>
    </div>
  );
}
