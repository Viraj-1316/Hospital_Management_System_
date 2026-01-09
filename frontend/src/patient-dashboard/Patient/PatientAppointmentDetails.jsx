import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import axios from "axios";
import { ArrowLeft, Printer, MapPin, Calendar, Clock, CreditCard } from "lucide-react";
import PatientLayout from "../layouts/PatientLayout";
import API_BASE from "../../config";

// --- API Setup ---
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("patientToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PatientAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Hook to access passed state
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // ✅ STRATEGY 1: Check if data was passed from Dashboard
    if (location.state && location.state.appointmentData) {

        setAppointment(location.state.appointmentData);
        setLoading(false);
        return;
    }

    // ✅ STRATEGY 2: If no data passed (e.g., page refresh), fetch from API
    const fetchDetails = async () => {
      try {

        const response = await api.get(`/appointments/${id}`);
        
        const data = response.data.data || response.data;
        // Handle array response if API returns [object]
        const finalData = Array.isArray(data) ? data[0] : data;

        if (finalData) {
            setAppointment(finalData);
        } else {
            setErrorMsg("Appointment not found in database.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMsg("Could not load appointment details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id, location.state]);

  // --- Helper: Parse Services ---
  const getServiceData = () => {
    if (!appointment) return { list: [], pricePerItem: 0 };

    const rawServices = appointment.serviceName || appointment.services || "General Consultation";
    let list = [];

    if (Array.isArray(rawServices)) {
        list = rawServices;
    } else if (typeof rawServices === "string") {
        list = rawServices.split(",").map(s => s.trim()).filter(Boolean);
    } else {
        list = ["General Consultation"];
    }

    const total = Number(appointment.charges) || 0;
    const count = list.length || 1;
    const pricePerItem = count > 0 ? (total / count).toFixed(0) : 0;

    return { list, pricePerItem };
  };

  // --- RENDER ---
  if (loading) return (
    <PatientLayout>
        <div className="d-flex justify-content-center align-items-center" style={{height:'80vh'}}>
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
    </PatientLayout>
  );

  if (!appointment) return (
    <PatientLayout>
        <div className="p-5 text-center mt-5">
            <h4 className="text-danger fw-bold">Receipt Not Found</h4>
            <p className="text-muted">{errorMsg || "We couldn't locate the details for this appointment."}</p>
            <button className="btn btn-outline-dark mt-3" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} className="me-2"/> Go Back
            </button>
        </div>
    </PatientLayout>
  );

  const { list: serviceList, pricePerItem } = getServiceData();

  return (
    <PatientLayout>
      <div className="container py-4">
        
        {/* Navigation & Print Buttons */}
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <button className="btn btn-light border shadow-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="me-2"/> Back to Dashboard
          </button>
          <button className="btn btn-primary shadow-sm" onClick={() => window.print()}>
            <Printer size={16} className="me-2"/> Print Receipt
          </button>
        </div>

        {/* RECEIPT CARD */}
        <div id="printable-receipt" className="card border-0 shadow mx-auto" style={{ maxWidth: '750px', borderRadius: '12px' }}>
          <div className="card-body p-5">
            
            {/* Header */}
            <div className="d-flex justify-content-between border-bottom pb-4 mb-4">
                <div>
                    <h3 className="fw-bold text-primary mb-1">MEDICAL RECEIPT</h3>
                    <div className="text-muted small">ID: #{appointment._id?.slice(-6).toUpperCase() || "---"}</div>
                </div>
                <div className="text-end">
                    <div className="badge bg-success fs-6 px-3 py-2 text-uppercase">
                        {appointment.paymentStatus || "PAID"}
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="row g-4 mb-4">
                <div className="col-md-6">
                    <label className="text-muted text-uppercase small fw-bold mb-1">Doctor / Provider</label>
                    <h5 className="fw-bold mb-1">{appointment.doctorName || "Doctor"}</h5>
                    <div className="text-muted small d-flex align-items-center">
                        <MapPin size={14} className="me-1"/> 
                        {appointment.clinic || appointment.clinicName || "Health Center"}
                    </div>
                </div>
                <div className="col-md-6 text-md-end">
                    <label className="text-muted text-uppercase small fw-bold mb-1">Appointment Date</label>
                    <h5 className="fw-bold mb-1">
                        {new Date(appointment.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h5>
                    <div className="text-muted small d-flex align-items-center justify-content-md-end">
                        <Clock size={14} className="me-1"/> 
                        {appointment.time || "Scheduled Time"}
                    </div>
                </div>
            </div>

            {/* 🆕 Appointment Mode Section */}
            {appointment.appointmentMode && (
              <div className="mb-4 p-3 rounded" style={{ 
                background: appointment.appointmentMode === 'online' ? '#e7f5ff' : '#f8f9fa',
                border: `1px solid ${appointment.appointmentMode === 'online' ? '#74c0fc' : '#dee2e6'}`
              }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                  <div>
                    <span className={`badge ${appointment.appointmentMode === 'online' ? 'bg-info' : 'bg-secondary'} mb-2`}>
                      {appointment.appointmentMode === 'online' ? '🖥️ Online Consultation' : '🏥 In-Clinic Visit'}
                    </span>
                    {appointment.appointmentMode === 'online' && appointment.onlinePlatform && (
                      <p className="mb-0 small text-muted">
                        Platform: <strong>{appointment.onlinePlatform === 'google_meet' ? 'Google Meet' : 'Zoom'}</strong>
                      </p>
                    )}
                  </div>
                  {appointment.appointmentMode === 'online' && appointment.meetingLink && (
                    <a 
                      href={appointment.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary d-flex align-items-center gap-2"
                    >
                      📹 Join Meeting
                    </a>
                  )}
                </div>
                {appointment.meetingLink && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Link: <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary">
                        {appointment.meetingLink}
                      </a>
                    </small>
                  </div>
                )}
              </div>
            )}


            {/* Services Table */}
            <div className="table-responsive mb-4 border rounded">
              <table className="table table-borderless mb-0">
                <thead className="bg-light border-bottom">
                  <tr>
                    <th className="py-3 ps-4 text-uppercase small text-muted">Service Description</th>
                    <th className="py-3 pe-4 text-end text-uppercase small text-muted">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceList.length > 0 ? (
                      serviceList.map((service, index) => (
                        <tr key={index} className="border-bottom">
                          <td className="py-3 ps-4">
                            <span className="fw-semibold text-dark">{service}</span>
                          </td>
                          <td className="py-3 pe-4 text-end fw-bold">₹{pricePerItem}</td>
                        </tr>
                      ))
                  ) : (
                      <tr>
                          <td className="py-3 ps-4">Consultation Fee</td>
                          <td className="py-3 pe-4 text-end fw-bold">₹{appointment.charges}</td>
                      </tr>
                  )}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td className="ps-4 py-3 fw-bold fs-5">Total</td>
                    <td className="pe-4 py-3 text-end fw-bold fs-5 text-primary">₹{appointment.charges || 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
               <p className="text-muted small mb-1">Thank you for choosing our services.</p>
               <p className="text-muted small">Generated on {new Date().toLocaleDateString()}</p>
            </div>

          </div>
        </div>

      </div>

      {/* Print Specific CSS */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .no-print, nav, header, aside { display: none !important; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              border: none !important;
              box-shadow: none !important;
            }
            @page { margin: 20px; }
          }
        `}
      </style>
    </PatientLayout>
  );
};

export default PatientAppointmentDetails;