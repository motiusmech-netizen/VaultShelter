/* Room interiors, part 1: core, production, habitat. Local coords: (0,0) room top-left. */
import {
  box, cylinder, fillRR, gauge, glow, hazard, hcylinder, hgrad, pipeH, pipeV, rgba, rgrad, rivet, rrect, screenRect, shade, vgrad, gearPath, type Ctx,
} from './gfx';
import { IX0, propShadow, signPlate } from './roomBase';
import {
  barrel, bed, bolt, books, buttonsRow, computerTower, consolePanel, crate, flask, floorLamp, frame, landscapeArt, metalCrate, plant, poster, shelfUnit, sofa, stool, tvSet, valveWheel, wallClock,
} from './props';
import { FLOOR_FRONT, FLOOR_H, WALL_BOTTOM, WALL_TOP } from './world';

const B = WALL_BOTTOM + 1.5; // prop base line
const M = 210;

// ------------------------------------------------------------------ POWER
export function powerStatic(ctx: Ctx, w: number, size: number, level: number) {
  hazard(ctx, IX0, WALL_BOTTOM - 8, w - IX0 * 2, 4.5, '#e2a72a', '#262a2f', 5);
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const gx of [mx + 16, mx + 124]) generator(ctx, gx, level);
    // control cabinet
    propShadow(ctx, mx + 105, 22, B);
    box(ctx, mx + 96, 44, 18, B - 44, '#56606b', 1.5);
    gauge(ctx, mx + 101, 52, 3.2, 0.3);
    gauge(ctx, mx + 109, 52, 3.2, 0.7);
    fillRR(ctx, mx + 99, 60, 12, 8, 1, '#1d252c');
    buttonsRow(ctx, mx + 100, 74, 4);
    ctx.fillStyle = rgba('#000', 0.3);
    ctx.fillRect(mx + 98, 80, 14, 0.7);
    ctx.fillRect(mx + 98, 90, 14, 0.7);
    // big bolt emblem
    ctx.beginPath();
    ctx.arc(mx + 105, 29, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2f35';
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = '#e2a72a';
    ctx.stroke();
    bolt(ctx, mx + 100.5, 23.5, 10, '#ffd23d');
  }
  // cable tray along ceiling
  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(IX0, WALL_TOP + 1, w - IX0 * 2, 3);
  for (let x = IX0 + 4; x < w - IX0; x += 8) {
    ctx.fillStyle = rgba('#000', 0.4);
    ctx.fillRect(x, WALL_TOP + 1, 0.7, 3);
  }
}

function generator(ctx: Ctx, gx: number, level: number) {
  const body = level >= 3 ? '#e0b43a' : level === 2 ? '#d49a2c' : '#c98f2a';
  propShadow(ctx, gx + 36, 80, B, 0.5);
  // plinth
  box(ctx, gx, B - 16, 72, 16, '#3a424b', 1.5);
  ctx.fillStyle = rgba('#000', 0.35);
  for (let x = gx + 6; x < gx + 70; x += 12) ctx.fillRect(x, B - 12, 6, 1.4);
  // body cylinder
  hcylinder(ctx, gx + 12, B - 46, 58, 31, body);
  // copper windings
  for (let i = 0; i < 6; i++) {
    const x = gx + 26 + i * 6;
    ctx.fillStyle = vgrad(ctx, B - 45, B - 16, [
      [0, '#6b3b18'],
      [0.3, '#e59a5a'],
      [0.6, '#b8672e'],
      [1, '#4b2610'],
    ]);
    ctx.fillRect(x, B - 45, 3.6, 29);
  }
  // end bands
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.fillRect(gx + 22, B - 46, 1.5, 31);
  ctx.fillRect(gx + 64, B - 46, 1.5, 31);
  // flywheel housing
  ctx.beginPath();
  ctx.arc(gx + 12, B - 30, 16, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, gx + 8, B - 34, 2, 18, [
    [0, '#5b646e'],
    [1, '#1f252b'],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#6f7a85';
  ctx.stroke();
  // insulators
  for (let i = 0; i < 3; i++) {
    const ix = gx + 32 + i * 11;
    for (let k = 0; k < 3; k++) {
      fillRR(ctx, ix - 2.6 + k * 0.4, B - 52 - k * 3, 5.2 - k * 0.8, 2.6, 1, k % 2 ? '#d8d2c2' : '#f1ece0');
    }
    ctx.fillStyle = '#9aa3ac';
    ctx.fillRect(ix - 0.6, B - 58, 1.2, 3);
  }
  // cable
  ctx.strokeStyle = '#15191d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(gx + 66, B - 40);
  ctx.bezierCurveTo(gx + 80, B - 60, gx + 70, WALL_TOP + 10, gx + 76, WALL_TOP + 3);
  ctx.stroke();
}

export function powerDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const [k, gx] of [mx + 16, mx + 124].entries()) {
      const cx = gx + 12;
      const cy = B - 30;
      const rot = active ? t * 5 + k : k;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = '#aab4bd';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
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
          const ix = gx + 32 + i * 11;
          const f = 0.5 + 0.5 * Math.sin(t * 9 + i * 2 + k);
          glow(ctx, ix, B - 57, 7, '#ffd86b', 0.35 + f * 0.35);
        }
        // arc between insulators
        if (Math.sin(t * 3.1 + k * 1.7) > 0.55) {
          ctx.strokeStyle = rgba('#fff4c2', 0.9);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          const x0 = gx + 32;
          ctx.moveTo(x0, B - 57);
          for (let s = 1; s <= 8; s++) ctx.lineTo(x0 + s * 2.75, B - 57 - 3 + Math.random() * 6);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // cabinet screen & lights
    const on = active ? 1 : 0.25;
    ctx.fillStyle = rgba('#5dff9a', 0.55 * on);
    for (let i = 0; i < 4; i++) {
      const h = 2 + 5 * Math.abs(Math.sin(t * (1.3 + i) + i));
      ctx.fillRect(mx + 100 + i * 2.6, 67 - h, 1.8, h);
    }
    if (active && Math.sin(t * 4) > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 100, 74, 3, '#ff6a4d', 0.6);
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ DINER
export function dinerStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // menu board
    box(ctx, mx + 24, 26, 62, 26, '#6b4428', 1);
    fillRR(ctx, mx + 26, 28, 58, 22, 0.8, '#1f2a24');
    ctx.font = '700 5px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3ead8';
    ctx.fillText(lang === 'ru' ? 'МЕНЮ ДНЯ' : 'TODAY', mx + 55, 34);
    ctx.font = '500 3.3px Oswald, sans-serif';
    ctx.textAlign = 'left';
    const items = lang === 'ru' ? ['Каша атомная', 'Суп «Бункерный»', 'Компот', 'Пирожок'] : ['Atomic porridge', 'Bunker soup', 'Fruit punch', 'Pie'];
    items.forEach((s, i) => {
      ctx.fillStyle = rgba('#f3ead8', 0.8);
      ctx.fillText(s, mx + 29, 39 + i * 3.6);
      ctx.textAlign = 'right';
      ctx.fillText(String(3 + i * 2), mx + 82, 39 + i * 3.6);
      ctx.textAlign = 'left';
    });
    // counter
    propShadow(ctx, mx + 62, 92, B, 0.45);
    box(ctx, mx + 16, B - 22, 94, 22, '#c7433b', 1.5);
    ctx.fillStyle = hgrad(ctx, mx + 16, mx + 110, [
      [0, '#9aa3aa'],
      [0.5, '#eef2f4'],
      [1, '#8a939a'],
    ]);
    ctx.fillRect(mx + 14, B - 24, 98, 3);
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(mx + 16, B - 14, 94, 2.4);
    // counter items
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
    // napkin holder, ketchup
    fillRR(ctx, mx + 98, B - 29, 3, 5, 0.8, '#d23b3b');
    fillRR(ctx, mx + 102, B - 28, 4, 4, 0.6, '#c9ced2');
    // stools
    for (let i = 0; i < 4; i++) stool(ctx, mx + 24 + i * 24, FLOOR_FRONT - 2.5);
    // stove + hood
    propShadow(ctx, mx + 142, 36, B);
    box(ctx, mx + 126, B - 24, 32, 24, '#b9c1c7', 1.5);
    fillRR(ctx, mx + 130, B - 17, 24, 11, 1, '#2b2f33');
    ctx.fillStyle = '#16191c';
    ctx.fillRect(mx + 131, B - 16, 22, 9);
    ctx.fillStyle = rgba('#ff8a3d', 0.35);
    ctx.fillRect(mx + 132, B - 10, 20, 2);
    for (const kx of [mx + 131, mx + 137, mx + 143, mx + 149]) {
      ctx.fillStyle = '#3a3f45';
      ctx.beginPath();
      ctx.arc(kx + 2, B - 20.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // pots
    cylinder(ctx, mx + 128, B - 32, 12, 8, '#8f9aa3', 2);
    cylinder(ctx, mx + 143, B - 30, 12, 6, '#b5543f', 2);
    // hood
    ctx.beginPath();
    ctx.moveTo(mx + 124, 44);
    ctx.lineTo(mx + 160, 44);
    ctx.lineTo(mx + 154, 34);
    ctx.lineTo(mx + 130, 34);
    ctx.closePath();
    ctx.fillStyle = vgrad(ctx, 34, 44, [
      [0, '#c9d0d5'],
      [1, '#8d969d'],
    ]);
    ctx.fill();
    ctx.fillStyle = '#9aa3aa';
    ctx.fillRect(mx + 138, WALL_TOP, 8, 19);
    // fridge
    propShadow(ctx, mx + 183, 26, B);
    fillRR(ctx, mx + 170, B - 50, 26, 50, 5, hgrad(ctx, mx + 170, mx + 196, [
      [0, '#cfd6d1'],
      [0.35, '#f7f5ec'],
      [1, '#b7beb8'],
    ]));
    ctx.fillStyle = rgba('#000', 0.25);
    ctx.fillRect(mx + 171, B - 33, 24, 0.8);
    fillRR(ctx, mx + 191, B - 45, 1.6, 9, 0.8, '#9aa3aa');
    fillRR(ctx, mx + 191, B - 28, 1.6, 12, 0.8, '#9aa3aa');
    ctx.fillStyle = '#c7433b';
    ctx.fillRect(mx + 174, B - 47, 7, 2);
  }
  // neon sign
  const label = lang === 'ru' ? 'СТОЛОВАЯ' : 'DINER';
  ctx.font = '700 9px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = size === 1 ? 142 : w / 2;
  const tw = ctx.measureText(label).width;
  box(ctx, cx - tw / 2 - 5, 17, tw + 10, 13, '#2a1f22', 2);
  ctx.fillStyle = '#ffb4a8';
  ctx.fillText(label, cx, 24);
}

export function dinerDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang: string) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cx = size === 1 ? 142 : w / 2;
  const flick = active ? (Math.sin(t * 23) > 0.96 ? 0.3 : 1) : 0.15;
  glow(ctx, cx, 24, 32, '#ff5a4a', 0.35 * flick);
  ctx.restore();
  if (!active) return;
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // steam from pots
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.6 + i * 0.25 + m * 0.3) % 1;
      const px = mx + 134 + (i % 2) * 15 + Math.sin(ph * 6 + i) * 2;
      const py = B - 34 - ph * 16;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + ph * 3, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#ffffff', 0.28 * (1 - ph));
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------------ WATER
export function waterStatic(ctx: Ctx, w: number, size: number, level: number) {
  // main pipe along the top
  pipeH(ctx, IX0, w - IX0, WALL_TOP + 8, 3, '#7c8d96');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const tx of [mx + 16, mx + 150]) {
      propShadow(ctx, tx + 22, 50, B, 0.5);
      cylinder(ctx, tx, B - 66, 44, 66, level >= 3 ? '#b9c8cf' : '#9fb1ba', 6);
      // bands & rivets
      for (const by of [B - 58, B - 12]) {
        ctx.fillStyle = rgba('#000', 0.28);
        ctx.fillRect(tx, by, 44, 1.2);
        for (let i = 0; i < 6; i++) rivet(ctx, tx + 4 + i * 7.2, by + 3, 0.7, '#9fb1ba');
      }
      // window frame
      fillRR(ctx, tx + 10, B - 52, 24, 34, 6, '#4b5961');
      fillRR(ctx, tx + 12, B - 50, 20, 30, 5, '#0f2b36');
      // pipe to top
      pipeV(ctx, tx + 22, WALL_TOP + 8, B - 66, 2.4, '#7c8d96');
      box(ctx, tx + 17, B - 70, 10, 4, '#6b7a82', 1);
    }
    // central filter unit
    propShadow(ctx, mx + 105, 50, B);
    box(ctx, mx + 76, B - 44, 58, 44, '#5b6d77', 2);
    fillRR(ctx, mx + 82, B - 38, 20, 12, 1.5, '#1b2328');
    gauge(ctx, mx + 110, B - 32, 4.5, 0.55);
    gauge(ctx, mx + 123, B - 32, 4.5, 0.25);
    buttonsRow(ctx, mx + 84, B - 20, 5, ['#39c6e8', '#39c6e8', '#f2c230', '#4fc36b', '#e84a3c']);
    hazard(ctx, mx + 78, B - 8, 54, 3, '#39c6e8', '#1c3a44', 4);
    // pipes from tanks to unit
    pipeH(ctx, mx + 60, mx + 76, B - 24, 2.2, '#7c8d96');
    pipeH(ctx, mx + 134, mx + 150, B - 24, 2.2, '#7c8d96');
    // drop sign
    ctx.beginPath();
    ctx.moveTo(mx + 105, 22);
    ctx.bezierCurveTo(mx + 99, 30, mx + 99, 35, mx + 105, 36);
    ctx.bezierCurveTo(mx + 111, 35, mx + 111, 30, mx + 105, 22);
    ctx.fillStyle = '#39c6e8';
    ctx.fill();
  }
}

export function waterDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    for (const [k, tx] of [mx + 16, mx + 150].entries()) {
      const x0 = tx + 12;
      const y0 = B - 50;
      ctx.save();
      rrect(ctx, x0, y0, 20, 30, 5);
      ctx.clip();
      const lvl = y0 + 9 + Math.sin(t * 0.7 + k) * 1.2;
      ctx.fillStyle = vgrad(ctx, lvl, y0 + 30, [
        [0, '#5fd3ef'],
        [1, '#1c7fa6'],
      ]);
      ctx.beginPath();
      ctx.moveTo(x0, lvl);
      for (let i = 0; i <= 20; i += 2) ctx.lineTo(x0 + i, lvl + Math.sin(t * 3 + i * 0.6 + k) * 0.8);
      ctx.lineTo(x0 + 20, y0 + 30);
      ctx.lineTo(x0, y0 + 30);
      ctx.fill();
      if (active) {
        for (let i = 0; i < 6; i++) {
          const ph = (t * 0.4 + i / 6 + k * 0.13) % 1;
          const bx = x0 + 3 + ((i * 37) % 14) + Math.sin(t * 2 + i) * 1;
          const by = y0 + 29 - ph * (y0 + 29 - lvl);
          ctx.beginPath();
          ctx.arc(bx, by, 0.6 + (i % 3) * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = rgba('#e8fbff', 0.7);
          ctx.fill();
        }
      }
      ctx.fillStyle = rgba('#ffffff', 0.15);
      ctx.fillRect(x0 + 2, y0, 3, 30);
      ctx.restore();
    }
    valveWheel(ctx, mx + 68, B - 24, 4, active ? t * 0.8 : 0);
    valveWheel(ctx, mx + 142, B - 24, 4, active ? -t * 0.8 : 0);
    // screen waveform
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
  }
}

// ------------------------------------------------------------------ LIVING
export function livingStatic(ctx: Ctx, w: number, size: number, level: number) {
  const blankets = ['#3f6fa5', '#b5403a', '#4f8a4a', '#7a4f9a'];
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // rug
    ctx.save();
    ctx.translate(mx + 110, (WALL_BOTTOM + FLOOR_FRONT) / 2 + 1);
    ctx.scale(1, 0.16);
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fillStyle = ['#8a3b3b', '#3b5a8a', '#6a4a8a'][m % 3];
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = rgba('#f1d9a8', 0.5);
    ctx.stroke();
    ctx.restore();
    // bed (bunk for level >=2)
    bed(ctx, mx + 12, B, 50, '#7a4f33', '#efe9dc', blankets[(m * 2) % 4]);
    if (level >= 2) {
      // top bunk
      ctx.fillStyle = '#6b442b';
      ctx.fillRect(mx + 12, B - 44, 2.5, 44);
      ctx.fillRect(mx + 59.5, B - 44, 2.5, 44);
      box(ctx, mx + 12, B - 36, 50, 3, '#7a4f33', 0.6);
      box(ctx, mx + 15, B - 40, 44, 4, '#efe9dc', 1.2);
      fillRR(ctx, mx + 30, B - 42, 28, 4, 1.5, blankets[(m * 2 + 1) % 4]);
      fillRR(ctx, mx + 17, B - 43, 10, 3.5, 1.5, '#f7f3ea');
    }
    // pictures
    frame(ctx, mx + 76, 34, 22, 16, (x, y, fw, fh) => landscapeArt(ctx, x, y, fw, fh));
    frame(ctx, mx + 102, 30, 12, 15, (x, y, fw, fh) => {
      ctx.fillStyle = '#e9d3a9';
      ctx.fillRect(x, y, fw, fh);
      ctx.beginPath();
      ctx.arc(x + fw / 2, y + fh * 0.4, fw * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#b07a52';
      ctx.fill();
      ctx.fillStyle = '#4a6ea5';
      ctx.fillRect(x + fw * 0.2, y + fh * 0.65, fw * 0.6, fh * 0.35);
    }, '#c9a24a');
    wallClock(ctx, mx + 128, 36, 4.5, 1000);
    // sofa
    sofa(ctx, mx + 74, B, 46, ['#c0504d', '#4f7a9a', '#8a6a3a'][m % 3]);
    ctx.fillStyle = '#f2d7a0';
    fillRR(ctx, mx + 80, B - 17, 7, 5, 2, '#e7c679');
    // tv
    tvSet(ctx, mx + 142, B);
    floorLamp(ctx, mx + 135, B);
    // shelf + plant
    shelfUnit(ctx, mx + 172, B, 28, 44, '#6b4a32', 3);
    books(ctx, mx + 174, B - 29.6, 24, m);
    books(ctx, mx + 174, B - 15, 14, m + 3);
    plant(ctx, mx + 194, B - 42.6, 0.55);
    plant(ctx, mx + 196, B, 0.8);
    if (level >= 3) {
      // gold chandelier hint
      ctx.fillStyle = '#e8b64a';
      ctx.fillRect(mx + 108, WALL_TOP, 1, 5);
    }
  }
}

export function livingDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    if (active) {
      const f = 0.6 + 0.4 * Math.sin(t * 7 + m) * Math.sin(t * 3.3);
      ctx.fillStyle = rgba(['#9fd8ff', '#ffd6a0', '#c8ffb0'][Math.floor(t / 2 + m) % 3], 0.35 * f);
      fillRR(ctx, mx + 145.5, B - 18, 11, 9, 2, ctx.fillStyle as string);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 151, B - 13.5, 16, '#9fd8ff', 0.18 * f);
      glow(ctx, mx + 135, B - 34, 22, '#ffd9a0', 0.35);
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ STORAGE
export function storageStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // stencil
    ctx.font = '700 8px Oswald, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba('#f2c230', 0.55);
    ctx.fillText((lang === 'ru' ? 'СКЛАД ' : 'STORE ') + String.fromCharCode(65 + m), mx + 12, 28);
    // racks
    for (const rx of [mx + 14, mx + 118]) {
      shelfUnit(ctx, rx, B, 72, 64, '#5a6470', 3);
      const levels = [B - 1.8, B - 22.4, B - 43.1];
      levels.forEach((ly, i) => {
        let x = rx + 3;
        let k = i + m * 3 + (rx > mx + 60 ? 5 : 0);
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
    // loose crates on the floor in the middle
    crate(ctx, mx + 90, B - 16, 18, 16, '#9a6a3a');
    crate(ctx, mx + 94, B - 30, 14, 14, '#b07a45');
    barrel(ctx, mx + 110, B - 18, 10, 18, '#c7433b', '#f2f2f2');
  }
}

// ------------------------------------------------------------------ MEDBAY
export function medbayStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // red cross emblem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mx + 105, 30, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8453c';
    ctx.fillRect(mx + 102, 24, 6, 12);
    ctx.fillRect(mx + 99, 27, 12, 6);
    // beds with curtains
    for (const bx of [mx + 14, mx + 140]) {
      // curtain rail
      ctx.fillStyle = '#9aa3aa';
      ctx.fillRect(bx - 4, WALL_TOP + 6, 64, 1.2);
      ctx.fillStyle = vgrad(ctx, WALL_TOP + 7, B - 20, [
        [0, '#7fc9b3'],
        [1, '#5fae98'],
      ]);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const cx = bx - 3 + i * 3.5;
        ctx.moveTo(cx, WALL_TOP + 7);
        ctx.quadraticCurveTo(cx + 2, B - 40, cx + 1, B - 22);
        ctx.lineTo(cx + 3.5, B - 22);
        ctx.quadraticCurveTo(cx + 4.5, B - 40, cx + 3.5, WALL_TOP + 7);
        ctx.fill();
      }
      // bed frame (metal)
      propShadow(ctx, bx + 28, 60, B);
      ctx.strokeStyle = '#c9d0d5';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx + 10, B);
      ctx.lineTo(bx + 10, B - 22);
      ctx.moveTo(bx + 56, B);
      ctx.lineTo(bx + 56, B - 16);
      ctx.stroke();
      box(ctx, bx + 10, B - 13, 46, 5, '#f7f9f9', 1.5);
      fillRR(ctx, bx + 12, B - 16, 10, 4, 1.5, '#ffffff');
      fillRR(ctx, bx + 24, B - 15.5, 30, 6, 2, '#bfe3ef');
      ctx.fillStyle = '#9aa3aa';
      ctx.fillRect(bx + 10, B - 7, 46, 1.2);
    }
    // IV stand
    ctx.fillStyle = '#b9c1c7';
    ctx.fillRect(mx + 76, B - 48, 1, 48);
    fillRR(ctx, mx + 72, B - 1.2, 9, 1.2, 0.5, '#8a939a');
    fillRR(ctx, mx + 73.5, B - 50, 6, 9, 2, rgba('#dff3f7', 0.85));
    fillRR(ctx, mx + 74.3, B - 45, 4.4, 3.5, 1.4, rgba('#ffd1c7', 0.9));
    // monitor on arm
    screenRect(ctx, mx + 84, 44, 22, 14, '#0e2a22', '#3a4148');
    // medicine cabinet
    box(ctx, mx + 110, 42, 22, 30, '#f4f6f6', 1.5);
    ctx.fillStyle = rgba('#8fd3c0', 0.5);
    ctx.fillRect(mx + 112, 44, 8.5, 26);
    ctx.fillRect(mx + 121.5, 44, 8.5, 26);
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = ['#e8453c', '#f2c230', '#ffffff', '#4aa3e8'][(i + k) % 4];
        ctx.fillRect(mx + 113 + k * 4.2, 49 + i * 8, 2.4, 4);
      }
    }
    ctx.fillStyle = '#e8453c';
    ctx.fillRect(mx + 119.6, 38, 2.8, 2.8);
    // stretcher / cart
    box(ctx, mx + 84, B - 14, 22, 3, '#c9d0d5', 1);
    ctx.fillStyle = '#6d757b';
    ctx.fillRect(mx + 86, B - 11, 1, 10);
    ctx.fillRect(mx + 103, B - 11, 1, 10);
    fillRR(ctx, mx + 86, B - 20, 7, 6, 1, '#e8453c');
    fillRR(ctx, mx + 95, B - 18, 6, 4, 1, '#ffffff');
  }
}

export function medbayDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    ctx.strokeStyle = rgba('#5dff9a', active ? 0.95 : 0.35);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    const off = (t * 14) % 22;
    for (let i = 0; i <= 22; i += 0.5) {
      const ph = (i + off) % 22;
      let y = 51;
      if (active) {
        if (ph > 8 && ph < 9) y -= 5;
        else if (ph > 9 && ph < 10) y += 3;
        else if (ph > 12 && ph < 14) y -= 1.2;
      }
      if (i === 0) ctx.moveTo(mx + 84 + i, y);
      else ctx.lineTo(mx + 84 + i, y);
    }
    ctx.stroke();
    if (active) {
      const ph = (t * 0.7) % 1;
      ctx.fillStyle = rgba('#ffd1c7', 0.9);
      ctx.beginPath();
      ctx.arc(mx + 76.5, B - 40 + ph * 8, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ------------------------------------------------------------------ LAB
export function labStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // chalkboard
    box(ctx, mx + 14, 24, 60, 32, '#5a3e2a', 1);
    fillRR(ctx, mx + 16, 26, 56, 28, 0.8, '#26382f');
    ctx.strokeStyle = rgba('#f1efe6', 0.7);
    ctx.lineWidth = 0.45;
    ctx.font = '500 4px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba('#f1efe6', 0.75);
    ctx.fillText('E = mc²', mx + 20, 33);
    ctx.fillText('H₂O + ☢ → ?', mx + 20, 41);
    ctx.beginPath();
    ctx.arc(mx + 58, 38, 7, 0, Math.PI * 2);
    ctx.moveTo(mx + 51, 38);
    ctx.lineTo(mx + 65, 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(mx + 58, 38, 7, 2.6, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText('∫ f(x)dx', mx + 20, 49);
    // bench
    propShadow(ctx, mx + 50, 80, B);
    box(ctx, mx + 10, B - 20, 84, 4, '#e3e7ea', 1);
    box(ctx, mx + 12, B - 16, 20, 16, '#5b6d82', 1);
    box(ctx, mx + 72, B - 16, 20, 16, '#5b6d82', 1);
    ctx.fillStyle = rgba('#000', 0.3);
    ctx.fillRect(mx + 14, B - 9, 16, 0.7);
    ctx.fillRect(mx + 74, B - 9, 16, 0.7);
    // microscope
    ctx.fillStyle = '#2c3440';
    fillRR(ctx, mx + 40, B - 22, 10, 2, 0.6, '#2c3440');
    ctx.fillRect(mx + 44, B - 34, 2, 12);
    ctx.save();
    ctx.translate(mx + 46, B - 33);
    ctx.rotate(-0.4);
    fillRR(ctx, -1.6, -8, 3.2, 10, 1, '#3d4757');
    ctx.restore();
    // big glowing tank (antirad)
    propShadow(ctx, mx + 122, 30, B);
    box(ctx, mx + 110, B - 8, 24, 8, '#3a4452', 1);
    box(ctx, mx + 110, B - 66, 24, 6, '#3a4452', 1);
    fillRR(ctx, mx + 112, B - 60, 20, 52, 3, rgba('#b58cff', 0.25));
    // computer
    computerTower(ctx, mx + 146, B, 22, 58);
    computerTower(ctx, mx + 170, B, 22, 58);
    screenRect(ctx, mx + 150, B - 38, 14, 9, '#0b2a3a');
  }
}

export function labDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // flasks bubbling
    const cols = ['#6aff8c', '#b58cff', '#ffcf4a', '#5fd3ef'];
    for (let i = 0; i < 4; i++) {
      const fx = mx + 18 + i * (i < 2 ? 7 : 0) + (i >= 2 ? 54 + (i - 2) * 7 : 0);
      flask(ctx, fx, B - 20, 0.75, cols[i], 0.5 + 0.1 * Math.sin(t + i));
      if (active) {
        const ph = (t * 0.9 + i * 0.3) % 1;
        ctx.beginPath();
        ctx.arc(fx + Math.sin(t * 3 + i) * 0.6, B - 22 - ph * 6, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(cols[i], 0.8 * (1 - ph));
        ctx.fill();
      }
    }
    // glowing tank
    const p = active ? 0.5 + 0.5 * Math.sin(t * 2.2 + m) : 0.1;
    ctx.save();
    rrect(ctx, mx + 112, B - 60, 20, 52, 3);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, B - 60, B - 8, [
      [0, rgba('#d9c2ff', 0.35 + p * 0.2)],
      [1, rgba('#8a52ff', 0.55 + p * 0.25)],
    ]);
    ctx.fillRect(mx + 112, B - 50, 20, 42);
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.35 + i * 0.2) % 1;
      ctx.beginPath();
      ctx.arc(mx + 115 + ((i * 5) % 14), B - 10 - ph * 40, 0.9, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#ffffff', 0.6);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, mx + 122, B - 34, 30, '#a070ff', 0.2 + p * 0.2);
    ctx.restore();
    // tape reels spinning
    for (const cx of [mx + 146, mx + 170]) {
      for (const rx of [cx + 22 * 0.3, cx + 22 * 0.7]) {
        const ry = B - 58 + 8;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(active ? t * 2 : 0);
        ctx.fillStyle = '#9a9a9a';
        for (let k = 0; k < 3; k++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.fillRect(-0.4, -3.2, 0.8, 2);
        }
        ctx.restore();
      }
      for (let i = 0; i < 6; i++) {
        const on = active && Math.sin(t * 5 + i * 1.7 + cx) > 0;
        ctx.fillStyle = on ? ['#ff5a4a', '#6aff8c', '#ffcf4a'][i % 3] : '#3a4148';
        ctx.fillRect(cx + 4 + (i % 3) * 5, B - 24 + Math.floor(i / 3) * 4, 2, 2);
      }
    }
  }
}

// ------------------------------------------------------------------ OFFICE
export function officeStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  const mx = 0;
  // map of the wasteland
  poster(ctx, mx + 14, 24, 56, 36, '#e8d9b5', (x, y, pw, ph) => {
    ctx.fillStyle = '#d8c59a';
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = rgba('#8a6a3a', 0.6);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + 6 + i * 7);
      ctx.bezierCurveTo(x + pw * 0.3, y + 2 + i * 7, x + pw * 0.6, y + 10 + i * 7, x + pw, y + 5 + i * 7);
      ctx.stroke();
    }
    ctx.strokeStyle = '#4a7ab5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + ph);
    ctx.bezierCurveTo(x + 20, y + ph * 0.5, x + 30, y + ph * 0.9, x + pw, y + 8);
    ctx.stroke();
    for (const [px, py, c] of [
      [0.25, 0.3, '#e8453c'],
      [0.6, 0.55, '#e8453c'],
      [0.8, 0.25, '#f2c230'],
      [0.4, 0.75, '#4fc36b'],
    ] as [number, number, string][]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + pw * px, y + ph * py, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // flag with atom logo
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(mx + 186, 20, 1.2, B - 20);
  ctx.beginPath();
  ctx.moveTo(mx + 187, 22);
  ctx.quadraticCurveTo(mx + 196, 24, mx + 204, 22);
  ctx.lineTo(mx + 204, 44);
  ctx.quadraticCurveTo(mx + 196, 46, mx + 187, 44);
  ctx.fillStyle = '#1f4e8c';
  ctx.fill();
  atomLogo(ctx, mx + 195.5, 33, 5, '#ffcf4a');
  // filing cabinets
  for (let i = 0; i < 2; i++) {
    const fx = mx + 152 + i * 15;
    propShadow(ctx, fx + 7, 16, B);
    box(ctx, fx, B - 40, 14, 40, '#6f7a70', 1);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = rgba('#000', 0.3);
      ctx.fillRect(fx + 1, B - 40 + 13.3 * (k + 1), 12, 0.7);
      fillRR(ctx, fx + 5, B - 34 + k * 13.3, 4, 1.4, 0.5, '#cfd6d1');
    }
  }
  // chair (behind the desk)
  box(ctx, mx + 104, B - 34, 14, 14, '#7a2e2e', 3);
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(mx + 110, B - 20, 2, 6);
  // desk
  propShadow(ctx, mx + 110, 70, B, 0.5);
  box(ctx, mx + 80, B - 22, 66, 5, '#7a4a2a', 1.5);
  box(ctx, mx + 82, B - 17, 18, 17, '#6b4128', 1.2);
  box(ctx, mx + 126, B - 17, 18, 17, '#6b4128', 1.2);
  ctx.fillStyle = rgba('#000', 0.3);
  ctx.fillRect(mx + 84, B - 10, 14, 0.7);
  ctx.fillRect(mx + 128, B - 10, 14, 0.7);
  // desk items: lamp, phone, papers, globe
  ctx.fillStyle = '#2f5a4a';
  ctx.fillRect(mx + 88, B - 30, 1, 8);
  ctx.beginPath();
  ctx.moveTo(mx + 84, B - 30);
  ctx.lineTo(mx + 94, B - 30);
  ctx.lineTo(mx + 92, B - 34);
  ctx.lineTo(mx + 86, B - 34);
  ctx.fillStyle = '#2f7a4a';
  ctx.fill();
  fillRR(ctx, mx + 100, B - 25, 10, 3, 1, '#1c1c1c');
  ctx.fillStyle = '#f4efe0';
  ctx.fillRect(mx + 114, B - 23.5, 9, 1.2);
  ctx.fillRect(mx + 115, B - 24.5, 9, 1.2);
  ctx.beginPath();
  ctx.arc(mx + 136, B - 30, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#4a7ab5';
  ctx.fill();
  ctx.fillStyle = '#6f9a5a';
  ctx.beginPath();
  ctx.ellipse(mx + 134.5, B - 31, 2.2, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(mx + 135.5, B - 25, 1, 3);
  // portrait
  frame(ctx, mx + 96, 26, 22, 26, (x, y, pw, ph) => {
    ctx.fillStyle = '#2b3a4a';
    ctx.fillRect(x, y, pw, ph);
    ctx.beginPath();
    ctx.arc(x + pw / 2, y + ph * 0.42, pw * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#e9b994';
    ctx.fill();
    ctx.fillStyle = '#1f4e8c';
    ctx.fillRect(x + pw * 0.2, y + ph * 0.66, pw * 0.6, ph * 0.34);
    ctx.fillStyle = '#ffcf4a';
    ctx.fillRect(x + pw * 0.45, y + ph * 0.7, pw * 0.1, ph * 0.3);
  }, '#c9a24a');
  signPlate(ctx, mx + 107, 58, lang === 'ru' ? 'СМОТРИТЕЛЬ' : 'OVERSEER', '#c9a24a', '#2a1a0a', 3.4);
  plant(ctx, mx + 70, B, 0.8);
}

export function atomLogo(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.14;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.38, (i * Math.PI) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ------------------------------------------------------------------ RADIO
export function radioStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // records on wall
    for (let i = 0; i < 3; i++) {
      const rx = mx + 24 + i * 16;
      ctx.beginPath();
      ctx.arc(rx, 32, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#141414';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, 32, 2, 0, Math.PI * 2);
      ctx.fillStyle = ['#e8453c', '#ffcf4a', '#4aa3e8'][i];
      ctx.fill();
    }
    // transmitter racks
    for (let i = 0; i < 2; i++) {
      const tx = mx + 150 + i * 24;
      propShadow(ctx, tx + 11, 24, B);
      box(ctx, tx, B - 68, 22, 68, '#3a3f48', 1.5);
      for (let k = 0; k < 4; k++) {
        fillRR(ctx, tx + 3, B - 64 + k * 10, 16, 7, 1, '#1d2127');
      }
      gauge(ctx, tx + 7, B - 18, 3.4, 0.4 + i * 0.2);
      gauge(ctx, tx + 15, B - 18, 3.4, 0.7 - i * 0.2);
    }
    // mixing desk
    propShadow(ctx, mx + 88, 64, B);
    consolePanel(ctx, mx + 58, B - 20, 62, 20, '#4a4458');
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = '#1d1a24';
      ctx.fillRect(mx + 63 + i * 5.4, B - 24, 1, 3.6);
    }
    // speakers
    for (const sx of [mx + 14, mx + 124]) {
      box(ctx, sx, B - 34, 18, 34, '#2a2530', 1.5);
      for (const [cy, r] of [
        [B - 24, 6],
        [B - 9, 4],
      ]) {
        ctx.beginPath();
        ctx.arc(sx + 9, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = rgrad(ctx, sx + 9, cy, 0, r, [
          [0, '#5a5566'],
          [0.4, '#1a171f'],
          [1, '#3a3542'],
        ]);
        ctx.fill();
      }
    }
    // microphone
    ctx.fillStyle = '#9aa3aa';
    ctx.fillRect(mx + 104, B - 42, 1, 22);
    ctx.save();
    ctx.translate(mx + 104.5, B - 44);
    fillRR(ctx, -2.2, -5, 4.4, 7, 2.2, '#c9ced2');
    ctx.restore();
    // ON AIR plate
    box(ctx, mx + 72, 22, 34, 11, '#2a1f22', 2);
  }
}

export function radioDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const on = active && Math.sin(t * 2.5) > -0.3;
    ctx.font = '700 5.4px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = on ? '#ff5a4a' : '#5a2a2a';
    ctx.fillText(lang === 'ru' ? 'В ЭФИРЕ' : 'ON AIR', mx + 89, 27.8);
    if (on) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 89, 28, 26, '#ff4a3a', 0.3);
      ctx.restore();
    }
    // VU meters on desk
    for (let i = 0; i < 10; i++) {
      const lv = active ? Math.abs(Math.sin(t * (3 + (i % 3)) + i)) : 0.1;
      const sy = B - 21 - lv * 3;
      fillRR(ctx, mx + 62 + i * 5.4, sy, 3, 1.2, 0.4, '#e8e2d4');
    }
    // tubes glowing on transmitters
    for (let i = 0; i < 2; i++) {
      const tx = mx + 150 + i * 24;
      for (let k = 0; k < 4; k++) {
        for (let q = 0; q < 3; q++) {
          const f = active ? 0.55 + 0.45 * Math.sin(t * 6 + k + q * 2 + i) : 0.12;
          ctx.fillStyle = rgba('#ffab4a', f);
          fillRR(ctx, tx + 4.5 + q * 5, B - 63 + k * 10, 2.6, 5, 1.2, ctx.fillStyle as string);
        }
      }
    }
    if (active) {
      // radio waves from the mic
      ctx.strokeStyle = rgba('#ff7cc0', 0.5);
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 3; i++) {
        const r = ((t * 12 + i * 6) % 18) + 3;
        ctx.globalAlpha = 1 - r / 21;
        ctx.beginPath();
        ctx.arc(mx + 104.5, B - 46, r, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}

// ------------------------------------------------------------------ SODA PLANT
export function sodaStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // big tank with logo
    propShadow(ctx, mx + 40, 56, B, 0.5);
    cylinder(ctx, mx + 14, B - 70, 52, 70, '#d23b3b', 7);
    ctx.fillStyle = '#f4efe6';
    ctx.beginPath();
    ctx.moveTo(mx + 14, B - 42);
    ctx.bezierCurveTo(mx + 30, B - 50, mx + 48, B - 34, mx + 66, B - 44);
    ctx.lineTo(mx + 66, B - 38);
    ctx.bezierCurveTo(mx + 48, B - 28, mx + 30, B - 44, mx + 14, B - 36);
    ctx.fill();
    ctx.font = '800 6.5px Unbounded, Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lang === 'ru' ? 'ШИПУЧКА' : 'FIZZ', mx + 40, B - 54);
    // conveyor
    propShadow(ctx, mx + 135, 130, B);
    box(ctx, mx + 70, B - 24, 132, 7, '#4a5561', 1.5);
    for (let x = mx + 74; x < mx + 200; x += 16) {
      ctx.fillStyle = '#3a424b';
      ctx.fillRect(x, B - 17, 2, 17);
    }
    // bottling machine
    box(ctx, mx + 110, B - 66, 36, 34, '#9aa3aa', 2);
    fillRR(ctx, mx + 114, B - 62, 28, 12, 1.5, '#1b2328');
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#6d757b';
      ctx.fillRect(mx + 118 + i * 9, B - 32, 2, 7);
    }
    // crates of bottles
    for (let i = 0; i < 2; i++) {
      metalCrate(ctx, mx + 170 + i * 2, B - 44 + i * 10 - 10, 22, 10, '#c7433b');
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = '#5a2a2a';
        fillRR(ctx, mx + 173 + i * 2 + k * 4, B - 47 + i * 10 - 10, 2, 4, 0.8, '#6a2a2a');
      }
    }
  }
}

export function sodaDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    // bottles moving on conveyor
    ctx.save();
    ctx.beginPath();
    ctx.rect(mx + 70, B - 40, 132, 20);
    ctx.clip();
    const off = active ? (t * 14) % 16 : 0;
    for (let x = mx + 62 + off; x < mx + 205; x += 16) {
      ctx.fillStyle = rgba('#7a2a1a', 0.9);
      fillRR(ctx, x, B - 33, 4, 9, 1.4, '#8a3a2a');
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(x, B - 30, 4, 2);
      ctx.fillStyle = '#c9ced2';
      ctx.fillRect(x + 1.2, B - 35, 1.6, 2);
    }
    ctx.restore();
    // screen
    ctx.fillStyle = rgba('#6aff8c', active ? 0.8 : 0.2);
    const lvl = active ? (t * 0.3) % 1 : 0.3;
    ctx.fillRect(mx + 116, B - 60, 24 * lvl, 3);
    ctx.fillStyle = rgba('#6aff8c', 0.5);
    ctx.font = '600 3px Oswald';
    ctx.fillText('FIZZ-O-MATIC', mx + 128, B - 53);
  }
}

// ------------------------------------------------------------------ DOOR
export function doorStatic(ctx: Ctx, w: number, level: number, vault: number) {
  // tunnel opening on the left, the great door embedded in left third
  const cx = 44;
  const cy = 58;
  // doorway recess
  ctx.fillStyle = '#0b0e11';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();
  // frame ring
  ctx.beginPath();
  ctx.arc(cx, cy, 41, 0, Math.PI * 2);
  ctx.arc(cx, cy, 36.5, 0, Math.PI * 2, true);
  ctx.fillStyle = rgrad(ctx, cx, cy, 34, 42, [
    [0, '#2a3037'],
    [0.5, '#6b7580'],
    [1, '#2a3037'],
  ]);
  ctx.fill();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rivet(ctx, cx + Math.cos(a) * 39, cy + Math.sin(a) * 39, 1.1, '#6b7580');
  }
  // hydraulic arm
  box(ctx, cx + 36, cy - 4, 36, 8, '#5b646e', 2);
  box(ctx, cx + 70, cy - 10, 10, 20, '#3a424b', 2);
  hazard(ctx, cx + 72, cy - 8, 6, 16, '#f2b632', '#26282b', 3);
  // control panel
  box(ctx, 150, 42, 34, 26, '#4a5561', 2);
  screenRect(ctx, 154, 46, 16, 10, '#0e2a22');
  buttonsRow(ctx, 156, 62, 5);
  box(ctx, 174, 46, 7, 18, '#2a2f35', 1);
  ctx.fillStyle = '#e84a3c';
  fillRR(ctx, 175.5, 48, 4, 6, 1, '#e84a3c');
  // floor warning stripes
  hazard(ctx, IX0, WALL_BOTTOM - 4, w - IX0 * 2, 3, '#f2b632', '#26282b', 4);
  // AtomHome plaque
  signPlate(ctx, 167, 26, 'АТОМУЮТ', '#ffb02e', '#2a1a0a', 4.4);
  if (level >= 2) {
    box(ctx, 120, 78, 14, B - 78, '#3a424b', 1);
    box(ctx, 190, 78, 14, B - 78, '#3a424b', 1);
  }
}

export function drawVaultDoorDisc(ctx: Ctx, cx: number, cy: number, r: number, rot: number, vault: number, level: number) {
  ctx.save();
  ctx.translate(cx, cy);
  // shadow
  ctx.beginPath();
  ctx.arc(2, 3, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#000', 0.45);
  ctx.fill();
  ctx.rotate(rot);
  const base = level >= 3 ? '#9aa6b2' : '#8a949e';
  gearPath(ctx, 0, 0, r - 2.5, 12, 2.5, 0);
  ctx.fillStyle = rgrad(ctx, -r * 0.3, -r * 0.3, r * 0.1, r * 1.2, [
    [0, shade(base, 0.35)],
    [0.6, base],
    [1, shade(base, -0.45)],
  ]);
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = shade(base, -0.55);
  ctx.stroke();
  // inner rings
  for (const rr of [r * 0.78, r * 0.52]) {
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.strokeStyle = rgba('#000', 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, rr - 1, 0, Math.PI * 2);
    ctx.strokeStyle = rgba('#ffffff', 0.18);
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // bolts
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rivet(ctx, Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, 1.3, base);
  }
  // center hub
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -2, -2, 1, r * 0.35, [
    [0, '#ffd27a'],
    [1, '#c98a1a'],
  ]);
  ctx.fill();
  ctx.rotate(-rot);
  ctx.font = `800 ${r * 0.26}px Unbounded, Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3a2408';
  ctx.fillText(String(vault).padStart(3, '0'), 0, 0.5);
  ctx.restore();
}

// ------------------------------------------------------------------ ELEVATOR
export function elevatorStatic(ctx: Ctx, w: number) {
  ctx.fillStyle = '#12161b';
  ctx.fillRect(0, 0, w, FLOOR_H);
  // shaft back wall
  paintShaft(ctx, w);
}

function paintShaft(ctx: Ctx, w: number) {
  ctx.fillStyle = hgrad(ctx, 4, w - 4, [
    [0, '#1d2329'],
    [0.5, '#2e363f'],
    [1, '#1d2329'],
  ]);
  ctx.fillRect(4, 0, w - 8, FLOOR_H);
  // rails
  for (const rx of [16, w - 18]) {
    ctx.fillStyle = hgrad(ctx, rx, rx + 2, [
      [0, '#5a646e'],
      [0.5, '#aab4bd'],
      [1, '#4a525b'],
    ]);
    ctx.fillRect(rx, 0, 2, FLOOR_H);
  }
  // cables
  ctx.fillStyle = '#0d1013';
  ctx.fillRect(w / 2 - 3, 0, 1, FLOOR_H);
  ctx.fillRect(w / 2 + 2, 0, 1, FLOOR_H);
  // cross braces
  ctx.strokeStyle = rgba('#000', 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 20);
  ctx.lineTo(w - 6, 60);
  ctx.moveTo(w - 6, 20);
  ctx.lineTo(6, 60);
  ctx.stroke();
  // side shells
  for (const sx of [0, w - 4]) {
    ctx.fillStyle = hgrad(ctx, sx, sx + 4, [
      [0, '#20262d'],
      [0.5, '#3b4550'],
      [1, '#20262d'],
    ]);
    ctx.fillRect(sx, 0, 4, FLOOR_H);
  }
  // floor landing + frame
  ctx.fillStyle = vgrad(ctx, FLOOR_FRONT, FLOOR_H, [
    [0, '#3d4650'],
    [1, '#1c2127'],
  ]);
  ctx.fillRect(0, FLOOR_FRONT, w, FLOOR_H - FLOOR_FRONT);
  hazard(ctx, 4, FLOOR_FRONT, w - 8, 2.2, '#f2b632', '#26282b', 3);
  ctx.fillStyle = '#2a323b';
  ctx.fillRect(0, 0, w, 9);
}

export function elevatorDoorsStatic(ctx: Ctx, w: number, floorNo: number) {
  // floor number plate
  box(ctx, w / 2 - 7, 17, 14, 9, '#1b2025', 1.5);
  ctx.font = '700 6px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffb02e';
  ctx.fillText(String(floorNo), w / 2, 21.8);
}

export { rgba, M, B };
