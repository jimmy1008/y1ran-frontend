// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/Product/ProductDetail";
import Status from "./pages/Status/Status";
import Login from "./pages/Auth/Login";
import Footer from "./components/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
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
