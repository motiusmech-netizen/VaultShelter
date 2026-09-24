import type { Loc } from '../i18n';
import { L } from '../i18n';
import { ROOMS, type RoomType } from '../data/rooms';
import { pick, randi, weighted } from '../core/util';
import type { Game } from './game';
import type { Objective, Reward } from './types';

interface ObjDef {
  id: string;
  text: Loc;
  minPop: number;
  weight: number;
  counter?: string;
  state?: (g: Game, param?: string) => number;
  gen: (g: Game) => { target: number; param?: string };
  tier: number;
}

const popScale = (g: Game) => Math.max(1, g.population() / 10);

export const OBJECTIVES: ObjDef[] = [
  {
    id: 'col_power', text: { ru: 'Собрать {n} энергии', en: 'Collect {n} power' }, minPop: 0, weight: 3, counter: 'col_power', tier: 1,
    gen: (g) => ({ target: round5(60 * popScale(g)) }),
  },
  {
    id: 'col_food', text: { ru: 'Собрать {n} еды', en: 'Collect {n} food' }, minPop: 0, weight: 3, counter: 'col_food', tier: 1,
    gen: (g) => ({ target: round5(50 * popScale(g)) }),
  },
  {
    id: 'col_water', text: { ru: 'Собрать {n} воды', en: 'Collect {n} water' }, minPop: 0, weight: 3, counter: 'col_water', tier: 1,
    gen: (g) => ({ target: round5(50 * popScale(g)) }),
  },
  {
    id: 'rush_ok', text: { ru: 'Успешно ускорить комнаты: {n}', en: 'Successfully rush rooms: {n}' }, minPop: 0, weight: 2, counter: 'rush_ok', tier: 1,
    gen: () => ({ target: randi(2, 5) }),
  },
  {
    id: 'build', text: { ru: 'Построить комнаты: {n}', en: 'Build rooms: {n}' }, minPop: 0, weight: 2, counter: 'built', tier: 1,
    gen: () => ({ target: randi(1, 3) }),
  },
  {
    id: 'upgrade', text: { ru: 'Улучшить комнаты: {n}', en: 'Upgrade rooms: {n}' }, minPop: 8, weight: 2, counter: 'upgraded', tier: 2,
    gen: () => ({ target: randi(1, 3) }),
  },
  {
    id: 'pop', text: { ru: 'Население убежища: {n}', en: 'Reach a population of {n}' }, minPop: 0, weight: 2, tier: 2,
    state: (g) => g.population(),
    gen: (g) => ({ target: g.population() + randi(2, 5) }),
  },
  {
    id: 'happy', text: { ru: 'Настроение в убежище {n}%', en: 'Reach {n}% vault happiness' }, minPop: 6, weight: 2, tier: 2,
    state: (g) => Math.floor(g.happiness()),
    gen: (g) => ({ target: Math.min(95, Math.max(60, Math.floor(g.happiness() / 5) * 5 + 10)) }),
  },
  {
    id: 'perfect', text: { ru: 'Жители на подходящей работе: {n}', en: 'Dwellers in a perfect job: {n}' }, minPop: 6, weight: 2, tier: 1,
    state: (g) => g.perfectAssignments(),
    gen: (g) => ({ target: Math.min(g.population(), g.perfectAssignments() + randi(2, 4)) }),
  },
  {
    id: 'equip_w', text: { ru: 'Вооружить жителей: {n}', en: 'Equip weapons on {n} dwellers' }, minPop: 8, weight: 2, tier: 1,
    state: (g) => g.s.dwellers.filter((d) => d.weapon).length,
    gen: (g) => ({ target: Math.min(g.population(), g.s.dwellers.filter((d) => d.weapon).length + randi(1, 3)) }),
  },
  {
    id: 'equip_o', text: { ru: 'Одеть жителей в костюмы: {n}', en: 'Equip outfits on {n} dwellers' }, minPop: 8, weight: 2, tier: 1,
    state: (g) => g.s.dwellers.filter((d) => d.outfit).length,
    gen: (g) => ({ target: Math.min(g.population(), g.s.dwellers.filter((d) => d.outfit).length + randi(1, 3)) }),
  },
  {
    id: 'levelups', text: { ru: 'Повысить уровень жителей: {n} раз', en: 'Level up dwellers {n} times' }, minPop: 0, weight: 2, counter: 'levelups', tier: 1,
    gen: (g) => ({ target: randi(3, 6) + Math.floor(g.population() / 10) }),
  },
  {
    id: 'statups', text: { ru: 'Натренировать характеристики: {n}', en: 'Train stats {n} times' }, minPop: 24, weight: 2, counter: 'statups', tier: 2,
    gen: () => ({ target: randi(2, 5) }),
  },
  {
    id: 'babies', text: { ru: 'Малышей в убежище: +{n}', en: 'Babies born: {n}' }, minPop: 6, weight: 1.5, counter: 'babies', tier: 2,
    gen: () => ({ target: randi(1, 2) }),
  },
  {
    id: 'explore', text: { ru: 'Исследовать Пустошь: {n} мин', en: 'Explore the wasteland: {n} min' }, minPop: 6, weight: 2, counter: 'explore_min', tier: 2,
    gen: () => ({ target: randi(4, 12) * 5 }),
  },
  {
    id: 'waste_nuts', text: { ru: 'Найти в Пустоши гаек: {n}', en: 'Find {n} nuts in the wasteland' }, minPop: 6, weight: 1.5, counter: 'waste_nuts', tier: 2,
    gen: (g) => ({ target: round5(80 * popScale(g)) }),
  },
  {
    id: 'kills', text: { ru: 'Победить врагов: {n}', en: 'Defeat enemies: {n}' }, minPop: 10, weight: 1.5, counter: 'kills', tier: 2,
    gen: () => ({ target: randi(3, 8) }),
  },
  {
    id: 'fires', text: { ru: 'Потушить пожары: {n}', en: 'Put out fires: {n}' }, minPop: 8, weight: 1, counter: 'fires', tier: 2,
    gen: () => ({ target: randi(1, 2) }),
  },
  {
    id: 'crafted', text: { ru: 'Создать предметы: {n}', en: 'Craft items: {n}' }, minPop: 22, weight: 1.5, counter: 'crafted', tier: 2,
    gen: () => ({ target: randi(1, 3) }),
  },
  {
    id: 'sold', text: { ru: 'Продать предметы: {n}', en: 'Sell items: {n}' }, minPop: 10, weight: 1, counter: 'sold', tier: 1,
    gen: () => ({ target: randi(2, 5) }),
  },
  {
    id: 'heals', text: { ru: 'Вылечить жителей аптечками: {n}', en: 'Heal dwellers with medkits: {n}' }, minPop: 14, weight: 1, counter: 'heals', tier: 1,
    gen: () => ({ target: randi(1, 3) }),
  },
  {
    id: 'rooms_type', text: { ru: 'Комнат «{room}»: {n}', en: '"{room}" rooms: {n}' }, minPop: 0, weight: 2, tier: 2,
    state: (g, p) => g.s.rooms.filter((r) => r.type === p && r.buildLeft <= 0).reduce((a, r) => a + r.size, 0),
    gen: (g) => {
      const types = (['power', 'diner', 'water', 'living', 'storage', 'medbay', 'lab'] as RoomType[]).filter((t) => g.isUnlocked(t));
      const tp = pick(types);
      const cur = g.s.rooms.filter((r) => r.type === tp && r.buildLeft <= 0).reduce((a, r) => a + r.size, 0);
      return { target: cur + 1, param: tp };
    },
  },
  {
    id: 'merged', text: { ru: 'Объединить три комнаты в одну', en: 'Merge three rooms into one' }, minPop: 8, weight: 1, tier: 3,
    state: (g) => (g.s.rooms.some((r) => r.size >= 3) ? 1 : 0),
    gen: () => ({ target: 1 }),
  },
  {
    id: 'level_x', text: { ru: 'Жителей {p}+ уровня: {n}', en: 'Dwellers at level {p}+: {n}' }, minPop: 8, weight: 1.5, tier: 2,
    state: (g, p) => g.s.dwellers.filter((d) => d.level >= Number(p)).length,
    gen: (g) => {
      const lv = Math.max(3, Math.round(avgLevel(g) + randi(1, 3)));
      return { target: randi(1, 3), param: String(lv) };
    },
  },
  {
    id: 'cat', text: { ru: 'Поймать Кота Шрёдингера', en: "Catch Schrödinger's Cat" }, minPop: 8, weight: 0.7, counter: 'cat', tier: 3,
    gen: () => ({ target: 1 }),
  },
  {
    id: 'rocks', text: { ru: 'Расчистить породу: {n}', en: 'Clear rock formations: {n}' }, minPop: 6, weight: 1, counter: 'rocks', tier: 1,
    gen: () => ({ target: randi(1, 2) }),
  },
  {
    id: 'crates', text: { ru: 'Открыть ящики снабжения: {n}', en: 'Open supply crates: {n}' }, minPop: 4, weight: 0.7, counter: 'crates', tier: 1,
    gen: () => ({ target: 1 }),
  },
];

export const OBJ_BY_ID: Record<string, ObjDef> = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o]));

function round5(n: number) {
  return Math.max(5, Math.round(n / 5) * 5);
}

function avgLevel(g: Game) {
  const ds = g.s.dwellers;
  if (!ds.length) return 1;
  return ds.reduce((a, d) => a + d.level, 0) / ds.length;
}

export function objectiveText(o: Objective): string {
  const def = OBJ_BY_ID[o.def];
  if (!def) return '?';
  const room = o.param && (ROOMS as any)[o.param] ? L((ROOMS as any)[o.param].name) : '';
  return L(def.text, { n: o.target, room, p: o.param ?? '' });
}

export function objectiveProgress(g: Game, o: Objective): number {
  const def = OBJ_BY_ID[o.def];
  if (!def) return 0;
  if (def.state) return def.state(g, o.param);
  return (g.s.counters[def.counter!] ?? 0) - o.base;
}

export function makeObjective(g: Game, exclude: string[]): Objective {
  const pop = g.population();
  const pool = OBJECTIVES.filter((o) => o.minPop <= pop && !exclude.includes(o.id));
  const def = weighted(pool, (o) => o.weight);
  const { target, param } = def.gen(g);
  const base = def.counter ? g.s.counters[def.counter] ?? 0 : 0;
  return { def: def.id, target, base, param, reward: makeReward(g, def.tier) };
}

function makeReward(g: Game, tier: number): Reward {
  const pop = g.population();
  const r = Math.random();
  if (r < 0.14 + tier * 0.03) return { crate: 1 };
  if (r < 0.3) return { iso: randi(1, 2) + (tier >= 2 ? 1 : 0) };
  const base = 40 + pop * 6;
  return { nuts: Math.round((base * (0.7 + tier * 0.35) * (0.8 + Math.random() * 0.5)) / 5) * 5 };
}
