// Usage: node scripts/zoomshot.mjs <out> <wx> <wy> <zoom> [w] [h] [query]
import { chromium } from 'playwright-core';
const [out, wx, wy, zoom, w = '1600', h = '900', q = 'demo=1', dpr = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(`http://localhost:5173/?${q}`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.evaluate(([x, y, z]) => { const a = window.__app; a.r.cam.focus(+x, +y, +z, 0.01); }, [wx, wy, zoom]);
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log([...new Set(logs)].slice(0, 10).join('\n'));
await browser.close();
