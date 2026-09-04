import * as THREE from "three";

/**
 * Botanical Wake — the signature Miskova scent visualisation.
 *
 * Four curved ribbons are deformed in the vertex shader by longitudinal waves,
 * a pointer wake depression and a travelling bloom ring, then shaded with a
 * 4-octave FBM flow so the plume reads as moving air rather than a texture.
 * Energy arrives from the atomizer burst; absorption darkens and contracts the
 * field as the chapter settles into the dry-down.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAbsorption;
  uniform float uBloom;
  uniform float uBloomProgress;
  uniform float uSeed;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;

  varying vec2 vUv;
  varying float vFold;
  varying float vDepth;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  float ease(float value) {
    return value * value * (3.0 - 2.0 * value);
  }

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float energy = ease(clamp(uEnergy, 0.0, 1.0));
    float absorption = ease(clamp(uAbsorption, 0.0, 1.0));
    float bloom = ease(clamp(uBloom, 0.0, 1.0));
    float phase = uTime * (0.24 + uSeed * 0.035) + uSeed * 2.7;

    float longitudinal = uv.x * 6.2831853;
    float taper = sin(uv.y * 3.1415926);
    float pointerWake = exp(-pow(uv.x - (uPointer.x * 0.28 + 0.5), 2.0) * 10.0);
    float bloomDistance = abs(uv.x - 0.5);
    float bloomRing = exp(-pow(bloomDistance - uBloomProgress * 0.58, 2.0) * 72.0);

    transformed.y += sin(longitudinal * (0.72 + uSeed * 0.04) + phase)
      * (0.18 + energy * 0.44 + bloom * 0.16) * taper;
    transformed.y += sin(longitudinal * 1.83 - phase * 1.35 + uSeed)
      * (0.06 + energy * 0.18);
    transformed.z += cos(longitudinal * 0.94 + phase * 0.9)
      * (0.14 + energy * 0.52 + bloom * 0.22) * taper;
    transformed.z += pointerWake * (uPointer.y * 0.38 + uVelocity.y * 0.023) * energy;
    transformed.y += pointerWake * (uPointer.y * 0.30 + uVelocity.y * 0.018) * energy;
    transformed.x += uVelocity.x * taper * 0.012 * energy;
    transformed.y += bloomRing * bloom * (0.2 + uSeed * 0.025) * sin(uv.y * 6.2831853 + phase);
    transformed.z += bloomRing * bloom * 0.2 * taper;

    // Dry-down: the field contracts and flattens as the scent is absorbed.
    transformed.x *= mix(1.0, 0.66 + abs(uv.x - 0.5) * 0.26, absorption);
    transformed.y *= mix(1.0, 0.86, absorption);
    transformed.z *= mix(1.0, 0.76, absorption);

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;
    vFold = transformed.z;
    vDepth = smoothstep(-0.65, 0.65, transformed.z);
    vViewPosition = -viewPosition.xyz;
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAbsorption;
  uniform float uBloom;
  uniform float uBloomProgress;
  uniform float uSeed;
  uniform float uFront;
  uniform vec2 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec2 vUv;
  varying float vFold;
  varying float vDepth;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 0.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int octave = 0; octave < 4; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + 17.17;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    float edge = sin(vUv.y * 3.1415926);
    edge = smoothstep(0.0, 0.82, edge);
    float ends = smoothstep(0.0, 0.13, vUv.x) * smoothstep(0.0, 0.13, 1.0 - vUv.x);

    vec2 flowUv = vec2(vUv.x * 4.15 - uTime * 0.085, vUv.y * 2.35 + uSeed * 1.7);
    float body = fbm(flowUv + vec2(sin(vUv.x * 7.0 + uSeed), 0.0));
    float bodyMask = smoothstep(0.22, 0.78, body + sin(vUv.y * 5.0 + body * 3.0) * 0.13);
    float filament = pow(max(0.0, sin((vUv.y + body * 0.28) * 10.0 + vUv.x * 4.0)), 5.0);

    vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDirection)), 2.2);
    float pointerGlow = exp(-length(vUv - vec2(uPointer.x * 0.25 + 0.5, uPointer.y * -0.22 + 0.5)) * 3.8);

    float energy = smoothstep(0.0, 1.0, uEnergy);
    float bloom = smoothstep(0.0, 1.0, uBloom);
    float bloomRing = exp(-pow(abs(vUv.x - 0.5) - uBloomProgress * 0.58, 2.0) * 75.0);

    vec3 color = mix(uColorA, uColorB, clamp(body * 0.82 + fresnel * 0.52 + vDepth * 0.2, 0.0, 1.0));
    color = mix(color, uColorC, filament * 0.48 + bloomRing * bloom * 0.25);
    color += uColorC * filament * (0.1 + energy * 0.3);
    color += uColorB * pointerGlow * energy * 0.22;

    float alpha = edge * ends * energy * (0.07 + energy * 0.16 + bloom * 0.05);
    alpha *= 0.42 + bodyMask * 0.58 + fresnel * 0.35 + filament * 0.20;
    alpha *= mix(1.0, 0.72, uAbsorption);
    alpha *= 0.85;
    alpha += bloomRing * bloom * edge * ends * 0.04;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

type RibbonSpec = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number];
  front: number;
};

/** Crimson Bloom: Velvet Damask rose → glowing golden amber liquid → royal gold & dark leather depth. */
const RIBBONS: RibbonSpec[] = [
  { position: [-0.45, 0.08, -1.25], rotation: [-0.12, 0.14, -0.10], scale: [1.15, 1.10], front: 0 },
  { position: [0.42, -0.32, -1.55], rotation: [0.10, -0.16, 0.08], scale: [1.02, 0.95], front: 0 },
  { position: [-0.32, -0.05, -1.75], rotation: [-0.08, 0.10, 0.06], scale: [1.08, 0.90], front: 0 },
  { position: [0.48, -0.38, -1.95], rotation: [0.14, -0.12, -0.08], scale: [0.95, 0.82], front: 0 },
];

const PALETTES: Array<[string, string, string]> = [
  ["#8a1525", "#d87824", "#e8a06a"],
  ["#a8283a", "#e58428", "#d87a4a"],
  ["#6b121e", "#d4af37", "#e09a52"],
  ["#341218", "#c86a24", "#d07038"],
];

export type WakeParams = {
  time: number;
  energy: number;
  absorption: number;
  bloom: number;
  bloomProgress: number;
  pointerX: number;
  pointerY: number;
  velocityX: number;
  velocityY: number;
};

export type WakeField = {
  group: THREE.Group;
  update: (params: WakeParams) => void;
  dispose: () => void;
};

export function createWakeField(mobile: boolean): WakeField {
  const group = new THREE.Group();
  group.name = "MiskovaWake";

  const geometry = new THREE.PlaneGeometry(5.4, 1.28, mobile ? 72 : 144, mobile ? 10 : 20);
  const materials: THREE.ShaderMaterial[] = [];
  const count = mobile ? 3 : RIBBONS.length;

  RIBBONS.slice(0, count).forEach((spec, index) => {
    const [a, b, c] = PALETTES[index];
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uAbsorption: { value: 0 },
        uBloom: { value: 0 },
        uBloomProgress: { value: 0 },
        uSeed: { value: index * 0.73 + 0.31 },
        uFront: { value: spec.front },
        uPointer: { value: new THREE.Vector2() },
        uVelocity: { value: new THREE.Vector2() },
        uColorA: { value: new THREE.Color(a) },
        uColorB: { value: new THREE.Color(b) },
        uColorC: { value: new THREE.Color(c) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      toneMapped: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...spec.position);
    mesh.rotation.set(...spec.rotation);
    mesh.scale.set(spec.scale[0], spec.scale[1], 1);
    mesh.renderOrder = 1; // Strict background layer behind pedestal, bottle, and mist
    group.add(mesh);
    materials.push(material);
  });

  return {
    group,
    update: ({ time, energy, absorption, bloom, bloomProgress, pointerX, pointerY, velocityX, velocityY }) => {
      for (const material of materials) {
        material.uniforms.uTime.value = time;
        material.uniforms.uEnergy.value = energy;
        material.uniforms.uAbsorption.value = absorption;
        material.uniforms.uBloom.value = bloom;
        material.uniforms.uBloomProgress.value = bloomProgress;
        (material.uniforms.uPointer.value as THREE.Vector2).set(pointerX, pointerY);
        (material.uniforms.uVelocity.value as THREE.Vector2).set(velocityX, velocityY);
      }
    },
    dispose: () => {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
    },
  };
}
