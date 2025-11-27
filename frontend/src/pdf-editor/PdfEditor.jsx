// src/pdf-editor/PdfEditor.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import EditorSidebar from "./components/EditorSidebar";
import PdfPreviewPane from "./components/PdfPreviewPane";
import axios from "axios";
import "./PdfEditor.css";
import { toast } from "react-hot-toast";

const defaultLayout = {
  header: {
    clinicName: "Valley Clinic",
    doctorName: "Dr. Aryan Shelar",
    address: "Address not available\nCity, State, Country, 000000",
    email: "clinic@example.com",
    phone: "0000000000",
  },
  notes: {
    text: "",
  },
  servicesSection: {
    selectedServices: [],
  },
  nextAppointment: {
    enabled: false,
    date: "",
    note: "",
  },
};

export default function PdfEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get("appointmentId") || null;

  const [layout, setLayout] = useState(defaultLayout);
  const [services, setServices] = useState([]);
  const [previewToken, setPreviewToken] = useState(0); // controls when iframe reloads

  // load services for sidebar (checkbox list)
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/services");
        setServices(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load services for editor", err);
      }
    };
    loadServices();
  }, []);

  // auto-load preview once when editor opens for a given appointment
  useEffect(() => {
    if (appointmentId) {
      setPreviewToken((t) => t + 1);
    }
  }, [appointmentId]);

  const updateLayout = (section, field, value) => {
    setLayout((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  if (!appointmentId) {
    return (
      <div className="p-4">
        <h4>No appointment selected</h4>
        <p>Open this editor using the “Edit layout” button from the PDF preview.</p>
      </div>
    );
  }

  // download using current layout (no preview reload)
  const handleDownloadCurrentLayout = async () => {
    try {
      const res = await axios.post("http://localhost:3001/pdf/preview", {
        appointmentId,
        layout,
      });
      const base64 = res.data.pdfBase64;
      if (!base64) {
        toast.error("Preview API did not return pdfBase64");
        return;
      }

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointment-${appointmentId || "preview"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download (current layout) failed:", err);
      toast.error("Download failed. Check console.");
    }
  };

  // create a new appointment for “next appointment”
  const handleCreateNextAppointment = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3001/pdf/create-next-appointment",
        { appointmentId, layout }
      );
      toast.success("Next appointment created successfully.");
      console.log("Next appointment:", res.data);
    } catch (err) {
      console.error("Create next appointment failed:", err);
      toast.error("Failed to create next appointment. Check console.");
    }
  };

  return (
    <div className="pdf-editor-page">
      <div className="editor-sidebar-wrapper">
        <EditorSidebar
          layout={layout}
          updateLayout={updateLayout}
          services={services}
        />
      </div>

      <div className="editor-main">
        {/* top buttons – no overlap with iframe */}
        <div className="editor-actions">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={() => setPreviewToken((t) => t + 1)}
          >
            Update preview
          </button>

          <button
            className="btn btn-success"
            onClick={handleDownloadCurrentLayout}
          >
            Download PDF (current layout)
          </button>

          <button
            className="btn btn-primary"
            onClick={handleCreateNextAppointment}
          >
            Save Next Appointment in System
          </button>
        </div>

        {/* preview area */}
        <PdfPreviewPane
          appointmentId={appointmentId}
          layout={layout}
          refreshToken={previewToken}
        />
      </div>
    </div>
  );
}
