import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaTimes, FaTrash, FaEdit, FaPrint, FaEnvelope, FaFileImport } from "react-icons/fa";
import toast from "react-hot-toast";
import { read, utils } from 'xlsx';
import "../../admin-dashboard/styles/admin-shared.css";
import API_BASE from "../../config";

export default function SharedEncounterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const medicalReportRef = useRef(null);
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clinical Data State (Arrays)
  const [problems, setProblems] = useState([]);
  const [observations, setObservations] = useState([]);
  const [notes, setNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Listing Options State
  const [problemOptions, setProblemOptions] = useState([]);
  const [observationOptions, setObservationOptions] = useState([]);
  const [prescriptionOptions, setPrescriptionOptions] = useState([]);

  // Inputs for adding new items
  const [newNote, setNewNote] = useState("");
  
  // Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [editingPrescriptionIndex, setEditingPrescriptionIndex] = useState(null);
  const [newPrescription, setNewPrescription] = useState({
    name: "",
    frequency: "",
    duration: "",
    instruction: ""
  });

  // Import Data Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    fetchEncounterDetails();
    fetchEncounterTemplates();
    fetchListings();
  }, [id]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/listings`);
      const data = res.data;
      setProblemOptions(data.filter(item => item.type === 'Problems' && item.status === 'Active'));
      setObservationOptions(data.filter(item => item.type === 'Observations' && item.status === 'Active'));
      setPrescriptionOptions(data.filter(item => item.type === 'Prescription' && item.status === 'Active'));
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  const [encounterTemplates, setEncounterTemplates] = useState([]);

  const fetchEncounterTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/encounter-templates`);
      setEncounterTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleTemplateSelect = async (e) => {
    const templateId = e.target.value;
    if (!templateId) return;

    try {
      const res = await axios.get(`${API_BASE}/encounter-templates/${templateId}`);
      const template = res.data;

      const newProblems = [...new Set([...problems, ...(template.problems || [])])];
      const newObservations = [...new Set([...observations, ...(template.observations || [])])];
      const newNotes = [...new Set([...notes, ...(template.notes || [])])];
      
      const newPrescriptionsToAdd = (template.prescriptions || []).map(p => {
        const { _id, ...rest } = p; 
        return { ...rest, _id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
      });
      const newPrescriptions = [...prescriptions, ...newPrescriptionsToAdd];

      setProblems(newProblems);
      setObservations(newObservations);
      setNotes(newNotes);
      setPrescriptions(newPrescriptions);

      // Auto-save the merged data
      updateEncounterData({
        problems: newProblems,
        observations: newObservations,
        notes: newNotes,
        prescriptions: newPrescriptions
      });

      toast.success("Template applied successfully");
    } catch (err) {
      console.error("Error applying template:", err);
      toast.error("Failed to apply template");
    }
  };

  const fetchEncounterDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE}/encounters`); 
      const found = res.data.find(e => e._id === id);
      
      if (found) {
        setEncounter(found);
        setProblems(found.problems || []);
        setObservations(found.observations || []);
        setNotes(found.notes || []);
        setPrescriptions(found.prescriptions || []);

        // Handle Patient Details
        let pId = found.patientId;
        // If patientId is populated (object), extract _id. Otherwise use it as is.
        if (typeof pId === 'object' && pId !== null) {
            pId = pId._id;
        }

        if (pId) {
          try {
            const patientRes = await axios.get(`${API_BASE}/patients/${pId}`);
            setPatientEmail(patientRes.data.email || "No email found");
            setPatientPhone(patientRes.data.mobile || patientRes.data.phone || "No records found");
            setPatientAddress(patientRes.data.address || "No records found");
            setPatientName(`${patientRes.data.firstName} ${patientRes.data.lastName}`);
          } catch (err) {
            console.error("Error fetching patient details:", err);
            // Fallback to populated data if available, or encounter fields
            const pName = (typeof found.patientId === 'object' && found.patientId) 
                ? `${found.patientId.firstName} ${found.patientId.lastName}` 
                : (found.patient || found.patientName || "Unknown Patient");
            setPatientName(pName);
          }
        } else {
            const pName = (found.patient || found.patientName || "Unknown Patient");
            setPatientName(pName);
        }

        // Handle Doctor Details
        let dId = found.doctorId;
        if (typeof dId === 'object' && dId !== null) {
            dId = dId._id;
        }

        if (dId) {
            try {
                // Fetch all doctors to find the matching one
                const doctorRes = await axios.get(`${API_BASE}/doctors`);
                const doctors = Array.isArray(doctorRes.data) ? doctorRes.data : [];
                const doctorObj = doctors.find(d => d._id === dId);
                if (doctorObj) {
                    setDoctorName(`${doctorObj.firstName} ${doctorObj.lastName}`);
                } else {
                    // Fallback
                    const dName = (typeof found.doctorId === 'object' && found.doctorId)
                        ? `${found.doctorId.firstName} ${found.doctorId.lastName}`
                        : (found.doctor || found.doctorName || "Unknown Doctor");
                    setDoctorName(dName);
                }
            } catch (err) {
                console.error("Error fetching doctor details:", err);
                const dName = (typeof found.doctorId === 'object' && found.doctorId)
                    ? `${found.doctorId.firstName} ${found.doctorId.lastName}`
                    : (found.doctor || found.doctorName || "Unknown Doctor");
                setDoctorName(dName);
            }
        } else {
            const dName = (found.doctor || found.doctorName || "Unknown Doctor");
            setDoctorName(dName);
        }
      }
    } catch (err) {
      console.error("Error fetching encounter details:", err);
      toast.error("Failed to load encounter details");
    } finally {
      setLoading(false);
    }
  };

  const updateEncounterData = async (updatedFields) => {
    try {
      let payload = { ...updatedFields };
      
      if (payload.prescriptions) {
        payload.prescriptions = payload.prescriptions.map(p => {
          if (p._id && (p._id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(p._id))) {
            const { _id, ...rest } = p;
            return rest;
          }
          return p;
        });
      }

      await axios.put(`${API_BASE}/encounters/${id}`, payload);
    } catch (err) {
      console.error("Error updating encounter:", err);
      toast.error("Failed to save changes");
    }
  };

  // --- Problems Logic ---
  const handleAddProblem = (e) => {
    const value = e.target.value;
    if (value && value !== "Select Problem") {
      const updatedProblems = [...problems, value];
      setProblems(updatedProblems);
      updateEncounterData({ problems: updatedProblems });
      e.target.value = "Select Problem"; 
    }
  };

  const handleRemoveProblem = (index) => {
    const updatedProblems = problems.filter((_, i) => i !== index);
    setProblems(updatedProblems);
    updateEncounterData({ problems: updatedProblems });
  };

  // --- Observations Logic ---
  const handleAddObservation = (e) => {
    const value = e.target.value;
    if (value && value !== "Select Observation") {
      const updatedObservations = [...observations, value];
      setObservations(updatedObservations);
      updateEncounterData({ observations: updatedObservations });
      e.target.value = "Select Observation"; 
    }
  };

  const handleRemoveObservation = (index) => {
    const updatedObservations = observations.filter((_, i) => i !== index);
    setObservations(updatedObservations);
    updateEncounterData({ observations: updatedObservations });
  };

  // --- Notes Logic ---
  const handleAddNote = () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      updateEncounterData({ notes: updatedNotes });
      setNewNote("");
    }
  };

  const handleRemoveNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    updateEncounterData({ notes: updatedNotes });
  };

  // --- Prescription Logic ---
  const handlePrescriptionChange = (e) => {
    const { name, value } = e.target;
    setNewPrescription(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPrescription = (e) => {
    e.preventDefault();
    let updatedPrescriptions;

    if (editingPrescriptionIndex !== null) {
      updatedPrescriptions = [...prescriptions];
      updatedPrescriptions[editingPrescriptionIndex] = { 
        ...newPrescription, 
        _id: prescriptions[editingPrescriptionIndex]._id 
      };
    } else {
      updatedPrescriptions = [...prescriptions, { ...newPrescription, _id: Date.now().toString() }];
    }

    setPrescriptions(updatedPrescriptions);
    updateEncounterData({ prescriptions: updatedPrescriptions });
    
    setNewPrescription({ name: "", frequency: "", duration: "", instruction: "" });
    setIsPrescriptionModalOpen(false);
    setEditingPrescriptionIndex(null);
    toast.success(editingPrescriptionIndex !== null ? "Prescription updated" : "Prescription added");
  };

  const handleEditPrescription = (index) => {
    const prescriptionToEdit = prescriptions[index];
    setNewPrescription({
      name: prescriptionToEdit.name,
      frequency: prescriptionToEdit.frequency,
      duration: prescriptionToEdit.duration,
      instruction: prescriptionToEdit.instruction || ""
    });
    setEditingPrescriptionIndex(index);
    setIsPrescriptionModalOpen(true);
  };

  const handleClosePrescriptionModal = () => {
    setIsPrescriptionModalOpen(false);
    setEditingPrescriptionIndex(null);
    setNewPrescription({ name: "", frequency: "", duration: "", instruction: "" });
  };

  const handleDeletePrescription = (index) => {
    const updatedPrescriptions = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(updatedPrescriptions);
    updateEncounterData({ prescriptions: updatedPrescriptions });
  };

  // --- Import Data Logic ---
  const handleImportData = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);

        // Expected columns: Name, Frequency, Duration, Instruction
        const newPrescriptionsToAdd = data.map(row => ({
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row.Name || row.name || "Unknown Medicine",
          frequency: row.Frequency || row.frequency || "1-0-1",
          duration: row.Duration || row.duration || "5 days",
          instruction: row.Instruction || row.instruction || ""
        }));

        const updatedPrescriptions = [...prescriptions, ...newPrescriptionsToAdd];
        setPrescriptions(updatedPrescriptions);
        updateEncounterData({ prescriptions: updatedPrescriptions });
        
        toast.success(`Imported ${newPrescriptionsToAdd.length} prescriptions`);
        setIsImportModalOpen(false);
      } catch (err) {
        console.error("Error parsing file:", err);
        toast.error("Failed to parse file. Ensure it's a valid Excel/CSV.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Email Logic ---
  const handleEmailEncounter = async () => {
    if (!patientEmail || patientEmail === "No email found") {
      toast.error("Patient email not available");
      return;
    }

    const toastId = toast.loading("Sending email...");

    try {
      const encounterDetails = {
        patientName,
        doctorName,
        clinicName: encounter.clinic,
        date: encounter.date,
        problems,
        observations,
        notes,
        prescriptions
      };

      await axios.post(`${API_BASE}/api/email/send-encounter-details`, {
        to: patientEmail,
        encounterDetails
      });

      toast.success("Encounter details sent to patient", { id: toastId });
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email", { id: toastId });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Encounter Report</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          body {
            font-size: 12px;
            color: #1f2933;
            padding: 24px 32px;
          }

          .report {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e1e4ea;
            border-radius: 12px;
            padding: 24px 28px 40px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e1e4ea;
          }

          .clinic-info {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .clinic-logo {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: #2563eb11;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
            color: #2563eb;
          }

          .clinic-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .clinic-name {
            font-size: 14px;
            font-weight: 600;
          }

          .clinic-sub {
            font-size: 11px;
            color: #6b7280;
          }

          .encounter-meta {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .encounter-title {
            font-size: 16px;
            font-weight: 600;
          }

          .encounter-date {
            font-size: 11px;
            color: #6b7280;
          }

          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #dcfce7;
            color: #15803d;
          }

          .section {
            margin-top: 18px;
          }

          .section-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .section-title {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #4b5563;
          }

          .section-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(to right, #e5e7eb, transparent);
            margin-left: 12px;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: 1.2fr 1.1fr;
            gap: 12px;
          }

          .card {
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            padding: 10px 12px;
            background: #f9fafb;
          }

          .card-title {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6px;
          }

          .field-row {
            display: flex;
            margin-bottom: 4px;
            font-size: 11px;
          }

          .field-label {
            width: 32%;
            font-weight: 500;
            color: #4b5563;
          }

          .field-value {
            width: 68%;
            color: #111827;
          }

          .pill {
            display: inline-flex;
            align-items: center;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: 10px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            color: #374151;
            margin-right: 4px;
            margin-bottom: 4px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 11px;
          }

          thead tr {
            background: #f3f4f6;
          }

          th, td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }

          th {
            text-align: left;
            font-weight: 600;
            color: #4b5563;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          .notes {
            margin-top: 4px;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px dashed #d1d5db;
            background: #f9fafb;
            font-size: 11px;
          }

          .signature-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
          }

          .signature-box {
            width: 220px;
            text-align: center;
          }

          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #9ca3af;
            padding-top: 4px;
            font-size: 11px;
            color: #4b5563;
          }

          .footer {
            margin-top: 24px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #9ca3af;
          }

          .footer-right {
            text-align: right;
          }

          .muted {
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <!-- Header -->
          <header class="header">
            <div class="clinic-info">
              <div class="clinic-logo">
                VC
              </div>
              <div class="clinic-text">
                <div class="clinic-name">${encounter.clinic}</div>
                <div class="clinic-sub">OneCare Encounter Report</div>
              </div>
            </div>

            <div class="encounter-meta">
              <div class="encounter-title">Encounter Summary</div>
              <div class="encounter-date">${new Date(encounter.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <span class="status-badge">${encounter.status}</span>
            </div>
          </header>

          <!-- Patient & Encounter -->
          <section class="section">
            <div class="section-title-row">
              <div class="section-title">Overview</div>
              <div class="section-line"></div>
            </div>

            <div class="grid-2">
              <div class="card">
                <div class="card-title">Patient</div>
                <div class="field-row">
                  <div class="field-label">Name</div>
                  <div class="field-value">${patientName}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Email</div>
                  <div class="field-value">${patientEmail}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Phone</div>
                  <div class="field-value ${!patientPhone || patientPhone === 'No records found' ? 'muted' : ''}">${patientPhone}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Address</div>
                  <div class="field-value ${!patientAddress || patientAddress === 'No records found' ? 'muted' : ''}">${patientAddress}</div>
                </div>
              </div>

              <div class="card">
                <div class="card-title">Encounter</div>
                <div class="field-row">
                  <div class="field-label">Clinic</div>
                  <div class="field-value">${encounter.clinic}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Doctor</div>
                  <div class="field-value">${doctorName}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Date</div>
                  <div class="field-value">${new Date(encounter.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Description</div>
                  <div class="field-value">${encounter.description || "No description"}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Clinical details -->
          <section class="section">
            <div class="section-title-row">
              <div class="section-title">Clinical Details</div>
              <div class="section-line"></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Problems</th>
                  <th style="width: 25%;">Observations</th>
                  <th style="width: 50%;">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    ${problems.length > 0 ? problems.map(p => `<div>• ${p}</div>`).join('') : '<span class="muted">No records found</span>'}
                  </td>
                  <td>
                    ${observations.length > 0 ? observations.map(o => `<div>• ${o}</div>`).join('') : '<span class="muted">No records found</span>'}
                  </td>
                  <td>
                    ${notes.length > 0 ? notes.map(n => `<div>• ${n}</div>`).join('') : '<span class="muted">No records found</span>'}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Prescription -->
          <section class="section">
            <div class="section-title-row">
              <div class="section-title">Prescription</div>
              <div class="section-line"></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Name</th>
                  <th style="width: 20%;">Frequency</th>
                  <th style="width: 15%;">Duration</th>
                  <th style="width: 40%;">Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${prescriptions.length > 0 ? prescriptions.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.frequency}</td>
                    <td>${p.duration}</td>
                    <td>${p.instruction || '-'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" class="muted">No prescriptions found</td></tr>'}
              </tbody>
            </table>

            <div class="notes">
              Additional notes, warnings, or patient instructions can be shown here.
            </div>
          </section>

          <!-- Signature -->
          <section class="signature-row">
            <div class="signature-box">
              <div class="muted" style="font-size:10px;">Doctor Signature</div>
              <div class="signature-line">${doctorName}</div>
            </div>
          </section>

          <!-- Footer -->
          <footer class="footer">
            <div>Generated by OneCare</div>
            <div class="footer-right">
              <div>Page 1 of 1</div>
              <div>Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </footer>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;
  if (!encounter) return <div className="p-5 text-center">Encounter not found</div>;

  return (
    <div className="container-fluid mt-3">
      {/* Header */}
      <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-white mb-0">Encounter Details</h5>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={handleEmailEncounter}>
            <FaEnvelope /> Email
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-3 mb-3">
         <div className="d-flex justify-content-between align-items-center">
            <div>
                <h6 className="fw-bold text-primary mb-1">Encounter ID: {encounter.encounterId || "PENDING"}</h6>
                <small className="text-muted">Date: {new Date(encounter.date).toLocaleDateString()}</small>
            </div>
            <div className="d-flex align-items-center gap-3">
                <select className="form-select form-select-sm" style={{width: '250px'}} onChange={handleTemplateSelect} defaultValue="">
                    <option value="" disabled>Load Template...</option>
                    {encounterTemplates.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                </select>
            </div>
         </div>
      </div>

      {/* Clinical Detail */}
      <div className="bg-white shadow-sm rounded p-3 mb-3">
        <div className="row g-3">
          {/* Problems Column */}
          <div className="col-md-4">
            <label className="form-label fw-bold small text-muted">Problems</label>
            <div className="border rounded p-3 mb-2 bg-white" style={{minHeight: '200px', maxHeight: '300px', overflowY: 'auto'}}>
              {problems.length === 0 ? (
                <small className="text-danger text-center d-block mt-5">No records found</small>
              ) : (
                <ul className="list-unstyled mb-0">
                  {problems.map((prob, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <span>{index + 1}. {prob}</span>
                      <FaTimes 
                        className="text-danger cursor-pointer" 
                        style={{cursor: 'pointer'}}
                        onClick={() => handleRemoveProblem(index)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select 
              className="form-select form-select-sm mt-2"
              onChange={handleAddProblem}
              defaultValue="Select Problem"
            >
              <option disabled>Select Problem</option>
              {problemOptions.map(opt => (
                  <option key={opt._id} value={opt.name}>{opt.name}</option>
              ))}
            </select>
            <small className="text-primary d-block mt-1" style={{fontSize: '0.75rem'}}>Note: Type and press enter to create new problem</small>
          </div>

          {/* Observations Column */}
          <div className="col-md-4">
            <label className="form-label fw-bold small text-muted">Observations</label>
            <div className="border rounded p-3 mb-2 bg-white" style={{minHeight: '200px', maxHeight: '300px', overflowY: 'auto'}}>
              {observations.length === 0 ? (
                <small className="text-danger text-center d-block mt-5">No records found</small>
              ) : (
                <ul className="list-unstyled mb-0">
                  {observations.map((obs, index) => (
                    <li key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <span>{index + 1}. {obs}</span>
                      <FaTimes 
                        className="text-danger cursor-pointer" 
                        style={{cursor: 'pointer'}}
                        onClick={() => handleRemoveObservation(index)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select 
              className="form-select form-select-sm mt-2"
              onChange={handleAddObservation}
              defaultValue="Select Observation"
            >
              <option disabled>Select Observation</option>
              {observationOptions.map(opt => (
                  <option key={opt._id} value={opt.name}>{opt.name}</option>
              ))}
            </select>
            <small className="text-primary d-block mt-1" style={{fontSize: '0.75rem'}}>Note: Type and press enter to create new observation</small>
          </div>

          {/* Notes Column */}
          <div className="col-md-4">
             <label className="form-label fw-bold small text-muted">Notes</label>
             <div className="border rounded p-3 mb-2 bg-white" style={{minHeight: '200px', maxHeight: '300px', overflowY: 'auto'}}>
                {notes.length === 0 ? (
                  <small className="text-danger text-center d-block mt-5">No records found</small>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {notes.map((note, index) => (
                      <li key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                        <span>{index + 1}. {note}</span>
                        <FaTimes 
                          className="text-danger cursor-pointer" 
                          style={{cursor: 'pointer'}}
                          onClick={() => handleRemoveNote(index)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
             </div>
             <div className="mt-2">
               <textarea 
                  className="form-control form-control-sm mb-2" 
                  placeholder="Enter Notes"
                  rows="2"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
               ></textarea>
               <button 
                 className="btn btn-primary btn-sm w-100"
                 onClick={handleAddNote}
               >
                 + Add
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Prescription Section */}
      <div className="bg-white shadow-sm rounded p-3 mt-3 mb-4">
         <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
           <h6 className="fw-bold text-muted mb-0">Prescription</h6>
           <div className="d-flex gap-2">
             <button 
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                onClick={handleImportData}
             >
                <FaFileImport /> Import Data
             </button>
             <button 
               className="btn btn-primary btn-sm d-flex align-items-center gap-1"
               onClick={() => setIsPrescriptionModalOpen(true)}
             >
               <FaPlus /> Add Prescription
             </button>
           </div>
         </div>

         <div className="table-responsive">
           <table className="table align-middle">
             <thead className="table-light">
               <tr>
                 <th className="text-muted small fw-bold text-uppercase">Name</th>
                 <th className="text-muted small fw-bold text-uppercase text-center">Frequency</th>
                 <th className="text-muted small fw-bold text-uppercase text-center">Duration</th>
                 <th className="text-muted small fw-bold text-uppercase text-center">Action</th>
               </tr>
             </thead>
             <tbody>
               {prescriptions.length === 0 ? (
                 <tr>
                   <td colSpan="4" className="text-center text-danger py-4">No prescription found</td>
                 </tr>
               ) : (
                 prescriptions.map((p, index) => (
                   <tr key={index}>
                     <td>
                       <div className="fw-semibold text-primary">{p.name}</div>
                       <small className="text-muted">{p.instruction}</small>
                      </td>
                      <td className="text-center">{p.frequency}</td>
                      <td className="text-center">{p.duration}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditPrescription(index)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeletePrescription(index)}
                          >
                            <FaTrash />
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

      {/* Add/Edit Prescription Modal */}
      {isPrescriptionModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-primary">
                    {editingPrescriptionIndex !== null ? "Edit prescription" : "Add prescription"}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleClosePrescriptionModal}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddPrescription}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold small">Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Medicine Name"
                          name="name"
                          value={newPrescription.name}
                          onChange={handlePrescriptionChange}
                          required
                          list="prescription-options"
                        />
                        <datalist id="prescription-options">
                            {prescriptionOptions.map(opt => (
                                <option key={opt._id} value={opt.name} />
                            ))}
                        </datalist>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small">Frequency <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. 1-0-1"
                          name="frequency"
                          value={newPrescription.frequency}
                          onChange={handlePrescriptionChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small">Duration (In Days) <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. 5 days"
                          name="duration"
                          value={newPrescription.duration}
                          onChange={handlePrescriptionChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small">Instruction</label>
                        <textarea 
                          className="form-control" 
                          rows="1"
                          name="instruction"
                          value={newPrescription.instruction}
                          onChange={handlePrescriptionChange}
                        ></textarea>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={handleClosePrescriptionModal}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary px-4">
                        <FaPlus className="me-1" /> 
                        {editingPrescriptionIndex !== null ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Data Modal */}
      {isImportModalOpen && (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Import Prescriptions</h5>
                            <button type="button" className="btn-close" onClick={handleCloseImportModal}></button>
                        </div>
                        <div className="modal-body">
                            <p className="small text-muted mb-3">
                                Upload an Excel or CSV file with the following columns: <b>Name, Frequency, Duration, Instruction</b>.
                            </p>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileImport}
                                ref={fileInputRef}
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseImportModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
