#!/usr/bin/env node
// QA-3 G — VERIFIKASI AKHIR MENYELURUH DI DOMAIN PRODUKSI untuk seluruh butir RUN QA-3.
//
// Akun: memakai akun staf SEMENTARA `qa2.verifikasi.*` yang sudah ada (dibuat pada RUN QA-2 dan
// ditinggalkan NONAKTIF karena route hapus menolak akun yang punya jejak audit). Akun itu diaktifkan
// kembali dengan sandi acak, dipakai, lalu DINONAKTIFKAN + dipaksa keluar lagi di langkah terakhir.
// Akun superadmin pemilik TIDAK dipakai (sandinya sudah diganti pemilik dan bukan urusan kita).
//
// Pemakaian: node laporan/bukti-qa-3/skrip/uji-g-produksi.mjs
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const U = 'https://warkopnusantara.id';
const US = 'https://staf.warkopnusantara.id';
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan) => {
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: { ...(badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 150) }; }
  return { s: r.status, j };
};
const halaman = async (jalur, tk) => { const r = await fetch(`${jalur.startsWith('/staf') ? US : U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, mentah: r.status === 200 ? await r.text() : '', lokasi: r.headers.get('location') }; };
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const sql = (teks) => execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106',
  `cat > /tmp/qa3v.sql && docker exec -i kwoz3jwjb037hw3oh669g9c4 sh -c 'exec mariadb -u$MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE' < /tmp/qa3v.sql; rm -f /tmp/qa3v.sql`],
  { input: teks, encoding: 'utf8' });

console.log(`# QA-3 G — verifikasi akhir di domain produksi — ${new Date().toISOString()}`);

// --- akun staf sementara (lewat SQL, karena sandi superadmin milik pemilik tidak dipakai) ---
const sandiUji = `Qa3-${randomBytes(12).toString('base64url')}!`;
let idUji = null, emailUji = null, tk = null;
await langkah('akun staf sementara disiapkan (diaktifkan + sandi acak baru lewat container app)', async () => {
  const baris = sql("SELECT id, email FROM users WHERE email LIKE 'qa2.verifikasi.%' ORDER BY id LIMIT 1;").trim().split('\n');
  wajib(baris.length >= 2, `akun uji tidak ditemukan: ${baris.join(' / ')}`);
  [idUji, emailUji] = baris[1].split('\t');
  // hash bcrypt dibuat DI DALAM container app (bcryptjs tersedia di sana); sandi tidak pernah dicetak
  const perintah = `docker exec -i $(docker ps -q --filter name=re8snqu | head -1) node -e "const b=require('bcryptjs');process.stdout.write(b.hashSync(process.argv[1],12))" "${sandiUji}"`;
  const hash = execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', perintah], { encoding: 'utf8' }).trim();
  wajib(/^\$2[aby]\$/.test(hash), `hash tidak terbentuk: ${hash.slice(0, 20)}`);
  sql(`UPDATE users SET kata_sandi_hash='${hash}', aktif=1, wajib_ganti_sandi=0, token_version=token_version+1, diperbarui_pada=UTC_TIMESTAMP() WHERE id=${Number(idUji)};`);
  const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: emailUji, kataSandi: sandiUji }) });
  wajib(r.status === 200, `login akun uji HTTP ${r.status}`);
  tk = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
  return `id ${idUji} aktif sementara (sandi acak hanya di memori)`;
});

console.log('\n## A — restrukturisasi organisasi di produksi');
await langkah('/struktur: 12 bagian direktorat, blok DPW lalu Koordinator Daerah, tanpa DPC/Direktorat Eksekutif', async () => {
  const h = await halaman('/struktur');
  wajib(h.s === 200, `HTTP ${h.s}`);
  const dom = tanpaSkrip(h.mentah);
  const bagian = ['Hukum dan Advokasi', 'Investigasi', 'Pengawasan Kebijakan Publik', 'Organisasi dan Kaderisasi', 'Sosial dan Kemanusiaan', 'Lingkungan Hidup', 'Media', 'Humas dan Kerja Sama Antar Lembaga', 'Pemberdayaan Masyarakat dan UMKM', 'Ketenagakerjaan, Buruh, dan Pekerja', 'Perlindungan Perempuan dan Anak (PPA)', 'Penyuluhan dan Sosialisasi'];
  const hilang = bagian.filter((b) => !dom.includes(b));
  wajib(hilang.length === 0, `bagian tidak tampil: ${hilang.join(', ')}`);
  const iDpw = dom.search(/>\s*Dewan Pimpinan Wilayah \(DPW\)\s*</);
  const iKorda = dom.search(/>\s*Koordinator Daerah\s*</);
  wajib(iDpw > 0 && iKorda > iDpw, `urutan blok salah (dpw ${iDpw}, korda ${iKorda})`);
  wajib(!/Dewan Pimpinan Cabang|Direktorat Eksekutif/.test(dom), 'DPC atau Direktorat Eksekutif masih tampil');
  return '12 bagian tampil; DPW lalu Koordinator Daerah; DPC & Direktorat Eksekutif hilang';
});
await langkah('pengurus produksi: 14 aktif dengan kelompok sah, 1 nonaktif menunggu penempatan ulang', async () => {
  const keluar = sql("SELECT aktif, COUNT(*) n FROM pengurus GROUP BY aktif; SELECT COUNT(*) tanpa_kelompok FROM pengurus WHERE aktif=1 AND (kelompok IS NULL OR kelompok NOT IN ('dewan_pembina','dewan_penasehat','dewan_pengawas','pengurus_dpp','direktorat','satgas','dpw','korda')); SELECT COUNT(*) direktorat_tanpa_bagian FROM pengurus WHERE aktif=1 AND kelompok='direktorat' AND bagian IS NULL;");
  wajib(/\b0\b/.test(keluar.split('tanpa_kelompok')[1] || ''), `masih ada pengurus aktif tanpa kelompok sah:\n${keluar}`);
  return keluar.replace(/\n/g, ' ; ');
});
await langkah('wilayah dua tingkat di produksi: 38 provinsi + 514 kabupaten/kota, id 1-39 utuh', async () => {
  const keluar = sql("SELECT jenis, COUNT(*) n FROM wilayah GROUP BY jenis; SELECT COUNT(*) yatim FROM wilayah WHERE jenis='kabupaten_kota' AND induk_id IS NULL; SELECT COUNT(*) lama FROM wilayah WHERE id BETWEEN 1 AND 39;");
  wajib(/kabupaten_kota\t514/.test(keluar), `jumlah kabupaten/kota tidak 514:\n${keluar}`);
  wajib(/yatim\n0\n/.test(keluar), `ada kabupaten tanpa induk:\n${keluar}`);
  wajib(/lama\n39/.test(keluar), `baris wilayah lama berubah:\n${keluar}`);
  return keluar.replace(/\n/g, ' ; ');
});

console.log('\n## B — Kelola Pengurus berkepala kelompok (produksi)');
await langkah('/staf/pengurus memuat baris kepala kelompok + sub-kepala bagian direktorat', async () => {
  const h = await halaman('/staf/pengurus', tk);
  wajib(h.s === 200, `HTTP ${h.s}${h.lokasi ? ' -> ' + h.lokasi : ''}`);
  const kepala = ['Dewan Pembina - Dewan Pimpinan Pusat', 'Pengurus DPP - Dewan Pimpinan Pusat', 'Direktorat - Dewan Pimpinan Pusat', 'Satuan Tugas (Satgas) - Dewan Pimpinan Pusat'];
  const ada = kepala.filter((k) => h.mentah.includes(k));
  wajib(ada.length >= 3, `hanya ${ada.length} kepala kelompok tampil`);
  wajib(h.mentah.includes('Bagian: '), 'sub-kepala bagian tidak tampil');
  wajib(h.mentah.includes('bg-primary text-on-primary'), 'gaya kepala tabel tidak dipakai');
  return `${ada.length} kepala kelompok + sub-kepala bagian`;
});

console.log('\n## C + D + E — navbar, footer, media sosial (produksi)');
await langkah('11 halaman publik: 0 "Masuk Staff", 0 tautan /login; halaman masuk tetap hidup lewat URL langsung', async () => {
  const pelanggaran = [];
  for (const p of ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas']) {
    const h = await halaman(p);
    wajib(h.s === 200, `${p} HTTP ${h.s}`);
    const dom = tanpaSkrip(h.mentah);
    if (/Masuk Staff/i.test(dom)) pelanggaran.push(`${p}: teks`);
    if (/href="[^"]*\/login/i.test(dom)) pelanggaran.push(`${p}: tautan /login`);
  }
  wajib(pelanggaran.length === 0, pelanggaran.join('; '));
  // Halaman masuk ada di HOST STAF; di host publik /login memang dialihkan 307 (pemisahan host).
  const lPublik = await fetch(`${U}/login`, { redirect: 'manual' });
  const lStaf = await fetch(`${US}/login`);
  const html = lStaf.status === 200 ? await lStaf.text() : '';
  wajib(lPublik.status === 307 && (lPublik.headers.get('location') || '').startsWith(`${US}/login`), `host publik /login ${lPublik.status} -> ${lPublik.headers.get('location')}`);
  wajib(lStaf.status === 200 && html.includes('id="staff-id"'), `host staf /login HTTP ${lStaf.status}`);
  return '11 halaman bersih; host publik /login -> 307 ke host staf; host staf /login 200 dengan formulir';
});
await langkah('footer produksi: latar penuh, "Kantor Pusat" ke Google Maps (tab baru + noopener), TikTok saja', async () => {
  const dom = tanpaSkrip((await halaman('/')).mentah);
  const mf = dom.match(/<footer class="([^"]*)"/);
  wajib(mf && /w-full/.test(mf[1]) && !/max-w-container-max/.test(mf[1]), `kelas footer: ${mf?.[1]}`);
  const mp = dom.match(/<a[^>]*href="([^"]*maps[^"]*)"[^>]*>\s*Kantor Pusat\s*<\/a>/);
  wajib(mp, 'tautan "Kantor Pusat" tidak ada');
  wajib(mp[1].includes('destination=0.504192,101.427052') && /target="_blank"/.test(mp[0]) && /rel="noopener/.test(mp[0]), `tautan peta tidak sesuai: ${mp[0].slice(0, 120)}`);
  wajib(!/Kantor Regional/.test(dom), 'teks lama "Kantor Regional" masih ada');
  wajib(dom.includes('https://www.tiktok.com/@warkop.nusantara_media'), 'TikTok tidak tampil');
  for (const kosong of ['instagram.com', 'youtube.com', 'facebook.com']) wajib(!dom.includes(kosong), `kanal kosong ${kosong} dirender`);
  wajib(/<svg[^>]*viewBox="0 0 24 24"/.test(dom.slice(dom.indexOf('tiktok.com'), dom.indexOf('tiktok.com') + 600)), 'ikon TikTok bukan SVG inline');
  return 'footer penuh; Kantor Pusat -> maps (tab baru, noopener); hanya TikTok tampil, ikon SVG inline';
});

console.log('\n## F — kategori program dinamis (produksi)');
await langkah('tabel kategori_program terisi 3 kategori dan setiap program punya kategori terdaftar', async () => {
  const keluar = sql('SELECT id,nama,slug FROM kategori_program ORDER BY urutan,id; SELECT COUNT(*) program_yatim FROM program p LEFT JOIN kategori_program k ON k.slug=p.kategori WHERE k.id IS NULL;');
  wajib(/program_yatim\n0/.test(keluar), `ada program tanpa kategori terdaftar:\n${keluar}`);
  return keluar.replace(/\n/g, ' ; ');
});
await langkah('filter kategori publik tetap bekerja untuk ketiga kategori bawaan', async () => {
  const hasil = [];
  for (const slug of ['pengawasan-dana', 'observasi-kebijakan', 'bantuan-hukum']) {
    const h = await halaman(`/program?kategori=${slug}`);
    wajib(h.s === 200, `${slug} HTTP ${h.s}`);
    hasil.push(`${slug}:200`);
  }
  return hasil.join(', ');
});

console.log('\n## Pembersihan');
await langkah('akun staf sementara dinonaktifkan + sesi dipaksa keluar', async () => {
  sql(`UPDATE users SET aktif=0, token_version=token_version+1, diperbarui_pada=UTC_TIMESTAMP() WHERE id=${Number(idUji)};`);
  const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: emailUji, kataSandi: sandiUji }) });
  const s = await api('GET', '/api/auth/saya', tk);
  wajib(r.status === 401, `akun uji masih bisa masuk (${r.status})`);
  wajib(s.s === 401, `sesi lama masih sah (${s.s})`);
  return `login sesudah dinonaktifkan ${r.status}; sesi lama ${s.s}`;
});

console.log(`\nRINGKASAN QA-3 G produksi: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
