"use client";

/**
 * Module-level journey store.
 *
 * The DOM writes intent (scroll progress, pointer position, control presses);
 * the WebGL frame loop reads and smooths it. Nothing here triggers a React
 * render — the only value pushed back to React is the control button label,
 * which changes a handful of times per session.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type JourneyState = {
  /** Raw scroll progress written by the scroll listener. */
  rawProgress: number;
  progress: number;
  pointerTargetX: number;
  pointerTargetY: number;
  pointerX: number;
  pointerY: number;
  velocityX: number;
  velocityY: number;
  /** User explicitly lifted the cap (control click or mesh hit). */
  capForced: boolean;
  /** User requested an atomizer press. */
  pressRequested: boolean;
  ready: boolean;
  failed: boolean;
  label: string;
  labelState: string;
  onLabel: ((label: string, state: string) => void) | null;
};

export const journey: JourneyState = {
  rawProgress: 0,
  progress: 0,
  pointerTargetX: 0,
  pointerTargetY: 0,
  pointerX: 0,
  pointerY: 0,
  velocityX: 0,
  velocityY: 0,
  capForced: false,
  pressRequested: false,
  ready: false,
  failed: false,
  label: "Preparing the bottle",
  labelState: "loading",
  onLabel: null,
};

export function setJourneyProgress(value: number): void {
  journey.rawProgress = clamp01(value);
}

export function setPointer(x: number, y: number): void {
  journey.pointerTargetX = Math.min(1, Math.max(-1, x));
  journey.pointerTargetY = Math.min(1, Math.max(-1, y));
}

export function clearPointer(): void {
  journey.pointerTargetX = 0;
  journey.pointerTargetY = 0;
}

export function liftCap(): void {
  journey.capForced = true;
}

export function releaseCap(): void {
  journey.capForced = false;
}

export function pressAtomizer(): void {
  journey.pressRequested = true;
}

export function setLabel(label: string, state: string): void {
  if (journey.label === label && journey.labelState === state) return;
  journey.label = label;
  journey.labelState = state;
  journey.onLabel?.(label, state);
}

/**
 * Chapter weights for one continuous scroll value.
 * Every chapter is a product of smoothsteps so copy never hard-cuts.
 */
export type ChapterState = {
  progress: number;
  product: number;
  reveal: number;
  scent: number;
  wake: number;
  desire: number;
  atmosphere: number;
  capOpen: number;
  materialSweep: number;
  fieldEnergy: number;
};

export function computeChapters(progress: number): ChapterState {
  const p = clamp01(progress);
  return {
    progress: p,
    product: 1 - smoothstep(0.06, 0.20, p),
    reveal: smoothstep(0.14, 0.24, p) * (1 - smoothstep(0.38, 0.46, p)),
    scent: smoothstep(0.40, 0.50, p) * (1 - smoothstep(0.64, 0.72, p)),
    wake: smoothstep(0.66, 0.74, p) * (1 - smoothstep(0.84, 0.90, p)),
    desire: smoothstep(0.88, 0.95, p),
    atmosphere: smoothstep(0.70, 0.95, p),
    capOpen: smoothstep(0.10, 0.32, p),
    materialSweep: smoothstep(0.18, 0.38, p) * (1 - smoothstep(0.68, 0.88, p)),
    fieldEnergy: smoothstep(0.42, 0.74, p),
  };
}

export function smoothstep(min: number, max: number, value: number): number {
  const x = clamp01((value - min) / (max - min));
  return x * x * (3 - 2 * x);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
