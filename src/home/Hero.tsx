"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { brand, bySlug } from "@/data/products";
import { scrollToId } from "@/components/store";
import { setJourneyProgress } from "@/home/journeyStore";
import ShaderCanvas, { MIST } from "@/components/ShaderCanvas";
import { Button, Eyebrow, Icon, LUX, Price, Rule } from "@/components/ui";

/* Live bottle in the design's hero frame (smart merge). */
const BottleStage = dynamic(() => import("@/home/BottleStage"), { ssr: false });

const featured = bySlug("Liquid-Gold");
const D = 0.9; // wait for the curtain to lift

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // Gentle bottle drift while the hero scrolls away (cap lifts, no hard scene changes).
  useMotionValueEvent(scrollYProgress, "change", (v) => setJourneyProgress(v * 0.35));

  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 700], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const yPlate = useTransform(scrollY, [0, 700], [0, -60]);

  // pointer parallax for the bottle column
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [6, -6]);
  const rotX = useTransform(sy, [-1, 1], [-4, 4]);
  useEffect(() => {
    const on = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [mx, my]);

  return (
    <section ref={heroRef} id="top" data-tone="dark" className="grain relative min-h-[100svh] overflow-hidden bg-ink text-cream">
      {/* backdrop */}
      <img src="/images/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" fetchPriority="high" />
      <ShaderCanvas frag={MIST} className="absolute inset-0 h-full w-full mix-blend-screen opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />

      <div className="relative mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-1 items-center gap-10 px-6 pb-28 pt-32 md:grid-cols-12 md:px-10 md:pb-16">
        {/* Copy */}
        <motion.div style={{ y: yText, opacity }} className="md:col-span-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: LUX, delay: D + 0.2 }}>
            <Eyebrow className="text-gold">
              <Rule /> Maison de parfum · Cairo
            </Eyebrow>
          </motion.div>
          <h1 className="display mt-8 text-[17vw] leading-[0.86] md:text-[7.6rem] lg:text-[8.8rem]">
            {["Seal", "your", "story."].map((w, i) => (
              <span key={w} className="block overflow-hidden">
                <motion.span
                  className={i === 2 ? "block italic text-gold-2" : "block"}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.4, ease: LUX, delay: D + 0.35 + i * 0.12 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: LUX, delay: D + 0.9 }}
            className="mt-8 max-w-md font-sans text-[15px] font-light leading-relaxed text-cream/70"
          >
            A fragrance is the silent language of your story. Each Chapter is crafted to be the sensory backdrop of your most meaningful moments.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: LUX, delay: D + 1.05 }} className="mt-10 flex flex-wrap items-center gap-4">
            <Button variant="gold" onClick={() => scrollToId("best")}>
              Best sellers <Icon.Arrow className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline-light" onClick={() => scrollToId("summer")}>
              Summer collection
            </Button>
          </motion.div>
        </motion.div>

        {/* Featured bottle — live 3D stage, blended into the page */}
        <motion.div style={{ y: yPlate }} className="relative md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, ease: LUX, delay: D + 0.6 }}
            style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1400 }}
            className="relative w-full"
          >
            <div className="relative h-[66vh] min-h-[360px] w-full md:h-[60vh] lg:h-[68vh]">
              <BottleStage />
            </div>

            {/* rotating seal */}
            <div className="pointer-events-none absolute -left-8 top-6 hidden h-28 w-28 md:block">
              <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow text-gold/80">
                <defs>
                  <path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text className="font-sans text-[8.2px] uppercase tracking-[0.32em]" fill="currentColor">
                  <textPath href="#circ">Miskova · Seal your story · Miskova · Chapters ·</textPath>
                </text>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-2xl italic text-gold">M</span>
            </div>

            {/* Featured context caption */}
            <div className="mt-2 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-[10px] text-gold/70">Chapter {featured.chapter}</p>
                <p className="mt-1 font-display text-2xl italic leading-none text-cream">{featured.name}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2.5">
                <Price product={featured} size="sm" className="text-cream" />
                <Button variant="gold" href={featured.url} className="px-5 py-2.5">
                  View on store <Icon.Arrow className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom strip: USPs from the original banner + scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute inset-x-0 bottom-0 border-t border-cream/10 bg-ink/40 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
          <ul className="flex flex-wrap gap-x-8 gap-y-1 eyebrow text-[10px] text-cream/60">
            <li>Free delivery over {brand.freeShippingThreshold} EGP</li>
            <li className="hidden sm:block">Cash on delivery</li>
            <li className="hidden md:block">Easy return</li>
          </ul>
          <button onClick={() => scrollToId("collections")} className="flex items-center gap-3 eyebrow text-[10px] text-cream/60 hover:text-cream">
            Scroll
            <span className="relative h-8 w-px overflow-hidden bg-cream/20">
              <motion.span className="absolute inset-x-0 top-0 h-3 bg-gold" animate={{ y: [-12, 32] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} />
            </span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
