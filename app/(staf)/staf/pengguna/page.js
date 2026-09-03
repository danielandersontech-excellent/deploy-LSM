// app/(staf)/staf/pengguna/page.js — Kelola Pengguna (superadmin SAJA; TAHAP-07 §6).
// Layar ini TIDAK ada di ZIP -> REFERENSI 18.4: cetakan kelola_artikel_admin/code.html (kepala halaman,
// tabel kepala bg-primary, kaki tabel) + editor_artikel_admin/code.html (formulir: label mengambang,
// input/select rounded-lg, tombol Simpan). Sidebar dan <main> dirender layout staf (18.3); halaman
// hanya mengembalikan ISI <main>. Pagar utama tetap requireRole di setiap route /api/staf/pengguna*.
// Tidak ada SQL di sini: data dari lib/db/users (kolom aman, TANPA hash) dan lib/db/wilayah.
// Tanggal diformat DI SERVER (WIB) agar komponen klien menerima string biasa, bukan Date.
// LABEL_PERAN (diekspor modul 'use client' SidebarStaf) dibaca DI KLIEN — bila diimpor dari server
// component ia menjadi client reference, bukan objek (terbukti: label peran tampil mentah).
import { redirect } from 'next/navigation';
import KelolaPengguna from '@/components/staf/KelolaPengguna';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, PERAN } from '@/lib/auth/hakAkses';
import { ambilSemuaUser } from '@/lib/db/users';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Kelola Pengguna',
  description: 'Akun staf, peran, wilayah, dan keamanan sesi.',
};
export const dynamic = 'force-dynamic';

export default async function HalamanKelolaPengguna() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.pengguna_kelola.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [semua, provinsi] = await Promise.all([ambilSemuaUser(), ambilProvinsi()]);

  // Hanya kolom yang dibutuhkan tampilan (token_version tidak diteruskan ke klien).
  const baris = semua.map((u) => ({
    id: Number(u.id),
    nama: u.nama,
    email: u.email,
    peran: u.peran,
    wilayah_id: u.wilayah_id == null ? null : Number(u.wilayah_id),
    wilayah_nama: u.wilayah_nama ?? null,
    aktif: Number(u.aktif) === 1,
    wajib_ganti_sandi: Number(u.wajib_ganti_sandi) === 1,
    terakhir_masuk_teks: u.terakhir_masuk ? formatTanggalID(u.terakhir_masuk, 'lengkap') : '',
  }));

  const daftarWilayah = provinsi.map((w) => ({ id: Number(w.id), nama: w.nama }));

  return (
    <KelolaPengguna
      baris={baris}
      daftarPeran={[...PERAN]}
      daftarWilayah={daftarWilayah}
      idSaya={Number(pengguna.id)}
    />
  );
}
