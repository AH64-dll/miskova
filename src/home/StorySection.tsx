"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { brand, products } from "@/data/products";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Eyebrow, Reveal, Rule } from "@/components/ui";

export default function StorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="story" data-tone="dark" className="grain relative bg-ink text-cream">
      <div ref={ref} className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12 lg:gap-20">
        {/* Portrait */}
        <Reveal className="relative lg:col-span-5">
          <div className="relative aspect-[3/4] overflow-hidden">
            <motion.img src="/images/atelier-bg.jpg" alt="" style={{ y }} className="absolute inset-0 h-[124%] w-full -translate-y-[12%] object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            <span className="absolute -inset-3 border border-gold/20" />
          </div>
          <p className="absolute bottom-6 left-6 font-display text-2xl italic text-cream/90">{brand.address}</p>
        </Reveal>

        {/* Text */}
        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal>
            <Eyebrow className="text-gold">
              <Rule /> {brand.story.title}
            </Eyebrow>
            <p className="display mt-8 text-3xl leading-[1.15] md:text-[2.6rem]">{brand.story.intro}</p>
          </Reveal>
          <div className="mt-14 space-y-0 border-t border-cream/10">
            {brand.story.pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08} className="grid grid-cols-12 gap-4 border-b border-cream/10 py-7">
                <span className="col-span-2 font-display text-2xl italic text-gold/70 md:col-span-1">0{i + 1}</span>
                <div className="col-span-10 md:col-span-11">
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  <p className="mt-2 max-w-lg font-sans text-sm font-light leading-relaxed text-cream/60">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Customer reviews — API-backed, restyled to the house language */}
      <ReviewsSection products={products} />
    </section>
  );
}
