// Packs the contents of dist/ into release/atomhome-yandex.zip (index.html at the archive root),
// ready to upload to the Yandex Games console. No external dependencies: a minimal ZIP writer.
import { deflateRawSync } from 'zlib';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const outDir = join(root, 'release');
const out = join(outDir, 'atomhome-yandex.zip');

function walk(dir) {
  const res = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) res.push(...walk(p));
    else res.push(p);
  }
  return res;
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

const files = walk(dist).sort();
if (!files.some((f) => relative(dist, f) === 'index.html')) {
  console.error('dist/index.html not found — run `npm run build` first');
  process.exit(1);
}
const locals = [];
const centrals = [];
let offset = 0;
const now = dosTime(new Date());
for (const f of files) {
  const name = Buffer.from(relative(dist, f).split('\\').join('/'), 'utf8');
  const data = readFileSync(f);
  const crc = crc32(data);
  const comp = deflateRawSync(data, { level: 9 });
  const useDeflate = comp.length < data.length;
  const body = useDeflate ? comp : data;
  const method = useDeflate ? 8 : 0;
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0);
  lh.writeUInt16LE(20, 4);
  lh.writeUInt16LE(0x0800, 6); // UTF-8 names
  lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(now.time, 10);
  lh.writeUInt16LE(now.date, 12);
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(body.length, 18);
  lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(name.length, 26);
  lh.writeUInt16LE(0, 28);
  locals.push(lh, name, body);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0);
  ch.writeUInt16LE(20, 4);
  ch.writeUInt16LE(20, 6);
  ch.writeUInt16LE(0x0800, 8);
  ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(now.time, 12);
  ch.writeUInt16LE(now.date, 14);
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(body.length, 20);
  ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(name.length, 28);
  ch.writeUInt32LE(offset, 42);
  centrals.push(ch, name);
  offset += lh.length + name.length + body.length;
}
const cdSize = centrals.reduce((s, b) => s + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cdSize, 12);
end.writeUInt32LE(offset, 16);
mkdirSync(outDir, { recursive: true });
const zip = Buffer.concat([...locals, ...centrals, end]);
writeFileSync(out, zip);
console.log(`${files.length} files → ${relative(root, out)} (${(zip.length / 1024).toFixed(0)} KB)`);
