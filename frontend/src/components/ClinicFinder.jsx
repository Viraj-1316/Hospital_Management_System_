// ClinicFinder.jsx - Help users find their clinic login page (OneCare Theme)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import '../auth/OneCareAuth.css';
import './ClinicFinder.css';

export default function ClinicFinder() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = clinics.filter(clinic => 
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.city && clinic.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClinics(filtered);
    } else {
      setFilteredClinics(clinics);
    }
  }, [searchTerm, clinics]);

  const fetchClinics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/clinics/public-list`);
      if (res.data.success) {
        setClinics(res.data.data || []);
        setFilteredClinics(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToClinic = (subdomain) => {
    navigate(`/c/${subdomain}/login`);
  };

  return (
    <div className="onecare-auth-page">
      {/* Background Shapes */}
      <div className="bg-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <main className="auth-wrapper clinic-finder-wrapper">
        {/* Side Panel */}
        <div className="finder-side-panel">
          <div className="finder-panel-content">
            <div className="medical-cross" style={{ width: 60, height: 60, background: '#fff', margin: '0 auto 20px' }}></div>
            <h1>OneCare</h1>
            <p>Find your clinic and access your healthcare portal securely.</p>
            <div className="admin-login-link">
              <Link to="/login">Admin Login →</Link>
            </div>
            <div className="back-to-home">
              <Link to="/">← Back to Homepage</Link>
            </div>
          </div>
        </div>

        {/* Finder Content */}
        <div className="finder-content-section">
          <div className="finder-header">
            <Link to="/" style={{ textDecoration: 'none', color: '#4e54c8' }}>
              <i className="fas fa-hospital-alt"></i>
            </Link>
            <h1>Find Your Clinic</h1>
            <p>Search for your clinic to access patient, doctor, or staff login</p>
          </div>

          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by clinic name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="clinics-list">
            {loading ? (
              // Skeleton Loading State
              <>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
              </>
            ) : filteredClinics.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clinic-medical"></i>
                <span>{searchTerm ? 'No clinics found matching your search' : 'No clinics available'}</span>
              </div>
            ) : (
              filteredClinics.map((clinic) => (
                <div 
                  key={clinic._id || clinic.subdomain} 
                  className="clinic-card"
                  onClick={() => goToClinic(clinic.subdomain)}
                >
                  <div className="clinic-info">
                    <h3>{clinic.name}</h3>
                    {clinic.city && (
                      <span className="clinic-location">
                        <i className="fas fa-map-marker-alt"></i> {clinic.city}
                      </span>
                    )}
                  </div>
                  <i className="fas fa-arrow-right arrow-icon"></i>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
