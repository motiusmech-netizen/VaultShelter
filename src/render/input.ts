import type { Renderer, Hit } from './renderer';
import type { Dweller, Room } from '../sim/types';

export interface InputHandlers {
  onTap(hit: Hit, sx: number, sy: number): void;
  canDrag(d: Dweller): boolean;
  onDrop(d: Dweller, room: Room | undefined, wx: number, wy: number): void;
  onInteract(): void;
}

interface Ptr {
  id: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  t: number;
  type: string;
}

export class Input {
  private ptrs = new Map<number, Ptr>();
  private mode: 'none' | 'pan' | 'pinch' | 'drag' = 'none';
  private moved = false;
  private pinchDist = 0;
  private pinchMid = { x: 0, y: 0 };
  private lpTimer: any = 0;
  private downHit: Hit = null;
  private velSamples: { x: number; y: number; t: number }[] = [];
  private edge = { x: 0, y: 0 };
  enabled = true;

  constructor(el: HTMLElement, private r: Renderer, private h: InputHandlers) {
    el.addEventListener('pointerdown', this.down, { passive: false });
    window.addEventListener('pointermove', this.move, { passive: false });
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.cancel);
    el.addEventListener('wheel', this.wheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private down = (e: PointerEvent) => {
    if (!this.enabled) return;
    e.preventDefault();
    this.h.onInteract();
    const p: Ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), type: e.pointerType };
    this.ptrs.set(e.pointerId, p);
    this.r.cam.vx = this.r.cam.vy = 0;
    if (this.ptrs.size === 1) {
      this.mode = 'pan';
      this.moved = false;
      this.velSamples = [{ x: p.x, y: p.y, t: p.t }];
      this.downHit = this.r.hitTest(p.x, p.y);
      clearTimeout(this.lpTimer);
      if (this.downHit?.kind === 'dweller' && p.type !== 'mouse') {
        const d = this.downHit.d;
        this.lpTimer = setTimeout(() => {
          if (!this.moved && this.mode === 'pan' && this.h.canDrag(d)) this.startDrag(d, p.x, p.y);
        }, 330);
      }
    } else if (this.ptrs.size === 2) {
      clearTimeout(this.lpTimer);
      if (this.mode === 'drag') this.endDrag(false);
      this.mode = 'pinch';
      const [a, b] = [...this.ptrs.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  };

  private startDrag(d: Dweller, x: number, y: number) {
    this.mode = 'drag';
    const w = this.r.cam.toWorld(x, y);
    this.r.drag = { id: d.id, wx: w.x, wy: w.y };
    const a = this.r.actors.get(d.id);
    if (a) {
      this.r.actors.releaseLift(a);
      a.dragged = true;
    }
    try {
      navigator.vibrate?.(15);
    } catch { /* ignore */ }
  }

  private endDrag(drop: boolean) {
    const drag = this.r.drag;
    this.r.drag = null;
    this.edge = { x: 0, y: 0 };
    if (!drag) return;
    const d = this.r.g.dweller(drag.id);
    const a = this.r.actors.get(drag.id);
    if (a) a.dragged = false;
    if (d && drop) this.h.onDrop(d, this.r.roomAtWorld(drag.wx, drag.wy), drag.wx, drag.wy);
  }

  private move = (e: PointerEvent) => {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > 8) {
      if (!this.moved) {
        this.moved = true;
        clearTimeout(this.lpTimer);
        // mouse: drag a dweller directly
        if (this.mode === 'pan' && p.type === 'mouse' && this.downHit?.kind === 'dweller' && this.h.canDrag(this.downHit.d)) {
          this.startDrag(this.downHit.d, p.x, p.y);
        }
      }
    }
    if (this.mode === 'pan' && this.moved) {
      this.r.cam.pan(dx, dy);
      const now = performance.now();
      this.velSamples.push({ x: p.x, y: p.y, t: now });
      while (this.velSamples.length > 2 && now - this.velSamples[0].t > 90) this.velSamples.shift();
    } else if (this.mode === 'pinch' && this.ptrs.size >= 2) {
      const [a, b] = [...this.ptrs.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (this.pinchDist > 0) this.r.cam.zoomAt(dist / this.pinchDist, mid.x, mid.y);
      this.r.cam.pan(mid.x - this.pinchMid.x, mid.y - this.pinchMid.y);
      this.pinchDist = dist;
      this.pinchMid = mid;
    } else if (this.mode === 'drag' && this.r.drag) {
      const w = this.r.cam.toWorld(p.x, p.y);
      this.r.drag.wx = w.x;
      this.r.drag.wy = w.y;
      const m = 60;
      const W = this.r.cam.W;
      const H = this.r.cam.H;
      this.edge.x = p.x < m ? -1 : p.x > W - m ? 1 : 0;
      this.edge.y = p.y < m + 50 ? -1 : p.y > H - m - 60 ? 1 : 0;
    }
  };

  /** Auto-pan while dragging near screen edges. */
  update(dt: number) {
    if (this.mode === 'drag' && (this.edge.x || this.edge.y) && this.r.drag) {
      this.r.cam.pan(-this.edge.x * 420 * dt, -this.edge.y * 420 * dt);
      const p = [...this.ptrs.values()][0];
      if (p) {
        const w = this.r.cam.toWorld(p.x, p.y);
        this.r.drag.wx = w.x;
        this.r.drag.wy = w.y;
      }
    }
  }

  private up = (e: PointerEvent) => {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    this.ptrs.delete(e.pointerId);
    clearTimeout(this.lpTimer);
    if (this.mode === 'drag') {
      this.endDrag(true);
      this.mode = 'none';
      return;
    }
    if (this.mode === 'pinch') {
      if (this.ptrs.size === 0) this.mode = 'none';
      else this.mode = 'pinch';
      return;
    }
    if (this.mode === 'pan') {
      if (!this.moved && performance.now() - p.t < 700) {
        this.h.onTap(this.r.hitTest(p.x, p.y), p.x, p.y);
      } else if (this.moved && this.velSamples.length >= 2) {
        const a = this.velSamples[0];
        const b = this.velSamples[this.velSamples.length - 1];
        const dt = Math.max(16, b.t - a.t) / 1000;
        this.r.cam.vx = (b.x - a.x) / dt;
        this.r.cam.vy = (b.y - a.y) / dt;
      }
    }
    this.mode = 'none';
  };

  private cancel = (e: PointerEvent) => {
    this.ptrs.delete(e.pointerId);
    clearTimeout(this.lpTimer);
    if (this.mode === 'drag') this.endDrag(false);
    this.mode = 'none';
  };

  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.enabled) return;
    const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    this.r.cam.zoomAt(f, e.clientX, e.clientY);
  };
}
