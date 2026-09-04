"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { scrollToId, useStore } from "@/components/store";
import { Icon, LUX } from "@/components/ui";

export default function MobileTabBar() {
  const { setSearchOpen, setMenuOpen, toast } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const goCollections = () => {
    if (pathname === "/") scrollToId("collections");
    else router.push("/#collections");
  };

  const items = [
    { l: "Home", I: Icon.Home, on: () => (pathname === "/" ? window.scrollTo({ top: 0, behavior: "smooth" }) : router.push("/")) },
    { l: "Collections", I: Icon.Grid, on: goCollections },
    { l: "Search", I: Icon.Search, on: () => setSearchOpen(true) },
    { l: "Menu", I: Icon.Menu, on: () => setMenuOpen(true) },
  ];
  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: LUX }}
            className="pointer-events-none fixed inset-x-0 bottom-24 z-[65] flex justify-center px-4 md:bottom-8"
          >
            <div className="flex items-center gap-3 bg-ink px-5 py-3 text-cream shadow-2xl ring-1 ring-gold/30">
              <Icon.Check className="h-4 w-4 text-gold" />
              <span className="font-sans text-xs tracking-wide">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-4 bottom-4 z-[60] md:hidden" aria-label="Quick navigation" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around rounded-full border border-cream/10 bg-ink/85 px-2 py-2 text-cream shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {items.map(({ l, I, on }) => (
            <button key={l} onClick={on} className="relative flex flex-col items-center gap-1 px-3 py-1.5" aria-label={l}>
              <I className="h-5 w-5" />
              <span className="eyebrow text-[8px] tracking-[0.2em] text-cream/60">{l}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
