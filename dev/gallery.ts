import '../src/ui/fonts';
import { paintRoomStatic, paintRoomDynamic } from '../src/render/roomArt';
import { ROOMS, type RoomType } from '../src/data/rooms';
import { FLOOR_H, CELL_W } from '../src/render/world';
import { drawVaultDoorDisc } from '../src/render/roomArt1';
import { doorDyn, elevatorDyn } from '../src/render/roomArtCore';

const params = new URLSearchParams(location.search);
const scale = Number(params.get('scale') || 2);
const only = params.get('types');
const types = (only ? only.split(',') : Object.keys(ROOMS)) as RoomType[];
const size = Number(params.get('size') || 1);
const level = Number(params.get('level') || 1);
const c = document.getElementById('c') as HTMLCanvasElement;
const cols = Number(params.get('cols') || 3);
const w = ROOMS.power.cells * CELL_W * size;
c.width = cols * (w + 10) * scale;
c.height = Math.ceil(types.length / cols) * (FLOOR_H + 10) * scale;
const ctx = c.getContext('2d')!;
document.fonts.load('700 10px Oswald').then(() => document.fonts.load('700 10px Unbounded')).then(() => {
  types.forEach((t, i) => {
    const x = (i % cols) * (w + 10);
    const y = Math.floor(i / cols) * (FLOOR_H + 10);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(x, y);
    const rw = t === 'elevator' ? CELL_W : ROOMS[t].cells * CELL_W * (t === 'door' ? 1 : size);
    paintRoomStatic(ctx, t, t === 'door' ? 1 : size, level, rw, true, true, 'ru', 111);
    paintRoomDynamic(ctx, t, size, level, rw, 3.3, true, 'ru');
    if (t === 'door') {
      doorDyn(ctx, rw, 3.3, false);
      drawVaultDoorDisc(ctx, 46, 58, 36, 0, 111, level);
    }
    if (t === 'elevator') elevatorDyn(ctx, rw, 3, 3.3, true);
    ctx.restore();
  });
  (window as any).__done = true;
});
