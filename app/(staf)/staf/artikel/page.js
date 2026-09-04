// app/(staf)/staf/artikel/page.js — Kelola Artikel (staf). Port DOM 1:1 dari
// desain/stitch_portal_berita_inklusif/kelola_artikel_admin/code.html (REFERENSI 18.2).
// Sidebar dan <main> dirender layout staf (sidebar kanonik 18.3); halaman ini hanya mengembalikan
// ISI <main> desain. Filter = <form method="get"> (bekerja tanpa JavaScript): ?q= ?status= ?halaman=.
// Penyaringan peran DI SQL (ambilArtikelStaf): penulis hanya miliknya, pimpinan_wilayah hanya
// wilayahnya (baca-saja). Tombol yang tidak berhak TIDAK dirender; API tetap memagari (requireRole).
import Link from 'next/link';
import KirimOtomatis from '@/components/publik/KirimOtomatis';
import { redirect } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import AksiArtikel from '@/components/staf/AksiArtikel';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelStaf } from '@/lib/db/artikel';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Kelola Artikel',
  description: 'Daftar publikasi dan laporan hasil investigasi warga.',
};
export const dynamic = 'force-dynamic';

const PER_HALAMAN = 10;
const STATUS_SAH = ['draf', 'terbit', 'arsip'];

// Lencana status — kelas VERBATIM desain: "Published" (emas) dan "Draft" (abu).
// KEPUTUSAN BARU: status 'arsip' tidak digambar Stitch -> label "Arsip" memakai kelas lencana Draft.
const LENCANA = Object.freeze({
  terbit: { label: 'Published', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim' },
  draf: { label: 'Draft', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant' },
  arsip: { label: 'Arsip', kelas: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant' },
});

// Paginasi kaki tabel — kelas VERBATIM desain (tombol « 1 2 3 »); tombol -> <Link> (18.2c).
const KELAS_HAL = 'px-3 py-1 border border-outline-variant rounded hover:bg-surface-container-highest transition-colors';
const KELAS_HAL_AKTIF = 'px-3 py-1 bg-primary text-on-primary rounded';

/** Nomor halaman yang ditampilkan: jendela maksimal 5 di sekitar halaman aktif. */
function daftarNomor(hal, total) {
  let awal = Math.max(1, hal - 2);
  const akhir = Math.min(total, awal + 4);
  awal = Math.max(1, akhir - 4);
  return Array.from({ length: akhir - awal + 1 }, (_, i) => awal + i);
}

export default async function HalamanKelolaArtikel({ searchParams }) {
  const sp = await searchParams;
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.artikel_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const q = typeof sp?.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const status = STATUS_SAH.includes(sp?.status) ? sp.status : '';
  const halamanDiminta = Math.max(1, parseInt(sp?.halaman, 10) || 1);

  const { baris, total, halaman, perHalaman, totalHalaman } = await ambilArtikelStaf({
    peran: pengguna.peran,
    userId: pengguna.id,
    wilayahId: wilayahTerbatas(pengguna),
    status: status || null,
    q: q || null,
    halaman: halamanDiminta,
    perHalaman: PER_HALAMAN,
  });

  const bolehBuat = HAK.artikel_buat.includes(pengguna.peran);
  const bolehHapus = HAK.artikel_hapus.includes(pengguna.peran);
  const bolehSunting = (a) =>
    HAK.artikel_sunting.includes(pengguna.peran) &&
    (pengguna.peran !== 'penulis' || Number(a.penulis_id) === Number(pengguna.id));

  const buatHref = (n) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (n > 1) p.set('halaman', String(n));
    const s = p.toString();
    return `/staf/artikel${s ? `?${s}` : ''}`;
  };
  const awal = total === 0 ? 0 : (halaman - 1) * perHalaman + 1;
  const akhir = total === 0 ? 0 : Math.min(total, (halaman - 1) * perHalaman + baris.length);

  return (
    // KEPUTUSAN BARU: <main class="flex-1 ml-64 p-margin-desktop min-h-screen"> desain sudah
    // digantikan <main> layout staf (flex-1 md:ml-64); padding p-margin-desktop dibawa pembungkus ini;
    // min-h-screen (=100vh, aturan 5) tidak disalin.
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Kelola Artikel</h2>
            <p className="text-on-surface-variant mt-2">Daftar publikasi dan laporan hasil investigasi warga.</p>
          </div>
          {bolehBuat ? (
            <Link href="/staf/artikel/baru" className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2" style={{ boxShadow: '0 4px 6px -1px rgba(233, 195, 73, 0.2)' }}>
              <Ikon nama="post_add" />
              Tulis Artikel Baru
            </Link>
          ) : null}
        </header>
        {/* Filters & Search — KEPUTUSAN BARU: div pembungkus menjadi <form method="get"> dengan kelas yang sama */}
        <form method="get" action="/staf/artikel" className="flex flex-col md:flex-row justify-between gap-4 mb-6 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <div className="relative w-full">
              <Ikon nama="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <label htmlFor="q" className="sr-only">Cari judul artikel atau penulis</label>
              <input id="q" name="q" defaultValue={q} className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest focus:ring-1 focus:ring-secondary-fixed-dim focus:border-secondary-fixed-dim font-body-md text-body-md text-on-surface" placeholder="Cari judul artikel atau penulis..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="status" className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Filter Status:</label>
            <select id="status" name="status" defaultValue={status} className="border border-outline-variant rounded-md px-4 py-2 bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary-fixed-dim focus:border-secondary-fixed-dim">
              <option value="">Semua Status</option>
              <option value="terbit">Published</option>
              <option value="draf">Draft</option>
              <option value="arsip">Arsip</option>
            </select>
            {/* KEPUTUSAN BARU: tombol kirim agar filter bekerja tanpa JavaScript (preseden app/(publik)/program) */}
            <KirimOtomatis />
            <noscript><button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button></noscript>
          </div>
        </form>
        {/* Data Table */}
        {baris.length === 0 ? (
          <KeadaanKosong ikon="article" judul="Belum ada artikel" keterangan={q || status ? 'Tidak ada artikel yang cocok dengan pencarian atau filter status.' : 'Belum ada artikel yang dapat Anda kelola.'} />
        ) : (
          <div className="bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary">
                <tr>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">Judul Artikel</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden md:table-cell">Kategori</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden lg:table-cell">Penulis</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden sm:table-cell">Tanggal Publikasi</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">Status</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {baris.map((a) => {
                  const lencana = LENCANA[a.status] ?? LENCANA.draf;
                  const hrefLihat = a.status === 'terbit' ? `/berita/${a.slug}` : `/staf/artikel/${a.id}`;
                  return (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                      <td className="px-6 py-4">
                        <p className="font-body-md text-body-md font-semibold text-primary truncate max-w-xs" title={a.judul}>{a.judul}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-on-surface-variant font-body-md text-body-md">{a.kategori_nama}</td>
                      <td className="px-6 py-4 hidden lg:table-cell text-on-surface-variant font-body-md text-body-md">{a.penulis_nama}</td>
                      <td className="px-6 py-4 hidden sm:table-cell text-on-surface-variant font-body-md text-body-md">{formatTanggalID(a.terbit_pada ?? a.dibuat_pada)}</td>
                      <td className="px-6 py-4">
                        <span className={lencana.kelas}>
                          {lencana.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link className="text-outline hover:text-primary transition-colors" title="Preview" aria-label={`Lihat artikel ${a.judul}`} href={hrefLihat}><Ikon nama="visibility" className="text-xl" /></Link>
                        {bolehSunting(a) ? (
                          <Link className="text-outline hover:text-secondary transition-colors" title="Edit" aria-label={`Sunting artikel ${a.judul}`} href={`/staf/artikel/${a.id}`}><Ikon nama="edit" className="text-xl" /></Link>
                        ) : null}
                        {bolehHapus ? <AksiArtikel id={a.id} judul={a.judul} /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant">
              <span>Menampilkan {awal}-{akhir} dari {total} artikel</span>
              <nav className="space-x-1" aria-label="Paginasi">
                {halaman > 1 ? (
                  <Link className={KELAS_HAL} href={buatHref(halaman - 1)} aria-label="Halaman sebelumnya">«</Link>
                ) : (
                  <span className={`${KELAS_HAL} opacity-50`} aria-disabled="true">«</span>
                )}
                {daftarNomor(halaman, totalHalaman).map((n) =>
                  n === halaman ? (
                    <span key={n} className={KELAS_HAL_AKTIF} aria-current="page">{n}</span>
                  ) : (
                    <Link key={n} className={KELAS_HAL} href={buatHref(n)} aria-label={`Halaman ${n}`}>{n}</Link>
                  ),
                )}
                {halaman < totalHalaman ? (
                  <Link className={KELAS_HAL} href={buatHref(halaman + 1)} aria-label="Halaman berikutnya">»</Link>
                ) : (
                  <span className={`${KELAS_HAL} opacity-50`} aria-disabled="true">»</span>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
