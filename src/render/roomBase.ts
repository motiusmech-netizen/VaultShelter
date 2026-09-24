/* Room "diorama" construction: shell, perspective side walls, back wall, floor, ceiling, lighting. */
import { box, grit, hgrad, mix, rgba, rgrad, rivet, shade, vgrad, type Ctx, hazard, fillRR } from './gfx';
import { CEIL_FRONT, FLOOR_FRONT, FLOOR_H, SHELL, SIDE_D, WALL_BOTTOM, WALL_TOP } from './world';
import { hash2 } from '../core/util';

export type WallStyle = 'panels' | 'tiles' | 'wallpaper' | 'wood' | 'concrete' | 'foam' | 'bricks' | 'pegboard' | 'tech';
export type FloorStyle = 'checker' | 'grate' | 'planks' | 'tiles' | 'rubber' | 'concrete' | 'carpet' | 'mats' | 'polished';

export interface WallSpec {
  style: WallStyle;
  base: string;
  alt?: string;
  lower?: { style: WallStyle; base: string; alt?: string; h: number };
  band?: string;
  trim?: string;
}

/** Front opening inner edge. */
export const IX0 = SHELL;
/** Back wall x range for a room of width w. */
export const bx0 = () => IX0 + SIDE_D;
export const bx1 = (w: number) => w - IX0 - SIDE_D;

/** Structural outer shell of a room (ceiling slab, floor slab, side frames). */
export function paintShell(ctx: Ctx, w: number, nbL: boolean, nbR: boolean, shellBase = '#2a323b') {
  ctx.fillStyle = '#0d1014';
  ctx.fillRect(0, 0, w, FLOOR_H);
  // ceiling slab
  ctx.fillStyle = vgrad(ctx, 0, CEIL_FRONT, [
    [0, shade(shellBase, 0.2)],
    [0.5, shellBase],
    [1, shade(shellBase, -0.4)],
  ]);
  ctx.fillRect(0, 0, w, CEIL_FRONT);
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(0, 0, w, 0.9);
  // floor slab
  ctx.fillStyle = vgrad(ctx, FLOOR_FRONT, FLOOR_H, [
    [0, shade(shellBase, 0.28)],
    [0.18, shellBase],
    [1, shade(shellBase, -0.5)],
  ]);
  ctx.fillRect(0, FLOOR_FRONT, w, FLOOR_H - FLOOR_FRONT);
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.fillRect(0, FLOOR_FRONT, w, 0.8);
  for (let x = 14; x < w - 8; x += 35) {
    rivet(ctx, x, FLOOR_FRONT + 4.8, 1.05, shellBase);
    rivet(ctx, x + 17, 4.6, 0.85, shellBase);
  }
  // side frames
  for (const sx of [0, w - SHELL]) {
    ctx.fillStyle = hgrad(ctx, sx, sx + SHELL, [
      [0, shade(shellBase, -0.35)],
      [0.5, shade(shellBase, 0.12)],
      [1, shade(shellBase, -0.35)],
    ]);
    ctx.fillRect(sx, 0, SHELL, FLOOR_H);
  }
  void nbL;
  void nbR;
}

function wallPattern(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, style: WallStyle, base: string, alt: string, seed: number) {
  const w = x1 - x0;
  const h = y1 - y0;
  switch (style) {
    case 'panels': {
      const pw = 35;
      for (let x = x0; x < x1; x += pw) {
        const tone = hash2(Math.floor(x), seed) * 0.07 - 0.035;
        ctx.fillStyle = rgba(tone > 0 ? '#ffffff' : '#000000', Math.abs(tone));
        ctx.fillRect(x, y0, pw, h);
        ctx.fillStyle = rgba('#000000', 0.38);
        ctx.fillRect(x, y0, 0.8, h);
        ctx.fillStyle = rgba('#ffffff', 0.12);
        ctx.fillRect(x + 0.8, y0, 0.6, h);
        for (let yy = y0 + 5; yy < y1 - 2; yy += h / 2.2) {
          rivet(ctx, x + 3.2, yy, 0.7, base);
          rivet(ctx, x + pw - 3.2, yy, 0.7, base);
        }
      }
      ctx.fillStyle = rgba('#000000', 0.25);
      ctx.fillRect(x0, y0 + h * 0.52, w, 0.7);
      break;
    }
    case 'tiles': {
      const ts = 7.5;
      for (let y = y0; y < y1; y += ts) {
        for (let x = x0; x < x1; x += ts) {
          const n = hash2(Math.floor(x), Math.floor(y), seed);
          ctx.fillStyle = n > 0.86 ? alt : n < 0.1 ? shade(base, 0.06) : base;
          ctx.fillRect(x + 0.4, y + 0.4, ts - 0.8, ts - 0.8);
          ctx.fillStyle = rgba('#ffffff', 0.2);
          ctx.fillRect(x + 0.4, y + 0.4, ts - 0.8, 0.7);
          ctx.fillStyle = rgba('#000000', 0.08);
          ctx.fillRect(x + 0.4, y + ts - 1.1, ts - 0.8, 0.7);
        }
      }
      ctx.fillStyle = rgba(shade(base, -0.5), 0.28);
      for (let y = y0; y < y1; y += ts) ctx.fillRect(x0, y, w, 0.4);
      for (let x = x0; x < x1; x += ts) ctx.fillRect(x, y0, 0.4, h);
      break;
    }
    case 'wallpaper': {
      for (let x = x0; x < x1; x += 10) {
        ctx.fillStyle = alt;
        ctx.fillRect(x, y0, 4, h);
        ctx.fillStyle = rgba('#ffffff', 0.08);
        ctx.fillRect(x + 4, y0, 0.6, h);
      }
      ctx.fillStyle = rgba(shade(alt, -0.25), 0.55);
      for (let y = y0 + 6; y < y1; y += 13) {
        for (let x = x0 + 7; x < x1; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, y - 1.8);
          ctx.quadraticCurveTo(x + 1.4, y - 0.4, x, y + 1.8);
          ctx.quadraticCurveTo(x - 1.4, y - 0.4, x, y - 1.8);
          ctx.fill();
        }
      }
      break;
    }
    case 'wood': {
      const pw = 9;
      for (let x = x0; x < x1; x += pw) {
        const n = hash2(Math.floor(x), seed);
        ctx.fillStyle = shade(base, n * 0.16 - 0.08);
        ctx.fillRect(x, y0, pw, h);
        ctx.strokeStyle = rgba(shade(base, -0.4), 0.3);
        ctx.lineWidth = 0.35;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          const gx = x + 2 + k * 2.4;
          ctx.moveTo(gx, y0);
          ctx.bezierCurveTo(gx + 1, y0 + h * 0.3, gx - 1, y0 + h * 0.6, gx + 0.5, y1);
          ctx.stroke();
        }
        ctx.fillStyle = rgba('#000000', 0.32);
        ctx.fillRect(x, y0, 0.6, h);
        ctx.fillStyle = rgba('#ffffff', 0.08);
        ctx.fillRect(x + 0.6, y0, 0.5, h);
      }
      break;
    }
    case 'concrete': {
      const bw = 24;
      const bh = 12;
      for (let y = y0, row = 0; y < y1; y += bh, row++) {
        for (let x = x0 - (row % 2) * (bw / 2); x < x1; x += bw) {
          const n = hash2(Math.floor(x), Math.floor(y), seed);
          ctx.fillStyle = shade(base, n * 0.12 - 0.06);
          ctx.fillRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
          ctx.fillStyle = rgba('#ffffff', 0.07);
          ctx.fillRect(x + 0.5, y + 0.5, bw - 1, 0.7);
        }
      }
      ctx.fillStyle = rgba('#000000', 0.28);
      for (let y = y0; y < y1; y += bh) ctx.fillRect(x0, y, w, 0.6);
      break;
    }
    case 'bricks': {
      const bw = 12;
      const bh = 6;
      for (let y = y0, row = 0; y < y1; y += bh, row++) {
        for (let x = x0 - (row % 2) * (bw / 2); x < x1; x += bw) {
          const n = hash2(Math.floor(x), Math.floor(y), seed);
          ctx.fillStyle = shade(base, n * 0.16 - 0.08);
          ctx.fillRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
        }
      }
      break;
    }
    case 'foam': {
      const s = 7;
      for (let y = y0; y < y1; y += s) {
        for (let x = x0; x < x1; x += s) {
          const cx = x + s / 2;
          const cy = y + s / 2;
          ctx.fillStyle = shade(base, 0.2);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + s, y);
          ctx.lineTo(cx, cy);
          ctx.fill();
          ctx.fillStyle = shade(base, -0.28);
          ctx.beginPath();
          ctx.moveTo(x, y + s);
          ctx.lineTo(x + s, y + s);
          ctx.lineTo(cx, cy);
          ctx.fill();
          ctx.fillStyle = shade(base, -0.05);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(cx, cy);
          ctx.lineTo(x, y + s);
          ctx.fill();
        }
      }
      break;
    }
    case 'pegboard': {
      ctx.fillStyle = rgba(shade(base, -0.5), 0.55);
      for (let y = y0 + 3; y < y1; y += 4) for (let x = x0 + 3; x < x1; x += 4) ctx.fillRect(x, y, 0.8, 0.8);
      break;
    }
    case 'tech': {
      ctx.fillStyle = rgba('#000000', 0.4);
      for (let x = x0 + 28; x < x1 - 2; x += 28) ctx.fillRect(x, y0, 0.7, h);
      ctx.strokeStyle = rgba(alt, 0.35);
      ctx.lineWidth = 0.6;
      for (let x = x0 + 6; x < x1; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, y0 + 8);
        ctx.lineTo(x, y0 + h * 0.4);
        ctx.lineTo(x + 8, y0 + h * 0.5);
        ctx.lineTo(x + 8, y1 - 6);
        ctx.stroke();
        ctx.fillStyle = rgba(alt, 0.6);
        ctx.fillRect(x - 1, y0 + 7, 2, 2);
      }
      break;
    }
  }
}

export function paintWallArea(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, style: WallStyle, base: string, alt = shade(base, -0.12), seed = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, y0, y1, [
    [0, shade(base, -0.1)],
    [0.5, base],
    [1, shade(base, -0.14)],
  ]);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  wallPattern(ctx, x0, y0, x1, y1, style, base, alt, seed);
  grit(ctx, x0, y0, x1 - x0, y1 - y0, 0.1, 0.4);
  ctx.restore();
}

/** Back wall with optional wainscot, band and skirting. */
export function paintWall(ctx: Ctx, w: number, spec: WallSpec, seed = 1) {
  const x0 = bx0();
  const x1 = bx1(w);
  paintWallArea(ctx, x0, WALL_TOP, x1, WALL_BOTTOM, spec.style, spec.base, spec.alt, seed);
  if (spec.lower) {
    const ly = WALL_BOTTOM - spec.lower.h;
    paintWallArea(ctx, x0, ly, x1, WALL_BOTTOM, spec.lower.style, spec.lower.base, spec.lower.alt, seed + 7);
    ctx.fillStyle = spec.trim ?? shade(spec.lower.base, -0.3);
    ctx.fillRect(x0, ly - 1.6, x1 - x0, 2.4);
    ctx.fillStyle = rgba('#ffffff', 0.28);
    ctx.fillRect(x0, ly - 1.6, x1 - x0, 0.6);
    ctx.fillStyle = rgba('#000000', 0.25);
    ctx.fillRect(x0, ly + 0.8, x1 - x0, 1);
  }
  if (spec.band) {
    const by = WALL_TOP + 6;
    ctx.fillStyle = spec.band;
    ctx.fillRect(x0, by, x1 - x0, 3.2);
    ctx.fillStyle = rgba('#ffffff', 0.28);
    ctx.fillRect(x0, by, x1 - x0, 0.7);
    ctx.fillStyle = rgba('#000000', 0.32);
    ctx.fillRect(x0, by + 3.2, x1 - x0, 0.7);
  }
  // skirting board
  const sk = spec.trim ?? '#3a4048';
  ctx.fillStyle = vgrad(ctx, WALL_BOTTOM - 3.2, WALL_BOTTOM, [
    [0, shade(sk, 0.15)],
    [1, shade(sk, -0.35)],
  ]);
  ctx.fillRect(x0, WALL_BOTTOM - 3.2, x1 - x0, 3.2);
}

/** Perspective side walls (left & right ends of the room box), with doorways to neighbours. */
export function paintSideWalls(ctx: Ctx, w: number, spec: WallSpec, nbL: boolean, nbR: boolean) {
  for (const side of [-1, 1]) {
    const xf = side < 0 ? IX0 : w - IX0; // front edge x
    const xb = side < 0 ? bx0() : bx1(w); // back edge x
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xf, CEIL_FRONT);
    ctx.lineTo(xb, WALL_TOP);
    ctx.lineTo(xb, WALL_BOTTOM);
    ctx.lineTo(xf, FLOOR_FRONT);
    ctx.closePath();
    ctx.clip();
    const base = shade(spec.base, -0.3);
    ctx.fillStyle = hgrad(ctx, xf, xb, [
      [0, shade(base, -0.25)],
      [1, base],
    ]);
    ctx.fillRect(Math.min(xf, xb) - 1, 0, SIDE_D + 2, FLOOR_H);
    // perspective seams
    ctx.strokeStyle = rgba('#000000', 0.25);
    ctx.lineWidth = 0.5;
    for (let k = 1; k < 5; k++) {
      const t = k / 5;
      ctx.beginPath();
      ctx.moveTo(xf, CEIL_FRONT + (FLOOR_FRONT - CEIL_FRONT) * t);
      ctx.lineTo(xb, WALL_TOP + (WALL_BOTTOM - WALL_TOP) * t);
      ctx.stroke();
    }
    if (spec.lower) {
      const h = spec.lower.h;
      const yb = WALL_BOTTOM - h;
      const yf = FLOOR_FRONT - h * ((FLOOR_FRONT - CEIL_FRONT) / (WALL_BOTTOM - WALL_TOP));
      ctx.beginPath();
      ctx.moveTo(xf, yf);
      ctx.lineTo(xb, yb);
      ctx.lineTo(xb, WALL_BOTTOM);
      ctx.lineTo(xf, FLOOR_FRONT);
      ctx.closePath();
      ctx.fillStyle = shade(spec.lower.base, -0.3);
      ctx.fill();
      ctx.strokeStyle = spec.trim ?? shade(spec.lower.base, -0.45);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(xf, yf);
      ctx.lineTo(xb, yb);
      ctx.stroke();
    }
    // doorway to neighbour
    const has = side < 0 ? nbL : nbR;
    if (has) {
      const topB = WALL_BOTTOM - 50;
      const topF = FLOOR_FRONT - 50 * ((FLOOR_FRONT - CEIL_FRONT) / (WALL_BOTTOM - WALL_TOP));
      const inset = 0.22;
      const x1 = xf + (xb - xf) * inset;
      const x2 = xf + (xb - xf) * (1 - inset);
      const lerpY = (a: number, b: number, t: number) => a + (b - a) * t;
      ctx.beginPath();
      ctx.moveTo(x1, lerpY(topF, topB, inset));
      ctx.lineTo(x2, lerpY(topF, topB, 1 - inset));
      ctx.lineTo(x2, lerpY(FLOOR_FRONT, WALL_BOTTOM, 1 - inset));
      ctx.lineTo(x1, lerpY(FLOOR_FRONT, WALL_BOTTOM, inset));
      ctx.closePath();
      ctx.fillStyle = '#07090b';
      ctx.fill();
      ctx.strokeStyle = '#ffb02e';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
      // door frame light
      ctx.fillStyle = rgba('#7fd3ff', 0.35);
      ctx.fillRect((x1 + x2) / 2 - 0.6, lerpY(topF, topB, 0.5) - 3, 1.2, 1.4);
    }
    grit(ctx, Math.min(xf, xb), 0, SIDE_D, FLOOR_H, 0.1, 0.4);
    // edge line where side wall meets back wall
    ctx.restore();
    ctx.strokeStyle = rgba('#000000', 0.45);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(xb, WALL_TOP);
    ctx.lineTo(xb, WALL_BOTTOM);
    ctx.stroke();
  }
}

/** Floor in perspective between the back wall and the front edge. */
export function paintFloor(ctx: Ctx, w: number, style: FloorStyle, base: string, alt = shade(base, -0.25)) {
  const fx0 = IX0;
  const fx1 = w - IX0;
  const bxa = bx0();
  const bxb = bx1(w);
  const y0 = WALL_BOTTOM;
  const y1 = FLOOR_FRONT;
  const h = y1 - y0;
  const cx = w / 2;
  const kf = (fx1 - fx0) / (bxb - bxa); // front scale vs back
  const proj = (xBack: number, t: number) => {
    // t: 0 back, 1 front
    const xf = cx + (xBack - cx) * kf;
    return xBack + (xf - xBack) * t;
  };
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bxa, y0);
  ctx.lineTo(bxb, y0);
  ctx.lineTo(fx1, y1);
  ctx.lineTo(fx0, y1);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, y0, y1, [
    [0, shade(base, -0.3)],
    [1, shade(base, 0.1)],
  ]);
  ctx.fillRect(0, y0, w, h);
  const rows = 4;
  const rowY = (r: number) => y0 + h * Math.pow(r / rows, 1.15);
  switch (style) {
    case 'checker': {
      const tw = 9;
      for (let r = 0; r < rows; r++) {
        const ta = r / rows;
        const tb = (r + 1) / rows;
        for (let x = bxa - tw * 3, i = 0; x < bxb + tw * 3; x += tw, i++) {
          if ((i + r) % 2) continue;
          ctx.fillStyle = alt;
          ctx.beginPath();
          ctx.moveTo(proj(x, ta), rowY(r));
          ctx.lineTo(proj(x + tw, ta), rowY(r));
          ctx.lineTo(proj(x + tw, tb), rowY(r + 1));
          ctx.lineTo(proj(x, tb), rowY(r + 1));
          ctx.fill();
        }
      }
      break;
    }
    case 'grate': {
      ctx.strokeStyle = rgba('#000000', 0.5);
      ctx.lineWidth = 0.9;
      for (let x = bxa - 20; x < bxb + 20; x += 3) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(proj(x, 1), y1);
        ctx.stroke();
      }
      ctx.fillStyle = rgba('#ffffff', 0.12);
      for (let r = 1; r < rows; r++) ctx.fillRect(0, rowY(r), w, 0.5);
      break;
    }
    case 'planks': {
      for (let r = 0; r < rows; r++) {
        const ya = rowY(r);
        const yb = rowY(r + 1);
        let x = bxa - 30 - hash2(r, 3) * 30;
        while (x < bxb + 30) {
          const len = 24 + hash2(Math.floor(x), r) * 26;
          ctx.fillStyle = shade(base, hash2(Math.floor(x), r, 5) * 0.18 - 0.09);
          ctx.beginPath();
          ctx.moveTo(proj(x, r / rows), ya + 0.25);
          ctx.lineTo(proj(x + len - 0.6, r / rows), ya + 0.25);
          ctx.lineTo(proj(x + len - 0.6, (r + 1) / rows), yb - 0.25);
          ctx.lineTo(proj(x, (r + 1) / rows), yb - 0.25);
          ctx.fill();
          x += len;
        }
        ctx.fillStyle = rgba('#000000', 0.32);
        ctx.fillRect(0, ya, w, 0.5);
      }
      break;
    }
    case 'tiles':
    case 'polished': {
      ctx.strokeStyle = rgba(alt, 0.6);
      ctx.lineWidth = 0.45;
      for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, rowY(r));
        ctx.lineTo(w, rowY(r));
        ctx.stroke();
      }
      for (let x = bxa - 40; x < bxb + 40; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(proj(x, 1), y1);
        ctx.stroke();
      }
      if (style === 'polished') {
        ctx.fillStyle = vgrad(ctx, y0, y1, [
          [0, rgba('#ffffff', 0.0)],
          [0.6, rgba('#ffffff', 0.1)],
          [1, rgba('#ffffff', 0.0)],
        ]);
        ctx.fillRect(0, y0, w, h);
      }
      break;
    }
    case 'rubber': {
      ctx.fillStyle = rgba('#000000', 0.25);
      for (let x = 0; x < w; x += 4) for (let y = y0 + 1; y < y1; y += 3) ctx.fillRect(x + ((y * 7) % 4), y, 1.2, 0.8);
      break;
    }
    case 'concrete': {
      ctx.strokeStyle = rgba('#000000', 0.2);
      ctx.lineWidth = 0.6;
      for (let x = bxa + 30; x < bxb; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(proj(x, 1), y1);
        ctx.stroke();
      }
      break;
    }
    case 'carpet': {
      ctx.fillStyle = rgba(alt, 0.5);
      for (let r = 0; r < rows; r++) {
        const y = (rowY(r) + rowY(r + 1)) / 2;
        for (let x = bxa - 20; x < bxb + 20; x += 8) {
          ctx.beginPath();
          ctx.ellipse(proj(x + (r % 2) * 4, (r + 0.5) / rows), y, 1.3, 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'mats': {
      for (let x = bxa - 30, i = 0; x < bxb + 30; x += 30, i++) {
        ctx.fillStyle = i % 2 ? base : alt;
        ctx.beginPath();
        ctx.moveTo(x, y0 + 0.6);
        ctx.lineTo(x + 29, y0 + 0.6);
        ctx.lineTo(proj(x + 29, 1), y1);
        ctx.lineTo(proj(x, 1), y1);
        ctx.fill();
      }
      break;
    }
  }
  grit(ctx, 0, y0, w, h, 0.12, 0.35);
  // wall/floor contact shadow and front highlight
  ctx.fillStyle = vgrad(ctx, y0, y0 + 4.5, [
    [0, rgba('#000000', 0.5)],
    [1, rgba('#000000', 0)],
  ]);
  ctx.fillRect(0, y0, w, 4.5);
  ctx.fillStyle = rgba('#ffffff', 0.08);
  ctx.fillRect(0, y1 - 1.2, w, 1.2);
  ctx.restore();
}

/** Ceiling plane (perspective) with lamp fixtures; returns lamp x positions (back-wall space). */
export function paintCeiling(ctx: Ctx, w: number, lampColor = '#ffe2a8', lampStep = 70, fixture = '#3a424c'): number[] {
  const bxa = bx0();
  const bxb = bx1(w);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(IX0, CEIL_FRONT);
  ctx.lineTo(w - IX0, CEIL_FRONT);
  ctx.lineTo(bxb, WALL_TOP);
  ctx.lineTo(bxa, WALL_TOP);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, CEIL_FRONT, WALL_TOP, [
    [0, '#161a1f'],
    [1, '#2c343d'],
  ]);
  ctx.fillRect(0, CEIL_FRONT, w, WALL_TOP - CEIL_FRONT);
  // ceiling panels converging
  ctx.strokeStyle = rgba('#000000', 0.4);
  ctx.lineWidth = 0.7;
  const cx = w / 2;
  const kf = (w - 2 * IX0) / (bxb - bxa);
  for (let x = bxa + 20; x < bxb; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, WALL_TOP);
    ctx.lineTo(cx + (x - cx) * kf, CEIL_FRONT);
    ctx.stroke();
  }
  ctx.restore();
  const lamps: number[] = [];
  const n = Math.max(1, Math.round((bxb - bxa) / lampStep));
  const ly = (CEIL_FRONT + WALL_TOP) / 2 + 1;
  for (let i = 0; i < n; i++) {
    const lx = bxa + ((i + 0.5) * (bxb - bxa)) / n;
    lamps.push(lx);
    box(ctx, lx - 10, ly - 2.2, 20, 3.8, fixture, 1.2);
    fillRR(ctx, lx - 8, ly + 1.2, 16, 1.8, 0.8, lampColor);
    ctx.fillStyle = rgba('#ffffff', 0.7);
    ctx.fillRect(lx - 6, ly + 1.5, 12, 0.6);
  }
  return lamps;
}

/** Baked lamp lighting on back wall, side walls and floor. */
export function paintLampLight(ctx: Ctx, w: number, lamps: number[], color = '#ffd9a0', strength = 0.38) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(IX0, CEIL_FRONT, w - IX0 * 2, FLOOR_FRONT - CEIL_FRONT);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  const ly = (CEIL_FRONT + WALL_TOP) / 2 + 3;
  for (const lx of lamps) {
    // volumetric cone
    const g = ctx.createLinearGradient(0, ly, 0, WALL_BOTTOM + 8);
    g.addColorStop(0, rgba(color, strength * 0.55));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(lx - 8, ly);
    ctx.lineTo(lx + 8, ly);
    ctx.lineTo(lx + 42, WALL_BOTTOM + 12);
    ctx.lineTo(lx - 42, WALL_BOTTOM + 12);
    ctx.closePath();
    ctx.fill();
    // hot spot on the wall
    ctx.fillStyle = rgrad(ctx, lx, WALL_TOP + 2, 0, 36, [
      [0, rgba(color, strength * 0.8)],
      [1, rgba(color, 0)],
    ]);
    ctx.fillRect(lx - 36, WALL_TOP, 72, 36);
    // floor pool
    ctx.save();
    ctx.translate(lx, (WALL_BOTTOM + FLOOR_FRONT) / 2 + 1);
    ctx.scale(1, 0.22);
    ctx.fillStyle = rgrad(ctx, 0, 0, 0, 44, [
      [0, rgba(color, strength * 0.8)],
      [1, rgba(color, 0)],
    ]);
    ctx.fillRect(-44, -44, 88, 88);
    ctx.restore();
  }
  ctx.restore();
}

/** Ambient occlusion and light falloff in the corners of the box. */
export function paintAO(ctx: Ctx, w: number) {
  const bxa = bx0();
  const bxb = bx1(w);
  ctx.fillStyle = hgrad(ctx, bxa, bxa + 16, [
    [0, rgba('#000000', 0.42)],
    [1, rgba('#000000', 0)],
  ]);
  ctx.fillRect(bxa, WALL_TOP, 16, WALL_BOTTOM - WALL_TOP);
  ctx.fillStyle = hgrad(ctx, bxb - 16, bxb, [
    [0, rgba('#000000', 0)],
    [1, rgba('#000000', 0.42)],
  ]);
  ctx.fillRect(bxb - 16, WALL_TOP, 16, WALL_BOTTOM - WALL_TOP);
  ctx.fillStyle = vgrad(ctx, WALL_TOP, WALL_TOP + 12, [
    [0, rgba('#000000', 0.5)],
    [1, rgba('#000000', 0)],
  ]);
  ctx.fillRect(bxa, WALL_TOP, bxb - bxa, 12);
  // front darkening near the opening edges (vignette)
  ctx.fillStyle = hgrad(ctx, IX0, IX0 + 22, [
    [0, rgba('#000000', 0.35)],
    [1, rgba('#000000', 0)],
  ]);
  ctx.fillRect(IX0, CEIL_FRONT, 22, FLOOR_FRONT - CEIL_FRONT);
  ctx.fillStyle = hgrad(ctx, w - IX0 - 22, w - IX0, [
    [0, rgba('#000000', 0)],
    [1, rgba('#000000', 0.35)],
  ]);
  ctx.fillRect(w - IX0 - 22, CEIL_FRONT, 22, FLOOR_FRONT - CEIL_FRONT);
}

/** Soft contact shadow for props standing on the floor. */
export function propShadow(ctx: Ctx, cx: number, w: number, y = WALL_BOTTOM + 2, a = 0.42) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(1, 0.24);
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, w / 2, [
    [0, rgba('#000000', a)],
    [1, rgba('#000000', 0)],
  ]);
  ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.restore();
}

/** Wall-mounted sign plate with stencil text. */
export function signPlate(ctx: Ctx, cx: number, y: number, label: string, bg: string, fg: string, fontSize = 5.2) {
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  const tw = ctx.measureText(label).width + 8;
  box(ctx, cx - tw / 2, y, tw, fontSize + 4, bg, 1.2);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + (fontSize + 4) / 2 + 0.3);
}

export function levelTrim(ctx: Ctx, w: number, level: number) {
  if (level < 2) return;
  const c = level === 3 ? '#e8b64a' : '#b9c3cc';
  ctx.fillStyle = c;
  ctx.fillRect(bx0(), WALL_TOP, bx1(w) - bx0(), 1);
  ctx.fillStyle = rgba(c, 0.7);
  ctx.fillRect(bx0(), WALL_BOTTOM - 3.8, bx1(w) - bx0(), 0.7);
}

export { hazard, mix };
