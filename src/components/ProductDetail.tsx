"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { bySlug, collections, discountPct, products, type Product } from "@/data/products";
import { useStore } from "@/components/store";
import { cn } from "@/utils/cn";
import { Button, Icon, LUX, Price } from "@/components/ui";

type Tone = "him" | "her" | "house";
const toneOf = (p: Product): Tone => (collections.her.includes(p) ? "her" : collections.him.includes(p) ? "him" : "house");

const T: Record<Tone, { bg: string; fg: string; sub: string; accent: string; rule: string; plate: string; btn: "gold" | "rose" | "ink"; frame: string }> = {
  him: { bg: "bg-him-bg", fg: "text-cream", sub: "text-cream/60", accent: "text-gold", rule: "border-gold/20", plate: "bg-[#efe9dc]", btn: "gold", frame: "" },
  her: { bg: "bg-her-bg", fg: "text-her-ink", sub: "text-her-ink/60", accent: "text-her-rose", rule: "border-her-rose/25", plate: "bg-[#f8efe9]", btn: "rose", frame: "arch" },
  house: { bg: "bg-cream", fg: "text-ink", sub: "text-ink/60", accent: "text-gold-3", rule: "border-ink/10", plate: "bg-[#efe9dc]", btn: "ink", frame: "" },
};

function Pyramid({ notes, tone }: { notes: NonNullable<Product["notes"]>; tone: Tone }) {
  const t = T[tone];
  const tiers = [
    { k: "Top", v: notes.top, w: "w-[58%]" },
    { k: "Heart", v: notes.heart, w: "w-[78%]" },
    { k: "Base", v: notes.base, w: "w-full" },
  ];
  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      {tiers.map((x, i) => (
        <motion.div
          key={x.k}
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.25 + i * 0.12, duration: 0.9, ease: LUX }}
          className={cn("flex items-center justify-between border px-4 py-3", x.w, t.rule)}
        >
          <span className={cn("eyebrow text-[9px]", t.accent)}>{x.k}</span>
          <span className={cn("ml-4 text-right font-sans text-[13px] font-light", t.fg)}>{x.v}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { activeSlug, closeProduct, openProduct } = useStore();
  const product = activeSlug ? bySlug(activeSlug) : null;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && closeProduct();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [closeProduct]);

  const related = useMemo(() => {
    if (!product) return [];
    const tone = toneOf(product);
    const pool = tone === "her" ? collections.her : tone === "him" ? collections.him : collections.best;
    const r = pool.filter((p) => p.slug !== product.slug);
    return (r.length >= 3 ? r : products.filter((p) => p.slug !== product.slug)).slice(0, 3);
  }, [product]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div key={product.slug} className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={closeProduct} />
          <Panel product={product} close={closeProduct} related={related} open={openProduct} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Panel({
  product,
  close,
  related,
  open,
}: {
  product: Product;
  close: () => void;
  related: Product[];
  open: (s: string) => void;
}) {
  const tone = toneOf(product);
  const t = T[tone];
  const pct = discountPct(product);
  return (
    <motion.div
      initial={{ y: "6%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "4%", opacity: 0 }}
      transition={{ duration: 0.8, ease: LUX }}
      className={cn("absolute inset-x-0 bottom-0 top-6 mx-auto flex max-w-[1400px] flex-col overflow-hidden md:inset-x-6 md:top-10 md:flex-row lg:inset-x-16", t.bg, t.fg)}
      role="dialog"
      aria-modal
      aria-label={product.name}
    >
      <button onClick={close} className={cn("absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur", t.rule, tone === "him" ? "bg-ink/40" : "bg-white/50")} aria-label="Close">
        <Icon.Close className="h-5 w-5" />
      </button>

      {/* Image */}
      <div className={cn("relative shrink-0 md:w-[46%]", tone === "him" ? "bg-ink-2" : tone === "her" ? "bg-her-2" : "bg-cream-2")}>
        <div className="flex h-[42vh] items-center justify-center p-6 md:h-full md:p-12">
          <motion.div layoutId={`img-${product.slug}`} className={cn("relative h-full w-full max-w-[460px] overflow-hidden", t.plate, t.frame, tone === "her" ? "aspect-[3/4]" : "")}>
            <img src={product.image} alt={product.name} className="h-full w-full object-cover plate-blend" />
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.08),transparent_60%)]" />
          </motion.div>
        </div>
        {product.chapter && <span className={cn("absolute left-6 top-5 font-display text-3xl italic", t.accent)}>Chapter {product.chapter}</span>}
      </div>

      {/* Content */}
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="px-6 pb-16 pt-10 md:px-12 md:pt-16 lg:px-16">
          <div className="flex flex-wrap items-center gap-3">
            {product.inspiredBy && <span className={cn("eyebrow text-[10px]", t.accent)}>Inspired by {product.inspiredBy}</span>}
            {product.isBundle && <span className={cn("eyebrow text-[10px]", t.accent)}>Bundle · Two chapters</span>}
            {pct > 0 && <span className={cn("eyebrow px-2 py-0.5 text-[10px]", tone === "him" ? "bg-gold text-ink" : tone === "her" ? "bg-her-rose text-her-bg" : "bg-ink text-cream")}>−{pct}%</span>}
          </div>
          <h2 className={cn("display mt-4 text-5xl md:text-6xl", tone === "her" && "italic")}>{product.name}</h2>
          <Price product={product} size="lg" tone={tone === "him" ? "light" : "dark"} className="mt-5 font-display" />

          {/* Buy — canonical store checkout */}
          <div className="mt-8">
            <Button variant={t.btn} href={product.url} className="h-12">
              {product.price == null ? "Enquire on the store" : "Buy on the store"} <Icon.Arrow className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Story */}
          <div className={cn("mt-12 border-t pt-8", t.rule)}>
            <p className={cn("eyebrow text-[10px]", t.accent)}>The story</p>
            <p className="mt-4 font-display text-xl font-light italic leading-relaxed md:text-2xl">“{product.story}”</p>
            {product.aura && (
              <p className={cn("mt-6 font-sans text-xs uppercase tracking-[0.2em]", t.accent)}>
                Aura — <span className={t.sub}>{product.aura}</span>
              </p>
            )}
            {product.extra && <p className={cn("mt-3 font-sans text-sm font-light", t.sub)}>{product.extra}</p>}
          </div>

          {/* Notes */}
          {product.notes && (
            <div className={cn("mt-12 border-t pt-8", t.rule)}>
              <p className={cn("eyebrow text-[10px]", t.accent)}>The fragrance profile</p>
              <Pyramid notes={product.notes} tone={tone} />
            </div>
          )}
          {product.keyNotes && (
            <div className={cn("mt-12 border-t pt-8", t.rule)}>
              <p className={cn("eyebrow text-[10px]", t.accent)}>Key notes</p>
              <p className="mt-3 font-display text-3xl font-light">{product.keyNotes}</p>
            </div>
          )}
          {product.bundleOf && (
            <div className={cn("mt-12 border-t pt-8", t.rule)}>
              <p className={cn("eyebrow text-[10px]", t.accent)}>Inside the bundle</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {product.bundleOf.map((b) => (
                  <div key={b.name} className={cn("border p-5", t.rule)}>
                    <p className="font-display text-2xl leading-tight">{b.name}</p>
                    <p className={cn("mt-1 eyebrow text-[9px]", t.accent)}>{b.inspiredBy}</p>
                    <dl className="mt-4 space-y-2 font-sans text-[13px] font-light">
                      {[
                        ["Top", b.top],
                        ["Heart", b.heart],
                        ["Base", b.base],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4">
                          <dt className={t.sub}>{k}</dt>
                          <dd className="text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related */}
          <div className={cn("mt-12 border-t pt-8", t.rule)}>
            <div className="flex items-center justify-between">
              <p className={cn("eyebrow text-[10px]", t.accent)}>Continue reading</p>
              <a href={product.url} target="_blank" rel="noreferrer" className={cn("link-draw eyebrow text-[10px]", t.sub)}>
                View on store
              </a>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {related.map((r) => (
                <button key={r.slug} onClick={() => open(r.slug)} className="group text-left">
                  <div className={cn("aspect-[4/5] overflow-hidden", t.plate, tone === "her" && "arch")}>
                    <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover plate-blend transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" />
                  </div>
                  <p className="mt-2 font-display text-base leading-tight">{r.name}</p>
                  <Price product={r} size="sm" tone={tone === "him" ? "light" : "dark"} className={cn("text-xs", t.sub)} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
