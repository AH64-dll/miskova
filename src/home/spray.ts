import * as THREE from "three";

/**
 * Ultra-Realistic Luxury Perfume Atomizer Mist Plume.
 *
 * Physical simulation:
 * - 1,200 micro-particles (desktop) / 600 (mobile).
 * - High-speed pressurized conical jet emerging from the nozzle.
 * - Heavy aerodynamic air drag turning the forward jet into a soft billowing vapor cloud.
 * - Upward thermal buoyancy + curl noise vortex turbulence.
 * - Soft Gaussian point disc with optical sparkle, golden amber color grading, and realistic evaporation decay.
 */

const vertexShader = /* glsl */ `
  attribute float aAge;
  attribute float aLifetime;
  attribute float aSize;
  attribute float aSeed;
  attribute float aMist;
  attribute float aSpeed;

  uniform float uPixelRatio;
  uniform float uTime;

  varying float vAge;
  varying float vLifetime;
  varying float vSeed;
  varying float vMist;
  varying float vSparkle;

  void main() {
    vAge = aAge;
    vLifetime = aLifetime;
    vSeed = aSeed;
    vMist = aMist;

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

    // Fast soft emergence
    float appear = smoothstep(0.0, 0.04, aAge);
    
    // Smooth evaporation fade
    float fadeStart = mix(0.55, 0.75, aMist);
    float fade = 1.0 - smoothstep(fadeStart * aLifetime, aLifetime, aAge);

    // Conical mist cloud volumetric expansion
    float expansion = mix(1.0, 3.2 + aMist * 1.8, smoothstep(0.06, 0.85, aAge / aLifetime));

    // Distance perspective scaling
    float perspective = 2.6 / max(0.35, -viewPosition.z);

    // Sparkle flicker at 24 Hz
    vSparkle = sin(uTime * 24.0 + aSeed * 62.0) * 0.5 + 0.5;

    gl_PointSize = aSize * uPixelRatio * appear * fade * expansion * perspective;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAge;
  varying float vLifetime;
  varying float vSeed;
  varying float vMist;
  varying float vSparkle;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radius = length(centered);

    // Ultra-soft micro-droplet Gaussian density profile
    float dropletDisc = exp(-radius * radius * 18.0) * (1.0 - smoothstep(0.35, 0.5, radius));
    float vaporDisc = exp(-radius * radius * 10.0) * (1.0 - smoothstep(0.42, 0.5, radius));
    float disc = mix(dropletDisc, vaporDisc, vMist);

    float core = exp(-radius * radius * 32.0);

    float normAge = vAge / vLifetime;
    float appear = smoothstep(0.0, 0.03, vAge);
    float fade = 1.0 - smoothstep(0.60, 1.0, normAge);
    float ignition = exp(-normAge * 8.0);

     // Warm golden-hour mist — amber core dissolving into a champagne veil.
     // Stays luminous against both the light mist band and the dark floor.
     vec3 coreAmber     = vec3(0.98, 0.80, 0.52);
     vec3 aerosolHeart = vec3(0.94, 0.70, 0.42);
     vec3 crimsonVeil  = vec3(0.82, 0.55, 0.32);

     vec3 color = mix(coreAmber, aerosolHeart, smoothstep(0.03, 0.28, normAge));
     color = mix(color, crimsonVeil, smoothstep(0.25, 0.85, normAge) * (0.65 + fract(vSeed * 3.1) * 0.35));

     // Core burst intensity + optical sparkle twinkle
     color += aerosolHeart * ignition * 0.55;
     color += aerosolHeart * (vSparkle * 0.22 * (1.0 - normAge));
     float baseOpacity = mix(0.30, 0.16, vMist);
     float alpha = disc * appear * fade * (baseOpacity + ignition * 0.22 + core * 0.12);
    
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export type SpraySystem = {
  points: THREE.Points;
  emit: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
  update: (params: { time: number; delta: number; pointerVelocityX: number; pointerVelocityY: number }) => void;
  setPixelRatio: (value: number) => void;
  dispose: () => void;
};

export function createSpraySystem(mobile: boolean, pixelRatio: number): SpraySystem {
  const capacity = mobile ? 1200 : 2400;
  const emitCount = mobile ? 600 : 1100;

  const positions = new Float32Array(capacity * 3);
  const velocities = new Float32Array(capacity * 3);
  const ages = new Float32Array(capacity);
  const lifetimes = new Float32Array(capacity);
  const sizes = new Float32Array(capacity);
  const seeds = new Float32Array(capacity);
  const mists = new Float32Array(capacity);
  const speeds = new Float32Array(capacity);

  let cursor = 0;
  for (let i = 0; i < capacity; i++) {
    ages[i] = -1;
    lifetimes[i] = 1;
    seeds[i] = Math.random();
    positions[i * 3 + 1] = -100;
  }

  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const ageAttr = new THREE.BufferAttribute(ages, 1);
  const lifeAttr = new THREE.BufferAttribute(lifetimes, 1);
  const sizeAttr = new THREE.BufferAttribute(sizes, 1);
  const seedAttr = new THREE.BufferAttribute(seeds, 1);
  const mistAttr = new THREE.BufferAttribute(mists, 1);
  const speedAttr = new THREE.BufferAttribute(speeds, 1);

  geometry.setAttribute("position", posAttr);
  geometry.setAttribute("aAge", ageAttr);
  geometry.setAttribute("aLifetime", lifeAttr);
  geometry.setAttribute("aSize", sizeAttr);
  geometry.setAttribute("aSeed", seedAttr);
  geometry.setAttribute("aMist", mistAttr);
  geometry.setAttribute("aSpeed", speedAttr);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPixelRatio: { value: pixelRatio },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: true,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "MiskovaSprayMist";
  points.frustumCulled = false;
  points.renderOrder = 14;

  const flush = () => {
    posAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    mistAttr.needsUpdate = true;
  };

  return {
    points,
    emit: (origin, direction) => {
      // Create orthogonal basis for conical dispersion
      const forward = direction.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const actualUp = new THREE.Vector3().crossVectors(right, forward).normalize();

      for (let i = 0; i < emitCount; i++) {
        const index = cursor;
        cursor = (cursor + 1) % capacity;
        const p = index * 3;

         const isVapor = i % 3 === 0 || Math.random() < 0.35;
         // Full-bleed hero: faster jet so mist visibly crosses the banner width.
         const speed = isVapor ? 5.4 + Math.random() * 3.4 : 7.2 + Math.random() * 3.6;
        // Tight conical spray cone (~14 degrees)
        const coneAngle = (Math.random() * 0.14 + (isVapor ? 0.06 : 0.015)) * Math.PI;
        const radialAngle = Math.random() * Math.PI * 2.0;
        const spreadRadius = Math.sin(coneAngle);
        const sprayDir = forward.clone()
          .addScaledVector(right, Math.cos(radialAngle) * spreadRadius)
          .addScaledVector(actualUp, Math.sin(radialAngle) * spreadRadius)
          .normalize();

        // Initial offset at nozzle tip
        const nozzleOffset = Math.random() * 0.025;
        positions[p]     = origin.x + forward.x * nozzleOffset;
        positions[p + 1] = origin.y + forward.y * nozzleOffset;
        positions[p + 2] = origin.z + forward.z * nozzleOffset;

        velocities[p]     = sprayDir.x * speed;
        velocities[p + 1] = sprayDir.y * speed;
        velocities[p + 2] = sprayDir.z * speed;

        ages[index] = 0.001 + Math.random() * 0.015;
        lifetimes[index] = isVapor ? 3.2 + Math.random() * 2.2 : 2.2 + Math.random() * 1.6;
        sizes[index] = isVapor ? 38 + Math.random() * 42 : 18 + Math.random() * 24;
        mists[index] = isVapor ? 1.0 : 0.0;
        speeds[index] = speed;
      }
      flush();
    },
    update: ({ time, delta, pointerVelocityX, pointerVelocityY }) => {
      material.uniforms.uTime.value = time;
      const step = Math.min(0.05, Math.max(0, delta));
      let dirty = false;

      for (let i = 0; i < capacity; i++) {
        if (ages[i] < 0) continue;
        const p = i * 3;
        ages[i] += step;

        if (ages[i] >= lifetimes[i]) {
          ages[i] = -1;
          positions[p + 1] = -100;
          dirty = true;
          continue;
        }

        const age = ages[i];
        const seed = seeds[i] * 24.5;
        
         // Aerodynamic air drag deceleration: initial high speed rapidly slows
         // into a soft floating cloud. Full-bleed: lighter mid-flight drag so
         // the plume travels across the hero, plus a steady screen-left (-x)
         // drift so the burst sweeps over the headline side.
         const drag = age < 0.15 ? 5.2 : age < 1.1 ? 1.7 : 1.1;
         const dragDecay = Math.exp(-drag * step);

         velocities[p] *= dragDecay;
         velocities[p + 1] *= dragDecay;
         velocities[p + 2] *= dragDecay;

         // Upward thermal buoyancy + gentle 3D vortex turbulence, plus a steady
         // screen-left (-x) drift so the burst sweeps across the whole banner.
         const turbulence = Math.min(1.0, age * 1.8);
         velocities[p] += (-0.85 - mists[i] * 0.55) * step; // hero-wide drift
         velocities[p + 1] += (0.09 + mists[i] * 0.055) * step; // buoyant rise
         velocities[p] += Math.sin(time * 2.5 + seed) * 0.18 * turbulence * step;
         velocities[p + 1] += Math.cos(time * 2.0 + seed * 1.4) * 0.14 * turbulence * step;
         velocities[p + 2] += Math.sin(time * 2.2 + seed * 1.1) * 0.2 * turbulence * step;

         // Pointer air current displacement
         velocities[p] += pointerVelocityX * 0.0045 * turbulence * step;
         velocities[p + 1] -= pointerVelocityY * 0.0035 * turbulence * step;

        positions[p]     += velocities[p] * step;
        positions[p + 1] += velocities[p + 1] * step;
        positions[p + 2] += velocities[p + 2] * step;
        dirty = true;
      }

      if (dirty) {
        posAttr.needsUpdate = true;
        ageAttr.needsUpdate = true;
      }
    },
    setPixelRatio: (value) => {
      material.uniforms.uPixelRatio.value = value;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
