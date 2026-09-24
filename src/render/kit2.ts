/* Second furniture kit: lab, office, studio, medical and workshop equipment. y = floor contact unless noted. */
import { box, cylinder, fillRR, glow, hgrad, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { propShadow } from './roomBase';
import { knob, panel } from './furniture';

export const L = (lang: string, ru: string, en: string) => (lang === 'ru' ? ru : en);

/** Steel lab/work table: top slab + legs + lower shelf. */
export function steelTable(ctx: Ctx, x: number, y: number, w: number, h = 17, top = '#aab4bc', legs = '#5d6873') {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  ctx.fillStyle = shade(legs, -0.15);
  ctx.fillRect(x + 2, y - h + 2, 1.8, h - 2);
  ctx.fillRect(x + w - 3.8, y - h + 2, 1.8, h - 2);
  ctx.fillStyle = legs;
  ctx.fillRect(x + 2, y - 5, w - 4, 1.4);
  panel(ctx, x - 1, y - h - 1, w + 2, 3.2, top, 0.8);
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(x, y - h - 0.6, w, 0.6);
}

/** Wooden desk with a drawer pedestal on one side. */
export function woodDesk(ctx: Ctx, x: number, y: number, w: number, h: number, wood: string, pedestal: 'l' | 'r' | 'both' = 'r') {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.45);
  const pw = Math.min(18, w * 0.32);
  const peds = pedestal === 'both' ? [x + 1, x + w - pw - 1] : pedestal === 'l' ? [x + 1] : [x + w - pw - 1];
  // modesty panel
  panel(ctx, x + 2, y - h + 3, w - 4, h - 9, shade(wood, -0.28), 0.6);
  for (const px of peds) {
    panel(ctx, px, y - h + 2, pw, h - 2, wood, 0.8);
    const n = 3;
    for (let i = 0; i < n; i++) {
      const dy = y - h + 4 + (i * (h - 6)) / n;
      ctx.strokeStyle = rgba(shade(wood, -0.6), 0.7);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px + 1.5, dy, pw - 3, (h - 8) / n);
      knob(ctx, px + pw / 2, dy + (h - 8) / n / 2, 0.7, '#d9b35f');
    }
  }
  panel(ctx, x - 1.5, y - h - 2, w + 3, 3.4, shade(wood, 0.12), 0.8);
}

/** CRT terminal (monitor on a small case). x,y = bottom-left. */
export function crt(ctx: Ctx, x: number, y: number, s = 1, glowC = '#6aff8c', body = '#cfc8b4') {
  const w = 16 * s;
  const h = 13 * s;
  fillRR(ctx, x + w * 0.25, y - 2 * s, w * 0.5, 2 * s, 0.5, shade(body, -0.2));
  panel(ctx, x, y - h - 2 * s, w, h, body, 2 * s);
  fillRR(ctx, x + 2 * s, y - h, w - 4 * s, h - 4.4 * s, 1.6 * s, '#0b1510');
  ctx.fillStyle = rgrad(ctx, x + w / 2, y - h / 2 - 3 * s, 0, w * 0.6, [
    [0, rgba(glowC, 0.35)],
    [1, rgba(glowC, 0.05)],
  ]);
  rrect(ctx, x + 2 * s, y - h, w - 4 * s, h - 4.4 * s, 1.6 * s);
  ctx.fill();
  ctx.fillStyle = rgba(glowC, 0.8);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 3.5 * s, y - h + 2 * s + i * 1.8 * s, (5 + ((i * 7) % 5)) * s, 0.7 * s);
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(x + 2.5 * s, y - h + 0.5 * s, w - 5 * s, 1.2 * s);
}

/** Glass-front cabinet; contents drawn via callback inside the glass (shelf y positions passed). */
export function glassCabinet(ctx: Ctx, x: number, y: number, w: number, h: number, frameC: string, shelves: number, fill: (sy: number, x0: number, x1: number, i: number) => void) {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  panel(ctx, x, y - h, w, h, frameC, 1.4);
  const gx = x + 2;
  const gy = y - h + 2;
  const gw = w - 4;
  const gh = h - 12;
  fillRR(ctx, gx, gy, gw, gh, 0.6, shade(frameC, -0.45));
  for (let i = 0; i < shelves; i++) {
    const sy = gy + ((i + 1) * gh) / shelves - 0.6;
    fill(sy, gx + 1, gx + gw - 1, i);
    ctx.fillStyle = shade(frameC, 0.2);
    ctx.fillRect(gx, sy, gw, 1);
  }
  // glass sheen
  ctx.fillStyle = rgba('#dff3ff', 0.12);
  ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle = rgba('#ffffff', 0.35);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(gx + gw * 0.2, gy + gh);
  ctx.lineTo(gx + gw * 0.55, gy);
  ctx.stroke();
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.fillRect(x + w / 2 - 0.3, gy, 0.6, gh);
  // lower drawer
  ctx.strokeStyle = rgba(shade(frameC, -0.6), 0.6);
  ctx.strokeRect(x + 2, y - 9, w - 4, 7);
  knob(ctx, x + w / 2, y - 5.5, 0.7);
}

export function bottleRow(ctx: Ctx, x0: number, x1: number, y: number, cols: string[], h = 5, seed = 0) {
  let x = x0 + 0.5;
  let i = seed;
  while (x < x1 - 2) {
    const c = cols[i % cols.length];
    const bw = 2 + (i % 2) * 0.6;
    const bh = h - (i % 3) * 0.8;
    fillRR(ctx, x, y - bh, bw, bh, 0.6, c);
    ctx.fillStyle = shade(c, -0.3);
    ctx.fillRect(x + bw * 0.3, y - bh - 1.2, bw * 0.4, 1.2);
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(x + 0.3, y - bh + 0.6, 0.4, bh - 1.2);
    x += bw + 0.9;
    i++;
  }
}

/** Office chair (high back, seen from the front). */
export function officeChair(ctx: Ctx, x: number, y: number, c = '#5a2e2a', tall = true) {
  const h = tall ? 30 : 22;
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(x - 0.8, y - 9, 1.6, 7);
  ctx.fillRect(x - 6, y - 2, 12, 1.2);
  fillRR(ctx, x - 7, y - h, 14, h - 11, 3, vgrad(ctx, y - h, y - 11, [
    [0, shade(c, 0.2)],
    [1, shade(c, -0.25)],
  ]));
  ctx.strokeStyle = rgba(shade(c, -0.6), 0.8);
  ctx.lineWidth = 0.6;
  rrect(ctx, x - 7, y - h, 14, h - 11, 3);
  ctx.stroke();
  // tufting
  ctx.fillStyle = rgba(shade(c, -0.5), 0.6);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) ctx.fillRect(x - 3.5 + k * 7, y - h + 4 + i * 5, 0.8, 0.8);
  fillRR(ctx, x - 8, y - 13, 16, 4, 1.6, shade(c, -0.05));
}

/** Filing cabinet with n drawers. */
export function filingCabinet(ctx: Ctx, x: number, y: number, w: number, n: number, c = '#8a959e') {
  propShadow(ctx, x + w / 2, w + 4, y + 1, 0.35);
  const h = n * 9 + 2;
  panel(ctx, x, y - h, w, h, c, 1);
  for (let i = 0; i < n; i++) {
    const dy = y - h + 1.5 + i * 9;
    ctx.strokeStyle = rgba(shade(c, -0.55), 0.7);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 1.2, dy, w - 2.4, 8);
    fillRR(ctx, x + w / 2 - 3, dy + 2.4, 6, 1.4, 0.5, shade(c, 0.35));
    fillRR(ctx, x + w / 2 - 2, dy + 4.4, 4, 2, 0.3, '#efe8d6');
  }
}

/** Standing globe on a wooden stand. */
export function globe(ctx: Ctx, x: number, y: number, r = 6) {
  propShadow(ctx, x, r * 2.4, y + 1, 0.35);
  ctx.fillStyle = '#6b4428';
  ctx.fillRect(x - 0.7, y - r * 1.8, 1.4, r * 1.8);
  fillRR(ctx, x - r * 0.8, y - 1.5, r * 1.6, 1.5, 0.6, '#5a3a24');
  const cy = y - r * 2 - 2;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - r * 0.35, cy - r * 0.35, 0, r * 1.2, [
    [0, '#8fd0e6'],
    [1, '#2f6f8f'],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#6fa45a';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.3, cy - r * 0.2, r * 0.45, r * 0.3, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, cy + r * 0.35, r * 0.3, r * 0.4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, cy, r + 1.2, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.stroke();
}

/** Flag on a pole. */
export function flagPole(ctx: Ctx, x: number, y: number, h: number, c: string, emblem: string) {
  propShadow(ctx, x, 10, y + 1, 0.35);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - 0.6, y - h, 1.2, h);
  ctx.beginPath();
  ctx.arc(x, y - h - 1, 1.3, 0, Math.PI * 2);
  ctx.fill();
  fillRR(ctx, x - 3, y - 1.6, 6, 1.6, 0.6, '#5a3a24');
  const fy = y - h + 2;
  ctx.beginPath();
  ctx.moveTo(x + 0.6, fy);
  ctx.bezierCurveTo(x + 8, fy - 1.5, x + 12, fy + 2, x + 18, fy + 0.5);
  ctx.lineTo(x + 18, fy + 14);
  ctx.bezierCurveTo(x + 12, fy + 15.5, x + 8, fy + 12.5, x + 0.6, fy + 14);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x, x + 18, [
    [0, shade(c, -0.1)],
    [0.4, shade(c, 0.15)],
    [0.7, shade(c, -0.15)],
    [1, shade(c, 0.05)],
  ]);
  ctx.fill();
  ctx.fillStyle = emblem;
  ctx.beginPath();
  ctx.arc(x + 9.4, fy + 7, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x + 9.4, fy + 7, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Gold picture frame with a portrait (little bust). */
export function portrait(ctx: Ctx, x: number, y: number, w: number, h: number, bg = '#2f4a5a', suit = '#2d4a8a', skin = '#e7b38f') {
  fillRR(ctx, x - 2, y - 2, w + 4, h + 4, 1.2, vgrad(ctx, y - 2, y + h + 2, [
    [0, '#f2cf6a'],
    [0.5, '#b8862e'],
    [1, '#7a5418'],
  ]));
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h * 0.4, 0, w, [
    [0, shade(bg, 0.3)],
    [1, shade(bg, -0.3)],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = suit;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 2, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f0ea';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 2.2, y + h * 0.7);
  ctx.lineTo(x + w / 2 + 2.2, y + h * 0.7);
  ctx.lineTo(x + w / 2, y + h * 0.92);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.45, w * 0.19, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b6b6b';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.3, w * 0.2, h * 0.08, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x + w / 2 - 2.4, y + h * 0.44, 1.2, 0.8);
  ctx.fillRect(x + w / 2 + 1.2, y + h * 0.44, 1.2, 0.8);
  ctx.fillStyle = '#6b6b6b';
  ctx.fillRect(x + w / 2 - 2.4, y + h * 0.53, 4.8, 1);
  ctx.restore();
  // plaque
  fillRR(ctx, x + w / 2 - 5, y + h - 3, 10, 2.4, 0.5, '#c9a24a');
}

/** Hanging pendant lamp (with glow). y = ceiling mount. */
export function pendantLamp(ctx: Ctx, x: number, y: number, len: number, c = '#2f5a4a', light = '#ffd9a0', on = true) {
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 1.6, y + len);
  ctx.lineTo(x + 1.6, y + len);
  ctx.lineTo(x + 5, y + len + 4);
  ctx.lineTo(x - 5, y + len + 4);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y + len, y + len + 4, [
    [0, shade(c, 0.2)],
    [1, shade(c, -0.2)],
  ]);
  ctx.fill();
  if (on) {
    ctx.fillStyle = shade(light, 0.3);
    ctx.fillRect(x - 3.6, y + len + 3.6, 7.2, 0.8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y + len + 5, 18, light, 0.3);
    ctx.restore();
  }
}

/** Floor-standing loudspeaker. */
export function speaker(ctx: Ctx, x: number, y: number, w: number, h: number, c = '#2a2530') {
  propShadow(ctx, x + w / 2, w + 4, y + 1, 0.45);
  panel(ctx, x, y - h, w, h, c, 1.4);
  const cones = [
    [y - h * 0.72, w * 0.22],
    [y - h * 0.32, w * 0.36],
  ];
  for (const [cy, r] of cones) {
    ctx.beginPath();
    ctx.arc(x + w / 2, cy, r + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#121014';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w / 2, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = rgrad(ctx, x + w / 2 - r * 0.3, cy - r * 0.3, 0, r * 1.2, [
      [0, '#4a4550'],
      [1, '#16141a'],
    ]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w / 2, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#5a5560';
    ctx.fill();
  }
}

/** Vinyl record crate/shelf. */
export function recordShelf(ctx: Ctx, x: number, y: number, w: number, h: number) {
  propShadow(ctx, x + w / 2, w + 4, y + 1, 0.35);
  panel(ctx, x, y - h, w, h, '#4a3326', 1);
  const rows = Math.floor((h - 4) / 12);
  const cols = ['#c7433b', '#2f5d99', '#e0b44a', '#1c1c1c', '#7a4f9a', '#3f8a5a', '#d9d2c0'];
  for (let r = 0; r < rows; r++) {
    const ry = y - h + 3 + r * 12;
    fillRR(ctx, x + 1.5, ry, w - 3, 10.5, 0.5, '#20150f');
    for (let i = 0; i < Math.floor((w - 4) / 1.6); i++) {
      ctx.fillStyle = cols[(i * 3 + r * 5) % cols.length];
      const lean = ((i + r) % 5) * 0.2;
      ctx.fillRect(x + 2 + i * 1.6 + lean, ry + 1 + ((i * 7) % 3) * 0.4, 1.1, 9.4 - ((i * 7) % 3) * 0.4);
    }
  }
}

/** Crate of soda bottles (plastic crate with bottle necks). */
export function bottleCrate(ctx: Ctx, x: number, y: number, w: number, c = '#c7433b', bottle = '#6fbf8a') {
  const h = 7;
  for (let i = 0; i < Math.floor(w / 3.2); i++) {
    const bx = x + 1.2 + i * 3.2;
    fillRR(ctx, bx, y - h - 4.5, 2.2, 6, 0.8, rgba(bottle, 0.9));
    ctx.fillStyle = '#d9d2c0';
    ctx.fillRect(bx + 0.5, y - h - 5.4, 1.2, 1);
  }
  box(ctx, x, y - h, w, h, c, 0.8);
  ctx.fillStyle = rgba('#000', 0.35);
  for (let i = 0; i < Math.floor(w / 4); i++) fillRR(ctx, x + 1.5 + i * 4, y - h + 2, 2.6, 2.4, 0.6, rgba('#000', 0.35));
}

/** Gas cylinder chained to the wall. */
export function gasCylinder(ctx: Ctx, x: number, y: number, h: number, c: string, label?: string) {
  propShadow(ctx, x + 3.5, 10, y + 1, 0.35);
  cylinder(ctx, x, y - h, 7, h, c, 2.4);
  ctx.beginPath();
  ctx.arc(x + 3.5, y - h, 3.2, Math.PI, 0);
  ctx.fillStyle = shade(c, 0.1);
  ctx.fill();
  fillRR(ctx, x + 2.2, y - h - 5, 2.6, 3, 0.5, '#b0b8bf');
  fillRR(ctx, x + 1.2, y - h - 5.6, 4.6, 1.2, 0.5, '#6b747c');
  if (label) {
    ctx.save();
    ctx.translate(x + 3.5, y - h * 0.45);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '700 3.2px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba('#ffffff', 0.85);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

export function chain(ctx: Ctx, x0: number, x1: number, y: number) {
  ctx.strokeStyle = '#8a939a';
  ctx.lineWidth = 0.5;
  for (let x = x0; x < x1; x += 2) {
    ctx.beginPath();
    ctx.ellipse(x + 1, y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * 1.5, 1.1, 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Tall glass tank with liquid (vertical), including metal caps. */
export function glassTank(ctx: Ctx, x: number, y: number, w: number, h: number, liquid: string, level: number, cap = '#6d7883') {
  propShadow(ctx, x + w / 2, w + 8, y + 1, 0.45);
  box(ctx, x - 1.5, y - 6, w + 3, 6, cap, 1);
  box(ctx, x - 1.5, y - h, w + 3, 6, cap, 1);
  const gy = y - h + 6;
  const gh = h - 12;
  ctx.fillStyle = rgba('#cfe9f0', 0.22);
  ctx.fillRect(x, gy, w, gh);
  const lh = gh * level;
  ctx.fillStyle = hgrad(ctx, x, x + w, [
    [0, shade(liquid, -0.35)],
    [0.35, shade(liquid, 0.25)],
    [1, shade(liquid, -0.45)],
  ]);
  ctx.fillRect(x, gy + gh - lh, w, lh);
  ctx.fillStyle = rgba(shade(liquid, 0.5), 0.8);
  ctx.fillRect(x, gy + gh - lh, w, 0.8);
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(x + w * 0.18, gy + 1, 1, gh - 2);
  ctx.strokeStyle = rgba('#ffffff', 0.25);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, gy, w, gh);
}

/** Round warning sign (radiation etc.) */
export function warnSign(ctx: Ctx, cx: number, cy: number, r: number, bg = '#f2c230') {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.7);
  ctx.lineTo(cx - r * 0.95, cy + r * 0.7);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - r * 0.08, cy - r * 0.45, r * 0.16, r * 0.62);
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.38, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

/** Trefoil radiation symbol. */
export function trefoil(ctx: Ctx, cx: number, cy: number, r: number, bg = '#f2c230', fg = '#1a1a1a') {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.82, a - 0.5, a + 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = fg;
  ctx.fill();
}

/** Reel-to-reel spool (static part); dynamic spokes are drawn with reelSpokes. */
export function reelSpokes(ctx: Ctx, cx: number, cy: number, r: number, rot: number, c = '#b8c0c6') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2622';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#4a3a2a';
  ctx.fill();
  ctx.fillStyle = c;
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#e8e2d4';
  ctx.fill();
  ctx.restore();
}

/** Round-bottom flask on a ring stand; y = floor contact of the stand. */
export function roundFlask(ctx: Ctx, cx: number, cy: number, r: number, liquid: string, level = 0.5) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#dff3f7', 0.3);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = liquid;
  ctx.fillRect(cx - r, cy + r - r * 2 * level, r * 2, r * 2 * level);
  ctx.restore();
  ctx.fillStyle = rgba('#dff3f7', 0.4);
  ctx.fillRect(cx - r * 0.25, cy - r * 1.7, r * 0.5, r * 0.8);
  ctx.strokeStyle = rgba('#ffffff', 0.6);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.5);
  ctx.stroke();
}

/** Simple wall shelf bracket plank. */
export function wallShelf(ctx: Ctx, x: number, y: number, w: number, wood = '#7a5236') {
  box(ctx, x, y, w, 2, wood, 0.4);
  ctx.fillStyle = shade(wood, -0.35);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2);
  ctx.lineTo(x + 3, y + 5);
  ctx.lineTo(x + 6, y + 2);
  ctx.moveTo(x + w - 3, y + 2);
  ctx.lineTo(x + w - 3, y + 5);
  ctx.lineTo(x + w - 6, y + 2);
  ctx.fill();
}

/** Blackboard / chalkboard with wooden frame; draw() writes on it. */
export function chalkboard(ctx: Ctx, x: number, y: number, w: number, h: number, draw?: (x: number, y: number, w: number, h: number) => void, bg = '#2f4a3a') {
  fillRR(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, 1, '#7a5236');
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h / 2, 0, w * 0.7, [
    [0, shade(bg, 0.08)],
    [1, shade(bg, -0.2)],
  ]);
  ctx.fillRect(x, y, w, h);
  // chalk smudges
  ctx.fillStyle = rgba('#ffffff', 0.05);
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.6, w * 0.2, h * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fill();
  if (draw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    draw(x, y, w, h);
    ctx.restore();
  }
  box(ctx, x + 2, y + h + 1, w - 4, 1.6, '#8a6040', 0.3);
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(x + w * 0.7, y + h + 0.2, 3, 0.9);
}

export function chalkText(ctx: Ctx, s: string, x: number, y: number, size: number, align: CanvasTextAlign = 'left') {
  ctx.font = `500 ${size}px Rubik, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba('#f4f4ec', 0.88);
  ctx.fillText(s, x, y);
}
