// src/components/Footer.jsx
export default function Footer() {
  return (
    <div
      style={{
        padding: "28px 18px",
        opacity: 0.75,
        fontSize: 12,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>Maintained by y1ran</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <a href="https://discord.gg/xxxx" aria-label="Discord" style={{ textDecoration: "none" }}>🔗</a>
        <a href="https://t.me/xxxx" aria-label="Telegram" style={{ textDecoration: "none" }}>🔗</a>
        <a href="https://x.com/xxxx" aria-label="X" style={{ textDecoration: "none" }}>🔗</a>
        <a href="https://instagram.com/xxxx" aria-label="Instagram" style={{ textDecoration: "none" }}>🔗</a>
      </div>
    </div>
  );
}
