"use client";

import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import styles from "@/app/home-luxury.module.css";

export default function CatalogSection() {
  // Position descending order matching the original store
  const allProducts = [...products].sort((a, b) => {
    const posA = a.slug === "Day-and-Night" || a.slug === "Spider-bundle" ? 22
      : a.slug === "Fruit-Fusion" || a.slug === "Pacific-Sol" ? 20
      : a.slug === "Heir" ? 19
      : a.slug === "Third-Act" ? 18
      : a.slug === "Vintage-Lounge" || a.slug === "Crimson-Bloom" || a.slug === "Exotic-Dusk" ? 17
      : a.slug === "Eternal-Knot" || a.slug === "The-Pequod" || a.slug === "Ivory-Nectar" || a.slug === "Liquid-Gold" ? 15
      : a.slug === "Heavens-cut" ? 10 : 1;
    const posB = b.slug === "Day-and-Night" || b.slug === "Spider-bundle" ? 22
      : b.slug === "Fruit-Fusion" || b.slug === "Pacific-Sol" ? 20
      : b.slug === "Heir" ? 19
      : b.slug === "Third-Act" ? 18
      : b.slug === "Vintage-Lounge" || b.slug === "Crimson-Bloom" || b.slug === "Exotic-Dusk" ? 17
      : b.slug === "Eternal-Knot" || b.slug === "The-Pequod" || b.slug === "Ivory-Nectar" || b.slug === "Liquid-Gold" ? 15
      : b.slug === "Heavens-cut" ? 10 : 1;
    return posB - posA;
  });

  return (
    <section className={`mk-catalog-section ${styles.section}`} id="all-products" aria-labelledby="catalog-heading">
      <div className="mk-section-head">
        <div>
          <p className={styles.eyebrow} aria-hidden="true">
            All Products
          </p>
          <h2 id="catalog-heading">All Products</h2>
        </div>
        <Link className="mk-text-link" href="/collections/all">
          View All
        </Link>
      </div>
      <div className="mk-product-grid">
        {allProducts.map((item) => {
          const pct = item.salePrice && item.price > 0 ? Math.round(((item.price - item.salePrice) / item.price) * 100) : null;
          const isOutOfStock = !item.isAvailable;
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
                {isOutOfStock ? (
                  <button
                    className="mk-card-quick-add is-disabled"
                    type="button"
                    disabled
                    aria-label={`${item.name} is out of stock`}
                  >
                    Out of stock
                  </button>
                ) : (
                  <button
                    className="mk-card-quick-add"
                    type="button"
                    data-add={item.slug}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    Add to cart
                  </button>
                )}
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
                {isOutOfStock && (
                  <p className="mk-stock-flag" role="status">
                    Out of stock
                  </p>
                )}
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
  );
}
