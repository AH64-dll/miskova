"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/ui";

/* Curtain preloader — brief, brand-led. Plays once per browser session. */
export default function Curtain() {
  const [done, setDone] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("miskova-curtain-shown") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDone(true);
        return;
      }
      sessionStorage.setItem("miskova-curtain-shown", "1");
    } catch {
      return;
    }
    setDone(false);
    const t = setTimeout(() => setDone(true), 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-ink text-cream"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center gap-5">
            <Monogram className="h-10 w-10 text-gold" />
            <span className="font-display text-2xl tracking-[0.4em]">MISKOVA</span>
            <span className="relative h-px w-24 overflow-hidden bg-cream/15">
              <motion.span className="absolute inset-y-0 left-0 bg-gold" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.3, ease: "easeInOut" }} />
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
