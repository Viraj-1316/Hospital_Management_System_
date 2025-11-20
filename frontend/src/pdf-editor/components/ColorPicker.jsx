export default function ColorPicker({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type="color"
        className="form-control form-control-color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
