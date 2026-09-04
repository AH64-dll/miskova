import * as THREE from "three";

/**
 * Interactive Reactive Platform / Surface beneath the Miskova Perfume Bottle.
 *
 * Physical properties:
 * - Sits stably directly beneath the bottle at y = FLOOR_Y.
 * - Simulates physical fluid / pedestal wave ripples that propagate outward
 *   when the pointer hovers/moves or when the perfume atomizer sprays.
 * - Provides realistic contact grounding and caustics without warped vertical shadow stretching.
 */

const surfaceVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerEnergy;
  uniform float uSprayImpulse;
  uniform vec2 uSprayOrigin;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vRipple;

  void main() {
    vUv = uv;
    vec3 transformed = position;

    // Center distance
    float dist = length(uv - 0.5) * 2.0;

    // 1. Ambient gentle fluid breathing waves
    float wave1 = sin(dist * 12.0 - uTime * 2.2) * 0.008 * (1.0 - smoothstep(0.0, 1.0, dist));
    float wave2 = cos(uv.x * 16.0 + uv.y * 14.0 + uTime * 1.6) * 0.004;

    // 2. Interactive pointer wave propagation
    float pointerDist = length(uv - (uPointer * 0.35 + 0.5));
    float pointerRipple = sin(pointerDist * 28.0 - uTime * 5.0) * exp(-pointerDist * 6.0) * uPointerEnergy * 0.022;

    // 3. Atomizer spray kinetic ripple disturbance
    float sprayDist = length(uv - (uSprayOrigin * 0.35 + 0.5));
    float sprayRipple = sin(sprayDist * 36.0 - uTime * 7.5) * exp(-sprayDist * 4.5) * uSprayImpulse * 0.035;

    float totalDisplacement = (wave1 + wave2 + pointerRipple + sprayRipple) * smoothstep(1.1, 0.15, dist);
    transformed.z += totalDisplacement;
    vRipple = totalDisplacement;

    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const surfaceFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorBase;
  uniform vec3 uColorGlow;
  uniform vec3 uColorDeep;
  uniform float uDarkTransition;
  uniform float uContactOcclusion;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vRipple;

  void main() {
    float dist = length(vUv - 0.5) * 2.0;
    if (dist > 1.0) discard;

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    
    // Normal perturbation from ripples
    vec3 n = normalize(vNormalW);
    n.x += sin(vUv.x * 40.0 + uTime * 3.0) * vRipple * 12.0;
    n.y += cos(vUv.y * 40.0 + uTime * 3.0) * vRipple * 12.0;
    n = normalize(n);

    // Fresnel reflection
    float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 2.5);

    // Subtle caustics lines
    float caustic1 = sin(vUv.x * 35.0 + sin(vUv.y * 25.0 + uTime * 1.2) * 2.5 + uTime * 0.8);
    float caustic2 = cos(vUv.y * 30.0 + cos(vUv.x * 30.0 + uTime * 1.5) * 2.5 - uTime * 0.9);
    float caustics = pow(max(0.0, (caustic1 + caustic2) * 0.5), 4.0) * 0.28;

    // Contact shadow mask directly under bottle base (no downward stretching)
    float bottleFootprint = smoothstep(0.0, 0.45, dist);
    float contactShadow = mix(0.18, 1.0, bottleFootprint);

    // Color mixing: mineral ivory pedestal transitioning with chapter progress
    vec3 baseColor = mix(uColorBase, uColorDeep, uDarkTransition * 0.82);
    vec3 color = mix(baseColor, uColorGlow, fresnel * 0.55 + caustics * (1.0 - uDarkTransition * 0.5));
    color *= contactShadow;

    // Soft radial edge fade
    float alpha = smoothstep(1.0, 0.75, dist) * (0.88 + fresnel * 0.12);

    gl_FragColor = vec4(color, alpha);
  }
`;

export type InteractiveSurface = {
  mesh: THREE.Mesh;
  update: (params: {
    time: number;
    delta: number;
    pointerX: number;
    pointerY: number;
    pointerVelocity: number;
    sprayActive: boolean;
    darkProgress: number;
  }) => void;
  triggerSprayImpulse: () => void;
  dispose: () => void;
};

export function createInteractiveSurface(floorY: number): InteractiveSurface {
  const radius = 2.4;
  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, 96, 96);
  geometry.rotateX(-Math.PI / 2); // Lay flat on the horizontal XZ plane

  const material = new THREE.ShaderMaterial({
    vertexShader: surfaceVertexShader,
    fragmentShader: surfaceFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerEnergy: { value: 0 },
      uSprayImpulse: { value: 0 },
      uSprayOrigin: { value: new THREE.Vector2(0.2, 0.0) },
      uColorBase: { value: new THREE.Color("#f1ebe1") },
      uColorGlow: { value: new THREE.Color("#fef8ec") },
      uColorDeep: { value: new THREE.Color("#18201a") },
      uDarkTransition: { value: 0 },
      uContactOcclusion: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "InteractivePlatformSurface";
  mesh.position.set(0, floorY + 0.001, 0);
  mesh.renderOrder = 1;

  let pointerEnergy = 0;
  let sprayImpulse = 0;

  return {
    mesh,
    update: ({ time, delta, pointerX, pointerY, pointerVelocity, darkProgress }) => {
      pointerEnergy += (pointerVelocity * 0.45 - pointerEnergy) * Math.min(1, delta * 6.0);
      sprayImpulse *= Math.exp(-3.5 * delta);

      material.uniforms.uTime.value = time;
      (material.uniforms.uPointer.value as THREE.Vector2).set(pointerX, pointerY);
      material.uniforms.uPointerEnergy.value = Math.min(1.2, pointerEnergy);
      material.uniforms.uSprayImpulse.value = sprayImpulse;
      material.uniforms.uDarkTransition.value = darkProgress;
    },
    triggerSprayImpulse: () => {
      sprayImpulse = 1.0;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
