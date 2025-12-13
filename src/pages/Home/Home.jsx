import { Link } from "react-router-dom";
import y1ranLogo from "../../assets/y1ran-logo.png";

export default function Home() {
  return (
    <div className="home">
      {/* Header */}
      <header className="home__nav">
        <div className="home__brand">
          <img src={y1ranLogo} alt="y1ran" className="home__logo" />
          <div>
            <div className="home__brandName">y1ran Web</div>
            <div className="home__brandSub">products · playground</div>
          </div>
        </div>

        <nav className="home__menu">
          <Link className="home__link" to="/products">應用</Link>
          <Link className="home__link" to="/status">狀態</Link>
          <Link className="home__cta" to="/login">登入 / 註冊</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero__wrap">
          <h1 className="hero__title">應用與工具入口</h1>
          <p className="hero__desc">
            集中管理可用應用，提供 Web 使用與下載入口。
          </p>

          <div className="hero__actions">
            <Link className="btn btn--primary" to="/products">查看應用</Link>
            <a className="btn btn--ghost" href="/app">開啟 Web</a>
            <button className="btn btn--ghost" type="button" disabled>下載</button>
          </div>

          <div className="hero__chips">
            <span className="chip">Windows</span>
            <span className="chip">macOS</span>
            <span className="chip">Android</span>
            <span className="chip">iOS</span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="featured">
        <div className="featured__wrap">
          <div className="featured__card">
            <div className="featured__tag">FEATURED</div>
            <div className="featured__title">Trading Journal · Beta</div>
            <div className="featured__desc">交易紀錄與復盤系統 · PnL / R 倍數 / 匯出</div>

            <div className="featured__actions">
              <Link className="btn btn--primary" to="/products/journal">了解更多</Link>
              <a className="btn btn--ghostDark" href="/app">開啟 Web</a>
              <button className="btn btn--ghostDark" type="button" disabled>下載</button>
            </div>
          </div>
        </div>
      </section>

      {/* Apps preview */}
      <section className="apps">
        <div className="apps__wrap">
          <div className="apps__title">應用</div>

          <div className="apps__grid">
            <div className="appCard">
              <div className="appCard__name">Trading Journal</div>
              <div className="appCard__desc">交易紀錄與復盤系統</div>
              <div className="appCard__meta">Web / PWA · Beta</div>
              <div className="appCard__actions">
                <Link className="mini mini--primary" to="/products/journal">介紹</Link>
                <a className="mini mini--ghost" href="/app">開啟 Web</a>
                <button className="mini mini--ghost" type="button" disabled>下載</button>
              </div>
            </div>

            <div className="appCard appCard--disabled">
              <div className="appCard__name">Utilities</div>
              <div className="appCard__desc">小工具 / 實驗性功能</div>
              <div className="appCard__meta">Coming soon</div>
            </div>

            <div className="appCard appCard--disabled">
              <div className="appCard__name">Docs</div>
              <div className="appCard__desc">使用說明 / 匯出格式</div>
              <div className="appCard__meta">Coming soon</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="home__footer">
        <div>Maintained by y1ran</div>
        <div className="home__footerLinks">
          <a href="#" onClick={(e)=>e.preventDefault()}>Link</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Link</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Link</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Link</a>
        </div>
      </footer>
    </div>
  );
}
