/* Enemies, Kuzya the robot, Schrödinger's cat. Feet at (0,0). */
import { glow, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { drawCharacter, DEFAULT_POSE } from './dwellerArt';
import type { OutfitDef } from '../data/items';

const RAIDER_OUTFITS: OutfitDef[] = [
  { id: 'raider1', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'armor', top: '#5a3a2a', bottom: '#3a2a22', accent: '#b5403a', hat: 'bandana', hatColor: '#b5403a' },
  { id: 'raider2', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'casual', top: '#3a3f2a', bottom: '#2a2a22', accent: '#8a8a3a', hat: 'goggles', hatColor: '#3a2a20' },
  { id: 'raider3', name: { ru: '', en: '' }, bonus: [], rarity: 0, style: 'armor', top: '#4a4a4f', bottom: '#2a2a2f', accent: '#d9a441', hat: 'none' },
];
const RAIDER_WEAPON = { id: 'rw', name: { ru: '', en: '' }, dmg: [1, 2] as [number, number], rarity: 0 as const, kind: 'rifle' as const, color: '#4a3a2a' };

export function drawRaider(ctx: Ctx, i: number, t: number, facing: number, attacking: boolean) {
  ctx.save();
  ctx.scale(facing, 1);
  const flash = attacking && Math.sin(t * 11 + i * 2) > 0.85;
  drawCharacter(
    ctx,
    { skin: (i * 3) % 6, hair: [4, 1, 10][i % 3], hairColor: [7, 5, 0][i % 3], beard: i % 2 ? 1 : 3, glasses: false, face: 0 },
    RAIDER_OUTFITS[i % 3],
    { ...DEFAULT_POSE, view: 'side', aim: true, weapon: RAIDER_WEAPON, flash, mouth: 'grin', eyes: 'open', bob: Math.abs(Math.sin(t * 4 + i)) * 0.8 },
    'm',
  );
  ctx.restore();
}

export function drawBug(ctx: Ctx, t: number, seed: number) {
  const leg = Math.sin(t * 22 + seed) * 0.6;
  ctx.save();
  // legs
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 0.9;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 3, -3);
    ctx.lineTo(i * 3 - 2 + (i % 2 ? leg : -leg), 0);
    ctx.moveTo(i * 3, -3);
    ctx.lineTo(i * 3 + 2 + (i % 2 ? -leg : leg), 0);
    ctx.stroke();
  }
  // body
  ctx.beginPath();
  ctx.ellipse(0, -4.5, 7, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -2, -7, 1, 8, [
    [0, '#c98a4a'],
    [0.5, '#7a3a1a'],
    [1, '#3a1a0a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -8.4);
  ctx.lineTo(0, -0.6);
  ctx.stroke();
  // head & antennae
  ctx.beginPath();
  ctx.arc(7, -4, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#3a1a0a';
  ctx.fill();
  ctx.strokeStyle = '#2a1a10';
  ctx.beginPath();
  ctx.moveTo(8.5, -5.5);
  ctx.quadraticCurveTo(12, -10 + leg, 14, -8);
  ctx.moveTo(8, -6);
  ctx.quadraticCurveTo(10, -11, 12.5, -11 - leg);
  ctx.stroke();
  ctx.fillStyle = '#9aff6a';
  ctx.beginPath();
  ctx.arc(8, -4.6, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMole(ctx: Ctx, t: number, seed: number) {
  const b = Math.abs(Math.sin(t * 6 + seed)) * 1.2;
  ctx.save();
  ctx.translate(0, -b);
  ctx.beginPath();
  ctx.ellipse(0, -7, 10, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -3, -11, 1, 12, [
    [0, '#b08a6a'],
    [1, '#5a3a2a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // snout
  ctx.beginPath();
  ctx.ellipse(10, -6, 4, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8a0a0';
  ctx.fill();
  ctx.stroke();
  // teeth
  ctx.fillStyle = '#fff4d8';
  ctx.fillRect(10, -3.6, 1.4, 2.4);
  ctx.fillRect(11.6, -3.6, 1.4, 2.4);
  // eye
  ctx.fillStyle = '#1a0a04';
  ctx.beginPath();
  ctx.arc(5, -9, 1, 0, Math.PI * 2);
  ctx.fill();
  // claws
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-6, -1.5, 4, 1.5);
  ctx.fillRect(4, -1.5, 4, 1.5);
  ctx.restore();
}

export function drawSpikeback(ctx: Ctx, t: number, seed: number) {
  const b = Math.sin(t * 5 + seed);
  ctx.save();
  ctx.translate(0, -Math.abs(b));
  // tail
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.quadraticCurveTo(-24, -8 + b * 2, -28, -2);
  ctx.lineTo(-24, -4);
  ctx.quadraticCurveTo(-20, -6, -12, -5);
  ctx.fillStyle = '#4a5a3a';
  ctx.fill();
  // legs
  ctx.fillStyle = '#3a4a2a';
  for (const lx of [-8, 6]) {
    rrect(ctx, lx - 2, -8, 4.5, 8, 2);
    ctx.fill();
  }
  // body
  ctx.beginPath();
  ctx.ellipse(0, -13, 15, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = vgrad(ctx, -21, -5, [
    [0, '#7a8a5a'],
    [1, '#3a4a2a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1a2010';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // spikes
  ctx.fillStyle = '#d9c9a0';
  for (let i = 0; i < 6; i++) {
    const sx = -10 + i * 4;
    ctx.beginPath();
    ctx.moveTo(sx - 2, -19 + Math.abs(sx) * 0.1);
    ctx.lineTo(sx, -27 + Math.abs(sx) * 0.25);
    ctx.lineTo(sx + 2, -19 + Math.abs(sx) * 0.1);
    ctx.fill();
  }
  // head
  ctx.beginPath();
  ctx.ellipse(16, -15, 7, 5, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#6a7a4a';
  ctx.fill();
  ctx.stroke();
  // jaw
  ctx.beginPath();
  ctx.moveTo(14, -12);
  ctx.lineTo(24, -11 + Math.max(0, b) * 3);
  ctx.lineTo(16, -9);
  ctx.fillStyle = '#5a6a3a';
  ctx.fill();
  ctx.fillStyle = '#fff4d8';
  for (let i = 0; i < 3; i++) ctx.fillRect(17 + i * 2.2, -12, 0.8, 1.4);
  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath();
  ctx.arc(18, -16.5, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0a04';
  ctx.fillRect(18, -17.3, 0.5, 1.6);
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
