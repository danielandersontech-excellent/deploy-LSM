#!/usr/bin/env node
// QA-4 G — sapu konsol & tata letak menyeluruh (turunan uji-g-verifikasi QA-3, diperluas untuk RUN QA-4).
// Tiap halaman dibuka di Chrome pada 375, 768, dan 1280: galat konsol, permintaan >= 400, gulir mendatar, kontrol
// tumpang tindih, dan teks galat harus nol. Tambahan QA-4: bilah kategori WAJIB ada di halaman publik dan TIDAK
// boleh ada di ruang staf; item bilah tidak terpotong (bila melebihi lebar, ul harus bisa digulir mendatar);
// item aktif tepat satu hanya di /berita?kategori=; di < md merek dan hamburger sebaris tanpa tumpang tindih;
// tidak ada em/en dash yang tampil.
// Dipakai untuk LOKAL dan PRODUKSI. Sesi staf: SEED_ADMIN lokal, atau env TOKEN_STAF (akun uji produksi).
// Profil Chrome sementara dibuat dan DIHAPUS saat keluar.
// Pemakaian: node laporan/bukti-qa-4/skrip/uji-g-konsol.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U;
const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch { /* abaikan */ } });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

const PUBLIK = ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/berita?kategori=hukum', '/berita?kategori=podcash', '/berita?q=dana', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas'];
const STAF = ['/staf/dashboard', '/staf/artikel', '/staf/artikel/baru', '/staf/pengurus', '/staf/program', '/staf/galeri', '/staf/pengguna', '/staf/pengaturan', '/staf/ganti-sandi'];

let tk = process.env.TOKEN_STAF || null;
if (!tk) {
  try {
    const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
    if (r.status === 200) tk = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
  } catch { /* biarkan; halaman staf akan dilewati */ }
}

const port = 9600 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
if (!t) { console.log('GAGAL: Chrome tidak dapat dijalankan'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); let konsol = [], jaringan = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split(String.fromCharCode(10))[0].slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120));
  if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.text)) konsol.push('log ' + p.entry.text.slice(0, 120));
  if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/socket\.io/.test(p.response.url)) jaringan.push(`${p.response.status} ${p.type} ${p.response.url.slice(-60)}`);
};
const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable'); await kirim('Network.enable');
if (tk) await kirim('Network.setCookie', { name: 'warkop_token', value: tk, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

const PERIKSA = `(() => {
  const iw = document.documentElement.clientWidth;
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'); });
  const tumpang = [];
  for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) {
    if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue;
    const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || 'x').trim().slice(0, 16) + ' x ' + (kontrol[k].textContent || 'x').trim().slice(0, 16));
  }
  const bilah = document.querySelector('nav[aria-label="Kategori berita"]');
  let bilahInfo = null;
  if (bilah) {
    const ul = bilah.querySelector('ul'); const item = [...ul.querySelectorAll('li')];
    const terakhir = item[item.length - 1].getBoundingClientRect(); const pertama = item[0].getBoundingClientRect();
    const bisaGulir = ul.scrollWidth > ul.clientWidth + 1; const cs = getComputedStyle(ul);
    bilahInfo = { item: item.length, bisaGulir, overflowX: cs.overflowX, terpotong: !bisaGulir && (terakhir.right > iw + 1 || pertama.left < -1), lebar: Math.round(bilah.getBoundingClientRect().width) === iw, aktif: item.filter(li => li.querySelector('a[aria-current="page"]')).length };
  }
  const header = document.querySelector('header'); let headerInfo = null;
  if (header) {
    const merek = header.querySelector('a[href="/"]');
    const tombol = [...header.querySelectorAll('button')].find(b => { const r = b.getBoundingClientRect(); return r.width > 0 && /menu|navigasi/i.test((b.getAttribute('aria-label') || '') + b.textContent); });
    if (merek && tombol) { const a = merek.getBoundingClientRect(), b = tombol.getBoundingClientRect(); headerInfo = { sebaris: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) <= 4, merekKiri: a.left < b.left, tombolDalamLayar: b.right <= iw + 1, tumpang: a.right > b.left + 1 }; }
  }
  return {
    jalur: location.pathname + location.search,
    gulirMendatar: document.documentElement.scrollWidth > iw + 1,
    tumpang: tumpang.slice(0, 3),
    teksGalat: /Application error|Internal Server Error|Terjadi kesalahan tak terduga/.test(document.body.innerText),
    adaMasukStaff: /Masuk Staff/.test(document.body.innerText),
    footerPenuh: (() => { const f = document.querySelector('footer'); if (!f) return null; const r = f.getBoundingClientRect(); return Math.round(r.left) === 0 && Math.round(r.width) === iw; })(),
    bilah: bilahInfo, header: headerInfo, dash: /[\\u2014\\u2013]/.test(document.body.innerText),
  };
})()`;

console.log(`# QA-4 G — sapu konsol & tata letak menyeluruh — ${U} — ${new Date().toISOString()}`);
console.log(`# sesi staf: ${tk ? 'ada' : 'TIDAK ADA (halaman staf dilewati)'}`);
let sel = 0, gagal = 0;
for (const [w, h, mobile] of [[375, 812, true], [768, 1024, true], [1280, 900, false]]) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  const daftar = [...PUBLIK.map((p) => ({ p, url: U + p, staf: false })), ...(tk ? STAF.map((p) => ({ p, url: US + p, staf: true })) : [])];
  let bilahAda = 0, bilahGeser = 0;
  for (const { p, url, staf } of daftar) {
    konsol = []; jaringan = [];
    await kirim('Page.navigate', { url }); await tidur(2800);
    const r = await ev(PERIKSA); sel++;
    const masukStaffBuruk = !staf && r?.adaMasukStaff;
    const footerBuruk = !staf && r?.footerPenuh === false;
    const bilahBuruk = !staf ? (!r?.bilah || r.bilah.item !== 11 || r.bilah.terpotong || !r.bilah.lebar || (r.bilah.bisaGulir && r.bilah.overflowX !== 'auto' && r.bilah.overflowX !== 'scroll')) : !!r?.bilah;
    const aktifBuruk = !staf && r?.bilah && (/\/berita\?kategori=/.test(p) ? r.bilah.aktif !== 1 : r.bilah.aktif !== 0);
    const headerBuruk = w < 768 && !staf && (!r?.header || !r.header.sebaris || !r.header.merekKiri || !r.header.tombolDalamLayar || r.header.tumpang);
    if (!staf && r?.bilah) { bilahAda++; if (r.bilah.bisaGulir) bilahGeser++; }
    const ok = r && !r.teksGalat && konsol.length === 0 && jaringan.length === 0 && !r.gulirMendatar && r.tumpang.length === 0 && !masukStaffBuruk && !footerBuruk && !bilahBuruk && !aktifBuruk && !headerBuruk && !r.dash;
    if (!ok) {
      gagal++;
      console.log(`  GAGAL ${w} ${p}: ${!r ? 'tidak terbaca; ' : ''}${r?.teksGalat ? 'TEKS GALAT; ' : ''}${konsol.length ? 'konsol: ' + konsol.slice(0, 2).join(' | ') + '; ' : ''}${jaringan.length ? 'jaringan: ' + jaringan.slice(0, 2).join(' | ') + '; ' : ''}${r?.gulirMendatar ? 'gulir mendatar; ' : ''}${r?.tumpang?.length ? 'tumpang: ' + r.tumpang.join(' | ') + '; ' : ''}${masukStaffBuruk ? 'masih ada "Masuk Staff"; ' : ''}${footerBuruk ? 'footer tidak penuh; ' : ''}${bilahBuruk ? 'bilah: ' + JSON.stringify(r?.bilah) + '; ' : ''}${aktifBuruk ? 'item aktif bilah: ' + r.bilah.aktif + '; ' : ''}${headerBuruk ? 'header: ' + JSON.stringify(r?.header) + '; ' : ''}${r?.dash ? 'em/en dash tampil' : ''}`);
    }
  }
  console.log(`  ${w}px: ${daftar.length} halaman diperiksa; bilah ada di ${bilahAda}/${PUBLIK.length} halaman publik, dapat digeser di ${bilahGeser}`);
}
ws.close(); chrome.kill();
console.log(`\nRINGKASAN G konsol (${PROD ? 'produksi' : 'lokal'}): ${sel} sel, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
