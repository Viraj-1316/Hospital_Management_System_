import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast from 'react-hot-toast';
import { FaPlus, FaTrash } from "react-icons/fa";

import API_BASE from "../../config";

const AddBill = () => {
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
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    clinicId: "",
    clinicName: autoClinicName, 
    encounterId: "",
    
    // Services as array of objects
    services: [
      { name: "", category: "Consultation", description: "", amount: 0 }
    ],

    // Tax Selection
    selectedTaxes: [], // IDs of selected taxes

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
  });

  // --- Data States ---
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [availableTaxes, setAvailableTaxes] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [saving, setSaving] = useState(false);

  // Categories for services
  const serviceCategories = [
    "Consultation",
    "Laboratory",
    "Radiology",
    "Pharmacy",
    "Procedure",
    "Other"
  ];

  // --- 2. Fetch Initial Dropdown Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [docRes, patRes, clinicRes, taxRes, servRes] = await Promise.all([
          axios.get(`${API_BASE}/doctors`, { headers: authHeaders }),
          axios.get(`${API_BASE}/patients`, { headers: authHeaders }),
          axios.get(`${API_BASE}/api/clinics`, { headers: authHeaders }),
          axios.get(`${API_BASE}/api/taxes`, { headers: authHeaders }),
          axios.get(`${API_BASE}/services`, { headers: authHeaders })
        ]);

        const allDoctors = Array.isArray(docRes.data) ? docRes.data : docRes.data.doctors || docRes.data.data || [];
        const allPatients = Array.isArray(patRes.data) ? patRes.data : patRes.data.patients || patRes.data.data || [];
        const allTaxes = Array.isArray(taxRes.data) ? taxRes.data : taxRes.data.data || [];
        const allServices = Array.isArray(servRes.data) ? servRes.data : servRes.data.rows || servRes.data.data || [];

        setDoctors(allDoctors);
        setPatients(allPatients);
        setAvailableTaxes(allTaxes.filter(t => t.active !== false));
        setAvailableServices(allServices);

        const cData = Array.isArray(clinicRes.data) ? clinicRes.data : clinicRes.data.clinics || [];
        setClinics(cData);

        if (autoClinicName) {
          const matchedClinic = cData.find(c =>
            (c.name || c.clinicName || "").toLowerCase() === autoClinicName.toLowerCase()
          );
          if (matchedClinic) {
            setForm(prev => ({ ...prev, clinicId: matchedClinic._id, clinicName: autoClinicName }));
          }
        }

      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load dropdown data");
      }
    };
    fetchData();
  }, [autoClinicName]);

  // --- 3. Fetch Encounters (filtered by patient) ---
  useEffect(() => {
    if (form.patientId) {
      const token = localStorage.getItem("token");
      axios.get(`${API_BASE}/encounters?patientId=${form.patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data.encounters || [];
          setEncounters(data);
        })
        .catch(err => {
          console.error("Error fetching encounters:", err);
          setEncounters([]);
        });
    } else {
      setEncounters([]);
      setForm(prev => ({ ...prev, encounterId: "", doctorId: "", doctorName: "" }));
    }
  }, [form.patientId]);

  // --- 3b. Auto-populate when Encounter is Selected ---
  const handleEncounterChange = (e) => {
    const selectedId = e.target.value;
    setForm(prev => ({ ...prev, encounterId: selectedId }));

    if (selectedId) {
      const selectedEnc = encounters.find(enc => enc._id === selectedId);
      if (selectedEnc) {
        // Auto-select doctor from encounter
        const encDoctor = doctors.find(d => d._id === (selectedEnc.doctorId?._id || selectedEnc.doctorId));
        if (encDoctor) {
          setForm(prev => ({
            ...prev,
            doctorId: encDoctor._id,
            doctorName: `${encDoctor.firstName} ${encDoctor.lastName}`
          }));
        }

        // Auto-populate prescriptions/services from encounter if they exist
        if (selectedEnc.prescriptions && selectedEnc.prescriptions.length > 0) {
          const encounterServices = selectedEnc.prescriptions.map(p => ({
            name: p.name || "Prescription",
            category: "Pharmacy",
            description: `${p.frequency || ""} - ${p.duration || ""} ${p.instruction || ""}`.trim(),
            amount: 0  // Amount needs to be set manually
          }));
          setForm(prev => ({ ...prev, services: encounterServices.length > 0 ? encounterServices : [{ name: "", category: "Consultation", description: "", amount: 0 }] }));
        }
      }
    }
  };

  // --- 4. Calculations ---
  useEffect(() => {
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

    // Auto-update status based on payment
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

  }, [form.services, form.selectedTaxes, form.discount, form.paidAmount, availableTaxes]);

  // --- 5. Handlers ---

  const handleDoctorChange = (e) => {
    const selectedId = e.target.value;
    const selectedObj = doctors.find(d => d._id === selectedId);
    setForm(prev => ({
      ...prev,
      doctorId: selectedId,
      doctorName: selectedObj ? `${selectedObj.firstName} ${selectedObj.lastName}` : ""
    }));
  };

  const handlePatientChange = (e) => {
    const selectedId = e.target.value;
    const selectedObj = patients.find(p => p._id === selectedId);
    setForm(prev => ({
      ...prev,
      patientId: selectedId,
      patientName: selectedObj ? `${selectedObj.firstName} ${selectedObj.lastName}` : "",
      encounterId: ""
    }));
  };

  const handleClinicChange = (e) => {
    const selectedId = e.target.value;
    const selectedObj = clinics.find(c => c._id === selectedId);
    if (selectedObj) {
      setForm(prev => ({
        ...prev,
        clinicId: selectedId,
        clinicName: selectedObj.name || selectedObj.clinicName || ""
      }));
    } else {
      setForm(prev => ({ ...prev, clinicId: "", clinicName: "" }));
    }
  };

  // Service Handlers
  const handleServiceSelect = (index, value) => {
    const updatedServices = [...form.services];
    // If "custom", set name to "custom" flag true, but value to empty or temp
    if (value === "custom") {
       updatedServices[index] = { ...updatedServices[index], name: "custom", isCustom: true, amount: 0 };
    } else {
       const svcObj = availableServices.find(s => s.name === value);
       updatedServices[index] = { 
         ...updatedServices[index], 
         name: value, 
         isCustom: false,
         category: svcObj ? svcObj.category || "Consultation" : "Consultation",
         description: svcObj ? svcObj.description || "" : "",
         amount: svcObj ? svcObj.charges || 0 : 0
       };
    }
    setForm(prev => ({ ...prev, services: updatedServices }));
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

  // Tax Handler
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

  // --- 6. Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId) return toast.error("Please select a Patient");
    if (!form.encounterId) return toast.error("Please select an Encounter (required for billing)");
    if (!form.doctorId) return toast.error("Please select a Doctor");
    if (!form.clinicId) return toast.error("Please select a Clinic");

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Prepare tax details object
      const taxDetails = availableTaxes
        .filter(t => form.selectedTaxes.includes(t._id))
        .map(t => ({
          name: t.name,
          rate: t.taxRate,
          amount: (form.subTotal * (t.taxRate / 100))
        }));

      const payload = {
        ...form,
        services: form.services, // Already objects
        taxDetails,
        clinicId: form.clinicId || null
      };

      await axios.post(`${API_BASE}/bills`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Bill created successfully!");
      navigate("/clinic-dashboard/BillingRecords");
    } catch (err) {
      console.error(err);
      toast.error("Error creating bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid pb-5">
        <h4 className="fw-bold text-primary mb-4">Add New Bill</h4>

        <div className="card shadow-sm p-4">
          <form onSubmit={handleSubmit}>
            
            {/* 1. Patient & Doctor Info */}
            <div className="row mb-4">
              <h5 className="mb-3 text-secondary">Patient & Doctor</h5>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Doctor Name <span className="text-danger">*</span></label>
                <select name="doctorId" className="form-select" value={form.doctorId} onChange={handleDoctorChange} required>
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.firstName} {doc.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Patient Name <span className="text-danger">*</span></label>
                <select name="patientId" className="form-select" value={form.patientId} onChange={handlePatientChange} required>
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Clinic <span className="text-danger">*</span></label>
                {autoClinicName ? (
                  <input className="form-control bg-light" value={autoClinicName} readOnly />
                ) : (
                  <select name="clinicId" className="form-select" value={form.clinicId} onChange={handleClinicChange} required>
                    <option value="">-- Select Clinic --</option>
                    {clinics.map(c => <option key={c._id} value={c._id}>{c.name || c.clinicName}</option>)}
                  </select>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Encounter <span className="text-danger">*</span></label>
                <select 
                  name="encounterId" 
                  className="form-select" 
                  value={form.encounterId} 
                  onChange={handleEncounterChange} 
                  disabled={!form.patientId}
                  required
                >
                  <option value="">-- Select Encounter --</option>
                  {encounters.map(enc => (
                    <option key={enc._id} value={enc._id}>
                      {new Date(enc.date).toLocaleDateString()} - {enc.encounterId || enc._id.slice(-6)}
                      {enc.description ? ` (${enc.description.substring(0, 30)}...)` : ""}
                    </option>
                  ))}
                </select>
                {!form.patientId && <small className="text-muted">Select a patient first to see encounters</small>}
              </div>
            </div>

            <hr />

            {/* 2. Services */}
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
                          <div className="input-group">
                            <select 
                              className="form-select"
                              value={svc.name}
                              onChange={e => handleServiceSelect(index, e.target.value)}
                            >
                              <option value="">-- Select --</option>
                              {/* Show custom option if current name not in list */}
                              {svc.name && !availableServices.find(s => s.name === svc.name) && (
                                <option value={svc.name}>{svc.name}</option>
                              )}
                              {availableServices.map(s => (
                                <option key={s._id} value={s.name}>
                                  {s.name} (₹{s.charges})
                                </option>
                              ))}
                              <option value="custom">Other (Type Custom)</option>
                            </select>
                            {/* Allow custom input if needed or if "custom" selected (simplified here to just text input if manual override desired, but let's stick to select for now or hybrid) */}
                          </div>
                          {/* Fallback to text input if they want to edit name manually after selection? 
                              For now, let's keep it simple: Select populates, then fields are editable. 
                              But if they want a NEW service not in list? 
                              Let's add a "Other" logic or just allow editing the name? 
                              Actually, simplest is: Select changes all fields. If they type in name, it's custom.
                              But Select doesn't allow typing. 
                              Let's stick to Select. If they want custom, they can select "Other" (blank) and type?
                              Let's add a toggle or just a free text input below?
                              Actually, standard pattern: 
                              Select (onChange fills details).
                              If user wants custom, they can just type in the input? But input is replaced by Select.
                              Let's make it a Select AND an Input if "Other"?
                              Or just a Select that fills row, but fields remain editable?
                              Let's use a datalist? Or just Select.
                              For this iteration, I will use a Select. If they select "custom", I'll show an input.
                          */}
                          {svc.isCustom && (
                             <input 
                               className="form-control mt-1"
                               placeholder="Type custom service name"
                               value={svc.name === "custom" ? "" : svc.name}
                               onChange={e => handleServiceChange(index, "name", e.target.value)}
                             />
                          )}
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
                            placeholder="Additional details..."
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
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeServiceRow(index)}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <hr />

            {/* 3. Totals & Payment */}
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
                ) : (
                  <p className="text-muted fst-italic">No taxes configured.</p>
                )}
                
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
                    <span className="fw-bold">₹{form.subTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax Amount:</span>
                    <span className="text-danger">+ ₹{form.taxAmount.toFixed(2)}</span>
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
                    <span className="h5 text-primary">₹{form.totalAmount.toFixed(2)}</span>
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
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bold">Amount Due:</span>
                    <span className="fw-bold text-danger">₹{form.amountDue.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
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
                {saving ? "Creating..." : "Create Bill"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddBill;
