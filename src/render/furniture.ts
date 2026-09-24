/* Detailed furniture & equipment used by room interiors v2. Base line = floor contact (y). */
import { box, cylinder, fillRR, glow, hgrad, rgba, rgrad, rrect, shade, vgrad, type Ctx } from './gfx';
import { propShadow } from './roomBase';

const OL = (c: string) => rgba(shade(c, -0.62), 0.85);

function outlineRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, c: string) {
  rrect(ctx, x, y, w, h, r);
  ctx.strokeStyle = OL(c);
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

/** Panel with bevel & gradient; good for cabinets and appliances. */
export function panel(ctx: Ctx, x: number, y: number, w: number, h: number, c: string, r = 1.6) {
  fillRR(ctx, x, y, w, h, r, vgrad(ctx, y, y + h, [
    [0, shade(c, 0.16)],
    [0.45, c],
    [1, shade(c, -0.24)],
  ]));
  ctx.fillStyle = rgba('#ffffff', 0.2);
  ctx.fillRect(x + r * 0.6, y + 0.3, w - r * 1.2, 0.8);
  ctx.fillStyle = hgrad(ctx, x, x + w, [
    [0, rgba('#ffffff', 0.06)],
    [0.7, rgba('#000000', 0)],
    [1, rgba('#000000', 0.16)],
  ]);
  rrect(ctx, x, y, w, h, r);
  ctx.fill();
  outlineRR(ctx, x, y, w, h, r, c);
}

export function knob(ctx: Ctx, x: number, y: number, r = 0.8, c = '#c9ced2') {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.3, [
    [0, shade(c, 0.5)],
    [1, shade(c, -0.35)],
  ]);
  ctx.fill();
}

// ------------------------------------------------------------------ living
export function doubleBed(ctx: Ctx, x: number, y: number, w: number, frame: string, blanket: string, bunk = false) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.5);
  // headboard with tufting
  panel(ctx, x, y - 30, 7, 30, frame, 2);
  fillRR(ctx, x + 1.2, y - 27, 4.6, 14, 1.5, shade(blanket, -0.35));
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = rgba('#000', 0.25);
    ctx.beginPath();
    ctx.arc(x + 3.5, y - 24 + k * 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // footboard
  panel(ctx, x + w - 5, y - 16, 5, 16, frame, 1.6);
  // mattress
  panel(ctx, x + 5, y - 13, w - 9, 6, '#f1ece2', 2);
  // pillows
  for (let i = 0; i < 2; i++) {
    fillRR(ctx, x + 7.5 + i * 1.2, y - 17.6 + i * 1.2, 11, 5, 2.4, vgrad(ctx, y - 18, y - 12, [
      [0, '#ffffff'],
      [1, '#dcd6cc'],
    ]));
    outlineRR(ctx, x + 7.5 + i * 1.2, y - 17.6 + i * 1.2, 11, 5, 2.4, '#bdb6aa');
  }
  // blanket with fold
  rrect(ctx, x + 20, y - 15, w - 26, 9.5, 2.4);
  ctx.fillStyle = vgrad(ctx, y - 15, y - 5.5, [
    [0, shade(blanket, 0.2)],
    [1, shade(blanket, -0.3)],
  ]);
  ctx.fill();
  ctx.strokeStyle = OL(blanket);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  fillRR(ctx, x + 20, y - 15, 6, 9.5, 2, shade(blanket, 0.35));
  ctx.strokeStyle = rgba('#ffffff', 0.25);
  ctx.lineWidth = 0.5;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(x + 30 + k * 9, y - 14);
    ctx.quadraticCurveTo(x + 32 + k * 9, y - 10, x + 30 + k * 9, y - 6);
    ctx.stroke();
  }
  // legs
  ctx.fillStyle = shade(frame, -0.35);
  ctx.fillRect(x + 7, y - 7, 2, 7);
  ctx.fillRect(x + w - 8, y - 7, 2, 7);
  if (bunk) {
    ctx.fillStyle = shade(frame, -0.1);
    ctx.fillRect(x + 1, y - 58, 3, 30);
    ctx.fillRect(x + w - 4, y - 58, 3, 42);
    panel(ctx, x + 1, y - 40, w - 2, 3, frame, 0.8);
    panel(ctx, x + 4, y - 45, w - 8, 5, '#f1ece2', 2);
    fillRR(ctx, x + 6, y - 49, 10, 4.4, 2, '#ffffff');
    fillRR(ctx, x + 18, y - 47.5, w - 24, 6, 2, shade(blanket, 0.1));
    outlineRR(ctx, x + 18, y - 47.5, w - 24, 6, 2, blanket);
    // ladder
    ctx.strokeStyle = shade(frame, -0.2);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + w - 4, y - 18 - k * 6);
      ctx.lineTo(x + w - 11, y - 18 - k * 6);
      ctx.stroke();
    }
  }
}

export function nightstand(ctx: Ctx, x: number, y: number, wood: string, lampOn = true) {
  propShadow(ctx, x + 7, 16, y + 1);
  panel(ctx, x, y - 14, 14, 14, wood, 1.2);
  ctx.fillStyle = rgba('#000', 0.3);
  ctx.fillRect(x + 1, y - 8, 12, 0.6);
  knob(ctx, x + 7, y - 11, 0.7, '#e8c070');
  knob(ctx, x + 7, y - 4.5, 0.7, '#e8c070');
  // lamp
  ctx.fillStyle = '#6b4a32';
  ctx.fillRect(x + 6.4, y - 21, 1.2, 7);
  fillRR(ctx, x + 4, y - 15.2, 6, 1.4, 0.6, '#5a3a24');
  ctx.beginPath();
  ctx.moveTo(x + 2.6, y - 21);
  ctx.lineTo(x + 11.4, y - 21);
  ctx.lineTo(x + 9.6, y - 27);
  ctx.lineTo(x + 4.4, y - 27);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 27, y - 21, [
    [0, '#fff1c8'],
    [1, '#f0c878'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#b08a4a';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  if (lampOn) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x + 7, y - 20, 22, '#ffcf8a', 0.35);
    ctx.restore();
  }
  // alarm clock
  ctx.beginPath();
  ctx.arc(x + 11.5, y - 16.2, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = '#e8453c';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 11.5, y - 16.2, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#f4efe0';
  ctx.fill();
}

export function wardrobe(ctx: Ctx, x: number, y: number, w: number, h: number, wood: string) {
  propShadow(ctx, x + w / 2, w + 6, y + 1);
  panel(ctx, x, y - h, w, h, wood, 1.8);
  // doors
  for (let i = 0; i < 2; i++) {
    const dx = x + 2 + i * ((w - 4) / 2);
    const dw = (w - 4) / 2 - 1;
    panel(ctx, dx, y - h + 4, dw, h - 10, shade(wood, 0.06), 1.2);
    fillRR(ctx, dx + 2, y - h + 7, dw - 4, h - 18, 1, rgba('#000', 0.08));
    knob(ctx, i === 0 ? dx + dw - 1.6 : dx + 1.6, y - h / 2 - 2, 0.8, '#e8c070');
  }
  ctx.fillStyle = shade(wood, -0.3);
  ctx.fillRect(x + 1, y - 4, w - 2, 1);
  // boxes on top
  panel(ctx, x + 3, y - h - 7, 12, 7, '#c9a26b', 0.6);
  panel(ctx, x + 16, y - h - 5, 9, 5, '#8fa3b5', 0.6);
}

export function fakeWindow(ctx: Ctx, x: number, y: number, w: number, h: number, frame: string, t = 0, dayTint = '#8fc7e0') {
  panel(ctx, x - 2, y - 2, w + 4, h + 4, frame, 1.4);
  ctx.save();
  rrect(ctx, x, y, w, h, 1);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, y, y + h, [
    [0, dayTint],
    [0.65, '#f7dcae'],
    [1, '#c79a64'],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba('#ffffff', 0.9);
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.3, h * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a9a6a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.2, y + h * 0.62);
  ctx.lineTo(x + w * 0.45, y + h * 0.78);
  ctx.lineTo(x + w * 0.75, y + h * 0.55);
  ctx.lineTo(x + w, y + h * 0.72);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.fillStyle = '#5f8a4f';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.76, x + w, y + h * 0.9);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  // clouds drift
  ctx.fillStyle = rgba('#ffffff', 0.7);
  const cx = x + ((t * 3) % (w + 20)) - 10;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.22, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // glass reflection
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y);
  ctx.lineTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.15, y + h);
  ctx.lineTo(x - w * 0.1, y + h);
  ctx.fill();
  ctx.restore();
  // mullion
  ctx.fillStyle = frame;
  ctx.fillRect(x + w / 2 - 0.8, y, 1.6, h);
  ctx.fillRect(x, y + h / 2 - 0.8, w, 1.6);
}

export function curtains(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(x - 6, y - 4, w + 12, 1.2);
  for (const side of [0, 1]) {
    const cx = side ? x + w - 4 : x - 5;
    ctx.beginPath();
    ctx.moveTo(cx, y - 3.5);
    ctx.lineTo(cx + 9, y - 3.5);
    ctx.quadraticCurveTo(cx + (side ? 2 : 7), y + h * 0.5, cx + (side ? 5 : 4), y + h + 6);
    ctx.lineTo(cx + (side ? -1 : 0), y + h + 6);
    ctx.closePath();
    ctx.fillStyle = hgrad(ctx, cx, cx + 9, [
      [0, shade(c, -0.25)],
      [0.4, shade(c, 0.12)],
      [1, shade(c, -0.3)],
    ]);
    ctx.fill();
    ctx.strokeStyle = OL(c);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

export function coffeeTable(ctx: Ctx, x: number, y: number, w: number, wood: string) {
  propShadow(ctx, x + w / 2, w + 4, y + 1, 0.5);
  panel(ctx, x, y - 7, w, 2.4, wood, 1);
  ctx.fillStyle = shade(wood, -0.35);
  ctx.fillRect(x + 2, y - 4.6, 1.4, 4.6);
  ctx.fillRect(x + w - 3.4, y - 4.6, 1.4, 4.6);
  // mug & magazine
  fillRR(ctx, x + 4, y - 10.4, 3.2, 3.4, 0.8, '#f4efe0');
  ctx.fillStyle = rgba('#ffffff', 0.6);
  ctx.fillRect(x + 4.6, y - 12.8, 0.4, 2);
  ctx.fillRect(x + 5.8, y - 13.4, 0.4, 2.4);
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(x + w - 11, y - 7.8, 8, 0.9);
}

export function rug(ctx: Ctx, cx: number, y: number, rx: number, c: string, trim: string) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(1, 0.16);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, rx, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, rx, [
    [0, shade(c, 0.15)],
    [0.8, c],
    [1, shade(c, -0.2)],
  ]);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = rgba(trim, 0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 6, rx - 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function kitchenCounter(ctx: Ctx, x: number, y: number, w: number, body: string, top = '#d9dcd6') {
  propShadow(ctx, x + w / 2, w + 6, y + 1);
  panel(ctx, x, y - 20, w, 20, body, 1.2);
  for (let i = 0; i < Math.floor(w / 14); i++) {
    const dx = x + 1.5 + i * 14;
    fillRR(ctx, dx, y - 16.5, 12, 14.5, 1, rgba('#000', 0.08));
    knob(ctx, dx + 10, y - 12, 0.6, '#c9ced2');
  }
  fillRR(ctx, x - 1, y - 22, w + 2, 2.6, 0.8, vgrad(ctx, y - 22, y - 19.4, [
    [0, shade(top, 0.25)],
    [1, shade(top, -0.2)],
  ]));
  // sink
  fillRR(ctx, x + w * 0.35, y - 22, 13, 1.4, 0.5, '#8a939a');
  ctx.strokeStyle = '#b9c1c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35 + 6, y - 22);
  ctx.lineTo(x + w * 0.35 + 6, y - 27);
  ctx.quadraticCurveTo(x + w * 0.35 + 6, y - 28.5, x + w * 0.35 + 9, y - 28);
  ctx.stroke();
  // kettle & jars
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 25, 3.4, 3, 0, Math.PI, 0);
  ctx.lineTo(x + 9.4, y - 22);
  ctx.lineTo(x + 2.6, y - 22);
  ctx.fillStyle = '#e8453c';
  ctx.fill();
  ctx.fillStyle = '#2a2320';
  ctx.fillRect(x + 5.4, y - 29, 1.2, 1.2);
  for (let i = 0; i < 3; i++) {
    fillRR(ctx, x + w - 16 + i * 4.4, y - 27 + (i % 2), 3.2, 5 - (i % 2), 0.8, ['#f2c230', '#8fbf5a', '#c7433b'][i]);
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(x + w - 15.4 + i * 4.4, y - 26 + (i % 2), 0.6, 3);
  }
}

export function upperCabinets(ctx: Ctx, x: number, y: number, w: number, body: string) {
  panel(ctx, x, y, w, 14, body, 1.2);
  for (let i = 0; i < Math.floor(w / 14); i++) {
    const dx = x + 1.5 + i * 14;
    fillRR(ctx, dx, y + 1.5, 12, 11, 1, rgba('#000', 0.08));
    knob(ctx, dx + 10, y + 10, 0.6, '#c9ced2');
  }
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.fillRect(x, y + 14, w, 1.4);
}

export function roundTable(ctx: Ctx, cx: number, y: number, r: number, wood: string) {
  propShadow(ctx, cx, r * 2 + 8, y + 1, 0.5);
  ctx.fillStyle = shade(wood, -0.35);
  ctx.fillRect(cx - 1.2, y - 13, 2.4, 13);
  fillRR(ctx, cx - 5, y - 1.2, 10, 1.2, 0.6, shade(wood, -0.4));
  ctx.beginPath();
  ctx.ellipse(cx, y - 14, r, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = vgrad(ctx, y - 16.4, y - 11.6, [
    [0, shade(wood, 0.25)],
    [1, shade(wood, -0.2)],
  ]);
  ctx.fill();
  ctx.strokeStyle = OL(wood);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // vase with flowers
  fillRR(ctx, cx - 1.6, y - 19.6, 3.2, 5, 1.2, '#5fb8ff');
  for (const [dx, c] of [
    [-2, '#ff7cc0'],
    [0.4, '#ffcf4a'],
    [2.2, '#ff5a4a'],
  ] as [number, string][]) {
    ctx.strokeStyle = '#4f9b4a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, y - 19);
    ctx.lineTo(cx + dx, y - 23.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dx, y - 24, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
}

export function chair(ctx: Ctx, x: number, y: number, c: string, dir = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = shade(c, -0.35);
  ctx.fillRect(-3.4, -6.4, 1.2, 6.4);
  ctx.fillRect(2.4, -6.4, 1.2, 6.4);
  panel(ctx, -4, -8.2, 8, 2.2, c, 0.8);
  panel(ctx, -4.4, -18, 2.2, 11, c, 0.8);
  ctx.restore();
}

// ------------------------------------------------------------------ diner
export function booth(ctx: Ctx, x: number, y: number, w: number, seat = '#c7433b', table = '#e9e4da') {
  propShadow(ctx, x + w / 2, w + 6, y + 1, 0.5);
  // back benches
  for (const bx of [x, x + w - 10]) {
    panel(ctx, bx, y - 26, 10, 26, seat, 3);
    ctx.strokeStyle = rgba('#000', 0.18);
    ctx.lineWidth = 0.5;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(bx + 1.2, y - 26 + k * 5);
      ctx.lineTo(bx + 8.8, y - 26 + k * 5);
      ctx.stroke();
    }
  }
  // table
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(x + w / 2 - 1, y - 12, 2, 12);
  panel(ctx, x + 9, y - 14.4, w - 18, 2.6, table, 1);
  ctx.fillStyle = '#c7433b';
  ctx.fillRect(x + 9, y - 12.2, w - 18, 0.8);
  // napkin holder, ketchup & mustard, plates
  fillRR(ctx, x + w / 2 - 2, y - 18, 4, 3.6, 0.6, '#c9ced2');
  fillRR(ctx, x + w / 2 + 3, y - 19.4, 1.8, 5, 0.8, '#d23b3b');
  fillRR(ctx, x + w / 2 + 5.2, y - 19.4, 1.8, 5, 0.8, '#f2c230');
  ctx.beginPath();
  ctx.ellipse(x + 14, y - 14.8, 3.6, 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

export function jukebox(ctx: Ctx, x: number, y: number, t: number, on: boolean) {
  propShadow(ctx, x + 11, 26, y + 1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 26);
  ctx.arc(x + 11, y - 26, 11, Math.PI, 0);
  ctx.lineTo(x + 22, y);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x, x + 22, [
    [0, '#6a2a1a'],
    [0.35, '#c9772f'],
    [1, '#5a2012'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#2a1008';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // glowing arch
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 11, y - 26, 8.5, Math.PI, 0);
  ctx.lineTo(x + 19.5, y - 18);
  ctx.lineTo(x + 2.5, y - 18);
  ctx.closePath();
  ctx.clip();
  const cols = ['#ff5a4a', '#ffcf4a', '#6aff8c', '#5fb8ff', '#ff7cc0'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = on ? cols[(i + Math.floor(t * 3)) % 5] : shade(cols[i], -0.6);
    ctx.fillRect(x + 2.5 + i * 3.4, y - 36, 3.4, 20);
  }
  ctx.restore();
  fillRR(ctx, x + 4, y - 16, 14, 7, 1, '#1a1410');
  ctx.fillStyle = on ? '#ffe27a' : '#5a4a2a';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 5.5 + i * 3.2, y - 14.5, 2, 1);
  fillRR(ctx, x + 5, y - 7, 12, 4, 1, '#3a2a20');
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x + 11, y - 26, 26, '#ffb04a', 0.3 + 0.1 * Math.sin(t * 6));
    ctx.restore();
  }
}

export function steamTable(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1);
  panel(ctx, x, y - 20, w, 20, '#aab3ba', 1.2);
  ctx.fillStyle = rgba('#000', 0.18);
  for (let dx = x + 4; dx < x + w - 3; dx += 7) ctx.fillRect(dx, y - 16, 0.6, 14);
  // trays with food
  const foods = ['#e6a23c', '#8fbf5a', '#d9543f', '#f4efe0', '#c9772f'];
  const n = Math.floor((w - 4) / 11);
  for (let i = 0; i < n; i++) {
    const tx = x + 2 + i * 11;
    fillRR(ctx, tx, y - 22.4, 10, 2.4, 0.6, '#8a939a');
    ctx.beginPath();
    ctx.ellipse(tx + 5, y - 22.4, 4.2, 1.3, 0, Math.PI, 0);
    ctx.fillStyle = foods[i % foods.length];
    ctx.fill();
  }
  // sneeze guard
  ctx.fillStyle = rgba('#dff4ff', 0.25);
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 36);
  ctx.lineTo(x + w - 2, y - 36);
  ctx.lineTo(x + w - 5, y - 27);
  ctx.lineTo(x + 5, y - 27);
  ctx.fill();
  ctx.strokeStyle = rgba('#ffffff', 0.5);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = '#9aa3aa';
  ctx.fillRect(x + 3, y - 36, 1, 14);
  ctx.fillRect(x + w - 4, y - 36, 1, 14);
}

// ------------------------------------------------------------------ industrial
export function transformer(ctx: Ctx, x: number, y: number, c = '#5a6a5a') {
  propShadow(ctx, x + 14, 32, y + 1);
  panel(ctx, x, y - 30, 28, 30, c, 2);
  // cooling fins
  for (let i = 0; i < 6; i++) {
    const fx = x + 3 + i * 4;
    ctx.fillStyle = vgrad(ctx, y - 26, y - 6, [
      [0, shade(c, 0.1)],
      [1, shade(c, -0.35)],
    ]);
    ctx.fillRect(fx, y - 26, 2.4, 20);
  }
  // insulators on top
  for (let i = 0; i < 3; i++) {
    const ix = x + 5 + i * 9;
    for (let k = 0; k < 3; k++) fillRR(ctx, ix - 2.2 + k * 0.3, y - 33 - k * 2.6, 4.4 - k * 0.6, 2.2, 1, k % 2 ? '#b89a7a' : '#d9bb98');
  }
  // warning plate
  fillRR(ctx, x + 9, y - 20, 10, 7, 0.8, '#f2c230');
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(x + 14.6, y - 19);
  ctx.lineTo(x + 12.4, y - 16);
  ctx.lineTo(x + 14.2, y - 16);
  ctx.lineTo(x + 13.2, y - 14);
  ctx.lineTo(x + 16, y - 17.2);
  ctx.lineTo(x + 14.2, y - 17.2);
  ctx.closePath();
  ctx.fill();
}

export function breakerPanel(ctx: Ctx, x: number, y: number, w: number, h: number) {
  panel(ctx, x, y, w, h, '#4a5561', 1.6);
  const rows = Math.floor((h - 6) / 9);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < Math.floor((w - 4) / 6); c++) {
      const bx = x + 3 + c * 6;
      const by = y + 4 + r * 9;
      fillRR(ctx, bx, by, 4.4, 6.4, 0.6, '#1d252c');
      const up = (r * 3 + c) % 4 !== 0;
      fillRR(ctx, bx + 1.2, up ? by + 0.8 : by + 3.4, 2, 2.2, 0.4, up ? '#e8e2d4' : '#e8453c');
    }
  }
}

export function cableReel(ctx: Ctx, x: number, y: number, r: number, c = '#c9772f') {
  propShadow(ctx, x, r * 2 + 4, y + 1);
  ctx.beginPath();
  ctx.arc(x, y - r, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 1.3, 0, r * 1.2, [
    [0, '#c9a26b'],
    [1, '#6b4a2a'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#3a2412';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - r, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
  ctx.strokeStyle = rgba('#000', 0.3);
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(x, y - r, r * 0.72 * (k / 4), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y - r, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2412';
  ctx.fill();
}

export function turbine(ctx: Ctx, x: number, y: number, w: number) {
  propShadow(ctx, x + w / 2, w + 10, y + 1, 0.5);
  panel(ctx, x + 4, y - 12, w - 8, 12, '#3a424b', 1.6);
  // casing
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.bezierCurveTo(x - 2, y - 44, x + 10, y - 50, x + w * 0.45, y - 50);
  ctx.lineTo(x + w - 6, y - 42);
  ctx.quadraticCurveTo(x + w + 2, y - 30, x + w - 4, y - 14);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, y - 50, y - 14, [
    [0, '#b8c2c8'],
    [0.35, '#7f8c95'],
    [1, '#3f4a52'],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#1f252b';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // bands
  ctx.fillStyle = rgba('#000', 0.25);
  for (let i = 1; i < 4; i++) ctx.fillRect(x + (w * i) / 4, y - 48 + i * 2, 1.6, 34 - i * 2);
  // intake grille
  ctx.beginPath();
  ctx.arc(x + 12, y - 30, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#1b2025';
  ctx.fill();
  ctx.strokeStyle = '#8a969f';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // steam pipe to ceiling
  ctx.fillStyle = hgrad(ctx, x + w - 18, x + w - 10, [
    [0, '#5b666f'],
    [0.4, '#b9c3cb'],
    [1, '#4a545c'],
  ]);
  ctx.fillRect(x + w - 18, y - 90, 8, 44);
  fillRR(ctx, x + w - 20, y - 50, 12, 3, 0.6, '#6b7680');
}

export function pump(ctx: Ctx, x: number, y: number, c = '#39505b') {
  propShadow(ctx, x + 12, 28, y + 1);
  panel(ctx, x, y - 16, 24, 16, c, 2);
  ctx.beginPath();
  ctx.arc(x + 12, y - 8, 6.4, 0, Math.PI * 2);
  ctx.fillStyle = '#1f2c33';
  ctx.fill();
  ctx.strokeStyle = shade(c, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function bigValve(ctx: Ctx, cx: number, cy: number, r: number, rot: number, c = '#d6453c') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = shade(c, -0.4);
  ctx.lineWidth = r * 0.34;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.lineWidth = r * 0.24;
  ctx.stroke();
  ctx.lineWidth = r * 0.16;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = shade(c, -0.2);
  ctx.fill();
  ctx.restore();
}

export function filterColumn(ctx: Ctx, x: number, y: number, w: number, h: number) {
  propShadow(ctx, x + w / 2, w + 6, y + 1);
  cylinder(ctx, x, y - h, w, h, '#9fb1ba', 4);
  // sight glass with layers
  const gx = x + w * 0.3;
  const gw = w * 0.4;
  fillRR(ctx, gx - 1, y - h + 8, gw + 2, h - 16, 3, '#4b5961');
  ctx.save();
  rrect(ctx, gx, y - h + 9, gw, h - 18, 2.4);
  ctx.clip();
  const layers = ['#bfe8f2', '#6fc3e0', '#e8d7b0', '#c9a26b', '#8a7a6a', '#5a4a3a'];
  const lh = (h - 18) / layers.length;
  layers.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(gx, y - h + 9 + i * lh, gw, lh + 0.5);
  });
  ctx.fillStyle = rgba('#ffffff', 0.22);
  ctx.fillRect(gx + 1, y - h + 9, 1.4, h - 18);
  ctx.restore();
}

// ------------------------------------------------------------------ security / door
export function lockers(ctx: Ctx, x: number, y: number, n: number, c = '#4f6a7a') {
  propShadow(ctx, x + n * 5, n * 10 + 6, y + 1);
  for (let i = 0; i < n; i++) {
    const lx = x + i * 10;
    panel(ctx, lx, y - 40, 9.6, 40, c, 1);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = rgba('#000', 0.4);
      ctx.fillRect(lx + 2.4, y - 36 + k * 1.6, 4.8, 0.6);
    }
    knob(ctx, lx + 7.6, y - 22, 0.7, '#c9ced2');
    fillRR(ctx, lx + 2.6, y - 29, 4.2, 2.2, 0.4, '#e8e2d4');
  }
}

export function monitorBank(ctx: Ctx, x: number, y: number, t: number, day: number) {
  panel(ctx, x, y, 44, 26, '#2f363e', 1.6);
  for (let i = 0; i < 4; i++) {
    const mx = x + 2.5 + (i % 2) * 20.5;
    const my = y + 2.5 + Math.floor(i / 2) * 11.5;
    fillRR(ctx, mx, my, 18.5, 10, 1, '#0c1a14');
    ctx.save();
    rrect(ctx, mx + 0.8, my + 0.8, 16.9, 8.4, 0.8);
    ctx.clip();
    // CCTV feeds: outside canyon silhouettes
    ctx.fillStyle = `rgba(120,255,160,${0.25 + day * 0.2})`;
    ctx.fillRect(mx, my, 18.5, 10);
    ctx.fillStyle = 'rgba(10,40,20,0.8)';
    ctx.beginPath();
    ctx.moveTo(mx, my + 10);
    ctx.lineTo(mx + 4 + i, my + 5);
    ctx.lineTo(mx + 9, my + 7);
    ctx.lineTo(mx + 14 - i, my + 4);
    ctx.lineTo(mx + 18.5, my + 10);
    ctx.fill();
    // scanline
    ctx.fillStyle = 'rgba(200,255,220,0.25)';
    ctx.fillRect(mx, my + ((t * 8 + i * 3) % 10), 18.5, 0.8);
    ctx.restore();
  }
  ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ff4a3a' : '#5a1a14';
  ctx.beginPath();
  ctx.arc(x + 41.5, y + 24, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

export function gunRack(ctx: Ctx, x: number, y: number, w: number) {
  panel(ctx, x, y, w, 4, '#5a3e2a', 0.8);
  panel(ctx, x, y + 30, w, 4, '#5a3e2a', 0.8);
  for (let i = 0; i < Math.floor(w / 8); i++) {
    const gx = x + 4 + i * 8;
    ctx.save();
    ctx.translate(gx, y + 17);
    ctx.rotate(0.08);
    fillRR(ctx, -1.2, -15, 2.4, 28, 0.8, ['#3f474f', '#6b4b32', '#4f5d58'][i % 3]);
    fillRR(ctx, -2, 5, 4, 7, 1, '#2a2320');
    ctx.restore();
  }
}

// ------------------------------------------------------------------ misc wall decor
export function wallVent(ctx: Ctx, x: number, y: number, w: number, h: number) {
  panel(ctx, x, y, w, h, '#6b757e', 1);
  ctx.fillStyle = '#1f252b';
  for (let k = 0; k < Math.floor((h - 3) / 2.4); k++) ctx.fillRect(x + 1.6, y + 1.8 + k * 2.4, w - 3.2, 1.2);
}

export function ceilingPipe(ctx: Ctx, x0: number, x1: number, y: number, r: number, c: string) {
  ctx.fillStyle = vgrad(ctx, y - r, y + r, [
    [0, shade(c, -0.35)],
    [0.3, shade(c, 0.35)],
    [0.55, c],
    [1, shade(c, -0.55)],
  ]);
  ctx.fillRect(x0, y - r, x1 - x0, r * 2);
  for (let x = x0 + 30; x < x1 - 4; x += 60) {
    fillRR(ctx, x, y - r - 0.8, 3, r * 2 + 1.6, 0.6, shade(c, -0.15));
  }
}

export function neonSign(ctx: Ctx, cx: number, y: number, text: string, color: string, size = 8) {
  ctx.font = `800 ${size}px Unbounded, Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  box(ctx, cx - tw / 2 - 5, y - size * 0.8, tw + 10, size * 1.6, '#1e1418', 2);
  ctx.fillStyle = shade(color, 0.6);
  ctx.fillText(text, cx, y + 0.3);
}

export function neonGlow(ctx: Ctx, cx: number, y: number, text: string, color: string, size: number, k: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.font = `800 ${size}px Unbounded, Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = rgba(color, 0.9 * k);
  ctx.fillText(text, cx, y + 0.3);
  ctx.shadowBlur = 0;
  glow(ctx, cx, y, ctx.measureText(text).width * 0.8, color, 0.18 * k);
  ctx.restore();
}

export function wallSconce(ctx: Ctx, x: number, y: number, c = '#ffd9a0') {
  fillRR(ctx, x - 1.6, y, 3.2, 4, 0.8, '#8a6a3a');
  ctx.beginPath();
  ctx.moveTo(x - 3.4, y - 4);
  ctx.lineTo(x + 3.4, y - 4);
  ctx.lineTo(x + 2, y + 0.4);
  ctx.lineTo(x - 2, y + 0.4);
  ctx.closePath();
  ctx.fillStyle = shade(c, 0.1);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - 4, 14, c, 0.35);
  ctx.restore();
}

export function stringLights(ctx: Ctx, x0: number, x1: number, y: number) {
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  const n = Math.floor((x1 - x0) / 30);
  for (let i = 0; i < n; i++) {
    const a = x0 + i * 30;
    ctx.moveTo(a, y);
    ctx.quadraticCurveTo(a + 15, y + 6, a + 30, y);
  }
  ctx.stroke();
  const cols = ['#ff5a4a', '#ffcf4a', '#6aff8c', '#5fb8ff'];
  for (let i = 0; i < n * 5; i++) {
    const t = (i % 5) / 5;
    const a = x0 + Math.floor(i / 5) * 30 + t * 30;
    const yy = y + 6 * 4 * t * (1 - t) * 0.5 * 2;
    ctx.fillStyle = cols[i % 4];
    ctx.beginPath();
    ctx.arc(a, yy + 0.8, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function chandelier(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 8, 2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#e8b64a';
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const cx = x + Math.cos(a) * 8;
    const cy = y + 7 + Math.sin(a) * 2;
    ctx.fillStyle = '#fff4c8';
    ctx.fillRect(cx - 0.4, cy - 2.6, 0.8, 2.6);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y + 6, 26, '#ffe2a8', 0.35);
  ctx.restore();
}
