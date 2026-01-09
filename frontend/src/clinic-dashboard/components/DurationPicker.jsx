// src/components/DurationPicker.jsx
import React, { useState, useRef, useEffect } from "react";
import "../../shared/styles/shared-components.css";

export default function DurationPicker({ value = "00:00", onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef();

  // parse incoming value safely
  const safe = (v) => {
    if (!v || typeof v !== "string") return ["00", "00"];
    const parts = v.split(":");
    return [String(parts[0] || "00").padStart(2, "0"), String(parts[1] || "00").padStart(2, "0")];
  };

  const [initialH, initialM] = safe(value);
  const [hour, setHour] = useState(initialH);
  const [min, setMin] = useState(initialM);

  // keep local hour/min synced if parent value changes
  useEffect(() => {
    const [h, m] = safe(value);
    setHour(h);
    setMin(m);
  }, [value]);

  // helper to report HH:MM to parent
  const report = (h, m) => {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const out = `${hh}:${mm}`;
    onChange && onChange(out);
  };

  const onHourClick = (hh) => {
    setHour(hh);
    report(hh, min);
  };

  const onMinClick = (mm) => {
    setMin(mm);
    report(hour, mm);
    setOpen(false); // auto-close after minute selected
  };

  // close popup on outside click
  useEffect(() => {
    function handleDocClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  return (
    <div className="dp-wrapper" ref={wrapperRef}>
      <div className="dp-input-group">
        <input
          readOnly
          className="form-control dp-display"
          value={`${hour}:${min}`}
          onClick={() => setOpen((s) => !s)}
        />
        
      </div>

      {open && (
        <div className="dp-popup card">
          <div className="dp-column">
            <div className="dp-column-head">HH</div>
            <div className="dp-list">
              {Array.from({ length: 24 }).map((_, i) => {
                const hh = String(i).padStart(2, "0");
                return (
                  <div key={hh} className={`dp-item ${hour === hh ? "active" : ""}`}>
                    <button
                      type="button"
                      className="btn btn-sm w-100 text-start"
                      onClick={() => onHourClick(hh)}
                    >
                      {hh}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dp-column">
            <div className="dp-column-head">mm</div>
            <div className="dp-list">
              {Array.from({ length: 12 }).map((_, idx) => {
                const m = String(idx * 5).padStart(2, "0");
                return (
                  <div key={m} className={`dp-item ${min === m ? "active" : ""}`}>
                    <button
                      type="button"
                      className="btn btn-sm w-100 text-start"
                      onClick={() => onMinClick(m)}
                    >
                      {m}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
