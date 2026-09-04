import * as THREE from "three";

export type LabelLines = { brand: string; name: string; sub: string };

export const LABEL_TEXTURE_W = 1024;
export const LABEL_TEXTURE_H = 1024;

const GOLD = "#C9A961";
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
  const len = 18 * (LABEL_TEXTURE_W / 512);
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

  // Deep pure black plaque with very subtle velvet vignette.
  // All geometry below is proportional to the canvas size so the 512→1024
  // resolution upgrade keeps the exact same layout, only crisper.
  const S = LABEL_TEXTURE_W / 512;
  const C = LABEL_TEXTURE_W / 2;
  const bg = ctx.createRadialGradient(C, C, 50 * S, C, C, 260 * S);
  bg.addColorStop(0, "#0e0e10");
  bg.addColorStop(0.7, "#080809");
  bg.addColorStop(1, "#030304");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LABEL_TEXTURE_W, LABEL_TEXTURE_H);

  // Double gold border matching reference
  const outer = 20 * S;
  const inner = 32 * S;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5 * S;
  ctx.strokeRect(outer, outer, LABEL_TEXTURE_W - 2 * outer, LABEL_TEXTURE_H - 2 * outer);
  ctx.lineWidth = 1.2 * S;
  ctx.strokeRect(inner, inner, LABEL_TEXTURE_W - 2 * inner, LABEL_TEXTURE_H - 2 * inner);

  // Elegant corner flourishes on the inner border
  ctx.lineWidth = 2 * S;
  const fl = inner + 4 * S;
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
    ctx.font = `${28 * S}px "Bodoni Moda", Georgia, serif`;
    drawSpaced(ctx, brand, C + S, 136 * S, 8 * S);
  }
  ctx.fillStyle = gold;
  ctx.font = `${28 * S}px "Bodoni Moda", Georgia, serif`;
  drawSpaced(ctx, brand, C, 135 * S, 8 * S);

  // 2. Perfume Name: Elegant flowing script cursive (e.g. Liquid Gold)
  let nameFontSize = 52 * S;
  ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
  while (ctx.measureText(lines.name).width > LABEL_TEXTURE_W - 100 * S && nameFontSize > 28 * S) {
    nameFontSize -= 2 * S;
    ctx.font = `italic ${nameFontSize}px "Brush Script MT", "Snell Roundhand", "Apple Chancery", "Playfair Display", "Bodoni Moda", cursive, serif`;
  }

  if (mono) {
    ctx.fillStyle = BUMP_EDGE;
    ctx.textAlign = "center";
    ctx.fillText(lines.name, C + S, 256 * S);
  }
  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  ctx.fillText(lines.name, C, 255 * S);

  // 3. Sub: EXTRAIT DE PARFUM in small spaced gold serif caps
  const subText = lines.sub.toUpperCase();
  if (mono) {
    ctx.fillStyle = BUMP_EDGE;
    ctx.font = `${15 * S}px "Bodoni Moda", Georgia, serif`;
    drawSpaced(ctx, subText, C + S, 376 * S, 5 * S);
  }
  ctx.fillStyle = gold;
  ctx.font = `${15 * S}px "Bodoni Moda", Georgia, serif`;
  drawSpaced(ctx, subText, C, 375 * S, 5 * S);
}

/** Fine diagonal micro-grain over the plaque area (inside the outer border). */
function drawMicroGrain(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(OUTER_INSET + 2, OUTER_INSET + 2, LABEL_TEXTURE_W - 2 * (OUTER_INSET + 2), LABEL_TEXTURE_H - 2 * (OUTER_INSET + 2));
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.012)";
  ctx.lineWidth = 1;
  for (let d = -LABEL_TEXTURE_H; d < LABEL_TEXTURE_W + LABEL_TEXTURE_H; d += 3 * (LABEL_TEXTURE_W / 512)) {
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
  const S = LABEL_TEXTURE_W / 512;
  const blobs: Array<[number, number, number]> = [
    [150 * S, 200 * S, 170 * S],
    [368 * S, 372 * S, 200 * S],
  ];
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(201,169,97,0.07)");
    g.addColorStop(1, "rgba(201,169,97,0)");
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
  drawFoilShimmer(ctx);
  drawVignette(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
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
  tex.anisotropy = 16;
  return tex;
}

