// src/pages/Status/Status.jsx
export default function Status() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ fontSize: 28, fontWeight: 900 }}>System Status</div>
      <div style={{ marginTop: 10, opacity: 0.8 }}>
        Active. Some tools are in beta. Export is recommended for important data.
      </div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontWeight: 900 }}>Trading Journal</div>
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          Beta · API changes possible · Use export for backup
        </div>
      </div>
    </div>
  );
}
