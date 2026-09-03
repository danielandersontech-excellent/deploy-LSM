// laporan/bukti-tahap-07/skrip/uji-g-pengaturan.mjs — Uji g (daftar putih pengaturan) & h (beranda).
// Seluruh permintaan HTTP lewat curl.exe dengan cookie superadmin ($TEMP/admin.txt hasil login).
// Jalankan: node laporan/bukti-tahap-07/skrip/uji-g-pengaturan.mjs > laporan/bukti-tahap-07/g-daftar-putih-pengaturan.txt
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DASAR = 'http://127.0.0.1:3000';
const TEMP = process.env.TEMP || process.env.TMP;
const COOKIE = join(TEMP, 'admin.txt');
const MODE = process.argv[2] || 'g';

function curl(args) {
  return execFileSync('curl.exe', ['-s', '-b', COOKIE, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
function api(metode, jalur, body) {
  const args = ['-X', metode, '-w', '\n__STATUS__%{http_code}', `${DASAR}${jalur}`];
  if (body !== undefined) args.push('-H', 'content-type: application/json', '-d', JSON.stringify(body));
  const keluar = curl(args);
  const i = keluar.lastIndexOf('\n__STATUS__');
  const status = Number(keluar.slice(i + 11));
  const teks = keluar.slice(0, i);
  let json = null;
  try { json = JSON.parse(teks); } catch { /* bukan JSON */ }
  return { status, json, teks };
}
function html(jalur) {
  return curl([`${DASAR}${jalur}`]);
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const ringkas = (s) => (String(s).length > 70 ? `${String(s).slice(0, 67)}…` : String(s));
const baris = [];
const cetak = (s = '') => { baris.push(s); console.log(s); };
let gagal = 0;
const cek = (kondisi, pesan) => { if (!kondisi) gagal += 1; cetak(`  [${kondisi ? 'OK' : 'GAGAL'}] ${pesan}`); };

cetak(`# Uji ${MODE} — ${new Date().toISOString()} — cookie superadmin (email disamarkan), curl.exe`);

if (MODE === 'g') {
  cetak('\n## Langkah 0 — nilai awal (GET /api/staf/pengaturan)');
  const awal = api('GET', '/api/staf/pengaturan');
  cek(awal.status === 200, `GET status ${awal.status}`);
  const nilaiAwal = awal.json.nilai;
  const definisi = awal.json.definisi;
  const daftarPutih = awal.json.daftarPutih;
  writeFileSync(join(TEMP, 'pengaturan-awal.json'), JSON.stringify(nilaiAwal, null, 2));
  cetak(`  daftarPutih (${daftarPutih.length}): ${daftarPutih.join(', ')}`);
  cek(definisi.length === daftarPutih.length && definisi.every((d) => daftarPutih.includes(d.kunci)), 'definisi ⇔ daftarPutih konsisten (satu sumber)');
  for (const d of definisi) cetak(`  ${d.kunci} [${d.tipe}/${d.kelompok}] = ${JSON.stringify(ringkas(nilaiAwal[d.kunci]))}`);

  cetak('\n## Langkah 1 — simpan SETIAP kunci satu per satu (PATCH satu kunci per permintaan)');
  const nilaiBaru = {};
  for (const d of definisi) {
    const lama = nilaiAwal[d.kunci];
    // angka +1; teks + " (uji)"; kunci email: " (uji)" bukan email sah (validasi menolak, benar) -> awalan "uji-" pada bagian lokal
    const baru = d.tipe === 'angka' ? String(Number(lama) + 1) : d.kunci === 'kontak_email' ? `uji-${lama}` : `${lama} (uji)`;
    nilaiBaru[d.kunci] = baru;
    const r = api('PATCH', '/api/staf/pengaturan', { [d.kunci]: baru });
    cek(r.status === 200 && r.json?.tersimpan?.length === 1 && r.json.tersimpan[0] === d.kunci && r.json.nilai[d.kunci] === baru,
      `PATCH {${d.kunci}} -> ${r.status} tersimpan=${JSON.stringify(r.json?.tersimpan)} nilai=${JSON.stringify(ringkas(r.json?.nilai?.[d.kunci] ?? r.json?.galat))}`);
  }

  cetak('\n## Langkah 2 — muat ulang: GET API + render /staf/pengaturan');
  const ulang = api('GET', '/api/staf/pengaturan');
  cek(ulang.status === 200, `GET status ${ulang.status}`);
  for (const d of definisi) cek(ulang.json.nilai[d.kunci] === nilaiBaru[d.kunci], `API ${d.kunci} = ${JSON.stringify(ringkas(ulang.json.nilai[d.kunci]))}`);
  const render = html('/staf/pengaturan');
  writeFileSync(join(TEMP, 'render-pengaturan-uji.html'), render);
  cetak(`  render /staf/pengaturan: ${render.length} byte, judul: ${(render.match(/<title>([^<]*)<\/title>/) || [])[1]}`);
  for (const d of definisi) {
    const v = esc(nilaiBaru[d.kunci]);
    const ada = d.tipe === 'teks_panjang' ? render.includes(v) : render.includes(`value="${v}"`);
    cek(ada, `render memuat ${d.kunci} = ${JSON.stringify(ringkas(nilaiBaru[d.kunci]))}${d.tipe === 'teks_panjang' ? ' (isi textarea)' : ' (atribut value)'}`);
  }

  cetak('\n## Langkah 3 — kembalikan nilai asli (PATCH nilai semula) lalu periksa');
  const pulih = api('PATCH', '/api/staf/pengaturan', nilaiAwal);
  cek(pulih.status === 200 && pulih.json?.tersimpan?.length === definisi.length, `PATCH pulihkan ${definisi.length} kunci -> ${pulih.status} tersimpan=${pulih.json?.tersimpan?.length}`);
  const setelah = api('GET', '/api/staf/pengaturan');
  for (const d of definisi) cek(setelah.json.nilai[d.kunci] === nilaiAwal[d.kunci], `pulih ${d.kunci} = ${JSON.stringify(ringkas(setelah.json.nilai[d.kunci]))}`);

  cetak('\n## Langkah 4 — kunci TIDAK terdaftar {"warna_tema":"merah"} harus 422 dengan pesan jelas');
  const asing = api('PATCH', '/api/staf/pengaturan', { warna_tema: 'merah' });
  cetak(`  status ${asing.status}; balasan: ${asing.teks}`);
  cek(asing.status === 422, 'status 422');
  cek(/warna_tema/.test(asing.json?.galat || ''), 'pesan menyebut kunci yang ditolak');
  cek(daftarPutih.every((k) => (asing.json?.galat || '').includes(k)), 'pesan menyebut seluruh daftar kunci yang diizinkan');
  cek(asing.json?.kode === 'KUNCI_TIDAK_SAH', `kode = ${asing.json?.kode}`);
  // Campuran: kunci sah + kunci asing -> seluruh kiriman ditolak (tidak ada simpan sebagian)
  const campur = api('PATCH', '/api/staf/pengaturan', { statistik_tahun_mengawasi: '99', warna_tema: 'merah' });
  cek(campur.status === 422, `campuran kunci sah + asing -> ${campur.status} (${campur.json?.kode})`);
  const gAsing = api('GET', '/api/staf/pengaturan');
  cek(!('warna_tema' in gAsing.json.nilai) && !gAsing.teks.includes('warna_tema'), 'GET setelahnya TIDAK memuat warna_tema (tidak disimpan diam-diam)');
  cek(gAsing.json.nilai.statistik_tahun_mengawasi === nilaiAwal.statistik_tahun_mengawasi, `statistik_tahun_mengawasi tetap ${gAsing.json.nilai.statistik_tahun_mengawasi} (tidak ada simpan sebagian)`);
  const renderAsing = html('/staf/pengaturan');
  cek(!renderAsing.includes('warna_tema'), 'render /staf/pengaturan TIDAK memuat warna_tema');

  cetak('\n## Langkah 5 — tipe salah harus 422');
  const t1 = api('PATCH', '/api/staf/pengaturan', { statistik_tahun_mengawasi: 'lima belas' });
  cetak(`  {"statistik_tahun_mengawasi":"lima belas"} -> ${t1.status}: ${t1.teks}`);
  cek(t1.status === 422 && t1.json?.kode === 'TIPE_ANGKA', 'angka berisi huruf ditolak 422 TIPE_ANGKA');
  const t2 = api('PATCH', '/api/staf/pengaturan', { kontak_email: 'bukan-email' });
  cetak(`  {"kontak_email":"bukan-email"} -> ${t2.status}: ${t2.teks}`);
  cek(t2.status === 422 && t2.json?.kode === 'TIPE_EMAIL', 'email tidak sah ditolak 422 TIPE_EMAIL');
  const t3 = api('PATCH', '/api/staf/pengaturan', { statistik_provinsi_tercover: '3.5' });
  cek(t3.status === 422, `{"statistik_provinsi_tercover":"3.5"} -> ${t3.status} (${t3.json?.kode})`);
  const t4 = api('PATCH', '/api/staf/pengaturan', { visi: '' });
  cek(t4.status === 422, `{"visi":""} -> ${t4.status} (${t4.json?.kode})`);
  const t5 = api('PATCH', '/api/staf/pengaturan', []);
  cek(t5.status === 422 || t5.status === 400, `muatan bukan objek [] -> ${t5.status} (${t5.json?.kode})`);
  const akhir = api('GET', '/api/staf/pengaturan');
  cek(JSON.stringify(akhir.json.nilai) === JSON.stringify(nilaiAwal), 'nilai akhir identik dengan nilai awal (tidak ada efek samping)');
}

if (MODE === 'h') {
  const awal = api('GET', '/api/staf/pengaturan');
  const asli = awal.json.nilai.statistik_laporan_ditangani;
  const angka = (s) => Number(s).toLocaleString('id-ID');
  cetak(`\n## Uji h — statistik_laporan_ditangani awal = ${asli}`);
  const beranda0 = html('/');
  cek(beranda0.includes(`${angka(asli)}+`), `GET / publik memuat "${angka(asli)}+" sebelum diubah`);
  const baru = String(Number(asli) + 345);
  const r = api('PATCH', '/api/staf/pengaturan', { statistik_laporan_ditangani: baru });
  cek(r.status === 200, `PATCH statistik_laporan_ditangani=${baru} -> ${r.status}`);
  const beranda1 = html('/');
  const cuplik = (beranda1.match(/[^<>]{0,40}Laporan Ditangani/) || [''])[0];
  cek(beranda1.includes(`${angka(baru)}+`), `GET / publik memuat "${angka(baru)}+" TANPA deploy (cuplikan: "${cuplik}")`);
  cek(!beranda1.includes(`${angka(asli)}+`), `GET / tidak lagi memuat "${angka(asli)}+"`);
  const p = api('PATCH', '/api/staf/pengaturan', { statistik_laporan_ditangani: asli });
  cek(p.status === 200 && p.json.nilai.statistik_laporan_ditangani === asli, `pulihkan -> ${p.status}, nilai ${p.json?.nilai?.statistik_laporan_ditangani}`);
  const beranda2 = html('/');
  cek(beranda2.includes(`${angka(asli)}+`), `GET / kembali memuat "${angka(asli)}+"`);
}

cetak(`\n# HASIL: ${gagal === 0 ? 'SEMUA LULUS' : `${gagal} pemeriksaan GAGAL`}`);
process.exitCode = gagal === 0 ? 0 : 1;
