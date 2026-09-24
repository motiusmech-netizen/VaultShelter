/*
 * Elevator shafts and cars (visual only).
 * Contiguous elevator cells in one column form a shaft with a single car. Dwellers call the car,
 * wait at the landing, board when the doors open, ride inside with the car's smooth
 * acceleration and braking, and step out on their floor. The car picks up waiting dwellers
 * heading the same way when it can still brake in time.
 */
import type { Game } from '../sim/game';
import { CELL_W, FEET_Y, floorY } from './world';

export const CAR_CAP = 4;
/** max speed in floors per second, acceleration in floors per second² */
const VMAX = 1.7;
const ACC = 3.2;
const DOOR_T = 0.34;
const DWELL = 0.55;

export type LiftPhase = 'wait' | 'board' | 'in' | 'exit';
export interface LiftTicket {
  key: string;
  to: number;
  phase: LiftPhase;
  since: number;
  slot: number;
}

export interface LiftRider {
  id: number;
  x: number;
  y: number;
  floor: number;
  lift: LiftTicket | null;
}

export interface Car {
  pos: number; // fractional floor index
  v: number; // floors / s, signed
  target: number;
  state: 'idle' | 'moving' | 'opening' | 'open' | 'closing';
  door: number; // 0 closed .. 1 open
  timer: number;
  riders: number[];
  dir: number;
  wheel: number;
  bump: number; // short sway after start/stop
  arrived: number; // time of the last arrival, for the chime lamp
}

export interface Shaft {
  key: string;
  col: number;
  top: number;
  bottom: number;
  car: Car;
}

/** Car slot offsets inside the cabin (x relative to the shaft centre). */
const SLOTS = [-9, 9, -2.5, 15.5];

export function carFeetY(pos: number) {
  return floorY(0) + pos * (floorY(1) - floorY(0)) + FEET_Y;
}

export class Lifts {
  shafts = new Map<string, Shaft>();
  private sig = '';
  private clock = 0;
  /** callback for sounds */
  onArrive?: (sh: Shaft) => void;
  /** someone is walking to this landing to take the car: hold the doors a little */
  approaching?: (sh: Shaft, floor: number) => boolean;

  constructor(private g: Game) {}

  /** Rebuild the shaft list when the elevator layout changes (cars keep their state). */
  sync() {
    const cells = this.g.s.rooms.filter((r) => r.type === 'elevator').map((r) => [r.col, r.floor] as const);
    const sig = cells
      .map(([c, f]) => c * 100 + f)
      .sort((a, b) => a - b)
      .join(',');
    if (sig === this.sig) return;
    this.sig = sig;
    const byCol = new Map<number, number[]>();
    for (const [c, f] of cells) {
      const l = byCol.get(c) ?? [];
      l.push(f);
      byCol.set(c, l);
    }
    const old = [...this.shafts.values()];
    const next = new Map<string, Shaft>();
    for (const [col, floors] of byCol) {
      floors.sort((a, b) => a - b);
      let start = floors[0];
      for (let i = 1; i <= floors.length; i++) {
        if (i < floors.length && floors[i] === floors[i - 1] + 1) continue;
        const top = start;
        const bottom = floors[i - 1];
        const key = `${col}:${top}`;
        const prev = old.find((s) => s.col === col && s.car.pos >= top - 0.5 && s.car.pos <= bottom + 0.5);
        const car: Car = prev
          ? prev.car
          : { pos: top, v: 0, target: -1, state: 'idle', door: 0, timer: 0, riders: [], dir: 1, wheel: 0, bump: 0, arrived: -9 };
        car.pos = Math.min(bottom, Math.max(top, car.pos));
        next.set(key, { key, col, top, bottom, car });
        if (i < floors.length) start = floors[i];
      }
    }
    this.shafts = next;
  }

  shaftAt(col: number, floor: number): Shaft | undefined {
    for (const s of this.shafts.values()) if (s.col === col && floor >= s.top && floor <= s.bottom) return s;
    return undefined;
  }

  shaftX(sh: Shaft) {
    return sh.col * CELL_W + CELL_W / 2;
  }

  /** Call the car: the dweller now waits at the landing of `floor`. */
  request(a: LiftRider, sh: Shaft, to: number) {
    a.lift = { key: sh.key, to, phase: 'wait', since: this.clock, slot: 0 };
  }

  /** Remove a dweller from any car (dragged away, reassigned while waiting, gone). */
  cancel(a: LiftRider) {
    if (!a.lift) return;
    const sh = this.shafts.get(a.lift.key);
    if (sh) sh.car.riders = sh.car.riders.filter((id) => id !== a.id);
    a.lift = null;
  }

  update(dt: number, actors: Map<number, LiftRider>) {
    this.clock += dt;
    this.sync();
    const users = new Map<string, LiftRider[]>();
    for (const a of actors.values()) {
      if (!a.lift) continue;
      if (!this.shafts.has(a.lift.key)) {
        a.lift = null;
        continue;
      }
      const l = users.get(a.lift.key) ?? [];
      l.push(a);
      users.set(a.lift.key, l);
    }
    for (const sh of this.shafts.values()) this.step(sh, dt, users.get(sh.key) ?? [], actors);
  }

  private step(sh: Shaft, dt: number, list: LiftRider[], actors: Map<number, LiftRider>) {
    const c = sh.car;
    c.riders = c.riders.filter((id) => actors.get(id)?.lift?.key === sh.key);
    const riders = c.riders.map((id) => actors.get(id)!).filter((a) => a.lift!.phase !== 'exit');
    const waiting = list.filter((a) => a.lift!.phase === 'wait');
    const cur = Math.round(c.pos);
    const stopped = c.state !== 'moving';
    c.bump = Math.max(0, c.bump - dt * 2.5);

    switch (c.state) {
      case 'idle': {
        const t = this.pickTarget(sh, waiting, riders);
        if (t === null) break;
        if (t === cur && Math.abs(c.pos - cur) < 1e-3) c.state = 'opening';
        else {
          c.target = t;
          c.state = 'moving';
          c.dir = Math.sign(t - c.pos) || c.dir;
          c.bump = 1;
        }
        break;
      }
      case 'moving': {
        // pick up dwellers heading our way if we can still brake for their floor
        const brake = (c.v * c.v) / (2 * ACC);
        for (const w of waiting) {
          const f = w.floor;
          const between = c.dir > 0 ? f > c.pos + brake + 0.02 && f < c.target : f < c.pos - brake - 0.02 && f > c.target;
          const sameWay = Math.sign(w.lift!.to - f) === c.dir;
          if (between && sameWay && riders.length < CAR_CAP) c.target = f;
        }
        const dist = c.target - c.pos;
        const want = Math.sign(dist) * Math.min(VMAX, Math.sqrt(2 * ACC * Math.abs(dist)));
        const dv = want - c.v;
        c.v += Math.sign(dv) * Math.min(Math.abs(dv), ACC * dt);
        c.pos += c.v * dt;
        c.wheel += c.v * dt * 4;
        if (Math.abs(c.target - c.pos) < 0.003 || Math.sign(c.target - c.pos) !== Math.sign(dist)) {
          c.pos = c.target;
          c.v = 0;
          c.state = 'opening';
          c.bump = 1;
          c.arrived = this.clock;
          this.onArrive?.(sh);
        }
        break;
      }
      case 'opening':
        c.door = Math.min(1, c.door + dt / DOOR_T);
        if (c.door >= 1) {
          c.state = 'open';
          c.timer = 0;
        }
        break;
      case 'open': {
        c.timer += dt;
        // riders for this floor step out
        for (const a of riders) {
          if (a.lift!.to === cur) {
            a.lift!.phase = 'exit';
            c.riders = c.riders.filter((id) => id !== a.id);
          }
        }
        // waiting dwellers on this floor board
        const inside = c.riders.length;
        let room = CAR_CAP - inside;
        const used = new Set(c.riders.map((id) => actors.get(id)!.lift!.slot));
        for (const a of waiting.sort((p, q) => p.lift!.since - q.lift!.since)) {
          if (room <= 0) break;
          if (a.floor !== cur || a.lift!.to === cur) continue;
          let slot = 0;
          while (used.has(slot) && slot < SLOTS.length - 1) slot++;
          used.add(slot);
          a.lift!.slot = slot;
          a.lift!.phase = 'board';
          c.riders.push(a.id);
          room--;
          c.timer = Math.min(c.timer, 0.2);
        }
        const moving = list.some((a) => a.lift!.phase === 'board' || (a.lift!.phase === 'exit' && a.floor === cur));
        const hold = c.riders.length < CAR_CAP && c.timer < 2.4 && !!this.approaching?.(sh, cur);
        if (!moving && !hold && c.timer > DWELL) c.state = 'closing';
        break;
      }
      case 'closing': {
        // someone just arrived at the landing: open again
        if (waiting.some((a) => a.floor === cur && a.lift!.to !== cur) && c.riders.length < CAR_CAP) {
          c.state = 'opening';
          break;
        }
        c.door = Math.max(0, c.door - dt / DOOR_T);
        if (c.door <= 0) c.state = 'idle';
        break;
      }
    }
    // riders travel with the car
    const fy = carFeetY(c.pos);
    for (const id of c.riders) {
      const a = actors.get(id);
      if (!a || a.lift!.phase !== 'in') continue;
      a.y = fy;
      a.floor = Math.round(c.pos);
      a.x = this.shaftX(sh) + SLOTS[a.lift!.slot];
    }
    void stopped;
  }

  slotX(sh: Shaft, slot: number) {
    return this.shaftX(sh) + SLOTS[slot];
  }

  private pickTarget(sh: Shaft, waiting: LiftRider[], riders: LiftRider[]): number | null {
    const c = sh.car;
    if (riders.length) {
      const dests = riders.map((a) => a.lift!.to);
      const ahead = dests.filter((d) => Math.sign(d - c.pos) === c.dir);
      const pool = ahead.length ? ahead : dests;
      return pool.reduce((b, d) => (Math.abs(d - c.pos) < Math.abs(b - c.pos) ? d : b), pool[0]);
    }
    if (!waiting.length) return null;
    const first = waiting.reduce((b, a) => (a.lift!.since < b.lift!.since ? a : b), waiting[0]);
    return first.floor;
  }
}
