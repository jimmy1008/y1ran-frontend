// src/pages/Home/Home.jsx
import { Link } from "react-router-dom";
import y1ranLogo from "../../assets/y1ran-logo.png";

export default function Home() {
  return (
    <div className="line-shell">
      {/* Top Nav */}
      <header className="line-nav">
        <div className="line-nav__left">
          <img src={y1ranLogo} alt="y1ran" className="line-logo" />
          <div className="line-brand">
            <div className="line-brand__name">y1ran Web</div>
            <div className="line-brand__sub">products · playground</div>
          </div>
        </div>

        <nav className="line-nav__right">
          <Link className="line-link" to="/products">應用</Link>
          <Link className="line-link" to="/status">狀態</Link>
          <Link className="line-cta" to="/login">登入 / 註冊</Link>
        </nav>
      </header>

      {/* HERO (LINE-style) */}
      <section className="line-hero">
        <div className="line-hero__overlay" />
        <div className="line-hero__content">
          <h1 className="line-hero__title">Life on y1ran</h1>
          <p className="line-hero__desc">
            工具、系統、應用入口。<br />
            不寫部落格，直接給能用的東西。
          </p>

          <div className="line-hero__actions">
            <Link className="btn-primary" to="/products">查看應用</Link>
            <a className="btn-ghost" href="/app">開啟 Web</a>
            <a className="btn-ghost" href="#" onClick={(e)=>e.preventDefault()}>下載</a>
          </div>

          <div className="line-hero__download">
            <div className="download-label">Downloads</div>
            <div className="download-row">
              <a className="download-icon" href="#" onClick={(e)=>e.preventDefault()}>Windows</a>
              <a className="download-icon" href="#" onClick={(e)=>e.preventDefault()}>macOS</a>
              <a className="download-icon" href="#" onClick={(e)=>e.preventDefault()}>Android</a>
              <a className="download-icon" href="#" onClick={(e)=>e.preventDefault()}>iOS</a>
            </div>
          </div>

          <div className="line-scroll">Scroll</div>
        </div>
      </section>

      {/* FEATURED (Riot-ish creative strip) */}
      <section className="riot-strip">
        <div className="riot-strip__card">
          <div className="riot-strip__tag">FEATURED</div>
          <div className="riot-strip__title">Trading Journal · Beta</div>
          <div className="riot-strip__desc">
            交易紀錄與復盤系統。PnL / R 倍數 / 匯出。
          </div>
          <div className="riot-strip__actions">
            <Link className="btn-primary" to="/products/journal">了解更多</Link>
            <a className="btn-ghost" href="/app">開啟 Web</a>
            <a className="btn-ghost" href="#" onClick={(e)=>e.preventDefault()}>下載</a>
          </div>
        </div>
      </section>

      {/* PRODUCTS PREVIEW */}
      <section className="line-section">
        <div className="section-title">應用</div>
        <div className="cards">
          <div className="card">
            <div className="card-title">Trading Journal</div>
            <div className="card-desc">交易紀錄與復盤系統</div>
            <div className="card-meta">Web / PWA · Beta</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="mini-primary" to="/products/journal">介紹</Link>
              <a className="mini-ghost" href="/app">開啟 Web</a>
              <a className="mini-ghost" href="#" onClick={(e)=>e.preventDefault()}>下載</a>
            </div>
          </div>

          <div className="card card--disabled">
            <div className="card-title">Utilities</div>
            <div className="card-desc">小工具 / 實驗性功能</div>
            <div className="card-meta">Coming soon</div>
          </div>

          <div className="card card--disabled">
            <div className="card-title">Docs</div>
            <div className="card-desc">使用說明 / 規格 / 匯出格式</div>
            <div className="card-meta">Coming soon</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="line-footer">
        <div>Maintained by y1ran</div>
        <div className="footer-icons">
          <a href="#" aria-label="Discord">🔗</a>
          <a href="#" aria-label="Telegram">🔗</a>
          <a href="#" aria-label="X">🔗</a>
          <a href="#" aria-label="IG">🔗</a>
        </div>
      </footer>
    </div>
  );
}
