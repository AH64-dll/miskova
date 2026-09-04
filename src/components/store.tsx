"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products } from "@/data/products";

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

  // Deep link: /#product/<slug> opens the overlay on first paint.
  useEffect(() => {
    setActiveSlug(readHash());
    const onHash = () => setActiveSlug(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // lock scroll when overlays open
  useEffect(() => {
    const lock = searchOpen || menuOpen || !!activeSlug;
    document.documentElement.style.overflow = lock ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [searchOpen, menuOpen, activeSlug]);

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
    }),
    [searchOpen, menuOpen, activeSlug, openProduct, closeProduct, toast, showToast],
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
