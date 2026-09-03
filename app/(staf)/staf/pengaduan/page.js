// app/(staf)/staf/pengaduan/page.js — Kelola Pengaduan (staf). Port DOM 1:1 dari
// desain/stitch_portal_berita_inklusif/kelola_pengaduan_admin/code.html (REFERENSI 18.2).
// Sidebar dan <main> dirender layout staf (sidebar kanonik 18.3); halaman ini hanya mengembalikan
// ISI <main> desain. Filter = <form method="get"> (bekerja tanpa JavaScript): ?q= ?status= ?kategori= ?halaman=.
//
// ATURAN 13 (identitas pelapor): daftarPengaduan hanya MENYERTAKAN kolom identitas bila
// bolehLihatIdentitas(peran) === true (disaring di SQL). Halaman ini hanya menampilkan
// nama_pelapor di kolom Pelapor untuk peran identitas; NIK/telepon/email TIDAK PERNAH dirender
// di daftar. Pembatasan wilayah pimpinan_wilayah lewat wilayahTerbatas() -> WHERE di SQL.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import Lencana from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import PemantauRealtime from '@/components/staf/PemantauRealtime';
import { ambilPenggunaSesi } from '@/lib/auth/sesi';
import { HAK, wilayahTerbatas, bolehLihatIdentitas } from '@/lib/auth/hakAkses';
import { daftarPengaduan, hitungPengaduanPerStatus } from '@/lib/db/pengaduan';
import { STATUS_PENGADUAN, SLUG_STATUS_PENGADUAN, labelKategoriPengaduan, kategoriPengaduanValid } from '@/lib/kategoriPengaduan';
import { formatTanggalID } from '@/lib/utils';

export const metadata = {
  title: 'Kelola Pengaduan',
  description: 'Pantau, tinjau, dan proses laporan pengaduan masyarakat.',
};
export const dynamic = 'force-dynamic';

const PER_HALAMAN = 10;

// Pil status — kelas VERBATIM desain: pil pertama (aktif, emas) dan pil kedua (pasif).
const KELAS_PIL_AKTIF = 'px-4 py-1.5 bg-secondary-container text-on-secondary-container font-label-md rounded-full whitespace-nowrap border border-transparent';
const KELAS_PIL_PASIF = 'px-4 py-1.5 bg-surface text-on-surface font-label-md rounded-full whitespace-nowrap border border-outline-variant hover:bg-surface-container transition-colors';

// Paginasi kaki tabel — kelas VERBATIM desain (‹ 1 2 3 ›); tombol -> <Link> (18.2c).
const KELAS_PANAH = 'p-1 rounded text-outline hover:bg-surface-container';
const KELAS_PANAH_MATI = 'p-1 rounded text-outline hover:bg-surface-container disabled:opacity-50';
const KELAS_HAL_AKTIF = 'w-8 h-8 rounded bg-secondary-container text-on-secondary-container font-label-md flex items-center justify-center';
const KELAS_HAL = 'w-8 h-8 rounded text-on-surface hover:bg-surface-container font-label-md flex items-center justify-center';

// Kelas sel Pelapor — VERBATIM desain: baris anonim (ikon + teks) dan baris bernama.
const KELAS_SEL_PELAPOR_TERSEMBUNYI = 'py-4 px-6 font-body-md text-on-surface-variant flex items-center gap-2';
const KELAS_SEL_PELAPOR_NAMA = 'py-4 px-6 font-body-md text-on-surface';

/** Nomor halaman yang ditampilkan: jendela maksimal 5 di sekitar halaman aktif. */
function daftarNomor(hal, total) {
  let awal = Math.max(1, hal - 2);
  const akhir = Math.min(total, awal + 4);
  awal = Math.max(1, akhir - 4);
  return Array.from({ length: akhir - awal + 1 }, (_, i) => awal + i);
}

export default async function HalamanKelolaPengaduan({ searchParams }) {
  const sp = await searchParams;
  const pengguna = await ambilPenggunaSesi();
  if (!pengguna) redirect('/login');
  if (!HAK.pengaduan_lihat.includes(pengguna.peran)) redirect('/tanpa-akses');

  const q = typeof sp?.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const status = SLUG_STATUS_PENGADUAN.includes(sp?.status) ? sp.status : '';
  const kategori = kategoriPengaduanValid(sp?.kategori) ? sp.kategori : '';
  const halamanDiminta = Math.max(1, parseInt(sp?.halaman, 10) || 1);

  // Hak dihitung dari PERAN (bukan dari permintaan); wilayah dibatasi di SQL.
  const wilayahId = wilayahTerbatas(pengguna);
  const bolehIdentitas = bolehLihatIdentitas(pengguna.peran);

  const [{ baris, total, halaman, perHalaman, totalHalaman }, perStatus] = await Promise.all([
    daftarPengaduan({
      status: status || null,
      kategori: kategori || null,
      q: q || null,
      wilayahId,
      bolehLihatIdentitas: bolehIdentitas,
      halaman: halamanDiminta,
      perHalaman: PER_HALAMAN,
    }),
    hitungPengaduanPerStatus({ wilayahId }),
  ]);

  // Tautan yang mempertahankan filter (q, kategori, status) — dipakai pil status dan paginasi.
  const buatHref = ({ statusBaru = status, halamanBaru = 1 } = {}) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (kategori) p.set('kategori', kategori);
    if (statusBaru) p.set('status', statusBaru);
    if (halamanBaru > 1) p.set('halaman', String(halamanBaru));
    const s = p.toString();
    return `/staf/pengaduan${s ? `?${s}` : ''}`;
  };
  const hrefHalaman = (n) => buatHref({ halamanBaru: n });
  const awal = total === 0 || baris.length === 0 ? 0 : (halaman - 1) * perHalaman + 1;
  const akhir = total === 0 || baris.length === 0 ? 0 : (halaman - 1) * perHalaman + baris.length;

  // Pil: "Semua", lalu setiap status (Baru, Diverifikasi, Diproses, Selesai, Ditolak).
  // KEPUTUSAN BARU: desain hanya menggambar Semua/Baru/Diproses; Diverifikasi/Selesai/Ditolak
  // ditambahkan dengan kelas pil pasif yang SAMA agar semua status bisa disaring.
  const pil = [{ slug: '', label: 'Semua', jumlah: perStatus.semua }, ...STATUS_PENGADUAN.map((s) => ({ slug: s.slug, label: s.label, jumlah: perStatus[s.slug] ?? 0 }))];

  return (
    // KEPUTUSAN BARU: <main class="flex-1 ml-0 md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen flex flex-col max-w-container-max">
    // desain sudah digantikan <main> layout staf (flex-1 md:ml-64 h-full overflow-y-auto); padding, flex-col,
    // dan max-w dibawa pembungkus ini; min-h-screen (=100vh, aturan 5) -> min-h-full (main ber-h-full) agar
    // kontainer tabel ber-flex-1 tetap memanjang ke bawah seperti screen.png.
    <div className="p-margin-mobile md:p-margin-desktop min-h-full flex flex-col max-w-container-max">
      <PemantauRealtime mode="daftar-pengaduan" bebasFilter={!q && !status && !kategori && halamanDiminta === 1} />
      {/* Mobile Header desain (md:hidden) TIDAK disalin: bilah atas + hamburger sudah dirender KerangkaStaf (kanonik). */}
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Kelola Pengaduan</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">Monitor, review, and process public reports submitted by citizens. Ensure all evidence is reviewed before updating status.</p>
      </div>
      {/* Action Bar — KEPUTUSAN BARU: div pembungkus menjadi <form method="get"> dengan kelas yang sama */}
      <form method="get" action="/staf/pengaduan" className="flex flex-col md:flex-row justify-between items-center bg-surface-container-low p-4 rounded-lg border border-outline-variant mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Ikon nama="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-outline" />
            <label htmlFor="q" className="sr-only">Cari ID Kasus atau Wilayah</label>
            <input id="q" name="q" defaultValue={q} className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-md text-body-md focus:outline-none focus:ring-1 focus:ring-secondary-fixed-dim focus:border-secondary-fixed-dim transition-shadow" placeholder="Cari ID Kasus atau Wilayah..." type="text" />
          </div>
          {/* Filter status/kategori aktif dipertahankan saat mencari (tanpa JavaScript). */}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {kategori ? <input type="hidden" name="kategori" value={kategori} /> : null}
          {/* KEPUTUSAN BARU: desain tidak menggambar panel filter -> tombol filter = tombol kirim formulir. */}
          <button type="submit" aria-label="Terapkan pencarian dan filter" className="p-2 bg-surface border border-outline-variant rounded-md hover:bg-surface-container transition-colors text-on-surface-variant flex items-center justify-center">
            <Ikon nama="filter_list" />
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {pil.map((p) => (
            <Link
              key={p.slug || 'semua'}
              href={buatHref({ statusBaru: p.slug })}
              className={p.slug === status ? KELAS_PIL_AKTIF : KELAS_PIL_PASIF}
              aria-current={p.slug === status ? 'page' : undefined}
            >
              {p.label} ({p.jumlah})
            </Link>
          ))}
        </div>
      </form>
      {/* Data Table Container (Structured Document Grid feel) */}
      {baris.length === 0 ? (
        <KeadaanKosong
          ikon="gavel"
          judul="Belum ada pengaduan"
          keterangan={total > 0 ? 'Halaman ini melebihi jumlah laporan yang ada.' : q || status || kategori ? 'Tidak ada pengaduan yang cocok dengan pencarian atau filter.' : 'Belum ada pengaduan yang dapat Anda kelola.'}
          className="mb-8"
        />
      ) : (
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex-1 flex flex-col mb-8 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary">
                <tr>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md w-24">ID Kasus</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md">Kategori</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md">Pelapor</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md">Wilayah</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md">Tanggal</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md text-center">Status</th>
                  <th scope="col" className="py-4 px-6 font-label-md text-label-md text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {baris.map((p) => {
                  const anonim = Number(p.anonim) === 1;
                  // Nama hanya bila peran identitas DAN kolomnya memang ada di baris (disaring SQL).
                  const nama = !anonim && bolehIdentitas && p.nama_pelapor ? String(p.nama_pelapor) : null;
                  const hrefDetail = `/staf/pengaduan/${p.id}`;
                  return (
                    // Kelas baris PERTAMA desain; onclick overlay desain -> tautan ikon Aksi ke halaman detail.
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer" data-nomor={p.nomor_kasus}>
                      <td className="py-4 px-6 font-body-md font-medium text-primary">#{p.nomor_kasus}</td>
                      <td className="py-4 px-6 font-body-md text-on-surface">{labelKategoriPengaduan(p.kategori_masalah)}</td>
                      {nama ? (
                        <td className={KELAS_SEL_PELAPOR_NAMA}>{nama}</td>
                      ) : (
                        <td className={KELAS_SEL_PELAPOR_TERSEMBUNYI}>
                          <Ikon nama="visibility_off" className="text-outline text-sm" />
                          {/* KEPUTUSAN BARU: pengaduan bernama dilihat peran tanpa hak identitas -> "Dirahasiakan" (ikon sama). */}
                          {anonim ? 'Anonim' : 'Dirahasiakan'}
                        </td>
                      )}
                      <td className="py-4 px-6 font-body-md text-on-surface">{p.wilayah_nama ?? '—'}</td>
                      <td className="py-4 px-6 font-body-md text-on-surface-variant">{formatTanggalID(p.dibuat_pada)}</td>
                      <td className="py-4 px-6 text-center">
                        <Lencana status={p.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link className="text-primary hover:text-secondary-container transition-colors p-1" href={hrefDetail} aria-label={`Lihat detail pengaduan ${p.nomor_kasus}`}>
                          <Ikon nama="visibility" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="mt-auto border-t border-outline-variant bg-surface p-4 flex items-center justify-between">
            <span className="font-body-md text-on-surface-variant text-sm">Menampilkan {awal}-{akhir} dari {total} laporan</span>
            <nav className="flex gap-1" aria-label="Paginasi">
              {halaman > 1 ? (
                <Link className={KELAS_PANAH} href={hrefHalaman(halaman - 1)} aria-label="Halaman sebelumnya"><Ikon nama="chevron_left" /></Link>
              ) : (
                <button type="button" className={KELAS_PANAH_MATI} disabled aria-label="Halaman sebelumnya"><Ikon nama="chevron_left" /></button>
              )}
              {daftarNomor(halaman, totalHalaman).map((n) =>
                n === halaman ? (
                  <span key={n} className={KELAS_HAL_AKTIF} aria-current="page">{n}</span>
                ) : (
                  <Link key={n} className={KELAS_HAL} href={hrefHalaman(n)} aria-label={`Halaman ${n}`}>{n}</Link>
                ),
              )}
              {halaman < totalHalaman ? (
                <Link className={KELAS_PANAH} href={hrefHalaman(halaman + 1)} aria-label="Halaman berikutnya"><Ikon nama="chevron_right" /></Link>
              ) : (
                <button type="button" className={KELAS_PANAH_MATI} disabled aria-label="Halaman berikutnya"><Ikon nama="chevron_right" /></button>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
