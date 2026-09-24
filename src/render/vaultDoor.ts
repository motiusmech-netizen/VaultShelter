/* The big cog-shaped vault door. Drawn centered at (cx, cy); rot spins it while it rolls open. */
import { gearPath, rgba, rgrad, rivet, shade, type Ctx } from './gfx';

export function drawVaultDoorDisc(ctx: Ctx, cx: number, cy: number, r: number, rot: number, vault: number, level: number) {
  const base = level >= 3 ? '#a9b4bf' : level === 2 ? '#98a3ae' : '#8a949e';
  ctx.save();
  ctx.translate(cx, cy);
  // contact shadow on the frame
  ctx.beginPath();
  ctx.arc(2.4, 3.2, r + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = rgba('#000', 0.5);
  ctx.fill();
  ctx.rotate(rot);

  // cog body
  gearPath(ctx, 0, 0, r - 2.6, 14, 2.8, 0);
  ctx.fillStyle = rgrad(ctx, -r * 0.35, -r * 0.4, r * 0.1, r * 1.25, [
    [0, shade(base, 0.38)],
    [0.55, base],
    [1, shade(base, -0.5)],
  ]);
  ctx.fill();
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = shade(base, -0.62);
  ctx.stroke();

  // outer bevel ring
  ctx.beginPath();
  ctx.arc(0, 0, r - 4.2, 0, Math.PI * 2);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = rgba('#000', 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r - 5.4, Math.PI * 0.9, Math.PI * 1.7);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = rgba('#ffffff', 0.35);
  ctx.stroke();

  // radial armour panels
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2 + 0.06;
    const a1 = ((i + 1) / 8) * Math.PI * 2 - 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, a0, a1);
    ctx.arc(0, 0, r * 0.5, a1, a0, true);
    ctx.closePath();
    const lit = Math.cos((a0 + a1) / 2 + Math.PI * 0.75 + rot);
    ctx.fillStyle = rgba(lit > 0 ? '#ffffff' : '#000000', Math.abs(lit) * 0.1);
    ctx.fill();
    ctx.strokeStyle = rgba('#000', 0.3);
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // hazard ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2, true);
  ctx.clip();
  ctx.fillStyle = '#e8b030';
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = '#26282b';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.52, a, a + Math.PI / 24);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // bolts
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rivet(ctx, Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, 1.25, base);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    rivet(ctx, Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, 0.9, base);
  }

  // locking hub with spokes
  ctx.strokeStyle = shade(base, -0.35);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * r * 0.41, Math.sin(a) * r * 0.41);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = rgrad(ctx, -r * 0.1, -r * 0.1, 0.5, r * 0.34, [
    [0, '#ffe29a'],
    [0.6, '#e0a232'],
    [1, '#9a6010'],
  ]);
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#6a4008';
  ctx.stroke();
  ctx.rotate(-rot);
  ctx.font = `800 ${r * 0.25}px Unbounded, Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba('#fff4d0', 0.5);
  ctx.fillText(String(vault).padStart(3, '0'), 0.3, 1);
  ctx.fillStyle = '#3a2408';
  ctx.fillText(String(vault).padStart(3, '0'), 0, 0.6);
  ctx.restore();
}
