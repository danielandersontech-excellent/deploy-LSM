// UJI f (identitas), g (wilayah), i (injeksi aktif) — dengan DB_LOG_KUERI=1: SQL yang BENAR-BENAR dijalankan tercetak.
import 'dotenv/config';
process.env.DB_LOG_KUERI = '1';
const { tutupPool } = await import('../../../lib/db/index.js');
const { ambilPengaduan, daftarPengaduan, ambilPengaduanByNomor, ambilIdByNomor } = await import('../../../lib/db/pengaduan.js');
const { ambilArtikelStaf, ambilArtikelTerbit, ambilArtikelBySlug } = await import('../../../lib/db/artikel.js');
const { cariUserByEmail } = await import('../../../lib/db/users.js');
const { hitungStatistikDashboard } = await import('../../../lib/db/statistik.js');

const IDENTITAS = ['nama_pelapor', 'nik_pelapor', 'telepon_pelapor', 'email_pelapor'];
const logSql = [];
const asli = console.log;
console.log = (...a) => { if (a[0] === '[SQL]') logSql.push(a.slice(1).join(' ')); asli(...a); };
const bersihkan = () => logSql.splice(0);
const adaIdentitasDiSql = () => logSql.some((s) => IDENTITAS.some((k) => s.includes(k)));

const p = await ambilIdByNomor('WRP-009018'); // pengaduan bernama

asli('\n===== UJI f.1: ambilPengaduan(id, {bolehLihatIdentitas: false}) =====');
bersihkan();
const tanpa = await ambilPengaduan(p.id, { bolehLihatIdentitas: false });
asli('kolom hasil:', Object.keys(tanpa).join(', '));
asli('identitas di SQL yang dijalankan?', adaIdentitasDiSql() ? 'YA (CACAT)' : 'TIDAK');
asli('identitas di objek hasil?', IDENTITAS.some((k) => k in tanpa) ? 'YA (CACAT)' : 'TIDAK');
const f1 = !adaIdentitasDiSql() && !IDENTITAS.some((k) => k in tanpa);

asli('\n===== UJI f.2: daftarPengaduan({bolehLihatIdentitas: false}) =====');
bersihkan();
const daftar = await daftarPengaduan({ bolehLihatIdentitas: false, perHalaman: 5 });
asli('baris:', daftar.baris.length, '| kolom baris pertama:', Object.keys(daftar.baris[0]).join(', '));
asli('identitas di SQL yang dijalankan?', adaIdentitasDiSql() ? 'YA (CACAT)' : 'TIDAK');
const f2 = !adaIdentitasDiSql();

asli('\n===== UJI f.3: ambilPengaduanByNomor() (pelacakan publik) =====');
bersihkan();
const lacak = await ambilPengaduanByNomor('WRP-009018');
asli('kolom hasil:', Object.keys(lacak).join(', '), '| riwayat:', lacak.riwayat.length);
asli('identitas di SQL yang dijalankan?', adaIdentitasDiSql() ? 'YA (CACAT)' : 'TIDAK');
const f3 = !adaIdentitasDiSql();

asli('\n===== UJI f.4 (pembanding): ambilPengaduan(id, {bolehLihatIdentitas: true}) — superadmin/verifikator =====');
bersihkan();
const dengan = await ambilPengaduan(p.id, { bolehLihatIdentitas: true });
asli('kolom hasil:', Object.keys(dengan).join(', '));
asli('identitas di SQL?', adaIdentitasDiSql() ? 'YA (benar, hanya untuk peran berhak)' : 'TIDAK');
asli('nama_pelapor terisi?', dengan.nama_pelapor ? 'ya (nilai tidak dicetak)' : 'tidak');

asli('\n===== UJI g.1: daftarPengaduan({wilayahId}) — pimpinan_wilayah Sumatera Utara (kode 12) =====');
const { ambilWilayahByKode } = await import('../../../lib/db/wilayah.js');
const sumut = await ambilWilayahByKode('12');
const jabar = await ambilWilayahByKode('32');
bersihkan();
const g1 = await daftarPengaduan({ wilayahId: sumut.id, bolehLihatIdentitas: false });
asli('WHERE memuat p.wilayah_id = ? :', logSql.some((s) => /WHERE .*p\.wilayah_id = \?/.test(s)) ? 'YA' : 'TIDAK (CACAT)', '| total pengaduan Sumut =', g1.total, '(seed: 0)');
bersihkan();
const g1b = await daftarPengaduan({ wilayahId: jabar.id, bolehLihatIdentitas: false });
asli('WHERE memuat p.wilayah_id = ? :', logSql.some((s) => /WHERE .*p\.wilayah_id = \?/.test(s)) ? 'YA' : 'TIDAK (CACAT)', '| total pengaduan Jabar =', g1b.total, '(seed: 1)');
const gA = g1.total === 0 && g1b.total === 1;

asli('\n===== UJI g.2: ambilArtikelStaf({peran: pimpinan_wilayah, wilayahId}) =====');
bersihkan();
const g2 = await ambilArtikelStaf({ peran: 'pimpinan_wilayah', userId: 6, wilayahId: jabar.id });
asli('WHERE memuat a.wilayah_id = ? :', logSql.some((s) => /WHERE .*a\.wilayah_id = \?/.test(s)) ? 'YA' : 'TIDAK (CACAT)', '| artikel Jabar =', g2.total, '(seed: 3)');
bersihkan();
const g3 = await ambilArtikelStaf({ peran: 'penulis', userId: 2 });
asli('penulis: WHERE memuat a.penulis_id = ? :', logSql.some((s) => /WHERE .*a\.penulis_id = \?/.test(s)) ? 'YA' : 'TIDAK (CACAT)', '| artikel milik Budi =', g3.total, '(seed: 5)');
bersihkan();
const g4 = await hitungStatistikDashboard({ peran: 'pimpinan_wilayah', wilayahId: jabar.id });
asli('statistik pimpinan_wilayah: WHERE wilayah_id di SQL?', logSql.every((s) => /wilayah_id = \?/.test(s)) ? 'YA (kedua kueri)' : 'TIDAK (CACAT)', JSON.stringify(g4));
const gB = g2.total === 3 && g3.total === 5;

asli('\n===== UJI i (aktif): masukan injeksi =====');
const INJEKSI = "' OR '1'='1";
bersihkan();
const i1 = await ambilArtikelTerbit({ q: INJEKSI });
asli(`ambilArtikelTerbit({q: "${INJEKSI}"}) -> total`, i1.total, '(harus 0: dicari sebagai teks harfiah)');
const i2 = await ambilArtikelBySlug(INJEKSI);
asli(`ambilArtikelBySlug("${INJEKSI}") ->`, i2 === null ? 'null' : 'BARIS (CACAT)');
const i3 = await ambilPengaduanByNomor(INJEKSI);
asli(`ambilPengaduanByNomor("${INJEKSI}") ->`, i3 === null ? 'null' : 'BARIS (CACAT)');
const i4 = await cariUserByEmail(`admin@warkopnusantara.id' OR '1'='1`);
asli(`cariUserByEmail("admin@...' OR '1'='1") ->`, i4 === null ? 'null' : 'BARIS (CACAT)');
const i5 = await daftarPengaduan({ status: "baru' OR 1=1 --", bolehLihatIdentitas: false });
asli(`daftarPengaduan({status: "baru' OR 1=1 --"}) -> total`, i5.total, '(harus 0)');
const i6 = await ambilArtikelTerbit({ halaman: "1; DROP TABLE artikel; --", perHalaman: '9; DROP TABLE artikel' });
asli(`ambilArtikelTerbit({halaman: "1; DROP TABLE artikel; --"}) -> halaman`, i6.halaman, 'perHalaman', i6.perHalaman, '(dipaksa angka)');
const lulusI = i1.total === 0 && i2 === null && i3 === null && i4 === null && i5.total === 0;
asli('Seluruh SQL di atas memakai placeholder ? — nilai injeksi terlihat di log sebagai PARAMETER, bukan bagian teks SQL.');

asli('\n===== RINGKASAN =====');
asli('f (identitas tidak di-SELECT saat bolehLihatIdentitas=false):', f1 && f2 && f3 ? 'LULUS' : 'GAGAL');
asli('g (penyaringan wilayah/kepemilikan di WHERE):', gA && gB ? 'LULUS' : 'GAGAL');
asli('i (injeksi aktif):', lulusI ? 'LULUS' : 'GAGAL');
await tutupPool();
process.exit(f1 && f2 && f3 && gA && gB && lulusI ? 0 : 1);
