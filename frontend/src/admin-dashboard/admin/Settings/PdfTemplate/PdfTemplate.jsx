import React, { useState, useEffect } from "react";
import axios from "axios";
import "./pdfTemplate.css";

const BASE_URL = "http://localhost:3001";

const PdfTemplate = () => {
  const [form, setForm] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    footerMessage: "",
    qrEnabled: true,
  });

  const [templateSelected, setTemplateSelected] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/pdf-template`);
      if (res.data?.data) {
        const t = res.data.data;
        setForm({
          clinicName: t.clinicName,
          clinicAddress: t.clinicAddress,
          clinicPhone: t.clinicPhone,
          clinicEmail: t.clinicEmail,
          footerMessage: t.footerMessage,
          qrEnabled: t.qrEnabled,
        });
        if (t.logoPath) setLogoPreview(BASE_URL + t.logoPath);
      }
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const saveTemplate = async () => {
    try {
      const fd = new FormData();
      Object.keys(form).forEach((key) => fd.append(key, form[key]));
      fd.append("templateType", templateSelected || "default");

      if (logoFile) fd.append("logo", logoFile);

      await axios.post(`${BASE_URL}/api/pdf-template`, fd);
      alert("Template saved successfully!");
    } catch (err) {
      alert("Save failed!");
      console.log(err);
    }
  };

  const downloadTemplatePDF = async () => {
    if (!templateSelected) return alert("Please select a template!");

    try {
      const response = await axios.get(
        `${BASE_URL}/api/pdf-template/download/${templateSelected}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "clinic-template.pdf";
      a.click();
    } catch (err) {
      console.log(err);
      alert("Failed to download preview PDF");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4 rounded-4">
        <h2 className="fw-bold mb-4">PDF Template Settings</h2>

        {/* ---------- TEMPLATE SELECTOR (NEW) ---------- */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Choose Template</label>
          <select
            className="form-select form-select-lg"
            value={templateSelected}
            onChange={(e) => setTemplateSelected(e.target.value)}
          >
            <option value="">-- Select Template --</option>
            <option value="templateA">Template A</option>
            <option value="templateB">Template B</option>
            <option value="templateC">Template C</option>
          </select>

          <button
            onClick={downloadTemplatePDF}
            className="btn btn-outline-primary btn-lg mt-3 rounded-3"
          >
            Preview This Template
          </button>
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Clinic Name</label>
            <input
              type="text"
              name="clinicName"
              className="form-control form-control-lg"
              value={form.clinicName}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Clinic Address</label>
            <textarea
              name="clinicAddress"
              className="form-control form-control-lg"
              rows={2}
              value={form.clinicAddress}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Clinic Phone</label>
            <input
              type="text"
              name="clinicPhone"
              className="form-control form-control-lg"
              value={form.clinicPhone}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Clinic Email</label>
            <input
              type="email"
              name="clinicEmail"
              className="form-control form-control-lg"
              value={form.clinicEmail}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-12">
            <label className="form-label fw-semibold">Footer Message</label>
            <textarea
              name="footerMessage"
              className="form-control form-control-lg"
              rows={2}
              value={form.footerMessage}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* QR toggle */}
          <div className="col-md-12 d-flex align-items-center">
            <input
              type="checkbox"
              name="qrEnabled"
              className="form-check-input me-2"
              checked={form.qrEnabled}
              onChange={handleChange}
            />
            <label className="form-check-label fw-semibold">
              Enable QR Code
            </label>
          </div>

          {/* Upload Logo */}
          <div className="col-md-12">
            <label className="form-label fw-semibold">Upload Logo</label>
            <input
              type="file"
              className="form-control form-control-lg"
              onChange={handleLogo}
            />
          </div>

          {/* LOGO BELOW THE UPLOAD FIELD */}
          <div className="col-md-12 text-center mt-3">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="img-thumbnail shadow-sm"
                style={{
                  width: "170px",
                  height: "170px",
                  borderRadius: "14px",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </div>

        <div className="text-end mt-4">
          <button
            className="btn btn-primary btn-lg px-4 rounded-4 shadow"
            onClick={saveTemplate}
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfTemplate;
