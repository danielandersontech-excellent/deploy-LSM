// app/(staf)/staf/pengurus/page.js — Kelola Pengurus (staf). Layar ini TIDAK ada di ZIP desain
// (REFERENSI 18.4) -> KEPUTUSAN BARU: cetakan kelola_artikel_admin/code.html (header halaman, tabel
// kepala bg-primary, kaki tabel, tombol aksi utama) + editor_artikel_admin/code.html (formulir).
// Server component: memuat pengguna, hak, daftar pengurus, dan provinsi; seluruh interaksi (formulir,
// unggah foto, urutan, hapus) di components/staf/KelolaPengurus.js (client) lewat API /api/staf/pengurus*.
// Hak: HAK.konten_lihat (superadmin, redaktur, pimpinan_wilayah baca-saja); HAK.konten_kelola
// (superadmin, redaktur) menentukan tombol yang dirender — API tetap memagari sendiri (requireRole).
import { redirect } from 'next/navigation';
import KelolaPengurus from '@/components/staf/KelolaPengurus';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilSemuaPengurus } from '@/lib/db/pengurus';
import { ambilProvinsi, ambilKabupatenKota } from '@/lib/db/wilayah';

export const metadata = {
  title: 'Kelola Pengurus',
  description: 'Susunan kepengurusan yang tampil di halaman Struktur Organisasi.',
};
export const dynamic = 'force-dynamic';

export default async function HalamanKelolaPengurus() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.konten_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [pengurus, provinsi, kabupaten] = await Promise.all([ambilSemuaPengurus(), ambilProvinsi(), ambilKabupatenKota()]);
  const bolehKelola = HAK.konten_kelola.includes(pengguna.peran);

  // Baris DB -> objek polos (tanggal/BigInt tidak ada di tabel ini; Number() menjaga id/urutan tetap angka).
  const daftar = pengurus.map((p) => ({
    id: Number(p.id),
    nama: p.nama,
    jabatan: p.jabatan,
    tingkat: p.tingkat,
    // QA-3 (BUG DIPERBAIKI): `kelompok` dan `bagian` DULU TIDAK IKUT dikirim ke komponen, sehingga
    // formulir "Ubah" selalu membukanya kosong dan setiap penyuntingan menghapus kelompok pengurus
    // dari basis data (itulah sebab kartu "Sekjen DPP" tampil nyasar di bagian Pimpinan Regional).
    kelompok: p.kelompok ?? null,
    bagian: p.bagian ?? null,
    wilayah_id: p.wilayah_id == null ? null : Number(p.wilayah_id),
    wilayah_nama: p.wilayah_nama ?? null,
    foto: p.foto ?? null,
    deskripsi: p.deskripsi ?? '',
    aktif_sejak: p.aktif_sejak == null ? null : Number(p.aktif_sejak),
    urutan: Number(p.urutan) || 0,
    aktif: Number(p.aktif) === 1,
  }));
  const wilayah = provinsi.map((w) => ({ id: Number(w.id), nama: w.nama }));
  // Kabupaten/kota untuk Koordinator Daerah, dikelompokkan per provinsi (<optgroup>).
  const wilayahKabupaten = kabupaten.map((w) => ({ id: Number(w.id), nama: w.nama, provinsi: w.provinsi_nama }));

  return <KelolaPengurus pengurus={daftar} wilayah={wilayah} wilayahKabupaten={wilayahKabupaten} bolehKelola={bolehKelola} />;
}
