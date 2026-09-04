#!/usr/bin/env node
// QA-2 C3b — TOMBOL KEMBALI & MUAT ULANG DI TENGAH FORMULIR (Chrome headless lewat CDP).
// Yang diuji, semua dengan aksi peramban sungguhan (bukan fetch):
//   1. filter & paginasi: pilih filter -> tombol kembali mengembalikan keadaan sebelumnya (URL + isi), tanpa galat konsol;
//   2. tautan artikel: buka detail -> kembali ke daftar utuh;
//   3. formulir pengaduan: isi separuh -> pindah halaman -> kembali -> halaman utuh dan masih bisa dipakai;
//   4. formulir pengaduan: isi separuh -> MUAT ULANG (F5) -> halaman utuh, token formulir baru, kiriman tetap berhasil;
//   5. setelah kiriman berhasil -> tombol kembali TIDAK mengirim ulang (jumlah pengaduan tidak bertambah);
//   6. ruang staf: filter kelola artikel + editor artikel (isi -> muat ulang) tanpa galat;
//   7. /lacak: cari nomor -> kembali -> formulir utuh.
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar (disk C: pernah penuh oleh profil sisa).
// Pemakaian: node laporan/bukti-qa-2/skrip/uji-c3b-kembali-muatulang.mjs [URL] [URL staf]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U;
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };

const masuk = async (email, sandi) => { const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const TK = await masuk(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
const jum = async () => { const r = await fetch(`${US}/api/staf/pengaduan?perHalaman=1`, { headers: { cookie: `warkop_token=${TK}` } }); return (await r.json()).total; };

const port = 9400 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
wajib(t, 'Chrome tidak dapat dijalankan');
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let konsol = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split('\n')[0].slice(0, 130));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 130));
  if (m.method === 'Network.responseReceived' && p.response.status >= 500) konsol.push(`${p.response.status} ${p.response.url.slice(0, 80)}`);
};
const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const buka = async (url, ms = 2500) => { await kirim('Page.navigate', { url }); await tidur(ms); };
const kembali = async (ms = 2200) => { await ev('history.back()'); await tidur(ms); };
const muatUlang = async (ms = 2500) => { await kirim('Page.reload'); await tidur(ms); };
const jalurKini = () => ev('location.pathname + location.search');
const bersih = () => { const k = konsol.slice(); konsol = []; return k; };
// Menyetel nilai kolom React lewat setter asli agar onChange ikut terpanggil.
const SETTER = `const setNilai = (el, v) => { const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };`;

console.log(`# QA-2 C3b — tombol kembali & muat ulang — ${U} — ${new Date().toISOString()}`);

console.log('\n## A. Filter, paginasi, dan tautan: tombol kembali');
// CATATAN PERILAKU (QA-2 B6): mengganti filter memakai router.replace, jadi penggantian filter TIDAK menambah
// entri riwayat (menghindari puluhan entri saat pengguna mencoba beberapa filter). Yang harus benar dan diuji di
// sini: (1) gulir tidak melompat saat filter berlaku; (2) setelah membuka halaman rinci DARI daftar yang tersaring,
// tombol kembali mengembalikan daftar LENGKAP DENGAN filternya.
await langkah('/berita: filter kategori berlaku tanpa lompat gulir; buka artikel dari daftar tersaring → kembali → filter masih terpasang', async () => {
  await buka(`${U}/berita`); bersih();
  await ev('window.scrollTo(0, 300)'); await tidur(300);
  const gulirAwal = await ev('window.scrollY');
  const nilai = await ev(`(() => { ${SETTER} const s = document.querySelector('select[name="kategori"]'); if (!s) return null; const o = [...s.options].find(o => o.value); setNilai(s, o.value); return o.value; })()`);
  wajib(nilai, 'select kategori tidak ditemukan di /berita');
  await tidur(2600);
  const tersaring = await jalurKini();
  wajib(tersaring.includes(nilai), `URL tidak memuat filter: ${tersaring}`);
  const gulirSesudah = await ev('window.scrollY');
  wajib(Math.abs(gulirSesudah - gulirAwal) < 120, `gulir melompat ${gulirAwal} → ${gulirSesudah}`);
  const pindah = await ev(`(() => { const a = [...document.querySelectorAll('a[href^="/berita/"]')].find(a => a.getBoundingClientRect().width > 0); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  wajib(pindah, 'daftar tersaring tidak memuat artikel yang bisa diklik');
  await tidur(2600);
  wajib((await jalurKini()).startsWith('/berita/'), `tidak berpindah ke detail: ${await jalurKini()}`);
  await kembali(2600);
  const balik = await jalurKini();
  wajib(balik === tersaring, `kembali ke ${balik}, seharusnya daftar tersaring ${tersaring}`);
  const nilaiSelect = await ev(`document.querySelector('select[name="kategori"]')?.value || ''`);
  wajib(nilaiSelect === nilai, `select tidak lagi menunjukkan filter (${nilaiSelect})`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `gulir ${gulirAwal} → ${gulirSesudah}; ${tersaring} → detail → kembali ${balik} (filter "${nilaiSelect}" tetap)`;
});
await langkah('/program: ubah urutan tampil → berlaku tanpa lompat gulir; konsol bersih', async () => {
  await buka(`${U}/program`); bersih();
  await ev('window.scrollTo(0, 400)'); await tidur(300);
  const gulirAwal = await ev('window.scrollY');
  const nilai = await ev(`(() => { ${SETTER} const s = document.querySelector('select[name="urut"]'); if (!s) return null; const o = [...s.options].find(o => o.value && o.value !== s.value); if (!o) return null; setNilai(s, o.value); return o.value; })()`);
  wajib(nilai, 'select urut tidak ditemukan di /program');
  await tidur(2600);
  const sesudah = await jalurKini();
  const gulirSesudah = await ev('window.scrollY');
  wajib(sesudah.includes(nilai), `URL tidak memuat urutan: ${sesudah}`);
  wajib(Math.abs(gulirSesudah - gulirAwal) < 120, `gulir melompat ${gulirAwal} → ${gulirSesudah}`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `${sesudah}; gulir ${gulirAwal} → ${gulirSesudah}`;
});
await langkah('/berita: klik kartu artikel → detail 200 → kembali → daftar utuh (jumlah kartu sama)', async () => {
  await buka(`${U}/berita`); bersih();
  const kartuAwal = await ev(`document.querySelectorAll('article, [data-kartu]').length`);
  const pindah = await ev(`(() => { const a = [...document.querySelectorAll('a[href^="/berita/"]')].find(a => a.getBoundingClientRect().width > 0); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  wajib(pindah, 'tidak ada tautan artikel');
  await tidur(2600);
  const detail = await jalurKini();
  wajib(detail.startsWith('/berita/'), `tidak berpindah ke detail: ${detail}`);
  const judul = await ev(`document.querySelector('h1')?.innerText.trim().slice(0, 60) || ''`);
  wajib(judul.length > 3, 'detail tanpa judul');
  await kembali();
  const balik = await jalurKini(); const kartuBalik = await ev(`document.querySelectorAll('article, [data-kartu]').length`);
  wajib(balik === '/berita', `kembali ke ${balik}`);
  wajib(kartuBalik === kartuAwal, `kartu ${kartuAwal} → ${kartuBalik}`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `detail "${judul}" → kembali /berita (${kartuBalik} kartu)`;
});

console.log('\n## B. Formulir pengaduan: pindah halaman lalu kembali, dan muat ulang di tengah pengisian');
const isiFormulir = async (teks) => ev(`(() => { ${SETTER}
  const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea#deskripsi'));
  if (!f) return null;
  const anon = f.querySelector('#anon-toggle'); if (anon && !anon.checked) anon.click();
  const kat = f.querySelector('#kategori_masalah'); setNilai(kat, [...kat.options].find(o => o.value).value);
  const wil = f.querySelector('#wilayah_id'); if (wil) setNilai(wil, [...wil.options].find(o => o.value).value);
  setNilai(f.querySelector('#deskripsi'), ${JSON.stringify(teks)});
  return { kategori: kat.value, deskripsi: f.querySelector('#deskripsi').value.length };
})()`);
await langkah('/kontak: isi separuh formulir → pindah ke /faq → tombol kembali → halaman utuh, formulir bisa dipakai lagi', async () => {
  await buka(`${U}/kontak`); bersih();
  const isi = await isiFormulir('Uji QA-2 C3b: isian separuh sebelum berpindah halaman, tidak dikirim.');
  wajib(isi, 'formulir pengaduan tidak ditemukan di /kontak');
  await ev(`(() => { const a = [...document.querySelectorAll('a[href="/faq"]')].find(a => a.getBoundingClientRect().width > 0); if (a) { a.click(); return true; } location.href = '/faq'; return true; })()`);
  await tidur(2600);
  wajib((await jalurKini()) === '/faq', `tidak berpindah ke /faq: ${await jalurKini()}`);
  await kembali(2800);
  const balik = await jalurKini();
  wajib(balik === '/kontak', `kembali ke ${balik}`);
  const bisaDipakai = await isiFormulir('Uji QA-2 C3b: formulir diisi ulang setelah tombol kembali, tidak dikirim.');
  wajib(bisaDipakai && bisaDipakai.deskripsi > 20, 'formulir tidak bisa diisi lagi setelah kembali');
  const galatTampil = await ev(`/Application error|Terjadi kesalahan tak terduga/.test(document.body.innerText)`);
  wajib(!galatTampil, 'halaman menampilkan teks galat');
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return 'kembali ke /kontak, formulir utuh dan bisa diisi ulang';
});
await langkah('/kontak: isi formulir → MUAT ULANG → halaman utuh, token formulir baru, kolom kosong (tanpa data basi)', async () => {
  await buka(`${U}/kontak`); bersih();
  await isiFormulir('Uji QA-2 C3b: isian yang akan hilang karena muat ulang, tidak dikirim.');
  const tokenLama = await ev(`document.querySelector('input[name="token_formulir"]')?.value || ''`);
  await muatUlang(3000);
  const tokenBaru = await ev(`document.querySelector('input[name="token_formulir"]')?.value || ''`);
  const deskripsi = await ev(`document.querySelector('#deskripsi')?.value ?? null`);
  wajib(tokenBaru && tokenBaru !== tokenLama, `token formulir tidak diperbarui (${tokenLama.slice(0, 12)} → ${tokenBaru.slice(0, 12)})`);
  wajib(deskripsi === '', `kolom deskripsi masih berisi "${String(deskripsi).slice(0, 40)}"`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return 'token formulir diperbarui, kolom bersih, konsol bersih';
});
let nomorKasus = null;
await langkah('/kontak: kirim setelah muat ulang → nomor kasus tampil; tombol kembali TIDAK mengirim ulang', async () => {
  const sebelum = await jum();
  await buka(`${U}/kontak`); bersih();
  await isiFormulir('Uji QA-2 C3b: kiriman sah sesudah muat ulang; dipakai menguji tombol kembali agar tidak mengirim dua kali. Dihapus lunak.');
  await ev(`(() => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea#deskripsi')); [...f.querySelectorAll('button[type=submit]')].pop().click(); return true; })()`);
  for (let i = 0; i < 15 && !nomorKasus; i++) { await tidur(700); nomorKasus = await ev(`document.body.innerText.match(/WRP-\\d{6}/)?.[0] || null`); }
  wajib(nomorKasus, 'nomor kasus tidak muncul setelah kirim');
  const sesudah = await jum();
  wajib(sesudah === sebelum + 1, `jumlah pengaduan ${sebelum} → ${sesudah} (seharusnya +1)`);
  await kembali(2800);
  await tidur(1500);
  const sesudahKembali = await jum();
  wajib(sesudahKembali === sesudah, `tombol kembali menambah pengaduan ${sesudah} → ${sesudahKembali}`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `${nomorKasus}; jumlah ${sebelum} → ${sesudah}, setelah kembali tetap ${sesudahKembali}`;
});
await langkah('/lacak: cari nomor kasus → hasil tampil tanpa identitas → kembali → formulir lacak utuh', async () => {
  await buka(`${U}/lacak`); bersih();
  await ev(`(() => { ${SETTER} const i = document.querySelector('input[name="nomor"], #nomor'); setNilai(i, ${JSON.stringify(nomorKasus || 'WRP-000001')}); const f = i.closest('form'); f.querySelector('button[type=submit]').click(); return true; })()`);
  await tidur(3000);
  const teks = await ev('document.body.innerText');
  wajib(teks.includes(nomorKasus || 'WRP-000001') || /tidak ditemukan/i.test(teks), 'hasil lacak tidak tampil');
  wajib(!/nik|3273010101/i.test(teks), 'hasil lacak memuat identitas');
  await kembali(2500);
  const adaFormulir = await ev(`!!document.querySelector('input[name="nomor"], #nomor')`);
  wajib(adaFormulir, 'formulir lacak hilang setelah kembali');
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return 'hasil bersih dari identitas; formulir utuh setelah kembali';
});

console.log('\n## C. Ruang staf: filter, tombol kembali, dan muat ulang di tengah editor');
await langkah('/staf/artikel: filter status berlaku; buka editor dari daftar tersaring → kembali → daftar tersaring utuh', async () => {
  await buka(`${US}/staf/artikel`, 3000); bersih();
  const nilai = await ev(`(() => { ${SETTER} const s = document.querySelector('select[name="status"]'); if (!s) return null; const o = [...s.options].find(o => o.value); setNilai(s, o.value); return o.value; })()`);
  wajib(nilai, 'select status tidak ada di kelola artikel');
  await tidur(2600);
  const tersaring = await jalurKini();
  wajib(tersaring.includes(nilai), `URL tidak memuat filter: ${tersaring}`);
  const pindah = await ev(`(() => { const a = [...document.querySelectorAll('a[href^="/staf/artikel/"]')].find(a => a.getBoundingClientRect().width > 0 && !/baru|pratinjau/.test(a.getAttribute('href'))); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  if (!pindah) return `filter ${tersaring} berlaku; daftar tersaring kosong sehingga uji kembali dilewati`;
  await tidur(3000);
  wajib((await jalurKini()).startsWith('/staf/artikel/'), `tidak berpindah ke editor: ${await jalurKini()}`);
  await kembali(3000);
  const balik = await jalurKini();
  wajib(balik === tersaring, `kembali ke ${balik}, seharusnya ${tersaring}`);
  const nilaiSelect = await ev(`document.querySelector('select[name="status"]')?.value || ''`);
  wajib(nilaiSelect === nilai, `select tidak lagi menunjukkan filter (${nilaiSelect})`);
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `${tersaring} → editor → kembali ${balik} (filter "${nilaiSelect}" tetap)`;
});
await langkah('/staf/artikel/baru: isi judul & isi → MUAT ULANG → halaman utuh tanpa galat, editor siap dipakai lagi', async () => {
  await buka(`${US}/staf/artikel/baru`, 3200); bersih();
  const terisi = await ev(`(() => { ${SETTER} const j = document.querySelector('input[name="judul"], #judul'); if (!j) return null; setNilai(j, 'Draf uji QA-2 C3b yang tidak disimpan'); const t = document.querySelector('textarea, [contenteditable="true"]'); if (t) { if (t.isContentEditable) t.textContent = 'Isi uji'; else setNilai(t, 'Isi uji QA-2 C3b, tidak disimpan.'); } return j.value.length; })()`);
  wajib(terisi, 'kolom judul tidak ditemukan di editor');
  await muatUlang(3200);
  const galatTampil = await ev(`/Application error|Terjadi kesalahan tak terduga/.test(document.body.innerText)`);
  const siap = await ev(`!!document.querySelector('input[name="judul"], #judul')`);
  wajib(!galatTampil, 'editor menampilkan teks galat setelah muat ulang');
  wajib(siap, 'kolom judul hilang setelah muat ulang');
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return 'editor pulih utuh setelah muat ulang, tanpa galat konsol';
});
await langkah('/staf/pengaduan: pil status (tautan) tanpa lompat gulir → buka detail → kembali → daftar tersaring; detail dimuat ulang tanpa galat', async () => {
  await buka(`${US}/staf/pengaduan`, 3000); bersih();
  await ev('window.scrollTo(0, 250)'); await tidur(300);
  const gulirAwal = await ev('window.scrollY');
  // daftar pengaduan memakai PIL berupa <Link scroll={false}>, bukan <select>
  const pil = await ev(`(() => { const a = [...document.querySelectorAll('a[href*="/staf/pengaduan?"]')].find(a => /status=/.test(a.getAttribute('href')) && a.getBoundingClientRect().width > 0); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  wajib(pil, 'pil filter status tidak ditemukan di daftar pengaduan');
  await tidur(2600);
  const tersaring = await jalurKini();
  const gulirSesudah = await ev('window.scrollY');
  wajib(/status=/.test(tersaring), `URL tidak memuat filter status: ${tersaring}`);
  wajib(Math.abs(gulirSesudah - gulirAwal) < 120, `gulir melompat ${gulirAwal} → ${gulirSesudah}`);
  const adaDetail = await ev(`(() => { const a = [...document.querySelectorAll('a[href^="/staf/pengaduan/"]')].find(a => a.getBoundingClientRect().width > 0); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  let catatanDetail = 'daftar tersaring kosong';
  if (adaDetail) {
    await tidur(3000);
    await muatUlang(3200);
    const galatTampil = await ev(`/Application error|Terjadi kesalahan tak terduga/.test(document.body.innerText)`);
    wajib(!galatTampil, 'detail pengaduan galat setelah muat ulang');
    await kembali(3000);
    const balik = await jalurKini();
    wajib(balik === tersaring, `kembali ke ${balik}, seharusnya ${tersaring}`);
    catatanDetail = 'detail dimuat ulang tanpa galat, kembali ke daftar tersaring';
  }
  const k = bersih(); wajib(k.length === 0, `konsol: ${k.slice(0, 2).join(' | ')}`);
  return `${tersaring}; gulir ${gulirAwal} → ${gulirSesudah}; ${catatanDetail}`;
});

console.log('\n## D. Pembersihan');
await langkah('pengaduan uji dihapus lunak', async () => {
  if (!nomorKasus) return 'tidak ada data uji';
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const { waktuSekarang } = await import('../../../lib/utils.js');
  const r = await kueri('UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=? AND dihapus_pada IS NULL', [waktuSekarang(), waktuSekarang(), nomorKasus]);
  await tutupPool();
  return `${r.affectedRows} pengaduan (${nomorKasus})`;
});

ws.close(); chrome.kill();
console.log(`\nRINGKASAN C3b: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
