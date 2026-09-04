"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { collections } from "@/data/products";
import { useStore } from "@/components/store";
import { cn } from "@/utils/cn";
import ProductCard from "@/components/ProductCard";
import { Button, Eyebrow, Icon, Item, Price, Reveal, Rule, Stagger } from "@/components/ui";

export default function HerSection() {
  const items = collections.her;
  const feature = items[0];
  const { openProduct } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section id="her" data-tone="light" className="relative overflow-hidden bg-her-bg text-her-ink">
      {/* silk backdrop */}
      <img src="/images/her-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.22]" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-b from-her-bg via-her-bg/60 to-her-bg" />
      {/* petals */}
      <span className="pointer-events-none absolute left-[8%] top-[14%] h-40 w-40 animate-drift rounded-full bg-her-rose/10 blur-3xl" />
      <span className="pointer-events-none absolute right-[6%] top-[52%] h-64 w-64 animate-drift rounded-full bg-her-rose/10 blur-3xl [animation-delay:-6s]" />

      <div ref={ref} className="relative mx-auto max-w-[1600px] px-5 pb-28 pt-24 md:px-10 md:pt-32">
        {/* Intro */}
        <Reveal persona="her" className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center text-her-rose">
            <Rule /> Collection · IV <Rule />
          </Eyebrow>
          <h2 className="display mt-6 text-[19vw] leading-[0.82] md:text-[8rem] lg:text-[9.5rem]">
            For <span className="italic text-her-rose">Her</span>
          </h2>
          <p className="mx-auto mt-8 max-w-md font-sans text-sm font-light leading-relaxed text-her-ink/70">
            Hibiscus and jammy rose, strawberry and saffron, caramel and silky vanilla. Chapters of velvet elegance.
          </p>
        </Reveal>

        {/* Feature: arch portrait + story */}
        <div className="mt-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal persona="her" className="lg:col-span-5 lg:col-start-2">
            <button onClick={() => openProduct(feature.slug)} className="group relative mx-auto block w-[78%] max-w-[420px] lg:w-full" aria-label={`View ${feature.name}`}>
              <span className="absolute -inset-3 arch border border-her-rose/30 transition-all duration-1000 group-hover:-inset-5" />
              <div className="relative aspect-[3/4] overflow-hidden arch bg-[#f8efe9] shadow-[0_50px_90px_-50px_rgba(90,42,53,0.55)]">
                <motion.img src={feature.image} alt={feature.name} style={{ y }} loading="lazy" className="h-[112%] w-full -translate-y-[6%] object-cover plate-blend transition-transform duration-[1600ms] ease-out group-hover:scale-105" />
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-her-deep px-4 py-2 eyebrow text-[10px] text-her-bg">Chapter {feature.chapter}</span>
            </button>
          </Reveal>
          <Reveal persona="her" delay={0.1} className="lg:col-span-5">
            <p className="eyebrow text-her-rose">Featured chapter</p>
            <h3 className="display mt-4 text-5xl italic md:text-6xl">{feature.name}</h3>
            {feature.inspiredBy && <p className="mt-2 eyebrow text-[10px] text-her-ink/50">Inspired by {feature.inspiredBy}</p>}
            <p className="mt-6 font-display text-xl font-light italic leading-relaxed text-her-ink/85">“{feature.story}”</p>
            {feature.aura && (
              <p className="mt-5 font-sans text-xs uppercase tracking-[0.2em] text-her-rose">
                Aura — <span className="text-her-ink/70">{feature.aura}</span>
              </p>
            )}
            {feature.notes && (
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-her-rose/25 pt-5">
                {(["top", "heart", "base"] as const).map((k) => (
                  <div key={k}>
                    <dt className="eyebrow text-[9px] text-her-rose/70">{k}</dt>
                    <dd className="mt-1 font-sans text-[13px] font-light text-her-ink/80">{feature.notes![k]}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-8 flex items-center gap-6">
              <Price product={feature} size="lg" tone="dark" className="font-display" />
              <Button variant="rose" href={feature.url} className="rounded-full">
                Buy on the store <Icon.Arrow className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Arched gallery */}
        <Stagger className="mt-28 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 md:gap-x-12">
          {items.slice(1).map((p, i) => (
            <Item key={p.slug} persona="her" className={cn(i % 3 === 1 && "md:-translate-y-10")}>
              <ProductCard product={p} persona="her" aspect="aspect-[3/4]" />
            </Item>
          ))}
          {/* closing card: quote from the house */}
          <Item persona="her" className="col-span-2 flex items-center justify-center py-8 md:col-span-1 md:py-0">
            <div className="max-w-xs text-center">
              <p className="font-display text-2xl font-light italic leading-snug text-her-ink/80">“Seal your Miskova chapter today. Wear your story with confidence.”</p>
              <span className="mx-auto mt-6 block h-px w-12 bg-her-rose/50" />
            </div>
          </Item>
        </Stagger>
      </div>
    </section>
  );
}
