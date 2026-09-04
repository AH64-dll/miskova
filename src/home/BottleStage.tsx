"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
 import { useCallback, useEffect, useMemo, useRef, useState } from "react";
 import type { RefObject } from "react";
import * as THREE from "three";
import { buildMiskovaBottle, FLOOR_Y, type MiskovaBottle } from "./bottle/bottleModel";
import { bySlug } from "@/data/products";
import { createFluidPhysics, type FluidPhysics } from "./bottle/fluidPhysics";
import { createAtomizerSpring, createCapSpring, type AtomizerSpring, type CapSpring } from "./springs";
import { createSpraySystem, type SpraySystem } from "./spray";
import { createWakeField, type WakeField } from "./wake";
import { createInteractiveSurface, type InteractiveSurface } from "./InteractiveSurface";
import { createFloorPool, createStudioEnvironment } from "./environment";
import "./bottle-stage.css";
import {
  clearPointer,
  clamp,
  computeChapters,
  journey,
  liftCap,
  pressAtomizer,
  setLabel,
  setPointer,
  smoothstep,
} from "./journeyStore";
 const CAMERA = {
   fov: 31,
   near: 0.05,
   far: 40,
  // Full-bleed hero: the bottle group is offset +x in world units so its
  // projection lands at ~65% viewport width on a 1440 canvas, with the glass
  // body scaled to 0.8 (height ≈ 47% of the hero) so its right edge clears
  // the price/CTA column by ~150px. Camera stays put so spray/wake framing
  // is unchanged.
  desktop: [0.5, -0.02, 3.75] as [number, number, number],
  compact: [0.55, 0.75, 6.45] as [number, number, number],
  target: [0.42, -0.02, 0] as [number, number, number],
  targetCompact: [0.42, 0.65, 0] as [number, number, number],
  groupOffset: [0.9, -0.1, 0] as [number, number, number],
  // Compact: the anchor sits high-right so the bottle fills the empty zone
  // between the header and the copy stack (headline/CTAs/caption stay clear).
  groupOffsetCompact: [0.85, 1.27, 0] as [number, number, number],
  bottleScale: 0.8,
 };

const POINTER_PARALLAX = { rotationX: 0.012, rotationY: 0.022, positionX: 0.022, positionY: 0.012 };

const BG_BASE = new THREE.Color("#0b0b0c");
const BG_WARM = new THREE.Color("#241d12");
const BG_NIGHT = new THREE.Color("#141a13");

function isDescendant(object: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (node === ancestor) return true;
    node = node.parent;
  }
  return false;
}

 type StageContentsProps = {
   host: HTMLElement | null;
   eventSource: HTMLElement | null;
   mobile: boolean;
   compact: boolean;
   reduceMotion: boolean;
   onReady: () => void;
   onFail: (error: unknown) => void;
 };

 function StageContents({ host, eventSource, mobile, compact, reduceMotion, onReady, onFail }: StageContentsProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.DirectionalLight>(null);
  const rimLight = useRef<THREE.DirectionalLight>(null);
  const glintLight = useRef<THREE.DirectionalLight>(null);
  const sweepLight = useRef<THREE.PointLight>(null);
  const burstLight = useRef<THREE.PointLight>(null);
   const floorPool = useMemo(() => createFloorPool(FLOOR_Y), []);
   const anchorRef = useRef<THREE.Group | null>(null);
   const rig = useMemo(() => {
     // The hero stage presents the featured chapter — label matches the caption.
     const featured = bySlug("Liquid-Gold");
     const bottle = buildMiskovaBottle({ brand: "MISKOVA", name: featured.name, sub: "EXTRAIT DE PARFUM" });
     const spray = createSpraySystem(mobile, gl.getPixelRatio());
     const wake = createWakeField(mobile);
     const surface = createInteractiveSurface(FLOOR_Y);
     // Same gate scale factor as the bottle root below (desktop only) so the
     // lifted cap apex stays below the header nav row.
     const capUnit = bottle.unit * (compact ? 0.75 : CAMERA.bottleScale);
     const capSpring = createCapSpring(bottle.cap, capUnit);
     const atomizer = createAtomizerSpring(bottle.push, bottle.unit);
     const fluid = createFluidPhysics();
     return { bottle, spray, wake, surface, capSpring, atomizer, fluid };
   }, [mobile, gl, compact]);

   // --- scene assembly, environment probe, disposal -------------------------
   // The whole rig (bottle + pool + surface + wake + spray) lives in an
   // anchored group so the full-bleed camera can place it off-center while
   useEffect(() => {
     const { bottle, spray, wake, surface } = rig;
     const anchor = new THREE.Group();
     anchor.name = "MiskovaAnchor";
     anchorRef.current = anchor;
    const offset = compact ? CAMERA.groupOffsetCompact : CAMERA.groupOffset;
    anchor.position.set(offset[0], offset[1], offset[2]);
    // Gate fix: shrink the model so the glass body clears the price/CTA
    // column on desktop. The pool reads as the bottle's contact shadow and
    // the surface as its reactive pedestal, sized so the full ellipse (soft
    // rim included) stays inside the 1440 canvas. On compact the anchor sits
    // high-right at near camera height, which would render the floor discs
    // edge-on as a hairline — the compact hero presents the bottle floating
    // in mist with no pedestal instead. Spray + wake stay unscaled so the
    // plume still crosses the full banner.
    const s = compact ? 0.75 : CAMERA.bottleScale;
    bottle.root.scale.setScalar(s);
    if (compact) {
      anchor.add(bottle.root, spray.points, wake.group);
    } else {
      floorPool.mesh.scale.setScalar(s * 0.52);
      surface.mesh.scale.setScalar(s * 0.82);
      anchor.add(bottle.root, spray.points, wake.group, surface.mesh, floorPool.mesh);
    }
    let environment: { texture: THREE.Texture; dispose: () => void } | null = null;
    try {
      scene.add(anchor);
       environment = createStudioEnvironment(gl);
       scene.environment = environment.texture;
       journey.ready = true;
       journey.failed = false;
       onReady();
       if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
         Reflect.set(window, "__miskova", { ...rig, anchor, scene, gl, camera, THREE });
       }
     } catch (error) {
       journey.failed = true;
       onFail(error);
     }
     return () => {
       scene.remove(anchor);
       anchor.remove(bottle.root, spray.points, wake.group, surface.mesh, floorPool.mesh);
       anchorRef.current = null;
       scene.environment = null;
       environment?.dispose();
       bottle.dispose();
       spray.dispose();
       wake.dispose();
       surface.dispose();
       floorPool.dispose();
       journey.ready = false;
       if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") Reflect.deleteProperty(window, "__miskova");
     };
   }, [rig, scene, gl, camera, floorPool, compact, onReady, onFail]);

  useEffect(() => {
    const position = compact ? CAMERA.compact : CAMERA.desktop;
    const target = compact ? CAMERA.targetCompact : CAMERA.target;
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(target[0], target[1], target[2]);
    // Compact dolly-in (6.9 → 6.2) grows the projection ~11% so the product
    // reads at a glance on phones, paired with a brighter compact-only
    // exposure + frontal fill light: the dark studio key rig was authored
    // around the desktop anchor and underexposes the tighter phone frame.
    // Desktop keeps the approved 0.82 exposure untouched.
    gl.toneMappingExposure = compact ? 1.02 : 0.82;
    invalidate();
  }, [camera, compact, gl, invalidate]);

   // --- pointer parallax + mesh picking -------------------------------------
   // Pointer moves are read from the HERO SECTION (the R3F eventSource owns the
   // canvas listeners; `host` is the full-bleed wrapper). Mesh picking listens
   // on the event source too, since the canvas itself is pointer-transparent.
   useEffect(() => {
     const source = eventSource ?? host;
     if (!source) return;
     const canvas = gl.domElement;
    let interactionRaf: number | null = null;
    const triggerInteractionLoop = (durationMs = 1200) => {
      if (interactionRaf !== null) {
        cancelAnimationFrame(interactionRaf);
      }
      const start = performance.now();
      const step = () => {
        invalidate();
        if (performance.now() - start < durationMs) {
          interactionRaf = requestAnimationFrame(step);
        } else {
          interactionRaf = null;
        }
      };
      step();
    };

     const handleMove = (event: PointerEvent) => {
       if (reduceMotion || event.pointerType === "touch") return;
       const rect = source.getBoundingClientRect();
      setPointer(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
      invalidate();
    };
    const handleLeave = () => {
      clearPointer();
      invalidate();
    };

     const raycaster = new THREE.Raycaster();
     const ndc = new THREE.Vector2();
     const handleDown = (event: PointerEvent) => {
       const { bottle, capSpring, atomizer } = rig;
       const rect = canvas.getBoundingClientRect();
       ndc.set(
         ((event.clientX - rect.left) / rect.width) * 2 - 1,
         -(((event.clientY - rect.top) / rect.height) * 2 - 1),
       );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects([bottle.push, bottle.cap, bottle.glass], true)[0]?.object;
      if (!hit) return;
      if (capSpring.progress < 0.78) {
        liftCap();
        triggerInteractionLoop();
      } else if (hit === bottle.push || isDescendant(hit, bottle.collar)) {
        if (reduceMotion) pressAtomizer();
        else atomizer.press();
        triggerInteractionLoop();
      } else {
        invalidate();
      }
    };

     source.addEventListener("pointermove", handleMove, { passive: true });
     source.addEventListener("pointerleave", handleLeave);
     source.addEventListener("pointerdown", handleDown);
     return () => {
       if (interactionRaf !== null) {
         cancelAnimationFrame(interactionRaf);
       }
       source.removeEventListener("pointermove", handleMove);
       source.removeEventListener("pointerleave", handleLeave);
       source.removeEventListener("pointerdown", handleDown);
     };
   }, [host, eventSource, gl, camera, rig, reduceMotion, invalidate]);

  // --- frame loop ----------------------------------------------------------
  const scratchOrigin = useMemo(() => new THREE.Vector3(), []);
  const scratchDirection = useMemo(() => new THREE.Vector3(), []);
  const scratchPoint = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(performance.now());
  const lastDpr = useRef(gl.getPixelRatio());
  const introTime = useRef(0);
  const burstFlash = useRef(0);
  const scentLevel = useRef(0);
  const wakeEnergy = useRef(0);
  const lastPointer = useRef({ x: 0, y: 0 });
  const smoothPointer = useRef({ x: 0, y: 0 });
  const smoothProgress = useRef(0);
  const velocity = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const { bottle, spray, wake, surface, capSpring, atomizer, fluid } = rig;
    const now = performance.now();
    const dt = reduceMotion ? 0 : Math.min(0.05, Math.max(0.001, (now - last.current) / 1000));
    last.current = now;

    const dpr = gl.getPixelRatio();
    if (dpr !== lastDpr.current) {
      lastDpr.current = dpr;
      spray.setPixelRatio(dpr);
    }

    const damping = 1 - Math.pow(8e-4, dt);
    smoothPointer.current.x += (journey.pointerTargetX - smoothPointer.current.x) * damping;
    smoothPointer.current.y += (journey.pointerTargetY - smoothPointer.current.y) * damping;
    smoothProgress.current += (journey.rawProgress - smoothProgress.current) * damping * 0.72;

    if (dt > 0) {
      velocity.current.x +=
        ((smoothPointer.current.x - lastPointer.current.x) / dt - velocity.current.x) * damping * 0.25;
      velocity.current.y +=
        ((smoothPointer.current.y - lastPointer.current.y) / dt - velocity.current.y) * damping * 0.25;
      velocity.current.x *= Math.pow(0.08, dt);
      velocity.current.y *= Math.pow(0.08, dt);
    }
    lastPointer.current.x = smoothPointer.current.x;
    lastPointer.current.y = smoothPointer.current.y;

    const chapters = computeChapters(smoothProgress.current);

    // Intro glint
    introTime.current += dt;
    const introBloom = smoothstep(0.18, 0.72, introTime.current) * (1 - smoothstep(1.05, 2.35, introTime.current));
    const introProgress = clamp((introTime.current - 0.18) / 1.9, 0, 1);

    const swing = smoothstep(0.08, 0.48, chapters.progress) * 0.17 - smoothstep(0.5, 0.94, chapters.progress) * 0.23;
    const root = bottle.root;
    root.rotation.x = smoothPointer.current.y * POINTER_PARALLAX.rotationX;
    root.rotation.y = swing - smoothPointer.current.x * POINTER_PARALLAX.rotationY;
    root.rotation.z = Math.sin(chapters.progress * Math.PI) * -0.008;
    root.position.x = smoothPointer.current.x * POINTER_PARALLAX.positionX + swing * 0.06;
    root.position.y = -smoothPointer.current.y * POINTER_PARALLAX.positionY;

    // Material sweep along the body facets
    const sweepCenter = 0.35 + smoothstep(0.20, 0.75, chapters.progress) * 0.40;
    const sweepStrength = Math.max(chapters.materialSweep * 0.95, introBloom * 0.48);
    const sweepUniforms = bottle.materials.glass.userData.sweep;
    if (sweepUniforms) {
      sweepUniforms.uSweepCenter.value = sweepCenter;
      sweepUniforms.uSweepStrength.value = sweepStrength;
      sweepUniforms.uSweepPhase.value = now * 0.0018 + chapters.progress * 8;
      sweepUniforms.uSweepBloom.value = introBloom;
    }

    // Cap spring controller
    const capTarget = Math.max(chapters.capOpen, journey.capForced ? 1 : 0);
    capSpring.setTarget(capTarget, reduceMotion);
    capSpring.update(dt);
    setLabel(
      capSpring.progress < 0.78 ? "Lift the cap" : "Press the atomizer",
      capSpring.progress < 0.78 ? "cap" : "atomizer",
    );

    // Atomizer mechanism + Spray Plume
    if (journey.pressRequested) {
      journey.pressRequested = false;
      if (reduceMotion) {
        scentLevel.current = Math.max(scentLevel.current, 0.85);
        surface.triggerSprayImpulse();
        fluid.triggerSprayImpulse();
      } else {
        atomizer.press();
      }
    }
    atomizer.update(dt);
    if (atomizer.consumeBurst()) {
      burstFlash.current = 1.0;
      introTime.current = 0;
      scentLevel.current = 0.88;
      surface.triggerSprayImpulse();
      fluid.triggerSprayImpulse();
       scene.updateMatrixWorld(true);
       bottle.aim.getWorldPosition(scratchOrigin);
       // Full-bleed hero: the atomizer fires screen-left across the whole
       // banner. The spray Points live inside the bottle anchor group, so the
       // jet is authored in ANCHOR-LOCAL space: local -x reads as screen-left
       // (the camera looks straight down -z at the anchor).
       anchorRef.current?.worldToLocal(scratchOrigin);
       scratchDirection.set(-1.0, 0.06, 0.05).normalize();
       spray.emit(scratchOrigin, scratchDirection);
    }
    burstFlash.current *= Math.pow(0.045, dt);
    scentLevel.current = Math.max(chapters.fieldEnergy * 0.58, scentLevel.current * Math.exp(-0.19 * dt));
    wakeEnergy.current += (scentLevel.current - wakeEnergy.current) * (1 - Math.pow(0.018, dt));
    const wakeIntensity = clamp(wakeEnergy.current + chapters.atmosphere * 0.2 + introBloom * 0.2, 0, 1);

    const pointerSpeed = Math.sqrt(velocity.current.x * velocity.current.x + velocity.current.y * velocity.current.y);

    // Fluid slosh physics simulation (inertia from mouse velocity + rotation + tilt)
    const externalAccX = velocity.current.x * 0.07;
    const externalAccZ = velocity.current.y * 0.07;
    fluid.update(dt, externalAccX, externalAccZ, root.rotation.x, root.rotation.y);
    const sloshUniforms = bottle.materials.juice.userData.slosh;
    if (sloshUniforms) {
      const fluidState = fluid.getState();
      sloshUniforms.uSloshX.value = fluidState.sloshAngleX;
      sloshUniforms.uSloshZ.value = fluidState.sloshAngleZ;
      sloshUniforms.uSloshPhase.value = fluidState.wavePhase;
      sloshUniforms.uSloshEnergy.value = reduceMotion ? 0 : fluidState.energy;
    }

    // Update the reactive platform surface with physical ripples
    surface.update({
      time: now * 0.001,
      delta: dt,
      pointerX: smoothPointer.current.x,
      pointerY: smoothPointer.current.y,
      pointerVelocity: pointerSpeed,
      sprayActive: burstFlash.current > 0.05,
      darkProgress: chapters.atmosphere,
    });
    spray.update({
      time: now * 0.001,
      delta: dt,
      pointerVelocityX: clamp(velocity.current.x, -12, 12),
      pointerVelocityY: clamp(velocity.current.y, -12, 12),
    });

    wake.update({
      time: reduceMotion ? 2.4 : now * 0.001,
      energy: wakeIntensity,
      absorption: chapters.atmosphere,
      bloom: introBloom,
      bloomProgress: introProgress,
      pointerX: smoothPointer.current.x,
      pointerY: smoothPointer.current.y,
      velocityX: clamp(velocity.current.x, -12, 12),
      velocityY: clamp(velocity.current.y, -12, 12),
    });

    // Soft Luxury Studio Lighting
    const reveal = 1 - chapters.product;
    const sweep = chapters.materialSweep;
    const travel = smoothstep(0.04, 0.96, chapters.progress);

    if (keyLight.current) {
      keyLight.current.position.set(-2.8 + travel * 0.5, 3.8 + travel * 0.2, 2.8 - travel * 0.4);
      keyLight.current.intensity = 2.2 + reveal * 0.4 - chapters.atmosphere * 0.6;
    }
    if (fillLight.current) {
      fillLight.current.position.set(2.4 - travel * 0.4, 1.4 + Math.sin(travel * Math.PI) * 0.2, 1.8);
      fillLight.current.intensity = 1.4 + reveal * 0.3 - chapters.atmosphere * 0.4;
    }
    if (rimLight.current) {
      rimLight.current.position.set(-2.2 + Math.sin(travel * Math.PI * 0.8) * 0.4, 1.2, -2.2);
      rimLight.current.intensity = 2.6 + reveal * 0.5;
    }
    if (glintLight.current) {
      glintLight.current.position.set(0.25 + Math.sin(travel * Math.PI * 1.2) * 0.3, 3.2, 0.5);
      glintLight.current.intensity = 1.6 + reveal * 0.4;
    }
    if (sweepLight.current) {
      bottle.body.localToWorld(scratchPoint.set(0, sweepCenter * bottle.glassLocalHeight, 0.1));
      scratchPoint.y = Math.max(scratchPoint.y, FLOOR_Y + 0.35);
      sweepLight.current.position.copy(scratchPoint);
      sweepLight.current.intensity = sweep * 0.75 + introBloom * 1.2;
    }
    if (burstLight.current) {
      bottle.aim.getWorldPosition(scratchPoint);
      burstLight.current.position.copy(scratchPoint);
      burstLight.current.intensity = sweep * 0.2 + burstFlash.current * 2.4 + introBloom * 0.35;
    }

    // Fog drifts with the journey mood; the canvas itself stays transparent so
    // the hero mist shader and page texture show through around the bottle.
    const fog = scene.fog;
    if (fog instanceof THREE.FogExp2) {
      fog.color.copy(BG_BASE).lerp(BG_WARM, reveal * 0.45);
      fog.color.lerp(BG_NIGHT, chapters.atmosphere * 0.85);
      fog.color.offsetHSL(-0.012 * introBloom, 0.05 * introBloom, -0.025 * introBloom);
    }
  });

   return (
     <>
       <fogExp2 attach="fog" args={[BG_BASE.getHex(), 0.03]} />
       {/* Luxury studio lighting + crystal facet glint light */}
       <directionalLight ref={keyLight} position={[-2.6, 3.2, 2.6]} color="#fff8ee" intensity={2.4} />
       <directionalLight ref={fillLight} position={[2.6, 1.8, 2.0]} color="#f4eee4" intensity={1.6} />
       <directionalLight ref={rimLight} position={[-2.0, 1.2, -2.4]} color="#e3c98a" intensity={2.8} />
       <directionalLight ref={glintLight} position={[0.0, 2.6, 2.2]} color="#ffffff" intensity={2.0} />
       <pointLight ref={sweepLight} color="#fff4dc" distance={3.5} decay={2} intensity={0} />
       <pointLight ref={burstLight} color="#ffdfb0" distance={2.8} decay={2} intensity={0} />

       {/* Grounding contact shadow under heavy chamfered crystal glass base */}
      {/* Compact-only frontal fill: the phone frame sits farther out while the
          world-space key rig was authored around the desktop anchor, so the
          label and juice underexpose. A soft camera-axis fill lifts the plaque
          and the amber glow without blowing out the gold. No extra light on
          desktop. */}
      {compact && <directionalLight position={[1.1, 2.3, 5.4]} color="#fff1da" intensity={1.3} />}
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.002, 0]}>
         <circleGeometry args={[1.9, 48]} />
         <meshBasicMaterial color="#221810" transparent opacity={0.26} depthWrite={false} />
       </mesh>
     </>
   );
 }

 /**
  * The luxury interactive 3D hero stage — full-bleed.
  *
  * Layout contract (see Hero.tsx): the wrapper covers the ENTIRE hero section
  * (absolute inset-0, z-[3]) with a transparent R3F canvas whose pointer events
  * are disabled; R3F listens on the hero section element via `eventSource`, so
  * pointer ripples + parallax work from moves anywhere over the hero while
  * buttons above the canvas stay clickable and the page scrolls normally.
  */
 type BottleStageProps = {
   className?: string;
   eventSourceRef?: RefObject<HTMLElement | null>;
 };
 export default function BottleStage({ className = "", eventSourceRef }: BottleStageProps) {
   const hostRef = useRef<HTMLDivElement>(null);
   const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [mobile, setMobile] = useState(false);
  const [compact, setCompact] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [webglAllowed, setWebglAllowed] = useState(true);
  const [control, setControl] = useState({ label: "Preparing the bottle", state: "loading" });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const invalidateRef = useRef<() => void>(() => {});

   useEffect(() => setHost(hostRef.current), []);
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const compactQuery = window.matchMedia("(max-width: 1024px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setMobile(mobileQuery.matches);
      setCompact(compactQuery.matches);
      setReduceMotion(motionQuery.matches);
      const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
          ?.saveData === true;
      // No width floor: the compact presentation is verified to 320 (the exact
      // viewport Chrome's device emulation opens with) — a floor here silently
      // disabled the stage on phones users preview first.
      let noWebGL = false;
      try {
        const canvas = document.createElement("canvas");
        noWebGL = !canvas.getContext("webgl2") && !canvas.getContext("webgl");
      } catch {
        noWebGL = true;
      }
      setWebglAllowed(!motionQuery.matches && !saveData && !noWebGL);
    };
    sync();
    mobileQuery.addEventListener("change", sync);
    compactQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mobileQuery.removeEventListener("change", sync);
      compactQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  useEffect(() => {
    journey.onLabel = (label, state) => setControl({ label, state });
    return () => {
      journey.onLabel = null;
    };
  }, []);
  // Eager first-paint mount: the canvas renders immediately on load (LCP hit
  // accepted). Only the render loop pauses when the stage is offscreen or the
  // tab is hidden, so no WebGL work runs after the hero leaves the viewport.
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    let onScreen = true;
    const publish = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        publish();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", publish);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", publish);
    };
  }, [host]);

  useEffect(() => {
    if (!reduceMotion && !mobile) return;
    const onScroll = () => invalidateRef.current();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion, mobile]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleFail = useCallback((error: unknown) => {
    console.error("Unable to load the Miskova bottle scene", error);
    setFailed(true);
  }, []);

  const controlRafRef = useRef<number | null>(null);
  const triggerControlLoop = useCallback((durationMs = 1200) => {
    if (controlRafRef.current !== null) {
      cancelAnimationFrame(controlRafRef.current);
    }
    const start = performance.now();
    const step = () => {
      invalidateRef.current();
      if (performance.now() - start < durationMs) {
        controlRafRef.current = requestAnimationFrame(step);
      } else {
        controlRafRef.current = null;
      }
    };
    step();
  }, []);
   const handleControl = () => {
     if (control.state === "cap") {
       liftCap();
       triggerControlLoop();
     } else if (control.state === "atomizer") {
       pressAtomizer();
       triggerControlLoop();
     } else {
       invalidateRef.current();
     }
   };

   useEffect(() => {
     return () => {
       if (controlRafRef.current !== null) {
         cancelAnimationFrame(controlRafRef.current);
       }
     };
   }, []);
   // Offscreen/hidden-tab pause only. Mobile renders on demand; desktop renders
   // continuously. The canvas mounts eagerly on first paint (LCP hit accepted).
   const frameloop = !visible ? "never" : reduceMotion || mobile ? "demand" : "always";
   const shouldMount = host !== null && webglAllowed && !failed;
   // R3F attaches its pointer listeners to the hero section when provided;
   // falls back to its own wrapper div (pre-merge behavior) otherwise.
   const eventSource = eventSourceRef?.current ?? host;
   return (
     <div
       ref={hostRef}
       className={`bottleStage ${className}`}
       data-ready={ready ? "true" : "false"}
       data-error={failed ? "true" : "false"}
     >
       {shouldMount ? (
         <Canvas
           className="bottleStage__surface"
           frameloop={frameloop}
           dpr={mobile ? [1, 1] : [1, 1.5]}
           gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
           eventSource={eventSource ?? undefined}
           camera={{
             fov: CAMERA.fov,
             near: CAMERA.near,
             far: CAMERA.far,
             position: CAMERA.desktop,
           }}
           onCreated={({ gl, invalidate }) => {
             gl.toneMapping = THREE.ACESFilmicToneMapping;
             gl.toneMappingExposure = 0.82;
             invalidateRef.current = invalidate;
           }}
         >
           <StageContents
             host={host}
             eventSource={eventSource}
             mobile={mobile}
            compact={compact}
            reduceMotion={reduceMotion}
            onReady={handleReady}
            onFail={handleFail}
          />
        </Canvas>
      ) : (
        <div className="bottleStage__stageFallback" role="status">
          <div className="bottleStage__stageFallbackMonogram" aria-hidden="true">
            M
          </div>
          <span className="bottleStage__stageFallbackWord">Miskova</span>
        </div>
      )}
      <button
        className="bottleStage__control"
        type="button"
        data-state={control.state}
        onClick={handleControl}
      >
        {control.label}
      </button>
      {shouldMount && !ready && (
        <div className="bottleStage__loading" role="status" aria-live="polite">
          <span aria-hidden="true" />
          Preparing the bottle
        </div>
      )}
      <p className="bottleStage__error">
        The 3D composition could not be loaded. The chapters are still available below.
      </p>
    </div>
  );
}
