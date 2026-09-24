// Scripted playthrough of the tutorial, capturing screenshots.
import { chromium } from 'playwright-core';
const [w = '1400', h = '800', prefix = 'flow', lang = 'ru', dpr = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: +w < 700, isMobile: +w < 700 });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(`http://localhost:5173/?lang=${lang}`, { waitUntil: 'load' });
await page.waitForTimeout(2000);
const shot = async (n) => page.screenshot({ path: `/tmp/claude-0/-home-user-VaultShelter/fbf89165-0de1-59b2-89b9-70937b71ebd6/scratchpad/shots/${prefix}_${n}.png` });
const click = async (sel) => { const el = await page.$(sel); if (el) { await el.click({ force: true, timeout: 3000 }).catch(() => {}); return true; } return false; };
await shot('01_title');
await click('.title-actions .btn');
await page.waitForTimeout(600);
await shot('02_vaultpick');
await click('.modal-foot .btn.green');
await page.waitForTimeout(1500);
await shot('03_intro');
await page.waitForTimeout(2200);
await shot('04_tut0');
// Next, Next
for (let i = 0; i < 2; i++) { await click('.tut .acts .btn:last-child'); await page.waitForTimeout(700); }
await shot('05_tut2');
// build power
await click('[data-tut="build"]'); await page.waitForTimeout(700);
await shot('06_buildmenu');
await click('[data-tut="build-power"]'); await page.waitForTimeout(900);
await shot('07_placing');
// tap the first build spot via the app
const tapSpot = async () => { await page.waitForTimeout(700); return page.evaluate(() => { const a = window.__app; const W = innerWidth, H = innerHeight; for (const s of a.r.buildSpots) { const p = a.r.cam.toScreen(s.col*70+105, 46+s.floor*120+60); if (p.x > 20 && p.x < W-20 && p.y > 120 && p.y < H-120) return p; } const s = a.r.buildSpots[0]; return a.r.cam.toScreen(s.col*70+105, 46+s.floor*120+60); }); };
let p = await tapSpot();
await page.mouse.click(p.x, p.y); await page.waitForTimeout(800);
await shot('08_built');
// assign two strongest dwellers by opening the room panel then slots
const assign = async (type) => {
  const pos = await page.evaluate((type) => { const a = window.__app; const r = a.g.s.rooms.find(x=>x.type===type); if (!r) return {x:0,y:0}; a.r.focusRoom(r); return null; }, type) ?? await page.waitForTimeout(800).then(() => page.evaluate((type) => { const a = window.__app; const r = a.g.s.rooms.find(x=>x.type===type); return a.r.roomScreenCenter(r); }, type));
  await page.mouse.click(pos.x, pos.y); await page.waitForTimeout(500);
  for (let k = 0; k < 2; k++) {
    await click('[data-tut="slot"]'); await page.waitForTimeout(500);
    await click('.sheet .lrow'); await page.waitForTimeout(500);
  }
};
await assign('power');
await shot('09_assigned');
for (const tp of ['diner', 'water']) {
  await page.evaluate(() => window.__app.closePanels());
  await click('[data-tut="build"]'); await page.waitForTimeout(500);
  await click(`[data-tut="build-${tp}"]`); await page.waitForTimeout(600);
  p = await tapSpot(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(700);
  await assign(tp);
}
await page.evaluate(() => window.__app.closePanels());
await page.waitForTimeout(3000);
await shot('10_collect');
// collect
const bubble = await page.evaluate(() => { const a = window.__app; const r = a.g.s.rooms.find(x=>x.ready); if (!r) return null; const c = a.r.cam.toScreen(r.col*70 + 105*r.size, 46+r.floor*120+10); return {x:c.x, y:c.y+28}; });
if (bubble) { await page.mouse.click(bubble.x, bubble.y); await page.waitForTimeout(900); }
await shot('11_collected');
// rush
await page.evaluate(() => window.__app.closePanels());
{ const pos = await page.evaluate(() => { const a = window.__app; const r = a.g.s.rooms.find(x=>x.type==='diner'); a.r.focusRoom(r); return null; }); await page.waitForTimeout(800);
  const c = await page.evaluate(() => { const a = window.__app; const r = a.g.s.rooms.find(x=>x.type==='diner'); return a.r.roomScreenCenter(r); });
  await page.mouse.click(c.x, c.y + 20); await page.waitForTimeout(600); await shot('12_roompanel');
  await click('.tut-rush'); await page.waitForTimeout(900); await shot('13_rushed'); }
// living
await page.evaluate(() => window.__app.closePanels());
await click('[data-tut="build"]'); await page.waitForTimeout(500);
await click('[data-tut="build-living"]'); await page.waitForTimeout(600);
p = await tapSpot(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(4500);
await shot('14_living');
await click('[data-tut="crate"]'); await page.waitForTimeout(700);
await shot('15_crate');
await click('.crate-box'); await page.waitForTimeout(900);
for (let i = 0; i < 4; i++) { const cs = await page.$$('.pcard'); if (cs[i]) await cs[i].click(); await page.waitForTimeout(350); }
await page.waitForTimeout(700);
await shot('16_cards');
await click('.crate-scene .btn.green'); await page.waitForTimeout(800);
await shot('17_done');
await click('.tut .acts .btn:last-child'); await page.waitForTimeout(800);
await page.evaluate(() => { const a = window.__app; a.r.cam.focus(600, 400, a.r.cam.minZoom*1.4, 0.1); });
await page.waitForTimeout(1500);
await shot('18_overview');
console.log('tutorial step', await page.evaluate(() => window.__app.g.s.tutorial));
console.log([...new Set(logs)].slice(0, 20).join('\n'));
await browser.close();
