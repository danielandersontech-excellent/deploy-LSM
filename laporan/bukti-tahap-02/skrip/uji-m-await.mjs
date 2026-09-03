// UJI m — cookies(), headers(), params, searchParams yang dibaca tanpa await (aturan 12).
// cookies()/headers() dari next/headers: dipindai di app/, lib/, components/, hooks/.
// params/searchParams (props halaman/route Next.js): hanya relevan di app/ —
// variabel lokal bernama `params` di lib/db adalah larik parameter SQL, bukan props.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../../', import.meta.url));
const DIRS = ['app', 'lib', 'components', 'hooks'];

function jelajah(dir, hasil = []) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) jelajah(p, hasil);
    else if (/\.(js|jsx|mjs)$/.test(n)) hasil.push(p);
  }
  return hasil;
}

let masalah = 0, dipindai = 0, ditemukan = 0;
for (const d of DIRS) {
  const dir = path.join(AKAR, d);
  try { statSync(dir); } catch { continue; }
  for (const berkas of jelajah(dir)) {
    dipindai++;
    const rel = path.relative(AKAR, berkas).split(path.sep).join('/');
    const src = readFileSync(berkas, 'utf8');
    const pakaiNextHeaders = /from ['"]next\/headers['"]/.test(src);
    src.split('\n').forEach((baris, i) => {
      const b = baris.trim();
      if (b.startsWith('//') || b.startsWith('*') || b.startsWith('/*') || b.startsWith('import')) return;
      if (pakaiNextHeaders) {
        for (const fn of ['cookies()', 'headers()']) {
          if (b.includes(fn)) {
            ditemukan++;
            if (!b.includes(`await ${fn}`)) { console.log(`  TANPA AWAIT  ${rel}:${i + 1}  ${b}`); masalah++; }
            else console.log(`  ok           ${rel}:${i + 1}  ${b}`);
          }
        }
      }
      if (rel.startsWith('app/') && /\b(params|searchParams)\b/.test(b) && !/(sp|nextUrl|url)\.searchParams/.test(b) && !/\bparams\.push\b/.test(b)) {
        ditemukan++;
        if (/await\s+(params|searchParams)/.test(b) || /\{\s*(params|searchParams)\s*\}/.test(b) && !/(params|searchParams)\./.test(b)) console.log(`  ok           ${rel}:${i + 1}  ${b}`);
        else if (/(params|searchParams)\.[a-zA-Z_]/.test(b)) { console.log(`  TANPA AWAIT  ${rel}:${i + 1}  ${b}`); masalah++; }
        else console.log(`  ok           ${rel}:${i + 1}  ${b}`);
      }
    });
  }
}
console.log(`\nBerkas dipindai: ${dipindai} | pemakaian ditemukan: ${ditemukan} | pembacaan tanpa await: ${masalah}`);
console.log(masalah ? 'HASIL: GAGAL' : 'HASIL: LULUS — nihil (semua cookies()/headers()/params/searchParams di-await)');
process.exit(masalah ? 1 : 0);
