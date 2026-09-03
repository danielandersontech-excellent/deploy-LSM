// lib/db/statistik.js — angka dashboard staf. Disaring menurut peran DI SQL.
import { kueri } from './index.js';
import { tanggalSekarang } from '../utils.js';

/**
 * Kartu angka dashboard (dashboard_staff_warkop): total artikel (+bulan ini),
 * pengaduan masuk (status baru), laporan selesai.
 * pimpinan_wilayah: hanya wilayahnya (wilayahId wajib terisi; null = tidak ada data).
 * penulis: total artikel = miliknya.
 */
export async function hitungStatistikDashboard({ peran, userId = null, wilayahId = null }) {
  const syaratArtikel = [];
  const paramsArtikel = [];
  if (peran === 'penulis') { syaratArtikel.push(`a.penulis_id = ?`); paramsArtikel.push(Number(userId)); }
  if (peran === 'pimpinan_wilayah') { syaratArtikel.push(`a.wilayah_id = ?`); paramsArtikel.push(wilayahId == null ? -1 : Number(wilayahId)); }
  const whereArtikel = syaratArtikel.length ? `WHERE ${syaratArtikel.join(' AND ')}` : '';
  const awalBulan = tanggalSekarang().slice(0, 7) + '-01 00:00:00';

  const syaratPengaduan = [`p.dihapus_pada IS NULL`];
  const paramsPengaduan = [];
  if (peran === 'pimpinan_wilayah') { syaratPengaduan.push(`p.wilayah_id = ?`); paramsPengaduan.push(wilayahId == null ? -1 : Number(wilayahId)); }
  const wherePengaduan = `WHERE ${syaratPengaduan.join(' AND ')}`;

  const [artikel, pengaduan] = await Promise.all([
    kueri(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN a.dibuat_pada >= ? THEN 1 ELSE 0 END) AS bulan_ini FROM artikel a ${whereArtikel}`,
      [awalBulan, ...paramsArtikel],
    ),
    kueri(
      `SELECT SUM(CASE WHEN p.status = 'baru' THEN 1 ELSE 0 END) AS masuk,
              SUM(CASE WHEN p.status = 'selesai' THEN 1 ELSE 0 END) AS selesai,
              COUNT(*) AS total
       FROM pengaduan p ${wherePengaduan}`,
      paramsPengaduan,
    ),
  ]);
  return {
    totalArtikel: Number(artikel[0].total) || 0,
    artikelBulanIni: Number(artikel[0].bulan_ini) || 0,
    pengaduanMasuk: Number(pengaduan[0].masuk) || 0,
    pengaduanSelesai: Number(pengaduan[0].selesai) || 0,
    totalPengaduan: Number(pengaduan[0].total) || 0,
  };
}

/**
 * Tren laporan bulanan: jumlah pengaduan per bulan untuk N bulan terakhir
 * (grafik "Tren Laporan Bulanan"). Bulan kosong tetap muncul dengan 0.
 */
export async function trenLaporanBulanan({ bulan = 6, wilayahId = null } = {}) {
  const n = Math.max(1, Math.min(24, Number(bulan) || 6));
  const [tahun, bln] = tanggalSekarang().split('-').map(Number);
  const daftar = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(tahun, bln - 1 - i, 1));
    daftar.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  const awal = `${daftar[0]}-01 00:00:00`;
  const syarat = [`p.dihapus_pada IS NULL`, `p.dibuat_pada >= ?`];
  const params = [awal];
  if (wilayahId != null) { syarat.push(`p.wilayah_id = ?`); params.push(Number(wilayahId)); }
  const baris = await kueri(
    `SELECT DATE_FORMAT(p.dibuat_pada, '%Y-%m') AS bulan, COUNT(*) AS jumlah FROM pengaduan p WHERE ${syarat.join(' AND ')} GROUP BY bulan ORDER BY bulan`,
    params,
  );
  const peta = Object.fromEntries(baris.map((b) => [b.bulan, Number(b.jumlah)]));
  return daftar.map((b) => ({ bulan: b, jumlah: peta[b] ?? 0 }));
}

/** Artikel terbaru untuk dashboard redaktur/penulis (penulis: miliknya; pimpinan_wilayah: wilayahnya) — di SQL. */
export async function artikelTerbaruDashboard({ peran, userId = null, wilayahId = null, batas = 5 } = {}) {
  const syarat = [];
  const params = [];
  if (peran === 'penulis') { syarat.push(`a.penulis_id = ?`); params.push(Number(userId)); }
  if (wilayahId != null) { syarat.push(`a.wilayah_id = ?`); params.push(Number(wilayahId)); }
  const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';
  return kueri(
    `SELECT a.id, a.judul, a.slug, a.status, a.diperbarui_pada, k.nama AS kategori_nama, u.nama AS penulis_nama
     FROM artikel a JOIN kategori_artikel k ON k.id = a.kategori_id JOIN users u ON u.id = a.penulis_id
     ${where} ORDER BY a.diperbarui_pada DESC, a.id DESC LIMIT ?`,
    [...params, Math.max(1, Math.min(20, Number(batas) || 5))],
  );
}

/** Pengaduan terbaru untuk tabel dashboard (tanpa identitas, tanpa deskripsi). */
export async function pengaduanTerbaru({ batas = 5, wilayahId = null } = {}) {
  const syarat = [`p.dihapus_pada IS NULL`];
  const params = [];
  if (wilayahId != null) { syarat.push(`p.wilayah_id = ?`); params.push(Number(wilayahId)); }
  return kueri(
    `SELECT p.id, p.nomor_kasus, p.kategori_masalah, w.nama AS wilayah_nama, p.status, p.dibuat_pada
     FROM pengaduan p LEFT JOIN wilayah w ON w.id = p.wilayah_id
     WHERE ${syarat.join(' AND ')} ORDER BY p.dibuat_pada DESC, p.id DESC LIMIT ?`,
    [...params, Math.max(1, Math.min(20, Number(batas) || 5))],
  );
}
