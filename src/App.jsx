import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./providers/AuthProvider";
import RequireAuth from "./components/RequireAuth";

import RootLayout from "./layouts/RootLayout";

import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/Product/ProductDetail";
import Status from "./pages/Status/Status";
import Login from "./pages/Auth/Login";
import AuthCallback from "./pages/Auth/Callback";
import Profile from "./pages/Settings/Profile";
import AppShell from "./pages/App/AppShell";
import Journal from "./pages/App/Journal";
import Portfolio from "./pages/App/Portfolio";
import Settings from "./pages/App/Settings";
import Footer from "./components/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/status" element={<Status />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/app/journal" replace />} />
              <Route path="journal" element={<Journal />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/settings/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
