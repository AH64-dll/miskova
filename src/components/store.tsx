"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { effectivePrice, products } from "@/data/products";

export type BagItem = { slug: string; qty: number };

const BAG_KEY = "miskova.bag.v1";
const MAX_QTY = 9;
const MAX_LINES = 10;

function readBag(): BagItem[] {
  try {
    const raw = window.localStorage.getItem(BAG_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(products.map((p) => p.slug));
    const out: BagItem[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const { slug, qty } = entry as { slug?: unknown; qty?: unknown };
      if (typeof slug !== "string" || !valid.has(slug)) continue;
      const q = Math.floor(Number(qty));
      if (!Number.isFinite(q) || q < 1) continue;
      if (out.some((l) => l.slug === slug)) continue;
      out.push({ slug, qty: Math.min(q, MAX_QTY) });
      if (out.length >= MAX_LINES) break;
    }
    return out;
  } catch {
    return [];
  }
}

type Ctx = {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  activeSlug: string | null;
  openProduct: (slug: string) => void;
  closeProduct: () => void;
  toast: string | null;
  showToast: (message: string) => void;
  items: BagItem[];
  addToBag: (slug: string) => void;
  removeFromBag: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clearBag: () => void;
  bagOpen: boolean;
  setBagOpen: (v: boolean) => void;
  bagCount: number;
  bagTotal: number;
};

const StoreCtx = createContext<Ctx | null>(null);

function readHash(): string | null {
  const m = window.location.hash.match(/^#\/product\/([A-Za-z0-9-]+)/);
  return m && products.some((p) => p.slug === m[1]) ? m[1] : null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [items, setItems] = useState<BagItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [bagHydrated, setBagHydrated] = useState(false);

  // Deep link: /#product/<slug> opens the overlay on first paint.
  useEffect(() => {
    setActiveSlug(readHash());
    const onHash = () => setActiveSlug(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // lock scroll when overlays open
  useEffect(() => {
    const lock = searchOpen || menuOpen || !!activeSlug || bagOpen;
    document.documentElement.style.overflow = lock ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [searchOpen, menuOpen, activeSlug, bagOpen]);

  // Bag persistence (localStorage): hydrate once, then write on change.
  // The hydrated flag is STATE (not a ref) so the write effect, which depends
  // on it, cannot fire its initial [] write before hydration commits — this
  // survives StrictMode double-mount (both mounts read before either writes).
  // useLayoutEffect, not useEffect: hydration must complete pre-paint so a
  // click that lands between commit and passive-effect flush cannot have its
  // addToBag clobbered by `setItems(readBag())` (suite-verified race).
  useLayoutEffect(() => {
    setItems(readBag());
    setBagHydrated(true);
  }, []);
  useEffect(() => {
    if (!bagHydrated) return;
    try {
      window.localStorage.setItem(BAG_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable; bag still works in memory */
    }
  }, [items, bagHydrated]);

  const addToBag = useCallback((slug: string) => {
    if (!products.some((p) => p.slug === slug)) return;
    setItems((prev) => {
      const line = prev.find((l) => l.slug === slug);
      if (line) return prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY) } : l));
      if (prev.length >= MAX_LINES) return prev;
      return [...prev, { slug, qty: 1 }];
    });
  }, []);
  const removeFromBag = useCallback((slug: string) => {
    setItems((prev) => prev.filter((l) => l.slug !== slug));
  }, []);
  const setQty = useCallback((slug: string, qty: number) => {
    const q = Math.floor(Number(qty));
    if (!Number.isFinite(q)) return;
    setItems((prev) =>
      prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(Math.max(q, 1), MAX_QTY) } : l)),
    );
  }, []);
  const clearBag = useCallback(() => setItems([]), []);

  const bagCount = useMemo(() => items.reduce((n, l) => n + l.qty, 0), [items]);
  const bagTotal = useMemo(() => {
    const priceOf = new Map(products.map((p) => [p.slug, effectivePrice(p)]));
    return items.reduce((n, l) => n + (priceOf.get(l.slug) ?? 0) * l.qty, 0);
  }, [items]);

  const openProduct = useCallback((slug: string) => {
    window.location.hash = `/product/${slug}`;
    setActiveSlug(slug);
    setSearchOpen(false);
    setMenuOpen(false);
  }, []);
  const closeProduct = useCallback(() => {
    if (window.location.hash.startsWith("#/product/")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setActiveSlug(null);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      searchOpen,
      setSearchOpen,
      menuOpen,
      setMenuOpen,
      activeSlug,
      openProduct,
      closeProduct,
      toast,
      showToast,
      items,
      addToBag,
      removeFromBag,
      setQty,
      clearBag,
      bagOpen,
      setBagOpen,
      bagCount,
      bagTotal,
    }),
    [searchOpen, menuOpen, activeSlug, openProduct, closeProduct, toast, showToast, items, addToBag, removeFromBag, setQty, clearBag, bagOpen, bagCount, bagTotal],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: "smooth" });
}
