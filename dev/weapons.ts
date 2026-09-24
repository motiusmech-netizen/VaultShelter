import '../src/ui/fonts';
import { drawCharacter, DEFAULT_POSE, drawWeapon, setVaultLabel } from '../src/render/dwellerArt';
import { VAULT_SUIT, WEAPONS } from '../src/data/items';
import { randomLook } from '../src/sim/dwellers';

// Every weapon: icon, rest pose and four attack phases.
const params = new URLSearchParams(location.search);
const S = Number(params.get('s') || 3);
const off = Number(params.get('off') || 0);
const n = Number(params.get('n') || WEAPONS.length);
const phases = (params.get('ph') || '0,0.2,0.45,0.6').split(',').map(Number);
const c = document.getElementById('c') as HTMLCanvasElement;
const list = WEAPONS.slice(off, off + n);
const COLW = 64;
c.width = (2 + phases.length) * COLW * S;
c.height = list.length * 64 * S;
const ctx = c.getContext('2d')!;
setVaultLabel(111);
let seed = 3;
Math.random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
ctx.fillStyle = '#cfc3ae';
ctx.fillRect(0, 0, c.width, c.height);
list.forEach((w, row) => {
  const look = randomLook(row % 2 ? 'm' : 'f');
  const g = row % 2 ? 'm' : 'f';
  ctx.save();
  ctx.scale(S, S);
  ctx.fillStyle = row % 2 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, row * 64, c.width, 64);
  ctx.fillStyle = '#2a2320';
  ctx.font = '600 5px Rubik, sans-serif';
  ctx.fillText(w.name.ru, 3, row * 64 + 8);
  ctx.save();
  ctx.translate(18, row * 64 + 34);
  ctx.scale(1.4, 1.4);
  drawWeapon(ctx, w, 0, 0);
  ctx.restore();
  const cells: (number | null)[] = [null, ...phases];
  cells.forEach((ph, i) => {
    ctx.save();
    ctx.translate(COLW * (1 + i) + 22, row * 64 + 58);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCharacter(ctx, look, VAULT_SUIT, { ...DEFAULT_POSE, view: 'side', weapon: w, aim: ph !== null, attack: ph ?? undefined, mouth: ph === null ? 'neutral' : 'open', eyes: 'open', legA: ph === null ? 0 : 0.3, legB: ph === null ? 0 : -0.25 }, g);
    ctx.restore();
  });
  ctx.restore();
});
(window as any).__done = true;
