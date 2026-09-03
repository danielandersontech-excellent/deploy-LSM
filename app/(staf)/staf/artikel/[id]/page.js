// app/(staf)/staf/artikel/[id]/page.js — Editor Artikel (SUNTING). Layar:
// desain/stitch_portal_berita_inklusif/editor_artikel_admin. Server component: params di-await,
// artikel dari ambilArtikelById (tanpa SQL di halaman), lalu merender SATU client component
// EditorArtikel (isi <main> desain; sidebar kanonik dirender layout).
// Pagar halaman (pagar utama tetap requireRole di API, sama persis dengan /api/staf/artikel/[id]):
//   - id tidak sah / artikel tidak ada -> notFound()
//   - peran di luar HAK.artikel_lihat (verifikator) -> /tanpa-akses
//   - penulis bukan pemilik -> /tanpa-akses
//   - pimpinan_wilayah: artikel di luar wilayahnya -> notFound() (keberadaan tidak bocor); wilayahnya -> baca-saja
import { notFound, redirect } from 'next/navigation';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelById, ambilKategoriArtikel, ambilTagArtikel } from '@/lib/db/artikel';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { sanitasiIsiArtikel } from '@/lib/sanitasi';
import EditorArtikel from '@/components/staf/EditorArtikel';

export const metadata = { title: 'Editor Artikel' };
export const dynamic = 'force-dynamic';

function keIso(nilai) {
  if (!nilai) return null;
  const t = nilai instanceof Date ? nilai : new Date(nilai);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

export default async function HalamanSuntingArtikel({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect(`/login?lanjut=${encodeURIComponent(`/staf/artikel/${n}`)}`);
  if (!HAK.artikel_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const artikel = await ambilArtikelById(n);
  if (!artikel) notFound();
  if (pengguna.peran === 'penulis' && Number(artikel.penulis_id) !== Number(pengguna.id)) redirect('/tanpa-akses');
  const wilayah = wilayahTerbatas(pengguna);
  if (wilayah !== null && Number(artikel.wilayah_id) !== wilayah) notFound();

  const bolehSunting = HAK.artikel_sunting.includes(pengguna.peran); // pimpinan_wilayah -> baca-saja
  const bolehTerbitkan = HAK.artikel_terbitkan.includes(pengguna.peran);

  const [kategori, provinsi, tag] = await Promise.all([ambilKategoriArtikel(), ambilProvinsi(), ambilTagArtikel(n)]);

  // Pesan awal setelah router.replace dari halaman "baru" (state klien hilang saat rute berganti)
  const dasarUrlPublik = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  let pesanAwal = null;
  if (sp?.terbit === '1' && artikel.status === 'terbit') {
    pesanAwal = { jenis: 'sukses', teks: 'Artikel berhasil diterbitkan.', tautan: `${dasarUrlPublik}/berita/${artikel.slug}` };
  } else if (sp?.tersimpan === '1') {
    pesanAwal = { jenis: 'sukses', teks: 'Draf tersimpan.' };
  }

  // Hanya kolom yang dibutuhkan editor; isi disanitasi lagi (lapisan kedua, idempoten) sebelum ke klien.
  const artikelKlien = {
    id: artikel.id,
    judul: artikel.judul,
    slug: artikel.slug,
    isi: sanitasiIsiArtikel(artikel.isi ?? ''),
    gambar_utama: artikel.gambar_utama,
    status: artikel.status,
    terbit_pada: keIso(artikel.terbit_pada),
    kategori_id: artikel.kategori_id,
    wilayah_id: artikel.wilayah_id,
    penulis_nama: artikel.penulis_nama,
  };

  return (
    <EditorArtikel
      artikel={artikelKlien}
      tag={tag.map((t) => t.nama)}
      kategori={kategori.map((k) => ({ id: k.id, nama: k.nama }))}
      wilayah={provinsi.map((w) => ({ id: w.id, nama: w.nama }))}
      bolehTerbitkan={bolehTerbitkan}
      bolehSunting={bolehSunting}
      penulisNama={pengguna.nama}
      dasarUrlPublik={dasarUrlPublik}
      pesanAwal={pesanAwal}
    />
  );
}
