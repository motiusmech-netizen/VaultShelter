// Measures average frame time of the demo vault at several zoom levels.
import { chromium } from 'playwright-core';
const [w = '1280', h = '720'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto('http://localhost:5173/?demo=1', { waitUntil: 'load' });
await page.waitForTimeout(2500);
for (const [x, y, z] of [[400, 300, 1.6], [900, 700, 0.8], [900, 1400, 0.4], [-300, 60, 1.2]]) {
  const r = await page.evaluate(async ([x, y, z]) => {
    const a = window.__app;
    a.r.cam.focus(x, y, z, 0.01);
    await new Promise((res) => setTimeout(res, 800));
    const times = [];
    const orig = a.r.frame.bind(a.r);
    a.r.frame = (dt) => { const t0 = performance.now(); orig(dt); times.push(performance.now() - t0); };
    await new Promise((res) => setTimeout(res, 2500));
    a.r.frame = orig;
    times.sort((p, q) => p - q);
    return { n: times.length, avg: (times.reduce((s, v) => s + v, 0) / times.length).toFixed(2), p95: times[Math.floor(times.length * 0.95)]?.toFixed(2) };
  }, [x, y, z]);
  console.log(`zoom ${z} @ (${x},${y}):`, JSON.stringify(r));
}
await browser.close();
