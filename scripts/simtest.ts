import { Game } from '../src/sim/game';
import { ROOMS } from '../src/data/rooms';

const s = Game.newState(111);
const g = new Game(s);
g.s.tutorial = 100;
const log = (...a: any[]) => console.log(...a);
const pw = g.build('power', 0, 4, true)!;
const di = g.build('diner', 0, 7, true)!;
const wa = g.build('water', 1, 4, true)!;
const lq = g.build('living', 1, 7, true)!;
const ds = g.waiting();
ds.forEach((d, i) => g.assign(d, [pw, pw, di, di, wa, wa][i]));
log('pop', g.population(), 'cap', g.capacity(), 'nuts', g.s.nuts);
log('rates', g.roomRate(pw).toFixed(3), g.roomRate(di).toFixed(3), g.roomRate(wa).toFixed(3), 'cycle s', (g.roomStore(pw)/g.roomRate(pw)).toFixed(0));
log('cons power/s', g.powerConsumption().toFixed(4), 'food/s', g.foodConsumption().toFixed(4));
let collected = 0;
for (let t = 0; t < 1800; t += 0.5) {
  g.tick(0.5);
  for (const r of g.s.rooms) if (r.ready) { g.collect(r); collected++; }
  for (const d of g.waiting()) { if (g.population() < g.capacity()) g.assign(d, lq); }
  if (t % 300 === 0) log(`t=${t}s pop=${g.population()} res=${Object.values(g.s.res).map(v=>v.toFixed(0)).join('/')} nuts=${Math.round(g.s.nuts)} happy=${g.happiness().toFixed(0)} lvl=${g.s.dwellers.map(d=>d.level).join(',')} babies=${g.s.counters.babies??0} obj=${g.s.objectives.map(o=>o.def).join(',')}`);
}
log('collected', collected, 'counters', JSON.stringify(g.s.counters));
const rep = g.simulateOffline(3*3600);
log('offline', JSON.stringify(rep));
const e = g.sendExplore(g.s.dwellers.find(d=>!d.child && d.room>0)!, 2, 1);
for (let t = 0; t < 1200; t += 1) g.tick(1);
log('exp', JSON.stringify(g.s.expeditions.map(x=>({el:x.elapsed, nuts:x.nuts, loot:x.loot.length, log:x.log.slice(-4).map(l=>l.text)})), null, 1));
