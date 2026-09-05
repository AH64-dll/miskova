"use client";

import { BASE_PATH } from "@/utils/basePath";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { collections } from "@/data/products";
import { cn } from "@/utils/cn";
import ProductCard from "@/components/ProductCard";
import ShaderCanvas, { CAUSTICS } from "@/components/ShaderCanvas";
import { Eyebrow, Item, Reveal, Rule, Stagger } from "@/components/ui";

export default function SummerSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const yTitle = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="summer" data-tone="light" className="relative overflow-hidden bg-sum-bg text-sum-ink">
      {/* live water */}
      <div className="absolute inset-x-0 top-0 h-[120vh] overflow-hidden">
        <ShaderCanvas frag={CAUSTICS} className="h-full w-full" speed={0.9} quality={0.45} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-sum-bg" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 pb-28 pt-24 md:px-10 md:pt-32">
        {/* Banner */}
        <div ref={ref} className="relative">
          <Reveal persona="summer" className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow className="text-sum-deep">
                <Rule /> Collection · I
              </Eyebrow>
              <motion.h2 style={{ y: yTitle }} className="display mt-4 text-[15vw] leading-[0.82] md:text-[8rem] lg:text-[10rem]">
                Summer
                <span className="ml-[0.15em] italic text-sum-aqua">Sol</span>
              </motion.h2>
            </div>
            <p className="max-w-xs font-sans text-sm font-light leading-relaxed text-sum-deep/80 md:pb-6">
              Citrus surges, cooling herbs, salted ocean air. A perfect signature for hot days and summery nights.
            </p>
          </Reveal>

          <Reveal persona="summer" delay={0.1} className="relative mt-10 md:mt-6">
            <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[21/9]">
              <motion.img src={`${BASE_PATH}/images/summer-bg.jpg`} alt="" style={{ y: yImg }} className="absolute inset-0 h-[116%] w-full -translate-y-[8%] object-cover" loading="lazy" />
              {/* sun */}
              <span className="absolute right-8 top-8 h-16 w-16 rounded-full bg-sum-sun/90 blur-[1px] md:h-24 md:w-24" />
              <span className="absolute right-8 top-8 h-16 w-16 animate-ripple rounded-full border border-sum-sun md:h-24 md:w-24" />
              <span className="absolute left-6 bottom-6 eyebrow text-[10px] text-white/90 mix-blend-difference">Hot days · Summery nights</span>
            </div>
            {/* overlapping marker */}
            <div className="absolute -bottom-6 left-6 bg-sum-ink px-5 py-3 text-sum-bg md:left-10">
              <span className="eyebrow text-[10px]">{collections.summer.length} chapters</span>
            </div>
          </Reveal>
        </div>

        {/* Products — staggered rhythm like light on water */}
        <Stagger className="mt-24 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-x-10 md:gap-y-20">
          {collections.summer.map((p, i) => (
            <Item key={p.slug} persona="summer" className={cn(i % 3 === 1 && "md:translate-y-16", i % 3 === 2 && "md:translate-y-6")}>
              <ProductCard product={p} persona="summer" />
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
