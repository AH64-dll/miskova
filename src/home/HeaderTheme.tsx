"use client";

import { useEffect } from "react";

/**
 * Keeps the fixed header legible without snapping: `is-solid` adds the scrim once
 * the page has moved, `on-dark` flips the ink while a dark section sits under it,
 * and the announcement offset collapses so the header never floats over a gap.
 */
export default function HeaderTheme() {
  useEffect(() => {
    const header = document.getElementById("mk-header");
    if (!header) return;
    const darkSections = Array.from(document.querySelectorAll<HTMLElement>(".mk-house, .mk-footer"));

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      document.documentElement.style.setProperty("--ann-h", y > 20 ? "0px" : "34px");
      header.classList.toggle("is-solid", y > 12);
      const onDark = darkSections.some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top < 76 && rect.bottom > 60;
      });
      header.classList.toggle("on-dark", onDark);
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
    };
  }, []);

  return null;
}
