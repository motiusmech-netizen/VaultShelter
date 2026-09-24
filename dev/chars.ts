import '../src/ui/fonts';
import { drawCharacter, DEFAULT_POSE, setVaultLabel, type Pose } from '../src/render/dwellerArt';
import { OUTFITS, OUTFIT_BY_ID, VAULT_SUIT, WEAPONS, WEAPON_BY_ID } from '../src/data/items';
import { LEGENDS } from '../src/data/names';
import { randomLook } from '../src/sim/dwellers';
import type { Look } from '../src/sim/types';
const c = document.getElementById('c') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const S = Number(params.get('s') || 4);
const outfits = [VAULT_SUIT, ...OUTFITS];
const cols = Number(params.get('cols') || 9);
const n = Number(params.get('n') || outfits.length);
const bg = params.get('bg') || '#d9cbb3';
const off = Number(params.get('off') || 0);
setVaultLabel(111);
// seeded randomness so sheets are reproducible
let seed = Number(params.get('seed') || 7);
Math.random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const mode = params.get('mode') || 'outfits';
if (mode === 'crowd') crowd();
else if (mode === 'legends') legends();
else sheet();

/** Legendary dwellers in their signature outfits: front and side. */
function legends() {
  c.width = LEGENDS.length * 40 * S;
  c.height = 124 * S;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  LEGENDS.forEach((L, i) => {
    for (const [row, view] of [[0, 'front'], [1, 'side']] as const) {
      ctx.save();
      ctx.scale(S, S);
      ctx.translate(i * 40 + 20, 56 + row * 62);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      const w = L.weapon ? WEAPON_BY_ID[L.weapon] : null;
      drawCharacter(ctx, { ...L.look, face: i }, OUTFIT_BY_ID[L.outfit] ?? VAULT_SUIT, { ...DEFAULT_POSE, view, facing: 1, mouth: 'happy', weapon: w, aim: view === 'side' && !!w }, L.gender);
      ctx.restore();
    }
  });
  (window as any).__done = true;
}

/** A crowd of random dwellers: shows how varied the generated looks are. */
function crowd() {
  const cols = Number(params.get('cols') || 12);
  const n = Number(params.get('n') || 48);
  const view = (params.get('view') || 'front') as Pose['view'];
  const child = params.get('child') === '1';
  // faces=1 crops each cell to the head and shoulders
  const faces = params.get('faces') === '1';
  const CW = faces ? 30 : 44;
  const CH = faces ? 30 : 62;
  const FY = faces ? 50 : 56;
  // set=age:3,mark:1 forces traits; g=m|f forces gender
  const force: Record<string, number> = {};
  for (const kv of (params.get('set') || '').split(',').filter(Boolean)) {
    const [k, v] = kv.split(':');
    force[k] = Number(v);
  }
  c.width = cols * CW * S;
  c.height = Math.ceil(n / cols) * CH * S;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  const suits = [VAULT_SUIT, VAULT_SUIT, VAULT_SUIT, ...OUTFITS];
  for (let i = 0; i < n; i++) {
    const g = (params.get('g') as 'm' | 'f' | null) ?? (Math.random() < 0.5 ? 'f' : 'm');
    const look = randomLook(g);
    Object.assign(look, force);
    if ('var' in force) (look as any)[params.get('vk') || 'hair'] = i + force.var;
    const o = params.get('suit') === '1' ? VAULT_SUIT : suits[Math.floor(Math.random() * suits.length)];
    const x = (i % cols) * CW + CW / 2;
    const y = Math.floor(i / cols) * CH + FY;
    ctx.save();
    ctx.scale(S, S);
    if (faces) {
      ctx.beginPath();
      ctx.rect((i % cols) * CW, Math.floor(i / cols) * CH, CW, CH);
      ctx.clip();
    }
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const mouth = (['happy', 'neutral', 'grin', 'happy', 'open'] as const)[i % 5];
    drawCharacter(ctx, look, o, { ...DEFAULT_POSE, view, facing: i % 2 ? 1 : -1, mouth, child }, g);
    ctx.restore();
  }
  (window as any).__done = true;
}

function sheet() {
const VIEWS = ['front', 'side', 'back', 'front'] as const;
const looks: Record<string, Look> = {};
const lookFor = (k: number, g: 'm' | 'f') => (looks[k + g] ??= randomLook(g));
c.width = cols * 64 * S;
c.height = Math.ceil((n * VIEWS.length) / cols) * 70 * S;
const ctx = c.getContext('2d')!;
document.fonts.load('700 10px Oswald').then(() => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  let i = 0;
  for (const o of outfits.slice(off, off + n)) {
    for (const view of VIEWS) {
      const k = i + off * 4;
      const x = (i % cols) * 64 + 32,
        y = Math.floor(i / cols) * 70 + 62;
      ctx.save();
      ctx.scale(S, S);
      ctx.translate(x, y);
      const g = Math.floor(k / 4) % 2 === 0 ? 'f' : 'm';
      const ph = k * 0.7;
      const mouth = (['happy', 'neutral', 'grin', 'sad', 'open'] as const)[k % 5];
      let pose: Pose;
      if (view === 'side')
        pose = { ...DEFAULT_POSE, view, legA: Math.sin(ph) * 0.55, legB: -Math.sin(ph) * 0.55, kneeA: Math.max(0, Math.sin(ph + 1.9)) * 0.8, kneeB: Math.max(0, Math.sin(ph + 1.9 + Math.PI)) * 0.8, armA: -Math.sin(ph) * 0.5, armB: Math.sin(ph) * 0.5, mouth, weapon: k % 4 === 1 ? WEAPONS[(k * 3) % WEAPONS.length] : null, aim: k % 4 === 1, flash: k % 8 === 1 };
      else if (view === 'back') pose = { ...DEFAULT_POSE, view, reach: k % 2 === 0, armA: 0.35, armB: 0.35, elbowA: k % 2 === 0 ? 2.2 : 0.14, elbowB: k % 2 === 0 ? 2.2 : 0.14, mouth };
      else {
        const v = Math.floor(k / 4) % 5;
        const idle = i % 4 === 3;
        pose = { ...DEFAULT_POSE, view, facing: k % 8 < 4 ? 1 : -1, mouth, eyes: k % 7 === 3 ? 'closed' : 'open' };
        if (idle) {
          if (v === 0) Object.assign(pose, { armA: 0.62, armB: 0.62, elbowA: 1.9, elbowB: 1.9 });
          if (v === 1) Object.assign(pose, { armB: 2.75, elbowB: -1.5, armA: 0.12, mouth: 'neutral' });
          if (v === 2) Object.assign(pose, { armA: 0.35, armB: 0.35, elbowA: 2.9, elbowB: 2.9 });
          if (v === 3) Object.assign(pose, { armA: 2.8, armB: 2.8, elbowA: -0.6, elbowB: -0.6, mouth: 'open', eyes: 'closed' });
          if (v === 4) Object.assign(pose, { armA: 0.62, elbowA: 1.9, armB: 0.1, legB: 0.12 });
        } else if (k % 6 === 0) Object.assign(pose, { armA: 2.4, armB: 2.4 });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      drawCharacter(ctx, lookFor(Math.floor(k / 4), g), o, pose, g);
      ctx.restore();
      i++;
    }
  }
  (window as any).__done = true;
});
}
