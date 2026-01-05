import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaFilter,
  FaPlus,
  FaCalendarAlt,
  FaUser,
  FaStethoscope,
} from "react-icons/fa";
import DoctorLayout from "../layouts/DoctorLayout";
import API_BASE from "../../config";

const DoctorAppointments = () => {
  const storedDoctor = (() => {
    try {
      return JSON.parse(localStorage.getItem("doctor"));
    } catch (e) {
      return null;
    }
  })();

  const doctorId = storedDoctor?._id || storedDoctor?.id;
  const doctorName = storedDoctor
    ? `${storedDoctor.firstName} ${storedDoctor.lastName}`
    : "Me";

  // --- State ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentClinic, setCurrentClinic] = useState(
    storedDoctor?.clinic || storedDoctor?.clinicName || ""
  );
  const [filters, setFilters] = useState({ date: "", status: "", patient: "" });

  // Dropdown Data
  const [allServicesList, setAllServicesList] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [clinics, setClinics] = useState([]);

  // Clinic-specific filtered data
  const [servicesList, setServicesList] = useState([]);
  const [patients, setPatients] = useState([]);

  // Slot Data
  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Default form structure
  const defaultForm = {
    clinic: currentClinic,
    services: [],
    date: "",
    patient: "",
    patientName: "",
    status: "booked",
    charges: "0",
    slot: "",
  };

  // Form State
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);

  // --- Fetch Data ---
  useEffect(() => {
    if (!doctorId) {
      toast.error("Doctor not authenticated");
      return;
    }
    fetchAppointments();
    fetchAllDropdownData();
    const fetchFreshProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/doctors`);
        let allDoctors = [];
        if (Array.isArray(res.data)) {
          allDoctors = res.data;
        } else if (res.data.doctors) {
          allDoctors = res.data.doctors;
        } else if (res.data.data) {
          allDoctors = res.data.data;
        }

        const freshDoctorData = allDoctors.find(
          (d) => d._id === doctorId || d.id === doctorId
        );

        if (freshDoctorData) {
          const liveClinic = freshDoctorData.clinic || freshDoctorData.clinicName || "";
          setCurrentClinic(liveClinic);
          setForm((prev) => ({ ...prev, clinic: liveClinic }));
        }
      } catch (err) {
        console.error("Failed to refresh doctor profile", err);
      }
    };
    fetchFreshProfile();
  }, [doctorId]);

  const fetchAppointments = async (query = {}) => {
    try {
      setLoading(true);
      const params = { ...query, doctorId: doctorId };
      const res = await axios.get(`${API_BASE}/appointments`, { params });
      const data = res.data?.data || res.data;
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDropdownData = async () => {
    try {
      const [servRes, patRes, clinicRes] = await Promise.all([
        axios.get(`${API_BASE}/services`),
        axios.get(`${API_BASE}/patients`),
        axios.get(`${API_BASE}/api/clinics`),
      ]);

      const servicesData = servRes.data.rows || servRes.data || [];
      setAllServicesList(Array.isArray(servicesData) ? servicesData : []);
      setAllPatients(Array.isArray(patRes.data) ? patRes.data : []);

      if (clinicRes.data?.success && Array.isArray(clinicRes.data.clinics)) {
        setClinics(clinicRes.data.clinics);
      } else {
        setClinics(Array.isArray(clinicRes.data) ? clinicRes.data : []);
      }
    } catch (err) {
      console.error("Dropdown data error:", err);
    }
  };

  // Filter services and patients by clinic
  useEffect(() => {
    if (form.clinic && allServicesList.length > 0) {
      const clinicServices = allServicesList.filter(
        (service) =>
          service.clinic === form.clinic ||
          service.clinicName === form.clinic ||
          (service.clinic && service.clinic.toString() === form.clinic)
      );
      setServicesList(clinicServices);
    }

    if (form.clinic && allPatients.length > 0) {
      const clinicPatients = allPatients.filter(
        (patient) =>
          patient.clinic === form.clinic ||
          patient.clinicName === form.clinic ||
          (patient.clinic && patient.clinic.toString() === form.clinic)
      );
      setPatients(clinicPatients);
    }
  }, [form.clinic, allServicesList, allPatients]);

  // Calculate total charges
  const calculateTotalCharges = () => {
    if (form.services.length === 0) return "0";

    const total = form.services.reduce((sum, serviceName) => {
      const service = servicesList.find((s) => s.name === serviceName);
      if (service) {
        const price = service.price ?? service.charges ?? service.fees ?? 0;
        return sum + (parseFloat(price) || 0);
      }
      return sum;
    }, 0);

    return total.toFixed(2);
  };

  // Update charges whenever services change
  useEffect(() => {
    const totalCharges = calculateTotalCharges();
    setForm((prev) => ({ ...prev, charges: totalCharges }));
  }, [form.services, servicesList]);

  // Slot fetching
  useEffect(() => {
    const fetchSlots = async () => {
      if (doctorId && form.date) {
        setLoadingSlots(true);
        try {
          const res = await axios.get(`${API_BASE}/appointments/slots`, {
            params: { doctorId: doctorId, date: form.date },
          });
          if (res.data && res.data.slots) setDynamicSlots(res.data.slots);
          else if (Array.isArray(res.data)) setDynamicSlots(res.data);
        } catch (err) {
          console.error("Slot error:", err);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setDynamicSlots([]);
      }
    };
    fetchSlots();
  }, [doctorId, form.date]);

  // --- Handlers ---
  const handleAddService = (serviceName) => {
    try {
      if (form.services.includes(serviceName)) {
        toast.warning("Service already added");
        return;
      }
      setForm((prev) => ({
        ...prev,
        services: [...prev.services, serviceName],
      }));
    } catch (err) {
      console.error("Error adding service:", err);
      toast.error("Error adding service");
    }
  };

  const handleRemoveService = (serviceName) => {
    try {
      setForm((prev) => ({
        ...prev,
        services: prev.services.filter((s) => s !== serviceName),
      }));
    } catch (err) {
      console.error("Error removing service:", err);
      toast.error("Error removing service");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      setForm((p) => ({ ...p, date: value, slot: "" }));
      return;
    }

    if (name === "patient") {
      const selectedP = patients.find((p) => p._id === value);
      setForm((p) => ({
        ...p,
        patient: value,
        patientName: selectedP
          ? `${selectedP.firstName} ${selectedP.lastName}`
          : value,
      }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      clinic: currentClinic,
      services: [],
      date: "",
      patient: "",
      patientName: "",
      status: "booked",
      charges: "0",
      slot: "",
    });
    setDynamicSlots([]);
    setPanelOpen(true);
    setTimeout(
      () =>
        document
          .getElementById("appointment-form")
          ?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const openEditForm = (item) => {
    setEditId(item._id);
    const pId =
      item.patientId && typeof item.patientId === "object"
        ? item.patientId._id
        : item.patientId || "";

    let servicesArray = [];
    if (Array.isArray(item.services)) {
      servicesArray = item.services;
    } else if (typeof item.services === "string") {
      servicesArray = item.services.split(",").map((s) => s.trim());
    }

    setForm({
      clinic: item.clinic || "",
      services: servicesArray,
      date: item.date ? item.date.substring(0, 10) : "",
      patient: pId,
      patientName: item.patientName || "",
      status: item.status || "booked",
      charges: item.charges || "0",
      slot: item.time || item.slot || "",
    });
    setPanelOpen(true);
    setTimeout(
      () =>
        document
          .getElementById("appointment-form")
          ?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (form.services.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    try {
      const payload = {
        clinic: form.clinic,
        doctorId: doctorId,
        doctorName: doctorName,
        patientId: form.patient,
        patientName: form.patientName,
        services: form.services,
        servicesDetail: form.services.join(", "),
        date: form.date,
        status: form.status,
        charges: form.charges,
        time: form.slot,
        slot: form.slot,
      };

      if (editId) {
        await toast.promise(
          axios.put(`${API_BASE}/appointments/${editId}`, payload),
          {
            loading: "Updating...",
            success: "Updated!",
            error: "Failed.",
          }
        );
      } else {
        await toast.promise(axios.post(`${API_BASE}/appointments`, payload), {
          loading: "Booking...",
          success: "Booked!",
          error: "Failed.",
        });
      }
      fetchAppointments();
      setPanelOpen(false);
      setForm({
        clinic: currentClinic,
        services: [],
        date: "",
        patient: "",
        patientName: "",
        status: "booked",
        charges: "0",
        slot: "",
      });
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    }
  };

  // Filtering
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tab === "upcoming")
      list = list.filter(
        (a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) > today
      );
    else if (tab === "past")
      list = list.filter(
        (a) => a.date && new Date(a.date).setHours(0, 0, 0, 0) < today
      );

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          (a.patientName || "").toLowerCase().includes(q) ||
          (a.clinic || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, tab, searchTerm]);

  // --- PDF Download Handler ---
  const handleDownloadPdf = async (appointmentId) => {
    try {
      const toastId = toast.loading("Generating Receipt...");
      
      // Request PDF with hidden Token in Headers
      const res = await axios.get(`${API_BASE}/appointments/${appointmentId}/pdf`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        responseType: "blob", // Important: Treat response as a file
      });

      // Create a temporary local URL for the PDF
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, "_blank");
      
      toast.dismiss(toastId);
      toast.success("Receipt opened!");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.dismiss();
      toast.error("Failed to generate receipt.");
    }
  };

  // ------------------------------------------

  return (
    <DoctorLayout>
      <style>{`
        @media (max-width: 768px) {
          .mobile-table thead { display: none; }
          .mobile-table tr { 
            display: block; 
            margin-bottom: 1rem; 
            background: #fff; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border: 1px solid #eee;
            padding: 10px;
          }
          .mobile-table td { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .mobile-table td:last-child { border-bottom: none; }
          .mobile-table td::before { 
            content: attr(data-label); 
            font-weight: 600; 
            color: #666; 
            font-size: 0.85rem;
            margin-right: 1rem;
          }
        }
      `}</style>

      <div className="container-fluid py-4">
        {/* Top Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold text-primary mb-1">My Appointments</h4>
            <p className="text-muted small mb-0">Manage bookings and schedules</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <FaFilter /> Filter
            </button>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              onClick={openAddForm}
            >
              <FaPlus /> Add Appointment
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="btn-group" role="group">
            {["all", "upcoming", "past"].map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${
                  tab === t ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setTab(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="card p-3 mb-4 bg-light border-0">
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label small">Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  className="btn btn-secondary btn-sm w-100"
                  onClick={() => fetchAppointments(filters)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM PANEL - MATCHING PATIENT UI EXACTLY */}
        {panelOpen && (
          <div id="appointment-form" className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0 text-primary">
                {editId ? "✏️ Edit Appointment" : "Appointment"}
              </h6>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  {/* Left Column */}
                  <div className="col-12 col-lg-6">
                    {/* Your Clinic */}
                    <div className="mb-2">
                      <label className="form-label small fw-bold">Your Clinic</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.clinic}
                        readOnly
                        disabled
                      />
                      <small className="text-muted d-block mt-1">
                        Appointments are booked at your registered clinic.
                      </small>
                    </div>

                    {/* Doctor */}
                    <div className="mb-2">
                      <label className="form-label small fw-bold">Doctor</label>
                      <input
                        type="text"
                        className="form-control"
                        value={doctorName}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Service Selection */}
                    <div className="mb-2">
                      <label className="form-label small fw-bold">Service *</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {servicesList.length === 0 ? (
                          <small className="text-muted">
                            No services available for this clinic
                          </small>
                        ) : (
                          servicesList.map((service) => {
                            const isSelected = form.services.includes(service.name);
                            return (
                              <button
                                key={service._id}
                                type="button"
                                className={`btn btn-sm ${
                                  isSelected ? "btn-primary" : "btn-outline-primary"
                                }`}
                                onClick={() => handleAddService(service.name)}
                              >
                                {service.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Appointment Date */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={form.date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Patient */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Patient *</label>
                      <select
                        name="patient"
                        className="form-select"
                        value={form.patient}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">
                          {patients.length === 0
                            ? "No patients registered"
                            : "Select Patient"}
                        </option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="form-label small fw-bold">Status</label>
                      <select
                        name="status"
                        className="form-select"
                        value={form.status}
                        onChange={handleFormChange}
                      >
                        <option value="booked">Booked</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-12 col-lg-6">
                    {/* Available Slot */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Available Slot *
                      </label>
                      <div style={{ textAlign: "center", marginBottom: "10px" }}>
                        <strong style={{ color: "#1f2937" }}>Select a Time</strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        {!form.date ? (
                          <small className="text-muted">Select date first</small>
                        ) : loadingSlots ? (
                          <small className="text-primary">Loading slots...</small>
                        ) : dynamicSlots.length === 0 ? (
                          <small className="text-danger">No slots available</small>
                        ) : (
                          dynamicSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={`btn btn-sm ${
                                form.slot === slot
                                  ? "btn-primary"
                                  : "btn-outline-primary"
                              }`}
                              onClick={() => setForm((f) => ({ ...f, slot }))}
                            >
                              {slot}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Service Detail & Total Combined Box */}
                    {form.services.length > 0 && (
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          padding: "16px",
                        }}
                      >
                        {/* Service Detail Label */}
                        <label
                          className="form-label small fw-bold"
                          style={{ marginBottom: "12px", display: "block" }}
                        >
                          Service Detail
                        </label>

                        {/* Services List */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            marginBottom: "12px",
                          }}
                        >
                          {form.services.map((service, idx) => {
                            const svc = servicesList.find(
                              (s) => s.name === service
                            );
                            const price = svc?.price ?? svc?.charges ?? svc?.fees ?? 0;
                            return (
                              <li
                                key={idx}
                                style={{
                                  fontSize: "0.9rem",
                                  color: "#1f2937",
                                  marginBottom: "4px",
                                }}
                              >
                                {service} – ₹{price}
                              </li>
                            );
                          })}
                        </ul>

                        {/* Divider */}
                        <hr
                          style={{
                            margin: "12px 0",
                            borderColor: "#d1d5db",
                          }}
                        />

                        {/* Total */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <label
                            className="form-label small fw-bold"
                            style={{ margin: 0 }}
                          >
                            Total
                          </label>
                          <span
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            ₹{form.charges}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tax */}
                    <div style={{ marginTop: form.services.length > 0 ? "12px" : "0" }}>
                      <label className="form-label small fw-bold">Tax</label>
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          padding: "12px",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        No tax applicable.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => setPanelOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 mobile-table">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 py-3">Patient</th>
                    <th className="py-3">Services</th>
                    <th className="py-3">Charges</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Time</th>
                    <th className="py-3">Status</th>
                    <th className="text-end pe-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((a) => (
                      <tr key={a._id}>
                        <td className="ps-4 fw-medium" data-label="Patient">
                          {a.patientName}
                        </td>
                        <td data-label="Services">
                          <small>
                            {Array.isArray(a.services)
                              ? a.services.join(", ")
                              : a.servicesDetail || "N/A"}
                          </small>
                        </td>
                        <td data-label="Charges">
                          <span className="badge bg-success">₹{a.charges || "0"}</span>
                        </td>
                        <td data-label="Date">
                          {a.date
                            ? new Date(a.date).toLocaleDateString("en-GB")
                            : "N/A"}
                        </td>
                        <td data-label="Time">
                          <span className="badge bg-light text-dark border">
                            {a.time || a.slot || "-"}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span
                            className={`badge ${
                              a.status === "booked"
                                ? "bg-primary"
                                : a.status === "completed"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="text-end pe-4" data-label="Actions">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-link text-decoration-none p-0"
                              onClick={() => openEditForm(a)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-link text-decoration-none p-0"
                              onClick={() =>handleDownloadPdf(a._id)}
                            >
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorAppointments;