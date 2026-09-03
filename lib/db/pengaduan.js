// lib/db/pengaduan.js — seluruh SQL pengaduan, pengaduan_riwayat, pengaduan_lampiran.
//
// DATA SENSITIF (aturan 13). Dua prinsip yang ditegakkan DI SQL, bukan di JavaScript:
//   1. Identitas pelapor (nama/nik/telepon/email) hanya ikut di-SELECT bila
//      bolehLihatIdentitas === true. Bila false, kolomnya TIDAK ADA di kueri.
//   2. Pembatasan wilayah (pimpinan_wilayah) = klausa WHERE wilayah_id = ?.
//
// Perubahan status HANYA lewat ubahStatusPengaduan() (buku besar, satu transaksi).

import { randomInt } from 'node:crypto';
import { kueri, transaksi } from './index.js';
import { waktuSekarang } from '../utils.js';
import { SLUG_STATUS_PENGADUAN } from '../kategoriPengaduan.js';

// Kolom yang boleh dilihat SEMUA peran staf yang berhak membuka pengaduan.
const KOLOM_UMUM = `p.id, p.nomor_kasus, p.anonim, p.kategori_masalah, p.wilayah_id, w.nama AS wilayah_nama,
  p.lokasi_kejadian, p.deskripsi, p.status, p.petugas_id, u.nama AS petugas_nama, p.dibuat_pada, p.diperbarui_pada`;
// Kolom identitas — HANYA disisipkan bila bolehLihatIdentitas === true.
const KOLOM_IDENTITAS = `p.nama_pelapor, p.nik_pelapor, p.telepon_pelapor, p.email_pelapor`;
// Kolom untuk halaman pelacakan publik: TANPA identitas, TANPA deskripsi lengkap petugas.
const KOLOM_PUBLIK = `p.nomor_kasus, p.kategori_masalah, w.nama AS wilayah_nama, p.status, p.dibuat_pada, p.diperbarui_pada`;
const GABUNG = `FROM pengaduan p LEFT JOIN wilayah w ON w.id = p.wilayah_id LEFT JOIN users u ON u.id = p.petugas_id`;

function kolomUntuk(bolehLihatIdentitas) {
  return bolehLihatIdentitas === true ? `${KOLOM_UMUM}, ${KOLOM_IDENTITAS}` : KOLOM_UMUM;
}

// ------------------------------------------------------------------ nomor kasus

/**
 * Nomor kasus acak: WRP- + 6 digit dari crypto.randomInt (KEPUTUSAN BARU Tahap 1).
 * Tidak berurutan, tidak bisa ditebak dari nomor lain, pendek dan mudah dibacakan.
 * Keunikan dijamin oleh UNIQUE KEY nomor_kasus + percobaan ulang saat tabrakan.
 */
export function nomorKasusAcak() {
  return `WRP-${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;
}

const POLA_NOMOR_KASUS = /^WRP-\d{6}$/;
export function nomorKasusValid(nomor) {
  return POLA_NOMOR_KASUS.test(String(nomor ?? '').trim().toUpperCase());
}

// ------------------------------------------------------------------ buat

/**
 * Membuat pengaduan + baris riwayat pertama (NULL -> baru) dalam SATU transaksi.
 * Aturan 7: tidak ada pengaduan tanpa riwayat.
 * Bila anonim, keempat kolom identitas DIPAKSA NULL apa pun masukannya.
 */
export async function buatPengaduan({ anonim, namaPelapor = null, nikPelapor = null, teleponPelapor = null, emailPelapor = null,
  kategoriMasalah, wilayahId = null, lokasiKejadian = null, deskripsi }) {
  const anon = anonim ? 1 : 0;
  const identitas = anon ? [null, null, null, null] : [namaPelapor, nikPelapor, teleponPelapor, emailPelapor];
  return transaksi(async (koneksi) => {
    const sekarang = waktuSekarang();
    let id = null, nomor = null;
    for (let percobaan = 0; percobaan < 10 && id === null; percobaan++) {
      nomor = nomorKasusAcak();
      try {
        const hasil = await kueri(
          `INSERT INTO pengaduan (nomor_kasus, anonim, nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor,
             kategori_masalah, wilayah_id, lokasi_kejadian, deskripsi, status, petugas_id, dibuat_pada, diperbarui_pada)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'baru', NULL, ?, ?)`,
          [nomor, anon, ...identitas, kategoriMasalah, wilayahId, lokasiKejadian, deskripsi, sekarang, sekarang],
          koneksi,
        );
        id = hasil.insertId;
      } catch (galat) {
        if (galat?.code !== 'ER_DUP_ENTRY') throw galat; // tabrakan nomor: coba nomor lain
      }
    }
    if (id === null) throw new Error('Gagal membangkitkan nomor kasus unik');
    await kueri(
      `INSERT INTO pengaduan_riwayat (pengaduan_id, status_sebelum, status_sesudah, catatan, oleh_user_id, dibuat_pada)
       VALUES (?, NULL, 'baru', 'Laporan diterima', NULL, ?)`,
      [id, sekarang],
      koneksi,
    );
    return { id, nomorKasus: nomor };
  });
}

// ------------------------------------------------------------------ baca (staf)

/**
 * Satu pengaduan untuk staf.
 * @param {number} id
 * @param {{bolehLihatIdentitas:boolean, wilayahId?:number|null}} opsi
 *   wilayahId terisi = pembatasan pimpinan_wilayah (WHERE p.wilayah_id = ?)
 */
export async function ambilPengaduan(id, { bolehLihatIdentitas = false, wilayahId = null } = {}) {
  const syarat = [`p.id = ?`, `p.dihapus_pada IS NULL`];
  const params = [Number(id)];
  if (wilayahId != null) { syarat.push(`p.wilayah_id = ?`); params.push(Number(wilayahId)); }
  const baris = await kueri(`SELECT ${kolomUntuk(bolehLihatIdentitas)} ${GABUNG} WHERE ${syarat.join(' AND ')} LIMIT 1`, params);
  return baris[0] ?? null;
}

/**
 * Daftar pengaduan untuk staf, dengan filter status/kategori/kata kunci dan
 * pembatasan wilayah di SQL. Kolom identitas hanya bila bolehLihatIdentitas.
 */
export async function daftarPengaduan({ status = null, kategori = null, q = null, wilayahId = null, bolehLihatIdentitas = false, halaman = 1, perHalaman = 10 } = {}) {
  const per = Math.max(1, Math.min(50, Number(perHalaman) || 10));
  const hal = Math.max(1, Number(halaman) || 1);
  const syarat = [`p.dihapus_pada IS NULL`];
  const params = [];
  if (status) { syarat.push(`p.status = ?`); params.push(status); }
  if (kategori) { syarat.push(`p.kategori_masalah = ?`); params.push(kategori); }
  if (q) { syarat.push(`(p.nomor_kasus LIKE ? OR p.deskripsi LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  if (wilayahId != null) { syarat.push(`p.wilayah_id = ?`); params.push(Number(wilayahId)); }
  const where = `WHERE ${syarat.join(' AND ')}`;
  const [totalBaris, baris] = await Promise.all([
    kueri(`SELECT COUNT(*) AS jumlah ${GABUNG} ${where}`, params),
    kueri(`SELECT ${kolomUntuk(bolehLihatIdentitas)} ${GABUNG} ${where} ORDER BY p.dibuat_pada DESC, p.id DESC LIMIT ? OFFSET ?`, [...params, per, (hal - 1) * per]),
  ]);
  const total = Number(totalBaris[0].jumlah);
  return { baris, total, halaman: hal, perHalaman: per, totalHalaman: Math.max(1, Math.ceil(total / per)) };
}

/** Jumlah pengaduan per status (tab "Semua (124) / Baru (12) / Diproses (45)"). */
export async function hitungPengaduanPerStatus({ wilayahId = null } = {}) {
  const params = [];
  let where = `WHERE p.dihapus_pada IS NULL`;
  if (wilayahId != null) { where += ` AND p.wilayah_id = ?`; params.push(Number(wilayahId)); }
  const baris = await kueri(`SELECT p.status, COUNT(*) AS jumlah FROM pengaduan p ${where} GROUP BY p.status`, params);
  const hasil = Object.fromEntries(SLUG_STATUS_PENGADUAN.map((s) => [s, 0]));
  let semua = 0;
  for (const b of baris) { hasil[b.status] = Number(b.jumlah); semua += Number(b.jumlah); }
  return { semua, ...hasil };
}

// ------------------------------------------------------------------ baca (publik)

/** Pelacakan publik: status + riwayat, TANPA identitas (kolom tidak di-SELECT sama sekali). */
export async function ambilPengaduanByNomor(nomorKasus) {
  const nomor = String(nomorKasus ?? '').trim().toUpperCase();
  const baris = await kueri(`SELECT ${KOLOM_PUBLIK} ${GABUNG} WHERE p.nomor_kasus = ? AND p.dihapus_pada IS NULL LIMIT 1`, [nomor]);
  if (!baris[0]) return null;
  const idBaris = await kueri(`SELECT id FROM pengaduan p WHERE p.nomor_kasus = ? LIMIT 1`, [nomor]);
  const riwayat = await kueri(
    `SELECT r.status_sebelum, r.status_sesudah, r.dibuat_pada FROM pengaduan_riwayat r WHERE r.pengaduan_id = ? ORDER BY r.dibuat_pada ASC, r.id ASC`,
    [idBaris[0].id],
  );
  return { ...baris[0], riwayat };
}

/**
 * Kartu "Status Advokasi" beranda (TAHAP-04, aturan 13): kasus yang SEDANG BERJALAN
 * (diverifikasi/diproses), HANYA nomor kasus, kategori, wilayah, status — kolom identitas
 * tidak di-SELECT sama sekali (penyaringan di SQL, bukan JavaScript).
 */
export async function ambilKasusBerjalanPublik(batas = 2) {
  return kueri(
    `SELECT p.nomor_kasus, p.kategori_masalah, w.nama AS wilayah_nama, p.status, p.diperbarui_pada
     FROM pengaduan p LEFT JOIN wilayah w ON w.id = p.wilayah_id
     WHERE p.dihapus_pada IS NULL AND p.status IN ('diverifikasi', 'diproses')
     ORDER BY p.diperbarui_pada DESC, p.id DESC LIMIT ?`,
    [Math.max(1, Math.min(10, Number(batas) || 2))],
  );
}

// ------------------------------------------------------------------ buku besar

/**
 * SATU-SATUNYA jalan mengubah pengaduan.status. Buku besar (cetak biru bagian 7):
 *   1. buka transaksi
 *   2. baca status saat ini dengan SELECT ... FOR UPDATE (cegah balapan)
 *   3. UPDATE pengaduan.status
 *   4. INSERT pengaduan_riwayat (status_sebelum, status_sesudah, catatan, oleh_user_id)
 *   5. commit — atau rollback SELURUHNYA bila salah satu gagal
 *
 * Fungsi lain yang menyentuh kolom status = CACAT. Jangan membuat jalan pintas,
 * walau "hanya" untuk seed atau perbaikan data: riwayat harus selalu utuh.
 *
 * @returns {{statusSebelum:string, statusSesudah:string, riwayatId:number}}
 */
export async function ubahStatusPengaduan(id, { statusBaru, catatan = null, olehUserId = null }) {
  if (!SLUG_STATUS_PENGADUAN.includes(statusBaru)) {
    const galat = new Error(`Status tidak dikenal: ${statusBaru}`);
    galat.kode = 'STATUS_TIDAK_SAH';
    throw galat;
  }
  return transaksi(async (koneksi) => {
    const saatIni = await kueri(`SELECT id, status FROM pengaduan WHERE id = ? AND dihapus_pada IS NULL FOR UPDATE`, [Number(id)], koneksi);
    if (!saatIni[0]) {
      const galat = new Error('Pengaduan tidak ditemukan');
      galat.kode = 'TIDAK_DITEMUKAN';
      throw galat;
    }
    const statusSebelum = saatIni[0].status;
    const sekarang = waktuSekarang();
    await kueri(`UPDATE pengaduan SET status = ?, diperbarui_pada = ? WHERE id = ?`, [statusBaru, sekarang, Number(id)], koneksi);
    const riwayat = await kueri(
      `INSERT INTO pengaduan_riwayat (pengaduan_id, status_sebelum, status_sesudah, catatan, oleh_user_id, dibuat_pada)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(id), statusSebelum, statusBaru, catatan, olehUserId == null ? null : Number(olehUserId), sekarang],
      koneksi,
    );
    return { statusSebelum, statusSesudah: statusBaru, riwayatId: riwayat.insertId };
  });
}

/** Riwayat lengkap untuk staf (dengan nama petugas yang mengubah). */
export async function ambilRiwayat(pengaduanId) {
  return kueri(
    `SELECT r.id, r.status_sebelum, r.status_sesudah, r.catatan, r.oleh_user_id, u.nama AS oleh_nama, r.dibuat_pada
     FROM pengaduan_riwayat r LEFT JOIN users u ON u.id = r.oleh_user_id
     WHERE r.pengaduan_id = ? ORDER BY r.dibuat_pada ASC, r.id ASC`,
    [Number(pengaduanId)],
  );
}

// ------------------------------------------------------------------ petugas, lampiran, hapus lunak

export async function tugaskanPetugas(id, petugasId) {
  const hasil = await kueri(`UPDATE pengaduan SET petugas_id = ?, diperbarui_pada = ? WHERE id = ? AND dihapus_pada IS NULL`,
    [petugasId == null ? null : Number(petugasId), waktuSekarang(), Number(id)]);
  return hasil.affectedRows;
}

export async function tambahLampiran({ pengaduanId, namaBerkas, path, tipeMime, ukuran }, koneksi = null) {
  const hasil = await kueri(
    `INSERT INTO pengaduan_lampiran (pengaduan_id, nama_berkas, path, tipe_mime, ukuran, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?)`,
    [Number(pengaduanId), namaBerkas, path, tipeMime, Number(ukuran), waktuSekarang()],
    koneksi,
  );
  return hasil.insertId;
}

export async function ambilLampiran(pengaduanId) {
  return kueri(
    `SELECT id, nama_berkas, path, tipe_mime, ukuran, dibuat_pada FROM pengaduan_lampiran WHERE pengaduan_id = ? ORDER BY id`,
    [Number(pengaduanId)],
  );
}

/** Penghapusan lunak. Tidak ada DELETE fisik pada pengaduan (riwayat RESTRICT). */
export async function hapusLunakPengaduan(id) {
  const sekarang = waktuSekarang();
  const hasil = await kueri(`UPDATE pengaduan SET dihapus_pada = ?, diperbarui_pada = ? WHERE id = ? AND dihapus_pada IS NULL`, [sekarang, sekarang, Number(id)]);
  return hasil.affectedRows;
}

/** Untuk seed/uji: cari id berdasarkan nomor kasus (tanpa identitas). */
export async function ambilIdByNomor(nomorKasus) {
  const baris = await kueri(`SELECT id, status FROM pengaduan WHERE nomor_kasus = ? LIMIT 1`, [String(nomorKasus)]);
  return baris[0] ?? null;
}
