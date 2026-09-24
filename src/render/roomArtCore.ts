/* Room interiors v2 for the core rooms: modular variants, richer props. Local coords, room top-left = (0,0). */
import { box, cylinder, fillRR, gauge, glow, hazard, hcylinder, hgrad, pipeH, pipeV, rgba, rgrad, rivet, rrect, vgrad, type Ctx } from './gfx';
import { bx0, bx1, propShadow, signPlate } from './roomBase';
import { barrel, bolt, books, buttonsRow, crate, floorLamp, frame, landscapeArt, metalCrate, plant, poster, posterText, shelfUnit, sofa, stool, tvSet, valveWheel, wallClock } from './props';
import {
  bigValve, booth, breakerPanel, cableReel, ceilingPipe, chair, chandelier, coffeeTable, curtains, doubleBed, fakeWindow, filterColumn, gunRack, jukebox, kitchenCounter, lockers, monitorBank, neonGlow, neonSign, nightstand,
  panel, pump, roundTable, rug, steamTable, stringLights, transformer, turbine, upperCabinets, wallSconce, wallVent, wardrobe,
} from './furniture';
import { FEET_Y, FLOOR_FRONT, WALL_BOTTOM, WALL_TOP } from './world';

const B = WALL_BOTTOM + 1.5;
const M = 210;
const FLOORMID = (WALL_BOTTOM + FLOOR_FRONT) / 2;

/** Module variant: rooms show module A when single; merged rooms add B and C. */
const variant = (m: number, size: number) => (size === 1 ? 0 : m % 3);

// ================================================================== POWER
export function powerStatic(ctx: Ctx, w: number, size: number, level: number) {
  // ceiling cable tray
  panel(ctx, bx0(), WALL_TOP + 1, bx1(w) - bx0(), 3.4, '#2a2f36', 0.6);
  hazard(ctx, bx0(), WALL_BOTTOM - 7.5, bx1(w) - bx0(), 4, '#e2a72a', '#262a2f', 5);
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (const gx of [mx + 20, mx + 122]) generator(ctx, gx, level);
      controlCabinet(ctx, mx + 97, 42);
      emblem(ctx, mx + 105, 29);
    } else if (v === 1) {
      transformer(ctx, mx + 16, B, '#5d6f5d');
      transformer(ctx, mx + 48, B, '#5d6f5d');
      breakerPanel(ctx, mx + 92, 34, 46, 48);
      cableReel(ctx, mx + 158, B, 11);
      cableReel(ctx, mx + 182, B, 8, '#3f6fa5');
      poster(ctx, mx + 150, 30, 30, 26, '#f2c230', (x, y, pw, ph) => {
        bolt(ctx, x + pw / 2 - 6, y + 3, 13, '#1a1a1a');
        posterText(ctx, 'ОПАСНО', x + pw / 2, y + ph - 5, 4.6, '#1a1a1a');
      });
    } else {
      turbine(ctx, mx + 18, B, 112);
      controlDesk(ctx, mx + 146, B);
      wallVent(ctx, mx + 150, 30, 38, 16);
    }
  }
  // cables dropping from the tray
  ctx.strokeStyle = '#15191d';
  ctx.lineWidth = 1.4;
  for (let x = bx0() + 30; x < bx1(w) - 20; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, WALL_TOP + 4);
    ctx.quadraticCurveTo(x + 8, WALL_TOP + 16, x + 3, WALL_TOP + 26);
    ctx.stroke();
  }
}

function emblem(ctx: Ctx, cx: number, cy: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2f35';
  ctx.fill();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = '#e2a72a';
  ctx.stroke();
  bolt(ctx, cx - 4.5, cy - 5.5, 10, '#ffd23d');
}

function controlCabinet(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 9, 24, B);
  panel(ctx, x, y, 18, B - y, '#56606b', 1.6);
  gauge(ctx, x + 5, y + 8, 3.2, 0.3);
  gauge(ctx, x + 13, y + 8, 3.2, 0.7);
  fillRR(ctx, x + 3, y + 15, 12, 8, 1, '#1d252c');
  buttonsRow(ctx, x + 4, y + 29, 4);
  ctx.fillStyle = rgba('#000', 0.3);
  ctx.fillRect(x + 2, y + 35, 14, 0.7);
  ctx.fillRect(x + 2, y + 45, 14, 0.7);
}

function controlDesk(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1);
  panel(ctx, x, y - 18, 44, 18, '#4a5561', 1.4);
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 18);
  ctx.lineTo(x + 45, y - 18);
  ctx.lineTo(x + 41, y - 24);
  ctx.lineTo(x + 3, y - 24);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 24, y - 18, [
    [0, '#6d7a86'],
    [1, '#4a5561'],
  ]);
  ctx.fill();
  buttonsRow(ctx, x + 8, y - 21, 8);
  gauge(ctx, x + 10, y - 11, 3, 0.4);
  gauge(ctx, x + 34, y - 11, 3, 0.6);
  fillRR(ctx, x + 16, y - 15, 12, 7, 1, '#10202a');
}

function generator(ctx: Ctx, gx: number, level: number) {
  const body = level >= 3 ? '#e0b43a' : level === 2 ? '#d49a2c' : '#c98f2a';
  propShadow(ctx, gx + 34, 78, B, 0.55);
  panel(ctx, gx - 2, B - 15, 72, 15, '#3a424b', 1.6);
  hazard(ctx, gx, B - 4, 68, 2.4, '#e2a72a', '#262a2f', 3);
  hcylinder(ctx, gx + 12, B - 44, 56, 29, body);
  for (let i = 0; i < 6; i++) {
    const x = gx + 26 + i * 6;
    ctx.fillStyle = vgrad(ctx, B - 43, B - 16, [
      [0, '#6b3b18'],
      [0.3, '#f0a868'],
      [0.6, '#b8672e'],
      [1, '#4b2610'],
    ]);
    ctx.fillRect(x, B - 43, 3.6, 27);
  }
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.fillRect(gx + 22, B - 44, 1.5, 29);
  ctx.fillRect(gx + 64, B - 44, 1.5, 29);
  ctx.beginPath();
  ctx.arc(gx + 12, B - 29.5, 15, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, gx + 8, B - 34, 2, 17, [
    [0, '#5b646e'],
    [1, '#1f252b'],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#7a8591';
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const ix = gx + 32 + i * 11;
    for (let k = 0; k < 3; k++) fillRR(ctx, ix - 2.6 + k * 0.4, B - 50 - k * 3, 5.2 - k * 0.8, 2.6, 1, k % 2 ? '#d8d2c2' : '#f1ece0');
    ctx.fillStyle = '#9aa3ac';
    ctx.fillRect(ix - 0.6, B - 56, 1.2, 3);
  }
  ctx.strokeStyle = '#15191d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(gx + 64, B - 38);
  ctx.bezierCurveTo(gx + 80, B - 58, gx + 70, WALL_TOP + 10, gx + 76, WALL_TOP + 3);
  ctx.stroke();
}

export function powerDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (const [k, gx] of [mx + 20, mx + 122].entries()) {
        const cx = gx + 12;
        const cy = B - 29.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(active ? t * 5 + k : k);
        ctx.strokeStyle = '#aab4bd';
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 11.5, Math.sin(a) * 11.5);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#8b959f';
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#d9dee2';
        ctx.fill();
        if (active) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 3; i++) {
            const f = 0.5 + 0.5 * Math.sin(t * 9 + i * 2 + k);
            glow(ctx, gx + 32 + i * 11, B - 55, 7, '#ffd86b', 0.35 + f * 0.35);
          }
          if (Math.sin(t * 3.1 + k * 1.7) > 0.55) {
            ctx.strokeStyle = rgba('#fff4c2', 0.9);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            const x0 = gx + 32;
            ctx.moveTo(x0, B - 55);
            for (let s = 1; s <= 8; s++) ctx.lineTo(x0 + s * 2.75, B - 58 + Math.random() * 6);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      const on = active ? 1 : 0.25;
      ctx.fillStyle = rgba('#5dff9a', 0.6 * on);
      for (let i = 0; i < 4; i++) {
        const h = 2 + 5 * Math.abs(Math.sin(t * (1.3 + i) + i));
        ctx.fillRect(mx + 101 + i * 2.6, 65 - h, 1.8, h);
      }
    } else if (v === 1) {
      if (active) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 2; i++) glow(ctx, mx + 30 + i * 32, B - 36, 16, '#b8ff9a', 0.12 + 0.08 * Math.sin(t * 7 + i));
        ctx.restore();
      }
      for (let r = 0; r < 5; r++) {
        const on = active && Math.sin(t * 2 + r * 1.3 + m) > 0;
        ctx.fillStyle = on ? '#6aff8c' : '#2a3a2e';
        ctx.fillRect(mx + 134, 38 + r * 9, 1.6, 1.6);
      }
    } else {
      // turbine intake spinning
      ctx.save();
      ctx.translate(mx + 30, B - 30);
      ctx.rotate(active ? t * 9 : 0);
      ctx.fillStyle = '#6b7680';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, -5.4, 1.6, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (active) {
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.8 + i / 3) % 1;
          ctx.beginPath();
          ctx.arc(mx + 116 + Math.sin(ph * 5 + i) * 2, WALL_TOP + 22 - ph * 8, 2 + ph * 3, 0, Math.PI * 2);
          ctx.fillStyle = rgba('#ffffff', 0.25 * (1 - ph));
          ctx.fill();
        }
      }
    }
  }
}

// ================================================================== DINER
export function dinerStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    // pendant lamps hanging from the ceiling
    for (const px of [mx + 50, mx + 160]) {
      ctx.strokeStyle = '#2a2320';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, WALL_TOP);
      ctx.lineTo(px, WALL_TOP + 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 5, WALL_TOP + 13);
      ctx.quadraticCurveTo(px, WALL_TOP + 7, px + 5, WALL_TOP + 13);
      ctx.closePath();
      ctx.fillStyle = '#c7433b';
      ctx.fill();
      ctx.fillStyle = '#fff4c8';
      ctx.fillRect(px - 2, WALL_TOP + 12.4, 4, 1);
    }
    if (v === 0) dinerCounterModule(ctx, mx, lang);
    else if (v === 1) {
      booth(ctx, mx + 14, B, 60);
      booth(ctx, mx + 80, B, 60, '#2f6fb8');
      jukebox(ctx, mx + 160, B, 0, false);
      poster(ctx, mx + 30, 30, 26, 22, '#f3e1b0', (x, y, pw, ph) => {
        ctx.beginPath();
        ctx.arc(x + pw / 2, y + ph * 0.45, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#e6a23c';
        ctx.fill();
        posterText(ctx, lang === 'ru' ? 'КАША!' : 'OATS!', x + pw / 2, y + ph - 4, 4.4, '#8a3a1a');
      });
      poster(ctx, mx + 104, 30, 26, 22, '#bfe3ef', (x, y, pw, ph) => {
        fillRR(ctx, x + pw / 2 - 3, y + 4, 6, 10, 1.6, '#d23b3b');
        posterText(ctx, lang === 'ru' ? 'КОМПОТ' : 'PUNCH', x + pw / 2, y + ph - 4, 4.2, '#1f4e8c');
      });
    } else {
      steamTable(ctx, mx + 18, B, 92);
      // drink dispenser
      propShadow(ctx, mx + 128, 20, B);
      panel(ctx, mx + 118, B - 30, 20, 30, '#b9c1c7', 1.4);
      for (let i = 0; i < 2; i++) {
        fillRR(ctx, mx + 120 + i * 9, B - 28, 7, 12, 2, rgba(['#ff9b3d', '#d23b3b'][i], 0.8));
        ctx.fillStyle = rgba('#ffffff', 0.4);
        ctx.fillRect(mx + 121 + i * 9, B - 27, 1, 10);
      }
      ctx.fillStyle = '#3a3f45';
      ctx.fillRect(mx + 122, B - 14, 12, 1.2);
      fridge(ctx, mx + 160, B, 30);
      wallClock(ctx, mx + 60, 34, 5, 800);
    }
  }
  // neon sign
  const label = lang === 'ru' ? 'СТОЛОВАЯ' : 'DINER';
  neonSign(ctx, size === 1 ? 142 : w / 2, 29, label, '#ff5a4a', 8.5);
}

function fridge(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w, y);
  fillRR(ctx, x, y - 52, w, 52, 6, hgrad(ctx, x, x + w, [
    [0, '#cfd6d1'],
    [0.35, '#f7f5ec'],
    [1, '#b7beb8'],
  ]));
  rrect(ctx, x, y - 52, w, 52, 6);
  ctx.strokeStyle = '#7a827c';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(x + 1, y - 34, w - 2, 0.8);
  fillRR(ctx, x + w - 5, y - 47, 1.8, 10, 0.8, '#9aa3aa');
  fillRR(ctx, x + w - 5, y - 30, 1.8, 13, 0.8, '#9aa3aa');
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(x + 4, y - 49, 8, 2);
  // magnets & a note
  ctx.fillStyle = '#ffcf4a';
  ctx.fillRect(x + 6, y - 28, 6, 7);
  ctx.fillStyle = '#e8453c';
  ctx.beginPath();
  ctx.arc(x + 9, y - 28, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function dinerCounterModule(ctx: Ctx, mx: number, lang: string) {
  // menu board
  panel(ctx, mx + 22, 38, 60, 24, '#6b4428', 1);
  fillRR(ctx, mx + 24, 40, 56, 20, 0.8, '#1f2a24');
  ctx.font = '700 5px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f3ead8';
  ctx.fillText(lang === 'ru' ? 'МЕНЮ ДНЯ' : 'TODAY', mx + 52, 46);
  ctx.font = '500 3.3px Oswald, sans-serif';
  const items = lang === 'ru' ? ['Каша атомная', 'Суп «Бункерный»', 'Компот', 'Пирожок'] : ['Atomic porridge', 'Bunker soup', 'Fruit punch', 'Pie'];
  items.forEach((s, i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba('#f3ead8', 0.8);
    ctx.fillText(s, mx + 27, 50.4 + i * 3.3);
    ctx.textAlign = 'right';
    ctx.fillText(String(3 + i * 2), mx + 78, 50.4 + i * 3.3);
  });
  // counter
  propShadow(ctx, mx + 62, 92, B, 0.5);
  panel(ctx, mx + 16, B - 22, 94, 22, '#c7433b', 1.5);
  ctx.fillStyle = hgrad(ctx, mx + 16, mx + 110, [
    [0, '#9aa3aa'],
    [0.5, '#f4f7f8'],
    [1, '#8a939a'],
  ]);
  ctx.fillRect(mx + 14, B - 24.4, 98, 3);
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(mx + 16, B - 14, 94, 2.4);
  for (let i = 0; i < 3; i++) {
    const px = mx + 30 + i * 26;
    ctx.beginPath();
    ctx.ellipse(px, B - 25, 5, 1.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f4f0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, B - 26.2, 2.6, Math.PI, 0);
    ctx.fillStyle = ['#e6a23c', '#8fbf5a', '#d9543f'][i];
    ctx.fill();
  }
  fillRR(ctx, mx + 98, B - 29, 3, 5, 0.8, '#d23b3b');
  fillRR(ctx, mx + 102, B - 28, 4, 4, 0.6, '#c9ced2');
  for (let i = 0; i < 4; i++) stool(ctx, mx + 24 + i * 24, FLOOR_FRONT - 3);
  // stove + hood
  propShadow(ctx, mx + 142, 36, B);
  panel(ctx, mx + 126, B - 24, 32, 24, '#b9c1c7', 1.5);
  fillRR(ctx, mx + 130, B - 17, 24, 11, 1, '#2b2f33');
  ctx.fillStyle = rgba('#ff8a3d', 0.35);
  ctx.fillRect(mx + 132, B - 10, 20, 2);
  cylinder(ctx, mx + 128, B - 32, 12, 8, '#8f9aa3', 2);
  cylinder(ctx, mx + 143, B - 30, 12, 6, '#b5543f', 2);
  ctx.beginPath();
  ctx.moveTo(mx + 124, 52);
  ctx.lineTo(mx + 160, 52);
  ctx.lineTo(mx + 154, 42);
  ctx.lineTo(mx + 130, 42);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, 42, 52, [
    [0, '#d9dfe3'],
    [1, '#8d969d'],
  ]);
  ctx.fill();
  ctx.fillStyle = hgrad(ctx, mx + 138, mx + 146, [
    [0, '#7a838a'],
    [0.4, '#c9d0d5'],
    [1, '#6a737a'],
  ]);
  ctx.fillRect(mx + 138, WALL_TOP, 8, 23);
  fridge(ctx, mx + 168, B, 26);
}

export function dinerDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang: string) {
  const label = lang === 'ru' ? 'СТОЛОВАЯ' : 'DINER';
  const flick = active ? (Math.sin(t * 23) > 0.96 ? 0.35 : 1) : 0.12;
  neonGlow(ctx, size === 1 ? 142 : w / 2, 29, label, '#ff5a4a', 8.5, flick);
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 1) jukebox(ctx, mx + 160, B, t, active);
    if (!active) continue;
    const steamAt = v === 0 ? [mx + 134, mx + 149] : v === 2 ? [mx + 30, mx + 52, mx + 74, mx + 96] : [];
    steamAt.forEach((sx, i) => {
      const ph = (t * 0.6 + i * 0.27 + m * 0.3) % 1;
      ctx.beginPath();
      ctx.arc(sx + Math.sin(ph * 6 + i) * 2, B - (v === 0 ? 34 : 26) - ph * 16, 1.5 + ph * 3, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#ffffff', 0.26 * (1 - ph));
      ctx.fill();
    });
    if (v === 1) {
      // music notes from the jukebox
      const ph = (t * 0.5) % 1;
      ctx.font = '700 6px Rubik, sans-serif';
      ctx.fillStyle = rgba('#ffcf4a', 1 - ph);
      ctx.fillText('♪', mx + 166 + Math.sin(t * 3) * 3, B - 40 - ph * 14);
      ctx.fillText('♫', mx + 176 + Math.cos(t * 2.4) * 3, B - 36 - ((ph + 0.5) % 1) * 14);
    }
  }
}

// ================================================================== WATER
export function waterStatic(ctx: Ctx, w: number, size: number, level: number) {
  ceilingPipe(ctx, bx0(), bx1(w), WALL_TOP + 5, 3, '#7c8d96');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (const tx of [mx + 18, mx + 148]) waterTank(ctx, tx, level);
      filterUnit(ctx, mx + 76);
      drop(ctx, mx + 105, 30);
    } else if (v === 1) {
      // pipe manifold
      for (const [yy, r] of [
        [44, 3.4],
        [60, 2.6],
      ] as [number, number][]) pipeH(ctx, mx + 16, mx + 194, yy, r, '#6f848f');
      for (const px of [mx + 40, mx + 90, mx + 140]) {
        pipeV(ctx, px, WALL_TOP + 5, B - 14, 2.6, '#6f848f');
        box(ctx, px - 4, 42, 8, 4, '#5a6a73', 0.8);
      }
      bigValve(ctx, mx + 64, 52, 8, 0.3);
      bigValve(ctx, mx + 116, 52, 6, 0.8, '#3f8fb5');
      pump(ctx, mx + 22, B);
      pump(ctx, mx + 150, B, '#3f5a66');
      // sight glass
      fillRR(ctx, mx + 176, 32, 10, 58, 4, '#4b5961');
      fillRR(ctx, mx + 177.5, 34, 7, 54, 3, '#0f2b36');
      panel(ctx, mx + 84, 70, 30, 16, '#56636c', 1.2);
      gauge(ctx, mx + 91, 78, 4, 0.4);
      gauge(ctx, mx + 105, 78, 4, 0.7);
    } else {
      for (let i = 0; i < 3; i++) filterColumn(ctx, mx + 18 + i * 42, B, 30, 64);
      // UV sterilizer
      panel(ctx, mx + 146, 40, 48, 20, '#3a4452', 1.6);
      fillRR(ctx, mx + 150, 44, 40, 12, 3, '#1a1030');
      panel(ctx, mx + 150, B - 26, 40, 26, '#56636c', 1.6);
      gauge(ctx, mx + 160, B - 16, 4, 0.5);
      buttonsRow(ctx, mx + 170, B - 18, 4, ['#39c6e8', '#b58cff', '#4fc36b', '#e84a3c']);
    }
  }
}

function drop(ctx: Ctx, cx: number, cy: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.bezierCurveTo(cx - 6, cy + 1, cx - 6, cy + 6, cx, cy + 7);
  ctx.bezierCurveTo(cx + 6, cy + 6, cx + 6, cy + 1, cx, cy - 7);
  ctx.fillStyle = '#39c6e8';
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 2, 1, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function waterTank(ctx: Ctx, tx: number, level: number) {
  propShadow(ctx, tx + 22, 50, B, 0.55);
  cylinder(ctx, tx, B - 64, 44, 64, level >= 3 ? '#b9c8cf' : '#9fb1ba', 6);
  for (const by of [B - 56, B - 12]) {
    ctx.fillStyle = rgba('#000', 0.28);
    ctx.fillRect(tx, by, 44, 1.2);
    for (let i = 0; i < 6; i++) rivet(ctx, tx + 4 + i * 7.2, by + 3, 0.7, '#9fb1ba');
  }
  fillRR(ctx, tx + 10, B - 50, 24, 32, 6, '#4b5961');
  fillRR(ctx, tx + 12, B - 48, 20, 28, 5, '#0f2b36');
  pipeV(ctx, tx + 22, WALL_TOP + 5, B - 64, 2.4, '#7c8d96');
  panel(ctx, tx + 17, B - 68, 10, 4, '#6b7a82', 1);
}

function filterUnit(ctx: Ctx, x: number) {
  propShadow(ctx, x + 29, 50, B);
  panel(ctx, x, B - 44, 58, 44, '#5b6d77', 2);
  fillRR(ctx, x + 6, B - 38, 20, 12, 1.5, '#1b2328');
  gauge(ctx, x + 34, B - 32, 4.5, 0.55);
  gauge(ctx, x + 47, B - 32, 4.5, 0.25);
  buttonsRow(ctx, x + 8, B - 20, 5, ['#39c6e8', '#39c6e8', '#f2c230', '#4fc36b', '#e84a3c']);
  hazard(ctx, x + 2, B - 8, 54, 3, '#39c6e8', '#1c3a44', 4);
  pipeH(ctx, x - 16, x, B - 24, 2.2, '#7c8d96');
  pipeH(ctx, x + 58, x + 72, B - 24, 2.2, '#7c8d96');
}

export function waterDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (const [k, tx] of [mx + 18, mx + 148].entries()) waterWindow(ctx, tx + 12, B - 48, 20, 28, t, active, k);
      valveWheel(ctx, mx + 68, B - 24, 4, active ? t * 0.8 : 0);
      valveWheel(ctx, mx + 142, B - 24, 4, active ? -t * 0.8 : 0);
      ctx.strokeStyle = rgba('#5fd3ef', active ? 0.9 : 0.3);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const x = mx + 83 + i;
        const y = B - 32 + Math.sin(t * 4 + i * 0.7) * (active ? 3 : 0.5);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (v === 1) {
      for (const px of [mx + 34, mx + 162]) {
        ctx.save();
        ctx.translate(px, B - 8);
        ctx.rotate(active ? t * 8 : 0);
        ctx.fillStyle = '#8fb3c2';
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, -2.8, 1.3, 2.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      waterWindow(ctx, mx + 177.5, 34, 7, 54, t, active, 3);
    } else {
      if (active) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const p = 0.7 + 0.3 * Math.sin(t * 5);
        ctx.fillStyle = rgba('#c07aff', 0.7 * p);
        fillRR(ctx, mx + 152, 46, 36, 8, 3, ctx.fillStyle as string);
        glow(ctx, mx + 170, 50, 34, '#b06aff', 0.3 * p);
        ctx.restore();
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.5 + i * 0.3) % 1;
          ctx.fillStyle = rgba('#ffffff', 0.6 * (1 - ph));
          ctx.beginPath();
          ctx.arc(mx + 33 + i * 42, B - 20 - ph * 30, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function waterWindow(ctx: Ctx, x0: number, y0: number, ww: number, hh: number, t: number, active: boolean, k: number) {
  ctx.save();
  rrect(ctx, x0, y0, ww, hh, Math.min(5, ww / 2.2));
  ctx.clip();
  const lvl = y0 + hh * 0.3 + Math.sin(t * 0.7 + k) * 1.2;
  ctx.fillStyle = vgrad(ctx, lvl, y0 + hh, [
    [0, '#6fe0f7'],
    [1, '#1c7fa6'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x0, lvl);
  for (let i = 0; i <= ww; i += 2) ctx.lineTo(x0 + i, lvl + Math.sin(t * 3 + i * 0.6 + k) * 0.8);
  ctx.lineTo(x0 + ww, y0 + hh);
  ctx.lineTo(x0, y0 + hh);
  ctx.fill();
  if (active) {
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.4 + i / 6 + k * 0.13) % 1;
      const bx = x0 + 2 + ((i * 37) % Math.max(4, ww - 4)) + Math.sin(t * 2 + i);
      const by = y0 + hh - 1 - ph * (y0 + hh - lvl);
      ctx.beginPath();
      ctx.arc(bx, by, 0.6 + (i % 3) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#e8fbff', 0.7);
      ctx.fill();
    }
  }
  ctx.fillStyle = rgba('#ffffff', 0.15);
  ctx.fillRect(x0 + 2, y0, 3, hh);
  ctx.restore();
}

// ================================================================== LIVING QUARTERS
const BLANKETS = ['#3f6fa5', '#b5403a', '#4f8a4a', '#7a4f9a', '#c9772f'];
export function livingStatic(ctx: Ctx, w: number, size: number, level: number) {
  if (level >= 2) stringLights(ctx, bx0() + 4, bx1(w) - 4, WALL_TOP + 3);
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // bedroom
      rug(ctx, mx + 70, FLOORMID + 1, 38, '#8a3b3b', '#f1d9a8');
      fakeWindow(ctx, mx + 30, 30, 46, 28, '#6b4428', 0);
      curtains(ctx, mx + 30, 30, 46, 28, '#c0504d');
      doubleBed(ctx, mx + 20, B, 70, '#7a4f33', BLANKETS[(m * 2) % 5], level >= 2);
      nightstand(ctx, mx + 96, B, '#6b4428');
      wardrobe(ctx, mx + 150, B, 44, 60, '#8a5a3a');
      frame(ctx, mx + 118, 34, 16, 20, (x, y, pw, ph) => {
        ctx.fillStyle = '#e9d3a9';
        ctx.fillRect(x, y, pw, ph);
        ctx.beginPath();
        ctx.arc(x + pw / 2, y + ph * 0.42, pw * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = '#b07a52';
        ctx.fill();
        ctx.fillStyle = '#4a6ea5';
        ctx.fillRect(x + pw * 0.2, y + ph * 0.66, pw * 0.6, ph * 0.34);
      }, '#c9a24a');
    } else if (v === 1) {
      // lounge corner
      rug(ctx, mx + 90, FLOORMID + 1, 46, '#3b5a8a', '#f1d9a8');
      frame(ctx, mx + 36, 32, 30, 20, (x, y, pw, ph) => landscapeArt(ctx, x, y, pw, ph));
      frame(ctx, mx + 72, 30, 14, 18, (x, y, pw, ph) => {
        ctx.fillStyle = '#2b3a4a';
        ctx.fillRect(x, y, pw, ph);
        ctx.fillStyle = '#ffcf4a';
        ctx.beginPath();
        ctx.arc(x + pw / 2, y + ph / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }, '#6b4428');
      wallClock(ctx, mx + 100, 36, 5, 1000);
      sofa(ctx, mx + 30, B, 56, ['#c0504d', '#4f7a9a', '#8a6a3a'][m % 3]);
      fillRR(ctx, mx + 36, B - 17, 8, 5, 2, '#e7c679');
      fillRR(ctx, mx + 72, B - 17, 8, 5, 2, '#e7c679');
      coffeeTable(ctx, mx + 44, FLOORMID + 5, 30, '#7a4a2a');
      tvSet(ctx, mx + 110, B);
      floorLamp(ctx, mx + 141, B);
      shelfUnit(ctx, mx + 152, B, 40, 56, '#6b4a32', 3);
      books(ctx, mx + 155, B - 38, 34, m);
      books(ctx, mx + 155, B - 19.6, 20, m + 3);
      plant(ctx, mx + 184, B - 38, 0.55);
      plant(ctx, mx + 196, B, 0.85);
    } else {
      // kitchenette & dining
      upperCabinets(ctx, mx + 18, 34, 84, '#e8e2d4');
      kitchenCounter(ctx, mx + 18, B, 84, '#dcd4c2');
      fridge(ctx, mx + 106, B, 24);
      roundTable(ctx, mx + 162, FLOORMID + 3, 18, '#8a5a3a');
      chair(ctx, mx + 142, FLOORMID + 3, '#c0504d', 1);
      chair(ctx, mx + 182, FLOORMID + 3, '#c0504d', -1);
      // hanging lamp over the table
      ctx.strokeStyle = '#2a2320';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(mx + 162, WALL_TOP);
      ctx.lineTo(mx + 162, WALL_TOP + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx + 155, WALL_TOP + 21);
      ctx.quadraticCurveTo(mx + 162, WALL_TOP + 12, mx + 169, WALL_TOP + 21);
      ctx.closePath();
      ctx.fillStyle = '#4f8a4a';
      ctx.fill();
      plant(ctx, mx + 138, B, 0.7);
    }
    if (level >= 3 && v !== 2) chandelier(ctx, mx + 105, WALL_TOP);
    wallSconce(ctx, mx + 22, 44);
  }
}

export function livingDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // animated view in the fake window
      ctx.save();
      rrect(ctx, mx + 30, 30, 46, 28, 1);
      ctx.clip();
      ctx.fillStyle = rgba('#ffffff', 0.7);
      const cx = mx + 30 + ((t * 3) % 66) - 10;
      ctx.beginPath();
      ctx.ellipse(cx, 36, 6, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (v === 1 && active) {
      const f = 0.6 + 0.4 * Math.sin(t * 7 + m) * Math.sin(t * 3.3);
      ctx.fillStyle = rgba(['#9fd8ff', '#ffd6a0', '#c8ffb0'][Math.floor(t / 2 + m) % 3], 0.35 * f);
      fillRR(ctx, mx + 113.5, B - 18, 11, 9, 2, ctx.fillStyle as string);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 119, B - 13.5, 18, '#9fd8ff', 0.18 * f);
      glow(ctx, mx + 141, B - 34, 24, '#ffd9a0', 0.35);
      ctx.restore();
    }
  }
}

// ================================================================== STORAGE
export function storageStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    ctx.font = '700 9px Oswald, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba('#f2c230', 0.6);
    ctx.fillText((lang === 'ru' ? 'СКЛАД ' : 'STORE ') + String.fromCharCode(65 + m), mx + 18, 32);
    if (v === 0) {
      for (const rx of [mx + 16, mx + 118]) rack(ctx, rx, m + (rx > mx + 60 ? 5 : 0));
      crate(ctx, mx + 90, B - 16, 18, 16, '#9a6a3a');
      crate(ctx, mx + 94, B - 30, 14, 14, '#b07a45');
    } else if (v === 1) {
      // pallets & forklift
      for (let i = 0; i < 3; i++) {
        const px = mx + 16 + i * 34;
        panel(ctx, px, B - 4, 30, 4, '#8a6a3a', 0.6);
        for (let k = 0; k < 2 + (i % 2); k++) metalCrate(ctx, px + 2, B - 16 - k * 12, 26, 12, ['#5f7a5a', '#6f5f4a', '#4f6a7a'][(i + k) % 3], 'АУ');
      }
      forklift(ctx, mx + 130, B);
    } else {
      // wire cage lockers
      for (let i = 0; i < 4; i++) {
        const cx = mx + 16 + i * 44;
        panel(ctx, cx, 36, 40, B - 36, '#3a424b', 1);
        ctx.strokeStyle = rgba('#9aa7b0', 0.55);
        ctx.lineWidth = 0.5;
        for (let x = cx + 2; x < cx + 40; x += 3) {
          ctx.beginPath();
          ctx.moveTo(x, 38);
          ctx.lineTo(x, B - 2);
          ctx.stroke();
        }
        for (let y = 40; y < B; y += 3) {
          ctx.beginPath();
          ctx.moveTo(cx + 2, y);
          ctx.lineTo(cx + 38, y);
          ctx.stroke();
        }
        barrel(ctx, cx + 6, B - 18, 11, 18, ['#3f6fa5', '#c7433b', '#4f8a4a', '#c9a24a'][i]);
        crate(ctx, cx + 20, B - 14, 16, 14);
        fillRR(ctx, cx + 16, 58, 8, 5, 0.8, '#c9a24a');
      }
    }
  }
}

function rack(ctx: Ctx, rx: number, seed: number) {
  shelfUnit(ctx, rx, B, 72, 62, '#5a6470', 3);
  const levels = [B - 1.8, B - 22, B - 42.2];
  levels.forEach((ly, i) => {
    let x = rx + 3;
    let k = i + seed * 3;
    while (x < rx + 64) {
      const kind = k % 4;
      if (kind === 0) {
        crate(ctx, x, ly - 14, 16, 14, '#a4733f');
        x += 17;
      } else if (kind === 1) {
        metalCrate(ctx, x, ly - 12, 18, 12, '#5f7a5a', 'АУ');
        x += 19;
      } else if (kind === 2) {
        barrel(ctx, x, ly - 16, 10, 16, '#3f6fa5');
        x += 11;
      } else {
        box(ctx, x, ly - 9, 12, 9, '#c9b28a', 0.6);
        ctx.fillStyle = rgba('#6b4a32', 0.5);
        ctx.fillRect(x, ly - 6, 12, 1);
        x += 13;
      }
      k += 3;
    }
  });
}

function forklift(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 26, 60, y + 1, 0.5);
  // mast & forks
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 4, y - 44, 3, 44);
  ctx.fillRect(x + 10, y - 44, 3, 44);
  ctx.fillRect(x - 12, y - 4, 22, 2.4);
  ctx.fillRect(x - 12, y - 10, 22, 2);
  // body
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 8);
  ctx.lineTo(x + 14, y - 24);
  ctx.lineTo(x + 30, y - 24);
  ctx.lineTo(x + 34, y - 32);
  ctx.lineTo(x + 50, y - 32);
  ctx.lineTo(x + 54, y - 8);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 32, y - 8, [
    [0, '#ffcf4a'],
    [1, '#d9962a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#6a4a0a';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // cage
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 22, y - 24);
  ctx.lineTo(x + 24, y - 50);
  ctx.lineTo(x + 46, y - 50);
  ctx.lineTo(x + 48, y - 32);
  ctx.stroke();
  // seat & wheel
  fillRR(ctx, x + 34, y - 38, 10, 6, 2, '#2a2d31');
  ctx.beginPath();
  ctx.ellipse(x + 28, y - 30, 3.4, 1.2, -0.4, 0, Math.PI * 2);
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();
  // wheels
  for (const wx of [x + 22, x + 46]) {
    ctx.beginPath();
    ctx.arc(wx, y - 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1c1f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, y - 4, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#9aa3aa';
    ctx.fill();
  }
  hazard(ctx, x + 14, y - 12, 40, 3, '#1a1a1a', '#ffcf4a', 3);
}

// ================================================================== VAULT DOOR ROOM
export function doorStatic(ctx: Ctx, w: number, level: number, vault: number) {
  const cx = 46;
  const cy = 58;
  // doorway recess (tunnel)
  ctx.beginPath();
  ctx.arc(cx, cy, 37, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, cx, cy, 5, 37, [
    [0, '#2a2622'],
    [1, '#050607'],
  ]);
  ctx.fill();
  // frame ring
  ctx.beginPath();
  ctx.arc(cx, cy, 41.5, 0, Math.PI * 2);
  ctx.arc(cx, cy, 36.5, 0, Math.PI * 2, true);
  ctx.fillStyle = rgrad(ctx, cx, cy, 34, 43, [
    [0, '#23292f'],
    [0.5, '#7b8691'],
    [1, '#23292f'],
  ]);
  ctx.fill();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    rivet(ctx, cx + Math.cos(a) * 39, cy + Math.sin(a) * 39, 1.1, '#6b7580');
  }
  // hydraulic arm
  box(ctx, cx + 36, cy - 4, 36, 8, '#5b646e', 2);
  box(ctx, cx + 70, cy - 11, 11, 22, '#3a424b', 2);
  hazard(ctx, cx + 72, cy - 9, 7, 18, '#f2b632', '#26282b', 3);
  // security station
  monitorBank(ctx, 134, 30, 0, 1);
  panel(ctx, 132, 62, 48, 6, '#4a5561', 1);
  buttonsRow(ctx, 138, 65, 8);
  lockers(ctx, 182, B, 2, '#4f6a7a');
  // floor warning stripes
  hazard(ctx, bx0(), WALL_BOTTOM - 4.5, bx1(w) - bx0(), 3.2, '#f2b632', '#26282b', 4);
  signPlate(ctx, 157, 22, 'АТОМУЮТ', '#ffb02e', '#2a1a0a', 4.4);
  // beacon housing
  fillRR(ctx, 98, 20, 8, 5, 1.5, '#3a3f45');
  if (level >= 2) gunRack(ctx, 104, 60, 26);
  // benches for guards
  panel(ctx, 128, B - 10, 40, 3, '#6b4a32', 0.8);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(131, B - 7, 1.6, 7);
  ctx.fillRect(163, B - 7, 1.6, 7);
}

export function doorDyn(ctx: Ctx, w: number, t: number, alarm: boolean) {
  monitorBank(ctx, 134, 30, t, 1);
  // rotating beacon
  const on = alarm || Math.sin(t * 1.3) > 0.7;
  const c = alarm ? '#ff3a1a' : '#ffb02e';
  ctx.beginPath();
  ctx.ellipse(102, 19.5, 3, 2.4, 0, Math.PI, 0);
  ctx.fillStyle = on ? c : '#5a3a14';
  ctx.fill();
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const a = t * 6;
    ctx.fillStyle = rgba(c, 0.18);
    ctx.beginPath();
    ctx.moveTo(102, 20);
    ctx.lineTo(102 + Math.cos(a) * 70, 20 + Math.abs(Math.sin(a)) * 60 + 20);
    ctx.lineTo(102 + Math.cos(a + 0.4) * 70, 20 + Math.abs(Math.sin(a + 0.4)) * 60 + 20);
    ctx.closePath();
    ctx.fill();
    glow(ctx, 102, 19, 12, c, 0.5);
    ctx.restore();
  }
}

// ================================================================== ELEVATOR
export { FEET_Y, pipeV, pipeH, box, fillRR };
