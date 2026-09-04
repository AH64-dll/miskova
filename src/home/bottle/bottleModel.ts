import * as THREE from "three";
import { makeLabelTexture, makeLabelBumpTexture, type LabelLines } from "./labelTexture";
import {
  createGlassMaterial,
  createJuiceMaterial,
  createCapMaterial,
  createCollarMaterial,
  createPushMaterial,
  createLabelMaterial,
  type SweepMaterial,
  type JuiceMaterial,
} from "./materials";

/**
 * Miskova Crimson Bloom — Precision 3D Luxury Perfume Bottle Model.
 *
 * Geometric architecture matching the authentic Crimson Bloom flacon:
 * - Authentic rectangular silhouette with chamfered crystal corner facets.
 * - Substantial, heavy solid chamfered crystal glass base (pedestal glass foot).
 * - Stepped luxury gold collar and gold atomizer button with precision nozzle.
 * - Tactile front plaque with subtle 3D relief, gold border rim, and gold hot-stamped typography.
 * - Inner liquid volume with capillary meniscus resting above the solid crystal base.
 * - Clear dip tube with optical transmission and liquid refraction.
 * - Deep piano black lacquer cap with gold accent band and micro-chamfered crown.
 */

export const TARGET_HEIGHT = 1.15;
export const FLOOR_Y = -0.575;

// Geometric constants in design units (metres) — matches reference photo proportions
const HALF_WIDTH = 0.325;   // Total body width = 0.65
const HALF_DEPTH = 0.22;   // Total body depth = 0.44
const CHAMFER = 0.10;      // Corner chamfer scaled with narrower body
const WALL = 0.046;        // Luxury thick glass wall

// Vertical profile stations
const Y_BASE = 0.0;
const Y_BASE_BEVEL = 0.035;    // Bottom inward chamfer bevel
const Y_HEEL = 0.14;           // Substantial solid crystal glass base station (thick heavy glass foot)
const Y_SHOULDER_START = 0.70; // Straight column walls transition to shoulder facets
const Y_SHOULDER_TOP = 0.84;   // Sharp angular shoulder cuts meet neck shelf
const Y_NECK_SHELF = 0.84;     // Flat horizontal shelf around neck
const Y_NECK_TOP = 0.93;       // Top of glass neck lip

const NECK_RADIUS = 0.115;     // Glass neck outer radius
const COLLAR_RADIUS = 0.134;   // Gold collar outer radius
const COLLAR_HEIGHT = 0.076;   // Gold collar height
const PUSH_RADIUS = 0.076;     // Atomizer button radius
const PUSH_HEIGHT = 0.076;     // Atomizer button height
const CAP_RADIUS = 0.158;      // Black lacquer cap radius
const CAP_HEIGHT = 0.360;      // Black lacquer cap height
const CAP_BOTTOM_Y = 0.846;    // Cap seating height on the collar shelf

const LABEL_WIDTH = 0.46;      // Plaque width (rectangular, matches authentic wrap)
const LABEL_HEIGHT = 0.41;     // Plaque height
const LABEL_CENTER_Y = 0.42;   // Centered on the glowing liquid body between Y=0.14 and Y=0.70

const JUICE_BASE_Y = 0.145;    // Liquid begins above the thick solid crystal base
const JUICE_FILL_Y = 0.700;    // Liquid fill plane at the shoulder line

const TUBE_RADIUS = 0.007;     // Dip tube outer radius
const TUBE_HEIGHT = 0.700;     // Spans from nozzle pump (Y=0.84) down to glass floor (Y=0.15)
const TUBE_CENTER_Y = 0.495;   // Center of dip tube
const CORNERS = 8;

/** The 8 outer chamfered-rect vertices in XZ (CCW). Front face (+z) spans index 1 → 0. */
const BODY_OUTLINE: Array<[number, number]> = [
  [HALF_WIDTH - CHAMFER, HALF_DEPTH],     // 0: front-right
  [-(HALF_WIDTH - CHAMFER), HALF_DEPTH],  // 1: front-left
  [-HALF_WIDTH, HALF_DEPTH - CHAMFER],    // 2: left-front
  [-HALF_WIDTH, -(HALF_DEPTH - CHAMFER)], // 3: left-back
  [-(HALF_WIDTH - CHAMFER), -HALF_DEPTH], // 4: back-left
  [HALF_WIDTH - CHAMFER, -HALF_DEPTH],    // 5: back-right
  [HALF_WIDTH, -(HALF_DEPTH - CHAMFER)],  // 6: right-back
  [HALF_WIDTH, HALF_DEPTH - CHAMFER],     // 7: right-front
];

/** Octagonal neck shelf outline at Y=0.84 connecting angular shoulder facets. */
const SHELF_HALF_W = 0.20;
const SHELF_HALF_D = 0.13;
const SHELF_CHAMFER = 0.06;
const SHELF_OUTLINE: Array<[number, number]> = [
  [SHELF_HALF_W - SHELF_CHAMFER, SHELF_HALF_D],
  [-(SHELF_HALF_W - SHELF_CHAMFER), SHELF_HALF_D],
  [-SHELF_HALF_W, SHELF_HALF_D - SHELF_CHAMFER],
  [-SHELF_HALF_W, -(SHELF_HALF_D - SHELF_CHAMFER)],
  [-(SHELF_HALF_W - SHELF_CHAMFER), -SHELF_HALF_D],
  [SHELF_HALF_W - SHELF_CHAMFER, -SHELF_HALF_D],
  [SHELF_HALF_W, -(SHELF_HALF_D - SHELF_CHAMFER)],
  [SHELF_HALF_W, SHELF_HALF_D - SHELF_CHAMFER],
];

/** The 8 inner cavity vertices in XZ (shrunk by wall thickness). */
const JUICE_INSET = 0.065;
const INNER_OUTLINE: Array<[number, number]> = [
  [HALF_WIDTH - WALL - JUICE_INSET - CHAMFER * 0.8, HALF_DEPTH - WALL - JUICE_INSET],
  [-(HALF_WIDTH - WALL - JUICE_INSET - CHAMFER * 0.8), HALF_DEPTH - WALL - JUICE_INSET],
  [-(HALF_WIDTH - WALL - JUICE_INSET), HALF_DEPTH - WALL - JUICE_INSET - CHAMFER * 0.8],
  [-(HALF_WIDTH - WALL - JUICE_INSET), -(HALF_DEPTH - WALL - JUICE_INSET - CHAMFER * 0.8)],
  [-(HALF_WIDTH - WALL - JUICE_INSET - CHAMFER * 0.8), -(HALF_DEPTH - WALL - JUICE_INSET)],
  [HALF_WIDTH - WALL - JUICE_INSET - CHAMFER * 0.8, -(HALF_DEPTH - WALL - JUICE_INSET)],
  [HALF_WIDTH - WALL - JUICE_INSET, -(HALF_DEPTH - WALL - JUICE_INSET - CHAMFER * 0.8)],
  [HALF_WIDTH - WALL - JUICE_INSET, HALF_DEPTH - WALL - JUICE_INSET - CHAMFER * 0.8],
];

/** Neck circle 8 points matching the 8 corners. */
const NECK_OUTLINE: Array<[number, number]> = Array.from({ length: CORNERS }, (_, i) => {
  const angle = (i / CORNERS) * Math.PI * 2 + Math.PI / CORNERS;
  return [Math.cos(angle) * NECK_RADIUS, Math.sin(angle) * NECK_RADIUS] as [number, number];
});

/**
 * Builds the angular faceted glass body with heavy chamfered solid crystal base.
 */
function buildAngularGlassGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const rings: Array<{ y: number; outline: Array<[number, number]>; scale: number }> = [
    { y: Y_BASE, outline: BODY_OUTLINE, scale: 0.001 },
    { y: Y_BASE, outline: BODY_OUTLINE, scale: 0.88 },       // Bottom base inward chamfer
    { y: Y_BASE_BEVEL, outline: BODY_OUTLINE, scale: 0.94 }, // Lower bevel ring
    { y: Y_HEEL, outline: BODY_OUTLINE, scale: 1.0 },        // Solid crystal foot station
    { y: Y_SHOULDER_START, outline: BODY_OUTLINE, scale: 1.0 }, // Column top
    { y: Y_SHOULDER_TOP, outline: SHELF_OUTLINE, scale: 1.0 },  // Angular shoulder cuts
    { y: Y_NECK_SHELF, outline: NECK_OUTLINE, scale: 1.05 },    // Neck shelf
    { y: Y_NECK_TOP, outline: NECK_OUTLINE, scale: 1.0 },       // Neck lip
    { y: Y_NECK_TOP + 0.004, outline: NECK_OUTLINE, scale: 0.001 }, // Closed lip
  ];

  const numRings = rings.length;
  for (let r = 0; r < numRings; r++) {
    const { y, outline, scale } = rings[r];
    for (let c = 0; c < CORNERS; c++) {
      positions.push(outline[c][0] * scale, y, outline[c][1] * scale);
    }
  }

  for (let r = 0; r < numRings - 1; r++) {
    for (let c = 0; c < CORNERS; c++) {
      const nextC = (c + 1) % CORNERS;
      const a = r * CORNERS + c;
      const b = r * CORNERS + nextC;
      const cIdx = (r + 1) * CORNERS + nextC;
      const d = (r + 1) * CORNERS + c;
      indices.push(a, d, b, b, d, cIdx);
    }
  }

  const indexedGeo = new THREE.BufferGeometry();
  indexedGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  indexedGeo.setIndex(indices);
  const geo = indexedGeo.toNonIndexed();
  indexedGeo.dispose();
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

/**
 * Builds the inner perfume liquid volume with capillary meniscus resting above the solid glass base.
 */
function buildJuiceGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const rings: Array<{ y: number; outline: Array<[number, number]>; scale: number }> = [
    { y: JUICE_BASE_Y, outline: INNER_OUTLINE, scale: 0.001 },
    { y: JUICE_BASE_Y, outline: INNER_OUTLINE, scale: 0.92 },
    { y: JUICE_BASE_Y + 0.02, outline: INNER_OUTLINE, scale: 1.0 },
    { y: JUICE_FILL_Y - 0.03, outline: INNER_OUTLINE, scale: 1.0 },
    { y: JUICE_FILL_Y - 0.006, outline: INNER_OUTLINE, scale: 0.98 }, // Meniscus curve
    { y: JUICE_FILL_Y, outline: INNER_OUTLINE, scale: 0.93 },         // Capillary wall contact
    { y: JUICE_FILL_Y + 0.002, outline: INNER_OUTLINE, scale: 0.001 }, // Flat liquid top
  ];

  const numRings = rings.length;
  for (let r = 0; r < numRings; r++) {
    const { y, outline, scale } = rings[r];
    for (let c = 0; c < CORNERS; c++) {
      positions.push(outline[c][0] * scale, y, outline[c][1] * scale);
    }
  }

  for (let r = 0; r < numRings - 1; r++) {
    for (let c = 0; c < CORNERS; c++) {
      const nextC = (c + 1) % CORNERS;
      const a = r * CORNERS + c;
      const b = r * CORNERS + nextC;
      const cIdx = (r + 1) * CORNERS + nextC;
      const d = (r + 1) * CORNERS + c;
      indices.push(a, d, b, b, d, cIdx);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Distinctive crisp geometric facet edge lines for the Miskova bottle.
 */
function buildFacetedEdgeLines(): THREE.BufferGeometry {
  const positions: number[] = [];

  // 1. Vertical corner edges along the straight column
  for (let c = 0; c < CORNERS; c++) {
    const [x, z] = BODY_OUTLINE[c];
    positions.push(x, Y_HEEL, z, x, Y_SHOULDER_START, z);
  }

  // 2. Bottom chamfer bevel ridges
  for (let c = 0; c < CORNERS; c++) {
    const [x1, z1] = BODY_OUTLINE[c];
    positions.push(x1 * 0.88, Y_BASE, z1 * 0.88, x1, Y_HEEL, z1);
  }

  // 3. Angular triangular/trapezoidal shoulder facet ridges
  for (let c = 0; c < CORNERS; c++) {
    const [x1, z1] = BODY_OUTLINE[c];
    const [x2, z2] = SHELF_OUTLINE[c];
    positions.push(x1, Y_SHOULDER_START, z1, x2, Y_SHOULDER_TOP, z2);
  }

  // 4. Horizontal perimeter rings (heel and shoulder lines)
  for (let c = 0; c < CORNERS; c++) {
    const nextC = (c + 1) % CORNERS;
    const [x1, z1] = BODY_OUTLINE[c];
    const [x2, z2] = BODY_OUTLINE[nextC];
    // Heel ridge loop
    positions.push(x1, Y_HEEL, z1, x2, Y_HEEL, z2);
    // Shoulder ridge loop
    positions.push(x1, Y_SHOULDER_START, z1, x2, Y_SHOULDER_START, z2);
    // Shelf ridge loop
    const [sx1, sz1] = SHELF_OUTLINE[c];
    const [sx2, sz2] = SHELF_OUTLINE[nextC];
    positions.push(sx1, Y_SHOULDER_TOP, sz1, sx2, Y_SHOULDER_TOP, sz2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

export type MiskovaBottle = {
  root: THREE.Group;
  model: THREE.Group;
  body: THREE.Group;
  glass: THREE.Mesh;
  juice: THREE.Mesh;
  cap: THREE.Group;
  collar: THREE.Mesh;
  push: THREE.Mesh;
  label: THREE.Mesh;
  aim: THREE.Object3D;
  unit: number;
  localHeight: number;
  glassLocalHeight: number;
  materials: {
    glass: SweepMaterial;
    juice: JuiceMaterial;
    cap: THREE.MeshPhysicalMaterial;
    collar: THREE.MeshStandardMaterial;
    push: THREE.MeshStandardMaterial;
    label: THREE.MeshPhysicalMaterial;
  };
  dispose: () => void;
};

export function buildMiskovaBottle(
  labelLines: LabelLines = { brand: "MISKOVA", name: "Crimson Bloom", sub: "EXTRAIT DE PARFUM" },
): MiskovaBottle {
  const root = new THREE.Group();
  root.name = "BottlePresentation";

  const model = new THREE.Group();
  model.name = "MiskovaBottle";
  root.add(model);

  const body = new THREE.Group();
  body.name = "Body";
  model.add(body);

  // --- 1. Materials Initialization -----------------------------------------
  const materials = {
    glass: createGlassMaterial(),
    juice: createJuiceMaterial(),
    cap: createCapMaterial(),
    collar: createCollarMaterial(),
    push: createPushMaterial(),
    label: createLabelMaterial(),
  };

  // --- 2. Inner Golden Amber/Crimson Juice ---------------------------------
  const juiceGeo = buildJuiceGeometry();
  const juice = new THREE.Mesh(juiceGeo, materials.juice);
  juice.name = "Juice";
  juice.renderOrder = 2;
  body.add(juice);

  // Clear dip tube inside the perfume bottle
  const tubeGeo = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 16);
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#FFFFFF"),
    // TRANSMISSION PASS CONTRACT: must stay 0 — same r185 constraint as the juice.
    // transmission > 0 would classify the tube into the TRANSMISSIVE render list,
    // excluding it from the transmission sampler the surrounding glass refracts.
    // Opaque tube is sampled correctly and stays visible through the glass.
    transmission: 0,
    roughness: 0.04,
    ior: 1.48,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.name = "DipTube";
  tube.position.set(0, TUBE_CENTER_Y, 0);
  tube.renderOrder = 3;
  body.add(tube);

  // --- 3. Optical Flacon Crystal Glass Shell --------------------------------
  const glassGeo = buildAngularGlassGeometry();
  const glass = new THREE.Mesh(glassGeo, materials.glass);
  glass.name = "Glass";
  glass.renderOrder = 4;
  glass.castShadow = true;
  glass.receiveShadow = true;
  body.add(glass);

  // Subtle crystal facet bevel edges (crisp crystal facet definition)
  const edgeGeo = buildFacetedEdgeLines();
  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color("#ffffff"),
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.name = "FacetEdges";
  edges.renderOrder = 5;
  body.add(edges);

  // --- 4. Front Black & Gold Label Plaque with 3D Relief -------------------
  const plaqueGroup = new THREE.Group();
  plaqueGroup.name = "LabelPlaque";
  plaqueGroup.position.set(0, LABEL_CENTER_Y, HALF_DEPTH + 0.003);

  // Gold border rim / bezel around plaque
  const plaqueRimGeo = new THREE.BoxGeometry(LABEL_WIDTH + 0.008, LABEL_HEIGHT + 0.008, 0.004);
  const plaqueRim = new THREE.Mesh(plaqueRimGeo, materials.collar);
  plaqueRim.position.z = -0.002;
  plaqueRim.castShadow = true;
  plaqueGroup.add(plaqueRim);

  // Plaque dark backing
  const plaqueBackGeo = new THREE.BoxGeometry(LABEL_WIDTH, LABEL_HEIGHT, 0.004);
  const plaqueBackMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0d0d0f"),
    roughness: 0.35,
    metalness: 0.1,
  });
  const plaqueBack = new THREE.Mesh(plaqueBackGeo, plaqueBackMat);
  plaqueBack.position.z = -0.001;
  plaqueGroup.add(plaqueBack);

  // Front face with luxury embossed label texture
  const labelGeo = new THREE.PlaneGeometry(LABEL_WIDTH, LABEL_HEIGHT);
  const label = new THREE.Mesh(labelGeo, materials.label);
  label.name = "Label";
  label.position.z = 0.0012;
  label.renderOrder = 10;
  plaqueGroup.add(label);

  body.add(plaqueGroup);

  // --- 5. Metallic Gold Collar & Atomizer Button ----------------------------
  const collarGeo = new THREE.CylinderGeometry(COLLAR_RADIUS, COLLAR_RADIUS, COLLAR_HEIGHT * 0.72, 36);
  const collar = new THREE.Mesh(collarGeo, materials.collar);
  collar.name = "Collar";
  collar.position.y = Y_NECK_SHELF + COLLAR_HEIGHT * 0.64;
  collar.castShadow = true;

  // Base collar retention flange
  const flangeGeo = new THREE.CylinderGeometry(COLLAR_RADIUS * 1.06, COLLAR_RADIUS * 1.06, COLLAR_HEIGHT * 0.28, 36);
  const flange = new THREE.Mesh(flangeGeo, materials.collar);
  flange.position.y = -COLLAR_HEIGHT * 0.40;
  flange.castShadow = true;
  collar.add(flange);
  body.add(collar);

  // Atomizer push button (THREE.Mesh with top depression and nozzle)
  const pushGeo = new THREE.CylinderGeometry(PUSH_RADIUS, PUSH_RADIUS, PUSH_HEIGHT, 32);
  const push = new THREE.Mesh(pushGeo, materials.push);
  push.name = "Push";
  push.position.y = Y_NECK_SHELF + COLLAR_HEIGHT + PUSH_HEIGHT / 2;
  push.castShadow = true;

  // Top concave depression
  const pushTopGeo = new THREE.CylinderGeometry(PUSH_RADIUS * 0.90, PUSH_RADIUS, PUSH_HEIGHT * 0.12, 32);
  const pushTop = new THREE.Mesh(pushTopGeo, materials.push);
  pushTop.position.y = PUSH_HEIGHT / 2 + PUSH_HEIGHT * 0.04;
  push.add(pushTop);

  // Precision micro nozzle orifice
  const nozzleGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.012, 16);
  const nozzleMat = new THREE.MeshBasicMaterial({ color: "#0c0c0e" });
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle.rotation.z = Math.PI * 0.5;
  nozzle.position.set(PUSH_RADIUS + 0.002, PUSH_HEIGHT * 0.15, 0.0);
  push.add(nozzle);
  body.add(push);

  // Nozzle aim marker (sprays rightward + slight forward tilt)
  const aim = new THREE.Object3D();
  aim.name = "Aim";
  aim.position.set(PUSH_RADIUS + 0.015, Y_NECK_SHELF + COLLAR_HEIGHT + PUSH_HEIGHT * 0.65, 0.0);
  body.add(aim);

  // --- 6. Glossy Black Lacquer Cap -----------------------------------------
  const cap = new THREE.Group();
  cap.name = "Cap";

  const capGeo = new THREE.CylinderGeometry(CAP_RADIUS, CAP_RADIUS, CAP_HEIGHT, 48, 1, false);
  const capMesh = new THREE.Mesh(capGeo, materials.cap);
  capMesh.name = "CapShell";
  capMesh.castShadow = true;
  capMesh.position.y = CAP_HEIGHT / 2;
  cap.add(capMesh);

  // Flat top with subtle micro-bevel
  const capBevelGeo = new THREE.CylinderGeometry(CAP_RADIUS * 0.95, CAP_RADIUS, 0.018, 48);
  const capBevel = new THREE.Mesh(capBevelGeo, materials.cap);
  capBevel.name = "CapBevel";
  capBevel.castShadow = true;
  capBevel.position.y = CAP_HEIGHT + 0.009;
  cap.add(capBevel);

  // Metal accent gold band at the base of the cap
  const capBandGeo = new THREE.CylinderGeometry(CAP_RADIUS * 1.018, CAP_RADIUS * 1.018, CAP_HEIGHT * 0.075, 48);
  const capBand = new THREE.Mesh(capBandGeo, materials.collar);
  capBand.name = "CapBand";
  capBand.position.y = CAP_HEIGHT * 0.05;
  cap.add(capBand);

  cap.position.y = CAP_BOTTOM_Y;
  body.add(cap);

  // --- 7. Normalization & Precision Scaling --------------------------------
  const box = new THREE.Box3().setFromObject(model);
  const rawHeight = Math.max(1e-6, box.max.y - box.min.y);
  const scale = TARGET_HEIGHT / rawHeight;
  model.scale.setScalar(scale);
  model.position.set(0, FLOOR_Y - box.min.y * scale, 0);

  const glassBox = new THREE.Box3().setFromObject(glass);
  const glassLocalHeight = Math.max(1e-6, glassBox.max.y - glassBox.min.y);

  // Configure material sweep height scale to sweep the body facets
  const sweep = materials.glass.userData.sweep;
  if (sweep) {
    sweep.uHeightScale.value = 1.0 / Math.max(1e-6, Y_NECK_TOP);
  }

  // Generate crisp luxury Miskova label texture
  const labelTex = makeLabelTexture(labelLines);
  const labelBump = makeLabelBumpTexture(labelLines);
  materials.label.map = labelTex;
  materials.label.bumpMap = labelBump;
  materials.label.needsUpdate = true;

  return {
    root,
    model,
    body,
    glass,
    juice,
    cap,
    collar,
    push,
    label,
    aim,
    unit: TARGET_HEIGHT / 1.72 / scale,
    localHeight: Math.max(1e-6, box.max.y),
    glassLocalHeight,
    materials,
    dispose: () => {
      glassGeo.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      juiceGeo.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      flangeGeo.dispose();
      collarGeo.dispose();
      pushGeo.dispose();
      pushTopGeo.dispose();
      nozzleGeo.dispose();
      nozzleMat.dispose();
      plaqueRimGeo.dispose();
      plaqueBackGeo.dispose();
      plaqueBackMat.dispose();
      labelGeo.dispose();
      capGeo.dispose();
      capBevelGeo.dispose();
      capBandGeo.dispose();
      labelTex.dispose();
      labelBump.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
  };
}

/** Cap-lift travel constants (normalized bottle units) */
export const CAP_TRAVEL = {
  lift: 0.52,
  offsetX: 0.44,
  offsetZ: 0.08,
  rotationZ: -0.12,
  rotationY: 0.10,
};

/** Atomizer press travel (meters) */
export const PUSH_TRAVEL = 0.0014;
