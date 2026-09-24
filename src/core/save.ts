import { Game, SAVE_VERSION } from '../sim/game';
import type { GameState } from '../sim/types';
import { platform } from '../platform/sdk';

const KEY = 'atomhome_shelter_save_v1';

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch { /* storage may be unavailable */ }
}
function lsDel(key: string) {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function migrate(s: any): GameState | null {
  if (!s || typeof s !== 'object' || !Array.isArray(s.rooms) || !Array.isArray(s.dwellers)) return null;
  const base = Game.newState(s.vault ?? 111);
  const out: any = { ...base, ...s };
  out.res = { ...base.res, ...(s.res ?? {}) };
  out.counters = { ...(s.counters ?? {}) };
  out.flags = { ...(s.flags ?? {}) };
  out.adCd = { ...(s.adCd ?? {}) };
  out.missionCd = { ...(s.missionCd ?? {}) };
  out.settings = { ...base.settings, ...(s.settings ?? {}) };
  out.dawn = { stage: s.dawn?.stage ?? 0, donated: { ...(s.dawn?.donated ?? {}) } };
  out.daily = { ...base.daily, ...(s.daily ?? {}) };
  out.expeditions = Array.isArray(s.expeditions) ? s.expeditions : [];
  out.missions = Array.isArray(s.missions) ? s.missions : [];
  out.robots = Array.isArray(s.robots) ? s.robots : [];
  out.rocks = Array.isArray(s.rocks) ? s.rocks : base.rocks;
  out.items = Array.isArray(s.items) ? s.items : [];
  out.objectives = Array.isArray(s.objectives) ? s.objectives : [];
  for (const d of out.dwellers) {
    d.kills ??= 0;
    d.lvlPending ??= 0;
    d.parents ??= [];
    d.morale ??= 0;
    d.trainProg ??= 0;
    d.look = { face: 0, glasses: false, beard: 0, ...(d.look ?? {}) };
  }
  for (const r of out.rooms) {
    r.rush ??= 0;
    r.powered ??= true;
    r.doorHp ??= 0;
    r.craft ??= null;
    r.incident ??= null;
    r.buildLeft ??= 0;
    r.buildTotal ??= 0;
  }
  out.v = SAVE_VERSION;
  return out as GameState;
}

export class SaveManager {
  lastLocal = 0;

  async load(): Promise<GameState | null> {
    let local: GameState | null = null;
    const raw = lsGet(KEY);
    if (raw) {
      try {
        local = migrate(JSON.parse(raw));
      } catch {
        local = null;
      }
    }
    let cloud: GameState | null = null;
    try {
      const c = await platform.cloudLoad();
      if (c) cloud = migrate(typeof c === 'string' ? JSON.parse(c) : c);
    } catch {
      cloud = null;
    }
    if (local && cloud) return (cloud.realLast ?? 0) > (local.realLast ?? 0) ? cloud : local;
    return local ?? cloud;
  }

  save(s: GameState, immediate = false) {
    s.realLast = Date.now();
    let json: string;
    try {
      json = JSON.stringify(s);
    } catch {
      return;
    }
    lsSet(KEY, json);
    this.lastLocal = Date.now();
    platform.cloudSave(json, immediate);
  }

  wipe() {
    lsDel(KEY);
    platform.cloudSave('', true);
  }
}
