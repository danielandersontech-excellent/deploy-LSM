// D5 pelengkap — apa yang DILIHAT pengguna di peramban saat basis data mati (error boundary app/error.js dirender di klien).
import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as gabungJalur } from 'node:path';
// Profil Chrome sementara per run + dihapus saat keluar (QA-1: 162 profil HeadlessChrome* yatim memenuhi disk C: ±100 MB/run)
const PROFIL_CDP = mkdtempSync(gabungJalur(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL_CDP, { recursive: true, force: true }); } catch {} });
const U = process.argv[2] || 'http://localhost:3000'; const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9870; const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL_CDP}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const m = new Map(); ws.onmessage = (e) => { const x = JSON.parse(e.data); if (x.id && m.has(x.id)) { m.get(x.id)(x); m.delete(x.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; m.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable');
for (const jalur of ['/berita', '/', '/lacak?nomor=WRP-000001']) {
  await kirim('Page.navigate', { url: `${U}${jalur}` }); await tidur(5000);
  const teks = (await kirim('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true })).result.result.value || '';
  const rapi = /Halaman tidak dapat dimuat|gangguan sementara/.test(teks); const jejak = /at async|node_modules|ECONNREFUSED|sqlMessage|TypeError|Error:/.test(teks);
  console.log(`  ${jalur}: pesan rapi=${rapi}, jejak galat=${jejak}, cuplikan: "${teks.replace(/\s+/g, ' ').slice(0, 160)}"`);
  if (jalur === '/berita') { const f = await kirim('Page.captureScreenshot', { format: 'png' }); writeFileSync('laporan/bukti-tahap-09/tangkapan/d5-berita-saat-db-mati.png', Buffer.from(f.result.data, 'base64')); }
}
ws.close(); chrome.kill(); process.exit(0);
