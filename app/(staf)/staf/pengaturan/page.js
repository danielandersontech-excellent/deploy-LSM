// app/(staf)/staf/pengaturan/page.js — Pengaturan situs (superadmin SAJA; TAHAP-07 bagian 7,
// aturan 8 REFERENSI 14). Layar ini TIDAK ada di ZIP desain (REFERENSI 18.4) — cetakan:
// header halaman dari kelola_artikel_admin + formulir/panel kanan dari editor_artikel_admin
// (kelas disusun di components/staf/FormulirPengaturan.js). Sidebar kanonik + <main> dirender
// app/(staf)/staf/layout.js; halaman ini hanya mengembalikan ISI <main>.
//
// Server component: mengambil nilai lewat lib/db/pengaturan (tidak ada SQL di halaman) dan
// meneruskan PENGATURAN_DEFINISI — SUMBER TUNGGAL label/tipe/kelompok yang juga menjadi daftar
// putih API dan validasi tipe. Formulir DIBANGKITKAN dari definisi itu: menambah setelan =
// satu entri di lib/pengaturanDefinisi.js, tanpa menyentuh halaman ini.
// Peran di luar HAK.pengaturan_kelola -> /tanpa-akses (API tetap pagar utama: denganPeran).
import { redirect } from 'next/navigation';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilPengaturan } from '@/lib/db/pengaturan';
import { PENGATURAN_DEFINISI } from '@/lib/pengaturanDefinisi';
import FormulirPengaturan from '@/components/staf/FormulirPengaturan';

export const metadata = {
  title: 'Pengaturan',
  description: 'Setelan situs: statistik beranda, kontak, teks organisasi, dan halaman teks statis.',
};
export const dynamic = 'force-dynamic';

export default async function HalamanPengaturan() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login?lanjut=%2Fstaf%2Fpengaturan');
  if (!HAK.pengaturan_kelola.includes(pengguna.peran)) redirect('/tanpa-akses');

  const nilai = await ambilPengaturan();

  return <FormulirPengaturan nilaiAwal={nilai} definisi={PENGATURAN_DEFINISI} />;
}
