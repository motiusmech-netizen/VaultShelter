/*
 * Character renderer v4.
 * Every dweller is built from a parametric "DNA": build, height, face shape, nose, eye shape,
 * brows, age, marks and accessories, plus a parametric hair system (24 styles). Cartoon cel
 * shading with coloured outlines; front (3/4), side and back views.
 * Feet at (0,0). Side view faces +x. ~47 world units tall for an average adult.
 */
import { mix, rgba, shade, type Ctx } from './gfx';
import type { OutfitDef, WeaponDef } from '../data/items';
import { drawWeapon, muzzleFlash, weaponProfile, type WeaponProfile } from './weaponArt';

export { drawWeapon };
import { HAIR_COLORS, SKIN_TONES } from '../sim/dwellers';
import type { Look } from '../sim/types';

export interface Pose {
  view: 'front' | 'side' | 'back';
  /** front: outward swing of left/right leg; side: forward swing of near/far leg */
  legA: number;
  legB: number;
  kneeA?: number;
  kneeB?: number;
  /** front: outward raise of left/right arm; side: forward swing of near/far arm */
  armA: number;
  armB: number;
  elbowA?: number;
  elbowB?: number;
  bob: number;
  lean: number;
  mouth: 'happy' | 'neutral' | 'sad' | 'open' | 'grin';
  eyes: 'open' | 'closed' | 'wide' | 'x';
  blink: boolean;
  weapon?: WeaponDef | null;
  aim?: boolean;
  flash?: boolean;
  child?: boolean;
  lookDir?: number;
  /** 3/4 turn in front view: -1 left, 1 right */
  facing?: number;
  hold?: 'none' | 'tray' | 'wrench' | 'book' | 'dumbbell';
  /** back view: hands reach forward (hidden behind the body) */
  reach?: boolean;
  /** breathing phase -1..1 */
  breath?: number;
  /** weapon attack cycle 0..1 (undefined: not attacking) */
  attack?: number;
}

export const DEFAULT_POSE: Pose = {
  view: 'front',
  legA: 0,
  legB: 0,
  armA: 0.08,
  armB: 0.08,
  bob: 0,
  lean: 0,
  mouth: 'neutral',
  eyes: 'open',
  blink: false,
  facing: 1,
};

let vaultLabel = '';
/** Number printed on the back of vault jumpsuits. */
export function setVaultLabel(n: number) {
  vaultLabel = String(n).padStart(3, '0');
}

const EYE_COLORS = ['#4f7fc0', '#6b4a2e', '#4f8a5a', '#3a2a22', '#7a8a9a', '#8a6a2a', '#3f7a8a'];
const LIP_COLORS = ['#c9606a', '#d6304a', '#b0306a', '#e05a3a'];

// ------------------------------------------------------------------ DNA
export interface Dna {
  build: number; // 0 slim, 1 average, 2 athletic, 3 stocky, 4 heavy
  height: number; // -2..2
  shape: number; // face: 0 oval, 1 round, 2 square, 3 long, 4 heart
  nose: number; // 0 button, 1 straight, 2 wide, 3 long, 4 upturned
  eyes: number; // 0 round, 1 almond, 2 sleepy, 3 narrow, 4 big
  brows: number; // 0 thin arched, 1 thick straight, 2 bushy, 3 angled
  age: number; // 0 young, 1 adult, 2 middle-aged, 3 elder
  mark: number; // 0 none, 1 freckles, 2 mole, 3 scar, 4 rosy cheeks, 5 eyepatch
  acc: number; // 0 none, 1 earrings, 2 headband, 3 flower, 4 headphones, 5 bandage, 6 bow, 7 rolled sleeves
  lips: number; // 0 natural, 1..3 lipstick
  glasses: number; // frame style 0 round, 1 square, 2 shades
  part: number; // hair part side -1 / 1
}

function lookHash(l: Look, k: number) {
  let h = (l.skin * 73856093) ^ (l.hair * 19349663) ^ (l.hairColor * 83492791) ^ (l.beard * 26544357) ^ ((l.face | 0) * 97531) ^ (k * 374761393);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const dnaCache = new WeakMap<Look, Dna>();
export function dnaOf(look: Look, female: boolean): Dna {
  let d = dnaCache.get(look);
  if (d) return d;
  const h = (k: number) => lookHash(look, k);
  const gray = look.hairColor === 6 || look.hairColor === 9;
  d = {
    build: look.body ?? [0, 1, 1, 2, 3, 4][Math.floor(h(1) * 6)],
    height: look.height ?? Math.floor(h(2) * 5) - 2,
    shape: look.shape ?? Math.floor(h(3) * 5),
    nose: look.nose ?? Math.floor(h(4) * 5),
    eyes: look.eyes ?? Math.floor(h(5) * 5),
    brows: look.brows ?? (female ? (h(6) < 0.7 ? 0 : 3) : Math.floor(h(6) * 4)),
    age: look.age ?? (gray ? 3 : Math.floor(h(7) * 3)),
    mark: look.mark ?? (h(8) < 0.6 ? 0 : 1 + Math.floor(h(9) * 4)),
    acc: look.acc ?? (h(10) < 0.6 ? 0 : 1 + Math.floor(h(11) * 7)),
    lips: look.lips ?? (female && h(12) < 0.35 ? 1 + Math.floor(h(13) * 3) : 0),
    glasses: Math.floor(h(14) * 3),
    part: h(15) < 0.5 ? -1 : 1,
  };
  dnaCache.set(look, d);
  return d;
}

interface Build {
  sh: number;
  chest: number;
  waist: number;
  hip: number;
  limb: number;
  belly: number;
  neck: number;
}
const BUILDS: Build[] = [
  { sh: 6.9, chest: 6.2, waist: 5.1, hip: 5.6, limb: 0.86, belly: 0, neck: 3.3 },
  { sh: 7.6, chest: 6.9, waist: 6.0, hip: 6.4, limb: 1.0, belly: 0, neck: 3.8 },
  { sh: 8.7, chest: 7.9, waist: 5.9, hip: 6.2, limb: 1.13, belly: 0, neck: 4.4 },
  { sh: 8.3, chest: 7.7, waist: 7.3, hip: 7.1, limb: 1.15, belly: 0.5, neck: 4.5 },
  { sh: 8.5, chest: 8.3, waist: 8.8, hip: 8.1, limb: 1.2, belly: 1.2, neck: 4.5 },
];
function buildOf(d: Dna, female: boolean, child: boolean): Build {
  const b = BUILDS[Math.max(0, Math.min(4, d.build))];
  if (!female && !child) return b;
  const r = { ...b };
  if (female) {
    r.sh -= 0.8;
    r.chest -= 0.3;
    r.waist = Math.max(4.7, r.waist - 1.0);
    r.hip += 0.9;
    r.limb *= 0.92;
    r.neck -= 0.4;
  }
  if (child) {
    r.waist += 0.4;
    r.belly = Math.max(r.belly, 0.2);
  }
  return r;
}

interface Rig {
  look: Look;
  dna: Dna;
  B: Build;
  o: OutfitDef;
  p: Pose;
  female: boolean;
  child: boolean;
  skin: string;
  hair: string;
  headS: number;
}

// ------------------------------------------------------------------ colour helpers
const cache = new Map<string, { base: string; dark: string; light: string; line: string }>();
function tones(c: string) {
  let t = cache.get(c);
  if (!t) {
    t = {
      base: c,
      dark: mix(shade(c, -0.28), '#3a2a5a', 0.12),
      light: shade(c, 0.3),
      line: mix(shade(c, -0.66), '#1a1020', 0.35),
    };
    cache.set(c, t);
  }
  return t;
}

const LW = 0.8;
/** Warm, slightly saturated shadow for skin so faces never turn grey. */
function skinShadow(skin: string) {
  return mix(shade(skin, -0.17), '#b0402e', 0.14);
}

// ------------------------------------------------------------------ primitives
function capsulePath(ctx: Ctx, ax: number, ay: number, bx: number, by: number, wa: number, wb: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;
  const ang = Math.atan2(ny, nx);
  ctx.beginPath();
  ctx.moveTo(ax + (nx * wa) / 2, ay + (ny * wa) / 2);
  ctx.lineTo(bx + (nx * wb) / 2, by + (ny * wb) / 2);
  ctx.arc(bx, by, wb / 2, ang, ang + Math.PI, true);
  ctx.lineTo(ax - (nx * wa) / 2, ay - (ny * wa) / 2);
  ctx.arc(ax, ay, wa / 2, ang + Math.PI, ang, true);
  ctx.closePath();
}

/** Tapered limb segment with form shadow away from the light (upper-left) and a rim light. */
function limbSeg(ctx: Ctx, ax: number, ay: number, bx: number, by: number, wa: number, wb: number, color: string, outline = true) {
  const t = tones(color);
  capsulePath(ctx, ax, ay, bx, by, wa, wb);
  ctx.fillStyle = t.base;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 0.001;
  let nx = -dy / len;
  let ny = dx / len;
  if (nx * 0.8 + ny * 0.6 < 0) {
    nx = -nx;
    ny = -ny;
  }
  capsulePath(ctx, ax + (nx * wa) / 4.2, ay + (ny * wa) / 4.2, bx + (nx * wb) / 4.2, by + (ny * wb) / 4.2, wa * 0.42, wb * 0.42);
  ctx.fillStyle = t.dark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ax - (nx * wa) / 2.9, ay - (ny * wa) / 2.9);
  ctx.lineTo(bx - (nx * wb) / 2.9, by - (ny * wb) / 2.9);
  ctx.lineWidth = Math.min(wa, wb) * 0.16;
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(t.light, 0.65);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function dot(ctx: Ctx, x: number, y: number, r: number, c: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
}

/** Fill the current path with cel shading: base + inner shadow via offset (clip-based). */
function celFill(ctx: Ctx, color: string, pathFn: () => void, offX = 1.6, offY = 1.2, outline = true, darkC?: string) {
  const t = tones(color);
  pathFn();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.translate(offX, offY);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = darkC ?? t.dark;
  ctx.fillRect(-60, -80, 120, 120);
  ctx.translate(-offX * 2, -offY * 2);
  pathFn();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.translate(offX * 1.45, offY * 1.45);
  ctx.globalCompositeOperation = 'source-over';
  pathFn();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = rgba(t.light, 0.42);
  ctx.stroke();
  ctx.restore();
  if (outline) {
    pathFn();
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ------------------------------------------------------------------ skeleton
interface Joints {
  hipL: [number, number];
  hipR: [number, number];
  kneeL: [number, number];
  kneeR: [number, number];
  ankleL: [number, number];
  ankleR: [number, number];
  shL: [number, number];
  shR: [number, number];
  elL: [number, number];
  elR: [number, number];
  haL: [number, number];
  haR: [number, number];
}

const THIGH = 8.9;
const SHIN = 8.5;
const UPPER = 7.5;
const FORE = 7.0;
/** hip joint (world units, feet at 0) */
const HIP_Y = -18.4;
/** the upper body is authored in its own space and lifted by UP */
const UP = 3.0;
const SH_Y = -27.2;
const NECK_Y = -31;
const HY = -38.2;
const HR = 8.1;

function headSpace(ctx: Ctx, R: Rig) {
  ctx.translate(0, NECK_Y);
  ctx.scale(R.headS, R.headS);
  if (R.dna.age >= 3 && !R.child) ctx.translate(0.3, 0.6);
  ctx.translate(0, -NECK_Y);
}

function foreArm(e: number) {
  return FORE * (1 - 0.3 * Math.sin(Math.min(Math.abs(e), Math.PI / 2)));
}

function frontJoints(p: Pose, B: Build): Joints {
  const hipW = B.hip * 0.5 + 0.2;
  const shW = B.sh - 0.2;
  const kA = p.kneeA ?? 0;
  const kB = p.kneeB ?? 0;
  const hipL: [number, number] = [-hipW, HIP_Y];
  const hipR: [number, number] = [hipW, HIP_Y];
  const kneeL: [number, number] = [hipL[0] - Math.sin(p.legA) * THIGH, hipL[1] + Math.cos(p.legA) * THIGH * (1 - kA * 0.15)];
  const kneeR: [number, number] = [hipR[0] + Math.sin(p.legB) * THIGH, hipR[1] + Math.cos(p.legB) * THIGH * (1 - kB * 0.15)];
  const ankleL: [number, number] = [kneeL[0] - Math.sin(p.legA * 0.5) * SHIN, kneeL[1] + Math.cos(p.legA * 0.5) * SHIN * (1 - kA * 0.25)];
  const ankleR: [number, number] = [kneeR[0] + Math.sin(p.legB * 0.5) * SHIN, kneeR[1] + Math.cos(p.legB * 0.5) * SHIN * (1 - kB * 0.25)];
  const shL: [number, number] = [-shW, SH_Y];
  const shR: [number, number] = [shW, SH_Y];
  const eA = p.elbowA ?? 0.14;
  const eB = p.elbowB ?? 0.14;
  const out = B.belly * 0.12;
  const elL: [number, number] = [shL[0] - Math.sin(p.armA + out) * UPPER, shL[1] + Math.cos(p.armA + out) * UPPER];
  const elR: [number, number] = [shR[0] + Math.sin(p.armB + out) * UPPER, shR[1] + Math.cos(p.armB + out) * UPPER];
  const fa = p.armA - eA * 0.8;
  const fb = p.armB - eB * 0.8;
  const la = foreArm(eA);
  const lb = foreArm(eB);
  const haL: [number, number] = [elL[0] - Math.sin(fa) * la, elL[1] + Math.cos(fa) * la];
  const haR: [number, number] = [elR[0] + Math.sin(fb) * lb, elR[1] + Math.cos(fb) * lb];
  return { hipL, hipR, kneeL, kneeR, ankleL, ankleR, shL, shR, elL, elR, haL, haR };
}

function sideJoints(p: Pose): Joints {
  const kA = p.kneeA ?? Math.max(0, -p.legA) * 1.1;
  const kB = p.kneeB ?? Math.max(0, -p.legB) * 1.1;
  const hip: [number, number] = [0, HIP_Y];
  const leg = (a: number, k: number) => {
    const knee: [number, number] = [hip[0] + Math.sin(a) * THIGH, hip[1] + Math.cos(a) * THIGH];
    const s = a - k;
    const ankle: [number, number] = [knee[0] + Math.sin(s) * SHIN, knee[1] + Math.cos(s) * SHIN];
    return [knee, ankle];
  };
  const [kneeL, ankleL] = leg(p.legA, kA);
  const [kneeR, ankleR] = leg(p.legB, kB);
  const sh: [number, number] = [0.4, SH_Y];
  const arm = (a: number, e: number) => {
    const el: [number, number] = [sh[0] + Math.sin(a) * UPPER, sh[1] + Math.cos(a) * UPPER];
    const f = a + e;
    const ha: [number, number] = [el[0] + Math.sin(f) * FORE, el[1] + Math.cos(f) * FORE];
    return [el, ha];
  };
  const [elL, haL] = arm(p.armA, p.elbowA ?? 0.25);
  const [elR, haR] = arm(p.armB, p.elbowB ?? 0.25);
  return { hipL: hip, hipR: hip, kneeL, kneeR, ankleL, ankleR, shL: sh, shR: sh, elL, elR, haL, haR };
}

// ------------------------------------------------------------------ main entry
/** Children never show beards, baldness or grey hair, whatever their generated look says. */
const kidLooks = new WeakMap<Look, Look>();
function kidLook(look: Look): Look {
  let k = kidLooks.get(look);
  if (!k) {
    const bald = HAIRS[look.hair % HAIRS.length]?.bald;
    k = {
      ...look,
      beard: 0,
      age: 0,
      hair: bald ? (look.hair === 8 ? 17 : 0) : look.hair,
      hairColor: look.hairColor === 6 || look.hairColor === 9 ? 2 : look.hairColor,
      mark: look.mark === 1 || look.mark === 4 ? look.mark : 0,
      lips: 0,
    };
    kidLooks.set(look, k);
  }
  return k;
}

export function drawCharacter(ctx: Ctx, look: Look, outfit: OutfitDef, pose: Pose, gender: 'm' | 'f') {
  const female = gender === 'f';
  const child = !!pose.child;
  if (child) look = kidLook(look);
  const dna = dnaOf(look, female);
  const R: Rig = {
    look,
    dna,
    B: buildOf(dna, female, child),
    o: outfit,
    p: pose,
    female,
    child,
    skin: SKIN_TONES[look.skin % SKIN_TONES.length],
    hair: HAIR_COLORS[look.hairColor % HAIR_COLORS.length],
    headS: child ? 1.14 : 0.94,
  };
  ctx.save();
  const hs = child ? 1 : 1 + dna.height * 0.028;
  ctx.scale(0.9 * hs, 0.9 * hs);
  if (child) ctx.scale(0.64, 0.64);
  ctx.translate(0, -pose.bob);
  const lean = pose.lean + (dna.age >= 3 && !child && pose.view !== 'back' ? 0.035 : 0);
  if (lean) {
    ctx.translate(0, HIP_Y);
    ctx.rotate(lean);
    ctx.translate(0, -HIP_Y);
  }
  if (pose.view === 'side') drawSide(ctx, R);
  else if (pose.view === 'back') drawBack(ctx, R);
  else drawFront(ctx, R);
  ctx.restore();
}

function legColor(o: OutfitDef, skin: string) {
  return o.style === 'dress' ? skin : o.bottom;
}
function sleeveColor(o: OutfitDef) {
  if (o.style === 'overalls') return o.accent === '#d9b35f' ? '#c9b89a' : o.accent;
  return o.top;
}
function handColor(o: OutfitDef, skin: string) {
  if (o.style === 'armor') return shade(o.top, -0.35);
  if (o.style === 'space') return '#d9dee3';
  if (o.style === 'ninja') return '#2a2d33';
  return skin;
}
type ShoeKind = 'boot' | 'sneaker' | 'heel' | 'shoe';
function shoeOf(o: OutfitDef, female: boolean): [ShoeKind, string] {
  if (o.style === 'space') return ['boot', '#d9dee3'];
  if (o.style === 'armor') return ['boot', shade(o.bottom, -0.3)];
  if (o.style === 'dress') return [female ? 'heel' : 'shoe', shade(o.accent, -0.35)];
  if (o.style === 'sport') return ['sneaker', '#f4f4f0'];
  if (o.style === 'suit' || o.style === 'coat') return ['shoe', '#1e1a1a'];
  if (o.style === 'casual') return ['sneaker', '#e8e2d4'];
  return ['boot', '#3a2a22'];
}
/** forearm is bare when the outfit has short sleeves or the dweller rolls them up */
function bareForearm(R: Rig) {
  const s = R.o.style;
  return s === 'casual' || s === 'dress' || (R.dna.acc === 7 && (s === 'jumpsuit' || s === 'overalls'));
}

// ------------------------------------------------------------------ FRONT
function drawFront(ctx: Ctx, R: Rig) {
  const { o, p, B, skin } = R;
  const j = frontJoints(p, B);
  const f = p.facing ?? 1;
  const lc = legColor(o, skin);
  const sc = sleeveColor(o);
  const hc = handColor(o, skin);
  const [shoe, shoeC] = shoeOf(o, R.female);
  const bare = bareForearm(R);
  const breath = (p.breath ?? 0) * 0.25;

  // hair behind everything
  ctx.save();
  ctx.translate(0, -UP - breath);
  ctx.save();
  headSpace(ctx, R);
  hairBackLayer(ctx, R, f, 'front');
  ctx.restore();
  if (o.style === 'space') celFill(ctx, shade(o.top, -0.08), () => rr(ctx, -8.6, -29, 17.2, 13, 3));
  ctx.restore();

  // legs
  const thighW = 6.0 * B.limb * (R.female ? 0.95 : 1);
  const shinW = 4.8 * B.limb * (R.female ? 0.92 : 1);
  const leg = (hip: [number, number], knee: [number, number], ankle: [number, number], side: number) => {
    limbSeg(ctx, knee[0], knee[1], ankle[0], ankle[1], shinW, shinW * 0.86, lc);
    limbSeg(ctx, hip[0], hip[1], knee[0], knee[1], thighW, thighW * 0.82, o.style === 'dress' ? skin : lc);
    if (o.style === 'sport') {
      ctx.strokeStyle = o.accent;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(hip[0] + side * 2.2, hip[1] + 1);
      ctx.lineTo(knee[0] + side * 2, knee[1]);
      ctx.lineTo(ankle[0] + side * 1.7, ankle[1] - 1);
      ctx.stroke();
    } else if (o.style !== 'dress') {
      // trouser crease & knee fold
      ctx.strokeStyle = rgba(tones(lc).dark, 0.8);
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(knee[0] - side * 1.2, knee[1] - 0.6);
      ctx.quadraticCurveTo(knee[0], knee[1] + 0.3, knee[0] + side * 1.1, knee[1] - 0.4);
      ctx.stroke();
    }
    if (o.style === 'armor') celFill(ctx, shade(o.top, 0.1), () => rr(ctx, knee[0] - 2.8, knee[1] - 2.2, 5.6, 4.4, 1.6), 0.6, 0.5);
    shoeFront(ctx, ankle[0], ankle[1], side * 0.35 + f * 0.25, shoe, shoeC, B.limb);
  };
  leg(j.hipL, j.kneeL, j.ankleL, -1);
  leg(j.hipR, j.kneeR, j.ankleR, 1);

  ctx.save();
  ctx.translate(0, -UP - breath);
  drawTorsoFront(ctx, R, f);
  tails(ctx, R, false);

  ctx.save();
  headSpace(ctx, R);
  drawHeadFront(ctx, R, f);
  ctx.restore();

  const upperW = 5.3 * B.limb;
  const foreW = 4.3 * B.limb;
  const arm = (sh: [number, number], el: [number, number], ha: [number, number], side: number, raise: number) => {
    limbSeg(ctx, el[0], el[1], ha[0], ha[1], foreW, foreW * 0.9, bare ? skin : sc);
    limbSeg(ctx, sh[0], sh[1], el[0], el[1], upperW, upperW * 0.9, sc);
    if (bare) {
      const s = o.style === 'casual' || o.style === 'dress' ? 0.55 : 0.98;
      const mx = sh[0] + (el[0] - sh[0]) * s;
      const my = sh[1] + (el[1] - sh[1]) * s;
      // sleeve cuff / rolled sleeve band
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(Math.atan2(el[1] - sh[1], el[0] - sh[0]) - Math.PI / 2);
      rr(ctx, -upperW * 0.56, -1.2, upperW * 1.12, 2.4, 1.1);
      ctx.fillStyle = shade(sc, 0.08);
      ctx.fill();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = tones(sc).line;
      ctx.stroke();
      ctx.restore();
    } else if (o.style === 'jumpsuit' || o.style === 'sport') {
      ctx.strokeStyle = o.accent;
      ctx.lineWidth = 1.1;
      const cx = el[0] + (ha[0] - el[0]) * 0.72;
      const cy = el[1] + (ha[1] - el[1]) * 0.72;
      const dx = ha[0] - el[0];
      const dy = ha[1] - el[1];
      const l = Math.hypot(dx, dy) || 1;
      ctx.beginPath();
      ctx.moveTo(cx - (dy / l) * 2.1, cy + (dx / l) * 2.1);
      ctx.lineTo(cx + (dy / l) * 2.1, cy - (dx / l) * 2.1);
      ctx.stroke();
    }
    if (o.style === 'armor' || o.style === 'space') {
      celFill(ctx, shade(o.top, 0.12), () => {
        ctx.beginPath();
        ctx.ellipse(sh[0] + side * 0.6, sh[1] - 0.4, 3.6, 3, side * 0.3, 0, Math.PI * 2);
      }, 0.7, 0.6);
    }
    hand(ctx, ha[0], ha[1], hc, side, raise, B.limb);
  };
  arm(j.shL, j.elL, j.haL, -1, p.armA);
  arm(j.shR, j.elR, j.haR, 1, p.armB);
  if (p.hold && p.hold !== 'none') drawHeld(ctx, p, j);
  ctx.restore();
}

function hand(ctx: Ctx, x: number, y: number, c: string, side: number, raise: number, limb = 1) {
  const t = tones(c);
  const s = Math.sqrt(limb);
  ctx.beginPath();
  ctx.ellipse(x, y + 0.5, 2.0 * s, 2.3 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  const tx = x - side * 1.65 * s * (raise > 1.6 ? -1 : 1);
  ctx.beginPath();
  ctx.ellipse(tx, y - 0.2, 0.9 * s, 1.2 * s, side * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.stroke();
  // finger separations
  ctx.strokeStyle = rgba(t.line, 0.55);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (const k of [-0.6, 0.5]) {
    ctx.moveTo(x + k * s + side * 0.3, y + 1.4 * s);
    ctx.lineTo(x + k * s + side * 0.3, y + 2.5 * s);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 0.6, y + 1.1, 1.1 * s, 0, Math.PI);
  ctx.fillStyle = rgba(t.dark, 0.5);
  ctx.fill();
}

function shoeFront(ctx: Ctx, x: number, y: number, turn: number, kind: ShoeKind, c: string, limb: number) {
  const t = tones(c);
  const o = turn * 1.2;
  const w = 1 + (limb - 1) * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (kind === 'heel') {
    ctx.moveTo(-1.8 + o, -1.8);
    ctx.lineTo(1.8 + o, -1.8);
    ctx.quadraticCurveTo(2.8 + o, -0.6, 2.4 + o, 1.2);
    ctx.lineTo(-2.2 + o, 1.2);
    ctx.quadraticCurveTo(-2.6 + o, -0.6, -1.8 + o, -1.8);
  } else if (kind === 'sneaker') {
    ctx.moveTo(-2.7 * w + o, -2);
    ctx.lineTo(2.7 * w + o, -2);
    ctx.quadraticCurveTo(4 * w + o, -1, 3.8 * w + o, 1.4);
    ctx.lineTo(-3.6 * w + o, 1.4);
    ctx.quadraticCurveTo(-4 * w + o, -1, -2.7 * w + o, -2);
  } else {
    ctx.moveTo(-2.6 * w + o, -2.2);
    ctx.lineTo(2.6 * w + o, -2.2);
    ctx.quadraticCurveTo(3.8 * w + o, -1.4, 3.6 * w + o, 1.4);
    ctx.lineTo(-3.4 * w + o, 1.4);
    ctx.quadraticCurveTo(-3.8 * w + o, -1.4, -2.6 * w + o, -2.2);
  }
  ctx.closePath();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  ctx.fillStyle = kind === 'sneaker' ? '#c9c3b3' : shade(c, -0.5);
  ctx.fillRect(-3.4 * w + o, 0.6, 7 * w, 0.9);
  if (kind === 'sneaker') {
    ctx.fillStyle = '#d6453c';
    ctx.fillRect(-1.2 + o, -1.2, 2.4, 0.7);
  }
  ctx.fillStyle = rgba('#ffffff', kind === 'shoe' || kind === 'heel' ? 0.45 : 0.25);
  ctx.beginPath();
  ctx.ellipse(o - 0.6, -1.3, 1.4, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shoeSide(ctx: Ctx, x: number, y: number, kind: ShoeKind, c: string) {
  const t = tones(c);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (kind === 'heel') {
    ctx.moveTo(-1.6, -2.2);
    ctx.lineTo(1.4, -2);
    ctx.quadraticCurveTo(4.6, -1.2, 4.8, 0.8);
    ctx.lineTo(1.2, 0.8);
    ctx.lineTo(-1.2, -0.6);
    ctx.lineTo(-1.2, 1.4);
    ctx.lineTo(-2.2, 1.4);
    ctx.lineTo(-2.2, -1.4);
  } else {
    ctx.moveTo(-2.4, -2.6);
    ctx.lineTo(1.8, -2.6);
    ctx.quadraticCurveTo(kind === 'sneaker' ? 5.8 : 5.4, -2.2, kind === 'sneaker' ? 6 : 5.6, 0.2);
    ctx.lineTo(kind === 'sneaker' ? 6 : 5.6, 1.4);
    ctx.lineTo(-2.8, 1.4);
    ctx.lineTo(-2.8, -1.8);
  }
  ctx.closePath();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  if (kind !== 'heel') {
    ctx.fillStyle = kind === 'sneaker' ? '#c9c3b3' : shade(c, -0.5);
    ctx.fillRect(-2.8, 0.6, kind === 'sneaker' ? 8.8 : 8.4, 0.9);
  }
  ctx.fillStyle = rgba('#ffffff', 0.3);
  ctx.beginPath();
  ctx.ellipse(2.6, -1.4, 1.4, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function torsoPathFront(ctx: Ctx, B: Build, female: boolean, bulky: boolean) {
  const sh = B.sh + (bulky ? 0.8 : 0);
  const ch = B.chest + (bulky ? 0.6 : 0);
  const wa = B.waist + (bulky ? 0.6 : 0);
  const hp = B.hip;
  const bl = B.belly;
  const nk = B.neck * 0.8;
  ctx.beginPath();
  ctx.moveTo(-nk, -30.1);
  ctx.quadraticCurveTo(-sh + 1.2, -30.2, -sh, -27.4);
  ctx.quadraticCurveTo(-sh - 0.2, -24.6, -ch, -22.4);
  ctx.quadraticCurveTo(-wa - bl * 0.9 - (female ? 0 : 0.2), -20.2, -wa - bl * 0.6, -17.8);
  ctx.quadraticCurveTo(-hp - 0.3, -16.2, -hp, -14.4);
  ctx.lineTo(-hp, -13.6);
  ctx.quadraticCurveTo(0, -12.6, hp, -13.6);
  ctx.lineTo(hp, -14.4);
  ctx.quadraticCurveTo(hp + 0.3, -16.2, wa + bl * 0.6, -17.8);
  ctx.quadraticCurveTo(wa + bl * 0.9 + (female ? 0 : 0.2), -20.2, ch, -22.4);
  ctx.quadraticCurveTo(sh + 0.2, -24.6, sh, -27.4);
  ctx.quadraticCurveTo(sh - 1.2, -30.2, nk, -30.1);
  ctx.closePath();
}

function drawTorsoFront(ctx: Ctx, R: Rig, f: number) {
  const { o, B, female, skin } = R;
  const bulky = o.style === 'armor' || o.style === 'space';
  // neck with the chin's shadow
  limbSeg(ctx, 0, -32.2, 0, -28.4, B.neck, B.neck, skin);
  ctx.fillStyle = rgba(tones(skin).dark, 0.7);
  ctx.beginPath();
  ctx.ellipse(0.4 * f, -31.2, B.neck * 0.55, 1.1, 0, 0, Math.PI);
  ctx.fill();
  const path = () => torsoPathFront(ctx, B, female, bulky);
  celFill(ctx, o.top, path, 1.8, 1.0);
  ctx.save();
  path();
  ctx.clip();
  outfitFront(ctx, o, f, female, skin);
  if (o.style !== 'dress' && o.style !== 'robe' && o.style !== 'coat') {
    ctx.fillStyle = o.bottom;
    ctx.fillRect(-12, -15.2, 24, 3);
  }
  // soft folds at the armpits and the belly for heavier builds
  ctx.strokeStyle = rgba(tones(o.top).dark, 0.6);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-B.chest + 0.6, -22.6);
  ctx.quadraticCurveTo(-B.chest + 2.2, -21.6, -B.chest + 1.6, -19.8);
  ctx.moveTo(B.chest - 0.6, -22.6);
  ctx.quadraticCurveTo(B.chest - 2.2, -21.6, B.chest - 1.6, -19.8);
  if (B.belly > 0.3) {
    ctx.moveTo(-B.waist + 1.5, -17.2);
    ctx.quadraticCurveTo(0, -15.4 + B.belly * 0.4, B.waist - 1.5, -17.2);
  }
  ctx.stroke();
  ctx.restore();
  if (female && o.style !== 'armor' && o.style !== 'space') {
    ctx.strokeStyle = rgba(tones(o.top).dark, 0.55);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.arc(-2.6, -24.2, 2.4, 0.3, Math.PI - 0.3);
    ctx.arc(2.6, -24.2, 2.4, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }
  // headphones resting on the neck
  if (R.dna.acc === 4 && !R.child) {
    ctx.strokeStyle = '#2a2d31';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -30.6, 4.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
    rr(ctx, -5.4, -31.4, 2.6, 3.6, 1);
    ctx.fillStyle = '#d6453c';
    ctx.fill();
    rr(ctx, 2.8, -31.4, 2.6, 3.6, 1);
    ctx.fill();
  }
}

function belt(ctx: Ctx, c: string, buckle: string) {
  ctx.fillStyle = c;
  ctx.fillRect(-12, -16.8, 24, 1.9);
  ctx.fillStyle = buckle;
  ctx.fillRect(-1.4, -17.1, 2.8, 2.5);
  ctx.fillStyle = c;
  ctx.fillRect(-0.7, -16.4, 1.4, 1.1);
}

// ------------------------------------------------------------------ HEAD (front / 3-4)
interface Shape {
  jaw: number;
  jawY: number;
  chin: number;
  chinW: number;
  cheek: number;
}
const SHAPES: Shape[] = [
  { jaw: 5.3, jawY: 6.0, chin: 8.7, chinW: 2.4, cheek: 0.2 },
  { jaw: 6.5, jawY: 5.4, chin: 8.1, chinW: 3.6, cheek: 0.6 },
  { jaw: 6.9, jawY: 6.9, chin: 8.6, chinW: 4.0, cheek: 0 },
  { jaw: 5.4, jawY: 7.2, chin: 9.8, chinW: 2.8, cheek: -0.2 },
  { jaw: 4.4, jawY: 5.8, chin: 8.9, chinW: 1.4, cheek: 0.7 },
];
function shapeOf(R: Rig): Shape {
  const s = { ...SHAPES[R.dna.shape % SHAPES.length] };
  if (R.female) {
    s.jaw -= 0.5;
    s.chin -= 0.3;
    s.chinW -= 0.4;
  }
  if (R.dna.build >= 3) {
    s.jaw += 0.6;
    s.chinW += 0.8;
  }
  if (R.child) {
    s.jaw += 0.4;
    s.chin -= 0.7;
    s.jawY -= 0.4;
    s.chinW += 0.6;
  }
  return s;
}

function headPathFront(ctx: Ctx, R: Rig, f: number) {
  const S = shapeOf(R);
  const cx = 0.5 * f;
  const k = (side: number) => (side === f ? 1.03 : 0.94);
  const chx = cx + f * 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - HR * k(-1), HY - 0.8);
  ctx.bezierCurveTo(cx - HR * k(-1), HY - HR * 1.3, cx + HR * k(1), HY - HR * 1.3, cx + HR * k(1), HY - 0.8);
  ctx.bezierCurveTo(cx + (HR + S.cheek) * k(1), HY + 2.6, cx + (S.jaw + 0.7) * k(1), HY + S.jawY - 0.9, cx + S.jaw * k(1), HY + S.jawY);
  ctx.quadraticCurveTo(chx + S.chinW * 0.5 + 1.3, HY + S.chin - 0.1, chx + S.chinW * 0.5, HY + S.chin);
  ctx.quadraticCurveTo(chx, HY + S.chin + 0.35, chx - S.chinW * 0.5, HY + S.chin);
  ctx.quadraticCurveTo(chx - S.chinW * 0.5 - 1.3, HY + S.chin - 0.1, cx - S.jaw * k(-1), HY + S.jawY);
  ctx.bezierCurveTo(cx - (S.jaw + 0.7) * k(-1), HY + S.jawY - 0.9, cx - (HR + S.cheek) * k(-1), HY + 2.6, cx - HR * k(-1), HY - 0.8);
  ctx.closePath();
}

function hatHidesHair(o: OutfitDef) {
  return o.hat === 'helmet' || o.hat === 'hood' || o.hat === 'chef' || o.hat === 'hardhat';
}

function drawHeadFront(ctx: Ctx, R: Rig, f: number) {
  const { o, skin, dna } = R;
  const space = o.hat === 'helmet' && o.style === 'space';
  const t = tones(skin);
  // ears
  const big = dna.shape === 1 || dna.build >= 3 ? 1.08 : 1;
  for (const s of [-1, 1]) {
    const ex = s * (HR - 0.4) + 0.5 * f;
    const far = s !== f;
    ctx.beginPath();
    ctx.ellipse(ex + s * 0.2, HY + 1.2, (far ? 1.45 : 1.9) * big, 2.5 * big, s * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = t.base;
    ctx.fill();
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ex + s * 0.25, HY + 1.3, 0.75 * big, 1.35 * big, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.dark;
    ctx.fill();
    if (dna.acc === 1 && R.female && !R.child) {
      dot(ctx, ex + s * 0.3, HY + 3.9, 0.75, '#f2cf4a');
      dot(ctx, ex + s * 0.3 - 0.2, HY + 3.7, 0.25, '#fff8d0');
    }
  }
  celFill(ctx, skin, () => headPathFront(ctx, R, f), 1.5, 1.3, true, skinShadow(skin));
  // cheeks
  const S = shapeOf(R);
  const dark = R.look.skin === 4 || R.look.skin === 7 || R.look.skin === 3;
  const blush = (dna.mark === 4 || R.child ? 0.34 : R.female ? 0.22 : 0.1) * (dark ? 0.55 : 1);
  ctx.fillStyle = rgba(dark ? '#e0405a' : '#ff6a6a', blush);
  ctx.beginPath();
  ctx.ellipse(-4.3 + f * 0.9, HY + 3.8, 1.9, 1.15, 0, 0, Math.PI * 2);
  ctx.ellipse(4.3 + f * 0.9, HY + 3.8, 1.9, 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  // double chin for heavy builds
  if (dna.build === 4 && !R.child) {
    ctx.strokeStyle = rgba(t.dark, 0.8);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-2.4 + f, HY + S.chin - 1.2);
    ctx.quadraticCurveTo(f * 0.8, HY + S.chin - 0.2, 2.4 + f, HY + S.chin - 1.2);
    ctx.stroke();
  }
  drawFaceFront(ctx, R, f);
  if (space) {
    // hair and beard stay visible inside the glass dome
    ctx.save();
    ctx.beginPath();
    ctx.arc(0.4 * f, HY - 0.4, HR + 2.4, 0, Math.PI * 2);
    ctx.clip();
    if (R.look.beard) drawBeardFront(ctx, R, f);
    hairCapFront(ctx, R, f);
    hairFrontLocks(ctx, R, f);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0.4 * f, HY - 0.4, HR + 3, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#cfefff', 0.2);
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgba('#f4f6f8', 0.95);
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = rgba('#6d7680', 0.8);
    ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.beginPath();
    ctx.ellipse(-4 + f * 0.4, HY - 5, 1.6, 3.2, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.accent;
    ctx.fillRect(-6, HY + HR + 1.2, 12, 1.6);
    return;
  }
  if (R.look.beard) drawBeardFront(ctx, R, f);
  if (!hatHidesHair(o)) {
    hairCapFront(ctx, R, f);
    hairFrontLocks(ctx, R, f);
  }
  if (R.look.glasses) glassesFront(ctx, R, f);
  if (dna.mark === 5 && !R.child) eyepatchFront(ctx, R, f);
  if (!o.hat && !R.child) accessoryHead(ctx, R, f);
  drawHatFront(ctx, o, f);
  if (o.style === 'ninja') {
    ctx.fillStyle = o.top;
    ctx.beginPath();
    ctx.moveTo(-HR - 0.4, HY + 1.6);
    ctx.lineTo(HR + 0.4, HY + 1.6);
    ctx.lineTo(HR - 1, HY + HR);
    ctx.quadraticCurveTo(0, HY + HR + 1.8, -HR + 1, HY + HR);
    ctx.closePath();
    ctx.fill();
  }
}

// --- eyes -------------------------------------------------------------------
interface EyeDims {
  rx: number;
  ry: number;
  tilt: number;
  lid: number;
}
function eyeDims(R: Rig): EyeDims {
  const k = R.child ? 1.16 : 1;
  switch (R.dna.eyes) {
    case 0:
      return { rx: 1.55 * k, ry: 1.7 * k, tilt: 0, lid: 0 };
    case 1:
      return { rx: 1.95 * k, ry: 1.3 * k, tilt: 0.35, lid: 0 };
    case 2:
      return { rx: 1.8 * k, ry: 1.35 * k, tilt: -0.1, lid: 0.42 };
    case 3:
      return { rx: 1.85 * k, ry: 1.0 * k, tilt: 0.15, lid: 0.1 };
    default:
      return { rx: 1.85 * k, ry: 2.0 * k, tilt: 0, lid: 0 };
  }
}

function eyeShapePath(ctx: Ctx, x: number, y: number, E: EyeDims, outer: number) {
  ctx.beginPath();
  if (E.ry >= E.rx * 0.9) {
    ctx.ellipse(x, y, E.rx, E.ry, 0, 0, Math.PI * 2);
    return;
  }
  const ox = x + outer * E.rx;
  const ix = x - outer * E.rx;
  const oy = y - E.tilt;
  ctx.moveTo(ix, y + 0.1);
  ctx.bezierCurveTo(ix + outer * E.rx * 0.3, y - E.ry * 1.45, ox - outer * E.rx * 0.2, y - E.ry * 1.3, ox, oy);
  ctx.bezierCurveTo(ox - outer * E.rx * 0.3, y + E.ry * 1.2, ix + outer * E.rx * 0.3, y + E.ry * 1.25, ix, y + 0.1);
  ctx.closePath();
}

function eyeFront(ctx: Ctx, R: Rig, x: number, y: number, s: number, outer: number, lookX: number) {
  const p = R.p;
  const iris = EYE_COLORS[R.look.face % EYE_COLORS.length];
  const base = eyeDims(R);
  const wide = p.eyes === 'wide' ? 1.16 : 1;
  const E: EyeDims = { rx: base.rx * s, ry: base.ry * s * wide, tilt: base.tilt * s, lid: p.eyes === 'wide' ? 0 : base.lid };
  const line = '#2a1a14';
  if (p.eyes === 'x') {
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 1.2 * s, y - 1.2 * s);
    ctx.lineTo(x + 1.2 * s, y + 1.2 * s);
    ctx.moveTo(x + 1.2 * s, y - 1.2 * s);
    ctx.lineTo(x - 1.2 * s, y + 1.2 * s);
    ctx.stroke();
    ctx.lineCap = 'butt';
    return;
  }
  if (p.blink || p.eyes === 'closed') {
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.75;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (p.mouth === 'grin' || p.mouth === 'happy') {
      // happy closed eyes ^ ^
      ctx.moveTo(x - E.rx, y + 0.4);
      ctx.quadraticCurveTo(x, y - E.ry * 1.2, x + E.rx, y + 0.4);
    } else {
      ctx.moveTo(x - E.rx, y - 0.2);
      ctx.quadraticCurveTo(x, y + E.ry * 0.9, x + E.rx, y - 0.2);
    }
    ctx.stroke();
    if (R.female && !R.child) {
      ctx.beginPath();
      ctx.moveTo(x + outer * E.rx, y - 0.1);
      ctx.lineTo(x + outer * (E.rx + 0.8), y - 0.6);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    return;
  }
  eyeShapePath(ctx, x, y, E, outer);
  ctx.fillStyle = '#fbf8f1';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const ir = Math.min(E.rx * 0.74, E.ry * 1.02) * (R.child ? 1.1 : 1);
  const ix = x + lookX * 0.55 * s;
  const iy = y + 0.15;
  ctx.beginPath();
  ctx.arc(ix, iy, ir, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(ix, iy + ir * 0.4, 0, ix, iy, ir);
  g.addColorStop(0, shade(iris, 0.35));
  g.addColorStop(0.7, iris);
  g.addColorStop(1, shade(iris, -0.4));
  ctx.fillStyle = g;
  ctx.fill();
  dot(ctx, ix, iy, ir * 0.5, '#0e0a08');
  // upper lid shadow on the eyeball
  ctx.fillStyle = rgba('#3a2418', 0.28);
  ctx.fillRect(x - E.rx - 1, y - E.ry - 1, E.rx * 2 + 2, E.ry * 0.7 + 1);
  if (E.lid > 0) {
    // heavy (sleepy) eyelid
    ctx.fillStyle = tones(R.skin).base;
    ctx.fillRect(x - E.rx - 1, y - E.ry - 1, E.rx * 2 + 2, E.ry * 2 * E.lid + 1);
    ctx.fillStyle = rgba(tones(R.skin).dark, 0.5);
    ctx.fillRect(x - E.rx - 1, y - E.ry + E.ry * 2 * E.lid - 0.6, E.rx * 2 + 2, 0.6);
  }
  ctx.restore();
  dot(ctx, ix + 0.42 * s, iy - 0.55 * s, 0.42 * s, '#ffffff');
  dot(ctx, ix - 0.4 * s, iy + 0.5 * s, 0.18 * s, rgba('#ffffff', 0.8));
  // upper lash line (thicker) and a soft lower lid
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.lineWidth = R.female ? 0.85 : 0.7;
  ctx.beginPath();
  if (E.ry >= E.rx * 0.9) {
    ctx.ellipse(x, y, E.rx, E.ry, 0, Math.PI * 1.08, Math.PI * 1.92);
  } else {
    const ox = x + outer * E.rx;
    const ixx = x - outer * E.rx;
    ctx.moveTo(ixx, y + 0.1);
    ctx.bezierCurveTo(ixx + outer * E.rx * 0.3, y - E.ry * 1.45, ox - outer * E.rx * 0.2, y - E.ry * 1.3, ox, y - E.tilt);
  }
  ctx.stroke();
  if (R.female && !R.child) {
    // winged lashes
    const ox = x + outer * E.rx;
    const oy = y - E.tilt - (E.ry >= E.rx * 0.9 ? E.ry * 0.4 : 0);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + outer * 0.9, oy - 0.7);
    ctx.moveTo(ox - outer * 0.5, oy - E.ry * 0.5);
    ctx.lineTo(ox + outer * 0.2, oy - E.ry * 0.5 - 0.8);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(tones(R.skin).line, 0.35);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  if (E.ry >= E.rx * 0.9) ctx.ellipse(x, y, E.rx, E.ry, 0, Math.PI * 0.2, Math.PI * 0.8);
  else {
    ctx.moveTo(x - outer * E.rx * 0.6, y + E.ry * 0.9);
    ctx.quadraticCurveTo(x, y + E.ry * 1.1, x + outer * E.rx * 0.8, y + E.ry * 0.5);
  }
  ctx.stroke();
  if (R.dna.age >= 2 && !R.child) {
    // under-eye bags and crow's feet
    ctx.strokeStyle = rgba(featureShade(R.skin, 0.55), 0.4);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(x - E.rx * 0.6, y + E.ry + 0.9);
    ctx.quadraticCurveTo(x, y + E.ry + 1.5, x + E.rx * 0.6, y + E.ry + 0.9);
    if (R.dna.age >= 3) {
      const ox = x + outer * (E.rx + 0.45);
      for (const i of [-0.5, 0.6]) {
        ctx.moveTo(ox, y + i * 0.8);
        ctx.lineTo(ox + outer * 0.8, y + i * 1.2);
      }
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

function browColor(R: Rig) {
  if (R.dna.age >= 3) return mix(R.hair, '#8a8478', 0.5);
  if (R.look.hair === 18 || R.look.hair === 8) return shade(R.hair, -0.1);
  return shade(R.hair, -0.25);
}

function browFront(ctx: Ctx, R: Rig, x: number, y: number, s: number, outer: number, raise: number, tiltIn: number) {
  const type = R.dna.brows;
  const th = (R.female ? 0.7 : 1) * [0.7, 1.2, 1.55, 1.05][type] * (R.child ? 0.8 : 1);
  const w = 2.0 * s;
  const ix = x - outer * w;
  const ox = x + outer * w;
  const iy = y - raise + tiltIn;
  const my = y - raise - (type === 0 ? 0.8 : type === 3 ? 0.2 : 0.4);
  const oy = y - raise + (type === 3 ? -0.5 : 0.3) - tiltIn * 0.3;
  ctx.beginPath();
  ctx.moveTo(ix, iy + th * 0.5);
  ctx.quadraticCurveTo(x, my - th * 0.5, ox, oy - th * 0.15);
  ctx.quadraticCurveTo(x, my + th * 0.35, ix, iy + th * 0.5 + th);
  ctx.closePath();
  ctx.fillStyle = browColor(R);
  ctx.fill();
  if (type === 2) {
    ctx.strokeStyle = browColor(R);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const bx = ix + outer * (i + 0.5) * (w / 2);
      ctx.moveTo(bx, my + 0.2);
      ctx.lineTo(bx + outer * 0.4, my - 0.9);
    }
    ctx.stroke();
  }
}

function drawFaceFront(ctx: Ctx, R: Rig, f: number) {
  const { p, dna } = R;
  const cx = 0.9 * f;
  const ey = HY + 0.9 + (R.child ? 0.9 : 0);
  const lookX = (p.lookDir ?? 0) + f * 0.35;
  const sL = f > 0 ? 0.9 : 1;
  const sR = f > 0 ? 1 : 0.9;
  const eyeSpace = 3.35 + (dna.eyes === 1 ? 0.15 : 0);
  const E = eyeDims(R);
  eyeFront(ctx, R, cx - eyeSpace, ey, sL, -1, lookX);
  eyeFront(ctx, R, cx + eyeSpace, ey, sR, 1, lookX);
  // brows react to expression
  let raise = E.ry + 1.7;
  let tiltIn = 0;
  if (p.eyes === 'wide') raise += 0.9;
  if (p.mouth === 'sad') tiltIn = -1.0;
  if (p.mouth === 'grin' || p.mouth === 'happy') raise += 0.25;
  if (p.aim) tiltIn = 0.8;
  browFront(ctx, R, cx - eyeSpace, ey, sL, -1, raise, tiltIn);
  browFront(ctx, R, cx + eyeSpace, ey, sR, 1, raise, tiltIn);
  drawNoseFront(ctx, R, cx + f * 0.55, ey, f);
  const S = shapeOf(R);
  const my = Math.min(ey + 4.9 + (S.chin - 8.7) * 0.38 + (R.child ? -0.4 : 0), HY + S.chin - 3.1);
  drawMouthFront(ctx, R, cx + f * 0.35, my, f, Math.max(1.6, Math.min(2.9, HY + S.chin - my - 0.9)));
  faceMarks(ctx, R, cx, ey, my, f);
}

/** Warm shadow tone for facial features (never grey on any skin). */
function featureShade(skin: string, k = 0.38) {
  return mix(skin, '#8a3424', k);
}

function drawNoseFront(ctx: Ctx, R: Rig, nx: number, ey: number, f: number) {
  const type = R.child ? 0 : R.dna.nose;
  const len = type === 3 ? 1.2 : type === 4 ? -0.4 : 0;
  const ty = ey + 3.1 + len;
  const sh = featureShade(R.skin, 0.42);
  const line = featureShade(R.skin, 0.62);
  const hi = shade(R.skin, 0.22);
  ctx.lineCap = 'round';
  // bridge shadow on the far side of the nose
  const bridge = (x0: number, y0: number, x1: number, y1: number, a: number) => {
    ctx.strokeStyle = rgba(sh, a);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x1 + f * 0.35, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
  };
  const tip = (w: number, h: number) => {
    // soft shadow under the tip, then the tip highlight
    ctx.fillStyle = rgba(sh, 0.5);
    ctx.beginPath();
    ctx.ellipse(nx + f * 0.25, ty + h * 0.55, w, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hi;
    ctx.beginPath();
    ctx.ellipse(nx - f * 0.15, ty - h * 0.15, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const base = (w: number, depth: number) => {
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(nx - w, ty + 0.2);
    ctx.quadraticCurveTo(nx - w * 0.2, ty + depth, nx + f * 0.3, ty + depth * 0.8);
    ctx.quadraticCurveTo(nx + w * 0.6, ty + depth, nx + w, ty + 0.1);
    ctx.stroke();
  };
  switch (type) {
    case 0:
      tip(1.15, 1.2);
      ctx.strokeStyle = rgba(line, 0.8);
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(nx - 0.7, ty + 0.75);
      ctx.quadraticCurveTo(nx + f * 0.2, ty + 1.15, nx + 0.9, ty + 0.65);
      ctx.stroke();
      break;
    case 1:
      bridge(nx + f * 0.9, ey + 0.2, nx + f * 1.25, ty - 0.2, 0.55);
      tip(1.2, 1.3);
      base(1.25, 1.1);
      break;
    case 2:
      bridge(nx + f * 1.1, ey + 0.8, nx + f * 1.5, ty - 0.4, 0.4);
      tip(1.8, 1.5);
      // nostril wings
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(nx - 1.9, ty - 0.4);
      ctx.quadraticCurveTo(nx - 2.5, ty + 0.9, nx - 1.1, ty + 1.1);
      ctx.moveTo(nx + 1.9, ty - 0.4);
      ctx.quadraticCurveTo(nx + 2.5, ty + 0.9, nx + 1.1, ty + 1.1);
      ctx.stroke();
      dot(ctx, nx - 0.7, ty + 0.9, 0.35, rgba(line, 0.8));
      dot(ctx, nx + 0.9, ty + 0.9, 0.35, rgba(line, 0.8));
      break;
    case 3:
      bridge(nx + f * 0.7, ey - 0.4, nx + f * 1.7, ty - 0.1, 0.6);
      tip(1.3, 1.5);
      base(1.3, 1.4);
      break;
    default:
      // upturned button with visible nostrils
      tip(1.05, 1.0);
      dot(ctx, nx - 0.55, ty + 0.55, 0.36, line);
      dot(ctx, nx + 0.75, ty + 0.55, 0.36, line);
  }
  ctx.lineCap = 'butt';
}

function drawMouthFront(ctx: Ctx, R: Rig, x: number, y: number, f: number, depth = 2.9) {
  const m = R.p.mouth;
  const female = R.female;
  const natural = mix(R.skin, '#b0404a', 0.55);
  const lip = female ? (R.dna.lips ? LIP_COLORS[R.dna.lips] : mix(R.skin, '#c9505a', 0.6)) : mix(R.skin, '#7a2e24', 0.6);
  const w = (female ? 2.1 : 2.5) + (R.dna.build === 4 ? 0.3 : 0) - (R.child ? 0.3 : 0);
  const line = mix(R.skin, '#3a1410', 0.75);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (m) {
    case 'happy': {
      if (female) {
        ctx.beginPath();
        ctx.moveTo(x - w, y - 0.5);
        ctx.quadraticCurveTo(x, y + 0.5, x + w, y - 0.5);
        ctx.quadraticCurveTo(x, y + 2.2, x - w, y - 0.5);
        ctx.fillStyle = lip;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(x - w, y - 0.5);
      ctx.quadraticCurveTo(x, y + 1.6, x + w, y - 0.5);
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // smile dimples
      ctx.strokeStyle = rgba(line, 0.45);
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(x - w - 0.4, y - 0.9);
      ctx.quadraticCurveTo(x - w - 0.7, y - 0.3, x - w - 0.3, y + 0.1);
      ctx.moveTo(x + w + 0.4, y - 0.9);
      ctx.quadraticCurveTo(x + w + 0.7, y - 0.3, x + w + 0.3, y + 0.1);
      ctx.stroke();
      break;
    }
    case 'grin': {
      ctx.beginPath();
      ctx.moveTo(x - w - 0.4, y - 0.9);
      ctx.quadraticCurveTo(x, y - 0.1, x + w + 0.4, y - 0.9);
      ctx.quadraticCurveTo(x + w * 0.7, y + depth - 0.1, x, y + depth);
      ctx.quadraticCurveTo(x - w * 0.7, y + depth - 0.1, x - w - 0.4, y - 0.9);
      ctx.closePath();
      ctx.fillStyle = '#5a1a18';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#fbf8f1';
      ctx.fillRect(x - w - 0.5, y - 1, (w + 0.5) * 2, 1.35);
      ctx.fillStyle = '#e8606a';
      ctx.beginPath();
      ctx.ellipse(x, y + depth - 0.3, 1.5, 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = female ? lip : line;
      ctx.lineWidth = female ? 0.7 : 0.5;
      ctx.stroke();
      break;
    }
    case 'sad': {
      ctx.beginPath();
      ctx.moveTo(x - w * 0.8, y + 0.9);
      ctx.quadraticCurveTo(x, y - 0.7, x + w * 0.8, y + 0.9);
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      if (female) {
        ctx.beginPath();
        ctx.ellipse(x, y + 0.9, w * 0.45, 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = rgba(lip, 0.7);
        ctx.fill();
      }
      break;
    }
    case 'open': {
      ctx.beginPath();
      ctx.ellipse(x, y + 0.5, 1.3, 1.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5a1a14';
      ctx.fill();
      ctx.strokeStyle = female ? lip : line;
      ctx.lineWidth = female ? 0.7 : 0.45;
      ctx.stroke();
      ctx.fillStyle = '#e8606a';
      ctx.beginPath();
      ctx.ellipse(x, y + 1.5, 0.8, 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      if (female) {
        ctx.beginPath();
        ctx.moveTo(x - w * 0.8, y);
        ctx.quadraticCurveTo(x - 0.5, y - 0.8, x, y - 0.3);
        ctx.quadraticCurveTo(x + 0.5, y - 0.8, x + w * 0.8, y);
        ctx.quadraticCurveTo(x, y + 1.3, x - w * 0.8, y);
        ctx.fillStyle = lip;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(x - w * 0.75, y + 0.1);
      ctx.quadraticCurveTo(x, y + 0.5, x + w * 0.75, y);
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.65;
      ctx.stroke();
      if (!female) {
        ctx.beginPath();
        ctx.ellipse(x, y + 1.1, 1.2, 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = rgba(natural, 0.35);
        ctx.fill();
      }
    }
  }
  // smile lines for older faces
  if (R.dna.age >= 2 && !R.child && (m === 'happy' || m === 'grin' || R.dna.age >= 3)) {
    ctx.strokeStyle = rgba(featureShade(R.skin, 0.5), R.female ? 0.3 : 0.45);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(x - w - 0.2, y - 2.6);
    ctx.quadraticCurveTo(x - w - 1.3, y - 0.8, x - w - 0.6, y + 0.8);
    ctx.moveTo(x + w + 0.2, y - 2.6);
    ctx.quadraticCurveTo(x + w + 1.3, y - 0.8, x + w + 0.6, y + 0.8);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  void f;
}

function faceMarks(ctx: Ctx, R: Rig, cx: number, ey: number, my: number, f: number) {
  const d = R.dna;
  if (d.age >= 3 && !R.child) {
    ctx.strokeStyle = rgba(featureShade(R.skin, 0.5), 0.35);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      ctx.moveTo(cx - 3 + i * 0.4, ey - 5.2 - i * 1.1);
      ctx.quadraticCurveTo(cx, ey - 5.7 - i * 1.1, cx + 3 - i * 0.4, ey - 5.2 - i * 1.1);
    }
    ctx.stroke();
  }
  switch (R.child ? (d.mark === 1 || d.mark === 4 ? d.mark : 0) : d.mark) {
    case 1: {
      ctx.fillStyle = rgba(mix(R.skin, '#7a3a1a', 0.6), 0.7);
      const pts = [
        [-4.6, 2.6],
        [-3.6, 3.2],
        [-4.9, 3.7],
        [-3.2, 2.3],
        [-1.2, 2.2],
        [0.6, 2.3],
        [3.4, 2.4],
        [4.4, 3.1],
        [3.1, 3.5],
        [4.9, 2.6],
      ];
      for (const [dx, dy] of pts) dot(ctx, cx + dx + f * 0.3, ey + dy, 0.28, ctx.fillStyle as string);
      break;
    }
    case 2:
      dot(ctx, cx + f * 2.8, my - 1.1, 0.4, mix(R.skin, '#3a1a0a', 0.75));
      break;
    case 3: {
      // healed scar across the cheek, below the eye
      const sx = cx + f * 4.2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(featureShade(R.skin, 0.5), 0.6);
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(sx - f * 0.6, ey + 1.9);
      ctx.lineTo(sx + f * 1.4, ey + 5.2);
      ctx.stroke();
      ctx.strokeStyle = mix(R.skin, '#ffd0c0', 0.45);
      ctx.lineWidth = 0.45;
      ctx.stroke();
      ctx.strokeStyle = rgba(featureShade(R.skin, 0.6), 0.7);
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const k = 0.2 + i * 0.3;
        const px = sx - f * 0.6 + f * 2 * k;
        const py = ey + 1.9 + 3.3 * k;
        ctx.moveTo(px - 0.6, py + 0.35 * f);
        ctx.lineTo(px + 0.6, py - 0.35 * f);
      }
      ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
  }
}

function eyepatchFront(ctx: Ctx, R: Rig, f: number) {
  const cx = 0.9 * f;
  const ey = HY + 0.9;
  const x = cx - 3.35 * f;
  ctx.strokeStyle = '#1a1614';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-HR + 0.3, HY - 3.6);
  ctx.lineTo(HR - 0.3, HY - 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, ey, 2.3, 2.0, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1614';
  ctx.fill();
  dot(ctx, x - 0.6, ey - 0.6, 0.4, rgba('#ffffff', 0.25));
  void R;
}

// --- beards -----------------------------------------------------------------
function hairFill(ctx: Ctx, hair: string, pathFn: () => void, outline = true) {
  const t = tones(hair);
  pathFn();
  const g = ctx.createLinearGradient(0, HY - HR - 5, 0, HY + 6);
  g.addColorStop(0, t.light);
  g.addColorStop(0.45, t.base);
  g.addColorStop(1, t.dark);
  ctx.fillStyle = g;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }
}

function beardColor(R: Rig) {
  return R.dna.age >= 3 ? mix(R.hair, '#d8d4cc', 0.4) : shade(R.hair, 0.06);
}

function drawBeardFront(ctx: Ctx, R: Rig, f: number) {
  const kind = R.look.beard;
  const cx = 0.5 * f;
  const c = beardColor(R);
  const S = shapeOf(R);
  const chinY = HY + S.chin;
  const m = cx + 1.2 * f;
  const moustache = (droop = 0) =>
    hairFill(ctx, c, () => {
      ctx.beginPath();
      ctx.moveTo(m, HY + 4.3);
      ctx.quadraticCurveTo(m - 3.4, HY + 3.6, m - 3.6 - droop * 0.5, HY + 5.6 + droop);
      ctx.quadraticCurveTo(m - 1.6, HY + 4.9, m, HY + 5.3);
      ctx.quadraticCurveTo(m + 1.6, HY + 4.9, m + 3.6 + droop * 0.5, HY + 5.6 + droop);
      ctx.quadraticCurveTo(m + 3.4, HY + 3.6, m, HY + 4.3);
      ctx.closePath();
    });
  switch (kind) {
    case 1:
    case 6: {
      // full beard (6: big bushy)
      const bush = kind === 6 ? 2.6 : 0;
      const mx = cx + 0.7 * f;
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR + 0.2, HY + 1.2);
        ctx.quadraticCurveTo(cx - HR - bush * 0.3, chinY + 1.4 + bush, cx + 0.8 * f, chinY + 2.3 + bush * 1.4);
        ctx.quadraticCurveTo(cx + HR + bush * 0.3, chinY + 1.4 + bush, cx + HR - 0.2, HY + 1.2);
        ctx.quadraticCurveTo(cx + HR - 1.4, HY + 4.4, mx + 2.9, HY + 5.2);
        ctx.quadraticCurveTo(mx + 1.6, HY + 8.2, mx, HY + 8.0);
        ctx.quadraticCurveTo(mx - 1.6, HY + 8.2, mx - 2.9, HY + 5.2);
        ctx.quadraticCurveTo(cx - HR + 1.4, HY + 4.4, cx - HR + 0.2, HY + 1.2);
        ctx.closePath();
      });
      ctx.strokeStyle = rgba(tones(c).dark, 0.7);
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(cx + 0.8 * f + i * 1.6, chinY - 0.6 + bush * 0.6);
        ctx.lineTo(cx + 0.8 * f + i * 1.9, chinY + 1.2 + bush);
      }
      ctx.stroke();
      moustache();
      break;
    }
    case 2:
      moustache();
      break;
    case 3:
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(cx + 1 * f, chinY - 0.4, 1.8, 2.3, 0, 0, Math.PI * 2);
      });
      moustache();
      break;
    case 5:
      // handlebar moustache
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(m, HY + 4.3);
        ctx.quadraticCurveTo(m - 3, HY + 3.8, m - 4.2, HY + 5);
        ctx.quadraticCurveTo(m - 5.4, HY + 4.2, m - 4.8, HY + 3.4);
        ctx.quadraticCurveTo(m - 4.2, HY + 5.2, m, HY + 5.2);
        ctx.quadraticCurveTo(m + 4.2, HY + 5.2, m + 4.8, HY + 3.4);
        ctx.quadraticCurveTo(m + 5.4, HY + 4.2, m + 4.2, HY + 5);
        ctx.quadraticCurveTo(m + 3, HY + 3.8, m, HY + 4.3);
        ctx.closePath();
      });
      break;
    case 7:
      // chin strap beard
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR + 0.3, HY + 1.4);
        ctx.quadraticCurveTo(cx - HR + 0.4, chinY + 0.9, cx + 0.8 * f, chinY + 1.2);
        ctx.quadraticCurveTo(cx + HR - 0.4, chinY + 0.9, cx + HR - 0.3, HY + 1.4);
        ctx.lineTo(cx + HR - 1.3, HY + 1.6);
        ctx.quadraticCurveTo(cx + HR - 1.8, chinY - 1.2, cx + 0.8 * f, chinY - 0.8);
        ctx.quadraticCurveTo(cx - HR + 1.8, chinY - 1.2, cx - HR + 1.3, HY + 1.6);
        ctx.closePath();
      });
      break;
    default: {
      // stubble
      ctx.fillStyle = rgba(c, 0.26);
      ctx.beginPath();
      ctx.moveTo(cx - HR + 0.8, HY + 2);
      ctx.quadraticCurveTo(cx - HR + 1, chinY + 0.6, cx + 0.8 * f, chinY + 0.6);
      ctx.quadraticCurveTo(cx + HR - 1, chinY + 0.6, cx + HR - 0.8, HY + 2);
      ctx.quadraticCurveTo(cx, HY + 5, cx - HR + 0.8, HY + 2);
      ctx.fill();
    }
  }
}

function glassesFront(ctx: Ctx, R: Rig, f: number) {
  const cx = 0.9 * f;
  const ey = HY + 0.9 + (R.child ? 0.9 : 0);
  const style = R.dna.glasses;
  const sp = 3.35;
  ctx.lineWidth = style === 1 ? 0.95 : 0.7;
  ctx.strokeStyle = style === 1 ? '#3a1e14' : '#2a2320';
  for (const s of [-1, 1]) {
    const x = cx + s * sp;
    ctx.beginPath();
    if (style === 0) ctx.arc(x, ey, 2.4, 0, Math.PI * 2);
    else if (style === 1) rr(ctx, x - 2.5, ey - 2, 5, 4, 1);
    else {
      ctx.moveTo(x - 2.6, ey - 1.6);
      ctx.lineTo(x + 2.6, ey - 1.6);
      ctx.quadraticCurveTo(x + 2.6, ey + 2.2, x, ey + 2.2);
      ctx.quadraticCurveTo(x - 2.6, ey + 2.2, x - 2.6, ey - 1.6);
    }
    ctx.fillStyle = style === 2 ? rgba('#1a2230', 0.88) : rgba('#dff4ff', 0.2);
    ctx.fill();
    ctx.stroke();
    if (style === 2) {
      ctx.fillStyle = rgba('#8fc8ff', 0.5);
      ctx.fillRect(x - 1.8, ey - 1, 1.4, 0.6);
    }
  }
  ctx.beginPath();
  ctx.moveTo(cx - sp + (style === 0 ? 2.4 : 2.5), ey - 0.4);
  ctx.quadraticCurveTo(cx, ey - 1.2, cx + sp - (style === 0 ? 2.4 : 2.5), ey - 0.4);
  ctx.stroke();
  if (style !== 2) {
    ctx.strokeStyle = rgba('#ffffff', 0.7);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.arc(cx - sp, ey, 1.6, 3.6, 4.3);
    ctx.arc(cx + sp, ey, 1.6, 3.6, 4.3);
    ctx.stroke();
  }
}

function accessoryHead(ctx: Ctx, R: Rig, f: number) {
  const cx = 0.5 * f;
  const h = HAIRS[R.look.hair % HAIRS.length];
  const top = HY - HR - 0.6 - h.vol * 0.9;
  switch (R.dna.acc) {
    case 2: {
      // headband
      ctx.strokeStyle = R.female ? '#e0405a' : '#d6453c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, HY - 2.6, HR + 0.5, 4.2, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
      break;
    }
    case 3: {
      // flower tucked in the hair
      const fx = cx - f * (HR - 1.2);
      const fy = HY - 4.2;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        dot(ctx, fx + Math.cos(a) * 1.2, fy + Math.sin(a) * 1.2, 1.1, '#ff86c4');
      }
      dot(ctx, fx, fy, 0.8, '#ffcf4a');
      break;
    }
    case 5: {
      // bandage on the forehead
      ctx.save();
      ctx.translate(cx + f * 2.6, HY - 3.4);
      ctx.rotate(-0.4 * f);
      rr(ctx, -2.2, -0.8, 4.4, 1.6, 0.6);
      ctx.fillStyle = '#f1dcc0';
      ctx.fill();
      ctx.strokeStyle = rgba('#8a6a4a', 0.6);
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ctx.fillStyle = rgba('#8a6a4a', 0.5);
      ctx.fillRect(-0.6, -0.6, 1.2, 1.2);
      ctx.restore();
      break;
    }
    case 6: {
      if (!R.female) break;
      // bow on top
      const bx = cx + f * 3.5;
      const by = top + 2.4;
      ctx.fillStyle = '#e0405a';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - 2.6, by - 1.6);
      ctx.lineTo(bx - 2.6, by + 1.6);
      ctx.closePath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 2.6, by - 1.6);
      ctx.lineTo(bx + 2.6, by + 1.6);
      ctx.closePath();
      ctx.fill();
      dot(ctx, bx, by, 0.8, '#b0203a');
      break;
    }
  }
}

// ------------------------------------------------------------------ HAIR (parametric)
type Fringe = 'none' | 'side' | 'bangs' | 'part' | 'spiky' | 'quiff' | 'slick' | 'curls' | 'swoop' | 'pixie' | 'bowl';
interface HairDef {
  len: number; // 0 buzz, 1 short, 2 chin, 3 shoulder, 4 long
  vol: number;
  fringe: Fringe;
  sides?: 'shaved' | 'puffy';
  extra?: 'ponytail' | 'bun' | 'pigtails' | 'braid' | 'puff' | 'topknot' | 'mohawk';
  curly?: boolean;
  wavy?: boolean;
  bald?: 'crown' | 'full';
}
export const HAIRS: HairDef[] = [
  /* 0 */ { len: 1, vol: 1, fringe: 'side' },
  /* 1 */ { len: 0, vol: 0, fringe: 'none' },
  /* 2 */ { len: 1, vol: 1.6, fringe: 'swoop' },
  /* 3 */ { len: 1, vol: 1.6, fringe: 'curls', curly: true },
  /* 4 */ { len: 0, vol: 0, fringe: 'none', sides: 'shaved', extra: 'mohawk' },
  /* 5 */ { len: 2, vol: 1.2, fringe: 'bangs' },
  /* 6 */ { len: 4, vol: 1.2, fringe: 'part' },
  /* 7 */ { len: 1, vol: 1, fringe: 'side', extra: 'ponytail' },
  /* 8 */ { len: 1, vol: 0, fringe: 'none', bald: 'crown' },
  /* 9 */ { len: 1, vol: 0.7, fringe: 'slick', extra: 'bun' },
  /* 10 */ { len: 2, vol: 4.0, fringe: 'curls', curly: true, sides: 'puffy' },
  /* 11 */ { len: 1, vol: 3.2, fringe: 'quiff' },
  /* 12 */ { len: 1, vol: 1, fringe: 'bangs', extra: 'pigtails' },
  /* 13 */ { len: 4, vol: 1.8, fringe: 'side', wavy: true },
  /* 14 */ { len: 1, vol: 1, fringe: 'part', extra: 'braid' },
  /* 15 */ { len: 1, vol: 2.4, fringe: 'spiky' },
  /* 16 */ { len: 1, vol: 0.7, fringe: 'slick' },
  /* 17 */ { len: 1, vol: 1.3, fringe: 'bowl' },
  /* 18 */ { len: 0, vol: 0, fringe: 'none', bald: 'full' },
  /* 19 */ { len: 1, vol: 0.5, fringe: 'slick', extra: 'puff', curly: true },
  /* 20 */ { len: 3, vol: 2.8, fringe: 'curls', curly: true },
  /* 21 */ { len: 0, vol: 0.6, fringe: 'slick', sides: 'shaved', extra: 'topknot' },
  /* 22 */ { len: 1, vol: 1.2, fringe: 'pixie' },
  /* 23 */ { len: 3, vol: 1.2, fringe: 'part', wavy: true },
];

/**
 * Curly silhouette: circles along a closed outline plus an inner fill. All circles are first
 * stamped in the outline colour (slightly larger), then filled on top, so only the outer
 * contour keeps a line; the curl texture is added as short arcs inside.
 */
function curlyFill(ctx: Ctx, hair: string, pts: [number, number][], r: number) {
  const t = tones(hair);
  const circles: [number, number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.round(len / (r * 1.25)));
    for (let k = 0; k < steps; k++) {
      circles.push([ax + ((bx - ax) * k) / steps, ay + ((by - ay) * k) / steps, r * (0.86 + ((i * 7 + k * 3) % 5) * 0.06)]);
    }
  }
  const poly = () => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [, y, rr0] of circles) {
    y0 = Math.min(y0, y - rr0);
    y1 = Math.max(y1, y + rr0);
  }
  // outline pass
  ctx.fillStyle = t.line;
  ctx.beginPath();
  for (const [x, y, rr0] of circles) {
    ctx.moveTo(x + rr0 + LW * 0.75, y);
    ctx.arc(x, y, rr0 + LW * 0.75, 0, Math.PI * 2);
  }
  ctx.fill();
  // fill pass with the usual top-lit gradient
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, t.light);
  g.addColorStop(0.4, t.base);
  g.addColorStop(1, t.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  for (const [x, y, rr0] of circles) {
    ctx.moveTo(x + rr0, y);
    ctx.arc(x, y, rr0, 0, Math.PI * 2);
  }
  ctx.fill();
  poly();
  ctx.fill();
  // curl texture: a shaded crescent on each curl, highlights on the upper ones
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(t.line, 0.45);
  ctx.lineWidth = 0.42;
  ctx.beginPath();
  for (const [x, y, rr0] of circles) {
    ctx.moveTo(x + Math.cos(0.15) * rr0 * 0.62, y + Math.sin(0.15) * rr0 * 0.62);
    ctx.arc(x, y, rr0 * 0.62, 0.15, 1.9);
  }
  ctx.stroke();
  ctx.strokeStyle = rgba(shade(hair, 0.5), 0.5);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (const [x, y, rr0] of circles) {
    if (y > (y0 + y1) / 2) continue;
    ctx.moveTo(x + Math.cos(3.6) * rr0 * 0.55, y + Math.sin(3.6) * rr0 * 0.55);
    ctx.arc(x, y, rr0 * 0.55, 3.6, 4.6);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function sheen(ctx: Ctx, hair: string, x: number, y: number, w: number, rot = -0.3) {
  ctx.strokeStyle = rgba(shade(hair, 0.55), 0.55);
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.45, rot, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function strands(ctx: Ctx, hair: string, lines: [number, number, number, number, number, number][]) {
  ctx.strokeStyle = rgba(mix(shade(hair, -0.3), '#5a3020', 0.25), 0.5);
  ctx.lineWidth = 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [ax, ay, cx2, cy2, bx, by] of lines) {
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(cx2, cy2, bx, by);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function lenBottom(len: number) {
  return len >= 4 ? HY + 21 : len === 3 ? HY + 12.5 : len === 2 ? HY + 6.4 : HY + 1;
}

/** Hair mass that sits behind the head and body (long hair, ponytails, buns, afros). */
function hairBackLayer(ctx: Ctx, R: Rig, f: number, view: 'front' | 'side') {
  if (hatHidesHair(R.o) && !(R.o.hat === 'hood')) return;
  if (R.o.hat === 'helmet' && R.o.style === 'space') return;
  if (R.o.hat === 'hood') return;
  const h = HAIRS[R.look.hair % HAIRS.length];
  const hair = R.hair;
  const cx = view === 'side' ? -1.2 : 0.5 * f;
  const back = shade(hair, -0.14);
  if (h.sides === 'puffy') {
    if (h.curly) {
      const pts: [number, number][] = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * (HR + 3.2), HY - 2.2 + Math.sin(a) * (HR + 2.4)]);
      }
      curlyFill(ctx, back, pts, 2.6);
    }
    return;
  }
  if (h.len >= 2 && !h.extra) {
    const bottom = lenBottom(h.len);
    const wd = HR + 1.7 + (h.curly ? 1.4 : 0) + (h.wavy ? 0.6 : 0);
    if (h.curly) {
      const pts: [number, number][] = [];
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const a = Math.PI + (i / steps) * Math.PI;
        pts.push([cx + Math.cos(a) * wd, HY - 1 + Math.sin(a) * (HR + 1.2)]);
      }
      pts.push([cx + wd + 0.6, bottom - 3], [cx + wd - 1, bottom], [cx, bottom + 1], [cx - wd + 1, bottom], [cx - wd - 0.6, bottom - 3]);
      curlyFill(ctx, back, pts, 2.2);
    } else {
      hairFill(ctx, back, () => {
        ctx.beginPath();
        ctx.moveTo(cx - wd, HY - 1);
        ctx.bezierCurveTo(cx - wd, HY - HR - 3, cx + wd, HY - HR - 3, cx + wd, HY - 1);
        if (view === 'side') {
          ctx.quadraticCurveTo(cx + wd * 0.3, bottom - 4, cx + 1.6, bottom);
          ctx.lineTo(cx - wd + 0.4, bottom);
        } else if (h.wavy) {
          ctx.quadraticCurveTo(cx + wd + 2, (HY + bottom) / 2, cx + wd - 0.4, bottom);
          for (let i = 1; i <= 4; i++) {
            const x = cx + wd - 0.4 - ((wd * 2 - 0.8) * i) / 4;
            ctx.quadraticCurveTo(x + (wd * 2 - 0.8) / 8, bottom + 1.8, x, bottom);
          }
        } else {
          ctx.quadraticCurveTo(cx + wd + 1.2, (HY + bottom) / 2, cx + wd - 0.5, bottom);
          ctx.quadraticCurveTo(cx, bottom + 1.2, cx - wd + 0.5, bottom);
        }
        if (view !== 'side') ctx.quadraticCurveTo(cx - wd - 1.2, (HY + bottom) / 2, cx - wd, HY - 1);
        else ctx.quadraticCurveTo(cx - wd - 1.4, (HY + bottom) / 2, cx - wd, HY - 1);
        ctx.closePath();
      });
    }
  }
  switch (h.extra) {
    case 'ponytail': {
      if (view === 'side') {
        hairFill(ctx, back, () => {
          ctx.beginPath();
          ctx.moveTo(-HR + 0.4, HY - 4.4);
          ctx.bezierCurveTo(-HR - 5, HY - 3, -HR - 4.4, HY + 8, -HR - 1.4, HY + 13);
          ctx.quadraticCurveTo(-HR - 0.2, HY + 6, -HR + 2, HY - 1.6);
          ctx.closePath();
        });
        dot(ctx, -HR + 0.6, HY - 3.2, 1.2, '#d9465a');
      } else {
        const s = -f;
        hairFill(ctx, back, () => {
          ctx.beginPath();
          ctx.moveTo(cx + s * (HR - 2), HY - 6);
          ctx.bezierCurveTo(cx + s * (HR + 5), HY - 6, cx + s * (HR + 4.6), HY + 5, cx + s * (HR + 2), HY + 11);
          ctx.quadraticCurveTo(cx + s * (HR + 1.8), HY + 3, cx + s * (HR - 0.6), HY - 2.6);
          ctx.closePath();
        });
      }
      break;
    }
    case 'bun':
    case 'topknot': {
      const r = h.extra === 'bun' ? 3.6 : 2.5;
      const bx = view === 'side' ? -HR + 2.8 : cx - f * 0.8;
      const by = view === 'side' ? HY - HR + 0.4 : HY - HR - 1.8 - (h.extra === 'topknot' ? 1.2 : 0);
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
      });
      ctx.strokeStyle = rgba(tones(hair).dark, 0.8);
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.55, 0.4, 5.2);
      ctx.stroke();
      break;
    }
    case 'puff': {
      const bx = view === 'side' ? -HR + 1.8 : cx - f * 0.6;
      const by = HY - HR - 2.6;
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        pts.push([bx + Math.cos(a) * 5.4, by + Math.sin(a) * 4.4]);
      }
      curlyFill(ctx, hair, pts, 2.2);
      break;
    }
  }
}

/** Front (3/4) cap of hair on top of the head, including the fringe. */
function hairCapFront(ctx: Ctx, R: Rig, f: number) {
  const h = HAIRS[R.look.hair % HAIRS.length];
  const hair = R.hair;
  const cx = 0.5 * f;
  const ps = R.dna.part;
  if (h.bald === 'full') {
    ctx.fillStyle = rgba(hair, R.dna.age >= 3 ? 0 : 0.18);
    ctx.beginPath();
    ctx.ellipse(cx, HY - 3.4, HR - 0.4, HR - 2.6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.beginPath();
    ctx.ellipse(cx - 2.2, HY - HR + 2.2, 2.6, 1.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.bald === 'crown') {
    for (const s of [-1, 1]) {
      const far = s !== f;
      const ox = cx + s * (HR + (far ? 0.2 : 0.7));
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx + s * (HR - 2.2), HY - 5.6);
        ctx.quadraticCurveTo(ox + s * 0.6, HY - 5, ox + s * 0.5, HY - 2.2);
        ctx.quadraticCurveTo(ox + s * 0.4, HY - 0.6, ox - s * 0.4, HY - 0.9);
        ctx.lineTo(ox - s * 1.2, HY - 1.8);
        ctx.quadraticCurveTo(cx + s * (HR - 1.8), HY - 3.6, cx + s * (HR - 2.2), HY - 5.6);
        ctx.closePath();
      });
      strands(ctx, hair, [[ox - s * 1.4, HY - 4.4, ox, HY - 3.6, ox - s * 0.2, HY - 1.6]]);
    }
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.beginPath();
    ctx.ellipse(cx - 2, HY - HR + 2.4, 2.4, 1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.sides === 'shaved') {
    ctx.fillStyle = rgba(hair, 0.3);
    ctx.beginPath();
    ctx.moveTo(cx - HR + 0.4, HY - 0.8);
    ctx.bezierCurveTo(cx - HR, HY - HR - 1.4, cx + HR, HY - HR - 1.4, cx + HR - 0.4, HY - 0.8);
    ctx.quadraticCurveTo(cx, HY - 5.4, cx - HR + 0.4, HY - 0.8);
    ctx.closePath();
    ctx.fill();
    if (h.extra === 'mohawk') {
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - 2.2, HY - HR + 1.6);
        ctx.lineTo(cx - 2.4, HY - HR - 2.6);
        ctx.lineTo(cx - 1.6, HY - HR - 6.4);
        ctx.lineTo(cx - 0.3, HY - HR - 3.6);
        ctx.lineTo(cx + 0.9, HY - HR - 7.4);
        ctx.lineTo(cx + 1.8, HY - HR - 3.4);
        ctx.lineTo(cx + 2.6, HY - HR - 5.6);
        ctx.lineTo(cx + 2.4, HY - HR + 1.6);
        ctx.closePath();
      });
    } else {
      // slicked-back strip for top knots
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.ellipse(cx, HY - HR + 1.2, HR * 0.55, 2.6, 0, Math.PI, 0);
        ctx.closePath();
      });
    }
    return;
  }
  const len = h.len;
  const vol = h.vol;
  const W = HR + 0.55 + vol * 0.2 + (h.curly ? 0.5 : 0);
  const top = HY - HR - 0.9 - vol;
  const yS = HY + (len >= 2 ? 1.4 : len === 0 ? -0.8 : 0.5);
  const xl = cx - HR + 1.1;
  const xr = cx + HR - 1.1;
  const yt = HY - 1.8;
  if (h.curly) {
    // curly cap: bumpy outline around the crown with a curly hairline
    const pts: [number, number][] = [];
    pts.push([cx - W, yS]);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      pts.push([cx + Math.cos(a) * W, HY - 1.4 + Math.sin(a) * (HR + 0.4 + vol * 0.8)]);
    }
    pts.push([cx + W, yS], [xr + 0.4, HY - 1.4], [cx + 2.6, HY - 3.6], [cx - 1.4, HY - 3.4], [xl - 0.4, HY - 1.6]);
    curlyFill(ctx, hair, pts, 1.9 + vol * 0.12);
    return;
  }
  const len0 = len === 0;
  const pathCap = () => {
    ctx.beginPath();
    ctx.moveTo(cx - W, yS);
    if (h.fringe === 'spiky') {
      ctx.lineTo(cx - W - 0.3, HY - 3);
      const spikes = 7;
      for (let i = 0; i < spikes; i++) {
        const a0 = Math.PI * (1.05 + (i / spikes) * 0.9);
        const a1 = Math.PI * (1.05 + ((i + 0.5) / spikes) * 0.9);
        const rOut = HR + 1.5 + vol + (i % 2) * 1.2;
        ctx.lineTo(cx + Math.cos(a0) * (HR + 0.8), HY - 1.8 + Math.sin(a0) * (HR + 0.6));
        ctx.lineTo(cx + Math.cos(a1) * rOut + f * 0.6, HY - 1.8 + Math.sin(a1) * rOut);
      }
      ctx.lineTo(cx + W + 0.3, HY - 3);
      ctx.lineTo(cx + W, yS);
    } else {
      ctx.bezierCurveTo(cx - W - 0.3, top + 2, cx - W * 0.6, top, cx + f * 0.8, top);
      ctx.bezierCurveTo(cx + W * 0.6, top, cx + W + 0.3, top + 2, cx + W, yS);
    }
    ctx.lineTo(cx + HR - 0.8, yS);
    ctx.lineTo(xr, yt);
    // forehead hairline
    switch (h.fringe) {
      case 'bangs':
        ctx.lineTo(xr + 0.2, HY - 1.1);
        for (let i = 1; i <= 5; i++) {
          const x = xr + 0.2 - ((xr - xl + 0.4) * i) / 5;
          ctx.quadraticCurveTo(x + (xr - xl) / 10, HY - 0.3, x, HY - 1.2);
        }
        break;
      case 'bowl':
        ctx.lineTo(xr + 0.6, HY - 0.6);
        ctx.quadraticCurveTo(cx, HY - 0.2, xl - 0.6, HY - 0.6);
        break;
      case 'part':
        ctx.quadraticCurveTo(cx + ps * 1.6 + 2, HY - 2.8, cx + ps * 1.6 + 0.3, HY - 5.6);
        ctx.lineTo(cx + ps * 1.6 - 0.3, HY - 5.6);
        ctx.quadraticCurveTo(cx + ps * 1.6 - 2, HY - 2.8, xl, yt);
        break;
      case 'side':
        if (ps > 0) {
          ctx.quadraticCurveTo(cx + 3, HY - 5.2, cx + 1.4, HY - 5);
          ctx.quadraticCurveTo(cx - 2.6, HY - 3.6, xl, HY - 1.4);
        } else {
          ctx.quadraticCurveTo(cx + 3.2, HY - 3.2, cx - 0.6, HY - 4.4);
          ctx.quadraticCurveTo(cx - 3, HY - 5.4, xl, yt);
        }
        break;
      case 'swoop':
        ctx.quadraticCurveTo(cx + 3.6, HY - 5.6, cx + 0.8, HY - 5.4);
        ctx.quadraticCurveTo(cx - 2.2, HY - 5, cx - 3.2, HY - 2.4);
        ctx.quadraticCurveTo(cx - 4.4, HY - 3.2, xl, yt);
        break;
      case 'pixie':
        ctx.lineTo(cx + 3.2, HY - 3.2);
        ctx.lineTo(cx + 2.4, HY - 1.4);
        ctx.lineTo(cx + 0.8, HY - 3);
        ctx.lineTo(cx - 0.6, HY - 1.2);
        ctx.lineTo(cx - 2.2, HY - 2.8);
        ctx.lineTo(cx - 3.6, HY - 1.6);
        ctx.lineTo(xl, yt);
        break;
      case 'quiff':
        ctx.quadraticCurveTo(cx, HY - 5.2, xl, yt);
        break;
      default:
        // none / slick / spiky: high natural hairline
        ctx.quadraticCurveTo(cx, len0 ? HY - 5.8 : HY - 6.2, xl, yt);
    }
    ctx.lineTo(cx - HR + 0.8, yS);
    ctx.closePath();
  };
  hairFill(ctx, len0 ? shade(hair, -0.05) : hair, pathCap);
  if (len0) return;
  if (h.fringe === 'quiff') {
    hairFill(ctx, hair, () => {
      ctx.beginPath();
      ctx.moveTo(cx - 4, HY - HR + 0.4);
      ctx.bezierCurveTo(cx - 4.6, top - 2.4, cx + f * 5, top - 3.4, cx + f * 5.6, top + 0.8);
      ctx.quadraticCurveTo(cx + f * 3, top + 0.6, cx + 3.2 * f, HY - 4.6);
      ctx.quadraticCurveTo(cx, HY - 5.6, cx - 4, HY - HR + 0.4);
      ctx.closePath();
    });
  }
  // details per fringe, kept inside the hair mass
  ctx.save();
  pathCap();
  if (h.fringe === 'quiff') {
    ctx.moveTo(cx - 4, HY - HR + 0.4);
    ctx.bezierCurveTo(cx - 4.6, top - 2.4, cx + f * 5, top - 3.4, cx + f * 5.6, top + 0.8);
    ctx.quadraticCurveTo(cx + f * 3, top + 0.6, cx + 3.2 * f, HY - 4.6);
    ctx.quadraticCurveTo(cx, HY - 5.6, cx - 4, HY - HR + 0.4);
    ctx.closePath();
  }
  ctx.clip('nonzero');
  switch (h.fringe) {
    case 'quiff':
      strands(ctx, hair, [[cx - 2.6, HY - 5.2, cx - 2, top - 1, cx + f * 3.6, top - 1.2]]);
      sheen(ctx, hair, cx + f * 1.4, top + 0.4, 4.2, -0.2 * f);
      break;
    case 'slick':
      strands(ctx, hair, [
        [cx - 3.4, HY - 4.8, cx - 3, top + 2, cx - 1.6, top + 0.6],
        [cx - 0.4, HY - 5.4, cx, top + 2, cx + 1, top + 0.4],
        [cx + 2.8, HY - 4.8, cx + 3.2, top + 2.4, cx + 3.6, top + 1],
      ]);
      sheen(ctx, hair, cx - 0.8, top + 1.6, 4.4);
      break;
    case 'swoop':
      strands(ctx, hair, [
        [cx + 3, HY - 5.2, cx - 0.5, HY - 6.6, cx - 3, HY - 3],
        [cx + 1.2, top + 1.2, cx - 1.6, HY - 6.8, cx - 3.8, HY - 4.2],
      ]);
      sheen(ctx, hair, cx + 1.6 * f, top + 1, 4.4, -0.2 * f);
      break;
    case 'part':
      strands(ctx, hair, [
        [cx + ps * 1.6, top + 0.6, cx + ps * 1.6, HY - 7, cx + ps * 1.6, HY - 5.6],
        [cx + ps * 1.6 - 1, HY - 6, cx - 3.2, HY - 5, xl, HY - 2.4],
        [cx + ps * 1.6 + 1, HY - 6, cx + 3.2, HY - 5, xr, HY - 2.4],
      ]);
      sheen(ctx, hair, cx - 2, top + 1.6, 3.6);
      break;
    case 'bangs':
    case 'bowl':
      strands(ctx, hair, [
        [cx - 3, HY - 5.4, cx - 3.2, HY - 3.2, cx - 3.4, HY - 1.4],
        [cx + 0.2, HY - 5.8, cx + 0.2, HY - 3.4, cx + 0.2, HY - 1.2],
        [cx + 3.2, HY - 5.4, cx + 3.4, HY - 3.2, cx + 3.6, HY - 1.4],
      ]);
      sheen(ctx, hair, cx - 1.4, top + 1.4, 4.6);
      break;
    default:
      strands(ctx, hair, [
        [cx + f * 3.5, top + 1.2, cx, HY - 7.4, cx - 3.4, HY - 3.6],
        [cx + f * 1, top + 0.6, cx - 2, HY - 6.8, cx - 5, HY - 2.8],
      ]);
      sheen(ctx, hair, cx - 1, top + 1.3, 4.2);
  }
  ctx.restore();
}

/** Locks framing the face, pigtails and braids drawn in front of the head. */
function hairFrontLocks(ctx: Ctx, R: Rig, f: number) {
  const h = HAIRS[R.look.hair % HAIRS.length];
  const hair = R.hair;
  const cx = 0.5 * f;
  if (h.bald || h.sides) return;
  if (h.len >= 2 && !h.curly) {
    const bottom = h.len >= 4 ? HY + 14 : h.len === 3 ? HY + 11 : HY + 6.2;
    for (const s of [-1, 1]) {
      const far = s !== f;
      const ox = cx + s * (HR + (far ? 0.6 : 1.2));
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx + s * (HR - 1.8), HY - 2.6);
        ctx.quadraticCurveTo(cx + s * (HR + 1.8), HY - 2, ox, HY + 2);
        if (h.wavy) {
          ctx.quadraticCurveTo(ox + s * 1.6, (HY + bottom) / 2, ox, bottom);
        } else ctx.lineTo(ox + s * 0.4, bottom);
        ctx.quadraticCurveTo(ox - s * 1.4, bottom + 0.8, ox - s * 2.6, bottom - 0.6);
        ctx.quadraticCurveTo(cx + s * (HR - 1.4), HY + 3, cx + s * (HR - 1.6), HY - 0.4);
        ctx.closePath();
      });
    }
  }
  if (h.extra === 'pigtails') {
    for (const s of [-1, 1]) {
      const bx = cx + s * (HR + 0.6);
      hairFill(ctx, shade(hair, -0.04), () => {
        ctx.beginPath();
        ctx.moveTo(bx, HY - 2);
        ctx.bezierCurveTo(bx + s * 4.2, HY - 1, bx + s * 4.4, HY + 7, bx + s * 1.6, HY + 11);
        ctx.quadraticCurveTo(bx + s * 0.4, HY + 5, bx - s * 0.6, HY + 0.4);
        ctx.closePath();
      });
      dot(ctx, bx + s * 0.4, HY - 0.8, 1.2, '#e0405a');
    }
  }
  if (h.extra === 'braid') {
    const bx = cx + f * (HR - 0.6);
    for (let i = 0; i < 6; i++) {
      hairFill(ctx, i % 2 ? hair : shade(hair, -0.08), () => {
        ctx.beginPath();
        ctx.ellipse(bx + f * (0.8 + i * 0.2), HY + 2 + i * 2.3, 1.7 - i * 0.08, 1.4, f * 0.4, 0, Math.PI * 2);
      });
    }
    dot(ctx, bx + f * 2, HY + 15.6, 1.1, '#3fb3a8');
  }
}

// ------------------------------------------------------------------ BACK VIEW
function drawBack(ctx: Ctx, R: Rig) {
  const { o, p, B, skin } = R;
  const j = frontJoints(p, B);
  const lc = legColor(o, skin);
  const sc = sleeveColor(o);
  const hc = handColor(o, skin);
  const [shoe, shoeC] = shoeOf(o, R.female);
  const bare = bareForearm(R);
  const bulky = o.style === 'armor' || o.style === 'space';
  const thighW = 6.0 * B.limb * (R.female ? 0.95 : 1);
  const shinW = 4.8 * B.limb * (R.female ? 0.92 : 1);
  const legs: [[number, number], [number, number], [number, number], number][] = [
    [j.hipL, j.kneeL, j.ankleL, -1],
    [j.hipR, j.kneeR, j.ankleR, 1],
  ];
  for (const [hip, knee, ankle, side] of legs) {
    limbSeg(ctx, knee[0], knee[1], ankle[0], ankle[1], shinW, shinW * 0.86, lc);
    limbSeg(ctx, hip[0], hip[1], knee[0], knee[1], thighW, thighW * 0.82, o.style === 'dress' ? skin : lc);
    if (o.style === 'sport') {
      ctx.strokeStyle = o.accent;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(hip[0] + side * 2.2, hip[1] + 1);
      ctx.lineTo(knee[0] + side * 2, knee[1]);
      ctx.lineTo(ankle[0] + side * 1.7, ankle[1] - 1);
      ctx.stroke();
    }
    bootBack(ctx, ankle[0], ankle[1], shoe === 'sneaker' ? shoeC : shoeC);
  }

  ctx.save();
  ctx.translate(0, -UP - (p.breath ?? 0) * 0.25);
  const upperW = 5.3 * B.limb;
  const foreW = 4.3 * B.limb;
  const arm = (sh: [number, number], el: [number, number], ha: [number, number], side: number) => {
    limbSeg(ctx, el[0], el[1], ha[0], ha[1], foreW, foreW * 0.9, bare ? skin : sc);
    limbSeg(ctx, sh[0], sh[1], el[0], el[1], upperW, upperW * 0.9, sc);
    hand(ctx, ha[0], ha[1], hc, -side, 0, B.limb);
  };
  if (p.reach) {
    arm(j.shL, j.elL, j.haL, -1);
    arm(j.shR, j.elR, j.haR, 1);
  }
  limbSeg(ctx, 0, -32.2, 0, -28.4, B.neck, B.neck, skin);
  const path = () => torsoPathFront(ctx, B, R.female, bulky);
  celFill(ctx, o.top, path, -1.2, 1.0);
  ctx.save();
  path();
  ctx.clip();
  outfitBack(ctx, o, skin);
  if (o.style !== 'dress' && o.style !== 'robe' && o.style !== 'coat') {
    ctx.fillStyle = o.bottom;
    ctx.fillRect(-12, -15.2, 24, 3);
  }
  ctx.strokeStyle = rgba(tones(o.top).dark, 0.55);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-4.6, -24.6);
  ctx.quadraticCurveTo(-2.8, -23, -3.2, -20.8);
  ctx.moveTo(4.6, -24.6);
  ctx.quadraticCurveTo(2.8, -23, 3.2, -20.8);
  ctx.stroke();
  ctx.restore();
  if (o.style === 'ninja') {
    ctx.fillStyle = shade(o.accent, -0.1);
    ctx.beginPath();
    ctx.moveTo(-0.6, -17.6);
    ctx.lineTo(-2.8, -11.4);
    ctx.lineTo(-1.2, -11.8);
    ctx.lineTo(0.6, -17.6);
    ctx.moveTo(0.4, -17.6);
    ctx.lineTo(2.6, -12.2);
    ctx.lineTo(3.8, -12.8);
    ctx.lineTo(1.6, -17.6);
    ctx.fill();
  }
  tails(ctx, R, false);
  if (o.style === 'space') {
    celFill(ctx, shade(o.top, -0.06), () => rr(ctx, -6.6, -29.4, 13.2, 12.6, 2.6), -0.8, 0.8);
    celFill(ctx, '#c9d2d9', () => rr(ctx, -5.2, -28.2, 4, 10, 1.8), -0.4, 0.4);
    celFill(ctx, '#c9d2d9', () => rr(ctx, 1.2, -28.2, 4, 10, 1.8), -0.4, 0.4);
    dot(ctx, 0, -18.8, 0.8, '#ff5a4a');
  }
  ctx.save();
  headSpace(ctx, R);
  drawHeadBack(ctx, R);
  ctx.restore();
  if (!p.reach) {
    arm(j.shL, j.elL, j.haL, -1);
    arm(j.shR, j.elR, j.haR, 1);
  }
  ctx.restore();
}

function bootBack(ctx: Ctx, x: number, y: number, c: string) {
  const t = tones(c);
  rr(ctx, x - 2.6, y - 2.5, 5.2, 3.9, 1.5);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  ctx.fillStyle = shade(c, -0.5);
  ctx.fillRect(x - 2.6, y + 0.5, 5.2, 0.9);
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(x - 1.6, y - 1.9, 3.2, 0.6);
}

function drawHeadBack(ctx: Ctx, R: Rig) {
  const { o, skin } = R;
  const t = tones(skin);
  for (const s of [-1, 1]) {
    const ex = s * (HR - 0.2);
    ctx.beginPath();
    ctx.ellipse(ex, HY + 0.9, 1.8, 2.5, s * -0.15, 0, Math.PI * 2);
    ctx.fillStyle = t.base;
    ctx.fill();
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ex + s * 0.5, HY + 1, 0.7, 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.dark;
    ctx.fill();
  }
  celFill(ctx, skin, () => headPathFront(ctx, R, 0), -1.6, 1.4, true, skinShadow(skin));
  if (o.hat === 'helmet' && o.style === 'space') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, HY - 0.4, HR + 2.4, 0, Math.PI * 2);
    ctx.clip();
    hairBackView(ctx, R);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, HY - 0.4, HR + 3, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#cfefff', 0.2);
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgba('#f4f6f8', 0.95);
    ctx.stroke();
    return;
  }
  if (o.style === 'ninja') {
    celFill(ctx, o.top, () => {
      ctx.beginPath();
      ctx.arc(0, HY - 0.4, HR + 0.6, 0, Math.PI * 2);
    }, -1, 1);
    ctx.fillStyle = o.accent;
    ctx.fillRect(-HR - 0.6, HY - 2.6, HR * 2 + 1.2, 1.8);
    return;
  }
  if (!hatHidesHair(o)) hairBackView(ctx, R);
  if (R.look.beard === 1 || R.look.beard === 6) {
    // beard edge visible past the jaw
    hairFill(ctx, beardColor(R), () => {
      ctx.beginPath();
      ctx.moveTo(-HR + 0.6, HY + 3);
      ctx.quadraticCurveTo(-HR + 0.4, HY + 7, -HR + 2.4, HY + 8.4);
      ctx.lineTo(-HR + 2.6, HY + 5);
      ctx.closePath();
      ctx.moveTo(HR - 0.6, HY + 3);
      ctx.quadraticCurveTo(HR - 0.4, HY + 7, HR - 2.4, HY + 8.4);
      ctx.lineTo(HR - 2.6, HY + 5);
      ctx.closePath();
    });
  }
  drawHatBack(ctx, o);
}

function hairBackView(ctx: Ctx, R: Rig) {
  const h = HAIRS[R.look.hair % HAIRS.length];
  const hair = R.hair;
  if (h.bald === 'full') {
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.beginPath();
    ctx.ellipse(-1.8, HY - HR + 2.4, 2.6, 1.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.bald === 'crown') {
    hairFill(ctx, hair, () => {
      ctx.beginPath();
      ctx.moveTo(-HR - 0.6, HY - 2.4);
      ctx.quadraticCurveTo(-HR + 0.4, HY + 5.8, 0, HY + 6);
      ctx.quadraticCurveTo(HR - 0.4, HY + 5.8, HR + 0.6, HY - 2.4);
      ctx.quadraticCurveTo(HR - 1.4, HY + 2.8, 0, HY + 2.8);
      ctx.quadraticCurveTo(-HR + 1.4, HY + 2.8, -HR - 0.6, HY - 2.4);
      ctx.closePath();
    });
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.beginPath();
    ctx.ellipse(-1.8, HY - HR + 2.4, 2.6, 1.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.sides === 'shaved') {
    ctx.fillStyle = rgba(hair, 0.32);
    ctx.beginPath();
    ctx.ellipse(0, HY - 1, HR - 0.4, HR - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    if (h.extra === 'mohawk') {
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(-2, HY + 4.6);
        ctx.lineTo(-2.2, HY - HR + 1);
        ctx.lineTo(-1.4, HY - HR - 5.4);
        ctx.lineTo(0.2, HY - HR - 3.4);
        ctx.lineTo(1.4, HY - HR - 6.2);
        ctx.lineTo(2.2, HY - HR + 1);
        ctx.lineTo(2, HY + 4.6);
        ctx.closePath();
      });
    } else {
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.ellipse(0, HY - HR + 1.2, HR * 0.55, 2.6, 0, Math.PI, 0);
        ctx.closePath();
      });
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.arc(0, HY - HR - 2.2, 2.5, 0, Math.PI * 2);
      });
    }
    return;
  }
  const bottom = h.len >= 2 ? lenBottom(h.len) : h.len === 0 ? HY + 4.4 : HY + 5.2;
  const wd = HR + 0.6 + h.vol * 0.25 + (h.sides === 'puffy' ? 3 : 0);
  if (h.curly) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      pts.push([Math.cos(a) * wd, HY - 1.2 + Math.sin(a) * (HR + 0.6 + h.vol * 0.7)]);
    }
    pts.push([wd, Math.max(HY + 2, bottom - 3)], [wd - 2, bottom], [0, bottom + 1], [-wd + 2, bottom], [-wd, Math.max(HY + 2, bottom - 3)]);
    curlyFill(ctx, hair, pts, 2 + h.vol * 0.15);
  } else {
    hairFill(ctx, h.len === 0 ? shade(hair, -0.06) : hair, () => {
      ctx.beginPath();
      ctx.moveTo(-wd, HY + 0.6);
      ctx.bezierCurveTo(-wd - 0.4, HY - HR - 2.6 - h.vol, wd + 0.4, HY - HR - 2.6 - h.vol, wd, HY + 0.6);
      if (h.len >= 2) {
        ctx.quadraticCurveTo(wd + 1.8, (HY + bottom) / 2, wd - 0.4, bottom);
        ctx.quadraticCurveTo(0, bottom + 1.4, -wd + 0.4, bottom);
        ctx.quadraticCurveTo(-wd - 1.8, (HY + bottom) / 2, -wd, HY + 0.6);
      } else {
        ctx.quadraticCurveTo(wd - 0.2, bottom - 1.4, wd - 2.4, bottom);
        ctx.quadraticCurveTo(0, bottom + 1.3, -wd + 2.4, bottom);
        ctx.quadraticCurveTo(-wd + 0.2, bottom - 1.4, -wd, HY + 0.6);
      }
      ctx.closePath();
    });
    // whorl & strands
    strands(ctx, hair, [
      [0.8, HY - HR + 1.4, -2.4, HY - HR + 3, -4.8, HY - 1],
      [0.8, HY - HR + 1.4, 3.6, HY - HR + 3.4, 5.2, HY - 1.4],
      [0.8, HY - HR + 1.4, 0.2, HY - 3, -0.6, Math.min(bottom - 1, HY + 4)],
    ]);
  }
  switch (h.extra) {
    case 'ponytail':
      hairFill(ctx, shade(hair, -0.04), () => {
        ctx.beginPath();
        ctx.moveTo(-1.8, HY - 1);
        ctx.quadraticCurveTo(-3.6, HY + 6, -0.6, HY + 12.4);
        ctx.quadraticCurveTo(0.6, HY + 13, 1.4, HY + 11.6);
        ctx.quadraticCurveTo(3.4, HY + 5, 1.8, HY - 1);
        ctx.closePath();
      });
      dot(ctx, 0, HY - 0.6, 1.3, '#d9465a');
      break;
    case 'bun':
    case 'topknot':
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.arc(0, HY - HR - (h.extra === 'bun' ? 1.2 : 2.2), h.extra === 'bun' ? 3.4 : 2.5, 0, Math.PI * 2);
      });
      break;
    case 'pigtails':
      for (const s of [-1, 1]) {
        hairFill(ctx, shade(hair, -0.04), () => {
          ctx.beginPath();
          ctx.moveTo(s * (HR - 0.6), HY - 1.4);
          ctx.bezierCurveTo(s * (HR + 4), HY - 0.4, s * (HR + 4), HY + 7, s * (HR + 1.4), HY + 11);
          ctx.quadraticCurveTo(s * (HR - 0.2), HY + 5, s * (HR - 1.4), HY + 1);
          ctx.closePath();
        });
        dot(ctx, s * (HR - 0.2), HY - 0.8, 1.2, '#e0405a');
      }
      break;
    case 'braid':
      for (let i = 0; i < 7; i++) {
        hairFill(ctx, i % 2 ? hair : shade(hair, -0.08), () => {
          ctx.beginPath();
          ctx.ellipse(0, HY + 3 + i * 2.3, 1.8 - i * 0.08, 1.4, 0, 0, Math.PI * 2);
        });
      }
      dot(ctx, 0, HY + 19, 1.1, '#3fb3a8');
      break;
    case 'puff': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        pts.push([Math.cos(a) * 5.4, HY - HR - 2.6 + Math.sin(a) * 4.4]);
      }
      curlyFill(ctx, hair, pts, 2.2);
      break;
    }
  }
}

// ------------------------------------------------------------------ SIDE VIEW
function drawSide(ctx: Ctx, R: Rig) {
  const { o, p, B, skin } = R;
  const j = sideJoints(p);
  const lc = legColor(o, skin);
  const sc = sleeveColor(o);
  const hc = handColor(o, skin);
  const [shoe, shoeC] = shoeOf(o, R.female);
  const bare = bareForearm(R);
  const farTone = (c: string) => shade(c, -0.22);
  const thighW = 5.9 * B.limb * (R.female ? 0.95 : 1);
  const shinW = 4.8 * B.limb * (R.female ? 0.92 : 1);
  const upperW = 5.1 * B.limb;
  const foreW = 4.1 * B.limb;
  const breath = (p.breath ?? 0) * 0.25;

  ctx.save();
  ctx.translate(0, -UP - breath);
  ctx.save();
  headSpace(ctx, R);
  hairBackLayer(ctx, R, 1, 'side');
  ctx.restore();
  if (o.style === 'space') celFill(ctx, shade(o.top, -0.1), () => rr(ctx, -8.2, -29, 5, 12, 2));
  const armed = p.weapon ? armedPose(p, j) : null;
  if (armed?.far) {
    // supporting hand on the barrel / handle
    const sh: [number, number] = [-0.8, SH_Y + 0.3];
    const el = ik(sh, armed.far, UPPER * 1.05, FORE * 1.05, 1);
    limbSeg(ctx, el[0], el[1], armed.far[0], armed.far[1], foreW * 0.95, foreW * 0.86, farTone(bare ? skin : sc));
    limbSeg(ctx, sh[0], sh[1], el[0], el[1], upperW * 0.95, upperW * 0.86, farTone(sc));
    hand(ctx, armed.far[0], armed.far[1], farTone(hc), 1, 1.2, B.limb);
  } else {
    limbSeg(ctx, j.elR[0], j.elR[1], j.haR[0], j.haR[1], foreW * 0.95, foreW * 0.86, farTone(bare ? skin : sc));
    limbSeg(ctx, j.shR[0], j.shR[1], j.elR[0], j.elR[1], upperW * 0.95, upperW * 0.86, farTone(sc));
    hand(ctx, j.haR[0], j.haR[1], farTone(hc), 1, 0, B.limb);
  }
  ctx.restore();
  limbSeg(ctx, j.kneeR[0], j.kneeR[1], j.ankleR[0], j.ankleR[1], shinW * 0.95, shinW * 0.84, farTone(lc));
  limbSeg(ctx, j.hipR[0], j.hipR[1], j.kneeR[0], j.kneeR[1], thighW * 0.95, thighW * 0.8, farTone(o.style === 'dress' ? skin : lc));
  shoeSide(ctx, j.ankleR[0], j.ankleR[1], shoe, farTone(shoeC));
  limbSeg(ctx, j.kneeL[0], j.kneeL[1], j.ankleL[0], j.ankleL[1], shinW, shinW * 0.86, lc);
  limbSeg(ctx, j.hipL[0], j.hipL[1], j.kneeL[0], j.kneeL[1], thighW, thighW * 0.82, o.style === 'dress' ? skin : lc);
  shoeSide(ctx, j.ankleL[0], j.ankleL[1], shoe, shoeC);

  ctx.save();
  ctx.translate(0, -UP - breath);
  limbSeg(ctx, 0.6, -32, 0.8, -28.2, B.neck, B.neck, skin);
  const bulky = o.style === 'armor' || o.style === 'space';
  const bw = (bulky ? 1.2 : 0) + (B.chest - 6.9) * 0.4;
  const belly = B.belly;
  const tpath = () => {
    ctx.beginPath();
    ctx.moveTo(-3.6 - bw, -29.8);
    ctx.quadraticCurveTo(1, -30.6, 4.2 + bw, -29.2);
    ctx.quadraticCurveTo((R.female ? 6.8 : 5.8) + bw, -25, 4.6 + bw + belly * 0.6, -20.6);
    ctx.quadraticCurveTo(4.6 + belly * 2.2, -17.4, 5 + bw * 0.5 + belly * 0.8, -14.2);
    ctx.quadraticCurveTo(0, -13.4, -5 - bw * 0.5, -14.2);
    ctx.quadraticCurveTo(-5.2 - bw, -20, -4.6 - bw, -25);
    ctx.quadraticCurveTo(-4.6 - bw, -28.6, -3.6 - bw, -29.8);
    ctx.closePath();
  };
  celFill(ctx, o.top, tpath, 1.4, 1);
  ctx.save();
  tpath();
  ctx.clip();
  outfitSide(ctx, o);
  if (o.style !== 'dress' && o.style !== 'robe' && o.style !== 'coat') {
    ctx.fillStyle = o.bottom;
    ctx.fillRect(-10, -15.2, 20, 3);
  }
  ctx.restore();
  tails(ctx, R, true);
  ctx.save();
  headSpace(ctx, R);
  drawHeadSide(ctx, R);
  ctx.restore();
  if (armed && p.weapon) {
    drawArmed(ctx, R, armed, p.weapon, foreW, upperW, bare ? skin : sc, sc, hc);
    if (o.style === 'armor' || o.style === 'space') {
      celFill(ctx, shade(o.top, 0.1), () => {
        ctx.beginPath();
        ctx.ellipse(0.6, SH_Y - 0.4, 3.8, 3.2, 0, 0, Math.PI * 2);
      }, 0.7, 0.6);
    }
    ctx.restore();
    return;
  }
  limbSeg(ctx, j.elL[0], j.elL[1], j.haL[0], j.haL[1], foreW, foreW * 0.9, bare ? skin : sc);
  limbSeg(ctx, j.shL[0], j.shL[1], j.elL[0], j.elL[1], upperW, upperW * 0.9, sc);
  if (o.style === 'armor' || o.style === 'space') {
    celFill(ctx, shade(o.top, 0.1), () => {
      ctx.beginPath();
      ctx.ellipse(0.6, SH_Y - 0.4, 3.8, 3.2, 0, 0, Math.PI * 2);
    }, 0.7, 0.6);
  }
  hand(ctx, j.haL[0], j.haL[1], hc, 1, 0, B.limb);
  ctx.restore();
}

// ------------------------------------------------------------------ armed side view
interface Armed {
  prof: WeaponProfile;
  /** weapon origin (main hand) and rotation */
  origin: [number, number];
  angle: number;
  /** supporting hand, when the grip uses both hands */
  far: [number, number] | null;
  /** animation parameter for the weapon art */
  k: number;
  flash: number;
  /** melee: previous weapon angle for the motion trail */
  trail: number | null;
}

function ik(s0: [number, number], h: [number, number], l1: number, l2: number, bend: number): [number, number] {
  const dx = h[0] - s0[0];
  const dy = h[1] - s0[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.05);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 0.01))));
  const a = Math.atan2(dy, dx) + bend * Math.acos(c);
  return [s0[0] + Math.cos(a) * l1, s0[1] + Math.sin(a) * l1];
}

const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
const easeIn = (u: number) => u * u;
const easeIO = (u: number) => u * u * (3 - 2 * u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function rot(v: [number, number], a: number): [number, number] {
  const c = Math.cos(a);
  const s2 = Math.sin(a);
  return [v[0] * c - v[1] * s2, v[0] * s2 + v[1] * c];
}

/** Where the hands and the weapon are for the current grip and attack phase. */
function armedPose(p: Pose, j: Joints): Armed {
  const prof = weaponProfile(p.weapon!);
  const a = p.attack;
  const combat = !!p.aim;
  const S: [number, number] = [0.4, SH_Y];
  const withSupport = (o: [number, number], ang: number): [number, number] => {
    const v = rot(prof.support, ang);
    return [o[0] + v[0], o[1] + v[1]];
  };
  // recoil and flash for firearms
  const burst = prof.burst > 1 && prof.shot !== 'pellets';
  let rec = 0;
  let flash = 0;
  if (a !== undefined) {
    if (burst) {
      const on = a < 0.45;
      rec = on ? 0.35 + 0.25 * Math.abs(Math.sin(a * 40)) : 0;
      flash = on && Math.sin(a * 44) > 0.1 ? 1 : 0;
    } else if (prof.shot === 'flame') {
      rec = 0.1;
      flash = 1;
    } else {
      rec = a < 0.22 ? (1 - a / 0.22) ** 2 : 0;
      flash = a < 0.08 ? 1 - a / 0.08 : 0;
    }
  }
  switch (prof.grip) {
    case 'pistol': {
      if (!combat) {
        const o: [number, number] = [j.haL[0] + 1, j.haL[1] - 0.5];
        return { prof, origin: o, angle: 1.05, far: null, k: 0, flash: 0, trail: null };
      }
      const o: [number, number] = [12.4 - rec * 1.8, SH_Y + 2.6 - rec * 0.6];
      const ang = -rec * 0.32;
      return { prof, origin: o, angle: ang, far: withSupport(o, ang), k: a ?? 0, flash, trail: null };
    }
    case 'rifle': {
      if (!combat) {
        const o: [number, number] = [4.6, SH_Y + 7.4];
        const ang = 0.42;
        return { prof, origin: o, angle: ang, far: withSupport(o, ang), k: 0, flash: 0, trail: null };
      }
      const o: [number, number] = [5 - rec * 1.4, SH_Y + 3.2 - rec * 0.3];
      const ang = -rec * 0.12;
      return { prof, origin: o, angle: ang, far: withSupport(o, ang), k: a ?? 0, flash, trail: null };
    }
    case 'hip': {
      const shake = a !== undefined && prof.burst > 1 && a < 0.5 ? Math.sin(a * 90) * 0.35 : 0;
      const o: [number, number] = [3.4 - rec * 0.8, SH_Y + 9.6 + shake];
      const ang = combat ? -0.03 - rec * 0.04 : 0.18;
      return { prof, origin: o, angle: ang, far: withSupport(o, ang), k: a ?? 0, flash, trail: null };
    }
    case 'shoulder': {
      const o: [number, number] = [4.2 - rec * 1.6, SH_Y + 0.6];
      const ang = combat ? -0.05 - rec * 0.1 : 0.05;
      return { prof, origin: o, angle: ang, far: withSupport(o, ang), k: a ?? 0, flash, trail: null };
    }
    case 'sling': {
      const pull = a === undefined ? 0 : a < 0.7 ? easeOut(a / 0.7) : 0;
      const o: [number, number] = combat ? [11.5, SH_Y + 1.6] : [j.haL[0] + 0.5, j.haL[1]];
      // fork upright: weapon +x points up
      const ang = -Math.PI / 2;
      const pouch: [number, number] = [o[0] - 4 - pull * 5, o[1] - 6.8];
      return { prof, origin: o, angle: ang, far: combat ? pouch : null, k: pull, flash: 0, trail: null };
    }
    case 'guitar': {
      const strum = a === undefined ? 0 : Math.sin(a * Math.PI * 2) * (a < 0.5 ? 1 : 0.3);
      const o: [number, number] = [2.6, SH_Y + 11 - Math.abs(strum) * 0.6];
      const ang = -0.52 - strum * 0.08;
      const neck = rot([11, 0], ang);
      return { prof, origin: [o[0] + 0.4 * strum, o[1]], angle: ang, far: [o[0] + neck[0], o[1] + neck[1]], k: a ?? 0, flash: 0, trail: null };
    }
    case 'fist': {
      // boxing guard and a quick jab
      let hx = 8.4;
      let hy = SH_Y + 4.6;
      if (a !== undefined) {
        if (a < 0.16) {
          const u = easeOut(a / 0.16);
          hx = lerp(8.4, 14.6, u);
          hy = lerp(SH_Y + 4.6, SH_Y + 2.2, u);
        } else if (a < 0.5) {
          const u = easeIO((a - 0.16) / 0.34);
          hx = lerp(14.6, 8.4, u);
          hy = lerp(SH_Y + 2.2, SH_Y + 4.6, u);
        }
      }
      return { prof, origin: [hx, hy], angle: 0, far: [6.8, SH_Y + 2.4], k: a ?? 0, flash: 0, trail: null };
    }
    case 'blade': {
      // quick stab
      let hx = 8.6;
      let hy = SH_Y + 5.4;
      let ang = -0.35;
      if (!combat) {
        return { prof, origin: [j.haL[0] + 0.6, j.haL[1]], angle: 1.25, far: null, k: 0, flash: 0, trail: null };
      }
      if (a !== undefined) {
        if (a < 0.3) {
          const u = easeOut(a / 0.3);
          hx = lerp(8.6, 3.2, u);
          hy = lerp(SH_Y + 5.4, SH_Y + 3.6, u);
          ang = lerp(-0.35, -0.6, u);
        } else if (a < 0.44) {
          const u = easeIn((a - 0.3) / 0.14);
          hx = lerp(3.2, 13.6, u);
          hy = lerp(SH_Y + 3.6, SH_Y + 2.2, u);
          ang = lerp(-0.6, -0.08, u);
        } else {
          const u = easeIO((a - 0.44) / 0.56);
          hx = lerp(13.6, 8.6, u);
          hy = lerp(SH_Y + 2.2, SH_Y + 5.4, u);
          ang = lerp(-0.08, -0.35, u);
        }
      }
      return { prof, origin: [hx, hy], angle: ang, far: null, k: a ?? 0, flash: 0, trail: null };
    }
    default: {
      // melee1 / melee2: overhead swing driven by the arm angle
      const two = prof.grip === 'melee2';
      const R = 12.4;
      if (!combat) {
        if (two) return { prof, origin: [4.2, SH_Y + 6.6], angle: -2.35, far: null, k: 0, flash: 0, trail: null };
        return { prof, origin: [j.haL[0] + 0.6, j.haL[1]], angle: 1.3, far: null, k: 0, flash: 0, trail: null };
      }
      const REST = two ? 0.85 : 1.0;
      const REST_W = two ? -1.1 : -0.9;
      const UP_T = two ? -2.1 : -2.3;
      const UP_W = two ? -2.8 : -2.9;
      const HIT_T = two ? 0.35 : 0.55;
      const HIT_W = two ? 0.15 : 0.35;
      let th = REST;
      let wa = REST_W;
      let trail: number | null = null;
      if (a !== undefined) {
        if (a < 0.38) {
          const u = easeOut(a / 0.38);
          th = lerp(REST, UP_T, u);
          wa = lerp(REST_W, UP_W, u);
        } else if (a < 0.52) {
          const u = easeIn((a - 0.38) / 0.14);
          th = lerp(UP_T, HIT_T, u);
          wa = lerp(UP_W, HIT_W, u);
          trail = UP_W;
        } else {
          const u = easeIO((a - 0.52) / 0.48);
          th = lerp(HIT_T, REST, u);
          wa = lerp(HIT_W, REST_W, u);
          if (u < 0.35) trail = lerp(UP_W, HIT_W, 0.6 + u);
        }
      }
      const h: [number, number] = [S[0] + Math.cos(th) * R, S[1] + Math.sin(th) * R];
      const far = two ? ((): [number, number] => {
        const v = rot([-2.6, 0], wa);
        return [h[0] + v[0], h[1] + v[1]];
      })() : null;
      return { prof, origin: h, angle: wa, far, k: a ?? 0, flash: 0, trail };
    }
  }
}

function drawArmed(ctx: Ctx, R: Rig, A: Armed, w: WeaponDef, foreW: number, upperW: number, foreC: string, upperC: string, hc: string) {
  const { B } = R;
  const now = performance.now() / 1000;
  // motion trail of a swing
  if (A.trail !== null) {
    const reach = A.prof.muzzle[0];
    ctx.save();
    ctx.translate(A.origin[0], A.origin[1]);
    ctx.globalCompositeOperation = 'lighter';
    const a0 = Math.min(A.trail, A.angle);
    const a1 = Math.max(A.trail, A.angle);
    const g = ctx.createRadialGradient(0, 0, reach * 0.4, 0, 0, reach + 2);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba(w.glow ?? '#ffffff', 0.45));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, reach + 2, a0, a1);
    ctx.arc(0, 0, reach * 0.45, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(A.origin[0], A.origin[1]);
  ctx.rotate(A.angle);
  A.prof.draw(ctx, w, now, A.k);
  if (A.flash > 0) muzzleFlash(ctx, w, A.prof.muzzle[0], A.prof.muzzle[1], A.flash);
  ctx.restore();
  // main arm and hand on the grip
  const sh: [number, number] = [0.4, SH_Y];
  const hnd = A.origin;
  const el = ik(sh, hnd, UPPER * 1.05, FORE * 1.05, 1);
  limbSeg(ctx, el[0], el[1], hnd[0], hnd[1], foreW, foreW * 0.9, foreC);
  limbSeg(ctx, sh[0], sh[1], el[0], el[1], upperW, upperW * 0.9, upperC);
  hand(ctx, hnd[0], hnd[1], hc, 1, 1.4, B.limb);
}

/** Muzzle position relative to the feet for a dweller aiming this weapon (facing +x). */
export function muzzlePoint(w: WeaponDef, child = false): [number, number] {
  const p = { ...DEFAULT_POSE, view: 'side' as const, aim: true, weapon: w };
  const A = armedPose(p, sideJoints(p));
  const m = rot(A.prof.muzzle, A.angle);
  const s = 0.9 * (child ? 0.64 : 1);
  return [(A.origin[0] + m[0]) * s, (A.origin[1] + m[1] - UP) * s];
}

function drawHeadSide(ctx: Ctx, R: Rig) {
  const { o, p, skin, dna } = R;
  const t = tones(skin);
  const hx = 0.8;
  const S = shapeOf(R);
  const noseOut = R.child ? 1.2 : [1.4, 2.2, 2.0, 3.0, 1.5][dna.nose];
  const noseLow = R.child ? 0 : [0, 0.3, 0.2, 1.1, -0.2][dna.nose];
  const chinOut = (S.chinW - 2.4) * 0.25 + (R.child ? -0.6 : 0);
  const chinY = S.chin + 0.2;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(hx - HR + 0.6, HY);
    ctx.bezierCurveTo(hx - HR, HY - HR * 1.3, hx + HR + 0.6, HY - HR * 1.25, hx + HR - 0.2, HY - 1.4);
    ctx.quadraticCurveTo(hx + HR + 0.6, HY + 0.4, hx + HR + 0.2, HY + 1.2);
    // nose
    if (dna.nose === 4 && !R.child) {
      ctx.quadraticCurveTo(hx + HR + noseOut + 0.4, HY + 2.2, hx + HR + noseOut, HY + 3.0);
      ctx.quadraticCurveTo(hx + HR + 0.8, HY + 3.4, hx + HR + 0.4, HY + 3.6);
    } else {
      ctx.quadraticCurveTo(hx + HR + noseOut, HY + 2.4 + noseLow, hx + HR + noseOut * 0.35, HY + 3.4 + noseLow);
    }
    ctx.quadraticCurveTo(hx + HR + 0.7, HY + 5.2, hx + HR - 0.3, HY + 5.9);
    ctx.quadraticCurveTo(hx + HR + 0.3 + chinOut, HY + chinY - 1.2, hx + HR - 1.2 + chinOut, HY + chinY);
    ctx.quadraticCurveTo(hx + 2.6, HY + chinY + 0.8, hx - 1.4, HY + HR + (S.jawY - 6) * 0.3);
    ctx.quadraticCurveTo(hx - HR, HY + 5, hx - HR + 0.6, HY);
    ctx.closePath();
  };
  celFill(ctx, skin, path, -1.4, 1.4, true, skinShadow(skin));
  const hide = hatHidesHair(o);
  const h = HAIRS[R.look.hair % HAIRS.length];
  const longHair = !hide && h.len >= 2 && !h.sides;
  if (!longHair) earSide(ctx, skin, hx);
  // eye
  const E = eyeDims(R);
  const ex = hx + 4.3;
  const ey = HY + 0.6 + (R.child ? 0.8 : 0);
  if (p.eyes === 'x' || p.blink || p.eyes === 'closed') {
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 1.3, ey);
    ctx.quadraticCurveTo(ex, ey + (p.eyes === 'x' ? -1.2 : 0.8), ex + 1.3, ey);
    ctx.stroke();
    ctx.lineCap = 'butt';
  } else {
    const ry = E.ry * (p.eyes === 'wide' ? 1.15 : 1);
    ctx.beginPath();
    ctx.moveTo(ex - 1.1, ey - ry * 0.9);
    ctx.quadraticCurveTo(ex + 1.2, ey - ry, ex + 1.6, ey);
    ctx.quadraticCurveTo(ex + 1.1, ey + ry * 0.9, ex - 1.1, ey + ry * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#fbf8f1';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const iris = EYE_COLORS[R.look.face % EYE_COLORS.length];
    dot(ctx, ex + 0.7, ey + 0.1, Math.min(ry, 1.4), iris);
    dot(ctx, ex + 0.9, ey + 0.1, Math.min(ry, 1.4) * 0.5, '#0e0a08');
    if (E.lid > 0 && p.eyes !== 'wide') {
      ctx.fillStyle = t.base;
      ctx.fillRect(ex - 2, ey - ry - 1, 4, ry * 2 * E.lid + 1);
    }
    ctx.restore();
    dot(ctx, ex + 1.1, ey - 0.5, 0.35, '#ffffff');
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = R.female ? 0.8 : 0.65;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 1.1, ey - ry * 0.9);
    ctx.quadraticCurveTo(ex + 1.2, ey - ry, ex + 1.6, ey);
    if (R.female && !R.child) {
      ctx.moveTo(ex + 1.2, ey - ry * 0.7);
      ctx.lineTo(ex + 2.2, ey - ry - 0.4);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  // brow
  const th = (R.female ? 0.7 : 1) * [0.7, 1.2, 1.5, 1.05][dna.brows];
  const bLift = (p.eyes === 'wide' ? 0.8 : 0) + (p.mouth === 'sad' ? -0.3 : 0);
  ctx.strokeStyle = browColor(R);
  ctx.lineWidth = th;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex - 1.6, ey - E.ry - 1.4 - bLift);
  ctx.quadraticCurveTo(ex + 0.2, ey - E.ry - 2.3 - bLift, ex + 1.9, ey - E.ry - 1.5 - bLift + (p.mouth === 'sad' ? 0.6 : 0));
  ctx.stroke();
  ctx.lineCap = 'butt';
  // cheek & marks
  ctx.fillStyle = rgba('#ff6a6a', dna.mark === 4 || R.child ? 0.32 : R.female ? 0.22 : 0.1);
  ctx.beginPath();
  ctx.ellipse(hx + 3.4, HY + 3.8, 1.7, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  if (dna.mark === 1) for (const [dx, dy] of [[2.6, 2.6], [3.6, 3.2], [4.2, 2.4], [5.4, 2.8]]) dot(ctx, hx + dx, HY + dy, 0.26, rgba(mix(skin, '#7a3a1a', 0.6), 0.7));
  if (dna.age >= 3 && !R.child) {
    ctx.strokeStyle = rgba(t.line, 0.3);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(ex + 1.8, ey - 0.2);
    ctx.lineTo(ex + 2.8, ey - 0.6);
    ctx.moveTo(hx + HR - 1.6, HY + 3.6);
    ctx.quadraticCurveTo(hx + HR - 2.4, HY + 5, hx + HR - 1.8, HY + 6.4);
    ctx.stroke();
  }
  // mouth
  const mx = hx + HR - 0.9;
  const my = HY + 5.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = R.female ? (dna.lips ? LIP_COLORS[dna.lips] : mix(skin, '#c9505a', 0.6)) : mix(skin, '#3a1410', 0.7);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  if (p.mouth === 'open' || p.mouth === 'grin') {
    ctx.ellipse(mx, my, 0.9, p.mouth === 'grin' ? 1 : 1.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5a1a14';
    ctx.fill();
  } else if (p.mouth === 'sad') {
    ctx.moveTo(mx - 1.6, my + 0.5);
    ctx.quadraticCurveTo(mx - 0.8, my - 0.4, mx, my + 0.3);
    ctx.stroke();
  } else {
    ctx.moveTo(mx - 1.8, my - (p.mouth === 'happy' ? 0.6 : 0));
    ctx.quadraticCurveTo(mx - 0.8, my + (p.mouth === 'happy' ? 0.7 : 0.2), mx, my);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  if (o.hat === 'helmet' && o.style === 'space') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(hx + 1, HY - 0.2, HR + 2.4, 0, Math.PI * 2);
    ctx.clip();
    if (R.look.beard) beardSide(ctx, R, hx, chinY, chinOut);
    hairSide(ctx, R, hx);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(hx + 1, HY - 0.2, HR + 3, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#cfefff', 0.2);
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgba('#f4f6f8', 0.95);
    ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.beginPath();
    ctx.ellipse(hx + 5, HY - 5, 1.4, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (!hide) {
    hairSide(ctx, R, hx);
    if (!longHair && !h.bald) earSide(ctx, skin, hx);
  }
  if (R.look.beard) beardSide(ctx, R, hx, chinY, chinOut);
  if (R.look.glasses) {
    ctx.strokeStyle = '#2a2320';
    ctx.lineWidth = 0.7;
    ctx.fillStyle = dna.glasses === 2 ? rgba('#1a2230', 0.88) : rgba('#dff4ff', 0.22);
    ctx.beginPath();
    if (dna.glasses === 1) rr(ctx, ex - 1.6, ey - 1.8, 3.8, 3.6, 0.8);
    else ctx.ellipse(ex + 0.4, ey, 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex - 1.6, ey - 0.4);
    ctx.lineTo(hx - 1.4, HY - 0.2);
    ctx.stroke();
  }
  if (dna.mark === 5 && !R.child) {
    ctx.strokeStyle = '#1a1614';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(hx - HR + 1, HY - 3.4);
    ctx.lineTo(ex, ey - 0.6);
    ctx.stroke();
  }
  drawHatSide(ctx, o, hx);
}

function earSide(ctx: Ctx, skin: string, hx: number) {
  const t = tones(skin);
  ctx.beginPath();
  ctx.ellipse(hx - 1.4, HY + 1, 1.8, 2.4, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(hx - 1.3, HY + 1.1, 0.8, 1.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = t.dark;
  ctx.fill();
}

function hairSide(ctx: Ctx, R: Rig, hx: number) {
  const h = HAIRS[R.look.hair % HAIRS.length];
  const hair = R.hair;
  if (h.bald === 'full') {
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.beginPath();
    ctx.ellipse(hx + 1, HY - HR + 1.8, 2.8, 1, 0.1, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.bald === 'crown') {
    hairFill(ctx, hair, () => {
      ctx.beginPath();
      ctx.ellipse(hx - 3.8, HY - 0.6, 3.4, 4.4, 0.2, 0, Math.PI * 2);
    });
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.beginPath();
    ctx.ellipse(hx + 1, HY - HR + 1.8, 2.8, 1, 0.1, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (h.sides === 'shaved') {
    ctx.fillStyle = rgba(hair, 0.3);
    ctx.beginPath();
    ctx.moveTo(hx - HR + 0.4, HY);
    ctx.bezierCurveTo(hx - HR, HY - HR - 1.2, hx + HR, HY - HR - 1.2, hx + HR - 1, HY - 2.4);
    ctx.quadraticCurveTo(hx, HY - 4.2, hx - HR + 0.4, HY);
    ctx.closePath();
    ctx.fill();
    if (h.extra === 'mohawk') {
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(hx - 6, HY - HR + 1);
        ctx.lineTo(hx - 4, HY - HR - 5);
        ctx.lineTo(hx - 1.6, HY - HR - 3.6);
        ctx.lineTo(hx + 0.6, HY - HR - 7);
        ctx.lineTo(hx + 2.4, HY - HR - 3.4);
        ctx.lineTo(hx + 4.4, HY - HR - 5.4);
        ctx.lineTo(hx + 5, HY - HR + 1);
        ctx.closePath();
      });
    } else {
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.ellipse(hx - 0.6, HY - HR + 1.2, HR * 0.8, 2.6, 0.05, Math.PI, 0);
        ctx.closePath();
      });
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.arc(hx - 1.6, HY - HR - 2, 2.5, 0, Math.PI * 2);
      });
    }
    return;
  }
  const vol = h.vol;
  const long = h.len >= 2;
  const nape = h.len >= 4 ? HY + 15 : h.len === 3 ? HY + 11 : h.len === 2 ? HY + 6.4 : HY + 4.8;
  if (h.curly) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI * 0.95 + (i / 9) * Math.PI * 1.05;
      pts.push([hx - 1 + Math.cos(a) * (HR + 0.4 + (h.sides === 'puffy' ? 2.6 : 0)), HY - 1.6 + Math.sin(a) * (HR + 0.4 + vol * 0.7)]);
    }
    pts.push([hx + HR - 0.6, HY - 2.4], [hx + 2.6, HY - 2.4], [hx + 0.4, HY + 1.4], [hx - 1.4, nape - 1], [hx - HR, nape - 1.5]);
    curlyFill(ctx, hair, pts, 1.9 + vol * 0.12);
    return;
  }
  const fr = h.fringe;
  const frontX = fr === 'quiff' ? hx + HR + 3 : fr === 'bangs' || fr === 'bowl' ? hx + HR + 0.6 : hx + HR + 0.5;
  const frontY = fr === 'bangs' || fr === 'bowl' ? HY - 0.8 : fr === 'quiff' ? HY - HR - 0.6 : HY - 2.3;
  hairFill(ctx, h.len === 0 ? shade(hair, -0.06) : hair, () => {
    ctx.beginPath();
    ctx.moveTo(hx - HR + (long ? -1.4 : 0.4), nape);
    ctx.bezierCurveTo(hx - HR - 1.8 - vol * 0.2, HY - 2, hx - HR * 0.7, HY - HR - 2.2 - vol, hx + 1.2, HY - HR - 1.6 - vol);
    if (fr === 'spiky') {
      ctx.lineTo(hx + 2.4, HY - HR - 4.4 - vol);
      ctx.lineTo(hx + 3.6, HY - HR - 1.8 - vol * 0.6);
      ctx.lineTo(hx + 5.6, HY - HR - 3.6 - vol * 0.6);
      ctx.lineTo(hx + 6, HY - HR - 0.4);
      ctx.lineTo(hx + HR + 1.6, HY - HR + 0.4);
      ctx.lineTo(hx + HR + 0.3, HY - 2.3);
    } else if (fr === 'quiff') {
      ctx.bezierCurveTo(hx + HR * 0.6, HY - HR - 5.4 - vol * 0.4, frontX + 1.2, HY - HR - 3.6, frontX, frontY);
      ctx.quadraticCurveTo(hx + HR - 0.4, HY - HR + 1.4, hx + HR + 0.2, HY - 2.6);
    } else {
      ctx.bezierCurveTo(hx + HR * 0.85, HY - HR - 1.2 - vol * 0.7, hx + HR + 1.4, HY - 4.4 - vol * 0.3, frontX, frontY);
    }
    if (fr === 'bangs' || fr === 'bowl') {
      ctx.lineTo(hx + HR - 1.8, HY - 0.6);
      ctx.quadraticCurveTo(hx + 2.4, HY - 2.2, hx + 0.9, HY - 1.2);
    } else {
      ctx.quadraticCurveTo(hx + HR - 0.8, HY - 2.9, hx + 4.2, HY - 3.5);
      ctx.quadraticCurveTo(hx + 1.8, HY - 3.2, hx + 0.9, HY - 1.6);
    }
    ctx.lineTo(hx + 0.7, HY + (long ? 5 : 2.2));
    ctx.lineTo(hx - 0.5, HY + (long ? 5.6 : 2.6));
    ctx.quadraticCurveTo(hx - 3, nape - 0.4, hx - HR + (long ? 1.6 : 2.4), nape + 0.2);
    ctx.closePath();
  });
  strands(ctx, hair, [
    [hx + 2.6, HY - HR - 0.6 - vol * 0.8, hx - 2.6, HY - HR + 0.4, hx - HR + 0.8, HY - 0.6],
    [hx + 5.2, HY - HR + 1.2 - vol * 0.5, hx + 1, HY - 4.6, hx - 3.2, HY + 1.4],
  ]);
  sheen(ctx, hair, hx + 0.8, HY - HR + 0.6 - vol * 0.6, 4.2, 0.1);
  if (h.extra === 'pigtails') {
    hairFill(ctx, shade(hair, -0.04), () => {
      ctx.beginPath();
      ctx.moveTo(hx - 2.4, HY - 1);
      ctx.bezierCurveTo(hx - 6, HY + 1, hx - 5.6, HY + 8, hx - 3.4, HY + 11);
      ctx.quadraticCurveTo(hx - 2.8, HY + 5, hx - 0.8, HY + 1);
      ctx.closePath();
    });
    dot(ctx, hx - 2.2, HY - 0.2, 1.2, '#e0405a');
  }
  if (h.extra === 'braid') {
    for (let i = 0; i < 6; i++) {
      hairFill(ctx, i % 2 ? hair : shade(hair, -0.08), () => {
        ctx.beginPath();
        ctx.ellipse(hx - HR + 0.4 - i * 0.2, HY + 2 + i * 2.3, 1.6, 1.3, -0.3, 0, Math.PI * 2);
      });
    }
  }
}

function beardSide(ctx: Ctx, R: Rig, hx: number, chinY: number, chinOut: number) {
  const kind = R.look.beard;
  const c = beardColor(R);
  if (kind === 1 || kind === 6 || kind === 7) {
    const bush = kind === 6 ? 2.4 : 0;
    const thin = kind === 7;
    hairFill(ctx, c, () => {
      ctx.beginPath();
      ctx.moveTo(hx + 0.4, HY + 1.6);
      ctx.quadraticCurveTo(hx - 0.2, HY + HR + 0.6 + bush, hx + 3.8, HY + chinY + 1.8 + bush);
      ctx.quadraticCurveTo(hx + HR + 0.6 + chinOut + bush * 0.4, HY + chinY + 1.6 + bush, hx + HR + 0.4 + chinOut, HY + 5.6);
      if (thin) {
        ctx.quadraticCurveTo(hx + HR - 1, HY + chinY - 0.6, hx + 3.6, HY + chinY - 0.2);
        ctx.quadraticCurveTo(hx + 1.2, HY + 5, hx + 1.6, HY + 1.6);
      } else {
        ctx.quadraticCurveTo(hx + HR + 1.2, HY + 4.2, hx + HR + 0.2, HY + 3.9);
        ctx.quadraticCurveTo(hx + HR - 2.2, HY + 3.6, hx + HR - 2.6, HY + 5.4);
        ctx.quadraticCurveTo(hx + 3.4, HY + 3.4, hx + 1.6, HY + 1.6);
      }
      ctx.closePath();
    });
    if (!thin) {
      ctx.fillStyle = '#6a2a22';
      ctx.beginPath();
      ctx.ellipse(hx + HR - 1, HY + 5.4, 0.9, 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 2 || kind === 3 || kind === 5) {
    hairFill(ctx, c, () => {
      ctx.beginPath();
      ctx.moveTo(hx + HR + 0.8, HY + 3.8);
      ctx.quadraticCurveTo(hx + HR - 1.2, HY + 3.4, hx + HR - 2.6 - (kind === 5 ? 1 : 0), HY + 5.4 - (kind === 5 ? 1.6 : 0));
      ctx.quadraticCurveTo(hx + HR - 1.2, HY + 4.9, hx + HR + 0.6, HY + 4.9);
      ctx.closePath();
    });
    if (kind === 3) {
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx + HR - 1.6, HY + 6.6);
        ctx.quadraticCurveTo(hx + HR + 0.2, HY + 6.8, hx + HR - 0.2, HY + 9.8);
        ctx.quadraticCurveTo(hx + HR - 2.2, HY + 9.6, hx + HR - 2.4, HY + 7.4);
        ctx.closePath();
      });
    }
  } else {
    ctx.fillStyle = rgba(c, 0.26);
    ctx.beginPath();
    ctx.moveTo(hx + 0.2, HY + 2.4);
    ctx.quadraticCurveTo(hx, HY + HR, hx + 3.8, HY + HR + 0.6);
    ctx.quadraticCurveTo(hx + HR, HY + HR, hx + HR - 0.4, HY + 6);
    ctx.quadraticCurveTo(hx + 3.4, HY + 4.4, hx + 0.2, HY + 2.4);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ outfit details
function outfitFront(ctx: Ctx, o: OutfitDef, f: number, female: boolean, skin: string) {
  const acc = o.accent;
  switch (o.style) {
    case 'jumpsuit': {
      // zipper & piping
      ctx.fillStyle = acc;
      ctx.fillRect(-0.6 + f * 0.3, -29.8, 1.2, 16);
      ctx.fillStyle = shade(acc, -0.3);
      ctx.fillRect(-0.2 + f * 0.3, -29.8, 0.4, 16);
      // collar
      ctx.beginPath();
      ctx.moveTo(-3.8, -30);
      ctx.lineTo(0 + f * 0.3, -26.2);
      ctx.lineTo(3.8, -30);
      ctx.lineTo(4.8, -27.8);
      ctx.lineTo(0 + f * 0.3, -24.6);
      ctx.lineTo(-4.8, -27.8);
      ctx.closePath();
      ctx.fillStyle = acc;
      ctx.fill();
      // chest patch (AtomHome logo)
      const px = 3.6 * f;
      ctx.beginPath();
      ctx.arc(px, -23.4, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = acc;
      ctx.fill();
      ctx.strokeStyle = shade(o.top, -0.4);
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.ellipse(px, -23.4, 1.3, 0.5, 0.6, 0, Math.PI * 2);
      ctx.ellipse(px, -23.4, 1.3, 0.5, -0.6, 0, Math.PI * 2);
      ctx.stroke();
      // belt
      belt(ctx, shade(o.bottom, -0.4), acc);
      break;
    }
    case 'coat':
    case 'robe': {
      // shirt & tie visible in the opening
      ctx.fillStyle = o.style === 'robe' ? shade(o.top, -0.2) : '#f2f0ea';
      ctx.beginPath();
      ctx.moveTo(-3.2, -30);
      ctx.lineTo(3.2, -30);
      ctx.lineTo(1.4, -14);
      ctx.lineTo(-1.4, -14);
      ctx.fill();
      if (o.style === 'coat') {
        ctx.fillStyle = acc;
        ctx.beginPath();
        ctx.moveTo(-0.7, -28.8);
        ctx.lineTo(0.7, -28.8);
        ctx.lineTo(1, -20);
        ctx.lineTo(0, -18.6);
        ctx.lineTo(-1, -20);
        ctx.fill();
      } else {
        ctx.fillStyle = acc;
        ctx.fillRect(-8, -19, 16, 1.6);
      }
      // lapels
      ctx.fillStyle = shade(o.top, -0.1);
      ctx.beginPath();
      ctx.moveTo(-3.2, -30);
      ctx.lineTo(-5.4, -28);
      ctx.lineTo(-1.6, -20);
      ctx.closePath();
      ctx.moveTo(3.2, -30);
      ctx.lineTo(5.4, -28);
      ctx.lineTo(1.6, -20);
      ctx.closePath();
      ctx.fill();
      // pocket with pens
      ctx.fillStyle = rgba('#000', 0.14);
      ctx.fillRect(-6.4 * -f - 1.4, -24.4, 3.4, 2.6);
      ctx.fillStyle = '#3f6fa5';
      ctx.fillRect(-6.4 * -f - 0.8, -25.6, 0.7, 1.8);
      ctx.fillStyle = '#c7433b';
      ctx.fillRect(-6.4 * -f + 0.2, -25.4, 0.7, 1.6);
      break;
    }
    case 'suit': {
      ctx.fillStyle = '#f4f4f0';
      ctx.beginPath();
      ctx.moveTo(-3.2, -30);
      ctx.lineTo(3.2, -30);
      ctx.lineTo(0, -20.5);
      ctx.fill();
      ctx.fillStyle = acc === '#f4f4f4' ? '#16181c' : acc;
      ctx.beginPath();
      ctx.moveTo(-1, -29.2);
      ctx.lineTo(1, -29.2);
      ctx.lineTo(0.8, -22.8);
      ctx.lineTo(0, -21.4);
      ctx.lineTo(-0.8, -22.8);
      ctx.fill();
      ctx.fillStyle = shade(o.top, 0.12);
      ctx.beginPath();
      ctx.moveTo(-3.2, -30);
      ctx.lineTo(-5.2, -28.4);
      ctx.lineTo(-0.6, -19.8);
      ctx.closePath();
      ctx.moveTo(3.2, -30);
      ctx.lineTo(5.2, -28.4);
      ctx.lineTo(0.6, -19.8);
      ctx.closePath();
      ctx.fill();
      dot(ctx, 0, -18.2, 0.5, shade(o.top, 0.35));
      dot(ctx, 0, -16.2, 0.5, shade(o.top, 0.35));
      ctx.fillStyle = '#f4f4f0';
      ctx.beginPath();
      ctx.moveTo(4.2 * f, -24.6);
      ctx.lineTo(6.4 * f, -24.6);
      ctx.lineTo(5.2 * f, -23);
      ctx.fill();
      break;
    }
    case 'dress': {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-4, -30.2);
      ctx.quadraticCurveTo(0, -25.4, 4, -30.2);
      ctx.fill();
      ctx.fillStyle = acc;
      ctx.fillRect(-8, -19.6, 16, 1.3);
      ctx.beginPath();
      ctx.arc(2.4 * f, -19, 1.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'armor': {
      ctx.fillStyle = shade(o.top, 0.15);
      rr(ctx, -6.6, -28.4, 13.2, 8, 2.4);
      ctx.fill();
      ctx.strokeStyle = shade(o.top, -0.45);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = acc;
      ctx.fillRect(-7.4, -19.4, 14.8, 1.1);
      for (const px of [-4.4, -1.2, 2]) {
        ctx.fillStyle = shade(o.bottom, -0.15);
        rr(ctx, px, -17.6, 2.8, 2.8, 0.6);
        ctx.fill();
      }
      break;
    }
    case 'space': {
      ctx.fillStyle = acc;
      ctx.fillRect(-9, -21.4, 18, 1.6);
      ctx.fillStyle = shade(o.top, -0.12);
      rr(ctx, -3.4, -27.6, 6.8, 4.8, 1.2);
      ctx.fill();
      dot(ctx, -1.8, -25.2, 0.7, '#5fd3ff');
      dot(ctx, 0, -25.2, 0.7, '#ffcf4a');
      dot(ctx, 1.8, -25.2, 0.7, '#ff5a4a');
      break;
    }
    case 'sport': {
      ctx.fillStyle = acc;
      ctx.fillRect(-0.5, -30, 1, 16);
      ctx.fillRect(-9, -26, 2.2, 12);
      ctx.fillRect(6.8, -26, 2.2, 12);
      ctx.fillStyle = shade(acc, -0.2);
      ctx.beginPath();
      ctx.moveTo(-3.4, -30);
      ctx.lineTo(0, -28);
      ctx.lineTo(3.4, -30);
      ctx.lineTo(3.4, -28.6);
      ctx.lineTo(0, -26.6);
      ctx.lineTo(-3.4, -28.6);
      ctx.fill();
      break;
    }
    case 'overalls': {
      // shirt top
      ctx.fillStyle = sleeveColor(o);
      ctx.fillRect(-10, -31, 20, 7.4);
      ctx.fillStyle = shade(sleeveColor(o), -0.2);
      ctx.fillRect(-10, -24.2, 20, 0.6);
      // bib
      ctx.fillStyle = o.top;
      rr(ctx, -4.6, -25.4, 9.2, 12, 1.2);
      ctx.fill();
      ctx.strokeStyle = shade(o.top, -0.4);
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.fillStyle = o.top;
      ctx.fillRect(-5.6, -31, 1.8, 6.2);
      ctx.fillRect(3.8, -31, 1.8, 6.2);
      dot(ctx, -4.2, -25, 0.7, acc);
      dot(ctx, 4.2, -25, 0.7, acc);
      ctx.fillStyle = shade(o.top, -0.22);
      rr(ctx, -2.2, -21.8, 4.4, 3, 0.6);
      ctx.fill();
      break;
    }
    case 'casual': {
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.ellipse(0, -30, 3.8, 1.8, 0, 0, Math.PI);
      ctx.fill();
      // graphic on the shirt
      ctx.beginPath();
      ctx.arc(0.6 * f, -22.6, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(acc, 0.85);
      ctx.fill();
      ctx.fillStyle = rgba(o.top, 0.9);
      ctx.beginPath();
      ctx.arc(0.6 * f, -22.6, 1.1, 0, Math.PI * 2);
      ctx.fill();
      belt(ctx, shade(o.bottom, -0.25), '#c9ced2');
      break;
    }
    case 'ninja': {
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.moveTo(-9, -18.4);
      ctx.lineTo(9, -19.6);
      ctx.lineTo(9, -17.4);
      ctx.lineTo(-9, -16.2);
      ctx.fill();
      ctx.strokeStyle = shade(o.top, 0.2);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-4, -30);
      ctx.lineTo(2, -19);
      ctx.moveTo(4, -30);
      ctx.lineTo(-2, -19);
      ctx.stroke();
      break;
    }
  }
}

function outfitBack(ctx: Ctx, o: OutfitDef, skin: string) {
  const sc = sleeveColor(o);
  const acc = o.accent;
  switch (o.style) {
    case 'jumpsuit': {
      // shoulder yoke and the vault number, like a team jersey
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.moveTo(-10, -27.4);
      ctx.quadraticCurveTo(0, -25.6, 10, -27.4);
      ctx.lineTo(10, -26.3);
      ctx.quadraticCurveTo(0, -24.5, -10, -26.3);
      ctx.fill();
      if (vaultLabel) {
        ctx.font = '700 5.6px Oswald, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = shade(o.top, -0.45);
        ctx.strokeText(vaultLabel, 0, -21.2);
        ctx.fillStyle = acc;
        ctx.fillText(vaultLabel, 0, -21.2);
      }
      belt(ctx, shade(o.bottom, -0.4), shade(o.bottom, -0.4));
      break;
    }
    case 'coat':
    case 'suit':
      ctx.strokeStyle = rgba(tones(o.top).dark, 0.9);
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -29.5);
      ctx.lineTo(0, -13);
      ctx.stroke();
      ctx.fillStyle = shade(o.top, -0.12);
      ctx.fillRect(-4.2, -18.6, 8.4, 1.4);
      dot(ctx, -3.4, -17.9, 0.45, shade(o.top, 0.3));
      dot(ctx, 3.4, -17.9, 0.45, shade(o.top, 0.3));
      break;
    case 'robe':
      ctx.fillStyle = acc;
      ctx.fillRect(-8, -19, 16, 1.6);
      break;
    case 'dress':
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-3.6, -30.2);
      ctx.quadraticCurveTo(0, -27.2, 3.6, -30.2);
      ctx.fill();
      ctx.strokeStyle = rgba(tones(o.top).line, 0.6);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -28.4);
      ctx.lineTo(0, -19.6);
      ctx.stroke();
      ctx.fillStyle = acc;
      ctx.fillRect(-8, -19.6, 16, 1.3);
      // bow
      ctx.beginPath();
      ctx.ellipse(-1.6, -19, 1.6, 1.1, 0.3, 0, Math.PI * 2);
      ctx.ellipse(1.6, -19, 1.6, 1.1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'armor':
      ctx.fillStyle = shade(o.top, 0.12);
      rr(ctx, -6, -28.6, 12, 9.4, 2.4);
      ctx.fill();
      ctx.strokeStyle = shade(o.top, -0.45);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = shade(o.top, -0.35);
      for (let i = 0; i < 3; i++) ctx.fillRect(-3.4, -26.4 + i * 2, 6.8, 0.8);
      ctx.fillStyle = acc;
      ctx.fillRect(-7.4, -18.4, 14.8, 1.1);
      break;
    case 'space':
      ctx.fillStyle = acc;
      ctx.fillRect(-9, -21.4, 18, 1.6);
      break;
    case 'sport':
      ctx.fillStyle = acc;
      ctx.fillRect(-9, -26, 2.2, 12);
      ctx.fillRect(6.8, -26, 2.2, 12);
      ctx.font = '700 6px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('7', 0, -22);
      break;
    case 'overalls': {
      ctx.fillStyle = sc;
      ctx.fillRect(-10, -31, 20, 12);
      ctx.fillStyle = o.top;
      ctx.beginPath();
      ctx.moveTo(-5.6, -31);
      ctx.lineTo(-3.6, -31);
      ctx.lineTo(5.6, -19);
      ctx.lineTo(3.6, -19);
      ctx.closePath();
      ctx.moveTo(5.6, -31);
      ctx.lineTo(3.6, -31);
      ctx.lineTo(-5.6, -19);
      ctx.lineTo(-3.6, -19);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-10, -19.4, 20, 8);
      ctx.fillStyle = shade(o.top, -0.22);
      rr(ctx, -5.8, -17.6, 4, 3.4, 0.6);
      ctx.fill();
      rr(ctx, 1.8, -17.6, 4, 3.4, 0.6);
      ctx.fill();
      break;
    }
    case 'casual':
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.ellipse(0, -30.2, 3.8, 1.2, 0, 0, Math.PI);
      ctx.fill();
      belt(ctx, shade(o.bottom, -0.25), shade(o.bottom, -0.25));
      break;
    case 'ninja':
      ctx.fillStyle = acc;
      ctx.fillRect(-9, -18.8, 18, 2.2);
      break;
  }
}

function outfitSide(ctx: Ctx, o: OutfitDef) {
  switch (o.style) {
    case 'jumpsuit':
      ctx.fillStyle = o.accent;
      ctx.fillRect(3.2, -30, 1.1, 16);
      belt(ctx, shade(o.bottom, -0.4), o.accent);
      break;
    case 'overalls':
      ctx.fillStyle = sleeveColor(o);
      ctx.fillRect(-7, -31, 14, 7);
      ctx.fillStyle = o.top;
      ctx.fillRect(-1, -31, 2, 7);
      break;
    case 'sport':
      ctx.fillStyle = o.accent;
      ctx.fillRect(-1, -30, 1.6, 16);
      break;
    case 'suit':
    case 'coat':
      ctx.fillStyle = '#f2f0ea';
      ctx.beginPath();
      ctx.moveTo(2.4, -30);
      ctx.lineTo(4.8, -29.6);
      ctx.lineTo(4.4, -24);
      ctx.fill();
      break;
    case 'armor':
      ctx.fillStyle = shade(o.top, 0.15);
      rr(ctx, -2.4, -28.4, 8, 7.6, 2);
      ctx.fill();
      ctx.fillStyle = o.accent;
      ctx.fillRect(-8, -19.4, 16, 1.1);
      break;
    case 'casual':
      belt(ctx, shade(o.bottom, -0.25), '#c9ced2');
      break;
    case 'ninja':
    case 'dress':
    case 'space':
      ctx.fillStyle = o.accent;
      ctx.fillRect(-8, o.style === 'space' ? -21.4 : -19.2, 16, 1.4);
      break;
  }
}


function tails(ctx: Ctx, R: Rig, side: boolean) {
  const { o, B } = R;
  if (o.style !== 'dress' && o.style !== 'coat' && o.style !== 'robe') return;
  const len = o.style === 'robe' ? 16 : o.style === 'dress' ? 9.6 : 10.4;
  const flare = o.style === 'dress' ? 3.6 : 1.6;
  const hw = side ? 5.2 + Math.max(0, B.chest - 6.9) * 0.4 + B.belly * 0.5 : B.hip + 0.5;
  const c = o.style === 'dress' ? o.bottom : o.top;
  const path = () => {
    ctx.beginPath();
    if (side) {
      ctx.moveTo(-hw + 0.4, -15.6);
      ctx.lineTo(hw, -15.6);
      ctx.quadraticCurveTo(hw + flare * 0.8, -15.6 + len * 0.6, hw + flare, -15.6 + len);
      ctx.lineTo(-hw - flare * 0.6, -15.6 + len);
      ctx.closePath();
    } else {
      ctx.moveTo(-hw, -15.8);
      ctx.lineTo(hw, -15.8);
      ctx.quadraticCurveTo(hw + flare * 0.6, -15.8 + len * 0.5, hw + flare, -15.8 + len);
      ctx.quadraticCurveTo(0, -15.8 + len + 1.4, -hw - flare, -15.8 + len);
      ctx.quadraticCurveTo(-hw - flare * 0.6, -15.8 + len * 0.5, -hw, -15.8);
      ctx.closePath();
    }
  };
  celFill(ctx, c, path, 1.4, 0.8);
  if (o.style === 'dress') {
    ctx.strokeStyle = rgba(tones(c).dark, 0.6);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (const x of [-3.5, 0, 3.5]) {
      ctx.moveTo(x * 0.6, -14);
      ctx.lineTo(x, -15.8 + len - 0.5);
    }
    ctx.stroke();
  }
  if (o.style !== 'dress' && !side) {
    ctx.fillStyle = rgba(tones(c).dark, 0.8);
    ctx.fillRect(-0.35, -15.6, 0.7, len);
  }
  if (o.style === 'robe') {
    ctx.fillStyle = o.accent;
    ctx.fillRect(-hw - flare + 0.6, -15.8 + len - 1.8, (hw + flare) * 2 - 1.2, 1.3);
  }
}

// ------------------------------------------------------------------ hats
function drawHatFront(ctx: Ctx, o: OutfitDef, f: number) {
  const c = o.hatColor ?? o.top;
  const cx = 0.5 * f;
  switch (o.hat) {
    case 'helmet':
      // combat helmet: dome sits on the brow, eyes stay visible under the rim
      ctx.strokeStyle = shade(c, -0.45);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - HR + 0.4, HY - 1.6);
      ctx.quadraticCurveTo(cx - HR + 0.2, HY + 4, cx - HR + 2.4, HY + 6.4);
      ctx.moveTo(cx + HR - 0.4, HY - 1.6);
      ctx.quadraticCurveTo(cx + HR - 0.2, HY + 4, cx + HR - 2.4, HY + 6.4);
      ctx.stroke();
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 1.3, HY - 2.2);
        ctx.bezierCurveTo(cx - HR - 1.6, HY - HR - 4.6, cx + HR + 1.6, HY - HR - 4.6, cx + HR + 1.3, HY - 2.2);
        ctx.closePath();
      }, 1.2, 1);
      celFill(ctx, shade(c, -0.22), () => rr(ctx, cx - HR - 1.9, HY - 3.1, HR * 2 + 3.8, 1.9, 0.9), 0.4, 0.4);
      ctx.fillStyle = rgba('#ffffff', 0.25);
      ctx.beginPath();
      ctx.ellipse(cx - 3, HY - HR - 0.6, 2.6, 1.1, -0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'hardhat':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.4, HY - 1.4);
        ctx.bezierCurveTo(cx - HR - 0.6, HY - HR - 4.2, cx + HR + 0.6, HY - HR - 4.2, cx + HR + 0.4, HY - 1.4);
        ctx.closePath();
      }, 1, 0.8);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - HR - 0.4, HY - 1.4);
      ctx.bezierCurveTo(cx - HR - 0.6, HY - HR - 4.2, cx + HR + 0.6, HY - HR - 4.2, cx + HR + 0.4, HY - 1.4);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = shade(c, 0.22);
      ctx.fillRect(cx - 1 + f * 0.4, HY - HR - 5, 2, 6);
      ctx.restore();
      celFill(ctx, shade(c, -0.08), () => rr(ctx, cx - HR - 2.2, HY - 2.6, HR * 2 + 4.4, 2, 1), 0.4, 0.4);
      break;
    case 'cap':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.4, HY - 1.8);
        ctx.bezierCurveTo(cx - HR - 0.6, HY - HR - 3.6, cx + HR + 0.6, HY - HR - 3.6, cx + HR + 0.4, HY - 1.8);
        ctx.closePath();
      }, 1, 0.8);
      celFill(ctx, shade(c, -0.18), () => {
        ctx.beginPath();
        ctx.ellipse(cx + 1.4 * f, HY - 1.8, HR - 0.4, 1.6, 0, 0, Math.PI);
        ctx.closePath();
      }, 0.3, 0.3);
      ctx.fillStyle = '#ffcf4a';
      ctx.beginPath();
      ctx.arc(cx, HY - HR + 0.2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'chef':
      celFill(ctx, '#ffffff', () => rr(ctx, cx - HR + 1.2, HY - HR - 6, HR * 2 - 2.4, 8.6, 1.6), 0.8, 0.5);
      celFill(ctx, '#ffffff', () => {
        ctx.beginPath();
        ctx.arc(cx - 3.4, HY - HR - 6, 3.8, 0, Math.PI * 2);
        ctx.moveTo(cx + 4.2, HY - HR - 7.4);
        ctx.arc(cx + 0.4, HY - HR - 7.6, 4.2, 0, Math.PI * 2);
        ctx.moveTo(cx + 7.6, HY - HR - 6);
        ctx.arc(cx + 4, HY - HR - 6, 3.6, 0, Math.PI * 2);
      }, 0.8, 0.6);
      break;
    case 'hood':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.arc(cx, HY - 0.4, HR + 2, Math.PI * 0.82, Math.PI * 2.18);
        ctx.lineTo(cx + HR + 1.6, HY + 6.2);
        ctx.lineTo(cx + HR - 1, HY + 4);
        ctx.arc(cx, HY - 0.4, HR - 0.6, 0.12, Math.PI - 0.12, true);
        ctx.lineTo(cx - HR - 1.6, HY + 6.2);
        ctx.closePath();
      }, 1, 1);
      break;
    case 'beret':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(cx - 1.4 * f, HY - HR + 0.4, HR + 1, 3, -0.18 * f, 0, Math.PI * 2);
      }, 0.8, 0.8);
      dot(ctx, cx + 3.4 * f, HY - HR + 0.6, 0.9, '#ffcf4a');
      break;
    case 'tophat':
      celFill(ctx, shade(c, -0.05), () => rr(ctx, cx - HR - 2, HY - HR + 0.2, HR * 2 + 4, 2, 1), 0.3, 0.3);
      celFill(ctx, c, () => rr(ctx, cx - HR + 1.6, HY - HR - 8.4, HR * 2 - 3.2, 9, 1.2), 1, 0.6);
      ctx.fillStyle = '#c7433b';
      ctx.fillRect(cx - HR + 1.6, HY - HR - 1.8, HR * 2 - 3.2, 1.6);
      break;
    case 'bandana':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.3, HY - 2);
        ctx.bezierCurveTo(cx - HR - 0.6, HY - HR - 3.4, cx + HR + 0.6, HY - HR - 3.4, cx + HR + 0.3, HY - 2);
        ctx.quadraticCurveTo(cx, HY - 3.8, cx - HR - 0.3, HY - 2);
        ctx.closePath();
      }, 0.8, 0.6);
      celFill(ctx, shade(c, -0.1), () => {
        ctx.beginPath();
        ctx.moveTo(cx - f * (HR - 0.6), HY - 2.6);
        ctx.lineTo(cx - f * (HR + 4), HY + 0.4);
        ctx.lineTo(cx - f * (HR + 3), HY - 3.8);
        ctx.closePath();
      }, 0.3, 0.3);
      break;
    case 'goggles':
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(cx - HR - 0.2, HY - 5.2, HR * 2 + 0.4, 1.5);
      for (const s of [-1, 1]) {
        celFill(ctx, c, () => {
          ctx.beginPath();
          ctx.arc(cx + s * 3 + f * 0.4, HY - 4.6, 2.4, 0, Math.PI * 2);
        }, 0.4, 0.4);
        dot(ctx, cx + s * 3 + f * 0.4, HY - 4.6, 1.5, '#7fd3ff');
        dot(ctx, cx + s * 3 + f * 0.4 - 0.5, HY - 5.2, 0.5, '#ffffff');
      }
      break;
    case 'crown':
      celFill(ctx, '#ffcf4a', () => {
        ctx.beginPath();
        ctx.moveTo(cx - 4.4, HY - HR + 1);
        ctx.lineTo(cx - 4.4, HY - HR - 3);
        ctx.lineTo(cx - 2.2, HY - HR - 1);
        ctx.lineTo(cx, HY - HR - 4.4);
        ctx.lineTo(cx + 2.2, HY - HR - 1);
        ctx.lineTo(cx + 4.4, HY - HR - 3);
        ctx.lineTo(cx + 4.4, HY - HR + 1);
        ctx.closePath();
      }, 0.6, 0.6);
      break;
  }
}

function drawHatBack(ctx: Ctx, o: OutfitDef) {
  const c = o.hatColor ?? o.top;
  switch (o.hat) {
    case 'cap':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(-HR - 0.4, HY - 1.8);
        ctx.bezierCurveTo(-HR - 0.6, HY - HR - 3.6, HR + 0.6, HY - HR - 3.6, HR + 0.4, HY - 1.8);
        ctx.closePath();
      }, -1, 0.8);
      // strap opening
      ctx.fillStyle = rgba('#000', 0.35);
      ctx.beginPath();
      ctx.arc(0, HY - 1.8, 2, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = shade(c, -0.3);
      ctx.fillRect(-2.2, HY - 2.2, 4.4, 0.7);
      return;
    case 'hood':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.arc(0, HY - 0.6, HR + 2, Math.PI * 0.75, Math.PI * 2.25);
        ctx.quadraticCurveTo(HR + 1.4, HY + 9, 0, HY + 10.4);
        ctx.quadraticCurveTo(-HR - 1.4, HY + 9, -HR - 1.4, HY + 5.4);
        ctx.closePath();
      }, -1, 1);
      ctx.strokeStyle = rgba(tones(c).dark, 0.8);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, HY - HR - 1.4);
      ctx.lineTo(0, HY + 9.6);
      ctx.stroke();
      return;
    case 'bandana':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(-HR - 0.3, HY - 1.4);
        ctx.bezierCurveTo(-HR - 0.6, HY - HR - 3.4, HR + 0.6, HY - HR - 3.4, HR + 0.3, HY - 1.4);
        ctx.closePath();
      }, -0.8, 0.6);
      celFill(ctx, shade(c, -0.1), () => {
        ctx.beginPath();
        ctx.moveTo(-0.6, HY - 1.6);
        ctx.lineTo(-3.6, HY + 4.6);
        ctx.lineTo(-1.2, HY + 3.6);
        ctx.lineTo(0.8, HY - 1.6);
        ctx.closePath();
        ctx.moveTo(0.4, HY - 1.6);
        ctx.lineTo(3.2, HY + 3.2);
        ctx.lineTo(4.2, HY + 1.6);
        ctx.lineTo(1.6, HY - 1.8);
        ctx.closePath();
      }, 0.3, 0.3);
      return;
    case 'goggles':
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(-HR - 0.2, HY - 5.2, HR * 2 + 0.4, 1.6);
      ctx.fillStyle = '#6b5a4a';
      ctx.fillRect(-1.2, HY - 5.4, 2.4, 2);
      return;
    default:
      drawHatFront(ctx, o, 0);
  }
}

function drawHatSide(ctx: Ctx, o: OutfitDef, hx: number) {
  const c = o.hatColor ?? o.top;
  switch (o.hat) {
    case 'helmet':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR - 1.4, HY + 0.6);
        ctx.bezierCurveTo(hx - HR - 1.6, HY - HR - 4.6, hx + HR + 1.6, HY - HR - 4.6, hx + HR + 1.8, HY - 2.4);
        ctx.closePath();
      }, -1, 1);
      celFill(ctx, shade(c, -0.22), () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR - 1.9, HY + 0.2);
        ctx.lineTo(hx + HR + 2.3, HY - 2.9);
        ctx.lineTo(hx + HR + 2.1, HY - 1.3);
        ctx.lineTo(hx - HR - 1.7, HY + 1.8);
        ctx.closePath();
      }, 0.3, 0.3);
      break;
    case 'hardhat':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR, HY - 1.2);
        ctx.bezierCurveTo(hx - HR - 0.4, HY - HR - 4.4, hx + HR + 0.4, HY - HR - 4.4, hx + HR, HY - 1.2);
        ctx.closePath();
      }, -0.8, 0.8);
      celFill(ctx, shade(c, -0.08), () => rr(ctx, hx - HR - 1.6, HY - 2.4, HR * 2 + 5, 2, 1), 0.3, 0.3);
      break;
    case 'cap':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR - 0.2, HY - 1.4);
        ctx.bezierCurveTo(hx - HR - 0.4, HY - HR - 3.6, hx + HR + 0.4, HY - HR - 3.6, hx + HR, HY - 1.8);
        ctx.closePath();
      }, -0.8, 0.8);
      celFill(ctx, shade(c, -0.2), () => rr(ctx, hx + 3, HY - 2.6, 8.4, 1.8, 0.9), 0.2, 0.2);
      break;
    case 'chef':
      celFill(ctx, '#ffffff', () => {
        ctx.beginPath();
        rr(ctx, hx - HR + 1, HY - HR - 6, HR * 2 - 2, 8, 1.4);
        ctx.moveTo(hx + 4, HY - HR - 7);
        ctx.arc(hx, HY - HR - 7, 4.4, 0, Math.PI * 2);
      }, -0.6, 0.5);
      break;
    case 'hood':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.arc(hx - 0.6, HY - 0.2, HR + 2, Math.PI * 0.62, Math.PI * 1.95);
        ctx.quadraticCurveTo(hx + 4, HY - 2, hx + 2, HY + 8);
        ctx.closePath();
      }, -0.8, 0.8);
      break;
    case 'beret':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(hx - 1, HY - HR + 0.6, HR + 1, 3, 0.15, 0, Math.PI * 2);
      }, -0.6, 0.6);
      break;
    case 'tophat':
      celFill(ctx, c, () => rr(ctx, hx - HR + 1.4, HY - HR - 8.2, HR * 2 - 3, 9, 1.2), -0.8, 0.6);
      celFill(ctx, shade(c, -0.05), () => rr(ctx, hx - HR - 1.4, HY - HR + 0.4, HR * 2 + 3.4, 1.8, 0.9), 0.2, 0.2);
      ctx.fillStyle = '#c7433b';
      ctx.fillRect(hx - HR + 1.4, HY - HR - 1.6, HR * 2 - 3, 1.5);
      break;
    case 'bandana':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR, HY - 1.2);
        ctx.bezierCurveTo(hx - HR - 0.4, HY - HR - 3.4, hx + HR + 0.4, HY - HR - 3.4, hx + HR, HY - 2);
        ctx.closePath();
        ctx.moveTo(hx - HR + 0.6, HY - 2.4);
        ctx.lineTo(hx - HR - 4, HY + 1.4);
        ctx.lineTo(hx - HR - 3, HY - 3.6);
        ctx.closePath();
      }, -0.6, 0.5);
      break;
    case 'goggles':
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(hx - HR, HY - 5, HR * 2, 1.4);
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.arc(hx + 4.4, HY - 4.4, 2.3, 0, Math.PI * 2);
      }, -0.3, 0.3);
      dot(ctx, hx + 4.4, HY - 4.4, 1.4, '#7fd3ff');
      break;
  }
}


// ------------------------------------------------------------------ held props (front)
function drawHeld(ctx: Ctx, p: Pose, j: Joints) {
  switch (p.hold) {
    case 'dumbbell': {
      for (const h of [j.haL, j.haR]) {
        ctx.fillStyle = '#3a3f45';
        ctx.fillRect(h[0] - 3.2, h[1] - 0.6, 6.4, 1.4);
        rr(ctx, h[0] - 4.2, h[1] - 2.4, 1.8, 5, 0.6);
        ctx.fillStyle = '#1f2226';
        ctx.fill();
        rr(ctx, h[0] + 2.4, h[1] - 2.4, 1.8, 5, 0.6);
        ctx.fill();
      }
      break;
    }
    case 'book': {
      const x = (j.haL[0] + j.haR[0]) / 2;
      const y = (j.haL[1] + j.haR[1]) / 2 - 2;
      ctx.fillStyle = '#b5403a';
      rr(ctx, x - 4.6, y - 3.4, 9.2, 6.4, 0.8);
      ctx.fill();
      ctx.fillStyle = '#f4efe0';
      ctx.fillRect(x - 4, y - 3, 3.8, 5.6);
      ctx.fillRect(x + 0.2, y - 3, 3.8, 5.6);
      ctx.fillStyle = rgba('#3a2a20', 0.5);
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x - 3.4, y - 1.8 + i * 1.4, 2.8, 0.35);
        ctx.fillRect(x + 0.7, y - 1.8 + i * 1.4, 2.8, 0.35);
      }
      break;
    }
    case 'tray': {
      const x = (j.haL[0] + j.haR[0]) / 2;
      const y = Math.min(j.haL[1], j.haR[1]) - 2.4;
      ctx.fillStyle = '#a4733f';
      rr(ctx, x - 5.4, y - 4.6, 10.8, 6.2, 0.8);
      ctx.fill();
      ctx.strokeStyle = '#5a3e22';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 5.4, y - 4.6);
      ctx.lineTo(x + 5.4, y + 1.6);
      ctx.stroke();
      break;
    }
    case 'wrench':
      ctx.fillStyle = '#9aa7b0';
      ctx.fillRect(j.haR[0] - 0.6, j.haR[1] - 7, 1.4, 7);
      break;
  }
}

// ------------------------------------------------------------------ weapons
/** Cheap silhouette for far zoom levels. */
export function drawCharacterLOD(ctx: Ctx, look: Look, outfit: OutfitDef, child: boolean) {
  const s = (child ? 0.66 : 1) * 0.9;
  ctx.fillStyle = outfit.bottom;
  ctx.fillRect(-4.6 * s, -19 * s, 9.2 * s, 18 * s);
  ctx.fillStyle = '#2a2220';
  ctx.fillRect(-5 * s, -2 * s, 10 * s, 2 * s);
  ctx.fillStyle = outfit.top;
  ctx.fillRect(-7 * s, -33.5 * s, 14 * s, 16 * s);
  ctx.fillStyle = SKIN_TONES[look.skin % SKIN_TONES.length];
  ctx.beginPath();
  ctx.arc(0, -40.8 * s, 7.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  ctx.fillRect(-7.6 * s, -49.5 * s, 15.2 * s, 5 * s);
}

