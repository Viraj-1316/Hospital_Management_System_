import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast from 'react-hot-toast';

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
    clinicName: autoClinicName, // Auto-fill with clinic name
    encounterId: "",
    services: "",
    totalAmount: "",
    discount: "0",
    amountDue: "",
    date: new Date().toISOString().split("T")[0],
    status: "unpaid",
    notes: "",
  });

  // --- Data States ---
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [saving, setSaving] = useState(false);

  // --- 2. Fetch Initial Dropdown Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, patRes, clinicRes] = await Promise.all([
          axios.get(`${API_BASE}/doctors`),
          axios.get(`${API_BASE}/patients`),
          axios.get(`${API_BASE}/api/clinics`)
        ]);

        // Normalize Data
        const allDoctors = Array.isArray(docRes.data) ? docRes.data : docRes.data.data || [];
        const allPatients = Array.isArray(patRes.data) ? patRes.data : patRes.data.data || [];
        
        // Filter doctors and patients by clinic
        const filteredDoctors = autoClinicName 
          ? allDoctors.filter(d => (d.clinic || "").toLowerCase() === autoClinicName.toLowerCase())
          : allDoctors;
        const filteredPatients = autoClinicName 
          ? allPatients.filter(p => (p.clinic || "").toLowerCase() === autoClinicName.toLowerCase())
          : allPatients;
        
        setDoctors(filteredDoctors);
        setPatients(filteredPatients);

        // Handle Clinic Response
        const cData = Array.isArray(clinicRes.data)
          ? clinicRes.data
          : clinicRes.data.clinics || [];

        setClinics(cData);
        
        // Find and set clinic ID for auto-detected clinic
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

  // --- 3. Fetch Encounters (Server-Side Filter) ---
  useEffect(() => {
    if (form.patientId) {
      axios.get(`${API_BASE}/encounters?patientId=${form.patientId}`)
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
      setForm(prev => ({ ...prev, encounterId: "" }));
    }
  }, [form.patientId]);

  // --- 4. Change Handlers ---

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

  // ✅ FIXED: Clinic Selection Logic
  const handleClinicChange = (e) => {
    const selectedId = e.target.value;
    const selectedObj = clinics.find(c => c._id === selectedId);

    if (selectedObj) {
      // Auto-fill the clinic name based on selection
      setForm(prev => ({
        ...prev,
        clinicId: selectedId,
        clinicName: selectedObj.name || selectedObj.clinicName || ""
      }));
    } else {
      setForm(prev => ({ ...prev, clinicId: "", clinicName: "" }));
    }
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

  // --- 5. Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.doctorId) return toast.error("Please select a Doctor");
    if (!form.patientId) return toast.error("Please select a Patient");
    if (!form.clinicId) return toast.error("Please select a Clinic");

    try {
      setSaving(true);

      const payload = {
        ...form,
        services: form.services.split(",").map(s => s.trim()),
        clinicId: form.clinicId || null
      };

      await axios.post(`${API_BASE}/bills`, payload);
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
      <div className="container-fluid">
        <h4 className="fw-bold text-primary mb-4">Add New Bill</h4>

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

              {/* Clinic Name - Auto-detected for clinic dashboard */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Clinic Name {autoClinicName ? "(Auto-detected)" : ""}<span className="text-danger">*</span></label>
                {autoClinicName ? (
                  <input
                    className="form-control bg-light"
                    value={autoClinicName}
                    readOnly
                  />
                ) : (
                  <select
                    name="clinicId"
                    className="form-select"
                    value={form.clinicId}
                    onChange={handleClinicChange}
                    required
                  >
                    <option value="">-- Select Clinic --</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name || c.clinicName || "Unnamed Clinic"}
                      </option>
                    ))}
                  </select>
                )}
                {!autoClinicName && clinics.length === 0 && (
                  <small className="text-danger">No clinics found. Please add a clinic first.</small>
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
                    <option key={enc._id} value={enc._id}>
                      {new Date(enc.date).toLocaleDateString()} (ID: {enc.encounterId || enc._id})
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
              {saving ? "Saving..." : "Create Bill"}
            </button>

            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => navigate("/clinic-dashboard/BillingRecords")}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddBill;