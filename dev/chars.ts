import '../src/ui/fonts';
import { drawCharacter, DEFAULT_POSE, type Pose } from '../src/render/dwellerArt';
import { OUTFITS, VAULT_SUIT, WEAPONS } from '../src/data/items';
const c = document.getElementById('c') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const S = Number(params.get('s') || 4);
const outfits = [VAULT_SUIT, ...OUTFITS];
const cols = Number(params.get('cols') || 9);
const n = Number(params.get('n') || outfits.length);
const bg = params.get('bg') || '#d9cbb3';
c.width = cols * 64 * S; c.height = Math.ceil(n * 2 / cols) * 66 * S;
const ctx = c.getContext('2d')!;
ctx.fillStyle = bg; ctx.fillRect(0,0,c.width,c.height);
let i = 0;
for (const o of outfits.slice(0, n)) {
  for (const view of ['front', 'side'] as const) {
    const x = (i % cols) * 64 + 32, y = Math.floor(i / cols) * 66 + 58;
    ctx.save(); ctx.scale(S, S); ctx.translate(x, y);
    const g = i % 3 === 0 ? 'f' : 'm';
    const ph = i * 0.7;
    const pose: Pose = view === 'side'
      ? { ...DEFAULT_POSE, view, legA: Math.sin(ph)*0.55, legB: -Math.sin(ph)*0.55, armA: -Math.sin(ph)*0.5, armB: Math.sin(ph)*0.5, mouth: (['happy','neutral','grin','sad','open'] as const)[i%5], weapon: i%4===1 ? WEAPONS[(i*3)%WEAPONS.length] : null, aim: i%4===1, flash: i%8===1 }
      : { ...DEFAULT_POSE, view, facing: i % 4 < 2 ? 1 : -1, armA: i%6===0 ? 2.4 : 0.1, armB: i%6===0 ? 2.4 : 0.1, mouth: (['happy','neutral','grin','sad','open'] as const)[i%5], eyes: i%7===3 ? 'closed' : 'open' };
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 2, 0, 0, Math.PI*2); ctx.fill();
    drawCharacter(ctx, { skin: i % 6, hair: i % 12, hairColor: i % 9, beard: g==='m' ? i % 5 : 0, glasses: i % 7 === 0, face: i % 5 }, o, pose, g);
    ctx.restore();
    i++;
  }
}
(window as any).__done = true;
