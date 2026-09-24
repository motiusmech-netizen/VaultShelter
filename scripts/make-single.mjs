// Builds the game as ONE self-contained HTML file (JS, CSS and fonts inlined) for hosts that
// accept a single page, e.g. a shareable web preview. Output: release/atomhome-single.html
import { build } from 'vite';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const outDir = join(root, 'dist-single');
await build({
  root,
  logLevel: 'warn',
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false },
});

const assets = join(outDir, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const html = readFileSync(join(outDir, 'index.html'), 'utf8');

const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const headStyle = html.match(/<style>[\s\S]*?<\/style>/)[0];
const body = html
  .match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/<script[^>]*src=[^>]*><\/script>/g, '')
  .trim();

const page = [
  title,
  '<meta name="theme-color" content="#0b0e12" />',
  headStyle,
  `<style>\n${css}\n</style>`,
  body,
  `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`,
  '',
].join('\n');

mkdirSync(join(root, 'release'), { recursive: true });
const out = join(root, 'release', 'atomhome-single.html');
writeFileSync(out, page);
rmSync(outDir, { recursive: true, force: true });
console.log(`release/atomhome-single.html — ${(page.length / 1024 / 1024).toFixed(2)} MB`);
