// supabase/functions/admin-users/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------- CORS ----------------
const ALLOWED = new Set([
  "https://app.y1ran.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED.has(origin) ? origin : "https://app.y1ran.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(req: Request, status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// ---------------- ENV ----------------
// Supabase Edge Runtime 內建 SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY（但我們用自訂 SERVICE_ROLE_KEY）
const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = mustEnv("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = mustEnv("SERVICE_ROLE_KEY");

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ---------------- AUTH (verify JWT via REST) ----------------
async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return { ok: false as const, res: json(req, 401, { ok: false, error: "Missing Bearer token" }) };
  }

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: auth,
    },
  });

  if (!r.ok) {
    return { ok: false as const, res: json(req, 401, { ok: false, error: "Invalid JWT" }) };
  }

  const user = await r.json();
  const email = (user.email ?? "").toLowerCase();

  if (!isAdminEmail(email)) {
    return { ok: false as const, res: json(req, 403, { ok: false, error: "Forbidden" }) };
  }

  return { ok: true as const, admin: { uid: user.id as string, email } };
}

// ---------------- HELPERS ----------------
function parseUidFromPath(req: Request) {
  // /functions/v1/admin-users/:uid  -> last segment is uid
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

// 允許 admin patch profiles 的欄位（你可以擴充，但別讓它變成任意寫入）
const PROFILE_PATCH_ALLOWLIST = new Set([
  "email",
  "last_seen_at",
  // 需要再加：display_name / plan / role / notes ... 就放這裡
]);

// ---------------- HANDLER ----------------
Deno.serve(async (req) => {
  // preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.res;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // -------- GET: list users --------
    if (req.method === "GET") {
      const url = new URL(req.url);
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
      const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);

      const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({
        page,
        perPage: limit,
      });

      if (usersErr) return json(req, 500, { ok: false, error: usersErr.message });

      const users = usersData.users ?? [];
      const uids = users.map((u) => u.id);

      // profiles 補 last_seen_at / created_at / email
      const { data: profiles, error: profErr } = await admin
        .from("profiles")
        .select("id, email, created_at, last_seen_at")
        .in("id", uids);

      if (profErr) return json(req, 500, { ok: false, error: profErr.message });

      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const rows = users.map((u) => {
        const p: any = byId.get(u.id);
        return {
          uid: u.id,
          email: p?.email ?? u.email ?? null,
          created_at: p?.created_at ?? u.created_at ?? null,
          last_seen_at: p?.last_seen_at ?? null,
        };
      });

      return json(req, 200, { ok: true, page, limit, rows });
    }

    // -------- PATCH: update profile --------
    if (req.method === "PATCH") {
      const uid = parseUidFromPath(req);
      if (!uid) return json(req, 400, { ok: false, error: "Missing uid" });

      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        return json(req, 400, { ok: false, error: "Invalid JSON body" });
      }

      // allowlist
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(body)) {
        if (PROFILE_PATCH_ALLOWLIST.has(k)) patch[k] = v;
      }

      if (Object.keys(patch).length === 0) {
        return json(req, 400, { ok: false, error: "No allowed fields to update" });
      }

      const { data, error } = await admin
        .from("profiles")
        .update(patch)
        .eq("id", uid)
        .select("id, email, created_at, last_seen_at")
        .maybeSingle();

      if (error) return json(req, 500, { ok: false, error: error.message });

      return json(req, 200, { ok: true, profile: data ?? null });
    }

    // -------- DELETE: delete user --------
    if (req.method === "DELETE") {
      const uid = parseUidFromPath(req);
      if (!uid) return json(req, 400, { ok: false, error: "Missing uid" });

      // 先刪 auth user
      const { error: delErr } = await admin.auth.admin.deleteUser(uid);
      if (delErr) return json(req, 500, { ok: false, error: delErr.message });

      // 再清 profiles（即使不存在也 OK）
      const { error: profDelErr } = await admin.from("profiles").delete().eq("id", uid);
      if (profDelErr) return json(req, 500, { ok: false, error: profDelErr.message });

      return json(req, 200, { ok: true, deleted_uid: uid });
    }

    return json(req, 405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    // 永遠帶 CORS header
    return json(req, 500, { ok: false, error: String(e?.message ?? e) });
  }
});
