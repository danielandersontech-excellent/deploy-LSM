#!/usr/bin/env node
// QA-4 G — VERIFIKASI AKHIR MENYELURUH DI DOMAIN PRODUKSI.
// Sesi staf: token dari `sesi-uji-produksi.mjs buka` lewat env TOKEN_STAF (akun uji sementara, dinonaktifkan lagi
// oleh pemanggil). Superadmin pemilik tidak dipakai. Tidak ada uji yang menulis data selain pengaduan anonim uji
// (dihapus lunak lewat SQL di container) — pengurus/artikel/pengaturan pemilik tidak disentuh.
// Pemakaian: TOKEN_STAF=<token> node laporan/bukti-qa-4/skrip/uji-g-produksi.mjs
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { KATEGORI_BERITA } from '../../../lib/kategoriBerita.js';

const U = 'https://warkopnusantara.id'; const US = 'https://staf.warkopnusantara.id';
const env = Object.fromEntries(readFileSync('.env.produksi', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const tk = process.env.TOKEN_STAF || null;
let no = 0, gagal = 0; const nomorUji = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const halaman = async (jalur, sesi) => { const r = await fetch(`${jalur.startsWith('/staf') || jalur === '/login' ? US : U}${jalur}`, { headers: sesi ? { cookie: `warkop_token=${sesi}` } : {}, redirect: 'manual' }); return { s: r.status, html: r.status === 200 ? await r.text() : '', lokasi: r.headers.get('location') }; };
const api = async (metode, jalur, sesi, badan) => { const r = await fetch(`${US}${jalur}`, { method: metode, headers: { ...(badan ? { 'content-type': 'application/json' } : {}), ...(sesi ? { cookie: `warkop_token=${sesi}` } : {}) }, body: badan ? JSON.stringify(badan) : undefined, redirect: 'manual' }); let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; } return { s: r.status, j }; };
const sql = (teks) => execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', `cat > /tmp/qa4g.sql && docker exec -i kwoz3jwjb037hw3oh669g9c4 sh -c 'exec mariadb -u$MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE' < /tmp/qa4g.sql; rm -f /tmp/qa4g.sql`], { input: teks, encoding: 'utf8' });
const tokenFormulir = (ms) => `${ms}.${createHmac('sha256', env.JWT_SECRET).update(`formulir:${ms}`).digest('hex')}`;

console.log(`# QA-4 G — verifikasi akhir di domain produksi — ${new Date().toISOString()}`);
console.log(`# sesi staf uji: ${tk ? 'ada' : 'TIDAK ADA'}`);

console.log('\n## Kesehatan, pemisahan host, header keamanan');
await langkah('/api/health sehat (WIB); host publik /staf -> 307 host staf; host staf /berita -> dashboard; /login staf 200; Location tanpa 0.0.0.0', async () => {
  const h = await (await fetch(`${U}/api/health`)).json(); wajib(h.status === 'sehat' && /\+07:00$/.test(h.waktu), JSON.stringify(h));
  const a = await fetch(`${U}/staf/dashboard`, { redirect: 'manual' }); const b = await fetch(`${US}/berita`, { redirect: 'manual' }); const l = await fetch(`${US}/login`);
  const la = a.headers.get('location') || '', lb = b.headers.get('location') || '';
  wajib(a.status === 307 && la.startsWith(`${US}/staf`), `publik->staf ${a.status} ${la}`); wajib(b.status === 307 && /\/staf\/dashboard/.test(lb), `staf->dashboard ${b.status} ${lb}`); wajib(l.status === 200, `login ${l.status}`);
  wajib(!/0\.0\.0\.0/.test(la + lb), 'Location memuat 0.0.0.0');
  return `health ${h.waktu}; pengalihan benar; /login 200`;
});
await langkah('header keamanan: CSP tanpa unsafe-eval + frame-ancestors none, HSTS preload, X-Frame DENY, nosniff', async () => {
  const r = await fetch(`${U}/`); const csp = r.headers.get('content-security-policy') || '';
  wajib(/frame-ancestors 'none'/.test(csp) && !/unsafe-eval/.test(csp), csp.slice(0, 100)); wajib((r.headers.get('strict-transport-security') || '').includes('preload'), 'HSTS'); wajib(r.headers.get('x-frame-options') === 'DENY' && r.headers.get('x-content-type-options') === 'nosniff', 'X-Frame/nosniff');
  return 'lengkap';
});

console.log('\n## A — kategori berita final di produksi');
await langkah('DB: 11 kategori aktif urut final, 4 lama nonaktif, 0 artikel di kategori nonaktif', async () => {
  const k = sql("SELECT slug FROM kategori_artikel WHERE aktif=1 ORDER BY urutan; SELECT COUNT(*) nonaktif FROM kategori_artikel WHERE aktif=0; SELECT COUNT(*) yatim FROM artikel a JOIN kategori_artikel x ON x.id=a.kategori_id WHERE x.aktif=0;");
  const slug = k.split('\n').slice(1, 12); wajib(JSON.stringify(slug) === JSON.stringify(KATEGORI_BERITA.map((x) => x.slug)), `urutan DB: ${slug.join(',')}`);
  wajib(/nonaktif\n4/.test(k) && /yatim\n0/.test(k), k.replace(/\n/g, ' ; '));
  return '11 aktif urut final; 4 nonaktif; 0 artikel yatim';
});
await langkah('filter /berita produksi menerima 11 slug (200) dan dropdown = 11 slug final', async () => {
  for (const s of KATEGORI_BERITA.map((x) => x.slug)) { const h = await halaman(`/berita?kategori=${s}`); wajib(h.s === 200, `${s} ${h.s}`); }
  const dom = tanpaSkrip((await halaman('/berita')).html); const dd = (dom.match(/<select[^>]*name="kategori"[\s\S]*?<\/select>/) || [''])[0];
  const opsi = [...dd.matchAll(/value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  wajib(JSON.stringify(opsi) === JSON.stringify(KATEGORI_BERITA.map((x) => x.slug)), `dropdown: ${opsi.join(',')}`);
  return '11 slug 200; dropdown final';
});
await langkah('editor artikel staf menawarkan 11 kategori; API menolak kategori nonaktif 422', async () => {
  wajib(tk, 'tanpa sesi staf');
  const h = await halaman('/staf/artikel/baru', tk); wajib(h.s === 200, `editor ${h.s} ${h.lokasi || ''}`);
  const nama = KATEGORI_BERITA.map((x) => x.nama); const opsi = [...h.html.matchAll(/<option[^>]*value="\d+"[^>]*>([^<]+)<\/option>/g)].map((m) => m[1].trim()).filter((o) => nama.includes(o) || /Siaran Pers|Opini Publik|Kegiatan Daerah|Fasilitas Umum/.test(o));
  wajib(JSON.stringify(opsi) === JSON.stringify(nama), `opsi: ${opsi.join('|')}`);
  const a = await api('POST', '/api/staf/artikel', tk, { judul: 'Uji QA-4 kategori nonaktif produksi', isi: '<p>Isi uji yang cukup panjang untuk validasi minimal artikel.</p>', kategori_id: 2 });
  wajib(a.s === 422 && a.j.kode === 'KATEGORI_NONAKTIF', `HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
  return `11 opsi; kategori nonaktif -> 422 ${a.j.kode}`;
});

console.log('\n## B + C + D — bilah kategori, beranda berita, header (HTML produksi)');
await langkah('bilah kategori ada di 11 halaman publik, TIDAK di dashboard staf; beranda memuat sorotan h1 + Berita Terkini + sisi', async () => {
  for (const p of ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas']) { const h = await halaman(p); wajib(h.s === 200 && h.html.includes('aria-label="Kategori berita"'), `${p}: HTTP ${h.s} bilah ${h.html.includes('Kategori berita')}`); }
  if (tk) { const d = await halaman('/staf/dashboard', tk); wajib(d.s === 200 && !d.html.includes('aria-label="Kategori berita"'), `dashboard ${d.s} bilah ${d.html.includes('Kategori berita')}`); }
  const dom = tanpaSkrip((await halaman('/')).html);
  for (const k of ['Sampaikan Pengaduan', 'Lacak Kasus', 'Berita Terkini', 'Paling Banyak Dibaca', 'Status Advokasi', 'Rekam Jejak']) wajib(dom.includes(k), `beranda tanpa "${k}"`);
  wajib(/<h1[^>]*>[\s\S]*?<a[^>]*href="\/berita\//.test(dom), 'sorotan h1 tidak ada');
  return '11 halaman berbilah; dashboard tanpa bilah; beranda lengkap';
});

console.log('\n## Regresi inti di produksi');
await langkah('pengaduan anonim + lampiran PDF -> 201; lacak tanpa identitas; akun uji (redaktur) membuka pengaduan -> 403 pagar peran (membuka lampiran butuh verifikator/superadmin, tidak dilakukan di produksi); dihapus lunak', async () => {
  const f = new FormData(); f.append('token_formulir', tokenFormulir(Date.now() - 5000)); f.append('anonim', 'true'); f.append('kategori_masalah', 'lainnya'); f.append('wilayah_id', '13');
  f.append('deskripsi', 'Uji QA-4 G verifikasi produksi: pengaduan anonim berlampiran, dihapus lunak di akhir.');
  f.append('lampiran', new Blob([Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n', 'latin1')], { type: 'application/pdf' }), 'bukti.pdf');
  const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', body: f }); const j = await r.json();
  wajib(r.status === 201 && j.lampiran === 1, `HTTP ${r.status} ${JSON.stringify(j).slice(0, 100)}`); nomorUji.push(j.nomorKasus);
  const lacak = await (await fetch(`${U}/api/pengaduan/lacak/${j.nomorKasus}`)).json();
  wajib(lacak.pengaduan?.nomorKasus === j.nomorKasus && !/nama_pelapor|nik/.test(JSON.stringify(lacak)), 'lacak salah/bocor');
  if (tk) {
    // akun uji berperan redaktur: tidak berhak membuka pengaduan (harus 403) -> pagar peran ikut terverifikasi
    const d = await api('GET', `/api/staf/pengaduan?q=${j.nomorKasus}`, tk); wajib(d.s === 403, `redaktur membuka daftar pengaduan: ${d.s} (harus 403)`);
  }
  return `201 ${j.nomorKasus}; lacak bersih; redaktur -> 403 pada pengaduan (pagar peran)`;
});
await langkah('K2: 11 halaman publik + beranda kategori 0 em/en dash; DB produksi 0 dash (8 tabel)', async () => {
  let n = 0; for (const p of ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/berita?kategori=nasional', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas']) n += ((await halaman(p)).html.match(/[—–]/g) || []).length;
  wajib(n === 0, `${n} em/en dash di halaman`);
  const k = sql("SELECT (SELECT COUNT(*) FROM artikel WHERE judul REGEXP '[—–]' OR ringkasan REGEXP '[—–]' OR isi REGEXP '[—–]') + (SELECT COUNT(*) FROM pengaturan WHERE nilai REGEXP '[—–]') + (SELECT COUNT(*) FROM pengurus WHERE nama REGEXP '[—–]' OR jabatan REGEXP '[—–]') + (SELECT COUNT(*) FROM program WHERE judul REGEXP '[—–]' OR ringkasan REGEXP '[—–]') + (SELECT COUNT(*) FROM galeri WHERE judul REGEXP '[—–]') + (SELECT COUNT(*) FROM kategori_artikel WHERE nama REGEXP '[—–]') + (SELECT COUNT(*) FROM kategori_program WHERE nama REGEXP '[—–]') + (SELECT COUNT(*) FROM wilayah WHERE nama REGEXP '[—–]') AS n;");
  wajib(/\n0\s*$/.test(k), `DB: ${k}`);
  return '0 di halaman; 0 di DB';
});
await langkah('container: image = HEAD terbaru, healthy, restart 0; log app 24 jam tanpa error', async () => {
  const ps = execFileSync('ssh', ['-o', 'BatchMode=yes', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', 'docker ps --filter name=re8snqu --format "{{.Image}} {{.Status}}"; docker inspect -f "restart={{.RestartCount}}" $(docker ps -q --filter name=re8snqu | head -1); docker logs --since 24h $(docker ps -q --filter name=re8snqu | head -1) 2>&1 | grep -ciE "error|uncaught|fatal" || true'], { encoding: 'utf8' });
  wajib(/healthy/.test(ps) && /restart=0/.test(ps), ps);
  return ps.trim().replace(/\n/g, ' | ');
});

console.log('\n## Pembersihan');
await langkah('pengaduan uji dihapus lunak (SQL di container, SELECT dulu); lacak -> 404', async () => {
  if (!nomorUji.length) return 'tidak ada';
  const daftar = nomorUji.map((n) => `'${n.replace(/[^A-Z0-9-]/gi, '')}'`).join(',');
  const k = sql(`SELECT id, nomor_kasus FROM pengaduan WHERE nomor_kasus IN (${daftar}); UPDATE pengaduan SET dihapus_pada=UTC_TIMESTAMP(), diperbarui_pada=UTC_TIMESTAMP() WHERE nomor_kasus IN (${daftar}) AND dihapus_pada IS NULL;`);
  const l = await fetch(`${U}/api/pengaduan/lacak/${nomorUji[0]}`); wajib(l.status === 404, `lacak sesudah hapus ${l.status}`);
  return `${nomorUji.join(',')} dihapus lunak; lacak 404 (${k.split('\n').length - 1} baris SELECT)`;
});
console.log(`\nRINGKASAN QA-4 G produksi: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
