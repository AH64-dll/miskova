"use client";

import { useEffect, useRef, useState } from "react";
import { AnnouncementBar, SiteHeader } from "./layout/SiteHeader";
import type { CatalogProduct } from "@/data/products";
import menu from "./site-menu.module.css";

type SearchEntry = Pick<CatalogProduct, "name" | "slug" | "canonicalUrl">;

const ANNOUNCEMENT_KEY = "miskova:announcement";

export default function SiteChrome({ products }: { products: SearchEntry[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(ANNOUNCEMENT_KEY) === "closed") {
        setDismissed(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(ANNOUNCEMENT_KEY, "closed");
    } catch {
      /* noop */
    }
  };

  const openSearch = () => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSearchOpen(true);
  };
  const menuTriggerRef = useRef<HTMLElement | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const openMenu = () => {
    menuTriggerRef.current = document.activeElement as HTMLElement | null;
    setMenuOpen(true);
  };
  const closeMenu = () => {
    setMenuOpen(false);
    menuTriggerRef.current?.focus?.();
  };

  useEffect(() => {
    if (menuOpen) menuCloseRef.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (searchOpen && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!searchOpen && dialog.open) dialog.close();
  }, [searchOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      setSearchOpen(false);
      setQuery("");
      triggerRef.current?.focus?.();
    };
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) setSearchOpen(false);
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? products.filter((p) => p.name.toLowerCase().includes(needle))
    : [];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AnnouncementBar dismissed={dismissed} onDismiss={dismiss} />
      <SiteHeader onSearch={openSearch} onMenu={openMenu} />

      <dialog
        ref={dialogRef}
        className="mk-search-dialog"
        aria-label="Search fragrances"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            setSearchOpen(false);
          }
          if (event.key === "Tab") {
            const root = dialogRef.current;
            if (!root) return;
            const focusables = Array.from(
              root.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
              ),
            ).filter((el) => el.offsetParent !== null);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <form method="dialog" className="mk-search-head">
          <label className="mk-search-form" htmlFor="mk-search-input">
            <input
              ref={inputRef}
              id="mk-search-input"
              className="mk-search-input"
              type="search"
              autoComplete="off"
              placeholder="I'm Searching for..."
              aria-label="Search fragrances"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button className="mk-icon-button" type="submit" aria-label="Close search">
            ×
          </button>
        </form>
        <div className="mk-search-results" aria-live="polite">
          {needle !== "" && results.length === 0 && (
            <p className="mk-search-empty">No products found for &ldquo;{query}&rdquo;.</p>
          )}
          {results.map((item) => (
            <a
              className="mk-search-result"
              key={item.slug}
              href={item.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${item.name} details`}
            >
              <b>{item.name}</b>
            </a>
          ))}
        </div>
      </dialog>

      {menuOpen && (
        <>
          <div
            className={`mk-menu-scrim is-open ${menu.menuScrim}`}
            aria-hidden="true"
            onClick={closeMenu}
          />
          <div
            className={`mk-menu is-open ${menu.menuShell}`}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            id="mk-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                closeMenu();
              }
            }}
          >
            <div className={`mk-menu-head ${menu.menuHead}`}>
              <div className={`mk-menu-title ${menu.menuTitle}`}>
                <span className={`mk-menu-kicker ${menu.menuKicker}`}>Miskova</span>
                <h2 className={`mk-menu-heading ${menu.menuHeading}`}>Menu</h2>
              </div>
              <button
                ref={menuCloseRef}
                type="button"
                className={`mk-icon-button mk-menu-close ${menu.menuClose}`}
                onClick={closeMenu}
                aria-label="Close menu"
              >
                <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className={`mk-menu-nav ${menu.menuNav}`} aria-label="Menu">
              <div className={`mk-menu-section ${menu.menuSection}`}>
                <h3 className={`mk-menu-section-title ${menu.menuSectionTitle}`}>Collections</h3>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections/summer" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">01</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>Summer Collection</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections/for-him" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">02</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>For Him</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections/for-her" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">03</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>For Her</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections/best-sellers" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">04</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>Best Sellers !</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections/all" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">05</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>All Products</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row ${menu.menuRow}`} href="/collections" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">06</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>Categories</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div className={`mk-menu-section ${menu.menuSection}`}>
                <h3 className={`mk-menu-section-title ${menu.menuSectionTitle}`}>Maison</h3>
                <a className={`mk-menu-row mk-menu-row--secondary ${menu.menuRow} ${menu.menuRowSecondary}`} href="/" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">i</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>Home</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a className={`mk-menu-row mk-menu-row--secondary ${menu.menuRow} ${menu.menuRowSecondary}`} href="/#reviews" onClick={closeMenu}>
                  <span className={`mk-menu-index ${menu.menuIndex}`} aria-hidden="true">ii</span>
                  <span className={`mk-menu-label ${menu.menuLabel}`}>Customer reviews</span>
                  <svg className={`mk-menu-arrow ${menu.menuArrow}`} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
