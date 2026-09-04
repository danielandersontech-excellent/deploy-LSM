#!/usr/bin/env node
// QA-1 butir 2 — perbandingan VISUAL 14 layar: code.html desain (dirender Chrome, Tailwind CDN + Google Fonts) vs halaman
// kita, pada lebar yang sama (publik/login 1280, layar staf 1600 = lebar screen.png desain), tangkapan halaman penuh,
// lalu disandingkan (kiri desain, kanan render; sharp) ke laporan/bukti-qa-1/tangkapan/visual/<nn>-<layar>.png.
// Pemakaian: node tangkap-visual-14-layar.mjs [URL] [URL staf] [label=sesudah|sebelum] [--produksi]
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const LABEL = argv[2] || 'sesudah'; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const D = `${process.cwd().replace(/\\/g, '/')}/desain/stitch_portal_berita_inklusif`; const OUT = `laporan/bukti-qa-1/tangkapan/visual`; mkdirSync(`${OUT}/${LABEL}`, { recursive: true });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const artikel = await (await fetch(`${U}/api/artikel?perHalaman=1`)).json(); const slug = artikel.baris?.[0]?.slug;
const draf = await (await fetch(`${US}/api/staf/artikel?perHalaman=1`, { headers: { cookie: `warkop_token=${TK}` } })).json(); const idArtikel = draf.baris?.[0]?.id;
const LAYAR = [
  ['beranda_warkop_nusantara', '/', 1280, false], ['tentang_kami_warkop_nusantara', '/tentang', 1280, false], ['struktur_organisasi', '/struktur', 1280, false],
  ['program_kegiatan', '/program', 1280, false], ['galeri_dokumentasi', '/galeri', 1280, false], ['kontak_pengaduan_warkop_nusantara_updated_logo', '/kontak', 1280, false],
  ['portal_berita_beranda', '/berita', 1280, false], ['daftar_berita_investigasi', '/berita', 1280, false], ['detail_artikel_investigasi', `/berita/${slug}`, 1280, false],
  ['login_staff_warkop_nusantara', '/login', 1280, 'tanpa-cookie'], ['dashboard_staff_warkop', '/staf/dashboard', 1600, true], ['kelola_artikel_admin', '/staf/artikel', 1600, true],
  ['editor_artikel_admin', `/staf/artikel/${idArtikel}`, 1600, true], ['kelola_pengaduan_admin', '/staf/pengaduan', 1600, true],
];
const port = 9830 + Math.floor(Math.random() * 20);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
let v = null; for (let i = 0; i < 40 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await tidur(250); } }
const wsB = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { wsB.onopen = r; }); let idB = 0; const tB = new Map(); wsB.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tB.has(m.id)) { tB.get(m.id)(m); tB.delete(m.id); } };
const kirimB = (method, params = {}) => new Promise((r) => { const n = ++idB; tB.set(n, r); wsB.send(JSON.stringify({ id: n, method, params })); });
async function tab(cookie) {
  const { result: { browserContextId } } = await kirimB('Target.createBrowserContext'); const { result: { targetId } } = await kirimB('Target.createTarget', { url: 'about:blank', browserContextId });
  const ws = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`); await new Promise((r) => { ws.onopen = r; }); let id = 0; const t = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && t.has(m.id)) { t.get(m.id)(m); t.delete(m.id); } };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; t.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
  if (cookie) await kirim('Network.setCookie', { name: 'warkop_token', value: cookie, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
  const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
  return { async tangkap(url, lebar, berkas) {
      await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: 900, deviceScaleFactor: 1, mobile: false });
      await kirim('Page.navigate', { url }); await tidur(4500);
      await ev(`document.fonts.ready.then(() => true)`); await ev(`new Promise(r => { window.scrollTo(0, document.body.scrollHeight); setTimeout(() => { window.scrollTo(0,0); r(true); }, 600); })`); await tidur(400);
      const tinggi = Math.min(6000, await ev(`Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)`));
      await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: tinggi, deviceScaleFactor: 1, mobile: false }); await tidur(500);
      const f = await kirim('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(berkas, Buffer.from(f.result.data, 'base64')); return tinggi; },
    tutup() { ws.close(); } };
}
console.log(`# Tangkapan visual 14 layar — ${U} — ${LABEL} — ${new Date().toISOString()}`);
const P = await tab(null), S = await tab(TK);
for (const [i, [layar, jalur, lebar, staf]] of LAYAR.entries()) {
  const nn = String(i + 1).padStart(2, '0'); const fD = `${OUT}/${LABEL}/${nn}-${layar}-desain.png`, fR = `${OUT}/${LABEL}/${nn}-${layar}-render.png`;
  const hD = await P.tangkap(`file:///${D}/${layar}/code.html`, lebar, fD);
  const hR = await (staf === true ? S : P).tangkap(`${(staf || jalur === '/login') ? US : U}${jalur}`, lebar, fR);
  // sandingkan: kiri desain, kanan render; diperkecil ke lebar total 1600 agar mudah dilihat
  const kiri = await sharp(fD).resize({ width: 800 }).toBuffer(); const kanan = await sharp(fR).resize({ width: 800 }).toBuffer();
  const mk = await sharp(kiri).metadata(), mr = await sharp(kanan).metadata(); const H = Math.max(mk.height, mr.height);
  await sharp({ create: { width: 1600 + 8, height: H, channels: 3, background: '#ff00aa' } }).composite([{ input: kiri, left: 0, top: 0 }, { input: kanan, left: 808, top: 0 }]).png().toFile(`${OUT}/${nn}-${layar}-${LABEL}.png`);
  console.log(`  ${nn} ${layar.padEnd(48)} lebar ${lebar}: desain ${hD}px, render ${hR}px → ${OUT}/${nn}-${layar}-${LABEL}.png (${mk.height}/${mr.height} skala)`);
}
P.tutup(); S.tutup(); wsB.close(); chrome.kill(); console.log('selesai'); process.exit(0);
