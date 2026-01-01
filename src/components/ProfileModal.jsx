import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiGet, apiPut } from "../api/client";
import { supabase } from "../lib/supabase";
import "./profile-modal.css";

export default function ProfileModal({ open, onClose, onProfileUpdated }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const canPreviewAvatar =
    /^https?:\/\/.+/i.test((avatarUrl || "").trim()) &&
    !String(avatarUrl || "").includes("...");

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      (displayName ?? "") !== (profile.display_name ?? "") ||
      (avatarUrl ?? "") !== (profile.avatar_url ?? "")
    );
  }, [profile, displayName, avatarUrl]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setErr("");
    setSuccess("");
    setLoading(true);

    apiGet("/api/profile")
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDisplayName(p?.display_name ?? "");
        setAvatarUrl(p?.avatar_url ?? "");
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e?.message || "讀取個人資料失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onSave = async () => {
    if (!profile) return;
    setErr("");
    setSuccess("");
    setSaving(true);

    try {
      const updated = await apiPut("/api/profile", {
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim(),
      });
      setProfile(updated);
      setDisplayName(updated?.display_name ?? "");
      setAvatarUrl(updated?.avatar_url ?? "");
      setSuccess("已儲存");
      onProfileUpdated?.(updated);
    } catch (e) {
      setErr(e?.message || "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const doLogout = async () => {
    try {
      await supabase.auth.signOut();
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
          <div>
            <div className="pmTitle">個人資料</div>
            <div className="pmSub">Profile</div>
          </div>
          <button className="pmClose" onClick={onClose} aria-label="Close" type="button">
            ×
          </button>
        </div>

        {loading ? (
          <div className="pmLoading">載入中…</div>
        ) : err ? (
          <div className="pmError">{err}</div>
        ) : !profile ? (
          <div className="pmError">沒有資料</div>
        ) : (
          <div className="pmBody">
            <div className="pmRow">
              <label>顯示名稱</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="你的顯示名稱"
              />
            </div>

            <div className="pmRow">
              <label>Email（唯讀）</label>
              <input value={profile.email ?? ""} readOnly />
            </div>

            <div className="pmRow">
              <label>Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
              {canPreviewAvatar ? (
                <div className="pmAvatarPreview">
                  <img
                    src={avatarUrl}
                    alt="avatar preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : null}
            </div>

            {success ? <div className="pmSuccess">{success}</div> : null}

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
