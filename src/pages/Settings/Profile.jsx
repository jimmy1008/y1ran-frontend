import React, { useEffect, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const { user } = useAuth();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_identities")
      .select("provider, provider_user_id")
      .eq("user_id", user.id);

    if (!error) setIdentities(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const has = (p) => identities.some((x) => x.provider === p);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return null;

  return (
    <div style={{ padding: 24 }}>
      <h2>個人資料</h2>
      <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
        <div>Email：{user.email}</div>
        <div>UserId：{user.id}</div>
      </div>

      <div style={{ marginTop: 20, display: "grid", gap: 10, maxWidth: 520 }}>
        <div>Google：{has("google") ? "已綁定" : "未綁定（用 Google 登入後會自動有）"}</div>
        <div>Telegram：{has("telegram") ? "已綁定" : "未綁定"}</div>

        <button onClick={logout} style={{ marginTop: 10 }}>登出</button>
      </div>
    </div>
  );
}
