"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { collections, products, type Product } from "@/data/products";
import { cn } from "@/utils/cn";
import ProductCard from "@/components/ProductCard";
import { Eyebrow, LUX, Reveal, Rule } from "@/components/ui";

type Filter = "all" | "him" | "her" | "summer" | "best" | "duo";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "summer", label: "Summer" },
  { id: "best", label: "Best sellers" },
  { id: "him", label: "For him" },
  { id: "her", label: "For her" },
  { id: "duo", label: "Bundles" },
];

const ROMAN_VAL: Record<string, number> = { I: 1, V: 5, X: 10 };
const romanToInt = (r?: string) => (r ? r.split("").reduce((acc, c, i, a) => (ROMAN_VAL[c] < (ROMAN_VAL[a[i + 1]] ?? 0) ? acc - ROMAN_VAL[c] : acc + ROMAN_VAL[c]), 0) : 99);

export default function ArchiveSection() {
  const [f, setF] = useState<Filter>("all");
  const [sort, setSort] = useState<"chapter" | "low" | "high">("chapter");

  const list = useMemo<Product[]>(() => {
    let l: Product[] =
      f === "all" ? products : f === "duo" ? products.filter((p) => p.isBundle) : collections[f];
    l = [...l];
    if (sort === "chapter") l.sort((a, b) => romanToInt(a.chapter) - romanToInt(b.chapter));
    if (sort === "low") l.sort((a, b) => (a.salePrice ?? a.price ?? 1e9) - (b.salePrice ?? b.price ?? 1e9));
    if (sort === "high") l.sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0));
    return l;
  }, [f, sort]);

  return (
    <section id="archive" data-tone="light" className="relative bg-cream text-ink">
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow className="text-gold-3">
              <Rule /> The archive
            </Eyebrow>
            <h2 className="display mt-4 text-5xl md:text-7xl">
              All <span className="italic">Chapters</span>
            </h2>
          </div>
          <p className="max-w-xs font-sans text-sm font-light leading-relaxed text-ink/60">Every fragrance of the house, in order of its chapter. Filter by mood or price.</p>
        </Reveal>

        {/* Controls */}
        <div className="sticky top-16 z-20 -mx-5 mt-12 border-y border-ink/10 bg-cream/85 px-5 backdrop-blur md:mx-0 md:px-0">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-3">
            <LayoutGroup id="archive-filters">
              <div className="flex items-center gap-1">
                {FILTERS.map((x) => (
                  <button key={x.id} onClick={() => setF(x.id)} className={cn("relative px-3 py-2 eyebrow text-[10px] whitespace-nowrap transition-colors", f === x.id ? "text-ink" : "text-ink/45 hover:text-ink")}>
                    {x.label}
                    {f === x.id && <motion.span layoutId="pill" className="absolute inset-x-3 -bottom-px h-px bg-ink" transition={{ duration: 0.6, ease: LUX }} />}
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <div className="flex shrink-0 items-center gap-2 eyebrow text-[10px] text-ink/45">
              <span className="hidden sm:inline">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="bg-transparent eyebrow text-[10px] text-ink focus:outline-none" aria-label="Sort chapters">
                <option value="chapter">Chapter</option>
                <option value="low">Price ↑</option>
                <option value="high">Price ↓</option>
              </select>
            </div>
          </div>
        </div>

        <motion.div layout className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-8">
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <motion.div
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: LUX }}
              >
                <ProductCard product={p} persona="archive" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <p className="mt-12 text-center eyebrow text-[10px] text-ink/40">{list.length} of {products.length} chapters</p>
      </div>
    </section>
  );
}
