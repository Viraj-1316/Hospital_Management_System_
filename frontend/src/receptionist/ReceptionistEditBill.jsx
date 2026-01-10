import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API_BASE from "../config";

/* ---------- SCOPED CSS ---------- */
const editBillStyles = `
  .edit-bill-scope { 
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
    background-color: #f5f7fb; 
  }
  .edit-bill-scope .main-content { 
    min-height: 100vh; 
    transition: margin-left 0.3s; 
  }
  
  /* --- Top Bar --- */
  .edit-bill-scope .page-title-bar {
    background-color: #fff;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
  }
  .edit-bill-scope .page-title {
    color: #333;
    font-weight: 700;
    font-size: 1.2rem;
    margin: 0;
  }

  /* --- Form Card --- */
  .edit-bill-scope .form-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin: 20px 30px;
    padding: 30px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  }

  .edit-bill-scope .form-section {
    margin-bottom: 25px;
  }

  .edit-bill-scope .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e0e0e0;
  }

  .edit-bill-scope .form-group {
    margin-bottom: 20px;
  }

  .edit-bill-scope .form-label {
    display: block;
    font-weight: 600;
    color: #495057;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .edit-bill-scope .form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.95rem;
    transition: border-color 0.15s;
    outline: none;
  }

  .edit-bill-scope .form-control:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }

  .edit-bill-scope .form-control:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  .edit-bill-scope .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.95rem;
    transition: border-color 0.15s;
    outline: none;
    background-color: white;
  }

  .edit-bill-scope .form-select:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }

  /* Services Table */
  .edit-bill-scope .services-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  .edit-bill-scope .services-table th {
    background-color: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border: 1px solid #dee2e6;
    font-size: 0.9rem;
  }

  .edit-bill-scope .services-table td {
    padding: 10px 12px;
    border: 1px solid #dee2e6;
  }

  .edit-bill-scope .services-table input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .edit-bill-scope .btn-remove-service {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s;
  }

  .edit-bill-scope .btn-remove-service:hover {
    background-color: #bb2d3b;
  }

  .edit-bill-scope .btn-add-service {
    background-color: #198754;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
  }

  .edit-bill-scope .btn-add-service:hover {
    background-color: #146c43;
  }

  /* Summary Section */
  .edit-bill-scope .bill-summary {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-top: 20px;
  }

  .edit-bill-scope .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 0.95rem;
  }

  .edit-bill-scope .summary-row.total {
    border-top: 2px solid #dee2e6;
    margin-top: 10px;
    padding-top: 12px;
    font-weight: 700;
    font-size: 1.1rem;
    color: #0d6efd;
  }

  /* Action Buttons */
  .edit-bill-scope .action-buttons {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }

  .edit-bill-scope .btn {
    padding: 10px 24px;
    border: none;
    border-radius: 4px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .edit-bill-scope .btn-primary {
    background-color: #0d6efd;
    color: white;
  }

  .edit-bill-scope .btn-primary:hover {
    background-color: #0b5ed7;
  }

  .edit-bill-scope .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .edit-bill-scope .btn-secondary:hover {
    background-color: #5c636a;
  }

  .edit-bill-scope .row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .edit-bill-scope .col {
    flex: 1;
    min-width: 250px;
  }

  /* Loading Spinner */
  .edit-bill-scope .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    flex-direction: column;
    gap: 15px;
  }

  .edit-bill-scope .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0d6efd;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function ReceptionistEditBill({ sidebarCollapsed = false, toggleSidebar }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Get receptionist/clinic info from localStorage
  let authUser = {};
  let receptionist = {};
  try {
    authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    receptionist = JSON.parse(localStorage.getItem("receptionist") || "{}");
  } catch (e) {
    authUser = {};
    receptionist = {};
  }
  
  const clinicName = receptionist?.clinic || authUser?.clinic || authUser?.clinicName || "";

  // Form State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    encounterId: "",
    encounterCustomId: "",
    doctorName: "",
    clinicName: "",
    patientName: "",
    services: [{ name: "", cost: 0 }],
    discount: 0,
    status: "unpaid",
    date: new Date().toISOString().split('T')[0]
  });

  const [encounters, setEncounters] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountDue, setAmountDue] = useState(0);

  // --- FETCH BILL DATA AND ENCOUNTERS ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
        
        // Fetch bill data
        const billRes = await axios.get(`${API_BASE}/bills/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const billData = billRes.data.bill || billRes.data;

        // Fetch encounters for the dropdown
        const params = clinicName ? { clinic: clinicName } : {};
        const encRes = await axios.get(`${API_BASE}/encounters`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        const encData = Array.isArray(encRes.data) 
          ? encRes.data 
          : encRes.data.encounters || encRes.data.data || [];

        setEncounters(encData);

        // Format services
        let services = [{ name: "", cost: 0 }];
        if (Array.isArray(billData.services) && billData.services.length > 0) {
          services = billData.services.map(s => ({
            name: typeof s === 'string' ? s : (s.name || ""),
            cost: typeof s === 'object' ? (s.cost || 0) : 0
          }));
        }

        setFormData({
          encounterId: billData.encounterId?._id || billData.encounterId || "",
          encounterCustomId: billData.encounterCustomId || "",
          doctorName: billData.doctorName || "",
          clinicName: billData.clinicName || clinicName,
          patientName: billData.patientName || "",
          services: services,
          discount: billData.discount || 0,
          status: billData.status || "unpaid",
          date: billData.date ? new Date(billData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });

      } catch (err) {
        console.error("Error fetching bill data:", err);
        toast.error("Failed to load bill data");
        navigate("/receptionist/edit-bill/:id");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, clinicName, navigate]);

  // --- CALCULATE TOTALS ---
  useEffect(() => {
    const total = formData.services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
    const due = total - (parseFloat(formData.discount) || 0);
    setTotalAmount(total);
    setAmountDue(Math.max(0, due));
  }, [formData.services, formData.discount]);

  // --- HANDLE ENCOUNTER SELECTION ---
  const handleEncounterChange = (e) => {
    const selectedId = e.target.value;
    const encounter = encounters.find(enc => enc._id === selectedId);
    
    if (encounter) {
      setFormData(prev => ({
        ...prev,
        encounterId: selectedId,
        encounterCustomId: encounter.encounterId || `ENC-${selectedId.substring(0, 6)}`,
        doctorName: encounter.doctorName || "",
        patientName: encounter.patientName || "",
        clinicName: encounter.clinicName || clinicName
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        encounterId: selectedId
      }));
    }
  };

  // --- HANDLE SERVICE CHANGES ---
  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [field]: field === 'cost' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({ ...prev, services: newServices }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: "", cost: 0 }]
    }));
  };

  const removeService = (index) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, services: newServices }));
    }
  };

  // --- HANDLE FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.encounterId) {
      toast.error("Please select an encounter");
      return;
    }
    
    if (!formData.patientName) {
      toast.error("Patient name is required");
      return;
    }

    const validServices = formData.services.filter(s => s.name.trim() !== "");
    if (validServices.length === 0) {
      toast.error("Please add at least one service");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("receptionistToken");
      
      const payload = {
        ...formData,
        services: validServices,
        totalAmount,
        amountDue
      };

      await axios.put(`${API_BASE}/bills/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Bill updated successfully!");
      setTimeout(() => {
        navigate("/receptionist/billing-records");
      }, 1000);
    } catch (err) {
      console.error("Error updating bill:", err);
      toast.error(err.response?.data?.message || "Failed to update bill");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex edit-bill-scope">
        <style>{editBillStyles}</style>
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="flex-grow-1 main-content" style={{ marginLeft: sidebarCollapsed ? 64 : 250 }}>
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading bill data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex edit-bill-scope">
      <style>{editBillStyles}</style>
      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex-grow-1 main-content" style={{ marginLeft: sidebarCollapsed ? 64 : 250 }}>
        <Navbar toggleSidebar={toggleSidebar} />
        <Toaster position="top-right" />

        <div className="page-title-bar">
          <h5 className="page-title">Edit Bill</h5>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            
            {/* Basic Information */}
            <div className="form-section">
              <h6 className="section-title">Bill Information</h6>
              
              <div className="row">
                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Encounter *</label>
                    <select 
                      className="form-select"
                      value={formData.encounterId}
                      onChange={handleEncounterChange}
                      required
                    >
                      <option value="">Select Encounter</option>
                      {encounters.map(enc => (
                        <option key={enc._id} value={enc._id}>
                          {enc.encounterId || `ENC-${enc._id.substring(0, 6)}`} - {enc.patientName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={formData.patientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Doctor Name</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={formData.doctorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Clinic Name</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={formData.clinicName}
                      disabled
                    />
                  </div>
                </div>

                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select 
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="form-section">
              <h6 className="section-title">Services</h6>
              
              <table className="services-table">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Service Name</th>
                    <th style={{ width: '30%' }}>Cost ($)</th>
                    <th style={{ width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.services.map((service, index) => (
                    <tr key={index}>
                      <td>
                        <input 
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                          placeholder="Enter service name"
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          value={service.cost}
                          onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button"
                          className="btn-remove-service"
                          onClick={() => removeService(index)}
                          disabled={formData.services.length === 1}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                type="button"
                className="btn-add-service"
                onClick={addService}
              >
                <FaPlus /> Add Service
              </button>
            </div>

            {/* Bill Summary */}
            <div className="form-section">
              <h6 className="section-title">Bill Summary</h6>
              
              <div className="row">
                <div className="col">
                  <div className="form-group">
                    <label className="form-label">Discount ($)</label>
                    <input 
                      type="number"
                      className="form-control"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max={totalAmount}
                    />
                  </div>
                </div>
                <div className="col"></div>
              </div>

              <div className="bill-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>-${(formData.discount || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Amount Due:</span>
                  <span>${amountDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/receptionist/billing-records")}
                disabled={submitting}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <FaSave /> {submitting ? "Updating..." : "Update Bill"}
              </button>
            </div>

          </form>
        </div>

        <div className="px-4 text-muted small">© OneCare</div>
      </div>
    </div>
  );
}