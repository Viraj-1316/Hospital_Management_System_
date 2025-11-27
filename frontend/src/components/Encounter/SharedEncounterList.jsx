import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaSearch, FaFilter, FaPlus, FaTimes, FaSave, FaEdit, FaTrash, FaColumns } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import "../../admin-dashboard/styles/services.css";

export default function SharedEncounterList({ role, doctorId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [encounters, setEncounters] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Filter State
  const [filters, setFilters] = useState({
    id: "",
    doctor: "",
    clinic: "",
    patient: "",
    date: "",
    status: ""
  });
  
  // Form State
  const [formData, setFormData] = useState({
    id: null, // Add ID for edit mode
    date: new Date().toISOString().split('T')[0],
    clinic: "",
    doctor: "",
    patient: "",
    description: "",
    status: "active"
  });

  // Fetch initial data
  useEffect(() => {
    fetchEncounters();
    fetchClinics();
    fetchDoctors();
    fetchPatients();
    fetchPatients();
  }, [doctorId]); // Re-fetch if doctorId changes

  // Handle patientId param
  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const p = patients.find(pat => pat._id === patientIdParam);
      if (p) {
        setFilters(prev => ({ ...prev, patient: `${p.firstName} ${p.lastName}` }));
      }
    }
  }, [patientIdParam, patients]);

  // Handle patientId param
  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const p = patients.find(pat => pat._id === patientIdParam);
      if (p) {
        setFilters(prev => ({ ...prev, patient: `${p.firstName} ${p.lastName}` }));
      }
    }
  }, [patientIdParam, patients]);

  const fetchEncounters = async () => {
    try {
      let url = "http://localhost:3001/encounters";
      if (role === 'doctor' && doctorId) {
        url += `?doctorId=${doctorId}`;
      }
      const res = await axios.get(url);
      setEncounters(res.data);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/clinics");
      setClinics(res.data.clinics || []);
    } catch (err) {
      console.error("Error fetching clinics:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:3001/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get("http://localhost:3001/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (encounter) => {
    setFormData({
      id: encounter._id,
      date: new Date(encounter.date).toISOString().split('T')[0],
      clinic: encounter.clinic,
      doctor: encounter.doctor,
      patient: encounter.patient,
      description: encounter.description || "",
      status: encounter.status
    });
    setIsFormOpen(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboard = (id) => {
    if (role === 'doctor') {
      navigate(`/doctor/encounters/${id}`);
    } else {
      navigate(`/encounter-details/${id}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let selectedDoctor;
      
      if (role === 'doctor' && doctorId) {
        // If doctor is logged in, use their ID
        // We need to find their name too if we store it as string
        selectedDoctor = doctors.find(d => d._id === doctorId);
      } else {
        selectedDoctor = doctors.find(d => `${d.firstName} ${d.lastName}` === formData.doctor || d._id === formData.doctor);
      }

      const selectedPatient = patients.find(p => `${p.firstName} ${p.lastName}` === formData.patient || p._id === formData.patient);

      // Exclude id from payload
      const { id, ...dataToSave } = formData;
      
      const payload = {
        ...dataToSave,
        doctor: selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : formData.doctor,
        doctorId: selectedDoctor ? selectedDoctor._id : null,
        patientId: selectedPatient ? selectedPatient._id : null
      };

      let res;
      if (formData.id) {
        // Update existing
        res = await axios.put(`http://localhost:3001/encounters/${formData.id}`, payload);
        toast.success("Encounter updated successfully");
      } else {
        // Create new
        res = await axios.post("http://localhost:3001/encounters", payload);
        toast.success("Encounter added successfully");
      }
      
      setIsFormOpen(false);
      
      
      // Redirect to details page if creating new
      if (!formData.id && res.data && res.data._id) {
         if (role === 'doctor') {
            navigate(`/doctor/encounters/${res.data._id}`);
         } else {
            navigate(`/encounter-details/${res.data._id}`);
         }
      } else {
         fetchEncounters();
      }
      
      // Reset form
      setFormData({
        id: null,
        date: new Date().toISOString().split('T')[0],
        clinic: "",
        doctor: "",
        patient: "",
        description: "",
        status: "active"
      });
    } catch (err) {
      console.error("Error saving encounter:", err);
      toast.error("Failed to save encounter");
    }
  };

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [encounterToDelete, setEncounterToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setEncounterToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (encounterToDelete) {
      try {
        await axios.delete(`http://localhost:3001/encounters/${encounterToDelete}`);
        toast.success("Encounter deleted");
        fetchEncounters();
      } catch (err) {
        console.error("Error deleting encounter:", err);
        toast.error("Failed to delete encounter");
      } finally {
        setIsDeleteModalOpen(false);
        setEncounterToDelete(null);
      }
    }
  };



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredEncounters = encounters.filter(enc => {
    const matchId = filters.id ? enc._id.includes(filters.id) : true;
    const matchDoctor = filters.doctor ? (enc.doctor || "").toLowerCase().includes(filters.doctor.toLowerCase()) : true;
    const matchClinic = filters.clinic ? (enc.clinic || "").toLowerCase().includes(filters.clinic.toLowerCase()) : true;
    const matchPatient = filters.patient ? (enc.patient || "").toLowerCase().includes(filters.patient.toLowerCase()) : true;
    const matchDate = filters.date ? enc.date.startsWith(filters.date) : true;
    const matchStatus = filters.status ? enc.status === filters.status : true;
    return matchId && matchDoctor && matchClinic && matchPatient && matchDate && matchStatus;
  });

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      id: null,
      date: new Date().toISOString().split('T')[0],
      clinic: "",
      doctor: "",
      patient: "",
      description: "",
      status: "active"
    });
  };

  return (
    <div className="container-fluid mt-3">
      <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-white mb-0">Patients Encounter List</h5>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" 
            onClick={handleCloseForm}
          >
             Back
          </button>
          {!isFormOpen ? (
            <button 
              className="btn btn-light btn-sm d-flex align-items-center gap-2"
              onClick={() => setIsFormOpen(true)}
            >
              <FaPlus /> Add encounter
            </button>
          ) : (
            <button 
              className="btn btn-light btn-sm d-flex align-items-center gap-2"
              onClick={handleCloseForm}
            >
              <FaTimes /> Close Form
            </button>
          )}
        </div>
      </div>
      
      {/* Slide Down Form */}
      <div 
        className="bg-white shadow-sm rounded mb-4 overflow-hidden"
        style={{
          maxHeight: isFormOpen ? "1000px" : "0",
          opacity: isFormOpen ? 1 : 0,
          transition: "all 0.5s ease-in-out",
          padding: isFormOpen ? "20px" : "0 20px"
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Encounter Date <span className="text-danger">*</span></label>
              <input 
                type="date" 
                className="form-control" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Select Clinic <span className="text-danger">*</span></label>
              <select 
                className="form-select" 
                name="clinic"
                value={formData.clinic}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Clinic</option>
                {Array.isArray(clinics) && clinics.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            {/* Show Doctor Dropdown only if NOT doctor role */}
            {role !== 'doctor' && (
              <div className="col-md-4">
                <label className="form-label fw-bold">Doctor <span className="text-danger">*</span></label>
                <select 
                  className="form-select" 
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Search Doctor</option>
                  {doctors.map(d => (
                    <option key={d._id} value={`${d.firstName} ${d.lastName}`}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-4">
              <label className="form-label fw-bold">Patient <span className="text-danger">*</span></label>
              <select 
                className="form-select" 
                name="patient"
                value={formData.patient}
                onChange={handleInputChange}
                required
              >
                <option value="">Search Patient</option>
                {patients.map(p => (
                  <option key={p._id} value={`${p.firstName} ${p.lastName}`}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label fw-bold">Description</label>
              <textarea 
                className="form-control" 
                name="description"
                placeholder="Description"
                rows="1"
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button 
              type="submit" 
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <FaSave /> Save
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={handleCloseForm}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Filters & Table */}
      <div className="bg-white shadow-sm rounded p-3">
        <div className="input-group mb-3">
          <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted"/></span>
          <input type="text" className="form-control border-start-0" placeholder="Search encounter data by id, doctor, clinic, patient, date and status" />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col"><input type="checkbox" /></th>
                <th scope="col">ID</th>
                <th scope="col">Doctor Name</th>
                <th scope="col">Clinic Name</th>
                <th scope="col">Patient Name</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Filter Row */}
              <tr>
                <td></td>
                <td><input type="text" className="form-control form-control-sm" placeholder="ID" name="id" value={filters.id} onChange={handleFilterChange} /></td>
                <td><input type="text" className="form-control form-control-sm" placeholder="Filter by doctor" name="doctor" value={filters.doctor} onChange={handleFilterChange} /></td>
                <td><input type="text" className="form-control form-control-sm" placeholder="Filter by clinic" name="clinic" value={filters.clinic} onChange={handleFilterChange} /></td>
                <td><input type="text" className="form-control form-control-sm" placeholder="Filter by patient" name="patient" value={filters.patient} onChange={handleFilterChange} /></td>
                <td><input type="date" className="form-control form-control-sm" name="date" value={filters.date} onChange={handleFilterChange} /></td>
                <td>
                  <select className="form-select form-select-sm" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Filter by status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td></td>
              </tr>

              {/* Data Rows */}
              {filteredEncounters.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No Data Found</td>
                </tr>
              ) : (
                filteredEncounters.map((enc, index) => (
                  <tr key={enc._id}>
                    <td><input type="checkbox" /></td>
                    <td>{index + 1}</td>
                    <td>{enc.doctor}</td>
                    <td>{enc.clinic}</td>
                    <td>{enc.patient}</td>
                    <td>{new Date(enc.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${enc.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {enc.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                          onClick={() => handleEdit(enc)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-info"
                          title="Encounter Dashboard"
                          onClick={() => handleDashboard(enc._id)}
                        >
                          <FaColumns />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => handleDeleteClick(enc._id)}
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
        
        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Rows per page:</span>
            <select className="form-select form-select-sm" style={{width: '70px'}}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
             <span className="text-muted small">Page 1 of {Math.ceil(filteredEncounters.length / 10) || 1}</span>
             <button className="btn btn-sm btn-outline-secondary" disabled>Prev</button>
             <button className="btn btn-sm btn-outline-secondary" disabled>Next</button>
          </div>
        </div>
        
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => setIsDeleteModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this encounter?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
