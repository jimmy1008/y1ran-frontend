// supabase/functions/admin-me/index.ts

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
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(req: Request, status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return json(req, 401, { ok: false, error: "Missing bearer token" });
  }

  // Key: call Auth REST API directly
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: auth,
    },
  });

  if (!r.ok) {
    return json(req, 401, { ok: false, error: "Invalid JWT" });
  }

  const user = await r.json();
  const email = (user.email ?? "").toLowerCase();

  const isAdmin = ADMIN_EMAILS.includes(email);

  return json(req, 200, {
    ok: true,
    isAdmin,
    email,
    uid: user.id,
  });
});
