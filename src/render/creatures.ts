/* Enemies, Kuzya the robot, Schrödinger's cat. Feet at (0,0). */
import { glow, mix, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { WEAPON_BY_ID, type OutfitDef, type WeaponDef } from '../data/items';
import type { Look } from '../sim/types';

// ---------------------------------------------------------------- raiders
const RAIDER_OUTFITS: OutfitDef[] = [
  { id: 'raider1', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'armor', top: '#5a3a2a', bottom: '#3a2a22', accent: '#b5403a', hat: 'bandana', hatColor: '#b5403a' },
  { id: 'raider2', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'casual', top: '#3a3f2a', bottom: '#2a2a22', accent: '#8a8a3a', hat: 'goggles', hatColor: '#3a2a20' },
  { id: 'raider3', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'armor', top: '#4a4a4f', bottom: '#2a2a2f', accent: '#d9a441', hat: 'none' },
  { id: 'raider4', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'overalls', top: '#6b3a2a', bottom: '#3a3530', accent: '#2a2a2a', hat: 'cap', hatColor: '#2a2a2a' },
  { id: 'raider5', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'coat', top: '#4a3a30', bottom: '#2a2420', accent: '#8a2a22', hat: 'none' },
  { id: 'raider6', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'armor', top: '#6a5a3a', bottom: '#3a3024', accent: '#c9a24a', hat: 'helmet', hatColor: '#4a4030' },
];
const RAIDER_WEAPONS = ['w_pipe', 'w_bat', 'w_hunting', 'w_machete', 'w_shotgun', 'w_crowbar', 'w_revolver', 'w_pipe', 'w_smg'];

export interface RaiderSpec {
  look: Look;
  outfit: OutfitDef;
  weapon: WeaponDef;
  gender: 'm' | 'f';
}

/** A scruffy raider built from a seed: face, outfit and weapon. */
export function raiderSpec(seed: number): RaiderSpec {
  const r = (k: number) => {
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const gender = r(1) < 0.72 ? 'm' : 'f';
  const hair = gender === 'm' ? [4, 1, 18, 21, 15, 10, 8][Math.floor(r(2) * 7)] : [4, 21, 7, 20, 12][Math.floor(r(2) * 5)];
  return {
    gender,
    look: {
      skin: Math.floor(r(3) * 9),
      hair,
      hairColor: [7, 0, 5, 3, 11, 12, 1][Math.floor(r(4) * 7)],
      beard: gender === 'm' ? [0, 1, 4, 6, 7, 3][Math.floor(r(5) * 6)] : 0,
      glasses: false,
      face: Math.floor(r(6) * 7),
      body: [1, 2, 3, 4, 0][Math.floor(r(7) * 5)],
      height: Math.floor(r(8) * 5) - 2,
      shape: Math.floor(r(9) * 5),
      nose: Math.floor(r(10) * 5),
      eyes: [3, 2, 1][Math.floor(r(11) * 3)],
      brows: [3, 2, 1][Math.floor(r(12) * 3)],
      age: Math.floor(r(13) * 3),
      mark: [3, 5, 0, 3, 2][Math.floor(r(14) * 5)],
      acc: [0, 5, 0, 2][Math.floor(r(15) * 4)],
    },
    outfit: RAIDER_OUTFITS[Math.floor(r(16) * RAIDER_OUTFITS.length)],
    weapon: WEAPON_BY_ID[RAIDER_WEAPONS[Math.floor(r(17) * RAIDER_WEAPONS.length)]],
  };
}

// ---------------------------------------------------------------- creature state
export interface CreatureState {
  t: number;
  seed: number;
  /** 0 standing .. 1 full speed */
  move: number;
  /** attack phase 0..1 */
  atk?: number;
  /** hit flash 0..1 */
  hurt: number;
  /** death progress 0..1 */
  dead: number;
}

function flashC(c: string, k: number) {
  return k > 0 ? mix(c, '#ffffff', Math.min(0.85, k)) : c;
}

function lungeOf(s: CreatureState) {
  if (s.atk === undefined) return 0;
  const a = s.atk;
  return a < 0.35 ? -Math.sin((a / 0.35) * Math.PI * 0.5) * 0.35 : a < 0.55 ? -0.35 + ((a - 0.35) / 0.2) * 1.35 : 1 - (a - 0.55) / 0.45;
}

/** Mutant bug: giant cockroach. Feet at 0, faces +x, ~24 long. */
export function drawBug(ctx: Ctx, s: CreatureState) {
  const { t, seed, hurt } = s;
  const lunge = lungeOf(s);
  const dead = s.dead;
  const ph = t * (8 + s.move * 16) + seed * 3;
  const F = (c: string) => flashC(c, hurt);
  ctx.save();
  if (dead > 0) {
    // flips onto its back, legs twitching
    const u = Math.min(1, dead * 2.2);
    ctx.translate(0, -6);
    ctx.rotate(Math.PI * u);
    ctx.translate(0, 6 - u * 3);
  } else {
    ctx.translate(lunge * 4, -Math.abs(Math.sin(ph)) * 0.5 * s.move);
    ctx.rotate(-lunge * 0.08);
  }
  const twitch = dead > 0 ? Math.sin(t * 30 + seed) * (1 - dead) : 0;
  // legs (far side first)
  const leg = (hx: number, i: number, far: boolean) => {
    const p = ph + i * 2.1 + (far ? Math.PI : 0);
    const stride = s.move > 0.05 ? Math.sin(p) * 3.2 : Math.sin(t * 2 + i) * 0.3;
    const lift = s.move > 0.05 ? Math.max(0, Math.cos(p)) * 1.6 : 0;
    const fx = hx + (i - 1) * 3.4 + stride + twitch * 2;
    const fy = -lift + (dead > 0 ? -2 - Math.abs(twitch) * 2 : 0);
    const kx = (hx + fx) / 2 + (i - 1) * 1.4;
    const ky = -9.6 - lift * 0.5;
    ctx.strokeStyle = F(far ? '#2a140a' : '#3a1c0c');
    ctx.lineWidth = far ? 0.9 : 1.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, -5);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    // spines
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo((kx + fx) / 2, (ky + fy) / 2);
    ctx.lineTo((kx + fx) / 2 + 1, (ky + fy) / 2 - 0.8);
    ctx.stroke();
  };
  for (let i = 0; i < 3; i++) leg([5, 1, -3][i], i, true);
  // abdomen
  ctx.beginPath();
  ctx.ellipse(-5.5, -7, 9.6, 5.4, -0.05, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -8, -11, 1, 11, [
    [0, F('#c98a4a')],
    [0.45, F('#7a3a1a')],
    [1, F('#2e1206')],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // segment plates
  ctx.strokeStyle = rgba('#1a0a04', 0.55);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (const x of [-11, -7.5, -4, -0.5]) {
    ctx.moveTo(x, -11.8);
    ctx.quadraticCurveTo(x - 1.2, -7, x, -2);
  }
  ctx.stroke();
  // wing split and gloss
  ctx.strokeStyle = rgba('#1a0a04', 0.7);
  ctx.beginPath();
  ctx.moveTo(1, -12);
  ctx.quadraticCurveTo(-6, -11.4, -14.6, -7);
  ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.beginPath();
  ctx.ellipse(-6, -10.2, 4.5, 1, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // pronotum shield
  ctx.beginPath();
  ctx.ellipse(4.2, -7.4, 5.4, 4.8, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, 3, -10, 0.5, 7, [
    [0, F('#d9a060')],
    [0.6, F('#8a4a24')],
    [1, F('#3a1a0a')],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1a0a04';
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffe0b0', 0.5);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(4.2, -7.4, 4.2, -2.6, -1.1);
  ctx.stroke();
  // near legs
  for (let i = 0; i < 3; i++) leg([5, 1, -3][i], i, false);
  // head with mandibles
  const open = s.atk !== undefined && s.atk > 0.25 && s.atk < 0.65 ? 1 : 0.2;
  ctx.save();
  ctx.translate(9.4, -5.4);
  ctx.rotate(0.25 + lunge * 0.2);
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.1, 2.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = F('#4a200c');
  ctx.fill();
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.strokeStyle = F('#2a1206');
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2.4, 1);
  ctx.quadraticCurveTo(4.6, 1 - open * 1.6, 4.4, 2.4 - open);
  ctx.moveTo(2.2, 1.8);
  ctx.quadraticCurveTo(4.4, 2.6 + open * 1.4, 3.6, 3.8 + open);
  ctx.stroke();
  // compound eye
  ctx.beginPath();
  ctx.arc(0.8, -0.9, 1.15, 0, Math.PI * 2);
  ctx.fillStyle = dead > 0.3 ? '#3a4a2a' : '#9aff6a';
  ctx.fill();
  if (dead <= 0.3) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0.8, -0.9, 3, '#9aff6a', 0.35);
    ctx.restore();
  }
  ctx.restore();
  // antennae
  const sw = Math.sin(t * 5 + seed) * 1.6;
  ctx.strokeStyle = '#2a1206';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(10.6, -7.6);
  ctx.quadraticCurveTo(15, -14 + sw, 23, -12 - sw);
  ctx.moveTo(10, -7.8);
  ctx.quadraticCurveTo(13, -16, 19.5, -17 + sw);
  ctx.stroke();
  ctx.restore();
}

/** Burrower: a bald mole-rat with digging claws. Feet at 0, faces +x. */
export function drawMole(ctx: Ctx, s: CreatureState) {
  const { t, seed, hurt } = s;
  const F = (c: string) => flashC(c, hurt);
  const lunge = lungeOf(s);
  const ph = t * (6 + s.move * 10) + seed;
  const hop = s.move > 0.05 ? Math.abs(Math.sin(ph)) * 2.2 : Math.abs(Math.sin(t * 2 + seed)) * 0.3;
  ctx.save();
  if (s.dead > 0) {
    // rolls belly-up
    const u = Math.min(1, s.dead * 2);
    ctx.translate(0, -7);
    ctx.rotate(Math.PI * u);
    ctx.translate(0, 7 - u * 1.5);
  } else ctx.translate(lunge * 5, -hop);
  // tail
  ctx.strokeStyle = F('#b58a78');
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -5);
  ctx.quadraticCurveTo(-17, -3 + Math.sin(t * 6) * 1.5, -21, -5);
  ctx.stroke();
  // hind leg
  const lg = s.move > 0.05 ? Math.sin(ph) * 2 : 0;
  ctx.fillStyle = F('#a57866');
  ctx.beginPath();
  ctx.ellipse(-7 - lg, -3, 3.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.beginPath();
  ctx.ellipse(-2, -7.5, 11.5, 7.2, -0.06, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -4, -12, 1, 13, [
    [0, F('#e8c4b0')],
    [0.55, F('#c49484')],
    [1, F('#7a5448')],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#3a2420';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // wrinkles
  ctx.strokeStyle = rgba('#7a4a3e', 0.55);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (const x of [-9, -5, -1, 3]) {
    ctx.moveTo(x, -13.5);
    ctx.quadraticCurveTo(x + 1.4, -9, x, -4);
  }
  ctx.stroke();
  // head
  ctx.save();
  ctx.translate(9, -8);
  ctx.rotate(0.12 + lunge * 0.15);
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.4, 5.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -1, -3, 0.5, 7, [
    [0, F('#f0cdb8')],
    [1, F('#b0806e')],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#3a2420';
  ctx.stroke();
  // ear, eye, nose
  ctx.beginPath();
  ctx.ellipse(-3.4, -4, 1.4, 1.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = F('#c48a7a');
  ctx.fill();
  ctx.fillStyle = '#1a0a08';
  ctx.beginPath();
  ctx.arc(1.4, -2.2, 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6.2, 0.2, 1.8, 1.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = F('#e88a90');
  ctx.fill();
  ctx.strokeStyle = '#3a2420';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  // whiskers
  ctx.strokeStyle = rgba('#ffffff', 0.7);
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(5, 1);
  ctx.lineTo(9, 0);
  ctx.moveTo(5, 1.6);
  ctx.lineTo(8.8, 2.4);
  ctx.stroke();
  // buck teeth; mouth opens on attack
  const open = s.atk !== undefined && s.atk > 0.3 && s.atk < 0.65 ? 1.6 : 0;
  ctx.fillStyle = '#fff4d8';
  ctx.fillRect(3.6, 2.2, 1.3, 3.2 + open * 0.3);
  ctx.fillRect(5, 2.2, 1.3, 3.2 + open * 0.3);
  if (open) {
    ctx.fillStyle = '#5a1a18';
    ctx.fillRect(2.8, 5.6, 4, open);
  }
  ctx.restore();
  // front digging claws
  const fl = s.move > 0.05 ? -Math.sin(ph) * 2 : 0;
  ctx.fillStyle = F('#b0806e');
  ctx.beginPath();
  ctx.ellipse(5 + fl, -2.4, 2.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f4e6c8';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(6.6 + fl + i * 0.5, -1.5 + i * 0.4);
    ctx.lineTo(9 + fl + i * 0.6, -0.2 + i * 0.3);
  }
  ctx.stroke();
  ctx.restore();
}

/** Spikeback: an armoured beast with a spiked back and a clubbed tail. Feet at 0, faces +x. */
export function drawSpikeback(ctx: Ctx, s: CreatureState) {
  const { t, seed, hurt } = s;
  const F = (c: string) => flashC(c, hurt);
  const lunge = lungeOf(s);
  const ph = t * (4 + s.move * 7) + seed;
  const b = s.move > 0.05 ? Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 1.6 + seed) * 0.4;
  ctx.save();
  if (s.dead > 0) {
    const u = Math.min(1, s.dead * 1.6);
    ctx.translate(0, u * 3);
    ctx.rotate(u * 0.25);
  } else {
    ctx.translate(lunge * 6, -b);
    ctx.rotate(-lunge * 0.1);
  }
  // tail with a bony club
  ctx.beginPath();
  ctx.moveTo(-13, -15);
  ctx.quadraticCurveTo(-24, -14 + Math.sin(t * 3) * 2, -30, -6);
  ctx.lineTo(-27, -5);
  ctx.quadraticCurveTo(-21, -9, -12, -9);
  ctx.closePath();
  ctx.fillStyle = F('#4f6040');
  ctx.fill();
  ctx.strokeStyle = '#1a2010';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-30, -5.8, 3.4, 2.6, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = F('#d9c9a0');
  ctx.fill();
  ctx.stroke();
  // legs
  const leg = (x: number, p: number, far: boolean) => {
    const sw = s.move > 0.05 ? Math.sin(ph + p) * 3 : 0;
    ctx.fillStyle = F(far ? '#34402a' : '#46563a');
    ctx.beginPath();
    ctx.moveTo(x - 3, -12);
    ctx.lineTo(x + 3, -12);
    ctx.lineTo(x + 2.4 + sw, -1.2);
    ctx.lineTo(x - 2.8 + sw, -1.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a2010';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.fillStyle = '#d9c9a0';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - 2.8 + sw + i * 1.9, -1.4, 1, 1.4);
  };
  leg(-8, Math.PI, true);
  leg(7, 0, true);
  // body
  ctx.beginPath();
  ctx.ellipse(-1, -15, 16, 9.4, -0.04, 0, Math.PI * 2);
  ctx.fillStyle = vgrad(ctx, -24, -6, [
    [0, F('#8a9a64')],
    [0.55, F('#5a6a40')],
    [1, F('#33402a')],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1a2010';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // armour plates
  ctx.strokeStyle = rgba('#1a2010', 0.55);
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  for (const x of [-10, -4, 2, 8]) {
    ctx.moveTo(x, -23);
    ctx.quadraticCurveTo(x + 2, -15, x, -8);
  }
  ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.beginPath();
  ctx.ellipse(-3, -20, 8, 2, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // bone spikes along the back
  for (let i = 0; i < 7; i++) {
    const sx = -12 + i * 4;
    const base = -22.5 + Math.abs(sx + 1) * 0.12;
    const h = 7 - Math.abs(sx + 1) * 0.18;
    ctx.beginPath();
    ctx.moveTo(sx - 1.8, base + 1);
    ctx.lineTo(sx + 0.8, base - h);
    ctx.lineTo(sx + 1.8, base + 1);
    ctx.closePath();
    ctx.fillStyle = F('#e8dcb8');
    ctx.fill();
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 0.45;
    ctx.stroke();
  }
  leg(-5, 0, false);
  leg(10, Math.PI, false);
  // head with horns; the jaw drops on attack
  const jaw = s.atk !== undefined && s.atk > 0.3 && s.atk < 0.7 ? 1 : 0.15;
  ctx.save();
  ctx.translate(15, -16);
  ctx.rotate(0.1 + lunge * 0.2);
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.quadraticCurveTo(6, -7, 10, -2);
  ctx.lineTo(10, 0.6);
  ctx.quadraticCurveTo(4, 2, -3, 3.6);
  ctx.closePath();
  ctx.fillStyle = F('#6a7a4a');
  ctx.fill();
  ctx.strokeStyle = '#1a2010';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-1, 2.4);
  ctx.lineTo(9, 1.2 + jaw * 3.4);
  ctx.lineTo(-2, 5.6 + jaw);
  ctx.closePath();
  ctx.fillStyle = F('#55653a');
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff4d8';
  for (let i = 0; i < 4; i++) ctx.fillRect(1.6 + i * 2, 1.2 + jaw * i * 0.35, 0.8, 1.3);
  // horns
  ctx.fillStyle = F('#e8dcb8');
  ctx.beginPath();
  ctx.moveTo(0, -3.6);
  ctx.quadraticCurveTo(-2, -9, -6, -10);
  ctx.quadraticCurveTo(-3, -7, -2.6, -3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a4a2a';
  ctx.lineWidth = 0.45;
  ctx.stroke();
  // eye
  ctx.fillStyle = s.dead > 0.3 ? '#4a4a3a' : '#ffcf4a';
  ctx.beginPath();
  ctx.arc(3.8, -2.4, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0a04';
  ctx.fillRect(3.6, -3.3, 0.5, 1.8);
  ctx.restore();
  ctx.restore();
}

export function drawFlames(ctx: Ctx, x: number, w: number, floorY: number, t: number, intensity: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const n = Math.max(3, Math.floor(w / 18));
  for (let i = 0; i < n; i++) {
    const fx = x + ((i + 0.5) * w) / n + Math.sin(t * 3 + i) * 3;
    const h = (18 + Math.sin(t * 7 + i * 1.7) * 6 + (i % 3) * 5) * intensity;
    const g = ctx.createRadialGradient(fx, floorY - h * 0.35, 1, fx, floorY - h * 0.35, h * 0.8);
    g.addColorStop(0, 'rgba(255,245,180,0.9)');
    g.addColorStop(0.35, 'rgba(255,160,40,0.7)');
    g.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fx - h * 0.35, floorY);
    ctx.quadraticCurveTo(fx - h * 0.4, floorY - h * 0.6, fx + Math.sin(t * 9 + i) * 3, floorY - h);
    ctx.quadraticCurveTo(fx + h * 0.4, floorY - h * 0.6, fx + h * 0.35, floorY);
    ctx.closePath();
    ctx.fill();
  }
  glow(ctx, x + w / 2, floorY - 20, w * 0.6, '#ff7a2a', 0.25 * intensity);
  ctx.restore();
}

/** Kuzya — the house-spirit robot. Center at (0,0). */
export function drawRobot(ctx: Ctx, t: number, dir: number, busy: boolean) {
  const hover = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.translate(0, hover);
  // thruster glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, 11, 8, '#7fd3ff', 0.5 + Math.sin(t * 20) * 0.15);
  ctx.restore();
  ctx.fillStyle = '#5a646e';
  rrect(ctx, -3, 6, 6, 4, 1.5);
  ctx.fill();
  // arms
  ctx.strokeStyle = '#6d7680';
  ctx.lineWidth = 1.4;
  const sw = busy ? Math.sin(t * 10) * 0.6 : Math.sin(t * 2) * 0.2;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-12, 4 + sw * 3);
  ctx.lineTo(-13, 8 + sw * 2);
  ctx.moveTo(8, 0);
  ctx.lineTo(12, 4 - sw * 3);
  ctx.lineTo(13, 8 - sw * 2);
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -3, -4, 1, 12, [
    [0, '#eef3f6'],
    [0.6, '#aab6c0'],
    [1, '#5f6b76'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#2a3036';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // AtomHome stripe
  ctx.fillStyle = '#ffb02e';
  ctx.fillRect(-9, 3, 18, 1.4);
  // face screen
  rrect(ctx, -6, -5, 12, 7, 3);
  ctx.fillStyle = '#16222b';
  ctx.fill();
  const blink = Math.sin(t * 0.9) > 0.97;
  ctx.fillStyle = '#6aff8c';
  if (blink) {
    ctx.fillRect(-3.6 + dir, -1.6, 2.4, 0.6);
    ctx.fillRect(1.2 + dir, -1.6, 2.4, 0.6);
  } else {
    ctx.beginPath();
    ctx.arc(-2.4 + dir, -1.6, 1.3, 0, Math.PI * 2);
    ctx.arc(2.4 + dir, -1.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // antenna
  ctx.strokeStyle = '#2a3036';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff5a4a' : '#8a2a22';
  ctx.beginPath();
  ctx.arc(0, -12.5, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Schrödinger's cat: flickers between existing and not. */
export function drawCat(ctx: Ctx, t: number) {
  const phase = (Math.sin(t * 5) + Math.sin(t * 13.7)) * 0.5;
  const alpha = 0.55 + 0.45 * Math.max(0, phase);
  ctx.save();
  ctx.globalAlpha = alpha;
  // aura
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -10, 22, '#b58cff', 0.35 + 0.2 * Math.sin(t * 4));
  ctx.restore();
  // tail
  ctx.strokeStyle = '#2a2436';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.quadraticCurveTo(-13, -4, -11 + Math.sin(t * 3) * 2, -14);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // body
  ctx.beginPath();
  ctx.ellipse(0, -6, 6.5, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2f2840';
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(1, -15, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, -18);
  ctx.lineTo(-2.4, -23);
  ctx.lineTo(0.5, -19.5);
  ctx.moveTo(2, -19.5);
  ctx.lineTo(4.8, -23);
  ctx.lineTo(5.4, -18);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.ellipse(-0.8, -15.5, 1.1, 1.4, 0, 0, Math.PI * 2);
  ctx.ellipse(3, -15.5, 1.1, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1026';
  ctx.fillRect(-1, -16.6, 0.5, 2.2);
  ctx.fillRect(2.8, -16.6, 0.5, 2.2);
  // bow tie (a gentleman cat)
  ctx.fillStyle = '#ff5ab4';
  ctx.beginPath();
  ctx.moveTo(1, -10.5);
  ctx.lineTo(-2, -12);
  ctx.lineTo(-2, -9);
  ctx.closePath();
  ctx.moveTo(1, -10.5);
  ctx.lineTo(4, -12);
  ctx.lineTo(4, -9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // question mark
  ctx.font = '800 9px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = rgba('#e8d8ff', 0.6 + 0.4 * Math.sin(t * 6));
  ctx.fillText('?', 8, -24 + Math.sin(t * 3) * 1.5);
  void shade;
}

/** Pets following their owner. */
export function drawPet(ctx: Ctx, species: string, c1: string, c2: string, t: number, moving: boolean) {
  const step = moving ? Math.sin(t * 16) : 0;
  const b = moving ? Math.abs(step) * 0.8 : Math.sin(t * 2) * 0.2;
  ctx.save();
  ctx.translate(0, -b);
  switch (species) {
    case 'dog':
    case 'cat':
    case 'raccoon': {
      const cat = species === 'cat';
      // tail
      ctx.strokeStyle = species === 'raccoon' ? c2 : c1;
      ctx.lineWidth = cat ? 1.4 : 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, -6);
      ctx.quadraticCurveTo(-9, cat ? -12 : -9, -8 + Math.sin(t * 8) * 1.5, cat ? -14 : -11);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // legs
      ctx.fillStyle = shade(c1, -0.2);
      for (const lx of [-3.5, 3]) ctx.fillRect(lx + step * (lx > 0 ? 1 : -1), -3.5, 1.6, 3.5);
      // body
      ctx.beginPath();
      ctx.ellipse(0, -5.5, 6, 3.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = c1;
      ctx.fill();
      // head
      ctx.beginPath();
      ctx.arc(6, -9, 3.2, 0, Math.PI * 2);
      ctx.fill();
      if (species === 'raccoon') {
        ctx.fillStyle = c2;
        ctx.fillRect(4.2, -10, 4.4, 1.6);
      }
      // ears
      ctx.fillStyle = cat ? c1 : c2;
      ctx.beginPath();
      if (cat) {
        ctx.moveTo(4, -11);
        ctx.lineTo(4.6, -14.5);
        ctx.lineTo(6.4, -12);
        ctx.moveTo(6.8, -12);
        ctx.lineTo(8.4, -14.5);
        ctx.lineTo(8.8, -11);
      } else {
        ctx.ellipse(4.4, -10.5, 1.2, 2.4, 0.4, 0, Math.PI * 2);
      }
      ctx.fill();
      // snout & eye
      ctx.fillStyle = cat ? c2 : shade(c1, 0.2);
      ctx.beginPath();
      ctx.ellipse(8.6, -8.4, 1.6, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(9.8, -8.8, 0.55, 0, Math.PI * 2);
      ctx.arc(6.6, -9.8, 0.55, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'hedgehog': {
      ctx.fillStyle = c1;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.lineTo(Math.cos(a) * 7, -3 + Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a + 0.18) * 4.5, -3 + Math.sin(a + 0.18) * 4);
      }
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(5, -2.8, 3, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(7.8, -2.8, 0.7, 0, Math.PI * 2);
      ctx.arc(5.6, -3.8, 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'parrot': {
      ctx.translate(0, -2 - Math.abs(Math.sin(t * 3)) * 2);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.ellipse(0, -5, 3.2, 4.6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1.8, -10, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(4, -10.5);
      ctx.lineTo(6, -9.2);
      ctx.lineTo(4, -8.6);
      ctx.fill();
      ctx.fillStyle = '#e8453c';
      ctx.fillRect(-2.8, -2, 2, 4);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(2.6, -10.6, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'turtle': {
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(6, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5, -1.5, 2, 1.5);
      ctx.fillRect(3, -1.5, 2, 1.5);
      ctx.beginPath();
      ctx.ellipse(0, -3, 6, 4, 0, Math.PI, 0);
      ctx.fillStyle = c1;
      ctx.fill();
      ctx.strokeStyle = shade(c1, -0.4);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
