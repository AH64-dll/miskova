"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { PatronDispatch } from "@/types/reviews";

interface PatronLightboxProps {
  dispatch: PatronDispatch | null;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PatronLightbox({
  dispatch,
  isOpen,
  onClose,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
}: PatronLightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsZoomed(false);
    setPanOrigin({ x: 50, y: 50 });
  }, [dispatch?.id, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && dispatch) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
        dialog.querySelector<HTMLElement>("button")?.focus();
      }
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen, dispatch]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      triggerRef.current?.focus?.();
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setPanOrigin({ x, y });
    },
    [isZoomed],
  );

  if (!dispatch) return null;

  const imgSrc = dispatch.localPath || dispatch.cdnUrl;

  return (
    <dialog
      ref={dialogRef}
      className={`patron-lightbox-dialog m-auto w-[min(94vw,900px)] bg-cream p-0 text-ink backdrop:bg-ink/80 backdrop:backdrop-blur-sm`}
      aria-label={`Customer review screenshot ${dispatch.id}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          dialogRef.current?.close();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          onPrev?.();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onNext?.();
        } else if (e.key === "Tab") {
          const root = dialogRef.current;
          if (!root) return;
          const focusables = Array.from(
            root.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null);
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="patron-lightbox-header flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <span className="patron-lightbox-title eyebrow text-[10px] text-ink/60">{dispatch.title || "Customer Review"}</span>
        <div className="patron-lightbox-actions flex items-center gap-2">
          <button
            type="button"
            className="patron-action-btn link-draw eyebrow text-[10px] text-ink/60 hover:text-ink"
            onClick={() => setIsZoomed((prev) => !prev)}
            aria-label={isZoomed ? "Reset zoom" : "Magnify image"}
          >
            {isZoomed ? "Reset" : "Zoom"}
          </button>
          <button
            type="button"
            className="patron-action-btn patron-close-btn flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close screenshot viewer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="patron-lightbox-body relative flex items-stretch justify-center gap-2 bg-bone p-4">
        {onPrev && (
          <button
            type="button"
            className="patron-nav-arrow patron-nav-arrow--prev my-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous screenshot"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11.5 3.5L6 9l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          ref={containerRef}
          className={`patron-lightbox-image-stage max-h-[78vh] overflow-hidden ${isZoomed ? "is-zoomed cursor-zoom-out" : "cursor-zoom-in"}`}
          onMouseMove={handleMouseMove}
          onClick={() => setIsZoomed((prev) => !prev)}
        >
          <div
            className="patron-lightbox-zoom-wrapper"
            style={
              isZoomed
                ? {
                    transform: "scale(1.4)",
                    transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
                  }
                : undefined
            }
          >
            <Image
              src={imgSrc}
              alt={dispatch.altText}
              width={700}
              height={900}
              className="patron-lightbox-img h-auto w-full object-contain"
              sizes="(min-width: 900px) 700px, 90vw"
            />
          </div>
        </div>

        {onNext && (
          <button
            type="button"
            className="patron-nav-arrow patron-nav-arrow--next my-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next screenshot"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M6.5 3.5L12 9l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </dialog>
  );
}
