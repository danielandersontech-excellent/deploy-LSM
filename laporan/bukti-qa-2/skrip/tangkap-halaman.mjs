#!/usr/bin/env node
// QA-2 — tangkapan halaman penuh: node tangkap-halaman.mjs <nama> <lebar> <url> [--staf] [--produksi]
// (cookie superadmin bila --staf). Keluaran laporan/bukti-qa-2/tangkapan/<nama>-<lebar>.png. Profil Chrome sementara dihapus.
import 'dotenv/config';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const argv = process.argv.slice(2).filter((a) => !a.startsWith('--')); const [nama, lebarStr, ...urls] = argv; const lebar = Number(lebarStr) || 1280;
const STAF = process.argv.includes('--staf'); const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-')); process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
mkdirSync('laporan/bukti-qa-2/tangkapan', { recursive: true }); const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; }); let id = 0; const tunggu = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
if (STAF) { const u0 = new URL(urls[0]); const r = await fetch(`${u0.origin}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) }); const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; if (TK) await kirim('Network.setCookie', { name: 'warkop_token', value: TK, url: u0.origin, httpOnly: true, secure: u0.protocol === 'https:', sameSite: 'Lax' }); }
const mobile = lebar < 700;
for (const [i, url] of urls.entries()) {
  await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await kirim('Page.navigate', { url }); await tidur(4000);
  const tinggi = Math.min(8000, (await kirim('Runtime.evaluate', { expression: 'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)', returnByValue: true })).result?.result?.value || 900);
  await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: tinggi, deviceScaleFactor: mobile ? 2 : 1, mobile }); await tidur(500);
  const f = await kirim('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const berkas = `laporan/bukti-qa-2/tangkapan/${nama}${urls.length > 1 ? '-' + (i + 1) : ''}-${lebar}.png`; writeFileSync(berkas, Buffer.from(f.result.data, 'base64'));
  console.log(`${berkas} (${lebar}x${tinggi}) <- ${url}`);
}
ws.close(); chrome.kill(); process.exit(0);
