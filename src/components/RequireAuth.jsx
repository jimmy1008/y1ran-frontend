import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}
