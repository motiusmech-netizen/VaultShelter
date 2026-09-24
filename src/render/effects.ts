/* Particles, floating numbers, fly-to-HUD collectables. */
import { rand } from '../core/util';
import { glow, rgba, type Ctx } from './gfx';
import { iconImage } from '../ui/icons';

export type PKind = 'spark' | 'smoke' | 'confetti' | 'dust' | 'heart' | 'star' | 'drop' | 'flame' | 'zzz' | 'note' | 'ember' | 'foam' | 'steam' | 'goo' | 'debris' | 'frost' | 'ring' | 'shell';

interface P {
  k: PKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  /** ground level for bouncing particles */
  floor?: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  icon?: string;
  color: string;
  life: number;
  max: number;
}

interface Flyer {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  icon: string;
  t: number;
  d: number;
  delay: number;
  arc: number;
  onArrive?: () => void;
}

export class Effects {
  ps: P[] = [];
  floaters: Floater[] = [];
  flyers: Flyer[] = [];
  quality = 1;

  emit(k: PKind, x: number, y: number, n = 1, opts: Partial<P> = {}) {
    n = Math.ceil(n * this.quality);
    for (let i = 0; i < n; i++) {
      if (this.ps.length > 900) this.ps.shift();
      const p: P = {
        k,
        x: x + rand(-2, 2),
        y: y + rand(-2, 2),
        vx: rand(-20, 20),
        vy: rand(-30, -5),
        life: 0,
        max: rand(0.6, 1.2),
        size: rand(1, 2.5),
        color: '#ffffff',
        rot: rand(0, 6),
        vr: rand(-4, 4),
        ...opts,
      };
      if (k === 'confetti') {
        p.vx = rand(-60, 60);
        p.vy = rand(-110, -40);
        p.max = rand(1.2, 2);
        p.size = rand(1.5, 2.8);
        p.color = opts.color ?? ['#ffcf4a', '#ff7cc0', '#5fb8ff', '#6aff8c', '#ff6a4d'][Math.floor(Math.random() * 5)];
      } else if (k === 'smoke') {
        p.vx = rand(-6, 6);
        p.vy = rand(-18, -8);
        p.max = rand(1.5, 2.6);
        p.size = rand(4, 8);
      } else if (k === 'dust') {
        p.vx = rand(-30, 30);
        p.vy = rand(-20, 5);
        p.max = rand(0.8, 1.6);
        p.size = rand(3, 7);
      } else if (k === 'heart' || k === 'note' || k === 'zzz') {
        p.vx = rand(-6, 6);
        p.vy = rand(-16, -10);
        p.max = rand(1.2, 1.8);
        p.size = rand(2.5, 3.5);
      } else if (k === 'spark' || k === 'ember') {
        p.vx = rand(-50, 50);
        p.vy = rand(-70, -10);
        p.max = rand(0.3, 0.7);
      } else if (k === 'star') {
        p.vx = rand(-40, 40);
        p.vy = rand(-60, -20);
        p.max = rand(0.6, 1.1);
        p.size = rand(2, 3.5);
      } else if (k === 'flame') {
        p.vx = rand(-5, 5);
        p.vy = rand(-35, -18);
        p.max = rand(0.5, 0.9);
        p.size = rand(3, 6);
      } else if (k === 'steam') {
        p.vx = rand(-8, 8);
        p.vy = rand(-26, -12);
        p.max = rand(0.9, 1.6);
        p.size = rand(3, 6);
      } else if (k === 'goo') {
        p.vx = rand(-45, 45);
        p.vy = rand(-70, -20);
        p.max = rand(0.5, 0.9);
        p.size = rand(0.8, 1.8);
      } else if (k === 'debris') {
        p.vx = rand(-70, 70);
        p.vy = rand(-110, -30);
        p.max = rand(0.8, 1.4);
        p.size = rand(1.2, 3);
      } else if (k === 'frost') {
        p.vx = rand(-25, 25);
        p.vy = rand(-30, 10);
        p.max = rand(0.5, 1);
        p.size = rand(0.8, 1.6);
      } else if (k === 'ring') {
        p.vx = 0;
        p.vy = 0;
        p.max = 0.35;
      } else if (k === 'shell') {
        p.vy = rand(-60, -40);
        p.max = 1.1;
        p.size = 1;
      }
      Object.assign(p, opts);
      this.ps.push(p);
    }
  }

  floatText(x: number, y: number, text: string, color = '#ffffff', icon?: string) {
    this.floaters.push({ x, y, text, color, icon, life: 0, max: 1.6 });
  }

  fly(sx: number, sy: number, tx: number, ty: number, icon: string, count = 5, onArrive?: () => void) {
    for (let i = 0; i < count; i++) {
      this.flyers.push({ sx: sx + rand(-14, 14), sy: sy + rand(-10, 10), tx, ty, icon, t: 0, d: rand(0.55, 0.8), delay: i * 0.05, arc: rand(-80, 80), onArrive: i === 0 ? onArrive : undefined });
    }
  }

  update(dt: number) {
    for (const p of this.ps) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      switch (p.k) {
        case 'confetti':
        case 'spark':
        case 'star':
        case 'ember':
          p.vy += 160 * dt;
          p.vx *= 0.98;
          break;
        case 'dust':
        case 'foam':
          p.vx *= 0.94;
          p.vy *= 0.94;
          break;
        case 'goo':
        case 'debris':
        case 'shell':
          p.vy += 220 * dt;
          if (p.floor !== undefined && p.y > p.floor) {
            p.y = p.floor;
            p.vy *= -0.35;
            p.vx *= 0.6;
            p.vr *= 0.5;
          }
          break;
        case 'frost':
          p.vx *= 0.95;
          p.vy += 20 * dt;
          break;
        case 'smoke':
          p.vx += Math.sin(p.life * 3 + p.rot) * 4 * dt;
          break;
      }
    }
    this.ps = this.ps.filter((p) => p.life < p.max);
    for (const f of this.floaters) {
      f.life += dt;
      f.y -= 22 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life < f.max);
    for (const f of this.flyers) {
      if (f.delay > 0) {
        f.delay -= dt;
        continue;
      }
      f.t += dt;
      if (f.t >= f.d && f.onArrive) {
        f.onArrive();
        f.onArrive = undefined;
      }
    }
    this.flyers = this.flyers.filter((f) => f.t < f.d);
  }

  /** World-space particles (inside world transform). */
  drawWorld(ctx: Ctx) {
    for (const p of this.ps) {
      const k = p.life / p.max;
      const a = 1 - k;
      switch (p.k) {
        case 'smoke': {
          ctx.fillStyle = `rgba(60,55,55,${0.35 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + k * 1.5), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'dust': {
          ctx.fillStyle = `rgba(170,140,110,${0.4 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + k), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'spark':
        case 'ember': {
          ctx.fillStyle = p.k === 'spark' ? `rgba(255,230,140,${a})` : `rgba(255,140,60,${a})`;
          ctx.fillRect(p.x, p.y, 1.2, 1.2);
          break;
        }
        case 'foam': {
          ctx.fillStyle = `rgba(245,250,255,${0.75 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + k * 1.6), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'steam': {
          ctx.fillStyle = `rgba(230,236,240,${0.32 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + k * 1.8), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'goo': {
          ctx.fillStyle = rgba(p.color === '#ffffff' ? '#8adf3a' : p.color, Math.min(1, a * 1.6));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'debris': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.fillStyle = p.color === '#ffffff' ? '#7a6048' : p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.8);
          ctx.restore();
          break;
        }
        case 'frost': {
          ctx.fillStyle = `rgba(200,240,255,${a})`;
          ctx.fillRect(p.x - p.size / 2, p.y - 0.25, p.size, 0.5);
          ctx.fillRect(p.x - 0.25, p.y - p.size / 2, 0.5, p.size);
          break;
        }
        case 'ring': {
          ctx.strokeStyle = rgba(p.color, 0.8 * a);
          ctx.lineWidth = 1.2 * a + 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.3 + k * 1.2), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'shell': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = '#d9b347';
          ctx.fillRect(-0.9, -0.35, 1.8, 0.7);
          ctx.restore();
          break;
        }
        case 'confetti': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
          break;
        }
        case 'flame': {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const c = k < 0.3 ? '#fff2a8' : k < 0.6 ? '#ffb040' : '#ff5020';
          glow(ctx, p.x, p.y, p.size * (1.4 - k * 0.6), c, 0.8 * a);
          ctx.restore();
          break;
        }
        case 'heart':
        case 'note':
        case 'zzz':
        case 'star':
        case 'drop': {
          ctx.globalAlpha = Math.min(1, a * 1.5);
          if (p.k === 'heart') drawHeart(ctx, p.x, p.y, p.size, '#ff5a7a');
          else if (p.k === 'star') drawStarP(ctx, p.x, p.y, p.size, '#ffe27a');
          else if (p.k === 'drop') {
            ctx.fillStyle = '#7fd3ff';
            ctx.fillRect(p.x, p.y, 0.8, 1.8);
          } else {
            ctx.font = `700 ${p.size * 2.2}px Rubik, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = p.k === 'zzz' ? '#cfe2ff' : '#ffcf4a';
            ctx.fillText(p.k === 'zzz' ? 'z' : '♪', p.x, p.y);
          }
          ctx.globalAlpha = 1;
          break;
        }
      }
    }
  }

  /** Screen-space floaters; toScreen maps world->screen css px. */
  drawScreen(ctx: Ctx, toScreen: (x: number, y: number) => { x: number; y: number }) {
    for (const f of this.floaters) {
      const s = toScreen(f.x, f.y);
      const k = f.life / f.max;
      const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      const pop = k < 0.12 ? 0.7 + (k / 0.12) * 0.4 : k < 0.2 ? 1.1 - ((k - 0.12) / 0.08) * 0.1 : 1;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(s.x, s.y);
      ctx.scale(pop, pop);
      ctx.font = '800 17px Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(f.text).width;
      const iw = f.icon ? 20 : 0;
      const img = f.icon ? iconImage(f.icon) : null;
      const total = tw + iw;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(10,12,16,0.85)';
      ctx.strokeText(f.text, -total / 2 + iw + tw / 2, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, -total / 2 + iw + tw / 2, 0);
      if (img) ctx.drawImage(img, -total / 2 - 2, -10, 20, 20);
      ctx.restore();
    }
  }

  drawFlyers(ctx: Ctx) {
    for (const f of this.flyers) {
      if (f.delay > 0) continue;
      const k = Math.min(1, f.t / f.d);
      const e = k * k * (3 - 2 * k);
      const x = f.sx + (f.tx - f.sx) * e + Math.sin(k * Math.PI) * f.arc;
      const y = f.sy + (f.ty - f.sy) * e - Math.sin(k * Math.PI) * 60;
      const img = iconImage(f.icon);
      const s = 26 - k * 8;
      if (img) ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
    }
  }
}

export function drawHeart(ctx: Ctx, x: number, y: number, s: number, c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.8, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9);
  ctx.fill();
}

function drawStarP(ctx: Ctx, x: number, y: number, s: number, c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 ? s * 0.35 : s;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.fill();
  void rgba;
}
