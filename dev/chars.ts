import '../src/ui/fonts';
import { drawCharacter, DEFAULT_POSE, setVaultLabel, type Pose } from '../src/render/dwellerArt';
import { OUTFITS, VAULT_SUIT, WEAPONS } from '../src/data/items';
const c = document.getElementById('c') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const S = Number(params.get('s') || 4);
const outfits = [VAULT_SUIT, ...OUTFITS];
const cols = Number(params.get('cols') || 9);
const n = Number(params.get('n') || outfits.length);
const bg = params.get('bg') || '#d9cbb3';
const off = Number(params.get('off') || 0);
setVaultLabel(111);
const VIEWS = ['front', 'side', 'back', 'front'] as const;
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
      const g = k % 3 === 0 ? 'f' : 'm';
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
      drawCharacter(ctx, { skin: k % 6, hair: k % 12, hairColor: k % 9, beard: g === 'm' ? k % 5 : 0, glasses: k % 7 === 0, face: k % 5 }, o, pose, g);
      ctx.restore();
      i++;
    }
  }
  (window as any).__done = true;
});
