"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { discountPct, formatPrice, type Product } from "@/data/products";

export const LUX: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Persona-specific motion languages */
export const revealVariants: Record<"house" | "him" | "her" | "summer", Variants> = {
  house: {
    hidden: { opacity: 0, y: 28 },
    show: (d: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 1.1, ease: LUX, delay: d } }),
  },
  him: {
    hidden: { opacity: 0, y: 40, scale: 0.985 },
    show: (d: number = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 1.3, ease: LUX, delay: d } }),
  },
  her: {
    hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
    show: (d: number = 0) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.2, ease: "easeOut", delay: d } }),
  },
  summer: {
    hidden: { opacity: 0, y: 34, rotate: -0.6 },
    show: (d: number = 0) => ({ opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 70, damping: 16, mass: 0.9, delay: d } }),
  },
};

export function useDesktop(query = "(min-width: 768px)") {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const upd = () => setOn(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, [query]);
  return on;
}

export function Reveal({
  children,
  className,
  persona = "house",
  delay = 0,
  once = true,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  persona?: keyof typeof revealVariants;
  delay?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "article" | "span";
}) {
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      variants={revealVariants[persona]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2, margin: "0px 0px -8% 0px" }}
      custom={delay}
    >
      {children}
    </M>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function Item({ children, className, persona = "house" }: { children: ReactNode; className?: string; persona?: keyof typeof revealVariants }) {
  return (
    <motion.div
      className={className}
      variants={revealVariants[persona]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow flex items-center gap-3", className)}>{children}</p>;
}

export function Rule({ className }: { className?: string }) {
  return <span className={cn("inline-block h-px w-10 bg-current opacity-50", className)} />;
}

export function Price({ product, className, size = "md", tone = "light" }: { product: Product; className?: string; size?: "sm" | "md" | "lg"; tone?: "light" | "dark" }) {
  const sz = { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size];
  if (product.price == null)
    return (
      <span className={cn("font-sans tracking-wide", sz, className, tone === "light" ? "text-cream/70" : "text-ink/60")}>
        Price on request
      </span>
    );
  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans tracking-wide", sz, className)}>
      <span>{formatPrice(product.salePrice ?? product.price)}</span>
      {product.salePrice && (
        <span className={cn("text-[0.78em] line-through", tone === "light" ? "text-cream/40" : "text-ink/40")}>
          {formatPrice(product.price)}
        </span>
      )}
    </span>
  );
}

export function SaleTag({ product, className }: { product: Product; className?: string }) {
  const pct = discountPct(product);
  if (!pct) return null;
  return <span className={cn("eyebrow rounded-none px-2 py-1 text-[10px]", className)}>−{pct}%</span>;
}

export function Button({
  children,
  className,
  variant = "gold",
  onClick,
  href,
  type = "button",
  disabled,
  dataAdd,
  form,
}: {
  children: ReactNode;
  className?: string;
  variant?: "gold" | "outline-light" | "outline-dark" | "ink" | "rose" | "aqua" | "ghost-light" | "ghost-dark";
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  dataAdd?: string;
  form?: string;
}) {
  const base =
    "group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden whitespace-nowrap px-7 py-3.5 font-sans text-[11px] uppercase tracking-[0.28em] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    gold: "bg-gold text-ink hover:bg-gold-2",
    ink: "bg-ink text-cream hover:bg-ink-3",
    rose: "bg-her-deep text-her-bg hover:bg-her-rose",
    aqua: "bg-sum-deep text-white hover:bg-sum-aqua",
    "outline-light": "border border-cream/30 text-cream hover:border-cream hover:bg-cream hover:text-ink",
    "outline-dark": "border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-cream",
    "ghost-light": "text-cream/80 hover:text-cream px-0",
    "ghost-dark": "text-ink/80 hover:text-ink px-0",
  }[variant];
  const cls = cn(base, styles, className);
  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-3 [&>svg]:shrink-0">{children}</span>
      {!variant.startsWith("ghost") && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 z-0 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover/btn:left-[120%] group-hover/btn:opacity-100" />
      )}
    </>
  );
  if (href)
    return href.startsWith("/") ? (
      <Link href={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  return (
    <button type={type} form={form} onClick={onClick} className={cls} disabled={disabled} data-add={dataAdd}>
      {inner}
    </button>
  );
}

/* Icons */
export const Icon = {
  Bag: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  Search: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  ),
  Close: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Arrow: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  ),
  ChevronDown: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Plus: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M5 12h14" />
    </svg>
  ),
  Menu: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  Home: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
    </svg>
  ),
  Grid: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </svg>
  ),
  Check: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={p.className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  Instagram: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
    </svg>
  ),
  Facebook: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6H14v-6h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5Z" />
    </svg>
  ),
  TikTok: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className={p.className}>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.5 2.6 2.2 4.2 5 4.5" />
    </svg>
  ),
};

/* Monogram mark */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} role="img" aria-label="Miskova monogram">
      {/* Seal: solid outer ring, fine dotted orbit, inner hairline */}
      <circle cx="32" cy="32" r="30.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="26.8" stroke="currentColor" strokeWidth="1.1" strokeDasharray="0.1 3.4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="23.4" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
      {/* Flanking diamonds on the inner hairline */}
      <rect x="7.8" y="31.2" width="1.6" height="1.6" transform="rotate(45 8.6 32)" fill="currentColor" />
      <rect x="54.6" y="31.2" width="1.6" height="1.6" transform="rotate(45 55.4 32)" fill="currentColor" />
      {/* The mark, recreated from the original logo: cap bar, secondary bar, M body */}
      <g transform="translate(0 1.5)">
        <rect x="22.5" y="12.4" width="19" height="3.6" rx="1.8" fill="currentColor" />
        <rect x="26" y="18.6" width="12" height="2.4" rx="1.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M20.6 46.5V28.6Q20.6 25.6 23.6 25.6H26.4" />
          <path d="M29.6 33.5V30.8Q29.6 25.8 32 25.8Q34.4 25.8 34.4 30.9V41.5Q34.4 45.3 37.2 45.7" />
          <path d="M43.4 46.5V28.6Q43.4 25.6 40.4 25.6H38.2" />
        </g>
      </g>
    </svg>
  );
}
