import { hashStr, mulberry32 } from '../core/util';
import { JUNK, OUTFITS, WEAPONS, type Rarity } from './items';

export interface Recipe {
  def: string;
  kind: 'weapon' | 'outfit';
  rarity: Rarity;
  nuts: number;
  junk: string[];
  time: number;
  level: number;
}

function junkFor(id: string, rarity: Rarity): string[] {
  const rnd = mulberry32(hashStr(id));
  const pickR = (r: Rarity) => {
    const pool = JUNK.filter((j) => j.rarity === r);
    return pool[Math.floor(rnd() * pool.length)].id;
  };
  if (rarity === 0) return [pickR(0), pickR(0)];
  if (rarity === 1) return [pickR(0), pickR(0), pickR(1)];
  return [pickR(0), pickR(1), pickR(1), pickR(2)];
}

export const RECIPES: Recipe[] = [
  ...WEAPONS.map((w) => ({
    def: w.id,
    kind: 'weapon' as const,
    rarity: w.rarity,
    nuts: [40, 260, 1400][w.rarity] + (w.dmg[0] + w.dmg[1]) * 5,
    junk: junkFor(w.id, w.rarity),
    time: [70, 300, 900][w.rarity],
    level: w.rarity + 1,
  })),
  ...OUTFITS.filter((o) => o.id !== 'o_granny').map((o) => ({
    def: o.id,
    kind: 'outfit' as const,
    rarity: o.rarity,
    nuts: [50, 300, 1500][o.rarity] + o.bonus.reduce((a, c) => a + c, 0) * 15,
    junk: junkFor(o.id, o.rarity),
    time: [80, 330, 960][o.rarity],
    level: o.rarity + 1,
  })),
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.def, r]));
