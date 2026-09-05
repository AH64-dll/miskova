"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { brand, bySlug, effectivePrice, formatPrice } from "@/data/products";
import { useStore } from "@/components/store";
import { cn } from "@/utils/cn";
import { Button, Icon, LUX } from "@/components/ui";
import { GOVERNORATES, OrderSubmissionSchema } from "@/lib/orderSchemas";
import { useDialogFocus } from "@/components/useDialogFocus";

type Step = "bag" | "checkout" | "success";

type Placed = { ref: string; total: number };

const inputCls =
  "w-full border border-cream/15 bg-ink px-4 py-3 font-sans text-sm font-light text-cream placeholder:text-cream/30 focus:border-gold/60 focus:outline-none";
const labelCls = "eyebrow mb-2 block text-[10px] text-gold/70";

export default function BagDrawer() {
  const {
    bagOpen,
    setBagOpen,
    items,
    setQty,
    removeFromBag,
    clearBag,
    bagTotal,
    bagCount,
    showToast,
  } = useStore();
  const [step, setStep] = useState<Step>("bag");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [placedLines, setPlacedLines] = useState<{ name: string; qty: number }[]>([]);
  const wasOpen = useRef(false);
  const submitLock = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, bagOpen);

  // Reset to the bag step only on closed → open transitions (never while open,
  // so placing an order — which clears the bag — keeps the success step).
  useEffect(() => {
    if (bagOpen && !wasOpen.current) {
      setStep("bag");
      setError(null);
    }
    wasOpen.current = bagOpen;
  }, [bagOpen]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitLock.current) setBagOpen(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setBagOpen]);
  const lines = useMemo(
    () =>
      items.map((l) => {
        const prod = bySlug(l.slug);
        return { ...l, product: prod, unit: effectivePrice(prod), name: prod.name, image: prod.image };
      }),
    [items],
  );

  const remaining = Math.max(0, brand.freeShippingThreshold - bagTotal);
  const progress = Math.min(1, bagTotal / brand.freeShippingThreshold);

  const close = () => { if (!submitLock.current) setBagOpen(false); };


  const submit = async () => {
    if (submitLock.current) return;
    setError(null);
    if (!governorate) return setError("Please choose your governorate.");
    const parsed = OrderSubmissionSchema.safeParse({
      items: items.map(({ slug, qty }) => ({ slug, qty })),
      customer: { name, phone, governorate, address, notes },
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check your order details.");
    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; ref?: string; total?: number; error?: string } | null;
      if (!res.ok || !json?.ok || !json.ref) {
        setError(json?.error ?? "Unable to place your order. Please try again.");
        return;
      }
      setPlaced({ ref: json.ref, total: json.total ?? bagTotal });
      setPlacedLines(lines.map((l) => ({ name: l.name, qty: l.qty })));
      setStep("success");
      clearBag();
      showToast("Order placed — thank you.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const waHref = useMemo(() => {
    if (!placed) return "";
    const summary = placedLines.map((l) => `${l.name} × ${l.qty}`).join(", ");
    const text = `Hello Miskova — confirming order ${placed.ref} (${formatPrice(placed.total)}): ${summary}. Name: ${name}, Phone: ${phone}, ${governorate}, ${address}.`;
    return `https://wa.me/201036202634?text=${encodeURIComponent(text)}`;
  }, [placed, placedLines, name, phone, governorate, address]);

  return (
    <AnimatePresence>
      {bagOpen && (
        <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[80]" role="dialog" aria-modal aria-label="Shopping bag" aria-busy={submitting}>
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: LUX }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ink text-cream shadow-2xl ring-1 ring-gold/20"
          >
            <div className="flex items-center justify-between border-b border-cream/10 px-6 py-5">
              <p className="eyebrow text-[10px] text-gold">
                {step === "bag" ? `Your bag · ${bagCount}` : step === "checkout" ? "Checkout · Cash on delivery" : "Order confirmed"}
              </p>
              <button onClick={close} disabled={submitting} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold/60" aria-label="Close bag">
                <Icon.Close className="h-4 w-4" />
              </button>
            </div>

            {step === "bag" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-cream/10 px-6 py-5">
                  {bagTotal >= brand.freeShippingThreshold ? (
                    <p className="font-display text-xl italic text-gold-2">Free delivery unlocked.</p>
                  ) : (
                    <p className="font-sans text-xs font-light tracking-wide text-cream/70">
                      {formatPrice(remaining)} away from free delivery
                    </p>
                  )}
                  <div className="mt-3 h-px bg-cream/10">
                    <div className="h-px bg-gold transition-all duration-700" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                </div>
                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
                  {lines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Icon.Bag className="h-10 w-10 text-gold/50" />
                      <p className="display mt-6 text-3xl">Your bag is empty.</p>
                      <p className="mt-3 max-w-[26ch] font-sans text-xs font-light leading-relaxed text-cream/60">
                        Every chapter waits to be sealed. Add a fragrance to begin.
                      </p>
                      <Button variant="gold" className="mt-8" onClick={close}>
                        Continue browsing <Icon.Arrow className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-6">
                      {lines.map((l) => (
                        <li key={l.slug} className="flex gap-4 border-b border-cream/10 pb-6">
                          <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#efe9dc]">
                            <img src={l.image} alt={l.name} className="h-full w-full object-cover plate-blend" loading="lazy" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-xl leading-tight">{l.name}</p>
                            <p className="mt-1 font-sans text-xs tracking-wider text-cream/50">{formatPrice(l.unit)}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center border border-cream/15">
                                <button
                                  onClick={() => (l.qty <= 1 ? removeFromBag(l.slug) : setQty(l.slug, l.qty - 1))}
                                  className="flex h-8 w-8 items-center justify-center transition-colors hover:text-gold"
                                  aria-label={`Decrease ${l.name}`}
                                >
                                  <Icon.Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center font-sans text-sm">{l.qty}</span>
                                <button
                                  onClick={() => setQty(l.slug, Math.min(l.qty + 1, 9))}
                                  disabled={l.qty >= 9}
                                  className="flex h-8 w-8 disabled:opacity-30 items-center justify-center transition-colors hover:text-gold"
                                  aria-label={`Increase ${l.name}`}
                                >
                                  <Icon.Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <button onClick={() => removeFromBag(l.slug)} className="link-draw eyebrow text-[10px] text-cream/50 hover:text-cream">
                                Remove
                              </button>
                            </div>
                          </div>
                          <p className="shrink-0 font-display text-lg text-gold-2">{formatPrice(l.unit * l.qty)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {lines.length > 0 && (
                  <div className="border-t border-cream/10 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <p className="eyebrow text-[10px] text-cream/60">Subtotal</p>
                      <p className="font-display text-2xl text-cream">{formatPrice(bagTotal)}</p>
                    </div>
                    <Button variant="gold" className="mt-4 w-full" onClick={() => { setError(null); setStep("checkout"); }}>
                      Proceed to checkout <Icon.Arrow className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "checkout" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
                  <div className="border border-cream/10 bg-cream/[0.03] p-4">
                    <p className="eyebrow text-[10px] text-gold/70">Order summary · {bagCount} items</p>
                    <ul className="mt-3 space-y-2">
                      {lines.map((l) => (
                        <li key={l.slug} className="flex items-center justify-between gap-3 font-sans text-xs font-light text-cream/80">
                          <span className="truncate">{l.name} × {l.qty}</span>
                          <span className="shrink-0">{formatPrice(l.unit * l.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex items-center justify-between border-t border-cream/10 pt-3 font-display text-xl">
                      <span className="eyebrow text-[10px] text-cream/50">Subtotal</span>
                      <span className="text-gold-2">{formatPrice(bagTotal)}</span>
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-cream/65">
                    {remaining === 0 ? "Delivery included. Pay in cash when your chapter arrives." : "Delivery fee confirmed before dispatch. Pay in cash on delivery."}
                  </p>
                  <form id="bag-checkout" onSubmit={(event) => { event.preventDefault(); void submit(); }} className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="bag-name" className={labelCls}>Name *</label>
                      <input id="bag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputCls} autoComplete="name" required maxLength={60} />
                    </div>
                    <div>
                      <label htmlFor="bag-phone" className={labelCls}>Phone *</label>
                      <input id="bag-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className={inputCls} type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} />
                    </div>
                    <div>
                      <label htmlFor="bag-gov" className={labelCls}>Governorate *</label>
                      <select
                        id="bag-gov"
                        required
                        autoComplete="address-level1"
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className={cn(inputCls, !governorate && "text-cream/30", "[&>option]:bg-ink [&>option]:text-cream")}
                      >
                        <option value="" disabled>Choose your governorate</option>
                        {GOVERNORATES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="bag-address" className={labelCls}>Address *</label>
                      <textarea id="bag-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, apartment, landmark" rows={3} className={cn(inputCls, "resize-none")} autoComplete="street-address" required maxLength={300} />
                    </div>
                    <div>
                      <label htmlFor="bag-notes" className={labelCls}>Notes</label>
                      <textarea id="bag-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know? (optional)" rows={2} maxLength={500} className={cn(inputCls, "resize-none")} />
                    </div>
                    {error && <p role="alert" className="font-sans text-xs tracking-wide text-red-300">{error}</p>}
                  </form>
                </div>
                <div className="border-t border-cream/10 px-6 py-5">
                  <Button variant="gold" className="w-full" type="submit" form="bag-checkout" disabled={submitting || lines.length === 0}>
                    {submitting ? "Placing your order…" : `Place order · ${formatPrice(bagTotal)}`} <Icon.Arrow className="h-3.5 w-3.5" />
                  </Button>
                  <button disabled={submitting} onClick={() => setStep("bag")} className="link-draw mx-auto mt-4 block eyebrow text-[10px] text-cream/50 hover:text-cream">
                    Back to bag
                  </button>
                </div>
              </div>
            )}

            {step === "success" && placed && (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40">
                  <Icon.Check className="h-6 w-6 text-gold" />
                </span>
                <p className="eyebrow mt-8 text-[10px] text-gold/70">Order confirmed</p>
                <p className="mt-3 break-all font-display text-2xl tracking-wide">{placed.ref}</p>
                <p className="mt-4 max-w-[32ch] font-sans text-xs font-light leading-relaxed text-cream/70">
                  Thank you — your order of {formatPrice(placed.total)} is sealed. Cash on delivery; our courier will call you to confirm.
                </p>
                <Button variant="gold" href={waHref} className="mt-8 w-full">
                  Confirm on WhatsApp <Icon.Arrow className="h-3.5 w-3.5" />
                </Button>
                <button onClick={close} className="link-draw mt-5 eyebrow text-[10px] text-cream/50 hover:text-cream">
                  Continue browsing
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
