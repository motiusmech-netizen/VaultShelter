// Usage: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs] [dpr]
import { chromium } from 'playwright-core';
const [url, out, w = '1400', h = '900', wait = '800', dpr = '1'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(url, { waitUntil: 'load' });
try { await page.waitForFunction(() => window.__done === true, null, { timeout: 15000 }); } catch {}
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: true });
if (logs.length) console.log([...new Set(logs)].slice(0, 20).join('\n'));
await browser.close();
