import { ROOMS } from '../data/rooms';
import type { Room } from '../sim/types';
import { COLS, FLOORS } from '../sim/types';

export const CELL_W = 70;
export const FLOOR_H = 120;
/** y of the top of floor 0 */
export const VAULT_Y0 = 46;
export const GROUND_Y = 0;

/** Interior metrics relative to a room's top-left corner. */
export const SHELL = 4;
/** front edge of the ceiling plane */
export const CEIL_FRONT = 9;
/** back wall vertical range */
export const WALL_TOP = 19;
export const WALL_BOTTOM = 97;
/** front edge of the floor plane */
export const FLOOR_FRONT = 111;
/** horizontal depth of the perspective side walls */
export const SIDE_D = 10;
export const FEET_Y = 104.5;

export const WORLD_W = COLS * CELL_W;
export const WORLD_H = VAULT_Y0 + FLOORS * FLOOR_H;

export function roomX(r: Room) {
  return r.col * CELL_W;
}
export function roomY(r: Room) {
  return floorY(r.floor);
}
export function floorY(f: number) {
  return VAULT_Y0 + f * FLOOR_H;
}
export function roomW(r: Room) {
  return ROOMS[r.type].cells * r.size * CELL_W;
}
export function cellAt(wx: number, wy: number): { floor: number; col: number } | null {
  const col = Math.floor(wx / CELL_W);
  const floor = Math.floor((wy - VAULT_Y0) / FLOOR_H);
  if (col < 0 || col >= COLS || floor < 0 || floor >= FLOORS) return null;
  return { floor, col };
}
