/* Drawing toolkit: colors, shapes, materials. All coordinates are in world units. */

export type Ctx = CanvasRenderingContext2D;

const colorCache = new Map<string, [number, number, number]>();

export function rgb(hex: string): [number, number, number] {
  let c = colorCache.get(hex);
  if (c) return c;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  colorCache.set(hex, c);
  return c;
}

export function hex(r: number, g: number, b: number) {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

/** amt in [-1, 1]: negative darkens, positive lightens */
export function shade(c: string, amt: number): string {
  const [r, g, b] = rgb(c);
  if (amt < 0) return hex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  return hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function rgba(c: string, a: number): string {
  const [r, g, b] = rgb(c);
  return `rgba(${r},${g},${b},${a})`;
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) {
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = rr.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function fillRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[], fill: string | CanvasGradient) {
  rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function vgrad(ctx: Ctx, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function hgrad(ctx: Ctx, x0: number, x1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function rgrad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Box with bevel: top highlight, bottom shadow, dark outline. */
export function box(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, r = 1.5, outline = true) {
  fillRR(ctx, x, y, w, h, r, vgrad(ctx, y, y + h, [[0, shade(base, 0.14)], [0.5, base], [1, shade(base, -0.22)]]));
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(x + r * 0.5, y, w - r, Math.min(1, h * 0.2));
  if (outline) {
    rrect(ctx, x, y, w, h, r);
    ctx.strokeStyle = rgba(shade(base, -0.6), 0.75);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

/** Cylinder drawn vertically (like a tank) with horizontal shading. */
export function cylinder(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, capH = 3) {
  ctx.fillStyle = hgrad(ctx, x, x + w, [
    [0, shade(base, -0.45)],
    [0.18, shade(base, 0.05)],
    [0.35, shade(base, 0.3)],
    [0.55, base],
    [1, shade(base, -0.5)],
  ]);
  ctx.fillRect(x, y + capH / 2, w, h - capH);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + capH / 2, w / 2, capH / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade(base, 0.25);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - capH / 2, w / 2, capH / 2, 0, 0, Math.PI);
  ctx.fillStyle = shade(base, -0.4);
  ctx.fill();
}

/** Horizontal cylinder (pipe segment / drum). */
export function hcylinder(ctx: Ctx, x: number, y: number, w: number, h: number, base: string) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [
    [0, shade(base, -0.3)],
    [0.25, shade(base, 0.35)],
    [0.5, base],
    [1, shade(base, -0.55)],
  ]);
  rrect(ctx, x, y, w, h, h / 2.5);
  ctx.fill();
}

export function pipeH(ctx: Ctx, x0: number, x1: number, y: number, r: number, base: string) {
  ctx.fillStyle = vgrad(ctx, y - r, y + r, [
    [0, shade(base, -0.35)],
    [0.3, shade(base, 0.4)],
    [0.55, base],
    [1, shade(base, -0.55)],
  ]);
  ctx.fillRect(x0, y - r, x1 - x0, r * 2);
}

export function pipeV(ctx: Ctx, x: number, y0: number, y1: number, r: number, base: string) {
  ctx.fillStyle = hgrad(ctx, x - r, x + r, [
    [0, shade(base, -0.35)],
    [0.3, shade(base, 0.4)],
    [0.55, base],
    [1, shade(base, -0.55)],
  ]);
  ctx.fillRect(x - r, y0, r * 2, y1 - y0);
}

export function flange(ctx: Ctx, x: number, y: number, w: number, h: number, base: string) {
  box(ctx, x, y, w, h, shade(base, -0.1), 0.6);
}

export function rivet(ctx: Ctx, x: number, y: number, r: number, base: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [
    [0, shade(base, 0.5)],
    [1, shade(base, -0.4)],
  ]);
  ctx.fill();
}

export function hazard(ctx: Ctx, x: number, y: number, w: number, h: number, a = '#f2b632', b = '#26282b', step = 6) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = a;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = b;
  for (let i = -h; i < w + h; i += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + step, y + h);
    ctx.lineTo(x + i + step + h, y);
    ctx.lineTo(x + i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function gauge(ctx: Ctx, cx: number, cy: number, r: number, val: number, face = '#f1ead7') {
  ctx.beginPath();
  ctx.arc(cx, cy, r + 0.9, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3f45';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, cx - r * 0.3, cy - r * 0.3, 0, r * 1.3, [
    [0, shade(face, 0.3)],
    [1, shade(face, -0.15)],
  ]);
  ctx.fill();
  ctx.strokeStyle = '#d64541';
  ctx.lineWidth = r * 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, -0.2, 0.55);
  ctx.stroke();
  const a = Math.PI * (0.8 + val * 1.4);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = Math.max(0.35, r * 0.12);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
  ctx.stroke();
}

export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a = 0.5) {
  ctx.fillStyle = rgrad(ctx, x, y, 0, r, [
    [0, rgba(color, a)],
    [0.4, rgba(color, a * 0.35)],
    [1, rgba(color, 0)],
  ]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function screenRect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, frame = '#2a2f35') {
  box(ctx, x - 1, y - 1, w + 2, h + 2, frame, 1);
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h / 2, 0, Math.max(w, h) * 0.8, [
    [0, shade(color, 0.25)],
    [0.7, color],
    [1, shade(color, -0.55)],
  ]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba('#ffffff', 0.12);
  ctx.fillRect(x, y, w, h * 0.35);
}

export function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, font = 'Oswald', weight = 600, align: CanvasTextAlign = 'center') {
  ctx.font = `${weight} ${size}px ${font}, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

/** Tileable value-noise canvas (grayscale), used as grit overlay. */
let noiseCanvas: HTMLCanvasElement | null = null;
export function noiseTex(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const img = g.createImageData(S, S);
  const grid = 16;
  const rnd: number[] = [];
  for (let i = 0; i < grid * grid; i++) rnd.push(Math.random());
  const at = (x: number, y: number) => rnd[((y + grid) % grid) * grid + ((x + grid) % grid)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const fx = (x / S) * grid;
      const fy = (y / S) * grid;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const v =
        at(x0, y0) * (1 - sx) * (1 - sy) + at(x0 + 1, y0) * sx * (1 - sy) + at(x0, y0 + 1) * (1 - sx) * sy + at(x0 + 1, y0 + 1) * sx * sy;
      const n = v * 0.7 + Math.random() * 0.3;
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  noiseCanvas = c;
  return c;
}

/** Overlay grit on the current clip region. */
export function grit(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.08, scale = 0.5) {
  const pat = ctx.createPattern(noiseTex(), 'repeat');
  if (!pat) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w / scale, h / scale);
  ctx.restore();
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

export function star5(ctx: Ctx, cx: number, cy: number, r: number, r2 = r * 0.45) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r2;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function gearPath(ctx: Ctx, cx: number, cy: number, r: number, teeth: number, toothH: number, rot = 0) {
  ctx.beginPath();
  const n = teeth * 2;
  for (let i = 0; i <= n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2;
    const phase = Math.floor(i / 2) % 2;
    const rr = phase === 0 ? r + toothH : r;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
