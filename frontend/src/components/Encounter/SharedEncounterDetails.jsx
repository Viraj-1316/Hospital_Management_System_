import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPrint, FaFileUpload, FaTimes, FaPlus, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import "../../admin-dashboard/styles/admin-shared.css"; 

export default function SharedEncounterDetails({ role }) {
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

  const [patientEmail, setPatientEmail] = useState("");

  useEffect(() => {
    fetchEncounterDetails();
    fetchEncounterTemplates();
  }, [id]);

  const [encounterTemplates, setEncounterTemplates] = useState([]);

  const fetchEncounterTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:3001/encounter-templates");
      setEncounterTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleTemplateSelect = async (e) => {
    const templateId = e.target.value;
    if (!templateId) return;

    try {
      const res = await axios.get(`http://localhost:3001/encounter-templates/${templateId}`);
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
      
      
      const res = await axios.get(`http://localhost:3001/encounters`); 
      const found = res.data.find(e => e._id === id);
      
      if (found) {
        setEncounter(found);
        setProblems(found.problems || []);
        setObservations(found.observations || []);
        setNotes(found.notes || []);
        setNotes(found.notes || []);
        setPrescriptions(found.prescriptions || []);

        // Fetch patient details if patientId exists
        if (found.patientId) {
          try {
            const patientRes = await axios.get(`http://localhost:3001/patients/${found.patientId}`);
            setPatientEmail(patientRes.data.email || "No email found");
          } catch (err) {
            console.error("Error fetching patient details:", err);
          }
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

      await axios.put(`http://localhost:3001/encounters/${id}`, payload);
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
          <button 
            className="btn btn-light btn-sm d-flex align-items-center gap-2 text-dark hover-light-blue"
            style={{ transition: 'all 0.3s' }}
          >
            <FaPrint /> Print Encounter
          </button>
          <button 
            className="btn btn-light btn-sm d-flex align-items-center gap-2 text-dark hover-light-blue"
            style={{ transition: 'all 0.3s' }}
            onClick={() => {
              if (role === 'doctor') {
                navigate(`/doctor/encounters/${id}/reports`);
              } else {
                navigate(`/encounters/${id}/reports`);
              }
            }}
          >
            <FaFileUpload /> Upload Report
          </button>
          <button 
            className="btn btn-danger btn-sm d-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <FaTimes /> Close Encounter
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Left Column: Encounter Details */}
        <div className="col-md-3">
          <div className="bg-white shadow-sm rounded p-3 h-100">
            <h6 className="fw-bold text-primary mb-3">Encounter details</h6>
            
            <div className="mb-2">
              <small className="text-muted d-block">Name:</small>
              <span className="fw-semibold">{encounter.patient}</span>
            </div>
            <div className="mb-2">
              <small className="text-muted d-block">Email:</small>
              <span className="fw-semibold text-primary">{patientEmail || "Loading..."}</span>
            </div>
            <div className="mb-2">
              <small className="text-muted d-block">Encounter Date:</small>
              <span>{new Date(encounter.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="mb-2">
              <small className="text-muted d-block">Address:</small>
              <span>No records found</span>
            </div>
            <hr />
            <div className="mb-2">
              <small className="text-muted d-block">Clinic name:</small>
              <span>{encounter.clinic}</span>
            </div>
            <div className="mb-2">
              <small className="text-muted d-block">Doctor name:</small>
              <span>{encounter.doctor}</span>
            </div>
            <div className="mb-2">
              <small className="text-muted d-block">Description:</small>
              <span className="text-secondary">{encounter.description || "No description"}</span>
            </div>
            <div className="mt-3">
              <span className={`badge ${encounter.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                {encounter.status.toUpperCase()}
              </span>
            </div>
            
            <div className="mt-4">
              <label className="form-label small fw-bold text-muted">Select Encounter Templates</label>
              <select 
                className="form-select form-select-sm"
                onChange={handleTemplateSelect}
                defaultValue=""
              >
                <option value="" disabled>Select Template</option>
                {encounterTemplates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Detail */}
        <div className="col-md-9">
          <div className="bg-white shadow-sm rounded p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-primary mb-0">Clinical Detail</h6>
            </div>

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
                  <option value="Fever">Fever</option>
                  <option value="Headache">Headache</option>
                  <option value="Cough">Cough</option>
                  <option value="Fatigue">Fatigue</option>
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
                  <option value="Stable">Stable</option>
                  <option value="Critical">Critical</option>
                  <option value="Improving">Improving</option>
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
        </div>
      </div>

      {/* Prescription Section */}
      <div className="bg-white shadow-sm rounded p-3 mt-3 mb-4">
         <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
           <h6 className="fw-bold text-muted mb-0">Prescription</h6>
           <div className="d-flex gap-2">
             <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
               <FaFileUpload /> Email
             </button>
             <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
               <FaFileUpload /> Import data
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
                         />
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

       {/* Medical Report Section Removed - Moved to separate page */}
    </div>
  );
}
