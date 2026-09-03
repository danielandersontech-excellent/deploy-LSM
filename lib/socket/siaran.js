// lib/socket/siaran.js — PEMBANTU SIARAN (TAHAP-08 §4). Route API memanggil fungsi di sini,
// TIDAK PERNAH menyentuh io langsung (cetak biru bagian 9). Penyaringan data sensitif terjadi di SATU
// tempat ini: muatan hanya penanda (nomor kasus, kategori, wilayah, status, waktu) — TIDAK PERNAH nama/NIK/
// telepon/email pelapor, deskripsi laporan, catatan internal, nama petugas (aturan 13). Bila dashboard
// butuh detail, ia mengambil lewat API biasa yang berpagar peran.
// Semua fungsi aman dipanggil saat io belum ada (mis. uji unit) — tidak melempar.
import { ambilIo } from './server.js';
import { waktuISOWIB } from '../utils.js';

function io() {
  return ambilIo();
}

/** Muatan pengaduan yang AMAN untuk siaran: hanya penanda. */
function muatanPengaduanAman(p) {
  return {
    nomorKasus: p.nomor_kasus ?? p.nomorKasus ?? null,
    kategori: p.kategori_masalah ?? p.kategori ?? null,
    wilayahId: p.wilayah_id ?? p.wilayahId ?? null,
    wilayah: p.wilayah_nama ?? p.wilayah ?? null,
    status: p.status ?? null,
    waktu: waktuISOWIB(),
  };
}

/** Room tujuan pengaduan: seluruh staf + room wilayahnya (pimpinan_wilayah wilayah lain TIDAK menerima). */
function roomPengaduan(p) {
  const wilayahId = p.wilayah_id ?? p.wilayahId ?? null;
  return wilayahId != null ? ['staf', `wilayah:${wilayahId}`] : ['staf'];
}

/** pengaduan:baru — dipanggil POST /api/pengaduan setelah pengaduan tersimpan. */
export function siarkanPengaduanBaru(pengaduan) {
  const s = io();
  if (!s) return null;
  const muatan = muatanPengaduanAman({ ...pengaduan, status: pengaduan.status ?? 'baru' });
  s.to(roomPengaduan(pengaduan)).emit('pengaduan:baru', muatan);
  return muatan;
}

/** pengaduan:status — dipanggil POST /api/staf/pengaduan/[id]/status setelah buku besar tertulis. */
export function siarkanStatusPengaduan(pengaduan, statusSebelum, statusSesudah) {
  const s = io();
  if (!s) return null;
  const muatan = { ...muatanPengaduanAman({ ...pengaduan, status: statusSesudah }), statusSebelum, statusSesudah };
  s.to(roomPengaduan(pengaduan)).emit('pengaduan:status', muatan);
  return muatan;
}

/** artikel:terbit — dipanggil POST /api/staf/artikel/[id]/terbitkan. Hanya judul, slug, kategori, penulis. */
export function siarkanArtikelTerbit(artikel) {
  const s = io();
  if (!s) return null;
  const muatan = {
    judul: artikel.judul ?? null,
    slug: artikel.slug ?? null,
    kategori: artikel.kategori_nama ?? artikel.kategori ?? null,
    penulis: artikel.penulis_nama ?? artikel.penulis ?? null,
    waktu: waktuISOWIB(),
  };
  s.to('staf').emit('artikel:terbit', muatan);
  return muatan;
}

/** Kunci muatan yang DILARANG muncul di siaran mana pun (dipakai uji b/otomatis). */
export const KUNCI_TERLARANG = Object.freeze(['nama_pelapor', 'nik_pelapor', 'telepon_pelapor', 'email_pelapor', 'deskripsi', 'catatan', 'petugas_nama', 'petugas', 'namaPelapor', 'nik', 'telepon', 'email']);
