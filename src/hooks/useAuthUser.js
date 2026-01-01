import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useProfile } from "./useProfile";

export function useAuthUser() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const u = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(u);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const profileState = useProfile(user?.id, { enabled: !!user });

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(profileState.profile ?? null);
  }, [user, profileState.profile]);

  return { session, user, profile, loading };
}
