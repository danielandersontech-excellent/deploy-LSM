#!/usr/bin/env node
// RUN AI-1 E — uji end-to-end LOKAL terhadap BUILD PRODUKSI (node server.js, NODE_ENV=production; bukan dev server).
// Dua mode (dua kali start server):
//   node uji-e2e-lokal.mjs tiruan  -> server dengan AI_TIRUAN=1 AI_TIRUAN_JEDA_MS=3000 (TANPA kredit Anthropic):
//      pembersihan malas & tombol, pagar peran 401/403, validasi topik 422, kuota 10/hari 429 (tanpa API), kunci 1 serentak
//      429, sanitasi <script>/<iframe> di jalur route, penjaga <a> (ditolak=1), kategori ngawur -> nasional, pakai -> artikel
//      DRAF + mesin gambar nyata (>= 1200 px) + asal foto internal, pakai ganda 409, editor berpita, pratinjau 200,
//      publik 404 saat draf, terbit sementara -> render publik NOL jejak sumber/penyedia/lisensi/URL -> kembali draf -> hapus.
//   node uji-e2e-lokal.mjs nyata   -> server normal: SATU panggilan Anthropic sungguhan topik "banjir" (token dicatat),
//      kartu terisi, pakai -> draf lengkap + gambar >= 1200 px + pratinjau 200 + publik 404 + badan bersih; artikel DIBIARKAN
//      sebagai draf untuk uji UI (tangkapan editor berpita).
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { kueri, tutupPool } from '../../../lib/db/index.js';
import { waktuSekarang } from '../../../lib/utils.js';

const MODE = process.argv[2] === 'nyata' ? 'nyata' : 'tiruan';
const U = process.env.U || 'http://localhost:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/\r$/, '')]));
const AKUN = {
  superadmin: [env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD],
  redaktur: ['siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  penulis: ['budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  verifikator: ['siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  pimpinan_wilayah: ['rahmat.siregar@warkopnusantara.id', env.SEED_STAF_PASSWORD],
};
const UNGGAH_AI = path.resolve(env.UPLOAD_DIR || 'public/unggahan', 'ai');
const HASIL = {};
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} -> ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} -> GAGAL: ${g?.message || g}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
// kolom JSON (MariaDB LONGTEXT) bisa kembali sebagai string ATAU objek dari mysql2 -> urai bila string
const urai = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
async function login(peran) { const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: AKUN[peran][0], kataSandi: AKUN[peran][1] }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null; }
async function api(metode, jalur, tk, badan) { const r = await fetch(`${U}${jalur}`, { method: metode, headers: { ...(badan !== undefined ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: badan !== undefined ? JSON.stringify(badan) : undefined, redirect: 'manual' }); let data = {}; try { data = await r.json(); } catch { /* bukan JSON */ } return { s: r.status, data }; }
async function halaman(jalur, tk) { const r = await fetch(`${U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, lokasi: r.headers.get('location'), html: await r.text() }; }
const jalurDisk = (jalurUrl) => path.resolve(env.UPLOAD_DIR || 'public/unggahan', jalurUrl.replace(/^\/unggahan\//, ''));
async function buatBerkasUji(nama) { mkdirSync(UNGGAH_AI, { recursive: true }); const p = path.join(UNGGAH_AI, nama); await sharp({ create: { width: 1300, height: 800, channels: 3, background: { r: 200, g: 180, b: 120 } } }).jpeg().toFile(p); return p; }
const KATA_BOCOR = ['sumber riset', 'sumberriset', 'pixabay', 'openverse', 'wikimedia', 'pexels', 'lisensi', 'license', 'catatan verifikasi', 'draf ai', 'example.com', 'example.org', 'ai_saran', 'gambar_sumber'];
function periksaBocor(html, tambahan = []) { const t = html.toLowerCase(); return [...KATA_BOCOR, ...tambahan.map((x) => String(x).toLowerCase())].filter((k) => k && t.includes(k)); }

console.log(`# RUN AI-1 E — uji end-to-end lokal (${MODE}) — ${U} — ${new Date().toISOString()}`);
const TK = {}; for (const p of Object.keys(AKUN)) TK[p] = await login(p);
console.log(`login: ${Object.entries(TK).map(([p, t]) => `${p}=${t ? 'ok' : 'GAGAL'}`).join(' ')}`);
const idPenulis = Number((await kueri(`SELECT id FROM users WHERE email = ?`, [AKUN.penulis[0]]))[0].id);
const idRedaktur = Number((await kueri(`SELECT id FROM users WHERE email = ?`, [AKUN.redaktur[0]]))[0].id);

if (MODE === 'tiruan') {
  console.log('\n## C. pembersihan: malas (buka halaman pertama kali) + tombol superadmin; artikel & saran dipakai tak tersentuh');
  const berkasLama = await buatBerkasUji(`uji-lama-${randomBytes(4).toString('hex')}.jpg`);
  const berkasBaru = await buatBerkasUji(`uji-baru-${randomBytes(4).toString('hex')}.jpg`);
  const berkasDipakai = await buatBerkasUji(`uji-dipakai-${randomBytes(4).toString('hex')}.jpg`);
  const muatanUji = JSON.stringify({ judul: 'Uji pembersihan', ringkasan: 'x', isiHtml: '<p>x</p>', kategoriSlug: 'nasional', tag: [], kueriGambar: ['x'], catatanVerifikasi: ['x'], sumberRiset: [] });
  const sisip = async (status, hariLalu, berkas) => (await kueri(`INSERT INTO ai_saran (kelompok, topik, muatan, gambar_jalur, status, pemakai_id, model, dibuat_pada, diperbarui_pada) VALUES (?, 'uji pembersihan', ?, ?, ?, ?, 'uji', ?, ?)`, [randomBytes(16).toString('hex'), muatanUji, `/unggahan/ai/${path.basename(berkas)}`, status, idPenulis, waktuSekarang(new Date(Date.now() - hariLalu * 86400000)), waktuSekarang()])).insertId;
  const idLama = await sisip('baru', 8, berkasLama), idBaru = await sisip('baru', 2, berkasBaru), idDipakai = await sisip('dipakai', 30, berkasDipakai);
  await langkah('pembersihan MALAS saat /staf/artikel/asisten dibuka pertama kali: saran 8 hari -> dibersihkan + berkas terhapus; 2 hari & dipakai utuh', async () => {
    const h = await halaman('/staf/artikel/asisten', TK.penulis);
    wajib(h.s === 200, `HTTP ${h.s}`);
    const r = await kueri(`SELECT id, status, gambar_jalur FROM ai_saran WHERE id IN (?, ?, ?) ORDER BY id`, [idLama, idBaru, idDipakai]);
    wajib(r[0].status === 'dibersihkan' && r[0].gambar_jalur === null, `lama: ${JSON.stringify(r[0])}`);
    wajib(!existsSync(berkasLama), 'berkas lama masih ada');
    wajib(r[1].status === 'baru' && existsSync(berkasBaru), 'saran 2 hari tersentuh');
    wajib(r[2].status === 'dipakai' && existsSync(berkasDipakai), 'saran dipakai tersentuh');
    return `lama=dibersihkan (berkas hilang), 2 hari=baru (berkas ada), dipakai=dipakai (berkas ada)`;
  });
  const idLama2 = await sisip('baru', 9, await buatBerkasUji(`uji-lama2-${randomBytes(4).toString('hex')}.jpg`));
  await langkah('tombol "Bersihkan sekarang": penulis/redaktur 403, superadmin 200 {dibersihkan:1, berkasDihapus:1}', async () => {
    const a = await api('POST', '/api/staf/ai/bersihkan', TK.penulis); const b = await api('POST', '/api/staf/ai/bersihkan', TK.redaktur);
    wajib(a.s === 403 && b.s === 403, `penulis ${a.s} redaktur ${b.s}`);
    const c = await api('POST', '/api/staf/ai/bersihkan', TK.superadmin);
    wajib(c.s === 200 && c.data.dibersihkan === 1 && c.data.berkasDihapus === 1, `superadmin ${c.s} ${JSON.stringify(c.data)}`);
    const r = await kueri(`SELECT status FROM ai_saran WHERE id = ?`, [idLama2]); wajib(r[0].status === 'dibersihkan', 'status bukan dibersihkan');
    return `403/403/200 ${JSON.stringify(c.data)}`;
  });
  await kueri(`DELETE FROM ai_saran WHERE topik = 'uji pembersihan'`);
  for (const f of [berkasBaru, berkasDipakai]) { try { (await import('node:fs/promises')).unlink(f); } catch { /* abaikan */ } }

  console.log('\n## A. pagar peran & validasi (tanpa panggilan API)');
  await langkah('POST /api/staf/ai/saran: tanpa login 401; verifikator 403; pimpinan_wilayah 403', async () => {
    const a = await api('POST', '/api/staf/ai/saran', null, { topik: 'banjir' }); const b = await api('POST', '/api/staf/ai/saran', TK.verifikator, { topik: 'banjir' }); const c = await api('POST', '/api/staf/ai/saran', TK.pimpinan_wilayah, { topik: 'banjir' });
    wajib(a.s === 401 && b.s === 403 && c.s === 403, `${a.s}/${b.s}/${c.s}`); return `${a.s}/${b.s}/${c.s}`;
  });
  await langkah('halaman /staf/artikel/asisten: tanpa login -> /login; verifikator -> /tanpa-akses; penulis 200 dengan form', async () => {
    const a = await halaman('/staf/artikel/asisten'); const b = await halaman('/staf/artikel/asisten', TK.verifikator); const c = await halaman('/staf/artikel/asisten', TK.penulis);
    wajib(/^3/.test(String(a.s)) && /login/.test(a.lokasi || ''), `tanpa login ${a.s} ${a.lokasi}`);
    wajib(/^3/.test(String(b.s)) && /tanpa-akses/.test(b.lokasi || ''), `verifikator ${b.s} ${b.lokasi}`);
    wajib(c.s === 200 && /name="topik"/.test(c.html) && /Asisten Berita AI/.test(c.html), `penulis ${c.s}`);
    return `${a.s}->${a.lokasi} | ${b.s}->${b.lokasi} | 200`;
  });
  await langkah('validasi topik: {} 422 TOPIK_PENDEK; 121 karakter 422 TOPIK_PANJANG; "<b>ab</b>" 422', async () => {
    const a = await api('POST', '/api/staf/ai/saran', TK.penulis, {}); const b = await api('POST', '/api/staf/ai/saran', TK.penulis, { topik: 'x'.repeat(121) }); const c = await api('POST', '/api/staf/ai/saran', TK.penulis, { topik: '<b>ab</b>' });
    wajib(a.s === 422 && a.data.kode === 'TOPIK_PENDEK' && b.s === 422 && b.data.kode === 'TOPIK_PANJANG' && c.s === 422, `${a.s} ${a.data.kode} / ${b.s} ${b.data.kode} / ${c.s}`); return `422 TOPIK_PENDEK / 422 TOPIK_PANJANG / 422`;
  });
  await langkah('kuota 10/hari: 10 kelompok hari ini (disisipkan langsung) -> POST 429 AI_KUOTA_HABIS tanpa baris/audit baru', async () => {
    const muatan = JSON.stringify({ judul: 'kuota', ringkasan: 'x', isiHtml: '<p>x</p>', kategoriSlug: 'nasional', tag: [], kueriGambar: [], catatanVerifikasi: [], sumberRiset: [] });
    for (let i = 0; i < 10; i++) await kueri(`INSERT INTO ai_saran (kelompok, topik, muatan, status, pemakai_id, model, dibuat_pada, diperbarui_pada) VALUES (?, 'uji kuota', ?, 'baru', ?, 'uji', ?, ?)`, [randomBytes(16).toString('hex'), muatan, idPenulis, waktuSekarang(), waktuSekarang()]);
    const sebelum = Number((await kueri(`SELECT COUNT(*) AS n FROM ai_saran`))[0].n); const auditSebelum = Number((await kueri(`SELECT COUNT(*) AS n FROM audit_log WHERE aksi = 'ai_saran_buat'`))[0].n);
    const r = await api('POST', '/api/staf/ai/saran', TK.penulis, { topik: 'banjir' });
    const sesudah = Number((await kueri(`SELECT COUNT(*) AS n FROM ai_saran`))[0].n); const auditSesudah = Number((await kueri(`SELECT COUNT(*) AS n FROM audit_log WHERE aksi = 'ai_saran_buat'`))[0].n);
    await kueri(`DELETE FROM ai_saran WHERE topik = 'uji kuota'`);
    wajib(r.s === 429 && r.data.kode === 'AI_KUOTA_HABIS' && sebelum === sesudah && auditSebelum === auditSesudah, `${r.s} ${r.data.kode} baris ${sebelum}->${sesudah} audit ${auditSebelum}->${auditSesudah}`);
    return `429 AI_KUOTA_HABIS; baris ai_saran ${sebelum}=${sesudah}; audit tidak bertambah; halaman menampilkan sisa kuota ${(await halaman('/staf/artikel/asisten', TK.penulis)).html.includes('Sisa kuota hari ini') ? 'ada' : 'TIDAK ADA'}`;
  });
  await langkah('kunci 1 serentak/pengguna: dua POST paralel (tiruan 3 s) -> satu 201 + satu 429 AI_SEDANG_DIPROSES; pengguna lain tidak terkunci', async () => {
    const [a, b, c] = await Promise.all([
      api('POST', '/api/staf/ai/saran', TK.penulis, { topik: 'banjir bandang sungai' }),
      new Promise((r) => setTimeout(r, 400)).then(() => api('POST', '/api/staf/ai/saran', TK.penulis, { topik: 'banjir bandang sungai' })),
      new Promise((r) => setTimeout(r, 400)).then(() => api('POST', '/api/staf/ai/saran', TK.redaktur, { topik: 'banjir redaktur' })),
    ]);
    const kode = [a, b].map((x) => x.s).sort().join('/');
    wajib(kode === '201/429' && [a, b].find((x) => x.s === 429).data.kode === 'AI_SEDANG_DIPROSES', `${a.s} ${a.data.kode || ''} / ${b.s} ${b.data.kode || ''}`);
    wajib(c.s === 201, `redaktur ${c.s} ${c.data.kode || ''}`);
    HASIL.tiruan = (a.s === 201 ? a : b).data; HASIL.tiruanRedaktur = c.data;
    return `penulis 201 + 429 AI_SEDANG_DIPROSES; redaktur paralel 201`;
  });

  console.log('\n## A/B. hasil tiruan lewat parser/validasi/sanitasi route');
  await langkah('balasan: 2 saran diterima, 1 ditolak (<a>), <script>/<iframe> hilang, kategori ngawur -> nasional + catatan, model=tiruan', async () => {
    const d = HASIL.tiruan; wajib(d && d.saran?.length === 2 && d.ditolak?.length === 1 && /<a>/.test(d.ditolak[0]), JSON.stringify({ n: d?.saran?.length, ditolak: d?.ditolak }));
    wajib(!/<script|<iframe/i.test(d.saran[0].muatan.isiHtml) && d.saran[0].muatan.kategoriSlug === 'lingkungan', 'saran 0 kotor');
    wajib(d.saran[1].muatan.kategoriSlug === 'nasional' && /tidak dikenal/.test(d.saran[1].muatan.catatanVerifikasi[0]), 'kategori ngawur tidak dipetakan');
    wajib(d.model === 'tiruan' && d.kuota?.maks === 10, 'model/kuota');
    const r = await kueri(`SELECT status, model, token_masuk, muatan FROM ai_saran WHERE id = ?`, [d.saran[0].id]);
    wajib(r[0].status === 'baru' && r[0].model === 'tiruan' && !/<script/i.test(r[0].muatan), 'baris DB');
    return `2 diterima, ditolak[0]="${d.ditolak[0]}", DB status baru model tiruan`;
  });
  await langkah('pakai: verifikator 403; penulis memakai saran redaktur 403 (bukan milik); id 999999 404', async () => {
    const a = await api('POST', `/api/staf/ai/saran/${HASIL.tiruan.saran[0].id}/pakai`, TK.verifikator); const b = await api('POST', `/api/staf/ai/saran/${HASIL.tiruanRedaktur.saran[0].id}/pakai`, TK.penulis); const c = await api('POST', '/api/staf/ai/saran/999999/pakai', TK.penulis);
    wajib(a.s === 403 && b.s === 403 && b.data.kode === 'BUKAN_MILIK' && c.s === 404, `${a.s}/${b.s} ${b.data.kode}/${c.s}`); return `${a.s}/${b.s} BUKAN_MILIK/${c.s}`;
  });
  await langkah('pakai saran[0] (penulis): 201 artikelId; artikel DRAF, penulis=budi, kategori lingkungan, ai_saran_id terisi, tag tersimpan, saran -> dipakai', async () => {
    const r = await api('POST', `/api/staf/ai/saran/${HASIL.tiruan.saran[0].id}/pakai`, TK.penulis);
    wajib(r.s === 201 && r.data.artikelId, `${r.s} ${JSON.stringify(r.data).slice(0, 200)}`);
    HASIL.artikelTiruan = r.data.artikelId; HASIL.gambarTiruan = r.data.gambar;
    const a = (await kueri(`SELECT a.status, a.penulis_id, a.ai_saran_id, a.gambar_utama, a.slug, a.isi, k.slug AS kslug FROM artikel a JOIN kategori_artikel k ON k.id = a.kategori_id WHERE a.id = ?`, [r.data.artikelId]))[0];
    wajib(a.status === 'draf' && Number(a.penulis_id) === idPenulis && Number(a.ai_saran_id) === HASIL.tiruan.saran[0].id && a.kslug === 'lingkungan', JSON.stringify(a).slice(0, 200));
    wajib(!/<script|<iframe|<a[\s>]|https?:\/\//i.test(a.isi), 'isi artikel kotor');
    const tag = await kueri(`SELECT COUNT(*) AS n FROM artikel_tag WHERE artikel_id = ?`, [r.data.artikelId]);
    const s = (await kueri(`SELECT status, artikel_id, gambar_jalur, gambar_sumber FROM ai_saran WHERE id = ?`, [HASIL.tiruan.saran[0].id]))[0];
    wajib(s.status === 'dipakai' && Number(s.artikel_id) === r.data.artikelId, 'saran tidak ditandai dipakai');
    HASIL.slugTiruan = a.slug; HASIL.artikelTiruanGambar = a.gambar_utama; HASIL.sumberTiruan = urai(s.gambar_sumber);
    return `artikel ${r.data.artikelId} draf, tag ${tag[0].n}, gambar ${a.gambar_utama || '(penampung)'} dari ${r.data.gambar?.penyedia || '-'}`;
  });
  await langkah('gambar: berkas ada di public/unggahan/ai, lebar >= 1200 (sharp), gambar_sumber internal memuat penyedia/lisensi/urlAsal/pembuat', async () => {
    wajib(HASIL.artikelTiruanGambar, `tidak ada gambar (catatan: ${HASIL.gambarTiruan?.catatan})`);
    const meta = await sharp(jalurDisk(HASIL.artikelTiruanGambar)).metadata();
    wajib(meta.width >= 1200, `lebar ${meta.width}`);
    const s = HASIL.sumberTiruan; wajib(s?.penyedia && s.lisensi && s.urlAsal, JSON.stringify(s).slice(0, 200));
    return `${meta.width}x${meta.height} ${meta.format}; sumber: ${s.penyedia} | ${s.lisensi} | pembuat=${s.pembuat ? 'ada' : '-'} | statistik=${JSON.stringify(s.statistik)}`;
  });
  await langkah('pakai ganda saran yang sama -> 409 SUDAH_DIPAKAI', async () => { const r = await api('POST', `/api/staf/ai/saran/${HASIL.tiruan.saran[0].id}/pakai`, TK.penulis); wajib(r.s === 409 && r.data.kode === 'SUDAH_DIPAKAI', `${r.s} ${r.data.kode}`); return '409 SUDAH_DIPAKAI'; });
  await langkah('redaktur memakai saran miliknya (kategori nasional dari fallback) -> 201', async () => { const r = await api('POST', `/api/staf/ai/saran/${HASIL.tiruanRedaktur.saran[1].id}/pakai`, TK.redaktur); wajib(r.s === 201, `${r.s} ${JSON.stringify(r.data).slice(0, 150)}`); HASIL.artikelRedaktur = r.data.artikelId; return `artikel ${r.data.artikelId}`; });

  console.log('\n## D. editor berpita, pratinjau, publik 404, render publik tanpa jejak');
  await langkah('editor /staf/artikel/[id] (penulis): 200 + pita "Draf AI: verifikasi redaksi sebelum terbit" + catatan + sumber riset + asal foto', async () => {
    const h = await halaman(`/staf/artikel/${HASIL.artikelTiruan}?ai=1`, TK.penulis); const t = tanpaSkrip(h.html);
    wajib(h.s === 200 && /Draf AI: verifikasi redaksi sebelum terbit/.test(t) && /Konfirmasi jumlah pengungsi/.test(t) && /example\.com\/berita-1/.test(t) && /Asal foto utama/.test(t), `HTTP ${h.s}`);
    wajib(/Draf dari Asisten AI tersimpan/.test(t), 'pesan ?ai=1 tidak tampil');
    return 'pita + catatan + sumber + asal foto + pesan tersimpan';
  });
  await langkah('artikel BIASA (seed id 1) di editor TIDAK berpita', async () => { const h = await halaman('/staf/artikel/1', TK.redaktur); wajib(h.s === 200 && !/Draf AI: verifikasi/.test(tanpaSkrip(h.html)), `HTTP ${h.s}`); return 'tanpa pita'; });
  await langkah('pratinjau /staf/artikel/[id]/pratinjau 200 dan NOL kata bocor (sumber riset/penyedia/lisensi/URL sumber)', async () => {
    const h = await halaman(`/staf/artikel/${HASIL.artikelTiruan}/pratinjau`, TK.penulis); const t = tanpaSkrip(h.html);
    const bocor = periksaBocor(t.replace(/Asisten AI/g, ''), [HASIL.sumberTiruan?.urlAsal]);
    wajib(h.s === 200 && /Mode pratinjau/.test(t) && bocor.length === 0, `HTTP ${h.s} bocor=${bocor.join(',')}`); return '200, bocor=0';
  });
  await langkah('publik /berita/[slug] saat DRAF -> 404; /api/artikel/[slug] -> 404', async () => { const a = await halaman(`/berita/${HASIL.slugTiruan}`); const b = await api('GET', `/api/artikel/${HASIL.slugTiruan}`); wajib(a.s === 404 && b.s === 404, `${a.s}/${b.s}`); return '404/404'; });
  await langkah('terbit SEMENTARA (lokal) -> render publik 200 TANPA jejak: sumber riset, nama penyedia, lisensi, URL asal, "Draf AI"; JSON publik tanpa ai_saran', async () => {
    const t1 = await api('POST', `/api/staf/artikel/${HASIL.artikelTiruan}/terbitkan`, TK.redaktur); wajib(t1.s === 200, `terbit ${t1.s}`);
    const h = await halaman(`/berita/${HASIL.slugTiruan}`); const t = tanpaSkrip(h.html);
    const bocor = periksaBocor(t, [HASIL.sumberTiruan?.urlAsal, HASIL.sumberTiruan?.urlUnduh, 'example.com/berita-1']);
    const j = await api('GET', `/api/artikel/${HASIL.slugTiruan}`); const jt = JSON.stringify(j.data).toLowerCase();
    const bocorJson = ['ai_saran', 'sumberriset', 'pixabay', 'openverse', 'wikimedia', 'lisensi'].filter((k) => jt.includes(k));
    await api('PATCH', `/api/staf/artikel/${HASIL.artikelTiruan}`, TK.redaktur, { status: 'draf' });
    wajib(h.s === 200 && bocor.length === 0 && j.s === 200 && bocorJson.length === 0 && /<img[^>]+unggahan%2Fai|unggahan\/ai/.test(t), `HTTP ${h.s} bocor=${bocor.join(',')} json=${bocorJson.join(',')}`);
    const st = (await kueri(`SELECT status FROM artikel WHERE id = ?`, [HASIL.artikelTiruan]))[0].status; wajib(st === 'draf', 'tidak kembali draf');
    return `200 bocor=0; JSON publik bersih; gambar AI tampil tanpa kredit; dikembalikan ke draf`;
  });
  await langkah('hapus kedua artikel uji (redaktur) -> ai_saran.artikel_id NULL (FK SET NULL), status tetap dipakai; berkas gambar uji dihapus', async () => {
    for (const id of [HASIL.artikelTiruan, HASIL.artikelRedaktur]) { const r = await api('DELETE', `/api/staf/artikel/${id}`, TK.redaktur); wajib(r.s === 200, `hapus ${id}: ${r.s}`); }
    const s = (await kueri(`SELECT status, artikel_id, gambar_jalur FROM ai_saran WHERE id = ?`, [HASIL.tiruan.saran[0].id]))[0];
    wajib(s.status === 'dipakai' && s.artikel_id === null, JSON.stringify(s));
    const fs = await import('node:fs/promises');
    for (const id of [HASIL.tiruan.saran[0].id, HASIL.tiruanRedaktur.saran[1].id]) { const g = (await kueri(`SELECT gambar_jalur FROM ai_saran WHERE id = ?`, [id]))[0]?.gambar_jalur; if (g) { try { await fs.unlink(jalurDisk(g)); } catch { /* abaikan */ } } }
    await kueri(`DELETE FROM ai_saran WHERE model = 'tiruan'`);
    return 'dihapus; FK SET NULL terbukti; baris tiruan dibersihkan';
  });
} else {
  console.log('\n## E. SATU panggilan Anthropic sungguhan (topik netral "banjir") lewat route');
  await langkah('POST /api/staf/ai/saran {topik:"banjir"} (penulis) -> 201; token & model dicatat', async () => {
    const mulai = Date.now();
    const r = await api('POST', '/api/staf/ai/saran', TK.penulis, { topik: 'banjir' });
    const detik = ((Date.now() - mulai) / 1000).toFixed(1);
    wajib(r.s === 201, `${r.s} ${JSON.stringify(r.data).slice(0, 300)}`);
    HASIL.nyata = r.data;
    writeFileSync('laporan/bukti-ai-1/e-e2e-nyata-balasan.json', JSON.stringify({ ...r.data, dicatat: new Date().toISOString(), durasiKlienDetik: detik }, null, 2));
    return `${r.data.saran.length} saran, ditolak ${r.data.ditolak.length}, model ${r.data.model}, token masuk ${r.data.usage.token_masuk} keluar ${r.data.usage.token_keluar} (cache baca ${r.data.usage.cache_baca}), pencarian ${r.data.usage.pencarian}, ${detik} s (server ${Math.round(r.data.durasiMs / 1000)} s), terpotong=${r.data.terpotong}`;
  });
  await langkah('tiap saran: judul, ringkasan <= 300, badan bersih (tanpa <a>/URL), kategori sah, catatan >= 1, sumber riset http >= 1, kueri gambar 1-3', async () => {
    const d = HASIL.nyata; wajib(d?.saran?.length >= 1, 'tidak ada saran');
    const KAT = ['nasional', 'daerah', 'hukum', 'kebijakan-publik', 'investigasi', 'lingkungan', 'pekerja', 'umkm', 'sosial', 'ppa', 'podcash'];
    for (const s of d.saran) {
      const m = s.muatan;
      wajib(m.judul.length >= 5 && m.ringkasan.length <= 300 && !/<a[\s>]|https?:\/\/|www\./i.test(m.isiHtml) && KAT.includes(m.kategoriSlug) && m.catatanVerifikasi.length >= 1 && m.sumberRiset.length >= 1 && m.sumberRiset.every((x) => /^https?:\/\//.test(x.url)) && m.kueriGambar.length >= 1 && m.kueriGambar.length <= 3, `saran ${s.id}: ${JSON.stringify({ judul: m.judul, kat: m.kategoriSlug, catatan: m.catatanVerifikasi.length, sumber: m.sumberRiset.length, kueri: m.kueriGambar })}`);
    }
    return d.saran.map((s) => `[${s.muatan.kategoriSlug}] "${s.muatan.judul.slice(0, 60)}" (${s.muatan.isiHtml.replace(/<[^>]+>/g, '').split(/\s+/).length} kata, catatan ${s.muatan.catatanVerifikasi.length}, sumber ${s.muatan.sumberRiset.length}, kueri: ${s.muatan.kueriGambar.join(' | ')})`).join('\n       ');
  });
  await langkah('kartu tampil: /staf/artikel/asisten (penulis) memuat judul saran, kotak catatan verifikasi, tombol "Gunakan draf ini", sumber riset', async () => {
    const h = await halaman('/staf/artikel/asisten', TK.penulis); const t = tanpaSkrip(h.html);
    const judul = HASIL.nyata.saran[0].muatan.judul.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    wajib(h.s === 200 && t.includes(judul.slice(0, 40)) && /Catatan verifikasi/.test(t) && /Gunakan draf ini/.test(t) && /Sumber riset \(internal redaksi/.test(t), `HTTP ${h.s} judul=${t.includes(judul.slice(0, 40))}`);
    return 'judul + catatan + tombol + sumber tampil';
  });
  await langkah('pakai saran[0] -> artikel DRAF terisi penuh (judul, ringkasan, isi, kategori, tag, gambar) + ai_saran_id', async () => {
    const r = await api('POST', `/api/staf/ai/saran/${HASIL.nyata.saran[0].id}/pakai`, TK.penulis);
    wajib(r.s === 201 && r.data.artikelId, `${r.s} ${JSON.stringify(r.data).slice(0, 200)}`);
    HASIL.artikelNyata = r.data.artikelId; HASIL.gambarNyata = r.data.gambar;
    const a = (await kueri(`SELECT a.judul, a.ringkasan, a.isi, a.status, a.gambar_utama, a.slug, a.ai_saran_id, a.penulis_id, k.slug AS kslug FROM artikel a JOIN kategori_artikel k ON k.id = a.kategori_id WHERE a.id = ?`, [r.data.artikelId]))[0];
    const tag = Number((await kueri(`SELECT COUNT(*) AS n FROM artikel_tag WHERE artikel_id = ?`, [r.data.artikelId]))[0].n);
    wajib(a.status === 'draf' && a.judul && a.ringkasan && a.isi.length > 500 && Number(a.ai_saran_id) === HASIL.nyata.saran[0].id && Number(a.penulis_id) === idPenulis, JSON.stringify({ status: a.status, isi: a.isi.length }));
    wajib(!/<a[\s>]|https?:\/\/|www\./i.test(a.isi), 'badan artikel memuat tautan/URL');
    HASIL.slugNyata = a.slug; HASIL.artikelNyataGambar = a.gambar_utama;
    writeFileSync('laporan/bukti-ai-1/e-e2e-nyata-artikel.json', JSON.stringify({ artikelId: r.data.artikelId, gambar: r.data.gambar, artikel: a, tag }, null, 2));
    return `artikel ${r.data.artikelId} draf; kategori ${a.kslug}; tag ${tag}; isi ${a.isi.length} karakter; gambar ${a.gambar_utama || '(penampung: ' + r.data.gambar?.catatan + ')'} dari ${r.data.gambar?.penyedia || '-'}`;
  });
  await langkah('gambar >= 1200 px (sharp) + asal foto internal tersimpan', async () => {
    wajib(HASIL.artikelNyataGambar, `tidak ada gambar: ${HASIL.gambarNyata?.catatan}`);
    const meta = await sharp(jalurDisk(HASIL.artikelNyataGambar)).metadata();
    const s = urai((await kueri(`SELECT gambar_sumber FROM ai_saran WHERE id = ?`, [HASIL.nyata.saran[0].id]))[0].gambar_sumber);
    wajib(meta.width >= 1200 && s?.penyedia && s.lisensi, `lebar ${meta.width} sumber ${JSON.stringify(s).slice(0, 100)}`);
    return `${meta.width}x${meta.height}; ${s.penyedia} | ${s.lisensi} | kueri "${s.kueri}" | statistik ${JSON.stringify(s.statistik)}`;
  });
  await langkah('pratinjau 200 tanpa kata bocor; editor berpita; publik 404 (draf tidak tampil); badan bersih terbukti di DB', async () => {
    const p = await halaman(`/staf/artikel/${HASIL.artikelNyata}/pratinjau`, TK.penulis); const tp = tanpaSkrip(p.html);
    const s = urai((await kueri(`SELECT gambar_sumber FROM ai_saran WHERE id = ?`, [HASIL.nyata.saran[0].id]))[0].gambar_sumber);
    const bocor = periksaBocor(tp.replace(/Asisten AI/g, ''), [s?.urlAsal, ...HASIL.nyata.saran[0].muatan.sumberRiset.map((x) => x.url)]);
    const e = await halaman(`/staf/artikel/${HASIL.artikelNyata}`, TK.penulis);
    const pub = await halaman(`/berita/${HASIL.slugNyata}`);
    wajib(p.s === 200 && bocor.length === 0 && e.s === 200 && /Draf AI: verifikasi redaksi sebelum terbit/.test(tanpaSkrip(e.html)) && pub.s === 404, `pratinjau ${p.s} bocor=${bocor.join(',')} editor ${e.s} publik ${pub.s}`);
    return `pratinjau 200 bocor=0; editor berpita; publik 404; artikel ${HASIL.artikelNyata} dibiarkan DRAF untuk uji UI`;
  });
  await langkah('audit_log: ai_saran_buat (token, model, pencarian) + ai_saran_pakai tercatat tanpa isi draf', async () => {
    const r = await kueri(`SELECT aksi, detail FROM audit_log WHERE aksi IN ('ai_saran_buat', 'ai_saran_pakai') ORDER BY id DESC LIMIT 2`);
    wajib(r.length === 2, `baris ${r.length}`); const d = r.map((x) => urai(x.detail));
    wajib(!JSON.stringify(d).includes('isiHtml'), 'audit memuat isi draf');
    return r.map((x, i) => `${x.aksi}: ${JSON.stringify(d[i]).slice(0, 160)}`).join(' || ');
  });
}

await tutupPool();
console.log(`\nRINGKASAN e2e lokal (${MODE}): ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(gagal ? 1 : 0);
