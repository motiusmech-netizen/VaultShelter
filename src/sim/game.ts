import { L, getLang, type Loc } from '../i18n';
import { ROOMS, LIVING_CAP, LVL_RATE, LVL_STORE, MERGE_BONUS, type RoomType } from '../data/rooms';
import { JUNK_BY_ID, OUTFIT_BY_ID, PET_BY_ID, WEAPON_BY_ID, outfitSellValue, weaponSellValue, type Rarity } from '../data/items';
import { S_CHA, S_END, S_LUC, STAT_COUNT, S_AGI, S_PER, S_STR } from '../data/stats';
import { DAWN_STAGES, type DawnReq } from '../data/dawn';
import { RECIPE_BY_ID } from '../data/recipes';
import { MISSION_BY_ID, type MissionDef } from '../data/missions';
import { CHATTER } from '../data/wasteland';
import { Emitter, chance, clamp, mulberry32, pick, rand, randi } from '../core/util';
import {
  applyLevels, areRelated, baseDweller, bestStats, childFrom, dwellerName, effMaxHp, makeLegend, petBonus, randomStats, statTotal, weaponDamage, xpNeeded, MAX_LEVEL,
} from './dwellers';
import { recallExpedition, startExpedition, tickExpedition, randomItemDef, rollRarity } from './explore';
import { randomIncident, rushIncidentKind, startIncident, tickIncidents } from './incidents';
import { makeObjective, objectiveProgress } from './objectives';
import { rollCrate, type Card } from './crates';
import {
  COLS, FLOORS, RES_KEYS, type Dweller, type Expedition, type GameState, type IncidentKind, type Item, type MissionRun, type Objective, type ResKey, type Reward, type Rock, type Room,
} from './types';

export const SAVE_VERSION = 3;
export const BABY_TIME = 150;
export const GROW_TIME = 180;
export const OFFLINE_CAP = 8 * 3600;
const FOOD_PER = 0.011;
const WATER_PER = 0.011;
const POWER_PER_CELL = 0.0052;
export const TUTORIAL_DONE = 100;

export type ToastKind = 'info' | 'good' | 'bad' | 'great';

export interface GameEvents {
  toast: { text: string; kind: ToastKind; icon?: string };
  collect: { room: Room; items: { kind: string; amount: number }[]; bonus: number; auto: boolean };
  build_start: { room: Room };
  built: { room: Room };
  upgraded: { room: Room };
  destroyed: { room: Room };
  merged: { room: Room };
  levelup: { d: Dweller };
  statup: { d: Dweller; stat: number };
  arrive: { d: Dweller };
  admitted: { d: Dweller };
  baby: { d: Dweller; mom: Dweller };
  grown: { d: Dweller };
  incident: { room: Room; kind: IncidentKind };
  incident_end: { room: Room; kind: IncidentKind; reward: number };
  ko: { d: Dweller };
  revived: { d: Dweller };
  rush: { room: Room; ok: boolean; bonus: number };
  explore_start: { d: Dweller };
  explorer_home: { e: Expedition; d: Dweller };
  cat: { room: Room | null };
  cat_caught: { room: Room; nuts: number };
  objective_ready: { o: Objective };
  crate_opened: { cards: Card[] };
  dawn_stage: { stage: number };
  power: { on: boolean };
  rock_cleared: { rock: Rock; text: string | null };
  craft_done: { room: Room };
  assign: { d: Dweller; room: Room | null };
  equip: { d: Dweller };
  robot_collect: { robot: number; room: Room };
  heal: { d: Dweller };
  pregnant: { mom: Dweller; dad: Dweller };
  chatter: { d: Dweller; text: string };
  mission_arrived: { m: MissionRun };
  mission_home: { m: MissionRun };
  res_change: {};
}

export class Game {
  s: GameState;
  ev = new Emitter<GameEvents>();
  grid = new Int32Array(FLOORS * COLS);
  rockGrid = new Int32Array(FLOORS * COLS);
  rmap = new Map<number, Room>();
  dmap = new Map<number, Dweller>();
  byRoom = new Map<number, Dweller[]>();
  powerOrder: number[] = [];
  powerT = 0;
  blackout = false;
  starving = false;
  thirsty = false;
  radioBonus = 0;
  randomT = 240;
  catT = 200;
  catRoom: Room | null = null;
  catUntil = 0;
  arrivalT = 120;
  objT = 0;
  chatterT = 6;
  robotT = 0;
  live = true;
  /** runtime: counters of the latest offline simulation */
  offlineReport: OfflineReport | null = null;

  constructor(state: GameState) {
    this.s = state;
    this.reindex();
  }

  emit<K extends keyof GameEvents>(k: K, p: GameEvents[K]) {
    if (!this.live && (k === 'toast' || k === 'chatter')) return;
    this.ev.emit(k, p);
  }

  // ------------------------------------------------------------------ setup
  static newState(vault: number): GameState {
    const s: GameState = {
      v: SAVE_VERSION,
      vault,
      created: Date.now(),
      realLast: Date.now(),
      time: 0,
      res: { power: 42, food: 38, water: 38 },
      nuts: 600,
      iso: 5,
      medkits: 2,
      antirads: 1,
      dawnCharge: 0,
      rooms: [],
      dwellers: [],
      items: [],
      expeditions: [],
      objectives: [],
      robots: [],
      rocks: [],
      missions: [],
      missionCd: {},
      counters: {},
      nextId: 1,
      crates: 0,
      tutorial: 0,
      flags: {},
      daily: { day: -1, last: '' },
      adCd: {},
      dawn: { stage: 0, donated: {} },
      settings: { sfx: 0.8, music: 0.5, lang: '', quality: 1 },
      objSkipDay: '',
    };
    const g = new Game(s);
    const door = g.placeRoom('door', 0, 0, 1);
    door.doorHp = g.doorMaxHp(door);
    g.placeRoom('elevator', 0, 3, 1);
    g.placeRoom('elevator', 1, 3, 1);
    g.generateRocks(vault);
    // starting dwellers wait at the gate with distinct talents
    const talents = [S_STR, S_AGI, S_PER, S_STR, S_AGI, S_PER];
    talents.forEach((st, i) => {
      const d = baseDweller(g.uid(), i % 2 === 0 ? 'm' : 'f', 0);
      d.stats = randomStats(randi(12, 15), 3);
      d.stats[st] = randi(4, 6);
      d.happy = 70;
      d.room = -1;
      g.addDweller(d);
    });
    g.s.items.push({ uid: g.uid(), def: 'w_wrench', kind: 'weapon' });
    g.s.items.push({ uid: g.uid(), def: 'o_work', kind: 'outfit' });
    g.s.items.push({ uid: g.uid(), def: 'j_tape', kind: 'junk' });
    g.fillObjectives();
    return s;
  }

  generateRocks(seed: number) {
    const rnd = mulberry32(seed * 7919 + 13);
    for (let f = 3; f < FLOORS; f++) {
      const clusters = f < 7 ? (rnd() < 0.7 ? 1 : 0) : f < 14 ? 1 + (rnd() < 0.5 ? 1 : 0) : 2 + (rnd() < 0.5 ? 1 : 0);
      for (let k = 0; k < clusters; k++) {
        const w = 2 + Math.floor(rnd() * 3);
        const col = 1 + Math.floor(rnd() * (COLS - w - 1));
        let ok = true;
        for (let c = col - 1; c < col + w + 1; c++) if (c >= 0 && c < COLS && (this.rockGrid[f * COLS + c] || this.grid[f * COLS + c])) ok = false;
        if (!ok) continue;
        const rock: Rock = { id: this.uid(), floor: f, col, w, clearing: 0, treasure: rnd() < 0.35 ? 1 : 0 };
        this.s.rocks.push(rock);
        for (let c = col; c < col + w; c++) this.rockGrid[f * COLS + c] = rock.id;
      }
    }
  }

  reindex() {
    this.grid.fill(0);
    this.rockGrid.fill(0);
    this.rmap.clear();
    for (const r of this.s.rooms) {
      this.rmap.set(r.id, r);
      const cells = this.roomCells(r);
      for (let c = r.col; c < r.col + cells; c++) this.grid[r.floor * COLS + c] = r.id;
    }
    for (const rk of this.s.rocks) for (let c = rk.col; c < rk.col + rk.w; c++) this.rockGrid[rk.floor * COLS + c] = rk.id;
    this.dmap.clear();
    for (const d of this.s.dwellers) this.dmap.set(d.id, d);
    this.refreshByRoom();
    this.computePowerOrder();
  }

  refreshByRoom() {
    this.byRoom.clear();
    for (const d of this.s.dwellers) {
      if (d.exploring || d.room <= 0) continue;
      let arr = this.byRoom.get(d.room);
      if (!arr) this.byRoom.set(d.room, (arr = []));
      arr.push(d);
    }
  }

  uid() {
    return this.s.nextId++;
  }

  // ------------------------------------------------------------------ queries
  roomCells(r: Room) {
    return ROOMS[r.type].cells * r.size;
  }
  roomAt(floor: number, col: number): Room | undefined {
    if (floor < 0 || floor >= FLOORS || col < 0 || col >= COLS) return undefined;
    const id = this.grid[floor * COLS + col];
    return id ? this.rmap.get(id) : undefined;
  }
  rockAt(floor: number, col: number): Rock | undefined {
    if (floor < 0 || floor >= FLOORS || col < 0 || col >= COLS) return undefined;
    const id = this.rockGrid[floor * COLS + col];
    return id ? this.s.rocks.find((r) => r.id === id) : undefined;
  }
  room(id: number) {
    return this.rmap.get(id);
  }
  dweller(id: number) {
    return this.dmap.get(id);
  }
  dwellersIn(room: Room): Dweller[] {
    return this.byRoom.get(room.id) ?? [];
  }
  workers(room: Room): Dweller[] {
    return this.dwellersIn(room).filter((d) => !d.child && !d.ko);
  }
  population() {
    let n = 0;
    for (const d of this.s.dwellers) if (d.room !== -1) n++;
    return n;
  }
  waiting() {
    return this.s.dwellers.filter((d) => d.room === -1);
  }
  capacity() {
    let cap = 10;
    for (const r of this.s.rooms) if (r.type === 'living' && r.buildLeft <= 0) cap += LIVING_CAP[r.level - 1] * r.size;
    return Math.min(200, cap);
  }
  expecting() {
    return this.s.dwellers.filter((d) => d.babyAt > 0).length;
  }
  maxPopReached() {
    return Math.max(this.s.counters.maxPop ?? 0, this.population());
  }
  isUnlocked(t: RoomType) {
    return this.maxPopReached() >= ROOMS[t].unlockPop;
  }
  countType(t: RoomType) {
    let n = 0;
    for (const r of this.s.rooms) if (r.type === t) n += r.size;
    return n;
  }
  roomsOfType(t: RoomType) {
    return this.s.rooms.filter((r) => r.type === t);
  }
  buildCost(t: RoomType, floor = 0) {
    const def = ROOMS[t];
    if (t === 'elevator') return def.cost + floor * 6;
    return def.cost + def.costStep * this.countType(t);
  }
  upgradeCost(r: Room) {
    if (r.type === 'door') return [400, 1200][r.level - 1] ?? 0;
    const def = ROOMS[r.type];
    const mult = [2.5, 7][r.level - 1] ?? 0;
    const sz = [1, 1.8, 2.5][r.size - 1];
    return Math.round((Math.max(def.cost, 100) * mult * sz) / 5) * 5;
  }
  resCap(k: ResKey) {
    let cap = 50;
    for (const r of this.s.rooms) {
      if (r.buildLeft > 0) continue;
      const p = ROOMS[r.type].produce;
      const mult = r.size * r.level;
      if (p === k) cap += (r.type === 'power' || r.type === 'diner' || r.type === 'water' ? 50 : 100) * mult;
      if (p === 'foodwater' && k !== 'power') cap += 60 * mult;
      if (r.type === 'storage') cap += 25 * mult;
    }
    return cap;
  }
  medCap() {
    let cap = 5;
    for (const r of this.s.rooms) if (r.type === 'medbay' && r.buildLeft <= 0) cap += 5 * r.size * r.level;
    return cap;
  }
  antiradCap() {
    let cap = 5;
    for (const r of this.s.rooms) if (r.type === 'lab' && r.buildLeft <= 0) cap += 5 * r.size * r.level;
    return cap;
  }
  storageCap() {
    let cap = 12;
    for (const r of this.s.rooms) if (r.type === 'storage' && r.buildLeft <= 0) cap += 10 * r.size * r.level;
    return cap;
  }
  equippedUids(): Set<number> {
    const set = new Set<number>();
    for (const d of this.s.dwellers) {
      if (d.weapon) set.add(d.weapon);
      if (d.outfit) set.add(d.outfit);
      if (d.pet) set.add(d.pet);
    }
    return set;
  }
  storedItems(): Item[] {
    const eq = this.equippedUids();
    return this.s.items.filter((i) => !eq.has(i.uid));
  }
  storageUsed() {
    return this.storedItems().length;
  }
  happiness() {
    const ds = this.s.dwellers.filter((d) => d.room !== -1);
    if (!ds.length) return 0;
    return ds.reduce((a, d) => a + d.happy, 0) / ds.length;
  }
  doorMaxHp(r: Room) {
    return [140, 300, 520][r.level - 1];
  }
  robotsOnFloor(floor: number) {
    return this.s.robots.filter((r) => r.floor === floor);
  }
  itemName(it: Item): string {
    const def = WEAPON_BY_ID[it.def] ?? OUTFIT_BY_ID[it.def] ?? JUNK_BY_ID[it.def] ?? PET_BY_ID[it.def];
    return def ? L(def.name) : it.def;
  }
  itemRarity(it: Item): Rarity {
    if (it.kind === 'pet') return (it.r ?? 0) as Rarity;
    const def = WEAPON_BY_ID[it.def] ?? OUTFIT_BY_ID[it.def] ?? JUNK_BY_ID[it.def];
    return (def?.rarity ?? 0) as Rarity;
  }
  itemValue(it: Item): number {
    if (it.kind === 'weapon') return weaponSellValue(WEAPON_BY_ID[it.def]);
    if (it.kind === 'outfit') return outfitSellValue(OUTFIT_BY_ID[it.def]);
    if (it.kind === 'junk') return JUNK_BY_ID[it.def]?.value ?? 1;
    return [25, 80, 250][it.r ?? 0];
  }
  perfectAssignments() {
    let n = 0;
    for (const d of this.s.dwellers) {
      if (d.room <= 0 || d.child || d.exploring) continue;
      const r = this.room(d.room);
      if (!r) continue;
      const st = ROOMS[r.type].stat;
      if (st >= 0 && ROOMS[r.type].category !== 'train' && bestStats(this.s, d)[0] === st) n++;
      else if (st >= 0 && statTotal(this.s, d, st) === statTotal(this.s, d, bestStats(this.s, d)[0])) n++;
    }
    return n;
  }
  rating() {
    let score = this.population() * 12 + Math.round(this.happiness() * 2);
    for (const r of this.s.rooms) score += r.size * r.level * 6;
    for (const d of this.s.dwellers) score += d.level * 2;
    score += this.s.dawn.stage * 400;
    return score;
  }

  roomRate(r: Room): number {
    const def = ROOMS[r.type];
    if (!def.produce || def.stat < 0) return 0;
    let sum = 0;
    let happy = 0;
    const ws = this.workers(r);
    for (const d of ws) {
      sum += statTotal(this.s, d, def.stat) * (1 + petBonus(this.s, d, 'prod') / 100);
      happy += d.happy;
    }
    if (!ws.length) return 0;
    happy /= ws.length;
    const hm = 0.75 + 0.5 * (happy / 100);
    return sum * def.rate * LVL_RATE[r.level - 1] * MERGE_BONUS[r.size - 1] * hm;
  }
  roomStore(r: Room): number {
    const def = ROOMS[r.type];
    if (def.produce === 'medkit' || def.produce === 'antirad' || def.produce === 'radio' || def.produce === 'dawn') return r.size + (def.produce === 'dawn' ? r.level - 1 : 0);
    return def.store * r.size * LVL_STORE[r.level - 1];
  }
  roomTimeLeft(r: Room): number {
    const rate = this.roomRate(r);
    if (rate <= 0) return Infinity;
    return (this.roomStore(r) - r.prog) / rate;
  }
  isActive(r: Room) {
    return r.buildLeft <= 0 && (r.powered || !this.needsPower(r)) && !r.incident;
  }
  needsPower(r: Room) {
    return !(r.type === 'power' || r.type === 'reactor' || r.type === 'door' || r.type === 'elevator');
  }
  rushRisk(r: Room): number {
    const def = ROOMS[r.type];
    const ws = this.workers(r);
    if (!ws.length) return 1;
    let st = 0;
    let lk = 0;
    for (const d of ws) {
      st += statTotal(this.s, d, Math.max(0, def.stat));
      lk += statTotal(this.s, d, S_LUC);
    }
    st /= ws.length;
    lk /= ws.length;
    return clamp(0.3 + 0.13 * r.rush - st * 0.02 - lk * 0.012, 0.05, 0.95);
  }
  canRush(r: Room) {
    const def = ROOMS[r.type];
    return !!def.produce && r.buildLeft <= 0 && !r.ready && !r.incident && this.workers(r).length > 0 && this.isActive(r);
  }
  trainTime(stat: number, room: Room) {
    return 50 * Math.pow(stat + 1, 1.35) * (1 - 0.1 * (room.level - 1));
  }

  // ------------------------------------------------------------------ building
  placeRoom(type: RoomType, floor: number, col: number, size: number, level = 1): Room {
    const r: Room = {
      id: this.uid(),
      type,
      floor,
      col,
      size,
      level,
      prog: 0,
      ready: false,
      rush: 0,
      buildLeft: 0,
      buildTotal: 0,
      craft: null,
      incident: null,
      powered: true,
      doorHp: 0,
    };
    this.s.rooms.push(r);
    this.reindex();
    return r;
  }

  cellFree(floor: number, col: number) {
    if (floor < 0 || floor >= FLOORS || col < 0 || col >= COLS) return false;
    return !this.grid[floor * COLS + col] && !this.rockGrid[floor * COLS + col];
  }

  canPlace(type: RoomType, floor: number, col: number): boolean {
    const cells = ROOMS[type].cells;
    for (let c = col; c < col + cells; c++) if (!this.cellFree(floor, c)) return false;
    const left = this.roomAt(floor, col - 1);
    const right = this.roomAt(floor, col + cells);
    if (type === 'elevator') {
      const up = this.roomAt(floor - 1, col);
      const dn = this.roomAt(floor + 1, col);
      if ((up && up.type === 'elevator') || (dn && dn.type === 'elevator')) return true;
      return !!(left || right);
    }
    return !!(left || right);
  }

  buildSpots(type: RoomType): { floor: number; col: number }[] {
    const out: { floor: number; col: number }[] = [];
    const cells = ROOMS[type].cells;
    for (let f = 0; f < FLOORS; f++) {
      for (let c = 0; c + cells <= COLS; c++) {
        if (this.canPlace(type, f, c)) {
          // For 3-wide rooms only offer spots flush against a neighbour to keep the grid tidy
          if (cells > 1) {
            const left = this.roomAt(f, c - 1);
            const right = this.roomAt(f, c + cells);
            if (!left && !right) continue;
          }
          out.push({ floor: f, col: c });
        }
      }
    }
    // dedupe overlapping 3-wide spots: prefer spots adjacent on the left, then right
    if (cells > 1) {
      const taken = new Set<number>();
      const filtered: { floor: number; col: number }[] = [];
      const sorted = out.sort((a, b) => a.floor - b.floor || a.col - b.col);
      for (const sp of sorted) {
        const leftAdj = !!this.roomAt(sp.floor, sp.col - 1);
        const rightAdj = !!this.roomAt(sp.floor, sp.col + cells);
        let overlaps = false;
        for (let c = sp.col; c < sp.col + cells; c++) if (taken.has(sp.floor * COLS + c)) overlaps = true;
        if (overlaps) continue;
        if (!leftAdj && !rightAdj) continue;
        filtered.push(sp);
        for (let c = sp.col; c < sp.col + cells; c++) taken.add(sp.floor * COLS + c);
      }
      return filtered;
    }
    return out;
  }

  canAffordBuild(type: RoomType, floor: number) {
    return this.s.nuts >= this.buildCost(type, floor);
  }

  canBuildType(type: RoomType): { ok: boolean; reason?: string } {
    const def = ROOMS[type];
    if (!def.buildable) return { ok: false };
    if (!this.isUnlocked(type)) return { ok: false, reason: 'locked' };
    if (def.maxCount && this.roomsOfType(type).length >= def.maxCount) return { ok: false, reason: 'max' };
    return { ok: true };
  }

  build(type: RoomType, floor: number, col: number, instant = false): Room | null {
    if (!this.canBuildType(type).ok) return null;
    if (!this.canPlace(type, floor, col)) return null;
    const cost = this.buildCost(type, floor);
    if (this.s.nuts < cost) return null;
    this.s.nuts -= cost;
    const r = this.placeRoom(type, floor, col, 1);
    const def = ROOMS[type];
    r.buildTotal = instant ? 0 : type === 'elevator' ? 2.5 : clamp(3 + def.cost / 400, 3.5, 12);
    r.buildLeft = r.buildTotal;
    r.powered = true;
    this.s.counters.built = (this.s.counters.built ?? 0) + 1;
    this.emit('build_start', { room: r });
    if (r.buildLeft <= 0) this.finishBuild(r);
    return r;
  }

  finishBuild(r: Room) {
    r.buildLeft = 0;
    this.emit('built', { room: r });
    this.tryMerge(r);
    this.computePowerOrder();
  }

  tryMerge(r: Room) {
    const def = ROOMS[r.type];
    if (!def.mergeable) return;
    let changed = true;
    let cur = r;
    while (changed) {
      changed = false;
      const cells = this.roomCells(cur);
      const left = this.roomAt(cur.floor, cur.col - 1);
      const right = this.roomAt(cur.floor, cur.col + cells);
      for (const nb of [left, right]) {
        if (!nb || nb.type !== cur.type || nb.level !== cur.level || nb.buildLeft > 0 || cur.buildLeft > 0) continue;
        if (nb.size + cur.size > 3) continue;
        if (nb.incident || cur.incident) continue;
        // merge nb into cur
        const keep = nb.col < cur.col ? nb : cur;
        const drop = keep === nb ? cur : nb;
        keep.size += drop.size;
        keep.prog = Math.min(keep.prog + drop.prog, this.roomStore(keep));
        keep.ready = keep.ready || drop.ready;
        keep.craft = keep.craft ?? drop.craft;
        for (const d of this.s.dwellers) if (d.room === drop.id) d.room = keep.id;
        this.s.rooms = this.s.rooms.filter((x) => x !== drop);
        this.reindex();
        cur = keep;
        changed = true;
        this.emit('merged', { room: keep });
        break;
      }
    }
  }

  upgrade(r: Room): boolean {
    const def = ROOMS[r.type];
    if (r.level >= def.maxLevel || r.buildLeft > 0 || r.incident) return false;
    const cost = this.upgradeCost(r);
    if (this.s.nuts < cost) return false;
    this.s.nuts -= cost;
    r.level++;
    if (r.type === 'door') r.doorHp = this.doorMaxHp(r);
    r.buildTotal = 2.2;
    r.buildLeft = 2.2;
    this.s.counters.upgraded = (this.s.counters.upgraded ?? 0) + 1;
    this.emit('upgraded', { room: r });
    return true;
  }

  canDestroy(r: Room): boolean {
    if (r.type === 'door') return false;
    if (this.dwellersIn(r).length) return false;
    if (r.incident) return false;
    // connectivity check
    const others = this.s.rooms.filter((x) => x !== r);
    const door = others.find((x) => x.type === 'door');
    if (!door) return false;
    const idSet = new Set(others.map((x) => x.id));
    const visited = new Set<number>([door.id]);
    const q = [door];
    while (q.length) {
      const cur = q.pop()!;
      const cells = this.roomCells(cur);
      const nbs: (Room | undefined)[] = [this.roomAt(cur.floor, cur.col - 1), this.roomAt(cur.floor, cur.col + cells)];
      if (cur.type === 'elevator') nbs.push(this.roomAt(cur.floor - 1, cur.col), this.roomAt(cur.floor + 1, cur.col));
      for (const nb of nbs) {
        if (!nb || !idSet.has(nb.id) || visited.has(nb.id)) continue;
        if ((nb.floor !== cur.floor) && (nb.type !== 'elevator' || cur.type !== 'elevator')) continue;
        visited.add(nb.id);
        q.push(nb);
      }
    }
    return visited.size === others.length;
  }

  destroy(r: Room): boolean {
    if (!this.canDestroy(r)) return false;
    const refund = Math.round(ROOMS[r.type].cost * 0.25 * r.size);
    this.s.nuts += refund;
    for (const rb of this.s.robots) if (rb.floor === r.floor && !this.s.rooms.some((x) => x !== r && x.floor === r.floor)) rb.floor = -1;
    this.s.rooms = this.s.rooms.filter((x) => x !== r);
    this.reindex();
    this.emit('destroyed', { room: r });
    return true;
  }

  rockCost(rk: Rock) {
    return Math.round((30 + rk.floor * 9) * rk.w / 5) * 5;
  }

  clearRock(rk: Rock): boolean {
    if (rk.clearing > 0) return false;
    const cost = this.rockCost(rk);
    if (this.s.nuts < cost) return false;
    // must touch the vault to be reachable
    let touches = false;
    for (let c = rk.col - 1; c <= rk.col + rk.w; c++) {
      if (this.roomAt(rk.floor, c) || this.roomAt(rk.floor - 1, c) || this.roomAt(rk.floor + 1, c)) touches = true;
    }
    if (!touches) return false;
    this.s.nuts -= cost;
    rk.clearing = 3;
    return true;
  }

  // ------------------------------------------------------------------ dwellers
  addDweller(d: Dweller) {
    this.s.dwellers.push(d);
    this.dmap.set(d.id, d);
    this.refreshByRoom();
  }

  admit(d: Dweller): boolean {
    if (d.room !== -1) return false;
    if (this.population() >= this.capacity()) return false;
    d.room = 0;
    d.joined = this.s.time;
    this.refreshByRoom();
    this.s.counters.maxPop = Math.max(this.s.counters.maxPop ?? 0, this.population());
    this.emit('admitted', { d });
    return true;
  }

  canAssign(d: Dweller, r: Room): boolean {
    if (d.exploring || d.child) return false;
    if (r.buildLeft > 0 && r.buildTotal > 3) return false;
    const def = ROOMS[r.type];
    const cap = r.type === 'door' ? 2 : def.cap * r.size;
    if (cap <= 0) return false;
    if (d.room === r.id) return true;
    return this.dwellersIn(r).filter((x) => !x.child).length < cap;
  }

  roomCap(r: Room) {
    const def = ROOMS[r.type];
    return r.type === 'door' ? 2 : def.cap * r.size;
  }

  assign(d: Dweller, r: Room | null): boolean {
    if (r && !this.canAssign(d, r)) return false;
    if (d.room === -1) {
      if (!this.admit(d)) return false;
    }
    const prev = d.room;
    d.room = r ? r.id : 0;
    if (prev !== d.room) {
      d.trainProg = 0;
      if (d.partner) {
        const p = this.dweller(d.partner);
        if (p) {
          p.partner = 0;
          p.romance = 0;
        }
        d.partner = 0;
        d.romance = 0;
      }
    }
    this.refreshByRoom();
    this.emit('assign', { d, room: r });
    return true;
  }

  swapInto(d: Dweller, r: Room): boolean {
    // Room full: swap with the weakest occupant (by relevant stat)
    if (this.canAssign(d, r)) return this.assign(d, r);
    const st = ROOMS[r.type].stat;
    const occ = this.dwellersIn(r).filter((x) => !x.child);
    if (!occ.length) return false;
    occ.sort((a, b) => statTotal(this.s, a, Math.max(0, st)) - statTotal(this.s, b, Math.max(0, st)));
    const out = occ[0];
    const from = d.room > 0 ? this.room(d.room) ?? null : null;
    out.room = 0;
    this.refreshByRoom();
    this.assign(d, r);
    if (from && this.canAssign(out, from)) this.assign(out, from);
    return true;
  }

  giveXp(d: Dweller, amount: number) {
    if (d.level >= MAX_LEVEL) return;
    d.xp += amount * (1 + petBonus(this.s, d, 'xp') / 100);
    let guard = 0;
    while (d.level < MAX_LEVEL && d.xp >= xpNeeded(d.level) && guard++ < 10) {
      d.xp -= xpNeeded(d.level);
      d.level++;
      d.maxHp += 2.5 + statTotal(this.s, d, S_END) * 0.5 + petBonus(this.s, d, 'hp');
      d.hp = effMaxHp(d);
      d.lvlPending++;
      this.s.counters.levelups = (this.s.counters.levelups ?? 0) + 1;
      this.emit('levelup', { d });
    }
    if (d.level >= MAX_LEVEL) d.xp = 0;
  }

  ackLevel(d: Dweller) {
    if (d.lvlPending > 0) {
      d.lvlPending = 0;
      d.happy = Math.min(100, d.happy + 6);
      return true;
    }
    return false;
  }

  knockOut(d: Dweller) {
    if (d.ko) return;
    d.ko = true;
    d.hp = 0;
    if (d.partner) {
      const p = this.dweller(d.partner);
      if (p) {
        p.partner = 0;
        p.romance = 0;
      }
      d.partner = 0;
      d.romance = 0;
    }
    this.emit('ko', { d });
    this.emit('toast', { text: L({ ru: '{n} без сознания!', en: '{n} is unconscious!' }, { n: dwellerName(d) }), kind: 'bad', icon: 'heart' });
  }

  reviveCost(d: Dweller) {
    return 50 + d.level * 25;
  }

  revive(d: Dweller, free = false): boolean {
    if (!d.ko) return false;
    if (!free) {
      const c = this.reviveCost(d);
      if (this.s.nuts < c) return false;
      this.s.nuts -= c;
    }
    d.ko = false;
    d.hp = effMaxHp(d);
    d.happy = Math.max(d.happy, 40);
    const e = this.s.expeditions.find((x) => x.dweller === d.id && !x.done);
    if (e && e.ko) {
      e.ko = false;
      recallExpedition(this, e);
    }
    this.s.counters.revived = (this.s.counters.revived ?? 0) + 1;
    this.emit('revived', { d });
    return true;
  }

  useMedkit(d: Dweller): boolean {
    if (this.s.medkits <= 0 || d.ko) return false;
    const eff = effMaxHp(d);
    if (d.hp >= eff - 0.5) return false;
    this.s.medkits--;
    d.hp = Math.min(eff, d.hp + Math.max(40, eff * 0.5));
    this.s.counters.heals = (this.s.counters.heals ?? 0) + 1;
    this.emit('heal', { d });
    return true;
  }

  useAntirad(d: Dweller): boolean {
    if (this.s.antirads <= 0 || d.rad <= 0.5) return false;
    this.s.antirads--;
    d.rad = Math.max(0, d.rad - d.maxHp * 0.45);
    this.emit('heal', { d });
    return true;
  }

  evict(d: Dweller) {
    if (d.exploring) return false;
    this.s.dwellers = this.s.dwellers.filter((x) => x !== d);
    for (const o of this.s.dwellers) if (o.partner === d.id) {
      o.partner = 0;
      o.romance = 0;
    }
    this.reindex();
    return true;
  }

  rename(d: Dweller, first: string, last: string) {
    d.first = first.slice(0, 18) || d.first;
    d.last = last.slice(0, 22);
  }

  // ------------------------------------------------------------------ items
  equip(d: Dweller, it: Item | null, slot: 'weapon' | 'outfit' | 'pet') {
    if (it) {
      const eq = this.equippedUids();
      if (eq.has(it.uid)) {
        for (const o of this.s.dwellers) {
          if (o.weapon === it.uid) o.weapon = 0;
          if (o.outfit === it.uid) o.outfit = 0;
          if (o.pet === it.uid) o.pet = 0;
        }
      }
      d[slot] = it.uid;
      if (slot === 'weapon') this.s.counters.equip_w = (this.s.counters.equip_w ?? 0) + 1;
      if (slot === 'outfit') this.s.counters.equip_o = (this.s.counters.equip_o ?? 0) + 1;
    } else {
      d[slot] = 0;
    }
    d.hp = Math.min(d.hp, effMaxHp(d));
    this.emit('equip', { d });
  }

  sell(it: Item): number {
    if (this.equippedUids().has(it.uid)) return 0;
    const v = this.itemValue(it);
    this.s.items = this.s.items.filter((x) => x !== it);
    this.s.nuts += v;
    this.s.counters.sold = (this.s.counters.sold ?? 0) + 1;
    this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + v;
    return v;
  }

  addItem(def: string, kind: Item['kind'], r?: Rarity): Item {
    const it: Item = { uid: this.uid(), def, kind };
    if (kind === 'pet') it.r = r ?? 0;
    this.s.items.push(it);
    return it;
  }

  junkCount(def: string) {
    return this.storedItems().filter((i) => i.def === def).length;
  }

  canCraft(room: Room, def: string): { ok: boolean; reason?: string } {
    const rc = RECIPE_BY_ID[def];
    if (!rc) return { ok: false };
    if (room.craft) return { ok: false, reason: 'busy' };
    if (room.level < rc.level) return { ok: false, reason: 'level' };
    if (this.s.nuts < rc.nuts) return { ok: false, reason: 'nuts' };
    if (this.storageUsed() >= this.storageCap()) return { ok: false, reason: 'storage' };
    const need: Record<string, number> = {};
    for (const j of rc.junk) need[j] = (need[j] ?? 0) + 1;
    for (const j in need) if (this.junkCount(j) < need[j]) return { ok: false, reason: 'junk' };
    if (!this.workers(room).length) return { ok: false, reason: 'workers' };
    return { ok: true };
  }

  startCraft(room: Room, def: string): boolean {
    if (!this.canCraft(room, def).ok) return false;
    const rc = RECIPE_BY_ID[def];
    this.s.nuts -= rc.nuts;
    for (const j of rc.junk) {
      const it = this.storedItems().find((i) => i.def === j);
      if (it) this.s.items = this.s.items.filter((x) => x !== it);
    }
    room.craft = { def, kind: rc.kind, left: rc.time, total: rc.time, done: false };
    return true;
  }

  collectCraft(room: Room): Item | null {
    if (!room.craft || !room.craft.done) return null;
    const it = this.addItem(room.craft.def, room.craft.kind);
    room.craft = null;
    this.s.counters.crafted = (this.s.counters.crafted ?? 0) + 1;
    for (const d of this.workers(room)) this.giveXp(d, 40);
    return it;
  }

  // ------------------------------------------------------------------ production
  collect(r: Room, auto = false): boolean {
    if (!r.ready) return false;
    const def = ROOMS[r.type];
    const store = this.roomStore(r);
    const items: { kind: string; amount: number }[] = [];
    const add = (k: ResKey, amt: number) => {
      const before = this.s.res[k];
      this.s.res[k] = Math.min(this.resCap(k), this.s.res[k] + amt);
      const got = this.s.res[k] - before;
      this.s.counters['col_' + k] = (this.s.counters['col_' + k] ?? 0) + Math.round(amt);
      items.push({ kind: k, amount: Math.round(got > 0 ? got : amt) });
    };
    switch (def.produce) {
      case 'power':
      case 'food':
      case 'water':
        add(def.produce, store);
        break;
      case 'foodwater':
        add('food', store);
        add('water', store);
        break;
      case 'medkit':
        this.s.medkits = Math.min(this.medCap(), this.s.medkits + store);
        items.push({ kind: 'medkit', amount: store });
        break;
      case 'antirad':
        this.s.antirads = Math.min(this.antiradCap(), this.s.antirads + store);
        items.push({ kind: 'antirad', amount: store });
        break;
      case 'dawn':
        this.s.dawnCharge += store;
        items.push({ kind: 'dawn', amount: store });
        break;
      default:
        return false;
    }
    r.ready = false;
    r.prog = 0;
    const ws = this.workers(r);
    let bonus = 0;
    let luck = 0;
    for (const d of ws) {
      this.giveXp(d, 8);
      d.morale = Math.min(20, d.morale + 3);
      d.happy = Math.min(100, d.happy + 1.5);
      luck += statTotal(this.s, d, S_LUC);
    }
    if (ws.length && chance((luck / ws.length) * 0.035)) {
      bonus = Math.round(store * 0.6 + 4 * r.size * r.level);
      this.s.nuts += bonus;
      this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + bonus;
    }
    this.s.counters.col_any = (this.s.counters.col_any ?? 0) + 1;
    this.emit('collect', { room: r, items, bonus, auto });
    return true;
  }

  rush(r: Room, safe = false): boolean {
    if (!this.canRush(r)) return false;
    const risk = this.rushRisk(r);
    const ok = safe || Math.random() >= risk || this.s.tutorial < TUTORIAL_DONE;
    r.rush += 1;
    let bonus = 0;
    if (ok) {
      if (ROOMS[r.type].produce === 'radio') {
        r.prog = 0;
        this.spawnArrival(true);
      } else {
        r.prog = this.roomStore(r);
        r.ready = true;
      }
      bonus = Math.round(this.roomStore(r) * 1.1 + 6 * r.size * r.level);
      this.s.nuts += bonus;
      this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + bonus;
      for (const d of this.workers(r)) this.giveXp(d, 14);
      this.s.counters.rush_ok = (this.s.counters.rush_ok ?? 0) + 1;
    } else {
      this.s.counters.rush_fail = (this.s.counters.rush_fail ?? 0) + 1;
      startIncident(this, r, rushIncidentKind(this));
    }
    this.emit('rush', { room: r, ok, bonus });
    return true;
  }

  // ------------------------------------------------------------------ arrivals & babies
  spawnArrival(force = false): Dweller | null {
    if (!force && this.waiting().length >= 3) return null;
    const d = baseDweller(this.uid(), chance(0.5) ? 'm' : 'f', this.s.time);
    const pop = this.population();
    d.stats = randomStats(randi(12, 18) + Math.floor(pop / 25), Math.min(10, 5 + Math.floor(pop / 30)));
    applyLevels(d, randi(1, Math.min(12, 2 + Math.floor(pop / 8))));
    d.room = -1;
    // occasionally arrivals bring gear
    if (chance(0.25)) {
      const w = this.addItem(randomItemDef('weapon', rollRarity(2, 1)), 'weapon');
      d.weapon = w.uid;
    }
    if (chance(0.2)) {
      const o = this.addItem(randomItemDef('outfit', rollRarity(2, 1)), 'outfit');
      d.outfit = o.uid;
    }
    this.addDweller(d);
    this.emit('arrive', { d });
    this.emit('toast', { text: L({ ru: 'У ворот новый житель!', en: 'A new dweller is at the door!' }), kind: 'good', icon: 'dweller' });
    return d;
  }

  addDwellerDirect(d: Dweller) {
    d.room = -1;
    this.addDweller(d);
    this.emit('arrive', { d });
  }

  // ------------------------------------------------------------------ crates & rewards
  openCrate(legendary = false): Card[] | null {
    if (this.s.crates <= 0) return null;
    this.s.crates--;
    const cards = rollCrate(this, legendary);
    for (const c of cards) this.applyCard(c);
    this.s.counters.crates = (this.s.counters.crates ?? 0) + 1;
    this.emit('crate_opened', { cards });
    return cards;
  }

  applyCard(c: Card) {
    switch (c.kind) {
      case 'nuts':
        this.s.nuts += c.amount!;
        break;
      case 'res':
        this.s.res[c.res!] = Math.min(this.resCap(c.res!), this.s.res[c.res!] + c.amount!);
        break;
      case 'iso':
        this.s.iso += c.amount!;
        break;
      case 'medkit':
        this.s.medkits = Math.min(this.medCap() + 5, this.s.medkits + c.amount!);
        break;
      case 'antirad':
        this.s.antirads = Math.min(this.antiradCap() + 5, this.s.antirads + c.amount!);
        break;
      case 'junk':
      case 'weapon':
      case 'outfit':
        c.ref = this.addItem(c.def!, c.kind).uid;
        break;
      case 'pet':
        c.ref = this.addItem(c.def!, 'pet', c.rarity).uid;
        break;
      case 'robot':
        this.s.robots.push({ id: this.uid(), floor: -1 });
        break;
      case 'dweller': {
        let d: Dweller;
        if (c.legend) {
          d = makeLegend(this.uid(), c.legend, this.s.time);
          const L2 = d.legend;
          const leg = L2 ? (require_legend(L2)) : null;
          if (leg?.outfit) d.outfit = this.addItem(leg.outfit, 'outfit').uid;
          if (leg?.weapon) d.weapon = this.addItem(leg.weapon, 'weapon').uid;
        } else {
          d = baseDweller(this.uid(), chance(0.5) ? 'm' : 'f', this.s.time);
          d.stats = randomStats(randi(24, 32), 8);
          applyLevels(d, randi(3, 10));
          d.happy = 80;
        }
        this.addDwellerDirect(d);
        c.ref = d.id;
        break;
      }
    }
  }

  giveReward(r: Reward) {
    if (r.nuts) {
      this.s.nuts += r.nuts;
      this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + r.nuts;
    }
    if (r.iso) this.s.iso += r.iso;
    if (r.crate) this.s.crates += r.crate;
    if (r.medkits) this.s.medkits += r.medkits;
  }

  // ------------------------------------------------------------------ objectives
  objectiveSlots() {
    return 3 + (this.roomsOfType('office').some((r) => r.buildLeft <= 0) ? 1 : 0);
  }

  fillObjectives() {
    while (this.s.objectives.length < this.objectiveSlots()) {
      this.s.objectives.push(makeObjective(this, this.s.objectives.map((o) => o.def)));
    }
  }

  objectiveReady(o: Objective) {
    return objectiveProgress(this, o) >= o.target;
  }

  claimObjective(o: Objective): Reward | null {
    if (!this.objectiveReady(o)) return null;
    this.giveReward(o.reward);
    this.s.objectives = this.s.objectives.filter((x) => x !== o);
    this.s.counters.objectives = (this.s.counters.objectives ?? 0) + 1;
    this.fillObjectives();
    return o.reward;
  }

  skipObjective(o: Objective) {
    const idx = this.s.objectives.indexOf(o);
    if (idx < 0) return;
    const others = this.s.objectives.map((x) => x.def);
    this.s.objectives[idx] = makeObjective(this, others);
  }

  // ------------------------------------------------------------------ exploration
  sendExplore(d: Dweller, medkits: number, antirads: number): boolean {
    if (d.exploring || d.child || d.ko || d.babyAt || d.room === -1) return false;
    medkits = clamp(Math.floor(medkits), 0, Math.min(25, this.s.medkits));
    antirads = clamp(Math.floor(antirads), 0, Math.min(25, this.s.antirads));
    this.s.medkits -= medkits;
    this.s.antirads -= antirads;
    if (d.partner) {
      const p = this.dweller(d.partner);
      if (p) {
        p.partner = 0;
        p.romance = 0;
      }
      d.partner = 0;
      d.romance = 0;
    }
    d.exploring = true;
    d.room = 0;
    this.s.expeditions.push(startExpedition(this, d, medkits, antirads));
    this.refreshByRoom();
    this.emit('explore_start', { d });
    return true;
  }

  recall(e: Expedition) {
    recallExpedition(this, e);
  }

  instantReturn(e: Expedition) {
    if (!e.returning) recallExpedition(this, e);
    e.returnLeft = 0;
    e.done = true;
  }

  finishExpedition(e: Expedition) {
    const d = this.dweller(e.dweller);
    this.s.expeditions = this.s.expeditions.filter((x) => x !== e);
    if (!d) return;
    d.exploring = false;
    d.room = 0;
    this.s.nuts += e.nuts;
    this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + e.nuts;
    this.s.medkits += e.medkits;
    this.s.antirads += e.antirads;
    for (const it of e.loot) this.s.items.push(it);
    this.refreshByRoom();
    this.emit('explorer_home', { e, d });
  }

  // ------------------------------------------------------------------ missions
  missionAvailable(m: MissionDef) {
    const office = this.roomsOfType('office').find((r) => r.buildLeft <= 0);
    if (!office || office.level < m.officeLevel) return false;
    if (this.s.missions.some((x) => x.id === m.id)) return false;
    return (this.s.missionCd[m.id] ?? 0) <= this.s.time;
  }

  startMission(m: MissionDef, team: Dweller[]): boolean {
    if (!this.missionAvailable(m) || !team.length || team.length > m.team) return false;
    if (team.some((d) => d.exploring || d.child || d.ko || d.babyAt)) return false;
    for (const d of team) {
      if (d.partner) {
        const p = this.dweller(d.partner);
        if (p) {
          p.partner = 0;
          p.romance = 0;
        }
        d.partner = 0;
      }
      d.exploring = true;
      d.room = 0;
    }
    this.s.missions.push({ id: m.id, team: team.map((d) => d.id), phase: 'travel', left: m.travel, total: m.travel });
    this.refreshByRoom();
    return true;
  }

  /** Resolve the mission battle (called by the battle scene or auto). */
  resolveMission(run: MissionRun, win: boolean, critBonus = 0) {
    const m = MISSION_BY_ID[run.id];
    const nuts = win ? Math.round(rand(m.reward.nuts[0], m.reward.nuts[1]) * (1 + critBonus * 0.1)) : Math.round(m.reward.nuts[0] * 0.2);
    const loot: Item[] = [];
    if (win) {
      const n = randi(1, 3);
      for (let i = 0; i < n; i++) {
        const r: Rarity = Math.random() < m.reward.rarity * 0.25 ? 2 : Math.random() < m.reward.rarity ? 1 : 0;
        const kind = pick(['weapon', 'outfit', 'junk', 'junk'] as const);
        loot.push({ uid: this.uid(), def: randomItemDef(kind, r), kind });
      }
      if (m.reward.pet) {
        const pets = Object.keys(PET_BY_ID);
        loot.push({ uid: this.uid(), def: pick(pets), kind: 'pet', r: Math.random() < 0.25 ? 1 : 0 });
      }
    }
    run.result = { win, nuts, loot, xp: Math.round(40 * m.diff) };
    run.phase = 'returning';
    run.total = run.left = Math.round(m.travel / 2);
    for (const id of run.team) {
      const d = this.dweller(id);
      if (d) this.giveXp(d, run.result.xp);
    }
  }

  finishMission(run: MissionRun) {
    const m = MISSION_BY_ID[run.id];
    this.s.missions = this.s.missions.filter((x) => x !== run);
    this.s.missionCd[run.id] = this.s.time + 900;
    for (const id of run.team) {
      const d = this.dweller(id);
      if (d) {
        d.exploring = false;
        d.room = 0;
        if (d.hp <= 0) {
          d.hp = 1;
        }
      }
    }
    if (run.result) {
      this.s.nuts += run.result.nuts;
      for (const it of run.result.loot) this.s.items.push(it);
      if (run.result.win) {
        if (m.reward.crate) this.s.crates += m.reward.crate;
        if (m.reward.iso) this.s.iso += m.reward.iso;
        if (m.reward.res) this.s.res[m.reward.res] = Math.min(this.resCap(m.reward.res), this.s.res[m.reward.res] + 150);
        this.s.counters.missions = (this.s.counters.missions ?? 0) + 1;
      }
    }
    this.refreshByRoom();
    this.emit('mission_home', { m: run });
  }

  // ------------------------------------------------------------------ dawn project
  dawnReqValue(req: DawnReq): { cur: number; need: number } {
    switch (req.kind) {
      case 'pop':
        return { cur: this.population(), need: req.n };
      case 'room': {
        const best = this.roomsOfType(req.room).filter((r) => r.buildLeft <= 0).reduce((a, r) => Math.max(a, r.level), 0);
        return { cur: best, need: req.level };
      }
      case 'counter':
        return { cur: this.s.counters[req.key] ?? 0, need: req.n };
      case 'donate':
        return { cur: this.s.dawn.donated[this.s.dawn.stage + ':' + req.res] ?? 0, need: req.n };
      case 'charge':
        return { cur: this.s.dawnCharge, need: req.n };
    }
  }

  donate(res: 'nuts' | 'power' | 'food' | 'water', need: number): number {
    const key = this.s.dawn.stage + ':' + res;
    const have = this.s.dawn.donated[key] ?? 0;
    const missing = Math.max(0, need - have);
    const avail = res === 'nuts' ? this.s.nuts : Math.floor(this.s.res[res] - 5);
    const amt = Math.max(0, Math.min(missing, avail));
    if (amt <= 0) return 0;
    if (res === 'nuts') this.s.nuts -= amt;
    else this.s.res[res] -= amt;
    this.s.dawn.donated[key] = have + amt;
    return amt;
  }

  dawnStageReady(): boolean {
    const st = DAWN_STAGES[this.s.dawn.stage];
    if (!st) return false;
    return st.reqs.every((r) => {
      const v = this.dawnReqValue(r);
      return v.cur >= v.need;
    });
  }

  completeDawnStage(): boolean {
    if (!this.dawnStageReady()) return false;
    const st = DAWN_STAGES[this.s.dawn.stage];
    const charge = st.reqs.find((r) => r.kind === 'charge');
    if (charge && charge.kind === 'charge') this.s.dawnCharge -= charge.n;
    this.s.nuts += st.reward.nuts;
    this.s.iso += st.reward.iso;
    this.s.crates += st.reward.crate;
    this.s.dawn.stage++;
    this.emit('dawn_stage', { stage: this.s.dawn.stage });
    return true;
  }

  // ------------------------------------------------------------------ daily
  static todayKey(t = Date.now()) {
    const d = new Date(t);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  dailyAvailable() {
    return this.s.daily.last !== Game.todayKey();
  }

  claimDaily(): { day: number; reward: Reward & { legendary?: boolean } } | null {
    if (!this.dailyAvailable()) return null;
    const yesterday = Game.todayKey(Date.now() - 86400000);
    const day = this.s.daily.last === yesterday ? (this.s.daily.day + 1) % 7 : 0;
    this.s.daily = { day, last: Game.todayKey() };
    const reward = DAILY_REWARDS[day];
    this.giveReward(reward);
    return { day, reward };
  }

  // ------------------------------------------------------------------ power
  computePowerOrder() {
    const producers = this.s.rooms.filter((r) => (r.type === 'power' || r.type === 'reactor') && r.buildLeft <= 0);
    const consumers = this.s.rooms.filter((r) => this.needsPower(r));
    const dist = (r: Room) => {
      if (!producers.length) return 999;
      const cx = r.col + this.roomCells(r) / 2;
      let best = 1e9;
      for (const p of producers) {
        const px = p.col + this.roomCells(p) / 2;
        best = Math.min(best, Math.abs(p.floor - r.floor) * 4 + Math.abs(px - cx) / 3);
      }
      return best;
    };
    this.powerOrder = consumers.sort((a, b) => dist(a) - dist(b)).map((r) => r.id);
  }

  powerConsumption() {
    let c = 0;
    for (const r of this.s.rooms) {
      if (r.buildLeft > 0 && r.buildTotal > 3) continue;
      if (r.type === 'elevator') c += 0.0018;
      else if (r.type === 'door') c += 0.008;
      else if (this.needsPower(r) && r.powered) c += POWER_PER_CELL * this.roomCells(r) * (1 + (r.level - 1) * 0.2);
    }
    return c;
  }

  foodConsumption() {
    let c = 0;
    for (const d of this.s.dwellers) if (d.room !== -1 && !d.exploring) c += d.child ? FOOD_PER * 0.5 : FOOD_PER;
    return c;
  }
  waterConsumption() {
    let c = 0;
    for (const d of this.s.dwellers) if (d.room !== -1 && !d.exploring) c += d.child ? WATER_PER * 0.5 : WATER_PER;
    return c;
  }

  private updatePower(dt: number) {
    const cons = this.powerConsumption() * dt * (this.live ? 1 : 0.6);
    this.s.res.power = Math.max(0, this.s.res.power - cons);
    const wasBlack = this.blackout;
    this.blackout = this.s.res.power <= 0.001;
    if (!this.live) {
      for (const r of this.s.rooms) r.powered = !this.needsPower(r) || !this.blackout;
      return;
    }
    this.powerT += dt;
    if (this.blackout) {
      if (this.powerT >= 2.2) {
        this.powerT = 0;
        for (let i = this.powerOrder.length - 1; i >= 0; i--) {
          const r = this.rmap.get(this.powerOrder[i]);
          if (r && r.powered) {
            r.powered = false;
            break;
          }
        }
      }
    } else if (this.powerT >= 0.35) {
      this.powerT = 0;
      for (const id of this.powerOrder) {
        const r = this.rmap.get(id);
        if (r && !r.powered) {
          r.powered = true;
          break;
        }
      }
    }
    for (const r of this.s.rooms) if (!this.needsPower(r)) r.powered = true;
    if (wasBlack !== this.blackout) this.emit('power', { on: !this.blackout });
  }

  // ------------------------------------------------------------------ main tick
  tick(dt: number) {
    const s = this.s;
    s.time += dt;
    this.refreshByRoom();
    this.updatePower(dt);

    // consumption
    const cf = this.live ? 1 : 0.5;
    s.res.food = Math.max(0, s.res.food - this.foodConsumption() * dt * cf);
    s.res.water = Math.max(0, s.res.water - this.waterConsumption() * dt * cf);
    this.starving = s.res.food <= 0.001;
    this.thirsty = s.res.water <= 0.001;
    for (const k of RES_KEYS) s.res[k] = Math.min(s.res[k], this.resCap(k));

    // radio bonus
    let rb = 0;
    for (const r of s.rooms) {
      if (r.type !== 'radio' || !this.isActive(r)) continue;
      for (const d of this.workers(r)) rb += statTotal(s, d, S_CHA) * 0.22 * r.level;
    }
    this.radioBonus = clamp(rb, 0, 15);

    this.updateRooms(dt);
    this.updateDwellers(dt);
    this.updateLiving(dt);

    // expeditions
    for (const e of [...s.expeditions]) {
      tickExpedition(this, e, dt);
      if (e.done) this.finishExpedition(e);
    }
    // missions
    for (const m of [...s.missions]) {
      m.left -= dt;
      if (m.left <= 0) {
        if (m.phase === 'travel') {
          m.phase = 'ready';
          m.left = 0;
          if (!this.live) this.autoResolveMission(m);
          else this.emit('mission_arrived', { m });
        } else if (m.phase === 'returning') {
          this.finishMission(m);
        }
      }
    }

    // incidents
    tickIncidents(this, dt);

    // rocks
    for (const rk of [...s.rocks]) {
      if (rk.clearing > 0) {
        rk.clearing -= dt;
        if (rk.clearing <= 0) this.finishRock(rk);
      }
    }

    // robots auto-collect
    this.robotT -= dt;
    if (this.robotT <= 0) {
      this.robotT = this.live ? 1.2 : 0;
      for (const rb2 of s.robots) {
        if (rb2.floor < 0) continue;
        const target = s.rooms.find((r) => r.floor === rb2.floor && r.ready);
        if (target) {
          this.collect(target, true);
          this.emit('robot_collect', { robot: rb2.id, room: target });
        }
      }
    }

    // arrivals without radio (early game)
    this.arrivalT -= dt;
    if (this.arrivalT <= 0) {
      this.arrivalT = rand(150, 260);
      if (this.population() < 14 && this.waiting().length === 0 && s.tutorial >= TUTORIAL_DONE) this.spawnArrival();
    }

    if (this.live && s.tutorial >= TUTORIAL_DONE) this.updateRandom(dt);

    // objectives check
    this.objT -= dt;
    if (this.objT <= 0) {
      this.objT = 1;
      this.fillObjectives();
      for (const o of s.objectives) {
        const ready = this.objectiveReady(o);
        const key = 'objr_' + o.def + '_' + o.target;
        if (ready && !s.flags[key]) {
          s.flags[key] = 1;
          this.emit('objective_ready', { o });
        }
      }
      s.counters.maxPop = Math.max(s.counters.maxPop ?? 0, this.population());
    }
  }

  private updateRandom(dt: number) {
    this.randomT -= dt;
    if (this.randomT <= 0) {
      this.randomT = rand(260, 480);
      if (this.population() >= 8) randomIncident(this);
    }
    // Schrödinger's cat
    if (this.catRoom && this.s.time > this.catUntil) {
      this.catRoom = null;
      this.emit('cat', { room: null });
    }
    this.catT -= dt;
    if (this.catT <= 0) {
      this.catT = rand(200, 420);
      if (this.population() >= 6 && !this.catRoom) {
        const rooms = this.s.rooms.filter((r) => r.type !== 'elevator' && r.buildLeft <= 0 && !r.incident);
        if (rooms.length) {
          this.catRoom = pick(rooms);
          this.catUntil = this.s.time + 11;
          this.emit('cat', { room: this.catRoom });
        }
      }
    }
    // chatter
    this.chatterT -= dt;
    if (this.chatterT <= 0) {
      this.chatterT = rand(5, 11);
      const cands = this.s.dwellers.filter((d) => d.room > 0 && !d.ko && !d.exploring);
      if (cands.length) {
        const d = pick(cands);
        this.emit('chatter', { d, text: L(pick(CHATTER)) });
      }
    }
  }

  catchCat(): number {
    if (!this.catRoom) return 0;
    const room = this.catRoom;
    this.catRoom = null;
    const nuts = Math.round((80 + this.population() * 12) * rand(0.9, 1.4));
    this.s.nuts += nuts;
    this.s.counters.cat = (this.s.counters.cat ?? 0) + 1;
    this.s.counters.nuts_earned = (this.s.counters.nuts_earned ?? 0) + nuts;
    this.emit('cat_caught', { room, nuts });
    return nuts;
  }

  private finishRock(rk: Rock) {
    this.s.rocks = this.s.rocks.filter((x) => x !== rk);
    this.s.counters.rocks = (this.s.counters.rocks ?? 0) + 1;
    let text: string | null = null;
    if (rk.treasure) {
      const r = Math.random();
      if (r < 0.45) {
        const n = randi(3, 8) * 10 + rk.floor * 5;
        this.s.nuts += n;
        text = L(pick(ROCK_TREASURE_NUTS), { n });
      } else if (r < 0.8) {
        const it = this.addItem(randomItemDef('junk', rollRarity(3, rk.floor / 6)), 'junk');
        text = L(pick(ROCK_TREASURE_ITEM), { item: this.itemName(it) });
      } else {
        const it = this.addItem(randomItemDef(chance(0.5) ? 'weapon' : 'outfit', rollRarity(4, rk.floor / 5)), chance(0.5) ? 'weapon' : 'outfit');
        // fix kind to actual def
        it.kind = WEAPON_BY_ID[it.def] ? 'weapon' : OUTFIT_BY_ID[it.def] ? 'outfit' : 'junk';
        text = L(pick(ROCK_TREASURE_ITEM), { item: this.itemName(it) });
      }
    } else if (chance(0.3)) {
      text = L(pick(ROCK_FUN));
    }
    this.reindex();
    this.emit('rock_cleared', { rock: rk, text });
  }

  private updateRooms(dt: number) {
    for (const r of this.s.rooms) {
      if (r.rush > 0) r.rush = Math.max(0, r.rush - dt / 150);
      if (r.buildLeft > 0) {
        r.buildLeft -= dt;
        if (r.buildLeft <= 0) {
          if (r.buildTotal > 2.3) this.finishBuild(r);
          else {
            r.buildLeft = 0;
          }
        }
        if (r.buildTotal > 2.3) continue;
      }
      if (r.type === 'door' && !r.incident && r.doorHp < this.doorMaxHp(r)) r.doorHp = Math.min(this.doorMaxHp(r), r.doorHp + dt * 2);
      const def = ROOMS[r.type];
      const active = this.isActive(r);
      // crafting
      if (def.craft && r.craft && !r.craft.done && active) {
        const ws = this.workers(r);
        if (ws.length) {
          let sum = 0;
          for (const d of ws) sum += statTotal(this.s, d, def.stat);
          r.craft.left -= dt * (0.6 + sum * 0.06) * LVL_RATE[r.level - 1];
          if (r.craft.left <= 0) {
            r.craft.left = 0;
            r.craft.done = true;
            this.emit('craft_done', { room: r });
          }
        }
      }
      if (!def.produce || r.ready || !active) continue;
      const rate = this.roomRate(r);
      if (rate <= 0) continue;
      r.prog += rate * dt;
      const store = this.roomStore(r);
      if (r.prog >= store) {
        if (def.produce === 'radio') {
          if (this.population() + this.waiting().length < this.capacity() && this.waiting().length < 3) {
            r.prog = 0;
            this.spawnArrival(true);
          } else {
            r.prog = store;
          }
        } else {
          r.prog = store;
          r.ready = true;
        }
      }
    }
  }

  happinessTarget(d: Dweller): number {
    if (d.child) return 90;
    let h = 50;
    const r = d.room > 0 ? this.room(d.room) : undefined;
    if (!r) h -= 12;
    else {
      const def = ROOMS[r.type];
      if (def.category === 'train') {
        h += d.stats[def.train!] >= 10 ? 5 : 16;
      } else if (r.type === 'door') {
        h += 10;
      } else if (def.stat >= 0) {
        const order = bestStats(this.s, d);
        const rank = order.indexOf(def.stat);
        const topVal = statTotal(this.s, d, order[0]);
        const val = statTotal(this.s, d, def.stat);
        h += val === topVal ? 26 : rank <= 1 ? 16 : rank <= 2 ? 10 : 3;
      }
      if (this.needsPower(r) && !r.powered) h -= 15;
      if (r.incident) h -= 20;
      if (d.partner) h += 10;
    }
    if (this.starving) h -= 25;
    if (this.thirsty) h -= 25;
    const eff = effMaxHp(d);
    if (d.hp < eff * 0.5) h -= 10;
    if (d.rad > d.maxHp * 0.3) h -= 10;
    h += this.radioBonus;
    h += petBonus(this.s, d, 'happy');
    h += d.morale;
    if (d.legend) h += 6;
    return clamp(h, 0, 100);
  }

  private updateDwellers(dt: number) {
    const s = this.s;
    for (const d of s.dwellers) {
      if (d.room === -1) continue;
      if (d.child && s.time >= d.growAt) {
        d.child = false;
        d.happy = Math.max(d.happy, 80);
        this.emit('grown', { d });
      }
      if (d.babyAt > 0 && s.time >= d.babyAt) {
        if (this.population() < this.capacity()) this.giveBirth(d);
        else d.babyAt = s.time + 20;
      }
      if (d.exploring) continue;
      if (d.ko) continue;
      const eff = effMaxHp(d);
      const r = d.room > 0 ? this.room(d.room) : undefined;
      // hunger / thirst
      if (this.starving && this.live) d.hp -= 0.12 * dt;
      else if (d.hp < eff && !(r && r.incident)) d.hp = Math.min(eff, d.hp + 0.07 * dt);
      if (this.thirsty && this.live) d.rad = Math.min(d.maxHp * 0.9, d.rad + 0.07 * dt);
      if (d.hp <= 0) {
        this.knockOut(d);
        continue;
      }
      d.hp = Math.min(d.hp, effMaxHp(d));
      // work XP & training
      if (r && !d.child && this.isActive(r)) {
        const def = ROOMS[r.type];
        if (def.category === 'train') {
          const st = def.train!;
          if (d.stats[st] < 10) {
            const need = this.trainTime(d.stats[st], r) / (1 + petBonus(s, d, 'train') / 100);
            d.trainProg += dt / need;
            if (d.trainProg >= 1) {
              d.trainProg = 0;
              d.stats[st]++;
              s.counters.statups = (s.counters.statups ?? 0) + 1;
              this.emit('statup', { d, stat: st });
            }
          }
          this.giveXp(d, 0.18 * dt);
        } else if (def.produce && !r.ready) {
          this.giveXp(d, 0.32 * dt);
        } else if (def.craft && r.craft && !r.craft.done) {
          this.giveXp(d, 0.3 * dt);
        } else if (r.type === 'door' || r.type === 'living' || r.type === 'storage') {
          this.giveXp(d, 0.08 * dt);
        }
      }
      // happiness
      const target = this.happinessTarget(d);
      const rate = (target > d.happy ? 0.45 : 0.3) * dt;
      d.happy = d.happy < target ? Math.min(target, d.happy + rate) : Math.max(target, d.happy - rate);
      d.morale = Math.max(0, d.morale - dt * 0.015);
    }
  }

  private updateLiving(dt: number) {
    const s = this.s;
    for (const r of s.rooms) {
      if (r.type !== 'living' || r.buildLeft > 0) continue;
      const adults = this.dwellersIn(r).filter((d) => !d.child && !d.ko && !d.exploring);
      // pair up
      const singles = adults.filter((d) => !d.partner && !d.babyAt);
      const men = singles.filter((d) => d.gender === 'm');
      const women = singles.filter((d) => d.gender === 'f');
      for (const m of men) {
        const w = women.find((x) => !x.partner && !areRelated(m, x));
        if (w) {
          m.partner = w.id;
          w.partner = m.id;
          m.romance = w.romance = 0;
        }
      }
      for (const a of adults) {
        if (!a.partner || a.gender !== 'm') continue;
        const b = this.dweller(a.partner);
        if (!b || b.room !== a.room || b.ko) {
          a.partner = 0;
          a.romance = 0;
          if (b) {
            b.partner = 0;
            b.romance = 0;
          }
          continue;
        }
        if (!this.isActive(r)) continue;
        const speed = 0.018 + (statTotal(s, a, S_CHA) + statTotal(s, b, S_CHA)) * 0.0032;
        a.romance = Math.min(1, a.romance + dt * speed);
        b.romance = a.romance;
        if (a.romance >= 1) {
          if (this.population() + this.expecting() < this.capacity()) {
            b.babyAt = s.time + BABY_TIME;
            b.babyDad = a.id;
            a.partner = b.partner = 0;
            a.romance = b.romance = 0;
            a.happy = Math.min(100, a.happy + 10);
            b.happy = Math.min(100, b.happy + 10);
            this.emit('pregnant', { mom: b, dad: a });
          }
        }
      }
    }
  }

  giveBirth(mom: Dweller) {
    const dad = this.dweller(mom.babyDad);
    const kid = childFrom(this.uid(), mom, dad, this.s.time);
    kid.growAt = this.s.time + GROW_TIME;
    kid.room = mom.room > 0 ? mom.room : 0;
    mom.babyAt = 0;
    mom.babyDad = 0;
    this.addDweller(kid);
    this.s.counters.babies = (this.s.counters.babies ?? 0) + 1;
    this.s.counters.maxPop = Math.max(this.s.counters.maxPop ?? 0, this.population());
    this.emit('baby', { d: kid, mom });
    this.emit('toast', { text: L({ ru: 'В убежище родился малыш: {n}!', en: 'A baby was born: {n}!' }, { n: kid.first }), kind: 'great', icon: 'baby' });
  }

  autoResolveMission(run: MissionRun) {
    const m = MISSION_BY_ID[run.id];
    let power = 0;
    for (const id of run.team) {
      const d = this.dweller(id);
      if (d) power += weaponDamage(this.s, d) + d.level * 0.5 + statTotal(this.s, d, S_STR) * 0.3 + statTotal(this.s, d, S_END) * 0.3;
    }
    const win = power >= m.diff * 6 * (0.8 + Math.random() * 0.4);
    this.resolveMission(run, win);
  }

  // ------------------------------------------------------------------ offline
  simulateOffline(seconds: number): OfflineReport | null {
    seconds = Math.min(seconds, OFFLINE_CAP);
    if (seconds < 30) return null;
    const before = { ...this.s.counters };
    const res0 = { ...this.s.res };
    const statups0 = this.s.counters.statups ?? 0;
    this.live = false;
    let t = seconds;
    const step = 5;
    while (t > 0) {
      const dt = Math.min(step, t);
      this.tick(dt);
      t -= dt;
    }
    this.live = true;
    const pop = this.population();
    const nuts = Math.round((seconds / 60) * (0.6 + pop * 0.05));
    this.s.nuts += nuts;
    const ready = this.s.rooms.filter((r) => r.ready).length;
    const rep: OfflineReport = {
      seconds,
      nuts,
      ready,
      babies: (this.s.counters.babies ?? 0) - (before.babies ?? 0),
      statups: (this.s.counters.statups ?? 0) - statups0,
      levelups: (this.s.counters.levelups ?? 0) - (before.levelups ?? 0),
      wasteNuts: (this.s.counters.waste_nuts ?? 0) - (before.waste_nuts ?? 0),
      resDelta: { power: this.s.res.power - res0.power, food: this.s.res.food - res0.food, water: this.s.res.water - res0.water },
    };
    this.offlineReport = rep;
    return rep;
  }
}

export interface OfflineReport {
  seconds: number;
  nuts: number;
  ready: number;
  babies: number;
  statups: number;
  levelups: number;
  wasteNuts: number;
  resDelta: Record<ResKey, number>;
}

export const DAILY_REWARDS: (Reward & { legendary?: boolean })[] = [
  { nuts: 150 },
  { medkits: 3, nuts: 100 },
  { nuts: 300 },
  { iso: 5 },
  { nuts: 600 },
  { crate: 1 },
  { crate: 1, iso: 10, legendary: true },
];

const ROCK_TREASURE_NUTS: Loc[] = [
  { ru: 'В породе нашлась старая шкатулка: +{n} гаек!', en: 'An old box was buried in the rock: +{n} nuts!' },
  { ru: 'Проходчики наткнулись на тайник: +{n} гаек!', en: 'The diggers found a stash: +{n} nuts!' },
];
const ROCK_TREASURE_ITEM: Loc[] = [
  { ru: 'Под завалом нашлось: {item}!', en: 'Found under the rubble: {item}!' },
  { ru: 'В трещине скалы блеснуло: {item}!', en: 'Something glinted in a crack: {item}!' },
];
const ROCK_FUN: Loc[] = [
  { ru: 'Нашли окаменелый батон. Выглядит свежее, чем в столовой.', en: 'Found a fossilized loaf. Looks fresher than the diner\'s.' },
  { ru: 'В скале оказался отпечаток древнего трилобита. Он улыбался.', en: 'Found a fossil of an ancient trilobite. It was smiling.' },
  { ru: 'Нашли капсулу времени: «Привет из прошлого! Надеемся, у вас всё хорошо».', en: 'Found a time capsule: "Hello from the past! Hope you\'re doing well."' },
];

import { LEGENDS } from '../data/names';
function require_legend(id: string) {
  return LEGENDS.find((l) => l.id === id) ?? null;
}

export { STAT_COUNT, S_AGI, S_PER, S_STR, getLang };
