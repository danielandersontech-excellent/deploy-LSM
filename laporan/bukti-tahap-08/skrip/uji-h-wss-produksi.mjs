#!/usr/bin/env node
// UJI h Tahap 8 — WSS di balik HTTPS pada PRODUKSI (staf.<domain>, Traefik/Coolify).
//  1. Node socket.io-client: tanpa cookie -> ditolak; dengan cookie login produksi -> tersambung lewat wss://,
//     transport websocket, room:saya terisi.
//  2. Chrome headless (CDP): buka https://staf.<domain>/staf/dashboard dengan cookie -> WebSocket yang dibuat halaman
//     berawalan wss:// (bukan ws://), tanpa peringatan mixed content di konsol, data-realtime = tersambung.
// Kredensial dibaca dari .env.produksi (gitignored) dan TIDAK PERNAH dicetak.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { io } from 'socket.io-client';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });

const env = Object.fromEntries(readFileSync('.env.produksi', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const HOST = env.STAF_HOST || `staf.${env.DOMAIN}`;
const U = `https://${HOST}`;
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync('laporan/bukti-tahap-08/tangkapan', { recursive: true });
console.log(`# Uji h — WSS produksi ${U} — ${new Date().toISOString()}`);

const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const sc = r.headers.get('set-cookie') || '';
const TK = (sc.match(/warkop_token=([^;]+)/) || [])[1];
console.log(`login produksi: HTTP ${r.status}, cookie ${TK ? 'diterima' : 'TIDAK ADA'}; atribut cookie: ${sc.replace(/warkop_token=[^;]+/, 'warkop_token=<disembunyikan>').slice(0, 160)}`);

function sambung(label, cookie) {
  return new Promise((selesai) => {
    const s = io(U, { path: '/socket.io', transports: ['websocket'], reconnection: false, timeout: 15000, extraHeaders: cookie ? { cookie: `warkop_token=${cookie}` } : {} });
    const t = setTimeout(() => { s.close(); selesai({ label, hasil: 'batas waktu' }); }, 16000);
    s.on('connect', () => {
      const transport = s.io.engine.transport.name;
      const uri = s.io.engine.transport.ws?.url || s.io.uri;
      s.emit('room:saya', (rooms) => { clearTimeout(t); s.close(); selesai({ label, hasil: 'tersambung', transport, uri, rooms }); });
    });
    s.on('connect_error', (g) => { clearTimeout(t); s.close(); selesai({ label, hasil: `ditolak: ${g.message}` }); });
  });
}
console.log('\n## 1. socket.io-client (Node) ke produksi');
const h1 = await sambung('tanpa cookie', null); console.log('  tanpa cookie   ->', h1.hasil);
const h2 = await sambung('cookie sah', TK); console.log('  cookie sah     ->', h2.hasil, h2.transport ? `| transport=${h2.transport} | uri=${String(h2.uri).replace(/\?.*$/, '')} | room=${h2.rooms?.join(',')}` : '');
const lulus1 = /TANPA_TOKEN/.test(h1.hasil) && h2.hasil === 'tersambung' && h2.transport === 'websocket' && String(h2.uri).startsWith('wss://');

console.log('\n## 2. Chrome headless: halaman dashboard produksi membuka wss:// (same-origin), tanpa mixed content');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
let id = 0; const tunggu = new Map(); const wsDibuat = []; const konsol = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; }
  const p = m.params || {};
  if (m.method === 'Network.webSocketCreated') wsDibuat.push(p.url);
  if (m.method === 'Network.webSocketHandshakeResponseReceived') wsDibuat.push(`  handshake ${p.response.status} ${p.response.statusText}`);
  if (m.method === 'Log.entryAdded') konsol.push(`${p.entry.level}: ${p.entry.text.slice(0, 160)}`);
  if (m.method === 'Runtime.consoleAPICalled' && p.type !== 'log') konsol.push(`${p.type}: ${p.args.map((a) => a.value || a.description).join(' ').slice(0, 160)}`);
};
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Network.enable'); await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Log.enable');
await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: U, httpOnly: true, secure: true, sameSite: 'Lax' });
await kirim('Page.navigate', { url: `${U}/staf/dashboard` }); await tidur(8000);
const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const judul = await ev('document.title'); const rt = await ev(`document.documentElement.dataset.realtime || ''`); const url = await ev('location.href');
const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync('laporan/bukti-tahap-08/tangkapan/h-dashboard-produksi.png', Buffer.from(f.result.data, 'base64'));
console.log(`  url=${url} judul="${judul}" data-realtime=${rt}`);
console.log('  WebSocket yang dibuat halaman:'); for (const w of wsDibuat) console.log('   ', w.replace(/\?.*$/, (q) => q.slice(0, 40)));
const mixed = konsol.filter((k) => /mixed content|insecure/i.test(k));
console.log(`  konsol peringatan/galat: ${konsol.length === 0 ? 'tidak ada' : konsol.join(' || ')}`);
console.log(`  mixed content: ${mixed.length === 0 ? 'TIDAK ADA' : mixed.join(' || ')}`);
const lulus2 = rt === 'tersambung' && wsDibuat.some((w) => w.startsWith(`wss://${HOST}/socket.io/`)) && !wsDibuat.some((w) => w.startsWith('ws://')) && mixed.length === 0;
ws.close(); chrome.kill();
console.log(`\nHASIL h: ${lulus1 && lulus2 ? 'LULUS — wss:// di balik HTTPS/Traefik, tanpa cookie ditolak, tanpa mixed content' : `GAGAL (node=${lulus1}, peramban=${lulus2})`}`);
process.exit(0);
