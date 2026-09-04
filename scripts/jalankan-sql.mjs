#!/usr/bin/env node
// scripts/jalankan-sql.mjs — menjalankan berkas SQL (migrasi/data) lewat pool aplikasi (lib/db, kredensial dari .env),
// statement demi statement (dipisah ';' di akhir baris; komentar '--' dibuang). Berguna bila `docker exec` tidak tersedia.
//   node scripts/jalankan-sql.mjs database/migrations/20260904-1500-pengurus-kelompok.sql [berkas lain ...]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { kueri, tutupPool } from '../lib/db/index.js';

const berkas = process.argv.slice(2);
if (!berkas.length) { console.error('Pemakaian: node scripts/jalankan-sql.mjs <berkas.sql> [...]'); process.exit(1); }
for (const f of berkas) {
  const teks = readFileSync(f, 'utf8').split('\n').filter((b) => !/^\s*--/.test(b)).join('\n');
  const statement = teks.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  let n = 0;
  for (const s of statement) { const r = await kueri(s); n++; if (r && typeof r.affectedRows === 'number') console.log(`  [${f}] #${n}: affectedRows=${r.affectedRows}`); }
  console.log(`${f}: ${n} statement dijalankan`);
}
await tutupPool();
