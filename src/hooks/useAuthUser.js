import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiGet } from "../api/client";

export function useAuthUser() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid) {
    if (!uid) return;
    try {
      const data = await apiGet("/api/profile");
      setProfile(data || null);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sess = data.session ?? null;
      const u = sess?.user ?? null;
      setSession(sess);
      setUser(u);

      if (u) await fetchProfile(u.id);
      else setProfile(null);

      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const u = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(u);

      if (u) await fetchProfile(u.id);
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return { session, user, profile, loading };
}
