import { L, type Loc } from '../i18n';
import { S_END, S_STR } from '../data/stats';
import { chance, pick, rand, randi } from '../core/util';
import { effMaxHp, statTotal, weaponDamage } from './dwellers';
import type { Game } from './game';
import type { Dweller, IncidentKind, Room } from './types';

export const INCIDENT_NAMES: Record<IncidentKind, Loc> = {
  fire: { ru: 'Пожар', en: 'Fire' },
  bugs: { ru: 'Мутожуки', en: 'Mutant Bugs' },
  moles: { ru: 'Землерои', en: 'Burrowers' },
  raiders: { ru: 'Налётчики', en: 'Raiders' },
  spikes: { ru: 'Шипоспины', en: 'Spikebacks' },
};

const BASE_HP: Record<IncidentKind, number> = { fire: 30, bugs: 34, moles: 46, raiders: 70, spikes: 140 };
const BASE_DPS: Record<IncidentKind, number> = { fire: 1.1, bugs: 1.0, moles: 1.5, raiders: 1.8, spikes: 3.6 };
const MOVES: Record<IncidentKind, boolean> = { fire: false, bugs: false, moles: false, raiders: true, spikes: true };
const SPREAD_T = 28;
const MOVE_T = 22;

export function incidentPower(g: Game) {
  return 1 + g.population() / 22;
}

export function startIncident(g: Game, room: Room, kind: IncidentKind, power = incidentPower(g), visited: number[] = []): boolean {
  if (room.incident || room.buildLeft > 0) return false;
  if (room.type === 'elevator') return false;
  const hp = BASE_HP[kind] * room.size * power;
  room.incident = {
    kind,
    hp,
    maxHp: hp,
    count: kind === 'fire' ? 2 + room.size * 2 : kind === 'raiders' || kind === 'spikes' ? randi(2, 3) : 1 + room.size * 2,
    power,
    spreadT: 0,
    moveT: 0,
    visited: [...visited, room.id],
  };
  g.emit('incident', { room, kind });
  return true;
}

export function fighters(g: Game, room: Room): Dweller[] {
  return g.dwellersIn(room).filter((d) => !d.child && !d.ko && !d.babyAt && !d.exploring);
}

export function tickIncidents(g: Game, dt: number) {
  for (const room of g.s.rooms) {
    // Door breach phase for raiders is modelled on the door room itself.
    const inc = room.incident;
    if (!inc) continue;
    const fs = fighters(g, room);
    const robotDps = g.robotsOnFloor(room.floor).length * (inc.kind === 'fire' ? 6 : 4);
    let dps = robotDps;
    for (const d of fs) {
      const base = inc.kind === 'fire' ? 1.6 + statTotal(g.s, d, S_END) * 0.25 : weaponDamage(g.s, d) * 0.9 + statTotal(g.s, d, S_STR) * 0.12;
      dps += (base + d.level * 0.12) * (0.85 + Math.random() * 0.3);
    }
    // Door: raiders first have to break through the door
    if (room.type === 'door' && inc.kind === 'raiders' && room.doorHp > 0) {
      room.doorHp -= BASE_DPS.raiders * inc.power * inc.count * dt * 1.4;
      if (room.doorHp <= 0) {
        room.doorHp = 0;
        g.emit('toast', { text: L({ ru: 'Налётчики выбили ворота!', en: 'Raiders broke through the door!' }), kind: 'bad', icon: 'alert' });
      }
      continue;
    }
    inc.hp -= dps * dt;
    // enemies hit back
    if (fs.length) {
      const enemyDps = BASE_DPS[inc.kind] * inc.power * Math.max(1, inc.count * 0.6) * dt;
      for (let i = 0; i < fs.length; i++) {
        const d = fs[i];
        const armor = 1 - Math.min(0.6, statTotal(g.s, d, S_END) * 0.035);
        const dmg = (enemyDps / fs.length) * armor * (0.7 + Math.random() * 0.6);
        d.hp -= dmg;
        if (d.hp <= 0) g.knockOut(d);
      }
      for (const d of fs) d.morale = Math.max(0, d.morale - dt * 0.2);
    } else if (inc.kind === 'raiders') {
      // raiders steal nuts when unopposed
      const steal = Math.min(g.s.nuts, dt * 1.5 * inc.power);
      g.s.nuts -= steal;
    }
    if (inc.hp <= 0) {
      endIncident(g, room, fs);
      continue;
    }
    // spreading / moving
    inc.spreadT += dt * (fs.length ? 1 : 1.8);
    if (!MOVES[inc.kind] && inc.spreadT >= SPREAD_T) {
      inc.spreadT = 0;
      const nb = neighbours(g, room).filter((r) => !r.incident && r.type !== 'elevator' && r.buildLeft <= 0);
      if (nb.length) {
        const target = pick(nb);
        startIncident(g, target, inc.kind, inc.power);
      }
    }
    if (MOVES[inc.kind]) {
      inc.moveT += dt;
      if (inc.moveT >= MOVE_T && (fs.length === 0 || inc.moveT >= MOVE_T * 2)) {
        const nb = neighbours(g, room, true).filter((r) => !r.incident && !inc.visited.includes(r.id) && r.buildLeft <= 0);
        if (nb.length) {
          const target = nb.find((r) => r.type !== 'elevator') ?? nb[0];
          const moved = { ...inc, moveT: 0, visited: [...inc.visited, target.id] };
          room.incident = null;
          if (target.type === 'elevator') {
            // pass through elevator shafts instantly to the next room
            const next = neighbours(g, target, true).filter((r) => r.type !== 'elevator' && !r.incident && !moved.visited.includes(r.id));
            if (next.length) {
              const t2 = pick(next);
              t2.incident = { ...moved, visited: [...moved.visited, t2.id] };
              g.emit('incident', { room: t2, kind: inc.kind });
            } else {
              // nowhere to go: leave the vault
              g.emit('toast', { text: L({ ru: 'Незваные гости ушли, прихватив добычу.', en: 'The intruders left with some loot.' }), kind: 'bad', icon: 'alert' });
            }
          } else {
            target.incident = moved;
            g.emit('incident', { room: target, kind: inc.kind });
          }
        } else {
          inc.moveT = 0;
          if (inc.visited.length > 6) {
            room.incident = null;
            g.emit('toast', { text: L({ ru: 'Незваные гости ушли, прихватив добычу.', en: 'The intruders left with some loot.' }), kind: 'bad', icon: 'alert' });
          }
        }
      }
    }
  }
}

function neighbours(g: Game, room: Room, includeElevators = false): Room[] {
  const out: Room[] = [];
  const cells = g.roomCells(room);
  const left = g.roomAt(room.floor, room.col - 1);
  const right = g.roomAt(room.floor, room.col + cells);
  if (left) out.push(left);
  if (right) out.push(right);
  if (room.type === 'elevator' && includeElevators) {
    const up = g.roomAt(room.floor - 1, room.col);
    const dn = g.roomAt(room.floor + 1, room.col);
    if (up && up.type === 'elevator') out.push(up);
    if (dn && dn.type === 'elevator') out.push(dn);
  }
  return out.filter((r) => includeElevators || r.type !== 'elevator');
}

function endIncident(g: Game, room: Room, fs: Dweller[]) {
  const inc = room.incident!;
  room.incident = null;
  const reward = Math.round((8 + inc.maxHp * 0.25) * (0.8 + Math.random() * 0.4));
  g.s.nuts += reward;
  g.s.counters.nuts_earned = (g.s.counters.nuts_earned ?? 0) + reward;
  g.s.counters.incidents = (g.s.counters.incidents ?? 0) + 1;
  if (inc.kind === 'fire') g.s.counters.fires = (g.s.counters.fires ?? 0) + 1;
  else {
    g.s.counters.kills = (g.s.counters.kills ?? 0) + inc.count;
    if (inc.kind === 'bugs') g.s.counters.bugs = (g.s.counters.bugs ?? 0) + 1;
  }
  for (const d of fs) {
    g.giveXp(d, Math.round(15 + inc.maxHp * 0.15));
    d.morale = Math.min(20, d.morale + 6);
    if (inc.kind !== 'fire') d.kills += 1;
  }
  if (room.type === 'door' && room.doorHp <= 0) room.doorHp = g.doorMaxHp(room) * 0.5;
  g.emit('incident_end', { room, kind: inc.kind, reward });
}

/** Random vault events (live play only). */
export function randomIncident(g: Game) {
  const pop = g.population();
  const rooms = g.s.rooms.filter((r) => r.type !== 'elevator' && r.buildLeft <= 0 && !r.incident);
  if (!rooms.length) return;
  const options: { k: IncidentKind; w: number }[] = [
    { k: 'bugs', w: 3 },
    { k: 'fire', w: 1.2 },
  ];
  if (pop >= 12) options.push({ k: 'raiders', w: 3 });
  if (pop >= 28) options.push({ k: 'moles', w: 2 });
  if (pop >= 60) options.push({ k: 'spikes', w: 1.4 });
  let total = 0;
  for (const o of options) total += o.w;
  let r = Math.random() * total;
  let kind: IncidentKind = 'bugs';
  for (const o of options) {
    r -= o.w;
    if (r <= 0) {
      kind = o.k;
      break;
    }
  }
  if (kind === 'raiders' || kind === 'spikes') {
    const door = g.s.rooms.find((x) => x.type === 'door');
    if (door && !door.incident) {
      startIncident(g, door, kind);
      g.emit('toast', {
        text: kind === 'raiders'
          ? L({ ru: 'Налётчики у ворот! Отправьте бойцов!', en: 'Raiders at the door! Send fighters!' })
          : L({ ru: 'Шипоспины ломятся в ворота!', en: 'Spikebacks are breaking in!' }),
        kind: 'bad',
        icon: 'alert',
      });
    }
    return;
  }
  if (kind === 'moles') {
    // burrowers dig in from the edges of the vault
    const edge = rooms.filter((rm) => {
      const cells = g.roomCells(rm);
      return !g.roomAt(rm.floor, rm.col - 1) || !g.roomAt(rm.floor, rm.col + cells) || !g.roomAt(rm.floor + 1, rm.col);
    });
    const target = pick(edge.length ? edge : rooms);
    startIncident(g, target, 'moles');
    return;
  }
  const target = pick(rooms.filter((rm) => rm.type !== 'door'));
  if (target) startIncident(g, target, kind);
}

export function rushIncidentKind(g: Game): IncidentKind {
  const pop = g.population();
  if (pop >= 30 && chance(0.2)) return 'moles';
  return chance(0.55) ? 'fire' : 'bugs';
}

export function healthPct(d: Dweller) {
  return d.hp / effMaxHp(d);
}

export { rand };
