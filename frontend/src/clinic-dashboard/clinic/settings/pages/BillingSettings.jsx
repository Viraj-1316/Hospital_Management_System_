// frontend/src/clinic-dashboard/clinic/settings/pages/BillingSettings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FaFileInvoice, 
  FaHashtag, 
  FaMoneyBillWave, 
  FaFileAlt, 
  FaPlus, 
  FaTrash,
  FaSave,
  FaSpinner 
} from "react-icons/fa";
import API_BASE from "../../../../config";

const BillingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicData, setClinicData] = useState({
    gstin: "",
    billPrefix: "INV-",
    termsAndConditions: [
      "This is a computer-generated invoice and does not require a physical signature.",
      "Please preserve this receipt for future medical history and follow-up consultations.",
      "Amount once paid is non-refundable as per hospital policy."
    ]
  });
  const [clinicId, setClinicId] = useState(null);

  // Fetch clinic data on mount
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        
        // Get clinic ID from auth user
        const cId = authUser.clinicId;
        if (!cId) {
          toast.error("Unable to determine clinic. Please re-login.");
          setLoading(false);
          return;
        }
        
        setClinicId(cId);
        
        // Fetch clinic details
        const response = await axios.get(`${API_BASE}/api/clinics/${cId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const clinic = response.data.clinic || response.data;
        
        setClinicData({
          gstin: clinic.gstin || "",
          billPrefix: clinic.billPrefix || "INV-",
          termsAndConditions: clinic.termsAndConditions?.length > 0 
            ? clinic.termsAndConditions 
            : [
                "This is a computer-generated invoice and does not require a physical signature.",
                "Please preserve this receipt for future medical history and follow-up consultations.",
                "Amount once paid is non-refundable as per hospital policy."
              ]
        });
      } catch (error) {
        console.error("Error fetching clinic data:", error);
        toast.error("Failed to load billing settings");
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setClinicData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Terms & Conditions changes
  const handleTermChange = (index, value) => {
    const newTerms = [...clinicData.termsAndConditions];
    newTerms[index] = value;
    setClinicData(prev => ({ ...prev, termsAndConditions: newTerms }));
  };

  // Add new term
  const addTerm = () => {
    setClinicData(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, ""]
    }));
  };

  // Remove term
  const removeTerm = (index) => {
    const newTerms = clinicData.termsAndConditions.filter((_, i) => i !== index);
    setClinicData(prev => ({ ...prev, termsAndConditions: newTerms }));
  };

  // Save settings
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!clinicId) {
      toast.error("Clinic ID not found");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      // Filter out empty terms
      const filteredTerms = clinicData.termsAndConditions.filter(t => t.trim() !== "");
      
      await axios.put(
        `${API_BASE}/api/clinics/${clinicId}`,
        {
          gstin: clinicData.gstin,
          billPrefix: clinicData.billPrefix,
          termsAndConditions: filteredTerms
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Billing settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save billing settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <FaSpinner className="fa-spin me-2" size={24} />
        <span>Loading billing settings...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <FaFileInvoice className="text-primary me-3" size={28} />
        <div>
          <h4 className="mb-0 fw-bold">Billing Settings</h4>
          <small className="text-muted">Configure invoice and billing preferences</small>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* Top Section: GSTIN and Prefix Side-by-Side */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                <div className="d-flex align-items-center mb-0">
                  <div className="bg-light p-2 rounded-circle me-3 text-success">
                    <FaMoneyBillWave size={20} />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Tax Configuration</h6>
                    <small className="text-muted" style={{fontSize: '0.85rem'}}>Manage tax identification details</small>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 pb-4 pt-3">
                <label className="form-label fw-semibold text-secondary small text-uppercase ls-1">GSTIN Number</label>
                <input
                  type="text"
                  name="gstin"
                  className="form-control form-control-lg bg-light border-0 fs-6"
                  placeholder="e.g., 27AABCU9603R1ZM"
                  value={clinicData.gstin}
                  onChange={handleChange}
                  maxLength={15}
                />
                <div className="form-text text-muted mt-2">
                  <small>Enter your 15-character Goods and Services Tax Identification Number.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                <div className="d-flex align-items-center mb-0">
                  <div className="bg-light p-2 rounded-circle me-3 text-primary">
                    <FaHashtag size={20} />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Invoice Formatting</h6>
                    <small className="text-muted" style={{fontSize: '0.85rem'}}>Customize invoice numbering</small>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 pb-4 pt-3">
                <label className="form-label fw-semibold text-secondary small text-uppercase ls-1">Invoice Prefix</label>
                <div className="input-group">
                  <input
                    type="text"
                    name="billPrefix"
                    className="form-control form-control-lg bg-light border-0 fs-6"
                    placeholder="e.g., INV-"
                    value={clinicData.billPrefix}
                    onChange={handleChange}
                    maxLength={10}
                  />
                  <span className="input-group-text bg-white border-0 text-muted">Example: <strong>{clinicData.billPrefix}001</strong></span>
                </div>
                 <div className="form-text text-muted mt-2">
                  <small>This prefix will appear before every bill number generated.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Terms */}
          <div className="col-12">
            <div className="card shadow-sm border-0">
               <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                 <div className="d-flex align-items-center">
                    <div className="bg-light p-2 rounded-circle me-3 text-warning">
                      <FaFileAlt size={18} />
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">Terms & Conditions</h6>
                      <small className="text-muted" style={{fontSize: '0.85rem'}}>Policies displayed on invoices</small>
                    </div>
                 </div>
                 <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-3 fw-medium"
                    onClick={addTerm}
                  >
                    <FaPlus className="me-1" size={12} /> Add New Term
                  </button>
               </div>
              <div className="card-body p-4">
                {clinicData.termsAndConditions.map((term, index) => (
                  <div key={index} className="d-flex align-items-start mb-3 animate__animated animate__fadeIn">
                    <div className="d-flex flex-column align-items-center me-3 pt-2">
                       <span className="badge bg-light text-secondary border rounded-pill" style={{width: '24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center'}}>{index + 1}</span>
                    </div>
                    <div className="flex-grow-1">
                      <textarea
                        className="form-control bg-light border-0"
                        rows={2}
                        value={term}
                        onChange={(e) => handleTermChange(index, e.target.value)}
                        placeholder={`Enter term ${index + 1}...`}
                        style={{resize: 'none'}}
                      />
                    </div>
                     <button
                        type="button"
                        className="btn btn-link text-danger ms-2 p-1"
                        onClick={() => removeTerm(index)}
                        title="Remove term"
                        disabled={clinicData.termsAndConditions.length <= 1}
                      >
                        <FaTrash size={16} className={clinicData.termsAndConditions.length <= 1 ? "text-muted" : ""} />
                      </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="col-12 text-end mt-2">
             <button
                type="submit"
                className="btn btn-primary btn-lg px-5 rounded-3 shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="fa-spin me-2" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Save Configuration
                  </>
                )}
              </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BillingSettings;
