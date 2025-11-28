import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTimes, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import "../../admin-dashboard/styles/admin-shared.css";

export default function SharedEncounterTemplateDetails({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
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

  useEffect(() => {
    fetchTemplateDetails();
  }, [id]);

  const fetchTemplateDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/encounter-templates/${id}`);
      setTemplate(res.data);
      setProblems(res.data.problems || []);
      setObservations(res.data.observations || []);
      setNotes(res.data.notes || []);
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error("Error fetching template details:", err);
      toast.error("Failed to load template details");
    } finally {
      setLoading(false);
    }
  };

  const updateTemplateData = async (updatedFields) => {
    try {
      // Sanitize prescriptions to remove temp IDs (timestamps)
      let payload = { ...updatedFields };
      
      if (payload.prescriptions) {
        payload.prescriptions = payload.prescriptions.map(p => {
          // If _id is a timestamp (13 chars) or not a valid ObjectId (24 hex chars), remove it
          if (p._id && (p._id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(p._id))) {
            const { _id, ...rest } = p;
            return rest;
          }
          return p;
        });
      }

      await axios.put(`http://localhost:3001/encounter-templates/${id}`, payload);
    } catch (err) {
      console.error("Error updating template:", err);
      toast.error("Failed to save changes");
    }
  };

  // --- Problems Logic ---
  const handleAddProblem = (e) => {
    const value = e.target.value;
    if (value && value !== "Select Problem") {
      const updatedProblems = [...problems, value];
      setProblems(updatedProblems);
      updateTemplateData({ problems: updatedProblems });
      e.target.value = "Select Problem"; // Reset dropdown
    }
  };

  const handleRemoveProblem = (index) => {
    const updatedProblems = problems.filter((_, i) => i !== index);
    setProblems(updatedProblems);
    updateTemplateData({ problems: updatedProblems });
  };

  // --- Observations Logic ---
  const handleAddObservation = (e) => {
    const value = e.target.value;
    if (value && value !== "Select Observation") {
      const updatedObservations = [...observations, value];
      setObservations(updatedObservations);
      updateTemplateData({ observations: updatedObservations });
      e.target.value = "Select Observation"; // Reset dropdown
    }
  };

  const handleRemoveObservation = (index) => {
    const updatedObservations = observations.filter((_, i) => i !== index);
    setObservations(updatedObservations);
    updateTemplateData({ observations: updatedObservations });
  };

  // --- Notes Logic ---
  const handleAddNote = () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      updateTemplateData({ notes: updatedNotes });
      setNewNote("");
    }
  };

  const handleRemoveNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    updateTemplateData({ notes: updatedNotes });
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
      // Update existing
      updatedPrescriptions = [...prescriptions];
      // Keep the original _id if it exists
      updatedPrescriptions[editingPrescriptionIndex] = { 
        ...newPrescription, 
        _id: prescriptions[editingPrescriptionIndex]._id 
      };
    } else {
      // Add new
      updatedPrescriptions = [...prescriptions, { ...newPrescription, _id: Date.now().toString() }];
    }

    setPrescriptions(updatedPrescriptions);
    updateTemplateData({ prescriptions: updatedPrescriptions });
    
    // Reset
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
    updateTemplateData({ prescriptions: updatedPrescriptions });
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;
  if (!template) return <div className="p-5 text-center">Template not found</div>;

  return (
    <div className="container-fluid mt-3">
      {/* Header */}
      <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-white mb-0">Clinical Detail</h5>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-3 mb-3">
         <h6 className="fw-bold text-primary mb-3">Template Name: {template.name}</h6>
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

      {/* Prescription Section */}
      <div className="bg-white shadow-sm rounded p-3 mt-3 mb-4">
         <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
           <h6 className="fw-bold text-muted mb-0">Prescription</h6>
           <div className="d-flex gap-2">
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
    </div>
  );
}
