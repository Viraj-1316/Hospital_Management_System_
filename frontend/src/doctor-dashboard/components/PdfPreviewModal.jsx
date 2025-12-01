// src/components/PdfPreviewModal.jsx
import React, { useEffect, useState } from "react";
import "../styles/PdfPreviewModal.css";
import { FaDownload, FaPen, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";

export default function PdfPreviewModal({
  open,
  onClose,
  appointmentId,
  defaultFilename = "appointment.pdf",
  onEditLayout, // optional custom handler
}) {
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !appointmentId) return;

    let cancelled = false;

    // clear old blob if any
    setBlobUrl((old) => {
      if (old) {
        URL.revokeObjectURL(old);
      }
      return null;
    });

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/appointments/${appointmentId}/pdf`,
          {
            method: "GET",
            headers: { Accept: "application/pdf" },
          }
        );

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error("Failed to load PDF preview:", err);
        setError("Failed to load preview. Try downloading instead.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  const handleDownload = async () => {
    try {
      if (blobUrl) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      setLoading(true);
      const res = await fetch(
        `${API_BASE}/appointments/${appointmentId}/pdf`
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLayout = () => {
    // If parent passed a custom handler, use that
    if (onEditLayout) {
      onEditLayout(appointmentId);
      return;
    }

    if (!appointmentId) return;

    // Default behaviour: go to PDF editor page
    // same tab:
    navigate(`/pdf-editor?appointmentId=${appointmentId}`);
    // close modal after navigation
    if (onClose) onClose();
  };

  if (!open) return null;

  return (
    <div className="pdf-modal-backdrop" role="dialog" aria-modal="true">
      <div className="pdf-modal animate-enter">
        <div className="pdf-modal-header">
          <div className="pdf-modal-title">Appointment PDF Preview</div>
          <div className="pdf-modal-controls">
            <button
              className="btn icon-btn"
              onClick={handleDownload}
              title="Download"
            >
              <FaDownload />
            </button>
            <button
              className="btn icon-btn"
              onClick={handleEditLayout}
              title="Edit layout"
            >
              <FaPen />
            </button>
            <button
              className="btn icon-btn danger"
              onClick={onClose}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="pdf-modal-body">
          {loading && <div className="pdf-loading">Loading preview…</div>}
          {error && <div className="pdf-error">{error}</div>}
          {!loading && !error && blobUrl && (
            <iframe
              title="PDF Preview"
              src={blobUrl}
              className="pdf-iframe"
            />
          )}
          {!loading && !error && !blobUrl && (
            <div className="pdf-empty">No preview available.</div>
          )}
        </div>

        <div className="pdf-modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={loading}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
