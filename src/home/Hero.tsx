 "use client";

 import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
 import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
 import type { RefObject } from "react";
 import { brand, bySlug } from "@/data/products";
 import { scrollToId, useStore } from "@/components/store";
 import { setJourneyProgress } from "@/home/journeyStore";
 import ShaderCanvas, { MIST } from "@/components/ShaderCanvas";
 import { Button, Eyebrow, Icon, LUX, Price, Rule } from "@/components/ui";

 /* Live bottle in the design's hero frame (smart merge).
    The R3F canvas covers the whole hero and renders ABOVE the copy (z-[3]);
    only the LIFT THE CAP / PRESS THE ATOMIZER pills sit above the canvas. */
 const BottleStage = dynamic(() => import("@/home/BottleStage"), { ssr: false });

 const featured = bySlug("Liquid-Gold");
 const D = 0.9; // wait for the curtain to lift

export default function Hero() {
  const { addToBag, setBagOpen } = useStore();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // Gentle bottle drift while the hero scrolls away (cap lifts, no hard scene changes).
  useMotionValueEvent(scrollYProgress, "change", (v) => setJourneyProgress(v * 0.35));

  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 700], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  // Mirrors BottleStage's webglAllowed check: when the live stage cannot run
  // (no WebGL, reduced motion, save-data) Hero renders a framed product plate
  // instead of the canvas and skips the 3D mount entirely, so the journey
  // pills never appear over a dead stage. Viewport width is deliberately NOT
  // a trigger — narrow phones still get the live bottle.
  const [fallback, setFallback] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  useEffect(() => {
    let noWebGL = false;
    try {
      const canvas = document.createElement("canvas");
      noWebGL = !canvas.getContext("webgl2") && !canvas.getContext("webgl");
    } catch {
      noWebGL = true;
    }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
          ?.saveData === true;
      setFallback(noWebGL || motionQuery.matches || saveData);
    };
    sync();
    motionQuery.addEventListener("change", sync);
    return () => motionQuery.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    // Mount the 3D stage only after the capability check settles, so a phone
    // without WebGL never spins up a doomed canvas context.
    if (!fallback) setStageReady(true);
  }, [fallback]);

   // (Pointer parallax for the bottle lives in the 3D scene via journeyStore;
   // no DOM tilt wrapper remains — the canvas is full-bleed.)

   return (
     <section ref={heroRef} id="top" data-tone="dark" className="grain relative min-h-[100svh] overflow-hidden bg-ink text-cream">
       {/* [0] backdrop texture + gradient */}
       <img src="/images/hero-bg.jpg" alt="" className="absolute inset-0 z-0 h-full w-full object-cover opacity-80" fetchPriority="high" />
       {/* [1] mist shader */}
       <ShaderCanvas frag={MIST} className="absolute inset-0 z-[1] h-full w-full mix-blend-screen opacity-90" />
       <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-ink via-ink/20 to-ink/30" />

       {/* [2] copy + caption + monogram — below the 3D canvas. The grid layer
           itself is click-through (canvas pills stay clickable); only
           links/buttons inside re-enable pointer events. */}
       <div className="pointer-events-none relative z-[2] mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-1 items-center gap-10 px-6 pb-28 pt-32 md:grid-cols-12 md:px-10 md:pb-16 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
         {/* Copy */}
         <motion.div style={{ y: yText, opacity }} className="md:col-span-6">
          {/* Brand lockup: the rotating seal sits left of the eyebrow, vertically
              centered on it. The eyebrow is indented (md:pl-24) so the seal
              occupies the left margin without growing the row height or
              touching the headline below. Never rendered on phone. */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: LUX, delay: D + 0.2 }} className="relative md:pl-24">
            <div className="pointer-events-none absolute left-0 top-1/2 hidden h-20 w-20 -translate-y-[60%] md:block" data-hero-seal>
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

         {/* Right column: reserves the bottle's screen space. The live 3D canvas
             is full-bleed (mounted below); the monogram + featured caption stay
             in normal flow at layer [2], under the canvas. */}
         <div className="relative md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
           {/* Featured context caption — right-aligned clear of the seal */}
           <div className="relative z-10 ml-auto mt-2 flex max-w-[300px] items-end justify-between gap-4">
             <div className="min-w-0">
               <p className="eyebrow text-[10px] text-gold/70">Chapter {featured.chapter}</p>
               <p className="mt-1 font-display text-2xl italic leading-none text-cream">{featured.name}</p>
             </div>
             <div className="flex shrink-0 flex-col items-end gap-2.5">
               <Price product={featured} size="sm" className="text-cream" />
               <Button
                 variant="gold"
                 className="px-5 py-2.5"
                 dataAdd={featured.slug}
                 onClick={() => {
                   addToBag(featured.slug);
                   setBagOpen(true);
                 }}
               >
                 Add to bag <Icon.Bag className="h-3.5 w-3.5" />
               </Button>
             </div>
           </div>
         </div>
      </div>

      {/* [3] full-bleed bottle canvas (own stacking layer, z-[3]); only mounted
          once the capability check passes — the fallback plate replaces it. */}
      {stageReady && !fallback && <BottleStage eventSourceRef={heroRef} />}
      {/* WebGL-fail / reduced-motion fallback — ONLY in the fallback: a framed
          plate with the featured product photo floats where the 3D bottle
          would (phone: top-right clear of the headline and paragraph; desktop:
          right-of-center, clear of both the copy column and the caption). No
          seal at phone widths, and the whole stage stays unmounted so the
          LIFT THE CAP / PRESS THE ATOMIZER pills never appear. */}
      {fallback ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: LUX, delay: D }}
          className="pointer-events-none absolute right-4 top-[20%] z-[2] h-[24svh] max-w-[176px] aspect-[4/5] md:left-[max(44%,32rem)] md:right-auto md:top-[calc(53%-26svh)] md:h-[52svh] md:max-w-[26rem]"
        >
          <div className="grain relative h-full w-full overflow-hidden rounded-sm bg-[#efe9dc] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.85)] ring-1 ring-gold/15">
            <img src={featured.image} alt={featured.name} className="absolute inset-0 h-full w-full object-cover plate-blend" />
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.10),transparent_60%)]" />
          </div>
        </motion.div>
      ) : null}

       {/* Bottom strip: USPs from the original banner + scroll cue */}
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.6, duration: 1 }}
         className="absolute inset-x-0 bottom-0 z-[5] border-t border-cream/10 bg-ink/40 backdrop-blur-sm"
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
