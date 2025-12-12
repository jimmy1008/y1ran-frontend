// src/App.jsx
import { useState } from "react";
import "./App.css";
import { register, login } from "./api/auth";
import y1ranLogo from "./assets/y1ran-logo.png";

function App() {
  const [mode, setMode] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setStatus("請輸入 email 與密碼");
      return;
    }
    try {
      setStatus("處理中...");
      const fn = mode === "register" ? register : login;
      await fn({ email, password });
      setStatus(`${mode === "register" ? "註冊" : "登入"}成功`);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "發生錯誤");
    }
  }

  return (
    <div className="page">
      <header className="app-nav">
        <div className="nav-inner">
          <div className="nav-left">
            <img src={y1ranLogo} alt="y1ran" className="nav-logo" />
            <div className="nav-brand">
              <span className="nav-title">y1ran Web</span>
              <span className="nav-sub">personal site · playground</span>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#hero" className="nav-link">首頁</a>
            <a href="#works" className="nav-link">作品</a>
            <a href="#about" className="nav-link">系統介紹</a>
            <a href="#contact" className="nav-link">聯絡</a>
            <button
              className="nav-link nav-link--primary"
              onClick={() => setShowAuthModal(true)}
            >
              登入 / 註冊
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Hero */}
        <section id="hero" className="section hero">
          <div className="hero-card glass">
            <div className="glass-inner hero-inner">
              <div>
                <p className="hero-eyebrow">個人網站</p>
                <h1 className="hero-title">
                  歡迎來到 <span>y1ran Web</span>
                </h1>
                <p className="hero-subtitle">
                  這是一個簡潔的個人網站，用來集中整理作品與實驗項目，也是登入入口。保持淺藍白的霧玻璃風格。
                </p>
              </div>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => setShowAuthModal(true)}>
                  登入 / 註冊
                </button>
                <a href="#works" className="ghost-link">查看作品 →</a>
              </div>
            </div>
          </div>
        </section>

        {/* 目前內容 2x2 卡片 */}
        <section className="section content-grid-section">
          <h2 className="section-heading">目前包含的內容</h2>
          <div className="helper-text" style={{ marginBottom: 24 }}>暫定文案，之後可替換成你的描述。</div>
          <div className="content-grid">
            <article className="card equal-card">
              <h3 className="card-title">主站 · y1ran Web</h3>
              <p className="card-text">集中放個人介紹、登入入口與導覽。</p>
            </article>
            <article className="card equal-card">
              <h3 className="card-title">作品展示</h3>
              <p className="card-text">展示網站、UI、code snippet 等內容。</p>
            </article>
            <article className="card equal-card">
              <h3 className="card-title">練習 / Side Project</h3>
              <p className="card-text">小工具或實驗專案的簡介，方便整理。</p>
            </article>
            <article className="card equal-card">
              <h3 className="card-title">保留空位</h3>
              <p className="card-text">留一格給未來的想法，想好再填入即可。</p>
            </article>
          </div>
        </section>

        {/* 網站狀態 單一卡片 */}
        <section className="section status-section">
          <div className="status-card glass">
            <div className="glass-inner status-inner">
              <div>
                <p className="status-title">網站狀態：持續更新中</p>
                <p className="status-text">未來將加入更多展示頁、工具頁與個人專案。</p>
              </div>
            </div>
          </div>
        </section>

        {/* 作品集 */}
        <section id="works" className="section works">
          <h2 className="section-heading">作品集</h2>
          <div className="projects-grid">
            <article className="card equal-card">
              <h3 className="card-title">y1ran Web</h3>
              <p className="card-text">本站主體，用於集中管理頁面、展示功能與提供登入入口。</p>
              <button className="primary-btn" onClick={() => setShowAuthModal(true)}>
                進入系統
              </button>
            </article>
            <article className="card equal-card">
              <h3 className="card-title">作品頁示例</h3>
              <p className="card-text">可放置你未來任何想展示的內容：網站、設計、代碼範例等。</p>
            </article>
            <article className="card equal-card">
              <h3 className="card-title">練習或小工具示例</h3>
              <p className="card-text">若你有其他 Side Projects，本區可持續擴充成多卡片展示區。</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        © {new Date().getFullYear()} y1ran · personal web · all rights reserved.
      </footer>

      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>
            <div className="auth-card-inner">
              <div className="auth-tabs">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={mode === "register" ? "auth-tab active" : "auth-tab"}
                >
                  註冊
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={mode === "login" ? "auth-tab active" : "auth-tab"}
                >
                  登入
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-label" htmlFor="email-modal">Email</label>
                <input
                  id="email-modal"
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label className="auth-label" htmlFor="password-modal">Password</label>
                <input
                  id="password-modal"
                  className="auth-input"
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="auth-submit primary-btn">
                  {mode === "register" ? "建立帳號" : "登入"}
                </button>
              </form>

              {status && (
                <div className="helper-text" style={{ color: "#4b5563" }}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
