import type { RoomType } from '../data/rooms';
import type { Rarity } from '../data/items';

export type ResKey = 'power' | 'food' | 'water';
export const RES_KEYS: ResKey[] = ['power', 'food', 'water'];

export const COLS = 26;
export const FLOORS = 25;

export interface Look {
  skin: number;
  hair: number;
  hairColor: number;
  beard: number;
  glasses: boolean;
  face: number;
}

export interface Dweller {
  id: number;
  first: string;
  last: string;
  gender: 'm' | 'f';
  child: boolean;
  growAt: number;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  rad: number;
  happy: number;
  morale: number;
  stats: number[];
  trainProg: number;
  outfit: number;
  weapon: number;
  pet: number;
  look: Look;
  /** room id; 0 = unassigned inside; -1 = waiting at the gate */
  room: number;
  ko: boolean;
  parents: number[];
  partner: number;
  romance: number;
  babyAt: number;
  babyDad: number;
  legend: string;
  exploring: boolean;
  joined: number;
  lvlPending: number;
  kills: number;
}

export type ItemKind = 'weapon' | 'outfit' | 'junk' | 'pet';

export interface Item {
  uid: number;
  def: string;
  kind: ItemKind;
  /** only for pets (rarity rolled per instance) */
  r?: Rarity;
}

export type IncidentKind = 'fire' | 'bugs' | 'moles' | 'raiders' | 'spikes';

export interface Incident {
  kind: IncidentKind;
  hp: number;
  maxHp: number;
  count: number;
  power: number;
  spreadT: number;
  moveT: number;
  visited: number[];
}

export interface Craft {
  def: string;
  kind: 'weapon' | 'outfit';
  left: number;
  total: number;
  done: boolean;
}

export interface Room {
  id: number;
  type: RoomType;
  floor: number;
  col: number;
  size: number;
  level: number;
  prog: number;
  ready: boolean;
  rush: number;
  buildLeft: number;
  buildTotal: number;
  craft: Craft | null;
  incident: Incident | null;
  /** power state (runtime, but saved for smooth reload) */
  powered: boolean;
  /** vault door: current hp of the door itself */
  doorHp: number;
}

export interface LogEntry {
  t: number;
  text: string;
  kind: 'info' | 'loot' | 'fight' | 'rad' | 'heal' | 'fun' | 'bad' | 'great';
}

export interface Expedition {
  dweller: number;
  elapsed: number;
  next: number;
  returning: boolean;
  returnLeft: number;
  returnTotal: number;
  nuts: number;
  loot: Item[];
  log: LogEntry[];
  medkits: number;
  antirads: number;
  xp: number;
  ko: boolean;
  kills: number;
  done: boolean;
}

export interface Reward {
  nuts?: number;
  iso?: number;
  crate?: number;
  medkits?: number;
}

export interface Objective {
  def: string;
  target: number;
  base: number;
  param?: string;
  reward: Reward;
}

export interface Robot {
  id: number;
  floor: number;
}

export interface Rock {
  id: number;
  floor: number;
  col: number;
  w: number;
  clearing: number;
  treasure: number;
}

export interface MissionRun {
  id: string;
  team: number[];
  phase: 'travel' | 'ready' | 'returning';
  left: number;
  total: number;
  result?: { win: boolean; nuts: number; loot: Item[]; xp: number };
}

export interface GameState {
  v: number;
  vault: number;
  created: number;
  realLast: number;
  time: number;
  res: Record<ResKey, number>;
  nuts: number;
  iso: number;
  medkits: number;
  antirads: number;
  dawnCharge: number;
  rooms: Room[];
  dwellers: Dweller[];
  items: Item[];
  expeditions: Expedition[];
  objectives: Objective[];
  robots: Robot[];
  rocks: Rock[];
  missions: MissionRun[];
  missionCd: Record<string, number>;
  counters: Record<string, number>;
  nextId: number;
  crates: number;
  tutorial: number;
  flags: Record<string, number>;
  daily: { day: number; last: string };
  adCd: Record<string, number>;
  dawn: { stage: number; donated: Record<string, number> };
  settings: { sfx: number; music: number; lang: string; quality: number };
  objSkipDay: string;
}
