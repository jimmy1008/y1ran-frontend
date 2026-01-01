import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { products } from "../../data/products";

export default function Home() {
  const location = useLocation();
  const featured = products?.find?.((p) => p.featured) || products?.[0];

  useEffect(() => {
    if (location.hash !== "#apps") return;
    requestAnimationFrame(() => {
      const el = document.getElementById("apps");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <>
      <main className="siteMain">
        {/* HERO */}
        <section className="homeHero">
          <div className="homeHero__inner">
            <div className="homeHero__content">
              <h1 className="homeHero__title">
                <span className="gradText">y1ran web</span>
              </h1>

              <div className="homeHero__cta">
                <Link className="btn btn--primary" to="/products">
                  查看應用
                </Link>
                <Link className="btn btn--ghost" to="/app">
                  開啟 Web
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED（柔和接段） */}
        {featured && (
          <section className="homeFeatured" id="apps">
            <div className="homeFeatured__inner">
              <div className="featuredCard">
                <div className="featuredCard__kicker">FEATURED</div>
                <div className="featuredCard__title">
                  {featured.title || featured.name}
                </div>
                <div className="featuredCard__desc">
                  {featured.subtitle || featured.tagline || featured.description}
                </div>

                <div className="featuredCard__actions">
                  <Link className="btn btn--primary" to={`/products/${featured.id}`}>
                    了解更多
                  </Link>
                  <Link className="btn btn--ghost" to="/app">
                    開啟 Web
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
