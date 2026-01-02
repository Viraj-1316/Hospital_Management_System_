import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from 'react-hot-toast';
import DoctorLayout from "../layouts/DoctorLayout"; 
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import API_BASE from "../../config";

const BASE = API_BASE;

export default function DoctorAddBill() {
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
  const [doctorServices, setDoctorServices] = useState([]);
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

      setForm(prev => ({
        ...prev,
        doctorId: doctor._id || doctor.id,
        doctorName: doctorName,
        clinicName: doctor.clinic || "General Clinic",
      }));

      try {
        const patRes = await axios.get(`${BASE}/patients`);
        setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);

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

  // --- 🔥 3. THE "NUCLEAR" FIX FOR MOBILE ZOOM ---
  // This forces the browser to STOP zooming when this page is open
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const originalContent = meta ? meta.getAttribute('content') : 'width=device-width, initial-scale=1';
    
    // Update viewport to disable zoom specifically for this form
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    }

    // Clean up: Revert to normal when leaving this page
    return () => {
      if (meta) meta.setAttribute('content', originalContent);
    };
  }, []);

  // --- 4. Handlers ---
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

    try {
      const res = await axios.get(`${BASE}/encounters?patientId=${selectedId}&doctorId=${form.doctorId}`);
      const data = Array.isArray(res.data) ? res.data : res.data.encounters || [];
      setEncounters(data);

      if (data.length > 0) {
        const latest = data.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        autoFillFromEncounter(latest);
        toast.success("Auto-filled from latest appointment!");
      }
    } catch (err) {
      setEncounters([]);
    }
  };

  const autoFillFromEncounter = (encounter) => {
    if (!encounter) return;

    const rawServices = Array.isArray(encounter.services)
      ? encounter.services
      : (encounter.services || "").split(",");

    const matchedServices = rawServices.map(sName => {
      const nameClean = sName.trim();
      if (!nameClean) return null;
      const found = doctorServices.find(ds => ds.name.toLowerCase() === nameClean.toLowerCase());
      return {
        name: nameClean,
        charges: found ? Number(found.charges) : 0
      };
    }).filter(Boolean);

    const calculatedTotal = matchedServices.reduce((sum, s) => sum + s.charges, 0);
    const finalTotal = encounter.charges ? Number(encounter.charges) : calculatedTotal;

    setForm(prev => ({
      ...prev,
      encounterId: encounter._id,
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
    const encounter = encounters.find(enc => enc._id === selectedId);
    autoFillFromEncounter(encounter);
  };

  const handleServiceSelect = (e) => {
    const serviceName = e.target.value;
    if (!serviceName) return;

    const serviceObj = doctorServices.find(s => s.name === serviceName);
    const newService = {
      name: serviceObj ? serviceObj.name : serviceName,
      charges: serviceObj ? Number(serviceObj.charges) : 0
    };

    if (!form.selectedServices.find(s => s.name === newService.name)) {
      const updatedServices = [...form.selectedServices, newService];
      const newTotal = updatedServices.reduce((sum, s) => sum + s.charges, 0);

      setForm(prev => ({
        ...prev,
        selectedServices: updatedServices,
        totalAmount: newTotal,
        amountDue: newTotal - (Number(prev.discount) || 0)
      }));
    }
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

  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newState = { ...prev, [name]: value };
      if (name === "totalAmount" || name === "discount") {
        const total = Number(name === "totalAmount" ? value : newState.totalAmount);
        const discount = Number(name === "discount" ? value : newState.discount);
        newState.amountDue = Math.max(total - discount, 0);
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error("Please select a Patient");

    try {
      setSaving(true);
      const formattedServices = form.selectedServices.map(s => ({
        name: s.name,
        amount: s.charges
      }));

      const payload = {
        ...form,
        services: formattedServices,
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
    <DoctorLayout>
      <Toaster position="top-right" />

      {/* --- CSS Fallback --- */}
      <style>{`
        @media screen and (max-width: 768px) {
          .form-select, .form-control, input, select, textarea {
            font-size: 16px !important; /* Forces text large enough to prevent iOS zoom */
            max-height: 50px;
          }
        }
      `}</style>

      <div className="container-fluid py-4">

        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light rounded-circle shadow-sm border" onClick={() => navigate('/doctor/billing')}>
              <FaArrowLeft className="text-secondary" size={14} />
            </button>
            <h4 className="fw-bold text-primary mb-0">Add New Bill</h4>
          </div>
        </div>

        <div className="card shadow-sm p-4 border-0 rounded-3">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* Doctor (Locked) */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold text-muted">Doctor Name (Locked)</label>
                <input className="form-control bg-light" value={form.doctorName} readOnly />
              </div>

              {/* Clinic (Locked) */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold text-muted">Clinic Name (Locked)</label>
                <input className="form-control bg-light" value={form.clinicName} readOnly />
              </div>

              {/* Patient */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Patient Name <span className="text-danger">*</span></label>
                <select name="patientId" className="form-select" value={form.patientId} onChange={handlePatientChange} required>
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Encounter */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Link Appointment <span className="text-danger">*</span></label>
                <select name="encounterId" className="form-select" value={form.encounterId} onChange={handleEncounterChange} disabled={!form.patientId}>
                  <option value="">-- Select Appointment --</option>
                  {encounters.map((enc) => (
                    <option key={enc._id} value={enc._id}>
                      {new Date(enc.date).toLocaleDateString()} - {enc.services || "General"}
                    </option>
                  ))}
                </select>
                {form.patientId && encounters.length === 0 && (
                  <small className="text-muted mt-1 d-block">No recent appointments found.</small>
                )}
              </div>

              {/* Services */}
              <div className="col-12">
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

                {/* Tags */}
                <div className="d-flex flex-wrap gap-2 border p-3 rounded bg-light align-items-center" style={{ minHeight: '60px' }}>
                  {form.selectedServices.length === 0 && <span className="text-muted small">No services added.</span>}
                  {form.selectedServices.map((s, idx) => (
                    <span key={idx} className="badge bg-white text-primary border shadow-sm d-flex align-items-center gap-2 py-2 px-3">
                      {s.name} <span className="fw-bold text-dark">₹{s.charges}</span>
                      <FaTrash
                        className="text-danger ms-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => removeService(idx)}
                        size={12}
                        title="Remove"
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Amounts */}
              <div className="col-md-4 col-12">
                <label className="form-label small fw-bold">Total Amount (₹)</label>
                <input type="number" name="totalAmount" className="form-control fw-bold" value={form.totalAmount} onChange={handleGenericChange} required />
              </div>
              <div className="col-md-4 col-12">
                <label className="form-label small fw-bold">Discount (₹)</label>
                <input type="number" name="discount" className="form-control" value={form.discount} onChange={handleGenericChange} />
              </div>
              <div className="col-md-4 col-12">
                <label className="form-label small fw-bold text-primary">Amount Due (₹)</label>
                <input type="number" className="form-control bg-primary bg-opacity-10 fw-bold text-primary" value={form.amountDue} readOnly />
              </div>

              {/* Date & Status */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Date</label>
                <input type="date" name="date" className="form-control" value={form.date} onChange={handleGenericChange} required />
              </div>
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleGenericChange}>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Notes</label>
                <textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleGenericChange}></textarea>
              </div>
            </div>

            <div className="mt-4 d-flex flex-wrap justify-content-end gap-2">
              <button type="button" className="btn btn-light border px-4 flex-grow-1 flex-md-grow-0" onClick={() => navigate("/doctor/billing")}>Cancel</button>
              <button className="btn btn-primary px-4 flex-grow-1 flex-md-grow-0" disabled={saving}>
                {saving ? "Generating..." : "Generate Bill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DoctorLayout>
  );
}