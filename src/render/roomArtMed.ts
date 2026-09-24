/* Room interiors v2: medbay, lab, office, radio studio, soda plant. Three module variants each. */
import { box, cylinder, fillRR, gauge, glow, hazard, hgrad, pipeH, pipeV, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { bx0, bx1, propShadow } from './roomBase';
import { buttonsRow, flask, plant, poster, posterText, shelfUnit, sofa, stool, wallClock } from './props';
import { knob, neonGlow, neonSign, panel, rug, wallVent } from './furniture';
import {
  bottleCrate, bottleRow, chain, chalkboard, chalkText, crt, filingCabinet, flagPole, gasCylinder, glassCabinet, glassTank, globe, L, officeChair, pendantLamp, portrait, recordShelf, reelSpokes, roundFlask, speaker, steelTable,
  woodDesk,
} from './kit2';
import { WALL_BOTTOM, WALL_TOP } from './world';

const B = WALL_BOTTOM + 1.5;
const M = 210;
const variant = (m: number, size: number) => (size === 1 ? 0 : m % 3);

// ================================================================== MEDBAY
export function medbayStatic(ctx: Ctx, w: number, size: number, level: number) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // ward: curtain, bed, monitor, IV, medicine cabinet
      privacyCurtain(ctx, mx + 18, mx + 44, '#7cc6b1');
      hospitalBed(ctx, mx + 36, B, 62, level);
      heartMonitor(ctx, mx + 102, 38);
      ivStand(ctx, mx + 110, B);
      glassCabinet(ctx, mx + 146, B, 40, 50, '#e8eeec', 3, (sy, x0, x1, i) => {
        if (i === 0) bottleRow(ctx, x0, x1, sy, ['#c7433b', '#f4efe0', '#e0b44a'], 5, 1);
        else if (i === 1) medBoxes(ctx, x0, x1, sy);
        else bottleRow(ctx, x0, x1, sy, ['#8fd3c0', '#f4efe0', '#c7433b', '#6aa3d8'], 4.4, 3);
      });
      redCross(ctx, mx + 166, 31, 5.5);
    } else if (v === 1) {
      // stim synthesis
      stimSynth(ctx, mx + 22, B);
      steelTable(ctx, mx + 98, B, 52, 18, '#dfe6e8');
      syringeTray(ctx, mx + 102, B - 19);
      testTubeRack(ctx, mx + 124, B - 19, ['#c7433b', '#e0b44a', '#c7433b', '#6aa3d8', '#c7433b']);
      medFridge(ctx, mx + 160, B, level);
      poster(ctx, mx + 106, 30, 26, 30, '#f4f1e8', (x, y, pw, ph) => {
        ctx.fillStyle = '#e8b390';
        ctx.beginPath();
        ctx.ellipse(x + pw / 2, y + 12, 5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5fb8e8';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(x + 6 + i * 3.6, y + 5 + (i % 2) * 2, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        posterText(ctx, 'МОЙ РУКИ!', x + pw / 2, y + ph - 6, 4.2, '#c7433b');
      });
    } else {
      // doctor's office
      woodDesk(ctx, mx + 22, B, 58, 16, '#9a7a58', 'l');
      crt(ctx, mx + 50, B - 18, 1, '#6aff8c', '#e3dccb');
      papers(ctx, mx + 30, B - 18);
      officeChair(ctx, mx + 62, B, '#3f6f8a', false);
      xrayBox(ctx, mx + 88, 30, 38, 26);
      eyeChart(ctx, mx + 134, 28, 18, 30);
      skeleton(ctx, mx + 176, B);
      plant(ctx, mx + 150, B, 1.1);
    }
  }
}

export function medbayDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // ECG trace
      const x0 = mx + 104;
      const y0 = 45;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0 - 6, 20, 11);
      ctx.clip();
      ctx.strokeStyle = '#6aff8c';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      const sp = active ? 1 : 0.35;
      for (let i = 0; i <= 40; i++) {
        const x = x0 + i * 0.5;
        const ph = (i * 0.5 + t * 14 * sp) % 20;
        let yy = 0;
        if (ph > 8 && ph < 9) yy = -5;
        else if (ph > 9 && ph < 10) yy = 3;
        else if (ph > 12 && ph < 14) yy = -1.2;
        if (i === 0) ctx.moveTo(x, y0 + yy);
        else ctx.lineTo(x, y0 + yy);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, x0 + 10, y0, 14, '#6aff8c', 0.12);
      ctx.restore();
      // IV drip
      const dp = (t * 1.3) % 1;
      ctx.fillStyle = rgba('#ffd86a', 0.9 * (1 - dp));
      ctx.beginPath();
      ctx.arc(mx + 113.5, B - 44 + dp * 5, 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (v === 1) {
      // synth tank bubbles and level
      const tx = mx + 30;
      for (let i = 0; i < 6; i++) {
        const p = (t * (active ? 0.7 : 0.15) + i / 6) % 1;
        ctx.beginPath();
        ctx.arc(tx + 4 + ((i * 7) % 14), B - 34 - p * 26, 0.6 + (i % 3) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = rgba('#ffd0d0', 0.7 * (1 - p));
        ctx.fill();
      }
      if (active) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, tx + 11, B - 46, 22, '#ff4a5a', 0.14 + 0.06 * Math.sin(t * 3));
        ctx.restore();
      }
      // dispenser head moving along the rack
      const hx = mx + 62 + ((Math.sin(t * (active ? 1.6 : 0.2)) + 1) / 2) * 18;
      fillRR(ctx, hx - 2, B - 50, 4, 7, 1, '#9aa7b0');
      ctx.fillStyle = '#c7433b';
      ctx.fillRect(hx - 0.4, B - 43, 0.8, 2 + (active ? Math.abs(Math.sin(t * 5)) * 2 : 0));
      // fridge lamp
      ctx.fillStyle = active ? '#6aff8c' : '#2a4a32';
      ctx.fillRect(mx + 183, B - 54, 2, 1.2);
    } else {
      // x-ray flicker + terminal cursor
      const f = active ? 0.85 + 0.15 * Math.sin(t * 23) * (Math.sin(t * 0.7) > 0.95 ? 1 : 0.1) : 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 107, 43, 26, '#cfe8ff', 0.12 * f);
      ctx.restore();
      if (Math.sin(t * 5) > 0) {
        ctx.fillStyle = '#6aff8c';
        ctx.fillRect(mx + 54, B - 25.5, 2, 0.8);
      }
    }
  }
}

function privacyCurtain(ctx: Ctx, x0: number, x1: number, c: string) {
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x0 - 2, 27, x1 - x0 + 30, 1.2);
  const n = Math.floor((x1 - x0) / 4);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 4;
    ctx.fillStyle = hgrad(ctx, x, x + 4, [
      [0, shade(c, -0.18)],
      [0.5, shade(c, 0.15)],
      [1, shade(c, -0.2)],
    ]);
    ctx.fillRect(x, 28.2, 4.2, B - 40);
    ctx.fillStyle = '#c9d2d9';
    ctx.beginPath();
    ctx.arc(x + 2, 27.6, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = rgba('#000', 0.15);
  ctx.fillRect(x0, B - 16, x1 - x0, 3);
}

function hospitalBed(ctx: Ctx, x: number, y: number, w: number, level: number) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.45);
  const metal = '#c9d2d9';
  // wheels & legs
  for (const lx of [x + 4, x + w - 6]) {
    ctx.fillStyle = shade(metal, -0.3);
    ctx.fillRect(lx, y - 12, 1.6, 10);
    ctx.beginPath();
    ctx.arc(lx + 0.8, y - 1.4, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2d31';
    ctx.fill();
  }
  // head rail
  ctx.strokeStyle = metal;
  ctx.lineWidth = 1.4;
  rrect(ctx, x, y - 30, 9, 18, 2.5);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 3, y - 29);
    ctx.lineTo(x + i * 3, y - 13);
    ctx.stroke();
  }
  // foot rail
  ctx.lineWidth = 1.4;
  rrect(ctx, x + w - 8, y - 24, 8, 12, 2);
  ctx.stroke();
  // frame
  box(ctx, x + 2, y - 14, w - 4, 3, shade(metal, -0.1), 0.8);
  // mattress with raised back
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 14);
  ctx.lineTo(x + 7, y - 22);
  ctx.quadraticCurveTo(x + 8, y - 25, x + 13, y - 22);
  ctx.lineTo(x + 20, y - 18);
  ctx.lineTo(x + w - 7, y - 18);
  ctx.lineTo(x + w - 7, y - 14);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 25, y - 14, [
    [0, '#ffffff'],
    [1, '#cfd8dc'],
  ]);
  ctx.fill();
  ctx.strokeStyle = rgba('#5a6a70', 0.6);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // pillow
  fillRR(ctx, x + 7.5, y - 27, 7, 6, 2.4, '#f4f8fa');
  // blanket
  const bl = level >= 3 ? '#5fae98' : '#7cc6b1';
  rrect(ctx, x + 19, y - 19.5, w - 27, 7, [2, 2, 1, 1]);
  ctx.fillStyle = vgrad(ctx, y - 19.5, y - 12.5, [
    [0, shade(bl, 0.2)],
    [1, shade(bl, -0.25)],
  ]);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.fillRect(x + 19, y - 19.5, 5, 7);
  // chart clipboard
  fillRR(ctx, x + w - 6.5, y - 22, 5, 7, 0.6, '#8a6a4a');
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(x + w - 6, y - 21, 4, 5.6);
}

function heartMonitor(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 10, y - 10, 2, 10);
  ctx.fillRect(x + 4, y - 11, 14, 1.6);
  panel(ctx, x, y, 24, 17, '#d9dee2', 1.8);
  fillRR(ctx, x + 1.6, y + 1.5, 20.8, 11.5, 1, '#0b1a12');
  buttonsRow(ctx, x + 4, y + 15, 5, ['#6aff8c', '#f2c230', '#e84a3c']);
}

function ivStand(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 2, 12, y + 1, 0.3);
  ctx.fillStyle = '#b9c3cc';
  ctx.fillRect(x + 1.4, y - 60, 1.2, 60);
  ctx.fillRect(x - 3, y - 1.2, 10, 1.2);
  ctx.fillRect(x - 2, y - 60, 8, 1);
  // bag
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 58);
  ctx.quadraticCurveTo(x + 8.5, y - 57, x + 7.5, y - 49);
  ctx.quadraticCurveTo(x + 7, y - 45, x + 3.5, y - 45);
  ctx.quadraticCurveTo(x - 0.5, y - 46, x + 0.2, y - 52);
  ctx.closePath();
  ctx.fillStyle = rgba('#fff4c2', 0.55);
  ctx.fill();
  ctx.fillStyle = rgba('#ffd86a', 0.6);
  ctx.fillRect(x + 1, y - 51, 6, 5);
  ctx.strokeStyle = rgba('#ffffff', 0.6);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.strokeStyle = rgba('#e8eef0', 0.7);
  ctx.beginPath();
  ctx.moveTo(x + 3.5, y - 45);
  ctx.bezierCurveTo(x + 4, y - 30, x - 10, y - 30, x - 18, y - 22);
  ctx.stroke();
}

function medBoxes(ctx: Ctx, x0: number, x1: number, y: number) {
  let x = x0 + 0.5;
  let i = 0;
  while (x < x1 - 5) {
    const bw = 5 + (i % 2);
    const bh = 4 + (i % 3);
    box(ctx, x, y - bh, bw, bh, i % 2 ? '#f4efe0' : '#e8eef0', 0.3);
    ctx.fillStyle = '#c7433b';
    ctx.fillRect(x + bw / 2 - 0.4, y - bh + 1, 0.8, 2.2);
    ctx.fillRect(x + bw / 2 - 1.1, y - bh + 1.7, 2.2, 0.8);
    x += bw + 0.6;
    i++;
  }
}

function redCross(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f4f0';
  ctx.fill();
  ctx.strokeStyle = '#c9d2d9';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = '#d63a3a';
  ctx.fillRect(cx - r * 0.3, cy - r * 0.9, r * 0.6, r * 1.8);
  ctx.fillRect(cx - r * 0.9, cy - r * 0.3, r * 1.8, r * 0.6);
}

function stimSynth(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 32, 76, y + 1, 0.5);
  // base cabinet
  panel(ctx, x, y - 30, 66, 30, '#dfe6e8', 1.8);
  ctx.fillStyle = rgba('#000', 0.18);
  ctx.fillRect(x + 3, y - 22, 60, 0.6);
  for (let i = 0; i < 3; i++) knob(ctx, x + 46 + i * 5, y - 25, 1.2, ['#e84a3c', '#f2c230', '#4fc36b'][i]);
  gaugeRow(ctx, x + 6, y - 14, 3);
  hazard(ctx, x + 2, y - 4, 62, 2.2, '#d63a3a', '#f4f4f0', 3);
  // glass reactor tank
  glassTank(ctx, x + 8, y - 30, 22, 38, '#e0404e', 0.62, '#b9c3cc');
  // pipe to dispenser
  pipeV(ctx, x + 19, y - 76, y - 68, 1.4, '#9aa7b0');
  pipeH(ctx, x + 19, x + 70, y - 76, 1.4, '#9aa7b0');
  // syringe rack
  panel(ctx, x + 36, y - 44, 30, 14, '#c9d2d9', 1);
  for (let i = 0; i < 6; i++) syringe(ctx, x + 39 + i * 4.6, y - 32, i % 3 !== 2);
  fillRR(ctx, x + 36, y - 56, 30, 3, 1, '#6d7883');
}

function syringe(ctx: Ctx, x: number, y: number, full: boolean) {
  fillRR(ctx, x - 1.1, y - 9, 2.2, 7, 0.6, rgba('#f4f8fa', 0.85));
  if (full) {
    ctx.fillStyle = '#e0404e';
    ctx.fillRect(x - 0.8, y - 6.4, 1.6, 4.2);
  }
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x - 0.2, y - 2, 0.4, 2.2);
  ctx.fillRect(x - 1.4, y - 10, 2.8, 1);
}

function gaugeRow(ctx: Ctx, x: number, y: number, n: number) {
  for (let i = 0; i < n; i++) gauge(ctx, x + i * 8 + 3, y, 2.8, 0.2 + i * 0.25);
}

function syringeTray(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y - 2, 18, 2, 0.6, '#b9c3cc');
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x + 3 + i * 5, y - 2.4);
    ctx.rotate(-Math.PI / 2);
    fillRR(ctx, -0.8, -1, 1.6, 7, 0.4, i === 1 ? '#e0404e' : rgba('#f4f8fa', 0.9));
    ctx.restore();
  }
}

function testTubeRack(ctx: Ctx, x: number, y: number, cols: string[]) {
  box(ctx, x, y - 4, cols.length * 3.6 + 2, 4, '#7a5236', 0.5);
  cols.forEach((c, i) => {
    const tx = x + 1.6 + i * 3.6;
    fillRR(ctx, tx, y - 11, 2.2, 9, 1, rgba('#eaf6f8', 0.5));
    fillRR(ctx, tx, y - 6.5 - (i % 3), 2.2, 4.5 + (i % 3), 1, c);
  });
}

function medFridge(ctx: Ctx, x: number, y: number, level: number) {
  propShadow(ctx, x + 14, 32, y + 1, 0.45);
  panel(ctx, x, y - 58, 28, 58, '#eef2f2', 2);
  fillRR(ctx, x + 2.5, y - 55, 23, 38, 1, '#10222a');
  ctx.save();
  rrect(ctx, x + 2.5, y - 55, 23, 38, 1);
  ctx.clip();
  ctx.fillStyle = rgrad(ctx, x + 14, y - 40, 0, 26, [
    [0, rgba('#bff0ff', 0.4)],
    [1, rgba('#bff0ff', 0.08)],
  ]);
  ctx.fillRect(x + 2.5, y - 55, 23, 38);
  for (let r = 0; r < 3; r++) {
    const sy = y - 44 + r * 11;
    ctx.fillStyle = rgba('#dff3ff', 0.4);
    ctx.fillRect(x + 2.5, sy, 23, 0.8);
    bottleRow(ctx, x + 3.5, x + 24.5, sy, r === 1 ? ['#5fb8e8', '#8fd3c0'] : ['#e0404e', '#f4efe0', '#5fb8e8'], 5, r * 2 + level);
  }
  ctx.restore();
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x + 23, y - 46, 1.4, 18);
  ctx.font = '700 3.6px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2f6fa5';
  ctx.fillText('ВАКЦИНЫ', x + 14, y - 11);
  ctx.fillStyle = rgba('#000', 0.15);
  ctx.fillRect(x + 3, y - 15, 22, 0.6);
}

function papers(ctx: Ctx, x: number, y: number) {
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x + i * 2, y - 0.6 - i * 0.5);
    ctx.rotate(-0.05 + i * 0.06);
    ctx.fillStyle = i === 2 ? '#f4efe0' : '#e8e2d4';
    ctx.fillRect(0, -1, 10, 1.4);
    ctx.restore();
  }
  // stethoscope
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 13, y - 1);
  ctx.bezierCurveTo(x + 12, y - 5, x + 18, y - 5, x + 17, y - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 17, y - 1.2, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#c9d2d9';
  ctx.fill();
}

function xrayBox(ctx: Ctx, x: number, y: number, w: number, h: number) {
  panel(ctx, x - 2, y - 2, w + 4, h + 4, '#c9d2d9', 1.4);
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h / 2, 0, w * 0.7, [
    [0, '#dfefff'],
    [1, '#9fb8d0'],
  ]);
  ctx.fillRect(x, y, w, h);
  // two films
  for (let k = 0; k < 2; k++) {
    const fx = x + 1.5 + k * (w / 2);
    const fw = w / 2 - 3;
    ctx.fillStyle = '#1a2230';
    ctx.fillRect(fx, y + 1.5, fw, h - 3);
    ctx.strokeStyle = rgba('#e8f4ff', 0.85);
    ctx.lineWidth = 0.6;
    const cx = fx + fw / 2;
    if (k === 0) {
      // ribcage
      ctx.beginPath();
      ctx.moveTo(cx, y + 3);
      ctx.lineTo(cx, y + h - 4);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const ry = y + 5 + i * 3.2;
        ctx.beginPath();
        ctx.ellipse(cx, ry + 1.5, fw * 0.36 - i * 0.2, 2, 0, Math.PI, 0);
        ctx.stroke();
      }
    } else {
      // gag: a swallowed wrench inside the stomach
      ctx.beginPath();
      ctx.ellipse(cx, y + h * 0.55, fw * 0.3, h * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba('#ffffff', 0.95);
      ctx.save();
      ctx.translate(cx, y + h * 0.55);
      ctx.rotate(0.6);
      ctx.fillRect(-0.6, -4, 1.2, 7);
      ctx.beginPath();
      ctx.arc(0, -4.4, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a2230';
      ctx.fillRect(-0.5, -6.4, 1, 2.2);
      ctx.restore();
      ctx.fillStyle = '#ff6a5a';
      ctx.font = '700 4px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?!', cx + fw * 0.3, y + 5);
    }
  }
}

function eyeChart(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = rgba('#000', 0.2);
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = '#f7f5ee';
  ctx.fillRect(x, y, w, h);
  const rows = ['ШБ', 'МНК', 'ЫМБШ', 'БЫНКМ', 'ИНШМК'];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1a1a1a';
  rows.forEach((r, i) => {
    const s = 6 - i * 1.05;
    ctx.font = `700 ${s}px Oswald, sans-serif`;
    ctx.fillText(r.split('').join(' '), x + w / 2, y + 4.5 + i * 5.4 + (i > 0 ? 0.8 : 0));
  });
}

function skeleton(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x, 14, y + 1, 0.3);
  // stand
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x - 0.6, y - 52, 1.2, 52);
  fillRR(ctx, x - 6, y - 1.4, 12, 1.4, 0.6, '#3a3f45');
  const bone = '#f1ead7';
  ctx.strokeStyle = bone;
  ctx.lineCap = 'round';
  // skull
  ctx.beginPath();
  ctx.ellipse(x, y - 52, 4.2, 4.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = bone;
  ctx.fill();
  ctx.fillStyle = '#2a2622';
  ctx.beginPath();
  ctx.arc(x - 1.6, y - 52.5, 1.1, 0, Math.PI * 2);
  ctx.arc(x + 1.6, y - 52.5, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 1.4, y - 49.2, 2.8, 0.6);
  // gag: vault cap on the skull
  ctx.fillStyle = '#2f6fb8';
  ctx.beginPath();
  ctx.ellipse(x, y - 55.5, 4.4, 2.4, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x, y - 55.8, 6, 1);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x - 0.5, y - 57.4, 1, 1);
  // spine & ribs
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x, y - 47);
  ctx.lineTo(x, y - 28);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y - 43 + i * 3, 5 - i * 0.4, 1.6, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }
  // pelvis
  ctx.beginPath();
  ctx.ellipse(x, y - 27, 4, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  // arms: one waving
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 45);
  ctx.lineTo(x - 7, y - 36);
  ctx.lineTo(x - 7.5, y - 28);
  ctx.moveTo(x + 5, y - 45);
  ctx.lineTo(x + 9, y - 51);
  ctx.lineTo(x + 11, y - 58);
  // legs
  ctx.moveTo(x - 2.4, y - 26);
  ctx.lineTo(x - 3, y - 14);
  ctx.lineTo(x - 3, y - 3);
  ctx.moveTo(x + 2.4, y - 26);
  ctx.lineTo(x + 3, y - 14);
  ctx.lineTo(x + 3, y - 3);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

// ================================================================== LAB
export function labStatic(ctx: Ctx, w: number, size: number, level: number) {
  pipeH(ctx, bx0(), bx1(w), WALL_TOP + 3, 1.6, '#4a5a70');
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      fumeHood(ctx, mx + 18, B);
      steelTable(ctx, mx + 78, B, 70, 19, '#2a2f38', '#4a5563');
      flask(ctx, mx + 86, B - 20, 1.2, '#b58cff', 0.5);
      flask(ctx, mx + 97, B - 20, 0.9, '#6aff8c', 0.6);
      roundFlask(ctx, mx + 112, B - 25, 4, '#ff9a3a', 0.55);
      bunsen(ctx, mx + 112, B - 20);
      testTubeRack(ctx, mx + 124, B - 20, ['#b58cff', '#6aff8c', '#ff9a3a', '#5fb8e8']);
      microscope(ctx, mx + 142, B - 20);
      chalkboard(ctx, mx + 84, 28, 58, 24, (x, y) => {
        chalkText(ctx, 'E = mc²', x + 4, y + 5, 4.4);
        chalkText(ctx, 'H₂O + ☢ → ?', x + 4, y + 11, 3.8);
        chalkText(ctx, '∫ f(x)dx ≈ 42', x + 4, y + 17, 3.6);
        ctx.strokeStyle = rgba('#f4f4ec', 0.8);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(x + 47, y + 11, 6, 0, Math.PI * 2);
        ctx.ellipse(x + 47, y + 11, 6, 2.2, 0.5, 0, Math.PI * 2);
        ctx.ellipse(x + 47, y + 11, 6, 2.2, -0.5, 0, Math.PI * 2);
        ctx.stroke();
      });
      specimenShelf(ctx, mx + 156, B, level);
    } else if (v === 1) {
      // distillation of antirad
      ringStand(ctx, mx + 30, B, 30);
      roundFlask(ctx, mx + 30, B - 36, 8, '#ff9a3a', 0.5);
      distillColumn(ctx, mx + 62, B);
      ringStand(ctx, mx + 104, B, 22);
      roundFlask(ctx, mx + 104, B - 28, 7, '#ffcf4a', 0.35);
      glassTube(ctx, [
        [mx + 30, B - 45],
        [mx + 30, B - 62],
        [mx + 58, B - 62],
      ]);
      glassTube(ctx, [
        [mx + 76, B - 58],
        [mx + 104, B - 58],
        [mx + 104, B - 36],
      ]);
      teslaCoil(ctx, mx + 146, B);
      mouseWheel(ctx, mx + 172, B);
    } else {
      mainframe(ctx, mx + 18, B, level);
      mainframe(ctx, mx + 46, B, level + 1);
      woodDesk(ctx, mx + 96, B, 50, 16, '#5a6470', 'r');
      crt(ctx, mx + 104, B - 18, 1.15, '#6aff8c', '#c9c3b3');
      printer(ctx, mx + 126, B - 18);
      periodicTable(ctx, mx + 156, 30, 34, 22);
      officeChair(ctx, mx + 116, B, '#3a3f45', false);
    }
  }
}

export function labDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // bunsen flame
      const fl = active ? 1 : 0.4;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#5fb8ff', 0.7 * fl);
      ctx.beginPath();
      ctx.ellipse(mx + 112, B - 30 - Math.sin(t * 20) * 0.3, 1.1, 2.6 + Math.sin(t * 17) * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      glow(ctx, mx + 112, B - 30, 8, '#5fb8ff', 0.25 * fl);
      // fume hood inner glow
      glow(ctx, mx + 44, B - 40, 22, '#b58cff', active ? 0.14 + 0.05 * Math.sin(t * 2) : 0.05);
      ctx.restore();
      // bubbles in flasks
      if (active) bubbles(ctx, mx + 86, B - 24, 3, t, '#e8d8ff');
      if (active) bubbles(ctx, mx + 112, B - 27, 4, t + 1, '#ffe2c0');
    } else if (v === 1) {
      if (active) {
        bubbles(ctx, mx + 30, B - 36, 6, t, '#ffe2c0');
        // drips
        const p = (t * 1.2) % 1;
        ctx.fillStyle = rgba('#ffcf4a', 0.9 * (1 - p));
        ctx.beginPath();
        ctx.arc(mx + 104, B - 44 + p * 8, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, mx + 69, B - 42, 20, '#ff9a3a', 0.14 + 0.06 * Math.sin(t * 3));
        // tesla arcs
        const tx = mx + 146;
        const ty = B - 64;
        if (Math.sin(t * 7.3) > 0.1) {
          ctx.strokeStyle = rgba('#d8c8ff', 0.9);
          ctx.lineWidth = 0.6;
          for (let k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            let ax = tx;
            let ay = ty;
            const dir = (k === 0 ? -1 : 1) * (0.6 + Math.random() * 0.8);
            for (let s = 0; s < 6; s++) {
              ax += dir * 2.6 + (Math.random() - 0.5) * 2;
              ay += (Math.random() - 0.5) * 3.6;
              ctx.lineTo(ax, ay);
            }
            ctx.stroke();
          }
          glow(ctx, tx, ty, 12, '#b58cff', 0.4);
        }
        ctx.restore();
      }
      // mouse wheel spin + bulb
      const rot = active ? t * 6 : 0;
      ctx.save();
      ctx.translate(mx + 178, B - 13);
      ctx.rotate(rot);
      ctx.strokeStyle = '#9aa7b0';
      ctx.lineWidth = 0.4;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
      }
      ctx.restore();
      mouse(ctx, mx + 178, B - 7, active ? Math.sin(t * 24) : 0);
      const lit = active && Math.sin(t * 9) > -0.6;
      ctx.beginPath();
      ctx.arc(mx + 190, B - 30, 2, 0, Math.PI * 2);
      ctx.fillStyle = lit ? '#fff2a8' : '#8a8468';
      ctx.fill();
      if (lit) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, mx + 190, B - 30, 10, '#ffe27a', 0.45);
        ctx.restore();
      }
    } else {
      // tape reels & blinkenlights
      for (const [k, fx] of [mx + 18, mx + 46].entries()) {
        for (const [j, rx] of [fx + 6.5, fx + 17.5].entries()) reelSpokes(ctx, rx, B - 52, 4.6, active ? t * (2 + k + j * 0.7) * (j ? -1 : 1) : 0);
        for (let i = 0; i < 12; i++) {
          const on = active && Math.sin(t * (3 + (i % 5)) + i * 1.7 + k) > 0.2;
          ctx.fillStyle = on ? ['#ff5a4a', '#ffcf4a', '#6aff8c'][i % 3] : '#2a2f35';
          ctx.fillRect(fx + 4 + (i % 6) * 3, B - 38 + Math.floor(i / 6) * 3, 1.6, 1.4);
        }
      }
      // printer paper feeding
      if (active) {
        const p = (t * 0.6) % 1;
        ctx.fillStyle = '#f4f1e8';
        ctx.fillRect(mx + 132, B - 30 - p * 3, 12, 3);
      }
    }
  }
}

function bubbles(ctx: Ctx, x: number, y: number, n: number, t: number, c: string) {
  for (let i = 0; i < n; i++) {
    const p = (t * 0.9 + i / n) % 1;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 2.3 + t * 2) * 1.6, y - p * 6, 0.5 + (i % 2) * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = rgba(c, 0.8 * (1 - p));
    ctx.fill();
  }
}

function fumeHood(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 26, 58, y + 1, 0.5);
  // duct to ceiling
  box(ctx, x + 20, WALL_TOP - 2, 12, 12, '#7a8591', 0.8);
  panel(ctx, x, y - 68, 52, 68, '#c9d2d9', 2);
  // chamber
  fillRR(ctx, x + 3, y - 60, 46, 30, 1, '#1c2230');
  ctx.save();
  rrect(ctx, x + 3, y - 60, 46, 30, 1);
  ctx.clip();
  ctx.fillStyle = rgrad(ctx, x + 26, y - 44, 0, 30, [
    [0, rgba('#b58cff', 0.25)],
    [1, rgba('#000', 0)],
  ]);
  ctx.fillRect(x + 3, y - 60, 46, 30);
  flask(ctx, x + 12, y - 31, 1.1, '#6aff8c', 0.6);
  flask(ctx, x + 38, y - 31, 1.3, '#b58cff', 0.4);
  roundFlask(ctx, x + 25, y - 36, 4.4, '#ff5a8a', 0.5);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 24.4, y - 31, 1.2, 1);
  ctx.restore();
  // sash glass
  ctx.fillStyle = rgba('#dff3ff', 0.16);
  ctx.fillRect(x + 3, y - 60, 46, 17);
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x + 3, y - 44, 46, 1.6);
  ctx.strokeStyle = rgba('#ffffff', 0.4);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 44);
  ctx.lineTo(x + 18, y - 60);
  ctx.stroke();
  // base cabinet
  ctx.strokeStyle = rgba('#3a4550', 0.5);
  ctx.strokeRect(x + 3, y - 26, 22, 22);
  ctx.strokeRect(x + 27, y - 26, 22, 22);
  knob(ctx, x + 22, y - 15);
  knob(ctx, x + 30, y - 15);
  ctx.font = '700 3.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a4550';
  ctx.fillText('ВЫТЯЖКА', x + 26, y - 64);
}

function bunsen(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 2.6, y - 1.2, 5.2, 1.2, 0.5, '#3a3f45');
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x - 0.8, y - 7, 1.6, 6);
}

function microscope(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 4, y - 1.6, 8, 1.6, 0.5, '#2a2f38');
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 1.6);
  ctx.quadraticCurveTo(x + 4.5, y - 7, x + 1, y - 11);
  ctx.lineTo(x - 0.5, y - 10);
  ctx.quadraticCurveTo(x + 2.5, y - 6.5, x + 0.5, y - 1.6);
  ctx.fill();
  ctx.save();
  ctx.translate(x - 1, y - 10);
  ctx.rotate(-0.4);
  fillRR(ctx, -1.2, -6, 2.4, 8, 0.6, '#3a3f45');
  ctx.restore();
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x - 3, y - 5, 5, 0.8);
}

function specimenShelf(ctx: Ctx, x: number, y: number, level: number) {
  shelfUnit(ctx, x, y, 34, 58, '#4a5563', 3);
  const jars = [
    ['#6aff8c', 'eye'],
    ['#b58cff', 'tentacle'],
    ['#ffcf4a', 'none'],
  ] as const;
  for (let r = 0; r < 3; r++) {
    const sy = y - 58 + ((r + 1) * 56) / 3;
    for (let i = 0; i < 3; i++) {
      const [c, what] = jars[(i + r + level) % 3];
      const jx = x + 3 + i * 10;
      fillRR(ctx, jx, sy - 11, 8, 11, 1.6, rgba(c, 0.35));
      ctx.fillStyle = '#6d7883';
      ctx.fillRect(jx - 0.4, sy - 12.2, 8.8, 1.6);
      if (what === 'eye' && r === 1 && i === 1) {
        ctx.beginPath();
        ctx.arc(jx + 4, sy - 5.5, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = '#f4f4f0';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(jx + 4.6, sy - 5.5, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = '#2f6fb8';
        ctx.fill();
      } else if (what === 'tentacle') {
        ctx.strokeStyle = shade(c, -0.3);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(jx + 2, sy - 1);
        ctx.bezierCurveTo(jx + 7, sy - 4, jx + 1, sy - 7, jx + 5, sy - 9);
        ctx.stroke();
      }
      ctx.fillStyle = rgba('#ffffff', 0.35);
      ctx.fillRect(jx + 1, sy - 10, 0.7, 8);
    }
  }
}

function ringStand(ctx: Ctx, x: number, y: number, h: number) {
  fillRR(ctx, x - 7, y - 1.6, 14, 1.6, 0.5, '#3a3f45');
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 5, y - h - 6, 1.2, h + 5);
  ctx.fillRect(x - 1, y - h + 4, 6, 0.9);
}

function distillColumn(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 7, 24, y + 1, 0.4);
  box(ctx, x - 4, y - 8, 22, 8, '#4a5563', 1);
  glassTank(ctx, x, y - 8, 14, 62, '#ff9a3a', 0.55, '#8a95a0');
  // condenser coil
  ctx.strokeStyle = rgba('#dff3ff', 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const yy = y - 64 + i * 6;
    ctx.moveTo(x - 2, yy);
    ctx.bezierCurveTo(x + 4, yy - 2.4, x + 10, yy + 2.4, x + 16, yy);
  }
  ctx.stroke();
  ctx.font = '700 3.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf4a';
  ctx.fillText('АНТИРАД', x + 7, y - 3.6);
}

function glassTube(ctx: Ctx, pts: [number, number][]) {
  ctx.strokeStyle = rgba('#dff3ff', 0.5);
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.5);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.lineJoin = 'miter';
}

function teslaCoil(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x, 26, y + 1, 0.45);
  box(ctx, x - 11, y - 8, 22, 8, '#3a3f45', 1.2);
  hazard(ctx, x - 10, y - 3, 20, 2, '#f2c230', '#26282b', 2.5);
  // coil
  ctx.fillStyle = hgrad(ctx, x - 3.2, x + 3.2, [
    [0, '#7a4a18'],
    [0.4, '#e8a85a'],
    [1, '#5a3410'],
  ]);
  ctx.fillRect(x - 3.2, y - 50, 6.4, 42);
  ctx.strokeStyle = rgba('#3a1e08', 0.6);
  ctx.lineWidth = 0.35;
  for (let yy = y - 49; yy < y - 9; yy += 1.2) {
    ctx.beginPath();
    ctx.moveTo(x - 3.2, yy);
    ctx.lineTo(x + 3.2, yy + 0.5);
    ctx.stroke();
  }
  // torus
  ctx.beginPath();
  ctx.ellipse(x, y - 58, 10, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - 3, y - 60, 0, 12, [
    [0, '#f4f6f8'],
    [1, '#6d7883'],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - 58, 4, 1.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3f45';
  ctx.fill();
  ctx.fillStyle = '#c9d2d9';
  ctx.fillRect(x - 0.5, y - 66, 1, 8);
}

function mouseWheel(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 10, 26, y + 1, 0.35);
  // cage
  box(ctx, x - 2, y - 3, 24, 3, '#6b4a32', 0.6);
  ctx.strokeStyle = rgba('#c9d2d9', 0.7);
  ctx.lineWidth = 0.4;
  for (let i = 0; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 1 + i * 1.8, y - 3);
    ctx.lineTo(x - 1 + i * 1.8, y - 24);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 24, 11.5, 2, 0, Math.PI, 0);
  ctx.stroke();
  // wheel rim
  ctx.beginPath();
  ctx.arc(x + 6, y - 13, 7.4, 0, Math.PI * 2);
  ctx.strokeStyle = '#c9d2d9';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  // wire to bulb
  ctx.strokeStyle = '#c7433b';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 13);
  ctx.quadraticCurveTo(x + 14, y - 30, x + 18, y - 28);
  ctx.stroke();
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 16.6, y - 29, 2.8, 2);
  // sign
  ctx.font = '700 2.8px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4efe0';
  ctx.fillText('ГЭС №1', x + 10, y - 26.4);
}

function mouse(ctx: Ctx, x: number, y: number, run: number) {
  ctx.fillStyle = '#d9d2c8';
  ctx.beginPath();
  ctx.ellipse(x, y - 1.6 - Math.abs(run) * 0.4, 2.6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2.4, y - 2, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb0b8';
  ctx.beginPath();
  ctx.arc(x + 1.8, y - 3.2, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x + 2.8, y - 2.4, 0.5, 0.5);
  ctx.strokeStyle = '#d9a8b0';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y - 1.6);
  ctx.quadraticCurveTo(x - 4, y - 3 + run, x - 5, y - 1.4);
  ctx.stroke();
}

function mainframe(ctx: Ctx, x: number, y: number, seed: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.45);
  panel(ctx, x, y - 66, 24, 66, '#cfc8b4', 1.6);
  // reel window
  fillRR(ctx, x + 2, y - 62, 20, 20, 1, '#1a1c20');
  ctx.fillStyle = rgba('#dff3ff', 0.12);
  ctx.fillRect(x + 2, y - 62, 20, 9);
  // light panel
  fillRR(ctx, x + 2, y - 40, 20, 8, 0.8, '#1d2126');
  // lower grille
  ctx.fillStyle = rgba('#000', 0.3);
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 3, y - 26 + i * 3.4, 18, 1.2);
  fillRR(ctx, x + 2, y - 30, 20, 2, 0.4, seed % 2 ? '#c7433b' : '#2f6fa5');
}

function printer(ctx: Ctx, x: number, y: number) {
  panel(ctx, x, y - 9, 22, 9, '#d9d2c0', 1.2);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x + 3, y - 9.6, 16, 1);
  // continuous paper spilling over the desk
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 9.6);
  ctx.lineTo(x + 18, y - 9.6);
  ctx.lineTo(x + 18, y - 12);
  ctx.lineTo(x + 6, y - 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 22, y - 2);
  ctx.quadraticCurveTo(x + 28, y - 1, x + 26, y + 6);
  ctx.lineTo(x + 20, y + 6);
  ctx.quadraticCurveTo(x + 22, y + 1, x + 18, y - 2);
  ctx.fill();
  ctx.fillStyle = rgba('#5a8a5a', 0.4);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 20.5 + i * 0.3, y + i * 2, 5, 0.4);
}

function periodicTable(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(x, y, w, h);
  const cs = w / 18;
  const cols = ['#ff8a7a', '#ffcf7a', '#9ad88a', '#8ac8f0', '#c8a8f0'];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 18; c++) {
      if (r === 0 && c > 0 && c < 17) continue;
      if ((r === 1 || r === 2) && c > 1 && c < 12) continue;
      ctx.fillStyle = cols[(c < 2 ? 0 : c < 12 ? 1 : c < 16 ? 2 : c < 17 ? 3 : 4) % 5];
      ctx.fillRect(x + c * cs + 0.2, y + 2 + r * (h - 4) / 6.5, cs - 0.4, (h - 4) / 6.5 - 0.4);
    }
  }
  ctx.font = '700 2.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2a2622';
  ctx.fillText('ТАБЛИЦА МЕНДЕЛЕЕВА', x + w / 2, y + h - 1.6);
}

// ================================================================== OFFICE
export function officeStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      filingCabinet(ctx, mx + 20, B, 16, 4, '#6b7a70');
      filingCabinet(ctx, mx + 38, B, 16, 3, '#6b7a70');
      plant(ctx, mx + 46, B - 29, 0.8);
      portrait(ctx, mx + 88, 27, 26, 30);
      officeChair(ctx, mx + 101, B - 2, '#6a2a24', true);
      woodDesk(ctx, mx + 66, B, 72, 18, '#6b4428', 'both');
      // desk items
      bankerLamp(ctx, mx + 76, B - 20);
      redPhone(ctx, mx + 120, B - 20);
      deskPapers(ctx, mx + 94, B - 20);
      nameplate(ctx, mx + 102, B - 20, L(lang, 'СМОТРИТЕЛЬ', 'OVERSEER'));
      flagPole(ctx, mx + 150, B, 58, '#2d4a8a', '#f2c230');
      globe(ctx, mx + 182, B, 6.5);
      wallClock(ctx, mx + 60, 34, 5, 7);
    } else if (v === 1) {
      projectorScreen(ctx, mx + 22, 25, 64, 38, lang);
      meetingTable(ctx, mx + 30, B, 120);
      trophyCabinet(ctx, mx + 158, B, level);
      pendantLamp(ctx, mx + 90, WALL_TOP, 14, '#2f5a4a');
      wallClock(ctx, mx + 116, 34, 5, 3);
    } else {
      aquarium(ctx, mx + 18, B);
      fireplace(ctx, mx + 70, B);
      vaultMap(ctx, mx + 128, 28, 62, 34, lang);
      armchair(ctx, mx + 144, B, '#7a2e2a');
      rug(ctx, mx + 95, B + 6, 38, '#7a2e2e', '#c9a24a');
    }
  }
}

export function officeDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 80, B - 24, 16, '#b8ffb0', 0.2);
      ctx.restore();
    } else if (v === 1) {
      // projector beam flicker
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 54, 44, 34, '#fff4d8', active ? 0.08 + 0.02 * Math.sin(t * 30) : 0.03);
      ctx.restore();
    } else {
      // fireplace flames
      flames(ctx, mx + 95, B - 12, 18, t);
      // fish
      for (let i = 0; i < 3; i++) {
        const fx = mx + 30 + ((Math.sin(t * 0.5 + i * 2.1) + 1) / 2) * 30;
        const fy = B - 38 + i * 5 + Math.sin(t * 1.3 + i) * 1.5;
        const dir = Math.cos(t * 0.5 + i * 2.1) > 0 ? 1 : -1;
        fish(ctx, fx, fy, dir, i === 1);
      }
      bubbles(ctx, mx + 56, B - 28, 4, t, '#dff3ff');
    }
  }
}

function bankerLamp(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 3, y - 1.2, 6, 1.2, 0.5, '#c9a24a');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - 0.5, y - 7, 1, 6);
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 5, 2.2, 0, Math.PI, 0);
  ctx.fillStyle = '#2f7a4a';
  ctx.fill();
  ctx.fillStyle = '#fff4c8';
  ctx.fillRect(x - 4.6, y - 8, 9.2, 0.6);
}

function redPhone(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 4, y - 3, 8, 3, 1, '#c7433b');
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.arc(x, y - 1.6, 1, 0, Math.PI * 2);
  ctx.fill();
  fillRR(ctx, x - 4.6, y - 5, 9.2, 1.8, 0.9, '#d9463d');
}

function deskPapers(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#f4efe0';
  ctx.fillRect(x - 5, y - 1, 9, 1);
  ctx.fillStyle = '#e8e2d4';
  ctx.fillRect(x - 4, y - 2, 8, 1);
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(x - 4, y - 2.4, 2, 0.4);
}

function nameplate(ctx: Ctx, x: number, y: number, s: string) {
  ctx.font = '700 2.6px Oswald, sans-serif';
  const tw = ctx.measureText(s).width + 3;
  fillRR(ctx, x - tw / 2, y - 3.4, tw, 3.4, 0.4, '#3a2418');
  ctx.fillStyle = '#e8c872';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y - 1.6);
}

function projectorScreen(ctx: Ctx, x: number, y: number, w: number, h: number, lang: string) {
  fillRR(ctx, x - 2, y - 2, w + 4, 3, 1, '#3a3f45');
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(x, y + 1, w, h);
  ctx.fillStyle = rgba('#000', 0.08);
  ctx.fillRect(x + w - 3, y + 1, 3, h);
  // chart: rising bars + arrow
  const bars = [0.3, 0.45, 0.4, 0.62, 0.85];
  bars.forEach((b, i) => {
    const bh = (h - 14) * b;
    ctx.fillStyle = ['#3a6ea5', '#3a6ea5', '#c7433b', '#3a6ea5', '#e0a82a'][i];
    ctx.fillRect(x + 8 + i * 10, y + h - 5 - bh, 7, bh);
  });
  ctx.strokeStyle = '#2a8a4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h - 10);
  ctx.lineTo(x + 30, y + h - 18);
  ctx.lineTo(x + 38, y + h - 15);
  ctx.lineTo(x + 56, y + 12);
  ctx.stroke();
  ctx.fillStyle = '#2a8a4a';
  ctx.beginPath();
  ctx.moveTo(x + 58, y + 9);
  ctx.lineTo(x + 53, y + 11);
  ctx.lineTo(x + 57, y + 14);
  ctx.fill();
  ctx.font = '700 4px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2a2622';
  ctx.fillText(L(lang, 'ПЛАН ВЫЖИВАНИЯ', 'SURVIVAL PLAN'), x + 4, y + 6);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + w / 2 - 0.5, y + h + 1, 1, 3);
}

function meetingTable(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.45);
  // chairs behind (backs visible above the table)
  for (let i = 0; i < 5; i++) {
    const cx = x + 14 + i * ((w - 28) / 4);
    fillRR(ctx, cx - 5, y - 30, 10, 14, 2.4, vgrad(ctx, y - 30, y - 16, [
      [0, '#4a2a24'],
      [1, '#2f1a16'],
    ]));
  }
  panel(ctx, x, y - 18, w, 3.4, '#6b4428', 1);
  ctx.fillStyle = rgba('#ffffff', 0.2);
  ctx.fillRect(x + 2, y - 17.6, w - 4, 0.6);
  ctx.fillStyle = '#4a2e1a';
  ctx.fillRect(x + 6, y - 15, 3, 15);
  ctx.fillRect(x + w - 9, y - 15, 3, 15);
  // cups & papers
  for (let i = 0; i < 4; i++) {
    const px = x + 20 + i * 26;
    ctx.fillStyle = '#f4efe0';
    ctx.fillRect(px, y - 19, 7, 0.8);
    fillRR(ctx, px + 10, y - 21.4, 2.6, 2.6, 0.5, '#f4f4f0');
  }
}

function trophyCabinet(ctx: Ctx, x: number, y: number, level: number) {
  glassCabinet(ctx, x, y, 34, 60, '#6b4428', 3, (sy, x0, x1, i) => {
    const n = i === 0 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const cx = x0 + ((k + 0.5) * (x1 - x0)) / n;
      cup(ctx, cx, sy, i === 0 ? 1.3 : 1, k === 1 && level >= 2 ? '#e8c872' : ['#e8c872', '#c9d2d9', '#c98a4a'][(k + i) % 3]);
    }
  });
}

function cup(ctx: Ctx, cx: number, y: number, s: number, c: string) {
  fillRR(ctx, cx - 2.2 * s, y - 1.4 * s, 4.4 * s, 1.4 * s, 0.4, shade(c, -0.3));
  ctx.fillStyle = c;
  ctx.fillRect(cx - 0.5 * s, y - 3.4 * s, 1 * s, 2 * s);
  ctx.beginPath();
  ctx.moveTo(cx - 3 * s, y - 8.6 * s);
  ctx.lineTo(cx + 3 * s, y - 8.6 * s);
  ctx.quadraticCurveTo(cx + 3 * s, y - 3.4 * s, cx, y - 3.4 * s);
  ctx.quadraticCurveTo(cx - 3 * s, y - 3.4 * s, cx - 3 * s, y - 8.6 * s);
  ctx.fill();
  ctx.strokeStyle = c;
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  ctx.arc(cx - 3 * s, y - 6.6 * s, 1.2 * s, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(cx + 3 * s, y - 6.6 * s, 1.2 * s, Math.PI * 1.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.fillRect(cx - 2 * s, y - 8 * s, 0.6 * s, 3 * s);
}

function aquarium(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1, 0.45);
  panel(ctx, x, y - 22, 44, 22, '#3a2418', 1.2);
  ctx.strokeStyle = rgba('#000', 0.3);
  ctx.strokeRect(x + 3, y - 19, 18, 16);
  ctx.strokeRect(x + 23, y - 19, 18, 16);
  // tank
  fillRR(ctx, x + 1, y - 50, 42, 28, 1, '#10324a');
  ctx.save();
  rrect(ctx, x + 1, y - 50, 42, 28, 1);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, y - 50, y - 22, [
    [0, '#3aa0c8'],
    [1, '#15506e'],
  ]);
  ctx.fillRect(x + 1, y - 47, 42, 25);
  ctx.fillStyle = '#c9b48a';
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.quadraticCurveTo(x + 20, y - 27, x + 44, y - 23);
  ctx.lineTo(x + 44, y - 22);
  ctx.fill();
  // weeds
  ctx.strokeStyle = '#3f9a5a';
  ctx.lineWidth = 1.1;
  for (const wx of [x + 6, x + 9, x + 36]) {
    ctx.beginPath();
    ctx.moveTo(wx, y - 23);
    ctx.quadraticCurveTo(wx + 3, y - 32, wx - 1, y - 40);
    ctx.stroke();
  }
  // tiny sunken vault door
  ctx.beginPath();
  ctx.arc(x + 26, y - 26, 3.4, Math.PI, 0);
  ctx.fillStyle = '#9aa7b0';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = rgba('#ffffff', 0.2);
  ctx.fillRect(x + 1, y - 50, 42, 3);
  box(ctx, x - 0.5, y - 53, 45, 3.4, '#2a2f35', 0.8);
}

function fish(ctx: Ctx, x: number, y: number, dir: number, twoHeaded: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = twoHeaded ? '#ff8a3a' : '#ffcf4a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.6, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2.2, 0);
  ctx.lineTo(-4, -1.4);
  ctx.lineTo(-4, 1.4);
  ctx.fill();
  if (twoHeaded) {
    // mutant gag: a second head on the tail end
    ctx.beginPath();
    ctx.ellipse(-4.2, 0, 1.3, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-4.8, -0.4, 0.5, 0.5);
  }
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(1.4, -0.5, 0.5, 0.5);
  ctx.restore();
}

function fireplace(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 25, 60, y + 1, 0.5);
  panel(ctx, x, y - 44, 50, 44, '#8a5a3a', 1.2);
  // brick texture
  ctx.fillStyle = rgba('#000', 0.15);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) ctx.fillRect(x + 1 + c * 8.2 + (r % 2) * 4, y - 43 + r * 4.3, 7.6, 0.5);
  // firebox
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + 10, y - 22);
  ctx.quadraticCurveTo(x + 25, y - 31, x + 40, y - 22);
  ctx.lineTo(x + 40, y);
  ctx.closePath();
  ctx.fillStyle = '#15100c';
  ctx.fill();
  // logs
  fillRR(ctx, x + 15, y - 5, 20, 3, 1.4, '#5a3a24');
  fillRR(ctx, x + 18, y - 7.6, 14, 3, 1.4, '#6b4428');
  // mantel
  panel(ctx, x - 3, y - 47, 56, 4, '#5a3a24', 0.8);
  // mantel items
  cup(ctx, x + 6, y - 47, 0.8, '#e8c872');
  for (let i = 0; i < 2; i++) {
    fillRR(ctx, x + 30 + i * 9, y - 55, 7, 8, 0.6, '#c9a24a');
    ctx.fillStyle = i ? '#6fa45a' : '#5f8fc8';
    ctx.fillRect(x + 31 + i * 9, y - 54, 5, 6);
  }
}

function flames(ctx: Ctx, cx: number, y: number, w: number, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const fx = cx - w / 2 + (i + 0.5) * (w / 7);
    const h = 6 + 4 * Math.abs(Math.sin(t * (5 + i) + i * 1.3));
    ctx.fillStyle = rgba(i % 2 ? '#ff9a3a' : '#ffcf4a', 0.75);
    ctx.beginPath();
    ctx.moveTo(fx - 2, y + 4);
    ctx.quadraticCurveTo(fx - 2.4, y - h * 0.5, fx + Math.sin(t * 7 + i) * 0.8, y - h);
    ctx.quadraticCurveTo(fx + 2.4, y - h * 0.5, fx + 2, y + 4);
    ctx.fill();
  }
  glow(ctx, cx, y - 2, 30, '#ff8a3a', 0.28 + 0.05 * Math.sin(t * 9));
  ctx.restore();
}

function vaultMap(ctx: Ctx, x: number, y: number, w: number, h: number, lang: string) {
  fillRR(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 1, '#c9a24a');
  ctx.fillStyle = '#1f4a7a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba('#bfe0ff', 0.2);
  ctx.lineWidth = 0.3;
  for (let gx = x; gx < x + w; gx += 3) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 3) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba('#e8f4ff', 0.85);
  ctx.lineWidth = 0.6;
  // ground line and rooms
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 7);
  ctx.lineTo(x + w - 2, y + 7);
  ctx.stroke();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 5 === 3) continue;
      ctx.strokeRect(x + 6 + c * 13, y + 10 + r * 5.6, c === 1 ? 5 : 11, 4.4);
    }
  }
  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath();
  ctx.arc(x + 8, y + 12.2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 3.4px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8f4ff';
  ctx.fillText(L(lang, 'СХЕМА УБЕЖИЩА', 'VAULT LAYOUT'), x + 3, y + 3.6);
}

function armchair(ctx: Ctx, x: number, y: number, c: string) {
  propShadow(ctx, x + 12, 30, y + 1, 0.45);
  box(ctx, x + 3, y - 26, 18, 14, shade(c, -0.08), 4);
  box(ctx, x + 1, y - 13, 22, 8, c, 3);
  box(ctx, x - 1, y - 18, 6, 13, shade(c, 0.06), 2.6);
  box(ctx, x + 19, y - 18, 6, 13, shade(c, 0.06), 2.6);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x + 2, y - 5, 1.6, 5);
  ctx.fillRect(x + 20.4, y - 5, 1.6, 5);
  ctx.fillStyle = rgba(shade(c, -0.6), 0.6);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 7 + i * 5, y - 22, 0.8, 0.8);
}

// ================================================================== RADIO
export function radioStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      speaker(ctx, mx + 18, B, 22, 44);
      djDesk(ctx, mx + 50, B, 86);
      micBoom(ctx, mx + 94, B - 22);
      onAirBox(ctx, mx + 93, 26, lang);
      speaker(ctx, mx + 140, B, 22, 44);
      recordShelf(ctx, mx + 168, B, 24, 52);
      bandPoster(ctx, mx + 58, 30, lang, 0);
    } else if (v === 1) {
      tubeRack(ctx, mx + 18, B);
      tubeRack(ctx, mx + 44, B);
      receiver(ctx, mx + 76, B, lang);
      reelRecorder(ctx, mx + 146, B);
      ctx.strokeStyle = '#15191d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx + 30, B - 68);
      ctx.bezierCurveTo(mx + 34, WALL_TOP + 4, mx + 90, WALL_TOP + 8, mx + 110, WALL_TOP + 2);
      ctx.stroke();
    } else {
      boothWindow(ctx, mx + 22, 32, 84, 40);
      sofa(ctx, mx + 116, B, 46, '#5a3a7a');
      bandPoster(ctx, mx + 124, 30, lang, 1);
      guitarStand(ctx, mx + 180, B);
      stool(ctx, mx + 104, B, '#3a3f45');
    }
  }
}

export function radioDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      neonGlow(ctx, mx + 107, 31, L(lang, 'В ЭФИРЕ', 'ON AIR'), '#ff3a4a', 5.6, active ? 0.9 + 0.1 * Math.sin(t * 4) : 0.12);
      // turntable spin & VU meters
      for (const tx of [mx + 60, mx + 118]) {
        ctx.save();
        ctx.translate(tx, B - 28.5);
        ctx.scale(1, 0.35);
        ctx.rotate(active ? t * 4 : 0);
        ctx.fillStyle = rgba('#ffffff', 0.35);
        ctx.fillRect(-0.4, -7, 0.8, 5);
        ctx.restore();
      }
      for (let i = 0; i < 8; i++) {
        const h = active ? 1 + 5 * Math.abs(Math.sin(t * (4 + i) + i)) : 1;
        ctx.fillStyle = i > 5 ? '#ff5a4a' : '#6aff8c';
        ctx.fillRect(mx + 80 + i * 2.2, B - 25 - h, 1.4, h);
      }
      // speaker thump
      if (active) {
        const k = Math.max(0, Math.sin(t * 9.4));
        for (const sx of [mx + 29, mx + 151]) {
          ctx.beginPath();
          ctx.arc(sx, B - 14, 4 + k * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = rgba('#8a8490', 0.5 * k);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    } else if (v === 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const rx of [mx + 18, mx + 44]) {
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 3; i++) {
            const f = active ? 0.5 + 0.3 * Math.sin(t * 3 + r + i * 2) : 0.12;
            glow(ctx, rx + 6 + i * 6, B - 58 + r * 14, 5, '#ff9a3a', 0.45 * f);
          }
        }
      }
      ctx.restore();
      // tuning needle
      const nx = mx + 90 + ((Math.sin(t * (active ? 0.4 : 0.05)) + 1) / 2) * 34;
      ctx.fillStyle = '#e84a3c';
      ctx.fillRect(nx, B - 48, 0.8, 9);
      // oscilloscope
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx + 118, B - 70, 14, 10);
      ctx.clip();
      ctx.strokeStyle = '#6aff8c';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const x = mx + 118 + i * 0.5;
        const y = B - 65 + Math.sin(i * 0.6 + t * 8) * (active ? 3 : 0.4) * Math.sin(t * 1.3 + i * 0.1);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      for (const [j, rx] of [mx + 156, mx + 180].entries()) reelSpokes(ctx, rx, B - 42, 8, active ? t * (j ? 2.6 : 2) : 0);
    } else {
      // booth: a singer silhouette bobbing, red rec light
      const on = active && Math.sin(t * 2) > -0.8;
      ctx.fillStyle = on ? '#ff3a4a' : '#5a1a1a';
      ctx.beginPath();
      ctx.arc(mx + 100, 36, 1.4, 0, Math.PI * 2);
      ctx.fill();
      if (on) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, mx + 100, 36, 8, '#ff3a4a', 0.5);
        ctx.restore();
      }
      if (active) {
        ctx.save();
        rrect(ctx, mx + 24, 34, 80, 36, 1);
        ctx.clip();
        const bx = mx + 70 + Math.sin(t * 2.2) * 1.5;
        ctx.fillStyle = rgba('#140c20', 0.85);
        ctx.beginPath();
        ctx.arc(bx, 50 + Math.abs(Math.sin(t * 4.4)) * 0.8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(bx - 7, 55, 14, 16);
        ctx.restore();
      }
    }
  }
}

function djDesk(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.5);
  panel(ctx, x, y - 22, w, 22, '#2a2530', 1.6);
  ctx.fillStyle = hgrad(ctx, x, x + w, [
    [0, '#6a3a8a'],
    [0.5, '#b86ae8'],
    [1, '#6a3a8a'],
  ]);
  ctx.fillRect(x + 2, y - 6, w - 4, 1);
  // top surface
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 22);
  ctx.lineTo(x + w + 2, y - 22);
  ctx.lineTo(x + w - 1, y - 27);
  ctx.lineTo(x + 1, y - 27);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 27, y - 22, [
    [0, '#4a4550'],
    [1, '#2f2a35'],
  ]);
  ctx.fill();
  // turntables
  for (const tx of [x + 10, x + w - 10]) {
    ctx.beginPath();
    ctx.ellipse(tx, y - 24.5, 8, 2.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#121014';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(tx, y - 24.5, 2.4, 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c7433b';
    ctx.fill();
  }
  // mixer faders
  fillRR(ctx, x + 26, y - 26.4, w - 52, 3.4, 0.6, '#1d1a22');
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#c9ced2';
    ctx.fillRect(x + 30 + i * ((w - 60) / 5), y - 26 + (i % 3) * 0.6, 1.8, 1);
  }
  // meter bridge
  fillRR(ctx, x + 28, y - 34, 22, 8, 0.8, '#15131a');
}

function micBoom(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 6);
  ctx.lineTo(x + 26, y - 24);
  ctx.lineTo(x + 8, y - 20);
  ctx.stroke();
  fillRR(ctx, x + 3, y - 24, 6, 9, 2.6, '#6d7883');
  ctx.fillStyle = rgba('#000', 0.3);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 4, y - 22 + i * 2.2, 4, 0.5);
  // pop filter
  ctx.beginPath();
  ctx.arc(x + 1, y - 19, 3.4, 0, Math.PI * 2);
  ctx.strokeStyle = rgba('#1a1a1a', 0.6);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = rgba('#1a1a1a', 0.25);
  ctx.fill();
}

function onAirBox(ctx: Ctx, x: number, y: number, lang: string) {
  neonSign(ctx, x + 14, y + 5, L(lang, 'В ЭФИРЕ', 'ON AIR'), '#ff3a4a', 5.6);
}

function bandPoster(ctx: Ctx, x: number, y: number, lang: string, k: number) {
  poster(ctx, x, y, 28, 36, k ? '#1f2a4a' : '#3a1a2a', (px, py, pw, ph) => {
    ctx.fillStyle = k ? '#ffcf4a' : '#ff5ab4';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 14, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = k ? '#1f2a4a' : '#3a1a2a';
    // beetle silhouette
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py + 15, 4, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + pw / 2 - 0.4, py + 9, 0.8, 11);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = ctx.fillStyle;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px + pw / 2 + s * 3, py + 12 + i * 2.6);
        ctx.lineTo(px + pw / 2 + s * 6.4, py + 11 + i * 3.4);
        ctx.stroke();
      }
    }
    posterText(ctx, k ? L(lang, 'ТУР 2077', 'TOUR 2077') : L(lang, 'АТОМНЫЕ', 'ATOMIC'), px + pw / 2, py + ph - 10, 4, '#f4efe0');
    posterText(ctx, k ? L(lang, 'ПОД ЗЕМЛЁЙ', 'UNDERGROUND') : L(lang, 'ЖУКИ', 'BEETLES'), px + pw / 2, py + ph - 5, k ? 3.4 : 4.6, k ? '#ffcf4a' : '#ff5ab4');
  });
}

function tubeRack(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 11, 26, y + 1, 0.45);
  panel(ctx, x, y - 70, 24, 70, '#3a3540', 1.6);
  for (let r = 0; r < 3; r++) {
    const ry = y - 64 + r * 14;
    fillRR(ctx, x + 2, ry, 20, 11, 0.8, '#15131a');
    for (let i = 0; i < 3; i++) {
      const tx = x + 6 + i * 6;
      fillRR(ctx, tx - 1.6, ry + 2, 3.2, 7, 1.6, rgba('#e8e2d4', 0.35));
      ctx.fillStyle = '#ffb05a';
      ctx.fillRect(tx - 0.5, ry + 4, 1, 3);
    }
  }
  gauge(ctx, x + 7, y - 16, 3, 0.4);
  gauge(ctx, x + 17, y - 16, 3, 0.7);
  buttonsRow(ctx, x + 5, y - 7, 5);
}

function receiver(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 30, 66, y + 1, 0.5);
  panel(ctx, x, y - 36, 60, 36, '#6b4428', 2.4);
  // dial window
  fillRR(ctx, x + 6, y - 32, 48, 11, 1.4, '#f2e2b0');
  ctx.fillStyle = rgba('#3a2418', 0.6);
  for (let i = 0; i <= 24; i++) ctx.fillRect(x + 8 + i * 1.8, y - 30, 0.3, i % 4 === 0 ? 3 : 1.6);
  ctx.font = '600 2.2px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a2418';
  ['МОСКВА', 'ПУСТОШЬ', 'УБЕЖ.', 'ЛУНА'].forEach((s, i) => ctx.fillText(lang === 'ru' ? s : ['MOSCOW', 'WASTES', 'VAULT', 'MOON'][i], x + 12 + i * 12, y - 23.4));
  // speaker cloth
  fillRR(ctx, x + 6, y - 19, 30, 15, 1.4, '#c9b48a');
  ctx.strokeStyle = rgba('#6b4428', 0.5);
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 17 + i * 2.4);
    ctx.lineTo(x + 36, y - 17 + i * 2.4);
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(x + 44 + i * 8, y - 12, 3, 0, Math.PI * 2);
    ctx.fillStyle = rgrad(ctx, x + 43 + i * 8, y - 13, 0, 4, [
      [0, '#f2e2b0'],
      [1, '#8a6a3a'],
    ]);
    ctx.fill();
  }
  // oscilloscope on top
  panel(ctx, x + 40, y - 52, 22, 16, '#5a646e', 1.4);
  fillRR(ctx, x + 42, y - 50, 14, 10, 1.6, '#0b1a12');
  knob(ctx, x + 59, y - 47, 1);
  knob(ctx, x + 59, y - 42, 1);
}

function reelRecorder(ctx: Ctx, x: number, y: number) {
  steelTable(ctx, x - 4, y, 48, 20, '#4a4550', '#3a3540');
  panel(ctx, x, y - 54, 40, 33, '#c9c3b3', 1.6);
  fillRR(ctx, x + 4, y - 30, 32, 6, 0.8, '#2a2d31');
  buttonsRow(ctx, x + 8, y - 27, 7, ['#c9ced2', '#c9ced2', '#e84a3c', '#c9ced2']);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 34);
  ctx.lineTo(x + 20, y - 32);
  ctx.lineTo(x + 30, y - 34);
  ctx.stroke();
}

function boothWindow(ctx: Ctx, x: number, y: number, w: number, h: number) {
  fillRR(ctx, x - 3, y - 3, w + 6, h + 6, 1.6, '#2a2530');
  ctx.fillStyle = vgrad(ctx, y, y + h, [
    [0, '#2a1e3a'],
    [1, '#140e1e'],
  ]);
  ctx.fillRect(x, y, w, h);
  // foam wedges inside
  ctx.fillStyle = rgba('#3a2d52', 0.9);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 10; c++) {
      ctx.beginPath();
      const px = x + c * 8.4 + (r % 2) * 4;
      const py = y + r * 9;
      ctx.moveTo(px, py + 9);
      ctx.lineTo(px + 4, py + 1);
      ctx.lineTo(px + 8, py + 9);
      ctx.fill();
    }
  }
  // mic in booth
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 56, y + 16, 1, h - 16);
  fillRR(ctx, x + 54, y + 12, 5, 7, 2, '#9aa7b0');
  // headphones hanging
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(x + 20, y + 14, 4, Math.PI, 0);
  ctx.stroke();
  fillRR(ctx, x + 15, y + 13, 2.6, 4, 1, '#1a1a1a');
  fillRR(ctx, x + 22.4, y + 13, 2.6, 4, 1, '#1a1a1a');
  // glass reflections
  ctx.fillStyle = rgba('#ffffff', 0.08);
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h);
  ctx.lineTo(x + 26, y);
  ctx.lineTo(x + 34, y);
  ctx.lineTo(x + 16, y + h);
  ctx.fill();
  box(ctx, x - 4, y + h + 2, w + 8, 3, '#4a3a5a', 0.8);
}

function guitarStand(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x, 14, y + 1, 0.35);
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x, y - 10);
  ctx.lineTo(x + 5, y);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y - 12);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#c7433b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(0, -8, 4.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe0';
  ctx.beginPath();
  ctx.arc(0, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -4, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a2e1a';
  ctx.fillRect(-1, -32, 2, 22);
  fillRR(ctx, -1.8, -36, 3.6, 5, 0.6, '#2a1a10');
  ctx.restore();
}

// ================================================================== SODA
export function sodaStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      syrupTank(ctx, mx + 18, B, lang);
      conveyor(ctx, mx + 54, B, 142);
      fillerHeads(ctx, mx + 70, B - 20);
      capper(ctx, mx + 138, B - 20);
      wallVent(ctx, mx + 160, 30, 28, 14);
    } else if (v === 1) {
      menuBoard(ctx, mx + 20, 28, lang);
      sodaBar(ctx, mx + 50, B, 100);
      for (let i = 0; i < 4; i++) stool(ctx, mx + 62 + i * 24, B + 6, '#d23b3b');
      vendingMachine(ctx, mx + 160, B, lang);
      neonSign(ctx, mx + 100, 31, L(lang, 'ШИПУЧКА', 'FIZZY'), '#ff4a6a', 7);
    } else {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3 - (r === 3 ? 1 : 0); c++) bottleCrate(ctx, mx + 18 + c * 20 + (r % 2) * 4, B - r * 12, 18, ['#c7433b', '#2f6fa5', '#c7433b'][(r + c) % 3], '#7fcf9a');
      chain(ctx, mx + 88, mx + 122, 48);
      for (let i = 0; i < 4; i++) gasCylinder(ctx, mx + 88 + i * 9, B, 46, i % 2 ? '#6d7883' : '#3f8a5a', 'CO₂');
      handTruck(ctx, mx + 128, B);
      sodaPoster(ctx, mx + 158, 28, lang);
    }
  }
}

export function sodaDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang = 'ru') {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // bottles riding the belt
      const sp = active ? 10 : 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx + 56, B - 40, 138, 22);
      ctx.clip();
      for (let i = 0; i < 12; i++) {
        const x = mx + 56 + ((i * 12 + t * sp) % 144);
        const filled = x > mx + 88;
        const capped = x > mx + 150;
        sodaBottle(ctx, x, B - 20.5, filled, capped);
      }
      ctx.restore();
      // syrup level
      const lv = 0.55 + 0.05 * Math.sin(t * 0.5);
      ctx.fillStyle = rgba('#ffffff', 0.25);
      ctx.fillRect(mx + 31, B - 18 - 40 * lv, 3, 0.8);
      // filler pulse
      if (active) {
        const k = Math.max(0, Math.sin(t * 5));
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = rgba('#8a2a1a', 0.8);
          ctx.fillRect(mx + 76 + i * 12, B - 30, 1, k * 6);
        }
      }
    } else if (v === 1) {
      neonGlow(ctx, mx + 100, 31, L(lang, 'ШИПУЧКА', 'FIZZY'), '#ff4a6a', 7, active ? 0.85 + 0.15 * Math.sin(t * 6) : 0.4);
      // vending glow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 176, B - 40, 22, '#ff6a6a', 0.14 + (active ? 0.05 * Math.sin(t * 2) : 0));
      ctx.restore();
      // fizz in glasses
      if (active) for (let i = 0; i < 3; i++) bubbles(ctx, mx + 70 + i * 26, B - 24, 3, t + i, '#ffffff');
    } else {
      // blinking warning light on the co2 rack
      const on = Math.sin(t * 3) > 0.5;
      ctx.fillStyle = on ? '#ffcf4a' : '#5a4a1a';
      ctx.beginPath();
      ctx.arc(mx + 104, 42, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function syrupTank(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 14, 36, y + 1, 0.5);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 2, y - 12, 2, 12);
  ctx.fillRect(x + 24, y - 12, 2, 12);
  cylinder(ctx, x, y - 70, 28, 58, '#c9d2d9', 5);
  // sight glass
  fillRR(ctx, x + 12, y - 62, 5, 42, 2, '#2a1210');
  ctx.fillStyle = vgrad(ctx, y - 44, y - 20, [
    [0, '#e0404e'],
    [1, '#7a1a1a'],
  ]);
  ctx.fillRect(x + 12.8, y - 44, 3.4, 24);
  ctx.font = '700 3.6px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c7433b';
  ctx.save();
  ctx.translate(x + 6, y - 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(L(lang, 'СИРОП', 'SYRUP'), 0, 0);
  ctx.restore();
  pipeH(ctx, x + 28, x + 40, y - 36, 1.4, '#9aa7b0');
  pipeV(ctx, x + 40, y - 70, y - 36, 1.4, '#9aa7b0');
  pipeH(ctx, x + 40, x + 116, y - 70, 1.4, '#9aa7b0');
}

function conveyor(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  for (let lx = x + 4; lx < x + w; lx += 26) {
    ctx.fillStyle = '#4a5563';
    ctx.fillRect(lx, y - 16, 2, 16);
  }
  box(ctx, x, y - 20, w, 5, '#3a3f45', 2.5);
  ctx.fillStyle = '#1d2126';
  ctx.fillRect(x + 2, y - 20, w - 4, 1.4);
  for (let i = 0; i < w / 6; i++) {
    ctx.fillStyle = rgba('#9aa7b0', 0.5);
    ctx.beginPath();
    ctx.arc(x + 3 + i * 6, y - 17.4, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  hazard(ctx, x, y - 14.6, w, 1.6, '#f2c230', '#26282b', 3);
}

function fillerHeads(ctx: Ctx, x: number, y: number) {
  panel(ctx, x - 4, y - 42, 44, 12, '#c9d2d9', 1.4);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x - 3, y - 30, 2, 30);
  ctx.fillRect(x + 37, y - 30, 2, 30);
  for (let i = 0; i < 3; i++) {
    fillRR(ctx, x + 4 + i * 12, y - 30, 4, 7, 1, '#9aa7b0');
    ctx.fillStyle = '#4a5563';
    ctx.fillRect(x + 5.4 + i * 12, y - 23, 1.2, 2);
  }
  gauge(ctx, x + 32, y - 36, 3, 0.6);
}

function capper(ctx: Ctx, x: number, y: number) {
  panel(ctx, x, y - 36, 20, 12, '#d23b3b', 1.4);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 1, y - 24, 2, 24);
  ctx.fillRect(x + 17, y - 24, 2, 24);
  fillRR(ctx, x + 7, y - 24, 6, 5, 1, '#9aa7b0');
  ctx.fillStyle = '#f2c230';
  ctx.font = '700 3px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('КРЫШКИ', x + 10, y - 29.4);
}

function sodaBottle(ctx: Ctx, x: number, y: number, filled: boolean, capped: boolean) {
  ctx.fillStyle = rgba('#b8e8c8', 0.7);
  fillRR(ctx, x - 1.6, y - 8, 3.2, 8, 1, rgba('#b8e8c8', 0.7));
  ctx.fillRect(x - 0.7, y - 10.4, 1.4, 2.6);
  if (filled) {
    ctx.fillStyle = '#7a1a1a';
    ctx.fillRect(x - 1.2, y - 6.5, 2.4, 6);
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(x - 1.6, y - 5.4, 3.2, 1.6);
  }
  if (capped) {
    ctx.fillStyle = '#d23b3b';
    ctx.fillRect(x - 0.9, y - 11.2, 1.8, 1);
  }
}

function menuBoard(ctx: Ctx, x: number, y: number, lang: string) {
  chalkboard(ctx, x, y, 26, 28, (bx, by) => {
    chalkText(ctx, L(lang, 'МЕНЮ', 'MENU'), bx + 13, by + 4, 3.8, 'center');
    const items = lang === 'ru' ? ['Классика', 'Вишня', 'Ядер-кола', 'Лимон'] : ['Classic', 'Cherry', 'Nuka-lite', 'Lemon'];
    items.forEach((s, i) => {
      chalkText(ctx, s, bx + 2, by + 10 + i * 4.4, 2.8);
      chalkText(ctx, String(3 + i), bx + 24, by + 10 + i * 4.4, 2.8, 'right');
    });
  }, '#2a2a2a');
}

function sodaBar(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.5);
  panel(ctx, x, y - 22, w, 22, '#d23b3b', 1.6);
  ctx.fillStyle = hgrad(ctx, x, x + w, [
    [0, '#9aa3aa'],
    [0.5, '#f4f6f8'],
    [1, '#9aa3aa'],
  ]);
  ctx.fillRect(x, y - 12, w, 2);
  ctx.fillRect(x, y - 4, w, 1.2);
  panel(ctx, x - 2, y - 24.5, w + 4, 3, '#f4f4f0', 1);
  // taps
  for (let i = 0; i < 3; i++) {
    const tx = x + 16 + i * 30;
    fillRR(ctx, tx - 3, y - 38, 6, 13, 1.4, '#c9d2d9');
    ctx.fillStyle = ['#d23b3b', '#f2c230', '#5fb8e8'][i];
    ctx.beginPath();
    ctx.arc(tx, y - 34, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6d7883';
    ctx.fillRect(tx + 2.5, y - 33, 3.6, 1.2);
    // glass
    fillRR(ctx, tx + 7, y - 30.5, 4, 6, 0.6, rgba('#dff3ff', 0.4));
    ctx.fillStyle = '#7a1a1a';
    ctx.fillRect(tx + 7.5, y - 28.5, 3, 3.6);
  }
}

function vendingMachine(ctx: Ctx, x: number, y: number, lang: string) {
  propShadow(ctx, x + 15, 34, y + 1, 0.5);
  panel(ctx, x, y - 66, 30, 66, '#c7333b', 2.4);
  // glowing logo panel
  fillRR(ctx, x + 3, y - 62, 24, 14, 2, rgrad(ctx, x + 15, y - 55, 0, 14, [
    [0, '#ffe8e8'],
    [1, '#ff8a8a'],
  ]));
  ctx.font = '800 4.4px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#c7333b';
  ctx.fillText(L(lang, 'ШИПУЧКА', 'FIZZY'), x + 15, y - 55);
  // bottle window
  fillRR(ctx, x + 3, y - 45, 16, 30, 1, '#1a0c0e');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) sodaBottle(ctx, x + 6.5 + c * 5, y - 36 + r * 9.6, true, true);
  ctx.fillStyle = rgba('#ffffff', 0.14);
  ctx.fillRect(x + 3, y - 45, 16, 30);
  // coin slot & buttons
  fillRR(ctx, x + 21, y - 44, 6, 14, 1, '#2a2d31');
  buttonsRow(ctx, x + 22.4, y - 40, 2, ['#f2c230', '#f2c230']);
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x + 23, y - 34, 2, 2);
  fillRR(ctx, x + 5, y - 11, 20, 5, 1, '#1a0c0e');
}

function handTruck(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 10, 22, y + 1, 0.35);
  ctx.strokeStyle = '#c7433b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 3);
  ctx.lineTo(x + 6, y - 44);
  ctx.lineTo(x + 3, y - 46);
  ctx.stroke();
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 1, y - 3, 14, 1.6);
  ctx.beginPath();
  ctx.arc(x + 4, y - 3, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  for (let i = 0; i < 3; i++) bottleCrate(ctx, x + 3 + i * 0.6, y - 5 - i * 12, 16, i === 1 ? '#2f6fa5' : '#c7433b', '#7fcf9a');
}

function sodaPoster(ctx: Ctx, x: number, y: number, lang: string) {
  poster(ctx, x, y, 34, 42, '#f4e3c0', (px, py, pw, ph) => {
    ctx.fillStyle = '#d23b3b';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 16, 11, 0, Math.PI * 2);
    ctx.fill();
    // smiling bottle cap mascot
    ctx.fillStyle = '#f4f4f0';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(px + pw / 2 + Math.cos(a) * 8, py + 16 + Math.sin(a) * 8, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 16, 7.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(px + pw / 2 - 2.4, py + 14.4, 0.9, 0, Math.PI * 2);
    ctx.arc(px + pw / 2 + 2.4, py + 14.4, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 16.4, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    posterText(ctx, L(lang, 'ПЕЙ', 'DRINK'), px + pw / 2, py + ph - 11, 4.4, '#2a2622');
    posterText(ctx, L(lang, 'ШИПУЧКУ!', 'FIZZY!'), px + pw / 2, py + ph - 5.4, 5, '#d23b3b', 800);
  });
}
