export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (v - a) / (b - a);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
export const chance = (p: number) => Math.random() < p;
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function weighted<T>(items: readonly T[], w: (t: T) => number): T {
  let total = 0;
  for (const it of items) total += Math.max(0, w(it));
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, w(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deterministic PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function fmtInt(n: number): string {
  n = Math.floor(n);
  const s = Math.abs(n).toString();
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ' ';
    out += s[i];
  }
  return (n < 0 ? '−' : '') + out;
}

export function fmtShort(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  return fmtInt(n);
}

export function fmtTime(sec: number, lang: 'ru' | 'en'): string {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const u = lang === 'ru' ? { h: 'ч', m: 'м', s: 'с' } : { h: 'h', m: 'm', s: 's' };
  if (h > 0) return `${h}${u.h} ${m.toString().padStart(2, '0')}${u.m}`;
  if (m > 0) return `${m}${u.m} ${s.toString().padStart(2, '0')}${u.s}`;
  return `${s}${u.s}`;
}

export function fmtClock(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Russian plural helper: plural(5, ['житель','жителя','жителей']) */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export class Emitter<T extends Record<string, any>> {
  private map = new Map<keyof T, Set<(p: any) => void>>();
  on<K extends keyof T>(k: K, fn: (p: T[K]) => void): () => void {
    let s = this.map.get(k);
    if (!s) this.map.set(k, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  }
  emit<K extends keyof T>(k: K, p: T[K]) {
    const s = this.map.get(k);
    if (s) for (const fn of [...s]) fn(p);
  }
}
