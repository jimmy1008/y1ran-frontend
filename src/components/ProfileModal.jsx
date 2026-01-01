import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiGet, apiPut } from "../api/client";
import { supabase } from "../lib/supabase";
import { uploadAvatar } from "../lib/avatarUpload";
import { useAuthUser } from "../hooks/useAuthUser";
import {
  getCachedProfile,
  isCacheFresh,
  setCachedProfile,
} from "../lib/profileCache";
import "./profile-modal.css";

export default function ProfileModal({ open, onClose, onProfileUpdated }) {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const { user, profile: cachedProfile } = useAuthUser();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);

  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const identities = user?.identities || [];
  const linked = useMemo(() => {
    const set = new Set(identities.map((i) => i.provider));
    return {
      google: set.has("google"),
      telegram: set.has("telegram"),
    };
  }, [identities]);

  const uidRaw = profile?.uid || "";
  const uidFallback = user?.id
    ? `a${String(user.id).replace(/[^a-f0-9]/gi, "").slice(0, 6).toLowerCase()}`
    : "—";
  const uidDisplay = uidRaw || uidFallback;
  const uidTitle = uidRaw || user?.id || "";
  const gmail = profile?.email || user?.email || "—";

  const displayName =
    (nickname || "").trim() ||
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    gmail ||
    "使用者";

  const canPreviewAvatar =
    /^https?:\/\/.+/i.test((avatarUrl || "").trim()) &&
    !String(avatarUrl || "").includes("...");

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (nickname ?? "") !== (profile.nickname ?? profile.display_name ?? "");
  }, [profile, nickname]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const userId = user?.id || null;
    const cached =
      (userId ? getCachedProfile(userId) : null) || cachedProfile || null;

    if (cached) {
      setProfile(cached);
      setNickname(cached?.nickname ?? cached?.display_name ?? "");
      setAvatarUrl(cached?.avatar_url ?? "");
    }

    setErr("");
    setSuccess("");
    setLoading(!cached);

    if (cached && isCacheFresh()) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const withTimeout = (promise, ms = 3500) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("profile_timeout")), ms)
        ),
      ]);

    withTimeout(apiGet("/api/profile"), 3500)
      .then((p) => {
        if (cancelled) return;
        setProfile(p || null);
        setNickname(p?.nickname ?? p?.display_name ?? "");
        setAvatarUrl(p?.avatar_url ?? "");
        if (userId) setCachedProfile(userId, p || null);
      })
      .catch((e) => {
        if (cancelled) return;
        if (!cached) setErr(e?.message || "讀取個人資料失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, cachedProfile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;

    setErr("");
    setSuccess("");
    setSaving(true);
    try {
      const url = await uploadAvatar({ userId: user.id, file });
      const updated = await apiPut("/api/profile", { avatar_url: url });
      setProfile(updated);
      setAvatarUrl(updated?.avatar_url ?? url);
      setSuccess("頭貼已更新");
      setCachedProfile(user.id, updated || null);
      onProfileUpdated?.(updated);
    } catch (e2) {
      setErr(e2?.message || "頭貼上傳失敗");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (!profile) return;
    setErr("");
    setSuccess("");
    setSaving(true);

    try {
      const updated = await apiPut("/api/profile", {
        display_name: nickname.trim(),
      });
      setProfile(updated);
      setNickname(updated?.nickname ?? updated?.display_name ?? "");
      setAvatarUrl(updated?.avatar_url ?? "");
      setSuccess("已儲存");
      if (user?.id) setCachedProfile(user.id, updated || null);
      onProfileUpdated?.(updated);
    } catch (e) {
      setErr(e?.message || "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const onLinkGoogle = async () => {
    setErr("");
    setSuccess("");
    setSaving(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=link`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setErr(e?.message || "綁定 Google 失敗");
      setSaving(false);
    }
  };

  const doLogout = async () => {
        try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (e) {
      setErr(e?.message || "登出失敗");
    } finally {
      onClose?.();
      nav("/login", { replace: true });
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="pmOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="pmCard" role="dialog" aria-modal="true">
        <div className="pmHeader">
          <div className="pmTitle">個人資料</div>
          <button className="pmClose" onClick={onClose} aria-label="Close" type="button">
            ×
          </button>
        </div>

        {loading && !profile ? (
          <div className="pmLoading">載入中…</div>
        ) : err && !profile ? (
          <div className="pmError">{err}</div>
        ) : !profile ? (
          <div className="pmError">沒有資料</div>
        ) : (
          <div className="pmBody">
            <div className="pmHeaderBlock">
              <button
                className="pmAvatarBtn"
                type="button"
                onClick={onPickAvatar}
                title="點擊上傳頭貼"
              >
                {canPreviewAvatar ? (
                  <img className="pmAvatarImg" src={avatarUrl} alt="avatar" />
                ) : (
                  <div className="pmAvatarFallback">IMG</div>
                )}
              </button>

              <div className="pmHeaderInfo">
                <div className="pmNameRow">
                  <div className="pmName">{displayName || "未設定暱稱"}</div>
                  <div className="pmUid">@{uidDisplay}</div>
                </div>

                <div className="pmMeta">
                  <div className="pmMetaItem">
                    <span className="pmMetaLabel">Email</span>
                    <span className="pmMetaValue">{gmail || "—"}</span>
                  </div>
                  <div className="pmMetaItem">
                    <span className="pmMetaLabel">UID</span>
                    <span className="pmMetaValue" title={uidTitle || uidDisplay}>
                      {uidDisplay}
                    </span>
                  </div>
                </div>

                <input
                  ref={fileRef}
                  className="pmFileInput"
                  type="file"
                  accept="image/*"
                  onChange={onAvatarFile}
                />
              </div>
            </div>

            <div className="pmField">
              <label>暱稱</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={displayName}
              />
            </div>

            <div className="pmLinks">
              <div className="pmLinkCard">
                <div className="pmLinkHead">
                  <div className="pmLinkName">Google</div>
                  <div className={`pmLinkStatus ${linked.google ? "ok" : "no"}`}>
                    <span className="pmLinkDot" aria-hidden="true" />
                    {linked.google ? "已綁定" : "未綁定"}
                  </div>
                </div>
                {!linked.google ? (
                  <button className="pmBtn" type="button" onClick={onLinkGoogle} disabled={saving}>
                    綁定
                  </button>
                ) : null}
              </div>

              <div className="pmLinkCard">
                <div className="pmLinkHead">
                  <div className="pmLinkName">Telegram</div>
                  <div className={`pmLinkStatus ${linked.telegram ? "ok" : "no"}`}>
                    <span className="pmLinkDot" aria-hidden="true" />
                    {linked.telegram ? "已綁定" : "未綁定"}
                  </div>
                </div>
                {!linked.telegram ? (
                  <button className="pmBtn" type="button" disabled>
                    綁定（未開放）
                  </button>
                ) : null}
              </div>
            </div>

            {err ? <div className="pmToast err">{err}</div> : null}
            {success ? <div className="pmToast ok">{success}</div> : null}

            <div className="pmFooter">
              <button className="pmLogout" onClick={doLogout} type="button">
                登出
              </button>
              <div className="pmFooterSpacer" />
              <button className="pmBtn ghost" onClick={onClose} type="button">
                關閉
              </button>
              <button
                className="pmBtn primary"
                onClick={onSave}
                disabled={!dirty || saving}
                title={!dirty ? "沒有變更" : ""}
                type="button"
              >
                {saving ? "儲存中…" : "儲存"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}




