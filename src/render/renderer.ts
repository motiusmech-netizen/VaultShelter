import { ROOMS, type RoomType } from '../data/rooms';
import { PET_BY_ID } from '../data/items';
import { clamp, rand } from '../core/util';
import type { Game } from '../sim/game';
import type { Dweller, Room } from '../sim/types';
import { itemByUid } from '../sim/dwellers';
import { Actors, outfitOf, type Actor } from './actors';
import { Background, RAMP_X0 } from './background';
import { Camera } from './camera';
import { drawCharacter, drawCharacterLOD, DEFAULT_POSE } from './dwellerArt';
import { Effects, drawHeart } from './effects';
import { box, fillRR, glow, hazard, rgba, rrect, type Ctx } from './gfx';
import { RoomCache, paintRoomDynamic } from './roomArt';
import { drawVaultDoorDisc } from './roomArt1';
import { doorDyn, elevatorDyn } from './roomArtCore';
import { drawBug, drawCat, drawFlames, drawMole, drawPet, drawRaider, drawRobot, drawSpikeback } from './creatures';
import { CELL_W, FEET_Y, FLOOR_FRONT, FLOOR_H, WALL_TOP, floorY, roomW, roomX, roomY, VAULT_Y0 } from './world';
import { iconImage } from '../ui/icons';
import { getLang } from '../i18n';

export type Hit =
  | { kind: 'bubble'; room: Room }
  | { kind: 'craft'; room: Room }
  | { kind: 'dweller'; d: Dweller }
  | { kind: 'room'; room: Room }
  | { kind: 'rock'; id: number }
  | { kind: 'cat' }
  | { kind: 'spot'; floor: number; col: number }
  | { kind: 'robot'; id: number }
  | null;

interface RobotActor {
  x: number;
  y: number;
  tx: number;
  floor: number;
  dir: number;
  busy: number;
}

const PRODUCE_ICON: Record<string, string> = {
  power: 'power',
  food: 'food',
  water: 'water',
  medkit: 'medkit',
  antirad: 'antirad',
  dawn: 'dawn',
  foodwater: 'food',
  radio: 'dweller',
};

export class Renderer {
  ctx: Ctx;
  cam = new Camera();
  bg = new Background();
  cache = new RoomCache();
  actors: Actors;
  fx = new Effects();
  t = 0;
  selectedRoom: number | null = null;
  selectedDweller: number | null = null;
  buildType: RoomType | null = null;
  buildSpots: { floor: number; col: number }[] = [];
  highlight: { x: number; y: number; w: number; h: number } | null = null;
  robotPick = false;
  drag: { id: number; wx: number; wy: number } | null = null;
  hudTarget: (kind: string) => { x: number; y: number } | null = () => null;
  doorAnim = 0;
  robots = new Map<number, RobotActor>();
  quality = 1;
  shake = 0;
  private dpr = 1;

  constructor(public canvas: HTMLCanvasElement, public g: Game) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.actors = new Actors(g);
    this.cache.lang = getLang();
    this.cache.vault = g.s.vault;
  }

  setGame(g: Game) {
    this.g = g;
    this.actors = new Actors(g);
    this.cache.clear();
    this.cache.vault = g.s.vault;
    this.robots.clear();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality >= 1 ? 2 : 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.cam.resize(w, h, this.dpr);
  }

  // ------------------------------------------------------------------ frame
  frame(dt: number) {
    this.t += dt;
    this.cam.update(dt);
    this.actors.update(dt);
    this.fx.quality = this.quality;
    this.fx.update(dt);
    this.updateRobots(dt);
    this.updateDoor(dt);
    this.spawnAmbientFx(dt);
    this.draw();
  }

  private updateDoor(dt: number) {
    let open = 0;
    for (const a of this.actors.map.values()) {
      if (a.mode === 'walk' && a.x > -70 && a.x < 40 && (a.floor <= 0)) open = 1;
    }
    const door = this.g.s.rooms.find((r) => r.type === 'door');
    if (door?.incident && door.doorHp <= 0) open = 1;
    this.doorAnim += (open - this.doorAnim) * Math.min(1, dt * (open ? 3 : 1.6));
  }

  private updateRobots(dt: number) {
    const alive = new Set<number>();
    for (const rb of this.g.s.robots) {
      alive.add(rb.id);
      let ra = this.robots.get(rb.id);
      const door = this.g.s.rooms.find((r) => r.type === 'door')!;
      const floor = rb.floor >= 0 ? rb.floor : 0;
      if (!ra) {
        const x = rb.floor >= 0 ? this.floorCenter(rb.floor) : roomX(door) + 150;
        ra = { x, y: floorY(floor) + 55, tx: x, floor, dir: 1, busy: 0 };
        this.robots.set(rb.id, ra);
      }
      if (ra.floor !== floor) {
        ra.floor = floor;
        ra.tx = rb.floor >= 0 ? this.floorCenter(floor) : roomX(door) + 150;
      }
      ra.busy = Math.max(0, ra.busy - dt);
      const dx = ra.tx - ra.x;
      if (Math.abs(dx) > 1) {
        ra.x += Math.sign(dx) * Math.min(Math.abs(dx), 90 * dt);
        ra.dir = Math.sign(dx);
      } else if (Math.random() < dt * 0.3 && rb.floor >= 0) {
        const rooms = this.g.s.rooms.filter((r) => r.floor === floor && r.type !== 'elevator');
        if (rooms.length) {
          const r = rooms[Math.floor(Math.random() * rooms.length)];
          ra.tx = roomX(r) + rand(20, roomW(r) - 20);
        }
      }
      const ty = floorY(floor) + 58;
      ra.y += (ty - ra.y) * Math.min(1, dt * 3);
    }
    for (const id of [...this.robots.keys()]) if (!alive.has(id)) this.robots.delete(id);
  }

  robotGoTo(id: number, room: Room) {
    const ra = this.robots.get(id);
    if (ra) {
      ra.tx = roomX(room) + roomW(room) / 2;
      ra.busy = 1;
    }
  }

  private floorCenter(f: number) {
    const rooms = this.g.s.rooms.filter((r) => r.floor === f);
    if (!rooms.length) return 300;
    const r = rooms[Math.floor(rooms.length / 2)];
    return roomX(r) + roomW(r) / 2;
  }

  private spawnAmbientFx(dt: number) {
    const v = this.cam.viewRect();
    for (const r of this.g.s.rooms) {
      const x = roomX(r);
      const y = roomY(r);
      const w = roomW(r);
      if (x > v.r || x + w < v.l || y > v.b || y + FLOOR_H < v.t) continue;
      if (r.incident?.kind === 'fire') {
        if (Math.random() < dt * 14) this.fx.emit('flame', x + rand(10, w - 10), y + FEET_Y - rand(0, 10), 1);
        if (Math.random() < dt * 5) this.fx.emit('smoke', x + rand(10, w - 10), y + WALL_TOP + 20, 1);
        if (Math.random() < dt * 6) this.fx.emit('ember', x + rand(10, w - 10), y + FEET_Y - 10, 1);
      }
      if (r.buildLeft > 0 && r.buildTotal > 2.3) {
        if (Math.random() < dt * 10) this.fx.emit('spark', x + rand(10, w - 10), y + rand(30, 90), 2);
        if (Math.random() < dt * 3) this.fx.emit('dust', x + rand(10, w - 10), y + FEET_Y, 1);
      }
    }
    for (const rk of this.g.s.rocks) {
      if (rk.clearing > 0 && Math.random() < dt * 12) {
        this.fx.emit('dust', rk.col * CELL_W + rand(0, rk.w * CELL_W), floorY(rk.floor) + rand(20, 100), 2);
      }
    }
    // romance hearts
    for (const d of this.g.s.dwellers) {
      if (d.partner && d.romance > 0.2 && d.gender === 'f') {
        const a = this.actors.get(d.id);
        if (a && Math.random() < dt * 1.5) this.fx.emit('heart', a.x, a.y - 44, 1);
      }
      if (d.ko) {
        const a = this.actors.get(d.id);
        if (a && Math.random() < dt * 0.8) this.fx.emit('zzz', a.x + 6, a.y - 12, 1);
      }
    }
  }

  // ------------------------------------------------------------------ drawing
  private draw() {
    const ctx = this.ctx;
    const cam = this.cam;
    const g = this.g;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, cam.W, cam.H);
    const dayPhase = ((g.s.time / 720 + 0.33) % 1 + 1) % 1;
    this.bg.lang = this.cache.lang;
    const st = { dayPhase, dawn: g.s.dawn.stage, time: this.t };
    const horizon = cam.toScreen(0, 0).y;
    if (horizon > 0) this.bg.drawSky(ctx, cam.W, cam.H, horizon, st);

    // world transform
    let sx = 0;
    let sy = 0;
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - 1 / 60);
      sx = rand(-3, 3) * this.shake;
      sy = rand(-3, 3) * this.shake;
    }
    const z = cam.zoom;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (cam.W / 2 - cam.x * z + sx), dpr * (cam.H / 2 - cam.y * z + sy));
    const v = cam.viewRect();
    if (v.t < 20) this.bg.drawLandscape(ctx, cam.x, st, v.l, v.r);
    this.bg.drawGround(ctx, st, v.l, v.r, v.t, v.b);

    // visible rooms
    const rooms = g.s.rooms.filter((r) => {
      const x = roomX(r);
      const y = roomY(r);
      return x < v.r + 20 && x + roomW(r) > v.l - 20 && y < v.b + 20 && y + FLOOR_H > v.t - 20;
    });
    this.bg.drawExcavation(ctx, rooms.map((r) => ({ x: roomX(r), y: roomY(r), w: roomW(r), h: FLOOR_H })));

    // rocks
    for (const rk of g.s.rocks) {
      const x = rk.col * CELL_W;
      const y = floorY(rk.floor);
      if (x > v.r || x + rk.w * CELL_W < v.l || y > v.b || y + FLOOR_H < v.t) continue;
      const e = this.bg.rockCanvas(rk);
      const shakeX = rk.clearing > 0 ? rand(-1.5, 1.5) : 0;
      ctx.globalAlpha = rk.clearing > 0 ? clamp(rk.clearing / 3, 0.2, 1) : 1;
      ctx.drawImage(e.canvas, x + e.x + shakeX, y + e.y, e.canvas.width / 2, e.canvas.height / 2);
      ctx.globalAlpha = 1;
    }

    this.cache.beginFrame();
    const want = Math.min(3, z * dpr * (this.quality >= 1 ? 1 : 0.7));
    for (const r of rooms) this.drawRoom(r, want);

    // characters sorted
    this.drawActors(v);
    // robots
    for (const ra of this.robots.values()) {
      if (ra.x < v.l - 30 || ra.x > v.r + 30 || ra.y < v.t - 40 || ra.y > v.b + 40) continue;
      ctx.save();
      ctx.translate(ra.x, ra.y);
      ctx.scale(0.9, 0.9);
      drawRobot(ctx, this.t, ra.dir, ra.busy > 0);
      ctx.restore();
    }
    // cat
    if (g.catRoom) {
      const r = g.catRoom;
      const cx = roomX(r) + roomW(r) * 0.72;
      const cy = roomY(r) + FEET_Y;
      ctx.save();
      ctx.translate(cx, cy);
      drawCat(ctx, this.t);
      ctx.restore();
    }
    this.fx.drawWorld(ctx);

    // build spots
    if (this.buildType) this.drawBuildSpots();
    if (this.highlight) {
      const h = this.highlight;
      const p = 0.5 + 0.5 * Math.sin(this.t * 5);
      ctx.strokeStyle = rgba('#ffcf4a', 0.6 + p * 0.4);
      ctx.lineWidth = 3 / z;
      rrect(ctx, h.x - 3, h.y - 3, h.w + 6, h.h + 6, 6);
      ctx.stroke();
    }
    // selection
    if (this.selectedRoom != null) {
      const r = g.room(this.selectedRoom);
      if (r) {
        ctx.strokeStyle = rgba('#ffcf4a', 0.75 + 0.25 * Math.sin(this.t * 4));
        ctx.lineWidth = Math.max(1.6, 2.4 / z);
        rrect(ctx, roomX(r) + 1, roomY(r) + 1, roomW(r) - 2, FLOOR_H - 2, 4);
        ctx.stroke();
      }
    }
    if (this.robotPick) {
      for (const r of rooms) {
        ctx.fillStyle = rgba('#6aff8c', 0.08 + 0.05 * Math.sin(this.t * 4));
        ctx.fillRect(roomX(r), roomY(r), roomW(r), FLOOR_H);
      }
    }
    // drag target highlight
    if (this.drag) {
      const target = this.roomAtWorld(this.drag.wx, this.drag.wy);
      const d = g.dweller(this.drag.id);
      if (target && d) {
        const ok = g.canAssign(d, target) || g.dwellersIn(target).length > 0;
        ctx.fillStyle = rgba(ok ? '#6aff8c' : '#ff5a4a', 0.16);
        ctx.fillRect(roomX(target), roomY(target), roomW(target), FLOOR_H);
        ctx.strokeStyle = rgba(ok ? '#6aff8c' : '#ff5a4a', 0.9);
        ctx.lineWidth = 2 / z;
        ctx.strokeRect(roomX(target) + 1, roomY(target) + 1, roomW(target) - 2, FLOOR_H - 2);
      }
      if (d) {
        ctx.save();
        ctx.translate(this.drag.wx, this.drag.wy + 24);
        const sw = Math.sin(this.t * 6) * 0.3;
        drawCharacter(ctx, d.look, outfitOf(g, d), { ...DEFAULT_POSE, armA: 2.6 + sw * 0.4, armB: 2.6 - sw * 0.4, legA: sw, legB: -sw, mouth: 'open', eyes: 'wide', child: d.child }, d.gender);
        ctx.restore();
      }
    }

    // screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawScreenOverlays(rooms);
    this.fx.drawScreen(ctx, (x, y) => this.cam.toScreen(x, y));
    this.fx.drawFlyers(ctx);
  }

  private drawRoom(r: Room, want: number) {
    const ctx = this.ctx;
    const g = this.g;
    const x = roomX(r);
    const y = roomY(r);
    const w = roomW(r);
    const nbL = !!g.roomAt(r.floor, r.col - 1);
    const nbR = !!g.roomAt(r.floor, r.col + g.roomCells(r));
    const building = r.buildLeft > 0 && r.buildTotal > 2.3;
    const e = this.cache.get(r.type, r.size, r.level, w, nbL, nbR, want);
    if (e) ctx.drawImage(e.canvas, x, y, w, FLOOR_H);
    const active = g.isActive(r) && (ROOMS[r.type].category === 'train' || !!ROOMS[r.type].craft ? g.workers(r).length > 0 : true) && (!ROOMS[r.type].produce || (!r.ready && g.workers(r).length > 0) || r.type === 'living');
    ctx.save();
    ctx.translate(x, y);
    if (r.type === 'elevator') {
      elevatorDyn(ctx, w, r.floor + 1, this.t, this.actors.elevatorBusy(r));
    } else if (r.type === 'door') {
      // light from outside when open
      if (this.doorAnim > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, 30, 70, 60, '#ffe2b0', 0.35 * this.doorAnim);
        ctx.restore();
      }
      doorDyn(ctx, w, this.t, !!r.incident);
      const rot = this.doorAnim * 1.4;
      drawVaultDoorDisc(ctx, 46 + this.doorAnim * 52, 58 - this.doorAnim * 2, 36, rot, g.s.vault, r.level);
      // door hp bar during raids
      if (r.incident) {
        const k = r.doorHp / g.doorMaxHp(r);
        fillRR(ctx, 14, 20, 60, 4, 2, 'rgba(0,0,0,0.6)');
        fillRR(ctx, 14, 20, 60 * clamp(k, 0, 1), 4, 2, '#ffb02e');
      }
    } else if (!building) {
      paintRoomDynamic(ctx, r.type, r.size, r.level, w, this.t, active && !r.incident, getLang());
    }
    // unpowered overlay
    if (!r.powered && g.needsPower(r) && !building) {
      ctx.fillStyle = 'rgba(4,6,12,0.62)';
      ctx.fillRect(4, 9, w - 8, FLOOR_FRONT - 9);
      const blink = Math.sin(this.t * 3) > 0;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 14, 18, 40, '#ff2a1a', blink ? 0.35 : 0.12);
      glow(ctx, w - 14, 18, 40, '#ff2a1a', blink ? 0.12 : 0.35);
      ctx.restore();
    }
    // incident overlays
    if (r.incident) {
      const inc = r.incident;
      const alarm = 0.5 + 0.5 * Math.sin(this.t * 6);
      ctx.fillStyle = rgba('#ff2a1a', 0.1 + alarm * 0.12);
      ctx.fillRect(4, 9, w - 8, FLOOR_FRONT - 9);
      if (inc.kind === 'fire') drawFlames(ctx, 8, w - 16, FEET_Y + 2, this.t, clamp(inc.hp / inc.maxHp + 0.3, 0.4, 1.3));
      else this.drawEnemies(r, w);
      // hazard lamp
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, w / 2 + Math.cos(this.t * 5) * (w / 3), 14, 50, '#ff3a1a', 0.3);
      ctx.restore();
    }
    // construction
    if (building) {
      const k = 1 - r.buildLeft / r.buildTotal;
      ctx.fillStyle = 'rgba(16,18,22,0.72)';
      ctx.fillRect(4, 9, w - 8, FLOOR_FRONT - 9);
      // scaffolding
      ctx.strokeStyle = '#c9a24a';
      ctx.lineWidth = 1.6;
      for (let sxx = 14; sxx < w - 10; sxx += 34) {
        ctx.beginPath();
        ctx.moveTo(sxx, 14);
        ctx.lineTo(sxx, FEET_Y + 4);
        ctx.stroke();
      }
      for (let syy = 30; syy < FEET_Y; syy += 26) {
        ctx.beginPath();
        ctx.moveTo(10, syy);
        ctx.lineTo(w - 10, syy);
        ctx.stroke();
        ctx.lineWidth = 0.8;
        for (let sxx = 14; sxx < w - 44; sxx += 34) {
          ctx.beginPath();
          ctx.moveTo(sxx, syy);
          ctx.lineTo(sxx + 34, syy + 26);
          ctx.stroke();
        }
        ctx.lineWidth = 1.6;
      }
      hazard(ctx, 6, FEET_Y - 2, w - 12, 4, '#f2b632', '#26282b', 5);
      // progress
      fillRR(ctx, w / 2 - 40, 56, 80, 8, 4, 'rgba(0,0,0,0.7)');
      fillRR(ctx, w / 2 - 38, 58, 76 * k, 4, 2, '#ffcf4a');
    } else if (r.buildLeft > 0) {
      // upgrade flash
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#ffe27a', 0.3 * (r.buildLeft / r.buildTotal));
      ctx.fillRect(4, 9, w - 8, FLOOR_FRONT - 9);
      ctx.restore();
    }
    ctx.restore();
  }

  private enemyPos(r: Room, i: number, n: number, w: number): number {
    const inc = r.incident!;
    const moving = inc.kind === 'bugs' || inc.kind === 'moles';
    const base = w * (0.55 + (0.4 * (i + 0.5)) / n);
    if (moving) return clamp(base + Math.sin(this.t * (1.2 + i * 0.3) + i * 2) * 26, 16, w - 16);
    return base;
  }

  private drawEnemies(r: Room, w: number) {
    const ctx = this.ctx;
    const inc = r.incident!;
    const n = Math.min(6, inc.count);
    if (r.type === 'door' && inc.kind === 'raiders' && r.doorHp > 0) return;
    for (let i = 0; i < n; i++) {
      const ex = this.enemyPos(r, i, n, w);
      ctx.save();
      ctx.translate(ex, FEET_Y);
      const facing = -1;
      switch (inc.kind) {
        case 'bugs': {
          const dirx = Math.cos(this.t * (1.2 + i * 0.3) + i * 2) >= 0 ? 1 : -1;
          ctx.scale(dirx, 1);
          drawBug(ctx, this.t, i);
          break;
        }
        case 'moles':
          ctx.scale(facing, 1);
          drawMole(ctx, this.t, i);
          break;
        case 'raiders':
          drawRaider(ctx, i, this.t, facing, true);
          break;
        case 'spikes':
          ctx.scale(facing * 0.9, 0.9);
          drawSpikeback(ctx, this.t, i);
          break;
      }
      ctx.restore();
      if (Math.random() < 0.02) this.fx.emit('spark', roomX(r) + ex, roomY(r) + FEET_Y - 14, 3);
    }
    // enemy HP bar
    const k = inc.hp / inc.maxHp;
    fillRR(ctx, w - 70, 18, 60, 4, 2, 'rgba(0,0,0,0.6)');
    fillRR(ctx, w - 70, 18, 60 * clamp(k, 0, 1), 4, 2, '#ff4a3a');
  }

  private drawActors(v: { l: number; r: number; t: number; b: number }) {
    const ctx = this.ctx;
    const g = this.g;
    const lod = this.cam.zoom * this.dpr < 0.55;
    const list: { d: Dweller; a: Actor }[] = [];
    for (const d of g.s.dwellers) {
      const a = this.actors.get(d.id);
      if (!a || a.mode === 'hidden' || a.dragged) continue;
      if (this.drag && this.drag.id === d.id) continue;
      if (a.x < v.l - 30 || a.x > v.r + 30 || a.y < v.t - 10 || a.y > v.b + 60) continue;
      list.push({ d, a });
    }
    list.sort((p, q) => p.a.y - q.a.y || p.a.x - q.a.x);
    // elevator cabins behind riders
    for (const { a } of list) {
      if (a.mode !== 'ride') continue;
      const cx = Math.floor(a.x / CELL_W) * CELL_W;
      const top = a.y - FEET_Y;
      box(ctx, cx + 6, top + 12, CELL_W - 12, FEET_Y - 8, '#3a434d', 3);
      ctx.fillStyle = 'rgba(255,226,170,0.18)';
      ctx.fillRect(cx + 9, top + 16, CELL_W - 18, FEET_Y - 18);
      ctx.fillStyle = '#ffb02e';
      ctx.fillRect(cx + 6, top + FEET_Y + 2, CELL_W - 12, 2);
    }
    for (const { d, a } of list) {
      const r = d.room > 0 ? g.room(d.room) : undefined;
      // face enemies during incidents
      if (r?.incident && a.mode === 'idle' && r.incident.kind !== 'fire') {
        const w = roomW(r);
        const n = Math.min(6, r.incident.count);
        let best = roomX(r) + this.enemyPos(r, 0, n, w);
        for (let i = 1; i < n; i++) {
          const ex = roomX(r) + this.enemyPos(r, i, n, w);
          if (Math.abs(ex - a.x) < Math.abs(best - a.x)) best = ex;
        }
        a.dir = best >= a.x ? 1 : -1;
        a.fightT -= 1 / 60;
        if (a.fightT <= 0) {
          a.fightT = rand(0.35, 0.8);
          a.flash = 0.08;
          if (Math.random() < 0.6) this.fx.emit('spark', best + rand(-4, 4), a.y - 16 + rand(-6, 6), 2);
        }
      } else if (r?.incident?.kind === 'fire' && a.mode === 'idle') {
        a.dir = a.x < roomX(r) + roomW(r) / 2 ? 1 : -1;
        if (Math.random() < 0.3) this.fx.emit('smoke', a.x + a.dir * 16, a.y - 14, 1, { color: '#ffffff' });
      } else if (r?.type === 'door' && a.mode === 'idle') {
        a.dir = -1;
      } else if (d.partner && a.mode === 'idle') {
        const p = this.actors.get(d.partner);
        if (p) a.dir = p.x >= a.x ? 1 : -1;
      }
      const { pose, ko } = this.actors.pose(d, a, this.t);
      ctx.save();
      ctx.translate(a.x, a.y);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 0, d.child ? 5 : 8, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (ko) {
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-4, -2);
      }
      if (pose.view === 'side' && a.dir < 0) ctx.scale(-1, 1);
      if (lod) drawCharacterLOD(ctx, d.look, outfitOf(g, d), d.child);
      else drawCharacter(ctx, d.look, outfitOf(g, d), pose, d.gender);
      ctx.restore();
      // pet follows
      if (d.pet && !lod) {
        const it = itemByUid(g.s, d.pet);
        const pd = it ? PET_BY_ID[it.def] : null;
        if (pd) {
          ctx.save();
          ctx.translate(a.x - a.dir * 14, a.y);
          if (a.dir < 0) ctx.scale(-1, 1);
          ctx.scale(0.9, 0.9);
          drawPet(ctx, pd.species, pd.color, pd.color2, this.t + a.seed, a.mode === 'walk');
          ctx.restore();
        }
      }
    }
  }

  private drawBuildSpots() {
    const ctx = this.ctx;
    const cells = this.buildType ? ROOMS[this.buildType].cells : 3;
    const p = 0.5 + 0.5 * Math.sin(this.t * 4);
    for (const s of this.buildSpots) {
      const x = s.col * CELL_W;
      const y = floorY(s.floor);
      const w = cells * CELL_W;
      ctx.fillStyle = rgba('#6aff8c', 0.1 + p * 0.08);
      rrect(ctx, x + 3, y + 3, w - 6, FLOOR_H - 6, 6);
      ctx.fill();
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -this.t * 20;
      ctx.strokeStyle = rgba('#8dffa8', 0.85);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba('#e8ffe8', 0.9);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 10, y + FLOOR_H / 2);
      ctx.lineTo(x + w / 2 + 10, y + FLOOR_H / 2);
      ctx.moveTo(x + w / 2, y + FLOOR_H / 2 - 10);
      ctx.lineTo(x + w / 2, y + FLOOR_H / 2 + 10);
      ctx.stroke();
    }
  }

  private drawScreenOverlays(rooms: Room[]) {
    const ctx = this.ctx;
    const g = this.g;
    const z = this.cam.zoom;
    const t = this.t;
    // build spot cost labels
    if (this.buildType && z > 0.35) {
      const cost = this.buildType;
      for (const s of this.buildSpots) {
        const cells = ROOMS[cost].cells;
        const c = g.buildCost(cost, s.floor);
        const p = this.cam.toScreen(s.col * CELL_W + (cells * CELL_W) / 2, floorY(s.floor) + FLOOR_H / 2 + 26);
        this.pill(ctx, p.x, p.y, String(c), 'nuts', g.s.nuts >= c ? '#fff4c8' : '#ff8a7a');
      }
    }
    for (const r of rooms) {
      const def = ROOMS[r.type];
      const x = roomX(r);
      const y = roomY(r);
      const w = roomW(r);
      const top = this.cam.toScreen(x + w / 2, y + 10);
      // production progress bar along the ceiling
      if (def.produce && r.buildLeft <= 0 && z > 0.3) {
        const store = g.roomStore(r);
        const k = clamp(r.prog / store, 0, 1);
        const a = this.cam.toScreen(x + 10, y + 11.5);
        const b = this.cam.toScreen(x + w - 10, y + 11.5);
        const bw = b.x - a.x;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(a.x, a.y - 2, bw, 4);
        ctx.fillStyle = def.accent;
        ctx.fillRect(a.x, a.y - 2, bw * k, 4);
      }
      if (r.ready && def.produce && def.produce !== 'radio') {
        const bob = Math.sin(t * 4 + r.id) * 3;
        this.bubble(ctx, top.x, top.y + 28 + bob, PRODUCE_ICON[def.produce] ?? 'star', def.accent);
      }
      if (r.craft?.done) {
        const bob = Math.sin(t * 4 + r.id) * 3;
        this.bubble(ctx, top.x, top.y + 28 + bob, r.craft.kind === 'weapon' ? 'weapon' : 'outfit', '#ffcf4a');
      }
      if (r.incident) {
        const p = this.cam.toScreen(x + w / 2, y);
        const img = iconImage('alert');
        const s = 26 + Math.sin(t * 8) * 3;
        if (img) ctx.drawImage(img, p.x - s / 2, p.y - s / 2 + 8, s, s);
      }
    }
    // dweller overlays: level up arrows, chat bubbles, ko hearts
    for (const d of g.s.dwellers) {
      const a = this.actors.get(d.id);
      if (!a || a.mode === 'hidden') continue;
      const head = this.cam.toScreen(a.x, a.y - (d.child ? 34 : 50));
      if (head.x < -40 || head.x > this.cam.W + 40 || head.y < -40 || head.y > this.cam.H + 40) continue;
      if (d.lvlPending > 0 && !d.ko) {
        const img = iconImage('levelup');
        const s = Math.max(18, Math.min(30, 26 * z));
        if (img) ctx.drawImage(img, head.x - s / 2, head.y - s - 2 + Math.sin(t * 5 + d.id) * 3, s, s);
      } else if (d.ko) {
        const img = iconImage('heart');
        if (img) ctx.drawImage(img, head.x - 11, head.y + 8 + Math.sin(t * 3) * 2, 22, 22);
      } else if (d.babyAt && z > 0.6) {
        const img = iconImage('baby');
        if (img) ctx.drawImage(img, head.x - 9, head.y - 14, 18, 18);
      }
      if (a.bubbleT > 0 && a.bubble && z > 0.45) this.speech(ctx, head.x, head.y - 8, a.bubble, Math.min(1, a.bubbleT * 2));
      // training progress
      const r = d.room > 0 ? g.room(d.room) : undefined;
      if (r && ROOMS[r.type].category === 'train' && z > 0.7 && a.mode === 'idle' && !d.child) {
        const st = ROOMS[r.type].train!;
        const bw = 26;
        const p = this.cam.toScreen(a.x, a.y + 4);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(p.x - bw / 2, p.y, bw, 4);
        ctx.fillStyle = d.stats[st] >= 10 ? '#ffcf4a' : ROOM_TRAIN_COLOR[st];
        ctx.fillRect(p.x - bw / 2, p.y, bw * (d.stats[st] >= 10 ? 1 : d.trainProg), 4);
      }
      if (this.selectedDweller === d.id) {
        const p = this.cam.toScreen(a.x, a.y);
        ctx.strokeStyle = rgba('#ffcf4a', 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 16 * Math.max(0.6, z), 5 * Math.max(0.6, z), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private bubble(ctx: Ctx, x: number, y: number, icon: string, color: string) {
    const r = 21;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const gr = ctx.createLinearGradient(0, y - r, 0, y + r);
    gr.addColorStop(0, '#fffaf0');
    gr.addColorStop(1, '#e9dcc4');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();
    // tail
    ctx.fillStyle = '#e9dcc4';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + r - 3);
    ctx.lineTo(x, y + r + 7);
    ctx.lineTo(x + 6, y + r - 3);
    ctx.fill();
    const img = iconImage(icon);
    if (img) ctx.drawImage(img, x - 14, y - 14, 28, 28);
  }

  private pill(ctx: Ctx, x: number, y: number, text: string, icon: string, color: string) {
    ctx.font = '700 13px Rubik, sans-serif';
    const tw = ctx.measureText(text).width;
    const w = tw + 30;
    fillRR(ctx, x - w / 2, y - 12, w, 24, 12, 'rgba(12,16,22,0.85)');
    const img = iconImage(icon);
    if (img) ctx.drawImage(img, x - w / 2 + 5, y - 9, 18, 18);
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x - w / 2 + 25, y + 1);
  }

  private speech(ctx: Ctx, x: number, y: number, text: string, a: number) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '500 12px Rubik, sans-serif';
    const tw = Math.min(200, ctx.measureText(text).width);
    const w = tw + 16;
    const h = 24;
    fillRR(ctx, x - w / 2, y - h, w, h, 10, 'rgba(255,250,240,0.95)');
    ctx.fillStyle = 'rgba(255,250,240,0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 1);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 5, y - 1);
    ctx.fill();
    ctx.fillStyle = '#2a2320';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - h / 2, 200);
    ctx.restore();
  }

  // ------------------------------------------------------------------ hit testing
  roomAtWorld(wx: number, wy: number): Room | undefined {
    const col = Math.floor(wx / CELL_W);
    const floor = Math.floor((wy - VAULT_Y0) / FLOOR_H);
    return this.g.roomAt(floor, col);
  }

  hitTest(sx: number, sy: number): Hit {
    const g = this.g;
    const w = this.cam.toWorld(sx, sy);
    // bubbles
    for (const r of g.s.rooms) {
      const def = ROOMS[r.type];
      const readyRes = r.ready && def.produce && def.produce !== 'radio';
      const readyCraft = r.craft?.done;
      if (!readyRes && !readyCraft) continue;
      const top = this.cam.toScreen(roomX(r) + roomW(r) / 2, roomY(r) + 10);
      const by = top.y + 28;
      if (Math.hypot(sx - top.x, sy - by) < 30) return readyRes ? { kind: 'bubble', room: r } : { kind: 'craft', room: r };
    }
    // cat
    if (g.catRoom) {
      const r = g.catRoom;
      const c = this.cam.toScreen(roomX(r) + roomW(r) * 0.72, roomY(r) + FEET_Y - 12);
      if (Math.hypot(sx - c.x, sy - c.y) < Math.max(28, 22 * this.cam.zoom)) return { kind: 'cat' };
    }
    if (this.buildType) {
      const cells = ROOMS[this.buildType].cells;
      for (const s of this.buildSpots) {
        const x = s.col * CELL_W;
        const y = floorY(s.floor);
        if (w.x >= x && w.x <= x + cells * CELL_W && w.y >= y && w.y <= y + FLOOR_H) return { kind: 'spot', floor: s.floor, col: s.col };
      }
    }
    // dwellers (closest to pointer)
    let best: Dweller | null = null;
    let bestD = 1e9;
    const zoom = this.cam.zoom;
    const tol = Math.max(8, 14 / zoom);
    for (const d of g.s.dwellers) {
      const a = this.actors.get(d.id);
      if (!a || a.mode === 'hidden') continue;
      const h = d.child ? 30 : 44;
      const cx = a.x;
      const cy = a.y - h / 2;
      const dx = Math.abs(w.x - cx);
      const dy = Math.abs(w.y - cy);
      if (dx < tol && dy < h / 2 + 4) {
        const dist = dx + dy * 0.3;
        if (dist < bestD) {
          bestD = dist;
          best = d;
        }
      }
    }
    if (best) return { kind: 'dweller', d: best };
    for (const [id, ra] of this.robots) {
      if (Math.hypot(w.x - ra.x, w.y - ra.y) < 14) return { kind: 'robot', id };
    }
    const room = this.roomAtWorld(w.x, w.y);
    if (room) return { kind: 'room', room };
    for (const rk of g.s.rocks) {
      const x = rk.col * CELL_W;
      const y = floorY(rk.floor);
      if (w.x >= x && w.x <= x + rk.w * CELL_W && w.y >= y && w.y <= y + FLOOR_H) return { kind: 'rock', id: rk.id };
    }
    return null;
  }

  // ------------------------------------------------------------------ helpers for UI
  roomScreenCenter(r: Room) {
    return this.cam.toScreen(roomX(r) + roomW(r) / 2, roomY(r) + FLOOR_H / 2);
  }

  focusRoom(r: Room, zoom?: number) {
    const targetZoom = zoom ?? clamp(Math.min(this.cam.W / (roomW(r) + 80), 2.2), this.cam.minZoom, 2.4);
    this.cam.focus(roomX(r) + roomW(r) / 2, roomY(r) + FLOOR_H / 2 + 30 / targetZoom, targetZoom);
  }

  focusDweller(d: Dweller) {
    const a = this.actors.get(d.id);
    if (!a) return;
    this.cam.focus(a.x, a.y - 30, Math.max(this.cam.zoom, 1.6));
  }

  onChatter(d: Dweller, text: string) {
    const a = this.actors.get(d.id);
    if (!a || a.mode === 'hidden') return;
    a.bubble = text;
    a.bubbleT = 3.5;
  }

  celebrateRoom(r: Room) {
    for (const d of this.g.dwellersIn(r)) {
      const a = this.actors.get(d.id);
      if (a && a.mode === 'idle') a.celebrate = 1.4;
    }
  }

  exitX() {
    return RAMP_X0 - 140;
  }
}

const ROOM_TRAIN_COLOR = ['#ff6a4d', '#39c6e8', '#62d17a', '#ff7cc0', '#7f95ff', '#ffc23d', '#b6e04a'];
export { drawHeart };
