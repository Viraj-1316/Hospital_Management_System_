export default function SectionCard({ title, children }) {
  return (
    <div className="p-3 mb-4 bg-white rounded shadow-sm">
      <h5 className="fw-bold mb-3">{title}</h5>
      {children}
    </div>
  );
}
