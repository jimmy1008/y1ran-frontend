import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useSupabaseSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setSession(data?.session ?? null);
      setLoading(false);
      if (error) console.warn("[auth] getSession error", error);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return { loading, session, user: session?.user ?? null };
}
