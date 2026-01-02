import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useLastSeen() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid || cancelled) return;

      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", uid);
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
