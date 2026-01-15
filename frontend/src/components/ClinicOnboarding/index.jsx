// src/components/ClinicOnboarding/index.jsx
// Main wizard container with step management and animations
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { FiCheck, FiArrowLeft, FiArrowRight, FiGlobe, FiInfo, FiList, FiUsers, FiEye } from 'react-icons/fi';
import API_BASE from '../../config';
import SubdomainStep from './steps/SubdomainStep';
import ClinicDetailsStep from './steps/ClinicDetailsStep';
import ServicesStep from './steps/ServicesStep';
import StaffStep from './steps/StaffStep';
import PreviewStep from './steps/PreviewStep';
import './ClinicOnboarding.css';

const STEPS = [
  { id: 1, title: 'Website Address', icon: <FiGlobe /> },
  { id: 2, title: 'Clinic Details', icon: <FiInfo /> },
  { id: 3, title: 'Services', icon: <FiList /> },
  { id: 4, title: 'Team', icon: <FiUsers /> },
  { id: 5, title: 'Preview', icon: <FiEye /> }
];

export default function ClinicOnboarding() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [direction, setDirection] = useState('forward'); // for animation direction

  // Fetch onboarding data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/onboarding/${registrationId}`);
        if (res.data.success) {
          setOnboardingData(res.data.onboarding);
          setRegistration(res.data.registration);
          setCurrentStep(res.data.onboarding.currentStep || 1);
        }
      } catch (error) {
        console.error('Error fetching onboarding:', error);
        toast.error('Failed to load onboarding data');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    if (registrationId) {
      fetchData();
    }
  }, [registrationId, navigate]);

  // Save draft
  const saveDraft = useCallback(async (step, data) => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/onboarding/save-draft`, {
        registrationId,
        step,
        data
      });
      
      if (res.data.success) {
        setOnboardingData(res.data.onboarding);
        // Also save to localStorage as backup
        localStorage.setItem(`onboarding_${registrationId}`, JSON.stringify(res.data.onboarding));
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  }, [registrationId]);

  // Navigate to next step
  const goToNext = async (stepData) => {
    if (stepData) {
      await saveDraft(currentStep, stepData);
    }
    
    if (currentStep < 5) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const goToPrevious = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  // Publish website
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await axios.post(`${API_BASE}/api/onboarding/publish`, {
        registrationId
      });
      
      if (res.data.success) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast.success('🎉 Your clinic website is now live!');
        setOnboardingData(res.data.onboarding);
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(error.response?.data?.message || 'Failed to publish website');
    } finally {
      setPublishing(false);
    }
  };

  // Update onboarding data
  const updateData = (updates) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="loading-spinner"></div>
        <p>Loading your clinic setup...</p>
      </div>
    );
  }

  return (
    <div className="clinic-onboarding">
      {/* Background */}
      <div className="onboarding-bg">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>

      {/* Header */}
      <header className="onboarding-header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="OneCare" />
            <span>OneCare</span>
          </div>
          {registration && (
            <div className="clinic-info">
              <span className="application-id">{registration.applicationId}</span>
              <span className="clinic-name">{registration.clinicName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="progress-stepper">
        {STEPS.map((step, index) => (
          <div 
            key={step.id} 
            className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            <div className="step-connector" style={{ display: index === 0 ? 'none' : 'block' }}></div>
            <div className="step-circle">
              {currentStep > step.id ? <FiCheck /> : step.icon}
            </div>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content-wrapper">
        <div className={`step-content step-${direction}`} key={currentStep}>
          {currentStep === 1 && (
            <SubdomainStep
              data={onboardingData}
              updateData={updateData}
              onNext={goToNext}
              registrationId={registrationId}
            />
          )}
          {currentStep === 2 && (
            <ClinicDetailsStep
              data={onboardingData}
              updateData={updateData}
              onNext={goToNext}
              onBack={goToPrevious}
            />
          )}
          {currentStep === 3 && (
            <ServicesStep
              data={onboardingData}
              updateData={updateData}
              onNext={goToNext}
              onBack={goToPrevious}
            />
          )}
          {currentStep === 4 && (
            <StaffStep
              data={onboardingData}
              updateData={updateData}
              onNext={goToNext}
              onBack={goToPrevious}
            />
          )}
          {currentStep === 5 && (
            <PreviewStep
              data={onboardingData}
              onBack={goToPrevious}
              onPublish={handlePublish}
              publishing={publishing}
            />
          )}
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="saving-indicator">
          <div className="saving-spinner"></div>
          Saving...
        </div>
      )}
    </div>
  );
}
