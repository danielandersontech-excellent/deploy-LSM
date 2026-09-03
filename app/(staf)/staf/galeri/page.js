// app/(staf)/staf/galeri/page.js — Kelola Galeri (staf). Layar ini TIDAK ada di ZIP -> REFERENSI 18.4:
// cetakan kelola_artikel_admin (header halaman + tombol tambah), editor_artikel_admin (formulir, kotak unggah
// putus-putus) dan kartu grid galeri_dokumentasi (kartu kecil md:col-span-4). Ditampilkan sebagai GRID dengan
// pratinjau, bukan tabel (TAHAP-07 bagian 5: konten visual) — KEPUTUSAN BARU.
// Sidebar dan <main> dirender layout staf; halaman ini hanya mengembalikan ISI <main>.
// Server component: memuat data (tanpa SQL di sini) lalu menyerahkan ke client component KelolaGaleri.
// Hak: konten_lihat (superadmin, redaktur, pimpinan_wilayah baca-saja); konten_kelola = tombol tambah/ubah/hapus.
// Peran lain -> /tanpa-akses (API tetap memagari dengan requireRole).
import { redirect } from 'next/navigation';
import KelolaGaleri from '@/components/staf/KelolaGaleri';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilGaleri } from '@/lib/db/galeri';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { KATEGORI_GALERI } from '@/lib/kategoriGaleri';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Kelola Galeri',
  description: 'Dokumentasi foto dan video kegiatan yang tampil di halaman Galeri publik.',
};
export const dynamic = 'force-dynamic';

/**
 * DATE dari DB dibaca driver sebagai Date pukul 00:00 WIB (pool timezone +07:00) = 17:00 UTC hari
 * sebelumnya; geser +7 jam sebelum mengambil YYYY-MM-DD agar tanggalnya tidak mundur satu hari.
 */
function keTanggalISO(nilai) {
  if (!nilai) return '';
  if (nilai instanceof Date) return new Date(nilai.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return String(nilai).slice(0, 10);
}

export default async function HalamanKelolaGaleri() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.konten_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [{ baris, total }, provinsi] = await Promise.all([ambilGaleri({ perHalaman: 60 }), ambilProvinsi()]);

  // Hanya nilai polos (string/angka/null) yang diserahkan ke client component.
  const item = baris.map((g) => ({
    id: Number(g.id),
    judul: g.judul,
    deskripsi: g.deskripsi ?? '',
    jenis: g.jenis === 'video' ? 'video' : 'foto',
    berkas: g.berkas,
    thumbnail: g.thumbnail ?? null,
    kategori: g.kategori,
    wilayah_id: g.wilayah_id == null ? '' : String(g.wilayah_id),
    wilayah_nama: g.wilayah_nama ?? null,
    lokasi: g.lokasi ?? '',
    tanggal_kegiatan: keTanggalISO(g.tanggal_kegiatan),
    tanggalTampil: formatTanggalID(g.tanggal_kegiatan),
  }));

  return (
    <KelolaGaleri
      item={item}
      total={total}
      wilayah={provinsi.map((w) => ({ id: Number(w.id), nama: w.nama }))}
      kategori={KATEGORI_GALERI}
      bolehKelola={HAK.konten_kelola.includes(pengguna.peran)}
      batasMb={Number(process.env.UPLOAD_MAX_MB) || 20}
    />
  );
}
