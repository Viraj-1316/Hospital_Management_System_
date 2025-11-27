import React, { useEffect, useState } from "react";
import axios from "axios";
import PatientLayout from "../layouts/PatientLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

// Use 127.0.0.1 to prevent connection refused errors
const API_BASE = "http://127.0.0.1:3001";

export default function PatientBookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Auth & Patient Logic ---
  const storedPatient = (() => {
    try {
      const p = localStorage.getItem("patient");
      if (p) return JSON.parse(p);
      const a = localStorage.getItem("authUser");
      if (a) return JSON.parse(a);
      return null;
    } catch { return null; }
  })();

  const patientName = storedPatient?.name || (storedPatient?.firstName ? `${storedPatient.firstName} ${storedPatient.lastName || ""}`.trim() : "") || "Patient";
  const params = new URLSearchParams(location.search);
  const preselectedDate = params.get("date") || "";

  // --- State ---
  const [clinics, setClinics] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  const [allServices, setAllServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    clinic: "",
    doctor: "",
    doctorLabel: "",
    date: preselectedDate,
    patient: patientName,
    status: "booked",
  });

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoadingData(true);
        console.log("🚀 Fetching booking data...");

        // A. Fetch Clinics
        const clinicRes = await axios.get(`${API_BASE}/api/clinics`);
        const clinicData = Array.isArray(clinicRes.data)
          ? clinicRes.data
          : (clinicRes.data?.data || clinicRes.data?.clinics || []);

        // B. Fetch Doctors
        const docRes = await axios.get(`${API_BASE}/doctors`);
        const docData = Array.isArray(docRes.data)
          ? docRes.data
          : (docRes.data?.data || docRes.data?.doctors || []);

        // C. Fetch Services
        const servRes = await axios.get(`${API_BASE}/services`);
        const servData = Array.isArray(servRes.data)
          ? servRes.data
          : (servRes.data?.data || servRes.data?.services || servRes.data?.rows || []);

        if (mounted) {
          setClinics(clinicData);
          setAllDoctors(docData);

          // --- UPDATED MAPPING LOGIC ---
          setAllServices(servData.map(s => {
            // Log specific item if name is missing to help debug
            if (!s.name) console.warn("Service missing name:", s);

            return {
              id: s._id || s.id,
              // Fallback chain: Try 'name', then 'serviceName', then 'serviceId', then 'Unknown'
              name: s.name || s.serviceName || s.serviceId,
              price: s.charges || s.price || 0,
              doctorName: s.doctor || ""
            };
          }));
        }
      } catch (err) {
        console.error("❌ Error loading data:", err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  // --- 2. Filter Doctors when Clinic Changes ---
  useEffect(() => {
    if (form.clinic) {
      const filtered = allDoctors.filter(d =>
        (d.clinic || "").toLowerCase() === form.clinic.toLowerCase()
      );
      setAvailableDoctors(filtered);
    } else {
      setAvailableDoctors([]);
    }
  }, [form.clinic, allDoctors]);

  // --- 3. Handle Slots & Services when Doctor/Date Changes ---
  useEffect(() => {

    if (form.doctor) {
      const docObj = allDoctors.find(d => (d._id || d.id) === form.doctor);
      const docName = docObj ? `${docObj.firstName} ${docObj.lastName}` : "";

      // Filter services: Doctor match OR Generic services
      const filteredServices = allServices.filter(s => {
        if (!s.doctorName) return true;
        const sDoc = s.doctorName.toLowerCase();
        const dName = docName.toLowerCase();
        return sDoc.includes(dName) || dName.includes(sDoc);
      });

      setAvailableServices(filteredServices);
      setSelectedServices([]);
    } else {
      setAvailableServices([]);
    }

    // B. FETCH SLOTS LOGIC
    const fetchSlots = async () => {
      if (form.doctor && form.date) {
        setLoadingSlots(true);
        setSelectedSlot("");
        try {
          const res = await axios.get(`${API_BASE}/doctor-sessions/available-slots`, {
            params: { doctorId: form.doctor, date: form.date }
          });
          setDynamicSlots(res.data || []);
        } catch (err) {
          console.error("Error fetching slots:", err);
          setDynamicSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setDynamicSlots([]);
      }
    };

    fetchSlots();

  }, [form.doctor, form.date, allDoctors, allServices]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "clinic") {
      setForm(prev => ({ ...prev, clinic: value, doctor: "", doctorLabel: "" }));
    } else if (name === "doctor") {
      const docObj = allDoctors.find(d => (d._id || d.id) === value);
      const label = docObj ? `${docObj.firstName} ${docObj.lastName}` : "";
      setForm(prev => ({ ...prev, doctor: value, doctorLabel: label }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleService = (id) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const selectedServiceDetails = selectedServices
    .map(id => allServices.find(s => s.id === id))
    .filter(Boolean);

  const totalAmount = selectedServiceDetails.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clinic || !form.doctor || !form.date || !selectedSlot || selectedServices.length === 0) {
      alert("Please complete all required fields (*).");
      return;
    }

    setSubmitting(true);
    try {
      const servicesNames = selectedServiceDetails.map((s) => s.name).join(", ");
      const servicesDetailText = selectedServiceDetails.map((s) => `${s.name} - ₹${s.price}`).join(" | ");

      let stored = null;
      try { stored = JSON.parse(localStorage.getItem("patient") || localStorage.getItem("authUser")); } catch { }

      const payload = {
        patientId: stored?.id || stored?._id || null,
        patientName: form.patient,
        patientEmail: stored?.email || "",
        patientPhone: stored?.phone || "",
        doctorId: form.doctor,
        doctorName: form.doctorLabel,
        clinic: form.clinic,
        date: form.date,
        time: selectedSlot,
        services: servicesNames,
        status: "booked",
        servicesDetail: servicesDetailText,
        charges: totalAmount,
        paymentMode: "Manual",
        createdAt: new Date(),
      };

      await axios.post(`${API_BASE}/appointments`, payload);
      alert("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PatientLayout>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold text-primary mb-1">Appointment</h4>
            <span className="badge bg-primary">UPCOMING</span>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/patient/appointments")}>Close form</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* LEFT COLUMN */}
            <div className="col-lg-6">

              <div className="mb-3">
                <label className="form-label">Select Clinic <span className="text-danger">*</span></label>
                <select name="clinic" className="form-select" value={form.clinic} onChange={handleChange} required>
                  <option value="">Select clinic</option>
                  {loadingData ? <option disabled>Loading...</option> :
                    clinics.map((c, idx) => {
                      const cName = c.name || c.clinicName || "Clinic " + (idx + 1);
                      return <option key={c._id || idx} value={cName}>{cName}</option>;
                    })
                  }
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Doctor <span className="text-danger">*</span></label>
                <select name="doctor" className="form-select" value={form.doctor} onChange={handleChange} required disabled={!form.clinic}>
                  <option value="">{form.clinic ? "Select doctor" : "Select clinic first"}</option>
                  {availableDoctors.map(d => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.firstName} {d.lastName} {d.specialization ? `(${d.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Service <span className="text-danger">*</span></label>
                <div className="border rounded p-2 d-flex flex-wrap gap-2" style={{ minHeight: '50px', backgroundColor: '#fff' }}>
                  {availableServices.length === 0 ? (
                    <span className="text-muted small p-1">No services found.</span>
                  ) : (
                    availableServices.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        className={`btn btn-sm ${selectedServices.includes(s.id) ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => toggleService(s.id)}
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Appointment Date <span className="text-danger">*</span></label>
                <input name="date" type="date" className="form-control" value={form.date} onChange={handleChange} required />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-lg-6">
              <div className="mb-3">
                <label className="form-label">Available Slot <span className="text-danger">*</span></label>
                <div className="border rounded p-3 bg-white">
                  {!form.doctor || !form.date ? (
                    <div className="text-center text-muted small p-2">Select Doctor and Date first.</div>
                  ) : loadingSlots ? (
                    <div className="text-center text-muted small p-2">Loading slots...</div>
                  ) : dynamicSlots.length === 0 ? (
                    <div className="text-center text-danger small p-2">No slots available.</div>
                  ) : (
                    <>
                      <div className="text-center mb-2 fw-semibold">Select a Time</div>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {dynamicSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`btn btn-sm ${selectedSlot === slot ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Service Detail</label>
                <div className="border rounded p-3 bg-light">
                  {selectedServiceDetails.length === 0 ? (
                    <div className="text-muted small">No service selected.</div>
                  ) : (
                    <>
                      <ul className="small mb-2 ps-3">
                        {selectedServiceDetails.map(s => <li key={s.id}>{s.name} – ₹{s.price}</li>)}
                      </ul>
                      <div className="fw-bold border-top pt-2 mt-2">Total: ₹{totalAmount}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Tax</label>
                <div className="border rounded p-3 text-muted small bg-light">No tax found.</div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/patient/appointments")}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Booking..." : "Save"}</button>
          </div>
        </form>
      </div>
    </PatientLayout>
  );
}