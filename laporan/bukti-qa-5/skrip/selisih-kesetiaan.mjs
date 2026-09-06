#!/usr/bin/env node
// RUN QA-5 — selisih hasil uji kesetiaan 14 layar antara dua berkas keluaran uji-d4b (dasar lama vs baru).
// Mencetak, per layar yang berubah: kelas hilang BARU, kelas kini ADA, teks hilang BARU, teks kini ADA.
// Pemakaian: node laporan/bukti-qa-5/skrip/selisih-kesetiaan.mjs <dasar-lama.md> <hasil-baru.md>
import { readFileSync } from 'node:fs';
const baca = (f) => { const t = readFileSync(f, 'utf8'); const layar = {}; let kini = null;
  for (const b of t.split('\n')) { const m = b.match(/^### (\d+)\. (\S+)/); if (m) { kini = m[2]; layar[kini] = { kelas: new Set(), teks: new Set() }; continue; }
    if (!kini) continue; const k = b.match(/^- kelas hilang \(\d+\): (.*)$/); if (k) layar[kini].kelas = new Set(k[1].trim().split(', ').filter((x) => x && x !== '-'));
    const x = b.match(/^- teks hilang: (.*)$/); if (x) layar[kini].teks = new Set(x[1].trim().split(' | ').filter((y) => y && y !== '-')); }
  return layar; };
const [lama, baru] = process.argv.slice(2);
const a = baca(lama), b = baca(baru); let berubah = 0;
console.log(`# Selisih kesetiaan: ${lama} -> ${baru}`);
for (const n of Object.keys(a)) { if (!b[n]) { console.log(`${n}: TIDAK ADA di hasil baru`); berubah++; continue; } const d = (s1, s2) => [...s1].filter((x) => !s2.has(x));
  const kb = d(b[n].kelas, a[n].kelas), kp = d(a[n].kelas, b[n].kelas), tb = d(b[n].teks, a[n].teks), tp = d(a[n].teks, b[n].teks);
  if (kb.length + kp.length + tb.length + tp.length) { berubah++; console.log(`${n}\n  kelas hilang BARU: ${kb.join(', ') || '-'}\n  kelas kini ADA: ${kp.join(', ') || '-'}\n  teks hilang BARU: ${tb.join(' | ') || '-'}\n  teks kini ADA: ${tp.join(' | ') || '-'}`); } }
console.log(`\n${berubah} layar berubah; ${Object.keys(a).length - berubah} layar identik dengan dasar.`);
