/* Room interiors v2: workshops and training rooms. Three module variants each. */
import { box, cylinder, fillRR, gauge, glow, hazard, hgrad, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { propShadow } from './roomBase';
import { arcadeCabinet, barrel, books, crate, mannequin, metalCrate, plant, poster, posterText, shelfUnit, sofa, stool, wallClock } from './props';
import { chandelier, gunRack, knob, neonGlow, neonSign, panel, rug, wallSconce } from './furniture';
import { bottleRow, chalkboard, chalkText, gasCylinder, globe, L, officeChair, pendantLamp, speaker, steelTable, wallShelf, woodDesk } from './kit2';
import { WALL_BOTTOM, WALL_TOP } from './world';

const B = WALL_BOTTOM + 1.5;
const M = 210;
const variant = (m: number, size: number) => (size === 1 ? 0 : m % 3);

// ================================================================== WEAPON WORKSHOP
export function weaponsStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      pegboard(ctx, mx + 20, 28, 72, 32);
      workbench(ctx, mx + 18, B, 78);
      vise(ctx, mx + 26, B - 20);
      gunParts(ctx, mx + 48, B - 20);
      grinder(ctx, mx + 112, B);
      toolChest(ctx, mx + 142, B);
      safetyPoster(ctx, mx + 158, 28, lang);
    } else if (v === 1) {
      blueprint(ctx, mx + 20, 28, 64, 34, lang);
      lathe(ctx, mx + 20, B);
      gunRack(ctx, mx + 104, 34, 40);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2 - (r === 2 ? 1 : 0); c++) metalCrate(ctx, mx + 152 + c * 20 + r * 5, B - 12 - r * 12, 18, 12, '#5f7a5a', L(lang, 'ПАТРОНЫ', 'AMMO'));
    } else {
      weldTable(ctx, mx + 22, B);
      gasCylinder(ctx, mx + 84, B, 46, '#c7433b', 'C₂H₂');
      gasCylinder(ctx, mx + 94, B, 46, '#3f6fa5', 'O₂');
      weldMask(ctx, mx + 110, 40);
      anvil(ctx, mx + 128, B);
      barrel(ctx, mx + 160, B - 26, 14, 26, '#6b7a82', '#f2c230');
      barrel(ctx, mx + 176, B - 26, 14, 26, '#8a5a36', '#2a2d31');
    }
  }
}

export function weaponsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // grinder wheel & sparks
      ctx.save();
      ctx.translate(mx + 120, B - 34);
      ctx.rotate(active ? t * 30 : 0);
      ctx.strokeStyle = rgba('#e8e2d4', 0.6);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.stroke();
      }
      ctx.restore();
      if (active) sparks(ctx, mx + 124, B - 32, t, 1);
    } else if (v === 1) {
      // lathe chuck spin
      ctx.save();
      ctx.translate(mx + 34, B - 34);
      ctx.rotate(active ? t * 14 : 0);
      ctx.fillStyle = '#e8e2d4';
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.fillRect(-0.8, -6, 1.6, 3);
      }
      ctx.restore();
      if (active) {
        // metal shavings curl
        const ph = (t * 1.5) % 1;
        ctx.strokeStyle = rgba('#c9d2d9', 0.8 * (1 - ph));
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(mx + 52, B - 32 + ph * 8, 1.4 + ph, 0, Math.PI * 1.5);
        ctx.stroke();
      }
    } else {
      if (active && Math.sin(t * 2.3) > -0.3) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const f = 0.6 + 0.4 * Math.random();
        glow(ctx, mx + 54, B - 22, 30, '#9fd8ff', 0.4 * f);
        glow(ctx, mx + 54, B - 22, 6, '#ffffff', 0.9 * f);
        ctx.restore();
        sparks(ctx, mx + 54, B - 22, t, 1.4);
      }
    }
  }
}

function sparks(ctx: Ctx, x: number, y: number, t: number, s: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const ph = (t * 2.2 + i / 9) % 1;
    const a = -0.3 + (i % 5) * 0.35 - Math.PI * 0.1;
    const d = ph * 16 * s;
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d * 0.4 + ph * ph * 14;
    ctx.fillStyle = rgba(i % 2 ? '#ffd86a' : '#ffffff', 1 - ph);
    ctx.fillRect(sx, sy, 0.9, 0.9);
  }
  ctx.restore();
}

function pegboard(ctx: Ctx, x: number, y: number, w: number, h: number) {
  fillRR(ctx, x, y, w, h, 1, '#c8a36a');
  ctx.fillStyle = rgba('#5a3a1a', 0.45);
  for (let r = 0; r < h / 4; r++) for (let c = 0; c < w / 4; c++) ctx.fillRect(x + 2 + c * 4, y + 2 + r * 4, 0.7, 0.7);
  ctx.strokeStyle = rgba('#5a3a1a', 0.5);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, w, h);
  // tools with painted outlines
  const tool = (fn: () => void, c: string) => {
    ctx.save();
    ctx.translate(0.8, 0.8);
    ctx.fillStyle = rgba('#000', 0.25);
    fn();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = c;
    fn();
    ctx.fill();
  };
  // wrench
  tool(() => {
    ctx.beginPath();
    rrect(ctx, x + 6, y + 6, 2.2, 20, 1);
    ctx.arc(x + 7.1, y + 6, 3, 0, Math.PI * 2);
  }, '#9aa7b0');
  // hammer
  tool(() => {
    ctx.beginPath();
    rrect(ctx, x + 16, y + 9, 2, 18, 0.8);
    rrect(ctx, x + 12.5, y + 5, 9, 4, 1);
  }, '#6b4a32');
  // saw
  tool(() => {
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 6);
    ctx.lineTo(x + 46, y + 6);
    ctx.lineTo(x + 46, y + 11);
    ctx.lineTo(x + 30, y + 13);
    ctx.closePath();
  }, '#c9d2d9');
  fillRR(ctx, x + 45, y + 5, 6, 8, 2, '#c7433b');
  // screwdrivers
  for (let i = 0; i < 4; i++) {
    fillRR(ctx, x + 30 + i * 4, y + 17, 2.2, 6, 1, ['#f2c230', '#c7433b', '#2f6fa5', '#3f8a5a'][i]);
    ctx.fillStyle = '#c9d2d9';
    ctx.fillRect(x + 30.7 + i * 4, y + 23, 0.8, 5);
  }
  // pliers
  tool(() => {
    ctx.beginPath();
    ctx.moveTo(x + 54, y + 6);
    ctx.lineTo(x + 58, y + 16);
    ctx.lineTo(x + 56, y + 26);
    ctx.lineTo(x + 58.5, y + 26);
    ctx.lineTo(x + 60, y + 16);
    ctx.lineTo(x + 62, y + 26);
    ctx.lineTo(x + 64.5, y + 26);
    ctx.lineTo(x + 62, y + 16);
    ctx.lineTo(x + 64, y + 6);
    ctx.closePath();
  }, '#3a3f45');
}

function workbench(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.45);
  ctx.fillStyle = '#4a3322';
  ctx.fillRect(x + 3, y - 18, 3, 18);
  ctx.fillRect(x + w - 6, y - 18, 3, 18);
  ctx.fillRect(x + 3, y - 6, w - 6, 2);
  panel(ctx, x, y - 21, w, 4, '#8a5a36', 0.8);
  // drawers under
  panel(ctx, x + w - 30, y - 17, 24, 10, '#6b4428', 0.8);
  knob(ctx, x + w - 18, y - 12, 0.8, '#c9a24a');
}

function vise(ctx: Ctx, x: number, y: number) {
  box(ctx, x, y - 5, 12, 5, '#3f6fa5', 0.8);
  box(ctx, x + 1, y - 9, 4, 4, '#3f6fa5', 0.5);
  box(ctx, x + 7, y - 9, 4, 4, '#3f6fa5', 0.5);
  ctx.fillStyle = '#c9d2d9';
  ctx.fillRect(x + 12, y - 3, 5, 1);
}

function gunParts(ctx: Ctx, x: number, y: number) {
  // a pistol frame, a barrel, springs & screws
  fillRR(ctx, x, y - 3.2, 14, 3, 0.8, '#3a3f45');
  fillRR(ctx, x + 2, y - 1, 3, 1, 0.3, '#5a646e');
  fillRR(ctx, x + 18, y - 1.8, 12, 1.8, 0.8, '#6b7a82');
  ctx.strokeStyle = '#c9d2d9';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx.arc(x + 34 + i * 0.9, y - 1, 0.9, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(x + 40 + i * 1.8, y - 0.8, 0.9, 0.8);
  }
}

function grinder(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 8, 20, y + 1, 0.35);
  ctx.fillStyle = '#4a5561';
  ctx.fillRect(x + 6, y - 26, 4, 26);
  fillRR(ctx, x + 1, y - 2, 14, 2, 0.6, '#3a3f45');
  box(ctx, x + 2, y - 36, 14, 10, '#3f6a3a', 1.6);
  ctx.beginPath();
  ctx.arc(x + 8, y - 34, 5.6, 0, Math.PI * 2);
  ctx.fillStyle = '#8a8478';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8, y - 34, 5.6, Math.PI, 0);
  ctx.fillStyle = '#3f6a3a';
  ctx.fill();
  // guard
  box(ctx, x + 13, y - 38, 3, 3, '#c9d2d9', 0.5);
}

function toolChest(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 11, 26, y + 1, 0.4);
  panel(ctx, x, y - 34, 22, 34, '#c7433b', 1.4);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = rgba('#000', 0.3);
    ctx.fillRect(x + 1.4, y - 30 + i * 6, 19.2, 0.6);
    fillRR(ctx, x + 6, y - 28 + i * 6, 10, 1.2, 0.5, '#e8e2d4');
  }
  box(ctx, x - 1, y - 38, 24, 4, '#a8332c', 1.2);
  fillRR(ctx, x + 7, y - 40, 8, 2, 0.8, '#3a3f45');
}

function safetyPoster(ctx: Ctx, x: number, y: number, lang: string) {
  poster(ctx, x, y, 32, 40, '#f2c230', (px, py, pw, ph) => {
    ctx.fillStyle = '#1a1a1a';
    // goggles icon
    ctx.beginPath();
    ctx.arc(px + pw / 2 - 5, py + 14, 4, 0, Math.PI * 2);
    ctx.arc(px + pw / 2 + 5, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.arc(px + pw / 2 - 5, py + 14, 2.6, 0, Math.PI * 2);
    ctx.arc(px + pw / 2 + 5, py + 14, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(px + 2, py + 13, pw - 4, 1.4);
    posterText(ctx, L(lang, 'БЕРЕГИ', 'PROTECT'), px + pw / 2, py + ph - 13, 4.2, '#1a1a1a');
    posterText(ctx, L(lang, 'ГЛАЗА!', 'YOUR EYES!'), px + pw / 2, py + ph - 7, 4.6, '#c7433b', 800);
  });
}

function blueprint(ctx: Ctx, x: number, y: number, w: number, h: number, lang: string) {
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = '#1f4a8a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba('#bfe0ff', 0.18);
  ctx.lineWidth = 0.3;
  for (let gx = x; gx < x + w; gx += 4) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 4) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  // laser pistol schematic
  ctx.strokeStyle = rgba('#e8f4ff', 0.9);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 12);
  ctx.lineTo(x + 46, y + 12);
  ctx.lineTo(x + 50, y + 15);
  ctx.lineTo(x + 46, y + 18);
  ctx.lineTo(x + 26, y + 18);
  ctx.lineTo(x + 24, y + 28);
  ctx.lineTo(x + 17, y + 28);
  ctx.lineTo(x + 18, y + 18);
  ctx.lineTo(x + 10, y + 18);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 34, y + 15, 2.4, 0, Math.PI * 2);
  ctx.moveTo(x + 50, y + 15);
  ctx.lineTo(x + 58, y + 15);
  ctx.stroke();
  ctx.setLineDash([1, 1]);
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 32);
  ctx.lineTo(x + 50, y + 32);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 3px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8f4ff';
  ctx.fillText(L(lang, 'ЛАЗЕРНЫЙ ПИСТОЛЕТ Мк.2', 'LASER PISTOL Mk.2'), x + 3, y + 5);
}

function lathe(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 36, 80, y + 1, 0.5);
  panel(ctx, x, y - 22, 72, 22, '#5f7a6a', 1.6);
  hazard(ctx, x + 2, y - 4, 68, 2, '#f2c230', '#26282b', 3);
  // headstock
  panel(ctx, x + 2, y - 44, 22, 22, '#6f8a7a', 1.6);
  gauge(ctx, x + 18, y - 38, 2.6, 0.4);
  // chuck
  ctx.beginPath();
  ctx.arc(x + 14, y - 34, 6.8, 0, Math.PI * 2);
  ctx.fillStyle = '#9aa7b0';
  ctx.fill();
  // bed & workpiece
  box(ctx, x + 24, y - 28, 46, 5, '#3a3f45', 0.8);
  ctx.fillStyle = hgrad(ctx, x, x + 40, [
    [0, '#c9d2d9'],
    [1, '#8a959e'],
  ]);
  ctx.fillRect(x + 21, y - 35.2, 32, 2.4);
  // tailstock
  box(ctx, x + 56, y - 40, 12, 12, '#6f8a7a', 1.4);
  ctx.fillStyle = '#c9d2d9';
  ctx.fillRect(x + 52, y - 35, 4, 1.6);
}

function weldTable(ctx: Ctx, x: number, y: number) {
  steelTable(ctx, x, y, 56, 18, '#5a646e', '#3a3f45');
  // workpiece: a bent pipe frame
  ctx.strokeStyle = '#8a959e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 20);
  ctx.lineTo(x + 30, y - 20);
  ctx.lineTo(x + 38, y - 28);
  ctx.stroke();
  // welding cables
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 32, y - 22);
  ctx.bezierCurveTo(x + 50, y - 6, x + 60, y - 30, x + 66, y - 42);
  ctx.stroke();
}

function weldMask(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x - 0.5, y - 6, 1, 3);
  fillRR(ctx, x - 6, y - 3, 12, 14, 4, '#2a2d31');
  fillRR(ctx, x - 4, y + 1, 8, 3, 0.6, '#3a5a3a');
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.fillRect(x - 3.4, y + 1.4, 3, 0.6);
}

function anvil(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 30, y + 1, 0.45);
  box(ctx, x + 4, y - 12, 16, 12, '#6b4a32', 1);
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 24, y - 20);
  ctx.lineTo(x + 24, y - 16);
  ctx.lineTo(x + 18, y - 14);
  ctx.lineTo(x + 18, y - 12);
  ctx.lineTo(x + 6, y - 12);
  ctx.lineTo(x + 6, y - 14);
  ctx.quadraticCurveTo(x - 6, y - 16, x - 8, y - 19);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 20, y - 12, [
    [0, '#6d7883'],
    [1, '#2a2f35'],
  ]);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(x, y - 20, 24, 0.7);
  // hammer on top
  fillRR(ctx, x + 6, y - 23, 12, 2, 0.8, '#6b4a32');
  fillRR(ctx, x + 16, y - 25, 4, 5, 0.8, '#3a3f45');
}

// ================================================================== OUTFIT WORKSHOP
export function outfitsStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      fabricShelf(ctx, mx + 20, 30, 66);
      for (let i = 0; i < 2; i++) {
        sewingTable(ctx, mx + 22 + i * 62, B);
      }
      threadRack(ctx, mx + 150, 30);
      mannequin(ctx, mx + 176, B, '#c7433b', '#f2c230');
    } else if (v === 1) {
      for (let i = 0; i < 3; i++) mannequin(ctx, mx + 30 + i * 26, B, ['#2f6fb8', '#8a5ac8', '#3f8a5a'][i], ['#f2c230', '#f4efe0', '#c9a24a'][i]);
      standMirror(ctx, mx + 118, B);
      foldingScreen(ctx, mx + 146, B);
    } else {
      cuttingTable(ctx, mx + 20, B);
      clothesRail(ctx, mx + 96, B, 56);
      ironingBoard(ctx, mx + 160, B);
      sketches(ctx, mx + 24, 30, lang);
    }
  }
}

export function outfitsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 2; i++) {
        const nx = mx + 22 + i * 62 + 20;
        const k = active ? Math.abs(Math.sin(t * 22 + i)) : 0;
        ctx.fillStyle = '#c9d2d9';
        ctx.fillRect(nx, B - 30 + k * 2, 0.5, 3);
        // fabric sliding
        if (active) {
          const off = (t * 4 + i * 3) % 8;
          ctx.fillStyle = rgba('#000', 0.15);
          ctx.fillRect(nx - 10 + off, B - 22.2, 1, 0.6);
        }
      }
    } else if (v === 1) {
      // mirror sheen sweep
      const k = (t * 0.25) % 1;
      ctx.save();
      rrect(ctx, mx + 121, B - 60, 18, 44, 8);
      ctx.clip();
      ctx.fillStyle = rgba('#ffffff', 0.18);
      ctx.beginPath();
      ctx.moveTo(mx + 110 + k * 50, B - 60);
      ctx.lineTo(mx + 116 + k * 50, B - 60);
      ctx.lineTo(mx + 100 + k * 50, B - 16);
      ctx.lineTo(mx + 94 + k * 50, B - 16);
      ctx.fill();
      ctx.restore();
    } else if (active) {
      // iron steam
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.7 + i / 3) % 1;
        ctx.beginPath();
        ctx.arc(mx + 176 + Math.sin(ph * 6 + i) * 1.5, B - 26 - ph * 10, 1.4 + ph * 2, 0, Math.PI * 2);
        ctx.fillStyle = rgba('#ffffff', 0.25 * (1 - ph));
        ctx.fill();
      }
    }
  }
}

function fabricShelf(ctx: Ctx, x: number, y: number, w: number) {
  wallShelf(ctx, x, y + 12, w, '#6b442b');
  wallShelf(ctx, x, y + 26, w, '#6b442b');
  const cols = ['#c7433b', '#2f6fb8', '#f2c230', '#8a5ac8', '#3f8a5a', '#f4efe0', '#e88ab0', '#2a2d31'];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 6; i++) {
      const c = cols[(i + r * 3) % cols.length];
      const rx = x + 3 + i * 10.4;
      const ry = y + 12 + r * 14;
      fillRR(ctx, rx, ry - 8, 9, 8, 3.6, vgrad(ctx, ry - 8, ry, [
        [0, shade(c, 0.2)],
        [1, shade(c, -0.25)],
      ]));
      ctx.beginPath();
      ctx.arc(rx + 4.5, ry - 4, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = shade(c, -0.4);
      ctx.fill();
    }
  }
}

function sewingTable(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1, 0.4);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x + 3, y - 18, 2, 18);
  ctx.fillRect(x + 39, y - 18, 2, 18);
  // treadle
  ctx.beginPath();
  ctx.arc(x + 36, y - 8, 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  fillRR(ctx, x + 10, y - 3, 14, 2, 0.6, '#2a2d31');
  panel(ctx, x, y - 21, 44, 3, '#8a5c3d', 0.8);
  // machine body
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 21);
  ctx.lineTo(x + 8, y - 34);
  ctx.quadraticCurveTo(x + 8, y - 38, x + 13, y - 38);
  ctx.lineTo(x + 26, y - 38);
  ctx.quadraticCurveTo(x + 30, y - 38, x + 30, y - 34);
  ctx.lineTo(x + 30, y - 27);
  ctx.lineTo(x + 13, y - 27);
  ctx.lineTo(x + 13, y - 21);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 38, y - 21, [
    [0, '#3a3f45'],
    [1, '#16181c'],
  ]);
  ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x + 14, y - 36, 12, 0.8);
  ctx.beginPath();
  ctx.arc(x + 9, y - 30, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#9aa7b0';
  ctx.fill();
  // fabric on the table
  ctx.fillStyle = '#c7433b';
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 21.4);
  ctx.lineTo(x + 40, y - 21.4);
  ctx.lineTo(x + 46, y - 14);
  ctx.lineTo(x + 38, y - 12);
  ctx.lineTo(x + 34, y - 21);
  ctx.closePath();
  ctx.fill();
}

function threadRack(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y, 20, 30, 1, '#8a5c3d');
  const cols = ['#c7433b', '#2f6fb8', '#f2c230', '#8a5ac8', '#3f8a5a', '#f4efe0', '#e88ab0', '#2a2d31', '#f28a2a'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const sx = x + 3 + c * 5.6;
      const sy = y + 4 + r * 9;
      fillRR(ctx, sx, sy, 3.6, 6, 0.8, cols[(r * 3 + c) % cols.length]);
      ctx.fillStyle = '#d9c29a';
      ctx.fillRect(sx - 0.4, sy - 0.6, 4.4, 0.8);
      ctx.fillRect(sx - 0.4, sy + 5.8, 4.4, 0.8);
    }
  }
}

function standMirror(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 26, y + 1, 0.35);
  fillRR(ctx, x + 1, y - 64, 22, 52, 10, '#c9a24a');
  fillRR(ctx, x + 3, y - 62, 18, 48, 8, rgrad(ctx, x + 12, y - 40, 0, 26, [
    [0, '#dfeff4'],
    [1, '#8aa8b4'],
  ]));
  ctx.fillStyle = '#6b4428';
  ctx.fillRect(x + 4, y - 12, 2, 12);
  ctx.fillRect(x + 18, y - 12, 2, 12);
}

function foldingScreen(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1, 0.4);
  for (let i = 0; i < 3; i++) {
    const px = x + i * 15;
    const skew = i % 2 ? -2 : 2;
    ctx.beginPath();
    ctx.moveTo(px, y - 2);
    ctx.lineTo(px, y - 58);
    ctx.lineTo(px + 14, y - 58 + skew);
    ctx.lineTo(px + 14, y - 2 + skew * 0.3);
    ctx.closePath();
    ctx.fillStyle = hgrad(ctx, px, px + 14, [
      [0, i % 2 ? '#c98a9a' : '#e8b0bc'],
      [1, i % 2 ? '#e8b0bc' : '#c98a9a'],
    ]);
    ctx.fill();
    ctx.strokeStyle = '#6b442b';
    ctx.lineWidth = 1;
    ctx.stroke();
    // cherry blossom motif
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = rgba('#ffffff', 0.7);
      ctx.beginPath();
      ctx.arc(px + 4 + ((k * 5) % 8), y - 50 + k * 10, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // clothes thrown over the screen (gag: a vault suit)
  ctx.fillStyle = '#2f6fb8';
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 58);
  ctx.lineTo(x + 20, y - 58);
  ctx.lineTo(x + 22, y - 44);
  ctx.lineTo(x + 18, y - 46);
  ctx.lineTo(x + 16, y - 56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x + 17, y - 57, 0.8, 8);
}

function cuttingTable(ctx: Ctx, x: number, y: number) {
  steelTable(ctx, x, y, 66, 18, '#d9c29a', '#6b442b');
  // pattern paper
  ctx.fillStyle = '#f4efe0';
  ctx.fillRect(x + 6, y - 20, 34, 1);
  ctx.strokeStyle = '#3a6ea5';
  ctx.lineWidth = 0.4;
  ctx.setLineDash([0.8, 0.8]);
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 20.4);
  ctx.lineTo(x + 38, y - 20.4);
  ctx.stroke();
  ctx.setLineDash([]);
  // scissors
  ctx.strokeStyle = '#3a3f45';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(x + 46, y - 21.2, 1.2, 0, Math.PI * 2);
  ctx.arc(x + 49, y - 21.2, 1.2, 0, Math.PI * 2);
  ctx.moveTo(x + 47, y - 22);
  ctx.lineTo(x + 56, y - 23.4);
  ctx.stroke();
  // measuring tape
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.moveTo(x + 58, y - 20);
  ctx.bezierCurveTo(x + 66, y - 20, x + 70, y - 12, x + 64, y - 6);
  ctx.lineTo(x + 63, y - 7);
  ctx.bezierCurveTo(x + 68, y - 12, x + 64, y - 19, x + 58, y - 19);
  ctx.fill();
}

function clothesRail(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.35);
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x, y - 56, 1.4, 54);
  ctx.fillRect(x + w - 1.4, y - 56, 1.4, 54);
  ctx.fillRect(x, y - 56, w, 1.4);
  for (const wx of [x, x + w]) {
    ctx.beginPath();
    ctx.arc(wx, y - 1.4, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
  }
  const cols = ['#c7433b', '#2f6fb8', '#e8e2d4', '#3f8a5a', '#8a5ac8', '#2a2d31', '#f2c230'];
  for (let i = 0; i < 7; i++) {
    const hx = x + 5 + i * ((w - 10) / 6);
    ctx.strokeStyle = '#6d7883';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(hx, y - 55);
    ctx.lineTo(hx, y - 53);
    ctx.moveTo(hx - 3, y - 50);
    ctx.lineTo(hx, y - 53);
    ctx.lineTo(hx + 3, y - 50);
    ctx.stroke();
    const c = cols[i];
    const long = i % 3 === 0;
    ctx.beginPath();
    ctx.moveTo(hx - 3.2, y - 50);
    ctx.lineTo(hx + 3.2, y - 50);
    ctx.lineTo(hx + 4, y - (long ? 22 : 34));
    ctx.lineTo(hx - 4, y - (long ? 22 : 34));
    ctx.closePath();
    ctx.fillStyle = hgrad(ctx, hx - 4, hx + 4, [
      [0, shade(c, -0.25)],
      [0.5, shade(c, 0.1)],
      [1, shade(c, -0.3)],
    ]);
    ctx.fill();
  }
}

function ironingBoard(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 14, 30, y + 1, 0.3);
  ctx.strokeStyle = '#6d7883';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 22, y - 20);
  ctx.moveTo(x + 22, y);
  ctx.lineTo(x + 4, y - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 20);
  ctx.lineTo(x + 26, y - 20);
  ctx.quadraticCurveTo(x + 32, y - 21, x + 26, y - 23);
  ctx.lineTo(x - 2, y - 23);
  ctx.closePath();
  ctx.fillStyle = '#9ad0e0';
  ctx.fill();
  // iron
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 23);
  ctx.lineTo(x + 22, y - 23);
  ctx.quadraticCurveTo(x + 22, y - 27, x + 16, y - 27);
  ctx.closePath();
  ctx.fillStyle = '#e8e2d4';
  ctx.fill();
  fillRR(ctx, x + 14, y - 30, 6, 2, 0.8, '#c7433b');
}

function sketches(ctx: Ctx, x: number, y: number, lang: string) {
  for (let i = 0; i < 3; i++) {
    const sx = x + i * 16;
    ctx.save();
    ctx.translate(sx + 6, y + 10);
    ctx.rotate((i - 1) * 0.06);
    ctx.fillStyle = rgba('#000', 0.2);
    ctx.fillRect(-6 + 0.8, -10 + 0.8, 12, 17);
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(-6, -10, 12, 17);
    // fashion figure
    ctx.strokeStyle = '#3a2a20';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.arc(0, -6, 1.4, 0, Math.PI * 2);
    ctx.moveTo(0, -4.6);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = ['#c7433b', '#2f6fb8', '#8a5ac8'][i];
    ctx.beginPath();
    ctx.moveTo(-1.6, -4);
    ctx.lineTo(1.6, -4);
    ctx.lineTo(3.6, 4);
    ctx.lineTo(-3.6, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c7433b';
    ctx.beginPath();
    ctx.arc(sx + 6, y, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  void lang;
}

// ================================================================== WEIGHT ROOM (STR)
export function gymStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      plateTree(ctx, mx + 20, B);
      benchPress(ctx, mx + 48, B, level);
      bagMount(ctx, mx + 128);
      strPoster(ctx, mx + 150, 28, lang, 0);
    } else if (v === 1) {
      wallMirror(ctx, mx + 18, 26, 110, 48);
      dumbbellRack(ctx, mx + 22, B, 100);
      kettlebells(ctx, mx + 136, B);
      pullupBar(ctx, mx + 168, B);
    } else {
      tire(ctx, mx + 22, B);
      sledge(ctx, mx + 70, B);
      climbRope(ctx, mx + 98);
      recordBoard(ctx, mx + 122, 30, lang);
      chalkBowl(ctx, mx + 170, B);
    }
  }
}

export function gymDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      const sw = active ? Math.sin(t * 2.2) * 0.12 : Math.sin(t * 0.8) * 0.02;
      ctx.save();
      ctx.translate(mx + 132, WALL_TOP + 2);
      ctx.rotate(sw);
      ctx.strokeStyle = '#2a2d31';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 14);
      ctx.stroke();
      fillRR(ctx, -6, 14, 12, 34, 5, hgrad(ctx, -6, 6, [
        [0, '#7a1e18'],
        [0.4, '#d6453c'],
        [1, '#6a1a14'],
      ]));
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-6, 20, 12, 1.4);
      ctx.fillRect(-6, 40, 12, 1.4);
      ctx.restore();
    } else if (v === 2) {
      const sw = Math.sin(t * 1.3) * (active ? 0.05 : 0.015);
      ctx.save();
      ctx.translate(mx + 104, WALL_TOP);
      ctx.rotate(sw);
      ctx.strokeStyle = '#c9a26a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 72);
      ctx.stroke();
      ctx.strokeStyle = rgba('#6b4a2a', 0.6);
      ctx.lineWidth = 0.5;
      for (let y = 2; y < 72; y += 3) {
        ctx.beginPath();
        ctx.moveTo(-1, y);
        ctx.lineTo(1, y + 1.4);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 74, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a26a';
      ctx.fill();
      ctx.restore();
    }
  }
}

function plateTree(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.4);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x + 11, y - 44, 2.4, 44);
  fillRR(ctx, x + 2, y - 2, 20, 2, 0.6, '#1a1a1a');
  const sizes = [10, 8.4, 7, 5.6];
  sizes.forEach((r, i) => {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + 12 + s * 5.6, y - 10 - i * 10, 2, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#c7433b' : i === 1 ? '#2f6fb8' : i === 2 ? '#f2c230' : '#3f8a5a';
      ctx.fill();
      ctx.strokeStyle = rgba('#000', 0.4);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  });
}

function benchPress(ctx: Ctx, x: number, y: number, level: number) {
  propShadow(ctx, x + 32, 70, y + 1, 0.45);
  // uprights
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x + 4, y - 40, 3, 40);
  ctx.fillRect(x + 58, y - 40, 3, 40);
  ctx.fillRect(x + 2, y - 30, 7, 2);
  ctx.fillRect(x + 56, y - 30, 7, 2);
  // bench
  fillRR(ctx, x + 14, y - 14, 36, 4, 1.6, '#c7433b');
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 18, y - 10, 2, 10);
  ctx.fillRect(x + 44, y - 10, 2, 10);
  // barbell on the rack
  ctx.fillStyle = hgrad(ctx, x, x + 64, [
    [0, '#8a959e'],
    [0.5, '#e8eef0'],
    [1, '#8a959e'],
  ]);
  ctx.fillRect(x - 6, y - 32.8, 78, 1.6);
  const plates = level >= 3 ? 3 : level >= 2 ? 2 : 1;
  for (let i = 0; i < plates; i++) {
    for (const px of [x - 2 + i * 3, x + 65 - i * 3]) {
      fillRR(ctx, px - 1.2, y - 32 - (8 - i), 2.4, (8 - i) * 2, 0.8, ['#1a1a1a', '#c7433b', '#2f6fb8'][i]);
    }
  }
}

function bagMount(ctx: Ctx, x: number) {
  fillRR(ctx, x - 2, WALL_TOP - 1, 12, 3, 1, '#2a2d31');
}

function strPoster(ctx: Ctx, x: number, y: number, lang: string, k: number) {
  poster(ctx, x, y, 34, 42, '#c7433b', (px, py, pw, ph) => {
    ctx.fillStyle = '#f4efe0';
    // dumbbell icon
    ctx.fillRect(px + 8, py + 13, 18, 2.6);
    fillRR(ctx, px + 5, py + 8, 5, 12, 1, '#f4efe0');
    fillRR(ctx, px + 24, py + 8, 5, 12, 1, '#f4efe0');
    posterText(ctx, k ? L(lang, 'ЗАРЯДКА!', 'CARDIO!') : L(lang, 'СИЛА!', 'POWER!'), px + pw / 2, py + ph - 10, k ? 5 : 6, '#f4efe0', 800);
    ctx.fillStyle = rgba('#f4efe0', 0.6);
    ctx.fillRect(px + 6, py + ph - 5, pw - 12, 0.8);
  });
}

function wallMirror(ctx: Ctx, x: number, y: number, w: number, h: number) {
  fillRR(ctx, x - 1, y - 1, w + 2, h + 2, 1, '#9aa7b0');
  ctx.fillStyle = vgrad(ctx, y, y + h, [
    [0, '#aec4cc'],
    [1, '#6f8a94'],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba('#ffffff', 0.18);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 14 + i * 36, y + h);
    ctx.lineTo(x + 30 + i * 36, y);
    ctx.lineTo(x + 36 + i * 36, y);
    ctx.lineTo(x + 20 + i * 36, y + h);
    ctx.fill();
  }
}

function dumbbellRack(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.45);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x + 2, y - 20, 2.4, 20);
  ctx.fillRect(x + w - 4.4, y - 20, 2.4, 20);
  for (let r = 0; r < 2; r++) {
    const ry = y - 18 + r * 10;
    fillRR(ctx, x, ry, w, 2, 0.8, '#3a3f45');
    const n = 7;
    for (let i = 0; i < n; i++) {
      const dx = x + 4 + i * ((w - 8) / n);
      const s = 1 + ((n - i) / n) * 0.8 + r * 0.2;
      ctx.fillStyle = '#9aa7b0';
      ctx.fillRect(dx + 2, ry - 1.8 * s, 6, 1);
      fillRR(ctx, dx, ry - 3 * s, 2.6, 3 * s, 0.6, '#1a1a1a');
      fillRR(ctx, dx + 7.4, ry - 3 * s, 2.6, 3 * s, 0.6, '#1a1a1a');
    }
  }
}

function kettlebells(ctx: Ctx, x: number, y: number) {
  const ws = [16, 24, 32];
  ws.forEach((kg, i) => {
    const s = 0.8 + i * 0.2;
    const kx = x + i * 11;
    propShadow(ctx, kx + 4, 10 * s, y + 1, 0.4);
    ctx.beginPath();
    ctx.arc(kx + 4, y - 4 * s, 4.2 * s, 0, Math.PI * 2);
    ctx.fillStyle = rgrad(ctx, kx + 3, y - 5 * s, 0, 5 * s, [
      [0, '#6d7883'],
      [1, '#1a1c20'],
    ]);
    ctx.fill();
    ctx.strokeStyle = '#2a2d31';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.arc(kx + 4, y - 8.6 * s, 2.4 * s, Math.PI, 0);
    ctx.stroke();
    ctx.font = `700 ${2.6 * s}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2c230';
    ctx.fillText(String(kg), kx + 4, y - 3.4 * s);
  });
}

function pullupBar(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 30, y + 1, 0.35);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x, y - 70, 2.4, 70);
  ctx.fillRect(x + 22, y - 70, 2.4, 70);
  ctx.fillStyle = hgrad(ctx, x, x + 24, [
    [0, '#8a959e'],
    [0.5, '#e8eef0'],
    [1, '#8a959e'],
  ]);
  ctx.fillRect(x - 2, y - 66, 28, 1.6);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#6b4a32';
    ctx.fillRect(x + 2.4, y - 50 + i * 9, 19.6, 1.2);
  }
}

function tire(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1, 0.5);
  ctx.beginPath();
  ctx.ellipse(x + 22, y - 18, 22, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x + 18, y - 22, 4, 24, [
    [0, '#3a3a3a'],
    [1, '#101010'],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 22, y - 18, 10, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#6a625a';
  ctx.fill();
  ctx.strokeStyle = rgba('#5a5a5a', 0.8);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + 22 + Math.cos(a) * 14, y - 18 + Math.sin(a) * 11.5);
    ctx.lineTo(x + 22 + Math.cos(a) * 20, y - 18 + Math.sin(a) * 16.5);
    ctx.stroke();
  }
}

function sledge(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.25);
  fillRR(ctx, -1, -36, 2.4, 36, 1, '#8a6a3a');
  fillRR(ctx, -5, -40, 10, 6, 1, '#3a3f45');
  ctx.restore();
}

function climbRope(ctx: Ctx, x: number) {
  fillRR(ctx, x + 2, WALL_TOP - 1, 8, 3, 1, '#2a2d31');
}

function recordBoard(ctx: Ctx, x: number, y: number, lang: string) {
  chalkboard(ctx, x, y, 40, 30, (bx, by) => {
    chalkText(ctx, L(lang, 'РЕКОРДЫ', 'RECORDS'), bx + 20, by + 4, 3.8, 'center');
    const rows = lang === 'ru' ? ['Жим: 140', 'Гиря: 88 раз', 'Шина: 12 м', 'Кот: 0 кг'] : ['Bench: 140', 'Kettle: 88x', 'Tire: 12 m', 'Cat: 0 kg'];
    rows.forEach((s, i) => chalkText(ctx, s, bx + 3, by + 10 + i * 5, 3.2));
  }, '#2a2a2a');
}

function chalkBowl(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 6, 14, y + 1, 0.35);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 5, y - 20, 2, 20);
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 21, 7, 2.4, 0, 0, Math.PI);
  ctx.fillStyle = '#6d7883';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 21, 6, 1.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f4f0';
  ctx.fill();
}

// ================================================================== SHOOTING RANGE (PER)
export function armoryStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 3; i++) silhouetteTarget(ctx, mx + 38 + i * 56, 28);
      shootingBench(ctx, mx + 16, B, 178);
      earMuffs(ctx, mx + 186, 50);
    } else if (v === 1) {
      rifleCabinet(ctx, mx + 20, B, level);
      sandbags(ctx, mx + 80, B, 60);
      for (let r = 0; r < 2; r++) metalCrate(ctx, mx + 150 + r * 4, B - 12 - r * 12, 20, 12, '#5f7a5a', L(lang, 'ПАТРОНЫ', 'AMMO'));
      crate(ctx, mx + 172, B - 14, 18, 14);
      for (let i = 0; i < 2; i++) bullseye(ctx, mx + 96 + i * 30, 44, 7);
    } else {
      targetTrack(ctx, mx + 18, 40, 170);
      scoreboard(ctx, mx + 70, 22, lang);
      binocularStand(ctx, mx + 176, B);
    }
  }
}

export function armoryDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 2) {
      // ducks travelling along the track
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx + 18, 40, 170, 30);
      ctx.clip();
      for (let i = 0; i < 5; i++) {
        const x = mx + 18 + ((i * 40 + t * (active ? 22 : 4)) % 200) - 10;
        const hit = active && Math.sin(t * 3 + i * 2) > 0.92;
        duck(ctx, x, 60, hit);
      }
      ctx.restore();
      // scoreboard digits flicker
      const acc = 90 + Math.floor((Math.sin(t * 0.3) + 1) * 4.5);
      ctx.font = '700 5px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff5a4a';
      ctx.fillText(`${acc}%`, mx + 118, 30.5);
    } else if (v === 0 && active) {
      // bullet hole puffs on the targets
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.7 + i * 0.33) % 1;
        if (ph < 0.2) {
          ctx.fillStyle = rgba('#ffffff', 0.6 * (1 - ph * 5));
          ctx.beginPath();
          ctx.arc(mx + 52 + i * 60 + Math.sin(i * 7) * 3, 44 + Math.cos(i * 5) * 4, 1 + ph * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function silhouetteTarget(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 9, y - 10, 1, 10);
  fillRR(ctx, x, y, 20, 32, 0.6, '#f4efe0');
  ctx.fillStyle = '#2a2d31';
  ctx.beginPath();
  ctx.arc(x + 10, y + 7, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 30);
  ctx.quadraticCurveTo(x + 3, y + 12, x + 10, y + 12);
  ctx.quadraticCurveTo(x + 17, y + 12, x + 17, y + 30);
  ctx.fill();
  ctx.strokeStyle = '#f4efe0';
  ctx.lineWidth = 0.4;
  for (const r of [2, 4, 6]) {
    ctx.beginPath();
    ctx.arc(x + 10, y + 20, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#e84a3c';
  for (const [hx, hy] of [
    [9, 19],
    [11.4, 21],
    [10, 8],
  ]) {
    ctx.beginPath();
    ctx.arc(x + hx, y + hy, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function shootingBench(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  // booth partitions
  for (let i = 0; i <= 3; i++) {
    const px = x + i * ((w - 4) / 3);
    panel(ctx, px, y - 44, 4, 44, '#5a646e', 0.8);
    ctx.fillStyle = rgba('#dff3ff', 0.18);
    ctx.fillRect(px + 0.6, y - 42, 2.8, 16);
  }
  // counter
  panel(ctx, x, y - 20, w, 4, '#8a5a36', 0.8);
  panel(ctx, x + 2, y - 16, w - 4, 16, '#4a3322', 0.8);
  ctx.fillStyle = rgba('#000', 0.25);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 8 + i * ((w - 4) / 3), y - 12, (w - 4) / 3 - 12, 0.6);
  // brass shells on the counter
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(x + 12 + ((i * 19) % (w - 20)), y - 21, 1.8, 0.9);
  }
  hazard(ctx, x, y - 3, w, 2, '#f2c230', '#26282b', 3);
}

function earMuffs(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 4.4, y - 4, 1, 3);
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + 5, y + 4, 4, Math.PI, 0);
  ctx.stroke();
  fillRR(ctx, x - 0.6, y + 3, 3.2, 5, 1.2, '#f2c230');
  fillRR(ctx, x + 7.4, y + 3, 3.2, 5, 1.2, '#f2c230');
}

function rifleCabinet(ctx: Ctx, x: number, y: number, level: number) {
  propShadow(ctx, x + 24, 54, y + 1, 0.45);
  panel(ctx, x, y - 64, 48, 64, '#4a5a4a', 1.6);
  fillRR(ctx, x + 3, y - 60, 42, 44, 1, '#1a1f1a');
  gunRack(ctx, x + 4, y - 56, 40);
  ctx.fillStyle = rgba('#dff3ff', 0.1);
  ctx.fillRect(x + 3, y - 60, 42, 44);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x + 22, y - 12, 4, 4);
  void level;
}

function sandbags(ctx: Ctx, x: number, y: number, w: number) {
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < Math.floor(w / 12) - (r === 2 ? 1 : 0); i++) {
      const sx = x + i * 12 + (r % 2) * 6;
      const sy = y - 6 - r * 5.4;
      ctx.beginPath();
      ctx.ellipse(sx + 6, sy + 3, 6.4, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgrad(ctx, sx + 4, sy + 1, 0, 8, [
        [0, '#d9c29a'],
        [1, '#8a7650'],
      ]);
      ctx.fill();
      ctx.strokeStyle = rgba('#5a4a30', 0.6);
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
}

function bullseye(ctx: Ctx, cx: number, cy: number, r: number) {
  const cols = ['#f4efe0', '#c7433b', '#f4efe0', '#c7433b'];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 - i * 0.24), 0, Math.PI * 2);
    ctx.fillStyle = cols[i];
    ctx.fill();
  }
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(cx - 0.5, cy + r, 1, 30);
}

function targetTrack(ctx: Ctx, x: number, y: number, w: number) {
  box(ctx, x, y + 26, w, 4, '#6b4a32', 0.8);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x, y + 25, w, 1.2);
  // painted waves in front
  ctx.fillStyle = '#2f6fb8';
  ctx.beginPath();
  ctx.moveTo(x, y + 36);
  for (let i = 0; i <= w; i += 10) ctx.quadraticCurveTo(x + i + 5, y + 26, x + i + 10, y + 34);
  ctx.lineTo(x + w, y + 38);
  ctx.lineTo(x, y + 38);
  ctx.fill();
  ctx.fillStyle = '#5fa8e8';
  ctx.fillRect(x, y + 36, w, 2);
}

function duck(ctx: Ctx, x: number, y: number, hit: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (hit) ctx.rotate(-0.9);
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.ellipse(0, -4, 5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -8, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f28a2a';
  ctx.beginPath();
  ctx.moveTo(6, -8.4);
  ctx.lineTo(9, -7.6);
  ctx.lineTo(6, -7);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(4.4, -9, 0.8, 0.8);
  ctx.fillStyle = '#6b4a32';
  ctx.fillRect(-0.6, -1, 1.2, 4);
  ctx.restore();
}

function scoreboard(ctx: Ctx, x: number, y: number, lang: string) {
  panel(ctx, x, y, 70, 14, '#1a1c20', 1.4);
  ctx.font = '700 4.4px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffcf4a';
  ctx.fillText(L(lang, 'ТОЧНОСТЬ:', 'ACCURACY:'), x + 4, y + 7);
}

function binocularStand(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x, 14, y + 1, 0.35);
  ctx.strokeStyle = '#3a3f45';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 6, y);
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y - 34);
  ctx.rotate(-0.15);
  fillRR(ctx, -8, -3, 16, 6, 2.6, '#2a2d31');
  ctx.fillStyle = '#6a8a9a';
  ctx.beginPath();
  ctx.arc(8, -1.4, 1.6, 0, Math.PI * 2);
  ctx.arc(8, 1.6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ================================================================== FITNESS (END)
export function fitnessStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      treadmill(ctx, mx + 18, B);
      treadmill(ctx, mx + 66, B);
      exerciseBike(ctx, mx + 120, B);
      exerciseBike(ctx, mx + 146, B);
      waterCooler(ctx, mx + 176, B);
    } else if (v === 1) {
      wallBars(ctx, mx + 20, B);
      rower(ctx, mx + 60, B);
      for (let i = 0; i < 3; i++) yogaMat(ctx, mx + 130 + i * 8, B, ['#8a5ac8', '#3f8a5a', '#f28a2a'][i]);
      fitBall(ctx, mx + 170, B, 9, '#2f6fb8');
      fitBall(ctx, mx + 186, B, 6, '#e8453c');
    } else {
      strPoster(ctx, mx + 24, 28, lang, 1);
      stepper(ctx, mx + 70, B);
      stepper(ctx, mx + 100, B);
      jumpRopes(ctx, mx + 136, 34);
      speaker(ctx, mx + 170, B, 18, 34, '#2a2d31');
      wallClock(ctx, mx + 118, 34, 5, 11);
    }
  }
}

export function fitnessDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      // belt movement & bike wheels & console digits
      for (const tx of [mx + 18, mx + 66]) {
        ctx.fillStyle = rgba('#ffffff', 0.25);
        const off = (t * (active ? 30 : 0)) % 6;
        for (let i = 0; i < 7; i++) ctx.fillRect(tx + 4 + ((i * 6 + off) % 38), B - 6.6, 1.4, 0.6);
        ctx.fillStyle = active ? '#6aff8c' : '#1d3a26';
        ctx.fillRect(tx + 28, B - 37, 6, 2);
      }
      for (const bx of [mx + 120, mx + 146]) {
        ctx.save();
        ctx.translate(bx + 16, B - 8);
        ctx.rotate(active ? t * 9 : 0);
        ctx.strokeStyle = '#9aa7b0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(-5.4, 0);
          ctx.lineTo(5.4, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
      // cooler bubble
      if (Math.sin(t * 0.9) > 0.9) {
        ctx.fillStyle = rgba('#ffffff', 0.7);
        ctx.beginPath();
        ctx.arc(mx + 184, B - 40 - ((t * 20) % 8), 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (v === 1) {
      const k = active ? Math.sin(t * 3) : 0;
      ctx.fillStyle = '#c9d2d9';
      ctx.fillRect(mx + 90 + k * 8, B - 16, 10, 2);
    } else if (active) {
      // speaker beat rings
      const k = Math.max(0, Math.sin(t * 8));
      ctx.strokeStyle = rgba('#ffffff', 0.25 * k);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(mx + 179, B - 11, 6 + k * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function treadmill(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 22, 50, y + 1, 0.45);
  fillRR(ctx, x, y - 8, 46, 6, 2.4, '#2a2d31');
  ctx.fillStyle = '#16181c';
  ctx.fillRect(x + 3, y - 7, 40, 1.4);
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 32, y - 36, 2.4, 28);
  ctx.fillRect(x + 40, y - 36, 2.4, 28);
  panel(ctx, x + 26, y - 42, 20, 8, '#3a3f45', 1.2);
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x + 22, y - 30, 24, 1.6);
}

function exerciseBike(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.4);
  ctx.strokeStyle = '#2f6fb8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 2);
  ctx.lineTo(x + 8, y - 20);
  ctx.lineTo(x + 20, y - 18);
  ctx.lineTo(x + 22, y - 2);
  ctx.moveTo(x + 8, y - 20);
  ctx.lineTo(x + 6, y - 26);
  ctx.moveTo(x + 20, y - 18);
  ctx.lineTo(x + 22, y - 30);
  ctx.stroke();
  fillRR(ctx, x + 2, y - 28, 8, 2.6, 1.2, '#2a2d31');
  ctx.strokeStyle = '#2a2d31';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 31);
  ctx.lineTo(x + 26, y - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 16, y - 8, 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#3a3f45';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  fillRR(ctx, x, y - 2, 26, 2, 0.8, '#3a3f45');
}

function waterCooler(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 7, 16, y + 1, 0.35);
  panel(ctx, x, y - 30, 14, 30, '#e8eef0', 1.4);
  fillRR(ctx, x + 1, y - 46, 12, 16, 4, rgba('#8fd8ff', 0.6));
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.fillRect(x + 3, y - 44, 1, 12);
  ctx.fillStyle = '#e84a3c';
  ctx.fillRect(x + 3, y - 24, 2, 2);
  ctx.fillStyle = '#2f6fb8';
  ctx.fillRect(x + 9, y - 24, 2, 2);
}

function wallBars(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 16, 36, y + 1, 0.3);
  ctx.fillStyle = '#8a5a36';
  ctx.fillRect(x, y - 74, 3, 74);
  ctx.fillRect(x + 30, y - 74, 3, 74);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = hgrad(ctx, x, x + 33, [
      [0, '#b88a5a'],
      [0.5, '#e0b88a'],
      [1, '#b88a5a'],
    ]);
    ctx.fillRect(x + 3, y - 70 + i * 6.6, 27, 1.8);
  }
}

function rower(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 30, 64, y + 1, 0.4);
  fillRR(ctx, x, y - 4, 60, 3, 1.4, '#3a3f45');
  ctx.beginPath();
  ctx.arc(x + 54, y - 10, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2d31';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 54, y - 10, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#6d7883';
  ctx.fill();
  fillRR(ctx, x + 36, y - 10, 10, 2, 0.8, '#2a2d31');
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 2, y - 2, 2, 2);
}

function yogaMat(ctx: Ctx, x: number, y: number, c: string) {
  fillRR(ctx, x, y - 28, 6, 28, 3, vgrad(ctx, y - 28, y, [
    [0, shade(c, 0.2)],
    [1, shade(c, -0.25)],
  ]));
  ctx.beginPath();
  ctx.arc(x + 3, y - 28, 3, 0, Math.PI * 2);
  ctx.fillStyle = shade(c, -0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 3, y - 28, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = shade(c, 0.2);
  ctx.fill();
}

function fitBall(ctx: Ctx, x: number, y: number, r: number, c: string) {
  propShadow(ctx, x, r * 2.4, y + 1, 0.4);
  ctx.beginPath();
  ctx.arc(x, y - r, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - r * 0.35, y - r * 1.35, 0, r * 1.2, [
    [0, shade(c, 0.45)],
    [1, shade(c, -0.3)],
  ]);
  ctx.fill();
}

function stepper(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.4);
  fillRR(ctx, x, y - 3, 24, 3, 1, '#2a2d31');
  fillRR(ctx, x + 2, y - 8, 9, 3, 1, '#f28a2a');
  fillRR(ctx, x + 13, y - 6, 9, 3, 1, '#f28a2a');
  ctx.fillStyle = '#6d7883';
  ctx.fillRect(x + 11, y - 34, 2, 31);
  ctx.fillRect(x + 4, y - 34, 16, 1.6);
}

function jumpRopes(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y, 26, 2, 0.6, '#6b4a32');
  const cols = ['#e8453c', '#2f6fb8', '#3f8a5a'];
  cols.forEach((c, i) => {
    const hx = x + 5 + i * 8;
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx - 1.5, y + 2);
    ctx.quadraticCurveTo(hx, y + 26, hx + 1.5, y + 2);
    ctx.stroke();
    fillRR(ctx, hx - 2.4, y + 2, 1.8, 5, 0.8, '#2a2d31');
    fillRR(ctx, hx + 0.8, y + 2, 1.8, 5, 0.8, '#2a2d31');
  });
}

// ================================================================== LOUNGE (CHA)
export function loungeStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      backBar(ctx, mx + 30, 30, 120);
      barCounter(ctx, mx + 30, B, 120);
      for (let i = 0; i < 5; i++) stool(ctx, mx + 42 + i * 24, B + 6, '#8a3a58');
      plant(ctx, mx + 176, B, 1.3, '#6b3a4a');
      neonSign(ctx, mx + 172, 34, L(lang, 'БАР', 'BAR'), '#ff6ad0', 6);
    } else if (v === 1) {
      stage(ctx, mx + 18, B, 120);
      piano(ctx, mx + 30, B - 6);
      micStand(ctx, mx + 100, B - 6);
      velvetCurtains(ctx, mx + 18, 120);
      for (let i = 0; i < 2; i++) wallSconce(ctx, mx + 156 + i * 26, 44, '#ffb8e0');
      plant(ctx, mx + 170, B, 1.2, '#6b3a4a');
    } else {
      sofa(ctx, mx + 22, B, 54, '#8a2a4a');
      rug(ctx, mx + 76, B + 6, 34, '#3a1a3a', '#c9a24a');
      cocktailTable(ctx, mx + 76, B);
      sofa(ctx, mx + 106, B, 42, '#5a2a6a');
      frameArt(ctx, mx + 60, 30);
      recordPlayer(ctx, mx + 164, B);
      chandelier(ctx, mx + 78, WALL_TOP);
    }
  }
}

export function loungeDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang = 'ru') {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      neonGlow(ctx, mx + 172, 34, L(lang, 'БАР', 'BAR'), '#ff6ad0', 6, active ? 0.8 + 0.2 * Math.sin(t * 5) : 0.35);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mx + 90, 44, 60, '#ff6ad0', active ? 0.1 : 0.04);
      ctx.restore();
    } else if (v === 1) {
      // spotlight cone
      if (active) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const sx = mx + 100 + Math.sin(t * 0.7) * 20;
        const g = ctx.createLinearGradient(0, WALL_TOP, 0, B);
        g.addColorStop(0, rgba('#fff4d8', 0.25));
        g.addColorStop(1, rgba('#fff4d8', 0.02));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(mx + 80, WALL_TOP);
        ctx.lineTo(mx + 86, WALL_TOP);
        ctx.lineTo(sx + 16, B);
        ctx.lineTo(sx - 16, B);
        ctx.fill();
        ctx.restore();
        // music notes
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.5 + i / 3) % 1;
          ctx.fillStyle = rgba('#ffe27a', 0.8 * (1 - ph));
          ctx.font = '700 5px Rubik, sans-serif';
          ctx.fillText('♪', mx + 50 + i * 8 + Math.sin(ph * 6) * 3, B - 40 - ph * 20);
        }
      }
    } else {
      // record spin
      ctx.save();
      ctx.translate(mx + 175, B - 24.6);
      ctx.scale(1, 0.35);
      ctx.rotate(active ? t * 4 : 0);
      ctx.fillStyle = rgba('#ffffff', 0.3);
      ctx.fillRect(-0.4, -6, 0.8, 4);
      ctx.restore();
    }
  }
}

function backBar(ctx: Ctx, x: number, y: number, w: number) {
  fillRR(ctx, x, y, w, 40, 1.4, '#2a1420');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = vgrad(ctx, y, y + 40, [
    [0, rgba('#ff6ad0', 0.15)],
    [1, rgba('#ff6ad0', 0.03)],
  ]);
  ctx.fillRect(x, y, w, 40);
  ctx.restore();
  for (let r = 0; r < 2; r++) {
    const sy = y + 16 + r * 16;
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(x + 2, sy, w - 4, 1.2);
    bottleRow(ctx, x + 4, x + w - 4, sy, ['#6fbf8a', '#c9a24a', '#8a3a58', '#5fb8e8', '#f4efe0', '#e8453c'], 11, r * 3);
  }
  // mirror sheen
  ctx.fillStyle = rgba('#ffffff', 0.05);
  ctx.fillRect(x, y, w, 6);
}

function barCounter(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.5);
  panel(ctx, x, y - 24, w, 24, '#4a2230', 1.6);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x, y - 6, w, 1.2);
  for (let i = 0; i < w / 12; i++) {
    ctx.fillStyle = rgba('#000', 0.2);
    ctx.fillRect(x + 6 + i * 12, y - 22, 0.8, 15);
  }
  panel(ctx, x - 3, y - 27, w + 6, 4, '#2a1a14', 1);
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.fillRect(x - 2, y - 26.6, w + 4, 0.6);
  // cocktail glasses
  for (let i = 0; i < 3; i++) {
    const gx = x + 20 + i * 40;
    ctx.fillStyle = rgba('#dff3ff', 0.5);
    ctx.beginPath();
    ctx.moveTo(gx - 3, y - 34);
    ctx.lineTo(gx + 3, y - 34);
    ctx.lineTo(gx, y - 30);
    ctx.fill();
    ctx.fillStyle = ['#ff6ad0', '#5fb8e8', '#ffcf4a'][i];
    ctx.beginPath();
    ctx.moveTo(gx - 2.2, y - 33.4);
    ctx.lineTo(gx + 2.2, y - 33.4);
    ctx.lineTo(gx, y - 30.8);
    ctx.fill();
    ctx.fillStyle = rgba('#dff3ff', 0.6);
    ctx.fillRect(gx - 0.3, y - 30, 0.6, 3);
    ctx.fillRect(gx - 1.6, y - 27.2, 3.2, 0.5);
  }
}

function stage(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.4);
  panel(ctx, x, y - 6, w, 6, '#3a1a2a', 1);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x, y - 6, w, 0.8);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ffcf4a' : '#ff6ad0';
    ctx.beginPath();
    ctx.arc(x + 8 + i * ((w - 16) / 7), y - 3, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function piano(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 24, 54, y + 1, 0.5);
  panel(ctx, x, y - 38, 48, 38, '#16121a', 1.8);
  ctx.fillStyle = rgba('#ffffff', 0.12);
  ctx.fillRect(x + 2, y - 36, 44, 2);
  // keyboard
  fillRR(ctx, x - 2, y - 20, 52, 5, 0.6, '#f4f1e8');
  ctx.fillStyle = '#16121a';
  for (let i = 0; i < 17; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    ctx.fillRect(x + 1 + i * 3, y - 20, 1.6, 3);
  }
  // candelabra
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x + 36, y - 46, 1, 8);
  for (const dx of [-3, 0, 3]) {
    ctx.fillStyle = '#f4efe0';
    ctx.fillRect(x + 36 + dx - 0.4, y - 50, 0.8, 3);
    ctx.fillStyle = '#ffcf4a';
    ctx.beginPath();
    ctx.arc(x + 36 + dx, y - 51, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(x + 32, y - 46, 8, 0.8);
}

function micStand(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x - 0.5, y - 34, 1, 34);
  fillRR(ctx, x - 4, y - 1, 8, 1, 0.5, '#2a2d31');
  fillRR(ctx, x - 1.6, y - 40, 3.2, 6, 1.6, '#9aa7b0');
}

function velvetCurtains(ctx: Ctx, x: number, w: number) {
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x, WALL_TOP + 2, w, 2);
  for (const side of [0, 1]) {
    const cx = side ? x + w - 16 : x;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = hgrad(ctx, cx + i * 4, cx + i * 4 + 4, [
        [0, '#5a0e22'],
        [0.5, '#a8203e'],
        [1, '#5a0e22'],
      ]);
      ctx.beginPath();
      ctx.moveTo(cx + i * 4, WALL_TOP + 4);
      ctx.lineTo(cx + i * 4 + 4.2, WALL_TOP + 4);
      ctx.lineTo(cx + i * 4 + 4.2 + (side ? -1 : 1) * i * 0.6, B - 8);
      ctx.lineTo(cx + i * 4 + (side ? -1 : 1) * i * 0.6, B - 8);
      ctx.fill();
    }
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(cx + (side ? 0 : 10), 60, 6, 1.6);
  }
  // valance
  ctx.fillStyle = '#8a1a32';
  ctx.beginPath();
  ctx.moveTo(x, WALL_TOP + 4);
  for (let i = 0; i <= w; i += 15) ctx.quadraticCurveTo(x + i + 7.5, WALL_TOP + 12, x + i + 15, WALL_TOP + 4);
  ctx.lineTo(x + w, WALL_TOP + 2);
  ctx.lineTo(x, WALL_TOP + 2);
  ctx.fill();
}

function cocktailTable(ctx: Ctx, cx: number, y: number) {
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(cx - 0.8, y - 12, 1.6, 12);
  fillRR(ctx, cx - 5, y - 1.2, 10, 1.2, 0.5, '#c9a24a');
  ctx.beginPath();
  ctx.ellipse(cx, y - 12, 10, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#dff3ff', 0.55);
  ctx.fill();
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  fillRR(ctx, cx - 3, y - 16, 2.4, 4, 0.6, '#8a3a58');
  fillRR(ctx, cx + 1.4, y - 15, 2.4, 3, 0.6, '#f4efe0');
}

function frameArt(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 2, y - 2, 40, 28, 1, vgrad(ctx, y, y + 26, [
    [0, '#f2cf6a'],
    [1, '#8a6018'],
  ]));
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(x, y, 36, 24);
  // abstract art deco sunrise
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = ['#ff6ad0', '#ffcf4a', '#ff8a3a', '#8a5ac8', '#ff6ad0', '#ffcf4a'][i];
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 24);
    ctx.arc(x + 18, y + 24, 20 - i * 3, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

function recordPlayer(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 11, 28, y + 1, 0.45);
  panel(ctx, x, y - 22, 24, 22, '#6b4428', 1.4);
  ctx.fillStyle = rgba('#000', 0.25);
  ctx.fillRect(x + 2, y - 12, 20, 0.6);
  // horn gramophone gag
  ctx.beginPath();
  ctx.ellipse(x + 11, y - 24.6, 8, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#121014';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 26);
  ctx.quadraticCurveTo(x + 20, y - 34, x + 26, y - 44);
  ctx.lineTo(x + 34, y - 36);
  ctx.quadraticCurveTo(x + 26, y - 34, x + 20, y - 25);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x + 18, x + 34, [
    [0, '#8a6018'],
    [0.5, '#f2cf6a'],
    [1, '#8a6018'],
  ]);
  ctx.fill();
}

// ================================================================== CLASSROOM (INT)
export function classroomStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      chalkboard(ctx, mx + 60, 26, 90, 34, (bx, by) => {
        chalkText(ctx, L(lang, 'Урок №1: Выживание', 'Lesson 1: Survival'), bx + 4, by + 5, 4.4);
        chalkText(ctx, '2 + 2 = 4', bx + 4, by + 12, 3.8);
        chalkText(ctx, 'a² + b² = c²', bx + 4, by + 18, 3.8);
        chalkText(ctx, L(lang, '☢ ≠ еда', '☢ ≠ food'), bx + 4, by + 24, 3.8);
        ctx.strokeStyle = rgba('#f4f4ec', 0.85);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(bx + 60, by + 26);
        ctx.lineTo(bx + 72, by + 8);
        ctx.lineTo(bx + 84, by + 26);
        ctx.closePath();
        ctx.stroke();
      });
      woodDesk(ctx, mx + 20, B, 40, 16, '#7a5236', 'l');
      globe(ctx, mx + 30, B - 18, 3.4);
      apple(ctx, mx + 48, B - 18);
      for (let i = 0; i < 3; i++) schoolDesk(ctx, mx + 76 + i * 30, B);
      shelfUnit(ctx, mx + 168, B, 24, 60, '#6b4428', 3);
      for (let r = 0; r < 3; r++) books(ctx, mx + 170, B - 60 + ((r + 1) * 58) / 3, 20, r * 3);
    } else if (v === 1) {
      for (let i = 0; i < 3; i++) {
        shelfUnit(ctx, mx + 18 + i * 30, B, 28, 72, '#5a3a24', 4);
        for (let r = 0; r < 4; r++) books(ctx, mx + 20 + i * 30, B - 72 + ((r + 1) * 70) / 4, 24, r * 5 + i * 2);
      }
      libraryLadder(ctx, mx + 76, B);
      readingChair(ctx, mx + 116, B);
      pendantLamp(ctx, mx + 128, WALL_TOP, 20, '#2f5a3a');
      globe(ctx, mx + 172, B, 7);
    } else {
      solarMobile(ctx, mx + 60);
      anatomyPoster(ctx, mx + 110, 28, lang);
      steelTable(ctx, mx + 20, B, 60, 18, '#7a5236', '#5a3a24');
      abacus(ctx, mx + 26, B - 19);
      microscopeSmall(ctx, mx + 60, B - 19);
      worldMap(ctx, mx + 146, 30, lang);
      schoolDesk(ctx, mx + 150, B);
    }
  }
}

function apple(ctx: Ctx, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y - 2.2, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = '#e8453c';
  ctx.fill();
  ctx.fillStyle = '#4f9b4a';
  ctx.beginPath();
  ctx.ellipse(x + 1.2, y - 4.8, 1.2, 0.6, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function schoolDesk(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 28, y + 1, 0.35);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 2, y - 14, 1.6, 14);
  ctx.fillRect(x + 20, y - 14, 1.6, 14);
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 14);
  ctx.lineTo(x + 25, y - 14);
  ctx.lineTo(x + 24, y - 17);
  ctx.lineTo(x, y - 16);
  ctx.closePath();
  ctx.fillStyle = '#a0724b';
  ctx.fill();
  ctx.fillStyle = '#f4efe0';
  ctx.fillRect(x + 6, y - 16.6, 7, 0.8);
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(x + 15, y - 16.8, 4, 0.6);
}

function libraryLadder(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = '#7a5236';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10, y - 70);
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x, y - 70);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    ctx.beginPath();
    ctx.moveTo(x - 10 * k, y - 70 * k);
    ctx.lineTo(x + 10 - 10 * k, y - 70 * k);
    ctx.stroke();
  }
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x - 14, y - 72, 28, 1.2);
}

function readingChair(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 12, 30, y + 1, 0.45);
  box(ctx, x + 2, y - 30, 20, 18, '#2f5a3a', 5);
  box(ctx, x, y - 14, 24, 9, '#3a6a4a', 3);
  box(ctx, x - 2, y - 20, 6, 15, '#2f5a3a', 2.6);
  box(ctx, x + 20, y - 20, 6, 15, '#2f5a3a', 2.6);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x + 1, y - 5, 1.6, 5);
  ctx.fillRect(x + 21.4, y - 5, 1.6, 5);
  // an open book on the seat
  fillRR(ctx, x + 8, y - 16, 9, 2, 0.4, '#f4efe0');
  ctx.fillStyle = '#b5403a';
  ctx.fillRect(x + 12.2, y - 16.4, 0.6, 2.4);
}

function solarMobile(ctx: Ctx, x: number) {
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x, WALL_TOP);
  ctx.lineTo(x, WALL_TOP + 12);
  ctx.moveTo(x - 32, WALL_TOP + 12);
  ctx.lineTo(x + 32, WALL_TOP + 12);
  ctx.stroke();
  const planets = [
    [-30, 10, 2, '#c9a26a'],
    [-20, 18, 3, '#e8a85a'],
    [-8, 14, 3.2, '#5fa8e8'],
    [4, 22, 2.6, '#e8653c'],
    [16, 12, 6, '#d9b88a'],
    [28, 20, 5, '#e8d09a'],
  ] as const;
  ctx.beginPath();
  ctx.arc(x, WALL_TOP + 20, 7, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - 2, WALL_TOP + 18, 1, 8, [
    [0, '#fff4a8'],
    [1, '#f2a23c'],
  ]);
  ctx.fill();
  for (const [dx, len, r, c] of planets) {
    ctx.beginPath();
    ctx.moveTo(x + dx, WALL_TOP + 12);
    ctx.lineTo(x + dx, WALL_TOP + 12 + len);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + dx, WALL_TOP + 12 + len + r, r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    if (r === 5) {
      ctx.strokeStyle = '#c9a26a';
      ctx.beginPath();
      ctx.ellipse(x + dx, WALL_TOP + 12 + len + r, r + 3, 1.2, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#3a3a3a';
    }
  }
}

function anatomyPoster(ctx: Ctx, x: number, y: number, lang: string) {
  poster(ctx, x, y, 28, 40, '#f4efe0', (px, py, pw, ph) => {
    ctx.fillStyle = '#e8b390';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    fillRR(ctx, px + pw / 2 - 5, py + 12, 10, 16, 3, '#e8b390');
    ctx.fillStyle = '#d6453c';
    ctx.beginPath();
    ctx.arc(px + pw / 2 - 1.4, py + 17, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e88ab0';
    ctx.beginPath();
    ctx.ellipse(px + pw / 2 + 2, py + 16, 1.8, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(px + pw / 2 - 2, py + 16, 1.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(px + pw / 2 + 4, py + 16);
    ctx.lineTo(px + pw - 3, py + 14);
    ctx.stroke();
    posterText(ctx, L(lang, 'АНАТОМИЯ', 'ANATOMY'), px + pw / 2, py + ph - 5, 3.8, '#2a2622');
  });
}

function abacus(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y - 12, 18, 12, 0.8, '#7a5236');
  fillRR(ctx, x + 1.4, y - 10.6, 15.2, 9.2, 0.4, '#f4efe0');
  for (let r = 0; r < 4; r++) {
    ctx.fillStyle = '#6d7883';
    ctx.fillRect(x + 1.4, y - 9.4 + r * 2.4, 15.2, 0.3);
    for (let b = 0; b < 5; b++) {
      ctx.fillStyle = ['#c7433b', '#2f6fb8', '#f2c230', '#3f8a5a'][r];
      ctx.beginPath();
      ctx.arc(x + 3 + b * 1.6 + (r % 2) * 5, y - 9.3 + r * 2.4, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function microscopeSmall(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x - 4, y - 1.6, 8, 1.6, 0.5, '#2a2f38');
  ctx.fillStyle = '#e8e2d4';
  ctx.fillRect(x + 1, y - 10, 1.6, 8.4);
  ctx.save();
  ctx.translate(x - 1, y - 10);
  ctx.rotate(-0.4);
  fillRR(ctx, -1.2, -6, 2.4, 8, 0.6, '#3a3f45');
  ctx.restore();
}

function worldMap(ctx: Ctx, x: number, y: number, lang: string) {
  fillRR(ctx, x - 1.5, y - 1.5, 45, 27, 1, '#7a5236');
  ctx.fillStyle = '#bfe0f0';
  ctx.fillRect(x, y, 42, 24);
  ctx.fillStyle = '#9ac87a';
  const blobs = [
    [8, 8, 6, 4],
    [10, 17, 3, 5],
    [22, 7, 7, 4],
    [24, 15, 4, 5],
    [34, 9, 6, 4],
    [36, 19, 3, 2],
  ];
  for (const [bx, by, rx, ry] of blobs) {
    ctx.beginPath();
    ctx.ellipse(x + bx, y + by, rx, ry, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // gag: a red X with "we are here" (underground)
  ctx.strokeStyle = '#d6453c';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 8);
  ctx.lineTo(x + 31, y + 11);
  ctx.moveTo(x + 31, y + 8);
  ctx.lineTo(x + 28, y + 11);
  ctx.stroke();
  ctx.font = '600 2.4px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d6453c';
  ctx.fillText(L(lang, 'мы тут (внизу)', 'we are here (below)'), x + 31, y + 13.6);
}

// ================================================================== ATHLETICS (AGI)
export function athleticsStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      climbWall(ctx, mx + 18, 24, 60, B - 24);
      gymMat(ctx, mx + 16, B, 66, '#2f5d99');
      ringsMount(ctx, mx + 110);
      gymMat(ctx, mx + 96, B, 50, '#3a6fb0');
      chalkBowlStand(ctx, mx + 170, B);
    } else if (v === 1) {
      balanceBeam(ctx, mx + 22, B, 80);
      vaultHorse(ctx, mx + 124, B);
      springboard(ctx, mx + 158, B);
      pennant(ctx, mx + 30, 30, lang);
    } else {
      hoop(ctx, mx + 100, 26);
      ballRack(ctx, mx + 20, B);
      scoreClock(ctx, mx + 146, 26, lang);
      gymMat(ctx, mx + 60, B, 80, '#c7433b');
    }
  }
}

export function athleticsDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      const sw = Math.sin(t * 1.6) * (active ? 0.12 : 0.03);
      for (const [i, rx] of [mx + 110, mx + 124].entries()) {
        ctx.save();
        ctx.translate(rx, WALL_TOP);
        ctx.rotate(sw * (i ? -1 : 1));
        ctx.strokeStyle = '#c9a26a';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 33.4, 3.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#8a5a36';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
    } else if (v === 2) {
      // ball arcing into the hoop
      if (active) {
        const ph = (t * 0.45) % 1;
        const bx = mx + 60 + ph * 44;
        const by = B - 16 - Math.sin(ph * Math.PI) * 48 + ph * 8;
        ctx.beginPath();
        ctx.arc(bx, by, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = '#f28a2a';
        ctx.fill();
        ctx.strokeStyle = '#6a2a0a';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(bx - 3.4, by);
        ctx.lineTo(bx + 3.4, by);
        ctx.moveTo(bx, by - 3.4);
        ctx.lineTo(bx, by + 3.4);
        ctx.stroke();
      }
      ctx.font = '700 5px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff5a4a';
      const sc = Math.floor(t * 0.45) % 100;
      ctx.fillText(`${String(sc).padStart(2, '0')} : 99`, mx + 168, 37);
    }
  }
}

function climbWall(ctx: Ctx, x: number, y: number, w: number, h: number) {
  fillRR(ctx, x, y, w, h, 1, vgrad(ctx, y, y + h, [
    [0, '#b8c8e0'],
    [1, '#8aa0c0'],
  ]));
  ctx.strokeStyle = rgba('#5a6a8a', 0.4);
  ctx.lineWidth = 0.4;
  for (let gx = x + 15; gx < x + w; gx += 15) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  const cols = ['#e8453c', '#f2c230', '#3f8a5a', '#8a5ac8', '#2f6fb8', '#f28a2a'];
  for (let i = 0; i < 26; i++) {
    const hx = x + 4 + ((i * 23) % (w - 8));
    const hy = y + 4 + ((i * 37) % (h - 12));
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.ellipse(hx, hy, 2 + (i % 3) * 0.6, 1.6, i, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(hx - 0.8, hy - 1, 0.6, 0.6);
  }
}

function gymMat(ctx: Ctx, x: number, y: number, w: number, c: string) {
  fillRR(ctx, x, y - 3.4, w, 3.4, 1.2, vgrad(ctx, y - 3.4, y, [
    [0, shade(c, 0.2)],
    [1, shade(c, -0.25)],
  ]));
  ctx.fillStyle = rgba('#000', 0.2);
  for (let i = 1; i < Math.floor(w / 20); i++) ctx.fillRect(x + i * 20, y - 3.4, 0.6, 3.4);
}

function ringsMount(ctx: Ctx, x: number) {
  fillRR(ctx, x - 4, WALL_TOP - 1, 22, 3, 1, '#2a2d31');
}

function chalkBowlStand(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 6, 14, y + 1, 0.35);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x + 5, y - 20, 2, 20);
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 21, 7, 2.4, 0, 0, Math.PI);
  ctx.fillStyle = '#6d7883';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 21, 6, 1.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f4f0';
  ctx.fill();
}

function balanceBeam(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  for (const lx of [x + 8, x + w - 12]) {
    ctx.fillStyle = '#6d7883';
    ctx.fillRect(lx, y - 26, 4, 26);
    fillRR(ctx, lx - 4, y - 2, 12, 2, 0.6, '#3a3f45');
  }
  fillRR(ctx, x, y - 30, w, 4, 1.4, vgrad(ctx, y - 30, y - 26, [
    [0, '#e8d0b0'],
    [1, '#b8966a'],
  ]));
}

function vaultHorse(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 14, 34, y + 1, 0.45);
  ctx.fillStyle = '#6d7883';
  for (const lx of [x + 4, x + 22]) ctx.fillRect(lx, y - 20, 2.4, 20);
  fillRR(ctx, x, y - 30, 28, 11, 5, vgrad(ctx, y - 30, y - 19, [
    [0, '#a86a3a'],
    [1, '#6b3e1e'],
  ]));
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.fillRect(x + 4, y - 29, 20, 0.8);
}

function springboard(ctx: Ctx, x: number, y: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.lineTo(x + 26, y - 8);
  ctx.lineTo(x + 26, y - 5);
  ctx.lineTo(x + 2, y);
  ctx.closePath();
  ctx.fillStyle = '#2f6fb8';
  ctx.fill();
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(x + 10, y - 5, 10, 0.8);
}

function pennant(ctx: Ctx, x: number, y: number, lang: string) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 50, y + 8);
  ctx.lineTo(x, y + 16);
  ctx.closePath();
  ctx.fillStyle = '#3a6fb0';
  ctx.fill();
  ctx.font = '700 4.4px Oswald, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffcf4a';
  ctx.fillText(L(lang, 'ЛОВКОСТЬ!', 'AGILITY!'), x + 3, y + 8);
}

function hoop(ctx: Ctx, cx: number, y: number) {
  fillRR(ctx, cx - 20, y, 40, 26, 1, '#f4f4f0');
  ctx.strokeStyle = '#d6453c';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 17, y + 3, 34, 20);
  ctx.strokeRect(cx - 6, y + 12, 12, 9);
  ctx.strokeStyle = '#f28a2a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, y + 26, 8, 1.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.85);
  ctx.lineWidth = 0.4;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 2.4, y + 26.6);
    ctx.lineTo(cx + i * 1.4, y + 36);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 6, y + 31);
  ctx.lineTo(cx + 6, y + 31);
  ctx.stroke();
}

function ballRack(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 16, 36, y + 1, 0.4);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(x, y - 26, 2, 26);
  ctx.fillRect(x + 32, y - 26, 2, 26);
  for (let r = 0; r < 2; r++) {
    ctx.fillRect(x, y - 12 - r * 13, 34, 1.4);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + 5 + i * 8, y - 16.4 - r * 13, 4, 0, Math.PI * 2);
      ctx.fillStyle = ['#f28a2a', '#f4f4f0', '#f28a2a', '#e8453c'][(i + r) % 4];
      ctx.fill();
      ctx.strokeStyle = rgba('#000', 0.35);
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
}

function scoreClock(ctx: Ctx, x: number, y: number, lang: string) {
  panel(ctx, x, y, 44, 18, '#1a1c20', 1.4);
  ctx.font = '700 3px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4efe0';
  ctx.fillText(L(lang, 'ДОМА   ГОСТИ', 'HOME   GUEST'), x + 22, y + 4);
}

// ================================================================== GAME ROOM (LUCK)
export function gameroomStatic(ctx: Ctx, w: number, size: number, level: number, lang: string) {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      for (let i = 0; i < 4; i++) arcadeCabinet(ctx, mx + 22 + i * 24, B, ['#c7433b', '#2f6fb8', '#3f8a5a', '#8a5ac8'][i]);
      neonSign(ctx, mx + 70, 36, L(lang, 'ИГРЫ', 'GAMES'), '#5fd8ff', 7);
      clawMachine(ctx, mx + 146, B);
    } else if (v === 1) {
      poolTable(ctx, mx + 40, B, 90);
      pendantLamp(ctx, mx + 70, WALL_TOP, 18, '#2a5a3a', '#fff0c8');
      pendantLamp(ctx, mx + 100, WALL_TOP, 18, '#2a5a3a', '#fff0c8');
      cueRack(ctx, mx + 18, 34);
      dartboard(ctx, mx + 164, 44);
    } else {
      pokerTable(ctx, mx + 30, B);
      slotMachine(ctx, mx + 110, B);
      slotMachine(ctx, mx + 134, B);
      rouletteWheel(ctx, mx + 176, 46);
    }
  }
}

export function gameroomDyn(ctx: Ctx, w: number, size: number, level: number, t: number, active: boolean, lang = 'ru') {
  for (let m = 0; m < size; m++) {
    const mx = m * M;
    const v = variant(m, size);
    if (v === 0) {
      neonGlow(ctx, mx + 70, 36, L(lang, 'ИГРЫ', 'GAMES'), '#5fd8ff', 7, active ? 0.85 + 0.15 * Math.sin(t * 7) : 0.3);
      for (let i = 0; i < 4; i++) {
        const sx = mx + 24 + i * 24;
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, B - 28, 10, 9);
        ctx.clip();
        ctx.fillStyle = ['#3a0a2a', '#0a1a3a', '#0a2a1a', '#1a0a3a'][i];
        ctx.fillRect(sx, B - 28, 10, 9);
        // simple sprites
        const px = sx + 5 + Math.sin(t * (2 + i)) * 3;
        ctx.fillStyle = ['#ffcf4a', '#5fd8ff', '#6aff8c', '#ff6ad0'][i];
        ctx.fillRect(px - 1, B - 22, 2, 2);
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 3; k++) ctx.fillRect(sx + ((k * 4 + t * 6 * (active ? 1 : 0.2)) % 10), B - 27 + k * 2, 0.8, 0.8);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, sx + 5, B - 24, 12, ['#ffcf4a', '#5fd8ff', '#6aff8c', '#ff6ad0'][i], 0.15);
        ctx.restore();
      }
      // claw
      const cx = mx + 156 + Math.sin(t * 0.8) * 6;
      ctx.strokeStyle = '#c9d2d9';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, B - 58);
      ctx.lineTo(cx, B - 50 + Math.max(0, Math.sin(t * 0.8 + 1)) * 6);
      ctx.stroke();
    } else if (v === 1) {
      // rolling ball
      const bx = mx + 60 + ((Math.sin(t * 0.9) + 1) / 2) * 50;
      ctx.beginPath();
      ctx.arc(bx, B - 24, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f4f0';
      ctx.fill();
    } else {
      // slot reels & roulette spin
      for (const [k, sx] of [mx + 110, mx + 134].entries()) {
        for (let r = 0; r < 3; r++) {
          const sym = Math.floor(t * (active ? 8 : 0.5) + r * 3 + k * 5) % 4;
          const rx = sx + 3 + r * 5;
          ctx.fillStyle = '#f4f1e8';
          ctx.fillRect(rx, B - 44, 4.2, 6);
          ctx.fillStyle = ['#e8453c', '#f2c230', '#3f8a5a', '#8a5ac8'][sym];
          ctx.beginPath();
          ctx.arc(rx + 2.1, B - 41, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(mx + 176, 46);
      ctx.rotate(active ? t * 2 : 0.3);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i === 0 ? '#3f8a5a' : i % 2 ? '#c7433b' : '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 11, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a24a';
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(mx + 176 + Math.cos(-t * 3) * 8.6, 46 + Math.sin(-t * 3) * 8.6, 0.9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
}

function clawMachine(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 18, 40, y + 1, 0.45);
  panel(ctx, x, y - 22, 36, 22, '#ff6ad0', 1.6);
  fillRR(ctx, x + 1, y - 62, 34, 40, 1, rgba('#dff3ff', 0.18));
  ctx.strokeStyle = '#ff6ad0';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x + 1, y - 62, 34, 40);
  // plush prizes (gag: tiny dwellers and a mutant bear)
  const cols = ['#2f6fb8', '#f2c230', '#8a5ac8', '#6fbf5a', '#e8453c'];
  for (let i = 0; i < 7; i++) {
    const px = x + 5 + (i % 4) * 8;
    const py = y - 26 - Math.floor(i / 4) * 5;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(px - 1.2, py - 0.8, 0.6, 0.6);
    ctx.fillRect(px + 0.6, py - 0.8, 0.6, 0.6);
  }
  box(ctx, x - 1, y - 66, 38, 5, '#c94aa8', 1.2);
  fillRR(ctx, x + 22, y - 18, 10, 8, 1, '#1a1c20');
}

function poolTable(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 12, y + 1, 0.55);
  ctx.fillStyle = '#4a2a1a';
  ctx.fillRect(x + 6, y - 20, 5, 20);
  ctx.fillRect(x + w - 11, y - 20, 5, 20);
  panel(ctx, x - 2, y - 26, w + 4, 8, '#6b3a1e', 1.6);
  // felt
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 26);
  ctx.lineTo(x + w - 2, y - 26);
  ctx.lineTo(x + w - 6, y - 30);
  ctx.lineTo(x + 6, y - 30);
  ctx.closePath();
  ctx.fillStyle = '#1f7a4a';
  ctx.fill();
  const balls = ['#f2c230', '#2f6fb8', '#e8453c', '#8a5ac8', '#f28a2a', '#1a1a1a'];
  balls.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(x + 20 + (i % 3) * 3.4 + Math.floor(i / 3) * 1.7, y - 27.6 - Math.floor(i / 3) * 1.2, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  // cue lying across
  ctx.strokeStyle = '#c9a26a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y - 28);
  ctx.lineTo(x + w + 6, y - 32);
  ctx.stroke();
}

function cueRack(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y, 16, 3, 0.6, '#6b3a1e');
  fillRR(ctx, x, y + 44, 16, 3, 0.6, '#6b3a1e');
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = hgrad(ctx, x + 2 + i * 3.4, x + 3.4 + i * 3.4, [
      [0, '#8a5a36'],
      [1, '#e0b88a'],
    ]);
    ctx.fillRect(x + 2.4 + i * 3.4, y - 2, 1.2, 50);
  }
}

function dartboard(ctx: Ctx, cx: number, cy: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = i % 2 ? '#f4e8c8' : '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 9, (i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#c7433b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 8.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#3f8a5a';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#c7433b';
  ctx.fill();
  // darts
  for (const [dx, dy] of [
    [1, -2],
    [-3, 3],
  ]) {
    ctx.fillStyle = '#c9d2d9';
    ctx.fillRect(cx + dx, cy + dy, 3, 0.6);
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(cx + dx + 3, cy + dy - 0.6, 1.6, 1.8);
  }
}

function pokerTable(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 32, 76, y + 1, 0.5);
  // chairs behind
  for (let i = 0; i < 3; i++) chairBack(ctx, x + 10 + i * 22, y);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x + 30, y - 16, 4, 16);
  fillRR(ctx, x + 20, y - 2, 24, 2, 0.8, '#3a2418');
  ctx.beginPath();
  ctx.ellipse(x + 32, y - 18, 34, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#5a3418';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 32, y - 18.6, 31, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1f6a4a';
  ctx.fill();
  // chips & cards
  const chips = ['#e8453c', '#2f6fb8', '#f4f4f0', '#1a1a1a'];
  for (let s = 0; s < 4; s++) {
    for (let k = 0; k < 3 + s; k++) {
      ctx.fillStyle = chips[s];
      ctx.fillRect(x + 12 + s * 12, y - 20 - k * 0.8, 3.4, 0.8);
    }
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(x + 20 + i * 4, y - 19.2, 3, 0.8);
  }
}

function chairBack(ctx: Ctx, x: number, y: number) {
  fillRR(ctx, x, y - 30, 12, 14, 2.4, vgrad(ctx, y - 30, y - 16, [
    [0, '#5a2a1a'],
    [1, '#3a1a10'],
  ]));
}

function slotMachine(ctx: Ctx, x: number, y: number) {
  propShadow(ctx, x + 11, 26, y + 1, 0.45);
  panel(ctx, x, y - 56, 22, 56, '#c9a24a', 2);
  fillRR(ctx, x + 2, y - 48, 18, 12, 1, '#1a1a1a');
  panel(ctx, x - 1, y - 60, 24, 6, '#c7433b', 2);
  ctx.font = '800 3.2px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf4a';
  ctx.fillText('777', x + 11, y - 56);
  // lever
  ctx.fillStyle = '#9aa7b0';
  ctx.fillRect(x + 22, y - 44, 1.4, 14);
  ctx.beginPath();
  ctx.arc(x + 22.7, y - 45, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#c7433b';
  ctx.fill();
  fillRR(ctx, x + 4, y - 20, 14, 8, 1, '#1a1a1a');
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e8c872';
    ctx.beginPath();
    ctx.arc(x + 7 + i * 3, y - 14, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function rouletteWheel(ctx: Ctx, cx: number, cy: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, cx - 4, cy - 4, 2, 16, [
    [0, '#8a5a36'],
    [1, '#3a1a0a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // pointer
  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx - 2, cy - 17);
  ctx.lineTo(cx + 2, cy - 17);
  ctx.fill();
}

export { crate, metalCrate, gauge, cylinder, officeChair, knob, glow };
