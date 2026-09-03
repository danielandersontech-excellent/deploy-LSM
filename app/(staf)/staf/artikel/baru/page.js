// app/(staf)/staf/artikel/baru/page.js — Editor Artikel (artikel BARU). Layar:
// desain/stitch_portal_berita_inklusif/editor_artikel_admin. Server component: hanya mengambil data
// (kategori, provinsi) dan hak, lalu merender SATU client component EditorArtikel (isi <main> desain;
// sidebar kanonik + <main> dirender app/(staf)/staf/layout.js).
// Hak: HAK.artikel_buat (superadmin, redaktur, penulis); peran lain -> /tanpa-akses.
// Tombol "Terbitkan" hanya untuk HAK.artikel_terbitkan (redaktur, superadmin) — API tetap pagar utama.
import { redirect } from 'next/navigation';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilKategoriArtikel } from '@/lib/db/artikel';
import { ambilProvinsi } from '@/lib/db/wilayah';
import EditorArtikel from '@/components/staf/EditorArtikel';

export const metadata = { title: 'Tulis Artikel Baru' };
export const dynamic = 'force-dynamic';

export default async function HalamanArtikelBaru() {
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login?lanjut=%2Fstaf%2Fartikel%2Fbaru');
  if (!HAK.artikel_buat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const [kategori, wilayah] = await Promise.all([ambilKategoriArtikel(), ambilProvinsi()]);

  return (
    <EditorArtikel
      artikel={null}
      tag={[]}
      kategori={kategori.map((k) => ({ id: k.id, nama: k.nama }))}
      wilayah={wilayah.map((w) => ({ id: w.id, nama: w.nama }))}
      bolehTerbitkan={HAK.artikel_terbitkan.includes(pengguna.peran)}
      bolehSunting
      penulisNama={pengguna.nama}
      dasarUrlPublik={(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}
    />
  );
}
