"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { computeChapters, setJourneyProgress, smoothstep } from "./journeyStore";
import backdropStyles from "./hero-backdrop.module.css";

const BottleStage = dynamic(() => import("./BottleStage"), {
  ssr: false,
  loading: () => null,
});

const CRIMSON_URL = "https://miskova.myeasyorders.com/products/Crimson-Bloom";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const sync = () => setReduced(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Non-image eligibility: save-data, narrow viewport, or no WebGL context. */
function checkElegantFallback(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    const narrow = window.innerWidth < 360;
    let noWebGL = false;
    try {
      const canvas = document.createElement("canvas");
      noWebGL =
        !canvas.getContext("webgl2") && !canvas.getContext("webgl");
    } catch {
      noWebGL = true;
    }
    return Boolean(saveData || narrow || noWebGL);
  } catch {
    return false;
  }
}

function useElegantFallback(): boolean {
  const [fallback, setFallback] = useState(() => checkElegantFallback());
  useEffect(() => {
    const sync = () => setFallback(checkElegantFallback());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return fallback;
}

export default function Journey() {
  const trackRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(1);
  const reducedMotion = usePrefersReducedMotion();
  const elegantFallback = useElegantFallback();

  useEffect(() => {
    if (reducedMotion || elegantFallback) return;
    const node = trackRef.current;
    if (!node) return;
    let ticking = false;
    let eased = 0;
    let raf = 0;

    const update = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const distance = Math.max(1, node.offsetHeight - window.innerHeight);
      const target = Math.min(1, Math.max(0, -rect.top / distance));
      cancelAnimationFrame(raf);
      const ease = () => {
        eased += (target - eased) * 0.14;
        if (Math.abs(target - eased) < 0.0005) eased = target;
        setJourneyProgress(eased);

        const chapters = computeChapters(eased);
        const root = document.documentElement;
        root.style.setProperty("--journey-progress", eased.toFixed(4));
        root.style.setProperty("--product", chapters.product.toFixed(4));
        root.style.setProperty("--reveal", chapters.reveal.toFixed(4));
        root.style.setProperty("--scent", chapters.scent.toFixed(4));
        root.style.setProperty("--wake", chapters.wake.toFixed(4));
        root.style.setProperty("--desire", chapters.desire.toFixed(4));

        const index = eased < 0.5 ? 1 : 2;
        setChapter((current) => (current === index ? current : index));
        if (eased !== target) raf = requestAnimationFrame(ease);
      };
      ease();
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion, elegantFallback]);

  if (reducedMotion || elegantFallback) {
    return (
      <section
        className={`journey journey--static ${backdropStyles.hero}`}
        id="crimson-bloom"
        aria-labelledby="journey-title"
      >
        <div className={backdropStyles.backdrop} aria-hidden="true">
          <span>Miss Cova</span>
        </div>
        <div className={backdropStyles.staticWrap}>
          <div className={backdropStyles.monogram} aria-hidden="true">
            M
          </div>
          <article className={backdropStyles.staticAnchor}>
            <h1 id="journey-title" className={backdropStyles.anchorTitle}>
              Miss Cova
            </h1>
            <p className={backdropStyles.price}>
              <span>550 EGP</span>
            </p>
            <p className={backdropStyles.ctaRow}>
              <a
                className="mk-secondary-button"
                href={CRIMSON_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Crimson Bloom details"
              >
                View details
              </a>
            </p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`journey ${backdropStyles.hero}`}
      id="crimson-bloom"
      ref={trackRef}
      data-chapter={chapter}
      aria-labelledby="hero-title"
    >
      <div className={backdropStyles.backdrop} aria-hidden="true">
        <span>Miss Cova</span>
      </div>
      <div className="journey-stage">
        {/* Eager first-paint 3D: no image fallback, no click-to-load gate. */}
        <BottleStage />
      </div>

      <article className={backdropStyles.anchor} aria-hidden={chapter !== 1}>
        <h1 id="hero-title" className={backdropStyles.anchorTitle}>
          Miss Cova
        </h1>
      </article>

      <article className={backdropStyles.anchor} aria-hidden={chapter !== 2}>
        <h2 className={backdropStyles.anchorTitle}>Miss Cova</h2>
        <p className={backdropStyles.price}>
          <span>550 EGP</span>
        </p>
        <p className={backdropStyles.ctaRow}>
          <a
            className="mk-secondary-button"
            href={CRIMSON_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Crimson Bloom details"
          >
            View details
          </a>
        </p>
      </article>

      <div className="journey-cue" aria-hidden="true">
        Scroll to enter
      </div>
      <div className="journey-index" aria-hidden="true">
        <span className="journey-index__current">0{chapter}</span>
        <span className="journey-index__track">
          <span />
        </span>
        <span>02</span>
      </div>
    </section>
  );
}

export { smoothstep };
