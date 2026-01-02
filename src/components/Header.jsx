import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "../hooks/useAuthUser";

export default function Header({ user: userProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, profile, loading } = useAuthUser();
  const user = userProp ?? authUser;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => setOpen(false), [location.pathname]);

  const displayName = user
    ? profile?.nickname ||
      profile?.display_name ||
      user?.user_metadata?.name ||
      user?.email ||
      "…"
    : loading
    ? "…"
    : "登入 / 註冊";

  const scrollToApps = (e) => {
    setOpen(false);

    if (location.pathname !== "/") {
      navigate("/#apps");
      return;
    }

    const el = document.getElementById("apps");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onLogout = async () => {
    setOpen(false);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (e) {
      console.error("[logout] failed", e);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="siteHeader">
      <div className="siteHeader__inner">
        <div className="siteHeader__brand header-left">
          <img src="/y1ran-logo.png" alt="y1ran" className="header-logo" />
          <div className="header-title">
            <div className="title">y1ran Web</div>
            <div className="subtitle">products · playground</div>
          </div>
        </div>

        <nav className="header-nav">
          <a href="/#apps" onClick={scrollToApps} className="nav-link">
            應用
          </a>
          <div ref={wrapRef} className="account">
            <button
              className="account-trigger"
              type="button"
              disabled={loading}
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                setOpen((v) => !v);
              }}
            >
              <span className="account-name">{displayName}</span>
              <span className="chevron">v</span>
            </button>

            {user && open ? (
              <div className="account-menu">
                <button type="button" onClick={() => navigate("/app/journal")}>
                  進入儀表板
                </button>
                <button type="button" onClick={onLogout} className="danger">
                  登出
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}



