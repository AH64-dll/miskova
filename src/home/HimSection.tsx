"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { collections } from "@/data/products";
import { useStore } from "@/components/store";
import ProductCard from "@/components/ProductCard";
import { Button, Eyebrow, Icon, Item, Price, Reveal, Rule, Stagger } from "@/components/ui";

export default function HimSection() {
  const [featured, ...rest] = collections.him;
  const { openProduct, addToBag, setBagOpen } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="him" data-tone="dark" className="grain relative bg-him-bg text-cream">
      {/* Intro: split editorial */}
      <div ref={ref} className="relative grid min-h-[90vh] grid-cols-1 lg:grid-cols-12">
        <div className="relative order-2 overflow-hidden lg:order-1 lg:col-span-6">
          <motion.img src="/images/him-bg.jpg" alt="" style={{ y }} className="absolute inset-0 h-[120%] w-full -translate-y-[10%] object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-him-bg/60 lg:bg-gradient-to-l" />
          <div className="relative flex h-[60vw] items-end p-6 lg:h-full lg:p-12">
            <p className="writing-v hidden rotate-180 eyebrow text-[10px] text-gold/70 lg:block">Collection · III — Chapters for him</p>
          </div>
        </div>
        <div className="order-1 flex flex-col justify-center px-6 py-20 lg:order-2 lg:col-span-6 lg:px-16 lg:py-28">
          <Reveal persona="him">
            <Eyebrow className="text-gold">
              <Rule /> Collection · III
            </Eyebrow>
            <h2 className="display mt-6 text-[19vw] leading-[0.82] md:text-[8rem] lg:text-[9.5rem]">
              For <span className="italic text-gold-2">Him</span>
            </h2>
            <p className="mt-8 max-w-sm font-sans text-sm font-light leading-relaxed text-cream/60">
              Tobacco leaf, amber, cognac, oud and leather. Chapters of warm authority and quiet confidence.
            </p>
          </Reveal>
          <Reveal persona="him" delay={0.15} className="mt-10 grid grid-cols-3 gap-6 border-t border-gold/20 pt-6 max-w-md">
            {[
              ["Vintage Lounge", "Chapter I"],
              ["Heir", "Chapter II"],
              ["Liquid Gold", "Chapter III"],
            ].map(([n, c]) => (
              <div key={n}>
                <p className="eyebrow text-[9px] text-gold/60">{c}</p>
                <p className="mt-1 font-display text-lg leading-tight">{n}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>

      {/* Featured chapter */}
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
        <Reveal persona="him" className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-7">
            <span className="pointer-events-none absolute -left-2 -top-8 font-display text-[7rem] italic leading-none text-gold/15 md:-left-6 md:text-[11rem]">{featured.chapter}</span>
            <button onClick={() => openProduct(featured.slug)} className="group relative block aspect-[16/11] w-full overflow-hidden bg-[#efe9dc]" aria-label={`View ${featured.name}`}>
              <img src={featured.image} alt={featured.name} loading="lazy" className="h-full w-full object-cover plate-blend transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.08),transparent_60%)]" />
              <span className="absolute inset-4 border border-gold/0 transition-all duration-1000 group-hover:border-gold/50" />
            </button>
          </div>
          <div className="lg:col-span-5">
            <p className="eyebrow text-gold/70">Featured chapter · {featured.chapter}</p>
            <h3 className="display mt-4 text-5xl md:text-6xl">{featured.name}</h3>
            {featured.inspiredBy && <p className="mt-2 eyebrow text-[10px] text-cream/50">Inspired by {featured.inspiredBy}</p>}
            <p className="mt-6 font-display text-xl font-light italic leading-relaxed text-cream/80">“{featured.story}”</p>
            {featured.aura && (
              <p className="mt-5 font-sans text-xs tracking-[0.2em] uppercase text-gold">
                Aura — <span className="text-cream/80">{featured.aura}</span>
              </p>
            )}
            {featured.notes && (
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-gold/20 pt-5 text-sm">
                {(["top", "heart", "base"] as const).map((k) => (
                  <div key={k}>
                    <dt className="eyebrow text-[9px] text-gold/60">{k}</dt>
                    <dd className="mt-1 font-sans text-[13px] font-light text-cream/80">{featured.notes![k]}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-8 flex items-center gap-6">
              <Price product={featured} size="lg" className="font-display" />
              <Button
                variant="gold"
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
        </Reveal>

        {/* Grid */}
        <div className="mt-28 flex items-end justify-between border-b border-gold/20 pb-4">
          <p className="eyebrow text-gold/70">The remaining chapters</p>
          <p className="eyebrow text-[10px] text-cream/40">{rest.length} fragrances</p>
        </div>
        <Stagger className="mt-10 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-4 md:gap-x-8">
          {rest.map((p, i) => (
            <Item key={p.slug} persona="him">
              <ProductCard product={p} persona="him" index={i + 1} />
            </Item>
          ))}
        </Stagger>

        <Reveal persona="him" className="mt-16 flex justify-center">
          <Link
            href="/collections/all"
            className="group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden px-7 py-3.5 font-sans text-[11px] uppercase tracking-[0.28em] border border-cream/30 text-cream hover:border-cream hover:bg-cream hover:text-ink transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          >
            <span className="relative z-10">View all chapters <Icon.Arrow className="h-3.5 w-3.5 inline-block align-[-2px]" /></span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
