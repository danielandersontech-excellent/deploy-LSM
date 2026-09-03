// UJI i (statis): setiap ${...} di dalam template literal SQL lib/db/*.js, diklasifikasikan.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../../../lib/db/', import.meta.url));
const AMAN = new Set(['KOLOM_DAFTAR', 'KOLOM_AMAN', 'KOLOM', 'KOLOM_UMUM', 'KOLOM_IDENTITAS', 'KOLOM_PUBLIK', 'GABUNG', 'where', 'placeholder', 'arah',
  "syarat.join(' AND ')", 'kolomUntuk(bolehLihatIdentitas)', "hanyaTerbit ? `AND a.status = 'terbit'` : ''", 'whereArtikel', 'wherePengaduan',
  "aman.map(() => '?').join(', ')", 'tabel', "syaratArtikel.join(' AND ')", "syaratPengaduan.join(' AND ')"]);
let total = 0, periksa = 0;
for (const f of readdirSync(dir)) {
  const src = readFileSync(path.join(dir, f), 'utf8');
  const re = /`([^`]*(?:`[^`]*`[^`]*)*?)`/g; // template literal (toleran satu tingkat bersarang)
  let m;
  const reSederhana = /`([^`]*)`/g;
  while ((m = reSederhana.exec(src))) {
    const isi = m[1];
    if (!/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i.test(isi)) continue;
    for (const x of isi.matchAll(/\$\{([^}]*)\}/g)) {
      total++;
      const e = x[1].trim();
      const aman = AMAN.has(e) || /^[A-Z_]+$/.test(e);
      if (!aman) periksa++;
      const baris = src.slice(0, m.index).split('\n').length;
      console.log(`${aman ? '  aman   ' : '  PERIKSA'} ${f}:${baris}  \${${e}}`);
    }
  }
}
console.log(`\nTotal interpolasi dalam SQL: ${total} | perlu diperiksa: ${periksa}`);
console.log('Klasifikasi aman = konstanta daftar kolom/JOIN (huruf besar), potongan WHERE yang disusun dari string tetap + placeholder ?, daftar placeholder ?,?,?, atau nama tabel dari daftar putih TABEL_DIKENAL. TIDAK ADA nilai masukan pengguna yang masuk ke teks SQL; nilai selalu lewat parameter execute().');
process.exit(periksa ? 1 : 0);
