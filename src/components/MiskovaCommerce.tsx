"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { products, type Product } from "@/data/products";
import styles from "./navigator.module.css";

const FREE_SHIPPING_THRESHOLD = 1200;
const CART_STORAGE_KEY = "miskova:cart:items";
const ANNOUNCEMENT_KEY = "miskova:announcement";
const SEARCH_FOCUS_DELAY = 280;
const TOAST_DURATION = 2600;

type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type PanelId = "cart" | "search" | "menu";

export default function MiskovaCommerce() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuTriggerRef = useRef<Element | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const menuPrevPanelRef = useRef<PanelId | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const skipPersist = useRef(true);

  // Cart math
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const meterStyle = { "--shipping-progress": `${progress}%` } as CSSProperties;

  // Search filter across all 11 perfumes
  const needle = query.trim().toLowerCase();
  const searchResults: Product[] = needle
    ? products.filter((p) => p.name.toLowerCase().includes(needle))
    : products;

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast("");
      toastTimer.current = undefined;
    }, TOAST_DURATION);
  }, []);

  // Add product to cart
  const addItem = useCallback(
    (productSlug?: string) => {
      const slug = productSlug || "Pacific-Sol";
      const product = products.find((p) => p.slug === slug) || products[0];
      const effectivePrice = product.salePrice || product.price;

      setCartItems((prev) => {
        const existing = prev.find((item) => item.slug === product.slug);
        if (existing) {
          return prev.map((item) =>
            item.slug === product.slug ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...prev,
          {
            slug: product.slug,
            name: product.name,
            price: effectivePrice,
            image: product.image,
            quantity: 1,
          },
        ];
      });

      showToast(`${product.name} added to your bag`);
      setOpenPanel("cart");
    },
    [showToast],
  );

  const updateQuantity = useCallback((slug: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.slug === slug) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setCartItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  // Hydrate cart from storage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
          return;
        }
      }
      // Fallback: check legacy single SKU key
      const legacyQty = window.localStorage.getItem("miskova:pacific-sol:qty");
      if (legacyQty) {
        const qty = parseInt(legacyQty, 10);
        if (qty > 0) {
          const pac = products[0];
          setCartItems([
            {
              slug: pac.slug,
              name: pac.name,
              price: pac.salePrice || pac.price,
              image: pac.image,
              quantity: qty,
            },
          ]);
        }
      }
    } catch {
      /* storage unavailable: start clean */
    }
  }, []);

  // Persist cart
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      /* storage quota/private mode */
    }
  }, [cartItems]);

  // Sync all [data-mk-count] badges across the DOM
  useEffect(() => {
    document.querySelectorAll("[data-mk-count]").forEach((el) => {
      el.textContent = String(totalCount);
    });
  }, [totalCount]);

  // Announcement state & footer year
  useEffect(() => {
    try {
      if (window.localStorage.getItem(ANNOUNCEMENT_KEY) === "closed") {
        document.body.classList.add("announcement-closed");
      }
    } catch {
      /* storage unavailable */
    }
    const year = document.getElementById("mk-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }, []);

  // Body scroll lock on open panel
  useEffect(() => {
    document.body.classList.toggle("locked", openPanel !== null);
    document
      .querySelectorAll("[data-menu-open]")
      .forEach((el) => el.setAttribute("aria-expanded", "false"));
    if (openPanel === "menu" && menuTriggerRef.current) {
      menuTriggerRef.current.setAttribute("aria-expanded", "true");
    }
  }, [openPanel]);

  // Focus search input
  useEffect(() => {
    if (openPanel === "search") {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), SEARCH_FOCUS_DELAY);
      return () => clearTimeout(timer);
    }
  }, [openPanel]);

  // Menu drawer: focus on open, restore to trigger on close (cart/search untouched)
  useEffect(() => {
    if (openPanel === "menu") {
      menuCloseRef.current?.focus();
    } else if (menuPrevPanelRef.current === "menu") {
      const trigger = menuTriggerRef.current as HTMLElement | null;
      trigger?.focus?.();
    }
    menuPrevPanelRef.current = openPanel;
  }, [openPanel]);

  // Global delegated click and keyboard listeners
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const dismissBtn = target.closest("[data-announcement-dismiss]");
      if (dismissBtn) {
        document.body.classList.add("announcement-closed");
        try {
          window.localStorage.setItem(ANNOUNCEMENT_KEY, "closed");
        } catch {
          /* noop */
        }
        return;
      }

      // Add to bag buttons
      const addTrigger = target.closest("[data-add]");
      if (addTrigger) {
        const slug = addTrigger.getAttribute("data-add") || "Pacific-Sol";
        addItem(slug);
        return;
      }

      // Panel triggers
      const cartOpen = target.closest("[data-cart-open]");
      if (cartOpen) {
        setOpenPanel("cart");
        return;
      }

      const searchOpen = target.closest("[data-search-open]");
      if (searchOpen) {
        setOpenPanel("search");
        return;
      }

      const menuOpen = target.closest("[data-menu-open]");
      if (menuOpen) {
        menuTriggerRef.current = menuOpen;
        setOpenPanel("menu");
        return;
      }

      // Close triggers
      const closeTrigger = target.closest("[data-mk-close], [data-mk-overlay], [data-mk-menu-link]");
      if (closeTrigger) {
        setOpenPanel(null);
        return;
      }

      // Direct cart line actions
      const incBtn = target.closest("[data-mk-inc]");
      if (incBtn) {
        const slug = incBtn.getAttribute("data-mk-inc");
        if (slug) updateQuantity(slug, 1);
        return;
      }

      const decBtn = target.closest("[data-mk-dec]");
      if (decBtn) {
        const slug = decBtn.getAttribute("data-mk-dec");
        if (slug) updateQuantity(slug, -1);
        return;
      }

      const removeBtn = target.closest("[data-mk-remove]");
      if (removeBtn) {
        const slug = removeBtn.getAttribute("data-mk-remove");
        if (slug) removeItem(slug);
        return;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [addItem, updateQuantity, removeItem]);

  return (
    <>
      {/* Dim overlay */}
      <div
        className={`mk-overlay ${openPanel !== null ? "is-open" : ""} ${styles.scrim}`}
        data-mk-overlay
        aria-hidden={openPanel === null}
      />

      {/* Cart Drawer */}
      <aside
        className={`mk-drawer ${openPanel === "cart" ? "is-open" : ""}`}
        id="mk-cart"
        aria-labelledby="mk-cart-title"
        aria-hidden={openPanel !== "cart"}
      >
        <div className="mk-drawer-head">
          <h2 id="mk-cart-title">Your Bag ({totalCount})</h2>
          <button className="mk-icon-button" type="button" data-mk-close aria-label="Close bag">
            ×
          </button>
        </div>
        <div className="mk-drawer-body">
          {cartItems.length === 0 ? (
            <div className="mk-empty">Your cart is empty.</div>
          ) : (
            <div className="mk-cart-lines">
              {cartItems.map((item) => (
                <article className="mk-cart-line" key={item.slug}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.price} EGP</p>
                    <div className="mk-quantity">
                      <button
                        type="button"
                        data-mk-dec={item.slug}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        data-mk-inc={item.slug}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="mk-remove-line"
                      type="button"
                      data-mk-remove={item.slug}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}

              <div className="mk-shipping-meter">
                <p>
                  {remaining > 0
                    ? `${remaining} EGP away from free shipping`
                    : "Your order qualifies for complimentary express shipping"}
                </p>
                <div className="mk-meter-track">
                  <span style={meterStyle} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mk-drawer-foot" hidden={cartItems.length === 0}>
          <div className="mk-subtotal">
            <span>Subtotal</span>
            <strong>{subtotal} EGP</strong>
          </div>
          <a
            className="mk-primary-button"
            href={`https://miskova.myeasyorders.com/products/${cartItems[0]?.slug || "Pacific-Sol"}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Checkout with EasyOrders
          </a>
        </div>
      </aside>

      {/* Live Search Modal */}
      <section
        className={`mk-search ${openPanel === "search" ? "is-open" : ""}`}
        id="mk-search"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mk-search-label"
        aria-hidden={openPanel !== "search"}
      >
        <div className="mk-search-head">
          <button className="mk-icon-button" type="button" data-mk-close aria-label="Close search">
            ×
          </button>
        </div>
        <div className="mk-search-form" id="mk-search-label">
          <input
            ref={searchInputRef}
            className="mk-search-input"
            type="search"
            autoComplete="off"
            placeholder="I'm Searching for..."
            aria-label="I'm Searching for..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <a
            href="/collections/all"
            className="mk-primary-button"
            style={{ marginTop: 12, display: "inline-flex", justifyContent: "center" }}
            onClick={() => setOpenPanel(null)}
          >
            Show All Results
          </a>
        </div>
        <div className="mk-search-results" aria-live="polite">
          {searchResults.length === 0 ? (
            <div className="mk-search-empty" style={{ textAlign: "center", padding: "24px 0" }}>
              <a
                href="/collections/all"
                className="mk-primary-button"
                onClick={() => setOpenPanel(null)}
              >
                Show All Results
              </a>
            </div>
          ) : (
            searchResults.map((item) => (
              <a
                className="mk-search-result"
                key={item.slug}
                href={`https://miskova.myeasyorders.com/products/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  <b>{item.name}</b>
                </span>
                <span className="mk-search-price">
                  {item.salePrice ? (
                    <>
                      <strong>{item.salePrice} EGP</strong> <s>{item.price} EGP</s>
                    </>
                  ) : (
                    <strong>{item.price} EGP</strong>
                  )}
                </span>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Mobile Navigation Drawer */}
      <nav
        className={`mk-drawer ${openPanel === "menu" ? "is-open" : ""} ${styles.menuDrawer}`}
        id="mk-menu"
        aria-label="Mobile navigation"
        aria-hidden={openPanel !== "menu"}
      >
        <div className={`mk-drawer-head ${styles.head}`}>
          <div className={styles.titleWrap}>
            <span className={styles.kicker}>Miskova</span>
            <h2 className={styles.title}>Menu</h2>
          </div>
          <button ref={menuCloseRef} className={`mk-icon-button ${styles.closeBtn}`} type="button" data-mk-close aria-label="Close menu">
            <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={`mk-drawer-body ${styles.body}`}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Categories</h3>
            <a className={`mk-row ${styles.link}`} href="/collections/summer" data-mk-menu-link onClick={() => setOpenPanel(null)}>
              <span className={styles.index} aria-hidden="true">01</span>
              <span className={styles.label}>Summer Collection</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link}`} href="/collections/for-him" data-mk-menu-link onClick={() => setOpenPanel(null)}>
              <span className={styles.index} aria-hidden="true">02</span>
              <span className={styles.label}>For Him</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link}`} href="/collections/for-her" data-mk-menu-link onClick={() => setOpenPanel(null)}>
              <span className={styles.index} aria-hidden="true">03</span>
              <span className={styles.label}>For Her</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link}`} href="/collections/best-sellers" data-mk-menu-link onClick={() => setOpenPanel(null)}>
              <span className={styles.index} aria-hidden="true">04</span>
              <span className={styles.label}>Best Sellers !</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link}`} href="/collections/all" data-mk-menu-link onClick={() => setOpenPanel(null)}>
              <span className={styles.index} aria-hidden="true">05</span>
              <span className={styles.label}>All Products</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Client Care</h3>
            <a className={`mk-row ${styles.link} ${styles.secondary}`} href="https://miskova.myeasyorders.com/pages/privacy-policy" target="_blank" rel="noopener noreferrer">
              <span className={styles.index} aria-hidden="true">i</span>
              <span className={styles.label}>Privacy Policy</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M5 13L13 5M7 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link} ${styles.secondary}`} href="https://miskova.myeasyorders.com/pages/refund-policy" target="_blank" rel="noopener noreferrer">
              <span className={styles.index} aria-hidden="true">ii</span>
              <span className={styles.label}>Refund Policy</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M5 13L13 5M7 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link} ${styles.secondary}`} href="https://miskova.myeasyorders.com/pages/shipping-policy" target="_blank" rel="noopener noreferrer">
              <span className={styles.index} aria-hidden="true">iii</span>
              <span className={styles.label}>Shipping Policy</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M5 13L13 5M7 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link} ${styles.secondary}`} href="https://miskova.myeasyorders.com/pages/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              <span className={styles.index} aria-hidden="true">iv</span>
              <span className={styles.label}>Terms &amp; Conditions</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M5 13L13 5M7 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={`mk-row ${styles.link} ${styles.secondary}`} href="https://miskova.myeasyorders.com/pages/About-us" target="_blank" rel="noopener noreferrer">
              <span className={styles.index} aria-hidden="true">v</span>
              <span className={styles.label}>About Us</span>
              <svg className={styles.arrow} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M5 13L13 5M7 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Global Luxury Toast */}
      <div className={`mk-toast ${toast ? "is-open" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
