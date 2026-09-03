#!/usr/bin/env node
// D2 Tahap 9 — uji beban: 50 "pengguna" bersamaan membaca beranda dan daftar berita (build produksi lokal).
// Tiap pengguna melakukan N putaran (GET / lalu GET /berita), tanpa jeda. Dilaporkan: waktu tanggap p50/p95/maks,
// throughput, galat, dan RSS proses server (PID dari $TEMP/warkop-dev.pid) sebelum/selama/sesudah.
// Pemakaian: node uji-d2-beban.mjs [URL] [pengguna=50] [putaran=10]
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const U = process.argv[2] || 'http://127.0.0.1:3000'; const PENGGUNA = Number(process.argv[3] || 50); const PUTARAN = Number(process.argv[4] || 10);
function rssServer() { try { const pid = readFileSync(`${process.env.TEMP}/warkop-dev.pid`, 'utf8').trim(); const out = execSync(`powershell.exe -NoProfile -Command "(Get-Process -Id ${pid}).WorkingSet64"`, { encoding: 'utf8' }).trim(); return `${(Number(out) / 1048576).toFixed(0)} MB (PID ${pid})`; } catch { return 'tidak terbaca'; } }
const stat = (arr) => { const s = [...arr].sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { n: s.length, p50: q(0.5), p95: q(0.95), maks: s[s.length - 1], rata: s.reduce((a, b) => a + b, 0) / s.length }; };
console.log(`# D2 beban — ${U} — ${PENGGUNA} pengguna × ${PUTARAN} putaran (GET / + GET /berita) — ${new Date().toISOString()}`);
console.log(`RSS server sebelum: ${rssServer()}`);
const latensi = { '/': [], '/berita': [] }; let galat = 0; let rssTengah = '';
const mulai = Date.now();
const pengguna = Array.from({ length: PENGGUNA }, async (_, i) => {
  for (let p = 0; p < PUTARAN; p++) {
    for (const jalur of ['/', '/berita']) {
      const t0 = performance.now();
      try { const r = await fetch(`${U}${jalur}`, { headers: { 'user-agent': `uji-beban/${i}` } }); await r.text(); if (r.status !== 200) galat++; } catch { galat++; }
      latensi[jalur].push(performance.now() - t0);
    }
    if (i === 0 && p === Math.floor(PUTARAN / 2)) rssTengah = rssServer();
  }
});
await Promise.all(pengguna);
const durasi = (Date.now() - mulai) / 1000; const total = latensi['/'].length + latensi['/berita'].length;
for (const jalur of ['/', '/berita']) { const s = stat(latensi[jalur]); console.log(`${jalur.padEnd(8)} n=${s.n} p50=${s.p50.toFixed(0)} ms p95=${s.p95.toFixed(0)} ms maks=${s.maks.toFixed(0)} ms rata=${s.rata.toFixed(0)} ms`); }
console.log(`total ${total} permintaan dalam ${durasi.toFixed(1)} s = ${(total / durasi).toFixed(1)} req/s; galat/non-200: ${galat}`);
console.log(`RSS server di tengah: ${rssTengah || '-'}; sesudah: ${rssServer()}`);
await new Promise((r) => setTimeout(r, 5000)); console.log(`RSS server 5 s kemudian: ${rssServer()}`);
console.log(`\nHASIL D2: ${galat === 0 ? 'LULUS — tanpa galat' : `${galat} galat`}`);
process.exit(0);
