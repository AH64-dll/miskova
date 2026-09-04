import Image from "next/image";
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

export function AnnouncementBar({
  dismissed,
  onDismiss,
}: {
  dismissed: boolean;
  onDismiss: () => void;
}) {
  if (dismissed) return null;
  return (
    <div className="mk-announcement" role="region" aria-label="Announcement">
      <div className={`mk-announcement-content ${styles.marquee}`}>
        <MarqueeTrack />
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={onDismiss}
        className="mk-announcement-dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function SiteHeader({ onSearch, onMenu }: { onSearch: () => void; onMenu: () => void }) {
  return (
    <header className={`mk-header ${styles.header}`} id="mk-header">
      <nav className={`mk-nav mk-nav--left ${styles.navLeft}`} aria-label="Primary navigation">
        <button
          className="mk-menu-trigger"
          type="button"
          onClick={onMenu}
          aria-expanded="false"
          aria-controls="mk-menu"
        >
          <span className="mk-menu-icon" aria-hidden="true" />
          <span>Menu</span>
        </button>
        <a className={`mk-menu-link ${styles.navLink}`} href="/collections/summer">
          Summer Collection
        </a>
        <a className={`mk-menu-link ${styles.navLink}`} href="/collections/best-sellers">
          Best Sellers !
        </a>
        <a className={`mk-menu-link ${styles.navLink}`} href="/collections/all">
          All Products
        </a>
      </nav>

      <a href="/" className={`mk-wordmark ${styles.wordmark}`} aria-label="Miskova Fragrances Home">
        <Image
          src="/assets/brand/logo.webp"
          alt="Miskova emblem"
          className="mk-wordmark-emblem"
          width={44}
          height={44}
          priority
        />
      </a>

      <nav className={`mk-nav mk-nav--right ${styles.navRight}`} aria-label="Utility navigation">
        <a className={`mk-menu-link ${styles.navLink}`} href="/collections">
          Categories
        </a>
        <a className={`mk-menu-link ${styles.navLink}`} href="/#reviews">
          Customer reviews
        </a>
        <button
          className="mk-nav-btn"
          type="button"
          onClick={onSearch}
          aria-label="Search fragrances"
          aria-haspopup="dialog"
        >
          <svg className="mk-nav-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13.8 13.8L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="mk-nav-label">Search</span>
        </button>
      </nav>
    </header>
  );
}
