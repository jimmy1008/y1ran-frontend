import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ProfileModal from "../../components/ProfileModal";
import { useAuthUser } from "../../hooks/useAuthUser";
import "./app-shell.css";

const AVATAR_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23a9c7ff'/><circle cx='32' cy='26' r='14' fill='%23ffffff'/><rect x='12' y='42' width='40' height='16' rx='8' fill='%23ffffff'/></svg>";

const EXCH_KEY = "y1ran_bound_exchanges";

const AVAILABLE_EXCHANGES = [
  { id: "binance", name: "Binance" },
  { id: "bybit", name: "Bybit" },
  { id: "bitget", name: "Bitget" },
  { id: "okx", name: "OKX" },
  { id: "bingx", name: "BingX" },
  { id: "mexc", name: "MEXC" },
  { id: "gate", name: "Gate.io" },
];

function loadBoundExchanges() {
  try {
    const raw = localStorage.getItem(EXCH_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveBoundExchanges(arr) {
  localStorage.setItem(EXCH_KEY, JSON.stringify(arr));
}

export default function AppShell() {
  const nav = useNavigate();
  const { user, profile } = useAuthUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileOverride, setProfileOverride] = useState(null);
  const [exModalOpen, setExModalOpen] = useState(false);
  const [boundEx, setBoundEx] = useState(() => loadBoundExchanges());

  useEffect(() => {
    saveBoundExchanges(boundEx);
  }, [boundEx]);

  function bindExchange(id) {
    setBoundEx((prev) => {
      if (prev.some((x) => x.id === id)) return prev;
      return [{ id, status: "ok" }, ...prev];
    });
  }

  const boundExView = useMemo(() => {
    return boundEx
      .filter((x) => x.status !== "off")
      .map((x) => {
        const meta = AVAILABLE_EXCHANGES.find((a) => a.id === x.id);
        return { ...x, name: meta?.name ?? x.id };
      });
  }, [boundEx]);

  function dotClass(status) {
    if (status === "ok") return "exDot exDot--ok";
    if (status === "err") return "exDot exDot--err";
    return "exDot";
  }

  const mergedProfile = profileOverride || profile;
  const displayName =
    mergedProfile?.display_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "—";
  const avatarUrl = mergedProfile?.avatar_url || AVATAR_URL;
  const uid =
    mergedProfile?.uid ||
    (mergedProfile?.id
      ? `a${String(mergedProfile.id)
          .replace(/[^a-f0-9]/gi, "")
          .slice(0, 6)
          .toLowerCase()}`
      : "—");

  return (
    <div className="appShell">
      <aside className="appSidebar">
        <div className="appProfile">
          <button
            className="appAvatarBtn"
            type="button"
            onClick={() => {
              setProfileOpen(true);
            }}
          >
            <img className="appAvatarImg" src={avatarUrl} alt="avatar" />
          </button>
          <div className="appName">{displayName}</div>
          <div className="appUid">ID: {uid}</div>
        </div>

        <div className="appBlock">
          <div className="appBlockTitle">功能</div>
          <nav className="appNav">
            <NavLink className={({ isActive }) => "appNavItem" + (isActive ? " isActive" : "")} to="/app/journal">
              儀表板
            </NavLink>
            <NavLink className={({ isActive }) => "appNavItem" + (isActive ? " isActive" : "")} to="/app/portfolio?tab=asset">
              資產
            </NavLink>
          </nav>
        </div>

        <div className="appSide__section">
          <div className="appSide__sectionHead">
            <div className="appSide__sectionTitle">交易所</div>

            <button
              type="button"
              className="appIconBtn"
              onClick={() => setExModalOpen(true)}
              aria-label="新增交易所"
              title="新增交易所"
            >
              +
            </button>
          </div>

          <div className="exList">
            {boundExView.length === 0 ? (
              <div className="exEmpty">尚未綁定（點 +）</div>
            ) : (
              boundExView.map((ex) => (
                <div key={ex.id} className="exRow">
                  <div className="exAvatar">{ex.name.slice(0, 1)}</div>
                  <div className="exName">{ex.name}</div>
                  <div className={dotClass(ex.status)} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="appFooter">
          <button
            className="appQuickBtn"
            type="button"
            onClick={() => nav("/app/journal?create=1")}
          >
            快速建立
          </button>
          <div className="appVersion">版本：v0.1.0</div>
        </div>
      </aside>

      <main className="appMain">
        <div className="appMainInner">
          <Outlet />
        </div>
      </main>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onProfileUpdated={(p) => setProfileOverride(p)}
      />

      {exModalOpen && (
        <div className="exModalBackdrop" onMouseDown={() => setExModalOpen(false)}>
          <div className="exModal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="exModalHead">
              <div className="exModalTitle">選擇交易所</div>
              <button className="appIconBtn" type="button" onClick={() => setExModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="exGrid">
              {AVAILABLE_EXCHANGES.map((ex) => {
                const already = boundEx.some((b) => b.id === ex.id && b.status !== "off");
                return (
                  <button
                    key={ex.id}
                    type="button"
                    className={`exPick ${already ? "exPick--disabled" : ""}`}
                    onClick={() => {
                      if (already) return;
                      bindExchange(ex.id);
                      setExModalOpen(false);
                    }}
                    disabled={already}
                  >
                    <div className="exPickIcon">{ex.name.slice(0, 1)}</div>
                    <div className="exPickName">{ex.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

