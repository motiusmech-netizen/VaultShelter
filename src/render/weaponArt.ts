/*
 * Weapons: individual art for every weapon, how it is held, what it fires.
 * Weapon-local space: the main hand grips at (0,0), the weapon points along +x, up is -y.
 * Melee weapons extend from the fist along +x (handle behind, head ahead).
 */
import type { WeaponDef } from '../data/items';
import { rgba, shade, type Ctx } from './gfx';

export type Grip = 'pistol' | 'rifle' | 'hip' | 'shoulder' | 'melee1' | 'melee2' | 'blade' | 'sling' | 'guitar' | 'fist';
export type Shot =
  | 'bullet'
  | 'pellets'
  | 'nail'
  | 'pebble'
  | 'bolt'
  | 'harpoon'
  | 'laser'
  | 'cryo'
  | 'plasma'
  | 'gauss'
  | 'tesla'
  | 'flame'
  | 'sonic'
  | 'rocket'
  | 'flare'
  | 'foam'
  | 'melee';
export type WeaponSfx = 'foam' | 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'laser' | 'plasma' | 'gauss' | 'tesla' | 'flame' | 'rocket' | 'swing' | 'twang' | 'nail' | 'guitar' | 'flare' | 'cryo';

export interface WeaponProfile {
  grip: Grip;
  shot: Shot;
  /** attacks per second */
  rate: number;
  /** projectiles per attack (bursts / pellets) */
  burst: number;
  /** muzzle (or striking head) in weapon space */
  muzzle: [number, number];
  /** where the supporting hand holds the weapon */
  support: [number, number];
  sfx: WeaponSfx;
  /** art; k = attack phase 0..1 for animated parts (string pull, spinning barrels) */
  draw: (ctx: Ctx, w: WeaponDef, t: number, k: number) => void;
  /** icon framing: horizontal extent in weapon space */
  span: [number, number];
}

// ---------------------------------------------------------------- palette & helpers
const GUN = '#3b4148';
const GUN_D = '#23272c';
const STEEL = '#a9b3bb';
const WOOD = '#8a5530';
const WOOD_D = '#5e3a20';
const BRASS = '#c9a44a';
const RUBBER = '#26282b';
const LINE = '#15181b';

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.lineTo(x + w - q, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + q);
  ctx.lineTo(x + w, y + h - q);
  ctx.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  ctx.lineTo(x + q, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - q);
  ctx.lineTo(x, y + q);
  ctx.quadraticCurveTo(x, y, x + q, y);
  ctx.closePath();
}

/** Fill the current path and outline it. */
function paint(ctx: Ctx, color: string, lw = 0.45) {
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = LINE;
  ctx.stroke();
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, r = 0.5) {
  rr(ctx, x, y, w, h, r);
  paint(ctx, color);
  // top light, bottom shade
  ctx.fillStyle = rgba(shade(color, 0.55), 0.45);
  ctx.fillRect(x + 0.4, y + 0.3, w - 0.8, Math.min(0.55, h * 0.25));
  ctx.fillStyle = rgba(shade(color, -0.5), 0.35);
  ctx.fillRect(x + 0.4, y + h - Math.min(0.6, h * 0.25) - 0.2, w - 0.8, Math.min(0.6, h * 0.25));
}

function poly(ctx: Ctx, pts: number[], color: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  paint(ctx, color);
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  paint(ctx, color);
}

function glowDot(ctx: Ctx, x: number, y: number, r: number, color: string, a = 0.8) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba('#ffffff', a));
  g.addColorStop(0.35, rgba(color, a * 0.8));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function lines(ctx: Ctx, color: string, lw: number, segs: number[][]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (const s of segs) {
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(s[2], s[3]);
  }
  ctx.stroke();
}

/** Pistol grip under the hand, angled back. */
function pistolGrip(ctx: Ctx, color: string, h = 5) {
  poly(ctx, [-1.6, -1, 1.4, -1, 0.9, h - 0.6, -1.8, h, -2.4, h - 1], color);
  ctx.strokeStyle = rgba('#000000', 0.3);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-1.4, 0.6 + i * 1.2);
    ctx.lineTo(0.6, 0.4 + i * 1.2);
  }
  ctx.stroke();
}

function trigger(ctx: Ctx, x = 1.9) {
  ctx.strokeStyle = GUN_D;
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.arc(x, -0.2, 1.2, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 0.2, -0.9);
  ctx.quadraticCurveTo(x + 0.3, 0.1, x - 0.4, 0.5);
  ctx.stroke();
}

function stock(ctx: Ctx, color: string, x0: number, x1: number, y: number) {
  // butt stock from the receiver back to the shoulder
  poly(ctx, [x1, y - 1.4, x1, y + 1.2, x0 + 2, y + 3.4, x0, y + 3.6, x0, y - 1.2, x0 + 2, y - 1.6], color);
  ctx.fillStyle = RUBBER;
  ctx.fillRect(x0 - 0.6, y - 1.2, 0.8, 4.8);
}

// ---------------------------------------------------------------- art per weapon
const ART: Record<string, WeaponProfile['draw']> = {
  w_spoon(ctx) {
    box(ctx, -2.2, -0.7, 12, 1.4, '#c7cfd6', 0.7);
    for (let i = 0; i < 3; i++) box(ctx, -1.6 + i * 1.6, -0.9, 0.8, 1.8, '#d9433a', 0.2);
    ctx.beginPath();
    ctx.ellipse(13, 0, 3.6, 2.5, 0, 0, Math.PI * 2);
    paint(ctx, '#d5dce2');
    ctx.beginPath();
    ctx.ellipse(13.3, 0.2, 2.6, 1.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8f99a2';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(12, -1.4, 1.6, 0.5);
  },
  w_rollpin(ctx) {
    box(ctx, -3, -0.7, 3.2, 1.4, WOOD_D, 0.6);
    box(ctx, 13.4, -0.7, 3.2, 1.4, WOOD_D, 0.6);
    box(ctx, 0, -1.9, 13.6, 3.8, '#c9965a', 1.8);
    ctx.strokeStyle = rgba('#7a5230', 0.5);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(1, -0.6);
    ctx.quadraticCurveTo(6, -1.2, 12.5, -0.4);
    ctx.moveTo(1.5, 0.8);
    ctx.quadraticCurveTo(7, 0.4, 12, 1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [x, y] of [
      [3, -1.2],
      [7.5, 0.6],
      [10.4, -0.9],
      [5.2, 1.1],
    ])
      ctx.fillRect(x, y, 0.6, 0.5);
  },
  w_sling(ctx, _w, _t, k) {
    // fork held upright is drawn with +x up in the grip; band pulled back by k
    box(ctx, -1.5, -0.8, 5.5, 1.6, '#8a5a30', 0.7);
    ctx.strokeStyle = '#8a5a30';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(3.8, 0);
    ctx.quadraticCurveTo(5.5, -0.4, 7.6, -2.8);
    ctx.moveTo(3.8, 0);
    ctx.quadraticCurveTo(5.5, 0.4, 7.6, 2.8);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // band pulled back towards the shooter (-y is "back" once the fork stands upright)
    const pull = 1.2 + k * 5;
    ctx.strokeStyle = '#c0453a';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(7.6, -2.8);
    ctx.lineTo(6.8, -2.8 - pull);
    ctx.lineTo(7.6, 2.8);
    ctx.stroke();
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(6.1, -3.6 - pull, 1.4, 1.6);
  },
  w_wrench(ctx) {
    box(ctx, -2, -1.1, 6.5, 2.2, '#c8413a', 1);
    box(ctx, 4, -0.9, 8.5, 1.8, '#8f9aa4', 0.4);
    // jaw
    poly(ctx, [12, -1.6, 15.8, -2.6, 16.4, -1.2, 13.6, -0.6, 13.6, 0.8, 16.4, 1.4, 15.8, 2.6, 12, 1.6], '#9aa6b0');
    // adjusting nut
    box(ctx, 11.3, -1.9, 1.6, 3.8, '#6d7780', 0.3);
    lines(ctx, rgba('#000000', 0.35), 0.25, [
      [11.7, -1.8, 11.7, 1.8],
      [12.3, -1.8, 12.3, 1.8],
    ]);
  },
  w_knife(ctx) {
    box(ctx, -3, -1, 4.4, 2, '#2c2f33', 0.8);
    circle(ctx, -1.8, 0, 0.35, '#c9d2d9');
    circle(ctx, -0.2, 0, 0.35, '#c9d2d9');
    box(ctx, 1.2, -1.3, 0.8, 2.6, '#8f99a2', 0.2);
    poly(ctx, [2, -1.1, 9.5, -0.9, 12.2, 0.3, 2, 1.1], '#dfe5ea');
    lines(ctx, 'rgba(255,255,255,0.9)', 0.3, [[2.4, 0.8, 11.5, 0.4]]);
  },
  w_bat(ctx) {
    ctx.beginPath();
    ctx.moveTo(-2.4, -1.4);
    ctx.lineTo(-1.8, -0.8);
    ctx.lineTo(5, -0.8);
    ctx.quadraticCurveTo(12, -1.4, 19, -2.3);
    ctx.quadraticCurveTo(21, -2.2, 21, 0);
    ctx.quadraticCurveTo(21, 2.2, 19, 2.3);
    ctx.quadraticCurveTo(12, 1.4, 5, 0.8);
    ctx.lineTo(-1.8, 0.8);
    ctx.lineTo(-2.4, 1.4);
    ctx.closePath();
    paint(ctx, '#d6a868');
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.fillRect(6, -1.3, 13, 0.5);
    for (let i = 0; i < 4; i++) box(ctx, -1.6 + i * 1.3, -0.95, 0.9, 1.9, '#2c2f33', 0.2);
    ctx.fillStyle = '#c0453a';
    ctx.fillRect(12.5, -1.6, 1, 3.2);
  },
  w_pipe(ctx) {
    pistolGrip(ctx, WOOD);
    box(ctx, -2.4, -3.2, 6, 2.6, '#6d5a48', 0.5);
    box(ctx, 3.2, -3, 8.6, 2, '#7d8286', 0.9);
    box(ctx, 6.2, -3.4, 1.4, 2.8, '#5c6166', 0.3);
    box(ctx, -3, -3.6, 1.6, 1.4, GUN_D, 0.3);
    trigger(ctx);
  },
  w_air(ctx) {
    stock(ctx, '#7d5a36', -9, 0, -1.2);
    box(ctx, -0.5, -2.8, 7.5, 3, '#4f6b45', 0.6);
    pistolGrip(ctx, '#7d5a36', 3.6);
    box(ctx, 7, -2.4, 13, 1.1, GUN, 0.4);
    box(ctx, 8, -1.4, 7, 1.4, '#6b4a2a', 0.5);
    box(ctx, 19.2, -2.9, 0.8, 0.7, GUN_D, 0.1);
    trigger(ctx);
  },
  w_revolver(ctx) {
    pistolGrip(ctx, '#7a4a2a', 5.2);
    box(ctx, -1.8, -3.4, 4.2, 2.8, '#59626b', 0.6);
    box(ctx, 1.8, -3.6, 3.6, 3.2, '#6d7680', 1);
    lines(ctx, rgba('#000000', 0.35), 0.3, [
      [2.8, -3.4, 2.8, -0.6],
      [4.1, -3.4, 4.1, -0.6],
    ]);
    box(ctx, 5.2, -3.2, 7, 1.6, '#5c6670', 0.5);
    box(ctx, 5.2, -1.7, 4, 0.8, '#4a535b', 0.3);
    box(ctx, 11.2, -3.9, 0.7, 0.8, GUN_D, 0.1);
    poly(ctx, [-2, -3.4, -3.2, -4.6, -2.8, -3.1], GUN_D);
    trigger(ctx, 1.5);
  },
  w_hunting(ctx) {
    stock(ctx, WOOD, -9, 1, -1);
    box(ctx, 1, -2.6, 7, 2.8, GUN, 0.5);
    pistolGrip(ctx, WOOD, 3.6);
    box(ctx, 5, -1.4, 9, 1.8, WOOD, 0.8);
    box(ctx, 8, -2.4, 13.4, 1.2, GUN_D, 0.4);
    // scope
    box(ctx, 2.2, -5.2, 9, 1.8, '#2a2f35', 0.9);
    box(ctx, 1.6, -5.5, 1.4, 2.4, '#3a4148', 0.5);
    box(ctx, 10.2, -5.5, 1.4, 2.4, '#3a4148', 0.5);
    ctx.fillStyle = 'rgba(140,210,255,0.8)';
    ctx.fillRect(11.4, -5, 0.3, 1.2);
    lines(ctx, GUN_D, 0.6, [
      [4, -3.4, 4, -2.6],
      [8, -3.4, 8, -2.6],
    ]);
    // bolt
    box(ctx, 3, -3.2, 1, 0.8, STEEL, 0.2);
    circle(ctx, 3.5, -3.8, 0.55, STEEL);
    trigger(ctx);
  },
  w_shotgun(ctx) {
    stock(ctx, '#6b4b32', -9, 1, -1);
    box(ctx, 1, -2.7, 5, 3, '#6d7680', 0.5);
    pistolGrip(ctx, '#6b4b32', 3.6);
    box(ctx, 6, -3.2, 13.6, 1.4, GUN, 0.6);
    box(ctx, 6, -1.8, 13.6, 1.4, GUN, 0.6);
    box(ctx, 6.5, -0.6, 7, 1.6, '#6b4b32', 0.7);
    lines(ctx, rgba('#ffffff', 0.25), 0.3, [[7, -3, 19, -3]]);
    ctx.fillStyle = '#0e1012';
    ctx.fillRect(19.3, -3, 0.4, 1);
    ctx.fillRect(19.3, -1.6, 0.4, 1);
    trigger(ctx);
  },
  w_smg(ctx) {
    stock(ctx, WOOD, -8, 0, -1);
    box(ctx, -0.5, -2.8, 8.5, 3, GUN, 0.6);
    pistolGrip(ctx, WOOD, 3.8);
    // drum magazine
    circle(ctx, 5.5, 2.4, 2.8, '#2c3136');
    circle(ctx, 5.5, 2.4, 1.2, '#4a5158');
    // finned barrel
    box(ctx, 8, -2.6, 8.5, 1.6, '#4a5158', 0.5);
    ctx.fillStyle = '#2a2f34';
    for (let x = 8.6; x < 15.5; x += 1.1) ctx.fillRect(x, -2.9, 0.5, 2.2);
    // front grip
    poly(ctx, [10, -1, 11.6, -1, 11.4, 2.6, 10.3, 2.6], WOOD);
    box(ctx, 16.2, -2.4, 1.2, 1.2, GUN_D, 0.2);
    trigger(ctx);
  },
  w_nailgun(ctx) {
    pistolGrip(ctx, RUBBER, 4.6);
    ctx.beginPath();
    ctx.moveTo(-2.6, -4.2);
    ctx.lineTo(6, -4.2);
    ctx.quadraticCurveTo(8.6, -4, 9.2, -2);
    ctx.lineTo(9.2, -0.4);
    ctx.lineTo(-1.8, -0.6);
    ctx.quadraticCurveTo(-3.2, -1.6, -2.6, -4.2);
    ctx.closePath();
    paint(ctx, '#e3b33d');
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(-1.6, -3.9, 7, 0.5);
    box(ctx, 9, -2.6, 1.8, 2.2, '#3a3f45', 0.4);
    // slanted nail strip
    poly(ctx, [7.4, -0.4, 8.6, -0.4, 4.2, 4.6, 3, 4.6], '#8f99a2');
    ctx.fillStyle = '#26282b';
    ctx.fillRect(0, -2.6, 4.5, 0.6);
    trigger(ctx, 1.4);
  },
  w_laserp(ctx, w, t) {
    pistolGrip(ctx, '#3a2a2a', 4.8);
    // bulbous retro body
    ctx.beginPath();
    ctx.moveTo(-2.6, -2.2);
    ctx.bezierCurveTo(-2.6, -5.4, 5, -5.6, 6.4, -3.2);
    ctx.lineTo(6.4, -1);
    ctx.bezierCurveTo(4, 0.2, -1, 0.4, -2.6, -2.2);
    ctx.closePath();
    paint(ctx, '#c9d2da');
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.fillRect(-1, -4.4, 5, 0.6);
    // rings and fins
    for (const x of [6.8, 8.2, 9.6]) box(ctx, x, -3.6, 0.9, 3, '#8f99a2', 0.3);
    poly(ctx, [1, -4.6, 3, -6.8, 4, -4.6], '#c8413a');
    // emitter dish
    ctx.beginPath();
    ctx.moveTo(10.6, -4.4);
    ctx.lineTo(12, -5.2);
    ctx.lineTo(12, 0.2);
    ctx.lineTo(10.6, -0.6);
    ctx.closePath();
    paint(ctx, '#e8edf1');
    // glowing coil window
    const pulse = 0.6 + 0.4 * Math.sin(t * 8);
    box(ctx, 0.4, -2.9, 4.4, 1.2, '#5a1010', 0.5);
    glowDot(ctx, 2.6, -2.3, 3, w.glow ?? '#ff4b4b', 0.5 * pulse);
    trigger(ctx, 1.2);
  },
  w_sledge(ctx) {
    box(ctx, -3, -0.9, 20.5, 1.8, '#a07844', 0.8);
    for (let i = 0; i < 3; i++) box(ctx, -2.4 + i * 1.4, -1.05, 1, 2.1, RUBBER, 0.2);
    box(ctx, 16, -3.6, 5.8, 7.2, '#646e77', 0.6);
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.fillRect(16.4, -3.2, 5, 0.6);
    box(ctx, 21.4, -3.2, 0.9, 6.4, '#8a939b', 0.2);
    lines(ctx, rgba('#000000', 0.3), 0.3, [[18.8, -3.2, 18.8, 3.2]]);
  },
  w_lasr(ctx, w, t) {
    stock(ctx, '#5b646d', -9, 0, -1);
    ctx.beginPath();
    ctx.moveTo(-0.5, -3.2);
    ctx.lineTo(14, -3.2);
    ctx.quadraticCurveTo(16, -2.6, 16, -1.4);
    ctx.lineTo(16, 0.4);
    ctx.lineTo(-0.5, 0.4);
    ctx.closePath();
    paint(ctx, '#8c969f');
    pistolGrip(ctx, '#3a3f45', 3.8);
    const pulse = 0.55 + 0.45 * Math.sin(t * 7);
    box(ctx, 2, -2.4, 10, 1, '#4a0e0e', 0.4);
    glowDot(ctx, 7, -1.9, 5, w.glow ?? '#ff4b4b', 0.45 * pulse);
    ctx.fillStyle = rgba(w.glow ?? '#ff4b4b', 0.9);
    ctx.fillRect(2.4, -2.1, 9.2 * pulse, 0.4);
    box(ctx, 16, -2.6, 4.6, 1.8, '#5b646d', 0.5);
    for (const x of [17, 18.2, 19.4]) lines(ctx, '#2a3036', 0.4, [[x, -2.6, x, -0.8]]);
    circle(ctx, 21, -1.7, 1.1, '#d6dde3');
    glowDot(ctx, 21, -1.7, 2.2, w.glow ?? '#ff4b4b', 0.35);
    box(ctx, 3, -4.6, 6, 1.4, '#3a3f45', 0.5);
    trigger(ctx);
  },
  w_crossbow(ctx, _w, _t, k) {
    stock(ctx, '#6e4d2c', -8, 1, -1);
    box(ctx, 0, -2.2, 15, 2.2, '#6e4d2c', 0.6);
    pistolGrip(ctx, '#5a3a20', 3.6);
    // limbs (drawn edge-on as a vertical arc at the front)
    ctx.strokeStyle = '#3a3f45';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(12.6, -8);
    ctx.quadraticCurveTo(15.4, -1.1, 12.6, 5.8);
    ctx.stroke();
    // string pulled back to the nut (released when k>0.5)
    const nock = k > 0.1 && k < 0.6 ? 12 : 5.6;
    ctx.strokeStyle = '#e8e2d0';
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(12.6, -8);
    ctx.lineTo(nock, -1.1);
    ctx.lineTo(12.6, 5.8);
    ctx.stroke();
    // loaded bolt
    if (!(k > 0.1 && k < 0.6)) {
      box(ctx, 5.6, -1.6, 10.6, 0.7, '#c9a24a', 0.2);
      poly(ctx, [16.2, -2, 17.8, -1.25, 16.2, -0.5], STEEL);
      ctx.fillStyle = '#c0453a';
      ctx.fillRect(5.6, -2.1, 1.6, 0.5);
    }
    trigger(ctx);
  },
  w_plasma(ctx, w, t) {
    stock(ctx, '#3f4a45', -9, 0, -1);
    box(ctx, -0.5, -3, 11, 3.4, '#4f5d58', 0.9);
    pistolGrip(ctx, '#2a302d', 3.8);
    // glass chamber with glowing plasma
    const g = w.glow ?? '#6aff8c';
    box(ctx, 2, -5.4, 7, 2.2, '#20302a', 1);
    const pulse = 0.6 + 0.4 * Math.sin(t * 9);
    glowDot(ctx, 5.5, -4.3, 4.6, g, 0.6 * pulse);
    ctx.fillStyle = rgba(g, 0.85);
    ctx.fillRect(2.6, -4.7, 5.8 * (0.7 + 0.3 * pulse), 0.8);
    // barrel with cooling rings
    box(ctx, 10.5, -2.4, 8, 1.6, '#3a4540', 0.6);
    for (const x of [11.5, 13, 14.5, 16]) box(ctx, x, -3, 0.8, 2.8, '#6b7a73', 0.3);
    circle(ctx, 19.2, -1.6, 1.3, '#1b2a22');
    glowDot(ctx, 19.2, -1.6, 2.6, g, 0.5 * pulse);
    trigger(ctx);
  },
  w_gauss(ctx, w, t) {
    stock(ctx, '#3a424a', -9, 0, -1);
    box(ctx, -0.5, -3, 8, 3.4, '#46505a', 0.6);
    pistolGrip(ctx, RUBBER, 3.8);
    box(ctx, 1, -5, 5, 1.8, '#2e353c', 0.6);
    const g = w.glow ?? '#5fd3ff';
    const pulse = 0.5 + 0.5 * Math.sin(t * 10);
    box(ctx, 7.5, -2.2, 14.5, 1.2, '#2a3036', 0.3);
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 2.2;
      box(ctx, x, -3.4, 1.4, 3.6, '#b8743a', 0.5);
      glowDot(ctx, x + 0.7, -1.6, 1.8, g, 0.3 * pulse);
    }
    box(ctx, 21.5, -2.8, 1.6, 2.4, '#5b646d', 0.4);
    trigger(ctx);
  },
  w_tesla(ctx, w, t) {
    // hip-fired: rear grip at the hand, carrying handle on top
    box(ctx, -5, -4, 16, 6, '#5b6470', 1.6);
    pistolGrip(ctx, RUBBER, 4);
    ctx.strokeStyle = '#3a4148';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(1, -4);
    ctx.quadraticCurveTo(5, -8.2, 9, -4);
    ctx.stroke();
    // copper windings
    for (let i = 0; i < 7; i++) box(ctx, 11 + i * 1.3, -3.2, 0.9, 4.4, '#c47a3a', 0.3);
    box(ctx, 10.5, -1.4, 10, 0.8, '#3a3f45', 0.2);
    // coil sphere
    circle(ctx, 22.2, -1, 2.6, '#c9d2da');
    const g = w.glow ?? '#8fd8ff';
    glowDot(ctx, 22.2, -1, 5 + Math.sin(t * 17) * 0.8, g, 0.5);
    // flickering arcs
    ctx.strokeStyle = rgba('#e8f8ff', 0.8);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      const a = t * 23 + i * 2.7;
      ctx.moveTo(22.2, -1);
      ctx.lineTo(22.2 + Math.cos(a) * 2, -1 + Math.sin(a * 1.3) * 2);
      ctx.lineTo(22.2 + Math.cos(a + 0.6) * 3.6, -1 + Math.sin(a) * 3.4);
    }
    ctx.stroke();
    ctx.fillStyle = '#f2b632';
    ctx.fillRect(-3, -3, 5, 1);
  },
  w_hammer(ctx, _w, t) {
    box(ctx, -3, -1, 19, 2, '#3a2a1e', 0.9);
    for (let i = 0; i < 4; i++) box(ctx, -2.4 + i * 1.3, -1.2, 0.8, 2.4, BRASS, 0.2);
    box(ctx, 15.2, -1.6, 1.6, 3.2, BRASS, 0.3);
    box(ctx, 16.4, -4.6, 6.4, 9.2, '#c79a3d', 1.2);
    box(ctx, 17.4, -3.6, 4.4, 7.2, '#8a6a2a', 0.8);
    // atom emblem
    ctx.strokeStyle = '#ffe38a';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.ellipse(19.6, 0, 1.9, 0.8, 0.6, 0, Math.PI * 2);
    ctx.ellipse(19.6, 0, 1.9, 0.8, -0.6, 0, Math.PI * 2);
    ctx.stroke();
    glowDot(ctx, 19.6, 0, 2.6, '#ffcf4a', 0.35 + 0.15 * Math.sin(t * 4));
  },
  w_guitar(ctx, w) {
    // body centred at the hand, neck along +x
    ctx.beginPath();
    ctx.moveTo(-6.5, 0);
    ctx.bezierCurveTo(-6.5, -4.8, -2.5, -4.6, -1.2, -3);
    ctx.bezierCurveTo(0.4, -4.4, 3.6, -4.2, 3.4, -1.6);
    ctx.bezierCurveTo(3.4, 0.2, 2.8, 1.4, 3.2, 2.6);
    ctx.bezierCurveTo(3.6, 4.8, -0.4, 5, -1.6, 3.6);
    ctx.bezierCurveTo(-3, 5.2, -6.5, 4.6, -6.5, 0);
    ctx.closePath();
    paint(ctx, w.color);
    ctx.beginPath();
    ctx.moveTo(-4.2, 1.6);
    ctx.bezierCurveTo(-4.8, -2, -1.4, -2.8, 0.8, -1.4);
    ctx.lineTo(0.4, 2.6);
    ctx.closePath();
    ctx.fillStyle = '#f4efe6';
    ctx.fill();
    box(ctx, -3.6, -1.6, 0.8, 3.2, '#2a2d31', 0.2);
    box(ctx, -1.8, -1.6, 0.8, 3.2, '#2a2d31', 0.2);
    // neck and headstock
    box(ctx, 3, -0.8, 14, 1.6, '#6b4428', 0.3);
    ctx.fillStyle = '#d9c9a0';
    for (let x = 5; x < 16.5; x += 1.6) ctx.fillRect(x, -0.8, 0.25, 1.6);
    poly(ctx, [17, -1.2, 20.6, -1.8, 20.6, 1.6, 17, 1.2], '#2a2d31');
    for (const x of [18, 19.2]) {
      circle(ctx, x, -2, 0.4, STEEL);
      circle(ctx, x, 1.9, 0.4, STEEL);
    }
    lines(ctx, rgba('#ffffff', 0.7), 0.15, [
      [-3, -0.4, 17, -0.4],
      [-3, 0.4, 17, 0.4],
    ]);
  },
  w_ladle(ctx, _w, t) {
    box(ctx, -2.4, -0.8, 12.6, 1.6, '#ffcf4a', 0.8);
    ctx.beginPath();
    ctx.arc(13.4, 0.6, 3.6, -0.3, Math.PI + 0.3);
    ctx.closePath();
    paint(ctx, '#f2c230');
    ctx.fillStyle = '#b8861a';
    ctx.beginPath();
    ctx.ellipse(13.4, 0.2, 3.2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    glowDot(ctx, 11 + Math.sin(t * 3) * 3, -0.2, 2.2, '#fff4b0', 0.55);
  },
  w_minigun(ctx, _w, t, k) {
    box(ctx, -5, -4.2, 11, 7, '#3a4148', 1.4);
    pistolGrip(ctx, RUBBER, 4);
    ctx.strokeStyle = '#2a2f34';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1, -4.2);
    ctx.quadraticCurveTo(2.5, -8, 6, -4.2);
    ctx.stroke();
    // ammo belt
    ctx.fillStyle = BRASS;
    for (let i = 0; i < 5; i++) ctx.fillRect(-5 - i * 1.2, 1 + i * 0.9, 1, 1.6);
    // barrel cluster, spinning while firing
    box(ctx, 6, -3.4, 3, 5.6, '#2a2f34', 0.6);
    const spin = t * (k > 0 ? 40 : 2);
    for (let i = 0; i < 3; i++) {
      const y = -2.4 + ((i + (spin % 1)) % 3) * 1.6;
      box(ctx, 9, y, 17, 1.1, i % 2 ? '#5c6670' : '#474f58', 0.4);
    }
    box(ctx, 14, -3.2, 1.2, 5.2, '#23272c', 0.3);
    box(ctx, 24.5, -3.2, 1.4, 5.2, '#23272c', 0.3);
  },
  // ---- new weapons
  w_crowbar(ctx) {
    box(ctx, -2.6, -0.8, 16, 1.6, '#b8322a', 0.8);
    ctx.strokeStyle = '#1e2126';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.quadraticCurveTo(17, 0, 16.6, -3.4);
    ctx.stroke();
    ctx.lineCap = 'butt';
    poly(ctx, [-2.6, -0.8, -4.4, -1.6, -4, 0.8, -2.6, 0.8], '#1e2126');
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.fillRect(-1.6, -0.6, 13, 0.35);
  },
  w_flare(ctx) {
    pistolGrip(ctx, '#e8661e', 5);
    box(ctx, -2.4, -3.6, 5.4, 3.2, '#f27a24', 0.8);
    box(ctx, 2.6, -4, 7, 3.6, '#f28a34', 1.6);
    circle(ctx, 9.6, -2.2, 1.3, '#3a2a1a');
    box(ctx, 3.4, -4.4, 3, 0.8, '#fff0d8', 0.3);
    trigger(ctx, 1.2);
  },
  w_machete(ctx) {
    box(ctx, -3, -1.1, 4.2, 2.2, '#5a3a20', 0.8);
    box(ctx, 1, -1.4, 0.8, 2.8, '#3a3f45', 0.2);
    ctx.beginPath();
    ctx.moveTo(1.8, -1.1);
    ctx.lineTo(13, -1.4);
    ctx.quadraticCurveTo(16.4, -1.2, 16.6, 0.4);
    ctx.quadraticCurveTo(12, 1.6, 1.8, 1.1);
    ctx.closePath();
    paint(ctx, '#c9d2d9');
    lines(ctx, 'rgba(255,255,255,0.85)', 0.3, [[2.2, 0.8, 15.4, 0.6]]);
    ctx.fillStyle = rgba('#7a4a2a', 0.35);
    ctx.fillRect(5, -0.8, 2, 0.8);
  },
  w_harpoon(ctx, _w, _t, k) {
    stock(ctx, '#3a4a5a', -8, 0, -1);
    box(ctx, -0.5, -2.8, 20, 2.2, '#2f5a7a', 1);
    pistolGrip(ctx, RUBBER, 3.8);
    // rope reel
    circle(ctx, 4, 1.6, 1.8, '#c9b78a');
    circle(ctx, 4, 1.6, 0.6, '#6b5a3a');
    if (!(k > 0.1 && k < 0.7)) {
      box(ctx, 8, -3.4, 16, 0.6, STEEL, 0.2);
      poly(ctx, [24, -4.2, 26.4, -3.1, 24, -2], '#dfe5ea');
      poly(ctx, [23, -3.6, 21.8, -4.8, 22.4, -3.4], '#dfe5ea');
    }
    trigger(ctx);
  },
  w_flamer(ctx, _w, t) {
    // brass samovar tank on the side, pilot flame at the nozzle
    box(ctx, -5, -2.4, 9, 4, '#5b4a32', 1.2);
    pistolGrip(ctx, RUBBER, 4);
    ctx.beginPath();
    ctx.moveTo(-3.6, -3);
    ctx.bezierCurveTo(-4.6, -8.5, 4.6, -8.5, 3.6, -3);
    ctx.closePath();
    paint(ctx, BRASS);
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(-2, -7, 1, 3);
    box(ctx, -1, -9.2, 2, 1.4, '#8a6a2a', 0.4);
    circle(ctx, 0, -9.8, 0.8, '#3a2a1a');
    box(ctx, 4, -1.8, 13, 1.8, '#6d6358', 0.6);
    for (const x of [7, 10, 13]) box(ctx, x, -2.3, 0.8, 2.8, BRASS, 0.2);
    box(ctx, 17, -2.4, 3, 3, '#3a3f45', 0.6);
    const f = 0.8 + 0.3 * Math.sin(t * 30);
    glowDot(ctx, 21, -0.9, 2.2 * f, '#ff8a2a', 0.8);
    glowDot(ctx, 21.4, -1, 1.1, '#9ad0ff', 0.6);
  },
  w_cryo(ctx, w, t) {
    pistolGrip(ctx, '#e8eef4', 4.8);
    box(ctx, -2.6, -4, 9, 3.6, '#f4f8fb', 1.6);
    // frosted canister
    box(ctx, -1, -6.6, 5, 2.6, '#bfe9ff', 1.2);
    const g = w.glow ?? '#8fe8ff';
    glowDot(ctx, 1.5, -5.3, 3.4, g, 0.4 + 0.2 * Math.sin(t * 5));
    box(ctx, 6.2, -3.4, 4.6, 2.4, '#9fb3c4', 0.8);
    for (const x of [7, 8.4, 9.8]) lines(ctx, '#e8f8ff', 0.4, [[x, -3.4, x, -1]]);
    circle(ctx, 11.4, -2.2, 1.1, '#e8f8ff');
    glowDot(ctx, 11.4, -2.2, 2.4, g, 0.5);
    ctx.fillStyle = '#ff86c4';
    ctx.fillRect(-1.8, -3.4, 2.4, 0.8);
    trigger(ctx, 1.4);
  },
  w_saber(ctx, w, t) {
    box(ctx, -3.4, -1, 4.2, 2, '#1e2a4a', 0.8);
    for (let i = 0; i < 3; i++) box(ctx, -3 + i * 1.3, -1.1, 0.5, 2.2, BRASS, 0.1);
    // star guard
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 1.1 : 2.6;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(1.3 + Math.cos(a) * r * 0.55, Math.sin(a) * r);
    }
    ctx.closePath();
    paint(ctx, '#ffcf4a');
    ctx.beginPath();
    ctx.moveTo(2.2, -0.9);
    ctx.quadraticCurveTo(11, -2, 19, -1.2);
    ctx.lineTo(19.8, -0.6);
    ctx.quadraticCurveTo(11, 0.2, 2.2, 0.9);
    ctx.closePath();
    paint(ctx, '#e8f0f6');
    const g = w.glow ?? '#8fd8ff';
    ctx.strokeStyle = rgba(g, 0.7 + 0.3 * Math.sin(t * 6));
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(2.6, 0.6);
    ctx.quadraticCurveTo(11, -0.2, 19.4, -0.7);
    ctx.stroke();
  },
  w_rocket(ctx, _w, _t, k) {
    // shoulder tube in firework colours; grip hangs below at the hand
    pistolGrip(ctx, RUBBER, 4);
    box(ctx, -12, -6.2, 28, 5, '#2f6b4a', 2.4);
    for (const [x, c] of [
      [-9, '#ffcf4a'],
      [-3, '#e84a3c'],
      [3, '#4a78d8'],
      [9, '#ffcf4a'],
    ] as const)
      box(ctx, x, -6.4, 1.4, 5.4, c, 0.4);
    box(ctx, 14.6, -6.8, 2.4, 6.2, '#26282b', 0.8);
    box(ctx, -13, -6.6, 2, 5.8, '#26282b', 0.8);
    // sight
    box(ctx, 2, -8.6, 3, 2.4, '#3a3f45', 0.5);
    // warhead peeking out when loaded
    if (!(k > 0.1 && k < 0.8)) poly(ctx, [16.8, -5.6, 19.8, -3.7, 16.8, -1.8], '#e84a3c');
    box(ctx, 6, -1.2, 1.8, 3.6, RUBBER, 0.4);
  },
};

ART.w_fists = () => {};
ART.w_ext = (ctx) => {
  // red extinguisher hanging from the handle, hose to the nozzle held forward
  box(ctx, -1.6, -1.4, 4.4, 1.2, '#2a2d31', 0.4);
  box(ctx, -3, 0, 6.4, 12.5, '#d23b2e', 3);
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(-2.2, 1.4, 1, 9);
  box(ctx, -2.6, 4.4, 5.6, 3.2, '#f4efe6', 0.6);
  ctx.fillStyle = '#d23b2e';
  ctx.fillRect(-1.6, 5.6, 3.6, 0.8);
  circle(ctx, 0.2, -2, 0.9, '#8a939b');
  ctx.strokeStyle = '#1e2126';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(2, -1.6);
  ctx.bezierCurveTo(6, -2, 5, -3.4, 9, -3);
  ctx.stroke();
  box(ctx, 8.6, -4, 4, 1.8, '#2a2d31', 0.6);
};

const DEFAULT_ART: WeaponProfile['draw'] = (ctx, w) => {
  box(ctx, -1, -0.8, 11, 1.6, '#6b4a32', 0.6);
  box(ctx, 7.4, -2.8, 3.8, 5.6, w.color, 1);
};

// ---------------------------------------------------------------- profiles
type P = Omit<WeaponProfile, 'draw'>;
const PROFILES: Record<string, P> = {
  w_spoon: { grip: 'melee1', shot: 'melee', rate: 1.1, burst: 1, muzzle: [13, 0], support: [0, 0], sfx: 'swing', span: [-3, 17] },
  w_rollpin: { grip: 'melee1', shot: 'melee', rate: 1, burst: 1, muzzle: [12, 0], support: [0, 0], sfx: 'swing', span: [-3, 17] },
  w_sling: { grip: 'sling', shot: 'pebble', rate: 0.9, burst: 1, muzzle: [8, 0], support: [3, 0], sfx: 'twang', span: [-2, 9] },
  w_wrench: { grip: 'melee1', shot: 'melee', rate: 1, burst: 1, muzzle: [14, 0], support: [0, 0], sfx: 'swing', span: [-2, 17] },
  w_knife: { grip: 'blade', shot: 'melee', rate: 1.5, burst: 1, muzzle: [11, 0], support: [0, 0], sfx: 'swing', span: [-3, 13] },
  w_bat: { grip: 'melee2', shot: 'melee', rate: 0.9, burst: 1, muzzle: [19, 0], support: [-1.6, 0], sfx: 'swing', span: [-3, 21] },
  w_pipe: { grip: 'pistol', shot: 'bullet', rate: 1.1, burst: 1, muzzle: [11.8, -2], support: [-0.6, 1.4], sfx: 'pistol', span: [-3, 12] },
  w_air: { grip: 'rifle', shot: 'pebble', rate: 1, burst: 1, muzzle: [20, -1.9], support: [11, -0.6], sfx: 'twang', span: [-9, 20] },
  w_revolver: { grip: 'pistol', shot: 'bullet', rate: 1, burst: 1, muzzle: [12, -2.4], support: [-0.6, 1.4], sfx: 'pistol', span: [-3, 12] },
  w_hunting: { grip: 'rifle', shot: 'bullet', rate: 0.75, burst: 1, muzzle: [21.4, -1.8], support: [10, -0.4], sfx: 'rifle', span: [-9, 21] },
  w_shotgun: { grip: 'rifle', shot: 'pellets', rate: 0.7, burst: 6, muzzle: [19.6, -2.4], support: [10, 0.2], sfx: 'shotgun', span: [-9, 20] },
  w_smg: { grip: 'rifle', shot: 'bullet', rate: 1.1, burst: 3, muzzle: [17.4, -1.8], support: [10.8, 1.6], sfx: 'smg', span: [-8, 18] },
  w_nailgun: { grip: 'pistol', shot: 'nail', rate: 1.6, burst: 1, muzzle: [10.8, -1.4], support: [3.6, 3], sfx: 'nail', span: [-3, 11] },
  w_laserp: { grip: 'pistol', shot: 'laser', rate: 1.2, burst: 1, muzzle: [12, -2.4], support: [-0.6, 1.4], sfx: 'laser', span: [-3, 12] },
  w_sledge: { grip: 'melee2', shot: 'melee', rate: 0.7, burst: 1, muzzle: [19, 0], support: [-2, 0], sfx: 'swing', span: [-3, 22] },
  w_lasr: { grip: 'rifle', shot: 'laser', rate: 1.1, burst: 1, muzzle: [22, -1.7], support: [10, -0.4], sfx: 'laser', span: [-9, 22] },
  w_crossbow: { grip: 'rifle', shot: 'bolt', rate: 0.6, burst: 1, muzzle: [17.6, -1.25], support: [9, -0.2], sfx: 'twang', span: [-8, 18] },
  w_plasma: { grip: 'rifle', shot: 'plasma', rate: 0.9, burst: 1, muzzle: [20.4, -1.6], support: [11, -0.8], sfx: 'plasma', span: [-9, 21] },
  w_gauss: { grip: 'rifle', shot: 'gauss', rate: 0.6, burst: 1, muzzle: [23, -1.6], support: [11, -0.6], sfx: 'gauss', span: [-9, 23] },
  w_tesla: { grip: 'hip', shot: 'tesla', rate: 0.8, burst: 1, muzzle: [23.4, -1], support: [5, -6], sfx: 'tesla', span: [-5, 25] },
  w_hammer: { grip: 'melee2', shot: 'melee', rate: 0.75, burst: 1, muzzle: [19.6, 0], support: [-2, 0], sfx: 'swing', span: [-3, 23] },
  w_guitar: { grip: 'guitar', shot: 'sonic', rate: 1, burst: 1, muzzle: [3, 0], support: [11, 0], sfx: 'guitar', span: [-7, 21] },
  w_ladle: { grip: 'melee1', shot: 'melee', rate: 1.1, burst: 1, muzzle: [13, 0], support: [0, 0], sfx: 'swing', span: [-3, 17] },
  w_minigun: { grip: 'hip', shot: 'bullet', rate: 2.2, burst: 4, muzzle: [26, -0.6], support: [2.5, -6.4], sfx: 'smg', span: [-8, 26] },
  w_crowbar: { grip: 'melee1', shot: 'melee', rate: 1, burst: 1, muzzle: [16, -1.6], support: [0, 0], sfx: 'swing', span: [-5, 18] },
  w_flare: { grip: 'pistol', shot: 'flare', rate: 0.7, burst: 1, muzzle: [10.4, -2.2], support: [-0.6, 1.4], sfx: 'flare', span: [-3, 11] },
  w_machete: { grip: 'melee1', shot: 'melee', rate: 1.3, burst: 1, muzzle: [15, 0], support: [0, 0], sfx: 'swing', span: [-3, 17] },
  w_harpoon: { grip: 'rifle', shot: 'harpoon', rate: 0.5, burst: 1, muzzle: [26, -3.1], support: [12, -0.6], sfx: 'twang', span: [-8, 26] },
  w_flamer: { grip: 'hip', shot: 'flame', rate: 5, burst: 1, muzzle: [21, -0.9], support: [9, -2.4], sfx: 'flame', span: [-5, 22] },
  w_cryo: { grip: 'pistol', shot: 'cryo', rate: 1, burst: 1, muzzle: [12, -2.2], support: [-0.6, 1.4], sfx: 'cryo', span: [-3, 12] },
  w_saber: { grip: 'melee1', shot: 'melee', rate: 1.4, burst: 1, muzzle: [18, -0.6], support: [0, 0], sfx: 'swing', span: [-4, 20] },
  w_rocket: { grip: 'shoulder', shot: 'rocket', rate: 0.35, burst: 1, muzzle: [19.8, -3.7], support: [6.9, 0.6], sfx: 'rocket', span: [-13, 20] },
};

PROFILES.w_fists = { grip: 'fist', shot: 'melee', rate: 1.6, burst: 1, muzzle: [2, 0], support: [0, 0], sfx: 'swing', span: [-1, 3] };
PROFILES.w_ext = { grip: 'hip', shot: 'foam', rate: 6, burst: 1, muzzle: [12.8, -3.1], support: [9.5, -3], sfx: 'foam', span: [-3, 13] };

/** Bare hands for unarmed dwellers. */
export const FISTS: WeaponDef = { id: 'w_fists', name: { ru: 'Кулаки', en: 'Fists' }, dmg: [1, 1], rarity: 0, kind: 'melee', color: '#000000' };
/** Fire extinguisher used against fires. */
export const EXTINGUISHER: WeaponDef = { id: 'w_ext', name: { ru: 'Огнетушитель', en: 'Extinguisher' }, dmg: [1, 1], rarity: 0, kind: 'heavy', color: '#d23b2e' };

const FALLBACK: Record<WeaponDef['kind'], P> = {
  melee: PROFILES.w_wrench,
  blade: PROFILES.w_knife,
  pistol: PROFILES.w_revolver,
  rifle: PROFILES.w_hunting,
  shotgun: PROFILES.w_shotgun,
  laser: PROFILES.w_lasr,
  plasma: PROFILES.w_plasma,
  heavy: PROFILES.w_minigun,
  sling: PROFILES.w_sling,
  guitar: PROFILES.w_guitar,
};

const cache = new Map<string, WeaponProfile>();
export function weaponProfile(w: WeaponDef): WeaponProfile {
  let p = cache.get(w.id);
  if (!p) {
    const base = PROFILES[w.id] ?? FALLBACK[w.kind] ?? PROFILES.w_wrench;
    p = { ...base, draw: ART[w.id] ?? DEFAULT_ART };
    cache.set(w.id, p);
  }
  return p;
}

export function isMelee(w: WeaponDef) {
  const g = weaponProfile(w).grip;
  return g === 'melee1' || g === 'melee2' || g === 'blade' || g === 'fist';
}

/** Standalone weapon picture (icons, racks). Hand grip at (x,y). */
export function drawWeapon(ctx: Ctx, w: WeaponDef, x: number, y: number, flash?: boolean, s = 1, t = 0) {
  const p = weaponProfile(w);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (p.grip === 'sling') ctx.rotate(-Math.PI / 2);
  p.draw(ctx, w, t, 0);
  if (flash) muzzleFlash(ctx, w, p.muzzle[0], p.muzzle[1], 1);
  ctx.restore();
}

/** Muzzle flash drawn in weapon space. */
export function muzzleFlash(ctx: Ctx, w: WeaponDef, x: number, y: number, k: number) {
  const p = weaponProfile(w);
  if (p.shot === 'melee' || p.shot === 'sonic' || k <= 0) return;
  const energy = p.shot === 'laser' || p.shot === 'cryo' || p.shot === 'plasma' || p.shot === 'gauss' || p.shot === 'tesla';
  const col = energy ? (w.glow ?? '#ff4b4b') : p.shot === 'flame' ? '#ff8a2a' : p.shot === 'flare' ? '#ff5a3a' : '#ffd46a';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = (p.shot === 'pellets' || p.shot === 'rocket' ? 8 : p.shot === 'pebble' || p.shot === 'bolt' || p.shot === 'harpoon' || p.shot === 'nail' ? 2.5 : 6) * (0.6 + 0.4 * k);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba('#ffffff', 0.95 * k));
  g.addColorStop(0.3, rgba(col, 0.85 * k));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (!energy && p.shot !== 'pebble' && p.shot !== 'bolt' && p.shot !== 'harpoon') {
    // star-shaped burst
    ctx.fillStyle = rgba('#fff3c4', 0.9 * k);
    ctx.beginPath();
    ctx.moveTo(x, y - 0.7);
    ctx.lineTo(x + r * 1.2, y);
    ctx.lineTo(x, y + 0.7);
    ctx.lineTo(x + r * 0.35, y - r * 0.5);
    ctx.lineTo(x + r * 0.35, y + r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
