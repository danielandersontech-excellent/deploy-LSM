import { readFileSync } from 'node:fs';
const baca = (f) => { const t = readFileSync(f, 'utf8'); const layar = {}; let kini = null;
  for (const b of t.split('\n')) { const m = b.match(/^### (\d+)\. (\S+)/); if (m) { kini = m[2]; layar[kini] = {}; continue; }
    if (!kini) continue; const k = b.match(/^- kelas hilang \(\d+\): (.*)$/); if (k) layar[kini].kelas = new Set(k[1].split(', ').filter((x) => x !== '-'));
    const x = b.match(/^- teks hilang: (.*)$/); if (x) layar[kini].teks = new Set(x[1].split(' | ').filter((y) => y !== '-')); }
  return layar; };
const a = baca('laporan/bukti-qa-3/g-regresi-kesetiaan-14-layar.md'), b = baca('laporan/bukti-qa-4/g-regresi-kesetiaan-14-layar.md');
for (const n of Object.keys(a)) { const d = (s1, s2) => [...s1].filter((x) => !s2.has(x));
  const kb = d(b[n].kelas, a[n].kelas), kp = d(a[n].kelas, b[n].kelas), tb = d(b[n].teks, a[n].teks), tp = d(a[n].teks, b[n].teks);
  if (kb.length + kp.length + tb.length + tp.length) console.log(`${n}\n  kelas hilang BARU: ${kb.join(', ') || '-'}\n  kelas kini ADA: ${kp.join(', ') || '-'}\n  teks hilang BARU: ${tb.join(' | ') || '-'}\n  teks kini ADA: ${tp.join(' | ') || '-'}`); }
