import { clamp, easeInOut } from '../core/util';
import { WORLD_H, WORLD_W } from './world';

export class Camera {
  x = 300;
  y = 200;
  zoom = 1;
  vx = 0;
  vy = 0;
  W = 800;
  H = 600;
  dpr = 1;
  minZoom = 0.2;
  maxZoom = 3.2;
  /** extra space reserved by UI on top/bottom (css px) */
  padTop = 70;
  padBottom = 80;
  private anim: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; t: number; d: number } | null = null;

  resize(w: number, h: number, dpr: number) {
    this.W = w;
    this.H = h;
    this.dpr = dpr;
    this.minZoom = clamp(Math.min(w / (WORLD_W + 500), 1), 0.12, 1);
    this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);
    this.clampPos();
  }

  toScreen(wx: number, wy: number) {
    return { x: (wx - this.x) * this.zoom + this.W / 2, y: (wy - this.y) * this.zoom + this.H / 2 };
  }
  toWorld(sx: number, sy: number) {
    return { x: (sx - this.W / 2) / this.zoom + this.x, y: (sy - this.H / 2) / this.zoom + this.y };
  }

  viewRect() {
    const hw = this.W / 2 / this.zoom;
    const hh = this.H / 2 / this.zoom;
    return { l: this.x - hw, r: this.x + hw, t: this.y - hh, b: this.y + hh };
  }

  clampPos() {
    const hw = this.W / 2 / this.zoom;
    const hh = this.H / 2 / this.zoom;
    const minX = -760 + hw;
    const maxX = WORLD_W + 380 - hw;
    const minY = -560 + hh;
    const maxY = WORLD_H + 120 - hh + this.padBottom / this.zoom;
    this.x = minX > maxX ? (minX + maxX) / 2 : clamp(this.x, minX, maxX);
    this.y = minY > maxY ? (minY + maxY) / 2 : clamp(this.y, minY, maxY);
  }

  pan(dxScreen: number, dyScreen: number) {
    this.anim = null;
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
    this.clampPos();
  }

  zoomAt(factor: number, sx: number, sy: number) {
    this.anim = null;
    const before = this.toWorld(sx, sy);
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    const after = this.toWorld(sx, sy);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clampPos();
  }

  focus(x: number, y: number, zoom = this.zoom, dur = 0.6) {
    this.vx = this.vy = 0;
    this.anim = { x0: this.x, y0: this.y, z0: this.zoom, x1: x, y1: y, z1: clamp(zoom, this.minZoom, this.maxZoom), t: 0, d: dur };
  }

  get animating() {
    return !!this.anim;
  }

  update(dt: number) {
    if (this.anim) {
      const a = this.anim;
      a.t += dt;
      const k = easeInOut(clamp(a.t / a.d, 0, 1));
      this.zoom = a.z0 + (a.z1 - a.z0) * k;
      this.x = a.x0 + (a.x1 - a.x0) * k;
      this.y = a.y0 + (a.y1 - a.y0) * k;
      this.clampPos();
      if (a.t >= a.d) this.anim = null;
      return;
    }
    if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
      this.x -= (this.vx * dt) / this.zoom;
      this.y -= (this.vy * dt) / this.zoom;
      const damp = Math.pow(0.004, dt);
      this.vx *= damp;
      this.vy *= damp;
      this.clampPos();
    }
  }
}
