// UJI d (buku besar) + UJI e (transaksi) pada pengaduan contoh WRP-009021.
import 'dotenv/config';
import { kueri, tutupPool } from '../../../lib/db/index.js';
import { ubahStatusPengaduan, ambilRiwayat, ambilIdByNomor } from '../../../lib/db/pengaduan.js';
import { waktuSekarang } from '../../../lib/utils.js';

const NOMOR = 'WRP-009021';
const p = await ambilIdByNomor(NOMOR);
console.log(`Pengaduan ${NOMOR} id=${p.id} status awal='${p.status}'`);
const cetakRiwayat = async (judul) => {
  const r = await ambilRiwayat(p.id);
  console.log(`\n${judul} — pengaduan_riwayat (pengaduan_id=${p.id}), ${r.length} baris:`);
  console.log('  id | status_sebelum | status_sesudah | oleh_user_id | dibuat_pada         | catatan');
  for (const x of r) console.log(`  ${String(x.id).padStart(2)} | ${String(x.status_sebelum).padEnd(14)} | ${x.status_sesudah.padEnd(14)} | ${String(x.oleh_user_id).padEnd(12)} | ${waktuSekarang(x.dibuat_pada)} | ${x.catatan ?? ''}`);
  return r;
};
await cetakRiwayat('SEBELUM');

// ---- UJI d: tiga perubahan berturut-turut (oleh verifikator id 4)
console.log('\n== UJI d: ubahStatusPengaduan() 3x berturut-turut ==');
for (const [status, catatan] of [['diverifikasi', 'Bukti foto sesuai lokasi.'], ['diproses', 'Koordinasi dengan aparat setempat.'], ['selesai', 'Pungli berhenti setelah patroli rutin.']]) {
  const h = await ubahStatusPengaduan(p.id, { statusBaru: status, catatan, olehUserId: 4 });
  console.log(`  ${h.statusSebelum} -> ${h.statusSesudah}  (riwayat id ${h.riwayatId})`);
}
const r = await cetakRiwayat('SESUDAH UJI d');
let rantai = true;
for (let i = 1; i < r.length; i++) if (r[i].status_sebelum !== r[i - 1].status_sesudah) rantai = false;
console.log(`\nRantai: status_sesudah baris N == status_sebelum baris N+1 untuk seluruh ${r.length - 1} pasangan? ${rantai ? 'YA' : 'TIDAK'}`);
const [st] = await kueri(`SELECT status FROM pengaduan WHERE id = ?`, [p.id]);
console.log(`pengaduan.status sekarang = '${st.status}' (harus 'selesai', sama dengan status_sesudah terakhir '${r[r.length - 1].status_sesudah}')`);

// ---- UJI e: simulasi kegagalan saat menyisipkan riwayat -> status harus ikut batal
console.log('\n== UJI e: kegagalan INSERT riwayat (oleh_user_id=999999 melanggar FK) ==');
const sebelum = (await kueri(`SELECT status FROM pengaduan WHERE id = ?`, [p.id]))[0].status;
const jumlahSebelum = (await ambilRiwayat(p.id)).length;
let galat = null;
try {
  await ubahStatusPengaduan(p.id, { statusBaru: 'ditolak', catatan: 'seharusnya dibatalkan', olehUserId: 999999 });
} catch (e) { galat = e; }
console.log('  galat tertangkap :', galat ? `${galat.code ?? galat.kode ?? ''} ${galat.message}`.trim() : '(TIDAK ADA GALAT — CACAT)');
const sesudah = (await kueri(`SELECT status FROM pengaduan WHERE id = ?`, [p.id]))[0].status;
const jumlahSesudah = (await ambilRiwayat(p.id)).length;
console.log(`  status sebelum='${sebelum}' sesudah='${sesudah}' | riwayat sebelum=${jumlahSebelum} sesudah=${jumlahSesudah}`);
const lulusE = galat && sebelum === sesudah && jumlahSebelum === jumlahSesudah && sesudah !== 'ditolak';
console.log(`HASIL UJI e: ${lulusE ? 'LULUS — UPDATE status ikut dibatalkan (rollback seluruh transaksi)' : 'GAGAL'}`);
await cetakRiwayat('SESUDAH UJI e (harus sama dengan sesudah uji d)');
await tutupPool();
process.exit(rantai && lulusE ? 0 : 1);
