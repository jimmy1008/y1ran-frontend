import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { apiGet, apiPost } from "../../api/client";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitSessionToken(maxTry = 8, gapMs = 150) {
  for (let i = 0; i < maxTry; i += 1) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return token;
    await sleep(gapMs);
  }
  return null;
}

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const flow = url.searchParams.get("flow") || "login";

      try {
        if (!code) throw new Error("missing_code");

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const token = await waitSessionToken();
        if (!token) throw new Error("no_session_token");

        const { data: userData } = await supabase.auth.getUser();
        const identities = userData?.user?.identities || [];
        const google = identities.find((x) => x.provider === "google");
        const providerUserId = google?.identity_data?.sub || google?.id || null;

        if (!providerUserId) throw new Error("no_google_sub");

        if (flow === "link") {
          await apiPost("/api/auth/oauth-link", {
            provider: "google",
            provider_user_id: providerUserId,
          });
          if (!cancelled) nav("/app/journal?linked=1", { replace: true });
          return;
        }

        const resp = await apiGet(
          `/api/auth/oauth-linked?provider=google&provider_user_id=${encodeURIComponent(
            providerUserId
          )}`,
          { skipAuth: true }
        );

        if (!resp?.linked) {
          try {
            await supabase.auth.signOut();
          } catch {}
          nav("/login?e=oauth_not_linked", { replace: true });
          return;
        }

        if (!cancelled) nav("/app/journal", { replace: true });
      } catch (e) {
        console.error("[auth callback] failed:", e);
        nav("/login?e=oauth_failed", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  return null;
}
