#!/usr/bin/env node
// QA-2 B0a — matriks keadaan sesi × jalur: tidak boleh ada loop redirect maupun layar kosong.
// Keadaan: tanpa cookie | sah | basi (token_version dinaikkan) | kadaluarsa (JWT exp lewat) | wajib_ganti_sandi=1.
// Jalur: /login, /staf/dashboard, /staf/ganti-sandi, /staf/artikel (mewakili /staf/*).
// Setiap sel: rantai redirect diikuti manual (maks 8 lompatan) → dicatat; loop = jalur berulang / > 8 lompatan.
// Lalu Chrome headless (CDP) membuka /login?lanjut=/staf/dashboard dengan cookie basi: harus tampil FORMULIR login
// (bukan ERR_TOO_MANY_REDIRECTS). Pemakaian: node uji-b0a-sesi.mjs [URL] [URL staf] [--produksi]
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { SignJWT } from 'jose';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://localhost:3000'; const US = argv[1] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
mkdirSync('laporan/bukti-qa-2/tangkapan', { recursive: true });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
const api = (m, p, tk, b) => fetch(`${US}${p}`, { method: m, headers: { 'content-type': 'application/json', ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: b ? JSON.stringify(b) : undefined, redirect: 'manual' });
const login = async (email, sandi) => { const r = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); return { s: r.status, tk: ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null }; };
console.log(`# QA-2 B0a — matriks sesi × jalur — ${US} — ${new Date().toISOString()}`);

// --- akun uji: pengguna khusus (dibuat superadmin) agar token_version & wajib_ganti_sandi bisa dimainkan tanpa mengganggu akun lain
const admin = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD); cek('login superadmin', admin.s === 200, `HTTP ${admin.s}`);
const emailUji = `uji.b0a.${Date.now()}@warkopnusantara.id`; const sandi = 'SandiUji-B0a-2026!';
const rb = await api('POST', '/api/staf/pengguna', admin.tk, { nama: 'Pengguna Uji B0a', email: emailUji, peran: 'penulis', kata_sandi: sandi, aktif: true }); const jb = await rb.json(); const idUji = jb.pengguna?.id; cek('buat pengguna uji', rb.status === 201, `id ${idUji}`);
const sah = await login(emailUji, sandi); cek('login pengguna uji (cookie SAH)', sah.s === 200 && !!sah.tk);
// cookie BASI: login lagi (token baru) lalu paksa-keluar → token_version naik → keduanya basi
const basi = await login(emailUji, sandi); await api('POST', `/api/staf/pengguna/${idUji}/paksa-keluar`, admin.tk, {});
const cekBasi = await api('GET', '/api/auth/saya', basi.tk); cek('cookie BASI (token_version naik) → /api/auth/saya 401', cekBasi.status === 401, `HTTP ${cekBasi.status}`);
// cookie KADALUARSA: JWT ditandatangani rahasia yang sama dengan exp lampau (hanya lokal: butuh JWT_SECRET)
let kadaluarsa = null;
if (env.JWT_SECRET) { const sayaSah = await (await api('GET', '/api/auth/saya', (await login(emailUji, sandi)).tk)).json(); const p = sayaSah.pengguna || sayaSah; kadaluarsa = await new SignJWT({ id: p.id, peran: p.peran, token_version: p.token_version ?? 0 }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt(Math.floor(Date.now() / 1000) - 7200).setExpirationTime(Math.floor(Date.now() / 1000) - 3600).setIssuer(env.JWT_ISSUER || 'warkop-nusantara').sign(new TextEncoder().encode(env.JWT_SECRET)); }
// sesi SAH normal akun A (login terakhir; token_version terbaru)
const tkSahNormal = (await login(emailUji, sandi)).tk; cek('sesi SAH akun A', !!tkSahNormal);
// akun B untuk keadaan wajib_ganti_sandi=1 (reset oleh superadmin lalu login dengan sandi sementara)
const emailB = `uji.b0a.b.${Date.now()}@warkopnusantara.id`; const rbB = await api('POST', '/api/staf/pengguna', admin.tk, { nama: 'Pengguna Uji B0a B', email: emailB, peran: 'penulis', kata_sandi: sandi, aktif: true }); const idB = (await rbB.json()).pengguna?.id;
const sementara = 'Sementara-B0a-2026!'; await api('POST', `/api/staf/pengguna/${idB}/reset-sandi`, admin.tk, { kata_sandi_baru: sementara });
const wajib2 = await login(emailB, sementara); cek('login akun B dengan sandi sementara (wajib_ganti_sandi=1)', wajib2.s === 200 && !!wajib2.tk);

const KEADAAN = { 'tanpa cookie': null, 'sah': tkSahNormal, 'basi': basi.tk, 'kadaluarsa': kadaluarsa, 'wajib_ganti_sandi=1': wajib2.tk };
const JALUR = ['/login', '/login?lanjut=%2Fstaf%2Fdashboard', '/staf/dashboard', '/staf/ganti-sandi', '/staf/artikel'];
console.log('\n## Rantai redirect (maks 8 lompatan); loop = jalur berulang');
console.log('| keadaan | jalur awal | rantai | akhir | hasil |\n|---|---|---|---|---|');
for (const [nama, tk] of Object.entries(KEADAAN)) {
  if (nama === 'kadaluarsa' && !tk) { console.log(`| ${nama} | (dilewati: JWT_SECRET tidak tersedia di ${PROD ? 'produksi' : 'env'}) | | | |`); continue; }
  for (const j of JALUR) {
    const rantai = [j]; let url = `${US}${j}`; let status = 0; let html = ''; let loop = false; let cookieKini = tk; const dilihat = new Set([`${j}|${tk ? 'c' : '-'}`]); // loop = (jalur, keadaan cookie) yang sama terulang // cookie jar sederhana: Set-Cookie penghapusan dihormati
    for (let i = 0; i < 8; i++) {
      const r = await fetch(url, { headers: cookieKini ? { cookie: `warkop_token=${cookieKini}` } : {}, redirect: 'manual' }); status = r.status; const sc = r.headers.get('set-cookie') || ''; if (/warkop_token=;|Max-Age=0/i.test(sc)) cookieKini = null; else { const m = sc.match(/warkop_token=([^;]+)/); if (m) cookieKini = m[1]; }
      if (r.status >= 300 && r.status < 400) { const ke = new URL(r.headers.get('location'), url); const jalurKe = ke.pathname + ke.search; const kunci = `${jalurKe}|${cookieKini ? 'c' : '-'}`; if (dilihat.has(kunci)) { loop = true; rantai.push(jalurKe + ' (ULANG)'); break; } dilihat.add(kunci); rantai.push(jalurKe + (cookieKini ? '' : ' [cookie dihapus]')); url = ke.href; continue; }
      html = await r.text(); break;
    }
    if (rantai.length > 8) loop = true;
    const akhir = rantai[rantai.length - 1].split('?')[0];
    const adaForm = /<form/.test(html), adaMain = /<main|id="konten-utama"/.test(html);
    // harapan per keadaan
    let harap;
    if (nama === 'tanpa cookie' || nama === 'basi' || nama === 'kadaluarsa') harap = akhir === '/login' && adaForm;
    else if (nama === 'sah') harap = j.startsWith('/login') ? akhir === '/staf/dashboard' && adaMain : akhir === j && status === 200;
    else harap = akhir === '/staf/ganti-sandi' && adaForm; // wajib: semua jalur berujung formulir ganti sandi
    const ok = !loop && status === 200 && harap;
    if (!ok) gagal++;
    console.log(`| ${nama} | ${j} | ${rantai.join(' → ')} | HTTP ${status}${adaForm ? ' form' : ''}${adaMain ? ' main' : ''} | ${ok ? 'OK' : loop ? 'LOOP' : 'SALAH'} |`);
  }
}

console.log('\n## Chrome: /login?lanjut=/staf/dashboard dengan cookie BASI → harus tampil formulir login');
const port = 9700 + Math.floor(Math.random() * 40);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
for (const [nama, tk] of [['basi', basi.tk], ['wajib_ganti_sandi=1', wajib2.tk], ['sah', tkSahNormal]]) {
  await kirim('Network.clearBrowserCookies'); if (tk) await kirim('Network.setCookie', { name: 'warkop_token', value: tk, url: US, httpOnly: true, secure: US.startsWith('https'), sameSite: 'Lax' });
  const nav = await kirim('Page.navigate', { url: `${US}/login?lanjut=%2Fstaf%2Fdashboard` }); await tidur(4000);
  const info = (await kirim('Runtime.evaluate', { expression: `({ url: location.pathname, judul: document.title, form: !!document.querySelector('form'), teks: document.body.innerText.slice(0, 80).replace(/\\s+/g, ' ') })`, returnByValue: true })).result?.result?.value || {};
  const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync(`laporan/bukti-qa-2/tangkapan/b0a-login-cookie-${nama.replace(/[^a-z0-9]/gi, '')}.png`, Buffer.from(f.result.data, 'base64'));
  const galat = nav.result?.errorText || '';
  const harap = nama === 'basi' ? info.url === '/login' && info.form : nama === 'sah' ? info.url === '/staf/dashboard' : info.url === '/staf/ganti-sandi' && info.form;
  cek(`Chrome cookie ${nama}`, !galat && harap, `${galat || ''} → ${info.url} "${info.judul}" form=${info.form}`);
}
ws.close(); chrome.kill();
// bersihkan pengguna uji
const { kueri, tutupPool } = await import('../../../lib/db/index.js').catch(() => ({}));
if (!PROD && kueri) { await kueri("DELETE FROM users WHERE email LIKE 'uji.b0a.%@warkopnusantara.id'"); await tutupPool(); console.log('  pengguna uji dihapus (SQL)'); }
else { for (const [i, e] of [[idUji, emailUji], [idB, emailB]]) { const d = await api('PATCH', `/api/staf/pengguna/${i}`, admin.tk, { nama: 'Pengguna Uji B0a', email: e, peran: 'penulis', aktif: false }); console.log(`  pengguna uji ${e} dinonaktifkan (${d.status}); PRODUKSI: hapus lewat SQL (SELECT dulu)`); } }
console.log(`\nRINGKASAN B0a: ${gagal === 0 ? 'LULUS — nol loop, nol layar kosong' : `${gagal} GAGAL`}`);
process.exit(0);
