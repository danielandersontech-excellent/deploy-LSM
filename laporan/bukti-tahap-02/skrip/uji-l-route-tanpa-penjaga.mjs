// UJI l — menelusuri SELURUH app/api/**/route.js: setiap route non-publik WAJIB
// memakai denganPeran(...) atau requireRole(...). Gagal (exit 1) bila ada yang tidak.
// Dijalankan ulang di setiap tahap agar kelalaian di masa depan tertangkap.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../../', import.meta.url));
const DIR_API = path.join(AKAR, 'app', 'api');

// Route publik yang memang dirancang tanpa login (REFERENSI 12) + route autentikasi itu sendiri.
const PUBLIK = new Set([
  'app/api/health/route.js',
  'app/api/artikel/route.js',
  'app/api/artikel/[slug]/route.js',
  'app/api/pengaduan/route.js',
  'app/api/pengaduan/lacak/[nomor]/route.js',
  'app/api/auth/login/route.js',
  'app/api/auth/logout/route.js',
  'app/api/auth/saya/route.js',
]);

function jelajah(dir, hasil = []) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) jelajah(p, hasil);
    else if (n === 'route.js') hasil.push(p);
  }
  return hasil;
}

const baris = [];
let gagal = 0;
for (const berkas of jelajah(DIR_API).sort()) {
  const rel = path.relative(AKAR, berkas).split(path.sep).join('/');
  const src = readFileSync(berkas, 'utf8');
  const metode = [...src.matchAll(/export (?:const|async function) (GET|POST|PATCH|PUT|DELETE)\b/g)].map((m) => m[1]);
  const pakaiDenganPeran = /denganPeran\(/.test(src);
  const pakaiRequireRole = /requireRole\(/.test(src);
  const publik = PUBLIK.has(rel);
  let status, alasan;
  if (pakaiDenganPeran || pakaiRequireRole) { status = 'TERJAGA'; alasan = pakaiDenganPeran ? 'denganPeran()' : 'requireRole()'; }
  else if (publik) { status = 'PUBLIK'; alasan = rel.includes('/auth/') ? 'route autentikasi (sesi diperiksa sendiri / tanpa sesi)' : 'dirancang tanpa login (REFERENSI 12)'; }
  else { status = 'TANPA PENJAGA'; alasan = 'BUKAN route publik dan tidak memanggil penjaga'; gagal++; }
  baris.push({ rel, metode: metode.join(',') || '-', status, alasan });
}
console.log('Route'.padEnd(48), 'Metode'.padEnd(10), 'Status'.padEnd(14), 'Keterangan');
for (const b of baris) console.log(b.rel.padEnd(48), b.metode.padEnd(10), b.status.padEnd(14), b.alasan);
console.log(`\nTotal route.js: ${baris.length} | terjaga: ${baris.filter((b) => b.status === 'TERJAGA').length} | publik: ${baris.filter((b) => b.status === 'PUBLIK').length} | TANPA PENJAGA: ${gagal}`);
console.log(gagal ? 'HASIL: GAGAL — ada route non-publik tanpa penjaga' : 'HASIL: LULUS — seluruh route non-publik memakai penjaga');
process.exit(gagal ? 1 : 0);
