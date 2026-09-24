/* Dweller movement, pathfinding and animation state (visual only). */
import { ROOMS, type RoomType } from '../data/rooms';
import { OUTFIT_BY_ID, VAULT_SUIT, WEAPON_BY_ID, type OutfitDef, type WeaponDef } from '../data/items';
import { clamp, rand } from '../core/util';
import type { Game } from '../sim/game';
import { COLS, FLOORS, type Dweller, type Room } from '../sim/types';
import { itemByUid } from '../sim/dwellers';
import { CELL_W, FEET_Y, FLOOR_H, floorY, roomW, roomX } from './world';
import { outsideFeetY, RAMP_X0 } from './background';
import { DEFAULT_POSE, type Pose } from './dwellerArt';

export type Mode = 'idle' | 'walk' | 'ride' | 'hidden';

interface Step {
  kind: 'walk' | 'ride';
  x: number;
  floor: number;
}

export interface Actor {
  id: number;
  x: number;
  y: number;
  floor: number; // -1 = outside
  dir: 1 | -1;
  mode: Mode;
  path: Step[];
  speed: number;
  anim: number;
  wanderT: number;
  targetKey: string;
  homeX: number;
  roomId: number;
  celebrate: number;
  bubble: string;
  bubbleT: number;
  hearts: number;
  lastRoom: number;
  dragged: boolean;
  blinkT: number;
  lookT: number;
  lookDir: number;
  fightT: number;
  flash: number;
  seed: number;
  stepT: number;
}

export type WorkStyle = 'arms' | 'type' | 'lift' | 'run' | 'dance' | 'read' | 'jump' | 'shoot' | 'guard' | 'talk' | 'idle' | 'play' | 'carry';

const WORK: Partial<Record<RoomType, WorkStyle>> = {
  power: 'arms',
  diner: 'arms',
  water: 'arms',
  living: 'idle',
  storage: 'carry',
  medbay: 'type',
  lab: 'type',
  radio: 'talk',
  weapons: 'arms',
  outfits: 'type',
  gym: 'lift',
  armory: 'shoot',
  fitness: 'run',
  lounge: 'dance',
  classroom: 'read',
  athletics: 'jump',
  gameroom: 'play',
  reactor: 'type',
  garden: 'arms',
  purifier: 'arms',
  soda: 'type',
  dawn: 'type',
  door: 'guard',
};

export function outfitOf(g: Game, d: Dweller): OutfitDef {
  const it = itemByUid(g.s, d.outfit);
  return (it && OUTFIT_BY_ID[it.def]) || VAULT_SUIT;
}
export function weaponOf(g: Game, d: Dweller): WeaponDef | null {
  const it = itemByUid(g.s, d.weapon);
  return (it && WEAPON_BY_ID[it.def]) || null;
}

export function feetY(floor: number, x: number) {
  if (floor < 0) return outsideFeetY(x);
  return floorY(floor) + FEET_Y;
}

export class Actors {
  map = new Map<number, Actor>();
  /** after the first update, newly created actors walk in from the canyon */
  fresh = false;

  constructor(private g: Game) {}

  get(id: number) {
    return this.map.get(id);
  }

  private create(d: Dweller): Actor {
    const a: Actor = {
      id: d.id,
      x: 0,
      y: 0,
      floor: 0,
      dir: 1,
      mode: 'idle',
      path: [],
      speed: 38,
      anim: Math.random() * 10,
      wanderT: rand(1, 5),
      targetKey: '',
      homeX: 0,
      roomId: 0,
      celebrate: 0,
      bubble: '',
      bubbleT: 0,
      hearts: 0,
      lastRoom: -99,
      dragged: false,
      blinkT: rand(1, 4),
      lookT: rand(1, 4),
      lookDir: 0,
      fightT: rand(0, 1),
      flash: 0,
      seed: Math.random() * 100,
      stepT: 0,
    };
    // initial placement
    if (d.room === -1) {
      a.floor = -1;
      const idx = this.g.waiting().indexOf(d);
      a.x = this.fresh ? RAMP_X0 - 80 : -34 - Math.max(0, idx) * 17;
      a.y = outsideFeetY(a.x);
    } else if (d.exploring) {
      a.mode = 'hidden';
      a.floor = -1;
      a.x = RAMP_X0 - 120;
      a.y = outsideFeetY(a.x);
    } else {
      const r = d.room > 0 ? this.g.room(d.room) : this.g.s.rooms.find((x) => x.type === 'door');
      if (r) {
        a.floor = r.floor;
        a.x = this.slotX(r, d);
        a.y = feetY(r.floor, a.x);
        a.homeX = a.x;
        a.roomId = r.id;
        a.lastRoom = d.room;
      }
    }
    this.map.set(d.id, a);
    return a;
  }

  /** x position of a dweller's slot inside a room */
  slotX(r: Room, d: Dweller): number {
    const rx = roomX(r);
    const rw = roomW(r);
    if (r.type === 'elevator') return rx + rw / 2;
    const occ = this.g.dwellersIn(r).filter((x) => !x.child);
    const cap = Math.max(this.g.roomCap(r), occ.length, 1);
    let idx = occ.findIndex((x) => x.id === d.id);
    if (d.child) return rx + 20 + ((d.id * 37) % Math.max(10, rw - 40));
    if (idx < 0) idx = 0;
    const pad = r.type === 'door' ? 96 : 22;
    const inner = rw - pad - 20;
    return rx + pad + ((idx + 0.5) * inner) / cap;
  }

  /** true when someone is riding through this elevator cell */
  elevatorBusy(r: Room): boolean {
    const x0 = roomX(r);
    const y0 = floorY(r.floor);
    for (const a of this.map.values()) {
      if (a.mode !== 'ride') continue;
      if (a.x >= x0 && a.x <= x0 + CELL_W && a.y >= y0 - 10 && a.y <= y0 + FLOOR_H + 10) return true;
    }
    return false;
  }

  roomAtActor(a: Actor): Room | undefined {
    if (a.floor < 0) return undefined;
    return this.g.roomAt(a.floor, clamp(Math.floor(a.x / CELL_W), 0, COLS - 1));
  }

  // ---------------------------------------------------------------- pathfinding
  findPath(fromFloor: number, fromX: number, toFloor: number, toX: number): Step[] {
    const steps: Step[] = [];
    let sf = fromFloor;
    let sx = fromX;
    if (sf < 0) {
      // walk down the ramp to the door
      steps.push({ kind: 'walk', x: 12, floor: -1 });
      sf = 0;
      sx = 12;
    }
    if (toFloor < 0) {
      const inner = this.findPath(sf, sx, 0, 8);
      return [...steps, ...inner, { kind: 'walk', x: toX, floor: -1 }];
    }
    const sc = clamp(Math.floor(sx / CELL_W), 0, COLS - 1);
    const tc = clamp(Math.floor(toX / CELL_W), 0, COLS - 1);
    if (sf === toFloor) {
      // same floor: check contiguity
      let ok = true;
      const a = Math.min(sc, tc);
      const b = Math.max(sc, tc);
      for (let c = a; c <= b; c++) if (!this.g.roomAt(sf, c)) ok = false;
      if (ok) {
        steps.push({ kind: 'walk', x: toX, floor: sf });
        return steps;
      }
    }
    // BFS over cells
    const N = FLOORS * COLS;
    const prev = new Int32Array(N).fill(-1);
    const seen = new Uint8Array(N);
    const start = sf * COLS + sc;
    const goal = toFloor * COLS + tc;
    const q = [start];
    seen[start] = 1;
    while (q.length) {
      const cur = q.shift()!;
      if (cur === goal) break;
      const f = Math.floor(cur / COLS);
      const c = cur % COLS;
      const here = this.g.roomAt(f, c);
      const nbs: number[] = [];
      if (c > 0 && this.g.roomAt(f, c - 1)) nbs.push(cur - 1);
      if (c < COLS - 1 && this.g.roomAt(f, c + 1)) nbs.push(cur + 1);
      if (here && here.type === 'elevator') {
        const up = this.g.roomAt(f - 1, c);
        const dn = this.g.roomAt(f + 1, c);
        if (up && up.type === 'elevator') nbs.push(cur - COLS);
        if (dn && dn.type === 'elevator') nbs.push(cur + COLS);
      }
      for (const n of nbs) {
        if (seen[n]) continue;
        seen[n] = 1;
        prev[n] = cur;
        q.push(n);
      }
    }
    if (!seen[goal]) {
      // unreachable: teleport-ish walk
      steps.push({ kind: 'walk', x: toX, floor: toFloor });
      return steps;
    }
    const cells: number[] = [];
    for (let c = goal; c !== -1; c = prev[c]) cells.push(c);
    cells.reverse();
    let curFloor = sf;
    for (let i = 1; i < cells.length; i++) {
      const f = Math.floor(cells[i] / COLS);
      const c = cells[i] % COLS;
      if (f !== curFloor) {
        // before riding, walk to the shaft center
        const shaftX = c * CELL_W + CELL_W / 2;
        const last = steps[steps.length - 1];
        if (!last || last.kind !== 'walk' || last.floor !== curFloor || last.x !== shaftX) steps.push({ kind: 'walk', x: shaftX, floor: curFloor });
        // merge consecutive vertical moves
        let j = i;
        while (j + 1 < cells.length && cells[j + 1] % COLS === c && Math.floor(cells[j + 1] / COLS) !== Math.floor(cells[j] / COLS)) j++;
        const tf = Math.floor(cells[j] / COLS);
        steps.push({ kind: 'ride', x: shaftX, floor: tf });
        curFloor = tf;
        i = j;
      }
    }
    steps.push({ kind: 'walk', x: toX, floor: toFloor });
    return steps;
  }

  // ---------------------------------------------------------------- update
  update(dt: number) {
    const g = this.g;
    const alive = new Set<number>();
    const waiting = g.waiting();
    for (const d of g.s.dwellers) {
      alive.add(d.id);
      let a = this.map.get(d.id);
      if (!a) a = this.create(d);
      a.anim += dt;
      if (a.celebrate > 0) a.celebrate -= dt;
      if (a.bubbleT > 0) a.bubbleT -= dt;
      if (a.hearts > 0) a.hearts -= dt;
      if (a.flash > 0) a.flash -= dt;
      a.blinkT -= dt;
      if (a.blinkT < -0.12) a.blinkT = rand(2, 5);
      a.lookT -= dt;
      if (a.lookT < 0) {
        a.lookT = rand(1.5, 4);
        a.lookDir = Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1;
      }
      if (a.dragged) continue;
      this.retarget(d, a, waiting);
      this.move(d, a, dt);
    }
    for (const id of [...this.map.keys()]) if (!alive.has(id)) this.map.delete(id);
    this.fresh = true;
  }

  private retarget(d: Dweller, a: Actor, waiting: Dweller[]) {
    const g = this.g;
    let key: string;
    let tf: number;
    let tx: number;
    if (d.exploring) {
      if (a.mode === 'hidden') return;
      key = 'exit';
      tf = -1;
      tx = RAMP_X0 - 140;
    } else if (d.room === -1) {
      const idx = waiting.indexOf(d);
      key = 'wait' + idx;
      tf = -1;
      tx = -34 - idx * 17;
      if (a.mode === 'hidden') {
        a.mode = 'idle';
        a.floor = -1;
        a.x = RAMP_X0 - 60;
        a.y = outsideFeetY(a.x);
      }
    } else if (d.room > 0) {
      const r = g.room(d.room);
      if (!r) return;
      tx = this.slotX(r, d);
      key = 'room' + r.id + ':' + Math.round(tx);
      tf = r.floor;
      if (a.mode === 'hidden') this.appearOutside(a);
    } else {
      // unassigned: stay where we are unless outside
      if (a.mode === 'hidden') this.appearOutside(a);
      if (a.floor < 0 || !this.roomAtActor(a)) {
        const door = g.s.rooms.find((x) => x.type === 'door')!;
        key = 'lobby';
        tf = 0;
        tx = roomX(door) + 110 + ((d.id * 13) % 80);
      } else {
        key = a.targetKey.startsWith('free') ? a.targetKey : 'free' + (this.roomAtActor(a)?.id ?? 0);
        if (a.targetKey !== key) {
          a.targetKey = key;
          a.homeX = a.x;
          a.roomId = this.roomAtActor(a)?.id ?? 0;
        }
        return;
      }
    }
    if (a.targetKey === key) return;
    a.targetKey = key;
    a.homeX = tx;
    a.roomId = d.room > 0 ? d.room : 0;
    a.path = this.findPath(a.floor, a.x, tf, tx);
    if (a.path.length) a.mode = 'walk';
  }

  private appearOutside(a: Actor) {
    a.mode = 'idle';
    a.floor = -1;
    a.x = RAMP_X0 - 60;
    a.y = outsideFeetY(a.x);
    a.targetKey = '';
  }

  /** Place a dropped actor immediately into a room (drag & drop). */
  placeInRoom(a: Actor, r: Room, x: number) {
    a.floor = r.floor;
    a.x = clamp(x, roomX(r) + 12, roomX(r) + roomW(r) - 12);
    a.y = feetY(r.floor, a.x);
    a.path = [];
    a.mode = 'idle';
    a.targetKey = '';
  }

  private move(d: Dweller, a: Actor, dt: number) {
    const g = this.g;
    const urgent = !!(d.room > 0 && g.room(d.room)?.incident);
    const speed = urgent ? 72 : a.speed;
    if (a.mode === 'walk' || a.mode === 'ride') {
      const step = a.path[0];
      if (!step) {
        a.mode = 'idle';
        return;
      }
      if (step.kind === 'walk') {
        a.mode = 'walk';
        if (step.floor !== a.floor && !(step.floor === -1 && a.floor === 0 && a.x < 0) && !(step.floor === 0 && a.floor === -1)) {
          a.floor = step.floor;
        }
        const dx = step.x - a.x;
        const v = speed * dt;
        if (Math.abs(dx) <= v) {
          a.x = step.x;
          a.path.shift();
        } else {
          a.x += Math.sign(dx) * v;
          a.dir = dx > 0 ? 1 : -1;
        }
        // outside / inside transitions
        if (a.x < 0) a.floor = -1;
        else if (a.floor === -1 && a.x >= 0) a.floor = 0;
        a.y = feetY(a.floor, a.x);
        if (step.floor === -1 && a.path.length === 0 && d.exploring) a.mode = 'hidden';
      } else {
        a.mode = 'ride';
        a.x = step.x;
        const ty = feetY(step.floor, a.x);
        const dy = ty - a.y;
        const v = 120 * dt;
        if (Math.abs(dy) <= v) {
          a.y = ty;
          a.floor = step.floor;
          a.path.shift();
        } else {
          a.y += Math.sign(dy) * v;
          a.floor = clamp(Math.round((a.y - FEET_Y - floorY(0)) / (floorY(1) - floorY(0))), 0, FLOORS - 1);
        }
      }
      if (!a.path.length && a.mode !== 'hidden') a.mode = 'idle';
      return;
    }
    if (a.mode !== 'idle') return;
    // idle wandering near home
    a.wanderT -= dt;
    if (a.wanderT <= 0) {
      a.wanderT = rand(3, 9);
      const r = a.floor >= 0 ? this.roomAtActor(a) : undefined;
      if (r && r.type !== 'elevator') {
        const rx = roomX(r);
        const rw = roomW(r);
        const free = d.room <= 0 || d.child;
        const range = free ? rw / 2 - 16 : 14;
        const center = free ? rx + rw / 2 : a.homeX;
        const nx = clamp(center + rand(-range, range), rx + 14, rx + rw - 14);
        if (Math.abs(nx - a.x) > 4 && !(r.type === 'door' && nx < rx + 90)) {
          a.path = [{ kind: 'walk', x: nx, floor: a.floor }];
          a.mode = 'walk';
          a.speed = 20;
          return;
        }
      }
    }
    a.speed = 38;
  }

  // ---------------------------------------------------------------- poses
  pose(d: Dweller, a: Actor, t: number): { pose: Pose; ko: boolean; style: WorkStyle } {
    const g = this.g;
    const pose: Pose = { ...DEFAULT_POSE };
    pose.child = d.child;
    pose.blink = a.blinkT < 0;
    pose.lookDir = a.lookDir;
    pose.facing = a.dir;
    pose.mouth = d.happy >= 70 ? 'happy' : d.happy < 35 ? 'sad' : 'neutral';
    const r = d.room > 0 ? g.room(d.room) : undefined;
    const inRoom = r && a.mode === 'idle' && this.roomAtActor(a)?.id === r.id;
    let style: WorkStyle = 'idle';
    if (d.ko) {
      pose.eyes = 'x';
      pose.mouth = 'open';
      pose.armA = pose.armB = 0.5;
      return { pose, ko: true, style };
    }
    if (a.mode === 'walk' || a.mode === 'ride') {
      pose.view = 'side';
      if (a.mode === 'walk') {
        const fast = a.speed > 40;
        const sp = (fast ? 15 : 10) * (d.child ? 1.3 : 1);
        const ph = a.anim * sp;
        const amp = fast ? 0.7 : 0.5;
        pose.legA = Math.sin(ph) * amp;
        pose.legB = -Math.sin(ph) * amp;
        pose.kneeA = Math.max(0, Math.sin(ph + 1.9)) * (fast ? 1.2 : 0.8);
        pose.kneeB = Math.max(0, Math.sin(ph + 1.9 + Math.PI)) * (fast ? 1.2 : 0.8);
        pose.armA = -Math.sin(ph) * (fast ? 0.8 : 0.5);
        pose.armB = Math.sin(ph) * (fast ? 0.8 : 0.5);
        pose.elbowA = fast ? 1.3 : 0.35 + Math.max(0, -Math.sin(ph)) * 0.5;
        pose.elbowB = fast ? 1.3 : 0.35 + Math.max(0, Math.sin(ph)) * 0.5;
        pose.bob = Math.abs(Math.cos(ph)) * (fast ? 1.8 : 1.1);
        pose.lean = fast ? 0.08 : 0.02;
        if (fast) pose.mouth = 'open';
      } else {
        pose.armA = 0.1;
        pose.armB = -0.1;
      }
      return { pose, ko: false, style: 'idle' };
    }
    if (a.celebrate > 0) {
      const p = 1 - a.celebrate / 1.4;
      const j = Math.abs(Math.sin(p * Math.PI * 2));
      pose.bob = j * 6;
      pose.armA = pose.armB = 2.5 + Math.sin(p * 20) * 0.15;
      pose.elbowA = pose.elbowB = 0.2;
      pose.legA = pose.legB = j * 0.18;
      pose.mouth = 'grin';
      pose.eyes = 'closed';
      return { pose, ko: false, style };
    }
    // incident fighting
    if (r && r.incident && inRoom && !d.child && !d.babyAt) {
      pose.view = 'side';
      const w = weaponOf(g, d);
      pose.weapon = w;
      pose.mouth = 'open';
      pose.eyes = 'wide';
      pose.legA = 0.35;
      pose.legB = -0.3;
      pose.kneeA = 0.3;
      pose.kneeB = 0.2;
      if (r.incident.kind === 'fire') {
        // beating the flames with a hand extinguisher motion
        const ph = Math.sin(t * 9 + a.seed);
        pose.armA = 1.2 + ph * 0.4;
        pose.elbowA = 0.3;
        pose.armB = 0.9 - ph * 0.3;
        pose.bob = Math.abs(ph) * 0.8;
      } else {
        pose.aim = !!w;
        pose.flash = a.flash > 0;
        if (!w) {
          // punching
          const ph = Math.sin(t * 10 + a.seed);
          pose.armA = 1.4 + ph * 0.25;
          pose.elbowA = 0.3 - ph * 0.3;
          pose.armB = 0.9 - ph * 0.3;
          pose.elbowB = 1.6;
        }
      }
      return { pose, ko: false, style: 'shoot' };
    }
    if (d.partner && r && r.type === 'living' && inRoom) {
      const p = g.dweller(d.partner);
      if (p) {
        if (d.romance > 0.6) {
          const ph = t * 4 + (d.gender === 'f' ? Math.PI : 0);
          pose.lean = Math.sin(ph) * 0.1;
          pose.armA = 2.1 + Math.sin(ph) * 0.5;
          pose.armB = 0.6 - Math.sin(ph) * 0.3;
          pose.elbowA = 0.5;
          pose.elbowB = 1.4;
          pose.legA = Math.max(0, Math.sin(ph)) * 0.35;
          pose.legB = Math.max(0, -Math.sin(ph)) * 0.35;
          pose.bob = Math.abs(Math.sin(ph)) * 1.5;
          pose.mouth = 'grin';
          return { pose, ko: false, style: 'dance' };
        }
        pose.view = 'side';
        pose.mouth = Math.sin(t * 6 + a.seed) > 0.3 ? 'open' : 'happy';
        pose.armA = 0.5 + Math.sin(t * 2 + a.seed) * 0.4;
        pose.elbowA = 1.2;
        pose.armB = -0.1;
        return { pose, ko: false, style: 'talk' };
      }
    }
    if (inRoom && r && !d.child && g.isActive(r)) {
      style = WORK[r.type] ?? 'idle';
      if (ROOMS[r.type].category === 'train' && d.stats[ROOMS[r.type].train!] >= 10) style = 'idle';
      if (ROOMS[r.type].produce && r.ready) style = 'idle';
      const ph = t + a.seed;
      switch (style) {
        case 'arms': {
          const s1 = Math.sin(ph * 3);
          pose.armA = 0.35 + s1 * 0.35;
          pose.armB = 0.35 - s1 * 0.35;
          pose.elbowA = 1.3 + s1 * 0.5;
          pose.elbowB = 1.3 - s1 * 0.5;
          pose.bob = Math.abs(s1) * 0.5;
          pose.mouth = d.happy > 60 ? 'happy' : 'neutral';
          break;
        }
        case 'type':
          pose.armA = 0.28 + Math.sin(ph * 12) * 0.04;
          pose.armB = 0.28 - Math.sin(ph * 12) * 0.04;
          pose.elbowA = 1.75 + Math.sin(ph * 13) * 0.08;
          pose.elbowB = 1.75 - Math.sin(ph * 11) * 0.08;
          pose.lookDir = 0;
          break;
        case 'lift': {
          const c = (Math.sin(ph * 2.4) + 1) / 2;
          pose.armA = pose.armB = 0.3;
          pose.elbowA = pose.elbowB = 0.3 + c * 2.1;
          pose.hold = 'dumbbell';
          pose.mouth = c > 0.7 ? 'grin' : 'neutral';
          pose.eyes = c > 0.8 ? 'closed' : 'open';
          break;
        }
        case 'run':
          pose.view = 'side';
          pose.legA = Math.sin(ph * 13) * 0.75;
          pose.legB = -Math.sin(ph * 13) * 0.75;
          pose.kneeA = Math.max(0, Math.sin(ph * 13 + 1.9)) * 1.3;
          pose.kneeB = Math.max(0, Math.sin(ph * 13 + 1.9 + Math.PI)) * 1.3;
          pose.armA = -Math.sin(ph * 13) * 0.8;
          pose.armB = Math.sin(ph * 13) * 0.8;
          pose.elbowA = pose.elbowB = 1.4;
          pose.bob = Math.abs(Math.cos(ph * 13)) * 1.6;
          pose.lean = 0.08;
          pose.mouth = 'open';
          break;
        case 'dance':
          pose.lean = Math.sin(ph * 4) * 0.12;
          pose.armA = 2.2 + Math.sin(ph * 4) * 0.5;
          pose.armB = 0.7 - Math.sin(ph * 4) * 0.4;
          pose.elbowA = 0.4;
          pose.elbowB = 1.3;
          pose.legA = Math.max(0, Math.sin(ph * 4)) * 0.3;
          pose.legB = Math.max(0, -Math.sin(ph * 4)) * 0.3;
          pose.bob = Math.abs(Math.sin(ph * 4)) * 1.4;
          pose.mouth = 'happy';
          break;
        case 'read':
          pose.armA = pose.armB = 0.3;
          pose.elbowA = pose.elbowB = 1.9;
          pose.hold = 'book';
          pose.lookDir = 0;
          pose.bob = Math.sin(ph) * 0.2;
          break;
        case 'jump': {
          const j = Math.abs(Math.sin(ph * 5));
          pose.bob = j * 5;
          pose.armA = pose.armB = 0.3 + j * 2.3;
          pose.elbowA = pose.elbowB = 0.2;
          pose.legA = pose.legB = j * 0.3;
          break;
        }
        case 'shoot':
          pose.view = 'side';
          pose.weapon = weaponOf(g, d) ?? { id: 'x', name: { ru: '', en: '' }, dmg: [1, 1], rarity: 0, kind: 'pistol', color: '#5c6670' };
          pose.aim = true;
          pose.flash = Math.sin(ph * 5) > 0.93;
          pose.legA = 0.3;
          pose.legB = -0.25;
          break;
        case 'guard':
          pose.view = 'side';
          pose.weapon = weaponOf(g, d);
          pose.armA = 0.15;
          pose.elbowA = 0.9;
          pose.legA = 0.12;
          pose.legB = -0.12;
          break;
        case 'talk':
          pose.mouth = Math.sin(ph * 9) > 0 ? 'open' : 'happy';
          pose.armA = 0.3 + Math.sin(ph * 2) * 0.3;
          pose.elbowA = 1.5 + Math.sin(ph * 3) * 0.4;
          pose.armB = 0.12;
          break;
        case 'play':
          pose.armA = pose.armB = 0.3;
          pose.elbowA = 1.6 + Math.sin(ph * 10) * 0.12;
          pose.elbowB = 1.6 - Math.sin(ph * 9) * 0.12;
          pose.bob = Math.sin(ph * 1.3) > 0.8 ? 2 : 0;
          pose.mouth = 'grin';
          break;
        case 'carry':
          pose.armA = pose.armB = 0.25;
          pose.elbowA = pose.elbowB = 1.55;
          pose.hold = 'tray';
          break;
        default:
          pose.bob = Math.sin(ph * 2) * 0.3;
          pose.armA = 0.1 + Math.sin(ph * 0.7) * 0.03;
          pose.armB = 0.1;
      }
      return { pose, ko: false, style };
    }
    pose.bob = Math.sin(t * 2 + a.seed) * 0.3;
    if (d.room === -1) {
      const wave = Math.sin(t * 1.5 + a.seed) > 0.8;
      if (wave) {
        pose.armB = 2.5;
        pose.elbowB = 0.5 + Math.sin(t * 12) * 0.4;
        pose.mouth = 'grin';
      }
    } else if (d.child) {
      // kids bounce around playfully
      const j = Math.max(0, Math.sin(t * 3 + a.seed));
      pose.bob = j * 3;
      pose.armA = pose.armB = j * 1.4;
      pose.mouth = 'grin';
    }
    return { pose, ko: false, style };
  }
}
