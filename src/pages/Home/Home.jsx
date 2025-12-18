import { Link } from "react-router-dom";
import { products } from "../../data/products";

export default function Home() {
  const featured = products?.find?.((p) => p.featured) || products?.[0];

  return (
    <>
      {/* Header */}
      <header className="siteHeader">
        <div className="siteHeader__inner">
          <div className="siteHeader__brand header-left">
            <img src="/y1ran-logo.png" alt="y1ran" className="header-logo" />
            <div className="header-title">
              <div className="title">y1ran Web</div>
              <div className="subtitle">products · playground</div>
            </div>
          </div>
          <nav className="siteHeader__nav">
            <Link to="/products" className="siteHeader__link">應用</Link>
            <Link to="/status" className="siteHeader__link">狀態</Link>
            <Link to="/login" className="siteHeader__cta">登入 / 註冊</Link>
          </nav>
        </div>
      </header>

      <main className="siteMain">
        {/* HERO */}
        <section className="homeHero">
          <div className="homeHero__inner">
            <div className="homeHero__content">
              <h1 className="homeHero__title">
                <span className="gradText">y1ran web</span>
              </h1>

              <div className="homeHero__cta">
                <Link className="btn btn--primary" to="/products">查看應用</Link>
                <Link className="btn btn--ghost" to="/app">開啟 Web</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED（柔和接段） */}
        {featured && (
          <section className="homeFeatured">
            <div className="homeFeatured__inner">
              <div className="featuredCard">
                <div className="featuredCard__kicker">FEATURED</div>
                <div className="featuredCard__title">{featured.title || featured.name}</div>
                <div className="featuredCard__desc">{featured.subtitle || featured.tagline || featured.description}</div>

                <div className="featuredCard__actions">
                  <Link className="btn btn--primary" to={`/products/${featured.id}`}>了解更多</Link>
                  <Link className="btn btn--ghost" to="/app">開啟 Web</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* APPS */}
        <section className="homeApps">
          <div className="homeApps__inner">
            <h2 className="sectionTitle">應用</h2>

            <div className="appGrid">
              {products?.slice?.(0, 6)?.map((p) => (
                <article key={p.id} className="appCard">
                  <div className="appCard__top">
                    <div className="appCard__name">{p.title || p.name}</div>
                    <div className="appCard__meta">{p.platform || "Web / PWA"}</div>
                  </div>

                  <div className="appCard__desc">{p.subtitle || p.tagline || p.description}</div>

                  <div className="appCard__actions">
                    <Link className="btn btn--small btn--primary" to={`/products/${p.id}`}>介紹</Link>
                    <Link className="btn btn--small btn--ghost" to="/app">開啟 Web</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
