import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast from "react-hot-toast";

const BASE = "http://localhost:3001";

const AddBill = () => {
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
    notes: "", // ADDED HERE
  });

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${BASE}/doctors`).then((res) => setDoctors(res.data));
    axios.get(`${BASE}/patients`).then((res) => setPatients(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    if (name === "doctorName") {
  const selectedDoc = doctors.find((doc) => doc._id === value);

  if (selectedDoc) {
    updatedForm.clinicName = selectedDoc.clinic || "";
  }
}


    if (name === "totalAmount" || name === "discount") {
      const total = Number(
        name === "totalAmount" ? value : updatedForm.totalAmount
      );
      const discount = Number(
        name === "discount" ? value : updatedForm.discount
      );

      updatedForm.amountDue = Math.max(total - discount, 0);
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.doctorName) return toast.error("Please select a doctor");
    if (!form.patientName) return toast.error("Please select a patient");

    try {
      setSaving(true);
      const selectedDoc = doctors.find((doc) => doc._id === form.doctorName);
      const payload = {
        ...form,

        // Convert doctor ID → doctor's full name
        doctorName: selectedDoc
          ? `${selectedDoc.firstName} ${selectedDoc.lastName}`
          : "",

        services: form.services.split(","),
      };

      await axios.post(`${BASE}/bills`, payload);
      toast.success("Bill created!");
      navigate("/BillingRecords");
    } catch (err) {
      console.error(err);
      toast.error("Error creating bill.");
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
                <label className="form-label">Doctor Name</label>
                <select
                  name="doctorName"
                  className="form-select"
                  value={form.doctorName}
                  onChange={handleChange}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => (
                    <option value={doc._id} key={doc._id}>
                      {doc.firstName} {doc.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Patient Name</label>
                <select
                  name="patientName"
                  className="form-select"
                  value={form.patientName}
                  onChange={handleChange}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option value={`${p.firstName} ${p.lastName}`}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinic Name */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Clinic Name</label>
                <input
                  name="clinicName"
                  className="form-control"
                  value={form.clinicName}
                  onChange={handleChange}
                />
              </div>

              {/* Services */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Services (comma separated)</label>
                <input
                  name="services"
                  className="form-control"
                  value={form.services}
                  onChange={handleChange}
                />
              </div>

              {/* Amounts */}
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

              {/* Date */}
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

              {/* Status */}
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

              {/* NOTES FIELD (NEW) */}
              <div className="col-md-12 mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows="3"
                  placeholder="Enter notes or additional details..."
                  value={form.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Create Bill"}
              </button>

              <button
                type="button"
                className="btn btn-secondary "
                onClick={() => navigate("/BillingRecords")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddBill;
