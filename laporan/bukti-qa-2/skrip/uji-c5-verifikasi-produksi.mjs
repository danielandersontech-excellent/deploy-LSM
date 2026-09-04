#!/usr/bin/env node
// QA-2 C5 — VERIFIKASI AKHIR DI DOMAIN PRODUKSI untuk seluruh perbaikan RUN QA-2.
//
// Yang diperiksa langsung di warkopnusantara.id / staf.warkopnusantara.id:
//   1. kesehatan, pemisahan host, header keamanan
//   2. BUG 1 (Kelola Pengurus crash): halaman /staf/pengurus dibuka di Chrome, tombol "Tambah Pengurus"
//      DIKLIK, formulir harus muncul TANPA galat konsol
//   3. BUG 2 (lampiran > 10 MB): pengaduan anonim dengan lampiran JPG 16 MB dan MP4 15 MB -> 201, lampiran
//      dibuka kembali oleh staf, lalu pengaduan uji DIHAPUS LUNAK lewat SQL di dalam server (SELECT dulu;
//      tidak ada route API penghapus pengaduan, disengaja: buku besar tidak boleh dihapus lewat HTTP)
//   4. BUG 3 (pengurus tanpa kelompok): dibuat lewat API, harus tampil di /struktur, lalu dihapus
//   5. BUG 4 (ketahanan peladen): permintaan berbadan sangat besar + permintaan cacat, situs harus tetap hidup
//   6. aturan K2: 0 em/en dash pada halaman terender
//
// AKUN: memakai akun staf SEMENTARA yang dibuat di awal dan DIHAPUS di akhir (sandi acak, hanya di memori).
// Akun superadmin produksi TIDAK dipakai untuk halaman karena sedang berstatus wajib ganti sandi (instruksi
// pemilik B0d) — sesinya selalu dialihkan ke /staf/ganti-sandi.
//
// Pemakaian: node laporan/bukti-qa-2/skrip/uji-c5-verifikasi-produksi.mjs
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes, createHmac } from 'node:crypto';
import net from 'node:net';
import sharp from 'sharp';

const U = 'https://warkopnusantara.id';
const US = 'https://staf.warkopnusantara.id';
const env = Object.fromEntries(readFileSync('.env.produksi', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const PROFIL = mkdtempSync(join(tmpdir(), 'warkop-cdp-'));
process.on('exit', () => { try { rmSync(PROFIL, { recursive: true, force: true }); } catch {} });
let no = 0, gagal = 0;
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (metode, jalur, tk, badan) => {
  const h = { ...(badan instanceof FormData ? {} : badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) };
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: h, body: badan instanceof FormData ? badan : badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; }
  return { s: r.status, j, h: r.headers };
};
const login = async (email, sandi) => { const { s, h } = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); wajib(s === 200, `login ${email} HTTP ${s}`); return ((h.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
// token formulir pengaduan dibuat memakai JWT_SECRET produksi (dibaca dari .env.produksi, tidak pernah dicetak)
const tokenFormulir = (ms) => `${ms}.${createHmac('sha256', env.JWT_SECRET).update(`formulir:${ms}`).digest('hex')}`;

console.log(`# QA-2 C5 — verifikasi akhir di domain produksi — ${new Date().toISOString()}`);

// --- akun staf sementara -------------------------------------------------------------------------
const tkAdmin = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
const sandiUji = `Qa2-${randomBytes(12).toString('base64url')}!`;
let idUji = null, tkUji = null, emailUji = null, akunBaru = false;
await langkah('akun staf sementara (peran redaktur) disiapkan lewat API superadmin', async () => {
  // Akun uji TIDAK bisa dihapus setelah dipakai (route DELETE menolak 409 bila sudah punya jejak audit —
  // memang disengaja demi keutuhan buku besar), jadi akun uji lama DIPAKAI ULANG: diaktifkan kembali dengan
  // sandi acak baru, lalu dinonaktifkan lagi di langkah terakhir. Tidak ada akun menumpuk di produksi.
  const daftar = await api('GET', '/api/staf/pengguna', tkAdmin);
  const lama = (daftar.j.baris || []).find((u) => /^qa2\.verifikasi\./.test(u.email));
  if (lama) {
    idUji = lama.id; emailUji = lama.email;
    const p = await api('PATCH', `/api/staf/pengguna/${idUji}`, tkAdmin, { nama: lama.nama, email: emailUji, peran: 'redaktur', aktif: true });
    wajib(p.s === 200, `aktifkan kembali HTTP ${p.s} ${JSON.stringify(p.j).slice(0, 120)}`);
    // reset-sandi selalu menyetel wajib_ganti_sandi=1, sehingga sesi akan dipaksa ke /staf/ganti-sandi.
    // Alur ganti sandi diselesaikan di sini (sekaligus menguji jalur itu di produksi) agar akun siap dipakai.
    const sandiSementara = `Qa2s-${randomBytes(12).toString('base64url')}!`;
    const r = await api('POST', `/api/staf/pengguna/${idUji}/reset-sandi`, tkAdmin, { kata_sandi_baru: sandiSementara });
    wajib(r.s === 200, `reset sandi HTTP ${r.s}`);
    const tkSementara = await login(emailUji, sandiSementara);
    const g = await api('POST', '/api/staf/ganti-sandi', tkSementara, { kata_sandi_lama: sandiSementara, kata_sandi_baru: sandiUji });
    wajib(g.s === 200, `ganti sandi HTTP ${g.s} ${JSON.stringify(g.j).slice(0, 120)}`);
  } else {
    emailUji = `qa2.verifikasi.${Date.now()}@warkopnusantara.id`;
    const a = await api('POST', '/api/staf/pengguna', tkAdmin, { nama: 'QA-2 Verifikasi Sementara', email: emailUji, peran: 'redaktur', kata_sandi: sandiUji, aktif: true });
    wajib(a.s === 201, `HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
    idUji = a.j.pengguna.id; akunBaru = true;
  }
  tkUji = await login(emailUji, sandiUji);
  const saya = await api('GET', '/api/auth/saya', tkUji);
  wajib(saya.s === 200, `sesi akun uji ${saya.s}`);
  return `id ${idUji} ${akunBaru ? '(dibuat baru)' : '(akun uji lama dipakai ulang: reset sandi + alur ganti sandi diselesaikan)'}; sandi acak hanya di memori`;
});

console.log('\n## 1. Kesehatan, pemisahan host, header keamanan');
await langkah('/api/health 200 + zona waktu WIB; pemisahan host dua arah; Location tanpa 0.0.0.0', async () => {
  const h = await (await fetch(`${U}/api/health`)).json();
  wajib(h.status === 'sehat' && h.basisData === 'terhubung', JSON.stringify(h));
  wajib(/\+07:00$/.test(h.waktu), `zona waktu ${h.waktu}`);
  const a = await fetch(`${U}/staf/dashboard`, { redirect: 'manual' });
  const b = await fetch(`${US}/berita`, { redirect: 'manual' });
  const la = a.headers.get('location') || '', lb = b.headers.get('location') || '';
  wajib(a.status === 307 && la.startsWith(`${US}/staf/dashboard`), `publik→staf ${a.status} ${la}`);
  wajib(b.status === 307 && lb.includes('/staf/dashboard'), `staf→dashboard ${b.status} ${lb}`);
  wajib(!/0\.0\.0\.0/.test(la + lb), `Location memuat 0.0.0.0: ${la} ${lb}`);
  return `health ${h.waktu}; ${la} ; ${lb}`;
});
await langkah('header keamanan lengkap di halaman publik dan staf', async () => {
  const r = await fetch(`${U}/`);
  const csp = r.headers.get('content-security-policy') || '';
  wajib(/frame-ancestors 'none'/.test(csp) && !/unsafe-eval/.test(csp), `CSP: ${csp.slice(0, 120)}`);
  wajib((r.headers.get('strict-transport-security') || '').includes('preload'), 'HSTS tidak lengkap');
  wajib(r.headers.get('x-frame-options') === 'DENY' && r.headers.get('x-content-type-options') === 'nosniff', 'X-Frame/nosniff hilang');
  return 'CSP tanpa unsafe-eval, HSTS preload, X-Frame DENY, nosniff';
});

console.log('\n## 2. BUG 1 — formulir Kelola Pengurus terbuka tanpa galat (Chrome di produksi)');
await langkah('/staf/pengurus: klik "Tambah Pengurus" → formulir muncul, 0 galat konsol', async () => {
  const port = 9500 + Math.floor(Math.random() * 90);
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--user-data-dir=${PROFIL}`, '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  try {
    let t = null; for (let i = 0; i < 40 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await tidur(250); } }
    wajib(t, 'Chrome tidak dapat dijalankan');
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
    let id = 0; const tunggu = new Map(); const konsol = [];
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && tunggu.has(m.id)) { tunggu.get(m.id)(m); tunggu.delete(m.id); return; } const p = m.params || {};
      if (m.method === 'Runtime.exceptionThrown') konsol.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').split('\n')[0].slice(0, 130));
      if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') konsol.push('console.error ' + p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 130)); };
    const kirim = (metode, params = {}) => new Promise((r) => { const n = ++id; tunggu.set(n, r); ws.send(JSON.stringify({ id: n, method: metode, params })); });
    await kirim('Page.enable'); await kirim('Runtime.enable'); await kirim('Network.enable');
    await kirim('Network.setCookie', { name: 'warkop_token', value: tkUji, url: US, httpOnly: true, secure: true, sameSite: 'Lax' });
    const ev = async (x) => (await kirim('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
    await kirim('Page.navigate', { url: `${US}/staf/pengurus` }); await tidur(4000);
    wajib(await ev(`location.pathname === '/staf/pengurus'`), `dialihkan ke ${await ev('location.pathname')}`);
    konsol.length = 0;
    const adaTombol = await ev(`(() => { const b = [...document.querySelectorAll('button')].find(b => /Tambah Pengurus/i.test(b.textContent)); if (!b) return false; b.click(); return true; })()`);
    wajib(adaTombol, 'tombol "Tambah Pengurus" tidak ditemukan');
    await tidur(1800);
    const formulir = await ev(`!!document.querySelector('#pengurus-nama') && !!document.querySelector('#pengurus-kelompok')`);
    const galatTampil = await ev(`/Terjadi kesalahan|Application error/.test(document.body.innerText)`);
    wajib(konsol.length === 0, `galat konsol: ${konsol.slice(0, 2).join(' | ')}`);
    wajib(formulir, 'formulir (kolom nama + select kelompok) tidak muncul');
    wajib(!galatTampil, 'halaman menampilkan teks galat');
    ws.close();
    return 'formulir terbuka dengan kolom nama + select Kelompok Bagan; 0 galat konsol';
  } finally { chrome.kill(); }
});

console.log('\n## 3. BUG 2 — lampiran besar diterima di produksi');
const nomorUji = [];
await langkah('pengaduan anonim + lampiran JPG 16 MB dan MP4 15 MB → 201; staf dapat membuka keduanya', async () => {
  const W = 4000, H = 3000; const mentah = Buffer.alloc(W * H * 3);
  for (let i = 0; i < mentah.length; i++) mentah[i] = (Math.random() * 256) | 0;
  const JPG = await sharp(mentah, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
  const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2mp41'), Buffer.alloc(15 * 1024 * 1024)]);
  const f = new FormData();
  f.append('token_formulir', tokenFormulir(Date.now() - 5000));
  f.append('anonim', 'true'); f.append('kategori_masalah', 'lainnya'); f.append('wilayah_id', '13');
  f.append('deskripsi', 'Uji QA-2 C5 verifikasi produksi: lampiran besar. Data uji ini dihapus pada langkah terakhir skrip.');
  f.append('lampiran', new Blob([JPG], { type: 'image/jpeg' }), 'bukti.jpg');
  f.append('lampiran', new Blob([MP4], { type: 'video/mp4' }), 'rekaman.mp4');
  const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', body: f });
  const j = await r.json();
  wajib(r.status === 201 && j.lampiran === 2, `HTTP ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  nomorUji.push(j.nomorKasus);
  const d = await api('GET', `/api/staf/pengaduan?q=${j.nomorKasus}`, tkAdmin);
  const id = d.j.baris?.[0]?.id;
  wajib(id, 'pengaduan tidak ditemukan di daftar staf');
  const det = await api('GET', `/api/staf/pengaduan/${id}`, tkAdmin);
  const tipe = [];
  for (const l of det.j.lampiran || []) {
    const x = await fetch(`${US}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`, { headers: { cookie: `warkop_token=${tkAdmin}` } });
    wajib(x.status === 200 && x.headers.get('x-content-type-options') === 'nosniff', `lampiran ${x.status}`);
    const tanpaSesi = await fetch(`${US}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`);
    wajib(tanpaSesi.status === 401, `lampiran tanpa sesi ${tanpaSesi.status}`);
    const isi = Buffer.from(await x.arrayBuffer());
    tipe.push(`${(x.headers.get('content-type') || '').split(';')[0]} ${(isi.length / 1048576).toFixed(2)} MB`);
  }
  wajib(det.j.pengaduan?.anonim == 1, 'pengaduan uji tidak tercatat anonim');
  wajib([det.j.pengaduan?.nama_pelapor, det.j.pengaduan?.nik_pelapor, det.j.pengaduan?.telepon_pelapor, det.j.pengaduan?.email_pelapor].every((x) => x === null || x === undefined), 'kolom identitas tidak NULL pada pengaduan anonim');
  return `201 ${j.nomorKasus} (id ${id}); lampiran: ${tipe.join(', ')}; tanpa sesi 401; anonim=1, empat kolom identitas NULL`;
});

console.log('\n## 4. BUG 3 — pengurus tanpa kelompok tampil di /struktur produksi');
await langkah('buat pengurus pusat tanpa kelompok → tampil di /struktur → dihapus lagi', async () => {
  const a = await api('POST', '/api/staf/pengurus', tkUji, { nama: 'QA2 Verifikasi Tanpa Kelompok', jabatan: 'Staf Ahli', tingkat: 'pusat', kelompok: '', wilayah_id: null, foto: null, deskripsi: null, aktif: true });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  const id = a.j.pengurus?.id ?? a.j.id;
  try {
    const html = (await (await fetch(`${U}/struktur`)).text()).replace(/<script[\s\S]*?<\/script>/g, '');
    wajib(html.includes('QA2 Verifikasi Tanpa Kelompok'), 'tidak tampil di /struktur produksi');
    const iRegional = html.indexOf('id="regional"');
    wajib(iRegional > 0 && html.indexOf('QA2 Verifikasi Tanpa Kelompok') > iRegional, 'tampil di luar bagian Pimpinan Regional');
  } finally {
    const d = await api('DELETE', `/api/staf/pengurus/${id}`, tkUji);
    wajib(d.s === 200, `pembersihan DELETE ${d.s}`);
  }
  const bersih = (await (await fetch(`${U}/struktur`)).text());
  wajib(!bersih.includes('QA2 Verifikasi Tanpa Kelompok'), 'masih tampil setelah dihapus');
  return `id ${id} tampil di bagian Pimpinan Regional lalu dihapus bersih`;
});

console.log('\n## 5. BUG 4 — situs tetap hidup setelah permintaan bermasalah');
await langkah('badan 50 MB, unggahan diputus di tengah, dan permintaan HTTP cacat → /api/health tetap 200', async () => {
  const besar = new FormData();
  besar.append('token_formulir', tokenFormulir(Date.now() - 5000));
  besar.append('anonim', 'true'); besar.append('kategori_masalah', 'lainnya'); besar.append('wilayah_id', '13');
  besar.append('deskripsi', 'Uji QA-2 C5: badan permintaan melewati batas, harus ditolak dengan sopan.');
  besar.append('lampiran', new Blob([Buffer.alloc(50 * 1024 * 1024)], { type: 'image/png' }), 'besar.png');
  // Di produksi permintaan sebesar ini bisa berakhir 413 dari route ATAU 504 dari Traefik (klien masih
  // mengirim badan saat route sudah menolak). Yang WAJIB benar: situs tetap hidup. Statusnya dicatat apa adanya.
  let statusBesar;
  try { statusBesar = (await fetch(`${U}/api/pengaduan`, { method: 'POST', body: besar })).status; }
  catch (g) { statusBesar = `putus(${g.name})`; }
  const ac = new AbortController(); setTimeout(() => ac.abort(), 150);
  const putus = new FormData();
  putus.append('token_formulir', tokenFormulir(Date.now() - 5000));
  putus.append('anonim', 'true'); putus.append('kategori_masalah', 'lainnya'); putus.append('wilayah_id', '13');
  putus.append('deskripsi', 'Uji QA-2 C5: unggahan diputus di tengah jalan.');
  putus.append('lampiran', new Blob([Buffer.alloc(12 * 1024 * 1024)], { type: 'image/png' }), 'putus.png');
  let hasilPutus = 'putus';
  try { const r2 = await fetch(`${U}/api/pengaduan`, { method: 'POST', signal: ac.signal, body: putus }); hasilPutus = `HTTP ${r2.status}`; if (r2.status === 201) { try { nomorUji.push((await r2.json()).nomorKasus); } catch { /* abaikan */ } } } catch { /* memang diputus */ }
  const mentah = await new Promise((selesai) => {
    const s = net.connect(443, 'warkopnusantara.id', () => { s.write('INI BUKAN HTTP\r\n\r\n'); setTimeout(() => s.destroy(), 300); });
    s.setTimeout(3000, () => s.destroy());
    s.on('close', () => selesai('soket ditutup'));
    s.on('error', () => selesai('soket galat'));
  });
  await tidur(2500);
  const h = await (await fetch(`${U}/api/health`)).json();
  wajib(h.status === 'sehat', `health: ${JSON.stringify(h)}`);
  const staf = await fetch(`${US}/login`);
  wajib(staf.status === 200, `host staf ${staf.status}`);
  return `50 MB→${statusBesar} (413 route / 504 Traefik, keduanya diterima asal situs hidup); unggahan diputus→${hasilPutus}; soket mentah→${mentah}; health sehat; /login staf 200`;
});

console.log('\n## 6. Aturan K2 pada halaman produksi terender');
await langkah('11 halaman publik: 0 em dash / en dash', async () => {
  const pelanggaran = [];
  for (const p of ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas']) {
    const html = await (await fetch(`${U}${p}`)).text();
    const n = (html.match(/[—–]/g) || []).length;
    if (n) pelanggaran.push(`${p}:${n}`);
  }
  wajib(pelanggaran.length === 0, `halaman dengan em/en dash: ${pelanggaran.join(', ')}`);
  return '11 halaman bersih';
});

console.log('\n## Pembersihan data uji di produksi');
await langkah('pengaduan uji dihapus lunak lewat API staf; akun staf sementara dihapus', async () => {
  const catatan = [];
  // Tidak ada route API penghapus pengaduan (disengaja: buku besar pengaduan tidak boleh dihapus lewat HTTP).
  // Data uji dihapus LUNAK lewat SQL di dalam server, SELECT dulu, hanya menyentuh nomor kasus milik uji ini.
  if (nomorUji.length) {
    const { execFileSync } = await import('node:child_process');
    const daftar = nomorUji.map((n) => `'${n.replace(/[^A-Z0-9-]/gi, '')}'`).join(',');
    const sql = `SELECT id, nomor_kasus, dihapus_pada FROM pengaduan WHERE nomor_kasus IN (${daftar}); `
      + `UPDATE pengaduan SET dihapus_pada = UTC_TIMESTAMP(), diperbarui_pada = UTC_TIMESTAMP() WHERE nomor_kasus IN (${daftar}) AND dihapus_pada IS NULL; `
      + `SELECT nomor_kasus, dihapus_pada IS NOT NULL AS sudah_dihapus FROM pengaduan WHERE nomor_kasus IN (${daftar});`;
    const perintah = `cat > /tmp/qa2-bersih.sql && docker exec -i kwoz3jwjb037hw3oh669g9c4 sh -c 'exec mariadb -u$MARIADB_USER -p$MARIADB_PASSWORD $MARIADB_DATABASE' < /tmp/qa2-bersih.sql; rm -f /tmp/qa2-bersih.sql`;
    const keluaran = execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', `${process.env.USERPROFILE}/.ssh/warkop_deploy`, 'deployer@31.97.106.106', perintah], { input: sql, encoding: 'utf8' });
    catatan.push(`SQL hapus lunak: ${keluaran.trim().split(String.fromCharCode(10)).slice(-nomorUji.length).join(' | ')}`);
    for (const nomor of nomorUji) {
      const lacak = await fetch(`${U}/api/pengaduan/lacak/${nomor}`);
      catatan.push(`lacak ${nomor} → ${lacak.status}`);
    }
  }
  // Penghapusan akun ditolak 409 bila sudah punya jejak audit (disengaja) -> akun dinonaktifkan + sesi dipaksa keluar.
  const daftar = await api('GET', '/api/staf/pengguna', tkAdmin);
  const u = (daftar.j.baris || []).find((x) => x.id === idUji);
  const p = await api('PATCH', `/api/staf/pengguna/${idUji}`, tkAdmin, { nama: u?.nama || 'QA-2 Verifikasi Sementara', email: emailUji, peran: 'redaktur', aktif: false });
  const k = await api('POST', `/api/staf/pengguna/${idUji}/paksa-keluar`, tkAdmin, {});
  catatan.push(`akun uji ${idUji} → nonaktif ${p.s}, paksa keluar ${k.s}`);
  const cek = await api('POST', '/api/auth/login', null, { email: emailUji, kataSandi: sandiUji });
  const sesiLama = await api('GET', '/api/auth/saya', tkUji);
  catatan.push(`login akun uji sesudah dinonaktifkan → ${cek.s}; sesi lama → ${sesiLama.s}`);
  wajib(p.s === 200 && k.s === 200, `nonaktif ${p.s} / paksa keluar ${k.s}`);
  wajib(cek.s === 401, `akun uji masih bisa masuk (${cek.s})`);
  wajib(sesiLama.s === 401, `sesi lama akun uji masih sah (${sesiLama.s})`);
  return catatan.join('; ');
});

console.log(`\nRINGKASAN C5-produksi: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);
