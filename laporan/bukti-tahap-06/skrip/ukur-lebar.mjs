#!/usr/bin/env node
// ukur-lebar.mjs <url> <lebar> — memuat halaman di Chrome headless lewat Chrome DevTools Protocol
// (WebSocket bawaan Node 22) dan melaporkan scrollWidth dokumen serta elemen yang tepi kanannya
// melewati viewport (penyebab gulir mendatar). Untuk uji o/b (375/768/1280) tanpa paket tambahan.
import { spawn } from 'node:child_process';
import { setTimeout as tidur } from 'node:timers/promises';

const [, , url, lebarArg] = process.argv;
const lebar = Number(lebarArg) || 375;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, `--window-size=${lebar},1000`, 'about:blank'], { stdio: 'ignore' });
try {
  let target = null;
  for (let i = 0; i < 40 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { await tidur(250); }
  }
  if (!target) throw new Error('Chrome tidak menjawab');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let id = 0; const tunggu = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); } };
  const kirim = (method, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: 1000, deviceScaleFactor: 1, mobile: lebar < 768 });
  await kirim('Page.enable');
  await kirim('Page.navigate', { url });
  await tidur(4000);
  const { result } = await kirim('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const vw = document.documentElement.clientWidth;
    const lebih = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) lebih.push({ tag: el.tagName.toLowerCase(), kelas: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 90), right: Math.round(r.right), width: Math.round(r.width), teks: (el.textContent || '').trim().slice(0, 30) });
    }
    return { vw, scrollWidth: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, jumlah: lebih.length, lebih: lebih.slice(0, 12) };
  })()` });
  const v = result.result?.value ?? (() => { throw new Error(JSON.stringify(result).slice(0, 300)); })();
  console.log(`${url} @${lebar}px: clientWidth=${v.vw} scrollWidth=${v.scrollWidth} -> ${v.scrollWidth > v.vw ? 'MELEBAR (gulir mendatar)' : 'PAS'}; elemen melewati tepi: ${v.jumlah}`);
  for (const e of v.lebih) console.log(`  <${e.tag}> right=${e.right} width=${e.width} | ${e.kelas} | ${e.teks}`);
  // Argumen ke-3 opsional: jalur PNG tangkapan layar penuh pada viewport yang diemulasi (bukan lebar jendela
  // desktop yang punya minimum ±500 px — sebab tangkapan "375" lewat --screenshot terpotong).
  const keluar = process.argv[4];
  if (keluar) {
    const tinggi = Math.min(6000, (await kirim('Runtime.evaluate', { returnByValue: true, expression: 'document.documentElement.scrollHeight' })).result.result.value);
    await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: tinggi, deviceScaleFactor: 1, mobile: lebar < 768 });
    await tidur(500);
    const foto = await kirim('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const { writeFileSync } = await import('node:fs');
    writeFileSync(keluar, Buffer.from(foto.result.data, 'base64'));
    console.log(`  tangkapan: ${keluar} (${lebar}x${tinggi})`);
  }
  ws.close();
} finally {
  chrome.kill();
}
