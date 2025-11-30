import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Printer, MapPin, Calendar, Clock, CreditCard } from "lucide-react";
import PatientLayout from "../layouts/PatientLayout";

// API Setup
const api = axios.create({ baseURL: "http://localhost:3001" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("userToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PatientAppointmentDetails = ({ sidebarCollapsed, toggleSidebar }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/appointments/${id}`);
        setAppointment(response.data.data || response.data);
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
        <div className="d-flex justify-content-center align-items-center" style={{height:'80vh'}}>
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
    </PatientLayout>
  );

  if (!appointment) return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
        <div className="p-5 text-center">Receipt not found</div>
    </PatientLayout>
  );

  return (
    <PatientLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <div className="container py-4">
        
        {/* Top Controls (Hidden when printing via CSS class 'no-print') */}
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <button className="btn btn-light border" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="me-2"/> Back
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} className="me-2"/> Print Receipt
          </button>
        </div>

        {/* ✅ ADDED ID: "printable-receipt" 
            This ID is crucial for the CSS below to identify what to print.
        */}
        <div id="printable-receipt" className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '700px' }}>
          <div className="card-body p-5">
            
            {/* Header */}
            <div className="text-center mb-5 border-bottom pb-4">
              <h3 className="fw-bold text-primary mb-1">MEDICAL RECEIPT</h3>
              <p className="text-muted small text-uppercase mb-0">Receipt #{appointment._id?.slice(-6).toUpperCase()}</p>
            </div>

            {/* Doctor & Clinic Info */}
            <div className="row mb-4">
              <div className="col-6">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Provider</small>
                <h5 className="fw-bold mb-0">{appointment.doctorName || "Doctor"}</h5>
                <div className="text-muted small mt-1 d-flex align-items-center">
                   <MapPin size={12} className="me-1"/>
                   {appointment.clinic || appointment.clinicName || "Main Clinic"}
                </div>
              </div>
              <div className="col-6 text-end">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Date & Time</small>
                <div className="fw-bold text-dark d-flex align-items-center justify-content-end">
                   <Calendar size={14} className="me-1 text-primary"/>
                   {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="text-muted small mt-1 d-flex align-items-center justify-content-end">
                   <Clock size={12} className="me-1"/>
                   {appointment.time || "Time not specified"}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <thead className="bg-light">
                  <tr>
                    <th className="py-2">Service Description</th>
                    <th className="py-2 text-end" style={{width: '120px'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3">
                      <span className="fw-semibold d-block">
                        {appointment.serviceName || appointment.services || "General Consultation"}
                      </span>
                      <small className="text-muted">Medical Services</small>
                    </td>
                    <td className="py-3 text-end align-middle fw-bold">
                      ₹{appointment.charges || 0}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td className="text-end fw-bold">Total Paid</td>
                    <td className="text-end fw-bold text-primary">₹{appointment.charges || 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status Badge */}
            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
               <div className="d-flex align-items-center">
                  <CreditCard size={18} className="text-muted me-2"/>
                  <span className="text-muted small">Payment Status</span>
               </div>
               <span className="badge bg-success text-uppercase px-3 py-2">
                 {appointment.paymentStatus || "PAID"}
               </span>
            </div>

            {/* Footer */}
            <div className="text-center mt-5 pt-4 border-top">
              <p className="text-muted small mb-0">Thank you for visiting us.</p>
              <p className="text-muted small">For questions, please contact support.</p>
            </div>

          </div>
        </div>

      </div>
      
      {/* ✅ UPDATED PRINT STYLES 
          This logic hides the body and fixes the receipt to the top-left corner.
      */}
      <style>
        {`
          @media print {
            /* 1. Hide everything in the body */
            body * {
              visibility: hidden;
            }

            /* 2. Hide the sidebar specifically if it persists */
            .sidebar, .navbar, .no-print {
              display: none !important;
            }

            /* 3. Make ONLY the receipt card visible */
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }

            /* 4. Position the receipt absolutely at the top-left of the page */
            #printable-receipt {
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              z-index: 9999;
              background: white; /* Ensure it has a white background */
              box-shadow: none !important; /* Remove shadow for cleaner print */
              border: 1px solid #ddd !important; /* Optional border */
            }
          }
        `}
      </style>
    </PatientLayout>
  );
};

export default PatientAppointmentDetails;