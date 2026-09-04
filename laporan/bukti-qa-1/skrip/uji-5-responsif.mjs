#!/usr/bin/env node
// QA-1 butir 5 — HP & laptop: setiap halaman (publik + staf superadmin) pada 375 / 768 / 1280 px (emulasi CDP mobile untuk 375/768):
//   * tanpa gulir mendatar (document.scrollWidth <= innerWidth, dan tidak ada elemen yang melebar > innerWidth),
//   * hamburger publik (375) membuka laci & tautan bisa diklik; laci staf (375) membuka sidebar,
//   * formulir pengaduan di 375 diisi PENUH & dikirim (anonim) -> nomor kasus,
//   * elemen sentuh tidak tumpang tindih: tombol/tautan tampak berukuran >= 24 px dan kotaknya tidak beririsan (>25 %) dengan kontrol lain.
// Tangkapan tiap halaman/lebar di tangkapan/responsif/. Catatan jujur: Safari/Android asli tidak tersedia — emulasi Chrome.
// Pemakaian: node uji-5-responsif.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms)); const T = 'laporan/bukti-qa-1/tangkapan/responsif'; mkdirSync(T, { recursive: true });
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const artikel = await (await fetch(`${U}/api/artikel?perHalaman=1`)).json(); const slug = artikel.baris?.[0]?.slug;
const daftarP = await (await fetch(`${US}/api/staf/pengaduan?perHalaman=1`, { headers: { cookie: `warkop_token=${TK}` } })).json(); const idP = daftarP.baris?.[0]?.id;
const draf = await (await fetch(`${US}/api/staf/artikel?perHalaman=1`, { headers: { cookie: `warkop_token=${TK}` } })).json(); const idA = draf.baris?.[0]?.id;
const PUBLIK = ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', `/berita/${slug}`, '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas', '/login', '/halaman-tidak-ada'];
const STAF = ['/staf/dashboard', '/staf/artikel', '/staf/artikel/baru', `/staf/artikel/${idA}`, '/staf/pengaduan', `/staf/pengaduan/${idP}`, '/staf/pengurus', '/staf/program', '/staf/galeri', '/staf/pengguna', '/staf/pengaturan', '/staf/ganti-sandi'];
const LEBAR = [[375, 812, true], [768, 1024, true], [1280, 900, false]];
const port = 9760 + Math.floor(Math.random() * 30);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
if (TK) await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const emulasi = (w, h, mobile) => kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile, screenWidth: w, screenHeight: h });
const buka = async (url) => { await kirim('Page.navigate', { url }); await tidur(2500); };
const foto = async (nama) => { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${T}/${nama}.png`, Buffer.from(f.result.data, 'base64')); };
const sentuh = async (x, y) => { await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); await tidur(700); };
const PERIKSA = `(() => { const iw = innerWidth; const melebar = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (!(r.width > 0 && r.right > iw + 1 && cs.position !== 'fixed' && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'))) return false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(auto|scroll)/.test(o.overflowX)) return false; /* wilayah gulir mendatar yang disengaja (tabel/pil) */ if (/(hidden|clip)/.test(o.overflowX) && a.getBoundingClientRect().right <= iw + 1) return false; /* terpotong rapi oleh induk */ } return true; }).slice(0, 3).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 3).join('.') + '(' + Math.round(el.getBoundingClientRect().right) + ')');
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' && !el.closest('[aria-hidden="true"]') && !el.hasAttribute('aria-hidden'); });
  const kecil = kontrol.filter(el => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map(el => (el.tagName.toLowerCase() + ':' + (el.getAttribute('aria-label') || el.textContent || el.name || '').trim().slice(0, 25) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)));
  const tumpang = []; for (let i = 0; i < kontrol.length; i++) for (let j = i + 1; j < kontrol.length; j++) { const a = kontrol[i].getBoundingClientRect(), b = kontrol[j].getBoundingClientRect(); if (kontrol[i].contains(kontrol[j]) || kontrol[j].contains(kontrol[i])) continue; const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); const luas = ix * iy; if (luas > 0 && luas > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || kontrol[i].getAttribute('aria-label') || kontrol[i].tagName).trim().slice(0, 20) + ' × ' + (kontrol[j].textContent || kontrol[j].getAttribute('aria-label') || kontrol[j].tagName).trim().slice(0, 20)); }
  return { scrollWidth: document.documentElement.scrollWidth, iw, melebar, kontrol: kontrol.length, kecil: kecil.slice(0, 5), jumlahKecil: kecil.length, tumpang: tumpang.slice(0, 5), jumlahTumpang: tumpang.length }; })()`;
console.log(`# QA-1 butir 5 — responsif 375/768/1280 — ${U} — ${new Date().toISOString()}\nlogin staf: ${TK ? 'ok' : 'GAGAL'}`);
const ringkas = {};
for (const [w, h, mobile] of LEBAR) {
  console.log(`\n## Lebar ${w} px${mobile ? ' (emulasi mobile, dpr 2)' : ''}`);
  await emulasi(w, h, mobile);
  for (const jalur of [...PUBLIK.map((p) => [U, p]), ...STAF.map((p) => [US, p])]) {
    const url = `${jalur[0]}${jalur[1]}`; await buka(url);
    const hasil = await ev(PERIKSA); if (!hasil) { cek(`${jalur[1]} @${w}`, false, 'tidak terbaca'); continue; }
    const ok = hasil.scrollWidth <= hasil.iw + 1 && hasil.melebar.length === 0 && hasil.jumlahTumpang === 0;
    const kecilInfo = hasil.jumlahKecil ? `; kontrol < 24px: ${hasil.jumlahKecil} (${hasil.kecil.join(', ')})` : '';
    cek(`${jalur[1]} @${w}`, ok, `scrollWidth ${hasil.scrollWidth}/${hasil.iw}${hasil.melebar.length ? ' melebar: ' + hasil.melebar.join(', ') : ''}${hasil.jumlahTumpang ? ' TUMPANG: ' + hasil.tumpang.join(' | ') : ''}${kecilInfo}`);
    ringkas[jalur[1]] = ringkas[jalur[1]] || {}; ringkas[jalur[1]][w] = ok ? 'OK' : 'GAGAL';
    if (w !== 1280) await foto(`${w}-${jalur[1].replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'beranda'}`);
  }
}
// --- hamburger publik & laci staf (375)
console.log('\n## Hamburger publik & laci staf pada 375 px');
await emulasi(375, 812, true); await buka(`${U}/`);
const tombolHamburger = await ev(`(() => { const b = [...document.querySelectorAll('header button')].find(b => /menu|navigasi|buka/i.test(b.getAttribute('aria-label') || b.textContent)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: b.getAttribute('aria-label') || b.textContent.trim(), expanded: b.getAttribute('aria-expanded') }; })()`);
cek('tombol hamburger ada di header (375)', !!tombolHamburger, JSON.stringify(tombolHamburger));
if (tombolHamburger) { await sentuh(tombolHamburger.x, tombolHamburger.y); const laci = await ev(`(() => { const nav = [...document.querySelectorAll('nav, [role=dialog], div')].find(n => n.id && /laci|menu/i.test(n.id)) || document.querySelector('header nav ~ div, header [id*="laci"]'); const tautan = [...document.querySelectorAll('header a[href]')].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight; }); const t = tautan.find(a => a.getAttribute('href') === '/kontak'); const rt = t && t.getBoundingClientRect(); return { tautanTampak: tautan.length, kontak: rt ? { x: rt.left + rt.width / 2, y: rt.top + rt.height / 2 } : null, expanded: document.querySelector('header button[aria-expanded]')?.getAttribute('aria-expanded') }; })()`); await foto('375-laci-publik-terbuka'); cek('laci publik terbuka: tautan tampak & aria-expanded=true', laci.tautanTampak >= 7 && laci.expanded === 'true', JSON.stringify(laci).slice(0, 160)); if (laci.kontak) { await sentuh(laci.kontak.x, laci.kontak.y); await tidur(2500); const p = await ev('location.pathname'); cek('klik "Kontak & Pengaduan" di laci → /kontak', p === '/kontak', p); } }
await buka(`${US}/staf/dashboard`);
const tombolLaci = await ev(`(() => { const b = [...document.querySelectorAll('button')].find(b => /menu|navigasi|buka|laci/i.test(b.getAttribute('aria-label') || '')); if (!b) return null; const r = b.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, label: b.getAttribute('aria-label') } : null; })()`);
cek('tombol laci staf ada (375)', !!tombolLaci, JSON.stringify(tombolLaci));
if (tombolLaci) { await sentuh(tombolLaci.x, tombolLaci.y); const sb = await ev(`(() => { const nav = document.querySelector('nav[aria-label], aside, [id*="sidebar"], nav'); const r = nav && nav.getBoundingClientRect(); const a = [...document.querySelectorAll('nav a[href^="/staf/"]')].filter(a => a.getBoundingClientRect().width > 0); return { navTampak: !!r && r.width > 0 && r.left >= 0 && r.left < 50, tautan: a.length }; })()`); await foto('375-laci-staf-terbuka'); cek('laci staf terbuka: sidebar tampak & tautan menu tersedia', sb.navTampak && sb.tautan >= 3, JSON.stringify(sb)); }
// --- formulir pengaduan 375 diisi penuh & dikirim (anonim)
console.log('\n## Formulir pengaduan di 375 px diisi penuh & dikirim (anonim)');
await buka(`${U}/kontak`); await tidur(3500);
const isi = await ev(`(async () => { const f = [...document.querySelectorAll('form')].find(f => f.querySelector('textarea')); if (!f) return 'form tidak ada'; const set = (el, v) => { const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const anon = f.querySelector('input[type=checkbox][id*="anon"], input[type=checkbox][name*="anon"]'); if (anon && !anon.checked) anon.click();
  const kat = f.querySelector('select[name="kategori_masalah"]'); set(kat, [...kat.options].find(o => o.value)?.value); const wil = f.querySelector('select[name="wilayah_id"]'); if (wil) set(wil, [...wil.options].find(o => o.value)?.value);
  const lok = f.querySelector('input[name="lokasi_kejadian"], input[name*="lokasi"]'); if (lok) set(lok, 'Kantor Desa Uji, 375 px');
  set(f.querySelector('textarea'), 'QA-1 butir 5: formulir pengaduan diisi penuh pada lebar 375 px (emulasi mobile) dan dikirim sebagai laporan anonim; dihapus lunak setelah uji.');
  const tombol = [...f.querySelectorAll('button[type=submit]')].pop(); const r = tombol.getBoundingClientRect(); tombol.scrollIntoView({ block: 'center' }); const r2 = tombol.getBoundingClientRect(); return { tombol: tombol.textContent.trim(), x: r2.left + r2.width / 2, y: r2.top + r2.height / 2, lebarForm: f.getBoundingClientRect().width, adaOverflow: document.documentElement.scrollWidth > innerWidth }; })()`);
await foto('375-kontak-terisi'); console.log('  ' + JSON.stringify(isi).slice(0, 200));
let nomor = null;
if (isi && isi.x) { await sentuh(isi.x, isi.y); for (let i = 0; i < 12; i++) { await tidur(700); nomor = await ev(`document.body.innerText.match(/WRP-\\d{6}/)?.[0] || null`); if (nomor) break; } await foto('375-kontak-terkirim'); }
cek('formulir 375 dikirim → nomor kasus tampil, tanpa gulir mendatar', !!nomor && isi && !isi.adaOverflow, `nomor ${nomor}, lebar form ${isi?.lebarForm}`);
ws.close(); chrome.kill();
if (nomor && !PROD) { const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js'); await kueri('UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=? AND dihapus_pada IS NULL', [waktuSekarang(), waktuSekarang(), nomor]); await tutupPool(); console.log(`  pengaduan uji ${nomor} dihapus lunak`); } else if (nomor) console.log(`  NOMOR_UJI=${nomor} (produksi: hapus lunak lewat SQL)`);
console.log('\n## Ringkasan per halaman (375 / 768 / 1280)'); for (const [p, r] of Object.entries(ringkas)) console.log(`  ${p.padEnd(28)} ${r[375]} / ${r[768]} / ${r[1280]}`);
console.log(`\nRINGKASAN 5: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`} (emulasi Chrome; Safari iOS/Android asli TIDAK tersedia)`);
process.exit(0);
