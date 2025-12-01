import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from 'react-hot-toast'; 
import Sidebar from "../components/DoctorSidebar"; 
import Navbar from "../components/DoctorNavbar";   
import API_BASE from "../../config";

const BASE = API_BASE;

const DoctorAddBill = ({ sidebarCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();

  // --- 1. Form State ---
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "", 
    doctorName: "", 
    clinicId: null, 
    clinicName: "", 
    encounterId: "",
    // Store selected services as objects for calculation: { name, charges }
    selectedServices: [], 
    totalAmount: 0,
    discount: 0,
    amountDue: 0,
    date: new Date().toISOString().split("T")[0],
    status: "unpaid",
    notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [doctorServices, setDoctorServices] = useState([]); // List from DB
  const [saving, setSaving] = useState(false);

  // --- 2. Initialize Data ---
  useEffect(() => {
    const init = async () => {
        const doctor = JSON.parse(localStorage.getItem("doctor"));
        if (!doctor || (!doctor._id && !doctor.id)) {
            toast.error("Doctor session invalid. Please login.");
            return;
        }
        
        const doctorName = `${doctor.firstName} ${doctor.lastName}`.trim();

        // Auto-fill Doctor & Clinic (Locked)
        setForm(prev => ({
            ...prev,
            doctorId: doctor._id || doctor.id,
            doctorName: doctorName,
            clinicName: doctor.clinic || "General Clinic", 
        }));

        try {
            // A. Fetch Patients
            const patRes = await axios.get(`${BASE}/patients`);
            setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);

            // B. Fetch Services for this Doctor
            // We filter by the doctor's name to show only their services
            const servRes = await axios.get(`${BASE}/services`, { 
                params: { doctor: doctorName, active: true } 
            });
            
            const servicesData = Array.isArray(servRes.data) 
                ? servRes.data 
                : (servRes.data.rows || []);
            
            setDoctorServices(servicesData);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load initial data");
        }
    };
    init();
  }, []);

  // --- 3. Patient Change Handler ---
  const handlePatientChange = async (e) => {
    const selectedId = e.target.value;
    const selectedPatient = patients.find(p => p._id === selectedId);
    
    setForm(prev => ({
      ...prev,
      patientId: selectedId,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "",
      encounterId: "",
      selectedServices: [],
      totalAmount: 0,
      amountDue: 0
    }));

    if (!selectedId) {
        setEncounters([]);
        return;
    }

    // Fetch Encounters for this Patient & Doctor
    try {
        const res = await axios.get(`${BASE}/encounters?patientId=${selectedId}&doctorId=${form.doctorId}`);
        const data = Array.isArray(res.data) ? res.data : res.data.encounters || [];
        setEncounters(data);

        // Smart Auto-Fill Latest Appointment
        if (data.length > 0) {
            const latest = data.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            autoFillFromEncounter(latest);
            toast.success("Auto-filled from latest appointment!");
        }
    } catch (err) {
        setEncounters([]);
    }
  };

  // --- 4. Auto-Fill Logic ---
  const autoFillFromEncounter = (encounter) => {
      if (!encounter) return;

      // Parse services string from appointment (e.g., "Checkup, Cleaning")
      const rawServices = Array.isArray(encounter.services) 
        ? encounter.services 
        : (encounter.services || "").split(",");

      // Map string names to actual service objects to get prices
      const matchedServices = rawServices.map(sName => {
          const nameClean = sName.trim();
          if(!nameClean) return null;
          
          // Try to find in DB services to get price
          const found = doctorServices.find(ds => ds.name.toLowerCase() === nameClean.toLowerCase());
          return {
              name: nameClean,
              charges: found ? Number(found.charges) : 0 // Default to 0 if not in DB list
          };
      }).filter(Boolean);

      // Calculate Total
      // If appointment has a hardcoded 'charges' field, use that, otherwise sum up services
      const calculatedTotal = matchedServices.reduce((sum, s) => sum + s.charges, 0);
      const finalTotal = encounter.charges ? Number(encounter.charges) : calculatedTotal;

      setForm(prev => ({
          ...prev,
          encounterId: encounter.encounterId || encounter._id,
          selectedServices: matchedServices,
          totalAmount: finalTotal,
          amountDue: finalTotal - (Number(prev.discount) || 0),
          date: new Date(encounter.date).toISOString().split('T')[0]
      }));
  };

  const handleEncounterChange = (e) => {
      const selectedId = e.target.value;
      if (!selectedId) {
          setForm(prev => ({ ...prev, encounterId: "", selectedServices: [], totalAmount: 0, amountDue: 0 }));
          return;
      }
      const encounter = encounters.find(enc => (enc.encounterId === selectedId) || (enc._id === selectedId));
      autoFillFromEncounter(encounter);
  };

  // --- 5. Service Dropdown Logic ---
  const handleServiceSelect = (e) => {
      const serviceName = e.target.value;
      if (!serviceName) return;

      // Find full service object for price
      const serviceObj = doctorServices.find(s => s.name === serviceName);
      const newService = {
          name: serviceObj ? serviceObj.name : serviceName,
          charges: serviceObj ? Number(serviceObj.charges) : 0
      };

      // Check duplicates
      if (!form.selectedServices.find(s => s.name === newService.name)) {
          const updatedServices = [...form.selectedServices, newService];
          
          // Recalculate Total
          const newTotal = updatedServices.reduce((sum, s) => sum + s.charges, 0);
          
          setForm(prev => ({
              ...prev,
              selectedServices: updatedServices,
              totalAmount: newTotal,
              amountDue: newTotal - (Number(prev.discount) || 0)
          }));
      }
      
      // Reset dropdown
      e.target.value = "";
  };

  const removeService = (indexToRemove) => {
      const updatedServices = form.selectedServices.filter((_, i) => i !== indexToRemove);
      const newTotal = updatedServices.reduce((sum, s) => sum + s.charges, 0);
      
      setForm(prev => ({
          ...prev,
          selectedServices: updatedServices,
          totalAmount: newTotal,
          amountDue: newTotal - (Number(prev.discount) || 0)
      }));
  };

  // --- 6. General & Amount Change ---
  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
        const newState = { ...prev, [name]: value };
        
        // Auto-calc Amount Due if Total or Discount is typed manually
        if (name === "totalAmount" || name === "discount") {
            const total = Number(name === "totalAmount" ? value : newState.totalAmount);
            const discount = Number(name === "discount" ? value : newState.discount);
            newState.amountDue = Math.max(total - discount, 0);
        }
        return newState;
    });
  };

  // --- 7. Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error("Please select a Patient");
    
    try {
      setSaving(true);
      
      // Convert object array back to simple string array for backend
      const serviceNames = form.selectedServices.map(s => s.name);
      
      const payload = {
        ...form,
        services: serviceNames, 
        clinicId: null 
      };
      await axios.post(`${BASE}/bills`, payload);
      toast.success("Bill created successfully!");
      navigate("/doctor/billing");
    } catch (err) {
      toast.error("Error creating bill.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex" style={{ backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-grow-1" style={{ marginLeft: sidebarCollapsed ? 64 : 250, transition: "0.3s" }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <Toaster position="top-right"/>

        <div className="container-fluid mt-3">
          <h4 className="fw-bold text-primary mb-4 ps-2">Add New Bill</h4>

          <div className="card shadow-sm p-4 border-0 rounded-3">
            <form onSubmit={handleSubmit}>
              <div className="row">
                
                {/* Doctor (Locked) */}
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold text-muted">Doctor Name (Locked)</label>
                  <input className="form-control bg-light" value={form.doctorName} readOnly />
                </div>

                {/* Clinic (Locked) */}
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold text-muted">Clinic Name (Locked)</label>
                  <input className="form-control bg-light" value={form.clinicName} readOnly />
                </div>

                {/* Patient */}
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Patient Name <span className="text-danger">*</span></label>
                  <select name="patientId" className="form-select" value={form.patientId} onChange={handlePatientChange} required>
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Encounter */}
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Link Appointment <span className="text-danger">*</span></label>
                  <select name="encounterId" className="form-select" value={form.encounterId} onChange={handleEncounterChange} disabled={!form.patientId}>
                    <option value="">-- Select Appointment --</option>
                    {encounters.map((enc) => (
                      <option key={enc._id} value={enc.encounterId || enc._id}>
                        {new Date(enc.date).toLocaleDateString()} - {enc.services || "General"}
                      </option>
                    ))}
                  </select>
                  {form.patientId && encounters.length === 0 && (
                      <small className="text-muted mt-1 d-block">No recent appointments found.</small>
                  )}
                </div>

                {/* Services Dropdown & List */}
                <div className="col-md-12 mb-3">
                  <label className="form-label small fw-bold">Services</label>
                  <div className="d-flex gap-2 mb-2">
                      <select className="form-select" onChange={handleServiceSelect} defaultValue="">
                          <option value="" disabled>-- Add Service from List --</option>
                          {doctorServices.length > 0 ? (
                              doctorServices.map((s) => (
                                  <option key={s._id || s.name} value={s.name}>
                                      {s.name} (₹{s.charges})
                                  </option>
                              ))
                          ) : (
                              <option disabled>No services found for this doctor</option>
                          )}
                      </select>
                  </div>
                  
                  {/* Selected Services Tags */}
                  <div className="d-flex flex-wrap gap-2 border p-3 rounded bg-light" style={{minHeight: '50px'}}>
                      {form.selectedServices.length === 0 && <span className="text-muted small align-self-center">No services added yet. Select from dropdown above.</span>}
                      {form.selectedServices.map((s, idx) => (
                          <span key={idx} className="badge bg-primary d-flex align-items-center gap-2 py-2 px-3">
                              {s.name} - ₹{s.charges}
                              <span 
                                style={{cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px'}} 
                                onClick={() => removeService(idx)}
                                title="Remove"
                              >
                                &times;
                              </span>
                          </span>
                      ))}
                  </div>
                </div>

                {/* Amounts */}
                <div className="col-md-4 mb-3">
                  <label className="form-label small fw-bold">Total Amount (₹)</label>
                  <input 
                    type="number" 
                    name="totalAmount" 
                    className="form-control" 
                    value={form.totalAmount} 
                    onChange={handleGenericChange} 
                    required 
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label small fw-bold">Discount (₹)</label>
                  <input type="number" name="discount" className="form-control" value={form.discount} onChange={handleGenericChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label small fw-bold">Amount Due (₹)</label>
                  <input type="number" className="form-control bg-light" value={form.amountDue} readOnly />
                </div>

                {/* Date & Status */}
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Date</label>
                  <input type="date" name="date" className="form-control" value={form.date} onChange={handleGenericChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={handleGenericChange}>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label small fw-bold">Notes</label>
                  <textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleGenericChange}></textarea>
                </div>
              </div>

              <div className="mt-2">
                  <button className="btn btn-primary px-4 me-2" disabled={saving}>{saving ? "Generating..." : "Generate Bill"}</button>
                  <button type="button" className="btn btn-secondary px-4" onClick={() => navigate("/doctor/billing")}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAddBill;