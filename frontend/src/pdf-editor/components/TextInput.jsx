export default function TextInput({ label, value, onChange, textarea }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      {textarea ? (
        <textarea
          className="form-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className="form-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
