// Usage: node scripts/probe.mjs <url> <js-expression>
import { chromium } from 'playwright-core';
const [url, expr, wait = '2500'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
console.log(await page.evaluate(expr));
console.log([...new Set(logs)].slice(0, 20).join('\n'));
await browser.close();
