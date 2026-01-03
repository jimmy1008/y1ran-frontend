// src/api/client.js
import { supabase } from "../lib/supabase";

export const API_BASE = import.meta.env.VITE_API_BASE || "";

export function apiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || null;
  const headers = {
    ...(options.headers || {}),
    ...(options.skipAuth ? {} : token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }

  return res.json();
}

export function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PUT", body });
}
