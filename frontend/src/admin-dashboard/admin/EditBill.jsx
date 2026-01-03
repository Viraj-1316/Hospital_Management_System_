import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import API_BASE from "../../config";

const EditBill = ({ sidebarCollapsed, toggleSidebar }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    doctorName: "",
    clinicName: "",
    patientName: "",
    services: "",
    totalAmount: "",
    discount: "",
    amountDue: "",
    date: "",
    status: "unpaid",
    notes: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔵 Fetch doctors + patients + bill data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [docRes, patRes, billRes] = await Promise.all([
          axios.get(`${API_BASE}/doctors`, config),
          axios.get(`${API_BASE}/patients`, config),
          axios.get(`${API_BASE}/bills/${id}`, config),
        ]);

        setDoctors(docRes.data);
        setPatients(patRes.data);

        const bill = billRes.data;

        // Handle services - can be array of strings or array of objects
        let servicesStr = "";
        if (Array.isArray(bill.services)) {
          servicesStr = bill.services.map(svc =>
            typeof svc === 'string' ? svc : (svc.name || '')
          ).filter(Boolean).join(", ");
        } else if (typeof bill.services === 'string') {
          servicesStr = bill.services;
        }

        // Format date for input field
        let dateStr = "";
        if (bill.date) {
          const d = new Date(bill.date);
          dateStr = d.toISOString().split("T")[0];
        }

        setForm({
          doctorName: bill.doctorName || "",
          clinicName: bill.clinicName || "",
          patientName: bill.patientName || "",
          services: servicesStr,
          totalAmount: bill.totalAmount || "",
          discount: bill.discount || 0,
          amountDue: bill.amountDue || "",
          date: dateStr,
          status: bill.status || "unpaid",
          notes: bill.notes || "",
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Error loading bill.");
      }
    };

    loadData();
  }, [id]);

  // 🔵 Handle inputs + auto calculate due
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

    if (name === "totalAmount" || name === "discount") {
      const total = Number(
        name === "totalAmount" ? value : updated.totalAmount
      );
      const discount = Number(
        name === "discount" ? value : updated.discount
      );

      updated.amountDue = Math.max(total - discount, 0);
    }

    setForm(updated);
  };

  // 🔵 Update bill
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.doctorName) return alert("Please select a doctor");
    if (!form.patientName) return alert("Please select a patient");
    if (!form.totalAmount) return alert("Total Amount required");
    if (!form.date) return alert("Select billing date");

    const payload = {
      ...form,
      services: form.services.split(",").map((s) => s.trim()),
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/bills/${id}`, payload, config);
      alert("Bill updated successfully!");
      navigate("/BillingRecords");
    } catch (err) {
      console.error(err);
      alert("Error updating bill.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
        <div className="container-fluid text-center p-5">
          <h4>Loading Bill...</h4>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}>
      <div className="container-fluid">
        <h4 className="fw-bold text-primary mb-4">Edit Bill</h4>

        <div className="card shadow-sm p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">

              {/* 🔵 Doctor Dropdown */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Doctor Name</label>
                <select
                  name="doctorName"
                  className="form-select"
                  value={form.doctorName}
                  onChange={handleChange}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => {
                    const name = doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
                    return (
                      <option key={doc._id} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 🔵 Patient Dropdown */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Patient Name</label>
                <select
                  name="patientName"
                  className="form-select"
                  value={form.patientName}
                  onChange={handleChange}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => {
                    const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim();
                    return (
                      <option key={p._id} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Other fields remain same */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Clinic Name</label>
                <input
                  name="clinicName"
                  className="form-control"
                  value={form.clinicName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label>Services (comma separated)</label>
                <input
                  name="services"
                  className="form-control"
                  value={form.services}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label>Total Amount (₹)</label>
                <input
                  type="number"
                  name="totalAmount"
                  className="form-control"
                  value={form.totalAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label>Discount (₹)</label>
                <input
                  type="number"
                  name="discount"
                  className="form-control"
                  value={form.discount}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label>Amount Due (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.amountDue}
                  readOnly
                />
              </div>

              <div className="col-md-6 mb-3">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label>Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div className="col-12 mb-3">
                <label>Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows="3"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* ------- UPDATE BUTTON ------- */}
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Updating..." : "Update Bill"}
            </button>

            {/* ------- CANCEL BUTTON (ADDED) ------- */}
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
