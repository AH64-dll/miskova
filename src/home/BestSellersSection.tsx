"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { collections, discountPct, type Product } from "@/data/products";
import { useStore } from "@/components/store";
import { cn } from "@/utils/cn";
import { Button, Eyebrow, Icon, Price, Reveal, Rule } from "@/components/ui";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function Seal({ className }: { className?: string }) {
  return (
    <span className={cn("relative block h-20 w-20", className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow text-gold">
        <defs>
          <path id="bs" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text className="font-sans text-[9px] uppercase tracking-[0.3em]" fill="currentColor">
          <textPath href="#bs">Best seller · Miskova · Best seller ·</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-5 w-5 text-gold" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 9l-5.2 4.2L17.6 20 12 16.4 6.4 20l1.8-6.8L3 9l6.6-.4z" />
      </svg>
    </span>
  );
}

function BestCard({ product, i }: { product: Product; i: number }) {
  const { openProduct, addToBag, setBagOpen } = useStore();
  const pct = discountPct(product);
  return (
    <article className="group relative flex w-[78vw] shrink-0 flex-col sm:w-[420px] lg:w-[clamp(280px,40vh,440px)]">
      <div className="relative">
        <span className="pointer-events-none absolute -left-4 -top-9 z-10 font-display text-[5.5rem] italic leading-none foil md:-left-6 md:text-[6.5rem]">{ROMAN[i]}</span>
        <button onClick={() => openProduct(product.slug)} className="relative block aspect-[3/4] w-full overflow-hidden bg-[#efe9dc] text-left" aria-label={`View ${product.name}`}>
          <span className="pointer-events-none absolute inset-3 z-10 border border-gold/0 transition-all duration-1000 group-hover:inset-4 group-hover:border-gold/60" />
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover plate-blend transition-transform duration-[1500ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.08),transparent_60%)]" />
          <Seal className="absolute right-4 top-4 z-10" />
          {pct > 0 && <span className="absolute bottom-4 left-4 z-10 eyebrow bg-ink px-2 py-1 text-[10px] text-gold">Save {pct}%</span>}
        </button>
      </div>
      <div className="mt-6 flex items-start justify-between gap-4 border-t border-gold/20 pt-5">
        <div>
          <button onClick={() => openProduct(product.slug)} className="display text-left text-3xl md:text-4xl">
            {product.name}
          </button>
          <p className="mt-2 eyebrow text-[10px] text-gold/70">{product.inspiredBy ? `Inspired by ${product.inspiredBy}` : "Two chapters · Duo"}</p>
        </div>
        <Price product={product} className="shrink-0 pt-1 text-cream" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          variant="gold"
          className="px-6 py-3"
          dataAdd={product.slug}
          onClick={() => {
            addToBag(product.slug);
            setBagOpen(true);
          }}
        >
          Add to bag <Icon.Bag className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost-light" onClick={() => openProduct(product.slug)}>
          Read the chapter <Icon.Arrow className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
function BestIntro() {
  return (
    <div className="flex w-[82vw] shrink-0 flex-col justify-between sm:w-[400px] lg:w-[460px] lg:pr-16">
      <div>
        <Eyebrow className="text-gold">
          <Rule /> Collection · II
        </Eyebrow>
        <h2 className="display mt-6 text-6xl md:text-7xl lg:text-[6rem]">
          Best <span className="italic text-gold-2">Sellers</span>
        </h2>
        <p className="mt-8 max-w-xs font-sans text-sm font-light leading-relaxed text-cream/60">
          The most sought-after chapters of the house, presented in order. Each one sealed with the Miskova mark.
        </p>
      </div>
      <div className="mt-10 hidden items-center gap-4 lg:flex">
        <span className="eyebrow text-[10px] text-cream/50">Scroll to browse</span>
        <span className="h-px w-16 bg-cream/20" />
        <Icon.Arrow className="h-4 w-4 text-gold" />
      </div>
    </div>
  );
}

function DesktopPinnedBest({ items }: { items: Product[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      setDist(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    // Re-measure once webfonts / images settle so the end position stays exact.
    const t1 = window.setTimeout(measure, 300);
    const t2 = window.setTimeout(measure, 1200);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [items.length]);

  // This component mounts only when `desktop` is already true, so the target
  // ref is attached on first commit and useScroll measures a live element.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const xRaw = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const x = useSpring(xRaw, { stiffness: 90, damping: 26, mass: 0.4 });
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={sectionRef} style={{ height: `${Math.max(220, items.length * 62)}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex items-stretch gap-14 px-10 pt-10 will-change-transform">
          <BestIntro />
          {items.map((p, i) => (
            <BestCard key={p.slug} product={p} i={i} />
          ))}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </motion.div>
        {/* progress */}
        <div className="absolute bottom-10 left-10 right-10 h-px bg-cream/10">
          <motion.div style={{ width: progress }} className="h-full bg-gold" />
        </div>
      </div>
    </div>
  );
}

function MobileBestRow({ items }: { items: Product[] }) {
  return (
    <div className="py-24">
      <Reveal className="px-5">
        <BestIntro />
      </Reveal>
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-8 overflow-x-auto px-5 pt-10 pb-4">
        {items.map((p, i) => (
          <div key={p.slug} className="snap-start">
            <BestCard product={p} i={i} />
          </div>
        ))}
      </div>
    </div>
  );
}


export default function BestSellersSection() {
  const items = collections.best;
  // SSR-safe initial: server and first client render agree (mobile branch), then
  // the effect below flips to desktop. DesktopPinnedBest mounts only after the
  // flip, so its scroll-target ref is attached on its first commit.
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const upd = () => setDesktop(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  return (
    <section id="best" data-tone="dark" className="grain relative bg-ink text-cream">
      {/* Velvet backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_20%,rgba(201,169,97,0.12),transparent_60%),radial-gradient(50%_50%_at_90%_90%,rgba(201,169,97,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      {desktop ? (
        <DesktopPinnedBest key="pinned" items={items} />
      ) : (
        <MobileBestRow key="row" items={items} />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </section>
  );
}
