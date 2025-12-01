import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/DoctorLayout"
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast from 'react-hot-toast';
import API_BASE from "../../config";

const BASE = API_BASE;

const EditBill = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get Bill ID from URL

  // --- 1. Form State ---
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    clinicId: "",
    clinicName: "",
    encounterId: "",
    services: "",
    totalAmount: "",
    discount: "0",
    amountDue: "",
    date: "",
    status: "",
    notes: "",
  });

  // --- Data States ---
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 2. Fetch Initial Data (Dropdowns + Bill Details) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Dropdown Options
        const [docRes, patRes, clinicRes] = await Promise.all([
          axios.get(`${BASE}/doctors`),
          axios.get(`${BASE}/patients`),
          axios.get(`${BASE}/api/clinics`)
        ]);

        setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data.data || []);
        setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.data || []);
        
        const cData = Array.isArray(clinicRes.data) 
            ? clinicRes.data 
            : clinicRes.data.clinics || [];
        setClinics(cData);

        // 2. Fetch The Bill to Edit
        const billRes = await axios.get(`${BASE}/bills/${id}`);
        const bill = billRes.data;

        if (bill) {
            // 3. Format Data for Form
            setForm({
                ...bill,
                // Ensure date is YYYY-MM-DD for input type="date"
                date: bill.date ? new Date(bill.date).toISOString().split("T")[0] : "",
                // Convert array ["Xray", "Consult"] -> String "Xray, Consult"
                services: Array.isArray(bill.services) ? bill.services.join(", ") : bill.services || "",
                // Ensure IDs are present (sometimes mongo returns object, ensure string)
                patientId: bill.patientId || "",
                doctorId: bill.doctorId || "",
                clinicId: bill.clinicId || "",
                encounterId: bill.encounterId || ""
            });

            // 4. Fetch Encounters for this patient immediately
            if (bill.patientId) {
                fetchEncounters(bill.patientId);
            }
        }

      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load bill details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Helper to fetch encounters
  const fetchEncounters = (patientId) => {
    axios.get(`${BASE}/encounters?patientId=${patientId}`)
    .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.encounters || [];
        setEncounters(data);
    })
    .catch(() => setEncounters([]));
  };

  // --- 3. Change Handlers ---

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
    
    // Fetch new encounters when patient changes
    fetchEncounters(selectedId);

    setForm(prev => ({
      ...prev,
      patientId: selectedId,
      patientName: selectedObj ? `${selectedObj.firstName} ${selectedObj.lastName}` : "",
      encounterId: "" // Reset encounter
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

  const handleManualClinicChange = (e) => {
      setForm(prev => ({ ...prev, clinicName: e.target.value }));
  };

  const handleGenericChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    // Auto-calculate Amount Due
    if (name === "totalAmount" || name === "discount") {
      const total = Number(name === "totalAmount" ? value : updatedForm.totalAmount);
      const discount = Number(name === "discount" ? value : updatedForm.discount);
      updatedForm.amountDue = Math.max(total - discount, 0);
    }

    setForm(updatedForm);
  };

  // --- 4. Submit Handler (PUT Request) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        // Convert string "A, B" -> Array ["A", "B"]
        services: form.services.split(",").map(s => s.trim()), 
        clinicId: form.clinicId || null 
      };

      await axios.put(`${BASE}/bills/${id}`, payload);
      toast.success("Bill updated successfully!");
      navigate("/BillingRecords");
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
            <div className="text-center p-5">Loading Bill Details...</div>
        </AdminLayout>
      )
  }

  return (
    <AdminLayout>
      <div className="container-fluid">
        <h4 className="fw-bold text-primary mb-4">Edit Bill</h4>

        <div className="card shadow-sm p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              
              {/* Doctor */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Doctor Name <span className="text-danger">*</span></label>
                <select
                  name="doctorId"
                  className="form-select"
                  value={form.doctorId}
                  onChange={handleDoctorChange}
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.firstName} {doc.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Patient Name <span className="text-danger">*</span></label>
                <select
                  name="patientId"
                  className="form-select"
                  value={form.patientId}
                  onChange={handlePatientChange}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinic */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Clinic Name <span className="text-danger">*</span></label>
                {clinics.length > 0 ? (
                    <select 
                        name="clinicId"
                        className="form-select" 
                        value={form.clinicId} 
                        onChange={handleClinicChange} 
                        required
                    >
                        <option value="">-- Select Clinic --</option>
                        {clinics.map((c) => (
                            <option key={c._id} value={c._id}>{c.name || c.clinicName}</option>
                        ))}
                    </select>
                ) : (
                    <input
                      name="clinicName"
                      className="form-control"
                      value={form.clinicName}
                      onChange={handleManualClinicChange}
                      placeholder="Enter Clinic Name"
                      required
                    />
                )}
              </div>

              {/* Encounter */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Link Encounter (Optional)</label>
                <select
                  name="encounterId"
                  className="form-select"
                  value={form.encounterId}
                  onChange={handleGenericChange}
                  disabled={!form.patientId}
                >
                  <option value="">-- Select Encounter --</option>
                  {encounters.map((enc) => (
                    <option key={enc._id} value={enc.encounterId || enc._id}>
                      {new Date(enc.date).toLocaleDateString()} (ID: {enc.encounterId || "Pending"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Services */}
              <div className="col-md-12 mb-3">
                <label className="form-label">Services (comma separated)</label>
                <input
                  name="services"
                  className="form-control"
                  value={form.services}
                  onChange={handleGenericChange}
                  placeholder="Consultation, X-Ray"
                />
              </div>

              {/* Amounts */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Total Amount (₹) <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="totalAmount"
                  className="form-control"
                  value={form.totalAmount}
                  onChange={handleGenericChange}
                  required
                />
              </div>

              {/* Discount */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Discount (₹)</label>
                <input
                  type="number"
                  name="discount"
                  className="form-control"
                  value={form.discount}
                  onChange={handleGenericChange}
                />
              </div>

              {/* Amount Due */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Amount Due (₹)</label>
                <input
                  type="number"
                  className="form-control bg-light"
                  value={form.amountDue}
                  readOnly
                />
              </div>

              {/* Date & Status */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={form.date}
                  onChange={handleGenericChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleGenericChange}
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              {/* Notes */}
              <div className="col-md-12 mb-3">
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

            <button className="btn btn-primary px-4" disabled={saving}>
              {saving ? "Updating..." : "Update Bill"}
            </button>

            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => navigate("/BillingRecords")}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditBill;