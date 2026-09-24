import { L, type Loc } from '../i18n';
import { JUNK, OUTFITS, PETS, WEAPONS, type Rarity } from '../data/items';
import { S_AGI, S_END, S_LUC, S_PER, S_STR } from '../data/stats';
import {
  W_ENEMIES, W_FIGHT_EASY, W_FIGHT_WIN, W_FUN, W_GEAR, W_HEAL, W_JUNK, W_KO, W_NUTS, W_PET, W_PLACE, W_PLACES, W_RAD, W_RETURN, W_START,
} from '../data/wasteland';
import { chance, clamp, pick, rand, randi, weighted } from '../core/util';
import { dwellerName, effMaxHp, petBonus, statTotal, weaponDamage } from './dwellers';
import type { Game } from './game';
import type { Dweller, Expedition, Item, LogEntry } from './types';

export const MAX_LOOT = 60;

/** Fill a template with name/gender forms. */
export function fmtTpl(tpl: Loc, d: Dweller | null, params: Record<string, string | number> = {}): string {
  let s = L(tpl);
  s = s.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_m, a, b) => (d && d.gender === 'f' ? b : a));
  if (d) s = s.split('{name}').join(dwellerName(d));
  for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
  return s;
}

export function rollRarity(luck: number, depth: number): Rarity {
  const leg = 0.015 + luck * 0.003 + depth * 0.004;
  const rare = 0.14 + luck * 0.012 + depth * 0.02;
  const r = Math.random();
  if (r < leg) return 2;
  if (r < leg + rare) return 1;
  return 0;
}

export function randomItemDef(kind: 'weapon' | 'outfit' | 'junk', rarity: Rarity): string {
  const pool = kind === 'weapon' ? WEAPONS : kind === 'outfit' ? OUTFITS : JUNK;
  const list = pool.filter((x) => x.rarity === rarity);
  return pick(list.length ? list : pool).id;
}

export function startExpedition(g: Game, d: Dweller, medkits: number, antirads: number): Expedition {
  const e: Expedition = {
    dweller: d.id,
    elapsed: 0,
    next: rand(12, 20),
    returning: false,
    returnLeft: 0,
    returnTotal: 0,
    nuts: 0,
    loot: [],
    log: [],
    medkits,
    antirads,
    xp: 0,
    ko: false,
    kills: 0,
    done: false,
  };
  addLog(e, fmtTpl(pick(W_START), d), 'info');
  return e;
}

function addLog(e: Expedition, text: string, kind: LogEntry['kind']) {
  text = text.charAt(0).toUpperCase() + text.slice(1);
  e.log.push({ t: e.elapsed, text, kind });
  if (e.log.length > 80) e.log.splice(0, e.log.length - 80);
}

export function recallExpedition(g: Game, e: Expedition) {
  if (e.returning || e.done) return;
  const d = g.dweller(e.dweller);
  e.returning = true;
  const petRet = d ? petBonus(g.s, d, 'return') : 0;
  e.returnTotal = Math.max(8, Math.min(e.elapsed / 2, 60 * 60) * (1 - petRet / 100));
  e.returnLeft = e.returnTotal;
  if (d) addLog(e, fmtTpl(pick(W_RETURN), d), 'info');
}

export function tickExpedition(g: Game, e: Expedition, dt: number) {
  const d = g.dweller(e.dweller);
  if (!d) {
    e.done = true;
    return;
  }
  if (e.done) return;
  if (e.returning) {
    e.returnLeft -= dt;
    if (e.returnLeft <= 0) {
      e.returnLeft = 0;
      e.done = true;
    }
    return;
  }
  if (e.ko) return;
  e.elapsed += dt;
  g.s.counters.explore_sec = (g.s.counters.explore_sec ?? 0) + dt;
  g.s.counters.explore_min = Math.floor(g.s.counters.explore_sec / 60);
  e.next -= dt;
  let guard = 0;
  while (e.next <= 0 && !e.ko && guard++ < 50) {
    const agi = statTotal(g.s, d, S_AGI);
    e.next += rand(28, 50) * (1 - agi * 0.025);
    exploreEvent(g, e, d);
  }
}

function exploreEvent(g: Game, e: Expedition, d: Dweller) {
  const depth = 1 + e.elapsed / 900;
  const per = statTotal(g.s, d, S_PER);
  const luck = statTotal(g.s, d, S_LUC);
  const end = statTotal(g.s, d, S_END);
  const str = statTotal(g.s, d, S_STR);
  const lootBonus = 1 + petBonus(g.s, d, 'loot') / 100;
  const nutsBonus = 1 + petBonus(g.s, d, 'nuts') / 100;
  type Ev = 'nuts' | 'junk' | 'gear' | 'fight' | 'rad' | 'fun' | 'place' | 'pet';
  const evs: { k: Ev; w: number }[] = [
    { k: 'nuts', w: 30 + luck },
    { k: 'junk', w: (14 + per) * lootBonus },
    { k: 'gear', w: (4 + per * 0.5 + luck * 0.3) * lootBonus },
    { k: 'fight', w: 16 + depth * 2 },
    { k: 'rad', w: 7 + depth },
    { k: 'fun', w: 9 },
    { k: 'place', w: 2 + luck * 0.25 },
    { k: 'pet', w: 0.25 },
  ];
  const ev = weighted(evs, (x) => x.w).k;
  let xp = Math.round(rand(6, 14) * Math.sqrt(depth));

  switch (ev) {
    case 'nuts': {
      const n = Math.round(rand(4, 16) * (1 + luck * 0.08) * Math.sqrt(depth) * nutsBonus);
      e.nuts += n;
      g.s.counters.waste_nuts = (g.s.counters.waste_nuts ?? 0) + n;
      addLog(e, fmtTpl(pick(W_NUTS), d, { n }), 'loot');
      break;
    }
    case 'junk': {
      const it = lootItem(g, e, 'junk', rollRarity(luck, depth));
      if (it) addLog(e, fmtTpl(pick(W_JUNK), d, { item: g.itemName(it) }), 'loot');
      break;
    }
    case 'gear': {
      const kind = chance(0.55) ? 'weapon' : 'outfit';
      const it = lootItem(g, e, kind, rollRarity(luck, depth));
      if (it) addLog(e, fmtTpl(pick(W_GEAR), d, { item: g.itemName(it) }), it && g.itemRarity(it) > 0 ? 'great' : 'loot');
      break;
    }
    case 'fight': {
      const enemy = L(pick(W_ENEMIES));
      const enemyPow = rand(4, 9) * depth;
      const atk = weaponDamage(g.s, d) * 1.2 + d.level * 0.35 + str * 0.3;
      const ratio = atk / enemyPow;
      if (ratio > 2.2 && chance(0.6)) {
        addLog(e, fmtTpl(pick(W_FIGHT_EASY), d, { enemy }), 'fight');
      } else {
        const dmg = Math.max(1, Math.round(enemyPow * rand(0.5, 1.1) * (1 - Math.min(0.5, end * 0.035)) * clamp(1.4 - ratio * 0.3, 0.35, 1.4)));
        d.hp -= dmg;
        addLog(e, fmtTpl(pick(W_FIGHT_WIN), d, { enemy, n: dmg }), 'fight');
      }
      xp += Math.round(10 * depth);
      e.kills++;
      g.s.counters.kills = (g.s.counters.kills ?? 0) + 1;
      if (chance(0.35)) {
        const n = Math.round(rand(3, 10) * depth * nutsBonus);
        e.nuts += n;
        g.s.counters.waste_nuts = (g.s.counters.waste_nuts ?? 0) + n;
      }
      break;
    }
    case 'rad': {
      const n = Math.max(1, Math.round(rand(4, 12) * depth * (1 - end * 0.05)));
      d.rad = Math.min(d.maxHp * 0.95, d.rad + n);
      addLog(e, fmtTpl(pick(W_RAD), d, { n }), 'rad');
      break;
    }
    case 'fun': {
      addLog(e, fmtTpl(pick(W_FUN), d), 'fun');
      break;
    }
    case 'place': {
      const n = Math.round(rand(20, 45) * depth * (1 + luck * 0.05) * nutsBonus);
      e.nuts += n;
      g.s.counters.waste_nuts = (g.s.counters.waste_nuts ?? 0) + n;
      lootItem(g, e, chance(0.5) ? 'weapon' : 'outfit', rollRarity(luck + 3, depth + 1));
      addLog(e, fmtTpl(pick(W_PLACE), d, { place: L(pick(W_PLACES)), n }), 'great');
      xp += 20;
      break;
    }
    case 'pet': {
      const p = pick(PETS);
      const r = rollRarity(luck, depth);
      const it: Item = { uid: g.uid(), def: p.id, kind: 'pet', r };
      if (e.loot.length < MAX_LOOT) e.loot.push(it);
      addLog(e, fmtTpl(pick(W_PET), d, { item: L(p.name) }), 'great');
      break;
    }
  }
  e.xp += xp;
  g.giveXp(d, xp);

  // auto-heal
  const eff = effMaxHp(d);
  if (d.hp < eff * 0.4 && e.medkits > 0) {
    e.medkits--;
    d.hp = Math.min(eff, d.hp + Math.max(40, eff * 0.45));
    addLog(e, fmtTpl(W_HEAL[0], d), 'heal');
  }
  if (d.rad > d.maxHp * 0.35 && e.antirads > 0) {
    e.antirads--;
    d.rad = Math.max(0, d.rad - d.maxHp * 0.4);
    addLog(e, fmtTpl(W_HEAL[1], d), 'heal');
  }
  d.hp = Math.min(d.hp, effMaxHp(d));
  if (d.hp <= 0) {
    d.hp = 0;
    e.ko = true;
    addLog(e, fmtTpl(pick(W_KO), d), 'bad');
    g.emit('toast', { text: fmtTpl(pick(W_KO), d), kind: 'bad', icon: 'wasteland' });
  }
}

function lootItem(g: Game, e: Expedition, kind: 'weapon' | 'outfit' | 'junk', r: Rarity): Item | null {
  if (e.loot.length >= MAX_LOOT) return null;
  const it: Item = { uid: g.uid(), def: randomItemDef(kind, r), kind };
  e.loot.push(it);
  g.s.counters.waste_items = (g.s.counters.waste_items ?? 0) + 1;
  return it;
}

export function expeditionDepthLabel(e: Expedition) {
  return clamp(Math.floor(e.elapsed / 900) + 1, 1, 99);
}

export { randi };
