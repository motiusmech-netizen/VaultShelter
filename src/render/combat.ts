/*
 * Visual combat layer (the simulation decides who wins; this makes it look like a fight).
 * - Enemies arrive with a proper entrance: raiders storm the vault door from the canyon and blast
 *   it open, mutant bugs crawl out of cracks in the floor, burrowers smash through the wall,
 *   intruders moving on run in from the neighbouring room.
 * - Dwellers square up: gunners fire real projectiles, melee fighters close in and swing.
 * - Hits flash and knock enemies back; enemies die in the sim's rhythm with their own death anims.
 * - Fires grow from a spark and dwellers spray them with extinguishers.
 */
import type { Game } from '../sim/game';
import type { Dweller, IncidentKind, Room } from '../sim/types';
import type { WeaponDef } from '../data/items';
import type { SfxName } from '../audio/audio';
import { clamp, rand } from '../core/util';
import type { Actor, Actors, CombatState } from './actors';
import { weaponOf } from './actors';
import type { Effects } from './effects';
import { drawCharacter, DEFAULT_POSE, muzzlePoint, type Pose } from './dwellerArt';
import { drawBug, drawMole, drawSpikeback, raiderSpec, type CreatureState, type RaiderSpec } from './creatures';
import { EXTINGUISHER, FISTS, isMelee, weaponProfile, type Shot, type WeaponSfx } from './weaponArt';
import { glow, rgba, type Ctx } from './gfx';
import { FEET_Y, FLOOR_H, WALL_BOTTOM, floorY, roomW, roomX } from './world';
import { RAMP_X0 } from './background';

type FoeKind = Exclude<IncidentKind, 'fire'>;
type FoeState = 'enter' | 'siege' | 'fight' | 'leave' | 'dead';
type Entrance = 'run' | 'emerge' | 'jump';

interface Foe {
  id: number;
  kind: FoeKind;
  x: number;
  y: number;
  dir: 1 | -1;
  state: FoeState;
  entrance: Entrance;
  delay: number;
  t: number;
  tx: number;
  vx: number;
  hurt: number;
  atk: number;
  cd: number;
  hitDone: boolean;
  target: number;
  seed: number;
  moving: number;
  lastHit: number;
  dead: number;
  emerge: number;
  jump: { x0: number; y0: number; x1: number; y1: number; u: number } | null;
  spec: RaiderSpec | null;
}

interface Decal {
  kind: 'crack' | 'hole' | 'scorch';
  x: number;
  y: number;
  r: number;
  seed: number;
}

interface Battle {
  roomId: number;
  kind: IncidentKind;
  foes: Foe[];
  t: number;
  siege: boolean;
  decals: Decal[];
  ending: number; // >0 while the battle winds down
  won: boolean;
  /** where the two lines meet */
  front: number;
  /** which side of the fighters the enemies are on */
  side: number;
  /** explosion flash at the breached door */
  flash: number;
}

interface Proj {
  kind: Shot;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grav: number;
  t: number;
  life: number;
  color: string;
  foe: Foe | null;
  actor: number;
  door: boolean;
  ox: number;
  oy: number;
}

interface Beam {
  kind: Shot;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  life: number;
  color: string;
  seed: number;
}

const FOE_H: Record<FoeKind, number> = { bugs: 8, moles: 10, raiders: 26, spikes: 18 };
const FOE_SPEED: Record<FoeKind, number> = { bugs: 46, moles: 40, raiders: 34, spikes: 30 };
const FOE_REACH: Record<FoeKind, number> = { bugs: 13, moles: 14, raiders: 14, spikes: 22 };
const FOE_RATE: Record<FoeKind, number> = { bugs: 1.05, moles: 0.95, raiders: 0.8, spikes: 0.6 };
/** spacing between enemies standing in line */
const FOE_GAP: Record<FoeKind, number> = { bugs: 16, moles: 22, raiders: 17, spikes: 34 };
const SPEED: Partial<Record<Shot, number>> = { bullet: 640, pellets: 560, nail: 520, pebble: 300, bolt: 470, harpoon: 440, plasma: 360, flare: 380, rocket: 180, sonic: 250 };
const SFX: Record<WeaponSfx, SfxName> = {
  pistol: 'gun_pistol',
  rifle: 'gun_rifle',
  shotgun: 'gun_shotgun',
  smg: 'gun_smg',
  laser: 'gun_laser',
  plasma: 'gun_plasma',
  gauss: 'gun_gauss',
  tesla: 'gun_tesla',
  flame: 'gun_flame',
  rocket: 'gun_rocket',
  swing: 'swing',
  twang: 'gun_twang',
  nail: 'gun_nail',
  guitar: 'gun_guitar',
  flare: 'gun_flare',
  cryo: 'gun_cryo',
  foam: 'foam',
};

let nextId = 1;

export class Combat {
  battles = new Map<number, Battle>();
  shots: Proj[] = [];
  beams: Beam[] = [];
  private clock = 0;
  private burstQ: { t: number; fire: () => void }[] = [];
  onSound: (name: SfxName, x: number, y: number) => void = () => {};
  onShake: (amount: number) => void = () => {};

  constructor(
    private g: Game,
    private actors: Actors,
    private fx: Effects,
  ) {}

  /** Growth of a fire for drawing (0 when it just sparked, 1 when fully ablaze). */
  fireGrowth(roomId: number) {
    const b = this.battles.get(roomId);
    return b ? clamp(b.t / 2.2, 0.12, 1) : 1;
  }

  // ---------------------------------------------------------------- update
  update(dt: number) {
    this.clock += dt;
    const g = this.g;
    // start battles for new incidents
    for (const r of g.s.rooms) {
      const inc = r.incident;
      const b = this.battles.get(r.id);
      if (inc && (!b || b.kind !== inc.kind || b.ending > 0)) {
        if (b) this.finish(b, r, false);
        this.start(r);
      }
    }
    // update or wind down
    for (const b of [...this.battles.values()]) {
      const r = g.room(b.roomId);
      if (!r) {
        this.battles.delete(b.roomId);
        continue;
      }
      if ((!r.incident || r.incident.kind !== b.kind) && b.ending <= 0) this.finish(b, r, !r.incident);
      this.step(b, r, dt);
      if (b.ending > 0) {
        b.ending += dt;
        if (b.ending > 3 && b.foes.every((f) => f.state === 'dead' && f.dead >= 1)) this.battles.delete(b.roomId);
      }
    }
    // queued burst shots
    for (const q of this.burstQ) q.t -= dt;
    const ready = this.burstQ.filter((q) => q.t <= 0);
    this.burstQ = this.burstQ.filter((q) => q.t > 0);
    for (const q of ready) q.fire();
    this.updateShots(dt);
  }

  private start(r: Room) {
    const inc = r.incident!;
    const b: Battle = { roomId: r.id, kind: inc.kind, foes: [], t: 0, siege: false, decals: [], ending: 0, won: false, front: NaN, side: 1, flash: 0 };
    this.battles.set(r.id, b);
    const x0 = roomX(r);
    const w = roomW(r);
    const fy = floorY(r.floor) + FEET_Y;
    if (inc.kind === 'fire') {
      const x = x0 + w * rand(0.3, 0.7);
      this.fx.emit('spark', x, fy - 6, 14);
      this.fx.emit('ember', x, fy - 4, 8);
      this.onSound('ignite', x, fy);
      b.decals.push({ kind: 'scorch', x, y: fy, r: w * 0.4, seed: Math.random() * 100 });
      return;
    }
    const kind = inc.kind as FoeKind;
    const n = Math.min(6, Math.max(1, inc.count));
    const mk = (i: number, x: number, entrance: Entrance, tx: number, delay: number): Foe => ({
      id: nextId++,
      kind,
      x,
      y: fy,
      dir: tx >= x ? 1 : -1,
      state: 'enter',
      entrance,
      delay,
      t: 0,
      tx,
      vx: 0,
      hurt: 0,
      atk: -1,
      cd: rand(0.4, 1.4),
      hitDone: false,
      target: 0,
      seed: Math.random() * 100 + i,
      moving: 0,
      lastHit: -9,
      dead: 0,
      emerge: entrance === 'emerge' ? 0 : 1,
      jump: null,
      spec: kind === 'raiders' ? raiderSpec(Math.random() * 1000) : null,
    });
    const visited = inc.visited;
    const moved = visited.length > 1;
    if (r.type === 'door' && !moved && (kind === 'raiders' || kind === 'spikes')) {
      // storm the vault door from the canyon
      b.siege = kind === 'raiders' && r.doorHp > 0;
      for (let i = 0; i < n; i++) {
        const f = mk(i, RAMP_X0 + 40 - i * 26, 'run', b.siege ? -34 - i * 22 : x0 + 70 + i * 26, i * 0.45);
        f.y = floorY(0) + FEET_Y;
        b.foes.push(f);
      }
      this.onSound('alarm', x0 + 40, fy);
      return;
    }
    if (kind === 'bugs') {
      // cracks open in the floor and the bugs crawl out
      const cracks = Math.min(2, Math.ceil(n / 3));
      const cx: number[] = [];
      for (let c = 0; c < cracks; c++) {
        const x = x0 + w * (cracks === 1 ? rand(0.45, 0.7) : c === 0 ? rand(0.3, 0.45) : rand(0.6, 0.78));
        cx.push(x);
        b.decals.push({ kind: 'crack', x, y: fy + 1, r: 9, seed: Math.random() * 100 });
      }
      for (let i = 0; i < n; i++) {
        const x = cx[i % cx.length] + rand(-5, 5);
        b.foes.push(mk(i, x, 'emerge', x + rand(-18, 18), 0.25 + i * 0.35));
      }
      return;
    }
    if (kind === 'moles') {
      // burrowers smash through the back wall near the outer edge
      const leftOpen = !this.g.roomAt(r.floor, r.col - 1);
      const hx = leftOpen ? x0 + 30 : x0 + w - 30;
      const hy = floorY(r.floor) + WALL_BOTTOM - 26;
      b.decals.push({ kind: 'hole', x: hx, y: hy, r: 14, seed: Math.random() * 100 });
      for (let i = 0; i < n; i++) {
        const f = mk(i, hx, 'jump', hx + (leftOpen ? 1 : -1) * rand(16, 44), 0.5 + i * 0.4);
        b.foes.push(f);
      }
      return;
    }
    // raiders / spikebacks walking in from the previous room
    let side = -1;
    if (moved) {
      const prev = this.g.room(visited[visited.length - 2]);
      if (prev) side = roomX(prev) + roomW(prev) / 2 < x0 + w / 2 ? -1 : 1;
    }
    for (let i = 0; i < n; i++) {
      const sx = side < 0 ? x0 - 10 - i * 18 : x0 + w + 10 + i * 18;
      const tx = side < 0 ? x0 + 30 + i * 22 : x0 + w - 30 - i * 22;
      b.foes.push(mk(i, sx, 'run', tx, i * 0.3));
    }
  }

  /** The incident is over here: foes die (victory) or run off to the next room. */
  private finish(b: Battle, r: Room, victory: boolean) {
    b.ending = 0.001;
    b.won = victory;
    let exit = 0;
    if (!victory) {
      // find where the intruders went
      for (const o of this.g.s.rooms) {
        if (o.incident && o.incident.kind === b.kind && o.incident.visited.includes(r.id) && o.id !== r.id) {
          exit = roomX(o) + roomW(o) / 2 < roomX(r) + roomW(r) / 2 ? -1 : 1;
        }
      }
    }
    let i = 0;
    for (const f of b.foes) {
      if (f.state === 'dead') continue;
      if (exit !== 0 && b.kind !== 'bugs' && b.kind !== 'moles') {
        f.state = 'leave';
        f.tx = exit < 0 ? roomX(r) - 40 : roomX(r) + roomW(r) + 40;
        f.t = 0;
      } else {
        this.kill(f, i++ * 0.18);
      }
    }
    // the fighters cheer and go back to their stations
    for (const a of this.actors.map.values()) {
      if (a.cmb && a.cmb.room === r.id) {
        if (victory && b.kind !== 'fire') a.celebrate = 1.4;
        a.cmb = null;
        a.targetKey = '';
      }
    }
  }

  private kill(f: Foe, delay = 0) {
    f.state = 'dead';
    f.t = -delay;
    f.dead = 0;
    f.atk = -1;
  }

  private step(b: Battle, r: Room, dt: number) {
    const g = this.g;
    b.t += dt;
    b.flash = Math.max(0, b.flash - dt * 1.6);
    const x0 = roomX(r) + 12;
    const x1 = roomX(r) + roomW(r) - 12;
    const fy = floorY(r.floor) + FEET_Y;
    const inc = r.incident && r.incident.kind === b.kind ? r.incident : null;
    // fighters present in the room
    const fighters: { d: Dweller; a: Actor }[] = [];
    if (inc && b.ending <= 0) {
      for (const d of g.dwellersIn(r)) {
        if (d.child || d.ko || d.babyAt || d.exploring) continue;
        const a = this.actors.get(d.id);
        if (!a || a.mode !== 'idle' || a.dragged || a.floor !== r.floor || a.x < roomX(r) || a.x > roomX(r) + roomW(r)) continue;
        if (!a.cmb || a.cmb.room !== r.id) {
          const gear = b.kind === 'fire' ? EXTINGUISHER : weaponOf(g, d) ?? FISTS;
          a.cmb = { room: r.id, gear, atk: -1, cd: rand(0.1, 0.6), moving: false, hurt: 0, target: 0, hitDone: false };
        }
        fighters.push({ d, a });
      }
      // dwellers who died or left drop their combat state
      for (const a of this.actors.map.values()) {
        if (a.cmb && a.cmb.room === r.id && !fighters.some((p) => p.a === a)) {
          a.cmb = null;
          a.targetKey = '';
        }
      }
    }
    for (const { a } of fighters) {
      const c = a.cmb!;
      c.hurt = Math.max(0, c.hurt - dt * 4);
    }
    if (b.kind === 'fire') {
      this.stepFire(b, r, fighters, dt, fy);
      return;
    }
    // how many enemies should still stand
    if (inc && b.ending <= 0) {
      const alive = b.foes.filter((f) => f.state !== 'dead' && f.state !== 'leave');
      const want = inc.hp > 0 ? Math.max(1, Math.ceil(Math.min(6, inc.count) * (inc.hp / inc.maxHp))) : 0;
      if (alive.length > want && b.t > 1.5) {
        const fighting = alive.filter((f) => f.state === 'fight');
        const pick = (fighting.length ? fighting : alive).sort((p, q) => q.lastHit - p.lastHit)[0];
        this.kill(pick);
        this.deathFx(pick);
      }
    }
    // door siege: breach when the door gives in
    if (b.siege && r.doorHp <= 0) {
      b.siege = false;
      const bx = 8;
      const by = fy - 34;
      for (let i = 0; i < 26; i++) this.fx.emit('smoke', bx + rand(-10, 30), by + rand(-16, 16), 1, { size: rand(6, 12), max: rand(1.6, 2.8), vx: rand(10, 50), vy: rand(-20, 6) });
      for (let i = 0; i < 22; i++) this.fx.emit('flame', bx + rand(-4, 18), by + rand(-14, 14), 1, { vx: rand(20, 120), vy: rand(-60, 30), size: rand(4, 8), max: rand(0.3, 0.6) });
      this.fx.emit('spark', bx, by, 40);
      this.fx.emit('debris', bx, by, 22, { color: '#6d7680', floor: fy });
      this.fx.emit('ring', bx, by, 1, { size: 60, color: '#ffcf8a' });
      b.flash = 1;
      this.onSound('boom', bx, by);
      this.onShake(7);
      let i = 0;
      for (const f of b.foes) {
        if (f.state === 'dead') continue;
        f.state = 'enter';
        f.entrance = 'run';
        f.tx = roomX(r) + 70 + i * 26;
        f.delay = i++ * 0.25;
        f.t = 0;
      }
    }
    // two lines facing each other: work out where they meet
    const engaged = b.foes.filter((f) => f.state === 'fight');
    if (engaged.length && fighters.length) {
      const fx = engaged.reduce((s2, f) => s2 + f.x, 0) / engaged.length;
      const dx = fighters.reduce((s2, p) => s2 + p.a.x, 0) / fighters.length;
      if (Number.isNaN(b.front)) b.side = fx >= dx ? 1 : -1;
      const dFront = b.side > 0 ? Math.max(...fighters.map((p) => p.a.x)) : Math.min(...fighters.map((p) => p.a.x));
      const fFront = b.side > 0 ? Math.min(...engaged.map((f) => f.x)) : Math.max(...engaged.map((f) => f.x));
      // leave room for the whole enemy line and the fighters behind the front
      const k0 = engaged[0].kind;
      const foeDepth = FOE_REACH[k0] * 0.45 + (engaged.length - 1) * FOE_GAP[k0] + 8;
      const ownDepth = 14 + (fighters.length - 1) * 16;
      const lo = b.side > 0 ? x0 + ownDepth : x0 + foeDepth;
      const hi = b.side > 0 ? x1 - foeDepth : x1 - ownDepth;
      const want = lo <= hi ? clamp((dFront + fFront) / 2, lo, hi) : (x0 + x1) / 2;
      b.front = Number.isNaN(b.front) ? want : b.front + (want - b.front) * Math.min(1, dt * 1.5);
    } else b.front = NaN;
    // rank the enemies from the front line backwards
    engaged.sort((p, q) => b.side * (p.x - q.x));
    engaged.forEach((f, i) => ((f as Foe & { rank: number }).rank = i));
    // update enemies
    for (const f of b.foes) this.stepFoe(b, r, f, fighters, dt, x0, x1, fy);
    // dwellers fight back: melee in front, gunners behind
    const order = fighters.slice().sort((p, q) => {
      const mp = isMelee(p.a.cmb!.gear) ? 0 : 1;
      const mq = isMelee(q.a.cmb!.gear) ? 0 : 1;
      return mp - mq || b.side * (q.a.x - p.a.x);
    });
    order.forEach((p, i) => this.stepFighter(b, r, p.d, p.a, engaged, dt, x0, x1, i));
    // keep units from stacking
    this.separate(fighters.map((p) => p.a), engaged, x0, x1);
    b.foes = b.foes.filter((f) => !(f.state === 'dead' && f.dead >= 1) && !(f.state === 'leave' && f.t > 3));
  }

  private stepFoe(b: Battle, r: Room, f: Foe, fighters: { d: Dweller; a: Actor }[], dt: number, x0: number, x1: number, fy: number) {
    f.hurt = Math.max(0, f.hurt - dt * 5);
    f.x += f.vx * dt;
    f.vx *= Math.pow(0.02, dt);
    if (f.state === 'dead') {
      f.t += dt;
      if (f.t > 0) f.dead = Math.min(1, f.dead + dt / 1.3);
      return;
    }
    if (f.delay > 0) {
      f.delay -= dt;
      return;
    }
    f.t += dt;
    f.moving = 0;
    if (f.atk >= 0) {
      f.atk += dt / 0.6;
      if (f.atk >= 1) f.atk = -1;
    }
    switch (f.state) {
      case 'enter': {
        if (f.entrance === 'emerge') {
          if (f.emerge === 0) {
            this.fx.emit('dust', f.x, fy, 5);
            this.fx.emit('debris', f.x, fy - 1, 4, { color: '#5a5048', floor: fy + 2 });
            this.onSound('burrow', f.x, fy);
          }
          f.emerge = Math.min(1, f.emerge + dt / 0.7);
          if (f.emerge >= 1) this.walkTo(f, f.tx, dt, 0.7) && this.enterFight(f);
          else f.moving = 0.4;
          break;
        }
        if (f.entrance === 'jump') {
          if (!f.jump) {
            const hole = b.decals.find((d) => d.kind === 'hole');
            const hx = hole ? hole.x : f.x;
            const hy = hole ? hole.y + 8 : fy - 30;
            f.jump = { x0: hx, y0: hy, x1: f.tx, y1: fy, u: 0 };
            this.fx.emit('debris', hx, hy - 6, 10, { color: '#6b5a48', floor: fy });
            this.fx.emit('dust', hx, hy, 8);
            this.onSound('burrow', hx, hy);
            if (b.foes.indexOf(f) === 0) this.onShake(3);
          }
          const j = f.jump;
          j.u = Math.min(1, j.u + dt / 0.6);
          f.x = j.x0 + (j.x1 - j.x0) * j.u;
          f.y = j.y0 + (j.y1 - j.y0) * j.u - Math.sin(j.u * Math.PI) * 18;
          f.dir = j.x1 >= j.x0 ? 1 : -1;
          if (j.u >= 1) {
            f.y = fy;
            f.jump = null;
            this.fx.emit('dust', f.x, fy, 4);
            this.enterFight(f);
          }
          break;
        }
        // running in (down the canyon at full tilt)
        const sp = f.x < -60 ? 2.2 : b.siege || r.type === 'door' ? 1.4 : 1.1;
        if (f.x < 16 && f.tx > 16 && !b.siege) this.actors.holdDoor();
        if (this.walkTo(f, f.tx, dt, sp)) {
          if (b.siege) {
            f.state = 'siege';
            f.dir = 1;
          } else this.enterFight(f);
        }
        break;
      }
      case 'siege': {
        // pound the door: ranged raiders shoot at it, the rest bash it
        f.dir = 1;
        const w = f.spec?.weapon;
        const melee = !w || isMelee(w);
        if (melee && f.x < -14) {
          this.walkTo(f, -14 - (b.foes.indexOf(f) % 3) * 6, dt, 1);
          break;
        }
        f.cd -= dt;
        if (f.cd <= 0 && f.atk < 0) {
          f.atk = 0;
          f.hitDone = false;
          f.cd = rand(0.9, 1.6);
          if (!melee && w) this.fire(w, f.x, f.y, 1, 8, fy - 32 + rand(-10, 10), null, 0, true, false);
        }
        if (melee && f.atk >= 0.5 && !f.hitDone) {
          f.hitDone = true;
          this.doorHit(fy);
        }
        break;
      }
      case 'leave': {
        f.dir = f.tx > f.x ? 1 : -1;
        this.walkTo(f, f.tx, dt, 1.3);
        break;
      }
      case 'fight': {
        const tg = this.nearestActor(f.x, fighters);
        if (!tg) {
          // nobody to fight: prowl around
          const wander = (x0 + x1) / 2 + Math.sin(this.clock * 0.6 + f.seed) * (x1 - x0) * 0.35;
          this.walkTo(f, wander, dt, 0.5);
          break;
        }
        f.target = tg.id;
        const dist = Math.abs(tg.x - f.x);
        const w = f.spec?.weapon ?? null;
        const ranged = !!w && !isMelee(w);
        const reach = ranged ? 110 : FOE_REACH[f.kind];
        const rank = (f as Foe & { rank?: number }).rank ?? 0;
        if (!Number.isNaN(b.front)) {
          // hold a place in the enemy line
          const slot = ranged ? b.front + b.side * (48 + rank * 16) : b.front + b.side * (reach * 0.45 + rank * FOE_GAP[f.kind]);
          if (Math.abs(slot - f.x) > 2) this.walkTo(f, clamp(slot, x0, x1), dt, 1);
        } else if (dist > reach) this.walkTo(f, tg.x - (tg.x >= f.x ? 1 : -1) * (reach - 2), dt, 1);
        f.dir = tg.x >= f.x ? 1 : -1;
        f.x = clamp(f.x, x0, x1);
        f.cd -= dt;
        if (dist <= reach + 4 && f.cd <= 0 && f.atk < 0) {
          f.atk = 0;
          f.hitDone = false;
          const rate = w ? weaponProfile(w).rate * 0.6 : FOE_RATE[f.kind];
          f.cd = (1 / rate) * rand(0.9, 1.3);
          if (ranged && w) this.fire(w, f.x, f.y, f.dir, tg.x, tg.y - 24, null, tg.id, false, false);
        }
        if (!ranged && f.atk >= 0.5 && !f.hitDone) {
          f.hitDone = true;
          if (dist <= reach + 8) this.hitActor(tg, f.dir, f.kind === 'spikes' ? 2 : 1);
          if (f.kind === 'spikes') this.onShake(1.5);
        }
        break;
      }
    }
  }

  private enterFight(f: Foe) {
    f.state = 'fight';
    f.t = 0;
    f.cd = rand(0.3, 1);
  }

  /** Move a foe towards x; returns true on arrival. */
  private walkTo(f: Foe, x: number, dt: number, k: number) {
    const dx = x - f.x;
    const v = FOE_SPEED[f.kind] * k * dt;
    if (Math.abs(dx) <= v) {
      f.x = x;
      return true;
    }
    f.x += Math.sign(dx) * v;
    f.dir = dx > 0 ? 1 : -1;
    f.moving = k;
    return false;
  }

  private nearestActor(x: number, fighters: { a: Actor }[]): Actor | null {
    let best: Actor | null = null;
    for (const { a } of fighters) if (!best || Math.abs(a.x - x) < Math.abs(best.x - x)) best = a;
    return best;
  }

  private stepFighter(b: Battle, r: Room, d: Dweller, a: Actor, foes: Foe[], dt: number, x0: number, x1: number, rank = 0) {
    const c = a.cmb!;
    c.moving = false;
    if (c.atk >= 0) {
      const melee = isMelee(c.gear);
      c.atk += dt / (melee ? 0.55 : 0.5);
      if (c.atk >= 1) c.atk = -1;
    }
    // pick an enemy: melee fighters spread over the front ranks, gunners take the closest
    const melee = isMelee(c.gear);
    let tg: Foe | null = null;
    if (foes.length) tg = melee ? foes[Math.min(rank, foes.length - 1)] : foes[0];
    if (!tg) {
      // door guards face the door during a siege
      if (b.siege) a.dir = -1;
      return;
    }
    c.target = tg.id;
    const prof = weaponProfile(c.gear);
    const reach = melee ? (prof.grip === 'melee2' ? 17 : 14) + FOE_REACH[tg.kind] * 0.25 : 160;
    const speed = 62 * dt;
    let want = a.x;
    if (!Number.isNaN(b.front)) {
      if (melee) want = tg.x - b.side * (reach - 3);
      else {
        // gunners hold a line behind the melee fighters
        const back = b.front - b.side * (34 + rank * 15);
        want = b.side * (a.x - back) > 0 ? back : a.x;
      }
    }
    want = clamp(want, x0, x1);
    if (Math.abs(want - a.x) > 1.5) {
      a.x += Math.sign(want - a.x) * Math.min(speed, Math.abs(want - a.x));
      c.moving = Math.abs(want - a.x) > 1.5;
    }
    a.dir = tg.x >= a.x ? 1 : -1;
    const dist = Math.abs(tg.x - a.x);
    c.cd -= dt;
    if (!c.moving && dist <= reach + 3 && c.cd <= 0 && c.atk < 0) {
      c.atk = 0;
      c.hitDone = false;
      c.cd = (1 / prof.rate) * rand(0.9, 1.25);
      if (!melee) {
        const m = muzzlePoint(c.gear, d.child);
        this.fire(c.gear, a.x + m[0] * a.dir, a.y + m[1], a.dir, tg.x, tg.y - FOE_H[tg.kind] * 0.55, tg, 0, false, true);
      } else this.onSound('swing', a.x, a.y);
    }
    if (melee && c.atk >= 0.5 && !c.hitDone) {
      c.hitDone = true;
      if (dist <= reach + 8) this.hitFoe(tg, a.dir, a.x + a.dir * 12, a.y - 20, prof.grip === 'melee2' ? 2 : 1);
    }
    void r;
  }

  private separate(as: Actor[], foes: Foe[], x0: number, x1: number) {
    const push = (arr: { x: number }[], gap: number) => {
      arr.sort((p, q) => p.x - q.x);
      for (let i = 1; i < arr.length; i++) {
        const d = arr[i].x - arr[i - 1].x;
        if (d < gap) {
          const k = (gap - d) * 0.5;
          arr[i - 1].x = clamp(arr[i - 1].x - k, x0, x1);
          arr[i].x = clamp(arr[i].x + k, x0, x1);
        }
      }
    };
    push(as, 16);
    if (foes.length) push(foes, FOE_GAP[foes[0].kind] * 0.8);
  }

  // ---------------------------------------------------------------- fire
  private stepFire(b: Battle, r: Room, fighters: { d: Dweller; a: Actor }[], dt: number, fy: number) {
    const x0 = roomX(r) + 14;
    const w = roomW(r) - 28;
    const inc = r.incident;
    const k = inc ? clamp(inc.hp / inc.maxHp, 0.15, 1) * this.fireGrowth(r.id) : 0;
    // embers and smoke rising from the blaze
    if (Math.random() < dt * 14 * k) this.fx.emit('ember', x0 + Math.random() * w, fy - 10, 1);
    if (Math.random() < dt * 5 * k) this.fx.emit('smoke', x0 + Math.random() * w, fy - 40, 1);
    for (const { a } of fighters) {
      const c = a.cmb!;
      const cx = x0 + w / 2;
      a.dir = cx >= a.x ? 1 : -1;
      // spray foam at the nearest flames
      c.atk = (c.atk < 0 ? 0 : c.atk + dt * 1.5) % 1;
      if (Math.random() < dt * 18) {
        const m = muzzlePoint(EXTINGUISHER, false);
        const mx = a.x + m[0] * a.dir;
        const my = a.y + m[1];
        this.fx.emit('foam', mx, my, 1, { vx: a.dir * rand(70, 110), vy: rand(-10, 18), max: rand(0.5, 0.8), size: rand(1.5, 2.6) });
        if (Math.random() < 0.3) this.fx.emit('steam', mx + a.dir * rand(30, 50), fy - rand(6, 20), 1);
      }
      if (Math.random() < dt * 0.6 * k) this.hitActor(a, -a.dir, 0.5);
      if (Math.random() < dt * 4) this.onSound('foam', a.x, a.y);
    }
    if (b.ending > 0) {
      // the fire dies down in a puff of steam
      if (b.ending < 0.2) this.fx.emit('steam', x0 + w / 2, fy - 16, 12);
    }
  }

  // ---------------------------------------------------------------- hits
  private hitFoe(f: Foe, dir: number, x: number, y: number, power: number) {
    if (f.state === 'dead') return;
    f.hurt = 1;
    f.lastHit = this.clock;
    const push = f.kind === 'spikes' ? 18 : f.kind === 'raiders' ? 34 : 60;
    f.vx += dir * push * power;
    if (f.kind === 'bugs') this.fx.emit('goo', x, y, 4, { color: '#8adf3a', floor: f.y });
    else this.fx.emit('spark', x, y, 5);
    this.onSound('impact', x, y);
  }

  private hitActor(a: Actor, dir: number, power: number) {
    if (!a.cmb) return;
    a.cmb.hurt = 1;
    a.x += dir * 2 * power;
    this.fx.emit('spark', a.x, a.y - 22, 3, { color: '#ff7a6a' });
    this.onSound('hit', a.x, a.y);
  }

  private doorHit(fy: number) {
    const x = 6;
    const y = fy - 32 + rand(-12, 12);
    this.fx.emit('spark', x, y, 6);
    this.fx.emit('dust', x, y, 1);
    this.onSound('door_hit', x, y);
    this.onShake(0.8);
  }

  private deathFx(f: Foe) {
    const h = FOE_H[f.kind];
    const y = f.y - h * 0.5;
    switch (f.kind) {
      case 'bugs':
        this.fx.emit('goo', f.x, y, 10, { color: '#8adf3a', floor: f.y });
        this.onSound('splat', f.x, y);
        break;
      case 'moles':
        this.fx.emit('dust', f.x, f.y - 4, 6);
        this.onSound('splat', f.x, y);
        break;
      case 'spikes':
        this.fx.emit('dust', f.x, f.y - 2, 12);
        this.onShake(3);
        this.onSound('boom', f.x, y);
        break;
      default:
        this.fx.emit('dust', f.x, f.y - 2, 5);
    }
  }

  // ---------------------------------------------------------------- shots
  private fire(w: WeaponDef, x: number, y: number, dir: number, tx: number, ty: number, foe: Foe | null, actor: number, door: boolean, byDweller: boolean) {
    const p = weaponProfile(w);
    const color = w.glow ?? (p.shot === 'bullet' || p.shot === 'pellets' ? '#ffe08a' : '#ffffff');
    this.onSound(SFX[p.sfx] ?? 'gun_pistol', x, y);
    const one = (dy = 0, delay = 0) => {
      const go = () => {
        const tgx = foe ? foe.x : tx;
        const tgy = (foe ? foe.y - FOE_H[foe.kind] * 0.55 : ty) + dy;
        this.spawn(p.shot, x, y, tgx, tgy, color, foe, actor, door);
      };
      if (delay > 0) this.burstQ.push({ t: delay, fire: go });
      else go();
    };
    if (p.shot === 'pellets') for (let i = 0; i < p.burst; i++) one(rand(-7, 7));
    else for (let i = 0; i < p.burst; i++) one(rand(-2, 2), i * 0.09);
    // brass flying out of firearms
    if (p.shot === 'bullet' || p.shot === 'pellets') this.fx.emit('shell', x - dir * 10, y, 1, { vx: -dir * rand(20, 40), floor: y + 24 });
    if (p.shot === 'flame') {
      for (let i = 0; i < 6; i++) this.fx.emit('flame', x, y, 1, { vx: dir * rand(120, 170), vy: rand(-18, 6), max: rand(0.35, 0.55), size: rand(2, 4) });
      if (foe) this.burstQ.push({ t: 0.3, fire: () => this.hitFoe(foe, dir, foe.x, foe.y - 6, 0.6) });
    }
    if (p.shot === 'foam') for (let i = 0; i < 4; i++) this.fx.emit('foam', x, y, 1, { vx: dir * rand(70, 110), vy: rand(-10, 18) });
    void byDweller;
  }

  private spawn(kind: Shot, x: number, y: number, tx: number, ty: number, color: string, foe: Foe | null, actor: number, door: boolean) {
    if (kind === 'flame' || kind === 'foam' || kind === 'melee') return;
    if (kind === 'laser' || kind === 'cryo' || kind === 'gauss' || kind === 'tesla') {
      this.beams.push({ kind, x0: x, y0: y, x1: tx, y1: ty, t: 0, life: kind === 'gauss' ? 0.22 : kind === 'tesla' ? 0.2 : 0.14, color, seed: Math.random() * 100 });
      this.impact(kind, tx, ty, foe, actor, door, color);
      return;
    }
    const sp = SPEED[kind] ?? 500;
    const dx = tx - x;
    const dy = ty - y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const T = d / sp;
    const grav = kind === 'pebble' ? 260 : kind === 'bolt' || kind === 'harpoon' ? 90 : 0;
    this.shots.push({
      kind,
      x,
      y,
      vx: dx / T,
      vy: dy / T - (grav * T) / 2,
      grav,
      t: 0,
      life: T,
      color,
      foe,
      actor,
      door,
      ox: x,
      oy: y,
    });
  }

  private impact(kind: Shot, x: number, y: number, foe: Foe | null, actor: number, door: boolean, color: string) {
    if (door) {
      this.fx.emit('spark', x, y, 5);
      this.onSound('door_hit', x, y);
      return;
    }
    switch (kind) {
      case 'rocket':
        for (const c of ['#ffcf4a', '#ff5a7a', '#5fb8ff', '#6aff8c']) this.fx.emit('confetti', x, y, 5, { color: c });
        this.fx.emit('spark', x, y, 24);
        this.fx.emit('smoke', x, y, 8);
        this.fx.emit('ring', x, y, 1, { size: 26, color: '#ffe08a' });
        this.onSound('boom', x, y);
        this.onShake(4);
        break;
      case 'plasma':
        this.fx.emit('ring', x, y, 1, { size: 12, color });
        this.fx.emit('spark', x, y, 6, { color });
        break;
      case 'cryo':
        this.fx.emit('frost', x, y, 10);
        break;
      case 'flare':
        this.fx.emit('ember', x, y, 12);
        this.fx.emit('smoke', x, y, 2);
        break;
      case 'sonic':
        this.fx.emit('ring', x, y, 1, { size: 14, color: '#ffcf4a' });
        this.fx.emit('note', x, y - 6, 2);
        break;
      case 'tesla':
        this.fx.emit('spark', x, y, 8, { color: '#bfe8ff' });
        break;
      default:
        this.fx.emit('spark', x, y, 4);
    }
    if (foe) this.hitFoe(foe, foe.x >= x - 1 ? 1 : -1, x, y, kind === 'rocket' ? 2.5 : kind === 'pellets' ? 0.5 : 1);
    if (actor) {
      const a = this.actors.get(actor);
      if (a) this.hitActor(a, a.x >= x ? 1 : -1, 1);
    }
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      s.t += dt;
      s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'rocket' && Math.random() < 0.8) this.fx.emit('smoke', s.x - Math.sign(s.vx) * 4, s.y, 1, { size: rand(1.5, 3), max: rand(0.5, 0.9) });
      if (s.kind === 'flare' && Math.random() < 0.6) this.fx.emit('smoke', s.x, s.y, 1, { size: rand(1, 2) });
      if (s.t >= s.life) this.impact(s.kind, s.x, s.y, s.foe && s.foe.state !== 'dead' ? s.foe : null, s.actor, s.door, s.color);
    }
    this.shots = this.shots.filter((s) => s.t < s.life);
    for (const b of this.beams) b.t += dt;
    this.beams = this.beams.filter((b) => b.t < b.life);
  }

  // ---------------------------------------------------------------- drawing
  /** Wall holes, floor cracks and scorch marks (drawn with the room, under characters). */
  drawDecals(ctx: Ctx, v: { l: number; r: number; t: number; b: number }) {
    for (const b of this.battles.values()) {
      const fade = b.ending > 0 ? clamp(1 - (b.ending - 2) / 1.5, 0, 1) : 1;
      if (fade <= 0) continue;
      for (const d of b.decals) {
        if (d.x < v.l - 40 || d.x > v.r + 40 || d.y < v.t - 40 || d.y > v.b + 40) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        if (d.kind === 'hole') drawHole(ctx, d, Math.min(1, b.t * 5));
        else if (d.kind === 'crack') drawCrack(ctx, d, Math.min(1, b.t * 3));
        else drawScorch(ctx, d, this.fireGrowth(b.roomId));
        ctx.restore();
      }
    }
  }

  /** Enemies (before dwellers so fighters overlap them naturally). */
  drawFoes(ctx: Ctx, v: { l: number; r: number; t: number; b: number }, t: number, lod: boolean) {
    for (const b of this.battles.values()) {
      for (const f of b.foes) {
        if (f.delay > 0 && f.state === 'enter') continue;
        if (f.x < v.l - 40 || f.x > v.r + 40 || f.y < v.t - 40 || f.y > v.b + 60) continue;
        let alpha = f.state === 'dead' ? (f.dead > 0.65 ? 1 - (f.dead - 0.65) / 0.35 : 1) : 1;
        if (f.state === 'leave') alpha = clamp(1 - (f.t - 1.5) / 1, 0, 1);
        if (alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(f.x, f.y);
        // shadow
        if (!f.jump) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.ellipse(0, 0, f.kind === 'spikes' ? 16 : f.kind === 'raiders' ? 8 : 10, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (f.entrance === 'emerge' && f.emerge < 1) {
          // crawling up out of the crack: clipped at floor level
          ctx.beginPath();
          ctx.rect(-40, -40, 80, 41.5);
          ctx.clip();
          ctx.translate(0, (1 - f.emerge) * 12);
          ctx.rotate(-(1 - f.emerge) * 0.6 * f.dir);
        }
        ctx.scale(f.dir, 1);
        if (lod) {
          ctx.fillStyle = f.kind === 'bugs' ? '#6a3418' : f.kind === 'moles' ? '#c49484' : f.kind === 'spikes' ? '#5a6a40' : '#5a3a2a';
          ctx.fillRect(-8, -FOE_H[f.kind], 16, FOE_H[f.kind]);
        } else if (f.kind === 'raiders' && f.spec) this.drawRaider(ctx, f, t);
        else {
          const st: CreatureState = { t: t + f.seed, seed: f.seed, move: f.moving, atk: f.atk >= 0 ? f.atk : undefined, hurt: f.hurt, dead: f.state === 'dead' ? f.dead : 0 };
          if (f.kind === 'bugs') drawBug(ctx, st);
          else if (f.kind === 'moles') {
            ctx.scale(1.05, 1.05);
            drawMole(ctx, st);
          } else drawSpikeback(ctx, st);
        }
        ctx.restore();
      }
    }
  }

  private drawRaider(ctx: Ctx, f: Foe, t: number) {
    const sp = f.spec!;
    const pose: Pose = { ...DEFAULT_POSE, view: 'side', weapon: sp.weapon, aim: f.state === 'fight' || f.state === 'siege', mouth: 'grin', eyes: 'open' };
    if (f.atk >= 0) pose.attack = f.atk;
    if (f.moving > 0) {
      const ph = (t + f.seed) * 14;
      pose.legA = Math.sin(ph) * 0.7;
      pose.legB = -Math.sin(ph) * 0.7;
      pose.kneeA = Math.max(0, Math.sin(ph + 1.9)) * 1.2;
      pose.kneeB = Math.max(0, Math.sin(ph + 1.9 + Math.PI)) * 1.2;
      pose.bob = Math.abs(Math.cos(ph)) * 1.6;
      pose.lean = 0.08;
      pose.aim = false;
      pose.mouth = 'open';
    } else {
      pose.legA = 0.32;
      pose.legB = -0.28;
      pose.kneeA = 0.3;
      pose.kneeB = 0.2;
    }
    if (f.hurt > 0.3) {
      pose.lean = -0.12;
      pose.eyes = 'closed';
      pose.mouth = 'open';
    }
    if (f.state === 'dead') {
      // topples backwards
      const u = Math.min(1, Math.max(0, f.dead) * 2.4);
      ctx.rotate(-u * Math.PI * 0.5);
      pose.eyes = 'x';
      pose.mouth = 'open';
      pose.aim = false;
      pose.attack = undefined;
    }
    drawCharacter(ctx, sp.look, sp.outfit, pose, sp.gender);
  }

  /** Projectiles and beams (over everything in the world). */
  drawShots(ctx: Ctx, t: number) {
    // fireball of the door breach
    for (const bt of this.battles.values()) {
      if (bt.flash <= 0.25) continue;
      const r = this.g.room(bt.roomId);
      if (!r) continue;
      const fy = floorY(r.floor) + FEET_Y;
      const k = (bt.flash - 0.25) / 0.75;
      const rad = 16 + (1 - k) * 26;
      const gr = ctx.createRadialGradient(16, fy - 34, 0, 16, fy - 34, rad);
      gr.addColorStop(0, `rgba(255,250,220,${0.95 * k})`);
      gr.addColorStop(0.35, `rgba(255,190,70,${0.85 * k})`);
      gr.addColorStop(0.75, `rgba(230,90,30,${0.5 * k})`);
      gr.addColorStop(1, 'rgba(120,40,20,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(16, fy - 34, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.shots) {
      const ang = Math.atan2(s.vy, s.vx);
      switch (s.kind) {
        case 'bullet':
        case 'pellets':
        case 'nail': {
          const len = s.kind === 'nail' ? 5 : 11;
          ctx.strokeStyle = rgba(s.kind === 'nail' ? '#dfe5ea' : s.color, 0.95);
          ctx.lineWidth = s.kind === 'pellets' ? 0.7 : 1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - Math.cos(ang) * len, s.y - Math.sin(ang) * len);
          ctx.stroke();
          glow(ctx, s.x, s.y, 3, s.color, 0.5);
          break;
        }
        case 'plasma':
          glow(ctx, s.x, s.y, 6, s.color, 0.8);
          glow(ctx, s.x - s.vx * 0.02, s.y - s.vy * 0.02, 4, s.color, 0.4);
          ctx.fillStyle = '#eaffef';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'flare':
          glow(ctx, s.x, s.y, 7, '#ff5a3a', 0.85);
          ctx.fillStyle = '#fff0d8';
          ctx.fillRect(s.x - 0.8, s.y - 0.8, 1.6, 1.6);
          break;
        case 'sonic':
          ctx.strokeStyle = rgba('#ffcf4a', 0.8 * (1 - s.t / s.life) + 0.2);
          ctx.lineWidth = 0.9;
          for (let i = 0; i < 3; i++) {
            const r = 3 + i * 3 + (s.t * 30) % 3;
            ctx.beginPath();
            ctx.arc(s.x - Math.cos(ang) * i * 3, s.y - Math.sin(ang) * i * 3, r, ang - 0.7, ang + 0.7);
            ctx.stroke();
          }
          break;
        default:
          break;
      }
    }
    ctx.restore();
    // solid projectiles
    for (const s of this.shots) {
      const ang = Math.atan2(s.vy, s.vx);
      if (s.kind === 'pebble') {
        ctx.fillStyle = '#8a8478';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'bolt' || s.kind === 'harpoon' || s.kind === 'rocket') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(ang);
        if (s.kind === 'rocket') {
          ctx.fillStyle = '#2f6b4a';
          ctx.fillRect(-8, -1.6, 8, 3.2);
          ctx.fillStyle = '#e84a3c';
          ctx.beginPath();
          ctx.moveTo(0, -1.6);
          ctx.lineTo(3.6, 0);
          ctx.lineTo(0, 1.6);
          ctx.fill();
          ctx.fillStyle = '#ffcf4a';
          ctx.fillRect(-9, -2.4, 2, 4.8);
          ctx.globalCompositeOperation = 'lighter';
          glow(ctx, -10, 0, 5 + Math.sin(t * 50) * 1, '#ffb040', 0.9);
        } else {
          ctx.fillStyle = s.kind === 'harpoon' ? '#c9d2d9' : '#c9a24a';
          ctx.fillRect(-9, -0.35, 9, 0.7);
          ctx.fillStyle = '#dfe5ea';
          ctx.beginPath();
          ctx.moveTo(0, -1);
          ctx.lineTo(2.4, 0);
          ctx.lineTo(0, 1);
          ctx.fill();
          ctx.fillStyle = '#c0453a';
          ctx.fillRect(-9, -1, 2, 2);
        }
        ctx.restore();
        if (s.kind === 'harpoon') {
          ctx.strokeStyle = 'rgba(200,183,138,0.8)';
          ctx.lineWidth = 0.35;
          ctx.beginPath();
          ctx.moveTo(s.ox, s.oy);
          ctx.quadraticCurveTo((s.ox + s.x) / 2, (s.oy + s.y) / 2 + 6, s.x, s.y);
          ctx.stroke();
        }
      }
    }
    // beams
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const bt of this.battles.values()) {
      if (bt.flash <= 0) continue;
      const r = this.g.room(bt.roomId);
      if (!r) continue;
      const fy = floorY(r.floor) + FEET_Y;
      glow(ctx, 14, fy - 34, 110 * bt.flash + 20, '#ffb060', 0.8 * bt.flash);
      glow(ctx, 14, fy - 34, 40, '#ffffff', 0.9 * bt.flash * bt.flash);
    }
    for (const b of this.beams) {
      const k = 1 - b.t / b.life;
      if (b.kind === 'tesla') {
        let seed = Math.floor(t * 40) + b.seed;
        const rnd = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed % 1000) / 1000;
        };
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass ? rgba('#ffffff', 0.9 * k) : rgba(b.color, 0.7 * k);
          ctx.lineWidth = pass ? 0.5 : 1.8;
          ctx.beginPath();
          ctx.moveTo(b.x0, b.y0);
          const n = 8;
          for (let i = 1; i < n; i++) {
            const u = i / n;
            ctx.lineTo(b.x0 + (b.x1 - b.x0) * u + (rnd() - 0.5) * 3, b.y0 + (b.y1 - b.y0) * u + (rnd() - 0.5) * 9);
          }
          ctx.lineTo(b.x1, b.y1);
          ctx.stroke();
        }
      } else {
        const wdt = b.kind === 'gauss' ? 2.6 : b.kind === 'cryo' ? 2 : 1.4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = rgba(b.color, 0.55 * k);
        ctx.lineWidth = wdt * 2.2;
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.lineTo(b.x1, b.y1);
        ctx.stroke();
        ctx.strokeStyle = rgba('#ffffff', 0.9 * k);
        ctx.lineWidth = wdt * 0.5;
        ctx.stroke();
        if (b.kind === 'gauss') {
          ctx.strokeStyle = rgba(b.color, 0.6 * k);
          ctx.lineWidth = 0.5;
          const n = 5;
          for (let i = 1; i < n; i++) {
            const u = i / n;
            ctx.beginPath();
            ctx.ellipse(b.x0 + (b.x1 - b.x0) * u, b.y0 + (b.y1 - b.y0) * u, 1.2, 3.6 * k + 1, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        glow(ctx, b.x1, b.y1, 6, b.color, 0.6 * k);
      }
    }
    ctx.restore();
  }

  /** HP overlay data for fighters (screen overlay drawn by the renderer). */
  inBattle(roomId: number) {
    const b = this.battles.get(roomId);
    return !!b && b.ending <= 0;
  }
}

export type { CombatState };

// ---------------------------------------------------------------- decals
function srnd(seed: number) {
  let s = Math.floor(seed * 1000) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s % 10000) / 10000;
  };
}

function drawHole(ctx: Ctx, d: Decal, k: number) {
  const rnd = srnd(d.seed);
  const r = d.r * k;
  // jagged hole in the back wall with rubble below
  ctx.beginPath();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.75 + rnd() * 0.45);
    ctx.lineTo(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr * 0.85);
  }
  ctx.closePath();
  ctx.fillStyle = '#6b5a48';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.55 + rnd() * 0.3);
    ctx.lineTo(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr * 0.85);
  }
  ctx.closePath();
  ctx.fillStyle = '#1a120c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2;
    ctx.moveTo(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.85);
    ctx.lineTo(d.x + Math.cos(a) * (r + 4 + rnd() * 6), d.y + Math.sin(a) * (r + 4 + rnd() * 6) * 0.85);
  }
  ctx.stroke();
  // rubble pile on the floor
  const fy = d.y + FLOOR_H * 0 + 26 + 8;
  ctx.fillStyle = '#5a4a3a';
  for (let i = 0; i < 7; i++) {
    const x = d.x + (rnd() - 0.5) * 26;
    const s2 = 1.5 + rnd() * 3;
    ctx.beginPath();
    ctx.ellipse(x, fy - s2 * 0.4, s2, s2 * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrack(ctx: Ctx, d: Decal, k: number) {
  const rnd = srnd(d.seed);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(d.x, d.y, d.r * 1.2 * k, 2.2 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,8,6,0.85)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const dir = rnd() < 0.5 ? -1 : 1;
    let x = d.x + (rnd() - 0.5) * 4;
    let y = d.y;
    ctx.moveTo(x, y);
    for (let s = 0; s < 3; s++) {
      x += dir * (2 + rnd() * 4) * k;
      y += (rnd() - 0.5) * 2.4;
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.fillStyle = '#4a4038';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(d.x + (rnd() - 0.5) * 18 * k, d.y - 1 - rnd() * 1.5, 1.4, 1);
  }
}

function drawScorch(ctx: Ctx, d: Decal, k: number) {
  const g = ctx.createRadialGradient(d.x, d.y - 20, 2, d.x, d.y - 20, d.r);
  g.addColorStop(0, `rgba(20,12,8,${0.45 * k})`);
  g.addColorStop(1, 'rgba(20,12,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(d.x - d.r, d.y - 20 - d.r, d.r * 2, d.r * 2);
}
