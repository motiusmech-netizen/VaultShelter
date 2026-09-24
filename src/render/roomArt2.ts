/* Room interiors, part 2: workshops, training, advanced production. */
import { box, cylinder, fillRR, gauge, glow, hazard, hcylinder, hgrad, pipeH, pipeV, rgba, rgrad, rrect, screenRect, shade, vgrad, star5, type Ctx } from './gfx';
import { IX0, propShadow, signPlate } from './roomBase';
import { arcadeCabinet, books, buttonsRow, consolePanel, crate, mannequin, metalCrate, plant, poster, posterText, shelfUnit, sofa, stool } from './props';
import { FLOOR_FRONT, WALL_BOTTOM, WALL_TOP } from './world';
import { atomLogo } from './roomArt1';

const B = WALL_BOTTOM + 1.5;
const M = 210;

// ------------------------------------------------------------------ WEAPON WORKSHOP
export function weaponsStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // pegboard with tools
    box(ctx, mx + 14, 22, 70, 40, '#b58a5a', 1);
    ctx.fillStyle = rgba('#5a3e22', 0.55);
    for (let y = 25; y < 60; y += 3.6) for (let x = mx + 17; x < mx + 82; x += 3.6) ctx.fillRect(x, y, 0.7, 0.7);
    toolSilhouettes(ctx, mx + 18, 28);
    // workbench with vise
    propShadow(ctx, mx + 50, 80, B, 0.5);
    box(ctx, mx + 10, B - 22, 82, 5, '#8a5a36', 1.5);
    box(ctx, mx + 12, B - 17, 4, 17, '#5a3e2a', 0.6);
    box(ctx, mx + 86, B - 17, 4, 17, '#5a3e2a', 0.6);
    box(ctx, mx + 20, B - 10, 24, 10, '#c7433b', 1);
    ctx.fillStyle = rgba('#000', 0.3);
    ctx.fillRect(mx + 21, B - 6, 22, 0.7);
    box(ctx, mx + 60, B - 29, 12, 7, '#4a5561', 1);
    box(ctx, mx + 57, B - 31, 18, 3, '#6d7680', 0.6);
    // grinder
    box(ctx, mx + 104, B - 26, 18, 26, '#4a5561', 1.5);
    ctx.beginPath();
    ctx.arc(mx + 113, B - 32, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#9aa3aa';
    ctx.fill();
    ctx.fillStyle = rgba('#e8a33c', 0.7);
    ctx.fillRect(mx + 106, B - 39, 14, 3);
    // weapon rack
    box(ctx, mx + 136, 30, 62, 5, '#5a3e2a', 1);
    box(ctx, mx + 136, 70, 62, 5, '#5a3e2a', 1);
    for (let i = 0; i < 5; i++) {
      const rx = mx + 142 + i * 11;
      ctx.fillStyle = ['#3f474f', '#6b4b32', '#4f5d58', '#3a4148', '#7b5a3a'][i];
      ctx.save();
      ctx.translate(rx, 52);
      ctx.rotate(0.12);
      fillRR(ctx, -1.6, -18, 3.2, 34, 1, ctx.fillStyle as string);
      ctx.fillStyle = '#222';
      ctx.fillRect(-2.4, 4, 4.8, 8);
      ctx.restore();
    }
    // anvil
    propShadow(ctx, mx + 170, 30, B);
    ctx.beginPath();
    ctx.moveTo(mx + 156, B - 14);
    ctx.lineTo(mx + 186, B - 14);
    ctx.lineTo(mx + 190, B - 18);
    ctx.lineTo(mx + 152, B - 18);
    ctx.closePath();
    ctx.fillStyle = '#3a3f45';
    ctx.fill();
    box(ctx, mx + 163, B - 14, 14, 9, '#2f343a', 0.5);
    box(ctx, mx + 159, B - 5, 22, 5, '#2f343a', 0.5);
  }
}

function toolSilhouettes(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#3a3f45';
  // hammer
  ctx.fillRect(x + 4, y, 1.6, 20);
  fillRR(ctx, x, y - 1, 10, 4, 0.8, '#3a3f45');
  // wrench
  ctx.save();
  ctx.translate(x + 18, y + 10);
  ctx.rotate(0.3);
  ctx.fillRect(-1, -10, 2, 20);
  ctx.beginPath();
  ctx.arc(0, -11, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // saw
  ctx.beginPath();
  ctx.moveTo(x + 28, y);
  ctx.lineTo(x + 44, y + 2);
  ctx.lineTo(x + 44, y + 7);
  ctx.lineTo(x + 28, y + 5);
  ctx.fill();
  fillRR(ctx, x + 42, y, 6, 7, 1.5, '#8a5a36');
  // screwdrivers
  for (let i = 0; i < 3; i++) {
    fillRR(ctx, x + 30 + i * 5, y + 14, 2.4, 6, 1, ['#c7433b', '#f2c230', '#3f6fa5'][i]);
    ctx.fillStyle = '#9aa3aa';
    ctx.fillRect(x + 30.8 + i * 5, y + 20, 0.8, 8);
  }
  // pliers
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 52, y + 2, 1.4, 16);
  ctx.fillRect(x + 55, y + 2, 1.4, 16);
}

export function weaponsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    ctx.save();
    ctx.translate(mx + 113, B - 32);
    ctx.rotate(active ? t * 18 : 0);
    ctx.strokeStyle = '#5a646e';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 6);
      ctx.stroke();
    }
    ctx.restore();
    if (active) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const ph = (t * 3 + i * 0.13) % 1;
        const a = -0.3 - (i % 4) * 0.25;
        const d = ph * 16;
        ctx.fillStyle = rgba('#ffcf6a', 1 - ph);
        ctx.fillRect(mx + 106 - Math.cos(a) * d, B - 32 + Math.sin(-a) * d * 0.4 + ph * ph * 8, 0.9, 0.9);
      }
      glow(ctx, mx + 107, B - 32, 8, '#ffb04a', 0.35 + 0.2 * Math.sin(t * 20));
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ OUTFIT WORKSHOP
export function outfitsStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // fabric shelf
    shelfUnit(ctx, mx + 12, B - 38, 44, 30, '#8a5a3c', 2);
    const rolls = ['#e8453c', '#3f6fa5', '#f2c230', '#4f8a4a', '#7a4f9a', '#e9e4da'];
    rolls.forEach((c, i) => {
      const rx = mx + 15 + (i % 3) * 13;
      const ry = B - 38 - 2 - (i < 3 ? 0 : 14.2);
      hcylinder(ctx, rx, ry - 6, 12, 6, c);
    });
    // sewing tables
    for (const sx of [mx + 64, mx + 120]) {
      propShadow(ctx, sx + 20, 44, B);
      box(ctx, sx, B - 22, 40, 4, '#a4733f', 1.2);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(sx + 3, B - 18, 1.5, 18);
      ctx.fillRect(sx + 35, B - 18, 1.5, 18);
      // sewing machine body
      ctx.beginPath();
      ctx.moveTo(sx + 8, B - 22);
      ctx.lineTo(sx + 8, B - 34);
      ctx.quadraticCurveTo(sx + 8, B - 38, sx + 12, B - 38);
      ctx.lineTo(sx + 30, B - 38);
      ctx.quadraticCurveTo(sx + 33, B - 38, sx + 33, B - 34);
      ctx.lineTo(sx + 33, B - 28);
      ctx.lineTo(sx + 14, B - 28);
      ctx.lineTo(sx + 14, B - 22);
      ctx.closePath();
      ctx.fillStyle = vgrad(ctx, B - 38, B - 22, [
        [0, '#3a3f45'],
        [1, '#15181b'],
      ]);
      ctx.fill();
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(sx + 16, B - 36, 12, 0.8);
      // fabric on table
      ctx.fillStyle = rolls[(sx / 10) % 6 | 0];
      ctx.beginPath();
      ctx.moveTo(sx + 18, B - 22);
      ctx.lineTo(sx + 38, B - 22);
      ctx.lineTo(sx + 40, B - 12);
      ctx.lineTo(sx + 30, B - 16);
      ctx.fill();
    }
    mannequin(ctx, mx + 176, B, '#b2244b', '#ffd36b');
    mannequin(ctx, mx + 196, B, '#2b7fb8', '#ffb02e');
    // mirror
    fillRR(ctx, mx + 160, 24, 16, 30, 7, '#c9a24a');
    fillRR(ctx, mx + 161.5, 25.5, 13, 27, 6, vgrad(ctx, 25, 52, [
      [0, '#dfeef3'],
      [1, '#9fb8c2'],
    ]));
  }
}

export function outfitsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const sx of [mx + 64, mx + 120]) {
      const off = active ? Math.abs(Math.sin(t * 16)) * 2.5 : 0;
      ctx.fillStyle = '#c9ced2';
      ctx.fillRect(sx + 11, B - 28, 0.8, 3 + off);
    }
  }
}

// ------------------------------------------------------------------ GYM (Strength)
export function gymStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    poster(ctx, mx + 90, 24, 28, 34, '#c9463d', (x, y, pw, ph) => {
      // dumbbell emblem
      const cy = y + ph * 0.4;
      ctx.fillStyle = '#f4d9a8';
      ctx.fillRect(x + pw * 0.3, cy - 0.9, pw * 0.4, 1.8);
      fillRR(ctx, x + pw * 0.18, cy - 5, 3.4, 10, 1, '#f4d9a8');
      fillRR(ctx, x + pw * 0.82 - 3.4, cy - 5, 3.4, 10, 1, '#f4d9a8');
      fillRR(ctx, x + pw * 0.12, cy - 3.5, 2.2, 7, 0.8, '#f4d9a8');
      fillRR(ctx, x + pw * 0.88 - 2.2, cy - 3.5, 2.2, 7, 0.8, '#f4d9a8');
      posterText(ctx, lang === 'ru' ? 'СИЛА!' : 'POWER!', x + pw / 2, y + ph * 0.84, 5.5, '#f4d9a8');
    });
    // weight plates rack
    propShadow(ctx, mx + 30, 40, B);
    box(ctx, mx + 14, B - 36, 3, 36, '#3a3f45', 0.5);
    box(ctx, mx + 42, B - 36, 3, 36, '#3a3f45', 0.5);
    for (let i = 0; i < 3; i++) {
      const py = B - 30 + i * 11;
      ctx.fillStyle = '#6d757b';
      ctx.fillRect(mx + 14, py, 31, 1.2);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(mx + 21 + k * 8, py - 3, 4 - i * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = ['#2b2e33', '#c9463d', '#2f6fb8'][(i + k) % 3];
        ctx.fill();
      }
    }
    // bench press
    propShadow(ctx, mx + 150, 60, B);
    box(ctx, mx + 128, B - 12, 44, 4, '#2b2e33', 2);
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 132, B - 8, 2, 8);
    ctx.fillRect(mx + 166, B - 8, 2, 8);
    ctx.fillRect(mx + 128, B - 34, 2, 26);
    ctx.fillRect(mx + 170, B - 34, 2, 26);
    // barbell resting
    ctx.fillStyle = '#b9c1c7';
    ctx.fillRect(mx + 118, B - 34, 64, 1.6);
    for (const px of [mx + 120, mx + 176]) {
      fillRR(ctx, px - 1, B - 42, 5, 17, 1.5, '#1f2226');
    }
    // dumbbells rack
    box(ctx, mx + 190, B - 18, 14, 18, '#3a3f45', 1);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#1f2226';
      fillRR(ctx, mx + 191, B - 16 + i * 5.5, 12, 3, 1.4, '#1f2226');
    }
  }
}

export function gymDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // punching bag
    const sw = active ? Math.sin(t * 3 + m) * 0.12 : 0;
    ctx.save();
    ctx.translate(mx + 72, WALL_TOP + 2);
    ctx.rotate(sw);
    ctx.strokeStyle = '#6d757b';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.stroke();
    fillRR(ctx, -6, 18, 12, 36, 5, hgrad(ctx, -6, 6, [
      [0, '#6b2a22'],
      [0.35, '#b5443a'],
      [1, '#5a221c'],
    ]));
    ctx.fillStyle = '#2b2e33';
    ctx.fillRect(-6, 24, 12, 1.5);
    ctx.fillRect(-6, 46, 12, 1.5);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ ARMORY / SHOOTING RANGE (Perception)
export function armoryStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // booth dividers
    for (let i = 0; i < 3; i++) {
      const bx = mx + 14 + i * 26;
      box(ctx, bx, B - 44, 3, 44, '#6b6358', 0.8);
    }
    box(ctx, mx + 12, B - 22, 82, 3, '#8a7a62', 0.8);
    // ear muffs & ammo boxes
    for (let i = 0; i < 3; i++) {
      const bx = mx + 20 + i * 26;
      metalCrate(ctx, bx, B - 29, 10, 7, '#4f5d3a');
      ctx.strokeStyle = '#e8453c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx + 15, B - 26, 3, Math.PI, 0);
      ctx.stroke();
    }
    // target lane back wall
    ctx.fillStyle = rgba('#000', 0.2);
    ctx.fillRect(mx + 100, WALL_TOP, M - 104, WALL_BOTTOM - WALL_TOP);
    // hanging rail
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 100, WALL_TOP + 4, M - 106, 1.4);
    // sandbags
    for (let i = 0; i < 6; i++) {
      fillRR(ctx, mx + 104 + i * 16, B - 8 - (i % 2) * 2, 16, 8, 3.5, '#b09a6a');
    }
  }
}

export function armoryDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (let i = 0; i < 3; i++) {
      const tx = mx + 122 + i * 28;
      const bob = active ? Math.sin(t * 1.5 + i) * 1.5 : 0;
      ctx.strokeStyle = '#6d757b';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(tx, WALL_TOP + 5);
      ctx.lineTo(tx, 40 + bob);
      ctx.stroke();
      const cy = 52 + bob;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(tx, cy, 11 - k * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = k % 2 ? '#f4efe0' : '#c7433b';
        ctx.fill();
      }
      if (active) {
        for (let h = 0; h < 3; h++) {
          const ang = t * 0.3 + h * 2.1 + i;
          const rr = 2 + ((h * 3.7 + i) % 7);
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(tx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (active && Math.sin(t * 7) > 0.9) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 95, B - 28, 6, '#ffcf6a', 0.6);
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ FITNESS (Endurance)
export function fitnessStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // mirror wall
    fillRR(ctx, mx + 16, 24, 90, 40, 2, vgrad(ctx, 24, 64, [
      [0, '#cfe2ea'],
      [1, '#9ab6c2'],
    ]));
    ctx.strokeStyle = rgba('#ffffff', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 30, 26);
    ctx.lineTo(mx + 22, 40);
    ctx.moveTo(mx + 70, 26);
    ctx.lineTo(mx + 58, 48);
    ctx.stroke();
    // treadmills
    for (const tx of [mx + 16, mx + 62]) {
      propShadow(ctx, tx + 20, 44, B);
      box(ctx, tx, B - 6, 40, 6, '#2b2e33', 2);
      ctx.fillStyle = '#6d757b';
      ctx.fillRect(tx + 34, B - 30, 2, 24);
      box(ctx, tx + 28, B - 34, 12, 5, '#3a3f45', 1);
      ctx.fillStyle = '#5dff9a';
      ctx.fillRect(tx + 30, B - 33, 5, 2);
    }
    // bikes
    for (const bx of [mx + 120, mx + 152]) {
      propShadow(ctx, bx + 12, 26, B);
      ctx.strokeStyle = '#2f6fb8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 4, B - 2);
      ctx.lineTo(bx + 10, B - 20);
      ctx.lineTo(bx + 22, B - 24);
      ctx.moveTo(bx + 10, B - 20);
      ctx.lineTo(bx + 20, B - 2);
      ctx.stroke();
      fillRR(ctx, bx + 6, B - 23, 8, 2.4, 1, '#1f2226');
      fillRR(ctx, bx + 20, B - 27, 4, 5, 1, '#3a3f45');
    }
    // water cooler
    propShadow(ctx, mx + 194, 14, B);
    box(ctx, mx + 188, B - 26, 12, 26, '#e9eef0', 1.5);
    fillRR(ctx, mx + 189, B - 40, 10, 15, 4, rgba('#6fc3e8', 0.7));
    ctx.fillStyle = '#39c6e8';
    ctx.fillRect(mx + 191, B - 20, 2, 2);
    ctx.fillStyle = '#e84a3c';
    ctx.fillRect(mx + 195, B - 20, 2, 2);
  }
}

export function fitnessDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const tx of [mx + 16, mx + 62]) {
      ctx.fillStyle = rgba('#000', 0.5);
      const off = active ? (t * 30) % 6 : 0;
      for (let x = tx + 3 - off; x < tx + 38; x += 6) if (x > tx + 2) ctx.fillRect(x, B - 5.5, 1, 2);
    }
    for (const bx of [mx + 120, mx + 152]) {
      ctx.save();
      ctx.translate(bx + 20, B - 6);
      ctx.rotate(active ? t * 6 : 0);
      ctx.strokeStyle = '#9aa3aa';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ LOUNGE (Charisma)
export function loungeStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // backlit bottle shelf
    box(ctx, mx + 14, 26, 70, 34, '#2a1a24', 1.5);
    fillRR(ctx, mx + 16, 28, 66, 30, 1, rgba('#ffb04a', 0.18));
    for (let r = 0; r < 2; r++) {
      box(ctx, mx + 16, 42 + r * 14, 66, 1.6, '#c9a24a', 0.3);
      for (let i = 0; i < 9; i++) {
        const bx = mx + 19 + i * 7;
        const col = ['#6aff8c', '#ff7cc0', '#ffcf4a', '#5fd3ef', '#e8453c'][(i + r) % 5];
        fillRR(ctx, bx, 42 + r * 14 - 10, 4, 10, 1.3, rgba(col, 0.75));
        ctx.fillStyle = rgba('#ffffff', 0.4);
        ctx.fillRect(bx + 0.6, 42 + r * 14 - 9, 0.7, 7);
      }
    }
    // bar counter
    propShadow(ctx, mx + 50, 80, B);
    box(ctx, mx + 12, B - 22, 76, 22, '#4b2a4f', 2);
    ctx.fillStyle = hgrad(ctx, mx + 12, mx + 88, [
      [0, '#8a6a2a'],
      [0.5, '#f0cf6a'],
      [1, '#8a6a2a'],
    ]);
    ctx.fillRect(mx + 10, B - 24, 80, 2.5);
    for (let i = 0; i < 3; i++) stool(ctx, mx + 24 + i * 26, FLOOR_FRONT - 2.5, '#c9a24a');
    // piano
    propShadow(ctx, mx + 130, 50, B);
    box(ctx, mx + 108, B - 36, 44, 36, '#15121a', 2);
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(mx + 110, B - 22, 40, 4);
    ctx.fillStyle = '#15121a';
    for (let i = 0; i < 12; i++) if (i % 7 !== 2 && i % 7 !== 6) ctx.fillRect(mx + 112 + i * 3.3, B - 22, 1.4, 2.4);
    // velvet sofa
    sofa(ctx, mx + 160, B, 42, '#8a2a4a');
  }
  const label = lang === 'ru' ? 'ЛАУНЖ' : 'LOUNGE';
  ctx.font = '700 7px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb4e0';
  ctx.fillText(label, size === 1 ? 150 : w / 2, 30);
}

export function loungeDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  const cx = size === 1 ? 150 : w / 2;
  // disco ball
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(cx - 0.3, WALL_TOP, 0.6, 5);
  ctx.beginPath();
  ctx.arc(cx, WALL_TOP + 9, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, cx - 1.5, WALL_TOP + 7.5, 0, 5, [
    [0, '#ffffff'],
    [1, '#6d757b'],
  ]);
  ctx.fill();
  if (!active) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, cx, 30, 34, '#ff5ab4', 0.22 + 0.08 * Math.sin(t * 5));
  const cols = ['#ff7cc0', '#7f95ff', '#ffcf4a', '#6aff8c'];
  for (let i = 0; i < 10; i++) {
    const a = t * 0.8 + (i * Math.PI * 2) / 10;
    const x = cx + Math.cos(a) * (40 + (i % 3) * 25);
    const y = 50 + Math.sin(a * 1.3) * 22;
    if (x < IX0 + 4 || x > w - IX0 - 4) continue;
    glow(ctx, x, y, 4, cols[i % 4], 0.6);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ CLASSROOM (Intelligence)
export function classroomStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // blackboard
    box(ctx, mx + 40, 22, 90, 38, '#6b4428', 1);
    fillRR(ctx, mx + 42, 24, 86, 34, 0.8, '#2b3d33');
    ctx.fillStyle = rgba('#f1efe6', 0.8);
    ctx.font = '500 5px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(lang === 'ru' ? 'Урок №' + (m + 1) + ': Выживание' : 'Lesson ' + (m + 1) + ': Survival', mx + 46, 31);
    ctx.font = '500 4px Rubik, sans-serif';
    ctx.fillText('2 + 2 = 4', mx + 46, 39);
    ctx.fillText('a² + b² = c²', mx + 46, 46);
    ctx.fillText(lang === 'ru' ? '☢ ≠ еда' : '☢ ≠ food', mx + 46, 53);
    ctx.strokeStyle = rgba('#f1efe6', 0.7);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(mx + 96, 50);
    ctx.lineTo(mx + 108, 32);
    ctx.lineTo(mx + 120, 50);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#e9e4da';
    ctx.fillRect(mx + 60, 58, 8, 1.2);
    // teacher desk + globe
    propShadow(ctx, mx + 30, 34, B);
    box(ctx, mx + 12, B - 20, 36, 4, '#7a4a2a', 1);
    box(ctx, mx + 14, B - 16, 12, 16, '#6b4128', 1);
    ctx.fillStyle = '#6b4128';
    ctx.fillRect(mx + 44, B - 16, 2, 16);
    ctx.beginPath();
    ctx.arc(mx + 36, B - 27, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4a7ab5';
    ctx.fill();
    ctx.fillStyle = '#6f9a5a';
    ctx.beginPath();
    ctx.ellipse(mx + 35, B - 28, 2.2, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    books(ctx, mx + 18, B - 20, 12, 4);
    // student desks
    for (let i = 0; i < 3; i++) {
      const dx = mx + 70 + i * 34;
      propShadow(ctx, dx + 11, 26, B);
      box(ctx, dx, B - 15, 22, 3, '#a4733f', 1);
      ctx.fillStyle = '#6d757b';
      ctx.fillRect(dx + 2, B - 12, 1.2, 12);
      ctx.fillRect(dx + 19, B - 12, 1.2, 12);
      ctx.fillStyle = '#f4efe0';
      ctx.fillRect(dx + 6, B - 16.2, 8, 1.2);
    }
    // bookshelf + skeleton
    shelfUnit(ctx, mx + 176, B, 26, 52, '#6b4a32', 3);
    books(ctx, mx + 178, B - 35, 22, m + 2);
    books(ctx, mx + 178, B - 18, 22, m + 5);
  }
}

// ------------------------------------------------------------------ ATHLETICS (Agility)
export function athleticsStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // climbing wall
    fillRR(ctx, mx + 14, 22, 40, B - 24, 2, '#7ea4c9');
    for (let i = 0; i < 14; i++) {
      const hx = mx + 18 + ((i * 13) % 32);
      const hy = 28 + ((i * 17) % 64);
      ctx.fillStyle = ['#e8453c', '#f2c230', '#4fc36b', '#7a4f9a'][i % 4];
      ctx.beginPath();
      ctx.ellipse(hx, hy, 2.2, 1.6, i, 0, Math.PI * 2);
      ctx.fill();
    }
    // balance beam
    propShadow(ctx, mx + 100, 70, B);
    box(ctx, mx + 66, B - 16, 70, 3.6, '#c9a26b', 1.5);
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 72, B - 12.4, 2, 12.4);
    ctx.fillRect(mx + 128, B - 12.4, 2, 12.4);
    // pommel horse
    propShadow(ctx, mx + 170, 40, B);
    fillRR(ctx, mx + 150, B - 22, 40, 9, 4.5, '#6b3a22');
    ctx.fillStyle = '#c9a26b';
    ctx.fillRect(mx + 162, B - 26, 2, 4);
    ctx.fillRect(mx + 176, B - 26, 2, 4);
    ctx.fillRect(mx + 161, B - 27, 4, 1.4);
    ctx.fillRect(mx + 175, B - 27, 4, 1.4);
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 156, B - 13, 2, 13);
    ctx.fillRect(mx + 182, B - 13, 2, 13);
    // stars poster
    poster(ctx, mx + 150, 26, 28, 22, '#2f5d99', (x, y, pw, ph) => {
      ctx.fillStyle = '#ffcf4a';
      star5(ctx, x + pw / 2, y + ph / 2, 7);
      ctx.fill();
    });
  }
}

export function athleticsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const sw = active ? Math.sin(t * 2 + m) * 0.08 : 0;
    for (const rx of [mx + 92, mx + 108]) {
      ctx.save();
      ctx.translate(rx, WALL_TOP);
      ctx.rotate(sw);
      ctx.strokeStyle = '#c9a26b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 30);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#5a3e22';
      ctx.beginPath();
      ctx.arc(0, 34, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ GAME ROOM (Luck)
export function gameroomStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    arcadeCabinet(ctx, mx + 14, B, '#c7433b');
    arcadeCabinet(ctx, mx + 32, B, '#2f6fb8');
    arcadeCabinet(ctx, mx + 50, B, '#4f8a4a');
    // pool table
    propShadow(ctx, mx + 110, 64, B, 0.5);
    box(ctx, mx + 82, B - 20, 58, 6, '#5a3a22', 2);
    fillRR(ctx, mx + 85, B - 20, 52, 3, 1, '#2f7a4a');
    ctx.fillStyle = '#4a2e1a';
    ctx.fillRect(mx + 86, B - 14, 4, 14);
    ctx.fillRect(mx + 132, B - 14, 4, 14);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(mx + 100 + i * 5, B - 21.5, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = ['#f2c230', '#e8453c', '#2f6fb8', '#1a1a1a', '#ffffff'][i];
      ctx.fill();
    }
    // dartboard
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(mx + 110, 36, 10 - k * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = k % 2 ? '#f4efe0' : k === 0 ? '#1a1a1a' : '#c7433b';
      ctx.fill();
    }
    ctx.fillStyle = '#4fc36b';
    ctx.beginPath();
    ctx.arc(mx + 110, 36, 1.4, 0, Math.PI * 2);
    ctx.fill();
    // slot machine
    propShadow(ctx, mx + 170, 26, B);
    box(ctx, mx + 158, B - 40, 24, 40, '#c9a24a', 3);
    fillRR(ctx, mx + 161, B - 34, 18, 10, 1, '#f4efe0');
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 182, B - 36, 2, 12);
    ctx.beginPath();
    ctx.arc(mx + 183, B - 37, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#e8453c';
    ctx.fill();
    // neon dice sign
    box(ctx, mx + 150, 22, 40, 14, '#1d1a2b', 2);
  }
}

export function gameroomDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (let i = 0; i < 3; i++) {
      const sx = mx + 16 + i * 18;
      const c = ['#ff5a4a', '#5fd3ef', '#6aff8c'][i];
      ctx.fillStyle = active ? rgba(c, 0.35 + 0.25 * Math.sin(t * 5 + i)) : rgba(c, 0.08);
      fillRR(ctx, sx, B - 28, 10, 9, 1, ctx.fillStyle as string);
      if (active) {
        ctx.fillStyle = rgba('#ffffff', 0.8);
        ctx.fillRect(sx + 2 + ((t * 8 + i * 3) % 6), B - 24, 1.2, 1.2);
      }
    }
    // slot reels
    const syms = ['7', '★', '♣', '♦', '♥'];
    ctx.font = '700 5px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const idx = active ? Math.floor(t * (6 + i * 2)) % syms.length : i;
      ctx.fillStyle = '#c7433b';
      ctx.fillText(syms[idx], mx + 164 + i * 6, B - 29);
    }
    ctx.font = '700 7px Unbounded, Oswald, sans-serif';
    ctx.fillStyle = active ? '#ff7cc0' : '#5a3a4a';
    ctx.fillText('⚅ ⚃', mx + 170, 29.5);
    if (active) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 170, 29, 20, '#ff5ab4', 0.25);
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ REACTOR
export function reactorStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // side pipes
    pipeV(ctx, mx + 30, WALL_TOP, B, 5, '#6b7a82');
    pipeV(ctx, mx + 180, WALL_TOP, B, 5, '#6b7a82');
    pipeH(ctx, mx + 30, mx + 70, 40, 3.5, '#6b7a82');
    pipeH(ctx, mx + 140, mx + 180, 40, 3.5, '#6b7a82');
    // vessel
    propShadow(ctx, mx + 105, 90, B, 0.55);
    box(ctx, mx + 62, B - 12, 86, 12, '#3a424b', 2);
    fillRR(ctx, mx + 70, B - 76, 70, 66, 26, hgrad(ctx, mx + 70, mx + 140, [
      [0, '#3c4a44'],
      [0.3, '#8fa39a'],
      [0.55, '#6b7f76'],
      [1, '#2a3530'],
    ]));
    // window
    fillRR(ctx, mx + 88, B - 62, 34, 42, 12, '#1a2420');
    // rods on top
    for (let i = 0; i < 4; i++) {
      const rx = mx + 84 + i * 12;
      box(ctx, rx, B - 88, 5, 14, '#c9a24a', 1);
    }
    // trefoil signs
    trefoil(ctx, mx + 50, 70, 6);
    trefoil(ctx, mx + 160, 70, 6);
    // control desk
    consolePanel(ctx, mx + 150, B - 16, 26, 16, '#4a5561');
    hazard(ctx, IX0, WALL_BOTTOM - 5, w - IX0 * 2, 3, '#e2a72a', '#262a2f', 4);
  }
}

export function trefoil(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.4, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c230';
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a - 0.5, a + 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

export function reactorDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const p = active ? 0.6 + 0.4 * Math.sin(t * 2.5 + m) : 0.1;
    ctx.save();
    rrect(ctx, mx + 88, B - 62, 34, 42, 12);
    ctx.clip();
    ctx.fillStyle = rgrad(ctx, mx + 105, B - 41, 2, 26, [
      [0, rgba('#eaffb0', 0.9 * p + 0.1)],
      [0.4, rgba('#6aff8c', 0.7 * p + 0.1)],
      [1, rgba('#0b3a2a', 0.9)],
    ]);
    ctx.fillRect(mx + 88, B - 62, 34, 42);
    // fuel rods inside
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = rgba('#1a2a22', 0.6);
      ctx.fillRect(mx + 94 + i * 7, B - 58, 2.4, 34);
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, mx + 105, B - 41, 55, '#6aff8c', 0.25 * p);
    ctx.restore();
    // control lights
    for (let i = 0; i < 4; i++) {
      const on = active && Math.sin(t * 3 + i * 1.3) > -0.2;
      ctx.fillStyle = on ? ['#6aff8c', '#ffcf4a', '#6aff8c', '#ff5a4a'][i] : '#2a2f35';
      ctx.fillRect(mx + 154 + i * 5, B - 19, 2.4, 1.6);
    }
  }
}

// ------------------------------------------------------------------ GARDEN
export function gardenStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // grow light bars
    for (let i = 0; i < 3; i++) {
      box(ctx, mx + 18 + i * 64, WALL_TOP + 3, 46, 3, '#3a3f45', 1);
      fillRR(ctx, mx + 20 + i * 64, WALL_TOP + 6, 42, 1.4, 0.6, '#ffb8f0');
    }
    // hydroponic rack (upper tier)
    for (let i = 0; i < 3; i++) {
      const px = mx + 16 + i * 64;
      box(ctx, px, 58, 52, 5, '#e9eef0', 1);
      ctx.fillStyle = '#9aa3aa';
      ctx.fillRect(px + 2, 63, 1.2, B - 63);
      ctx.fillRect(px + 48.8, 63, 1.2, B - 63);
      for (let k = 0; k < 6; k++) lettuce(ctx, px + 5 + k * 8.4, 58, 0.8 + (k % 2) * 0.15);
      // lower planter box with soil
      box(ctx, px, B - 12, 52, 12, '#8a5a36', 1);
      ctx.fillStyle = '#3b2a1a';
      ctx.fillRect(px + 1.5, B - 12, 49, 2.5);
      for (let k = 0; k < 4; k++) {
        if ((i + k) % 2) tomatoPlant(ctx, px + 7 + k * 12.5, B - 12);
        else corn(ctx, px + 7 + k * 12.5, B - 12);
      }
    }
    // watering pipe
    pipeH(ctx, mx + IX0, mx + M - IX0, 52, 1.6, '#6b7a82');
  }
}

function lettuce(ctx: Ctx, x: number, y: number, s: number) {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (i - 2) * 1.4 * s, y - 2.5 * s, 1.8 * s, 3 * s, (i - 2) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#7ed957' : '#5fb84a';
    ctx.fill();
  }
}
function tomatoPlant(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = '#3f7a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 2, y - 12, x + 1, y - 22);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (i % 2 ? 3 : -3), y - 5 - i * 4, 3, 1.4, i % 2 ? 0.4 : -0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#4f9b4a';
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 2.4, y - 9 - i * 4, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e8453c';
    ctx.fill();
  }
}
function corn(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#5a9b3a';
  ctx.fillRect(x - 0.6, y - 28, 1.2, 28);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(x, y - 6 - i * 6);
    ctx.rotate(i % 2 ? 0.8 : -0.8);
    ctx.beginPath();
    ctx.ellipse(0, -4, 1.2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6fb84a';
    ctx.fill();
    ctx.restore();
  }
  fillRR(ctx, x + 0.8, y - 20, 2.4, 7, 1.2, '#f2c230');
}

export function gardenDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  if (!active) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (let i = 0; i < 3; i++) {
      const g = ctx.createLinearGradient(0, WALL_TOP + 6, 0, B);
      g.addColorStop(0, rgba('#ff7ae0', 0.22));
      g.addColorStop(1, rgba('#ff7ae0', 0));
      ctx.fillStyle = g;
      ctx.fillRect(mx + 18 + i * 64, WALL_TOP + 6, 46, B - WALL_TOP - 6);
    }
    // water drips
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.8 + i * 0.37) % 1;
      ctx.fillStyle = rgba('#8fdcff', 0.8 * (1 - ph));
      ctx.fillRect(mx + 20 + i * 32, 54 + ph * 4, 0.7, 1.4);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ PURIFIER
export function purifierStatic(ctx: Ctx, w: number, size: number, level: number) {
  pipeH(ctx, IX0, w - IX0, WALL_TOP + 6, 4, '#5b6d77');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (let i = 0; i < 3; i++) {
      const cx = mx + 18 + i * 64;
      propShadow(ctx, cx + 16, 40, B);
      cylinder(ctx, cx, WALL_TOP + 12, 32, B - WALL_TOP - 12, '#7f98a3', 5);
      fillRR(ctx, cx + 11, WALL_TOP + 20, 10, B - WALL_TOP - 34, 4, '#0f2b36');
      for (const by of [WALL_TOP + 16, B - 10]) {
        ctx.fillStyle = rgba('#000', 0.3);
        ctx.fillRect(cx, by, 32, 1.3);
      }
      gauge(ctx, cx + 26, 60, 3, 0.4 + i * 0.15);
    }
    // pumps between columns
    for (let i = 0; i < 2; i++) {
      const px = mx + 52 + i * 64;
      box(ctx, px, B - 20, 28, 20, '#39505b', 2);
      ctx.beginPath();
      ctx.arc(px + 14, B - 11, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#1f2c33';
      ctx.fill();
    }
  }
}

export function purifierDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (let i = 0; i < 3; i++) {
      const cx = mx + 18 + i * 64;
      const x0 = cx + 11;
      const y0 = WALL_TOP + 20;
      const h = B - WALL_TOP - 34;
      ctx.save();
      rrect(ctx, x0, y0, 10, h, 4);
      ctx.clip();
      ctx.fillStyle = vgrad(ctx, y0, y0 + h, [
        [0, '#8fe8ff'],
        [1, '#1c7fa6'],
      ]);
      ctx.fillRect(x0, y0 + 4, 10, h);
      if (active) {
        for (let k = 0; k < 8; k++) {
          const ph = (t * 0.5 + k / 8 + i * 0.1) % 1;
          ctx.fillStyle = rgba('#ffffff', 0.7);
          ctx.beginPath();
          ctx.arc(x0 + 2 + ((k * 3) % 6), y0 + h - ph * h, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    for (let i = 0; i < 2; i++) {
      const px = mx + 52 + i * 64;
      ctx.save();
      ctx.translate(px + 14, B - 11);
      ctx.rotate(active ? t * 8 : 0);
      ctx.fillStyle = '#8fb3c2';
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, -2.6, 1.3, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ DAWN CENTER
export function dawnStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // pillars with light strips
    for (const px of [mx + 18, mx + 184]) {
      box(ctx, px, WALL_TOP, 10, B - WALL_TOP, '#26304a', 1);
      ctx.fillStyle = rgba('#ffe27a', 0.6);
      ctx.fillRect(px + 4.3, WALL_TOP + 4, 1.4, B - WALL_TOP - 8);
    }
    // pedestal
    propShadow(ctx, mx + 105, 80, B, 0.5);
    box(ctx, mx + 70, B - 10, 70, 10, '#2a3345', 2);
    box(ctx, mx + 80, B - 18, 50, 8, '#323d52', 2);
    // consoles
    for (const cx of [mx + 36, mx + 150]) {
      consolePanel(ctx, cx, B - 18, 24, 18, '#2a3345');
      screenRect(ctx, cx + 2, B - 44, 20, 14, '#0b1f33', '#1c2433');
    }
    atomLogo(ctx, mx + 105, 26, 6, rgba('#ffe27a', 0.6));
  }
}

export function dawnDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const cx = mx + 105;
    const cy = B - 46;
    const p = active ? 1 : 0.25;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, 50, '#ffcf4a', 0.28 * p);
    ctx.restore();
    // globe
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = rgrad(ctx, cx - 5, cy - 5, 2, 17, [
      [0, '#9fe0ff'],
      [0.6, '#2f7fb8'],
      [1, '#12304f'],
    ]);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.clip();
    const off = (t * 6) % 40;
    ctx.fillStyle = '#6fbf5a';
    for (let k = -1; k < 2; k++) {
      ctx.beginPath();
      ctx.ellipse(cx - 20 + off + k * 40, cy - 3, 7, 5, 0.4, 0, Math.PI * 2);
      ctx.ellipse(cx - 8 + off + k * 40, cy + 6, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // rings
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * (0.4 + i * 0.25) * p + i);
      ctx.strokeStyle = rgba('#ffe27a', 0.85);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24 + i * 3, 7 + i * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath();
      ctx.arc(24 + i * 3, 0, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // console holo lines
    for (const scx of [mx + 38, mx + 152]) {
      ctx.strokeStyle = rgba('#ffe27a', 0.7 * p);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const y = B - 37 + Math.sin(t * 3 + i * 0.5 + scx) * 3 * p;
        if (i === 0) ctx.moveTo(scx + i, y);
        else ctx.lineTo(scx + i, y);
      }
      ctx.stroke();
    }
  }
}

export { crate, plant, buttonsRow, signPlate, hcylinder, screenRect, shade };
