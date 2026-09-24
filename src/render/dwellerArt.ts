/*
 * Character renderer v2 — chunky cartoon proportions, two-segment limbs,
 * cel shading (form shadow + rim light + outline), expressive faces.
 * Feet at (0,0). Side view faces +x. World units (~46 tall).
 */
import { mix, rgba, shade, type Ctx } from './gfx';
import type { OutfitDef, WeaponDef } from '../data/items';
import { HAIR_COLORS, SKIN_TONES } from '../sim/dwellers';
import type { Look } from '../sim/types';

export interface Pose {
  view: 'front' | 'side';
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

const EYE_COLORS = ['#5b7fb8', '#6b4a2e', '#4f8a5a', '#3a2a22', '#7a8a9a'];

// ------------------------------------------------------------------ color helpers
const cache = new Map<string, { base: string; dark: string; light: string; line: string }>();
function tones(c: string) {
  let t = cache.get(c);
  if (!t) {
    t = {
      base: c,
      dark: mix(shade(c, -0.3), '#3a2a5a', 0.12),
      light: shade(c, 0.28),
      line: mix(shade(c, -0.66), '#1a1020', 0.35),
    };
    cache.set(c, t);
  }
  return t;
}

const LW = 0.85;

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

/** Tapered limb segment with form shadow on the side away from the light (light from upper-left). */
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
  // shadow strip
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
  // rim light
  ctx.beginPath();
  ctx.moveTo(ax - (nx * wa) / 2.9, ay - (ny * wa) / 2.9);
  ctx.lineTo(bx - (nx * wb) / 2.9, by - (ny * wb) / 2.9);
  ctx.lineWidth = Math.min(wa, wb) * 0.16;
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(t.light, 0.7);
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
function celFill(ctx: Ctx, color: string, pathFn: () => void, offX = 1.6, offY = 1.2, outline = true) {
  const t = tones(color);
  pathFn();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // shadow: everything except an up-left shifted copy
  ctx.translate(offX, offY);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = t.dark;
  ctx.fillRect(-60, -80, 120, 120);
  ctx.translate(-offX * 2, -offY * 2);
  pathFn();
  ctx.fillStyle = t.base;
  ctx.fill();
  // soft highlight near the upper-left edge
  ctx.translate(offX * 1.45, offY * 1.45);
  ctx.globalCompositeOperation = 'source-over';
  pathFn();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = rgba(t.light, 0.45);
  ctx.stroke();
  ctx.restore();
  if (outline) {
    pathFn();
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }
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

const THIGH = 7.4;
const SHIN = 7.0;
const UPPER = 6.8;
const FORE = 6.4;
const HIP_Y = -15.4;
const SH_Y = -27.2;

function frontJoints(p: Pose, female: boolean): Joints {
  const hipW = female ? 3.4 : 3.2;
  const shW = female ? 7.0 : 7.6;
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
  const eA = p.elbowA ?? 0.12;
  const eB = p.elbowB ?? 0.12;
  const elL: [number, number] = [shL[0] - Math.sin(p.armA) * UPPER, shL[1] + Math.cos(p.armA) * UPPER];
  const elR: [number, number] = [shR[0] + Math.sin(p.armB) * UPPER, shR[1] + Math.cos(p.armB) * UPPER];
  const fa = p.armA - eA;
  const fb = p.armB - eB;
  const haL: [number, number] = [elL[0] - Math.sin(fa) * FORE, elL[1] + Math.cos(fa) * FORE];
  const haR: [number, number] = [elR[0] + Math.sin(fb) * FORE, elR[1] + Math.cos(fb) * FORE];
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
export function drawCharacter(ctx: Ctx, look: Look, outfit: OutfitDef, pose: Pose, gender: 'm' | 'f') {
  const skin = SKIN_TONES[look.skin % SKIN_TONES.length];
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  const female = gender === 'f';
  ctx.save();
  ctx.scale(0.92, 0.92);
  if (pose.child) {
    ctx.scale(0.68, 0.68);
  }
  ctx.translate(0, -pose.bob);
  if (pose.lean) {
    ctx.translate(0, HIP_Y);
    ctx.rotate(pose.lean);
    ctx.translate(0, -HIP_Y);
  }
  if (pose.view === 'side') drawSide(ctx, look, outfit, pose, female, skin, hair);
  else drawFront(ctx, look, outfit, pose, female, skin, hair);
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
function bootColor(o: OutfitDef) {
  if (o.style === 'space') return '#d9dee3';
  if (o.style === 'armor') return shade(o.bottom, -0.3);
  if (o.style === 'dress') return shade(o.accent, -0.35);
  if (o.style === 'sport') return '#f4f4f0';
  return '#3a2a22';
}

// ------------------------------------------------------------------ FRONT
function drawFront(ctx: Ctx, look: Look, o: OutfitDef, p: Pose, female: boolean, skin: string, hair: string) {
  const j = frontJoints(p, female);
  const f = p.facing ?? 1;
  const lc = legColor(o, skin);
  const sc = sleeveColor(o);
  const hc = handColor(o, skin);
  const bc = bootColor(o);
  const shortSleeve = o.style === 'casual' || o.style === 'dress';

  // back hair (long styles) behind everything
  drawHairBack(ctx, look.hair, hair, false, f, o);
  if (o.style === 'space') {
    // backpack
    ctx.save();
    celFill(ctx, shade(o.top, -0.08), () => rr(ctx, -8.6, -29, 17.2, 13, 3));
    ctx.restore();
  }
  // legs (far first)
  const leg = (hip: [number, number], knee: [number, number], ankle: [number, number], side: number) => {
    limbSeg(ctx, knee[0], knee[1], ankle[0], ankle[1], 5.0, 4.4, lc);
    limbSeg(ctx, hip[0], hip[1], knee[0], knee[1], 6.2, 5.2, o.style === 'dress' ? skin : lc);
    if (o.style === 'sport') {
      ctx.strokeStyle = o.accent;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(hip[0] + side * 2.2, hip[1] + 1);
      ctx.lineTo(knee[0] + side * 2, knee[1]);
      ctx.lineTo(ankle[0] + side * 1.7, ankle[1] - 1);
      ctx.stroke();
    }
    if (o.style === 'armor') {
      ctx.save();
      celFill(ctx, shade(o.top, 0.1), () => rr(ctx, knee[0] - 2.8, knee[1] - 2.2, 5.6, 4.4, 1.6), 0.6, 0.5);
      ctx.restore();
    }
    // boot
    boot(ctx, ankle[0], ankle[1], false, side * 0.35 + f * 0.25, bc);
  };
  leg(j.hipL, j.kneeL, j.ankleL, -1);
  leg(j.hipR, j.kneeR, j.ankleR, 1);

  // arms behind torso? front view: arms drawn after torso (in front), except raised ones stay in front too.
  drawTorsoFront(ctx, o, female, skin, f);

  // skirt / coat tails over the thighs
  tails(ctx, o, female, false);

  // head
  drawHeadFront(ctx, look, o, p, female, skin, hair, f);

  // arms
  const arm = (sh: [number, number], el: [number, number], ha: [number, number], side: number, raise: number) => {
    const foreC = shortSleeve ? skin : sc;
    limbSeg(ctx, el[0], el[1], ha[0], ha[1], 4.4, 4.0, foreC);
    limbSeg(ctx, sh[0], sh[1], el[0], el[1], 5.4, 4.8, sc);
    if (shortSleeve) {
      // sleeve cuff
      const mx = sh[0] + (el[0] - sh[0]) * 0.55;
      const my = sh[1] + (el[1] - sh[1]) * 0.55;
      dot(ctx, mx, my, 2.5, sc);
    } else if (o.style === 'jumpsuit' || o.style === 'sport') {
      // cuff stripe
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
      ctx.save();
      celFill(ctx, shade(o.top, 0.12), () => {
        ctx.beginPath();
        ctx.ellipse(sh[0] + side * 0.6, sh[1] - 0.4, 3.6, 3, side * 0.3, 0, Math.PI * 2);
      }, 0.7, 0.6);
      ctx.restore();
    }
    hand(ctx, ha[0], ha[1], hc, side, raise);
  };
  arm(j.shL, j.elL, j.haL, -1, p.armA);
  arm(j.shR, j.elR, j.haR, 1, p.armB);
  if (p.hold && p.hold !== 'none') drawHeld(ctx, p, j);
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

function hand(ctx: Ctx, x: number, y: number, c: string, side: number, raise: number) {
  const t = tones(c);
  ctx.beginPath();
  ctx.ellipse(x, y + 0.6, 2.35, 2.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  // thumb
  const tx = x - side * 1.9 * (raise > 1.6 ? -1 : 1);
  ctx.beginPath();
  ctx.ellipse(tx, y - 0.2, 1.05, 1.35, side * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 0.7, y + 1.3, 1.3, 0, Math.PI);
  ctx.fillStyle = rgba(t.dark, 0.6);
  ctx.fill();
}

function boot(ctx: Ctx, x: number, y: number, side: boolean, turn: number, c: string) {
  const t = tones(c);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (side) {
    // profile boot pointing +x
    ctx.moveTo(-2.4, -2.6);
    ctx.lineTo(1.8, -2.6);
    ctx.quadraticCurveTo(5.4, -2.2, 5.6, 0.2);
    ctx.lineTo(5.6, 1.4);
    ctx.lineTo(-2.8, 1.4);
    ctx.lineTo(-2.8, -1.8);
    ctx.closePath();
  } else {
    const o = turn * 1.2;
    ctx.moveTo(-2.6 + o, -2.2);
    ctx.lineTo(2.6 + o, -2.2);
    ctx.quadraticCurveTo(3.8 + o, -1.4, 3.6 + o, 1.4);
    ctx.lineTo(-3.4 + o, 1.4);
    ctx.quadraticCurveTo(-3.8 + o, -1.4, -2.6 + o, -2.2);
    ctx.closePath();
  }
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
  // sole
  ctx.fillStyle = shade(c, -0.5);
  ctx.fillRect(side ? -2.8 : -3.4 + turn * 1.2, 0.6, side ? 8.4 : 7, 0.9);
  // shine
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.beginPath();
  ctx.ellipse(side ? 2.6 : turn * 1.2 - 0.6, -1.4, 1.4, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function torsoPathFront(ctx: Ctx, female: boolean, bulky: boolean) {
  const sw = bulky ? 9.2 : female ? 7.6 : 8.4;
  const ww = female ? 5.5 : 6.4;
  const hw = female ? 7.4 : 6.9;
  ctx.beginPath();
  ctx.moveTo(-3.1, -29.9);
  ctx.quadraticCurveTo(-sw + 0.6, -29.9, -sw, -27.2);
  ctx.quadraticCurveTo(-sw + 0.2, -24, -ww - 1.1, -22);
  ctx.quadraticCurveTo(-ww, -19.8, -hw, -16.4);
  ctx.lineTo(-hw, -14.2);
  ctx.quadraticCurveTo(0, -13.2, hw, -14.2);
  ctx.lineTo(hw, -16.4);
  ctx.quadraticCurveTo(ww, -19.8, ww + 1.1, -22);
  ctx.quadraticCurveTo(sw - 0.2, -24, sw, -27.2);
  ctx.quadraticCurveTo(sw - 0.6, -29.9, 3.1, -29.9);
  ctx.closePath();
}

function drawTorsoFront(ctx: Ctx, o: OutfitDef, female: boolean, skin: string, f: number) {
  const bulky = o.style === 'armor' || o.style === 'space';
  // neck
  limbSeg(ctx, 0, -31.8, 0, -28.4, 3.8, 3.8, skin);
  const path = () => torsoPathFront(ctx, female, bulky);
  celFill(ctx, o.top, path, 1.8, 1.0);
  ctx.save();
  path();
  ctx.clip();
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
  // lower body band (pants start)
  if (o.style !== 'dress' && o.style !== 'robe' && o.style !== 'coat') {
    ctx.fillStyle = o.bottom;
    ctx.fillRect(-10, -15.2, 20, 3);
  }
  ctx.restore();
  if (female && o.style !== 'armor' && o.style !== 'space') {
    // subtle bust shading
    ctx.strokeStyle = rgba(tones(o.top).dark, 0.5);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.arc(-2.6, -24.4, 2.3, 0.3, Math.PI - 0.3);
    ctx.arc(2.6, -24.4, 2.3, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }
}

function belt(ctx: Ctx, c: string, buckle: string) {
  ctx.fillStyle = c;
  ctx.fillRect(-10, -16.8, 20, 1.9);
  ctx.fillStyle = buckle;
  ctx.fillRect(-1.4, -17.1, 2.8, 2.5);
  ctx.fillStyle = c;
  ctx.fillRect(-0.7, -16.4, 1.4, 1.1);
}

function tails(ctx: Ctx, o: OutfitDef, female: boolean, side: boolean) {
  if (o.style !== 'dress' && o.style !== 'coat' && o.style !== 'robe') return;
  const len = o.style === 'robe' ? 13.4 : o.style === 'dress' ? 8.4 : 8.8;
  const flare = o.style === 'dress' ? 3.6 : 1.6;
  const hw = side ? 5.2 : female ? 7.4 : 7;
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

// ------------------------------------------------------------------ HEAD (front / 3-4)
const HY = -38.2;
const HR = 8.1;

function headPath(ctx: Ctx, f: number) {
  // slightly egg-shaped head with a softer jaw, turned 3/4
  const cx = 0.5 * f;
  ctx.beginPath();
  ctx.moveTo(cx - HR, HY - 0.6);
  ctx.bezierCurveTo(cx - HR, HY - HR * 1.26, cx + HR, HY - HR * 1.26, cx + HR, HY - 0.6);
  ctx.bezierCurveTo(cx + HR, HY + 4.6 + f * 0.3, cx + 4.2 + f * 0.6, HY + HR + 0.4, cx + 0.8 * f, HY + HR + 0.5);
  ctx.bezierCurveTo(cx - 4.2 + f * 0.6, HY + HR + 0.4, cx - HR, HY + 4.6 - f * 0.3, cx - HR, HY - 0.6);
  ctx.closePath();
}

function drawHeadFront(ctx: Ctx, look: Look, o: OutfitDef, p: Pose, female: boolean, skin: string, hair: string, f: number) {
  const space = o.hat === 'helmet' && o.style === 'space';
  // ears
  const t = tones(skin);
  for (const s of [-1, 1]) {
    const ex = s * (HR - 0.4) + 0.5 * f;
    const far = s !== f;
    ctx.beginPath();
    ctx.ellipse(ex, HY + 0.8, far ? 1.5 : 1.9, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.base;
    ctx.fill();
    ctx.lineWidth = LW;
    ctx.strokeStyle = t.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ex, HY + 0.9, 0.8, 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.dark;
    ctx.fill();
  }
  celFill(ctx, skin, () => headPath(ctx, f), 1.9, 1.6);
  // cheek blush
  ctx.fillStyle = rgba('#ff6a6a', female ? 0.26 : 0.13);
  ctx.beginPath();
  ctx.ellipse(-4.2 + f * 0.9, HY + 3.4, 1.8, 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(4.2 + f * 0.9, HY + 3.4, 1.8, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFaceFront(ctx, look, p, female, skin, hair, f);
  if (space) {
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
    // collar ring
    ctx.fillStyle = o.accent;
    ctx.fillRect(-6, HY + HR + 1.2, 12, 1.6);
    return;
  }
  const hideHair = o.hat === 'helmet' || o.hat === 'hood' || o.hat === 'chef' || o.hat === 'hardhat';
  if (!hideHair) drawHairFront(ctx, look.hair, hair, f, female);
  if (look.beard) drawBeardFront(ctx, look.beard, hair, f);
  if (look.glasses) glassesFront(ctx, f);
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

function eye(ctx: Ctx, x: number, y: number, s: number, iris: string, p: Pose, lookX: number) {
  const closed = p.blink || p.eyes === 'closed';
  if (p.eyes === 'x') {
    ctx.strokeStyle = '#2a1a14';
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
  if (closed) {
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 0.75;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y - 0.6, 1.5 * s, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
    ctx.lineCap = 'butt';
    return;
  }
  const wide = p.eyes === 'wide' ? 1.18 : 1;
  const rx = 1.62 * s * wide;
  const ry = 2.0 * s * wide;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fbfaf6';
  ctx.fill();
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = '#3a2418';
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  const ix = x + lookX * 0.55 * s;
  ctx.beginPath();
  ctx.arc(ix, y + 0.2, 1.22 * s, 0, Math.PI * 2);
  ctx.fillStyle = iris;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix, y + 0.2, 0.66 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0a08';
  ctx.fill();
  // upper lid shadow
  ctx.fillStyle = rgba('#3a2418', 0.25);
  ctx.fillRect(x - rx, y - ry, rx * 2, ry * 0.45);
  ctx.restore();
  dot(ctx, ix + 0.45 * s, y - 0.55 * s, 0.42 * s, '#ffffff');
  dot(ctx, ix - 0.45 * s, y + 0.6 * s, 0.18 * s, rgba('#ffffff', 0.8));
}

function drawFaceFront(ctx: Ctx, look: Look, p: Pose, female: boolean, skin: string, hair: string, f: number) {
  const iris = EYE_COLORS[look.face % EYE_COLORS.length];
  const cx = 0.9 * f;
  const ey = HY + 0.8;
  const lookX = (p.lookDir ?? 0) + f * 0.35;
  // far eye slightly smaller for the 3/4 turn
  const sL = f > 0 ? 0.88 : 1;
  const sR = f > 0 ? 1 : 0.88;
  eye(ctx, cx - 3.1, ey, sL, iris, p, lookX);
  eye(ctx, cx + 3.1, ey, sR, iris, p, lookX);
  if (female && !(p.blink || p.eyes === 'closed' || p.eyes === 'x')) {
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - 4.8, ey - 1.4);
    ctx.lineTo(cx - 5.6, ey - 2.2);
    ctx.moveTo(cx + 4.8, ey - 1.4);
    ctx.lineTo(cx + 5.6, ey - 2.2);
    ctx.stroke();
  }
  // brows
  const bc = shade(hair, -0.2);
  const tilt = p.mouth === 'sad' ? 0.28 : p.eyes === 'wide' ? -0.2 : p.mouth === 'grin' ? -0.08 : 0;
  ctx.strokeStyle = bc;
  ctx.lineCap = 'round';
  ctx.lineWidth = female ? 0.75 : 1.05;
  for (const s of [-1, 1]) {
    const bx = cx + s * 3.1;
    const by = ey - 3.0 * (p.eyes === 'wide' ? 1.15 : 1);
    ctx.beginPath();
    ctx.moveTo(bx - 1.6, by + 0.2 + s * tilt * 1.6 * -1 * -1 * (s < 0 ? 1 : -1) * 0);
    ctx.quadraticCurveTo(bx, by - 0.9 + (s < 0 ? tilt : tilt) * 1.2, bx + 1.6, by + 0.2 + (s < 0 ? -tilt : tilt) * 1.6 * -1);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // nose: soft wedge shaded on the far side
  const nx = cx + f * 0.6;
  ctx.fillStyle = tones(skin).dark;
  ctx.beginPath();
  ctx.moveTo(nx + f * 0.2, ey + 0.9);
  ctx.quadraticCurveTo(nx + f * 1.6, ey + 2.8, nx + f * 0.4, ey + 3.4);
  ctx.quadraticCurveTo(nx - f * 0.6, ey + 3.4, nx - f * 0.9, ey + 2.9);
  ctx.fill();
  dot(ctx, nx - f * 0.3, ey + 2.3, 0.5, rgba('#ffffff', 0.35));
  drawMouthFront(ctx, p.mouth, cx + f * 0.3, ey + 5.3, female);
}

function drawMouthFront(ctx: Ctx, m: Pose['mouth'], x: number, y: number, female: boolean) {
  const lip = female ? '#c2455a' : '#7a2e24';
  ctx.lineCap = 'round';
  switch (m) {
    case 'happy': {
      ctx.beginPath();
      ctx.moveTo(x - 2.1, y - 0.5);
      ctx.quadraticCurveTo(x, y + 1.9, x + 2.1, y - 0.5);
      ctx.strokeStyle = lip;
      ctx.lineWidth = 0.85;
      ctx.stroke();
      break;
    }
    case 'grin': {
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y - 0.9);
      ctx.quadraticCurveTo(x, y - 0.2, x + 2.5, y - 0.9);
      ctx.quadraticCurveTo(x + 1.6, y + 2.6, x, y + 2.7);
      ctx.quadraticCurveTo(x - 1.6, y + 2.6, x - 2.5, y - 0.9);
      ctx.closePath();
      ctx.fillStyle = '#6a1e1a';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2.6, y - 1, 5.2, 1.3);
      ctx.fillStyle = '#e8606a';
      ctx.beginPath();
      ctx.ellipse(x, y + 2.4, 1.4, 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = lip;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      break;
    }
    case 'sad': {
      ctx.beginPath();
      ctx.moveTo(x - 1.8, y + 0.9);
      ctx.quadraticCurveTo(x, y - 0.8, x + 1.8, y + 0.9);
      ctx.strokeStyle = lip;
      ctx.lineWidth = 0.85;
      ctx.stroke();
      break;
    }
    case 'open': {
      ctx.beginPath();
      ctx.ellipse(x, y + 0.5, 1.3, 1.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5a1a14';
      ctx.fill();
      ctx.fillStyle = '#e8606a';
      ctx.beginPath();
      ctx.ellipse(x, y + 1.4, 0.8, 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(x - 1.4, y + 0.2);
      ctx.quadraticCurveTo(x, y + 0.6, x + 1.4, y + 0.1);
      ctx.strokeStyle = lip;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
}

// ------------------------------------------------------------------ HAIR
function hairFill(ctx: Ctx, hair: string, pathFn: () => void) {
  const t = tones(hair);
  pathFn();
  const g = ctx.createLinearGradient(0, HY - HR - 3, 0, HY + 4);
  g.addColorStop(0, t.light);
  g.addColorStop(0.45, t.base);
  g.addColorStop(1, t.dark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = LW;
  ctx.strokeStyle = t.line;
  ctx.stroke();
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

function drawHairBack(ctx: Ctx, style: number, hair: string, side: boolean, f: number, o: OutfitDef) {
  if (o.hat === 'helmet' && o.style === 'space') return;
  const t = tones(hair);
  const cx = side ? -1.5 : 0.5 * f;
  switch (style) {
    case 5: // bob
      hairFill(ctx, shade(hair, -0.12), () => {
        ctx.beginPath();
        ctx.ellipse(cx, HY + 1.6, HR + 2, HR + 1.2, 0, 0, Math.PI * 2);
      });
      break;
    case 6: // long
      hairFill(ctx, shade(hair, -0.12), () => {
        ctx.beginPath();
        if (side) {
          ctx.moveTo(-HR - 1, HY - 2);
          ctx.quadraticCurveTo(-HR - 3.2, HY + 10, -HR, HY + 16);
          ctx.lineTo(1, HY + 13);
          ctx.lineTo(2, HY);
          ctx.closePath();
        } else {
          ctx.moveTo(-HR - 1.6, HY - 1);
          ctx.quadraticCurveTo(-HR - 3, HY + 10, -HR - 0.6, HY + 17);
          ctx.lineTo(HR + 0.6, HY + 17);
          ctx.quadraticCurveTo(HR + 3, HY + 10, HR + 1.6, HY - 1);
          ctx.closePath();
        }
      });
      break;
    case 7: // ponytail
      hairFill(ctx, shade(hair, -0.1), () => {
        ctx.beginPath();
        if (side) ctx.ellipse(-HR - 2.4, HY + 4, 2.8, 6.4, 0.35, 0, Math.PI * 2);
        else ctx.ellipse(cx - f * 4, HY - HR + 1, 3.2, 3, 0, 0, Math.PI * 2);
      });
      break;
    case 9: // bun
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.arc(side ? -HR + 2 : cx, HY - HR - 1.6, 3.4, 0, Math.PI * 2);
      });
      break;
    case 10: // afro volume behind
      hairFill(ctx, shade(hair, -0.08), () => {
        ctx.beginPath();
        ctx.ellipse(cx - (side ? 1 : 0), HY - 2.4, HR + 3.4, HR + 2.2, 0, 0, Math.PI * 2);
      });
      break;
  }
  void t;
}

function drawHairFront(ctx: Ctx, style: number, hair: string, f: number, female: boolean) {
  const cx = 0.5 * f;
  switch (style) {
    case 0: // short crop with side-swept fringe
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.3, HY + 0.6);
        ctx.bezierCurveTo(cx - HR - 1, HY - HR - 2.6, cx + HR + 1, HY - HR - 2.6, cx + HR + 0.3, HY + 0.6);
        ctx.lineTo(cx + HR - 0.8, HY - 1.6);
        ctx.quadraticCurveTo(cx + 2, HY - 4.8, cx - 3 * f, HY - 3.4);
        ctx.quadraticCurveTo(cx - HR + 1.6, HY - 3, cx - HR + 0.8, HY - 1.6);
        ctx.closePath();
      });
      sheen(ctx, hair, cx - 1, HY - HR + 1.2, 4);
      break;
    case 1: // buzz cut
      hairFill(ctx, shade(hair, -0.05), () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR + 0.2, HY - 0.4);
        ctx.bezierCurveTo(cx - HR, HY - HR - 1.8, cx + HR, HY - HR - 1.8, cx + HR - 0.2, HY - 0.4);
        ctx.quadraticCurveTo(cx, HY - 5.6, cx - HR + 0.2, HY - 0.4);
        ctx.closePath();
      });
      break;
    case 2: // 50s side part with a swoop
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.5, HY + 1.2);
        ctx.bezierCurveTo(cx - HR - 1.5, HY - HR - 3.6, cx + HR + 1.4, HY - HR - 3, cx + HR + 0.5, HY + 1.2);
        ctx.lineTo(cx + HR - 0.8, HY - 2);
        ctx.bezierCurveTo(cx + 4, HY - 6.2, cx - 1, HY - 1.6, cx - 3.2 * f, HY - 4.2);
        ctx.quadraticCurveTo(cx - HR + 1, HY - 3.2, cx - HR + 0.6, HY - 1);
        ctx.closePath();
      });
      ctx.strokeStyle = rgba(tones(hair).line, 0.7);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 3.2 * f, HY - HR - 0.6);
      ctx.quadraticCurveTo(cx - 2.6 * f, HY - 6, cx - 3.4 * f, HY - 4.4);
      ctx.stroke();
      sheen(ctx, hair, cx + 1.6 * f, HY - HR + 0.8, 4.4, -0.2 * f);
      break;
    case 3: // curly
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 1.02 + (i / 8) * Math.PI * 0.96;
        const rx = cx + Math.cos(a) * (HR - 0.6);
        const ry = HY - 1.4 + Math.sin(a) * (HR - 0.4);
        hairFill(ctx, i % 2 ? hair : shade(hair, -0.08), () => {
          ctx.beginPath();
          ctx.arc(rx, ry, 2.9, 0, Math.PI * 2);
        });
      }
      break;
    case 4: // mohawk
      hairFill(ctx, shade(hair, -0.25), () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR + 0.4, HY - 0.8);
        ctx.bezierCurveTo(cx - HR, HY - HR - 1.4, cx + HR, HY - HR - 1.4, cx + HR - 0.4, HY - 0.8);
        ctx.quadraticCurveTo(cx, HY - 5.4, cx - HR + 0.4, HY - 0.8);
        ctx.closePath();
      });
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - 2, HY - HR + 1.4);
        ctx.lineTo(cx - 1.4, HY - HR - 5.6);
        ctx.lineTo(cx + 0.4, HY - HR - 3.6);
        ctx.lineTo(cx + 1.4, HY - HR - 6.4);
        ctx.lineTo(cx + 2.2, HY - HR + 1.4);
        ctx.closePath();
      });
      break;
    case 5: // bob with bangs
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 1.8, HY + 5.6);
        ctx.bezierCurveTo(cx - HR - 2.6, HY - HR - 3, cx + HR + 2.6, HY - HR - 3, cx + HR + 1.8, HY + 5.6);
        ctx.lineTo(cx + HR - 0.4, HY + 5.2);
        ctx.lineTo(cx + HR - 0.8, HY - 1.2);
        ctx.quadraticCurveTo(cx, HY - 3.2, cx - HR + 0.8, HY - 1.2);
        ctx.lineTo(cx - HR + 0.4, HY + 5.2);
        ctx.closePath();
      });
      sheen(ctx, hair, cx - 1.4, HY - HR + 1, 4.6);
      break;
    case 6: // long straight
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 1.4, HY + 9);
        ctx.bezierCurveTo(cx - HR - 2.4, HY - HR - 3, cx + HR + 2.4, HY - HR - 3, cx + HR + 1.4, HY + 9);
        ctx.lineTo(cx + HR - 1, HY + 8);
        ctx.quadraticCurveTo(cx + HR - 0.4, HY - 1, cx + 1.4 * f, HY - 4.6);
        ctx.quadraticCurveTo(cx - HR + 0.4, HY - 1.8, cx - HR + 1, HY + 8);
        ctx.closePath();
      });
      sheen(ctx, hair, cx - 1.8, HY - HR + 1.4, 4.2);
      break;
    case 7: // ponytail front
    case 9: // bun front
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.4, HY + 1);
        ctx.bezierCurveTo(cx - HR - 1, HY - HR - 2.8, cx + HR + 1, HY - HR - 2.8, cx + HR + 0.4, HY + 1);
        ctx.quadraticCurveTo(cx + HR - 1, HY - 3.4, cx, HY - 3.8);
        ctx.quadraticCurveTo(cx - HR + 1, HY - 3.4, cx - HR - 0.4, HY + 1);
        ctx.closePath();
      });
      sheen(ctx, hair, cx - 1.2, HY - HR + 1.2, 4);
      break;
    case 8: // professor: bald crown, fluffy sides
      for (const s of [-1, 1]) {
        hairFill(ctx, hair, () => {
          ctx.beginPath();
          ctx.ellipse(cx + s * (HR - 0.6), HY - 1.8, 2.8, 4.2, s * 0.25, 0, Math.PI * 2);
        });
      }
      // shiny scalp highlight
      ctx.fillStyle = rgba('#ffffff', 0.35);
      ctx.beginPath();
      ctx.ellipse(cx - 2, HY - HR + 2.4, 2.4, 1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 10: // afro front edge
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 2.6, HY + 1.6);
        ctx.bezierCurveTo(cx - HR - 4, HY - HR - 6, cx + HR + 4, HY - HR - 6, cx + HR + 2.6, HY + 1.6);
        ctx.quadraticCurveTo(cx + HR - 1, HY - 3.2, cx, HY - 3.6);
        ctx.quadraticCurveTo(cx - HR + 1, HY - 3.2, cx - HR - 2.6, HY + 1.6);
        ctx.closePath();
      });
      break;
    case 11: // pompadour / quiff
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.3, HY + 0.6);
        ctx.bezierCurveTo(cx - HR - 1.2, HY - HR - 2, cx - 2, HY - HR - 5.8, cx + 3.4 * f, HY - HR - 4.4);
        ctx.bezierCurveTo(cx + HR + 2, HY - HR - 2.4, cx + HR + 1, HY - 2, cx + HR + 0.3, HY + 0.6);
        ctx.quadraticCurveTo(cx + HR - 1.4, HY - 3.8, cx, HY - 4.2);
        ctx.quadraticCurveTo(cx - HR + 1.2, HY - 3.8, cx - HR - 0.3, HY + 0.6);
        ctx.closePath();
      });
      sheen(ctx, hair, cx + 0.6 * f, HY - HR - 1.6, 4.8, -0.15 * f);
      break;
    default:
      break;
  }
  void female;
}

function drawBeardFront(ctx: Ctx, kind: number, hair: string, f: number) {
  const cx = 0.5 * f;
  const c = shade(hair, -0.05);
  switch (kind) {
    case 1: // full beard
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR + 0.4, HY + 0.8);
        ctx.quadraticCurveTo(cx - HR + 0.6, HY + HR + 3, cx + 0.8 * f, HY + HR + 3.4);
        ctx.quadraticCurveTo(cx + HR - 0.6, HY + HR + 3, cx + HR - 0.4, HY + 0.8);
        ctx.quadraticCurveTo(cx + 3.6, HY + 4.2, cx + 0.8 * f, HY + 4.4);
        ctx.quadraticCurveTo(cx - 3.6, HY + 4.2, cx - HR + 0.4, HY + 0.8);
        ctx.closePath();
      });
      // mouth opening
      ctx.fillStyle = '#6a2a22';
      ctx.beginPath();
      ctx.ellipse(cx + 1.2 * f, HY + 6.2, 1.5, 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 2: // moustache
      hairFill(ctx, c, () => {
        ctx.beginPath();
        const mx = cx + 1.2 * f;
        ctx.moveTo(mx, HY + 4.2);
        ctx.quadraticCurveTo(mx - 3.4, HY + 3.4, mx - 3.6, HY + 5.6);
        ctx.quadraticCurveTo(mx - 1.6, HY + 4.8, mx, HY + 5.4);
        ctx.quadraticCurveTo(mx + 1.6, HY + 4.8, mx + 3.6, HY + 5.6);
        ctx.quadraticCurveTo(mx + 3.4, HY + 3.4, mx, HY + 4.2);
        ctx.closePath();
      });
      break;
    case 3: // goatee
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(cx + 1 * f, HY + HR + 0.6, 1.8, 2.2, 0, 0, Math.PI * 2);
      });
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(cx + 1.2 * f, HY + 4.7, 2.8, 0.8, 0, 0, Math.PI * 2);
      });
      break;
    default: // stubble
      ctx.fillStyle = rgba(c, 0.28);
      ctx.beginPath();
      ctx.moveTo(cx - HR + 0.8, HY + 2);
      ctx.quadraticCurveTo(cx - HR + 1, HY + HR + 0.6, cx + 0.8 * f, HY + HR + 0.6);
      ctx.quadraticCurveTo(cx + HR - 1, HY + HR + 0.6, cx + HR - 0.8, HY + 2);
      ctx.quadraticCurveTo(cx, HY + 5, cx - HR + 0.8, HY + 2);
      ctx.fill();
  }
}

function glassesFront(ctx: Ctx, f: number) {
  const cx = 0.9 * f;
  const ey = HY + 0.8;
  ctx.strokeStyle = '#2a2320';
  ctx.lineWidth = 0.7;
  ctx.fillStyle = rgba('#dff4ff', 0.22);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * 3.1, ey, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 0.8, ey - 0.4);
  ctx.quadraticCurveTo(cx, ey - 1.2, cx + 0.8, ey - 0.4);
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.7);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(cx - 3.1, ey, 1.6, 3.6, 4.3);
  ctx.arc(cx + 3.1, ey, 1.6, 3.6, 4.3);
  ctx.stroke();
}

function drawHatFront(ctx: Ctx, o: OutfitDef, f: number) {
  const c = o.hatColor ?? o.top;
  const cx = 0.5 * f;
  switch (o.hat) {
    case 'helmet':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 1.2, HY + 0.4);
        ctx.bezierCurveTo(cx - HR - 1.6, HY - HR - 4, cx + HR + 1.6, HY - HR - 4, cx + HR + 1.2, HY + 0.4);
        ctx.closePath();
      }, 1.2, 1);
      ctx.fillStyle = shade(c, -0.3);
      ctx.fillRect(cx - HR - 1.6, HY - 0.6, HR * 2 + 3.2, 1.8);
      break;
    case 'hardhat':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(cx - HR - 0.4, HY - 1.4);
        ctx.bezierCurveTo(cx - HR - 0.6, HY - HR - 4.2, cx + HR + 0.6, HY - HR - 4.2, cx + HR + 0.4, HY - 1.4);
        ctx.closePath();
      }, 1, 0.8);
      celFill(ctx, shade(c, -0.08), () => rr(ctx, cx - HR - 2.2, HY - 2.6, HR * 2 + 4.4, 2, 1), 0.4, 0.4);
      ctx.fillStyle = rgba('#ffffff', 0.45);
      ctx.fillRect(cx - 0.6, HY - HR - 3.6, 1.2, 6);
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

// ------------------------------------------------------------------ SIDE VIEW
function drawSide(ctx: Ctx, look: Look, o: OutfitDef, p: Pose, female: boolean, skin: string, hair: string) {
  const j = sideJoints(p);
  const lc = legColor(o, skin);
  const sc = sleeveColor(o);
  const hc = handColor(o, skin);
  const bc = bootColor(o);
  const shortSleeve = o.style === 'casual' || o.style === 'dress';
  const farTone = (c: string) => shade(c, -0.22);

  drawHairBack(ctx, look.hair, hair, true, 1, o);
  if (o.style === 'space') celFill(ctx, shade(o.top, -0.1), () => rr(ctx, -8.2, -29, 5, 12, 2));
  // far arm
  if (!(p.aim && p.weapon)) {
    limbSeg(ctx, j.elR[0], j.elR[1], j.haR[0], j.haR[1], 4.2, 3.8, farTone(shortSleeve ? skin : sc));
    limbSeg(ctx, j.shR[0], j.shR[1], j.elR[0], j.elR[1], 5.0, 4.4, farTone(sc));
    hand(ctx, j.haR[0], j.haR[1], farTone(hc), 1, 0);
  }
  // far leg
  limbSeg(ctx, j.kneeR[0], j.kneeR[1], j.ankleR[0], j.ankleR[1], 4.8, 4.2, farTone(lc));
  limbSeg(ctx, j.hipR[0], j.hipR[1], j.kneeR[0], j.kneeR[1], 5.8, 5.0, farTone(o.style === 'dress' ? skin : lc));
  boot(ctx, j.ankleR[0], j.ankleR[1], true, 0, farTone(bc));
  // near leg
  limbSeg(ctx, j.kneeL[0], j.kneeL[1], j.ankleL[0], j.ankleL[1], 5.0, 4.4, lc);
  limbSeg(ctx, j.hipL[0], j.hipL[1], j.kneeL[0], j.kneeL[1], 6.0, 5.2, o.style === 'dress' ? skin : lc);
  boot(ctx, j.ankleL[0], j.ankleL[1], true, 0, bc);
  // torso
  limbSeg(ctx, 0.6, -31.6, 0.8, -28.2, 3.8, 3.8, skin);
  const bulky = o.style === 'armor' || o.style === 'space';
  const tpath = () => {
    const bw = bulky ? 1.2 : 0;
    ctx.beginPath();
    ctx.moveTo(-3.6 - bw, -29.8);
    ctx.quadraticCurveTo(1, -30.6, 4.2 + bw, -29.2);
    ctx.quadraticCurveTo(female ? 6.8 : 5.8 + bw, -25, 4.6 + bw, -20.6);
    ctx.quadraticCurveTo(4.2, -17.6, 5 + bw * 0.5, -14.2);
    ctx.quadraticCurveTo(0, -13.4, -5 - bw * 0.5, -14.2);
    ctx.quadraticCurveTo(-5.2 - bw, -20, -4.6 - bw, -25);
    ctx.quadraticCurveTo(-4.6 - bw, -28.6, -3.6 - bw, -29.8);
    ctx.closePath();
  };
  celFill(ctx, o.top, tpath, 1.4, 1);
  ctx.save();
  tpath();
  ctx.clip();
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
  if (o.style !== 'dress' && o.style !== 'robe' && o.style !== 'coat') {
    ctx.fillStyle = o.bottom;
    ctx.fillRect(-8, -15.2, 16, 3);
  }
  ctx.restore();
  tails(ctx, o, female, true);
  drawHeadSide(ctx, look, o, p, female, skin, hair);
  // near arm (with weapon)
  if (p.aim && p.weapon) {
    // two-handed aim: arm straight forward
    const sh: [number, number] = [0.4, SH_Y];
    const el: [number, number] = [6.2, SH_Y + 0.6];
    const ha: [number, number] = [11.4, SH_Y + 1];
    drawWeapon(ctx, p.weapon, ha[0], ha[1] - 0.2, p.flash);
    limbSeg(ctx, el[0], el[1], ha[0], ha[1], 4.2, 3.8, shortSleeve ? skin : sc);
    limbSeg(ctx, sh[0], sh[1], el[0], el[1], 5.2, 4.6, sc);
    hand(ctx, ha[0], ha[1], hc, 1, 1.6);
    return;
  }
  limbSeg(ctx, j.elL[0], j.elL[1], j.haL[0], j.haL[1], 4.4, 4.0, shortSleeve ? skin : sc);
  limbSeg(ctx, j.shL[0], j.shL[1], j.elL[0], j.elL[1], 5.4, 4.8, sc);
  if (o.style === 'armor' || o.style === 'space') {
    celFill(ctx, shade(o.top, 0.1), () => {
      ctx.beginPath();
      ctx.ellipse(0.6, SH_Y - 0.4, 3.8, 3.2, 0, 0, Math.PI * 2);
    }, 0.7, 0.6);
  }
  if (p.weapon && !p.aim) {
    ctx.save();
    ctx.translate(j.haL[0], j.haL[1]);
    ctx.rotate(Math.PI / 2 - 0.25);
    drawWeapon(ctx, p.weapon, 0, 0, false, 0.85);
    ctx.restore();
  }
  hand(ctx, j.haL[0], j.haL[1], hc, 1, 0);
}

function drawHeadSide(ctx: Ctx, look: Look, o: OutfitDef, p: Pose, female: boolean, skin: string, hair: string) {
  const t = tones(skin);
  const hx = 0.8;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(hx - HR + 0.6, HY);
    ctx.bezierCurveTo(hx - HR, HY - HR * 1.3, hx + HR + 0.6, HY - HR * 1.25, hx + HR - 0.2, HY - 1.4);
    // brow & nose bridge
    ctx.quadraticCurveTo(hx + HR + 0.6, HY + 0.4, hx + HR + 0.2, HY + 1.2);
    ctx.quadraticCurveTo(hx + HR + 2.4, HY + 2.8, hx + HR + 0.4, HY + 3.4);
    ctx.quadraticCurveTo(hx + HR + 0.6, HY + 5.2, hx + HR - 0.6, HY + 6);
    ctx.quadraticCurveTo(hx + 4, HY + HR + 1.2, hx - 1.4, HY + HR);
    ctx.quadraticCurveTo(hx - HR, HY + 5, hx - HR + 0.6, HY);
    ctx.closePath();
  };
  celFill(ctx, skin, path, -1.4, 1.4);
  // ear
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
  // eye
  const iris = EYE_COLORS[look.face % EYE_COLORS.length];
  eye(ctx, hx + 4.4, HY + 0.6, 0.85, iris, p, 0.9);
  // brow
  ctx.strokeStyle = shade(hair, -0.2);
  ctx.lineWidth = female ? 0.75 : 1.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx + 2.8, HY - 1.8 + (p.mouth === 'sad' ? -0.3 : 0));
  ctx.quadraticCurveTo(hx + 4.6, HY - 2.9, hx + 6.2, HY - 2 + (p.mouth === 'sad' ? 0.6 : 0));
  ctx.stroke();
  ctx.lineCap = 'butt';
  // cheek
  ctx.fillStyle = rgba('#ff6a6a', female ? 0.26 : 0.13);
  ctx.beginPath();
  ctx.ellipse(hx + 3.4, HY + 3.6, 1.7, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // mouth
  const mx = hx + HR - 1.2;
  const my = HY + 5.2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = female ? '#c2455a' : '#7a2e24';
  ctx.lineWidth = 0.8;
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
  const hideHair = o.hat === 'helmet' || o.hat === 'hood' || o.hat === 'chef' || o.hat === 'hardhat';
  if (!hideHair) drawHairSide(ctx, look.hair, hair, hx);
  if (look.beard) {
    const c = shade(hair, -0.05);
    if (look.beard === 1) {
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - 1, HY + 2);
        ctx.quadraticCurveTo(hx - 1.4, HY + HR + 2.6, hx + 3.4, HY + HR + 2.6);
        ctx.quadraticCurveTo(hx + HR + 1, HY + HR + 1, hx + HR - 0.4, HY + 4.6);
        ctx.lineTo(hx + 4, HY + 4.4);
        ctx.closePath();
      });
    } else if (look.beard === 2 || look.beard === 3) {
      hairFill(ctx, c, () => {
        ctx.beginPath();
        ctx.ellipse(hx + HR - 1, HY + 4.4, 2.2, 0.9, -0.2, 0, Math.PI * 2);
      });
      if (look.beard === 3) {
        hairFill(ctx, c, () => {
          ctx.beginPath();
          ctx.ellipse(hx + HR - 2, HY + HR, 1.4, 2, 0.2, 0, Math.PI * 2);
        });
      }
    }
  }
  if (look.glasses) {
    ctx.strokeStyle = '#2a2320';
    ctx.lineWidth = 0.7;
    ctx.fillStyle = rgba('#dff4ff', 0.22);
    ctx.beginPath();
    ctx.ellipse(hx + 4.8, HY + 0.6, 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx + 2.8, HY + 0.2);
    ctx.lineTo(hx - 1.4, HY - 0.2);
    ctx.stroke();
  }
  drawHatSide(ctx, o, hx);
}

function drawHairSide(ctx: Ctx, style: number, hair: string, hx: number) {
  switch (style) {
    case 8:
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.ellipse(hx - 3.8, HY - 1.2, 3.4, 4.4, 0.2, 0, Math.PI * 2);
      });
      return;
    case 4:
      hairFill(ctx, shade(hair, -0.25), () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR + 0.4, HY);
        ctx.bezierCurveTo(hx - HR, HY - HR - 1.2, hx + HR, HY - HR - 1.2, hx + HR - 1, HY - 2.4);
        ctx.quadraticCurveTo(hx, HY - 4.2, hx - HR + 0.4, HY);
        ctx.closePath();
      });
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.moveTo(hx - 6, HY - HR + 1);
        ctx.lineTo(hx - 3, HY - HR - 5);
        ctx.lineTo(hx + 1, HY - HR - 6);
        ctx.lineTo(hx + 4, HY - HR - 4.4);
        ctx.lineTo(hx + 5, HY - HR + 1);
        ctx.closePath();
      });
      return;
    case 10:
      hairFill(ctx, hair, () => {
        ctx.beginPath();
        ctx.ellipse(hx - 1.4, HY - 3.2, HR + 3, HR + 1.6, 0, Math.PI * 0.85, Math.PI * 2.15);
        ctx.closePath();
      });
      return;
    case 3:
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.95 + (i / 6) * Math.PI * 0.95;
        hairFill(ctx, i % 2 ? hair : shade(hair, -0.08), () => {
          ctx.beginPath();
          ctx.arc(hx - 1 + Math.cos(a) * (HR - 0.8), HY - 1.6 + Math.sin(a) * (HR - 0.6), 2.9, 0, Math.PI * 2);
        });
      }
      return;
  }
  const long = style === 5 || style === 6;
  const volume = style === 11 ? 3.6 : style === 2 ? 2.2 : style === 1 ? -0.6 : 1;
  hairFill(ctx, hair, () => {
    ctx.beginPath();
    ctx.moveTo(hx - HR - 0.8, HY + (long ? 7 : 2));
    ctx.bezierCurveTo(hx - HR - 1.6, HY - HR - 2 - volume, hx + HR + 1.6, HY - HR - 2.4 - volume * 0.6, hx + HR + 0.4, HY - 1.4);
    ctx.quadraticCurveTo(hx + 3, HY - 3.6, hx - 0.4, HY - 1.6);
    ctx.quadraticCurveTo(hx - 2.2, HY + 0.4, hx - 3, HY + (long ? 7 : 2.4));
    ctx.closePath();
  });
  sheen(ctx, hair, hx + 0.6, HY - HR + 0.8, 4.2, 0.1);
}

function drawHatSide(ctx: Ctx, o: OutfitDef, hx: number) {
  const c = o.hatColor ?? o.top;
  switch (o.hat) {
    case 'helmet':
      celFill(ctx, c, () => {
        ctx.beginPath();
        ctx.moveTo(hx - HR - 1.4, HY + 1.4);
        ctx.bezierCurveTo(hx - HR - 1.6, HY - HR - 4, hx + HR + 1.6, HY - HR - 4, hx + HR + 1.6, HY - 0.4);
        ctx.closePath();
      }, -1, 1);
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
export function drawWeapon(ctx: Ctx, w: WeaponDef, x: number, y: number, flash?: boolean, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const c = w.color;
  const t = tones(c);
  const fill = (fn: () => void, col = c) => {
    fn();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  };
  switch (w.kind) {
    case 'pistol':
    case 'laser':
      fill(() => rr(ctx, -1.6, -2.4, 9, 2.8, 0.8));
      fill(() => rr(ctx, -1, -0.2, 2.6, 4.4, 0.6), shade(c, -0.25));
      if (w.glow) {
        ctx.fillStyle = w.glow;
        ctx.fillRect(2, -1.6, 4.8, 0.9);
      }
      ctx.fillStyle = rgba('#ffffff', 0.35);
      ctx.fillRect(-1, -2.2, 7.6, 0.5);
      break;
    case 'rifle':
    case 'plasma':
    case 'shotgun':
      fill(() => rr(ctx, -4, -2.3, 18, 2.8, 0.8));
      fill(() => rr(ctx, -7.4, -1.8, 4.6, 3.8, 1.2), shade(c, -0.2));
      fill(() => rr(ctx, 0.4, -0.2, 2.2, 3.6, 0.6), shade(c, -0.3));
      if (w.kind === 'shotgun') fill(() => rr(ctx, 4, -3.2, 10, 1.2, 0.5), shade(c, 0.1));
      if (w.glow) {
        ctx.fillStyle = w.glow;
        ctx.fillRect(2, -1.8, 8, 1);
      }
      ctx.fillStyle = rgba('#ffffff', 0.3);
      ctx.fillRect(-3.4, -2.1, 16, 0.5);
      break;
    case 'heavy':
      fill(() => rr(ctx, -5, -3.4, 19, 5.6, 1.6));
      ctx.fillStyle = shade(c, 0.2);
      for (let i = 0; i < 3; i++) ctx.fillRect(10, -2.6 + i * 1.6, 7, 1);
      if (w.glow) {
        ctx.fillStyle = w.glow;
        ctx.fillRect(-2, -1, 9, 1.2);
      }
      break;
    case 'sling':
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -1);
      ctx.lineTo(-1.8, -4.4);
      ctx.moveTo(0, -1);
      ctx.lineTo(1.8, -4.4);
      ctx.stroke();
      break;
    case 'guitar':
      fill(() => {
        ctx.beginPath();
        ctx.ellipse(-2, 0, 4.4, 3.2, 0, 0, Math.PI * 2);
      });
      fill(() => rr(ctx, 1, -0.7, 11, 1.4, 0.5), '#3a2a20');
      break;
    case 'blade':
      fill(() => rr(ctx, -2.4, -0.9, 3.4, 1.8, 0.5), '#3a2a20');
      fill(() => {
        ctx.beginPath();
        ctx.moveTo(1, -1.2);
        ctx.lineTo(9, -0.4);
        ctx.lineTo(1, 1.1);
        ctx.closePath();
      });
      break;
    default:
      fill(() => rr(ctx, -1, -0.8, 11, 1.6, 0.6), '#6b4a32');
      fill(() => rr(ctx, 7.4, -2.8, 3.8, 5.6, 1));
  }
  if (flash) {
    const fx = w.kind === 'pistol' || w.kind === 'laser' ? 8.4 : w.kind === 'heavy' ? 18 : 14.5;
    ctx.globalCompositeOperation = 'lighter';
    const col = w.glow ?? '#ffd46a';
    const g = ctx.createRadialGradient(fx, -0.9, 0, fx, -0.9, 6);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.3, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 6, -7, 12, 12);
  }
  ctx.restore();
}

/** Cheap silhouette for far zoom levels. */
export function drawCharacterLOD(ctx: Ctx, look: Look, outfit: OutfitDef, child: boolean) {
  const s = (child ? 0.68 : 1) * 0.92;
  ctx.fillStyle = outfit.bottom;
  ctx.fillRect(-4.6 * s, -16 * s, 9.2 * s, 16 * s);
  ctx.fillStyle = outfit.top;
  ctx.fillRect(-7 * s, -30 * s, 14 * s, 15 * s);
  ctx.fillStyle = SKIN_TONES[look.skin % SKIN_TONES.length];
  ctx.beginPath();
  ctx.arc(0, -38 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  ctx.fillRect(-8 * s, -47 * s, 16 * s, 5 * s);
}
