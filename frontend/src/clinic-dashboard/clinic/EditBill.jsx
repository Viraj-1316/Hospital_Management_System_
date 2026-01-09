import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast from 'react-hot-toast';
import { FaPlus, FaTrash } from "react-icons/fa";

import API_BASE from "../../config";

const EditBill = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get clinic info from localStorage for auto-detecting clinic
  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (e) {
    authUser = {};
  }
  const autoClinicName = authUser?.clinicName || "";

  // --- 1. Form State ---
  const [form, setForm] = useState({
    doctorId: "",
    doctorName: "",
    clinicId: "",
    clinicName: autoClinicName,
    patientId: "",
    patientName: "",
    encounterId: "",
    
    // Services as array of objects
    services: [
      { name: "", category: "Consultation", description: "", amount: 0 }
    ],

    // Tax Selection
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
    paymentMethod: "",  // Payment mode for Razorpay integration
  });

  // --- Data States ---
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [availableTaxes, setAvailableTaxes] = useState([]);
  const [encounters, setEncounters] = useState([]); // Just for display if needed, though we might not change it heavily
  
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
        const token = localStorage.getItem("token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [docRes, patRes, clinicRes, taxRes, billRes] = await Promise.all([
          axios.get(`${API_BASE}/doctors`, { headers: authHeaders }),
          axios.get(`${API_BASE}/patients`, { headers: authHeaders }),
          axios.get(`${API_BASE}/api/clinics`, { headers: authHeaders }),
          axios.get(`${API_BASE}/api/taxes`, { headers: authHeaders }),
          axios.get(`${API_BASE}/bills/${id}`, { headers: authHeaders }),
        ]);

        const allDoctors = Array.isArray(docRes.data) ? docRes.data : docRes.data.data || [];
        const allPatients = Array.isArray(patRes.data) ? patRes.data : patRes.data.data || [];
        const allTaxes = Array.isArray(taxRes.data) ? taxRes.data : taxRes.data.data || [];
        const cData = Array.isArray(clinicRes.data) ? clinicRes.data : clinicRes.data.clinics || [];

        setDoctors(allDoctors);
        setPatients(allPatients);
        setClinics(cData);
        setAvailableTaxes(allTaxes);

        const bill = billRes.data;

        // Normalize services
        let services = [];
        if (Array.isArray(bill.services)) {
          services = bill.services.map(s => {
            if (typeof s === "string") {
              return { name: s, category: "Consultation", description: "", amount: 0 };
            }
            return {
              name: s.name || "",
              category: s.category || "Consultation",
              description: s.description || "",
              amount: s.amount || 0
            };
          });
        }
        if (services.length === 0) {
           services.push({ name: "", category: "Consultation", description: "", amount: 0 });
        }

        // Match selected taxes
        // We match by name AND rate if possible, or just assume manual checking
        // For now, let's try to match existing taxes in DB
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
          doctorId: bill.doctorId?._id || bill.doctorId || "", // Handle populated or raw ID
          doctorName: bill.doctorName || "", // Fallback
          clinicId: bill.clinicId?._id || bill.clinicId || "",
          clinicName: bill.clinicName || autoClinicName,
          patientId: bill.patientId?._id || bill.patientId || "",
          patientName: bill.patientName || "",
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
          paymentMethod: bill.paymentMethod || "",
        });

      } catch (err) {
        console.error(err);
        toast.error("Error loading bill data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, autoClinicName]);


  // --- 3. Calculations (Same as AddBill) ---
  useEffect(() => {
    if (loading) return; 

    // 1. Calculate SubTotal
    const subTotal = form.services.reduce((sum, svc) => sum + (Number(svc.amount) || 0), 0);

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

    // Auto-update status
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

  const handleDoctorChange = (e) => {
     setForm(prev => ({ ...prev, doctorId: e.target.value }));
  };
  
  const handlePatientChange = (e) => {
     setForm(prev => ({ ...prev, patientId: e.target.value }));
  };

  // --- 5. Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // Prepare tax details
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
        taxDetails
      };

      await axios.put(`${API_BASE}/bills/${id}`, payload, { headers: authHeaders });
      toast.success("Bill updated successfully!");
      navigate("/clinic-dashboard/BillingRecords");
    } catch (err) {
      console.error(err);
      toast.error("Error updating bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid text-center p-5">
           <div className="spinner-border text-primary" role="status"></div>
           <p className="mt-2">Loading Bill...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid pb-5">
        <h4 className="fw-bold text-primary mb-4">Edit Bill</h4>

        <div className="card shadow-sm p-4">
          <form onSubmit={handleSubmit}>
            
            <div className="row mb-4">
               {/* Doctor */}
               <div className="col-md-6 mb-3">
                <label className="form-label">Doctor Name</label>
                <select name="doctorId" className="form-select" value={form.doctorId} onChange={handleDoctorChange}>
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.firstName} {doc.lastName}</option>
                  ))}
                </select>
              </div>

               {/* Patient */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Patient Name</label>
                <select name="patientId" className="form-select" value={form.patientId} onChange={handlePatientChange}>
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Clinic - Read Only */}
               <div className="col-md-6 mb-3">
                <label className="form-label">Clinic</label>
                <input className="form-control bg-light" value={form.clinicName} readOnly />
               </div>
               
               <div className="col-md-6 mb-3">
                 <label className="form-label">Bill Number</label>
                 <div className="form-control bg-light">
                   {/* We don't have bill number in state but it's fine, fetch it if needed or just don't show explicitly if not in requirement */ }
                   Currently Editing
                 </div>
               </div>
            </div>

            <hr />

            {/* Services Table */}
            <div className="row mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-secondary mb-0">Services</h5>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addServiceRow}>
                  <FaPlus className="me-1" /> Add Service
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: "25%"}}>Service Name</th>
                      <th style={{width: "15%"}}>Category</th>
                      <th style={{width: "40%"}}>Description</th>
                      <th style={{width: "15%"}}>Amount (₹)</th>
                      <th style={{width: "5%"}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.services.map((svc, index) => (
                      <tr key={index}>
                        <td>
                          <input 
                            className="form-control" 
                            value={svc.name} 
                            onChange={e => handleServiceChange(index, "name", e.target.value)}
                            placeholder="Service Name"
                            required
                          />
                        </td>
                        <td>
                          <select 
                            className="form-select" 
                            value={svc.category} 
                            onChange={e => handleServiceChange(index, "category", e.target.value)}
                          >
                             {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td>
                          <input 
                            className="form-control" 
                            value={svc.description} 
                            onChange={e => handleServiceChange(index, "description", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={svc.amount} 
                            onChange={e => handleServiceChange(index, "amount", e.target.value)}
                            min="0"
                            required
                          />
                        </td>
                        <td className="text-center">
                          {form.services.length > 1 && (
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeServiceRow(index)}>
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <hr />

            {/* Totals & Tax */}
            <div className="row mb-4">
               <div className="col-md-6">
                 <h5 className="text-secondary mb-3">Tax Selection</h5>
                 {availableTaxes.length > 0 ? (
                  <div className="card p-3 border-0 bg-light">
                    {availableTaxes.map(tax => (
                      <div className="form-check mb-2" key={tax._id}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`tax-${tax._id}`}
                          checked={form.selectedTaxes.includes(tax._id)}
                          onChange={() => toggleTax(tax._id)}
                        />
                        <label className="form-check-label d-flex justify-content-between" htmlFor={`tax-${tax._id}`}>
                          <span>{tax.name}</span>
                          <span className="fw-bold">{tax.taxRate}%</span>
                        </label>
                      </div>
                    ))}
                  </div>
                 ) :  <p className="text-muted fst-italic">No taxes configured.</p> }

                 <div className="mt-4">
                   <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={form.notes}
                      onChange={handleGenericChange}
                    ></textarea>
                </div>
               </div>

               <div className="col-md-6">
                  <div className="card border-0 bg-light p-4">
                     <div className="d-flex justify-content-between mb-2">
                        <span>Sub Total:</span>
                        <span className="fw-bold">₹{Number(form.subTotal).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between mb-2">
                        <span>Tax Amount:</span>
                        <span className="text-danger">+ ₹{Number(form.taxAmount).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Discount:</span>
                        <div className="input-group input-group-sm" style={{width: "120px"}}>
                          <span className="input-group-text">₹</span>
                          <input 
                            type="number" 
                            name="discount" 
                            className="form-control text-end"
                            value={form.discount} 
                            onChange={handleGenericChange}
                          />
                        </div>
                     </div>
                     <div className="border-top my-2"></div>
                     <div className="d-flex justify-content-between mb-3">
                        <span className="h5">Total Amount:</span>
                        <span className="h5 text-primary">₹{Number(form.totalAmount).toFixed(2)}</span>
                     </div>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold">Paid Amount:</span>
                        <div className="input-group input-group-sm" style={{width: "150px"}}>
                          <span className="input-group-text">₹</span>
                          <input 
                            type="number" 
                            name="paidAmount" 
                            className="form-control text-end fw-bold"
                            value={form.paidAmount} 
                            onChange={handleGenericChange}
                          />
                        </div>
                     </div>
                     <div className="d-flex justify-content-between mb-3">
                        <span className="fw-bold">Amount Due:</span>
                        <span className="fw-bold text-danger">₹{Number(form.amountDue).toFixed(2)}</span>
                     </div>
                     
                     {/* Payment Mode */}
                     <div className="d-flex justify-content-between align-items-center mt-2">
                        <span>Payment Mode:</span>
                        <select name="paymentMethod" className="form-select form-select-sm" style={{width: "130px"}} value={form.paymentMethod} onChange={handleGenericChange}>
                           <option value="">-- Select --</option>
                           <option value="Cash">Cash</option>
                           <option value="Online">Online (Razorpay)</option>
                        </select>
                     </div>
                     {form.paymentMethod === "Online" && (
                       <small className="text-info d-block mt-1">Patient can pay online via Razorpay</small>
                     )}
                     
                     <div className="d-flex justify-content-between align-items-center mt-2">
                        <span>Status:</span>
                         <span className={`badge bg-${form.status === 'paid' ? 'success' : form.status === 'partial' ? 'warning' : 'danger'}`}>
                            {form.status.toUpperCase()}
                         </span>
                     </div>
                  </div>

                  <div className="row mt-3">
                   <div className="col-md-6">
                      <label className="form-label">Date</label>
                      <input type="date" name="date" className="form-control" value={form.date} onChange={handleGenericChange} required />
                   </div>
                   <div className="col-md-6">
                      <label className="form-label">Time</label>
                      <input type="text" name="time" className="form-control" value={form.time} onChange={handleGenericChange} />
                   </div>
                </div>
               </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={() => navigate("/clinic-dashboard/BillingRecords")}
              >
                Cancel
              </button>
              <button className="btn btn-primary px-4" disabled={saving}>
                {saving ? "Updating..." : "Update Bill"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditBill;
