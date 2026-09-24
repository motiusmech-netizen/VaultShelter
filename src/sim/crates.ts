import { JUNK, OUTFITS, PETS, WEAPONS, type Rarity } from '../data/items';
import { LEGENDS } from '../data/names';
import { pick, randi, weighted } from '../core/util';
import { randomItemDef } from './explore';
import type { Game } from './game';
import type { ResKey } from './types';

export type CardKind = 'nuts' | 'res' | 'junk' | 'weapon' | 'outfit' | 'dweller' | 'pet' | 'iso' | 'robot' | 'medkit' | 'antirad';

export interface Card {
  kind: CardKind;
  rarity: Rarity;
  amount?: number;
  def?: string;
  res?: ResKey;
  legend?: string;
  /** filled after apply: uid of created item / dweller id */
  ref?: number;
}

function cardOf(rarity: Rarity, g: Game): Card {
  const pop = g.population();
  if (rarity === 0) {
    const k = weighted(['nuts', 'res', 'junk', 'weapon', 'outfit', 'medkit', 'antirad'] as const, (x) =>
      ({ nuts: 5, res: 5, junk: 4, weapon: 3, outfit: 3, medkit: 1.2, antirad: 1 })[x],
    );
    switch (k) {
      case 'nuts':
        return { kind: 'nuts', rarity, amount: randi(5, 20) * 5 };
      case 'res':
        return { kind: 'res', rarity, res: pick(['power', 'food', 'water'] as ResKey[]), amount: randi(6, 20) * 5 };
      case 'junk':
        return { kind: 'junk', rarity, def: randomItemDef('junk', 0) };
      case 'weapon':
        return { kind: 'weapon', rarity, def: randomItemDef('weapon', 0) };
      case 'outfit':
        return { kind: 'outfit', rarity, def: randomItemDef('outfit', 0) };
      case 'medkit':
        return { kind: 'medkit', rarity, amount: randi(2, 4) };
      default:
        return { kind: 'antirad', rarity, amount: randi(2, 4) };
    }
  }
  if (rarity === 1) {
    const k = weighted(['nuts', 'weapon', 'outfit', 'dweller', 'pet', 'iso', 'junk'] as const, (x) =>
      ({ nuts: 4, weapon: 4, outfit: 4, dweller: pop >= 4 ? 2.2 : 0, pet: 1.6, iso: 2, junk: 2 })[x],
    );
    switch (k) {
      case 'nuts':
        return { kind: 'nuts', rarity, amount: randi(25, 60) * 10 };
      case 'weapon':
        return { kind: 'weapon', rarity, def: randomItemDef('weapon', 1) };
      case 'outfit':
        return { kind: 'outfit', rarity, def: randomItemDef('outfit', 1) };
      case 'dweller':
        return { kind: 'dweller', rarity };
      case 'pet':
        return { kind: 'pet', rarity, def: pick(PETS).id };
      case 'iso':
        return { kind: 'iso', rarity, amount: randi(3, 6) };
      default:
        return { kind: 'junk', rarity, def: randomItemDef('junk', 1) };
    }
  }
  const k = weighted(['legend', 'weapon', 'outfit', 'pet', 'robot', 'nuts', 'iso', 'junk'] as const, (x) =>
    ({ legend: 2.4, weapon: 3, outfit: 3, pet: 1.6, robot: g.s.robots.length < 10 ? 1.4 : 0, nuts: 1.5, iso: 1.5, junk: 1.2 })[x],
  );
  switch (k) {
    case 'legend': {
      const owned = new Set(g.s.dwellers.map((d) => d.legend).filter(Boolean));
      const avail = LEGENDS.filter((l) => !owned.has(l.id));
      if (avail.length) return { kind: 'dweller', rarity, legend: pick(avail).id };
      return { kind: 'weapon', rarity, def: randomItemDef('weapon', 2) };
    }
    case 'weapon':
      return { kind: 'weapon', rarity, def: randomItemDef('weapon', 2) };
    case 'outfit':
      return { kind: 'outfit', rarity, def: randomItemDef('outfit', 2) };
    case 'pet':
      return { kind: 'pet', rarity, def: pick(PETS).id };
    case 'robot':
      return { kind: 'robot', rarity };
    case 'nuts':
      return { kind: 'nuts', rarity, amount: randi(10, 25) * 100 };
    case 'iso':
      return { kind: 'iso', rarity, amount: randi(10, 20) };
    default:
      return { kind: 'junk', rarity, def: randomItemDef('junk', 2) };
  }
}

export function rollCrate(g: Game, guaranteedLegendary = false): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < 4; i++) {
    const r = Math.random();
    const rarity: Rarity = r < 0.08 ? 2 : r < 0.36 ? 1 : 0;
    cards.push(cardOf(rarity, g));
  }
  if (!cards.some((c) => c.rarity >= 1)) cards[3] = cardOf(1, g);
  if (guaranteedLegendary && !cards.some((c) => c.rarity === 2)) cards[3] = cardOf(2, g);
  // order: best card last for drama
  cards.sort((a, b) => a.rarity - b.rarity);
  return cards;
}

export { WEAPONS, OUTFITS, JUNK };
