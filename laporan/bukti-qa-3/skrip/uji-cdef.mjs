#!/usr/bin/env node
// QA-3 C/D/E/F — uji butir permintaan pemilik.
//   C  Navbar publik TANPA "Masuk Staff" di mana pun (navbar, laci seluler, seluruh halaman publik);
//      halaman /login tetap 200 lewat URL langsung.
//   D1 Latar footer membentang penuh: elemen <footer> selebar layar, isinya di dalam kontainer.
//   D2 Tautan cepat "Kantor Pusat" -> Google Maps, tab baru + rel noopener, alamatnya dari pengaturan.
//   E  Ikon sosial HANYA untuk kanal yang terisi; SVG inline (bukan unduhan); tab baru + rel noopener;
//      mengisi kanal lain lewat API Pengaturan langsung memunculkan ikonnya, lalu dipulihkan.
//   F  Kategori program dinamis: "Kategori Lainnya..." membuat kategori baru lewat server (nama wajar,
//      tanpa duplikat, slug otomatis) dan langsung muncul di filter publik /program serta ruang staf.
// Pemakaian: node laporan/bukti-qa-3/skrip/uji-cdef.mjs [URL] [URL staf]
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://127.0.0.1:3000'; const US = argv[1] || U;
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan) => {
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: { ...(badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 150) }; }
  return { s: r.status, j };
};
const login = async (email, sandi) => { const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); wajib(r.status === 200, `login ${email} HTTP ${r.status}`); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const halaman = async (jalur, tk) => { const r = await fetch(`${jalur.startsWith('/staf') ? US : U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, mentah: r.status === 200 ? await r.text() : '' }; };
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');

const HALAMAN_PUBLIK = ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas'];

console.log(`# QA-3 C/D/E/F — permintaan pemilik — ${U} — ${new Date().toISOString()}`);
const tk = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
const tkRedaktur = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);

console.log('\n## C — "Masuk Staff" hilang dari situs publik');
await langkah(`${HALAMAN_PUBLIK.length} halaman publik: 0 penyebutan "Masuk Staff" dan 0 tautan ke /login`, async () => {
  const pelanggaran = [];
  for (const p of HALAMAN_PUBLIK) {
    const h = await halaman(p);
    wajib(h.s === 200, `${p} HTTP ${h.s}`);
    const dom = tanpaSkrip(h.mentah);
    if (/Masuk Staff/i.test(dom)) pelanggaran.push(`${p}: teks "Masuk Staff"`);
    if (/href="[^"]*\/login/i.test(dom)) pelanggaran.push(`${p}: tautan ke /login`);
    if (/staf\.[a-z0-9.-]+\/login/i.test(dom)) pelanggaran.push(`${p}: alamat host staf`);
  }
  wajib(pelanggaran.length === 0, pelanggaran.join('; '));
  return `${HALAMAN_PUBLIK.length} halaman bersih`;
});
await langkah('halaman masuk TETAP berfungsi lewat URL langsung (/login 200 dengan formulir)', async () => {
  const h = await halaman('/login');
  wajib(h.s === 200, `HTTP ${h.s}`);
  wajib(h.mentah.includes('id="staff-id"') && h.mentah.includes('id="password"'), 'formulir masuk tidak lengkap');
  return '200, formulir email + kata sandi ada';
});

console.log('\n## D — footer');
await langkah('D1: <footer> selebar layar (tanpa max-w di elemen luar), isi tetap di kontainer max-w-container-max', async () => {
  const dom = tanpaSkrip((await halaman('/')).mentah);
  const m = dom.match(/<footer class="([^"]*)"/);
  wajib(m, 'elemen footer tidak ditemukan');
  const kelasLuar = m[1];
  wajib(/bg-primary/.test(kelasLuar), `latar tidak di elemen luar: ${kelasLuar}`);
  wajib(/w-full/.test(kelasLuar), `elemen luar tidak w-full: ${kelasLuar}`);
  wajib(!/max-w-container-max/.test(kelasLuar), `elemen luar masih dibatasi kontainer: ${kelasLuar}`);
  const sesudah = dom.slice(m.index, m.index + 400);
  wajib(/max-w-container-max/.test(sesudah), 'kontainer isi footer tidak ditemukan tepat di dalam footer');
  return `luar: ${kelasLuar.slice(0, 70)}...; kontainer isi ada di dalamnya`;
});
await langkah('D2: tautan "Kantor Pusat" ke Google Maps, target _blank + rel noopener; "Kantor Regional" hilang', async () => {
  const dom = tanpaSkrip((await halaman('/')).mentah);
  wajib(!/Kantor Regional/.test(dom), 'teks lama "Kantor Regional" masih ada');
  const m = dom.match(/<a[^>]*href="([^"]*maps[^"]*)"[^>]*>\s*Kantor Pusat\s*<\/a>/);
  wajib(m, 'tautan "Kantor Pusat" ke peta tidak ditemukan');
  const tag = m[0];
  wajib(m[1].includes('destination=0.504192,101.427052'), `titik tujuan salah: ${m[1]}`);
  wajib(m[1].startsWith('https://www.google.com/maps/dir/?api=1'), `format tautan bukan petunjuk arah: ${m[1]}`);
  wajib(/target="_blank"/.test(tag), 'tidak membuka tab baru');
  wajib(/rel="noopener/.test(tag), 'tanpa rel noopener');
  return `${m[1]}`;
});
await langkah('D2: alamat peta tersimpan sebagai pengaturan (K3) dan dapat diubah lewat API', async () => {
  const g = await api('GET', '/api/staf/pengaturan', tk);
  wajib(g.s === 200 && g.j.nilai.kontak_peta_url, 'kunci kontak_peta_url tidak ada di pengaturan');
  const asli = g.j.nilai.kontak_peta_url;
  const a = await api('PATCH', '/api/staf/pengaturan', tk, { kontak_peta_url: 'https://www.google.com/maps/dir/?api=1&destination=1.1,2.2' });
  wajib(a.s === 200, `PATCH ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  const dom = tanpaSkrip((await halaman('/')).mentah);
  wajib(dom.includes('destination=1.1,2.2'), 'footer tidak memakai nilai pengaturan yang baru');
  const b = await api('PATCH', '/api/staf/pengaturan', tk, { kontak_peta_url: asli });
  wajib(b.s === 200, `pulih ${b.s}`);
  return `diubah lalu dipulihkan ke ${asli.slice(0, 60)}...`;
});

console.log('\n## E — media sosial');
await langkah('hanya kanal TERISI yang tampil: TikTok ada, Instagram/YouTube/Facebook tidak', async () => {
  const dom = tanpaSkrip((await halaman('/')).mentah);
  const m = dom.match(/<a[^>]*href="(https:\/\/www\.tiktok\.com[^"]*)"[^>]*aria-label="([^"]*)"[^>]*>/) || dom.match(/<a[^>]*aria-label="TikTok[^"]*"[^>]*href="([^"]*)"[^>]*>/);
  wajib(m, 'tautan TikTok tidak ditemukan di footer');
  wajib(dom.includes('https://www.tiktok.com/@warkop.nusantara_media'), 'alamat TikTok pemilik tidak dipakai');
  for (const kosong of ['instagram.com', 'youtube.com', 'facebook.com']) {
    wajib(!dom.includes(kosong), `kanal kosong ${kosong} tetap dirender`);
  }
  wajib(/aria-label="TikTok WARKOP NUSANTARA \(tab baru\)"/.test(dom), 'label aksesibilitas ikon TikTok tidak ada');
  return 'TikTok tampil; tiga kanal kosong tidak dirender';
});
await langkah('ikon sosial = SVG inline buatan sendiri (bukan berkas unduhan, bukan <img>)', async () => {
  const dom = tanpaSkrip((await halaman('/')).mentah);
  const i = dom.indexOf('tiktok.com');
  const sekitar = dom.slice(i, i + 700);
  wajib(/<svg[^>]*viewBox="0 0 24 24"/.test(sekitar), 'ikon bukan SVG inline');
  wajib(/fill="currentColor"/.test(sekitar), 'ikon tidak mewarisi warna teks');
  wajib(!/<img[^>]*tiktok/i.test(dom) && !/https?:\/\/(?!www\.tiktok)[^"]*(png|svg|jpg)/i.test(sekitar), 'ikon memakai berkas gambar dari luar');
  return 'SVG inline 24x24 currentColor';
});
await langkah('mengisi Instagram lewat Pengaturan memunculkan ikonnya; dikosongkan lagi -> hilang', async () => {
  const a = await api('PATCH', '/api/staf/pengaturan', tk, { sosial_instagram: 'https://www.instagram.com/uji_qa3' });
  wajib(a.s === 200, `PATCH ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  let dom = tanpaSkrip((await halaman('/')).mentah);
  wajib(dom.includes('https://www.instagram.com/uji_qa3'), 'ikon Instagram tidak muncul setelah diisi');
  const b = await api('PATCH', '/api/staf/pengaturan', tk, { sosial_instagram: '' });
  wajib(b.s === 200, `kosongkan ${b.s}`);
  dom = tanpaSkrip((await halaman('/')).mentah);
  wajib(!dom.includes('instagram.com'), 'ikon Instagram masih ada setelah dikosongkan');
  return 'muncul saat diisi, hilang saat dikosongkan';
});
await langkah('URL sosial tidak sah ditolak (http biasa, javascript:, teks bebas)', async () => {
  const hasil = [];
  for (const nilai of ['http://www.instagram.com/x', 'javascript:alert(1)', 'instagram saya']) {
    const a = await api('PATCH', '/api/staf/pengaturan', tk, { sosial_instagram: nilai });
    wajib(a.s === 422 && a.j.kode === 'TIPE_URL', `"${nilai}" HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
    hasil.push(`${nilai.slice(0, 18)}→422`);
  }
  return hasil.join(', ');
});

console.log('\n## F — kategori program dinamis');
let idProgramUji = null; const slugBaru = `uji-qa3-kategori-${Date.now().toString(36)}`;
await langkah('"Kategori Lainnya..." membuat kategori baru dan program tersimpan memakainya', async () => {
  const nama = `Uji QA3 Kategori ${Date.now().toString(36)}`;
  const a = await api('POST', '/api/staf/program', tkRedaktur, {
    judul: 'Program uji kategori dinamis QA-3', ringkasan: 'Program uji untuk kategori dinamis, dihapus di akhir.',
    kategori: '', kategori_baru: nama, status: 'berjalan', wilayah_id: null, gambar: null, mulai_pada: '2026-09-01',
  });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 160)}`);
  idProgramUji = a.j.program.id;
  wajib(a.j.kategori?.baru === true, 'server tidak menandai kategori sebagai baru');
  wajib(a.j.program.kategori === a.j.kategori.slug, `slug program ${a.j.program.kategori} != ${a.j.kategori.slug}`);
  globalThis.__slugKategoriUji = a.j.kategori.slug;
  globalThis.__namaKategoriUji = nama;
  return `kategori "${nama}" -> slug ${a.j.kategori.slug}; program id ${idProgramUji}`;
});
await langkah('kategori baru langsung muncul di filter publik /program dan menyaring dengan benar', async () => {
  const slug = globalThis.__slugKategoriUji;
  const h = await halaman('/program');
  const dom = tanpaSkrip(h.mentah);
  wajib(dom.includes(globalThis.__namaKategoriUji), 'kategori baru tidak ada di filter publik');
  const tersaring = tanpaSkrip((await halaman(`/program?kategori=${slug}`)).mentah);
  wajib(tersaring.includes('Program uji kategori dinamis QA-3'), 'filter kategori baru tidak menampilkan programnya');
  const lain = tanpaSkrip((await halaman('/program?kategori=bantuan-hukum')).mentah);
  wajib(!lain.includes('Program uji kategori dinamis QA-3'), 'program muncul di kategori lain');
  return `filter ?kategori=${slug} menampilkan program uji, kategori lain tidak`;
});
await langkah('ruang staf: formulir Tambah Program memuat kategori baru + pilihan "Kategori Lainnya..." yang memunculkan kolom isian (diklik sungguhan di Chrome)', async () => {
  const h = await halaman('/staf/program', tkRedaktur);
  wajib(h.s === 200, `HTTP ${h.s}`);
  wajib(h.mentah.includes(globalThis.__namaKategoriUji), 'kategori baru tidak tampil di daftar program staf');
  // Panel formulir baru dirender SETELAH tombol "Tambah Program" ditekan -> harus diuji di peramban.
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawn } = await import('node:child_process');
  const profil = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
  const port = 9600 + Math.floor(Math.random() * 90);
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${profil}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
    wajib(t, 'Chrome tidak dapat dijalankan');
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
    let id = 0; const tunggu = new Map(); const konsol = [];
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; }
      if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (m.params.exceptionDetails.exception?.description || '').split(String.fromCharCode(10))[0].slice(0, 120));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') konsol.push('console.error ' + m.params.args.map((a) => a.value ?? '').join(' ').slice(0, 120)); };
    const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
    await kirim('Page.enable'); await kirim('Runtime.enable');
    await kirim('Network.enable');
    await kirim('Network.setCookie', { name: 'warkop_token', value: tkRedaktur, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
    const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
    await kirim('Page.navigate', { url: `${US}/staf/program` }); await tidur(3500);
    const buka = await ev(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Tambah Program/i.test(b.textContent)); if (!b) return false; b.click(); return true; })()`);
    wajib(buka, 'tombol "Tambah Program" tidak ditemukan');
    await tidur(1500);
    const opsi = await ev(`(() => { const s = document.querySelector('#program-kategori'); return s ? [...s.options].map(o => o.textContent) : null; })()`);
    wajib(opsi, 'select kategori tidak muncul di formulir');
    wajib(opsi.includes(globalThis.__namaKategoriUji), `kategori baru tidak ada di select: ${opsi.join(' | ')}`);
    wajib(opsi.some((o) => /Kategori Lainnya/.test(o)), `pilihan "Kategori Lainnya..." tidak ada: ${opsi.join(' | ')}`);
    const munculKolom = await ev(`(() => { const s = document.querySelector('#program-kategori'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, '__lainnya__'); s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    wajib(munculKolom, 'tidak dapat memilih Kategori Lainnya');
    await tidur(800);
    const adaInput = await ev(`!!document.querySelector('#program-kategori-baru')`);
    wajib(adaInput, 'kolom "Nama Kategori Baru" tidak muncul setelah memilih Kategori Lainnya');
    wajib(konsol.length === 0, `galat konsol: ${konsol.slice(0, 2).join(' | ')}`);
    ws.close();
    return `${opsi.length} pilihan (termasuk kategori baru + Kategori Lainnya...); kolom isian muncul; 0 galat konsol`;
  } finally { chrome.kill(); try { rmSync(profil, { recursive: true, force: true }); } catch { /* abaikan */ } }
});
await langkah('tanpa duplikat: nama sama (beda huruf besar/spasi) memakai kategori yang sudah ada', async () => {
  const nama = globalThis.__namaKategoriUji.toUpperCase().replace(/ /g, '  ');
  const a = await api('POST', '/api/staf/program', tkRedaktur, {
    judul: 'Program uji duplikat kategori QA-3', ringkasan: 'Program uji kedua, dihapus di akhir.',
    kategori: '', kategori_baru: nama, status: 'berjalan', wilayah_id: null, gambar: null, mulai_pada: '2026-09-01',
  });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  wajib(a.j.kategori.baru === false, 'kategori duplikat malah dibuat baru');
  wajib(a.j.kategori.slug === globalThis.__slugKategoriUji, `slug ${a.j.kategori.slug} != ${globalThis.__slugKategoriUji}`);
  const d = await api('DELETE', `/api/staf/program/${a.j.program.id}`, tkRedaktur);
  wajib(d.s === 200, `bersih DELETE ${d.s}`);
  return `dipetakan ke slug yang sama (${a.j.kategori.slug}), tanpa baris kategori baru`;
});
await langkah('nama kategori tidak wajar ditolak (terlalu pendek, tag HTML, tanpa huruf); slug ngawur ditolak', async () => {
  const dasar = { judul: 'Program uji tolak kategori QA-3', ringkasan: 'Uji penolakan.', status: 'berjalan', mulai_pada: '2026-09-01' };
  const uji = [['ab', 'KATEGORI_BARU_PENDEK'], ['<b>Hukum</b>', 'KATEGORI_BARU_HTML'], ['12345', 'KATEGORI_BARU_TIDAK_WAJAR']];
  const hasil = [];
  for (const [nama, kode] of uji) {
    const a = await api('POST', '/api/staf/program', tkRedaktur, { ...dasar, kategori: '', kategori_baru: nama });
    wajib(a.s === 422 && a.j.kode === kode, `"${nama}" HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 110)}`);
    hasil.push(`${nama.slice(0, 12)}→${kode}`);
  }
  const b = await api('POST', '/api/staf/program', tkRedaktur, { ...dasar, kategori: 'kategori-tidak-ada' });
  wajib(b.s === 422 && b.j.kode === 'KATEGORI_TIDAK_SAH', `slug ngawur HTTP ${b.s}`);
  hasil.push('slug-ngawur→KATEGORI_TIDAK_SAH');
  return hasil.join(', ');
});

console.log('\n## Pembersihan');
await langkah('program uji dan kategori uji dihapus', async () => {
  const d = idProgramUji ? await api('DELETE', `/api/staf/program/${idProgramUji}`, tkRedaktur) : { s: '-' };
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const r = globalThis.__slugKategoriUji ? await kueri('DELETE FROM kategori_program WHERE slug = ?', [globalThis.__slugKategoriUji]) : { affectedRows: 0 };
  const sisa = await kueri('SELECT COUNT(*) n FROM program WHERE judul LIKE ?', ['%QA-3%']);
  await tutupPool();
  return `program DELETE ${d.s}; kategori uji dihapus ${r.affectedRows}; sisa program uji ${sisa[0].n}`;
});

console.log(`\nRINGKASAN QA-3 C/D/E/F: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
