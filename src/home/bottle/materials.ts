import * as THREE from "three";

/**
 * Material set for the Miskova bottle.
 *
 * The glass carries a custom sweep injected through `onBeforeCompile`: a narrow
 * studio highlight band that travels vertically across the facets, modulating
 * roughness and clearcoat instead of adding a fake glow. `uSweepCenter` is
 * normalised bottle height (0 = base, 1 = cap dome), so the scroll rig can drive
 * it without knowing the mesh's local units.
 */

export type SweepUniforms = {
  uSweepCenter: { value: number };
  uSweepStrength: { value: number };
  uSweepPhase: { value: number };
  uSweepBloom: { value: number };
  uHeightScale: { value: number };
};

export type SweepMaterial = THREE.MeshPhysicalMaterial & {
  userData: { sweep?: SweepUniforms };
};

export type JuiceUniforms = {
  uSloshX: { value: number };
  uSloshZ: { value: number };
  uSloshPhase: { value: number };
  uSloshEnergy: { value: number };
};

export type JuiceMaterial = THREE.MeshPhysicalMaterial & {
  userData: { slosh?: JuiceUniforms };
};

const MISKOVA_GOLD = new THREE.Color("#c9a961");

/**
 * Optical Flacon Crystal Glass:
 * Pure MeshPhysicalMaterial with real transmission, accurate crown glass IOR (1.52),
 * subtle crystal roughness, internal attenuation, and crisp physical Fresnel reflections.
 */
export function createGlassMaterial(): SweepMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    transmission: 0.97,
    roughness: 0.032,
    metalness: 0.0,
    ior: 1.52, // Optical crown glass / flacon crystal
    thickness: 0.38, // Physical volume depth for realistic internal refraction
    attenuationColor: new THREE.Color("#faf3e4"),
    attenuationDistance: 0.85,
    specularIntensity: 1.3,
    specularColor: new THREE.Color("#ffffff"),
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 3.2,
    side: THREE.FrontSide,
    flatShading: false,
    transparent: true,
    opacity: 1.0,
    depthWrite: true,
  }) as SweepMaterial;

  const sweep: SweepUniforms = {
    uSweepCenter: { value: 0.5 },
    uSweepStrength: { value: 0 },
    uSweepPhase: { value: 0 },
    uSweepBloom: { value: 0 },
    uHeightScale: { value: 1.0 / 0.84 },
  };
  material.userData.sweep = sweep;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSweepCenter = sweep.uSweepCenter;
    shader.uniforms.uSweepStrength = sweep.uSweepStrength;
    shader.uniforms.uSweepPhase = sweep.uSweepPhase;
    shader.uniforms.uSweepBloom = sweep.uSweepBloom;
    shader.uniforms.uHeightScale = sweep.uHeightScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uHeightScale;
varying float vSweepHeight;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vSweepHeight = position.y * uHeightScale;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vSweepHeight;
uniform float uSweepCenter;
uniform float uSweepStrength;
uniform float uSweepPhase;
uniform float uSweepBloom;
uniform float uHeightScale;`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
{
  float sweepDistance = (vSweepHeight - uSweepCenter) * 28.0;
  float sweepBand = exp(-sweepDistance * sweepDistance);
  float sweepGrain = 0.5 + 0.5 * sin(vSweepHeight * 120.0 + uSweepPhase);
  float sweep = sweepBand * uSweepStrength;
  material.roughness = mix(material.roughness, 0.025 + sweepGrain * 0.025, sweep);
  // Faint static crystal grain so broad highlights never read as flat plastic.
  float grain = fract(sin(vSweepHeight * 913.7) * 43758.5);
  material.roughness = clamp(material.roughness + (grain - 0.5) * 0.012, 0.02, 0.09);
  material.clearcoat = mix(material.clearcoat, 1.0, sweep);

  // Scent burst: a short warm bloom lifting the whole body
  material.roughness = mix(material.roughness, 0.06, uSweepBloom * 0.35);
  material.clearcoat = mix(material.clearcoat, 1.0, uSweepBloom * 0.5);
  material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.03, uSweepBloom * 0.45);
}`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
{
  // Natural crystal Fresnel rim at glancing angles (defines shoulder facets and outer glass contours)
  float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
  float crystalFresnel = pow(1.0 - NdotV, 3.2);
  vec3 crystalRim = vec3(0.95, 0.96, 1.0) * crystalFresnel * 0.45;
  reflectedLight.directSpecular += crystalRim * 0.6;
  reflectedLight.indirectSpecular += crystalRim * 0.6;
}`,
      );
  };

  // Distinct cache key so the patched program is never shared with a stock physical material.
  material.customProgramCacheKey = () => "miskova-glass-sweep-v4";
  return material;
}

/**
 * Honey-Amber Extrait Liquid (photo-faithful):
 * Product photos show a pale golden-yellow juice (Liquid Gold ~#cabb83 in thin
 * sections over white, deepening to rich honey-amber in volume) inside clear
 * flacon glass — NOT red/salmon. The juice mesh stays opaque on purpose
 * (TRANSMISSION PASS CONTRACT below) and the "liquid behind glass" look comes
 * from a wet low-roughness PBR surface, warm emissive depth glow, and a
 * Fresnel honey edge-scatter patch, all refracted through the glass shell.
 */
export const FLUID_COLORS: Record<string, string> = {
  "Liquid-Gold": "#9c6414",
  "Crimson-Bloom": "#a8430f",
  "Exotic-Dusk": "#b57a12",
  Heir: "#9a6d1c",
  "Ivory-Nectar": "#9c8236",
  "Sweet-Empire": "#a17c33",
  "Vintage-Lounge": "#a58236",
  "Third-Act": "#a3833d",
  "Day-and-Night": "#96693a",
  "Eternal-Knot": "#8c682e",
  "Heavens-cut": "#977a28",
  "The-Pequod": "#b09c55",
  "Fruit-Fusion": "#ab9850",
  "Pacific-Sol": "#a8934c",
  "Y-code": "#9c8845",
  "Spider-bundle": "#915f3d",
};

export function createJuiceMaterial(color = FLUID_COLORS["Liquid-Gold"]): JuiceMaterial {
  const juiceColor = new THREE.Color(color);
  const material = new THREE.MeshPhysicalMaterial({
    color: juiceColor,
    emissive: new THREE.Color("#532b06"),
    emissiveIntensity: 0.5,
    roughness: 0.28,
    metalness: 0.0,
    ior: 1.39, // Perfume essential oil refractive index
    // TRANSMISSION PASS CONTRACT: must stay 0. In three r185, any material with
    // transmission > 0 (or transparent: true) is classified into the TRANSMISSIVE
    // render list, and renderTransmissionPass only samples OPAQUE objects into the
    // transmission RT. If the liquid were transmissive, the surrounding glass
    // (transmission 0.97) would refract an RT that never contained the liquid,
    // rendering it invisible. Opaque juice is sampled correctly and the glass
    // refracts it. The "liquid look" comes from surface shading + the
    // Fresnel honey edge-scatter patch below.
    transmission: 0,
    thickness: 0.32,
    // Volumetric absorption — dormant while transmission is 0 (three only applies
    // attenuation in the transmissive path). Honey-amber tint so re-enabling
    // transmission later immediately gets correct golden absorption.
    attenuationColor: new THREE.Color("#8a4d0a"),
    attenuationDistance: 0.28,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    specularIntensity: 0.9,
    specularColor: new THREE.Color("#ffd9a0"),
    envMapIntensity: 0.85,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    side: THREE.FrontSide,
    flatShading: false,
  }) as JuiceMaterial;

  const slosh: JuiceUniforms = {
    uSloshX: { value: 0 },
    uSloshZ: { value: 0 },
    uSloshPhase: { value: 0 },
    uSloshEnergy: { value: 0 },
  };
  material.userData.slosh = slosh;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSloshX = slosh.uSloshX;
    shader.uniforms.uSloshZ = slosh.uSloshZ;
    shader.uniforms.uSloshPhase = slosh.uSloshPhase;
    shader.uniforms.uSloshEnergy = slosh.uSloshEnergy;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uSloshX;
uniform float uSloshZ;
uniform float uSloshPhase;
uniform float uSloshEnergy;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float meniscusWeight = smoothstep(0.56, 0.70, position.y);
float sloshDisp = (position.x * sin(uSloshZ) + position.z * sin(uSloshX)) * meniscusWeight;
float waveRipple = 0.006 * sin(9.0 * position.x + 7.0 * position.z + uSloshPhase) * uSloshEnergy * meniscusWeight;
transformed.y += sloshDisp + waveRipple;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
{
  float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
  float edgeScatter = pow(1.0 - NdotV, 2.4);
  // Honey-amber core/glow sampled from the product photos: Liquid Gold reads
  // pale gold (#cabb83) in thin sections, rich honey in volume; Crimson Bloom
  // glows orange-amber (#c85a25 core). Core stays deep so the body has depth,
  // edges scatter warm gold light like juice catching the flacon rim.
  vec3 coreHoney = vec3(0.52, 0.28, 0.06);
  vec3 goldenEdge = vec3(0.98, 0.68, 0.25);
  vec3 edgeTint = mix(coreHoney, goldenEdge, edgeScatter * 0.55);

  reflectedLight.directDiffuse += edgeTint * edgeScatter * 0.06;
  reflectedLight.indirectDiffuse += edgeTint * edgeScatter * 0.06;
  reflectedLight.indirectSpecular += goldenEdge * edgeScatter * 0.10;
  // Warm subsurface-style lift so the face-on body never goes muddy brown.
  reflectedLight.directDiffuse += coreHoney * 0.05;
}`,
      );
  };

  material.customProgramCacheKey = () => "miskova-juice-honey-v1";
  material.toneMapped = false;
  return material;
}

/** Cap: deep piano black lacquer with subtle micro-roughness and clearcoat. */
export function createCapMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#08080a"),
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    envMapIntensity: 1.25,
    sheen: 0.35,
    sheenColor: new THREE.Color("#202028"),
  });
}

/** Collar + cap band: polished Miskova house gold, matched to the site gold
 *  (#c9a961 family); photo's neck ring reads bright champagne, so the alloy
 *  leans light-warm rather than deep brass. */
export function createCollarMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#c9a961"),
    metalness: 1.0,
    roughness: 0.24,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMapIntensity: 2.4,
  });
}

/** Atomizer button: polished jewelry gold with razor-crisp reflection. */
export function createPushMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d8b96a"),
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    envMapIntensity: 2.6,
  });
}

/** Label: black paper plaque with gold hot-stamped foil ink. Mostly dielectric
 *  paper (low metalness, soft roughness); the foil shimmer comes from the
 *  texture's gold highlights + clearcoat, not bare metal. */
export function createLabelMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    roughness: 0.52,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.0,
    bumpScale: 0.012,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

export { MISKOVA_GOLD };
