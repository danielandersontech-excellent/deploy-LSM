#!/usr/bin/env node
// QA-1 butir 1 — klik SUNGGUHAN (CDP Input.dispatchMouseEvent) pada kartu artikel: gambar, judul, ringkasan, badan kartu.
// Setiap klik dicatat: koordinat, elemen di titik itu, URL sesudah klik (harus /berita/<slug>). Halaman: beranda, /berita
// (unggulan + daftar + sidebar), detail (artikel terkait), dashboard staf (artikel terbaru; cookie superadmin bila --staf).
// Pemakaian: node uji-1-klik-kartu-artikel.mjs <URL publik> [URL staf] [--produksi] [label]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const LABEL = argv[2] || 'sebelum'; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms)); mkdirSync('laporan/bukti-qa-1/tangkapan', { recursive: true });
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const port = 9860 + Math.floor(Math.random() * 30);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); const konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } if (m.method === 'Runtime.exceptionThrown') konsol.push(JSON.stringify(m.params.exceptionDetails).slice(0, 160)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') konsol.push(m.params.args.map((a) => a.value || a.description).join(' ').slice(0, 160)); };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;
const buka = async (url) => { await kirim('Page.navigate', { url }); await tidur(3500); };
const klik = async (x, y) => { await kirim('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); for (let i = 0; i < 40; i++) { await tidur(400); if (/^\/berita\/[a-z0-9-]+/.test(await ev('location.pathname'))) break; } };
const foto = async (nama) => { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`laporan/bukti-qa-1/tangkapan/${nama}.png`, Buffer.from(f.result.data, 'base64')); };
// Titik uji per kartu: pusat gambar (bagian atas kartu), pusat judul, pusat ringkasan/badan bawah
const TITIK = `(sel) => { const out = []; document.querySelectorAll(sel).forEach((k, i) => { if (i > 2) return; k.scrollIntoView({ block: 'center' }); const r = k.getBoundingClientRect(); const judul = k.querySelector('h1, h2, h3, h4'); const gambar = k.querySelector('img, [role=img], [style*="background-image"]'); const p = k.querySelector('p'); const tgt = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; }; out.push({ i, slug: (k.querySelector('a[href^="/berita/"]') || {}).getAttribute?.('href') || null, kartu: { x: Math.round(r.left + 12), y: Math.round(r.top + r.height - 12) }, gambar: tgt(gambar), judul: tgt(judul), ringkasan: tgt(p) }); }); return out; }`;
async function ujiHalaman(nama, url, selektor, batasKartu = 2) {
  console.log(`\n## ${nama} — ${url}`);
  for (let k = 0; k <= batasKartu; k++) {
    await buka(url);
    const daftar = await ev(`(${TITIK})(${JSON.stringify(selektor)})`); const kartu = daftar?.[k]; if (!kartu) { if (k === 0) cek(`${nama}: kartu artikel ditemukan (${selektor})`, false, 'tidak ada'); break; }
    for (const bagian of ['gambar', 'judul', 'ringkasan', 'kartu']) {
      const p = kartu[bagian]; if (!p) continue;
      await buka(url); await ev(`document.querySelectorAll(${JSON.stringify(selektor)})[${k}].scrollIntoView({block:'center'})`); await tidur(300);
      const pos = await ev(`(() => { const el = document.querySelectorAll(${JSON.stringify(selektor)})[${k}]; const q = el.querySelector(${JSON.stringify(bagian === 'gambar' ? 'img, [role=img], [style*="background-image"]' : bagian === 'judul' ? 'h1, h2, h3, h4' : bagian === 'ringkasan' ? 'p' : 'article, li, div')}); const b = (bagian => (bagian === 'kartu' ? el : q))(${JSON.stringify(bagian)})?.getBoundingClientRect(); if (!b) return null; return ${JSON.stringify(bagian)} === 'kartu' ? { x: Math.round(b.left + 12), y: Math.round(b.bottom - 12) } : { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
      if (!pos) continue;
      const diTitik = await ev(`(() => { const e = document.elementFromPoint(${pos.x}, ${pos.y}); return e ? e.tagName.toLowerCase() + (e.closest('a') ? ' (dalam <a href=' + e.closest('a').getAttribute('href') + '>)' : ' (TANPA <a>)') : 'null'; })()`);
      const sebelum = await ev('location.pathname'); await klik(pos.x, pos.y); const sesudah = await ev('location.pathname');
      const pindah = sesudah !== sebelum && /^\/berita\/[a-z0-9-]+/.test(sesudah);
      cek(`${nama} kartu #${k + 1} klik ${bagian} (${pos.x},${pos.y})`, pindah, `elemen: ${diTitik}; ${sebelum} → ${sesudah}`);
      if (!pindah && k === 0 && bagian === 'gambar') await foto(`1-${LABEL}-${nama.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-klik-gambar-gagal`);
    }
  }
}
// pemanasan: rute detail dikompilasi dulu (dev) agar waktu tunggu klik mengukur navigasi, bukan kompilasi
await buka(`${U}/berita`); const slugAwal = await ev(`(() => { const a = document.querySelector('a[href^="/berita/"]'); return a ? a.getAttribute('href') : '/berita'; })()`); await buka(`${U}${slugAwal}`); await tidur(2000);
await ujiHalaman('beranda-sorotan', `${U}/`, 'article:has(a[href^="/berita/"])', 1);
await ujiHalaman('berita-unggulan', `${U}/berita`, 'div.group.cursor-pointer', 0);
await ujiHalaman('berita-daftar', `${U}/berita`, 'article', 1);
await ujiHalaman('berita-sidebar', `${U}/berita`, 'li.group.cursor-pointer', 0);
const slug = await ev(`(() => { const a = document.querySelector('a[href^="/berita/"]'); return a ? a.getAttribute('href') : '/berita'; })()`);
await ujiHalaman('detail-artikel-terkait', `${U}${slug}`, 'section a.group[href^="/berita/"]', 1);
// dashboard staf
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
if (TK) { await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' }); console.log('\n## dashboard staf — artikel terbaru'); await buka(`${US}/staf/dashboard`); const hasil = await ev(`(() => { const out = []; document.querySelectorAll('a[href^="/staf/artikel/"], a[href^="/berita/"]').forEach(a => out.push(a.getAttribute('href') + ' | ' + a.textContent.replace(/\\s+/g,' ').trim().slice(0,40))); const judul = [...document.querySelectorAll('h3, h4, td, li')].filter(el => /artikel/i.test(el.closest('section, div')?.textContent || '')).length; return { tautan: out.slice(0, 8), judulTanpaTautan: [...document.querySelectorAll('section')].filter(s => /Artikel Terbaru/i.test(s.textContent)).map(s => [...s.querySelectorAll('li, tr')].filter(li => !li.querySelector('a')).length) }; })()`); console.log('  tautan artikel di dashboard:', JSON.stringify(hasil)); }
console.log(`\nkonsol error: ${konsol.length}${konsol.length ? '\n  ' + konsol.join('\n  ') : ''}`);
console.log(`\nRINGKASAN klik kartu (${LABEL}): ${gagal === 0 ? 'LULUS' : `${gagal} klik TIDAK berpindah`}`);
ws.close(); chrome.kill(); process.exit(0);
