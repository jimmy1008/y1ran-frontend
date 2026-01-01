import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Settings() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onLinkGoogle = async () => {
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=link`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setErr(e?.message || "Link failed");
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Settings</div>
      <button type="button" onClick={onLinkGoogle} disabled={busy}>
        Link Google
      </button>
      {err ? (
        <div style={{ marginTop: 8, color: "crimson", fontSize: 13 }}>
          {err}
        </div>
      ) : null}
    </div>
  );
}
