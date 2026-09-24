/* Reusable illustrated props (world units). */
import { box, cylinder, fillRR, glow, hgrad, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { WALL_BOTTOM } from './world';
import { propShadow } from './roomBase';

export function bolt(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(x + s * 0.55, y);
  ctx.lineTo(x + s * 0.1, y + s * 0.58);
  ctx.lineTo(x + s * 0.45, y + s * 0.58);
  ctx.lineTo(x + s * 0.3, y + s);
  ctx.lineTo(x + s * 0.9, y + s * 0.35);
  ctx.lineTo(x + s * 0.55, y + s * 0.35);
  ctx.lineTo(x + s * 0.75, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function crate(ctx: Ctx, x: number, y: number, w: number, h: number, base = '#a4733f') {
  box(ctx, x, y, w, h, base, 0.8);
  ctx.strokeStyle = rgba(shade(base, -0.45), 0.8);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.beginPath();
  ctx.moveTo(x + 1.5, y + 1.5);
  ctx.lineTo(x + w - 1.5, y + h - 1.5);
  ctx.stroke();
}

export function metalCrate(ctx: Ctx, x: number, y: number, w: number, h: number, base = '#5f7a5a', label?: string) {
  box(ctx, x, y, w, h, base, 1);
  ctx.fillStyle = rgba('#000000', 0.25);
  ctx.fillRect(x + 1, y + h * 0.35, w - 2, 0.7);
  ctx.fillRect(x + 1, y + h * 0.7, w - 2, 0.7);
  if (label) {
    ctx.font = `700 ${Math.min(4, h * 0.3)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba('#f4efe0', 0.8);
    ctx.fillText(label, x + w / 2, y + h * 0.53);
  }
}

export function barrel(ctx: Ctx, x: number, y: number, w: number, h: number, base = '#3f6fa5', stripe = '#f2c230') {
  cylinder(ctx, x, y, w, h, base, 2.4);
  ctx.fillStyle = rgba(stripe, 0.9);
  ctx.fillRect(x + 0.4, y + h * 0.3, w - 0.8, 1.4);
  ctx.fillRect(x + 0.4, y + h * 0.68, w - 0.8, 1.4);
}

export function plant(ctx: Ctx, x: number, y: number, s = 1, pot = '#b0643a', leaf = '#4f9b4a') {
  // y is floor contact
  propShadow(ctx, x, 12 * s, y + 1, 0.35);
  box(ctx, x - 4 * s, y - 7 * s, 8 * s, 7 * s, pot, 1.2);
  const leaves = [
    [-6, -14, -0.6],
    [5, -15, 0.6],
    [-2, -19, -0.15],
    [3, -12, 0.9],
    [-7, -10, -1.1],
    [0, -21, 0.1],
  ];
  for (const [lx, ly, rot] of leaves) {
    ctx.save();
    ctx.translate(x + lx * s * 0.5, y - 7 * s);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, (ly * s) / 2, 2.2 * s, (-ly * s) / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = vgrad(ctx, ly * s, 0, [
      [0, shade(leaf, 0.25)],
      [1, shade(leaf, -0.3)],
    ]);
    ctx.fill();
    ctx.restore();
  }
}

export function bed(ctx: Ctx, x: number, y: number, w: number, frame = '#7a4f33', sheet = '#e9e4da', blanket = '#3f6fa5') {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.4);
  // headboard
  box(ctx, x, y - 22, 5, 22, frame, 1.2);
  box(ctx, x + w - 4, y - 14, 4, 14, frame, 1);
  // mattress
  box(ctx, x + 3, y - 12, w - 6, 5, sheet, 1.5);
  // pillow
  fillRR(ctx, x + 5, y - 15, 11, 4.5, 2, shade(sheet, 0.1));
  // blanket
  rrect(ctx, x + 14, y - 13, w - 18, 7, 2);
  ctx.fillStyle = vgrad(ctx, y - 13, y - 6, [
    [0, shade(blanket, 0.18)],
    [1, shade(blanket, -0.25)],
  ]);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(x + 16, y - 11, w - 22, 0.7);
  // legs
  ctx.fillStyle = shade(frame, -0.3);
  ctx.fillRect(x + 4, y - 7, 2, 7);
  ctx.fillRect(x + w - 6, y - 7, 2, 7);
}

export function sofa(ctx: Ctx, x: number, y: number, w: number, color = '#c0504d') {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.45);
  box(ctx, x + 2, y - 17, w - 4, 10, shade(color, -0.08), 3);
  box(ctx, x, y - 10, w, 7, color, 2.5);
  box(ctx, x - 1, y - 13, 5, 10, shade(color, 0.05), 2);
  box(ctx, x + w - 4, y - 13, 5, 10, shade(color, 0.05), 2);
  ctx.fillStyle = rgba('#000000', 0.25);
  ctx.fillRect(x + w / 2, y - 16, 0.6, 7);
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(x + 2, y - 3, 1.6, 3);
  ctx.fillRect(x + w - 3.6, y - 3, 1.6, 3);
}

export function floorLamp(ctx: Ctx, x: number, y: number, shadeC = '#f2d7a0') {
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 0.5, y - 30, 1, 30);
  fillRR(ctx, x - 3, y - 1.5, 6, 1.5, 0.6, '#2b2b2b');
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 30);
  ctx.lineTo(x + 4, y - 30);
  ctx.lineTo(x + 6, y - 38);
  ctx.lineTo(x - 6, y - 38);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 38, y - 30, [
    [0, shade(shadeC, 0.2)],
    [1, shadeC],
  ]);
  ctx.fill();
}

export function tvSet(ctx: Ctx, x: number, y: number, screen = '#7fb7c9') {
  // console tv on legs
  propShadow(ctx, x + 11, 26, y + 1);
  ctx.fillStyle = '#4a3222';
  ctx.fillRect(x + 3, y - 5, 1.4, 5);
  ctx.fillRect(x + 18, y - 5, 1.4, 5);
  box(ctx, x, y - 21, 22, 16, '#8a5a36', 2);
  fillRR(ctx, x + 2.5, y - 19, 13, 11, 2.5, '#1b2328');
  fillRR(ctx, x + 3.5, y - 18, 11, 9, 2, rgrad(ctx, x + 9, y - 13.5, 0, 9, [[0, shade(screen, 0.3)], [1, shade(screen, -0.4)]]));
  ctx.fillStyle = '#d9c08a';
  ctx.beginPath();
  ctx.arc(x + 18.5, y - 16, 1.3, 0, Math.PI * 2);
  ctx.arc(x + 18.5, y - 12, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 21);
  ctx.lineTo(x + 5, y - 28);
  ctx.moveTo(x + 11, y - 21);
  ctx.lineTo(x + 16, y - 28);
  ctx.stroke();
}

export function frame(ctx: Ctx, x: number, y: number, w: number, h: number, art: (cx: number, cy: number, w: number, h: number) => void, fc = '#6b4428') {
  box(ctx, x, y, w, h, fc, 0.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.clip();
  art(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.restore();
}

export function landscapeArt(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [
    [0, '#8fc7e0'],
    [0.6, '#f3d7a4'],
    [1, '#b98a57'],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#6f8f5a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.3, y + h * 0.55);
  ctx.lineTo(x + w * 0.55, y + h * 0.8);
  ctx.lineTo(x + w * 0.8, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.75);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(x + w * 0.75, y + h * 0.3, h * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function shelfUnit(ctx: Ctx, x: number, y: number, w: number, h: number, wood = '#6b4a32', levels = 3) {
  propShadow(ctx, x + w / 2, w + 4, y + 1, 0.35);
  box(ctx, x, y - h, 2, h, wood, 0.5);
  box(ctx, x + w - 2, y - h, 2, h, wood, 0.5);
  for (let i = 0; i <= levels; i++) {
    const sy = y - h + (i * (h - 2)) / levels;
    box(ctx, x, sy, w, 1.8, shade(wood, 0.1), 0.3);
  }
}

export function books(ctx: Ctx, x: number, y: number, w: number, seed = 0) {
  const cols = ['#b5403a', '#3a6ea5', '#e0b44a', '#4f8a4a', '#7a4f9a', '#d9d2c0', '#2f3b4a'];
  let bx = x;
  let i = seed;
  while (bx < x + w - 1.5) {
    const bw = 1.4 + ((i * 7) % 3) * 0.5;
    const bh = 5 + ((i * 5) % 3);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(bx, y - bh, bw, bh);
    ctx.fillStyle = rgba('#ffffff', 0.2);
    ctx.fillRect(bx, y - bh, 0.4, bh);
    bx += bw + 0.25;
    i++;
  }
}

export function consolePanel(ctx: Ctx, x: number, y: number, w: number, h: number, base = '#4a5561') {
  box(ctx, x, y, w, h, base, 1.2);
  // angled top desk
  ctx.beginPath();
  ctx.moveTo(x - 1, y);
  ctx.lineTo(x + w + 1, y);
  ctx.lineTo(x + w - 2, y - 5);
  ctx.lineTo(x + 2, y - 5);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 5, y, [
    [0, shade(base, 0.3)],
    [1, shade(base, 0.05)],
  ]);
  ctx.fill();
}

export function buttonsRow(ctx: Ctx, x: number, y: number, n: number, colors = ['#e84a3c', '#f2c230', '#4fc36b', '#4aa3e8']) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x + i * 3.2, y, 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function poster(ctx: Ctx, x: number, y: number, w: number, h: number, bg: string, draw: (x: number, y: number, w: number, h: number) => void) {
  ctx.save();
  ctx.fillStyle = rgba('#000000', 0.25);
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  draw(x, y, w, h);
  ctx.restore();
  ctx.fillStyle = rgba('#ffffff', 0.12);
  ctx.fillRect(x, y, w, h * 0.3);
  ctx.fillStyle = '#c9c1ae';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 1, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function posterText(ctx: Ctx, s: string, cx: number, cy: number, size: number, color: string, weight = 700) {
  ctx.font = `${weight} ${size}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, cx, cy);
}

export function valveWheel(ctx: Ctx, cx: number, cy: number, r: number, rot = 0, color = '#c8413a') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.28;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = r * 0.18;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = shade(color, -0.3);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function wallClock(ctx: Ctx, cx: number, cy: number, r: number, t = 0) {
  ctx.beginPath();
  ctx.arc(cx, cy, r + 0.8, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3f45';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f4efe0';
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  const h = t * 0.02;
  const m = t * 0.25;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(h) * r * 0.5, cy - Math.cos(h) * r * 0.5);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(m) * r * 0.8, cy - Math.cos(m) * r * 0.8);
  ctx.stroke();
}

export function flask(ctx: Ctx, x: number, y: number, s: number, liquid: string, level = 0.55) {
  // conical flask, y = base
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 1.2 * s, y - 9 * s);
  ctx.lineTo(x + 1.2 * s, y - 9 * s);
  ctx.lineTo(x + 1.2 * s, y - 6 * s);
  ctx.lineTo(x + 4 * s, y);
  ctx.lineTo(x - 4 * s, y);
  ctx.lineTo(x - 1.2 * s, y - 6 * s);
  ctx.closePath();
  ctx.fillStyle = rgba('#dff3f7', 0.35);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = liquid;
  ctx.fillRect(x - 5 * s, y - 9 * s * level, 10 * s, 9 * s * level);
  ctx.restore();
  ctx.strokeStyle = rgba('#ffffff', 0.6);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x - 1.2 * s, y - 9 * s);
  ctx.lineTo(x - 1.2 * s, y - 6 * s);
  ctx.lineTo(x - 4 * s, y);
  ctx.stroke();
}

export function mannequin(ctx: Ctx, x: number, y: number, dress: string, accent: string) {
  propShadow(ctx, x, 12, y + 1, 0.35);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 0.5, y - 10, 1, 10);
  fillRR(ctx, x - 4, y - 1.2, 8, 1.2, 0.5, '#2a2a2a');
  // torso
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 26);
  ctx.quadraticCurveTo(x, y - 29, x + 5, y - 26);
  ctx.lineTo(x + 6, y - 10);
  ctx.lineTo(x - 6, y - 10);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x - 6, x + 6, [
    [0, shade(dress, -0.25)],
    [0.4, shade(dress, 0.15)],
    [1, shade(dress, -0.3)],
  ]);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(x - 5.5, y - 18, 11, 1.2);
  ctx.beginPath();
  ctx.arc(x, y - 30, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#d9cbb3';
  ctx.fill();
}

export function computerTower(ctx: Ctx, x: number, y: number, w: number, h: number) {
  propShadow(ctx, x + w / 2, w + 4, y + 1);
  box(ctx, x, y - h, w, h, '#c9c3b3', 1.2);
  // tape reels
  for (const ry of [y - h + 8, y - h + 8]) {
    for (const rx of [x + w * 0.3, x + w * 0.7]) {
      ctx.beginPath();
      ctx.arc(rx, ry, w * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#2d2d2d';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, w * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#9a9a9a';
      ctx.fill();
    }
  }
  box(ctx, x + 2, y - h + 15, w - 4, h - 20, '#2f3a42', 0.8);
}

export function stool(ctx: Ctx, x: number, y: number, seat = '#d23b3b') {
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(x - 0.5, y - 9, 1, 9);
  fillRR(ctx, x - 2.5, y - 1, 5, 1, 0.5, '#6d757b');
  fillRR(ctx, x - 3.5, y - 11, 7, 2.5, 1.2, seat);
  ctx.fillStyle = rgba('#ffffff', 0.3);
  ctx.fillRect(x - 3, y - 11, 6, 0.6);
}

export function arcadeCabinet(ctx: Ctx, x: number, y: number, body: string, screen = '#1b2a3a') {
  propShadow(ctx, x + 7, 18, y + 1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 30);
  ctx.lineTo(x + 3, y - 34);
  ctx.lineTo(x + 14, y - 34);
  ctx.lineTo(x + 14, y);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x, x + 14, [
    [0, shade(body, -0.3)],
    [0.3, shade(body, 0.15)],
    [1, shade(body, -0.35)],
  ]);
  ctx.fill();
  fillRR(ctx, x + 2, y - 28, 10, 9, 1, screen);
  box(ctx, x + 1, y - 17, 12, 3, shade(body, -0.2), 0.5);
  ctx.fillStyle = '#e84a3c';
  ctx.beginPath();
  ctx.arc(x + 4, y - 16, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(x + 1, y - 34, 13, 3);
}

export function lightBulbGlow(ctx: Ctx, x: number, y: number, color: string, r = 6, a = 0.5) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r, color, a);
  ctx.restore();
}

export { WALL_BOTTOM };
