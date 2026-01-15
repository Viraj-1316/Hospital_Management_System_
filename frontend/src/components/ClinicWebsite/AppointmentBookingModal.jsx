// AppointmentBookingModal.jsx - Multi-step appointment booking popup
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE from '../../config';
import './AppointmentBookingModal.css';
import { FiX, FiSearch, FiCheck, FiUser, FiCalendar, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaUserMd, FaRupeeSign, FaStethoscope } from 'react-icons/fa';
import { saveAuthData, fetchPatientData, savePatientData } from '../../auth/authService';

const STEPS = [
  { id: 1, title: 'Choose Your Doctor', description: 'Pick a specific Doctor to perform your service' },
  { id: 2, title: 'Doctor Services', description: 'Please select a service from below options' },
  { id: 3, title: 'Select Date and Time', description: 'Select date to see a timeline of available slots' },
  { id: 4, title: 'Appointment Extra Data', description: 'Upload file and description about appointment' },
  { id: 5, title: 'User Detail Information', description: 'Please provide your contact details' },
  { id: 6, title: 'Confirmation', description: 'Confirm your booking' }
];

export default function AppointmentBookingModal({ isOpen, onClose, subdomain, clinicData, onLogin }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Data states
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState({});
  const [slots, setSlots] = useState([]);
  const [slotMessage, setSlotMessage] = useState('');

  // Selections
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');

  // Auth states
  const [authTab, setAuthTab] = useState('register'); // 'register' or 'login'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patientToken, setPatientToken] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);

  // Form states
  const [searchDoctor, setSearchDoctor] = useState('');
  const [searchService, setSearchService] = useState('');
  const [registerForm, setRegisterForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', gender: 'Male', password: ''
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'patient') {
          setIsLoggedIn(true);
          setPatientToken(token);
          setPatientInfo(userData);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Fetch doctors when modal opens
  useEffect(() => {
    if (isOpen && subdomain) {
      fetchDoctors();
    }
  }, [isOpen, subdomain]);

  // Fetch services when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      fetchServices();
    }
  }, [selectedDoctor]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}/doctors`);
      if (res.data.success) {
        setDoctors(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}/services`);
      if (res.data.success) {
        setServices(res.data.data || {});
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    setSlots([]);
    setSlotMessage('');
    try {
      const res = await axios.get(`${API_BASE}/api/clinic-website/${subdomain}/slots`, {
        params: { doctorId: selectedDoctor._id, date: selectedDate }
      });
      if (res.data.success) {
        const data = res.data.data;
        setSlots(data.slots || []);
        if (data.message) {
          setSlotMessage(data.message);
        }
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, gender, password } = registerForm;
    if (!firstName || !lastName || !email || !phone || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Register as patient using the signup endpoint
      const res = await axios.post(`${API_BASE}/signup`, {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password,
        role: 'patient',
        hospitalId: clinicData?._id
      });

      if (res.data.token) {
        const userData = {
          id: res.data.id,
          email: res.data.email,
          role: res.data.role,
          name: res.data.name,
          firstName,
          lastName,
          phone: res.data.phone,
          profileCompleted: res.data.profileCompleted
        };
        setPatientToken(res.data.token);
        setPatientInfo(userData);
        setIsLoggedIn(true);

        // Save standardized auth data
        const authUser = saveAuthData(userData, res.data.token, subdomain);
        
        // Fetch and save patient specifics
        try {
          const patientDoc = await fetchPatientData(authUser.id);
          if (patientDoc) {
            savePatientData(patientDoc, authUser.id);
          }
        } catch (e) {
          console.error("Error fetching patient data on signup", e);
        }

        // Keep legacy 'user' key if needed by other components, but authUser is primary
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (onLogin) onLogin(authUser);
        toast.success('Registration successful!');
        setCurrentStep(6);
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const { email, password } = loginForm;
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      // Check if user is a patient
      if (res.data.role !== 'patient') {
        toast.error('Please use patient credentials to book appointments');
        setLoading(false);
        return;
      }

      if (res.data.token) {
        const userData = {
          id: res.data.id,
          email: res.data.email,
          role: res.data.role,
          name: res.data.name,
          // Extract name parts if available, otherwise just use name
          firstName: res.data.name?.split(' ')[0] || '',
          lastName: res.data.name?.split(' ').slice(1).join(' ') || '',
          phone: res.data.phone,
          profileCompleted: res.data.profileCompleted
        };
        setPatientToken(res.data.token);
        setPatientInfo(userData);
        setIsLoggedIn(true);
        
        // Save standardized auth data
        const authUser = saveAuthData(userData, res.data.token, subdomain);
        
        // Fetch and save patient specifics
        try {
          const patientDoc = await fetchPatientData(authUser.id);
          if (patientDoc) {
            savePatientData(patientDoc, authUser.id);
          }
        } catch (e) {
          console.error("Error fetching patient data on login", e);
        }

        // Keep legacy 'user' key if needed
        localStorage.setItem('user', JSON.stringify(userData));

        if (onLogin) onLogin(authUser);
        toast.success('Login successful!');
        setCurrentStep(6);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!patientToken) {
      toast.error('Please login or register first');
      setCurrentStep(5);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/clinic-website/${subdomain}/book`,
        {
          doctorId: selectedDoctor._id,
          serviceIds: selectedServices.map(s => s._id),
          date: selectedDate,
          time: selectedTime,
          description
        },
        {
          headers: { Authorization: `Bearer ${patientToken}` }
        }
      );

      if (res.data.success) {
        setBookingSuccess(true);
        setBookingResult(res.data.data);
        toast.success('Appointment booked successfully!');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!selectedDoctor;
      case 2: return selectedServices.length > 0;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return true; // Description is optional
      case 5: return isLoggedIn;
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 5 && !isLoggedIn) {
      // Don't proceed if not logged in
      return;
    }
    if (currentStep === 6) {
      handleBookAppointment();
      return;
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Reset all states
    setCurrentStep(1);
    setSelectedDoctor(null);
    setSelectedServices([]);
    setSelectedDate('');
    setSelectedTime('');
    setDescription('');
    setBookingSuccess(false);
    setBookingResult(null);
    setRegisterForm({ firstName: '', lastName: '', email: '', phone: '', gender: 'Male', password: '' });
    setLoginForm({ email: '', password: '' });
    onClose();
  };

  const toggleService = (service) => {
    if (selectedServices.find(s => s._id === service._id)) {
      setSelectedServices(selectedServices.filter(s => s._id !== service._id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty slots for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date && date < today;
  };

  const filteredDoctors = doctors.filter(doc =>
    doc.name?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    doc.specialty?.toLowerCase().includes(searchDoctor.toLowerCase())
  );

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  // Render booking success
  if (bookingSuccess) {
    return (
      <div className="abm-overlay" onClick={handleClose}>
        <div className="abm-success-modal" onClick={e => e.stopPropagation()}>
          <button className="abm-close" onClick={handleClose}><FiX /></button>
          <div className="abm-success">
            <div className="abm-success-icon"><FiCheck /></div>
            <h2>Appointment Booked!</h2>
            <p>Your appointment has been confirmed.</p>
            <div className="abm-confirmation">
              <div className="abm-confirmation-row">
                <span className="label">Doctor</span>
                <span className="value">{bookingResult?.doctorName}</span>
              </div>
              <div className="abm-confirmation-row">
                <span className="label">Date</span>
                <span className="value">{formatDisplayDate(bookingResult?.date)}</span>
              </div>
              <div className="abm-confirmation-row">
                <span className="label">Time</span>
                <span className="value">{bookingResult?.time}</span>
              </div>
              <div className="abm-confirmation-row">
                <span className="label">Token Number</span>
                <span className="value">#{bookingResult?.queueToken}</span>
              </div>
            </div>
          </div>
          <div className="abm-footer">
            <button className="abm-btn abm-btn-primary" onClick={handleClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="abm-overlay" onClick={handleClose}>
      <div className="abm-modal" onClick={e => e.stopPropagation()}>
        {/* Sidebar with steps */}
        <div className="abm-sidebar">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`abm-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="abm-step-icon">
                {currentStep > step.id ? <FiCheck /> : step.id}
              </div>
              <div className="abm-step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="abm-main">
          <button className="abm-close" onClick={handleClose}><FiX /></button>
          
          <div className="abm-content">
            {/* Step 1: Choose Doctor */}
            {currentStep === 1 && (
              <>
                <h2>Select Doctor</h2>
                <div className="abm-search">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchDoctor}
                    onChange={(e) => setSearchDoctor(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="abm-loading">
                    <div className="abm-spinner"></div>
                    <p>Loading doctors...</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="abm-empty">
                    <FaUserMd />
                    <p>No doctors found</p>
                  </div>
                ) : (
                  <div className="abm-doctors-grid">
                    {filteredDoctors.map((doc) => (
                      <div
                        key={doc._id}
                        className={`abm-doctor-card ${selectedDoctor?._id === doc._id ? 'selected' : ''}`}
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <div className="abm-doctor-avatar">
                          {doc.photo ? (
                            <img src={getImageUrl(doc.photo)} alt={doc.name} />
                          ) : (
                            <FaUserMd />
                          )}
                        </div>
                        <h4>{doc.name}</h4>
                        <div className="specialty">{doc.specialty}</div>
                        <div className="exp-badge">Exp: {doc.experience || 0}yr</div>
                        <div className="email">Email: {doc.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Select Services */}
            {currentStep === 2 && (
              <>
                <h2>Select Service</h2>
                <div className="abm-search">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="abm-loading">
                    <div className="abm-spinner"></div>
                    <p>Loading services...</p>
                  </div>
                ) : Object.keys(services).length === 0 ? (
                  <div className="abm-empty">
                    <FaStethoscope />
                    <p>No services found</p>
                  </div>
                ) : (
                  Object.entries(services).map(([category, svcList]) => (
                    <div key={category} className="abm-service-category">
                      <h3>{category} Services</h3>
                      <div className="abm-services-grid">
                        {svcList
                          .filter(s => s.name?.toLowerCase().includes(searchService.toLowerCase()))
                          .map((svc) => (
                            <div
                              key={svc._id}
                              className={`abm-service-card ${selectedServices.find(s => s._id === svc._id) ? 'selected' : ''}`}
                              onClick={() => toggleService(svc)}
                            >
                              <div className="abm-service-icon">
                                <FaStethoscope />
                              </div>
                              <h4>{svc.name}</h4>
                              <div className="price"><FaRupeeSign />{svc.price || 0}/-</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Step 3: Select Date and Time */}
            {currentStep === 3 && (
              <>
                <h2>Select Date and Time</h2>
                <div className="abm-datetime-container">
                  <div className="abm-calendar">
                    <div className="abm-calendar-header">
                      <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
                        <FiChevronLeft />
                      </button>
                      <h3>
                        {calendarMonth.toLocaleDateString('en-US', { month: 'short' })} ▾ {calendarMonth.getFullYear()}
                      </h3>
                      <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
                        <FiChevronRight />
                      </button>
                    </div>
                    <div className="abm-calendar-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="day-name">{d}</div>
                      ))}
                      {getDaysInMonth(calendarMonth).map((date, i) => (
                        <div
                          key={i}
                          className={`day 
                            ${!date ? 'disabled' : ''} 
                            ${date && isToday(date) ? 'today' : ''} 
                            ${date && isPast(date) ? 'past disabled' : ''} 
                            ${date && formatDateForAPI(date) === selectedDate ? 'selected' : ''}`}
                          onClick={() => date && !isPast(date) && setSelectedDate(formatDateForAPI(date))}
                        >
                          {date?.getDate() || ''}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="abm-slots">
                    <h3>Available time slots</h3>
                    <div className="abm-timezone">Time Zone: UTC+05:30</div>
                    
                    {!selectedDate ? (
                      <div className="abm-empty">
                        <FiCalendar style={{ fontSize: 32, color: '#cbd5e1' }} />
                        <p>Select a date to see available slots</p>
                      </div>
                    ) : loading ? (
                      <div className="abm-loading">
                        <div className="abm-spinner"></div>
                        <p>Loading slots...</p>
                      </div>
                    ) : slotMessage ? (
                      <div className="abm-empty">
                        <FiClock style={{ fontSize: 32, color: '#cbd5e1' }} />
                        <p>{slotMessage}</p>
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="abm-empty">
                        <FiClock style={{ fontSize: 32, color: '#cbd5e1' }} />
                        <p>No slots available for this date</p>
                      </div>
                    ) : (
                      <div className="abm-slots-grid">
                        {slots.map((slot) => (
                          <div
                            key={slot}
                            className={`abm-slot ${selectedTime === slot ? 'selected' : ''}`}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Description */}
            {currentStep === 4 && (
              <>
                <h2>More About Appointment</h2>
                <div className="abm-description">
                  <label>Appointment Descriptions</label>
                  <textarea
                    placeholder="Enter Appointment Descriptions"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 5: User Details / Auth */}
            {currentStep === 5 && (
              <>
                <h2>Enter Details</h2>
                
                {isLoggedIn ? (
                  <div className="abm-logged-in">
                    <FiCheck style={{ fontSize: 48, color: '#22c55e' }} />
                    <h3>Welcome back, {patientInfo?.name || patientInfo?.firstName || 'Patient'}!</h3>
                    <p>You are logged in and ready to book your appointment.</p>
                  </div>
                ) : (
                  <>
                    <div className="abm-auth-tabs">
                      <button
                        className={`abm-auth-tab ${authTab === 'register' ? 'active' : ''}`}
                        onClick={() => setAuthTab('register')}
                      >
                        Register
                      </button>
                      <button
                        className={`abm-auth-tab ${authTab === 'login' ? 'active' : ''}`}
                        onClick={() => setAuthTab('login')}
                      >
                        Login
                      </button>
                    </div>

                    {authTab === 'register' ? (
                      <div className="abm-form">
                        <div className="abm-form-row">
                          <div className="abm-form-group">
                            <label>First Name <span className="required">*</span></label>
                            <input
                              type="text"
                              placeholder="Enter your first name"
                              value={registerForm.firstName}
                              onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                            />
                          </div>
                          <div className="abm-form-group">
                            <label>Last Name <span className="required">*</span></label>
                            <input
                              type="text"
                              placeholder="Enter your last name"
                              value={registerForm.lastName}
                              onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="abm-form-row">
                          <div className="abm-form-group">
                            <label>Email <span className="required">*</span></label>
                            <input
                              type="email"
                              placeholder="Enter your email"
                              value={registerForm.email}
                              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            />
                          </div>
                          <div className="abm-form-group">
                            <label>Contact <span className="required">*</span></label>
                            <input
                              type="tel"
                              placeholder="Enter your contact number"
                              value={registerForm.phone}
                              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="abm-form-group">
                          <label>Password <span className="required">*</span></label>
                          <input
                            type="password"
                            placeholder="Create a password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          />
                        </div>
                        <div className="abm-form-group">
                          <label>Gender <span className="required">*</span></label>
                          <div className="abm-gender-group">
                            {['Male', 'Female', 'Other'].map(g => (
                              <label key={g}>
                                <input
                                  type="radio"
                                  name="gender"
                                  value={g}
                                  checked={registerForm.gender === g}
                                  onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                                />
                                {g}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="abm-form">
                        <div className="abm-form-group">
                          <label>Email <span className="required">*</span></label>
                          <input
                            type="email"
                            placeholder="Enter your email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          />
                        </div>
                        <div className="abm-form-group">
                          <label>Password <span className="required">*</span></label>
                          <input
                            type="password"
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 6 && (
              <>
                <h2>Confirm Your Booking</h2>
                <div className="abm-confirmation">
                  <div className="abm-confirmation-row">
                    <span className="label">Doctor</span>
                    <span className="value">{selectedDoctor?.name}</span>
                  </div>
                  <div className="abm-confirmation-row">
                    <span className="label">Specialty</span>
                    <span className="value">{selectedDoctor?.specialty}</span>
                  </div>
                  <div className="abm-confirmation-row">
                    <span className="label">Services</span>
                    <span className="value">{selectedServices.map(s => s.name).join(', ') || 'None selected'}</span>
                  </div>
                  <div className="abm-confirmation-row">
                    <span className="label">Date</span>
                    <span className="value">{selectedDate}</span>
                  </div>
                  <div className="abm-confirmation-row">
                    <span className="label">Time</span>
                    <span className="value">{selectedTime}</span>
                  </div>
                  {description && (
                    <div className="abm-confirmation-row">
                      <span className="label">Notes</span>
                      <span className="value">{description}</span>
                    </div>
                  )}
                  <div className="abm-confirmation-row">
                    <span className="label">Patient</span>
                    <span className="value">{patientInfo?.name || `${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}`.trim() || 'Patient'}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with navigation buttons */}
          <div className="abm-footer">
            {currentStep > 1 && (
              <button className="abm-btn abm-btn-secondary" onClick={handleBack}>
                BACK
              </button>
            )}
            
            {currentStep === 5 && !isLoggedIn ? (
              <button
                className="abm-btn abm-btn-primary"
                onClick={authTab === 'register' ? handleRegister : handleLogin}
                disabled={loading}
              >
                {loading ? 'Please wait...' : authTab === 'register' ? 'REGISTER' : 'LOGIN'}
              </button>
            ) : (
              <button
                className="abm-btn abm-btn-primary"
                onClick={handleNext}
                disabled={!canProceed() || loading}
              >
                {loading ? 'Please wait...' : currentStep === 6 ? 'BOOK APPOINTMENT' : 'NEXT'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
