"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import styles from "@/app/home-luxury.module.css";
export default function BestSellersCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bestSellerSlugs = ["Day-and-Night", "Spider-bundle", "Pacific-Sol", "Crimson-Bloom", "Liquid-Gold", "Y-code"];
  const bestSellers = bestSellerSlugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean) as typeof products;
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -340 : 340;
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollRef.current.scrollBy({ left: offset, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <section className={`mk-bestsellers-section ${styles.section}`} id="best-sellers" aria-labelledby="bestsellers-heading">
      <div className="mk-section-head">
        <div>
          <p className={styles.eyebrow} aria-hidden="true">
            Best Sellers !
          </p>
          <h2 id="bestsellers-heading">Best Sellers !</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link className="mk-text-link" href="/collections/best-sellers">
            View All
          </Link>
          <div className="mk-carousel-controls" aria-label="Carousel navigation">
            <button
            className="mk-carousel-btn"
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            className="mk-carousel-btn"
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            →
          </button>
          </div>
        </div>
      </div>

      <div className="mk-carousel-track" ref={scrollRef}>
        {bestSellers.map((item) => {
          const pct = item.salePrice && item.price > 0 ? Math.round(((item.price - item.salePrice) / item.price) * 100) : null;
          return (
            <article className="mk-card mk-carousel-card" key={item.slug}>
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
                  sizes="(max-width: 620px) 72vw, (max-width: 1200px) 28vw, 340px"
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
  );
}
