// app/(publik)/berita/page.js — DAFTAR BERITA. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin apa adanya dari daftar_berita_investigasi/code.html (layar utama,
// screen.png 1519 px valid). Bagian yang TIDAK ada di layar utama tetapi diminta TAHAP-05 §1 —
// sorotan utama (kartu besar) dan sisi kanan "Paling Banyak Dibaca" — disalin dari
// portal_berita_beranda/code.html (screen.png rusak; code.html satu-satunya sumber).
// Enam perubahan 18.2 yang dipakai: (a) ikon -> <Ikon>, (b) gambar googleusercontent ->
// next/image dengan `gambar_utama` dari DB, (c) href/button -> rute sungguhan, (d) bagian
// DINAMIS (kartu, sorotan, opsi kategori, paling dibaca) -> tabel `artikel`/`kategori_artikel`,
// (e) elemen berulang -> .map() memakai kelas elemen PERTAMA, (f) JSX. Navbar/footer dari layout (18.3).
//
// Filter WAJIB tercermin di URL dan bekerja tanpa JavaScript (<form method="get">):
//   ?q=<kata>            — pencarian judul/ringkasan/isi (kotak cari navbar juga mengirim ke sini)
//   ?kategori=<slug>     — hanya slug yang ada di kategori_artikel; selain itu diperlakukan kosong
//   ?rentang=30|90|tahun-ini — "Rentang Waktu" desain (KEPUTUSAN BARU, lihat laporan)
//   ?halaman=N           — paginasi (components/ui/Paginasi: kelas verbatim dari layar ini)
// Sorotan utama = baris pertama hasil pada tampilan bawaan (tanpa filter, halaman 1) — sama
// dengan ambilArtikelSorotan(1) tanpa kueri tambahan dan tanpa duplikasi kartu.
import Link from 'next/link';
import Image from 'next/image';
import { cache } from 'react';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import Paginasi from '@/components/ui/Paginasi';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import { ambilArtikelTerbit, ambilArtikelPalingDibaca, ambilKategoriArtikel } from '@/lib/db/artikel';
import { formatTanggalID, formatAngkaID } from '@/lib/utils';

// 3 kolom (lg:grid-cols-3) × 2 baris per halaman.
const PER_HALAMAN = 6;
const RENTANG_SAH = ['30', '90', 'tahun-ini'];
const PANJANG_Q_MAKS = 100;
const JUMLAH_PALING_DIBACA = 5;
const DESKRIPSI = 'Arsip berita, laporan masyarakat, dan tindak lanjut pengawasan yang telah diverifikasi oleh tim WARKOP NUSANTARA.';

// Satu kueri kategori per permintaan (dipakai generateMetadata dan halaman).
const daftarKategori = cache(() => ambilKategoriArtikel());

/** Ambil satu nilai string dari searchParams (bisa array bila kunci diulang). */
function satuNilai(v) {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

/** Validasi parameter URL: kategori hanya slug yang ada, rentang dari daftar sah, halaman bilangan bulat ≥ 1. */
function bacaFilter(sp, slugSah) {
  const q = String(satuNilai(sp?.q)).trim().slice(0, PANJANG_Q_MAKS);
  const kategoriMentah = satuNilai(sp?.kategori);
  const rentangMentah = satuNilai(sp?.rentang);
  const halamanMentah = Number.parseInt(satuNilai(sp?.halaman), 10);
  return {
    q,
    kategori: slugSah.includes(kategoriMentah) ? kategoriMentah : '',
    rentang: RENTANG_SAH.includes(rentangMentah) ? rentangMentah : '',
    halaman: Number.isInteger(halamanMentah) && halamanMentah >= 1 ? halamanMentah : 1,
  };
}

/** Bangun href /berita dengan filter yang dipertahankan; nilai kosong dan halaman 1 tidak ditulis. */
function buatHref({ q, kategori, rentang, halaman }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (kategori) p.set('kategori', kategori);
  if (rentang) p.set('rentang', rentang);
  if (halaman && halaman > 1) p.set('halaman', String(halaman));
  const s = p.toString();
  return s ? `/berita?${s}` : '/berita';
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const kategoriList = await daftarKategori();
  const { q, kategori } = bacaFilter(sp, kategoriList.map((k) => k.slug));
  const namaKategori = kategoriList.find((k) => k.slug === kategori)?.nama;
  let title = 'Berita & Investigasi';
  if (q && namaKategori) title = `Pencarian "${q}" di ${namaKategori} — Berita & Investigasi`;
  else if (q) title = `Pencarian "${q}" — Berita & Investigasi`;
  else if (namaKategori) title = `${namaKategori} — Berita & Investigasi`;
  return { title, description: DESKRIPSI };
}

export default async function HalamanBerita({ searchParams }) {
  const sp = await searchParams;
  const kategoriList = await daftarKategori();
  const { q, kategori, rentang, halaman: halamanDiminta } = bacaFilter(sp, kategoriList.map((k) => k.slug));

  const [hasil, palingDibaca] = await Promise.all([
    ambilArtikelTerbit({
      kategoriSlug: kategori || null,
      q: q || null,
      rentang: rentang || null,
      halaman: halamanDiminta,
      perHalaman: PER_HALAMAN,
    }),
    ambilArtikelPalingDibaca(JUMLAH_PALING_DIBACA),
  ]);
  const { baris, total, halaman, totalHalaman } = hasil;
  const filterAktif = { q, kategori, rentang };
  const adaFilter = Boolean(q || kategori || rentang);

  // Sorotan hanya pada tampilan bawaan; kartu grid = sisa baris agar artikel tidak tampil dua kali.
  const sorotan = !adaFilter && halaman === 1 && baris.length > 0 ? baris[0] : null;
  const kartu = sorotan ? baris.slice(1) : baris;

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Page Header & Filtering */}
      <section className="mb-12 border-b border-outline-variant pb-8">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-4">Arsip Berita &amp; Observasi</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-3xl">
          Pantau perkembangan terkini, laporan masyarakat, dan tindak lanjut pengawasan yang telah diverifikasi oleh tim Warkop Nusantara. Transparansi adalah kunci integritas.
        </p>
        {/* Pembungkus <form> tanpa kelas: filter desain bekerja tanpa JavaScript (GET ke URL yang bisa dibagikan) */}
        <form method="get" action="/berita" role="search" aria-label="Saring berita">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-container-lowest p-6 rounded-lg border border-outline-variant shadow-sm relative overflow-hidden">
            {/* Decorative subtle skeuomorphic texture accent (implied by guidelines) */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#271310 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            <div className="w-full md:w-1/2 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="search">Pencarian Kata Kunci</label>
              <div className="relative">
                <Ikon nama="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all" id="search" name="q" defaultValue={q} maxLength={PANJANG_Q_MAKS} placeholder="Cari laporan, wilayah, atau topik..." type="text" />
              </div>
            </div>
            <div className="w-full md:w-1/4 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="category">Kategori Observasi</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all appearance-none cursor-pointer" id="category" name="kategori" defaultValue={kategori}>
                  <option value="">Semua Kategori</option>
                  {kategoriList.map((k) => (
                    <option key={k.slug} value={k.slug}>{k.nama}</option>
                  ))}
                </select>
                <Ikon nama="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            <div className="w-full md:w-1/4 relative z-10">
              <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="date">Rentang Waktu</label>
              <div className="relative">
                <select className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary-fixed-dim focus:border-b-2 transition-all appearance-none cursor-pointer" id="date" name="rentang" defaultValue={rentang}>
                  <option value="">Terbaru</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">3 Bulan Terakhir</option>
                  <option value="tahun-ini">Tahun Ini</option>
                </select>
                <Ikon nama="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            {/* Tombol kirim tidak digambar desain — KEPUTUSAN BARU (sama seperti /program): KELAS_TOMBOL.ringkas + px-4 */}
            <div className="w-full md:w-auto relative z-10">
              <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4 w-full`}>Terapkan</button>
            </div>
          </div>
        </form>
      </section>
      {/* Dua kolom (portal_berita_beranda): kolom utama + sisi kanan */}
      <div className="flex flex-col md:flex-row gap-gutter">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-12">
          {/* Featured Investigasi — sorotan utama (portal_berita_beranda) */}
          {sorotan ? (
            <section aria-label="Sorotan utama">
              <div className="group cursor-pointer relative overflow-hidden rounded-xl border border-tertiary/10 bg-surface-lowest shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video w-full overflow-hidden relative">
                  <Image className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={sorotan.gambar_utama || '/penampung/artikel-1.jpg'} alt={`Gambar utama: ${sorotan.judul}`} fill sizes="(min-width: 1280px) 880px, (min-width: 768px) calc(100vw - 424px), 100vw" priority />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary-fixed-dim text-primary px-3 py-1 rounded-full font-label-md text-label-md flex items-center gap-1 shadow-sm">
                      <Ikon nama="visibility" className="text-[16px]" />
                      {sorotan.kategori_nama}
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-8 bg-surface-bright border-t-4 border-secondary-fixed-dim">
                  <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-label-md mb-4">
                    <span className="flex items-center gap-1"><Ikon nama="calendar_today" className="text-[18px]" /> {formatTanggalID(sorotan.terbit_pada, 'panjang')}</span>
                    <span className="text-tertiary/20">|</span>
                    <span className="flex items-center gap-1"><Ikon nama="person" className="text-[18px]" /> Oleh {sorotan.penulis_nama}</span>
                  </div>
                  {/* h1 desain -> h2: h1 halaman sudah "Arsip Berita & Observasi" (hierarki judul, aksesibilitas) */}
                  <h2 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-primary mb-4 group-hover:text-secondary-fixed-dim transition-colors">
                    <Link href={`/berita/${sorotan.slug}`} className="focus:outline-none focus:underline">{sorotan.judul}</Link>
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 line-clamp-3">
                    {sorotan.ringkasan}
                  </p>
                  <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-secondary-fixed-dim transition-colors font-bold uppercase tracking-wider" href={`/berita/${sorotan.slug}`} aria-label={`Baca Laporan Lengkap: ${sorotan.judul}`}>
                    Baca Laporan Lengkap <Ikon nama="arrow_forward" />
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
          {/* Divider */}
          {sorotan && kartu.length > 0 ? <hr className="border-tertiary/10" /> : null}
          {/* Article Grid */}
          {kartu.length === 0 && !sorotan ? (
            <KeadaanKosong
              ikon="article"
              judul={adaFilter || halaman > 1 ? 'Tidak ada berita yang cocok' : 'Belum ada berita'}
              keterangan={adaFilter || halaman > 1 ? 'Coba ubah kata kunci, kategori, atau rentang waktu, atau kembali ke halaman pertama.' : 'Berita dan laporan investigasi yang diterbitkan akan tampil di sini.'}
            >
              {adaFilter || halaman > 1 ? (
                <Link href="/berita" className="font-label-md text-label-md text-secondary hover:underline">Lihat semua berita</Link>
              ) : null}
            </KeadaanKosong>
          ) : kartu.length > 0 ? (
            <div>
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter" aria-label="Daftar artikel">
                {kartu.map((a) => (
                  <article key={a.id} className="flex flex-col bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden group hover:border-secondary-fixed-dim transition-all duration-300 relative shadow-sm hover:shadow-md cursor-pointer">
                    <div className="h-48 w-full relative overflow-hidden bg-surface-container-high border-b border-outline-variant">
                      <Image className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={a.gambar_utama || '/penampung/artikel-1.jpg'} alt={`Gambar utama: ${a.judul}`} fill sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-1 rounded-full border border-secondary">{a.kategori_nama}</span>
                        <div className="flex items-center text-outline text-sm gap-1" title="Verified Truth">
                          <Ikon nama="verified" className="text-base" />
                        </div>
                      </div>
                      <h2 className="font-headline-md text-headline-md text-primary mb-3 leading-tight group-hover:text-secondary transition-colors line-clamp-2">
                        <Link href={`/berita/${a.slug}`} className="focus:outline-none focus:underline">{a.judul}</Link>
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
                        {a.ringkasan}
                      </p>
                      <div className="pt-4 border-t border-outline-variant flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                          <Ikon nama="account_circle" className="text-outline" />
                          <span className="font-label-md text-label-md text-on-surface">{a.penulis_nama}</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant text-sm">{formatTanggalID(a.terbit_pada, 'singkat')}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
              {/* Pagination — tombol desain -> <Link> ?halaman= yang mempertahankan q/kategori/rentang */}
              <Paginasi halaman={halaman} totalHalaman={totalHalaman} buatHref={(n) => buatHref({ ...filterAktif, halaman: n })} />
            </div>
          ) : null}
          {total > 0 ? <p className="sr-only" aria-live="polite">Menampilkan {baris.length} dari {total} berita.</p> : null}
        </div>
        {/* Sidebar (portal_berita_beranda) */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-8">
          {/* Most Read */}
          <div className="bg-surface-container-low rounded-xl border border-tertiary/10 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-tertiary/10 pb-4">
              <Ikon nama="trending_up" className="text-secondary-container text-2xl" />
              <h2 className="font-headline-md text-[20px] text-primary uppercase tracking-wide">Paling Banyak Dibaca</h2>
            </div>
            {palingDibaca.length === 0 ? (
              <KeadaanKosong ikon="trending_up" judul="Belum ada data" keterangan="Artikel yang paling banyak dibaca akan tampil di sini." />
            ) : (
              <ul className="flex flex-col gap-4">
                {palingDibaca.map((a, i) => (
                  // Item pertama tanpa garis atas; item berikutnya "pt-4 border-t border-tertiary/5" persis seperti desain
                  <li key={a.id} className={i === 0 ? 'group cursor-pointer flex gap-4 items-start' : 'group cursor-pointer flex gap-4 items-start pt-4 border-t border-tertiary/5'}>
                    <span className="font-headline-lg text-secondary-container/50 group-hover:text-secondary-container transition-colors font-bold text-4xl leading-none">{i + 1}</span>
                    <div>
                      <h4 className="font-headline-md text-[16px] leading-snug text-primary group-hover:text-secondary-container transition-colors mb-1">
                        <Link href={`/berita/${a.slug}`} className="focus:outline-none focus:underline">{a.judul}</Link>
                      </h4>
                      <span className="font-label-md text-[12px] text-on-surface-variant">{a.kategori_nama} • {formatAngkaID(a.jumlah_dibaca)} Tayangan</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Call to Action / Citizen Report Widget */}
          <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden shadow-sm">
            {/* Abstract pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
            <div className="relative z-10">
              <Ikon nama="campaign" className="text-4xl text-secondary-fixed mb-4" />
              <h3 className="font-headline-md text-[22px] font-bold mb-2">Punya Info Penting?</h3>
              <p className="font-body-md text-[14px] text-on-primary/80 mb-6">Jadilah mata dan telinga masyarakat. Laporkan indikasi penyimpangan yang Anda temui dengan bukti pendukung.</p>
              <Link href="/kontak" className="w-full bg-secondary-fixed text-primary font-label-md py-3 rounded-lg hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wide">
                Buat Laporan <Ikon nama="shield" />
              </Link>
              <p className="text-center mt-3 text-[11px] text-on-primary/60 font-body-md">Identitas pelapor dilindungi kerahasiaannya.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
