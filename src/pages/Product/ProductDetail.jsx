// src/pages/Product/ProductDetail.jsx
import { useParams, Link } from "react-router-dom";
import { products } from "../../data/products";

export default function ProductDetail() {
  const { id } = useParams();
  const p = products.find((x) => x.id === id);

  if (!p) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>未找到應用</div>
        <div style={{ marginTop: 10 }}>
          <Link to="/products">← 回到應用列表</Link>
        </div>
      </div>
    );
  }

  const { what = [], not = [] } = p.sections ?? {};

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 18 }}>
        <Link to="/products" style={{ textDecoration: "none", opacity: 0.75 }}>
          ← 回到應用列表
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{p.title || p.name}</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}>{p.subtitle || p.tagline}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, opacity: 0.9 }}>
          <div>{p.platform}</div>
          <div style={{ marginTop: 8, fontWeight: 800 }}>{p.status}</div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {p.actions?.map((a) => (
          <a
            key={a.label}
            href={a.href}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.85)",
              color: "white",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {a.label}
          </a>
        ))}
      </div>

      <section style={{ marginTop: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>這個系統能做什麼</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
          {what.map((t) => (
            <li key={t} style={{ marginBottom: 6 }}>{t}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>這個系統不做什麼</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
          {not.map((t) => (
            <li key={t} style={{ marginBottom: 6 }}>{t}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>系統狀態</div>
        <div style={{ opacity: 0.85 }}>
          Beta 測試中，功能可能調整。<br />
          建議定期匯出資料作為備份。
        </div>
      </section>
    </div>
  );
}
