// Usage: node scripts/ui.mjs <out.png> <w> <h> <query> [js-to-run-after-load] [wait] [dpr]
import { chromium } from 'playwright-core';
const [out, w = '1400', h = '860', q = 'demo=1', js = '', wait = '1200', dpr = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, isMobile: +w < 900, hasTouch: +w < 900 });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on('console', (m) => { if (m.type() === 'error') logs.push(`[console] ${m.text()}`); });
await page.goto(`http://localhost:5173/?${q}`, { waitUntil: 'load' });
await page.waitForTimeout(2200);
if (js) await page.evaluate(js);
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
if (logs.length) console.log([...new Set(logs)].filter((l) => !l.includes('404')).slice(0, 10).join('\n'));
await browser.close();
