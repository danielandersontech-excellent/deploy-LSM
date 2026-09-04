// app/(staf)/staf/layout.js — LAPISAN 3: requireUser untuk seluruh /staf/* (pagar), lalu kerangka
// ruang staf dengan sidebar kanonik (REFERENSI 18.3, dashboard_staff_warkop). Menu dari
// lib/navItems.js menuUntukPeran (aturan: menu hanya dari navItems). Tombol aksi utama sidebar
// bergantung peran (KEPUTUSAN BARU, lihat SidebarStaf.js).
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { menuUntukPeran } from '@/lib/navItems';
import KerangkaStaf from '@/components/staf/KerangkaStaf';

export const dynamic = 'force-dynamic';

function aksiUtamaUntuk(peran) {
  if (HAK.artikel_buat.includes(peran)) return { href: '/staf/artikel/baru', label: 'Tulis Artikel Baru' };
  if (peran === 'verifikator') return { href: '/staf/pengaduan', label: 'Proses Pengaduan' };
  return { href: null, label: null };
}

export default async function LayoutStaf({ children }) {
  // Sesi diverifikasi terhadap DB (aktif + token_version). Tanpa sesi -> /login; peran asing -> /tanpa-akses.
  const pengguna = await requireUser(HAK.ruang_staf);
  // QA-1 (4b): wajib_ganti_sandi=1 -> dialihkan DI SERVER ke /staf/ganti-sandi (sebelumnya hanya di klien lewat KerangkaStaf;
  // tanpa JavaScript halaman staf lain tetap terbaca). Jalur dari header x-jalur yang disetel proxy.js.
  const jalur = (await headers()).get('x-jalur') || '';
  if (Number(pengguna.wajib_ganti_sandi) === 1 && jalur && jalur !== '/staf/ganti-sandi') redirect('/staf/ganti-sandi');
  const menu = menuUntukPeran(pengguna.peran);
  const aksi = aksiUtamaUntuk(pengguna.peran);
  return (
    <KerangkaStaf pengguna={{ id: pengguna.id, nama: pengguna.nama, peran: pengguna.peran }} menu={menu} hrefAksiUtama={aksi.href} labelAksiUtama={aksi.label} wajibGantiSandi={Number(pengguna.wajib_ganti_sandi) === 1}>
      {children}
    </KerangkaStaf>
  );
}
