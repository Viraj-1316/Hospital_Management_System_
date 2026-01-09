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
    
    selectedServices: [], // Array of { name, category, description, amount }
    selectedTaxes: [], // IDs

    subTotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    discount: 0,
    paidAmount: 0,
    amountDue: 0,

    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    status: "unpaid",
    notes: "",
    paymentMethod: "",  // Payment mode for Razorpay integration
  });

  const [patients, setPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [doctorServices, setDoctorServices] = useState([]);
  const [availableTaxes, setAvailableTaxes] = useState([]);
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
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [patRes, servRes, taxRes] = await Promise.all([
           axios.get(`${BASE}/patients`, { headers }),
           axios.get(`${BASE}/services`, { params: { active: true }, headers }),
           axios.get(`${BASE}/api/taxes`, { headers })
        ]);

        setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);
        setAvailableTaxes((Array.isArray(taxRes.data) ? taxRes.data : taxRes.data.data || []).filter(t => t.active !== false));

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

  // --- 3. Calculations ---
  useEffect(() => {
    // 1. Calculate SubTotal
    const subTotal = form.selectedServices.reduce((sum, svc) => sum + (Number(svc.amount) || 0), 0);

    // 2. Calculate Tax Amount
    let totalTax = 0;
    const taxesToApply = availableTaxes.filter(t => form.selectedTaxes.includes(t._id));
    taxesToApply.forEach(tax => {
      totalTax += (subTotal * (tax.taxRate / 100));
    });

    // 3. Calculate Final Total
    const discount = Number(form.discount) || 0;
    const totalAmount = subTotal + totalTax - discount;
    
    // 4. Calculate Amount Due
    const paid = Number(form.paidAmount) || 0;
    const amountDue = Math.max(totalAmount - paid, 0);

    // Auto-update status based on logic if changed externally or init
    // But doctor might want to manually set status too, so we won't FORCE it if they manually changed it maybe?
    // For now stick to auto logic to be safe
    let status = form.status;
    if (paid >= totalAmount && totalAmount > 0) status = "paid";
    else if (paid > 0 && paid < totalAmount) status = "partial";
    else if (paid === 0) status = "unpaid"; // default

    setForm(prev => ({
      ...prev,
      subTotal,
      taxAmount: totalTax,
      totalAmount,
      amountDue,
      status
    }));

  }, [form.selectedServices, form.selectedTaxes, form.discount, form.paidAmount, availableTaxes]);


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
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${BASE}/encounters?patientId=${selectedId}&doctorId=${form.doctorId}`, { headers });
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
      const nameClean = (typeof sName === 'string' ? sName : sName.name || "").trim();
      if (!nameClean) return null;
      
      const found = doctorServices.find(ds => ds.name.toLowerCase() === nameClean.toLowerCase());
      return {
        name: nameClean,
        category: found ? found.category || "Consultation" : "Consultation", // try to get category
        description: "",
        amount: found ? Number(found.charges) : 0
      };
    }).filter(Boolean);

    setForm(prev => ({
      ...prev,
      encounterId: encounter._id,
      selectedServices: matchedServices,
      date: new Date(encounter.date).toISOString().split('T')[0]
    }));
  };

  const handleEncounterChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
       // Reset logic if needed
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
      category: serviceObj ? serviceObj.category || "Consultation" : "Consultation",
      description: "",
      amount: serviceObj ? Number(serviceObj.charges) : 0
    };

    if (!form.selectedServices.find(s => s.name === newService.name)) {
      setForm(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, newService]
      }));
    }
    e.target.value = "";
  };

  const removeService = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((_, i) => i !== indexToRemove)
    }));
  };

  const toggleTax = (taxId) => {
    setForm(prev => {
      const current = prev.selectedTaxes;
      if (current.includes(taxId)) {
        return { ...prev, selectedTaxes: current.filter(id => id !== taxId) };
      } else {
        return { ...prev, selectedTaxes: [...current, taxId] };
      }
    });
  };

  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error("Please select a Patient");

    try {
      setSaving(true);

      const taxDetails = availableTaxes
        .filter(t => form.selectedTaxes.includes(t._id))
        .map(t => ({
          name: t.name,
          rate: t.taxRate,
          amount: (form.subTotal * (t.taxRate / 100))
        }));

      const payload = {
        ...form,
        services: form.selectedServices, // {name, category, description, amount}
        taxDetails,
        clinicId: form.clinicId || null
      };

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${BASE}/bills`, payload, { headers });
      toast.success("Bill created successfully!");
      navigate("/doctor/billing");
    } catch (err) {
      console.error(err);
      toast.error("Error creating bill.");
    } finally {
      setSaving(false);
    }
  };

  // Prevent Zoom
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const originalContent = meta ? meta.getAttribute('content') : 'width=device-width, initial-scale=1';
    if (meta) meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    return () => { if (meta) meta.setAttribute('content', originalContent); };
  }, []);


  return (
    <DoctorLayout>
      <Toaster position="top-right" />
      <style>{`
        @media screen and (max-width: 768px) {
          .form-select, .form-control, input, select, textarea {
            font-size: 16px !important;
            max-height: 50px;
          }
        }
      `}</style>

      <div className="container-fluid py-4">

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
                      {new Date(enc.date).toLocaleDateString()} - {Array.isArray(enc.services) ? enc.services.join(", ") : enc.services || "General"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services */}
              <div className="col-12 mt-4">
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

                <div className="d-flex flex-wrap gap-2 border p-3 rounded bg-light align-items-center" style={{ minHeight: '60px' }}>
                  {form.selectedServices.length === 0 && <span className="text-muted small">No services added.</span>}
                  {form.selectedServices.map((s, idx) => (
                    <span key={idx} className="badge bg-white text-primary border shadow-sm d-flex align-items-center gap-2 py-2 px-3">
                      {s.name} ({s.category}) <span className="fw-bold text-dark">₹{s.amount}</span>
                      <FaTrash className="text-danger ms-1" style={{ cursor: 'pointer' }} onClick={() => removeService(idx)} size={12} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Taxes */}
               <div className="col-md-6 mt-4">
                 <label className="form-label small fw-bold">Tax Selection</label>
                 {availableTaxes.length > 0 ? (
                  <div className="card p-3 border-0 bg-light">
                    {availableTaxes.map(tax => (
                      <div className="form-check mb-1" key={tax._id}>
                        <input className="form-check-input" type="checkbox" id={`tax-${tax._id}`} checked={form.selectedTaxes.includes(tax._id)} onChange={() => toggleTax(tax._id)} />
                        <label className="form-check-label d-flex justify-content-between small" htmlFor={`tax-${tax._id}`}>
                          <span>{tax.name}</span>
                          <span className="fw-bold">{tax.taxRate}%</span>
                        </label>
                      </div>
                    ))}
                  </div>
                 ) : <div className="text-muted small fst-italic">No taxes available.</div>}
               </div>

               {/* Calculations */}
               <div className="col-md-6 mt-4">
                  <div className="card p-3 border-0 bg-light">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span>Sub Total:</span>
                        <span className="fw-bold">₹{form.subTotal.toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small">
                        <span>Tax:</span>
                        <span className="text-danger">+ ₹{form.taxAmount.toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small align-items-center">
                        <span>Discount:</span>
                        <input type="number" name="discount" className="form-control form-control-sm text-end" style={{width:"80px"}} value={form.discount} onChange={handleGenericChange} />
                     </div>
                     <div className="border-top my-2"></div>
                      <div className="d-flex justify-content-between mb-1 fw-bold">
                        <span>Total:</span>
                        <span className="text-primary">₹{form.totalAmount.toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small align-items-center">
                        <span>Paid:</span>
                        <input type="number" name="paidAmount" className="form-control form-control-sm text-end" style={{width:"80px"}} value={form.paidAmount} onChange={handleGenericChange} />
                     </div>
                     <div className="d-flex justify-content-between fw-bold text-danger">
                        <span>Due:</span>
                        <span>₹{form.amountDue.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

              {/* Date & Status */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Date</label>
                <input type="date" name="date" className="form-control" value={form.date} onChange={handleGenericChange} required />
              </div>
               <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Time</label>
                <input type="text" name="time" className="form-control" value={form.time} onChange={handleGenericChange} />
              </div>

              {/* Payment Mode */}
              <div className="col-md-6 col-12">
                <label className="form-label small fw-bold">Payment Mode</label>
                <select name="paymentMethod" className="form-select" value={form.paymentMethod} onChange={handleGenericChange}>
                  <option value="">-- Select Payment Mode --</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online (Razorpay)</option>
                </select>
                {form.paymentMethod === "Online" && (
                  <small className="text-info">Patient can pay online via Razorpay from their portal</small>
                )}
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