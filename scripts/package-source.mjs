import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
const exclude = new Set(['models', 'vendor', 'trazo-source.zip']);
const names = [
  '.gitignore',
  'index.html',
  'LICENSE',
  'README.md',
  'README.en.md',
  'THIRD_PARTY_LICENSES.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
];
const destination =
  process.argv.find((arg) => arg.startsWith('--out='))?.slice(6) ||
  'public/trazo-source.zip';
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      exclude.has(entry.name) ||
      entry.name.startsWith('.env')
    )
      continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) names.push(path);
  }
}
for (const directory of ['.github', 'components', 'lib', 'public', 'scripts', 'src']) walk(directory);
const table = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(b) {
  let c = 0xffffffff;
  for (const v of b) c = table[(c ^ v) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const local = [],
  central = [];
let offset = 0;
for (const name of names.sort()) {
  const raw = readFileSync(name),
    data = deflateRawSync(raw),
    filename = Buffer.from(name.replaceAll('\\', '/')),
    sum = crc(raw);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50);
  h.writeUInt16LE(20, 4);
  h.writeUInt16LE(0x800, 6);
  h.writeUInt16LE(8, 8);
  h.writeUInt32LE(sum, 14);
  h.writeUInt32LE(data.length, 18);
  h.writeUInt32LE(raw.length, 22);
  h.writeUInt16LE(filename.length, 26);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0x800, 8);
  c.writeUInt16LE(8, 10);
  c.writeUInt32LE(sum, 16);
  c.writeUInt32LE(data.length, 20);
  c.writeUInt32LE(raw.length, 24);
  c.writeUInt16LE(filename.length, 28);
  c.writeUInt32LE(offset, 42);
  local.push(h, filename, data);
  central.push(c, filename);
  offset += h.length + filename.length + data.length;
}
const directory = Buffer.concat(central),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(names.length, 8);
end.writeUInt16LE(names.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
writeFileSync(destination, Buffer.concat([...local, directory, end]));
console.log(`Source archive: ${names.length} files`);
