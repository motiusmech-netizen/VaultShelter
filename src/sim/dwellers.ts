import { getLang } from '../i18n';
import { EN_FEMALE, EN_LAST, EN_MALE, LEGENDS, RU_FEMALE, RU_LAST, RU_MALE } from '../data/names';
import { OUTFIT_BY_ID, PET_BY_ID, WEAPON_BY_ID } from '../data/items';
import { S_END, STAT_COUNT } from '../data/stats';
import { clamp, pick, randi, rand } from '../core/util';
import type { Dweller, GameState, Item, Look } from './types';

export const MAX_LEVEL = 50;
export const HAIR_STYLES = 12;
export const HAIR_COLORS = ['#2a1d16', '#5a3a22', '#8a5a2e', '#c9772f', '#e9c46a', '#b8452f', '#d9d9d9', '#1b1b1b', '#6d3f8a'];
export const SKIN_TONES = ['#f6d5bd', '#e9b994', '#d49a6a', '#a8704a', '#7a4b2f', '#f1c6a8'];

export function xpNeeded(level: number) {
  return Math.floor(40 * Math.pow(level, 1.5));
}

export function randomLook(gender: 'm' | 'f'): Look {
  const maleHair = [0, 1, 2, 3, 4, 10, 11];
  const femaleHair = [5, 6, 7, 8, 9, 3, 11];
  return {
    skin: randi(0, SKIN_TONES.length - 1),
    hair: pick(gender === 'm' ? maleHair : femaleHair),
    hairColor: randi(0, 5) + (Math.random() < 0.08 ? 3 : 0),
    beard: gender === 'm' && Math.random() < 0.35 ? randi(1, 4) : 0,
    glasses: Math.random() < 0.18,
    face: randi(0, 3),
  };
}

export function randomName(gender: 'm' | 'f', lastFrom?: Dweller): { first: string; last: string } {
  const ru = getLang() === 'ru';
  const first = ru ? pick(gender === 'm' ? RU_MALE : RU_FEMALE) : pick(gender === 'm' ? EN_MALE : EN_FEMALE);
  let last: string;
  if (lastFrom) {
    last = adaptSurname(lastFrom.last, lastFrom.gender, gender);
  } else if (ru) {
    const pair = pick(RU_LAST);
    last = gender === 'm' ? pair[0] : pair[1];
  } else {
    last = pick(EN_LAST);
  }
  return { first, last };
}

function adaptSurname(last: string, fromG: 'm' | 'f', toG: 'm' | 'f'): string {
  if (fromG === toG) return last;
  for (const [m, f] of RU_LAST) {
    if (fromG === 'm' && last === m) return f;
    if (fromG === 'f' && last === f) return m;
  }
  return last;
}

export function randomStats(total: number, maxEach = 10): number[] {
  const s = new Array(STAT_COUNT).fill(1);
  let left = Math.max(0, total - STAT_COUNT);
  let guard = 0;
  while (left > 0 && guard++ < 500) {
    const i = randi(0, STAT_COUNT - 1);
    if (s[i] < maxEach) {
      s[i]++;
      left--;
    }
  }
  return s;
}

export function baseDweller(id: number, gender: 'm' | 'f', time: number): Dweller {
  const nm = randomName(gender);
  return {
    id,
    first: nm.first,
    last: nm.last,
    gender,
    child: false,
    growAt: 0,
    level: 1,
    xp: 0,
    hp: 105,
    maxHp: 105,
    rad: 0,
    happy: 60,
    morale: 0,
    stats: randomStats(randi(13, 19), 5),
    trainProg: 0,
    outfit: 0,
    weapon: 0,
    pet: 0,
    look: randomLook(gender),
    room: -1,
    ko: false,
    parents: [],
    partner: 0,
    romance: 0,
    babyAt: 0,
    babyDad: 0,
    legend: '',
    exploring: false,
    joined: time,
    lvlPending: 0,
    kills: 0,
  };
}

/** Level up a freshly created dweller to `lvl` (HP grows by END). */
export function applyLevels(d: Dweller, lvl: number) {
  while (d.level < lvl) {
    d.level++;
    d.maxHp += 2.5 + d.stats[S_END] * 0.5;
  }
  d.hp = d.maxHp;
}

export function makeLegend(id: number, legendId: string, time: number): Dweller {
  const L = LEGENDS.find((l) => l.id === legendId)!;
  const ru = getLang() === 'ru';
  const d = baseDweller(id, L.gender, time);
  d.first = ru ? L.first.ru : L.first.en;
  d.last = ru ? L.last.ru : L.last.en;
  d.stats = L.stats.slice();
  d.look = { ...L.look, face: 0 };
  d.legend = L.id;
  d.happy = 90;
  applyLevels(d, randi(8, 14));
  return d;
}

export function itemByUid(s: GameState, uid: number): Item | undefined {
  if (!uid) return undefined;
  return s.items.find((i) => i.uid === uid);
}

export function outfitBonus(s: GameState, d: Dweller, stat: number): number {
  const it = itemByUid(s, d.outfit);
  if (!it) return 0;
  const o = OUTFIT_BY_ID[it.def];
  return o ? o.bonus[stat] : 0;
}

export function statTotal(s: GameState, d: Dweller, stat: number): number {
  return d.stats[stat] + outfitBonus(s, d, stat);
}

export function weaponDamage(s: GameState, d: Dweller): number {
  const it = itemByUid(s, d.weapon);
  let dmg = 0.5;
  if (it) {
    const w = WEAPON_BY_ID[it.def];
    if (w) dmg = (w.dmg[0] + w.dmg[1]) / 2;
  }
  const pet = petOf(s, d);
  if (pet && pet.bonus === 'dmg') dmg += pet.value;
  return dmg;
}

export function petOf(s: GameState, d: Dweller): { bonus: string; value: number } | null {
  const it = itemByUid(s, d.pet);
  if (!it) return null;
  const p = PET_BY_ID[it.def];
  if (!p) return null;
  return { bonus: p.bonus, value: p.value[it.r ?? 0] };
}

export function petBonus(s: GameState, d: Dweller, kind: string): number {
  const p = petOf(s, d);
  return p && p.bonus === kind ? p.value : 0;
}

export function effMaxHp(d: Dweller) {
  return Math.max(1, d.maxHp - d.rad);
}

export function bestStats(s: GameState, d: Dweller): number[] {
  const idx = [0, 1, 2, 3, 4, 5, 6];
  return idx.sort((a, b) => statTotal(s, d, b) - statTotal(s, d, a));
}

export function areRelated(a: Dweller, b: Dweller): boolean {
  if (a.parents.includes(b.id) || b.parents.includes(a.id)) return true;
  for (const p of a.parents) if (b.parents.includes(p)) return true;
  return false;
}

export function childFrom(id: number, mom: Dweller, dad: Dweller | undefined, time: number): Dweller {
  const gender: 'm' | 'f' = Math.random() < 0.5 ? 'm' : 'f';
  const d = baseDweller(id, gender, time);
  const nm = randomName(gender, dad ?? mom);
  d.first = nm.first;
  d.last = nm.last;
  const stats: number[] = [];
  for (let i = 0; i < STAT_COUNT; i++) {
    const avg = ((mom.stats[i] ?? 1) + (dad?.stats[i] ?? mom.stats[i])) / 2;
    stats.push(clamp(Math.round(avg * rand(0.45, 0.85) + rand(0, 1.6)), 1, 10));
  }
  const legendary = !!(mom.legend || dad?.legend);
  if (legendary || Math.random() < 0.12) {
    const i = randi(0, STAT_COUNT - 1);
    stats[i] = clamp(stats[i] + randi(2, legendary ? 5 : 3), 1, 10);
  }
  d.stats = stats;
  d.child = true;
  d.happy = 100;
  d.hp = d.maxHp = 105;
  d.parents = dad ? [mom.id, dad.id] : [mom.id];
  // inherit look traits
  const src = Math.random() < 0.5 ? mom : dad ?? mom;
  d.look.skin = Math.random() < 0.8 ? src.look.skin : randi(0, SKIN_TONES.length - 1);
  d.look.hairColor = Math.random() < 0.75 ? (Math.random() < 0.5 ? mom : dad ?? mom).look.hairColor : d.look.hairColor;
  d.look.beard = 0;
  d.look.glasses = false;
  return d;
}

export function dwellerName(d: Dweller) {
  if (d.first.endsWith('-')) return d.first + d.last;
  return d.last ? `${d.first} ${d.last}` : d.first;
}
