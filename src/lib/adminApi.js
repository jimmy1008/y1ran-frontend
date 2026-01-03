import { supabase } from "./supabase";

const FN_BASE = "https://nitzsnrmeifjqxxkxefy.supabase.co/functions/v1";

async function getJwt() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const jwt = data?.session?.access_token;
  if (!jwt) throw new Error("No session / JWT");
  return jwt;
}

async function callAdminUsers(pathWithQuery, { method = "GET", body } = {}) {
  const jwt = await getJwt();
  const res = await fetch(`${FN_BASE}${pathWithQuery}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) throw json ?? { error: `HTTP ${res.status}` };
  return json;
}

export async function adminListUsers({
  page = 1,
  limit = 20,
  q = "",
  plan = "",
  status = "",
  banned = "",
} = {}) {
  const url = new URL("/admin-users", "https://x");
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (q) url.searchParams.set("q", q.trim());
  if (plan) url.searchParams.set("plan", plan);
  const statusParam = status || banned;
  if (statusParam) url.searchParams.set("status", statusParam);

  return callAdminUsers(`${url.pathname}${url.search}`);
}

export async function adminPatchProfile(uid, updates) {
  const url = new URL("/admin-users", "https://x");
  url.searchParams.set("uid", uid);
  return callAdminUsers(`${url.pathname}${url.search}`, {
    method: "PATCH",
    body: { updates },
  });
}

export async function adminDeleteUser(uid) {
  const url = new URL("/admin-users", "https://x");
  url.searchParams.set("uid", uid);
  return callAdminUsers(`${url.pathname}${url.search}`, { method: "DELETE" });
}
