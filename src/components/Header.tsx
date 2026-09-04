"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { brand, products, type Product } from "@/data/products";
import { scrollToId, useStore } from "@/components/store";
import { cn } from "@/utils/cn";
import { Icon, LUX, Monogram, Price } from "@/components/ui";

export const NAV = [
  { id: "summer", label: "Summer", href: "/collections/summer" },
  { id: "best", label: "Best Sellers", href: "/collections/best-sellers" },
  { id: "him", label: "For Him", href: "/collections/for-him" },
  { id: "her", label: "For Her", href: "/collections/for-her" },
  { id: "archive", label: "All Chapters", href: "/collections/all" },
  { id: "story", label: "Our Story", href: "/#story" },
] as const;

/* On the homepage, in-page sections scroll instead of navigating. */
export function NavLink({ n, className, onNavigate }: { n: (typeof NAV)[number]; className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const homeHash = n.href.startsWith("/#") && pathname === "/";
  return (
    <Link
      href={n.href}
      onClick={(e) => {
        onNavigate?.();
        if (homeHash) {
          e.preventDefault();
          scrollToId(n.href.slice(2));
        }
      }}
      className={className}
    >
      {n.label}
    </Link>
  );
}

export function useSectionTone() {
  const [tone, setTone] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setTone(((e.target as HTMLElement).dataset.tone as "dark" | "light") ?? "dark");
        });
      },
      { rootMargin: "-56px 0px -85% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return tone;
}

export default function Header() {
  const { searchOpen, setSearchOpen, menuOpen, setMenuOpen, bagCount, setBagOpen } = useStore();
  const tone = useSectionTone();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hideMarquee, setHideMarquee] = useState(false);

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 24);
      setHideMarquee(window.scrollY > 140);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const dark = tone === "dark";
  const fg = dark ? "text-cream" : "text-ink";
  const bg = scrolled ? (dark ? "bg-ink/70 backdrop-blur-xl border-cream/10" : "bg-cream/75 backdrop-blur-xl border-ink/10") : "border-transparent";

  return (
    <>
      {/* Announcement */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 overflow-hidden bg-ink text-gold transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
          hideMarquee ? "-translate-y-full" : "translate-y-0",
        )}
        aria-label={brand.shippingNote}
      >
        <div className="flex h-8 items-center whitespace-nowrap">
          <div className="flex animate-marquee gap-16 pr-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="eyebrow flex items-center gap-16 text-[10px] tracking-[0.4em]">
                {brand.shippingNote.toUpperCase()}
                <span className="h-1 w-1 rounded-full bg-gold/60" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        className={cn(
          "fixed inset-x-0 z-40 border-b transition-[background-color,color,border-color,top] duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
          hideMarquee ? "top-0" : "top-8",
          bg,
          fg,
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-10">
          {/* Left nav (desktop) */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.slice(0, 4).map((n) => (
              <NavLink key={n.id} n={n} className="link-draw eyebrow text-[10.5px] opacity-80 transition-opacity hover:opacity-100" />
            ))}
          </nav>
          <button onClick={() => setMenuOpen(true)} className="p-2 lg:hidden" aria-label="Open menu">
            <Icon.Menu className="h-5 w-5" />
          </button>

          {/* Wordmark */}
          <button
            onClick={() => (pathname === "/" ? window.scrollTo({ top: 0, behavior: "smooth" }) : router.push("/"))}
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 sm:gap-3"
            aria-label="Miskova home"
          >
            <Monogram className={cn("h-7 w-7 sm:h-8 sm:w-8", dark ? "text-gold" : "text-ink")} />
            {/* Compact phones: the centered lockup must clear the search/bag
                controls (they start ~x224 at 320) — shrink type below sm. */}
            <span className="font-display text-[0.95rem] font-medium tracking-[0.16em] leading-none sm:text-[1.3rem] sm:tracking-[0.28em] md:text-[1.55rem] md:tracking-[0.32em]">
              MISKOVA
            </span>
          </button>

          {/* Right */}
          <nav className="flex items-center gap-1 md:gap-3" aria-label="Secondary">
            {NAV.slice(4).map((n) => (
              <NavLink key={n.id} n={n} className="link-draw eyebrow mr-4 hidden text-[10.5px] opacity-80 transition-opacity hover:opacity-100 lg:inline-block" />
            ))}
            <button onClick={() => setSearchOpen(true)} className="p-2 transition-opacity hover:opacity-70" aria-label="Search">
              <Icon.Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setBagOpen(true)}
              className="relative p-2 transition-opacity hover:opacity-70"
              aria-label={`Open bag, ${bagCount} items`}
              data-cart-open
            >
              <Icon.Bag className="h-5 w-5" />
              {bagCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-sans text-[9px] font-medium text-ink">
                  {bagCount > 99 ? "99+" : bagCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <AnimatePresence>{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  );
}

/* ---------- Search ---------- */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const { openProduct } = useStore();
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const results = useMemo<Product[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 8);
    return products.filter((p) => {
      const hay = [p.name, p.inspiredBy, p.aura, p.keyNotes, p.notes?.top, p.notes?.heart, p.notes?.base, p.chapter && `chapter ${p.chapter}`]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [q]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col bg-ink/95 text-cream backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-14">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-gold">Search the house</p>
          <button onClick={onClose} className="p-2" aria-label="Close search">
            <Icon.Close className="h-6 w-6" />
          </button>
        </div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: LUX, delay: 0.1 }} className="relative mt-6 border-b border-cream/20 pb-4">
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A note, a name, a chapter…"
            className="w-full bg-transparent font-display text-4xl font-light italic placeholder:text-cream/30 focus:outline-none md:text-6xl"
          />
          <Icon.Search className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 opacity-40" />
        </motion.div>
        <p className="mt-3 font-sans text-xs tracking-wider text-cream/40">
          {q ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Suggested"}
        </p>
      </div>
      <div className="no-scrollbar mx-auto mt-8 w-full max-w-5xl flex-1 overflow-y-auto px-6 pb-20">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {results.map((p, i) => (
            <motion.li key={p.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.6, ease: LUX }}>
              <button onClick={() => openProduct(p.slug)} className="group block w-full text-left">
                <div className="aspect-[4/5] overflow-hidden bg-[#efe9dc]">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover plate-blend transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" loading="lazy" />
                </div>
                <p className="mt-3 font-display text-xl leading-none">{p.name}</p>
                {p.inspiredBy && <p className="mt-1 eyebrow text-[10px] text-gold/70">{p.inspiredBy}</p>}
                <Price product={p} size="sm" className="mt-1 text-cream/80" />
              </button>
            </motion.li>
          ))}
        </ul>
        {results.length === 0 && <p className="py-20 text-center font-display text-2xl italic text-cream/50">Nothing in the archive matches “{q}”.</p>}
      </div>
    </motion.div>
  );
}

/* ---------- Mobile menu ---------- */
function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[70] flex flex-col bg-ink text-cream" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.7, ease: LUX }}>
      <div className="flex items-center justify-between px-6 pt-8">
        <span className="font-display text-xl tracking-[0.3em]">MISKOVA</span>
        <button onClick={onClose} aria-label="Close menu" className="p-2">
          <Icon.Close className="h-6 w-6" />
        </button>
      </div>
      <nav className="mt-14 flex flex-1 flex-col gap-2 px-6">
        {NAV.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease: LUX }}
            className="flex items-baseline justify-between border-b border-cream/10 py-5"
          >
            <NavLink n={n} onNavigate={onClose} className="font-display text-4xl font-light" />
            <span className="eyebrow text-gold/60">{String(i + 1).padStart(2, "0")}</span>
          </motion.div>
        ))}
      </nav>
      <div className="px-6 pb-10">
        <p className="eyebrow text-gold">{brand.address}</p>
        <a href={`mailto:${brand.email}`} className="mt-2 block font-sans text-sm text-cream/70">
          {brand.email}
        </a>
      </div>
    </motion.div>
  );
}
