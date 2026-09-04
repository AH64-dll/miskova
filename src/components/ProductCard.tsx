"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { discountPct, type Product } from "@/data/products";
import { useStore } from "@/components/store";
import { Icon, LUX, Price } from "@/components/ui";

type Persona = "summer" | "him" | "her" | "archive";

const theme: Record<
  Persona,
  { plate: string; frame: string; name: string; meta: string; tag: string; add: string; price: "light" | "dark"; hoverImg: number }
> = {
  summer: {
    plate: "bg-white",
    frame: "rounded-none shadow-[0_30px_60px_-40px_rgba(12,95,107,0.45)]",
    name: "text-sum-ink",
    meta: "text-sum-deep/70",
    tag: "bg-sum-sun text-sum-ink",
    add: "bg-sum-deep text-white hover:bg-sum-aqua",
    price: "dark",
    hoverImg: 1.06,
  },
  him: {
    plate: "bg-[#efe9dc]",
    frame: "rounded-none ring-1 ring-gold/0 group-hover:ring-gold/60 transition-shadow duration-700",
    name: "text-cream",
    meta: "text-gold/80",
    tag: "bg-gold text-ink",
    add: "bg-gold text-ink hover:bg-gold-2",
    price: "light",
    hoverImg: 1.03,
  },
  her: {
    plate: "bg-[#f8efe9]",
    frame: "arch shadow-[0_40px_70px_-45px_rgba(90,42,53,0.5)]",
    name: "text-her-ink",
    meta: "text-her-rose",
    tag: "bg-her-rose text-her-bg",
    add: "bg-her-deep text-her-bg hover:bg-her-rose",
    price: "dark",
    hoverImg: 1.04,
  },
  archive: {
    plate: "bg-[#efe9dc]",
    frame: "rounded-none",
    name: "text-ink",
    meta: "text-ink/55",
    tag: "bg-ink text-cream",
    add: "bg-ink text-cream hover:bg-ink-3",
    price: "dark",
    hoverImg: 1.04,
  },
};

export default function ProductCard({
  product,
  persona,
  className,
  index,
  aspect = "aspect-[4/5]",
}: {
  product: Product;
  persona: Persona;
  className?: string;
  index?: number;
  aspect?: string;
}) {
  const t = theme[persona];
  const { openProduct } = useStore();
  const pct = discountPct(product);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className={cn("relative w-full overflow-hidden", aspect, t.plate, t.frame, "frame-lift")}>
        <button onClick={() => openProduct(product.slug)} className="absolute inset-0 block h-full w-full text-left focus:outline-none" aria-label={`View ${product.name}`}>
          <motion.img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover plate-blend"
            whileHover={{ scale: t.hoverImg }}
            transition={{ duration: 1.2, ease: LUX }}
          />
          {/* soft vignette to sit the product on the plate */}
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_100%,rgba(0,0,0,0.06),transparent_60%)]" />
        </button>

        {/* tags */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {pct > 0 && <span className={cn("eyebrow px-2 py-1 text-[10px]", t.tag)}>−{pct}%</span>}
          {product.isBundle && (
            <span className={cn("eyebrow px-2 py-1 text-[10px]", persona === "him" ? "bg-cream text-ink" : "bg-white/85 text-ink backdrop-blur")}>
              Duo
            </span>
          )}
        </div>

        {/* chapter numeral */}
        {product.chapter && (
          <span className={cn("pointer-events-none absolute right-3 top-2 font-display text-lg italic text-ink/45", persona === "her" && "right-1/2 translate-x-1/2 top-3")}>
            {product.chapter}
          </span>
        )}

        {/* canonical store CTA */}
        {product.price != null && (
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 py-3 text-[11px] uppercase tracking-[0.28em] opacity-0 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100",
              t.add,
              persona === "her" && "inset-x-6 rounded-full",
            )}
          >
            <Icon.Arrow className="h-3.5 w-3.5" /> View on store
          </a>
        )}
      </div>

      <div className={cn("mt-4 flex items-start justify-between gap-3", persona === "her" && "flex-col items-center text-center")}>
        <div className="min-w-0">
          {index != null && persona === "him" && <p className="eyebrow mb-1 text-gold/60">No. {String(index + 1).padStart(2, "0")}</p>}
          <button onClick={() => openProduct(product.slug)} className={cn("text-left font-display text-[1.45rem] leading-none tracking-tight", t.name, persona === "her" && "italic font-light text-[1.6rem]")}>
            {product.name}
          </button>
          {product.inspiredBy && <p className={cn("mt-1.5 font-sans text-[11px] uppercase tracking-[0.22em]", t.meta)}>Inspired by {product.inspiredBy}</p>}
          {product.isBundle && <p className={cn("mt-1.5 font-sans text-[11px] uppercase tracking-[0.22em]", t.meta)}>Two chapters</p>}
        </div>
        <Price product={product} tone={t.price} size="sm" className={cn("shrink-0 pt-1", t.name)} />
      </div>
    </article>
  );
}
