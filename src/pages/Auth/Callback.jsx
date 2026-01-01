import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { apiGet, apiPost } from "../../api/client";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const flow = sp.get("flow") || "login";
        const code = sp.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session) {
          nav("/login?e=oauth_failed", { replace: true });
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const identities = userData?.user?.identities || [];
        const oauth = identities.find((x) => x.provider && x.provider !== "email");
        const provider = oauth?.provider || "";
        const providerUserId =
          oauth?.identity_data?.sub ||
          oauth?.identity_data?.id ||
          oauth?.id ||
          oauth?.identity_id ||
          oauth?.user_id ||
          "";

        if (!provider || !providerUserId) {
          await supabase.auth.signOut();
          nav("/login?e=oauth_failed", { replace: true });
          return;
        }

        if (flow === "link") {
          await apiPost("/api/auth/oauth-link", {
            provider,
            provider_user_id: providerUserId,
          });
        } else {
          const resp = await apiGet(
            `/api/auth/oauth-linked?provider=${encodeURIComponent(
              provider
            )}&provider_user_id=${encodeURIComponent(providerUserId)}`
          );

          if (!resp?.linked) {
            await supabase.auth.signOut();
            nav(
              `/login?e=oauth_not_linked&provider=${encodeURIComponent(
                provider
              )}`,
              {
                replace: true,
              }
            );
            return;
          }
        }

        if (!cancelled) nav("/app", { replace: true });
      } catch (e) {
        console.log("[auth callback] error", e);
        try {
          await supabase.auth.signOut();
        } catch {}
        nav("/login?e=oauth_failed", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  return null;
}
