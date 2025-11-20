// src/pdf-editor/components/EditorSidebar.jsx
import React from "react";
import SectionCard from "./SectionCard";
import TextInput from "./TextInput";

export default function EditorSidebar({ layout, updateLayout, services }) {
  const header = layout.header || {};
  const notes = layout.notes || {};
  const nextAppt = layout.nextAppointment || {};
  const servicesSection = layout.servicesSection || {};
  const selectedServices = servicesSection.selectedServices || [];

  const toggleService = (name) => {
    const current = new Set(selectedServices || []);
    if (current.has(name)) current.delete(name);
    else current.add(name);
    updateLayout("servicesSection", "selectedServices", Array.from(current));
  };

  return (
    <div className="editor-sidebar">
      <h3 className="fw-bold mb-3">PDF Layout Editor</h3>

      {/* HEADER */}
      <SectionCard title="Header">
        <TextInput
          label="Clinic Name"
          value={header.clinicName || ""}
          onChange={(v) => updateLayout("header", "clinicName", v)}
        />
        <TextInput
          label="Doctor Name"
          value={header.doctorName || ""}
          onChange={(v) => updateLayout("header", "doctorName", v)}
        />
        <TextInput
          label="Address"
          textarea
          value={header.address || ""}
          onChange={(v) => updateLayout("header", "address", v)}
        />
        <TextInput
          label="Email"
          value={header.email || ""}
          onChange={(v) => updateLayout("header", "email", v)}
        />
        <TextInput
          label="Phone"
          value={header.phone || ""}
          onChange={(v) => updateLayout("header", "phone", v)}
        />
      </SectionCard>

      {/* NOTES */}
      <SectionCard title="Notes">
        <TextInput
          label="Notes (optional)"
          textarea
          value={notes.text || ""}
          onChange={(v) => updateLayout("notes", "text", v)}
        />
      </SectionCard>

      {/* SERVICES */}
      <SectionCard title="Services (this visit)">
        {services && services.length > 0 ? (
          <div className="services-list">
            {services.map((s) => {
              const label =
                s.name || s.serviceName || s.title || s.Service || "Service";
              const checked = selectedServices.includes(label);
              return (
                <label
                  key={s._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(label)}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#777" }}>
            No services loaded. (From /api/services)
          </div>
        )}
      </SectionCard>

      {/* NEXT APPOINTMENT */}
      <SectionCard title="Next Appointment">
        <label
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
        >
          <input
            type="checkbox"
            checked={!!nextAppt.enabled}
            onChange={(e) =>
              updateLayout("nextAppointment", "enabled", e.target.checked)
            }
          />
          Show next appointment section
        </label>

        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>
            Next appointment date
          </label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={nextAppt.date || ""}
            onChange={(e) =>
              updateLayout("nextAppointment", "date", e.target.value)
            }
          />
        </div>

        <TextInput
          label="Next appointment note (optional)"
          value={nextAppt.note || ""}
          onChange={(v) => updateLayout("nextAppointment", "note", v)}
        />
      </SectionCard>
    </div>
  );
}
