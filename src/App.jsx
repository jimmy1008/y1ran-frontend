// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/Product/ProductDetail";
import Status from "./pages/Status/Status";
import Login from "./pages/Auth/Login";
import Footer from "./components/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/products" style={{ textDecoration: "none", fontWeight: 900 }}>
          y1ran Web
        </Link>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Link to="/products" style={{ textDecoration: "none" }}>Products</Link>
          <Link to="/status" style={{ textDecoration: "none" }}>Status</Link>
          <Link to="/login" style={{ textDecoration: "none", fontWeight: 800 }}>Login</Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/status" element={<Status />} />
        <Route path="/app" element={<div style={{ padding: 40 }}>App entry placeholder</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<div style={{ padding: 40 }}>404</div>} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
