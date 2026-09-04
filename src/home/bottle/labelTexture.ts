import * as THREE from "three";

export type LabelLines = { brand: string; name: string; sub: string };

export const LABEL_TEXTURE_W = 512;
export const LABEL_TEXTURE_H = 512;

const GOLD = "#D4AF37";
const SUB_COLOR = "#b9b3a4";
const BUMP_GOLD = "#808080";
const BUMP_SUB = "#5a5a5a";
const BUMP_EDGE = "#9c9c9c";
const OUTER_INSET = 14;
const INNER_INSET = 24;

/** Draw text with manual per-character letter spacing, horizontally centered on x. */
function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
): void {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
}

/** Short gold L-stroke flourish at one inner corner. */
function cornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
): void {
  const len = 18;
  ctx.beginPath();
  ctx.moveTo(x + dx * len, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * len);
  ctx.stroke();
}

/** Shared drawing path for the color and bump variants. In mono mode every
 *  element is drawn in grayscale with a 1px lighter offset pass for a beveled edge. */
function paintLabel(
  ctx: CanvasRenderingContext2D,
  lines: LabelLines,
  mono: boolean,
): void {
  const gold = mono ? BUMP_GOLD : GOLD;
  const sub = mono ? BUMP_SUB : SUB_COLOR;

  // Deep pure black plaque with very subtle velvet vignette
  const bg = ctx.createRadialGradient(256, 256, 50, 256, 256, 260);
  bg.addColorStop(0, "#0e0e10");
  bg.addColorStop(0.7, "#080809");
  bg.addColorStop(1, "#030304");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LABEL_TEXTURE_W, LABEL_TEXTURE_H);

  // Double gold border matching reference
  const outer = 20;
  const inner = 32;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(outer, outer, LABEL_TEXTURE_W - 2 * outer, LABEL_TEXTURE_H - 2 * outer);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(inner, inner, LABEL_TEXTURE_W - 2 * inner, LABEL_TEXTURE_H - 2 * inner);

  // Elegant corner flourishes on the inner border
  ctx.lineWidth = 2;
  const fl = inner + 4;
  const fw = LABEL_TEXTURE_W - fl;
  const fh = LABEL_TEXTURE_H - fl;
  cornerFlourish(ctx, fl, fl, 1, 1);
  cornerFlourish(ctx, fw, fl, -1, 1);
  cornerFlourish(ctx, fl, fh, 1, -1);
  cornerFlourish(ctx, fw, fh, -1, -1);

  // 1. Brand: MISKOVA in spaced gold serif caps
  ctx.textBaseline = "middle";
  const brand = lines.brand.toUpperCase();
  if (mono) {
    ctx.fillStyle = BUMP_EDGE;
    ctx.font = '28px "Bodoni Moda", Georgia, serif';
    drawSpaced(ctx, brand, 257, 136, 8);
  }
  ctx.fillStyle = gold;
  ctx.font = '28px "Bodoni Moda", Georgia, serif';
  drawSpaced(ctx, brand, 256, 135, 8);

  // 2. Perfume Name: Elegant flowing script cursive (e.g. Crimson Bloom)
  let nameFontSize = 52;
  ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
  while (ctx.measureText(lines.name).width > LABEL_TEXTURE_W - 100 && nameFontSize > 28) {
    nameFontSize -= 2;
    ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
  }

  if (mono) {
    ctx.fillStyle = BUMP_EDGE;
    ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
    ctx.textAlign = "center";
    ctx.fillText(lines.name, 257, 256);
  }
  ctx.fillStyle = gold;
  ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
  ctx.textAlign = "center";
  ctx.fillText(lines.name, 256, 255);

  // 3. Sub: EXTRAIT DE PARFUM in small spaced gold serif caps
  const subText = lines.sub.toUpperCase();
  if (mono) {
    ctx.fillStyle = BUMP_EDGE;
    ctx.font = '15px "Bodoni Moda", Georgia, serif';
    drawSpaced(ctx, subText, 257, 376, 5);
  }
  ctx.fillStyle = gold;
  ctx.font = '15px "Bodoni Moda", Georgia, serif';
  drawSpaced(ctx, subText, 256, 375, 5);
}

/** Fine diagonal micro-grain over the plaque area (inside the outer border). */
function drawMicroGrain(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(OUTER_INSET + 2, OUTER_INSET + 2, LABEL_TEXTURE_W - 2 * (OUTER_INSET + 2), LABEL_TEXTURE_H - 2 * (OUTER_INSET + 2));
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.012)";
  ctx.lineWidth = 1;
  for (let d = -LABEL_TEXTURE_H; d < LABEL_TEXTURE_W + LABEL_TEXTURE_H; d += 3) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + LABEL_TEXTURE_H, LABEL_TEXTURE_H);
    ctx.stroke();
  }
  ctx.restore();
}

/** Soft dark vignette toward the plaque edges. */
function drawVignette(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(
    LABEL_TEXTURE_W / 2,
    LABEL_TEXTURE_H / 2,
    LABEL_TEXTURE_H * 0.25,
    LABEL_TEXTURE_W / 2,
    LABEL_TEXTURE_H / 2,
    LABEL_TEXTURE_H * 0.62,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LABEL_TEXTURE_W, LABEL_TEXTURE_H);
}

/** Two fixed soft gold highlights over the text areas (deterministic shimmer). */
function drawFoilShimmer(ctx: CanvasRenderingContext2D): void {
  const blobs: Array<[number, number, number]> = [
    [150, 200, 170],
    [368, 372, 200],
  ];
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(212,175,55,0.06)");
    g.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
}

export function makeLabelTexture(lines: LabelLines): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_TEXTURE_W;
  canvas.height = LABEL_TEXTURE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  paintLabel(ctx, lines, false);
  drawMicroGrain(ctx);
  drawFoilShimmer(ctx);
  drawVignette(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Grayscale companion for the label material's bumpMap: same layout,
 *  gold elements mid-gray, text beveled via a 1px lighter offset pass. */
export function makeLabelBumpTexture(lines: LabelLines): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_TEXTURE_W;
  canvas.height = LABEL_TEXTURE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  paintLabel(ctx, lines, true);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

