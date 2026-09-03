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
import { ambilProvinsi } from '@/lib/db/wilayah';

export const metadata = {
  title: 'Kelola Pengurus',
  description: 'Susunan kepengurusan yang tampil di halaman Struktur Organisasi.',
};
export const dynamic = 'force-dynamic';

export default async function HalamanKelolaPengurus() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.konten_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [pengurus, provinsi] = await Promise.all([ambilSemuaPengurus(), ambilProvinsi()]);
  const bolehKelola = HAK.konten_kelola.includes(pengguna.peran);

  // Baris DB -> objek polos (tanggal/BigInt tidak ada di tabel ini; Number() menjaga id/urutan tetap angka).
  const daftar = pengurus.map((p) => ({
    id: Number(p.id),
    nama: p.nama,
    jabatan: p.jabatan,
    tingkat: p.tingkat,
    wilayah_id: p.wilayah_id == null ? null : Number(p.wilayah_id),
    wilayah_nama: p.wilayah_nama ?? null,
    foto: p.foto ?? null,
    deskripsi: p.deskripsi ?? '',
    aktif_sejak: p.aktif_sejak == null ? null : Number(p.aktif_sejak),
    urutan: Number(p.urutan) || 0,
    aktif: Number(p.aktif) === 1,
  }));
  const wilayah = provinsi.map((w) => ({ id: Number(w.id), nama: w.nama }));

  return <KelolaPengurus pengurus={daftar} wilayah={wilayah} bolehKelola={bolehKelola} />;
}
