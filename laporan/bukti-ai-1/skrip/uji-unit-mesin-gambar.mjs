#!/usr/bin/env node
// RUN AI-1 E — uji unit mesin gambar berlisensi per adaptor (kueri netral; panggilan penyedia nyata tetapi wajar).
//   1. lisensiWikimediaBebas (murni): CC0 / Public domain -> diterima; CC BY, CC BY-SA, GFDL, kosong -> dibuang
//   2. skorRelevansi / skorKandidat (murni): kata kueri cocok pada judul/tag; Openverse/Wikimedia tanpa kecocokan -> -1
//   3. tiap adaptor aktif dengan kueri netral "flood river aerial": jumlah mentah, lisensi tiap kandidat sah, lebar >= 1200
//   4. Wikimedia RINCI: hasil mentah memuat kandidat CC BY/CC BY-SA dan SEMUANYA terbuang (dibuang[] tercatat)
//   5. kumpulkanKandidat lintas penyedia: statistik per penyedia, pilihan terbaik, urutan skor menurun
// Pemakaian: node laporan/bukti-ai-1/skrip/uji-unit-mesin-gambar.mjs
import 'dotenv/config';
import { lisensiWikimediaBebas, skorRelevansi, skorKandidat, saringKandidat, kumpulkanKandidat, ADAPTOR, penyediaAktif, cariWikimediaRinci, LEBAR_MIN, LISENSI } from '../../../lib/gambarBerlisensi.js';

let no = 0, gagal = 0;
const uji = async (nama, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${nama} -> ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${nama} -> GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const LISENSI_SAH = new Set(Object.values(LISENSI));

console.log(`# RUN AI-1 E — uji unit mesin gambar berlisensi — ${new Date().toISOString()}`);
console.log(`penyedia aktif: ${penyediaAktif().join(', ')} (Pexels ${process.env.PEXELS_API_KEY ? 'ada kunci' : 'TANPA kunci -> nonaktif'})`);

console.log('\n## 1. filter lisensi Wikimedia (murni)');
const kasus = [
  [{ LicenseShortName: { value: 'CC0' }, License: { value: 'cc0' } }, true],
  [{ LicenseShortName: { value: 'Public domain' }, License: { value: 'pd' } }, true],
  [{ LicenseShortName: { value: 'Public domain' }, License: { value: 'pd-us' } }, true],
  [{ LicenseShortName: { value: 'CC BY 4.0' }, License: { value: 'cc-by-4.0' } }, false],
  [{ LicenseShortName: { value: 'CC BY-SA 4.0' }, License: { value: 'cc-by-sa-4.0' } }, false],
  [{ LicenseShortName: { value: 'CC BY-SA 3.0' }, License: { value: 'cc-by-sa-3.0' } }, false],
  [{ LicenseShortName: { value: 'GFDL' }, License: { value: 'gfdl' } }, false],
  [{}, false],
];
await uji('8 kasus extmetadata', () => { for (const [e, harap] of kasus) { const r = lisensiWikimediaBebas(e); wajib(r.bebas === harap, `${JSON.stringify(e)} -> ${r.bebas} (harap ${harap})`); } return 'CC0/Public domain diterima; CC BY, CC BY-SA, GFDL, kosong dibuang'; });

console.log('\n## 2. skor relevansi (murni)');
await uji('skorRelevansi "flooded village street" vs tag [flood, village, road]', () => { const s = skorRelevansi({ judul: '', tag: ['flood', 'village', 'road'] }, 'flooded village street'); wajib(Math.abs(s - 2 / 3) < 0.01, `skor ${s}`); return `${s.toFixed(2)} (flood~flooded, village cocok; street tidak)`; });
await uji('Openverse/Wikimedia tanpa kecocokan -> skor -1 (tidak layak); Pixabay tanpa kecocokan tetap layak', () => {
  const o = skorKandidat({ penyedia: 'openverse', judul: 'kucing', tag: [], lebar: 1600, tinggi: 1000 }, 'flood river', 0);
  const p = skorKandidat({ penyedia: 'pixabay', judul: '', tag: ['cat'], lebar: 1280, tinggi: 853 }, 'flood river', 0);
  wajib(o === -1 && p > 0, `openverse=${o} pixabay=${p}`); return `openverse=-1, pixabay=${p.toFixed(1)}`;
});
await uji('kueri pertama (spesifik) + landscape + resolusi lebih tinggi menang', () => {
  const a = skorKandidat({ penyedia: 'wikimedia', judul: 'flood river town', tag: [], lebar: 1920, tinggi: 1280 }, 'flood river', 0);
  const b = skorKandidat({ penyedia: 'wikimedia', judul: 'flood river town', tag: [], lebar: 1200, tinggi: 1600 }, 'flood river', 2);
  wajib(a > b, `a=${a} b=${b}`); return `a=${a.toFixed(1)} > b=${b.toFixed(1)}`;
});
await uji('kecocokan penuh pada kueri UMUM (indeks 2) kalah dari kecocokan 2/3 pada kueri SPESIFIK (indeks 0)', () => {
  const umum = skorKandidat({ penyedia: 'wikimedia', judul: 'heavy rain flood', tag: [], lebar: 1920, tinggi: 1080 }, 'heavy rain flood', 2);
  const spesifik = skorKandidat({ penyedia: 'pixabay', judul: '', tag: ['flood', 'village', 'water'], lebar: 1280, tinggi: 853 }, 'flooded village houses indonesia', 0);
  wajib(spesifik > umum, `spesifik=${spesifik} umum=${umum}`); return `spesifik=${spesifik.toFixed(1)} > umum=${umum.toFixed(1)}`;
});
await uji('judul Wikimedia/Openverse bertema satelit/peta/diagram -> -1 (dilewati)', () => {
  const s = skorKandidat({ penyedia: 'wikimedia', judul: 'Satellite image of flood in Sumatra', tag: [], lebar: 1920, tinggi: 1080 }, 'flood sumatra', 0);
  const m = skorKandidat({ penyedia: 'openverse', judul: 'Flood map 2020', tag: [], lebar: 1600, tinggi: 1200 }, 'flood map', 0);
  const f = skorKandidat({ penyedia: 'wikimedia', judul: 'Flooded street in Jakarta', tag: [], lebar: 1920, tinggi: 1080 }, 'flooded street', 0);
  wajib(s === -1 && m === -1 && f > 0, `satelit=${s} peta=${m} foto=${f}`); return `satelit=-1, peta=-1, foto=${f.toFixed(1)}`;
});
await uji('saringKandidat membuang lebar < 1200 dan tanpa lisensi', () => { const r = saringKandidat([{ url: 'u', lisensi: 'x', lebar: 1199, tinggi: 800 }, { url: 'u', lisensi: '', lebar: 2000, tinggi: 800 }, { url: 'u', lisensi: 'x', lebar: 1200, tinggi: 800 }]); wajib(r.length === 1 && r[0].lebar === 1200, JSON.stringify(r)); return '1 dari 3 lolos'; });

console.log('\n## 3. adaptor nyata, kueri netral "flood river aerial"');
const KUERI = 'flood river aerial';
const statistik = {};
for (const nama of penyediaAktif()) {
  await uji(`adaptor ${nama}`, async () => {
    const mentah = await ADAPTOR[nama](KUERI);
    const lolos = saringKandidat(mentah);
    const lisensiAsing = mentah.filter((k) => !LISENSI_SAH.has(k.lisensi));
    wajib(lisensiAsing.length === 0, `lisensi di luar daftar sah: ${lisensiAsing.map((k) => k.lisensi).join('|')}`);
    wajib(lolos.every((k) => k.lebar >= LEBAR_MIN), 'ada kandidat < 1200 lolos');
    statistik[nama] = { mentah: mentah.length, lolos: lolos.length, lisensi: [...new Set(mentah.map((k) => k.lisensi))] };
    const c = lolos[0];
    return `mentah=${mentah.length} lolos=${lolos.length}; lisensi=${statistik[nama].lisensi.join(' | ') || '(tidak ada hasil)'}${c ? `; contoh: ${c.lebar}x${c.tinggi} "${(c.judul || c.tag.slice(0, 4).join(', ')).slice(0, 50)}"` : ''}`;
  });
}
await uji('adaptor pexels tanpa kunci -> [] (nonaktif, tidak melempar)', async () => { if (process.env.PEXELS_API_KEY) return 'dilewati: kunci ada'; const r = await ADAPTOR.pexels(KUERI); wajib(Array.isArray(r) && r.length === 0, 'bukan []'); return '[]'; });

console.log('\n## 4. Wikimedia rinci: kandidat CC BY / CC BY-SA harus TERBUANG');
await uji('cariWikimediaRinci "flood river aerial"', async () => {
  const { kandidat, dibuang } = await cariWikimediaRinci(KUERI);
  const beratribusi = dibuang.filter((d) => /CC BY|CC-BY|GFDL/i.test(d.lisensi));
  wajib(kandidat.every((k) => k.lisensi === LISENSI.cc0 || k.lisensi === LISENSI.pd), `kandidat memuat lisensi lain: ${kandidat.map((k) => k.lisensi).join('|')}`);
  statistik.wikimedia_rinci = { diterima: kandidat.length, dibuang: dibuang.length, beratribusi: beratribusi.length, contohDibuang: dibuang.slice(0, 3) };
  return `diterima=${kandidat.length} (CC0/PD saja); dibuang=${dibuang.length}, di antaranya CC BY/BY-SA=${beratribusi.length}; contoh dibuang: ${dibuang.slice(0, 3).map((d) => `"${d.judul.slice(0, 30)}" [${d.lisensi}]`).join('; ') || '(tidak ada)'}`;
});
await uji('Wikimedia kueri kedua "Jakarta flood" (bukti tambahan lisensi beratribusi terbuang)', async () => {
  const { kandidat, dibuang } = await cariWikimediaRinci('Jakarta flood');
  const beratribusi = dibuang.filter((d) => /CC BY|CC-BY|GFDL/i.test(d.lisensi));
  wajib(kandidat.every((k) => k.lisensi === LISENSI.cc0 || k.lisensi === LISENSI.pd), 'kandidat memuat lisensi lain');
  statistik.wikimedia_jakarta = { diterima: kandidat.length, dibuang: dibuang.length, beratribusi: beratribusi.length };
  return `diterima=${kandidat.length}; dibuang=${dibuang.length} (CC BY/BY-SA ${beratribusi.length})`;
});

console.log('\n## 5. kumpulkanKandidat lintas penyedia');
await uji('3 kueri (spesifik -> umum): statistik per penyedia + pilihan terbaik', async () => {
  const { kandidat, statistik: st } = await kumpulkanKandidat(['flooded village street indonesia', 'flood water houses', 'heavy rain']);
  wajib(kandidat.length > 0, 'tidak ada kandidat');
  for (let i = 1; i < kandidat.length; i++) wajib(kandidat[i - 1].skor >= kandidat[i].skor, 'urutan skor tidak menurun');
  wajib(kandidat.every((k) => k.lebar >= LEBAR_MIN && LISENSI_SAH.has(k.lisensi)), 'kandidat tidak sah lolos');
  statistik.gabungan = { total: kandidat.length, perPenyedia: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, { mentah: v.mentah, lolos: v.lolos, galat: v.galat }])), terbaik: { penyedia: kandidat[0].penyedia, skor: Math.round(kandidat[0].skor), ukuran: `${kandidat[0].lebar}x${kandidat[0].tinggi}`, judul: (kandidat[0].judul || kandidat[0].tag.slice(0, 5).join(', ')).slice(0, 60), lisensi: kandidat[0].lisensi, kueri: kandidat[0].kueri } };
  return `total=${kandidat.length}; ${Object.entries(st).map(([k, v]) => `${k}: mentah ${v.mentah}, lolos ${v.lolos}${v.galat.length ? `, galat ${v.galat.length}` : ''}`).join('; ')}; TERBAIK=${kandidat[0].penyedia} ${kandidat[0].lebar}x${kandidat[0].tinggi} skor ${Math.round(kandidat[0].skor)} "${(kandidat[0].judul || kandidat[0].tag.slice(0, 4).join(', ')).slice(0, 50)}"`;
});

console.log('\n## statistik kandidat per penyedia (untuk laporan)');
console.log(JSON.stringify(statistik, null, 1));
console.log(`\nRINGKASAN unit mesin gambar: ${no} butir, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(gagal ? 1 : 0);
