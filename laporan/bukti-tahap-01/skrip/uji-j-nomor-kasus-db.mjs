// UJI j — 1000 pengaduan dibuat berturut-turut lewat jalur sungguhan (buatPengaduan:
// nomor acak + UNIQUE KEY + percobaan ulang), lalu diperiksa keunikannya di DB.
// Baris uji ditandai deskripsi 'UJI-J-NOMOR-KASUS' dan dihapus di akhir (SELECT dulu, baru DELETE).
import 'dotenv/config';
import { kueri, tutupPool } from '../../../lib/db/index.js';
import { buatPengaduan } from '../../../lib/db/pengaduan.js';

const PENANDA = 'UJI-J-NOMOR-KASUS';
const N = 1000;
const t0 = Date.now();
const nomor = [];
for (let i = 0; i < N; i++) {
  const h = await buatPengaduan({ anonim: true, kategoriMasalah: 'lainnya', wilayahId: null, lokasiKejadian: null, deskripsi: PENANDA });
  nomor.push(h.nomorKasus);
}
const detik = ((Date.now() - t0) / 1000).toFixed(1);
const unik = new Set(nomor);
console.log(`dibuat lewat buatPengaduan(): ${N} dalam ${detik} detik`);
console.log(`contoh 10 pertama : ${nomor.slice(0, 10).join(' ')}`);
console.log(`unik di memori    : ${unik.size} | berganda: ${N - unik.size}`);
const [db] = await kueri(`SELECT COUNT(*) AS jumlah, COUNT(DISTINCT nomor_kasus) AS unik FROM pengaduan WHERE deskripsi = ?`, [PENANDA]);
console.log(`di DB             : baris ${db.jumlah} | nomor_kasus unik ${db.unik}`);
const [riw] = await kueri(`SELECT COUNT(*) AS jumlah FROM pengaduan_riwayat r JOIN pengaduan p ON p.id = r.pengaduan_id WHERE p.deskripsi = ?`, [PENANDA]);
console.log(`riwayat awal      : ${riw.jumlah} (harus ${N}: tidak ada pengaduan tanpa riwayat — aturan 7)`);
const angka = nomor.map((x) => Number(x.slice(4)));
const naik = angka.slice(1).filter((v, i) => v > angka[i]).length;
console.log(`nomor berikutnya lebih besar dari sebelumnya: ${naik}/${N - 1} (acak ≈ 50%; berurutan = 100%)`);
const lulus = unik.size === N && Number(db.unik) === N && Number(riw.jumlah) === N;
console.log(`\nHASIL: ${lulus ? 'LULUS — 1000 nomor, tidak ada yang berganda, tidak berurutan' : 'GAGAL'}`);

// bersihkan: SELECT dulu, lalu DELETE (riwayat lebih dulu karena RESTRICT)
const [cek] = await kueri(`SELECT COUNT(*) AS jumlah FROM pengaduan WHERE deskripsi = ?`, [PENANDA]);
console.log(`\nbersih-bersih: SELECT COUNT(*) pengaduan uji = ${cek.jumlah}`);
const hr = await kueri(`DELETE r FROM pengaduan_riwayat r JOIN pengaduan p ON p.id = r.pengaduan_id WHERE p.deskripsi = ?`, [PENANDA]);
const hp = await kueri(`DELETE FROM pengaduan WHERE deskripsi = ?`, [PENANDA]);
console.log(`dihapus: riwayat ${hr.affectedRows}, pengaduan ${hp.affectedRows}`);
const [sisa] = await kueri(`SELECT COUNT(*) AS jumlah FROM pengaduan`);
console.log(`sisa pengaduan di DB: ${sisa.jumlah} (harus 3 = seed)`);
await tutupPool();
process.exit(lulus ? 0 : 1);
