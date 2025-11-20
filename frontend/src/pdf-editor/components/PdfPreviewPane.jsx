
import React, { useEffect, useState } from "react";
import axios from "axios";


export default function PdfPreviewPane({ appointmentId, layout, refreshToken }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    const loadPreview = async () => {
      setLoading(true);
      setError(null);

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }

      try {
        const res = await axios.post("http://localhost:3001/pdf/preview", {
          appointmentId,
          layout,
        });
        const base64 = res.data.pdfBase64;
        if (!base64) throw new Error("No pdfBase64 in response");
        if (cancelled) return;

        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(url);
      } catch (err) {
        console.error("Preview load failed", err);
        if (!cancelled) setError("Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // we only reload when refreshToken changes, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, refreshToken]);

  return (
    <div className="pdf-preview-pane">
      {loading && <div className="pdf-preview-loading">Loading preview…</div>}
      {error && <div className="pdf-preview-error">{error}</div>}

      {!loading && !error && blobUrl && (
        <iframe
          title="PDF preview"
          src={blobUrl}
          className="pdf-preview-iframe"
        />
      )}
    </div>
  );
}
