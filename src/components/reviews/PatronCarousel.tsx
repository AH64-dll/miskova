"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { patronDispatches } from "@/data/patronDispatches";
import { PatronLightbox } from "./PatronLightbox";
import lux from "./luxury.module.css";

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
      className={`patron-carousel-wrapper ${lux.scope}`}
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
    >
      <div className="patron-carousel-top">
        <div className="patron-slide-counter" aria-live="polite" aria-atomic="true">
          <span className="counter-current">{activeIndex + 1}</span>
          <span className="counter-divider" aria-hidden="true">/</span>
          <span className="counter-total">{totalSlides}</span>
        </div>

        <div className="patron-nav-buttons">
          <button
            type="button"
            className="patron-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous customer review"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="patron-arrow-btn"
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
        className="patron-stage"
        style={{
          transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="patron-card-split">
          <div className="patron-screenshot-frame">
            <div className="patron-image-container">
              <Image
                key={currentDispatch.id}
                src={currentDispatch.localPath || currentDispatch.cdnUrl}
                alt={currentDispatch.altText}
                width={500}
                height={650}
                className="patron-screenshot-img"
                loading="lazy"
                sizes="(min-width: 900px) 500px, 90vw"
              />

              <button
                type="button"
                className="patron-hover-badge"
                onClick={() => setLightboxIndex(activeIndex)}
                aria-label={`Open screenshot ${activeIndex + 1} fullscreen`}
              >
                <span className="patron-hover-text">Open fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="patron-carousel-footer">
        <div className="patron-pills-row" role="group" aria-label="Select customer review slide">
          {patronDispatches.map((dispatch, idx) => (
            <button
              key={dispatch.id}
              type="button"
              aria-current={idx === activeIndex ? "true" : undefined}
              aria-label={`Show customer review ${idx + 1} of ${totalSlides}`}
              aria-pressed={idx === activeIndex}
              className={`patron-pill-dot ${idx === activeIndex ? "is-active" : ""}`}
              onClick={() => handleGoTo(idx)}
            >
              <span className="pill-dot-inner" aria-hidden="true" />
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
