/*
 * Elevator shaft, machinery and car art.
 * Layering per shaft: cell back (static cache) → cables, counterweight, hoist → car back →
 * riders → car doors & frame → landing front (slab, jambs, indicator, call button).
 */
import { fillRR, glow, hazard, hgrad, rgba, rivet, rrect, vgrad, type Ctx } from './gfx';
import { CEIL_FRONT, FEET_Y, FLOOR_FRONT, FLOOR_H } from './world';

/** car geometry relative to its centre x and feet level */
export const CAR_HW = 26;
export const CAR_H = 67;

// ---------------------------------------------------------------- static shaft (cached per cell)
export function shaftStatic(ctx: Ctx, w: number) {
  ctx.fillStyle = '#0b0e12';
  ctx.fillRect(0, 0, w, FLOOR_H);
  // concrete back wall with a steel lattice
  ctx.fillStyle = hgrad(ctx, 4, w - 4, [
    [0, '#161b21'],
    [0.5, '#262e36'],
    [1, '#161b21'],
  ]);
  ctx.fillRect(4, 0, w - 8, FLOOR_H);
  ctx.strokeStyle = rgba('#000000', 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -20; y < FLOOR_H + 20; y += 40) {
    ctx.moveTo(12, y);
    ctx.lineTo(w - 12, y + 40);
    ctx.moveTo(w - 12, y);
    ctx.lineTo(12, y + 40);
  }
  ctx.stroke();
  // horizontal wall beams (where the floors are anchored)
  for (const by of [CEIL_FRONT + 2, FLOOR_FRONT - 6]) {
    ctx.fillStyle = vgrad(ctx, by, by + 4, [
      [0, '#3a444e'],
      [1, '#1f252c'],
    ]);
    ctx.fillRect(4, by, w - 8, 4);
  }
  // guide rails with brackets
  for (const rx of [6.5, w - 9.5]) {
    ctx.fillStyle = hgrad(ctx, rx, rx + 3, [
      [0, '#4f5963'],
      [0.5, '#c8d0d6'],
      [1, '#3f4750'],
    ]);
    ctx.fillRect(rx, 0, 3, FLOOR_H);
    for (let y = 14; y < FLOOR_H; y += 36) {
      ctx.fillStyle = '#2a3139';
      ctx.fillRect(rx - 2, y, 7, 3);
      rivet(ctx, rx + 1.5, y + 1.5, 0.7, '#8a939a');
    }
  }
  // conduit and a caged work light
  ctx.fillStyle = '#20262c';
  ctx.fillRect(w - 16, 0, 2, FLOOR_H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, w / 2, CEIL_FRONT + 10, 34, '#ffe2b0', 0.12);
  ctx.restore();
}

// ---------------------------------------------------------------- hoist machinery in the top cell
export function hoist(ctx: Ctx, x0: number, y0: number, wheel: number, carCx: number, carTopY: number, cwX: number, cwTopY: number) {
  const sx = x0 + 22;
  const sy = y0 + 22;
  const R = 9.5;
  // cables first (behind the sheave rim)
  ctx.strokeStyle = '#0c0f12';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const dx of [-1.6, 0, 1.6]) {
    ctx.moveTo(carCx + dx, carTopY);
    ctx.lineTo(sx + R + dx * 0.3, sy);
  }
  ctx.moveTo(cwX - 0.8, cwTopY);
  ctx.lineTo(sx - R - 0.4, sy);
  ctx.moveTo(cwX + 0.8, cwTopY);
  ctx.lineTo(sx - R + 0.4, sy);
  ctx.stroke();
  // highlight on the cables
  ctx.strokeStyle = rgba('#9aa7b0', 0.35);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(carCx + 0.4, carTopY);
  ctx.lineTo(sx + R + 0.1, sy);
  ctx.stroke();
  // motor housing
  fillRR(ctx, sx + 13, sy - 11, 22, 16, 2.5, vgrad(ctx, sy - 11, sy + 5, [
    [0, '#5b6a3f'],
    [1, '#39432a'],
  ]));
  ctx.strokeStyle = '#1a1f14';
  ctx.lineWidth = 0.6;
  rrect(ctx, sx + 13, sy - 11, 22, 16, 2.5);
  ctx.stroke();
  ctx.strokeStyle = rgba('#000000', 0.35);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(sx + 16 + i * 3.8, sy - 9);
    ctx.lineTo(sx + 16 + i * 3.8, sy + 3);
  }
  ctx.stroke();
  fillRR(ctx, sx + 22, sy - 14, 6, 3, 1, '#2a2f35');
  ctx.fillStyle = '#f2b632';
  ctx.fillRect(sx + 26, sy - 6, 6, 2);
  // drive shaft to the sheave
  ctx.fillStyle = '#6d7680';
  ctx.fillRect(sx, sy - 1.2, 14, 2.4);
  // sheave with spokes, rotating with the car
  ctx.beginPath();
  ctx.arc(sx, sy, R, 0, Math.PI * 2);
  ctx.fillStyle = '#2b3239';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#8a959f';
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#11151a';
  ctx.beginPath();
  ctx.arc(sx, sy, R - 1.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#6d7680';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = wheel + (i / 5) * Math.PI * 2;
    ctx.moveTo(sx + Math.cos(a) * 2, sy + Math.sin(a) * 2);
    ctx.lineTo(sx + Math.cos(a) * (R - 2), sy + Math.sin(a) * (R - 2));
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#c8d0d6';
  ctx.fill();
  // bracket
  ctx.fillStyle = '#39424b';
  ctx.fillRect(sx - 3, y0 + CEIL_FRONT, 6, sy - y0 - CEIL_FRONT - R + 1);
}

/** Counterweight hanging on the left rail. */
export function counterweight(ctx: Ctx, x: number, top: number) {
  const h = 26;
  fillRR(ctx, x - 3.2, top, 6.4, h, 1, hgrad(ctx, x - 3.2, x + 3.2, [
    [0, '#3a3f45'],
    [0.5, '#6d757d'],
    [1, '#2e3338'],
  ]));
  ctx.strokeStyle = '#15181c';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    ctx.moveTo(x - 3.2, top + (i * h) / 6);
    ctx.lineTo(x + 3.2, top + (i * h) / 6);
  }
  ctx.stroke();
  hazard(ctx, x - 3.2, top + h - 3, 6.4, 3, '#f2b632', '#26282b', 2.5);
}

// ---------------------------------------------------------------- car
/** Cabin interior and frame back; riders are drawn after this. */
export function carBack(ctx: Ctx, cx: number, fy: number, lit: number) {
  const x0 = cx - CAR_HW;
  const top = fy - CAR_H;
  // crosshead and hitch on the roof
  fillRR(ctx, cx - 18, top - 5, 36, 5, 1.2, vgrad(ctx, top - 5, top, [
    [0, '#6a747e'],
    [1, '#3a424a'],
  ]));
  ctx.fillStyle = '#2a3036';
  ctx.fillRect(cx - 3, top - 8, 6, 3);
  ctx.fillStyle = lit > 0.5 ? '#ff9a3a' : '#5a3a1a';
  ctx.fillRect(cx + 11, top - 7.5, 3, 2.5);
  // shell
  fillRR(ctx, x0, top, CAR_HW * 2, CAR_H + 6, 2.5, '#2d353d');
  // back wall: warm lacquered panels
  const iw = CAR_HW * 2 - 8;
  ctx.fillStyle = vgrad(ctx, top + 4, fy, [
    [0, '#d9c49a'],
    [0.6, '#b89c6c'],
    [1, '#8a7048'],
  ]);
  ctx.fillRect(x0 + 4, top + 4, iw, CAR_H - 3);
  ctx.strokeStyle = rgba('#5a4428', 0.55);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(x0 + 4 + (iw * i) / 4, top + 8);
    ctx.lineTo(x0 + 4 + (iw * i) / 4, fy - 3);
  }
  ctx.stroke();
  // side walls in perspective
  ctx.fillStyle = rgba('#000000', 0.22);
  ctx.beginPath();
  ctx.moveTo(x0 + 4, top + 4);
  ctx.lineTo(x0 + 9, top + 9);
  ctx.lineTo(x0 + 9, fy - 4);
  ctx.lineTo(x0 + 4, fy + 1);
  ctx.closePath();
  ctx.moveTo(x0 + 4 + iw, top + 4);
  ctx.lineTo(x0 + iw - 1, top + 9);
  ctx.lineTo(x0 + iw - 1, fy - 4);
  ctx.lineTo(x0 + 4 + iw, fy + 1);
  ctx.closePath();
  ctx.fill();
  // handrail
  ctx.fillStyle = '#c9a44a';
  ctx.fillRect(x0 + 9, fy - 26, iw - 10, 1.6);
  ctx.fillStyle = '#7a6230';
  ctx.fillRect(x0 + 12, fy - 24.4, 1.2, 3);
  ctx.fillRect(x0 + iw - 5, fy - 24.4, 1.2, 3);
  // ceiling light
  fillRR(ctx, cx - 12, top + 4, 24, 3, 1, lit > 0.5 ? '#fff2cf' : '#8a8270');
  // floor
  ctx.fillStyle = vgrad(ctx, fy - 4, fy + 2, [
    [0, '#3a3a36'],
    [1, '#1e1f1d'],
  ]);
  ctx.beginPath();
  ctx.moveTo(x0 + 9, fy - 4);
  ctx.lineTo(x0 + iw - 1, fy - 4);
  ctx.lineTo(x0 + 4 + iw, fy + 1.5);
  ctx.lineTo(x0 + 4, fy + 1.5);
  ctx.closePath();
  ctx.fill();
  // light falloff
  if (lit > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, top + 10, 40, '#ffdca0', 0.22 * lit);
    ctx.restore();
  }
}

/** Sliding doors with glass windows, frame, sill and the direction lamp. */
export function carFront(ctx: Ctx, cx: number, fy: number, door: number, dir: number, moving: boolean, t: number) {
  const x0 = cx - CAR_HW;
  const top = fy - CAR_H;
  const half = CAR_HW - 3;
  const ease = door * door * (3 - 2 * door);
  const open = ease * (half - 2.5);
  ctx.save();
  // clip to the door opening so the panels slide into the frame
  ctx.beginPath();
  ctx.rect(x0 + 3, top + 7, CAR_HW * 2 - 6, CAR_H - 6);
  ctx.clip();
  for (const s of [-1, 1]) {
    const px = s < 0 ? cx - half - open : cx + open;
    const pw = half;
    const wx = px + 3.5;
    const ww = pw - 7;
    const wy = top + 13;
    const wh = 30;
    // brushed steel panel with a real window cut-out, so the riders show through
    ctx.beginPath();
    ctx.rect(px, top + 7, pw, CAR_H - 6);
    ctx.rect(wx, wy, ww, wh);
    ctx.fillStyle = hgrad(ctx, px, px + pw, [
      [0, '#8e99a3'],
      [0.45, '#c9d1d7'],
      [1, '#7d8892'],
    ]);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#3a434b';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(px + 0.3, top + 7.3, pw - 0.6, CAR_H - 6.6);
    ctx.fillStyle = 'rgba(170,215,235,0.16)';
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(wx + 1, wy + wh);
    ctx.lineTo(wx + ww * 0.55, wy);
    ctx.lineTo(wx + ww * 0.8, wy);
    ctx.lineTo(wx + 3.5, wy + wh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a545d';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(wx, wy, ww, wh);
    // kick plate and handle groove
    ctx.fillStyle = '#5d6770';
    ctx.fillRect(px + 1, fy - 12, pw - 2, 10);
    ctx.fillStyle = rgba('#000000', 0.25);
    ctx.fillRect(s < 0 ? px + pw - 2.2 : px + 1, top + 20, 1.2, 26);
  }
  ctx.restore();
  // frame
  ctx.fillStyle = hgrad(ctx, x0, x0 + 4, [
    [0, '#2a3138'],
    [1, '#4a545d'],
  ]);
  ctx.fillRect(x0, top, 4, CAR_H + 6);
  ctx.fillStyle = hgrad(ctx, x0 + CAR_HW * 2 - 4, x0 + CAR_HW * 2, [
    [0, '#4a545d'],
    [1, '#2a3138'],
  ]);
  ctx.fillRect(x0 + CAR_HW * 2 - 4, top, 4, CAR_H + 6);
  fillRR(ctx, x0, top, CAR_HW * 2, 7, [2.5, 2.5, 0, 0], vgrad(ctx, top, top + 7, [
    [0, '#58626b'],
    [1, '#333b43'],
  ]));
  // direction lamp on the header
  const blink = moving ? 1 : 0.25;
  ctx.fillStyle = '#12161a';
  fillRR(ctx, cx - 7, top + 1.5, 14, 4, 1, '#12161a');
  ctx.fillStyle = dir < 0 && moving ? rgba('#6aff8c', blink) : '#1f3326';
  ctx.beginPath();
  ctx.moveTo(cx - 5, top + 5);
  ctx.lineTo(cx - 3, top + 2);
  ctx.lineTo(cx - 1, top + 5);
  ctx.fill();
  ctx.fillStyle = dir > 0 && moving ? rgba('#ffb02e', blink) : '#33291a';
  ctx.beginPath();
  ctx.moveTo(cx + 1, top + 2);
  ctx.lineTo(cx + 3, top + 5);
  ctx.lineTo(cx + 5, top + 2);
  ctx.fill();
  for (const rx of [x0 + 2, x0 + CAR_HW * 2 - 2]) {
    rivet(ctx, rx, top + 12, 0.6, '#8a939a');
    rivet(ctx, rx, fy - 6, 0.6, '#8a939a');
  }
  // sill
  ctx.fillStyle = vgrad(ctx, fy + 1, fy + 5, [
    [0, '#b8c0c6'],
    [1, '#5a636b'],
  ]);
  ctx.fillRect(x0, fy + 1, CAR_HW * 2, 4);
  ctx.fillStyle = rgba('#000000', 0.3);
  for (let gx = x0 + 2; gx < x0 + CAR_HW * 2 - 1; gx += 3) ctx.fillRect(gx, fy + 2, 1, 2.4);
  // underside with a safety plank
  fillRR(ctx, x0 + 3, fy + 5, CAR_HW * 2 - 6, 3, 1, '#2a3036');
  void t;
}

// ---------------------------------------------------------------- landing front overlay (per cell, every frame)
export function landingFront(ctx: Ctx, w: number, floorNo: number, carFloor: number, carHere: boolean, called: boolean, t: number) {
  // slab below the landing
  ctx.fillStyle = vgrad(ctx, FLOOR_FRONT, FLOOR_H, [
    [0, '#3d4650'],
    [1, '#1c2127'],
  ]);
  ctx.fillRect(0, FLOOR_FRONT, w, FLOOR_H - FLOOR_FRONT);
  hazard(ctx, 4, FLOOR_FRONT - 1.4, w - 8, 2.4, '#f2b632', '#26282b', 3);
  // ceiling strip with the floor display
  ctx.fillStyle = vgrad(ctx, 0, CEIL_FRONT, [
    [0, '#1c2127'],
    [1, '#333c45'],
  ]);
  ctx.fillRect(0, 0, w, CEIL_FRONT);
  fillRR(ctx, w / 2 - 11, 1.2, 22, 6.6, 1.4, '#0e1216');
  ctx.font = '700 5.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffb02e';
  ctx.fillText(String(floorNo), w / 2 - 5, 4.7);
  // where the car is right now (small digital readout)
  ctx.fillStyle = carHere ? '#6aff8c' : '#ff7a3a';
  ctx.fillText(String(carFloor + 1), w / 2 + 5.5, 4.7);
  ctx.fillStyle = '#39424b';
  ctx.fillRect(w / 2, 2.2, 0.5, 4.6);
  // jambs
  for (const sx of [0, w - 4]) {
    ctx.fillStyle = hgrad(ctx, sx, sx + 4, [
      [0, '#20262d'],
      [0.5, '#3b4550'],
      [1, '#20262d'],
    ]);
    ctx.fillRect(sx, 0, 4, FLOOR_H);
  }
  // call button on the right jamb
  fillRR(ctx, w - 5.2, 56, 4.4, 9, 1.2, '#2a3036');
  const lamp = called ? (Math.sin(t * 6) > -0.3 ? '#ffcf4a' : '#c98a1a') : '#4a3a1a';
  ctx.beginPath();
  ctx.arc(w - 3, 60.5, 1.4, 0, Math.PI * 2);
  ctx.fillStyle = lamp;
  ctx.fill();
  if (called) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, w - 3, 60.5, 6, '#ffcf4a', 0.5);
    ctx.restore();
  }
  // arrival lamp
  if (carHere) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, w / 2 + 5.5, 4.7, 7, '#6aff8c', 0.35);
    ctx.restore();
  }
  void FEET_Y;
}
