/*
 * Underground cross-section: layered strata, texture, embedded boulders, roots, old pipes
 * and a set of hand-placed curiosities. Rendered into cached world tiles (static art).
 */
import { hash2, mulberry32 } from '../core/util';
import { fillRR, glow, hgrad, makeCanvas, mix, rgba, rgrad, shade, vgrad, type Ctx } from './gfx';
import { VAULT_Y0, WORLD_H, WORLD_W } from './world';

export const TILE = 256;
/** canyon floor level outside the door (feet level + 5) */
let CANYON_Y = 160;
export function setCanyonY(y: number) {
  CANYON_Y = y;
}

/** The ground silhouette: canyon floor on the left, cliff with the vault door, plateau above the vault. */
export function groundPath(ctx: Ctx, L: number, R: number, B: number) {
  const CY = CANYON_Y;
  ctx.beginPath();
  ctx.moveTo(L, CY);
  ctx.lineTo(-8, CY);
  ctx.bezierCurveTo(-4, CY - 40, -18, VAULT_Y0 + 10, -24, VAULT_Y0 - 6);
  ctx.bezierCurveTo(-34, 20, -40, 6, -34, 0);
  ctx.lineTo(R, 0);
  ctx.lineTo(R, B);
  ctx.lineTo(L, B);
  ctx.closePath();
}

// ------------------------------------------------------------------ strata palette
const STRATA: [number, string][] = [
  [-60, '#6e4630'],
  [40, '#844f32'],
  [150, '#96603a'],
  [320, '#a5764e'],
  [520, '#976d4e'],
  [760, '#836658'],
  [1050, '#715f5c'],
  [1400, '#5f5058'],
  [1800, '#4f4153'],
  [2300, '#42344b'],
  [2800, '#36263b'],
  [3300, '#2a1a26'],
];
function strataColor(y: number) {
  if (y <= STRATA[0][0]) return STRATA[0][1];
  for (let i = 0; i < STRATA.length - 1; i++) {
    const [y0, c0] = STRATA[i];
    const [y1, c1] = STRATA[i + 1];
    if (y <= y1) return mix(c0, c1, (y - y0) / (y1 - y0));
  }
  return STRATA[STRATA.length - 1][1];
}

// sediment bands: y, thickness, tone shift
const BANDS = [
  { y: 70, h: 26, s: 0.12 },
  { y: 150, h: 12, s: -0.18 },
  { y: 260, h: 60, s: 0.08 },
  { y: 380, h: 10, s: -0.22 },
  { y: 470, h: 34, s: 0.14 },
  { y: 640, h: 90, s: -0.08 },
  { y: 820, h: 14, s: 0.16 },
  { y: 980, h: 48, s: -0.14 },
  { y: 1220, h: 120, s: 0.06 },
  { y: 1460, h: 16, s: -0.2 },
  { y: 1640, h: 70, s: 0.1 },
  { y: 1900, h: 150, s: -0.1 },
  { y: 2200, h: 20, s: 0.14 },
  { y: 2420, h: 110, s: -0.12 },
  { y: 2700, h: 60, s: 0.08 },
  { y: 2950, h: 200, s: -0.1 },
];
function bandEdge(x: number, y: number, k: number) {
  return y + Math.sin(x * 0.0041 + y * 0.7 + k) * 12 + Math.sin(x * 0.013 + k * 2) * 4 + Math.sin(x * 0.031 + y) * 1.5;
}

// ------------------------------------------------------------------ grey detail texture (overlay)
let detailTex: HTMLCanvasElement | null = null;
function detailTexture() {
  if (detailTex) return detailTex;
  const S = 512;
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  const rnd = mulberry32(4242);
  const wrap = (fn: (ox: number, oy: number) => void) => {
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) fn(ox, oy);
  };
  // soft mottling (large blobs)
  for (let i = 0; i < 900; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 6 + rnd() * 34;
    const v = rnd() < 0.5 ? 0 : 255;
    const a = 0.03 + rnd() * 0.05;
    const e = 0.45 + rnd() * 0.4;
    const rot = rnd() * 3;
    wrap((ox, oy) => {
      ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * e, rot, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // fine grain
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const v = rnd() < 0.5 ? 40 : 210;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.12 + rnd() * 0.18})`;
    ctx.fillRect(x, y, 1 + rnd() * 1.4, 1 + rnd());
  }
  // pebbles with light from the top-left
  for (let i = 0; i < 420; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 1.4 + rnd() * rnd() * 7;
    const rot = rnd() * 3;
    const e = 0.55 + rnd() * 0.35;
    const base = 95 + rnd() * 70;
    wrap((ox, oy) => {
      const px = x + ox;
      const py = y + oy;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(px + r * 0.25, py + r * 0.3, r, r * e, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgb(${base},${base},${base})`;
      ctx.beginPath();
      ctx.ellipse(px, py, r, r * e, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(px - r * 0.3, py - r * 0.3 * e, r * 0.45, r * 0.3 * e, rot, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // hairline cracks
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    let x = rnd() * S;
    let y = rnd() * S;
    const pts: [number, number][] = [[x, y]];
    for (let k = 0; k < 7; k++) {
      x += (rnd() - 0.5) * 26;
      y += 3 + rnd() * 10;
      pts.push([x, y]);
    }
    wrap((ox, oy) => {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      pts.forEach(([px, py], j) => (j ? ctx.lineTo(px + ox, py + oy) : ctx.moveTo(px + ox, py + oy)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      pts.forEach(([px, py], j) => (j ? ctx.lineTo(px + ox + 0.8, py + oy + 0.6) : ctx.moveTo(px + ox + 0.8, py + oy + 0.6)));
      ctx.stroke();
    });
  }
  detailTex = c;
  return c;
}

// ------------------------------------------------------------------ features
interface Feature {
  x: number;
  y: number;
  w: number;
  h: number;
  draw: (ctx: Ctx) => void;
}

const FEATURES: Feature[] = [];
function feature(x: number, y: number, w: number, h: number, draw: (ctx: Ctx) => void) {
  FEATURES.push({ x, y, w, h, draw });
}

/** Irregular embedded boulder, lit from the top-left. */
function boulder(ctx: Ctx, x: number, y: number, r: number, seed: number, base: string) {
  const rnd = mulberry32(seed);
  const pts: [number, number][] = [];
  const n = 8;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd() * 0.3;
    const rr = r * (0.72 + rnd() * 0.36);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.78]);
  }
  const path = () => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      const [nx, ny] = pts[(i + 1) % n];
      const mx = (px + nx) / 2;
      const my = (py + ny) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(nx, ny, (nx + pts[(i + 2) % n][0]) / 2, (ny + pts[(i + 2) % n][1]) / 2);
    });
    ctx.closePath();
  };
  // cast shadow into the soil
  ctx.save();
  ctx.translate(r * 0.18, r * 0.22);
  path();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.restore();
  path();
  ctx.fillStyle = rgrad(ctx, x - r * 0.4, y - r * 0.45, r * 0.1, r * 1.3, [
    [0, shade(base, 0.32)],
    [0.55, base],
    [1, shade(base, -0.45)],
  ]);
  ctx.fill();
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.strokeStyle = rgba(shade(base, -0.7), 0.6);
  ctx.stroke();
  // facet line
  ctx.strokeStyle = rgba('#ffffff', 0.14);
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y - r * 0.1);
  ctx.quadraticCurveTo(x - r * 0.1, y - r * 0.45, x + r * 0.35, y - r * 0.35);
  ctx.stroke();
  if (r > 10) {
    ctx.strokeStyle = rgba('#000', 0.28);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.1, y - r * 0.2);
    ctx.lineTo(x + r * 0.25, y + r * 0.2);
    ctx.lineTo(x + r * 0.1, y + r * 0.5);
    ctx.stroke();
  }
}

function rootSystem(ctx: Ctx, x: number, y: number, len: number, seed: number) {
  const rnd = mulberry32(seed);
  ctx.lineCap = 'round';
  const branch = (bx: number, by: number, ang: number, l: number, wdt: number, depth: number) => {
    const ex = bx + Math.cos(ang) * l;
    const ey = by + Math.sin(ang) * l;
    const cx = (bx + ex) / 2 + (rnd() - 0.5) * l * 0.5;
    const cy = (by + ey) / 2;
    ctx.strokeStyle = rgba('#3a2616', 0.75);
    ctx.lineWidth = wdt;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    ctx.strokeStyle = rgba('#a0764a', 0.3);
    ctx.lineWidth = wdt * 0.35;
    ctx.beginPath();
    ctx.moveTo(bx - wdt * 0.2, by);
    ctx.quadraticCurveTo(cx - wdt * 0.2, cy, ex - wdt * 0.2, ey);
    ctx.stroke();
    if (depth > 0) {
      const k = 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < k; i++) branch(ex, ey, ang + (rnd() - 0.5) * 1.2, l * (0.5 + rnd() * 0.3), wdt * 0.6, depth - 1);
    }
  };
  branch(x, y, Math.PI / 2 + (rnd() - 0.5) * 0.4, len * 0.45, 3, 3);
  branch(x + 6, y, Math.PI / 2 + 0.5, len * 0.35, 2.2, 2);
}

function rustyPipeH(ctx: Ctx, x0: number, x1: number, y: number, r: number) {
  ctx.fillStyle = vgrad(ctx, y - r, y + r, [
    [0, '#3a2a22'],
    [0.3, '#9a6a4a'],
    [0.55, '#6b4a36'],
    [1, '#2a1a14'],
  ]);
  ctx.fillRect(x0, y - r, x1 - x0, r * 2);
  for (let x = x0 + 40; x < x1; x += 120) {
    fillRR(ctx, x, y - r - 1.4, 6, r * 2 + 2.8, 1, '#4a3428');
    ctx.fillStyle = rgba('#c98a4a', 0.35);
    ctx.fillRect(x + 1, y - r - 1, 1.2, r * 2 + 2);
  }
  // rust streaks
  for (let x = x0 + 13; x < x1; x += 37) {
    ctx.fillStyle = rgba('#b8622a', 0.35);
    ctx.fillRect(x, y + r * 0.2, 2 + ((x * 7) % 5), r * 0.8);
  }
}

function cable(ctx: Ctx, pts: [number, number][], c = '#1a1614') {
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

// --- curiosities ------------------------------------------------------------
function dinoSkeleton(ctx: Ctx, x: number, y: number) {
  const bone = 'rgba(232,218,188,0.85)';
  const boneD = 'rgba(150,130,100,0.8)';
  ctx.lineCap = 'round';
  // spine curve
  ctx.strokeStyle = bone;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + 50, y - 26, x + 110, y - 30, x + 150, y - 8);
  ctx.bezierCurveTo(x + 180, y + 8, x + 215, y + 4, x + 240, y + 18);
  ctx.stroke();
  // vertebrae
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const px = x + t * 240;
    const py = y - Math.sin(t * Math.PI) * 24 + t * 16;
    ctx.fillStyle = bone;
    ctx.beginPath();
    ctx.ellipse(px, py - 4, 1.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // ribs
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 9; i++) {
    const px = x + 70 + i * 9;
    const py = y - 24 + i * 1.4;
    ctx.strokeStyle = i % 2 ? bone : boneD;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + 10, py + 24, px - 2, py + 38 - i);
    ctx.stroke();
  }
  // skull (big T-rex like)
  ctx.save();
  ctx.translate(x - 8, y + 4);
  ctx.rotate(0.25);
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(-40, -22, -58, -4);
  ctx.lineTo(-56, 6);
  ctx.quadraticCurveTo(-30, 4, 0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(60,40,26,0.8)';
  ctx.beginPath();
  ctx.ellipse(-16, -4, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-36, -6, 7, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // jaw with teeth
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.quadraticCurveTo(-30, 26, -54, 14);
  ctx.lineTo(-52, 10);
  ctx.quadraticCurveTo(-28, 16, -4, 8);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-50 + i * 6.5, 6);
    ctx.lineTo(-48 + i * 6.5, 10.5);
    ctx.lineTo(-46 + i * 6.5, 6);
    ctx.fill();
  }
  ctx.restore();
  // legs
  ctx.strokeStyle = bone;
  ctx.lineWidth = 3;
  for (const [lx, a] of [
    [x + 70, 0.3],
    [x + 140, -0.2],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(lx, y - 20);
    ctx.lineTo(lx + 16 * Math.sin(a), y + 16);
    ctx.lineTo(lx - 10, y + 40);
    ctx.lineTo(lx + 8, y + 46);
    ctx.stroke();
  }
  // tiny arms (the eternal gag)
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 12);
  ctx.lineTo(x + 36, y - 2);
  ctx.lineTo(x + 40, y + 2);
  ctx.stroke();
  // a vault-suit dweller's shovel stuck next to it
  ctx.strokeStyle = 'rgba(120,90,60,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 200, y - 50);
  ctx.lineTo(x + 212, y - 20);
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,170,180,0.9)';
  ctx.beginPath();
  ctx.moveTo(x + 208, y - 22);
  ctx.lineTo(x + 218, y - 26);
  ctx.lineTo(x + 222, y - 12);
  ctx.lineTo(x + 214, y - 8);
  ctx.fill();
}

function buriedCar(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.28);
  // body
  fillRR(ctx, -46, -14, 92, 20, 7, vgrad(ctx, -14, 6, [
    [0, '#7fa8a8'],
    [1, '#3f5a5a'],
  ]));
  ctx.beginPath();
  ctx.moveTo(-26, -14);
  ctx.quadraticCurveTo(-22, -32, 0, -32);
  ctx.quadraticCurveTo(22, -32, 28, -14);
  ctx.fillStyle = '#6a9494';
  ctx.fill();
  ctx.fillStyle = 'rgba(30,40,40,0.85)';
  ctx.beginPath();
  ctx.moveTo(-20, -15);
  ctx.quadraticCurveTo(-16, -28, -2, -28);
  ctx.lineTo(-2, -15);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -15);
  ctx.lineTo(2, -28);
  ctx.quadraticCurveTo(18, -28, 22, -15);
  ctx.fill();
  // chrome & fins
  ctx.fillStyle = '#d9dee2';
  ctx.fillRect(-46, -2, 92, 2);
  ctx.beginPath();
  ctx.moveTo(40, -14);
  ctx.lineTo(50, -26);
  ctx.lineTo(46, -10);
  ctx.fillStyle = '#6a9494';
  ctx.fill();
  // wheels
  for (const wx of [-28, 28]) {
    ctx.beginPath();
    ctx.arc(wx, 6, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1614';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#c9ced2';
    ctx.fill();
  }
  // rust
  ctx.fillStyle = 'rgba(160,80,40,0.5)';
  ctx.beginPath();
  ctx.ellipse(-30, -6, 10, 5, 0.3, 0, Math.PI * 2);
  ctx.ellipse(20, -4, 8, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // soil pocket shading around
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 62, 34, -0.28, 0, Math.PI * 2);
  ctx.fill();
}

function metroTunnel(ctx: Ctx, x0: number, x1: number, y: number, lang: string) {
  const h = 58;
  // tunnel void
  ctx.fillStyle = vgrad(ctx, y - h, y + 6, [
    [0, '#15110f'],
    [1, '#241c18'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x0, y + 6);
  ctx.lineTo(x0, y - h + 20);
  ctx.quadraticCurveTo(x0, y - h, x0 + 20, y - h);
  ctx.lineTo(x1 - 20, y - h);
  ctx.quadraticCurveTo(x1, y - h, x1, y - h + 20);
  ctx.lineTo(x1, y + 6);
  ctx.closePath();
  ctx.fill();
  // ribs of the tunnel lining
  ctx.strokeStyle = 'rgba(120,110,100,0.45)';
  ctx.lineWidth = 3;
  for (let x = x0 + 18; x < x1 - 10; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y - h + 6);
    ctx.stroke();
  }
  // rails
  ctx.fillStyle = '#6a625a';
  ctx.fillRect(x0, y + 2, x1 - x0, 2);
  for (let x = x0 + 4; x < x1; x += 10) {
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(x, y + 3.6, 6, 2);
  }
  // old train car
  const tx = x0 + 60;
  const tw = Math.min(260, x1 - x0 - 120);
  fillRR(ctx, tx, y - 44, tw, 42, 6, vgrad(ctx, y - 44, y - 2, [
    [0, '#5a7a5a'],
    [1, '#2f422f'],
  ]));
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(tx, y - 18, tw, 3);
  for (let wx = tx + 12; wx < tx + tw - 20; wx += 30) {
    fillRR(ctx, wx, y - 38, 20, 14, 2, 'rgba(20,24,20,0.9)');
    ctx.fillStyle = 'rgba(255,230,160,0.08)';
    ctx.fillRect(wx + 2, y - 36, 6, 10);
  }
  for (const wx of [tx + 24, tx + tw - 24]) {
    ctx.beginPath();
    ctx.arc(wx, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1614';
    ctx.fill();
  }
  // station sign
  const sx = x1 - 70;
  fillRR(ctx, sx - 34, y - h + 8, 68, 13, 2, '#8a2a24');
  ctx.font = '700 6px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4efe0';
  ctx.fillText(lang === 'ru' ? 'СТ. «ПУСТОШЬ»' : 'WASTELAND STN', sx, y - h + 14.8);
  fillRR(ctx, sx - 30, y - 30, 60, 12, 1.5, '#f2c230');
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '700 4.4px Oswald, sans-serif';
  ctx.fillText(lang === 'ru' ? 'ЗАКРЫТО НА РЕМОНТ' : 'CLOSED FOR REPAIRS', sx, y - 24);
  // collapsed rubble at the ends
  for (const ex of [x0, x1]) {
    for (let i = 0; i < 6; i++) {
      boulder(ctx, ex + (ex === x0 ? 8 + i * 6 : -8 - i * 6), y - 6 - (i % 3) * 10 - Math.max(0, 3 - i) * 8, 7 + (i % 3) * 3, i * 13 + ex, '#6a5a50');
    }
  }
}

function timeCapsule(ctx: Ctx, x: number, y: number, lang: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.35);
  fillRR(ctx, -26, -9, 52, 18, 9, hgrad(ctx, -26, 26, [
    [0, '#8a959e'],
    [0.4, '#e8eef0'],
    [1, '#6a747c'],
  ]));
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(-4, -9, 3, 18);
  ctx.font = '700 4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a2d31';
  ctx.fillText(lang === 'ru' ? 'НЕ ОТКРЫВАТЬ' : 'DO NOT OPEN', 14, -2);
  ctx.fillText(lang === 'ru' ? 'ДО 2077' : 'UNTIL 2077', 14, 3.4);
  ctx.restore();
}

function ammonite(ctx: Ctx, x: number, y: number, s: number) {
  ctx.fillStyle = 'rgba(220,200,160,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,225,190,0.7)';
  ctx.lineWidth = Math.max(0.8, s * 0.06);
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.12) {
    const r = (a / (Math.PI * 6)) * s;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,100,70,0.5)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4);
    ctx.lineTo(x + Math.cos(a) * s * 0.95, y + Math.sin(a) * s * 0.95);
    ctx.stroke();
  }
}

function lostVaultDoor(ctx: Ctx, x: number, y: number, lang: string) {
  // gag: a neighbouring vault that never opened
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1614';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 33, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - 10, y - 10, 3, 38, [
    [0, '#8a8478'],
    [1, '#3a3630'],
  ]);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#5a544a';
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(160,80,40,0.45)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 14, 14, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '800 11px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(220,200,150,0.7)';
  ctx.fillText('000', x, y);
  fillRR(ctx, x - 30, y + 42, 60, 12, 1.5, 'rgba(40,34,30,0.9)');
  ctx.font = '700 4.4px Oswald, sans-serif';
  ctx.fillStyle = '#e8c872';
  ctx.fillText(lang === 'ru' ? 'УБЕЖИЩЕ 000: ВСЕ НА ОБЕДЕ' : 'VAULT 000: OUT FOR LUNCH', x, y + 48);
}

function undergroundLake(ctx: Ctx, x: number, y: number, w: number) {
  const h = 46;
  ctx.fillStyle = vgrad(ctx, y - h, y + 20, [
    [0, '#120e10'],
    [1, '#1c1418'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + w * 0.1, y - h, x + w * 0.9, y - h * 1.1, x + w, y);
  ctx.bezierCurveTo(x + w * 0.8, y + 22, x + w * 0.2, y + 22, x, y);
  ctx.fill();
  // water
  ctx.fillStyle = vgrad(ctx, y - 2, y + 18, [
    [0, '#3fb8d8'],
    [1, '#0f3a52'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.bezierCurveTo(x + w * 0.8, y + 18, x + w * 0.2, y + 18, x + 10, y);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + w / 2, y + 4, w * 0.5, '#3fd8ff', 0.18);
  ctx.restore();
  // stalactites
  ctx.fillStyle = '#6a5a60';
  for (let i = 0; i < 9; i++) {
    const sx = x + w * 0.15 + i * (w * 0.08);
    const sh = 8 + ((i * 7) % 5) * 4;
    const top = y - h * 0.82 + Math.abs(i - 4) * 2.4;
    ctx.beginPath();
    ctx.moveTo(sx - 3, top);
    ctx.lineTo(sx + 3, top);
    ctx.lineTo(sx, top + sh);
    ctx.fill();
  }
  // glowing mushrooms
  for (let i = 0; i < 5; i++) {
    const mx = x + 16 + i * 9;
    const my = y - 1;
    ctx.fillStyle = '#d8e8c8';
    ctx.fillRect(mx - 0.6, my - 4, 1.2, 4);
    ctx.fillStyle = '#8aff9a';
    ctx.beginPath();
    ctx.ellipse(mx, my - 4, 2.6, 1.6, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + 34, y - 4, 22, '#8aff9a', 0.25);
  ctx.restore();
}

function minerSkeleton(ctx: Ctx, x: number, y: number) {
  const bone = 'rgba(232,218,188,0.9)';
  ctx.strokeStyle = bone;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  // sitting pose against a rock
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 2, y - 4);
  ctx.moveTo(x + 2, y - 4);
  ctx.lineTo(x + 14, y - 4);
  ctx.lineTo(x + 16, y + 6);
  ctx.moveTo(x + 2, y - 3);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x + 20, y + 6);
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 8, y - 8);
  ctx.lineTo(x + 12, y - 12);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 1, y - 13 + i * 3, 3, -0.4, 1.2);
    ctx.stroke();
  }
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.arc(x - 1, y - 23, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1a14';
  ctx.fillRect(x - 3, y - 24, 1.6, 1.6);
  ctx.fillRect(x, y - 24, 1.6, 1.6);
  // helmet with lamp
  ctx.fillStyle = '#e0b030';
  ctx.beginPath();
  ctx.ellipse(x - 1, y - 26, 5, 3, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff4c8';
  ctx.beginPath();
  ctx.arc(x + 3, y - 27, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // pickaxe & lantern
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 6);
  ctx.lineTo(x + 34, y - 20);
  ctx.stroke();
  ctx.strokeStyle = '#8a959e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + 26, y - 22);
  ctx.quadraticCurveTo(x + 34, y - 26, x + 42, y - 18);
  ctx.stroke();
  fillRR(ctx, x - 16, y - 2, 7, 9, 1.5, 'rgba(90,70,40,0.9)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x - 12.5, y + 2, 12, '#ffcf6a', 0.3);
  ctx.restore();
}

function treasureChest(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 16, y - 12, 32, 14, 2, vgrad(ctx, y - 12, y + 2, [
    [0, '#8a5a2a'],
    [1, '#4a2e14'],
  ]));
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 12);
  ctx.quadraticCurveTo(x, y - 26, x + 16, y - 12);
  ctx.fillStyle = '#7a4a22';
  ctx.fill();
  ctx.fillStyle = '#e8c040';
  ctx.fillRect(x - 17, y - 12, 34, 2);
  ctx.fillRect(x - 2, y - 14, 4, 6);
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(x - 12 + i * 4, y + 3 + (i % 2), 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#f2cf4a';
    ctx.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - 8, 30, '#ffe27a', 0.3);
  ctx.restore();
}

function geode(ctx: Ctx, x: number, y: number, r: number, c: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.75, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2230';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a7a8a';
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const cx = x + Math.cos(a) * r * 0.62;
    const cy = y + Math.sin(a) * r * 0.46;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.34);
    ctx.lineTo(r * 0.1, 0);
    ctx.lineTo(0, r * 0.08);
    ctx.lineTo(-r * 0.1, 0);
    ctx.closePath();
    ctx.fillStyle = shade(c, (i % 3) * 0.15 - 0.1);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r * 1.6, c, 0.35);
  ctx.restore();
}

function crystalCluster(ctx: Ctx, x: number, y: number, s: number, c: string) {
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(x + (i - 1.5) * s * 0.35, y);
    ctx.rotate((i - 1.5) * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, -s * (1 - Math.abs(i - 1.5) * 0.25));
    ctx.lineTo(s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.18, s * 0.2);
    ctx.lineTo(-s * 0.18, s * 0.2);
    ctx.lineTo(-s * 0.2, -s * 0.2);
    ctx.closePath();
    ctx.fillStyle = hgrad(ctx, -s * 0.2, s * 0.2, [
      [0, shade(c, 0.45)],
      [0.5, c],
      [1, shade(c, -0.35)],
    ]);
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - s * 0.4, s * 1.6, c, 0.22);
  ctx.restore();
}

function magmaVein(ctx: Ctx, x: number, y: number, len: number, seed: number) {
  const rnd = mulberry32(seed);
  const pts: [number, number][] = [[x, y]];
  let px = x;
  let py = y;
  for (let i = 0; i < 10; i++) {
    px += len / 10;
    py += (rnd() - 0.5) * 16;
    pts.push([px, py]);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [wdt, c, a] of [
    [9, '#ff4a1a', 0.18],
    [4, '#ff8a2a', 0.5],
    [1.6, '#ffe07a', 0.9],
  ] as const) {
    ctx.strokeStyle = rgba(c, a);
    ctx.lineWidth = wdt;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([ax, ay], i) => (i ? ctx.lineTo(ax, ay) : ctx.moveTo(ax, ay)));
    ctx.stroke();
  }
  ctx.restore();
}

function moleBurrow(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = 'rgba(20,14,10,0.7)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 60, y - 40);
  ctx.bezierCurveTo(x - 20, y - 50, x - 30, y + 10, x + 10, y);
  ctx.bezierCurveTo(x + 40, y - 8, x + 50, y + 30, x + 80, y + 24);
  ctx.stroke();
  // chamber
  ctx.fillStyle = 'rgba(20,14,10,0.8)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 2, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // mole family (sleeping)
  for (let i = 0; i < 3; i++) {
    const mx = x + 2 + i * 8;
    const s = i === 1 ? 1 : 0.75;
    ctx.fillStyle = '#5a4a44';
    ctx.beginPath();
    ctx.ellipse(mx, y + 6 - 3 * s, 5 * s, 3.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9aa8';
    ctx.beginPath();
    ctx.arc(mx + 4.6 * s, y + 5.4 - 3 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '600 5px Rubik, sans-serif';
  ctx.fillStyle = 'rgba(240,230,210,0.6)';
  ctx.fillText('z z', x + 12, y - 8);
}

function oldBones(ctx: Ctx, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(225,210,180,0.7)';
  fillRR(ctx, -s, -s * 0.15, s * 2, s * 0.3, s * 0.15, 'rgba(225,210,180,0.7)');
  for (const ex of [-s, s]) {
    ctx.beginPath();
    ctx.arc(ex, -s * 0.2, s * 0.24, 0, Math.PI * 2);
    ctx.arc(ex, s * 0.2, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function bottle(ctx: Ctx, x: number, y: number, rot: number, c: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  fillRR(ctx, -2.4, -6, 4.8, 9, 1.6, rgba(c, 0.7));
  ctx.fillStyle = rgba(c, 0.7);
  ctx.fillRect(-1, -9, 2, 3.4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-1.6, -5, 0.8, 6);
  ctx.restore();
}

let langForFeatures = 'ru';
let featuresBuilt = '';
function buildFeatures(lang: string) {
  if (featuresBuilt === lang) return;
  featuresBuilt = lang;
  langForFeatures = lang;
  FEATURES.length = 0;
  // main service pipe just under the surface
  feature(-760, 14, WORLD_W + 1520, 22, (ctx) => rustyPipeH(ctx, -760, WORLD_W + 760, 24, 5));
  // power cable from the antenna down to the vault
  feature(236, 0, 30, 60, (ctx) => cable(ctx, [[250, 0], [252, 20], [246, 34], [250, 46]]));
  // left of the vault (under the canyon)
  feature(-520, 270, 150, 100, (ctx) => buriedCar(ctx, -440, 330));
  feature(-740, 700, 300, 120, (ctx) => dinoSkeleton(ctx, -660, 760));
  feature(-760, 1110, 700, 90, (ctx) => metroTunnel(ctx, -760, -70, 1190, langForFeatures));
  feature(-340, 1600, 180, 90, (ctx) => moleBurrow(ctx, -260, 1650));
  feature(-740, 2080, 260, 100, (ctx) => undergroundLake(ctx, -720, 2150, 220));
  feature(-360, 2560, 90, 60, (ctx) => minerSkeleton(ctx, -320, 2600));
  feature(-200, 2820, 70, 50, (ctx) => treasureChest(ctx, -150, 2850));
  // right of the vault
  feature(1900, 480, 120, 80, (ctx) => timeCapsule(ctx, 1980, 520, langForFeatures));
  feature(2000, 1150, 110, 110, (ctx) => ammonite(ctx, 2060, 1200, 34));
  feature(1920, 1690, 160, 140, (ctx) => lostVaultDoor(ctx, 2010, 1750, langForFeatures));
  feature(1930, 2300, 130, 100, (ctx) => geode(ctx, 2000, 2350, 30, '#b58cff'));
  feature(1840, 2900, 400, 80, (ctx) => magmaVein(ctx, 1850, 2950, 360, 17));
  feature(-760, 3050, 800, 80, (ctx) => magmaVein(ctx, -740, 3100, 760, 29));
  feature(0, 3080, WORLD_W, 60, (ctx) => magmaVein(ctx, 0, 3110, WORLD_W, 41));
  // under the vault floor
  feature(300, 3060, 200, 80, (ctx) => crystalCluster(ctx, 400, 3100, 24, '#ff7a5a'));
  feature(1200, 3060, 200, 80, (ctx) => crystalCluster(ctx, 1300, 3100, 20, '#ffcf4a'));
}

// ------------------------------------------------------------------ tile rendering
function renderTile(ctx: Ctx, x0: number, y0: number) {
  const x1 = x0 + TILE;
  const y1 = y0 + TILE;
  ctx.save();
  groundPath(ctx, x0 - 2, x1 + 2, y1 + 2);
  ctx.clip();
  // base strata gradient
  const stops: [number, string][] = [];
  for (let y = y0; y <= y1; y += 32) stops.push([(y - y0) / TILE, strataColor(y)]);
  ctx.fillStyle = vgrad(ctx, y0, y1, stops);
  ctx.fillRect(x0, y0, TILE, TILE);
  // macro variation: large soft patches of darker / lighter earth
  const MC = 160;
  for (let gy = Math.floor((y0 - 130) / MC); gy <= Math.floor((y1 + 130) / MC); gy++) {
    for (let gx = Math.floor((x0 - 130) / MC); gx <= Math.floor((x1 + 130) / MC); gx++) {
      const px = gx * MC + hash2(gx, gy, 301) * MC;
      const py = gy * MC + hash2(gx, gy, 303) * MC;
      const r = 50 + hash2(gx, gy, 307) * 80;
      const dark = hash2(gx, gy, 311) < 0.55;
      ctx.fillStyle = rgrad(ctx, px, py, 0, r, [
        [0, dark ? 'rgba(20,10,6,0.16)' : 'rgba(255,230,190,0.1)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }
  // sediment bands with wavy edges
  for (let i = 0; i < BANDS.length; i++) {
    const b = BANDS[i];
    if (b.y + b.h + 20 < y0 || b.y - 20 > y1) continue;
    ctx.beginPath();
    ctx.moveTo(x0 - 4, bandEdge(x0 - 4, b.y, i));
    for (let x = x0; x <= x1 + 4; x += 8) ctx.lineTo(x, bandEdge(x, b.y, i));
    for (let x = x1 + 4; x >= x0 - 4; x -= 8) ctx.lineTo(x, bandEdge(x, b.y + b.h, i + 5));
    ctx.closePath();
    ctx.fillStyle = b.s > 0 ? rgba('#ffe8c8', b.s * 0.7) : rgba('#140a08', -b.s);
    ctx.fill();
    // a thin darker seam at the top of each band
    ctx.strokeStyle = rgba('#000', 0.14);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = x0 - 4; x <= x1 + 4; x += 8) (x === x0 - 4 ? ctx.moveTo : ctx.lineTo).call(ctx, x, bandEdge(x, b.y, i));
    ctx.stroke();
  }
  // overlay detail texture (world-anchored)
  const tex = detailTexture();
  const pat = ctx.createPattern(tex, 'repeat')!;
  pat.setTransform(new DOMMatrix().scaleSelf(0.5, 0.5));
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = pat;
  ctx.fillRect(x0, y0, TILE, TILE);
  ctx.restore();

  // boulders, bones, bottles, roots, crystals (deterministic per 64-unit cell)
  const C = 64;
  const cx0 = Math.floor((x0 - 40) / C);
  const cx1 = Math.floor((x1 + 40) / C);
  const cy0 = Math.floor((y0 - 40) / C);
  const cy1 = Math.floor((y1 + 40) / C);
  for (let gy = cy0; gy <= cy1; gy++) {
    for (let gx = cx0; gx <= cx1; gx++) {
      const h = hash2(gx, gy, 101);
      const px = gx * C + hash2(gx, gy, 103) * C;
      const py = gy * C + hash2(gx, gy, 107) * C;
      if (py < 20) continue;
      const col = strataColor(py);
      if (h < 0.2) {
        const r = 5 + hash2(gx, gy, 109) * (py > 800 ? 20 : 14);
        boulder(ctx, px, py, r, gx * 7919 + gy * 104729, shade(col, 0.1 + hash2(gx, gy, 113) * 0.15));
      } else if (h < 0.24) {
        boulder(ctx, px, py, 3 + hash2(gx, gy, 127) * 4, gx * 131 + gy * 17, shade(col, 0.2));
        boulder(ctx, px + 7, py + 3, 2.5 + hash2(gx, gy, 131) * 3, gx * 17 + gy * 131, shade(col, 0.12));
      } else if (h < 0.26 && py > 200) {
        oldBones(ctx, px, py, 5 + hash2(gx, gy, 137) * 4, hash2(gx, gy, 139) * 3);
      } else if (h < 0.275 && py < 900) {
        bottle(ctx, px, py, hash2(gx, gy, 149) * 3, ['#6fbf8a', '#8a5a3a', '#5fb8e8'][Math.floor(hash2(gx, gy, 151) * 3)]);
      } else if (h < 0.29 && py > 1500) {
        crystalCluster(ctx, px, py, 6 + hash2(gx, gy, 157) * 8, py > 2400 ? '#ff7a5a' : hash2(gx, gy, 163) < 0.5 ? '#6ad8ff' : '#b58cff');
      } else if (h < 0.3 && py > 700) {
        ammonite(ctx, px, py, 5 + hash2(gx, gy, 167) * 5);
      }
    }
  }
  // roots hanging from the surface
  const RC = 90;
  for (let gx = Math.floor((x0 - 60) / RC); gx <= Math.floor((x1 + 60) / RC); gx++) {
    if (hash2(gx, 0, 211) > 0.55) continue;
    const rx = gx * RC + hash2(gx, 1, 213) * RC;
    const top = rx < -10 ? CANYON_Y + 2 : 2;
    if (y0 > top + 120) continue;
    rootSystem(ctx, rx, top, 60 + hash2(gx, 2, 217) * 70, gx * 977);
  }
  // hand-placed curiosities
  for (const f of FEATURES) {
    if (f.x > x1 || f.x + f.w < x0 || f.y > y1 || f.y + f.h < y0) continue;
    ctx.save();
    f.draw(ctx);
    ctx.restore();
  }
  // depth vignette (deeper = darker)
  ctx.fillStyle = vgrad(ctx, y0, y1, [
    [0, rgba('#05030a', Math.min(0.5, Math.max(0, (y0 - 300) / 6000)))],
    [1, rgba('#05030a', Math.min(0.5, Math.max(0, (y1 - 300) / 6000)))],
  ]);
  ctx.fillRect(x0, y0, TILE, TILE);
  // warm glow near the bottom
  if (y1 > WORLD_H - 300) {
    ctx.fillStyle = vgrad(ctx, WORLD_H - 300, WORLD_H + 300, [
      [0, 'rgba(255,90,30,0)'],
      [1, 'rgba(255,90,30,0.22)'],
    ]);
    ctx.fillRect(x0, Math.max(y0, WORLD_H - 300), TILE, y1 - Math.max(y0, WORLD_H - 300));
  }
  ctx.restore();
}

interface TileEntry {
  canvas: HTMLCanvasElement;
  scale: number;
  used: number;
}

export class GroundTiles {
  private map = new Map<string, TileEntry>();
  private frame = 0;
  private built = 0;
  lang = 'ru';
  maxBuilds = 3;

  begin() {
    this.frame++;
    this.built = 0;
    if (featuresBuilt !== this.lang) this.map.clear();
    buildFeatures(this.lang);
  }

  clear() {
    this.map.clear();
    featuresBuilt = '';
  }

  get(tx: number, ty: number, want: number): TileEntry | null {
    const scales = [0.5, 1, 2, 3];
    const scale = scales.find((s) => s >= want) ?? 3;
    const key = `${tx},${ty},${scale}`;
    let e = this.map.get(key);
    if (e) {
      e.used = this.frame;
      return e;
    }
    // fallback to any existing scale while building is throttled
    if (this.built >= this.maxBuilds) {
      for (const s of scales) {
        const alt = this.map.get(`${tx},${ty},${s}`);
        if (alt) {
          alt.used = this.frame;
          return alt;
        }
      }
      if (this.built >= this.maxBuilds + 8) return null;
    }
    this.built++;
    const useScale = this.built > this.maxBuilds ? 0.5 : scale;
    const [c, ctx] = makeCanvas(TILE * useScale, TILE * useScale);
    ctx.scale(useScale, useScale);
    ctx.translate(-tx * TILE, -ty * TILE);
    renderTile(ctx, tx * TILE, ty * TILE);
    e = { canvas: c, scale: useScale, used: this.frame };
    this.map.set(`${tx},${ty},${useScale}`, e);
    if (this.map.size > 220) this.evict();
    return e;
  }

  private evict() {
    const entries = [...this.map.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, e] of entries.slice(0, 60)) if (e.used !== this.frame) this.map.delete(k);
  }
}
