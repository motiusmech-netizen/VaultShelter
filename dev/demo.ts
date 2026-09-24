import { Game } from '../src/sim/game';
import type { RoomType } from '../src/data/rooms';

/** Builds a populated demo vault for visual testing. */
export function demoState(big = true) {
  const s = Game.newState(111);
  const g = new Game(s);
  g.s.nuts = 999999;
  g.s.counters.maxPop = 200;
  g.s.tutorial = 100;
  const place = (t: RoomType, f: number, c: number, n = 1, lvl = 1) => {
    for (let i = 0; i < n; i++) {
      const r = g.build(t, f, c + i * 3, true);
      if (r) { r.level = lvl; }
    }
  };
  place('power', 0, 4, 3, 2);
  place('elevator', 0, 13); place('diner', 0, 14, 2, 1); place('water', 0, 20, 2, 1);
  place('living', 1, 4, 3); place('elevator', 1, 13); place('storage', 1, 14, 1); place('medbay', 1, 17, 1); place('lab', 1, 20, 2);
  place('elevator', 2, 3); place('radio', 2, 4, 1); place('gym', 2, 7, 2); place('elevator', 2, 13); place('armory', 2, 14); place('fitness', 2, 17, 2, 3);
  if (big) {
    place('elevator', 3, 3); place('lounge', 3, 4); place('classroom', 3, 7); place('athletics', 3, 10); place('elevator', 3, 13); place('gameroom', 3, 14); place('reactor', 3, 17, 2);
    place('elevator', 4, 3); place('garden', 4, 4, 2); place('purifier', 4, 10); place('elevator', 4, 13); place('soda', 4, 14); place('dawn', 4, 17); place('weapons', 4, 20);
    place('elevator', 5, 3); place('outfits', 5, 4); place('office', 5, 7);
  }
  // admit & assign
  for (let i = 0; i < 40; i++) g.spawnArrival(true);
  for (const d of g.waiting()) g.admit(d);
  const rooms = g.s.rooms.filter((r) => r.type !== 'elevator' && r.type !== 'office');
  let k = 0;
  for (const d of g.s.dwellers) {
    for (let tries = 0; tries < rooms.length; tries++) {
      const r = rooms[(k++) % rooms.length];
      if (g.assign(d, r)) break;
    }
  }
  for (const r of g.s.rooms) if (r.type === 'diner' || r.type === 'lab') r.ready = true;
  g.s.robots.push({ id: g.uid(), floor: 0 });
  return s;
}
