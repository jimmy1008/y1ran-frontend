// src/pages/Products/Products.jsx
import { Link } from "react-router-dom";
import { products } from "../../data/products";

export default function Products() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Products</div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          A collection of practical apps & tools. No blog. No stories.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              borderRadius: 16,
              padding: 18,
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>{p.tagline}</div>
              </div>

              <div style={{ textAlign: "right", fontSize: 12, opacity: 0.85 }}>
                <div>{p.platform}</div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{p.status}</div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <Link
                to={`/products/${p.id}`}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.8)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                View
              </Link>
              <a
                href={p.actions?.[0]?.href ?? "#"}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.2)",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  opacity: p.actions?.[0]?.href ? 1 : 0.5,
                  pointerEvents: p.actions?.[0]?.href ? "auto" : "none",
                }}
              >
                {p.actions?.[0]?.label ?? "Open"}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
