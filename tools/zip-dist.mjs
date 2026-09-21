// Упаковка dist/ в evil-tower-2.zip для загрузки в консоль разработчика Яндекс Игр.
// index.html должен лежать в корне архива, имена файлов — без пробелов и кириллицы (требования модерации).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const root = resolve('dist');
const out = resolve('evil-tower-2.zip');

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
walk(root);

const bad = files.filter((f) => /[^\x21-\x7e/\\:]/.test(relative(root, f)) || /\s/.test(relative(root, f)));
if (bad.length) throw new Error('Недопустимые имена файлов: ' + bad.join(', '));
if (!files.some((f) => relative(root, f) === 'index.html')) throw new Error('В dist нет index.html');

const parts = [];
const central = [];
let offset = 0;
const u16 = (n) => Buffer.from([n & 255, (n >> 8) & 255]);
const u32 = (n) => Buffer.from([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]);

for (const f of files) {
  const name = Buffer.from(relative(root, f).split(sep).join('/'));
  const data = readFileSync(f);
  const comp = deflateRawSync(data, { level: 9 });
  const crc = crc32(data) >>> 0;
  const local = Buffer.concat([
    u32(0x04034b50), u16(20), u16(0x0800), u16(8), u16(0), u16(0x21), u32(crc), u32(comp.length), u32(data.length),
    u16(name.length), u16(0), name,
  ]);
  parts.push(local, comp);
  central.push(
    Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(8), u16(0), u16(0x21), u32(crc), u32(comp.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    ]),
  );
  offset += local.length + comp.length;
}
const cd = Buffer.concat(central);
const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(offset), u16(0)]);
writeFileSync(out, Buffer.concat([...parts, cd, end]));
const mb = (statSync(out).size / 1048576).toFixed(2);
console.log(`OK: ${out} (${files.length} файлов, ${mb} МБ)`);
