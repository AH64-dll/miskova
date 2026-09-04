"use client";

import { brand } from "@/data/products";
import { Icon, Monogram } from "@/components/ui";
import { NavLink, NAV } from "@/components/Header";

export default function Footer() {
  return (
    <footer data-tone="dark" className="relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-20 md:px-10 md:pb-16">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Monogram className="h-8 w-8 text-gold" />
              <span className="font-display text-2xl tracking-[0.32em]">MISKOVA</span>
            </div>
            <p className="mt-6 max-w-sm font-display text-2xl font-light italic leading-snug text-cream/80">“Seal your Miskova chapter today. Wear your story with confidence.”</p>
            <div className="mt-8 flex items-center gap-3">
              {[
                { href: brand.socials.instagram, I: Icon.Instagram, l: "Instagram" },
                { href: brand.socials.facebook, I: Icon.Facebook, l: "Facebook" },
                { href: brand.socials.tiktok, I: Icon.TikTok, l: "TikTok" },
              ].map(({ href, I, l }) => (
                <a key={l} href={href} target="_blank" rel="noreferrer" aria-label={l} className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-all duration-500 hover:border-gold hover:text-gold">
                  <I className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="md:col-span-2">
            <p className="eyebrow text-gold/70">Collections</p>
            <ul className="mt-5 space-y-3">
              {NAV.map((n) => (
                <li key={n.id}>
                  <NavLink n={n} className="link-draw font-sans text-sm font-light text-cream/70 hover:text-cream" />
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="eyebrow text-gold/70">Pages</p>
            <ul className="mt-5 space-y-3">
              {[
                ["About Us", brand.pages.about],
                ["Shipping Policy", brand.pages.shipping],
                ["Refund Policy", brand.pages.refund],
                ["Privacy Policy", brand.pages.privacy],
                ["Terms & Conditions", brand.pages.terms],
              ].map(([l, h]) => (
                <li key={l}>
                  <a href={h} target="_blank" rel="noreferrer" className="link-draw font-sans text-sm font-light text-cream/70 hover:text-cream">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow text-gold/70">Contact</p>
            <ul className="mt-5 space-y-3 font-sans text-sm font-light text-cream/70">
              <li>{brand.address}</li>
              <li>
                <a href={`tel:${brand.phone}`} className="link-draw hover:text-cream">
                  {brand.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${brand.email}`} className="link-draw hover:text-cream">
                  {brand.email}
                </a>
              </li>
            </ul>
            <p className="mt-8 eyebrow text-[10px] text-gold">{brand.shippingNote}</p>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-cream/10 pt-6 md:flex-row md:items-center">
          <p className="eyebrow text-[10px] text-cream/40">© {new Date().getFullYear()} {brand.fullName}</p>
          <p className="eyebrow text-[10px] text-cream/40">
            Made by{" "}
            <a
              href="https://www.facebook.com/profile.php?id=61574396289127"
              target="_blank"
              rel="noreferrer"
              className="link-draw text-gold/70 transition-colors duration-500 hover:text-gold"
            >
              Amr Hares
            </a>
          </p>
          <p className="eyebrow text-[10px] text-cream/40">Prices in EGP · Cash on delivery available</p>
        </div>
      </div>
      {/* giant wordmark */}
      <div className="pointer-events-none select-none overflow-hidden px-5 md:px-10" aria-hidden>
        <p className="display -mb-[0.22em] text-center text-[22vw] leading-none text-cream/[0.04]">MISKOVA</p>
      </div>
    </footer>
  );
}
