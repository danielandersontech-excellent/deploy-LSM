#!/usr/bin/env node
// RUN AI-1 E — verifikasi PRODUKSI end-to-end dengan akun uji (pola sesi-uji-produksi QA-4; token lewat env TOKEN_STAF,
// akun qa2.verifikasi.* = redaktur). SATU panggilan Anthropic sungguhan (topik netral) -> saran -> pakai -> draf ada ->
// pratinjau 200 -> publik 404 -> HAPUS artikel (API) + saran + berkas gambar uji (lewat SSH, hanya objek warkop) sampai
// bersih. TIDAK menerbitkan apa pun. Nilai rahasia tidak dicetak.
// Pemakaian: TOKEN_STAF=<token> node laporan/bukti-ai-1/skrip/uji-produksi.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const UP = 'https://warkopnusantara.id';
const US = 'https://staf.warkopnusantara.id';
const TOPIK = process.env.TOPIK_UJI || 'banjir';
const tk = process.env.TOKEN_STAF;
if (!tk) { console.log('GAGAL: TOKEN_STAF kosong'); process.exit(1); }
const ssh = (perintah, input) => execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', perintah], { input, encoding: 'utf8' });
const sql = (teks) => ssh(`cat > /tmp/ai1.sql && docker exec -i kwoz3jwjb037hw3oh669g9c4 sh -c 'exec mariadb -u$MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE' < /tmp/ai1.sql; rm -f /tmp/ai1.sql`, teks);
const api = async (m, j, b) => { const r = await fetch(`${US}${j}`, { method: m, headers: { ...(b !== undefined ? { 'content-type': 'application/json' } : {}), cookie: `warkop_token=${tk}` }, body: b !== undefined ? JSON.stringify(b) : undefined, redirect: 'manual' }); let d = {}; try { d = await r.json(); } catch { /* bukan JSON */ } return { s: r.status, d }; };
const halaman = async (u) => { const r = await fetch(u, { headers: { cookie: `warkop_token=${tk}` }, redirect: 'manual' }); return { s: r.status, html: await r.text() }; };
const tanpaSkrip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '');
let no = 0, gagal = 0; const H = {};
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} -> ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} -> GAGAL: ${g?.message || g}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };

console.log(`# RUN AI-1 E — verifikasi PRODUKSI end-to-end — ${new Date().toISOString()} — topik "${TOPIK}"`);
await langkah('sesi akun uji: GET /api/auth/saya 200 (redaktur)', async () => { const r = await api('GET', '/api/auth/saya'); wajib(r.s === 200 && r.d.pengguna?.peran === 'redaktur', `${r.s} ${JSON.stringify(r.d).slice(0, 100)}`); H.idUser = r.d.pengguna.id; return `id ${r.d.pengguna.id} peran ${r.d.pengguna.peran}`; });
await langkah('halaman /staf/artikel/asisten 200 (form topik, sisa kuota) + tombol Asisten AI di /staf/artikel', async () => {
  const a = await halaman(`${US}/staf/artikel/asisten`); const b = await halaman(`${US}/staf/artikel`);
  wajib(a.s === 200 && /name="topik"/.test(a.html) && /Sisa kuota hari ini/.test(a.html), `asisten ${a.s}`);
  wajib(b.s === 200 && /href="\/staf\/artikel\/asisten"/.test(b.html), `kelola ${b.s}`); return '200 + 200';
});
await langkah('pagar: tanpa sesi POST /api/staf/ai/saran 401; validasi {} 422', async () => {
  const a = await fetch(`${US}/api/staf/ai/saran`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"topik":"banjir"}' });
  const b = await api('POST', '/api/staf/ai/saran', {}); wajib(a.status === 401 && b.s === 422, `${a.status}/${b.s}`); return '401/422';
});
await langkah(`SATU panggilan Anthropic produksi: POST saran {topik:"${TOPIK}"} -> 201 (token dicatat)`, async () => {
  const mulai = Date.now(); const r = await api('POST', '/api/staf/ai/saran', { topik: TOPIK }); const detik = ((Date.now() - mulai) / 1000).toFixed(1);
  wajib(r.s === 201 && r.d.saran?.length >= 1, `${r.s} ${JSON.stringify(r.d).slice(0, 300)}`);
  H.saran = r.d; writeFileSync('laporan/bukti-ai-1/e-produksi-balasan.json', JSON.stringify({ ...r.d, durasiKlienDetik: detik, dicatat: new Date().toISOString() }, null, 2));
  return `${r.d.saran.length} saran, ditolak ${r.d.ditolak.length}, model ${r.d.model}, token masuk ${r.d.usage.token_masuk} keluar ${r.d.usage.token_keluar}, pencarian ${r.d.usage.pencarian}, ${detik} s; judul[0]="${r.d.saran[0].muatan.judul.slice(0, 70)}"`;
});
await langkah('pakai saran[0] -> 201 artikelId; draf terbaca lewat GET /api/staf/artikel/[id] (status draf, ringkasan, isi bersih)', async () => {
  const p = await api('POST', `/api/staf/ai/saran/${H.saran.saran[0].id}/pakai`); wajib(p.s === 201 && p.d.artikelId, `${p.s} ${JSON.stringify(p.d).slice(0, 200)}`);
  H.artikelId = p.d.artikelId; H.gambar = p.d.gambar;
  const a = await api('GET', `/api/staf/artikel/${H.artikelId}`); wajib(a.s === 200 && a.d.artikel.status === 'draf' && a.d.artikel.isi.length > 500 && !/<a[\s>]|https?:\/\//i.test(a.d.artikel.isi), `artikel ${a.s} ${a.d.artikel?.status}`);
  H.slug = a.d.artikel.slug; H.gambarJalur = a.d.artikel.gambar_utama;
  return `artikel ${H.artikelId} draf, slug ${H.slug}, kategori ${a.d.artikel.kategori_slug}, tag ${a.d.tag.length}, gambar ${H.gambarJalur || '(penampung)'} dari ${H.gambar?.penyedia || '-'}${H.gambar?.catatan ? ` (${H.gambar.catatan})` : ''}`;
});
await langkah('gambar tersaji 200 dari /unggahan/ai (bila ada) + editor berpita Draf AI + pratinjau 200 tanpa kata bocor', async () => {
  let g = 'tanpa gambar';
  if (H.gambarJalur) { const r = await fetch(`${US}${H.gambarJalur}`, { headers: { cookie: `warkop_token=${tk}` } }); wajib(r.status === 200 && /^image\//.test(r.headers.get('content-type') || ''), `gambar ${r.status}`); g = `gambar 200 ${r.headers.get('content-type')} ${r.headers.get('content-length')} B`; }
  const e = await halaman(`${US}/staf/artikel/${H.artikelId}`); wajib(e.s === 200 && /Draf AI: verifikasi redaksi sebelum terbit/.test(tanpaSkrip(e.html)), `editor ${e.s}`);
  const p = await halaman(`${US}/staf/artikel/${H.artikelId}/pratinjau`); const t = tanpaSkrip(p.html).toLowerCase();
  const bocor = ['sumber riset', 'pixabay', 'openverse', 'wikimedia', 'pexels', 'lisensi', 'catatan verifikasi', 'draf ai'].filter((k) => t.includes(k));
  wajib(p.s === 200 && bocor.length === 0, `pratinjau ${p.s} bocor=${bocor.join(',')}`); return `${g}; editor berpita; pratinjau 200 bocor=0`;
});
await langkah('publik: /berita/[slug] 404 dan /api/artikel/[slug] 404 (draf TIDAK tampil; tidak ada yang diterbitkan)', async () => {
  const a = await fetch(`${UP}/berita/${H.slug}`, { redirect: 'manual' }); const b = await fetch(`${UP}/api/artikel/${H.slug}`); wajib(a.status === 404 && b.status === 404, `${a.status}/${b.status}`); return '404/404';
});
await langkah('bersih-bersih: DELETE artikel (API) -> saran + audit uji + berkas gambar dihapus (SSH, objek warkop) -> verifikasi nihil', async () => {
  const d = await api('DELETE', `/api/staf/artikel/${H.artikelId}`); wajib(d.s === 200, `hapus ${d.s}`);
  const idSaran = H.saran.saran.map((s) => Number(s.id)).filter(Number.isInteger);
  const sebelum = sql(`SELECT id, status, artikel_id, gambar_jalur FROM ai_saran WHERE id IN (${idSaran.join(',')});`).trim();
  const berkas = sebelum.split('\n').slice(1).map((b) => b.split('\t')[3]).filter((j) => j && j !== 'NULL');
  for (const j of berkas) ssh(`docker exec $(docker ps -q --filter name=re8snqu | head -1) rm -f /app/public/unggahan${j.replace(/^\/unggahan/, '')} && echo "berkas ${j} dihapus"`);
  sql(`DELETE FROM ai_saran WHERE id IN (${idSaran.join(',')}) AND pemakai_id = ${Number(H.idUser)};`);
  const sisa = sql(`SELECT COUNT(*) AS n FROM ai_saran WHERE id IN (${idSaran.join(',')}); SELECT COUNT(*) AS n FROM artikel WHERE id = ${Number(H.artikelId)};`).trim();
  wajib(/\b0\b/.test(sisa) && !/\b[1-9]\d*\b/.test(sisa.replace(/^n\s*$/gm, '')), `sisa: ${sisa}`);
  const pub = await fetch(`${UP}/berita/${H.slug}`); wajib(pub.status === 404, 'publik bukan 404');
  return `artikel ${H.artikelId} dihapus; ${idSaran.length} saran dihapus; ${berkas.length} berkas dihapus; sisa=0`;
});
console.log(`\nRINGKASAN verifikasi produksi: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(gagal ? 1 : 0);
