import React, { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout"; 
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from 'react-hot-toast';
import { FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";
import API_BASE from "../../config";

const BASE = API_BASE;

const EditBill = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- 1. Form State ---
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    clinicId: "",
    clinicName: "",
    encounterId: "",
    
    services: [], // Array of objects
    selectedTaxes: [], // IDs

    subTotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    discount: 0,
    paidAmount: 0,
    amountDue: 0,

    date: "",
    time: "",
    status: "unpaid",
    notes: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [availableTaxes, setAvailableTaxes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Categories
  const serviceCategories = [
    "Consultation",
    "Laboratory",
    "Radiology",
    "Pharmacy",
    "Procedure",
    "Other"
  ];

  // --- 2. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [docRes, patRes, clinicRes, taxRes, billRes] = await Promise.all([
          axios.get(`${BASE}/doctors`, { headers }),
          axios.get(`${BASE}/patients`, { headers }),
          axios.get(`${BASE}/api/clinics`, { headers }),
          axios.get(`${BASE}/api/taxes`, { headers }),
          axios.get(`${BASE}/bills/${id}`, { headers })
        ]);

        const allTaxes = Array.isArray(taxRes.data) ? taxRes.data : taxRes.data.data || [];
        setAvailableTaxes(allTaxes);
        
        setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data.data || []);
        setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);
        setClinics(Array.isArray(clinicRes.data) ? clinicRes.data : clinicRes.data.clinics || []);

        const bill = billRes.data;
        
        // Normalize Services
        let services = [];
        if (Array.isArray(bill.services)) {
           services = bill.services.map(s => {
             if (typeof s === 'string') return { name: s, category: "Consultation", description: "", amount: 0 };
             return {
               name: s.name || "",
               category: s.category || "Consultation",
               description: s.description || "",
               amount: s.amount || 0
             };
           });
        }
        if (services.length === 0) services.push({ name: "", category: "Consultation", description: "", amount: 0 });

        // Normalize Taxes
        let selectedTaxIds = [];
        if (bill.taxDetails && Array.isArray(bill.taxDetails)) {
           selectedTaxIds = allTaxes
             .filter(t => bill.taxDetails.some(bd => bd.name === t.name && bd.rate === t.taxRate))
             .map(t => t._id);
        }

        // Date
        let formattedDate = "";
        if (bill.date) {
            const d = new Date(bill.date);
            if (!isNaN(d.getTime())) formattedDate = d.toISOString().split("T")[0];
        }

        setForm({
          patientId: bill.patientId?._id || bill.patientId || "",
          patientName: bill.patientName || "",
          doctorId: bill.doctorId?._id || bill.doctorId || "",
          doctorName: bill.doctorName || "",
          clinicId: bill.clinicId?._id || bill.clinicId || "",
          clinicName: bill.clinicName || "",
          encounterId: bill.encounterId || "",
          
          services,
          selectedTaxes: selectedTaxIds,

          subTotal: bill.subTotal || 0,
          taxAmount: bill.taxAmount || 0,
          totalAmount: bill.totalAmount || 0,
          discount: bill.discount || 0,
          paidAmount: bill.paidAmount || 0,
          amountDue: bill.amountDue || 0,

          date: formattedDate,
          time: bill.time || "",
          status: bill.status || "unpaid",
          notes: bill.notes || "",
        });

      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load bill details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // --- 3. Calculations ---
  useEffect(() => {
    if (loading) return;

    const subTotal = form.services.reduce((sum, svc) => sum + (Number(svc.amount) || 0), 0);
    
    let totalTax = 0;
    const taxesToApply = availableTaxes.filter(t => form.selectedTaxes.includes(t._id));
    taxesToApply.forEach(tax => {
      totalTax += (subTotal * (tax.taxRate / 100));
    });

    const discount = Number(form.discount) || 0;
    const totalAmount = subTotal + totalTax - discount;
    const paid = Number(form.paidAmount) || 0;
    const amountDue = Math.max(totalAmount - paid, 0);

    let status = form.status;
    if (paid >= totalAmount && totalAmount > 0) status = "paid";
    else if (paid > 0 && paid < totalAmount) status = "partial";
    else if (paid === 0) status = "unpaid";

    setForm(prev => ({
      ...prev,
      subTotal,
      taxAmount: totalTax,
      totalAmount,
      amountDue,
      status
    }));
  }, [form.services, form.selectedTaxes, form.discount, form.paidAmount, availableTaxes, loading]);


  // --- 4. Handlers ---
  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...form.services];
    updatedServices[index][field] = value;
    setForm(prev => ({ ...prev, services: updatedServices }));
  };

  const addServiceRow = () => {
    setForm(prev => ({
      ...prev,
      services: [...prev.services, { name: "", category: "Consultation", description: "", amount: 0 }]
    }));
  };

  const removeServiceRow = (index) => {
    if (form.services.length > 1) {
       const updatedServices = form.services.filter((_, i) => i !== index);
       setForm(prev => ({ ...prev, services: updatedServices }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const taxDetails = availableTaxes
        .filter(t => form.selectedTaxes.includes(t._id))
        .map(t => ({
          name: t.name,
          rate: t.taxRate,
          amount: (form.subTotal * (t.taxRate / 100))
        }));

      const payload = {
        ...form,
        services: form.services,
        taxDetails,
        clinicId: form.clinicId || null
      };

      await axios.put(`${BASE}/bills/${id}`, payload, { headers });
      toast.success("Bill updated successfully!");
      navigate("/doctor/billing");
    } catch (err) {
      console.error(err);
      toast.error("Error updating bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="text-center p-5">
           <div className="spinner-border text-primary" role="status"></div>
           <p className="mt-2">Loading Bill Details...</p>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout>
      <Toaster position="top-right" />
      <div className="container-fluid py-4">
        
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light rounded-circle shadow-sm border" onClick={() => navigate('/doctor/billing')}>
              <FaArrowLeft className="text-secondary" size={14} />
            </button>
            <h4 className="fw-bold text-primary mb-0">Edit Bill</h4>
          </div>
        </div>

        <div className="card shadow-sm p-4 border-0 rounded-3">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
               
               {/* Doctor (Locked in View usually, but strictly speaking editable by super admin, but here assume consistent) */}
               <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Doctor Name</label>
                  <select name="doctorId" className="form-select" value={form.doctorId} disabled>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>{doc.firstName} {doc.lastName}</option>
                    ))}
                  </select>
               </div>

               {/* Patient (Locked for simplicity or editable?) Editable usually */}
               <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Patient Name</label>
                  <select name="patientId" className="form-select" value={form.patientId} onChange={(e) => setForm({...form, patientId: e.target.value})}>
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
               </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label small fw-bold">Clinic</label>
                   <select name="clinicId" className="form-select" value={form.clinicId} onChange={(e) => setForm({...form, clinicId: e.target.value})}>
                    <option value="">-- Select Clinic --</option>
                    {clinics.map(c => (
                      <option key={c._id} value={c._id}>{c.name || c.clinicName}</option>
                    ))}
                  </select>
               </div>

               {/* Services Section */}
               <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                     <label className="form-label small fw-bold mb-0">Services</label>
                     <button type="button" className="btn btn-sm btn-outline-primary" onClick={addServiceRow}>
                       <FaPlus className="me-1" /> Add Service
                     </button>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                       <thead className="table-light">
                          <tr>
                             <th style={{width: "25%"}}>Service</th>
                             <th style={{width: "20%"}}>Category</th>
                             <th style={{width: "35%"}}>Description</th>
                             <th style={{width: "15%"}}>Amount</th>
                             <th style={{width: "5%"}}></th>
                          </tr>
                       </thead>
                       <tbody>
                          {form.services.map((svc, index) => (
                             <tr key={index}>
                                <td>
                                   <input className="form-control form-control-sm" value={svc.name} onChange={e => handleServiceChange(index, "name", e.target.value)} required />
                                </td>
                                <td>
                                   <select className="form-select form-select-sm" value={svc.category} onChange={e => handleServiceChange(index, "category", e.target.value)}>
                                      {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                   </select>
                                </td>
                                <td>
                                   <input className="form-control form-control-sm" value={svc.description} onChange={e => handleServiceChange(index, "description", e.target.value)} />
                                </td>
                                <td>
                                   <input type="number" className="form-control form-control-sm" value={svc.amount} onChange={e => handleServiceChange(index, "amount", e.target.value)} min="0" required />
                                </td>
                                <td className="text-center">
                                   <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeServiceRow(index)}>
                                      <FaTrash size={12} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>

               {/* Calculations & Taxes */}
               <div className="col-md-6 mt-3">
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
                 ) : <div className="text-muted small">No taxes available.</div>}
                 
                 <div className="mt-3">
                    <label className="form-label small fw-bold">Notes</label>
                    <textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleGenericChange}></textarea>
                 </div>
               </div>

               <div className="col-md-6 mt-3">
                  <div className="card p-3 border-0 bg-light">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span>Sub Total:</span>
                        <span className="fw-bold">₹{Number(form.subTotal).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small">
                        <span>Tax:</span>
                        <span className="text-danger">+ ₹{Number(form.taxAmount).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small align-items-center">
                        <span>Discount:</span>
                        <input type="number" name="discount" className="form-control form-control-sm text-end" style={{width:"80px"}} value={form.discount} onChange={handleGenericChange} />
                     </div>
                     <div className="border-top my-2"></div>
                      <div className="d-flex justify-content-between mb-1 fw-bold">
                        <span>Total:</span>
                        <span className="text-primary">₹{Number(form.totalAmount).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-1 small align-items-center">
                        <span>Paid:</span>
                        <input type="number" name="paidAmount" className="form-control form-control-sm text-end" style={{width:"80px"}} value={form.paidAmount} onChange={handleGenericChange} />
                     </div>
                     <div className="d-flex justify-content-between fw-bold text-danger">
                        <span>Due:</span>
                        <span>₹{Number(form.amountDue).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mt-2 align-items-center">
                        <span className="small">Status:</span>
                        <select name="status" className="form-select form-select-sm" style={{width: "100px"}} value={form.status} onChange={handleGenericChange}>
                           <option value="paid">Paid</option>
                           <option value="unpaid">Unpaid</option>
                           <option value="partial">Partial</option>
                        </select>
                     </div>
                  </div>
               </div>
               
               <div className="col-md-6 mt-3">
                  <label className="form-label small fw-bold">Date</label>
                  <input type="date" name="date" className="form-control" value={form.date} onChange={handleGenericChange} required />
               </div>
                <div className="col-md-6 mt-3">
                  <label className="form-label small fw-bold">Time</label>
                  <input type="text" name="time" className="form-control" value={form.time} onChange={handleGenericChange} />
               </div>

            </div>

            <div className="mt-4 d-flex flex-wrap justify-content-end gap-2">
              <button type="button" className="btn btn-light border px-4" onClick={() => navigate("/doctor/billing")}>Cancel</button>
              <button className="btn btn-primary px-4" disabled={saving}>
                {saving ? "Updating..." : "Update Bill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default EditBill;