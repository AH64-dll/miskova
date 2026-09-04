import * as THREE from "three";

/**
 * Locally baked luxury studio lighting probe for Miskova Fragrances.
 *
 * Provides soft, realistic reflections tailored for faceted crystal glass,
 * glossy black lacquer, polished metallic collar, and gold foil typography.
 */

type Softbox = {
  size: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  intensity: number;
};

const SOFTBOXES: Softbox[] = [
  // Left tall vertical crystal reflection strip
  { size: [1.2, 8.0], position: [-1.6, 0.6, 2.0], rotation: [0, 0.38, 0], color: "#ffffff", intensity: 2.8 },
  // Right tall vertical crystal reflection strip
  { size: [1.2, 8.0], position: [1.8, 0.6, 1.8], rotation: [0, -0.42, 0], color: "#ffffff", intensity: 2.4 },
  // Top angled shoulder reflection softbox (highlights the 45-degree crystal shoulder facets)
  { size: [4.2, 2.6], position: [0.0, 2.2, 2.2], rotation: [0.65, 0, 0], color: "#ffffff", intensity: 2.5 },
  // Front soft fill bounce
  { size: [3.6, 4.2], position: [-0.6, 0.8, 3.2], rotation: [0, 0.08, 0], color: "#f8f2e6", intensity: 1.2 },
  // Overhead jewelry key sheet
  { size: [5.2, 2.2], position: [0, 3.8, 0.4], rotation: [Math.PI * 0.5, 0, 0], color: "#fffcf5", intensity: 1.5 },
  // Luminous golden-amber liquid backlight kicker behind (internal refraction glow)
  { size: [4.4, 4.8], position: [0.0, 0.45, -2.4], rotation: [0, Math.PI, 0], color: "#c98a3a", intensity: 1.6 },
  // Golden rim kicker at 45 degrees
  { size: [1.8, 6.0], position: [-2.2, 1.2, -1.8], rotation: [0, Math.PI * 0.75, 0], color: "#e3c98a", intensity: 2.8 },
  // Dark side contrast flags (gives glass facet reflections crisp high-contrast edges)
  { size: [1.5, 7.0], position: [-3.2, 0.6, 0.0], rotation: [0, Math.PI * 0.5, 0], color: "#080605", intensity: 0.15 },
  { size: [1.5, 7.0], position: [3.2, 0.6, 0.0], rotation: [0, -Math.PI * 0.5, 0], color: "#080605", intensity: 0.15 },
];

export function createStudioEnvironment(renderer: THREE.WebGLRenderer): {
  texture: THREE.Texture;
  dispose: () => void;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#141210");

  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
  for (const box of SOFTBOXES) {
    const geometry = new THREE.PlaneGeometry(box.size[0], box.size[1]);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(box.color).multiplyScalar(box.intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...box.position);
    mesh.rotation.set(...box.rotation);
    scene.add(mesh);
    disposables.push(geometry, material);
  }

  // Floor bounce disc
  const floorGeo = new THREE.CircleGeometry(8, 32);
  const floorMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#7d7468"),
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.y = -2.2;
  scene.add(floor);
  disposables.push(floorGeo, floorMat);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.022, 0.1, 30);
  pmrem.dispose();
  disposables.forEach((item) => item.dispose());

  return {
    texture: target.texture,
    dispose: () => {
      // Dispose both the PMREM RT (its GPU texture + renderbuffers) and the
      // texture resource; previously only the texture was released, leaking the
      // WebGLRenderTarget on every remount of the stage.
      target.dispose();
      target.texture.dispose();
    },
  };
}

/**
 * Studio cyclorama / backdrop plane.
 * Clean, flat vertical-horizontal studio sweep without warped steep curvature.
 */
export function createBackdrop(floorY: number): THREE.BufferGeometry {
  const width = 16;
  const height = 12;
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  geometry.translate(0, floorY + height / 2 - 0.5, -3.2);
  return geometry;
}
