// src/admin-dashboard/admin/Settings/PdfTemplate/PdfTemplate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PdfTemplate.css";

const BASE = "http://localhost:3001";

export default function PdfTemplate() {
  const [tpl, setTpl] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    logoPath: "",
    footerMessage: "",
    qrEnabled: true,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState("one-template");

  useEffect(() => {
    axios
      .get(`${BASE}/settings/pdf-template`)
      .then((res) => {
        if (res.data) {
          setTpl(res.data);
          setTemplateId(res.data._id || "one-template");
        }
      })
      .catch((err) => console.warn("Template load error:", err));
  }, []);

  // --------------------
  // INPUT CHANGE
  // --------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTpl((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --------------------
  // LOGO UPLOAD PREVIEW
  // --------------------
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file);

    // preview the image before uploading
    const reader = new FileReader();
    reader.onload = () =>
      setTpl((prev) => ({ ...prev, logoPath: reader.result }));
    reader.readAsDataURL(file);
  };

  // --------------------
  // SEND LOGO TO SERVER
  // --------------------
  const uploadLogoToServer = async () => {
    if (!logoFile) return tpl.logoPath;

    const toDataURL = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const dataUrl = await toDataURL(logoFile);
    const filename = `logo-${Date.now()}.png`;

    const res = await axios.post(`${BASE}/settings/upload-logo`, {
      filename,
      dataUrl,
    });

    return res.data.path;
  };

  // --------------------
  // SAVE TEMPLATE
  // --------------------
  const handleSave = async () => {
    try {
      setSaving(true);

      let logoPath = tpl.logoPath;

      // upload new image if selected
      if (logoFile) {
        logoPath = await uploadLogoToServer();
      }

      const payload = { ...tpl, logoPath };

      const res = await axios.put(
        `${BASE}/settings/pdf-template/${templateId}`,
        payload
      );

      alert("Template updated successfully");
      setTpl(res.data.data);
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // --------------------
  // DOWNLOAD TEMPLATE PDF
  // --------------------
  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get(`${BASE}/settings/pdf-template/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-preview.pdf";
      a.click();
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download template PDF");
    }
  };

  return (
    <div className="pdf-template-page card p-4">
      <h4 className="mb-3">PDF Template Settings</h4>

      {/* CLINIC INFO */}
      <div className="card p-3 mb-3">
        <h5>Clinic Information</h5>

        <input
          className="form-control mb-2"
          placeholder="Clinic Name"
          name="clinicName"
          value={tpl.clinicName}
          onChange={handleChange}
        />

        <input
          className="form-control mb-2"
          placeholder="Clinic Address"
          name="clinicAddress"
          value={tpl.clinicAddress}
          onChange={handleChange}
        />

        <input
          className="form-control mb-2"
          placeholder="Phone"
          name="clinicPhone"
          value={tpl.clinicPhone}
          onChange={handleChange}
        />

        <input
          className="form-control mb-2"
          placeholder="Clinic Email"
          name="clinicEmail"
          value={tpl.clinicEmail}
          onChange={handleChange}
        />
      </div>

      {/* LOGO UPLOAD */}
      <div className="card p-3 mb-3">
        <h5>Logo Upload</h5>

        <input type="file" accept="image/*" onChange={handleLogoSelect} />

        {tpl.logoPath && (
          <img
            src={
              tpl.logoPath.startsWith("/")
                ? `${BASE}${tpl.logoPath}`
                : tpl.logoPath
            }
            alt="logo"
            className="mt-2"
            style={{ maxWidth: 150, maxHeight: 80 }}
          />
        )}
      </div>

      {/* FOOTER */}
      <div className="card p-3 mb-3">
        <h5>Footer Message</h5>
        <textarea
          className="form-control"
          rows={3}
          name="footerMessage"
          value={tpl.footerMessage}
          onChange={handleChange}
        />
      </div>

      {/* QR ON/OFF */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          name="qrEnabled"
          checked={tpl.qrEnabled}
          onChange={handleChange}
        />
        <label className="form-check-label">Enable QR Code</label>
      </div>

      {/* BUTTONS */}
      <button
        className="btn btn-primary mb-3"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Template"}
      </button>

      <button className="btn btn-success" onClick={handleDownloadTemplate}>
        Download Template PDF
      </button>
    </div>
  );
}
