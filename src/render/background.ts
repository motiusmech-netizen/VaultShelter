/* Sky, surface, parallax landscape, underground strata and rock formations. */
import { hash2, mulberry32, clamp } from '../core/util';
import { box, fillRR, glow, hgrad, makeCanvas, mix, rgba, rgrad, shade, vgrad, type Ctx, grit } from './gfx';
import { FLOOR_H, VAULT_Y0, WORLD_H, WORLD_W, CELL_W, FEET_Y } from './world';
import type { Rock } from '../sim/types';
import { GroundTiles, TILE, groundPath, setCanyonY } from './underground';
import { apron, bunkerPortal, gasStation, lampPost, litFn, mailbox, periscope, powerPoles, rocketDiner, roadSign, ruinedHouse, sandbags, satelliteDish, skull, tirePile, ventStack, waterTower, welcomeSign } from './surface';

export const RAMP_X0 = -560; // spawn / exit point on the canyon floor
export const APRON_Y = VAULT_Y0 + FEET_Y; // feet level outside the door
export const SURFACE_L = -2600;
export const SURFACE_R = WORLD_W + 2600;

/** Feet y outside the vault (canyon floor). */
export function outsideFeetY(_x: number) {
  return APRON_Y;
}

// ---------------------------------------------------------------- sky
interface SkyKey {
  t: number;
  top: string;
  mid: string;
  hor: string;
}
const SKY_DUST: SkyKey[] = [
  { t: 0, top: '#07090f', mid: '#131726', hor: '#2a2530' },
  { t: 0.22, top: '#141a2e', mid: '#4a3a4a', hor: '#c9774a' },
  { t: 0.3, top: '#3e5a7a', mid: '#b98a6a', hor: '#f0b27a' },
  { t: 0.5, top: '#5f86a8', mid: '#c9a883', hor: '#e8c89a' },
  { t: 0.7, top: '#4a5f82', mid: '#c98a5a', hor: '#f29a5a' },
  { t: 0.78, top: '#1f2440', mid: '#6a3a4a', hor: '#d9604a' },
  { t: 0.86, top: '#0a0d18', mid: '#1c1a2c', hor: '#3a2a38' },
  { t: 1, top: '#07090f', mid: '#131726', hor: '#2a2530' },
];
const SKY_CLEAR: SkyKey[] = [
  { t: 0, top: '#050a1c', mid: '#0d1a36', hor: '#1c2c4a' },
  { t: 0.22, top: '#1c2a55', mid: '#6a5a8a', hor: '#ffab7a' },
  { t: 0.3, top: '#3a7fd0', mid: '#8fc3f0', hor: '#ffe0b0' },
  { t: 0.5, top: '#2f7fe0', mid: '#79bff5', hor: '#d8f0ff' },
  { t: 0.7, top: '#3a6fc0', mid: '#8fb5e8', hor: '#ffd0a0' },
  { t: 0.78, top: '#23306a', mid: '#8a5a8a', hor: '#ff8a5a' },
  { t: 0.86, top: '#08102a', mid: '#152244', hor: '#2a3050' },
  { t: 1, top: '#050a1c', mid: '#0d1a36', hor: '#1c2c4a' },
];

function skyAt(keys: SkyKey[], p: number): SkyKey {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.t && p <= b.t) {
      const t = (p - a.t) / (b.t - a.t);
      return { t: p, top: mix(a.top, b.top, t), mid: mix(a.mid, b.mid, t), hor: mix(a.hor, b.hor, t) };
    }
  }
  return keys[0];
}

export interface SurfaceState {
  dayPhase: number; // 0..1
  dawn: number; // 0..5 project stage
  time: number;
}

export function daylight(p: number) {
  // 0 at night, 1 at noon
  return clamp(Math.sin((p - 0.25) * Math.PI * 2) * 0.5 + 0.55, 0, 1);
}

// ---------------------------------------------------------------- cached layers
const stars: { x: number; y: number; r: number; tw: number }[] = [];
{
  const rnd = mulberry32(42);
  for (let i = 0; i < 140; i++) stars.push({ x: rnd(), y: rnd() * 0.75, r: 0.4 + rnd() * 1.1, tw: rnd() * 6 });
}

let mesaCanvas: HTMLCanvasElement | null = null;
let cityCanvas: HTMLCanvasElement | null = null;
let cloudCanvases: HTMLCanvasElement[] = [];

function buildMesa() {
  const W = 2400;
  const H = 260;
  const [c, ctx] = makeCanvas(W, H);
  const rnd = mulberry32(7);
  // far range
  ctx.beginPath();
  ctx.moveTo(0, H);
  let x = 0;
  let y = H * 0.55;
  ctx.lineTo(0, y);
  while (x < W - 240) {
    const flat = rnd() < 0.5;
    const nx = x + 60 + rnd() * 160;
    const ny = flat ? y : H * (0.25 + rnd() * 0.5);
    if (flat) {
      ctx.lineTo(x + 15, ny);
      ctx.lineTo(nx - 15, ny);
    } else ctx.lineTo(nx, ny);
    x = nx;
    y = ny;
  }
  // return to the starting height so the strip tiles seamlessly
  ctx.lineTo(W - 80, H * 0.55);
  ctx.lineTo(W, H * 0.55);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  mesaCanvas = c;
}

function buildCity() {
  const W = 2400;
  const H = 200;
  const [c, ctx] = makeCanvas(W, H);
  const rnd = mulberry32(99);
  ctx.fillStyle = '#ffffff';
  let x = 0;
  while (x < W) {
    const bw = 18 + rnd() * 50;
    const bh = 30 + rnd() * 140;
    const top = H - bh;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x, top + rnd() * 10);
    // broken top
    const steps = 2 + Math.floor(rnd() * 4);
    for (let i = 1; i <= steps; i++) ctx.lineTo(x + (bw * i) / steps, top + rnd() * 22);
    ctx.lineTo(x + bw, H);
    ctx.fill();
    // antenna / spire
    if (rnd() < 0.15) ctx.fillRect(x + bw * 0.5, top - 30, 2, 32);
    x += bw + rnd() * 30;
  }
  // windows holes
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 700; i++) {
    ctx.fillRect(rnd() * W, H * 0.25 + rnd() * H * 0.7, 3, 3);
  }
  cityCanvas = c;
}

let canyonWall: HTMLCanvasElement | null = null;
/** Far canyon wall: stratified cliff with ledges and cracks; tiles horizontally. */
function buildCanyonWall() {
  const W = 1200;
  const H = 230;
  const [c, ctx] = makeCanvas(W * 2, H * 2);
  ctx.scale(2, 2);
  const rnd = mulberry32(77);
  // silhouette with mesa-like steps; starts and ends at the same height
  const pts: [number, number][] = [[0, 40]];
  let x = 0;
  while (x < W - 120) {
    x += 40 + rnd() * 110;
    const y = 10 + rnd() * 60;
    pts.push([x - 12, pts[pts.length - 1][1]]);
    pts.push([x, y]);
  }
  pts.push([W - 40, 40]);
  pts.push([W, 40]);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.lineTo(W, H);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = vgrad(ctx, 0, H, [
    [0, '#b98a62'],
    [0.35, '#9a6a48'],
    [0.7, '#7a4e34'],
    [1, '#5a3824'],
  ]);
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  // strata bands
  for (let i = 0; i < 9; i++) {
    const by = 40 + i * 20 + rnd() * 8;
    ctx.fillStyle = i % 2 ? 'rgba(255,230,190,0.1)' : 'rgba(60,30,16,0.14)';
    ctx.beginPath();
    ctx.moveTo(0, by);
    for (let xx = 0; xx <= W; xx += 30) ctx.lineTo(xx, by + Math.sin(xx * 0.01 + i) * 3);
    for (let xx = W; xx >= 0; xx -= 30) ctx.lineTo(xx, by + 8 + Math.sin(xx * 0.012 + i * 2) * 3);
    ctx.fill();
  }
  // vertical erosion cracks and shadows under ledges
  for (let i = 0; i < 60; i++) {
    const cx = rnd() * W;
    const cy = 30 + rnd() * 140;
    ctx.strokeStyle = 'rgba(50,24,12,0.35)';
    ctx.lineWidth = 0.8 + rnd();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (rnd() - 0.5) * 6, cy + 16 + rnd() * 40);
    ctx.stroke();
  }
  for (let i = 1; i < pts.length; i += 2) {
    const [px, py] = pts[i];
    ctx.fillStyle = vgrad(ctx, py, py + 30, [
      [0, 'rgba(40,20,10,0.35)'],
      [1, 'rgba(40,20,10,0)'],
    ]);
    ctx.fillRect(px - 12, py, 40, 30);
  }
  ctx.restore();
  // sunlit rim on the top edge
  ctx.strokeStyle = 'rgba(255,225,180,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  canyonWall = c;
}

function buildClouds() {
  cloudCanvases = [];
  const rnd = mulberry32(5);
  for (let k = 0; k < 6; k++) {
    const W = 260;
    const H = 90;
    const [c, ctx] = makeCanvas(W, H);
    for (let i = 0; i < 16; i++) {
      const cx = 40 + rnd() * (W - 80);
      const cy = 40 + rnd() * 25 - (Math.abs(cx - W / 2) / W) * 10;
      const r = 14 + rnd() * 26;
      ctx.fillStyle = rgrad(ctx, cx, cy, 0, r, [
        [0, 'rgba(255,255,255,0.55)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    cloudCanvases.push(c);
  }
}

function tinted(src: HTMLCanvasElement, color: string, cache: Map<string, HTMLCanvasElement>): HTMLCanvasElement {
  const key = color;
  let c = cache.get(key);
  if (c) return c;
  const [cc, ctx] = makeCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, src.width, src.height);
  if (cache.size > 40) cache.clear();
  cache.set(key, cc);
  return cc;
}
const tintCache = new Map<string, HTMLCanvasElement>();

// ---------------------------------------------------------------- rock texture
let rockPattern: CanvasPattern | null = null;
let rockTex: HTMLCanvasElement | null = null;
export function rockTexture(): HTMLCanvasElement {
  if (rockTex) return rockTex;
  const S = 512;
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = '#5a4636';
  ctx.fillRect(0, 0, S, S);
  const rnd = mulberry32(1234);
  // mottled noise
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 2 + rnd() * 18;
    const dark = rnd() < 0.5;
    ctx.fillStyle = dark ? `rgba(30,20,14,${0.05 + rnd() * 0.08})` : `rgba(160,120,90,${0.04 + rnd() * 0.07})`;
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * (0.5 + rnd() * 0.3), rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // pebbles
  for (let i = 0; i < 260; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 1.2 + rnd() * 4.5;
    const col = ['#7a6250', '#6b5645', '#8a7058', '#4a3a2e', '#9a8068'][Math.floor(rnd() * 5)];
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * 0.75, rnd() * 3, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,220,0.15)';
      ctx.beginPath();
      ctx.ellipse(x + ox - r * 0.25, y + oy - r * 0.25, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // cracks
  ctx.strokeStyle = 'rgba(20,12,8,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let x = rnd() * S;
    let y = rnd() * S;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (rnd() - 0.5) * 30;
      y += rnd() * 14;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  rockTex = c;
  return c;
}

// ---------------------------------------------------------------- draw functions
export class Background {
  private rockCache = new Map<number, { canvas: HTMLCanvasElement; x: number; y: number }>();
  tiles = new GroundTiles();

  constructor() {
    buildMesa();
    buildCanyonWall();
    buildCity();
    buildClouds();
  }

  /** Screen-space sky (drawn before world transform). */
  drawSky(ctx: Ctx, W: number, H: number, horizonSy: number, st: SurfaceState) {
    const clear = clamp(st.dawn / 4, 0, 1);
    const a = skyAt(SKY_DUST, st.dayPhase);
    const b = skyAt(SKY_CLEAR, st.dayPhase);
    const top = mix(a.top, b.top, clear);
    const mid = mix(a.mid, b.mid, clear);
    const hor = mix(a.hor, b.hor, clear);
    const hy = Math.max(horizonSy, 40);
    ctx.fillStyle = vgrad(ctx, Math.min(0, hy - H), hy, [
      [0, top],
      [0.6, mid],
      [1, hor],
    ]);
    ctx.fillRect(0, 0, W, Math.min(H, hy + 4));
    if (hy <= 0) return;
    const light = daylight(st.dayPhase);
    // stars
    const starA = clamp(1 - light * 1.8, 0, 1);
    if (starA > 0.02) {
      for (const s of stars) {
        const sy = s.y * hy;
        if (sy > hy - 10) continue;
        ctx.fillStyle = `rgba(255,255,240,${starA * (0.5 + 0.5 * Math.sin(st.time * 2 + s.tw))})`;
        ctx.fillRect(s.x * W, sy, s.r, s.r);
      }
    }
    // sun & moon
    const ang = (st.dayPhase - 0.25) * Math.PI * 2; // sunrise at 0.25
    const arcR = Math.min(W * 0.45, 700);
    const sunX = W / 2 - Math.cos(ang) * arcR;
    const sunY = hy - Math.sin(ang) * Math.min(hy * 0.85, 420);
    if (Math.sin(ang) > -0.15) {
      const sunCol = mix('#ffb070', '#fff4d0', clamp(Math.sin(ang) * 2, 0, 1));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, sunX, sunY, 160, sunCol, 0.35);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fillStyle = sunCol;
      ctx.fill();
    }
    const moonX = W / 2 + Math.cos(ang) * arcR;
    const moonY = hy + Math.sin(ang) * Math.min(hy * 0.85, 420);
    if (-Math.sin(ang) > -0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, moonX, moonY, 80, '#b8c8ff', 0.2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#e8ecf5';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 6, moonY - 3, 14, 0, Math.PI * 2);
      ctx.fillStyle = rgba(top, 0.85);
      ctx.fill();
    }
  }

  /** World-space parallax landscape above ground. camX = camera centre x. */
  drawLandscape(ctx: Ctx, camX: number, st: SurfaceState, viewL: number, viewR: number) {
    const light = daylight(st.dayPhase);
    const clear = clamp(st.dawn / 4, 0, 1);
    const hazeCol = mix(mix('#c9a07a', '#9fc3e0', clear), '#2a2a40', 1 - light);
    const layers: { img: HTMLCanvasElement; p: number; y: number; h: number; col: string; scale: number }[] = [
      { img: mesaCanvas!, p: 0.82, y: -260, h: 260, col: mix(mix('#b58a6a', '#7a95b5', clear), '#1c1c2a', 1 - light), scale: 1.25 },
      { img: cityCanvas!, p: 0.7, y: -150, h: 200, col: mix(mix('#8a6a5a', '#5a6a85', clear), '#15151f', 1 - light), scale: 0.9 },
      { img: mesaCanvas!, p: 0.5, y: -130, h: 260, col: mix(mix('#9a6a4a', '#5f7a5a', clear * 0.9), '#141418', 1 - light), scale: 0.62 },
    ];
    for (const L of layers) {
      const img = tinted(L.img, L.col, tintCache);
      const w = img.width * L.scale;
      const h = L.h * L.scale;
      const off = camX * L.p;
      const start = Math.floor((viewL - off) / w) - 1;
      const end = Math.ceil((viewR - off) / w) + 1;
      for (let i = start; i <= end; i++) ctx.drawImage(img, off + i * w, L.y * (L.scale / 1) + (1 - L.scale) * 0 + (L.y < -200 ? 0 : 0), w, h);
      // atmospheric haze between layers
      ctx.fillStyle = vgrad(ctx, L.y * L.scale, 0, [
        [0, rgba(hazeCol, 0)],
        [1, rgba(hazeCol, 0.25 * (1 - clear * 0.6))],
      ]);
      ctx.fillRect(viewL, L.y * L.scale, viewR - viewL, -L.y * L.scale);
    }
    // clouds
    for (let i = 0; i < 9; i++) {
      const img = cloudCanvases[i % cloudCanvases.length];
      const span = 3600;
      const cx = ((st.time * (6 + (i % 3) * 3) + i * 520) % span) - 1200 + camX * 0.85;
      const cy = -420 + (i % 4) * 55;
      ctx.globalAlpha = (0.35 + 0.35 * light) * (0.7 + (i % 2) * 0.3);
      ctx.drawImage(img, cx, cy, 260 * (1 + (i % 3) * 0.3), 90 * (1 + (i % 3) * 0.3));
    }
    ctx.globalAlpha = 1;
    // dust haze near ground (fades as dawn progresses)
    const dust = clamp(1 - st.dawn / 3, 0, 1);
    if (dust > 0.01) {
      ctx.fillStyle = vgrad(ctx, -220, 0, [
        [0, rgba('#d9a877', 0)],
        [1, rgba(mix('#d9a877', '#40304a', 1 - light), 0.35 * dust)],
      ]);
      ctx.fillRect(viewL, -220, viewR - viewL, 220);
    }
  }

  /** The ground mass: canyon floor on the left, cliff with the vault door, plateau above the vault. */
  drawGround(ctx: Ctx, st: SurfaceState, viewL: number, viewR: number, viewT: number, viewB: number, pxScale = 1) {
    const light = daylight(st.dayPhase);
    const green = clamp((st.dawn - 2) / 3, 0, 1);
    const L = Math.max(SURFACE_L, viewL - 50);
    const R = Math.min(SURFACE_R, viewR + 50);
    const CY = APRON_Y + 5; // canyon ground level
    // far canyon wall fill between the horizon layers and the canyon floor (left side only)
    if (L < 0 && canyonWall) {
      const wallW = 1200;
      const top = -70;
      const h = CY - top + 4;
      const night = tinted(canyonWall, '#161420', tintCache);
      const green = clamp((st.dawn - 2) / 3, 0, 1);
      for (let x = Math.floor(L / wallW) * wallW; x < Math.min(0, R); x += wallW) {
        ctx.drawImage(canyonWall, x, top, wallW, h);
        if (green > 0.01) {
          ctx.globalAlpha = green * 0.35;
          ctx.drawImage(tinted(canyonWall, '#6a8a4a', tintCache), x, top, wallW, h);
        }
        ctx.globalAlpha = (1 - light) * 0.82;
        ctx.drawImage(night, x, top, wallW, h);
        ctx.globalAlpha = 1;
      }
      // dust haze in front of the far wall
      ctx.fillStyle = vgrad(ctx, top, CY, [
        [0, rgba(mix('#d9a877', '#2a2a40', 1 - light), 0.25 * (1 - green))],
        [1, rgba(mix('#d9a877', '#2a2a40', 1 - light), 0.05)],
      ]);
      ctx.fillRect(L, top, -L, CY - top);
    }
    // underground mass: cached cross-section tiles
    setCanyonY(CY);
    this.tiles.lang = this.lang;
    this.tiles.begin();
    const gB = Math.min(viewB, WORLD_H + 400);
    const tx0 = Math.floor(L / TILE);
    const tx1 = Math.floor(R / TILE);
    const ty0 = Math.max(0, Math.floor(viewT / TILE));
    const ty1 = Math.floor(gB / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const e = this.tiles.get(tx, ty, pxScale);
        if (e) ctx.drawImage(e.canvas, tx * TILE, ty * TILE, TILE + 0.5, TILE + 0.5);
        else if (ty > 0) {
          ctx.fillStyle = '#6a4a38';
          ctx.fillRect(tx * TILE, ty * TILE, TILE + 0.5, TILE + 0.5);
        }
      }
    }
    ctx.save();
    groundPath(ctx, L, R, WORLD_H + 400);
    ctx.clip();
    // topsoil on the plateau
    ctx.fillStyle = vgrad(ctx, 0, 40, [
      [0, mix(mix('#8a6a45', '#5a7a3a', green), '#2a2420', 1 - light * 0.6)],
      [1, rgba('#3a2a1e', 0)],
    ]);
    ctx.fillRect(-40, 0, R + 40, 40);
    // topsoil on the canyon floor
    ctx.fillStyle = vgrad(ctx, CY, CY + 30, [
      [0, mix(mix('#9a7a55', '#5a7a3a', green), '#2a2420', 1 - light * 0.6)],
      [1, rgba('#3a2a1e', 0)],
    ]);
    ctx.fillRect(L, CY, -L, 30);
    // cliff face shading
    ctx.fillStyle = hgrad(ctx, -50, 20, [
      [0, rgba('#000000', 0)],
      [0.5, rgba('#000000', 0.25)],
      [1, rgba('#000000', 0)],
    ]);
    ctx.fillRect(-50, 0, 70, CY);
    ctx.restore();

    const lit = litFn(light);
    this.drawSurfaceDetails(ctx, st, L, R);
    // bunker entrance built into the cliff, apron, lamps and the welcome area
    bunkerPortal(ctx, lit, VAULT_Y0, CY, light, st.time, this.lang);
    apron(ctx, lit, -200, -4, CY, light, this.lang);
    for (const lx of [-186, -106]) lampPost(ctx, lit, lx, CY - 1, light, st.time);
    sandbags(ctx, lit, -236, CY + 1, 3);
    mailbox(ctx, lit, -150, CY - 1, this.lang, st.time);
    welcomeSign(ctx, lit, -420, CY, light, st.time, this.lang);
    roadSign(ctx, lit, -548, CY, this.lang);
    tirePile(ctx, lit, -600, CY);
    gasStation(ctx, lit, -760, CY, this.lang, st.time);

  }

  lang = 'ru';
  signText = () => (this.lang === 'ru' ? 'УБЕЖИЩЕ →' : 'SHELTER →');

  private drawSurfaceDetails(ctx: Ctx, st: SurfaceState, L: number, R: number) {
    const light = daylight(st.dayPhase);
    const dawn = st.dawn;
    const green = clamp((dawn - 2) / 2, 0, 1);
    const sand = mix(mix('#c8a46e', '#8fbf5a', green), '#2b2a2a', 1 - light * 0.85);
    // ground crust: canyon floor (left) and plateau (right)
    const CY = APRON_Y + 5;
    ctx.fillStyle = vgrad(ctx, CY - 6, CY + 10, [
      [0, shade(sand, 0.06)],
      [1, shade(sand, -0.35)],
    ]);
    ctx.beginPath();
    ctx.moveTo(L, CY);
    for (let x = L; x <= -10; x += 40) ctx.lineTo(x, CY - 1 - hash2(Math.floor(x / 40), 5) * 2.5);
    ctx.lineTo(-10, CY + 8);
    ctx.lineTo(L, CY + 8);
    ctx.fill();
    ctx.fillStyle = vgrad(ctx, -6, 10, [
      [0, shade(sand, 0.08)],
      [1, shade(sand, -0.35)],
    ]);
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    for (let x = -34; x <= R; x += 40) ctx.lineTo(x, -2 - Math.sin(x * 0.02) * 2 - hash2(Math.floor(x / 40), 1) * 3);
    ctx.lineTo(R, 8);
    ctx.lineTo(-34, 8);
    ctx.fill();

    // hill over the vault entrance
    this.drawHill(ctx, sand, light, green);

    // decorations (deterministic per 120-unit cell)
    const step = 120;
    for (let gx = Math.floor(L / step); gx <= Math.ceil(R / step); gx++) {
      const x = gx * step + hash2(gx, 2) * 80;
      const canyon = x < -20;
      if (x > -800 && x < 440) continue; // keep the entrance, canyon set and the hill clean
      if ((x > 1040 && x < 1290) || (x > 1360 && x < 1560) || (x > 1700 && x < 1780)) continue;
      const y = canyon ? CY : 0;
      const h = hash2(gx, 7);
      if (dawn >= 3 && h < 0.35) tree(ctx, x, y, 30 + hash2(gx, 8) * 40, light, dawn >= 4);
      else if (h < 0.12) deadTree(ctx, x, y, 24 + hash2(gx, 8) * 22, light);
      else if (h < 0.2) rockPile(ctx, x, y, light);
      else if (h < 0.25) cactus(ctx, x, y, light, green);
      else if (h < 0.28 && !canyon) pylon(ctx, x, y, light);
      else if (h < 0.31) rustyCar(ctx, x, y, light);
      if (dawn >= 2) grass(ctx, x + 30, y, light, green, gx);
      if (dawn >= 3 && hash2(gx, 17) < 0.5) flowers(ctx, x + 50, y, gx);
    }
    // tumbleweed rolling along the canyon floor
    {
      const tw = ((st.time * 38) % 2600) - 2400;
      const bounce = Math.abs(Math.sin(st.time * 3)) * 8;
      ctx.save();
      ctx.translate(tw, CY - 7 - bounce);
      ctx.rotate(st.time * 4);
      ctx.strokeStyle = mix('#9a7a4a', '#2a2218', 1 - light);
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4 + (i % 3), (i * Math.PI) / 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    // plateau landmarks
    const lit = litFn(light);
    ventStack(ctx, lit, 470, 0, 34, st.time);
    ventStack(ctx, lit, 760, 0, 26, st.time + 3);
    periscope(ctx, lit, 620, 0, st.time);
    billboard(ctx, 900, 0, light, st, this.lang);
    waterTower(ctx, lit, 1160, 0, this.lang);
    ruinedHouse(ctx, lit, 1380, 0);
    rocketDiner(ctx, lit, 1740, 0, light, this.lang);
    powerPoles(ctx, lit, 1830, 2260, 0, 90);
    satelliteDish(ctx, lit, 2060, 0, st.time);
    skull(ctx, lit, -520, CY, 1.2);
    skull(ctx, lit, 1300, 0, 1);
    // pond (stage 2+)
    if (dawn >= 2) pond(ctx, 1500, 0, light, st.time);
    // birds (stage 4+)
    if (dawn >= 4) {
      ctx.strokeStyle = rgba('#1a1a22', 0.7);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        const bx = ((st.time * 22 + i * 180) % 2600) - 600;
        const by = -260 + Math.sin(st.time * 0.8 + i) * 20 + (i % 3) * 30;
        const f = Math.sin(st.time * 8 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by - f);
        ctx.quadraticCurveTo(bx - 2, by - 2, bx, by);
        ctx.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - f);
        ctx.stroke();
      }
    }
  }

  private drawHill(ctx: Ctx, sand: string, light: number, green: number) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-40, 2);
    ctx.bezierCurveTo(-30, -60, 20, -120, 90, -130);
    ctx.bezierCurveTo(170, -140, 230, -90, 290, -40);
    ctx.bezierCurveTo(320, -14, 360, -4, 400, 2);
    ctx.closePath();
    const rock = mix(mix('#9a7552', '#6f7a55', green * 0.6), '#252220', 1 - light * 0.85);
    ctx.fillStyle = vgrad(ctx, -140, 0, [
      [0, shade(rock, 0.18)],
      [1, shade(rock, -0.25)],
    ]);
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rockPattern ?? '#5a4636';
    ctx.fillRect(-60, -150, 480, 160);
    ctx.globalAlpha = 1;
    // strata lines
    ctx.strokeStyle = rgba('#000', 0.18);
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-60, -20 - i * 24);
      ctx.bezierCurveTo(60, -30 - i * 24, 200, -10 - i * 24, 420, -26 - i * 24);
      ctx.stroke();
    }
    ctx.restore();
    // sign on the hill
    const sx = 120;
    const sy = -118;
    ctx.fillStyle = '#2a2d31';
    ctx.fillRect(sx - 30, sy + 8, 2, 30);
    ctx.fillRect(sx + 28, sy + 8, 2, 30);
    box(ctx, sx - 42, sy - 16, 84, 26, mix('#ffb02e', '#6a4a1a', 1 - light), 3);
    ctx.font = '800 10px Unbounded, Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a1a0a';
    ctx.fillText(this.lang === 'ru' ? 'АТОМУЮТ' : 'ATOMHOME', sx, sy - 3);
    // antenna
    ctx.strokeStyle = '#3a3d44';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(240, -100);
    ctx.lineTo(250, -190);
    ctx.lineTo(260, -100);
    ctx.moveTo(244, -130);
    ctx.lineTo(256, -130);
    ctx.moveTo(247, -160);
    ctx.lineTo(253, -160);
    ctx.stroke();
    ctx.fillStyle = Math.sin(performance.now() / 400) > 0 ? '#ff4a3a' : '#5a1a14';
    ctx.beginPath();
    ctx.arc(250, -192, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Reinforced concrete casing around the vault rooms, with a soft shadow in the soil. */
  drawExcavation(ctx: Ctx, rects: { x: number; y: number; w: number; h: number }[]) {
    for (const [pad, a] of [
      [22, 0.08],
      [15, 0.12],
      [10, 0.16],
    ] as const) {
      const c = rgba('#0a0604', a);
      for (const r of rects) fillRR(ctx, r.x - pad, r.y - pad * 0.7, r.w + pad * 2, r.h + pad * 1.4, pad, c);
    }
    const P = 6;
    for (const r of rects) {
      ctx.fillStyle = vgrad(ctx, r.y - P, r.y + r.h + P, [
        [0, '#8a8c8e'],
        [0.05, '#6a6c6f'],
        [0.5, '#5d5f62'],
        [0.95, '#505255'],
        [1, '#35373a'],
      ]);
      ctx.fillRect(r.x - P, r.y - P, r.w + P * 2, r.h + P * 2);
    }
    // form-work seams, tie holes and a light lip along the top edge
    for (const r of rects) {
      ctx.fillStyle = rgba('#000', 0.35);
      for (let x = r.x; x <= r.x + r.w + 0.1; x += CELL_W) {
        ctx.fillRect(x - 0.4, r.y - P, 0.8, P);
        ctx.fillRect(x - 0.4, r.y + r.h, 0.8, P);
      }
      ctx.fillStyle = rgba('#1a1c1e', 0.8);
      for (let x = r.x + CELL_W / 2; x < r.x + r.w; x += CELL_W) {
        ctx.beginPath();
        ctx.arc(x, r.y - P / 2, 0.8, 0, Math.PI * 2);
        ctx.arc(x, r.y + r.h + P / 2, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgba('#ffffff', 0.18);
      ctx.fillRect(r.x - P, r.y - P, r.w + P * 2, 0.8);
    }
  }

  rockCanvas(rk: Rock) {
    let e = this.rockCache.get(rk.id);
    if (e) return e;
    const w = rk.w * CELL_W;
    const h = FLOOR_H;
    const [c, ctx] = makeCanvas(w * 2 + 20, h * 2 + 20);
    ctx.scale(2, 2);
    ctx.translate(5, 5);
    const rnd = mulberry32(rk.id * 31 + 7);
    const deep = rk.floor > 12;
    const base = deep ? '#4a4048' : '#6a5a4c';
    // boulders
    const n = rk.w * 3;
    const blobs: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < n; i++) blobs.push({ x: 10 + rnd() * (w - 20), y: 20 + rnd() * (h - 30), r: 14 + rnd() * 22 });
    blobs.sort((a, b) => a.y - b.y);
    for (const b of blobs) {
      ctx.save();
      ctx.beginPath();
      const pts = 7;
      for (let k = 0; k < pts; k++) {
        const a = (k / pts) * Math.PI * 2;
        const rr = b.r * (0.75 + rnd() * 0.35);
        const px = b.x + Math.cos(a) * rr;
        const py = b.y + Math.sin(a) * rr * 0.8;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = rgrad(ctx, b.x - b.r * 0.4, b.y - b.r * 0.4, 2, b.r * 1.3, [
        [0, shade(base, 0.35)],
        [0.6, base],
        [1, shade(base, -0.5)],
      ]);
      ctx.fill();
      ctx.strokeStyle = rgba('#000', 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.clip();
      grit(ctx, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2, 0.25, 0.3);
      ctx.restore();
    }
    if (rk.treasure) {
      // a glint
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, w * 0.6, h * 0.45, 10, '#ffe27a', 0.5);
      ctx.restore();
    }
    // ore veins
    for (let i = 0; i < rk.w * 2; i++) {
      ctx.fillStyle = deep ? '#ff8a5a' : '#c9a24a';
      ctx.fillRect(10 + rnd() * (w - 20), 20 + rnd() * (h - 30), 2, 2);
    }
    e = { canvas: c, x: -5, y: -5 };
    this.rockCache.set(rk.id, e);
    return e;
  }

  forgetRock(id: number) {
    this.rockCache.delete(id);
  }
}

// ---------------------------------------------------------------- small decorations
function deadTree(ctx: Ctx, x: number, y: number, h: number, light: number) {
  ctx.strokeStyle = mix('#4a3626', '#141210', 1 - light);
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 2, y - h);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 1, y - h * 0.6);
  ctx.lineTo(x - h * 0.3, y - h * 0.9);
  ctx.moveTo(x + 2, y - h * 0.75);
  ctx.lineTo(x + h * 0.35, y - h * 1.05);
  ctx.moveTo(x + 2, y - h);
  ctx.lineTo(x + h * 0.15, y - h * 1.2);
  ctx.stroke();
  ctx.lineCap = 'butt';
}
function tree(ctx: Ctx, x: number, y: number, h: number, light: number, lush: boolean) {
  ctx.fillStyle = mix('#5a3a22', '#141210', 1 - light);
  ctx.fillRect(x - 2, y - h * 0.5, 4, h * 0.5);
  const leaf = mix(lush ? '#4f9b4a' : '#7a9a4a', '#12201a', 1 - light);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1.5) * h * 0.18, y - h * 0.62 - (i % 2) * h * 0.14, h * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = shade(leaf, (i % 2) * 0.1 - 0.05);
    ctx.fill();
  }
}
function rockPile(ctx: Ctx, x: number, y: number, light: number) {
  const c = mix('#8a7058', '#1c1a18', 1 - light);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * 8, y - 3 - (i % 2) * 3, 7 - i, 5 - i * 0.5, 0, Math.PI, 0);
    ctx.fillStyle = shade(c, i * 0.08);
    ctx.fill();
  }
}
function cactus(ctx: Ctx, x: number, y: number, light: number, green: number) {
  const c = mix(mix('#6a8a4a', '#4f9b4a', green), '#131a12', 1 - light);
  fillRR(ctx, x - 3, y - 26, 6, 26, 3, c);
  fillRR(ctx, x - 10, y - 18, 4, 10, 2, c);
  fillRR(ctx, x - 10, y - 11, 8, 3, 1.5, c);
  fillRR(ctx, x + 6, y - 22, 4, 9, 2, c);
  fillRR(ctx, x + 2, y - 15, 8, 3, 1.5, c);
}
function pylon(ctx: Ctx, x: number, y: number, light: number) {
  ctx.strokeStyle = mix('#5a5a5a', '#161616', 1 - light);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x, y - 70);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x - 7, y - 20);
  ctx.lineTo(x + 7, y - 20);
  ctx.moveTo(x - 4, y - 45);
  ctx.lineTo(x + 4, y - 45);
  ctx.moveTo(x - 14, y - 60);
  ctx.lineTo(x + 14, y - 60);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 60);
  ctx.quadraticCurveTo(x + 70, y - 40, x + 130, y - 58);
  ctx.stroke();
}
function rustyCar(ctx: Ctx, x: number, y: number, light: number) {
  const c = mix('#8a4a2a', '#1a1412', 1 - light);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.06);
  fillRR(ctx, -22, -12, 44, 9, 3, c);
  fillRR(ctx, -12, -20, 22, 9, 4, shade(c, -0.1));
  ctx.fillStyle = mix('#2a3a44', '#0a0c0e', 1 - light);
  ctx.fillRect(-9, -18, 7, 5);
  ctx.fillRect(0, -18, 7, 5);
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.arc(-13, -3, 4, 0, Math.PI * 2);
  ctx.arc(13, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function grass(ctx: Ctx, x: number, y: number, light: number, green: number, seed: number) {
  ctx.strokeStyle = mix(mix('#9aa05a', '#4fa34a', green), '#10180e', 1 - light);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const gx = x + i * 4 + hash2(seed, i) * 3;
    const h = 4 + hash2(seed, i, 3) * (6 + green * 8);
    ctx.moveTo(gx, y);
    ctx.quadraticCurveTo(gx + 1, y - h * 0.6, gx + (hash2(seed, i, 5) - 0.5) * 4, y - h);
  }
  ctx.stroke();
}
function flowers(ctx: Ctx, x: number, y: number, seed: number) {
  const cols = ['#ff7cc0', '#ffcf4a', '#ffffff', '#b58cff'];
  for (let i = 0; i < 4; i++) {
    const fx = x + i * 6;
    const fy = y - 6 - hash2(seed, i) * 5;
    ctx.fillStyle = '#4f9b4a';
    ctx.fillRect(fx, fy, 0.8, y - fy);
    ctx.fillStyle = cols[(seed + i) % 4];
    ctx.beginPath();
    ctx.arc(fx + 0.4, fy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
function pond(ctx: Ctx, x: number, y: number, light: number, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 90, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = mix('#4aa3d9', '#0c1a2a', 1 - light);
  ctx.fill();
  ctx.strokeStyle = rgba('#ffffff', 0.35 * light);
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 30 + i * 30 + Math.sin(t + i) * 5, y + 2, 10, 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
function billboard(ctx: Ctx, x: number, y: number, light: number, st: SurfaceState, lang: string) {
  ctx.fillStyle = mix('#3a3d44', '#101114', 1 - light);
  ctx.fillRect(x - 40, y - 70, 3, 70);
  ctx.fillRect(x + 37, y - 70, 3, 70);
  const bw = 120;
  const bh = 52;
  const bx = x - bw / 2;
  const by = y - 118;
  box(ctx, bx - 3, by - 3, bw + 6, bh + 6, mix('#4a4f55', '#141518', 1 - light), 2);
  ctx.fillStyle = vgrad(ctx, by, by + bh, [
    [0, mix('#7fc3e8', '#1a2a3a', 1 - light)],
    [1, mix('#f3d7a4', '#2a2420', 1 - light)],
  ]);
  ctx.fillRect(bx, by, bw, bh);
  // happy family silhouette
  ctx.fillStyle = mix('#2b7fb8', '#10202c', 1 - light);
  for (let i = 0; i < 3; i++) {
    const px = bx + 20 + i * 12;
    ctx.beginPath();
    ctx.arc(px, by + 22 - (i === 2 ? -4 : 0), 4 - (i === 2 ? 1 : 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 3.5, by + 27 - (i === 2 ? -4 : 0), 7, 16 - (i === 2 ? 4 : 0));
  }
  ctx.font = '800 7px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = mix('#c7433b', '#3a1410', 1 - light);
  const ru = lang === 'ru';
  ctx.fillText(ru ? 'АТОМУЮТ' : 'ATOMHOME', bx + 58, by + 16);
  ctx.font = '600 5.2px Oswald, sans-serif';
  ctx.fillStyle = mix('#2a1a0a', '#0a0806', 1 - light);
  ctx.fillText(ru ? 'Уют на тысячу лет!' : 'Cozy for 1000 years!', bx + 58, by + 28);
  ctx.fillText(ru ? 'Мест пока нет :)' : 'Sold out :)', bx + 58, by + 37);
  // rust stains / damage
  ctx.fillStyle = rgba('#5a3a22', 0.35 * (1 - st.dawn / 5));
  ctx.fillRect(bx + 90, by, 6, bh);
  ctx.beginPath();
  ctx.moveTo(bx + bw, by);
  ctx.lineTo(bx + bw - 18, by);
  ctx.lineTo(bx + bw, by + 16);
  ctx.fillStyle = mix('#7fc3e8', '#1a2a3a', 1 - light);
  ctx.globalAlpha = 0.0;
  ctx.fill();
  ctx.globalAlpha = 1;
}

export { FLOOR_H, VAULT_Y0 };
