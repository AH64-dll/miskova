import Image from "next/image";
import Link from "next/link";
import Journey from "@/home/Journey";
import HeaderTheme from "@/home/HeaderTheme";
import BestSellersCarousel from "@/home/BestSellersCarousel";
import CatalogSection from "@/home/CatalogSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { products, categories } from "@/data/products";
import "./home.css";
import styles from "./home-luxury.module.css";

export default function Home() {
  const summerSlugs = ["Spider-bundle", "Fruit-Fusion", "Pacific-Sol", "Crimson-Bloom", "The-Pequod", "Y-code"];
  const summerProducts = summerSlugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean) as typeof products;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="mk-announcement" role="region" aria-label="Announcement">
        <div className="mk-announcement-content">
          <p>
            <span>FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP</span>
            <span className="mk-dot">•</span>
            <span>FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP</span>
            <span className="mk-dot">•</span>
            <span>FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP</span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss announcement"
          data-announcement-dismiss
          className="mk-announcement-dismiss"
        >
          ×
        </button>
      </div>

      {/* Luxury Sticky Header with Prominent Logo Lockup */}
      <header className="mk-header" id="mk-header">
        <nav className="mk-nav mk-nav--left" aria-label="Primary navigation">
          <button
            className="mk-menu-trigger"
            type="button"
            data-menu-open
            aria-expanded="false"
            aria-controls="mk-menu"
          >
            <span className="mk-menu-icon" />
            <span>Menu</span>
          </button>
          <Link href="/collections/summer">Summer Collection</Link>
          <Link href="/collections/best-sellers">Best Sellers !</Link>
          <Link href="/collections/all">All Products</Link>
          <Link href="/collections">Categories</Link>
          <a href="#reviews">Customer reviews</a>
        </nav>

        {/* Authentic Luxury Miskova Brand Lockup */}
        <Link href="/" className="mk-wordmark" aria-label="Miskova Fragrances Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand/logo.webp"
            alt="Miskova emblem"
            className="mk-wordmark-emblem"
            width={44}
            height={44}
          />
          <div className="mk-wordmark-text">
            <span className="mk-brand-name">MISKOVA</span>
          </div>
        </Link>

        <nav className="mk-nav mk-nav--right" aria-label="Utility navigation">
          <button className="mk-nav-btn" type="button" data-search-open aria-label="Search fragrances">
            <span className="mk-nav-icon">⚲</span>
            <span className="mk-nav-label">Search</span>
          </button>
          <button className="mk-nav-btn mk-bag-btn" type="button" data-cart-open aria-label="Open shopping bag">
            <span className="mk-nav-icon">Bag</span>
            <span className="mk-bag-count" data-mk-count>
              0
            </span>
            <span className="sr-only">items in cart, view bag</span>
          </button>
        </nav>
      </header>

      <HeaderTheme />

      <main id="main" className={styles.main}>
        {/* 3D Hero Cinematic Experience */}
        <Journey />
        {/* Categories */}
        <section className={`mk-categories-section ${styles.section}`} id="categories" aria-labelledby="categories-heading">
          <div className="mk-section-head mk-center-head">
            <div>
              <p className={`${styles.eyebrow} ${styles.eyebrowCenter}`} aria-hidden="true">
                Categories
              </p>
              <h2 id="categories-heading">Categories</h2>
            </div>
          </div>
          <div className="mk-categories-grid">
            {categories.map((cat) => {
              const href =
                cat.slug === "Summer-fragrances"
                  ? "/collections/summer"
                  : cat.slug === "men-fragrances"
                    ? "/collections/for-him"
                    : "/collections/for-her";

              return (
                <Link
                  className="mk-category-card"
                  key={cat.slug}
                  href={href}
                  aria-label={`Explore ${cat.name}`}
                >
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={800}
                      height={800}
                      className="mk-category-img"
                      loading="eager"
                    />
                  <div className="mk-category-info">
                    <span className="mk-category-count">{cat.productCount} Product</span>
                    <h3 className="mk-category-name">{cat.name}</h3>
                    <span className="mk-category-cta">View Details</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <div className={styles.reviewsWrap}>
          <ReviewsSection products={products} />
        </div>

        {/* Summer Collection */}
        <section className={`mk-collection-section ${styles.section}`} id="summer-collection" aria-labelledby="summer-heading">
          <div className="mk-section-head">
            <div>
              <p className={styles.eyebrow} aria-hidden="true">
                Summer Collection
              </p>
              <h2 id="summer-heading">Summer Collection</h2>
            </div>
            <Link className="mk-text-link" href="/collections/summer">
              View All
            </Link>
          </div>

          <div className="mk-product-grid">
            {summerProducts.map((item) => {
              const pct = item.salePrice && item.price > 0 ? Math.round(((item.price - item.salePrice) / item.price) * 100) : null;
              return (
                <article className="mk-card" key={item.slug}>
                  <div className="mk-card-media">
                    {pct !== null && <span className="mk-card-badge">-{pct}%</span>}
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={600}
                      height={600}
                      className="mk-card-img"
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    <button
                      className="mk-card-quick-add"
                      type="button"
                      data-add={item.slug}
                      aria-label={`Add ${item.name} to cart`}
                    >
                      Add to cart
                    </button>
                  </div>
                  <div className="mk-card-info">
                    <h3 className="mk-card-title">{item.name}</h3>
                    <div className="mk-card-price">
                      {item.salePrice ? (
                        <>
                          <span className="mk-sale-price">{item.salePrice} EGP</span>
                          <s className="mk-orig-price">{item.price} EGP</s>
                        </>
                      ) : (
                        <span>{item.price} EGP</span>
                      )}
                    </div>
                    <a
                      className="mk-card-link"
                      href={item.canonicalUrl}
                      aria-label={`View ${item.name} details`}
                    >
                      View details
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Best Sellers ! */}
        <BestSellersCarousel />

        {/* All Products */}
        <CatalogSection />

      </main>

      {/* Comprehensive Luxury Sphinx Footer */}
      <footer className="mk-footer">
        <div className="mk-footer-grid">
          <div className="mk-footer-contact-details">
            <p>Address: Cairo,Egypt</p>
            <p>Phone: <a href="tel:01036202634">01036202634</a></p>
            <p>Email: <a href="mailto:miskovafragrances@gmail.com">miskovafragrances@gmail.com</a></p>
          </div>

          <nav className="mk-footer-col" aria-label="Categories">
            <h3>Categories</h3>
            <Link href="/collections/summer">Summer Collection</Link>
          </nav>

          <nav className="mk-footer-col" aria-label="Pages">
            <h3>Pages</h3>
            <a href="https://miskova.myeasyorders.com/pages/privacy-policy" target="_blank" rel="noopener noreferrer">
              privacy-policy
            </a>
            <a href="https://miskova.myeasyorders.com/pages/refund-policy" target="_blank" rel="noopener noreferrer">
              refund-policy
            </a>
            <a href="https://miskova.myeasyorders.com/pages/shipping-policy" target="_blank" rel="noopener noreferrer">
              shipping-policy
            </a>
            <a href="https://miskova.myeasyorders.com/pages/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              terms-and-conditions
            </a>
            <a href="https://miskova.myeasyorders.com/pages/About-us" target="_blank" rel="noopener noreferrer">
              About Us
            </a>
          </nav>

          <nav className="mk-footer-col" aria-label="Connect">
            <h3>Connect</h3>
            <a href="https://www.facebook.com/profile.php?id=61585754406759" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href="https://www.instagram.com/miskova_fragrances/" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://www.tiktok.com/@miskova_fragrance" target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
          </nav>
        </div>

        <div className="mk-footer-base">
          <p className="mk-powered-by">
            Powered By <a href="https://www.easy-orders.net" target="_blank" rel="noopener noreferrer">Easyorders</a>
          </p>
          <span>© 2026 Miskova Fragrances</span>
        </div>
      </footer>
    </>
  );
}
