import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getCachedProfile,
  isCacheFresh,
  setCachedProfile,
} from "../lib/profileCache";

function withTimeout(promise, ms = 3500) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("profile_timeout")), ms)
    ),
  ]);
}

export function useProfile(userId, { enabled = true } = {}) {
  const [profile, setProfile] = useState(() => getCachedProfile(userId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    const cached = getCachedProfile(userId);
    if (cached) setProfile(cached);
    else setProfile(null);

    if (cached && isCacheFresh()) return;

    let alive = true;
    setLoading(!cached);
    setError(null);

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    };

    withTimeout(fetchProfile(), 3500)
      .then((data) => {
        if (!alive) return;
        setProfile(data || null);
        setCachedProfile(userId, data || null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled, userId]);

  return { profile, loading, error };
}
