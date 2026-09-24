/* Room interiors v2: reactor, garden, purifier, Project Dawn. Three module variants each. */
import { box, cylinder, fillRR, gauge, glow, hazard, hcylinder, hgrad, pipeH, pipeV, rgba, rgrad, rivet, rrect, screenRect, shade, vgrad, type Ctx } from './gfx';
import { bx0, bx1, propShadow } from './roomBase';
import { buttonsRow, consolePanel, crate, plant, poster, posterText, shelfUnit, valveWheel } from './props';
import { bigValve, knob, panel, pump, wallVent } from './furniture';
import { chain, crt, gasCylinder, L, officeChair, steelTable, trefoil, warnSign, wallShelf } from './kit2';
import { WALL_BOTTOM, WALL_TOP } from './world';

const B = WALL_BOTTOM + 1.5;
const M = 210;
const variant = (m: number, size: number) => (size === 1 ? 0 : m % 3);

// ================================================================== REACTOR
export function reactorStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  hazard(ctx, bx0(), WALL_BOTTOM - 5, bx1(w) - bx0(), 3, '#e2a72a', '#262a2f', 4);
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      pipeV(ctx, mx + 30, WALL_TOP, B - 6, 5, '#6b7a82');
      pipeV(ctx, mx + 180, WALL_TOP, B - 6, 5, '#6b7a82');
      pipeH(ctx, mx + 30, mx + 72, 44, 3.5, '#6b7a82');
      pipeH(ctx, mx + 138, mx + 180, 44, 3.5, '#6b7a82');
      for (const px of [mx + 30, mx + 180]) {
        box(ctx, px - 7, B - 10, 14, 10, '#4a5561', 1.2);
        valveWheel(ctx, px, 64, 4, 0.3, '#d6453c');
      }
      reactorVessel(ctx, mx + 105, B, level);
      trefoil(ctx, mx + 52, 70, 6.5);
      trefoil(ctx, mx + 158, 70, 6.5);
    } else if (v === 1) {
      mimicBoard(ctx, mx + 18, 26, 120, 34, lang);
      consolePanel(ctx, mx + 22, B - 18, 50, 18, '#4a5561');
      consolePanel(ctx, mx + 84, B - 18, 50, 18, '#4a5561');
      for (const cx of [mx + 26, mx + 88]) {
        buttonsRow(ctx, cx + 4, B - 21, 12);
        for (let i = 0; i < 3; i++) gauge(ctx, cx + 8 + i * 15, B - 10, 3.2, 0.3 + i * 0.2);
      }
      officeChair(ctx, mx + 47, B + 5, '#3a3f45', false);
      officeChair(ctx, mx + 109, B + 5, '#3a3f45', false);
      scramButton(ctx, mx + 150, B, lang);
      dosimeter(ctx, mx + 176, 34);
      warnSign(ctx, mx + 180, 66, 7);
    } else {
      coolingPool(ctx, mx + 18, B, 70);
      heatExchanger(ctx, mx + 96, B);
      pump(ctx, mx + 162, B, '#3f5a6a');
      pipeV(ctx, mx + 174, WALL_TOP, B - 24, 3, '#6b7a82');
      bigValve(ctx, mx + 174, 44, 6, 0.4, '#d6453c');
      wallVent(ctx, mx + 150, 28, 40, 12);
    }
  }
}

function reactorVessel(ctx: Ctx, cx: number, y: number, level: number) {
  propShadow(ctx, cx, 94, y + 1, 0.6);
  box(ctx, cx - 44, y - 12, 88, 12, '#3a424b', 2);
  hazard(ctx, cx - 42, y - 5, 84, 2.4, '#e2a72a', '#262a2f', 3);
  // vessel body
  fillRR(ctx, cx - 34, y - 70, 68, 60, 24, hgrad(ctx, cx - 34, cx + 34, [
    [0, '#3c4a44'],
    [0.28, '#9fb4aa'],
    [0.5, '#7a8f86'],
    [1, '#26312c'],
  ]));
  // flange bands
  for (const by of [y - 58, y - 24]) {
    ctx.fillStyle = rgba('#000', 0.25);
    ctx.fillRect(cx - 34, by, 68, 1.6);
    for (let i = 0; i < 7; i++) rivet(ctx, cx - 30 + i * 10, by - 1.4, 0.9, '#9fb4aa');
  }
  // window
  fillRR(ctx, cx - 16, y - 58, 32, 34, 12, '#101814');
  // top head & rods (kept below the ceiling)
  box(ctx, cx - 26, y - 76, 52, 8, '#5d6b64', 3);
  for (let i = 0; i < 4; i++) {
    const rx = cx - 20 + i * 12;
    box(ctx, rx, y - 82, 5, 7, level >= 3 ? '#e8c872' : '#c9a24a', 1);
    ctx.fillStyle = '#2a2f35';
    ctx.fillRect(rx + 1, y - 83, 3, 1.4);
  }
}

function mimicBoard(ctx: Ctx, x: number, y: number, w: number, h: number, lang: string) {
  panel(ctx, x, y, w, h, '#4a5a52', 1.6);
  fillRR(ctx, x + 3, y + 3, w - 6, h - 6, 1, '#1d2622');
  // flow lines of the reactor scheme
  ctx.strokeStyle = '#6aa0c8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 20);
  ctx.lineTo(x + 50, y + 20);
  ctx.lineTo(x + 50, y + 10);
  ctx.lineTo(x + 90, y + 10);
  ctx.lineTo(x + 90, y + 24);
  ctx.lineTo(x + 108, y + 24);
  ctx.stroke();
  ctx.strokeStyle = '#d65a4a';
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 26);
  ctx.lineTo(x + 70, y + 26);
  ctx.lineTo(x + 70, y + 16);
  ctx.stroke();
  // reactor symbol
  ctx.beginPath();
  ctx.arc(x + 16, y + 22, 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#6aff8c';
  ctx.stroke();
  ctx.font = '700 3.2px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#c9d8cf';
  ctx.fillText(L(lang, 'СХЕМА ЭНЕРГОБЛОКА', 'REACTOR SCHEMATIC'), x + 6, y + 8);
  // pump boxes
  for (const px of [x + 46, x + 86]) {
    ctx.strokeStyle = '#c9d8cf';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(px, y + 13, 8, 6);
  }
}

function scramButton(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 10, 26, y + 1, 0.4);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 8.5, y - 30, 3, 30);
  fillRR(ctx, x + 4, y - 2, 12, 2, 0.8, '#2a2d31');
  panel(ctx, x, y - 42, 20, 12, '#f2c230', 1.4);
  hazard(ctx, x + 1, y - 32.6, 18, 2, '#f2c230', '#26282b', 2);
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 38, 5, 2.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b8261e';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 39, 4.2, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8453c';
  ctx.fill();
  // glass cover
  ctx.fillStyle = rgba('#dff3ff', 0.25);
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 39.5, 6, 3.6, 0, Math.PI, 0);
  ctx.fill();
  ctx.font = '700 2.8px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8453c';
  ctx.fillText(L(lang, 'НЕ НАЖИМАТЬ!', "DON'T PRESS!"), x + 10, y - 45.5);
}

function dosimeter(ctx: Ctx, x: number, y: number) {
  panel(ctx, x - 8, y - 6, 18, 20, '#e8c872', 1.6);
  gauge(ctx, x + 1, y + 2, 5, 0.35, '#f4efe0');
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x - 5, y + 9, 12, 2.4);
}

function coolingPool(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.5);
  // pool rim & walls
  panel(ctx, x, y - 18, w, 18, '#8a959e', 1.6);
  fillRR(ctx, x + 3, y - 16, w - 6, 13, 1, '#062432');
  // rack of fuel assemblies under water
  ctx.fillStyle = rgba('#8fb3c2', 0.35);
  for (let i = 0; i < 8; i++) ctx.fillRect(x + 7 + i * 7.6, y - 13, 3.6, 10);
  hazard(ctx, x, y - 20, w, 2, '#e2a72a', '#262a2f', 3);
  // railing
  ctx.strokeStyle = '#e2a72a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + w, y - 34);
  ctx.stroke();
  for (let px = x + 2; px <= x + w; px += 17) {
    ctx.fillStyle = '#b8862e';
    ctx.fillRect(px, y - 34, 1.2, 14);
  }
}

function heatExchanger(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 30, 70, y + 1, 0.5);
  ctx.fillStyle = '#4a5561';
  ctx.fillRect(x + 8, y - 14, 3, 14);
  ctx.fillRect(x + 50, y - 14, 3, 14);
  hcylinder(ctx, x, y - 44, 62, 30, '#8a9aa3');
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = rgba('#000', 0.25);
    ctx.fillRect(x + 6 + i * 10, y - 44, 1.4, 30);
  }
  // end caps
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 29, 4, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#6b7a82';
  ctx.fill();
  pipeV(ctx, x + 14, WALL_TOP, y - 44, 3, '#c9573f');
  pipeV(ctx, x + 46, WALL_TOP, y - 44, 3, '#3f7fc9');
  gauge(ctx, x + 30, y - 50, 3.6, 0.55);
}

export function reactorDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    const p = active ? 0.6 + 0.4 * Math.sin(t * 2.5 + m) : 0.1;
    if (v === 0) {
      const cx = mx + 105;
      ctx.save();
      rrect(ctx, cx - 16, B - 58, 32, 34, 12);
      ctx.clip();
      ctx.fillStyle = rgrad(ctx, cx, B - 41, 2, 24, [
        [0, rgba('#eaffb0', 0.9 * p + 0.1)],
        [0.4, rgba('#6aff8c', 0.7 * p + 0.1)],
        [1, rgba('#0b3a2a', 0.9)],
      ]);
      ctx.fillRect(cx - 16, B - 58, 32, 34);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rgba('#1a2a22', 0.6);
        ctx.fillRect(cx - 11 + i * 7, B - 54, 2.4, 28);
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, B - 41, 55, '#6aff8c', 0.25 * p);
      ctx.restore();
    } else if (v === 1) {
      // mimic board lamps
      for (let i = 0; i < 10; i++) {
        const on = active && Math.sin(t * (1.5 + (i % 4) * 0.7) + i * 1.9) > -0.1;
        ctx.fillStyle = on ? ['#6aff8c', '#ffcf4a', '#6aff8c', '#5fb8ff', '#ff5a4a'][i % 5] : '#2a2f35';
        ctx.beginPath();
        ctx.arc(mx + 30 + i * 10, 52, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // flow dots along lines
      if (active) {
        const k = (t * 0.25) % 1;
        ctx.fillStyle = '#bfe8ff';
        ctx.beginPath();
        ctx.arc(mx + 38 + k * 30, 46, 0.9, 0, Math.PI * 2);
        ctx.arc(mx + 68 + k * 40, 36, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      // dosimeter needle twitch
      const a = Math.PI * (0.8 + (0.35 + 0.08 * Math.sin(t * 13) * (active ? 1 : 0.2)) * 1.4);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(mx + 177, 36);
      ctx.lineTo(mx + 177 + Math.cos(a) * 4, 36 + Math.sin(a) * 4);
      ctx.stroke();
    } else {
      // Cherenkov glow in the pool
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#3fb8ff', 0.25 + 0.2 * p);
      ctx.fillRect(mx + 21, B - 16, 64, 13);
      glow(ctx, mx + 53, B - 12, 44, '#3fa8ff', 0.2 * p + 0.05);
      ctx.restore();
      // steam from the vent
      if (active) {
        for (let i = 0; i < 4; i++) {
          const ph = (t * 0.6 + i / 4) % 1;
          ctx.beginPath();
          ctx.arc(mx + 170 + Math.sin(ph * 6 + i) * 3, 40 - ph * 12, 2 + ph * 4, 0, Math.PI * 2);
          ctx.fillStyle = rgba('#ffffff', 0.18 * (1 - ph));
          ctx.fill();
        }
      }
      // pump rotor
      ctx.save();
      ctx.translate(mx + 172, B - 11);
      ctx.rotate(active ? t * 8 : 0);
      ctx.fillStyle = '#8fb3c2';
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-0.7, -4, 1.4, 4);
      }
      ctx.restore();
    }
  }
}

// ================================================================== GARDEN
export function gardenStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  pipeH(ctx, bx0(), bx1(w), 50, 1.4, '#6b7a82');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 3; i++) {
        const px = mx + 18 + i * 60;
        growLight(ctx, px + 2, WALL_TOP + 3, 48);
        box(ctx, px, 58, 52, 5, '#e9eef0', 1);
        ctx.fillStyle = '#9aa3aa';
        ctx.fillRect(px + 2, 63, 1.2, B - 63);
        ctx.fillRect(px + 48.8, 63, 1.2, B - 63);
        for (let k = 0; k < 6; k++) lettuce(ctx, px + 5 + k * 8.4, 58, 0.8 + (k % 2) * 0.15);
        planter(ctx, px, B, 52);
        for (let k = 0; k < 4; k++) {
          if ((i + k) % 2) tomatoPlant(ctx, px + 7 + k * 12.5, B - 12, level);
          else pepperPlant(ctx, px + 7 + k * 12.5, B - 12);
        }
      }
    } else if (v === 1) {
      growLight(ctx, mx + 20, WALL_TOP + 3, 80);
      growLight(ctx, mx + 110, WALL_TOP + 3, 80);
      soilBed(ctx, mx + 18, B, 96);
      for (let k = 0; k < 5; k++) corn(ctx, mx + 26 + k * 10, B - 8);
      giantTomato(ctx, mx + 94, B - 8);
      soilBed(ctx, mx + 122, B, 40);
      for (let k = 0; k < 3; k++) carrotTops(ctx, mx + 130 + k * 12, B - 8);
      wateringCan(ctx, mx + 170, B);
      wheelbarrow(ctx, mx + 176, B);
      seedPoster(ctx, mx + 150, 28, lang);
    } else {
      growLight(ctx, mx + 50, WALL_TOP + 3, 70);
      appleTree(ctx, mx + 84, B);
      seedShelf(ctx, mx + 20, 34, lang);
      compostBin(ctx, mx + 20, B);
      scarecrow(ctx, mx + 150, B);
      crate(ctx, mx + 170, B - 12, 18, 12, '#a4733f');
      for (let i = 0; i < 4; i++) apple(ctx, mx + 173 + i * 4, B - 13, i % 2 ? '#e8453c' : '#8fcf4a');
    }
  }
}

export function gardenDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    const lights = v === 0 ? [mx + 20, mx + 80, mx + 140].map((x) => [x, 48]) : v === 1 ? [[mx + 20, 80], [mx + 110, 80]] : [[mx + 50, 70]];
    if (active) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [lx, lw] of lights) {
        const g = ctx.createLinearGradient(0, WALL_TOP + 6, 0, B);
        g.addColorStop(0, rgba('#ff7ae0', 0.2 + 0.03 * Math.sin(t * 1.5 + lx)));
        g.addColorStop(1, rgba('#ff7ae0', 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(lx, WALL_TOP + 7);
        ctx.lineTo(lx + lw, WALL_TOP + 7);
        ctx.lineTo(lx + lw + 8, B);
        ctx.lineTo(lx - 8, B);
        ctx.fill();
      }
      ctx.restore();
      // drips from the irrigation pipe
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.8 + i * 0.37) % 1;
        ctx.fillStyle = rgba('#8fdcff', 0.8 * (1 - ph));
        ctx.fillRect(mx + 20 + i * 32, 52 + ph * 5, 0.7, 1.4);
      }
    }
    if (v === 2) {
      // butterflies / fireflies around the tree
      for (let i = 0; i < 3; i++) {
        const a = t * (0.8 + i * 0.3) + i * 2;
        const bx = mx + 84 + Math.cos(a) * (16 + i * 4);
        const by = 46 + Math.sin(a * 1.7) * 8;
        const f = Math.abs(Math.sin(t * 12 + i));
        ctx.fillStyle = ['#ffcf4a', '#ff9ad0', '#ffffff'][i];
        ctx.beginPath();
        ctx.ellipse(bx - 1, by, 1.2, 0.6 + f * 0.8, 0.4, 0, Math.PI * 2);
        ctx.ellipse(bx + 1, by, 1.2, 0.6 + f * 0.8, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // scarecrow head tilt: crow hop
      const hop = Math.max(0, Math.sin(t * 3)) * 1.5;
      crow(ctx, mx + 158, B - 58 - hop);
    }
    if (v === 1 && active) {
      // giant tomato wobble shine
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 94, B - 22, 12, '#ff8a6a', 0.12 + 0.05 * Math.sin(t * 2));
      ctx.restore();
    }
  }
}

function growLight(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x + 4, WALL_TOP - 2);
  ctx.lineTo(x + 4, y);
  ctx.moveTo(x + w - 4, WALL_TOP - 2);
  ctx.lineTo(x + w - 4, y);
  ctx.stroke();
  box(ctx, x, y, w, 3, '#3a3f45', 1);
  fillRR(ctx, x + 2, y + 3, w - 4, 1.4, 0.6, '#ffb8f0');
}

function planter(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  box(ctx, x, y - 12, w, 12, '#8a5a36', 1);
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(x + 1.5, y - 12, w - 3, 2.5);
  ctx.fillStyle = rgba('#000', 0.2);
  for (let i = 1; i < 4; i++) ctx.fillRect(x, y - 12 + i * 3, w, 0.5);
}

function soilBed(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.35);
  box(ctx, x, y - 9, w, 9, '#6b4a32', 1);
  ctx.fillStyle = vgrad(ctx, y - 10, y - 6, [
    [0, '#4a3322'],
    [1, '#2e2016'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 8);
  for (let i = 0; i <= w - 2; i += 4) ctx.lineTo(x + 1 + i, y - 9.5 - Math.sin(i * 0.7) * 0.8);
  ctx.lineTo(x + w - 1, y - 6);
  ctx.lineTo(x + 1, y - 6);
  ctx.fill();
}

function lettuce(ctx: Ctx, x: number, y: number, s: number) {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (i - 2) * 1.4 * s, y - 2.5 * s, 1.8 * s, 3 * s, (i - 2) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#7ed957' : '#5fb84a';
    ctx.fill();
  }
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.beginPath();
  ctx.ellipse(x - 0.6 * s, y - 4 * s, 0.6 * s, 1.4 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function leaf(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot: number, c: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
}

function tomatoPlant(ctx: Ctx, x: number, y: number, level: number) {
  ctx.strokeStyle = '#3f7a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 2, y - 12, x + 1, y - 22);
  ctx.stroke();
  ctx.strokeStyle = '#b89a6a';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + 2, y - 24);
  ctx.stroke();
  for (let i = 0; i < 5; i++) leaf(ctx, x + (i % 2 ? 3 : -3), y - 5 - i * 4, 3, 1.4, i % 2 ? 0.4 : -0.4, i % 2 ? '#4f9b4a' : '#5fae52');
  for (let i = 0; i < 3 + (level >= 2 ? 1 : 0); i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 2.4, y - 9 - i * 4, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = i === 3 ? '#f2a23c' : '#e8453c';
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.5);
    ctx.fillRect(x + (i - 1) * 2.4 - 0.8, y - 10 - i * 4, 0.6, 0.6);
  }
}

function pepperPlant(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = '#3f7a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  for (let i = 0; i < 4; i++) leaf(ctx, x + (i % 2 ? 2.6 : -2.6), y - 4 - i * 3.6, 2.8, 1.3, i % 2 ? 0.5 : -0.5, '#5fae52');
  for (let i = 0; i < 2; i++) {
    fillRR(ctx, x - 3 + i * 4, y - 12 + i * 3, 1.8, 4, 0.9, i ? '#f2c230' : '#d63a3a');
  }
}

function corn(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#5a9b3a';
  ctx.fillRect(x - 0.6, y - 34, 1.2, 34);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(x, y - 6 - i * 6);
    ctx.rotate(i % 2 ? 0.8 : -0.8);
    leaf(ctx, 0, -4, 1.2, 5.4, 0, i % 2 ? '#6fb84a' : '#5fa83f');
    ctx.restore();
  }
  fillRR(ctx, x + 0.8, y - 24, 2.4, 7, 1.2, '#f2c230');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - 0.5, y - 38, 1, 4);
}

function giantTomato(ctx: Ctx, x: number, y: number) {
  // mutant gag: a tomato bigger than a dweller's head, propped on a crate
  ctx.strokeStyle = '#3f7a33';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.quadraticCurveTo(x - 10, y - 20, x - 2, y - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 13, 12, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - 4, y - 18, 1, 14, [
    [0, '#ff8a6a'],
    [0.6, '#e8453c'],
    [1, '#9a2a1e'],
  ]);
  ctx.fill();
  ctx.fillStyle = '#4f9b4a';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    leaf(ctx, x + Math.cos(a) * 3, y - 24 + Math.sin(a) * 1 + 1, 3, 1, a, '#4f9b4a');
  }
  ctx.fillStyle = rgba('#ffffff', 0.45);
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 18, 2.4, 1.4, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // tape measure gag
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x - 12, y - 1.4, 24, 1.4);
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 12; i++) ctx.fillRect(x - 12 + i * 2, y - 1.4, 0.3, 0.8);
}

function carrotTops(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 1.6, y - 2, 3.2, 3, 1, '#f28a2a');
  for (let i = 0; i < 4; i++) leaf(ctx, x + (i - 1.5) * 1.4, y - 7, 0.9, 4, (i - 1.5) * 0.3, '#5fb84a');
}

function wateringCan(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 4, y - 8, 8, 8, 1.6, '#3f8a9a');
  ctx.strokeStyle = '#3f8a9a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 5);
  ctx.lineTo(x - 9, y - 11);
  ctx.moveTo(x - 2, y - 8);
  ctx.quadraticCurveTo(x + 1, y - 13, x + 3, y - 8);
  ctx.stroke();
}

function wheelbarrow(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 6, 20, y + 1, 0.3);
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 14);
  ctx.lineTo(x + 14, y - 14);
  ctx.lineTo(x + 11, y - 6);
  ctx.lineTo(x + 1, y - 6);
  ctx.closePath();
  ctx.fillStyle = '#c7433b';
  ctx.fill();
  ctx.fillStyle = '#4a3322';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 14.5, 7.4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 12, y - 3, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.strokeStyle = '#6b4a32';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 7);
  ctx.lineTo(x - 6, y - 10);
  ctx.moveTo(x + 2, y - 6);
  ctx.lineTo(x + 2, y);
  ctx.stroke();
}

function seedPoster(ctx: Ctx, x: number, y: number, lang: string) {
  poster(ctx, x, y, 30, 36, '#eadfbf', (px, py, pw, ph) => {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const sx = px + 3 + c * 13;
        const sy = py + 3 + r * 13;
        fillRR(ctx, sx, sy, 11, 11, 0.6, ['#f2a23c', '#6fb84a', '#e8453c', '#c9a24a'][r * 2 + c]);
        ctx.fillStyle = rgba('#ffffff', 0.7);
        ctx.fillRect(sx + 1.5, sy + 7.5, 8, 2);
      }
    }
    posterText(ctx, L(lang, 'СЕМЕНА', 'SEEDS'), px + pw / 2, py + ph - 5, 4.4, '#3a5a2a');
  });
}

function appleTree(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x, 54, y + 1, 0.45);
  // big planter
  fillRR(ctx, x - 18, y - 14, 36, 14, 2, vgrad(ctx, y - 14, y, [
    [0, '#9a6a45'],
    [1, '#6b4428'],
  ]));
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(x - 17, y - 14, 34, 2.4);
  // trunk
  ctx.fillStyle = hgrad(ctx, x - 3, x + 3, [
    [0, '#4a3222'],
    [0.5, '#7a5236'],
    [1, '#3a2418'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 14);
  ctx.quadraticCurveTo(x - 1, y - 30, x - 4, y - 42);
  ctx.lineTo(x + 1, y - 44);
  ctx.quadraticCurveTo(x + 3, y - 30, x + 3, y - 14);
  ctx.fill();
  // canopy blobs
  const blobs = [
    [0, -58, 20],
    [-16, -50, 13],
    [16, -50, 14],
    [-8, -66, 12],
    [10, -66, 12],
  ];
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fillStyle = rgrad(ctx, x + bx - r * 0.3, y + by - r * 0.4, 1, r * 1.1, [
      [0, '#8fd46a'],
      [0.6, '#4f9b4a'],
      [1, '#2f6a33'],
    ]);
    ctx.fill();
  }
  for (let i = 0; i < 9; i++) apple(ctx, x - 20 + ((i * 17) % 40), y - 44 - ((i * 11) % 26), i % 3 === 2 ? '#f2c230' : '#e8453c');
}

function apple(ctx: Ctx, x: number, y: number, c: string) {
  ctx.beginPath();
  ctx.arc(x, y, 1.9, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.fillRect(x - 0.9, y - 1, 0.6, 0.6);
}

function seedShelf(ctx: Ctx, x: number, y: number, lang: string) {
  wallShelf(ctx, x, y + 14, 44);
  for (let i = 0; i < 6; i++) {
    fillRR(ctx, x + 2 + i * 7, y + 5, 6, 9, 0.5, ['#f2a23c', '#6fb84a', '#e8453c', '#c9a24a', '#8a5ac8', '#5fb8e8'][i]);
    ctx.fillStyle = rgba('#ffffff', 0.7);
    ctx.fillRect(x + 3 + i * 7, y + 10, 4, 2.4);
  }
  ctx.font = '700 3px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a5a2a';
  ctx.fillText(L(lang, 'СЕМЕННОЙ ФОНД', 'SEED BANK'), x + 22, y + 2);
}

function compostBin(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.4);
  box(ctx, x, y - 20, 24, 20, '#3f6a3a', 2);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = rgba('#000', 0.25);
    ctx.fillRect(x + 2, y - 17 + i * 4.4, 20, 0.8);
  }
  // recycle arrows
  ctx.strokeStyle = '#d9f0c8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x + 12, y - 10, 3.6, 0.3, Math.PI * 1.6);
  ctx.stroke();
}

function scarecrow(ctx: Ctx, x: number, y: number) {
  // gag: an underground scarecrow in a vault suit (there are no crows... except one)
  propShadow(ctx, x, 16, y + 1, 0.3);
  ctx.fillStyle = '#7a5236';
  ctx.fillRect(x - 0.8, y - 50, 1.6, 50);
  ctx.fillRect(x - 14, y - 40, 28, 1.6);
  // jumpsuit
  fillRR(ctx, x - 7, y - 42, 14, 18, 3, '#2f6fb8');
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x - 0.5, y - 42, 1, 18);
  ctx.fillRect(x - 13, y - 41, 6, 2);
  ctx.fillRect(x + 7, y - 41, 6, 2);
  // straw hands
  ctx.strokeStyle = '#e8c872';
  ctx.lineWidth = 0.6;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + s * 14, y - 40);
      ctx.lineTo(x + s * (16.5 + i * 0.4), y - 42 + i * 2);
      ctx.stroke();
    }
  }
  // sack head
  ctx.beginPath();
  ctx.arc(x, y - 49, 5.6, 0, Math.PI * 2);
  ctx.fillStyle = '#d9c29a';
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x - 2.6, y - 50.5, 1.2, 1.2);
  ctx.fillRect(x + 1.4, y - 50.5, 1.2, 1.2);
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y - 47);
  for (let i = 0; i < 5; i++) ctx.lineTo(x - 2.4 + i * 1.2, y - 47 + (i % 2 ? 0.8 : 0));
  ctx.stroke();
  // hat
  ctx.fillStyle = '#8a6a3a';
  ctx.beginPath();
  ctx.ellipse(x, y - 54, 8, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  fillRR(ctx, x - 4, y - 59, 8, 5, 1.6, '#8a6a3a');
}

function crow(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#1d1a22';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2.6, y - 1.8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2a23c';
  ctx.beginPath();
  ctx.moveTo(x + 3.8, y - 2);
  ctx.lineTo(x + 5.6, y - 1.6);
  ctx.lineTo(x + 3.8, y - 1.2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 2.8, y - 2.4, 0.5, 0.5);
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x - 5.4, y - 1);
  ctx.lineTo(x - 5, y + 1);
  ctx.fillStyle = '#1d1a22';
  ctx.fill();
}

// ================================================================== PURIFIER
export function purifierStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  pipeH(ctx, bx0(), bx1(w), WALL_TOP + 6, 4, '#5b6d77');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 3; i++) {
        const cx = mx + 20 + i * 62;
        purColumn(ctx, cx, B, i);
        pipeV(ctx, cx + 16, WALL_TOP + 6, WALL_TOP + 14, 2.4, '#5b6d77');
      }
      for (let i = 0; i < 2; i++) pump(ctx, mx + 54 + i * 62, B, '#39505b');
    } else if (v === 1) {
      settlingTank(ctx, mx + 20, B);
      uvChamber(ctx, mx + 110, B, lang);
      gasCylinder(ctx, mx + 168, B, 42, '#6d8a9a', 'O₃');
      gasCylinder(ctx, mx + 178, B, 42, '#6d8a9a', 'O₃');
      chain(ctx, mx + 166, mx + 188, 66);
    } else {
      manifold(ctx, mx + 18, 38, 120);
      for (let i = 0; i < 3; i++) flowMeter(ctx, mx + 36 + i * 40, B);
      drainGrate(ctx, mx + 70, B);
      tapStation(ctx, mx + 152, B, lang);
    }
  }
}

function purColumn(ctx: Ctx, x: number, y: number, i: number) {
  propShadow(ctx, x + 16, 40, y + 1, 0.5);
  cylinder(ctx, x, WALL_TOP + 14, 32, y - WALL_TOP - 14, '#7f98a3', 5);
  fillRR(ctx, x + 11, WALL_TOP + 22, 10, y - WALL_TOP - 38, 4, '#0f2b36');
  for (const by of [WALL_TOP + 18, y - 12]) {
    ctx.fillStyle = rgba('#000', 0.3);
    ctx.fillRect(x, by, 32, 1.3);
    for (let k = 0; k < 5; k++) rivet(ctx, x + 3 + k * 6.5, by - 1, 0.7, '#9fb8c2');
  }
  gauge(ctx, x + 26, 62, 3, 0.4 + i * 0.15);
  ctx.font = '700 3px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8f4f8';
  ctx.fillText(`Ф-${i + 1}`, x + 6, 62);
}

function settlingTank(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 40, 90, y + 1, 0.55);
  box(ctx, x, y - 10, 80, 10, '#39505b', 1.6);
  fillRR(ctx, x + 4, y - 66, 72, 56, 10, hgrad(ctx, x + 4, x + 76, [
    [0, '#4a6470'],
    [0.3, '#a9c4ce'],
    [0.6, '#7f98a3'],
    [1, '#3a4e58'],
  ]));
  // round porthole
  ctx.beginPath();
  ctx.arc(x + 40, y - 38, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#2a3a42';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 40, y - 38, 15.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0c2a38';
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rivet(ctx, x + 40 + Math.cos(a) * 16.8, y - 38 + Math.sin(a) * 16.8, 0.8, '#9fb8c2');
  }
  pipeV(ctx, x + 40, WALL_TOP + 6, y - 66, 2.6, '#5b6d77');
}

function uvChamber(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 24, 56, y + 1, 0.5);
  panel(ctx, x, y - 56, 48, 56, '#3a4550', 1.8);
  fillRR(ctx, x + 4, y - 50, 40, 26, 1.4, '#1a0f2a');
  for (let i = 0; i < 4; i++) {
    fillRR(ctx, x + 8 + i * 9, y - 48, 3, 22, 1.4, '#d8b8ff');
  }
  pipeH(ctx, x - 8, x, y - 36, 2.6, '#5b6d77');
  pipeH(ctx, x + 48, x + 58, y - 36, 2.6, '#5b6d77');
  warnSign(ctx, x + 24, y - 14, 5, '#b58cff');
  ctx.font = '700 3.2px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d8b8ff';
  ctx.fillText(L(lang, 'УФ-ОБЕЗЗАРАЖИВАНИЕ', 'UV STERILIZER'), x + 24, y - 53);
}

function manifold(ctx: Ctx, x: number, y: number, w: number) {
  pipeH(ctx, x, x + w, y, 3.2, '#3f7fc9');
  pipeH(ctx, x, x + w, y + 14, 3.2, '#6b7a82');
  for (let i = 0; i < 4; i++) {
    const px = x + 12 + i * 32;
    pipeV(ctx, px, y, y + 14, 2, '#6b7a82');
    valveWheel(ctx, px, y + 7, 3.4, i * 0.6, i % 2 ? '#3f7fc9' : '#d6453c');
  }
  pipeV(ctx, x + w, WALL_TOP + 6, y + 14, 3.2, '#3f7fc9');
  ctx.font = '700 3px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8f4f8';
  ctx.fillText('H₂O →', x + 2, y - 5);
}

function flowMeter(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 8, 20, y + 1, 0.4);
  pipeV(ctx, x + 8, 52, y - 18, 2, '#6b7a82');
  panel(ctx, x, y - 18, 16, 18, '#4a5a64', 1.2);
  fillRR(ctx, x + 5, y - 16, 6, 12, 2, '#0f2b36');
  gauge(ctx, x + 8, y - 24, 3.4, 0.5);
}

function drainGrate(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#1a2024';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 5, 12, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a5561';
  ctx.lineWidth = 0.6;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10 + i * 3, y + 3);
    ctx.lineTo(x + 10 + i * 3, y + 7);
    ctx.stroke();
  }
}

function tapStation(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 18, 40, y + 1, 0.45);
  panel(ctx, x, y - 34, 36, 34, '#dfe6e8', 1.8);
  ctx.fillStyle = '#2f7fb8';
  ctx.fillRect(x, y - 28, 36, 5);
  ctx.font = '700 3.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(L(lang, 'ПИТЬЕВАЯ', 'DRINKING'), x + 18, y - 25);
  for (let i = 0; i < 2; i++) {
    const tx = x + 10 + i * 16;
    fillRR(ctx, tx - 2, y - 20, 4, 3, 1, '#9aa7b0');
    ctx.fillRect(tx - 0.6, y - 17, 1.2, 2);
    fillRR(ctx, tx - 3, y - 9, 6, 7, 0.6, rgba('#dff3ff', 0.5));
  }
  // water bottle on top (cooler)
  fillRR(ctx, x + 12, y - 52, 12, 16, 4, rgba('#8fd8ff', 0.6));
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.fillRect(x + 14, y - 50, 1.2, 12);
}

export function purifierDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 3; i++) {
        const cx = mx + 20 + i * 62;
        const x0 = cx + 11;
        const y0 = WALL_TOP + 22;
        const h = B - WALL_TOP - 38;
        ctx.save();
        rrect(ctx, x0, y0, 10, h, 4);
        ctx.clip();
        ctx.fillStyle = vgrad(ctx, y0, y0 + h, [
          [0, '#8fe8ff'],
          [1, '#1c7fa6'],
        ]);
        ctx.fillRect(x0, y0 + 4 + Math.sin(t + i) * 1, 10, h);
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
        ctx.save();
        ctx.translate(mx + 54 + i * 62 + 11, B - 11);
        ctx.rotate(active ? t * 8 : 0);
        ctx.fillStyle = '#8fb3c2';
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-0.7, -4, 1.4, 4);
        }
        ctx.restore();
      }
    } else if (v === 1) {
      // swirling water in the porthole
      const cx = mx + 60;
      const cy = B - 38;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 15.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = rgrad(ctx, cx, cy, 2, 16, [
        [0, '#8fe8ff'],
        [1, '#155a7a'],
      ]);
      ctx.fillRect(cx - 16, cy - 16, 32, 32);
      ctx.strokeStyle = rgba('#dff8ff', 0.45);
      ctx.lineWidth = 0.8;
      const rot = active ? t * 1.6 : 0.3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + i * 3.6, rot + i, rot + i + 2.2);
        ctx.stroke();
      }
      ctx.fillStyle = rgba('#ffffff', 0.2);
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 8, 5, 2.4, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // UV lamps
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const k = active ? 0.8 + 0.2 * Math.sin(t * 17) : 0.15;
      glow(ctx, mx + 134, B - 37, 30, '#b58cff', 0.3 * k);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rgba('#e8d8ff', 0.6 * k);
        ctx.fillRect(mx + 118 + i * 9, B - 48, 3, 22);
      }
      ctx.restore();
    } else {
      // flow meter floats
      for (let i = 0; i < 3; i++) {
        const fx = mx + 36 + i * 40;
        const fy = B - 6 - (active ? 5 + 3 * Math.sin(t * 1.4 + i) : 1);
        ctx.fillStyle = vgrad(ctx, B - 16, B - 4, [
          [0, '#5fc8ff'],
          [1, '#1c7fa6'],
        ]);
        ctx.fillRect(fx + 5, B - 16, 6, 12);
        ctx.fillStyle = '#e84a3c';
        ctx.fillRect(fx + 5.4, fy, 5.2, 1.4);
      }
      // drips into the drain
      const ph = (t * 1.3) % 1;
      ctx.fillStyle = rgba('#8fdcff', 0.8 * (1 - ph));
      ctx.fillRect(mx + 162, B - 17 + ph * 8, 0.7, 1.4);
    }
  }
}

// ================================================================== PROJECT DAWN
export function dawnStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    for (const px of [mx + 16, mx + 186]) {
      box(ctx, px, WALL_TOP, 10, B - WALL_TOP, '#26304a', 1);
    }
    if (v === 0) {
      propShadow(ctx, mx + 105, 80, B + 1, 0.5);
      box(ctx, mx + 70, B - 10, 70, 10, '#2a3345', 2);
      box(ctx, mx + 80, B - 18, 50, 8, '#323d52', 2);
      for (const cx of [mx + 34, mx + 152]) {
        consolePanel(ctx, cx, B - 18, 24, 18, '#2a3345');
        screenRect(ctx, cx + 2, B - 44, 20, 14, '#0b1f33', '#1c2433');
      }
      ctx.font = '800 4.4px Unbounded, Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba('#ffe27a', 0.8);
      ctx.fillText(L(lang, 'ПРОЕКТ «РАССВЕТ»', 'PROJECT DAWN'), mx + 105, 28);
    } else if (v === 1) {
      for (let i = 0; i < 4; i++) cryoPod(ctx, mx + 34 + i * 36, B, i);
    } else {
      atmoProcessor(ctx, mx + 105, B);
      for (const cx of [mx + 36, mx + 158]) {
        panel(ctx, cx, B - 30, 18, 30, '#2a3345', 1.4);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = rgba('#ffe27a', 0.3);
          ctx.fillRect(cx + 3, B - 26 + i * 5, 12, 1.4);
        }
      }
    }
  }
}

function cryoPod(ctx: Ctx, x: number, y: number, i: number) {
  propShadow(ctx, x + 12, 30, y + 1, 0.45);
  box(ctx, x, y - 8, 24, 8, '#2a3345', 1.4);
  fillRR(ctx, x + 2, y - 66, 20, 58, 9, hgrad(ctx, x + 2, x + 22, [
    [0, '#1c2433'],
    [0.5, '#3a4a66'],
    [1, '#1c2433'],
  ]));
  fillRR(ctx, x + 5, y - 60, 14, 46, 6, '#0b1a2a');
  box(ctx, x + 4, y - 72, 16, 6, '#323d52', 2);
  // plant sample inside
  const plantsC = ['#6fbf5a', '#e8a8c8', '#c9a24a', '#5fb8e8'];
  ctx.strokeStyle = '#4f9b4a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 20);
  ctx.quadraticCurveTo(x + 10, y - 30, x + 12, y - 40);
  ctx.stroke();
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(x + 12 + (k % 2 ? 2.4 : -2.4), y - 24 - k * 4.4, 2.4, 1.1, k % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#5fae52';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x + 12, y - 42, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = plantsC[i % 4];
  ctx.fill();
  fillRR(ctx, x + 7, y - 20, 10, 4, 1, '#6b4a32');
  ctx.fillStyle = rgba('#ffe27a', 0.8);
  ctx.font = '700 2.6px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ОБР-${i + 1}`, x + 12, y - 3.6);
}

function atmoProcessor(ctx: Ctx, cx: number, y: number) {
  propShadow(ctx, cx, 90, y + 1, 0.55);
  box(ctx, cx - 40, y - 12, 80, 12, '#2a3345', 2);
  // housing ring
  const cy = y - 44;
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, cx - 8, cy - 8, 4, 34, [
    [0, '#4a5a7a'],
    [1, '#1c2433'],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#c9a24a';
  ctx.beginPath();
  ctx.arc(cx, cy, 29, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rivet(ctx, cx + Math.cos(a) * 30.5, cy + Math.sin(a) * 30.5, 0.8, '#e8c872');
  }
}

export function dawnDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    const p = active ? 1 : 0.25;
    // pillar light strips
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const px of [mx + 16, mx + 186]) {
      const k = (t * 0.4 + px * 0.01) % 1;
      ctx.fillStyle = rgba('#ffe27a', 0.45 * p);
      ctx.fillRect(px + 4.3, WALL_TOP + 4, 1.4, B - WALL_TOP - 8);
      glow(ctx, px + 5, WALL_TOP + 4 + k * (B - WALL_TOP - 8), 8, '#fff6c8', 0.6 * p);
    }
    ctx.restore();
    if (v === 0) {
      const cx = mx + 105;
      const cy = B - 46;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, cy, 50, '#ffcf4a', 0.28 * p);
      ctx.restore();
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
      for (const scx of [mx + 36, mx + 154]) {
        ctx.strokeStyle = rgba('#ffe27a', 0.7 * p);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const yy = B - 37 + Math.sin(t * 3 + i * 0.5 + scx) * 3 * p;
          if (i === 0) ctx.moveTo(scx + i, yy);
          else ctx.lineTo(scx + i, yy);
        }
        ctx.stroke();
      }
    } else if (v === 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const x = mx + 34 + i * 36;
        const k = 0.6 + 0.4 * Math.sin(t * 1.5 + i);
        ctx.fillStyle = rgba('#8fe8ff', 0.18 * p * k);
        rrect(ctx, x + 5, B - 60, 14, 46, 6);
        ctx.fill();
        glow(ctx, x + 12, B - 40, 20, '#8fe8ff', 0.18 * p * k);
        // frost particles
        for (let s = 0; s < 3; s++) {
          const ph = (t * 0.3 + s / 3 + i * 0.2) % 1;
          ctx.fillStyle = rgba('#ffffff', 0.6 * (1 - ph) * p);
          ctx.fillRect(x + 7 + ((s * 5) % 10), B - 16 - ph * 40, 0.7, 0.7);
        }
      }
      ctx.restore();
    } else {
      const cx = mx + 105;
      const cy = B - 44;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(active ? t * 3 : 0.2);
      for (let i = 0; i < 7; i++) {
        ctx.rotate((Math.PI * 2) / 7);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(8, -6, 4, -24);
        ctx.quadraticCurveTo(-2, -12, 0, 0);
        ctx.fillStyle = '#8a9ab8';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c872';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, cy, 36, '#ffe27a', 0.18 * p);
      // air currents leaving the processor
      if (active) {
        ctx.strokeStyle = rgba('#dff8ff', 0.35);
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.5 + i / 3) % 1;
          ctx.beginPath();
          ctx.arc(cx, cy, 32 + ph * 20, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.globalAlpha = 1 - ph;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }
}

export { steelTable, crt, knob, shelfUnit, plant, shade };
