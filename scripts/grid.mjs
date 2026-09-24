// Usage: node scripts/grid.mjs <out.png> <cols> <cellW> <files...>  — composes screenshots into one image
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const [out, cols, cellW, ...files] = process.argv.slice(2);
const imgs = files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}" style="width:${cellW}px;display:block">`);
const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:4px">${imgs.join('')}</body>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +cols * (+cellW + 4), height: 400 } });
await page.setContent(html);
await page.waitForTimeout(200);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
