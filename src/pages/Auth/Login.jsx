import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import "./login.css";

export default function Login() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/app/journal";

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const passOk = useMemo(() => (password || "").length >= 6, [password]);
  const confirmOk = useMemo(
    () => mode !== "register" || confirm === password,
    [mode, confirm, password]
  );

  useEffect(() => {
    if (!loading && session) nav(from, { replace: true });
  }, [loading, session, nav, from]);

  useEffect(() => {
    const sp = new URLSearchParams(loc.search);
    const e = sp.get("e");
    const provider = sp.get("provider");

    if (e === "unlinked" || e === "oauth_not_linked") {
      setErr(`登入失敗：未綁定帳戶（${provider || "oauth"}）`);
      setMsg("");
    } else if (e === "oauth_failed") {
      setErr("登入失敗：第三方登入失敗");
      setMsg("");
    }

    if (e) nav("/login", { replace: true });
  }, [loc.search, nav]);

  const mapAuthError = (e) => {
    const m = e?.message || "";
    if (m.includes("Invalid login credentials")) return "帳號或密碼錯誤";
    if (m.includes("Email not confirmed")) return "Email 尚未驗證，請先去收信";
    if (m.includes("User already registered")) return "此 Email 已註冊，請直接登入";
    return m || "發生未知錯誤";
  };

  const onLogin = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (e) {
      setErr(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (!data?.session) {
        setMsg("註冊成功：請到信箱完成驗證後再登入。");
        setMode("login");
        setPassword("");
        setConfirm("");
        return;
      }
    } catch (e) {
      setErr(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=login`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setErr(mapAuthError(e) || "Google 登入失敗");
      setBusy(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">{mode === "login" ? "登入" : "註冊"}</div>
          <div className="authTabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setErr("");
                setMsg("");
              }}
              type="button"
            >
              登入
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setErr("");
                setMsg("");
              }}
              type="button"
            >
              註冊
            </button>
          </div>
        </div>

        <form
          className="authGrid"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login" && !busy && emailOk && passOk) {
              onLogin();
            }
          }}
        >
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            密碼（至少 6 碼）
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="‧‧‧‧‧‧‧‧"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" ? (
            <label>
              確認密碼
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再輸入一次"
                type="password"
                autoComplete="new-password"
              />
            </label>
          ) : null}

          {err ? <div className="authErr">{err}</div> : null}
          {msg ? <div className="authMsg">{msg}</div> : null}

          <div className="authBtns">
            {mode === "login" ? (
              <button
                className="primary"
                type="submit"
                disabled={busy || !emailOk || !passOk}
              >
                {busy ? "登入中…" : "登入"}
              </button>
            ) : (
              <button
                className="primary"
                type="button"
                onClick={onRegister}
                disabled={busy || !emailOk || !passOk || !confirmOk}
              >
                {busy ? "註冊中…" : "註冊"}
              </button>
            )}

            <button className="ghost" type="button" onClick={onGoogle} disabled={busy}>
              使用 Google 登入（需先綁定）
            </button>
          </div>

          <div className="authHint">
            {mode === "register"
              ? "註冊後可能需要 Email 驗證。"
              : "忘記密碼功能等你要再補。"}
          </div>
        </form>
      </div>
    </div>
  );
}



