"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ANNOUNCEMENT_TEXT } from "@/lib/collection-constants";
import styles from "./nav-shell.module.css";

const MARQUEE_REPEATS = 4;

function MarqueeTrack() {
  const renderItems = (prefix: string) =>
    Array.from({ length: MARQUEE_REPEATS }, (_, i) => (
      <span key={`${prefix}-${i}`} className={styles.item}>
        <span>{ANNOUNCEMENT_TEXT}</span>
        <span className="mk-dot" aria-hidden="true">
          •
        </span>
      </span>
    ));
  return (
    <div className={styles.track}>
      <div className={styles.group}>{renderItems("a")}</div>
      <div className={`${styles.group} ${styles.groupDup}`} aria-hidden="true">
        {renderItems("b")}
      </div>
    </div>
  );
}

export function CollectionHeader() {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    `mk-menu-link ${styles.navLink}${pathname === href ? ` is-active-nav ${styles.active}` : ""}`;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {/* Top Luxury Announcement Bar */}
      <div className="mk-announcement" role="region" aria-label="Announcement">
        <div className={`mk-announcement-content ${styles.marquee}`}>
          <MarqueeTrack />
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
      <header className={`mk-header is-sticky ${styles.header}`} id="mk-header">
        <nav className={`mk-nav mk-nav--left ${styles.navLeft}`} aria-label="Primary navigation">
          <button
            className="mk-menu-trigger"
            type="button"
            data-menu-open
            aria-expanded="false"
            aria-controls="mk-menu"
          >
            <span className="mk-menu-icon" aria-hidden="true" />
          </button>
          <Link href="/collections/summer" className={linkClass("/collections/summer")}>
            Summer Collection
          </Link>
          <Link href="/collections/best-sellers" className={linkClass("/collections/best-sellers")}>
            Best Sellers !
          </Link>
          <Link href="/collections/all" className={linkClass("/collections/all")}>
            All Products
          </Link>
        </nav>

        {/* Authentic Miskova brand mark (emblem only, matches SiteHeader) */}
        <Link
          href="/"
          className={`mk-wordmark ${styles.wordmark}`}
          aria-label="Miskova Fragrances Home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand/logo.webp"
            alt="Miskova emblem"
            className="mk-wordmark-emblem"
            width={44}
            height={44}
          />
        </Link>

        <nav className={`mk-nav mk-nav--right ${styles.navRight}`} aria-label="Utility navigation">
          <Link href="/collections" className={linkClass("/collections")}>
            Categories
          </Link>
          <Link href="/#reviews" className={`mk-menu-link ${styles.navLink}`}>
            Customer reviews
          </Link>
          <button
            className="mk-nav-btn"
            type="button"
            data-search-open
            aria-label="Search fragrances"
          >
            <svg className="mk-nav-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.8 13.8L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="mk-nav-label">Search</span>
          </button>
          <button
            className="mk-nav-btn mk-bag-btn"
            type="button"
            data-cart-open
            aria-label="Open shopping bag"
          >
            <span className="mk-nav-icon">Bag</span>
            <span className="mk-bag-count" data-mk-count>
              0
            </span>
          </button>
        </nav>
      </header>
    </>
  );
}
