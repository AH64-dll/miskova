"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { collections } from "@/data/products";
import { cn } from "@/utils/cn";
import { Eyebrow, Icon, Reveal, Rule, useDesktop } from "@/components/ui";

const panels = [
  {
    id: "summer",
    label: "Summer",
    sub: "Collection",
    href: "/collections/summer",
    img: "/images/summer-bg.jpg",
    count: collections.summer.length,
    accent: "text-sum-sun",
    tint: "from-sum-deep/70",
    numeral: "I",
  },
  {
    id: "him",
    label: "For Him",
    sub: "Chapters",
    href: "/collections/for-him",
    img: "/images/him-bg.jpg",
    count: collections.him.length,
    accent: "text-gold",
    tint: "from-ink/80",
    numeral: "II",
  },
  {
    id: "her",
    label: "For Her",
    sub: "Chapters",
    href: "/collections/for-her",
    img: "/images/her-bg.jpg",
    count: collections.her.length,
    accent: "text-her-rose",
    tint: "from-her-deep/70",
    numeral: "III",
  },
];

export default function CollectionsSection() {
  const [active, setActive] = useState<number | null>(null);
  const desktop = useDesktop();
  return (
    <section id="collections" data-tone="dark" className="relative bg-ink px-4 pb-24 pt-20 text-cream md:px-10 md:pb-32">
      <Reveal className="mx-auto mb-10 flex max-w-[1600px] items-end justify-between">
        <div>
          <Eyebrow className="text-gold">
            <Rule /> The house in three moods
          </Eyebrow>
          <h2 className="display mt-4 text-4xl md:text-6xl">Choose your chapter</h2>
        </div>
        <p className="hidden max-w-xs font-sans text-sm font-light text-cream/50 md:block">Every chapter belongs to the same house — but each one is written in its own light.</p>
      </Reveal>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:h-[78vh] md:min-h-[540px] md:flex-row" onMouseLeave={() => setActive(null)}>
        {panels.map((p, i) => {
          const isActive = active === i;
          const dim = active !== null && !isActive;
          return (
            <motion.div
              key={p.id}
              onMouseEnter={() => setActive(i)}
              className="group relative h-[62vw] min-h-[260px] overflow-hidden md:h-auto"
              initial={false}
              animate={desktop ? { flex: isActive ? 2.1 : active === null ? 1 : 0.7 } : { flex: "none" }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={p.href} className="absolute inset-0 block text-left" aria-label={`Go to ${p.label}`}>
                <motion.img
                  src={p.img}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  animate={{ scale: isActive ? 1.06 : 1, filter: dim ? "saturate(0.6) brightness(0.7)" : "saturate(1) brightness(1)" }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className={cn("absolute inset-0 bg-gradient-to-t via-transparent to-transparent", p.tint)} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-80" />

                {/* numeral */}
                <span className="absolute left-5 top-5 font-display text-2xl italic text-cream/70 md:left-7 md:top-7">{p.numeral}</span>
                <span className={cn("absolute right-5 top-6 eyebrow text-[10px] md:right-7 md:top-8", p.accent)}>{p.count} chapters</span>

                <div className="absolute inset-x-5 bottom-5 md:inset-x-7 md:bottom-7">
                  <p className={cn("eyebrow text-[10px]", p.accent)}>{p.sub}</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <h3 className="display text-4xl md:text-5xl lg:text-6xl">{p.label}</h3>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cream/40 transition-all duration-700 group-hover:bg-cream group-hover:text-ink">
                      <Icon.Arrow className="h-4 w-4 -rotate-45 transition-transform duration-700 group-hover:rotate-0" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
