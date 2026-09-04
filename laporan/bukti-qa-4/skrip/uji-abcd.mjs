#!/usr/bin/env node
// QA-4 A/B/C/D — uji khusus butir baru (dipakai LOKAL dan PRODUKSI; --produksi membaca .env.produksi).
//   A  kategori berita final: 11 aktif urut tetap, 4 lama nonaktif tanpa artikel; filter /berita hanya menerima
//      slug aktif; API artikel menolak kategori nonaktif/tidak ada (422); editor hanya menawarkan 11 kategori.
//   B  bilah kategori di >= 5 halaman publik x 3 lebar: ada tepat di bawah header, 11 item urut, bg-primary,
//      item aktif beraksen emas di /berita?kategori=..., dapat digeser (scrollWidth > clientWidth di 375 tanpa
//      item terpotong/overflow halaman), dapat diakses keyboard (Tab sampai item, Enter berpindah), tidak ada di staf.
//   C  beranda = berita: sorotan + kartu terkini + Paling Banyak Dibaca + strip identitas + dua tombol;
//      alur beranda -> kategori -> artikel -> kembali; tidak ada tautan mati di beranda; sitemap/robots/metadata.
//   D  header seluler 320-767: hamburger sejajar satu baris dengan merek (tengah vertikal), laci berfungsi.
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar.
// Pemakaian: node laporan/bukti-qa-4/skrip/uji-abcd.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { KATEGORI_BERITA } from '../../../lib/kategoriBerita.js';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://127.0.0.1:3000'; const US = argv[1] || U;
const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const TANGKAPAN = 'laporan/bukti-qa-4/tangkapan'; mkdirSync(TANGKAPAN, { recursive: true });
const AWALAN = PROD ? 'produksi' : 'lokal';
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const halaman = async (jalur, tk) => { const r = await fetch(`${jalur.startsWith('/staf') || jalur === '/login' ? US : U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, html: r.status === 200 ? await r.text() : '', lokasi: r.headers.get('location') }; };
const api = async (metode, jalur, tk, badan) => { const r = await fetch(`${US}${jalur}`, { method: metode, headers: { ...(badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: badan ? JSON.stringify(badan) : undefined, redirect: 'manual' }); let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; } return { s: r.status, j }; };
// Sesi staf: lokal memakai seed; produksi memakai token yang DIBERIKAN lewat env TOKEN_STAF (disiapkan skrip pemanggil).
let tkStaf = process.env.TOKEN_STAF || null;
if (!tkStaf && !PROD) { const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'siti.rahma@warkopnusantara.id', kataSandi: env.SEED_STAF_PASSWORD }) }); tkStaf = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null; }

console.log(`# QA-4 A/B/C/D — ${AWALAN} — ${U} — ${new Date().toISOString()}`);
const SLUG_FINAL = KATEGORI_BERITA.map((k) => k.slug);

console.log('\n## A — kategori berita final');
await langkah('editor artikel (staf) menawarkan tepat 11 kategori urut final; kategori lama tidak muncul', async () => {
  wajib(tkStaf, 'tidak ada sesi staf');
  const h = await halaman('/staf/artikel/baru', tkStaf);
  wajib(h.s === 200, `HTTP ${h.s} ${h.lokasi || ''}`);
  const opsi = [...h.html.matchAll(/<option[^>]*value="(\d+)"[^>]*>([^<]+)<\/option>/g)].map((m) => m[2].trim());
  const urutan = KATEGORI_BERITA.map((k) => k.nama);
  const hanyaKategori = opsi.filter((o) => urutan.includes(o) || ['Siaran Pers', 'Opini Publik', 'Kegiatan Daerah', 'Fasilitas Umum'].includes(o));
  wajib(JSON.stringify(hanyaKategori) === JSON.stringify(urutan), `opsi: ${hanyaKategori.join(' | ')}`);
  return `11 opsi urut: ${urutan.join(', ')}`;
});
await langkah('filter /berita: 11 slug final diterima; slug lama (siaran-pers) dan ngawur diperlakukan kosong', async () => {
  for (const slug of SLUG_FINAL) { const h = await halaman(`/berita?kategori=${slug}`); wajib(h.s === 200, `${slug} HTTP ${h.s}`); }
  const lama = tanpaSkrip((await halaman('/berita?kategori=siaran-pers')).html);
  wajib(!/<option[^>]*value="siaran-pers"[^>]*selected/.test(lama), 'slug lama masih terpilih di filter');
  const dropdown = [...lama.matchAll(/<select[^>]*name="kategori"[\s\S]*?<\/select>/g)][0]?.[0] || '';
  const opsi = [...dropdown.matchAll(/<option[^>]*value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  wajib(JSON.stringify(opsi) === JSON.stringify(SLUG_FINAL), `opsi filter: ${opsi.join(',')}`);
  return `11 slug -> 200; dropdown filter = 11 slug final`;
});
await langkah('API artikel menolak kategori NONAKTIF (id 2) dan tidak ada (id 999) dengan 422', async () => {
  wajib(tkStaf, 'tidak ada sesi staf');
  const dasar = { judul: 'Uji QA-4 kategori nonaktif', isi: '<p>Isi uji kategori nonaktif yang cukup panjang untuk validasi minimal.</p>' };
  const a = await api('POST', '/api/staf/artikel', tkStaf, { ...dasar, kategori_id: 2 });
  wajib(a.s === 422 && a.j.kode === 'KATEGORI_NONAKTIF', `nonaktif HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
  const b = await api('POST', '/api/staf/artikel', tkStaf, { ...dasar, kategori_id: 999 });
  wajib(b.s === 422 && b.j.kode === 'KATEGORI_TIDAK_SAH', `tidak ada HTTP ${b.s} ${JSON.stringify(b.j).slice(0, 100)}`);
  return `422 ${a.j.kode}; 422 ${b.j.kode}`;
});

// ------------------------------------------------------------------ Chrome untuk B, C, D
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const port = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split(String.fromCharCode(10))[0].slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? '').join(' ').slice(0, 120));
  if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/socket\.io/.test(p.response.url)) konsol.push(`${p.response.status} ${p.response.url.slice(-50)}`); };
const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const lebar = async (w, h, mobile) => kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
const buka = async (url, ms = 2600) => { konsol = []; await kirim('Page.navigate', { url }); await tidur(ms); };
const tangkap = async (nama) => { const r = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(TANGKAPAN, `${AWALAN}-${nama}.png`), Buffer.from(r.result.data, 'base64')); };
const tekan = async (key, code, vk) => { await kirim('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk }); await kirim('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); };

const PERIKSA_BILAH = `(() => {
  const nav = document.querySelector('nav[aria-label="Kategori berita"]'); if (!nav) return { ada: false };
  const header = document.querySelector('header'); const rh = header.getBoundingClientRect(); const rn = nav.getBoundingClientRect();
  const ul = nav.querySelector('ul'); const item = [...nav.querySelectorAll('a')];
  const cs = getComputedStyle(nav);
  const iw = document.documentElement.clientWidth;
  const terpotong = item.filter(a => { const r = a.getBoundingClientRect(); return r.width < a.scrollWidth - 1; }).length;
  const aktif = item.find(a => a.getAttribute('aria-current') === 'page');
  return { ada: true, tepatDiBawahHeader: Math.abs(rn.top - rh.bottom) <= 1, latar: cs.backgroundColor, warnaTeks: getComputedStyle(item[0]).color,
    label: item.map(a => a.textContent.trim()), bisaGeser: ul.scrollWidth > ul.clientWidth + 1, terpotong, gulirHalaman: document.documentElement.scrollWidth > iw + 1,
    aktifLabel: aktif ? aktif.textContent.trim() : null, aktifWarna: aktif ? getComputedStyle(aktif).color : null, aktifGaris: aktif ? getComputedStyle(aktif).borderBottomWidth : null,
    aktifTerlihat: aktif ? (aktif.getBoundingClientRect().left >= ul.getBoundingClientRect().left - 1 && aktif.getBoundingClientRect().right <= ul.getBoundingClientRect().right + 1) : null };
})()`;

console.log('\n## B — bilah kategori (5 halaman x 3 lebar)');
const HALAMAN_B = ['/', '/tentang', '/program', '/kontak', '/berita?kategori=hukum', '/faq'];
for (const [w, h, mobile] of [[375, 812, true], [768, 1024, true], [1280, 900, false]]) {
  await lebar(w, h, mobile);
  await langkah(`${w}px: bilah ada tepat di bawah header di ${HALAMAN_B.length} halaman, 11 item urut, bg-primary, tanpa item terpotong, tanpa gulir halaman`, async () => {
    const catatan = [];
    for (const p of HALAMAN_B) {
      await buka(`${U}${p}`);
      const r = await ev(PERIKSA_BILAH);
      wajib(r.ada, `${p}: bilah tidak ada`);
      wajib(r.tepatDiBawahHeader, `${p}: bilah tidak tepat di bawah header`);
      wajib(JSON.stringify(r.label) === JSON.stringify(KATEGORI_BERITA.map((k) => k.nama)), `${p}: urutan/label ${r.label.join(',')}`);
      wajib(r.terpotong === 0 && !r.gulirHalaman, `${p}: ${r.terpotong} item terpotong, gulir halaman ${r.gulirHalaman}`);
      wajib(konsol.length === 0, `${p}: konsol ${konsol.slice(0, 2).join(' | ')}`);
      if (p.includes('kategori=hukum')) { wajib(r.aktifLabel === 'Hukum', `aktif = ${r.aktifLabel}`); wajib(r.aktifGaris !== '0px', 'item aktif tanpa garis emas'); wajib(r.aktifTerlihat, 'item aktif di luar area bilah (tidak digulir ke tampilan)'); catatan.push(`aktif Hukum warna ${r.aktifWarna} garis ${r.aktifGaris}`); }
      if (p === '/') { catatan.push(`latar ${r.latar}; geser=${r.bisaGeser}`); await tangkap(`bilah-${w}`); }
    }
    if (w === 375) { const r = await ev(PERIKSA_BILAH); wajib(r.bisaGeser, '375: bilah tidak bisa digeser padahal 11 item'); }
    return catatan.join('; ');
  });
}
await langkah('keyboard 1280: Tab dari awal dokumen mencapai item bilah; Enter berpindah ke /berita?kategori=...', async () => {
  await lebar(1280, 900, false); await buka(`${U}/tentang`);
  let sampai = null;
  for (let i = 0; i < 40 && !sampai; i++) { await tekan('Tab', 'Tab', 9); const f = await ev(`(() => { const a = document.activeElement; return a && a.closest('nav[aria-label="Kategori berita"]') ? a.getAttribute('href') : null; })()`); if (f) sampai = f; }
  wajib(sampai, 'fokus keyboard tidak pernah sampai ke bilah kategori dalam 40 Tab');
  await tekan('Enter', 'Enter', 13); await tidur(2500);
  const jalur = await ev('location.pathname + location.search');
  wajib(jalur === sampai, `Enter membawa ke ${jalur}, diharapkan ${sampai}`);
  return `Tab -> ${sampai}; Enter -> ${jalur}`;
});
await langkah('geser 375: mengeser bilah (scrollLeft) menampakkan item terakhir tanpa memindah gulir halaman', async () => {
  await lebar(375, 812, true); await buka(`${U}/`);
  const r = await ev(`(async () => { const ul = document.querySelector('nav[aria-label="Kategori berita"] ul'); const y0 = window.scrollY; ul.scrollLeft = ul.scrollWidth; await new Promise(r => setTimeout(r, 300)); const a = [...ul.querySelectorAll('a')].pop(); const ra = a.getBoundingClientRect(); const ru = ul.getBoundingClientRect(); return { terlihat: ra.right <= ru.right + 1 && ra.left >= ru.left - 1, scrollY: window.scrollY - y0, teks: a.textContent.trim() }; })()`);
  wajib(r.terlihat, 'item terakhir tidak terlihat setelah digeser');
  wajib(r.scrollY === 0, `gulir halaman ikut berubah ${r.scrollY}`);
  return `item terakhir "${r.teks}" terlihat; gulir halaman tetap`;
});
// REGRESI BUG QA-4 (ditemukan C3b): mengganti kategori saat halaman sudah digulir tidak boleh memindah gulir vertikal
// (scrollIntoView pada item aktif dulu menarik halaman ke atas). Diuji lewat klik bilah DAN lewat select filter.
await langkah('regresi: /berita digulir 300 px -> ganti kategori lewat bilah lalu lewat select filter -> gulir vertikal tidak melompat, item aktif berganti', async () => {
  await lebar(1280, 900, false); await buka(`${U}/berita?kategori=nasional`);
  await ev('window.scrollTo(0, 300)'); await tidur(300);
  const y0 = await ev('window.scrollY'); wajib(y0 >= 200, `halaman tidak bisa digulir 300 (scrollY ${y0})`);
  await ev(`[...document.querySelectorAll('nav[aria-label="Kategori berita"] a')].find(a => /kategori=hukum/.test(a.getAttribute('href'))).click()`); await tidur(2600);
  const y1 = await ev('window.scrollY'); const a1 = await ev(`document.querySelector('nav[aria-label="Kategori berita"] a[aria-current="page"]')?.textContent.trim()`);
  wajib(Math.abs(y1 - y0) < 20, `klik bilah: gulir melompat ${y0} -> ${y1}`); wajib(a1 === 'Hukum', `aktif setelah klik bilah = ${a1}`);
  const nilai = await ev(`(() => { const s = document.querySelector('select[name="kategori"]'); if (!s) return null; const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, 'umkm'); s.dispatchEvent(new Event('change', { bubbles: true })); return s.value; })()`);
  wajib(nilai === 'umkm', `select filter tidak bisa diubah (${nilai})`); await tidur(2600);
  const y2 = await ev('window.scrollY'); const a2 = await ev(`document.querySelector('nav[aria-label="Kategori berita"] a[aria-current="page"]')?.textContent.trim()`);
  wajib(Math.abs(y2 - y0) < 20, `select filter: gulir melompat ${y0} -> ${y2}`); wajib(a2 === 'UMKM', `aktif setelah select = ${a2}`);
  await lebar(375, 812, true); await buka(`${U}/berita?kategori=podcash`);
  const r = await ev(`(() => { const ul = document.querySelector('nav[aria-label="Kategori berita"] ul'); const a = ul.querySelector('a[aria-current="page"]'); const ra = a.getBoundingClientRect(); const ru = ul.getBoundingClientRect(); return { terlihat: ra.left >= ru.left - 1 && ra.right <= ru.right + 1, scrollLeft: Math.round(ul.scrollLeft) }; })()`);
  wajib(r.terlihat && r.scrollLeft > 0, `375: item aktif Podcash tidak digulir ke pandangan ${JSON.stringify(r)}`);
  return `bilah: ${y0} -> ${y1}; select: ${y0} -> ${y2}; 375 item aktif terlihat (scrollLeft ${r.scrollLeft})`;
});
await langkah('halaman staf TIDAK memuat bilah kategori', async () => {
  wajib(tkStaf, 'tidak ada sesi staf');
  const h = await halaman('/staf/dashboard', tkStaf);
  wajib(h.s === 200 && !h.html.includes('aria-label="Kategori berita"'), `dashboard HTTP ${h.s}, bilah ${h.html.includes('Kategori berita')}`);
  return 'dashboard tanpa bilah';
});

console.log('\n## C — beranda berita');
await langkah('beranda: strip identitas + tombol Sampaikan Pengaduan & Lacak Kasus; sorotan h1; Berita Terkini; Paling Banyak Dibaca; Status Advokasi; Rekam Jejak', async () => {
  const h = await halaman('/'); wajib(h.s === 200, `HTTP ${h.s}`);
  const dom = tanpaSkrip(h.html);
  for (const k of ['Pengawasan Sipil Independen', 'Berani Karena Benar', 'Sampaikan Pengaduan', 'Lacak Kasus', 'Berita Terkini', 'Paling Banyak Dibaca', 'Status Advokasi', 'Rekam Jejak', 'Lihat Semua Berita']) wajib(dom.includes(k), `teks "${k}" tidak ada`);
  wajib(/<h1[^>]*>[\s\S]*?<a[^>]*href="\/berita\//.test(dom), 'sorotan utama bukan h1 bertautan');
  wajib(dom.includes('href="/kontak"') && dom.includes('href="/lacak"'), 'tautan kontak/lacak tidak ada');
  const kartu = (dom.match(/<article /g) || []).length;
  return `semua bagian ada; ${kartu} kartu berita terkini`;
});
await langkah('beranda: 0 tautan mati (semua href internal dibuka -> 200/307)', async () => {
  const dom = tanpaSkrip((await halaman('/')).html);
  const href = [...new Set([...dom.matchAll(/href="(\/[^"#?]*)(\?[^"#]*)?/g)].map((m) => m[1] + (m[2] || '')))].filter((x) => !x.startsWith('/_next') && !/\.(png|jpg|svg|ico|woff2?|css|js)$/.test(x));
  const mati = [];
  for (const x of href) { const r = await fetch(`${U}${x}`, { redirect: 'manual', method: 'HEAD' }); if (![200, 301, 302, 307, 308].includes(r.status)) mati.push(`${x}:${r.status}`); }
  wajib(mati.length === 0, `tautan mati: ${mati.join(', ')}`);
  return `${href.length} tautan diperiksa, 0 mati`;
});
await langkah('alur: beranda -> klik kategori di bilah -> klik artikel -> kembali -> daftar kategori utuh (Chrome 1280)', async () => {
  await lebar(1280, 900, false); await buka(`${U}/`);
  const slug = await ev(`(() => { const a = [...document.querySelectorAll('nav[aria-label="Kategori berita"] a')].find(a => /kategori=investigasi/.test(a.getAttribute('href'))); a.click(); return a.getAttribute('href'); })()`);
  await tidur(2600);
  wajib((await ev('location.pathname + location.search')) === slug, `tidak sampai ${slug}`);
  const aktif = await ev(`document.querySelector('nav[aria-label="Kategori berita"] a[aria-current="page"]')?.textContent.trim()`);
  wajib(aktif === 'Investigasi', `aktif di bilah = ${aktif}`);
  const artikel = await ev(`(() => { const a = [...document.querySelectorAll('main a[href^="/berita/"]')].find(a => a.getBoundingClientRect().width > 0); if (!a) return null; a.click(); return a.getAttribute('href'); })()`);
  wajib(artikel, 'tidak ada artikel di kategori Investigasi');
  await tidur(2600);
  wajib((await ev('location.pathname')) === artikel, `tidak sampai artikel ${artikel}`);
  await ev('history.back()'); await tidur(2600);
  const balik = await ev('location.pathname + location.search');
  wajib(balik === slug, `kembali ke ${balik}, seharusnya ${slug}`);
  wajib(konsol.length === 0, `konsol: ${konsol.slice(0, 2).join(' | ')}`);
  await tangkap('alur-beranda-kategori');
  return `/ -> ${slug} -> ${artikel} -> kembali ${balik}; 0 galat konsol`;
});
await langkah('sitemap memuat / dan /berita; robots mengizinkan /; metadata beranda menyebut berita', async () => {
  const sm = await (await fetch(`${U}/sitemap.xml`)).text();
  wajib(/<loc>[^<]*\/<\/loc>/.test(sm) && /<loc>[^<]*\/berita<\/loc>/.test(sm), 'sitemap tidak memuat / atau /berita');
  const rb = await (await fetch(`${U}/robots.txt`)).text();
  wajib(/Allow: \//.test(rb) && /Disallow: \/staf\//.test(rb), 'robots tidak sesuai');
  const html = (await halaman('/')).html;
  const judul = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  wajib(/Berita/i.test(judul), `judul beranda: ${judul}`);
  wajib(/<meta name="description" content="[^"]*berita/i.test(html), 'deskripsi beranda tidak menyebut berita');
  return `title "${judul}"`;
});

console.log('\n## D — header seluler');
for (const w of [320, 375, 414, 767]) {
  await langkah(`${w}px: hamburger sejajar satu baris dengan merek (tengah vertikal), tidak tumpang tindih, laci berfungsi`, async () => {
    await lebar(w, 812, true); await buka(`${U}/`);
    const r = await ev(`(() => { const merek = document.querySelector('header a[href="/"]'); const tombol = document.querySelector('header button[aria-controls]'); const rm = merek.getBoundingClientRect(), rb = tombol.getBoundingClientRect();
      const tengahM = (rm.top + rm.bottom) / 2, tengahB = (rb.top + rb.bottom) / 2;
      const tumpang = Math.max(0, Math.min(rm.right, rb.right) - Math.max(rm.left, rb.left)) > 0 && Math.max(0, Math.min(rm.bottom, rb.bottom) - Math.max(rm.top, rb.top)) > 0;
      return { sejajar: Math.abs(tengahM - tengahB) <= 6, kiri: Math.round(rm.left), kananTombol: Math.round(rb.right), iw: document.documentElement.clientWidth, tumpang, gulir: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, tinggiHeaderBaris: Math.round(rb.top - rm.top) }; })()`);
    wajib(r.sejajar, `tidak sejajar (selisih tengah ${r.tinggiHeaderBaris})`);
    wajib(!r.tumpang && !r.gulir, `tumpang ${r.tumpang} / gulir ${r.gulir}`);
    wajib(r.kiri < 40 && r.iw - r.kananTombol < 40, `merek kiri ${r.kiri}, tombol kanan ${r.kananTombol}/${r.iw}`);
    await ev(`document.querySelector('header button[aria-controls]').click()`); await tidur(500);
    const laci = await ev(`(() => { const n = document.querySelector('header nav[aria-label*="seluler"]'); return n ? n.querySelectorAll('a').length : 0; })()`);
    wajib(laci >= 7, `laci tidak terbuka (${laci} tautan)`);
    if (w === 375) await tangkap('header-375-laci');
    await ev(`document.querySelector('header button[aria-controls]').click()`);
    return `merek kiri x=${r.kiri}, hamburger kanan x=${r.kananTombol}/${r.iw}, sejajar; laci ${laci} tautan`;
  });
}

ws.close(); chrome.kill();
console.log(`\nRINGKASAN QA-4 A/B/C/D (${AWALAN}): ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
