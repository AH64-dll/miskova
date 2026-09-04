"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { patronDispatches } from "@/data/patronDispatches";
import { PatronLightbox } from "./PatronLightbox";

const AUTO_ADVANCE_MS = 5500;
const SWIPE_THRESHOLD_PX = 45;
const SWIPE_VELOCITY_THRESHOLD = 0.4;

export function PatronCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const totalSlides = patronDispatches.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const sync = () => setReduceMotion(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }, [totalSlides]);

  const handleGoTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (reduceMotion || isPaused || isDragging || lightboxIndex !== null || document.hidden) return;
    const interval = setInterval(handleNext, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [reduceMotion, isPaused, isDragging, lightboxIndex, handleNext, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (
      (e.target as HTMLElement).closest(
        "button, a, input, select, .patron-controls-cluster, .patron-pills-row",
      )
    ) {
      return;
    }
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const deltaX = e.clientX - pointerDownRef.current.x;
    if (!isDragging && Math.abs(deltaX) > 5) {
      setIsDragging(true);
      setIsPaused(true);
      if (containerRef.current) {
        try {
          containerRef.current.setPointerCapture(e.pointerId);
        } catch {}
      }
    }
    if (isDragging) setDragOffset(deltaX * 0.75);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const deltaX = e.clientX - pointerDownRef.current.x;
    const deltaTime = Math.max(1, Date.now() - pointerDownRef.current.time);
    const velocity = Math.abs(deltaX) / deltaTime;
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (isDragging) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX || velocity > SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0) handlePrev();
        else handleNext();
      }
    }
    pointerDownRef.current = null;
    setIsDragging(false);
    setIsPaused(false);
    setDragOffset(0);
  };

  const currentDispatch = patronDispatches[activeIndex];

  return (
    <div
      ref={containerRef}
      className="patron-carousel-wrapper group relative mt-14 border-y border-cream/10 py-10 focus:outline-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      tabIndex={0}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => { if (!isDragging) setIsPaused(false); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onKeyDown={handleKeyDown}
    >
      <div className="patron-carousel-top flex items-center justify-between">
        <div className="patron-slide-counter flex items-baseline gap-2 font-sans text-sm text-cream/60" aria-live="polite" aria-atomic="true">
          <span className="counter-current tabular-nums text-gold">{activeIndex + 1}</span>
          <span className="counter-divider text-cream/30" aria-hidden="true">/</span>
          <span className="counter-total tabular-nums">{totalSlides}</span>
        </div>

        <div className="patron-controls-cluster patron-nav-buttons flex items-center gap-2">
          <button
            type="button"
            className="patron-arrow-btn flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/70 transition-colors duration-500 hover:border-gold hover:text-gold"
            onClick={handlePrev}
            aria-label="Previous customer review"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="patron-arrow-btn flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/70 transition-colors duration-500 hover:border-gold hover:text-gold"
            onClick={handleNext}
            aria-label="Next customer review"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="patron-stage mt-6 flex justify-center"
        style={{
          transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="patron-card-split">
          <div className="patron-screenshot-frame relative bg-cream p-3 pb-10 shadow-[0_40px_60px_-30px_rgba(0,0,0,0.8)]">
            <div className="patron-image-container group/img relative overflow-hidden bg-bone">
              <Image
                key={currentDispatch.id}
                src={currentDispatch.localPath || currentDispatch.cdnUrl}
                alt={currentDispatch.altText}
                width={500}
                height={650}
                className="patron-screenshot-img h-auto w-full object-cover"
                loading="lazy"
                sizes="(min-width: 900px) 500px, 90vw"
              />

              <button
                type="button"
                className="patron-hover-badge absolute inset-0 flex items-end justify-start bg-gradient-to-t from-ink/50 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-500 focus:opacity-100 group-hover/img:opacity-100"
                onClick={() => setLightboxIndex(activeIndex)}
                aria-label={`Open screenshot ${activeIndex + 1} fullscreen`}
              >
                <span className="patron-hover-text eyebrow bg-ink px-3 py-2 text-[9px] text-cream">Open fullscreen</span>
              </button>
            </div>
            <p className="mt-4 px-1 text-center eyebrow text-[9px] text-ink/50">
              Patron dispatch · {String(activeIndex + 1).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      <div className="patron-carousel-footer mt-6 flex justify-center">
        <div className="patron-pills-row flex items-center gap-2.5" role="group" aria-label="Select customer review slide">
          {patronDispatches.map((dispatch, idx) => (
            <button
              key={dispatch.id}
              type="button"
              aria-current={idx === activeIndex ? "true" : undefined}
              aria-label={`Show customer review ${idx + 1} of ${totalSlides}`}
              aria-pressed={idx === activeIndex}
              className={`patron-pill-dot flex h-3 w-3 items-center justify-center rounded-full border transition-colors duration-500 ${idx === activeIndex ? "border-gold" : "border-cream/30 hover:border-cream/60"}`}
              onClick={() => handleGoTo(idx)}
            >
              <span className={`pill-dot-inner h-1.5 w-1.5 rounded-full ${idx === activeIndex ? "bg-gold" : "bg-transparent"}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <PatronLightbox
        isOpen={lightboxIndex !== null}
        dispatch={lightboxIndex !== null ? patronDispatches[lightboxIndex] : null}
        onClose={() => setLightboxIndex(null)}
        onPrev={() =>
          setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : totalSlides - 1))
        }
        onNext={() =>
          setLightboxIndex((prev) => (prev !== null && prev < totalSlides - 1 ? prev + 1 : 0))
        }
        hasPrev={totalSlides > 1}
        hasNext={totalSlides > 1}
      />
    </div>
  );
}
