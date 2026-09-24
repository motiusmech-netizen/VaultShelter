import type { RoomType } from '../data/rooms';
import { makeCanvas, type Ctx } from './gfx';
import { paintAO, paintCeiling, paintFloor, paintLampLight, paintShell, paintSideWalls, paintWall, levelTrim, type FloorStyle, type WallSpec } from './roomBase';
import * as C from './roomArtCore';
import * as Md from './roomArtMed';
import * as Tc from './roomArtTech';
import * as Tr from './roomArtTrain';
import { shaftStatic } from './elevatorArt';
import { FLOOR_H } from './world';

interface Style {
  wall: WallSpec;
  floor: [FloorStyle, string, string?];
  lamp: string;
  light: number;
  lampStep?: number;
  shell?: string;
}

export const STYLES: Record<RoomType, Style> = {
  door: { wall: { style: 'panels', base: '#4a525b', band: '#ffb02e', trim: '#2f353c' }, floor: ['grate', '#3a424b'], lamp: '#ffe2b0', light: 0.34 },
  elevator: { wall: { style: 'panels', base: '#2e363f' }, floor: ['grate', '#3a424b'], lamp: '#ffe2b0', light: 0.2 },
  living: {
    wall: { style: 'wallpaper', base: '#ead7bd', alt: '#e1c6a3', lower: { style: 'wood', base: '#7a4f33', h: 22 }, trim: '#5a3a24' },
    floor: ['planks', '#9a6a45'],
    lamp: '#ffd7a0',
    light: 0.4,
  },
  power: { wall: { style: 'panels', base: '#3f4854', band: '#ffd23d', trim: '#2a2f36' }, floor: ['grate', '#2e353d'], lamp: '#fff0c0', light: 0.36 },
  diner: {
    wall: { style: 'tiles', base: '#f3ead8', alt: '#e9dcc2', lower: { style: 'tiles', base: '#d24a3f', alt: '#f4efe6', h: 28 }, trim: '#9aa3aa' },
    floor: ['checker', '#e9e4da', '#23272c'],
    lamp: '#ffe0a8',
    light: 0.42,
  },
  water: {
    wall: { style: 'tiles', base: '#cfe7ec', alt: '#b9dde4', lower: { style: 'panels', base: '#2b7f93', h: 18 }, trim: '#1f5f6f' },
    floor: ['tiles', '#7f9aa3'],
    lamp: '#e6fbff',
    light: 0.36,
  },
  storage: { wall: { style: 'concrete', base: '#8a8378', trim: '#4a453e' }, floor: ['concrete', '#6b655d'], lamp: '#ffe6b8', light: 0.36 },
  medbay: {
    wall: { style: 'tiles', base: '#eef3f2', alt: '#e2ebe9', lower: { style: 'tiles', base: '#8fd3c0', alt: '#7cc6b1', h: 16 }, trim: '#5fae98' },
    floor: ['tiles', '#c9d6d4'],
    lamp: '#f2fffb',
    light: 0.36,
  },
  lab: { wall: { style: 'panels', base: '#2e3d52', band: '#b58cff', trim: '#1c2533' }, floor: ['tiles', '#3a475a'], lamp: '#e6f0ff', light: 0.34 },
  office: {
    wall: { style: 'wallpaper', base: '#2f5a4a', alt: '#2a4f41', lower: { style: 'wood', base: '#6b4428', h: 26 }, trim: '#c9a24a' },
    floor: ['carpet', '#7a2e2e', '#9a4a3a'],
    lamp: '#ffd9a0',
    light: 0.4,
  },
  radio: { wall: { style: 'foam', base: '#3b2d52' }, floor: ['carpet', '#261f30', '#3a2f48'], lamp: '#ffc8e8', light: 0.3 },
  weapons: { wall: { style: 'concrete', base: '#6f6a63', trim: '#3f3b36' }, floor: ['concrete', '#57524b'], lamp: '#ffe6b8', light: 0.38 },
  outfits: {
    wall: { style: 'wallpaper', base: '#efc6c3', alt: '#e7b3ae', lower: { style: 'wood', base: '#8a5c3d', h: 18 }, trim: '#6b442b' },
    floor: ['planks', '#8a5c3d'],
    lamp: '#ffe0c8',
    light: 0.4,
  },
  gym: { wall: { style: 'panels', base: '#4a5560', band: '#c9463d' }, floor: ['rubber', '#2b2e33'], lamp: '#fff0d8', light: 0.38 },
  armory: { wall: { style: 'concrete', base: '#5c5a55', band: '#f2b632' }, floor: ['concrete', '#4b4843'], lamp: '#fff0c8', light: 0.34 },
  fitness: { wall: { style: 'tiles', base: '#dfe7ea', alt: '#d2dde1', band: '#2f7fb8' }, floor: ['rubber', '#2f4f6f'], lamp: '#f2fbff', light: 0.36 },
  lounge: {
    wall: { style: 'wallpaper', base: '#4b2a4f', alt: '#422446', lower: { style: 'wood', base: '#3a1f2a', h: 20 }, trim: '#c9a24a' },
    floor: ['carpet', '#6a2340', '#8a3a58'],
    lamp: '#ffb8e0',
    light: 0.3,
  },
  classroom: {
    wall: { style: 'wallpaper', base: '#cfe0c4', alt: '#c2d6b6', lower: { style: 'wood', base: '#7a5236', h: 22 }, trim: '#5a3a24' },
    floor: ['planks', '#a0724b'],
    lamp: '#fff4d8',
    light: 0.38,
  },
  athletics: { wall: { style: 'panels', base: '#e8dcc8', band: '#3a6fb0' }, floor: ['mats', '#3a6fb0', '#2f5d99'], lamp: '#fff8e8', light: 0.34 },
  gameroom: { wall: { style: 'panels', base: '#262236', band: '#ff5ab4', trim: '#1a1726' }, floor: ['carpet', '#1d1a2b', '#4a3a7a'], lamp: '#d8c8ff', light: 0.28 },
  reactor: { wall: { style: 'tech', base: '#22302a', alt: '#6aff8c' }, floor: ['grate', '#2a3230'], lamp: '#dfffe8', light: 0.3 },
  garden: { wall: { style: 'tiles', base: '#e9efe6', alt: '#dde6d8' }, floor: ['concrete', '#5b4a3a'], lamp: '#ffe8f8', light: 0.34, lampStep: 1000 },
  purifier: { wall: { style: 'tiles', base: '#a9d6de', alt: '#98ccd5', band: '#1f5f6f' }, floor: ['grate', '#4f6a73'], lamp: '#e6fbff', light: 0.34 },
  soda: {
    wall: { style: 'tiles', base: '#f3ead8', alt: '#eadcc0', lower: { style: 'tiles', base: '#d23b3b', alt: '#f4efe6', h: 30 }, trim: '#9aa3aa' },
    floor: ['tiles', '#a8a39a'],
    lamp: '#fff0e0',
    light: 0.4,
  },
  dawn: { wall: { style: 'tech', base: '#1a2233', alt: '#ffe27a' }, floor: ['polished', '#2a3345'], lamp: '#fff4c8', light: 0.3 },
};

function wallLightFactor(base: string) {
  const n = parseInt(base.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return Math.max(0.28, Math.min(1, 1.3 - lum * 1.05));
}

export function paintRoomStatic(ctx: Ctx, type: RoomType, size: number, level: number, w: number, nbL: boolean, nbR: boolean, lang: string, vault: number) {
  if (type === 'elevator') {
    shaftStatic(ctx, w);
    return;
  }
  const st = STYLES[type];
  paintShell(ctx, w, nbL, nbR, st.shell);
  paintWall(ctx, w, st.wall, type.length * 13 + size);
  paintSideWalls(ctx, w, st.wall, type === 'door' ? true : nbL, nbR);
  paintFloor(ctx, w, st.floor[0], st.floor[1], st.floor[2]);
  const lamps = paintCeiling(ctx, w, st.lamp, st.lampStep ?? 70);
  switch (type) {
    case 'door':
      C.doorStatic(ctx, w, level, vault);
      break;
    case 'power':
      C.powerStatic(ctx, w, size, level);
      break;
    case 'diner':
      C.dinerStatic(ctx, w, size, level, lang);
      break;
    case 'water':
      C.waterStatic(ctx, w, size, level);
      break;
    case 'living':
      C.livingStatic(ctx, w, size, level);
      break;
    case 'storage':
      C.storageStatic(ctx, w, size, level, lang);
      break;
    case 'medbay':
      Md.medbayStatic(ctx, w, size, level);
      break;
    case 'lab':
      Md.labStatic(ctx, w, size, level);
      break;
    case 'office':
      Md.officeStatic(ctx, w, size, level, lang);
      break;
    case 'radio':
      Md.radioStatic(ctx, w, size, level, lang);
      break;
    case 'soda':
      Md.sodaStatic(ctx, w, size, level, lang);
      break;
    case 'weapons':
      Tr.weaponsStatic(ctx, w, size, level, lang);
      break;
    case 'outfits':
      Tr.outfitsStatic(ctx, w, size, level, lang);
      break;
    case 'gym':
      Tr.gymStatic(ctx, w, size, level, lang);
      break;
    case 'armory':
      Tr.armoryStatic(ctx, w, size, level, lang);
      break;
    case 'fitness':
      Tr.fitnessStatic(ctx, w, size, level, lang);
      break;
    case 'lounge':
      Tr.loungeStatic(ctx, w, size, level, lang);
      break;
    case 'classroom':
      Tr.classroomStatic(ctx, w, size, level, lang);
      break;
    case 'athletics':
      Tr.athleticsStatic(ctx, w, size, level, lang);
      break;
    case 'gameroom':
      Tr.gameroomStatic(ctx, w, size, level, lang);
      break;
    case 'reactor':
      Tc.reactorStatic(ctx, w, size, level, lang);
      break;
    case 'garden':
      Tc.gardenStatic(ctx, w, size, level, lang);
      break;
    case 'purifier':
      Tc.purifierStatic(ctx, w, size, level, lang);
      break;
    case 'dawn':
      Tc.dawnStatic(ctx, w, size, level, lang);
      break;
  }
  paintLampLight(ctx, w, lamps, st.lamp, st.light * wallLightFactor(st.wall.base));
  paintAO(ctx, w);
  levelTrim(ctx, w, level);
}

export function paintRoomDynamic(ctx: Ctx, type: RoomType, size: number, level: number, w: number, t: number, active: boolean, lang: string) {
  switch (type) {
    case 'power':
      return C.powerDyn(ctx, w, size, level, t, active);
    case 'diner':
      return C.dinerDyn(ctx, w, size, level, t, active, lang);
    case 'water':
      return C.waterDyn(ctx, w, size, level, t, active);
    case 'living':
      return C.livingDyn(ctx, w, size, level, t, active);
    case 'medbay':
      return Md.medbayDyn(ctx, w, size, level, t, active);
    case 'lab':
      return Md.labDyn(ctx, w, size, level, t, active);
    case 'office':
      return Md.officeDyn(ctx, w, size, level, t, active);
    case 'radio':
      return Md.radioDyn(ctx, w, size, level, t, active, lang);
    case 'soda':
      return Md.sodaDyn(ctx, w, size, level, t, active, lang);
    case 'weapons':
      return Tr.weaponsDyn(ctx, w, size, level, t, active);
    case 'outfits':
      return Tr.outfitsDyn(ctx, w, size, level, t, active);
    case 'gym':
      return Tr.gymDyn(ctx, w, size, level, t, active);
    case 'armory':
      return Tr.armoryDyn(ctx, w, size, level, t, active);
    case 'fitness':
      return Tr.fitnessDyn(ctx, w, size, level, t, active);
    case 'lounge':
      return Tr.loungeDyn(ctx, w, size, level, t, active, lang);
    case 'athletics':
      return Tr.athleticsDyn(ctx, w, size, level, t, active);
    case 'gameroom':
      return Tr.gameroomDyn(ctx, w, size, level, t, active, lang);
    case 'reactor':
      return Tc.reactorDyn(ctx, w, size, level, t, active);
    case 'garden':
      return Tc.gardenDyn(ctx, w, size, level, t, active);
    case 'purifier':
      return Tc.purifierDyn(ctx, w, size, level, t, active);
    case 'dawn':
      return Tc.dawnDyn(ctx, w, size, level, t, active);
  }
}

// ------------------------------------------------------------------ cache
interface Entry {
  canvas: HTMLCanvasElement;
  scale: number;
  used: number;
  px: number;
}

export class RoomCache {
  private map = new Map<string, Entry>();
  private totalPx = 0;
  budget = 18_000_000;
  lang = 'ru';
  vault = 0;
  frame = 0;
  private builtThisFrame = 0;
  maxBuildsPerFrame = 4;

  beginFrame() {
    this.frame++;
    this.builtThisFrame = 0;
  }

  clear() {
    this.map.clear();
    this.totalPx = 0;
  }

  get(type: RoomType, size: number, level: number, w: number, nbL: boolean, nbR: boolean, wantScale: number): Entry | null {
    const scales = [0.5, 1, 1.5, 2, 3];
    let scale = scales.find((s) => s >= wantScale) ?? 3;
    const baseKey = `${type}|${size}|${level}|${nbL ? 1 : 0}${nbR ? 1 : 0}`;
    const key = `${baseKey}|${scale}`;
    let e = this.map.get(key);
    if (e) {
      e.used = this.frame;
      return e;
    }
    if (this.builtThisFrame >= this.maxBuildsPerFrame) {
      // fall back to any existing scale for this room
      let best: Entry | null = null;
      for (const s of scales) {
        const alt = this.map.get(`${baseKey}|${s}`);
        if (alt && (!best || Math.abs(s - scale) < Math.abs(best.scale - scale))) best = alt;
      }
      if (best) {
        best.used = this.frame;
        return best;
      }
      if (this.builtThisFrame >= this.maxBuildsPerFrame + 6) return null;
      scale = 0.5;
    }
    this.builtThisFrame++;
    const [c, ctx] = makeCanvas(w * scale, FLOOR_H * scale);
    ctx.scale(scale, scale);
    paintRoomStatic(ctx, type, size, level, w, nbL, nbR, this.lang, this.vault);
    e = { canvas: c, scale, used: this.frame, px: c.width * c.height };
    this.map.set(`${baseKey}|${scale}`, e);
    this.totalPx += e.px;
    this.evict();
    return e;
  }

  private evict() {
    if (this.totalPx <= this.budget) return;
    const entries = [...this.map.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, e] of entries) {
      if (this.totalPx <= this.budget * 0.8) break;
      if (e.used === this.frame) continue;
      this.map.delete(k);
      this.totalPx -= e.px;
    }
  }
}

export { C as artCore };
