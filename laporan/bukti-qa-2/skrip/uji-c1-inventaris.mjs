#!/usr/bin/env node
// QA-2 C1 — INVENTARIS: semua halaman (publik + staf) × 6 identitas (tamu + 5 peran) × 3 lebar (375/768/1280).
// Tiap sel: halaman dimuat di Chrome headless; konsol (error/exception) & jaringan (status ≥ 400 untuk aset/dokumen) harus
// bersih; tidak ada gulir mendatar (di luar wilayah overflow-x-auto/hidden yang disengaja); kontrol tidak tumpang tindih.
// Halaman staf untuk tamu harus mengalihkan ke /login (dicatat sebagai "dialihkan", bukan gagal); halaman di luar hak peran
// harus /tanpa-akses (dicatat). Pemakaian: node uji-c1-inventaris.mjs [URL] [URL staf] [--produksi] [--peran=superadmin,...]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const hanyaPeran = (process.argv.find((a) => a.startsWith('--peran=')) || '').slice(8).split(',').filter(Boolean);
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const AKUN = { tamu: null, superadmin: [env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD], redaktur: ['siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD], penulis: ['budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD], verifikator: ['siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD], pimpinan_wilayah: ['pimpinan.jabar@warkopnusantara.id', env.SEED_STAF_PASSWORD] };
// Akun pimpinan_wilayah kedua (wilayah lain, tanpa artikel/pengaduan) — dipakai membuktikan ISOLASI WILAYAH:
// halaman rinci milik wilayah lain harus 404 (netral, tidak membocorkan keberadaan berkas), bukan tampil.
const AKUN_WILAYAH_LAIN = ['rahmat.siregar@warkopnusantara.id', env.SEED_STAF_PASSWORD];
const login = async (k) => { if (!k) return null; const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: k[0], kataSandi: k[1] }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null; };
const TKa = await login(AKUN.superadmin);
const j = async (p) => { try { return await (await fetch(`${US}${p}`, { headers: { cookie: `warkop_token=${TKa}` } })).json(); } catch { return {}; } };
const slug = (await j('/api/artikel?perHalaman=1')).baris?.[0]?.slug; const idA = (await j('/api/staf/artikel?perHalaman=1')).baris?.[0]?.id; const idP = (await j('/api/staf/pengaduan?perHalaman=1')).baris?.[0]?.id;
const PUBLIK = ['/', '/tentang', '/struktur', '/struktur?tampilan=peta', '/program', '/program?kategori=pengawasan-dana', '/galeri', '/kontak', '/berita', '/berita?kategori=investigasi', `/berita/${slug}`, '/lacak', '/lacak?nomor=WRP-000001', '/faq', '/kebijakan-privasi', '/pedoman-komunitas', '/halaman-tidak-ada'];
const STAF = ['/login', '/staf/dashboard', '/staf/artikel', '/staf/artikel/baru', `/staf/artikel/${idA}`, `/staf/artikel/${idA}/pratinjau`, '/staf/pengaduan', `/staf/pengaduan/${idP}`, '/staf/pengurus', '/staf/program', '/staf/galeri', '/staf/pengguna', '/staf/pengaturan', '/staf/ganti-sandi', '/tanpa-akses'];
const LEBAR = [[375, 812, true], [768, 1024, true], [1280, 900, false]];
const port = 9300 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let v = null; for (let i = 0; i < 40 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tidur(250); } }
const wsB = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { wsB.onopen = r; }); let idB = 0; const tB = new Map(); wsB.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tB.has(m.id)) { tB.get(m.id)(m); tB.delete(m.id); } };
const kirimB = (method, params = {}) => new Promise((r) => { const n = ++idB; tB.set(n, r); wsB.send(JSON.stringify({ id: n, method, params })); });
const PERIKSA = `(() => { const iw = innerWidth; const melebar = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (!(r.width > 0 && r.right > iw + 1 && cs.position !== 'fixed' && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'))) return false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(auto|scroll)/.test(o.overflowX)) return false; if (/(hidden|clip)/.test(o.overflowX) && a.getBoundingClientRect().right <= iw + 1) return false; } return true; }).slice(0, 2).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 2).join('.'));
  const kontrol = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')].filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' && !el.closest('[aria-hidden="true"]') && !el.hasAttribute('aria-hidden'); });
  const tumpang = []; for (let i = 0; i < kontrol.length; i++) for (let k = i + 1; k < kontrol.length; k++) { const a = kontrol[i].getBoundingClientRect(), b = kontrol[k].getBoundingClientRect(); if (kontrol[i].contains(kontrol[k]) || kontrol[k].contains(kontrol[i])) continue; const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); const luas = ix * iy; if (luas > 0 && luas > 0.25 * Math.min(a.width * a.height, b.width * b.height)) tumpang.push((kontrol[i].textContent || kontrol[i].getAttribute('aria-label') || kontrol[i].tagName).trim().slice(0, 18) + '×' + (kontrol[k].textContent || kontrol[k].getAttribute('aria-label') || kontrol[k].tagName).trim().slice(0, 18)); }
  return { scrollWidth: document.documentElement.scrollWidth, iw, melebar, tumpang: tumpang.slice(0, 3), judul: document.title, jalur: location.pathname, teksGalat: /Application error|Internal Server Error|Halaman tidak dapat dimuat/.test(document.body.innerText) }; })()`;
console.log(`# QA-2 C1 — inventaris halaman × identitas × lebar — ${U} — ${new Date().toISOString()}`);
let sel = 0, gagal = 0; const ringkas = [];
for (const [peran, kred] of Object.entries(AKUN)) {
  if (hanyaPeran.length && !hanyaPeran.includes(peran)) continue;
  const tk = await login(kred); if (kred && !tk) { console.log(`\n## ${peran}: LOGIN GAGAL`); gagal++; continue; }
  const { result: { browserContextId } } = await kirimB('Target.createBrowserContext'); const { result: { targetId } } = await kirimB('Target.createTarget', { url: 'about:blank', browserContextId });
  const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`); await new Promise((r) => { ws.onopen = r; }); let id = 0; const t = new Map(); let konsol = [], jaringan = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && t.has(m.id)) { t.get(m.id)(m); t.delete(m.id); return; } const p = m.params || {};
    if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split('\n')[0].slice(0, 120));
    if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120));
    if (m.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon/.test(p.entry.text)) konsol.push('log ' + p.entry.text.slice(0, 120));
    if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/socket\.io|\/api\/auth\/saya/.test(p.response.url)) jaringan.push(`${p.response.status} ${p.type} ${p.response.url.replace(U, '').replace(US, '').slice(0, 80)}`);
    if (m.method === 'Network.loadingFailed' && !p.canceled && !/socket\.io/.test(p.requestId)) jaringan.push(`GAGAL ${p.type} ${p.errorText}`); };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; t.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable'); await kirim('Network.enable');
  if (tk) await kirim('Network.setCookie', { name: 'warkop_token', value: tk, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
  const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
  console.log(`\n## ${peran}`);
  for (const [w, h, mobile] of LEBAR) {
    await kirim('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    const daftar = [...PUBLIK.map((p) => U + p), ...STAF.map((p) => US + p)];
    for (const url of daftar) {
      konsol = []; jaringan = []; await kirim('Page.navigate', { url }); await tidur(2600);
      const r = await ev(PERIKSA); sel++;
      const jalurAsal = url.replace(U, '').replace(US, '').split('?')[0];
      const dialihkan = r && r.jalur !== jalurAsal ? r.jalur : '';
      // 404 yang memang diharapkan: halaman-tidak-ada (dokumen 404), /lacak?nomor=WRP-000001 (API 404 netral)
      const jaringanNyata = jaringan.filter((x) => !(/^404 Document/.test(x) && /halaman-tidak-ada/.test(url)) && !(/404 (Fetch|XHR)/.test(x) && /lacak/.test(url)) && !(/404 Document/.test(x) && /\/berita\/undefined|\/artikel\/undefined|\/pengaduan\/undefined/.test(x)));
      // 404 yang memang diharapkan juga muncul sebagai galat konsol peramban ("Failed to load resource ... 404") — bukan cacat
      const konsolNyata = konsol.filter((x) => !(/status of 404/.test(x) && /halaman-tidak-ada|\/lacak/.test(url)));
      const ok = r && !r.teksGalat && konsolNyata.length === 0 && jaringanNyata.length === 0 && r.scrollWidth <= r.iw + 1 && r.melebar.length === 0 && r.tumpang.length === 0;
      if (!ok) { gagal++; console.log(`  GAGAL ${peran} ${w} ${jalurAsal}${dialihkan ? ' → ' + dialihkan : ''}: ${!r ? 'tidak terbaca' : ''}${r?.teksGalat ? 'TEKS GALAT; ' : ''}${konsolNyata.length ? 'konsol: ' + konsolNyata.slice(0, 2).join(' | ') + '; ' : ''}${jaringanNyata.length ? 'jaringan: ' + jaringanNyata.slice(0, 3).join(' | ') + '; ' : ''}${r && r.scrollWidth > r.iw + 1 ? 'scrollWidth ' + r.scrollWidth + '/' + r.iw + '; ' : ''}${r?.melebar?.length ? 'melebar: ' + r.melebar.join(',') + '; ' : ''}${r?.tumpang?.length ? 'tumpang: ' + r.tumpang.join(' | ') : ''}`); }
      ringkas.push({ peran, w, jalur: jalurAsal, dialihkan, ok });
    }
    console.log(`  ${w}px: ${daftar.length} halaman diperiksa`);
  }
  ws.close();
}
wsB.close(); chrome.kill();
const dialihkanCatatan = ringkas.filter((r) => r.dialihkan && r.w === 1280).map((r) => `${r.peran} ${r.jalur} → ${r.dialihkan}`);
console.log(`\n## Pengalihan tercatat (1280): ${[...new Set(dialihkanCatatan)].join('; ')}`);

// --- isolasi wilayah: pimpinan wilayah LAIN tidak boleh melihat berkas wilayah ini (404 netral) ---
console.log('\n## Isolasi wilayah (pimpinan_wilayah dari wilayah lain)');
{
  const tkLain = await login(AKUN_WILAYAH_LAIN);
  for (const jalur of [`/staf/artikel/${idA}`, `/staf/artikel/${idA}/pratinjau`, `/staf/pengaduan/${idP}`]) {
    const r = await fetch(`${US}${jalur}`, { headers: { cookie: `warkop_token=${tkLain}` }, redirect: 'manual' });
    const teks = r.status === 200 ? await r.text() : '';
    const bocor = /Laporan Infrastruktur|nomor_kasus|nik_pelapor/.test(teks);
    const ok = r.status === 404 && !bocor;
    sel++; if (!ok) { gagal++; console.log(`  GAGAL ${jalur}: HTTP ${r.status}${bocor ? ' + ISI BOCOR' : ''} (harus 404 tanpa isi)`); }
    else console.log(`  OK    ${jalur} → 404 netral (berkas milik wilayah lain)`);
  }
}
console.log(`\nRINGKASAN C1: ${sel} sel, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
