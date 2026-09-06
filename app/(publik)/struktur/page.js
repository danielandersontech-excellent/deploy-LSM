// app/(publik)/struktur/page.js — STRUKTUR ORGANISASI. PROTOKOL KONVERSI LAYAR (REFERENSI 18):
// DOM + kelas Tailwind disalin dari struktur_organisasi/code.html (kartu Pimpinan Pusat, kartu Dewan Eksekutif, kartu
// regional, garis penghubung, tombol filter/peta). Enam perubahan 18.2: (a) ikon -> <Ikon>, (b) foto -> next/image dari
// kolom `foto`, (c) href/button -> rute (?wilayah=, ?tampilan=peta, #pengurus-<id>), (d) data -> tabel pengurus,
// (e) kartu -> .map(), (f) JSX. Navbar/footer dari layout (18.3). Bagian "Pimpinan Regional" ber-id="regional".
//
// RUN QA-2 A2/B5 (KEPUTUSAN PEMILIK): bagan BERTINGKAT susunan DPP asli pemilik, dikelompokkan lewat kolom
// pengurus.kelompok (lib/kelompokPengurus.js):
//   Dewan (Pembina | Penasehat | Pengawas) -> Pengurus DPP (Ketua Umum = kartu Pimpinan Pusat desain; lainnya kartu
//   Dewan Eksekutif) -> Direktorat (12 BAGIAN, tiap bagian satu kartu berisi pejabatnya) -> Satgas ->
//   Dewan Pimpinan Wilayah (DPW, satu kartu per provinsi) -> Koordinator Daerah (kabupaten/kota, dikelompokkan
//   per provinsi). Filter wilayah & tampilan peta tetap seperti desain.
//
// RUN QA-3 A1/A2/A3 (PERINTAH PEMILIK): DPC dan Direktorat Eksekutif ditiadakan; kerangka bagan TIDAK lagi
// disimpan sebagai baris "(Belum terisi)" di basis data melainkan dirender dari definisi lib/kelompokPengurus.js
// dan daftar provinsi, supaya Kelola Pengurus tidak penuh baris kosong (K3 tetap: pemilik cukup menambah orang).
// Posisi kosong bernama '(Belum terisi)' ditampilkan redup. Responsif: kolom 1 (375) / 2 (768) / 3 (1280).
//
// RUN QA-5 (KEPUTUSAN PEMILIK): setiap blok berkelompok (Dewan Pembina/Penasehat/Pengawas, Pengurus DPP, Satgas, dan
// tiap bagian Direktorat) disusun PIRAMIDA berdasarkan kolom urutan lewat komponen <Piramida> di bawah: kartu pertama
// sendiri di tengah, kartu kedua sendiri di tengah tepat di bawahnya, sisanya berjajar kiri -> kanan (3 per baris pada
// blok selebar kontainer, 2 per baris pada blok bagian Direktorat yang berdampingan di lg), garis penghubung vertikal
// desain (w-px h-12) antar baris. Di bawah md semua kartu menumpuk satu kolom urut. Agar tiap baris berjajar punya
// ruang, blok Dewan disusun satu kolom penuh dan blok bagian Direktorat dua kolom di lg (sebelumnya 3 kolom).
import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { ambilPengurusAktif } from '@/lib/db/pengurus';
import { ambilProvinsi } from '@/lib/db/wilayah';
import { KELOMPOK_PENGURUS, BAGIAN_DIREKTORAT, NAMA_BELUM_TERISI, labelBagian, belumTerisi } from '@/lib/kelompokPengurus';

export const metadata = {
  title: 'Struktur Organisasi',
  description:
    'Jajaran kepengurusan WARKOP NUSANTARA: Dewan Pembina, Penasehat, dan Pengawas, Pengurus DPP, Direktorat, Satgas, Dewan Pimpinan Wilayah, dan Koordinator Daerah.',
  alternates: { canonical: '/struktur' },
};

// Kelas verbatim desain (struktur_organisasi/code.html)
const KELAS_KARTU_PUSAT = 'bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md text-center pressed-paper-shadow relative';
const KELAS_LENCANA_PUSAT = 'absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary-fixed text-on-secondary-fixed px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 whitespace-nowrap';
const KELAS_LENCANA_ABU = 'absolute -top-4 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-4 py-1 rounded-full font-label-md text-label-md flex items-center gap-2 whitespace-nowrap';
const KELAS_KARTU_KECIL = 'bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group';
const KELAS_GARIS = 'w-px h-12 bg-outline-variant hidden md:block';
// Susunan piramida (RUN QA-5): kolom vertikal desain (flex-col items-center gap-12 = markup Pimpinan Pusat desain) dan
// satu baris kartu (kolom di bawah md, berjajar di tengah pada md ke atas). Blok berkotak memakai gap-3 di bawah md
// seperti daftar kartunya sebelumnya; bagian Pengurus DPP tetap gap-12 verbatim desain.
const KELAS_SUSUN_BLOK = 'flex flex-col items-center gap-3 md:gap-12';
const KELAS_SUSUN_DPP = 'flex flex-col items-center gap-12';
const KELAS_BARIS_BLOK = 'flex flex-col items-center md:flex-row md:items-stretch md:justify-center gap-3 md:gap-gutter w-full';
const KELAS_BARIS_DPP = 'flex flex-col items-center md:flex-row md:items-stretch md:justify-center gap-gutter w-full';
const KELAS_KARTU_PIRAMIDA = 'w-full max-w-md';

/**
 * RUN QA-5: membagi anggota satu blok menjadi baris-baris piramida berdasarkan kolom urutan.
 * Peringkat dihitung DALAM blok, karena Kelola Pengurus menomori kolom urutan secara global se-tingkat (1..n untuk
 * seluruh daftar) sedangkan pemilik juga mengisi nomor per kelompok; keduanya didukung.
 *   baris 1 = kartu berurutan terkecil (puncak);
 *   baris 2 = kartu berikutnya HANYA bila urutannya persis puncak + 1; celah nomor (mis. 1, 3, 4) berarti posisi kedua
 *             kosong -> baris kedua dilewati tanpa merusak susunan;
 *   baris berikutnya = sisanya berjajar kiri -> kanan, maksimal perBaris kartu per baris.
 * Blok 1 kartu = puncak saja; 2 kartu = puncak + tengah bawah.
 */
function susunPiramida(anggota, perBaris) {
  const nomor = (p) => Number(p.urutan) || 0;
  const urut = [...anggota].sort((a, b) => nomor(a) - nomor(b) || String(a.nama).localeCompare(String(b.nama), 'id'));
  if (!urut.length) return [];
  const [puncak, ...sisa] = urut;
  const baris = [[puncak]];
  if (sisa.length && nomor(sisa[0]) === nomor(puncak) + 1) baris.push([sisa.shift()]);
  for (let i = 0; i < sisa.length; i += perBaris) baris.push(sisa.slice(i, i + perBaris));
  return baris;
}

/**
 * Kolom piramida: baris-baris dari susunPiramida dipisah garis penghubung desain (tersembunyi di bawah md, sehingga
 * di ponsel semua kartu menumpuk urut). `kartu(p, indeksBaris)` merender kartu; atribut data-* dipakai uji QA-5.
 */
function Piramida({ anggota, perBaris, label, kartu, kelasSusun = KELAS_SUSUN_BLOK, kelasBaris = KELAS_BARIS_BLOK }) {
  const baris = susunPiramida(anggota, perBaris);
  return (
    <div className={kelasSusun} data-piramida={label} data-per-baris={perBaris}>
      {baris.map((b, i) => (
        <Fragment key={b[0].id}>
          {i > 0 ? <div className={KELAS_GARIS} data-garis=""></div> : null}
          <div className={kelasBaris} data-baris={i + 1}>
            {b.map((p) => kartu(p, i))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** Foto bulat; posisi kosong tampil redup tanpa foto. */
function Foto({ p, kelasKotak, ukuran }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div className={`${kelasKotak}${kosong ? ' opacity-50' : ''}`}>
      {p.foto && !kosong ? <Image className="w-full h-full object-cover" src={p.foto} alt={`Foto ${p.nama}`} width={600} height={600} sizes={ukuran} /> : null}
    </div>
  );
}

/** Kartu kecil (kelas kartu regional desain) untuk Dewan, Direktorat, Satgas, kerangka. */
function KartuAnggota({ p, kelasTambahan = '' }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div id={`pengurus-${p.id}`} className={`${KELAS_KARTU_KECIL}${kosong ? ' opacity-70' : ''}${kelasTambahan ? ` ${kelasTambahan}` : ''}`} data-urutan={Number(p.urutan) || 0}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-surface-variant -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="flex items-start gap-4 relative z-10">
        <Foto p={p} kelasKotak="w-16 h-16 rounded bg-surface-variant overflow-hidden shrink-0 border border-outline-variant" ukuran="64px" />
        <div className="min-w-0">
          <h4 className={`font-label-md text-label-md text-base font-bold ${kosong ? 'text-on-surface-variant italic' : 'text-primary'}`}>{p.nama}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm">{p.jabatan}</p>
          {p.wilayah_nama ? (
            <span className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-xs mt-1 border border-outline-variant text-on-surface-variant font-label-md">
              <Ikon nama="location_on" className="text-[14px]" />
              {p.wilayah_nama}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Kartu sedang (kelas kartu Dewan Eksekutif desain) untuk Pengurus DPP & Direktorat Eksekutif. */
function KartuPengurus({ p, lencana, ikon }) {
  const kosong = belumTerisi(p.nama);
  return (
    <div id={`pengurus-${p.id}`} className={`${KELAS_KARTU_PUSAT}${kosong ? ' opacity-70' : ''}`} data-urutan={Number(p.urutan) || 0}>
      <div className={KELAS_LENCANA_ABU}>
        <Ikon nama={ikon} className="text-sm" />
        {lencana}
      </div>
      <Foto p={p} kelasKotak="w-24 h-24 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border border-outline mt-2" ukuran="96px" />
      <h3 className={`font-headline-md text-headline-md text-xl mb-1 ${kosong ? 'text-on-surface-variant italic' : 'text-primary'}`}>{p.nama}</h3>
      <p className="font-label-md text-label-md text-on-surface-variant mb-2">{p.jabatan}</p>
    </div>
  );
}

function JudulTahap({ children, keterangan }) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-headline-lg text-headline-lg text-primary">{children}</h2>
      {keterangan ? <p className="font-body-md text-body-md text-on-surface-variant mt-1">{keterangan}</p> : null}
    </div>
  );
}

export default async function HalamanStruktur({ searchParams }) {
  const sp = await searchParams;
  // Filter wilayah & tampilan tercermin di URL (?wilayah=<id>&tampilan=peta), bekerja tanpa JavaScript.
  const wilayahDipilih = /^\d+$/.test(String(sp?.wilayah ?? '')) ? Number(sp.wilayah) : null;
  const tampilanPeta = sp?.tampilan === 'peta';

  const [semua, provinsi] = await Promise.all([ambilPengurusAktif(), ambilProvinsi()]);
  const perKelompok = (slug) => semua.filter((p) => p.kelompok === slug);
  const dewan = KELOMPOK_PENGURUS.filter((k) => k.tahap === 'dewan');
  // RUN QA-5: puncak Pengurus DPP = kartu berurutan terkecil (kartu Pimpinan Pusat desain), bukan lagi tebakan dari jabatan.
  const dpp = perKelompok('pengurus_dpp');
  const direktorat = perKelompok('direktorat');
  const satgas = perKelompok('satgas');
  // RUN QA-3 A2: Direktorat ditampilkan per BAGIAN; bagian tanpa pejabat tetap muncul sebagai "(Belum terisi)".
  const direktoratPerBagian = BAGIAN_DIREKTORAT.map((b) => ({ ...b, anggota: direktorat.filter((p) => p.bagian === b.slug) }));
  // Baris direktorat yang bagiannya belum dikenali (mis. data lama) tidak boleh hilang dari halaman.
  const direktoratTanpaBagian = direktorat.filter((p) => !BAGIAN_DIREKTORAT.some((b) => b.slug === p.bagian));

  // RUN QA-3 A3: DPW = satu kartu per PROVINSI; Koordinator Daerah dikelompokkan per provinsi induk.
  const dpw = perKelompok('dpw');
  const korda = perKelompok('korda');
  const dpwTersaring = wilayahDipilih === null ? dpw : dpw.filter((p) => Number(p.wilayah_id) === wilayahDipilih);
  const kordaTersaring = wilayahDipilih === null ? korda : korda.filter((p) => Number(p.induk_id) === wilayahDipilih || Number(p.wilayah_id) === wilayahDipilih);
  const provinsiTampil = wilayahDipilih === null ? provinsi : provinsi.filter((w) => Number(w.id) === wilayahDipilih);
  const dpwPerProvinsi = provinsiTampil.map((w) => ({ ...w, anggota: dpwTersaring.filter((p) => Number(p.wilayah_id) === Number(w.id)) }));
  // Koordinator Daerah: hanya provinsi yang SUDAH punya koordinator yang ditampilkan (kalau seluruh 514
  // kabupaten/kota dirender sebagai kerangka, halaman ini menjadi ratusan kartu kosong).
  const kordaPerProvinsi = provinsiTampil
    .map((w) => ({ ...w, anggota: kordaTersaring.filter((p) => Number(p.induk_id) === Number(w.id)) }))
    .filter((w) => w.anggota.length > 0);
  const namaWilayahDipilih = wilayahDipilih === null ? null : (provinsi.find((w) => Number(w.id) === wilayahDipilih)?.nama ?? null);
  const adaBagan = semua.some((p) => p.kelompok);

  // Tautan tombol ikon (KEPUTUSAN BARU): filter_list = kembali ke semua wilayah; map = tampilan peta.
  const hrefSemuaWilayah = tampilanPeta ? '/struktur?tampilan=peta#regional' : '/struktur#regional';
  const hrefPeta = tampilanPeta
    ? (wilayahDipilih === null ? '/struktur#regional' : `/struktur?wilayah=${wilayahDipilih}#regional`)
    : (wilayahDipilih === null ? '/struktur?tampilan=peta#regional' : `/struktur?wilayah=${wilayahDipilih}&tampilan=peta#regional`);
  const hrefWilayah = (id) => (tampilanPeta ? `/struktur?wilayah=${id}&tampilan=peta#regional` : `/struktur?wilayah=${id}#regional`);

  return (
    <main id="konten-utama" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-4">Struktur Organisasi</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Jajaran kepengurusan WARKOP NUSANTARA yang berdedikasi untuk mewujudkan aspirasi rakyat, kontrol sosial, dan pengawasan yang transparan demi keadilan bersama.
        </p>
      </div>

      {!adaBagan ? (
        <section className="mb-24">
          <KeadaanKosong ikon="verified_user" judul="Susunan kepengurusan belum tersedia" keterangan="Bagan Dewan, Pengurus DPP, Direktorat, dan Satgas akan ditampilkan setelah diperbarui oleh pengelola." />
        </section>
      ) : (
        <>
          {/* Tahap 1: Dewan Pembina | Penasehat | Pengawas */}
          <section className="mb-16" aria-labelledby="judul-dewan">
            <JudulTahap keterangan="Dewan Pembina, Dewan Penasehat, dan Dewan Pengawas Dewan Pimpinan Pusat">
              <span id="judul-dewan">Dewan Pimpinan Pusat</span>
            </JudulTahap>
            <div className="grid grid-cols-1 gap-gutter">
              {dewan.map((k) => (
                <div key={k.slug} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 md:p-5" data-blok={k.slug}>
                  <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Ikon nama={k.ikon} className="text-sm" />
                    {k.label}
                  </h3>
                  <Piramida
                    anggota={perKelompok(k.slug).length ? perKelompok(k.slug) : [{ id: `kosong-${k.slug}`, nama: NAMA_BELUM_TERISI, jabatan: `Ketua ${k.label}`, urutan: 1 }]}
                    perBaris={3}
                    label={k.label}
                    kartu={(p) => <KartuAnggota key={p.id} p={p} kelasTambahan={KELAS_KARTU_PIRAMIDA} />}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Tahap 2: Pengurus DPP */}
          <section className="mb-16" aria-labelledby="judul-dpp">
            <JudulTahap keterangan="Ketua Umum, Wakil Ketua Umum, Sekretaris Jenderal, Bendahara Umum">
              <span id="judul-dpp">Pengurus DPP</span>
            </JudulTahap>
            {dpp.length ? (
              <Piramida
                anggota={dpp}
                perBaris={3}
                label="Pengurus DPP"
                kelasSusun={KELAS_SUSUN_DPP}
                kelasBaris={KELAS_BARIS_DPP}
                kartu={(p, indeksBaris) => indeksBaris === 0 ? (
                  <div key={p.id} id={`pengurus-${p.id}`} className={KELAS_KARTU_PUSAT} data-urutan={Number(p.urutan) || 0}>
                    <div className={KELAS_LENCANA_PUSAT}>
                      <Ikon nama="verified_user" className="text-sm" />
                      Pimpinan Pusat
                    </div>
                    <Foto p={p} kelasKotak="w-32 h-32 mx-auto rounded-full bg-surface-variant mb-4 overflow-hidden border-2 border-secondary-fixed-dim mt-2" ukuran="128px" />
                    <h2 className="font-headline-md text-headline-md text-primary mb-1">{p.nama}</h2>
                    <p className="font-label-md text-label-md text-secondary mb-2 uppercase tracking-wide">{p.jabatan}</p>
                    <div className="w-12 h-1 bg-outline-variant mx-auto my-3"></div>
                    <p className="font-body-md text-body-md text-on-surface-variant">{p.deskripsi || 'Memimpin dan mengarahkan seluruh visi serta misi pengawasan nasional.'}</p>
                  </div>
                ) : <KartuPengurus key={p.id} p={p} lencana="Pengurus DPP" ikon="gavel" />}
              />
            ) : null}
          </section>

          {/* Tahap 3: Direktorat — 12 bagian (RUN QA-3 A2) */}
          <section className="mb-16" aria-labelledby="judul-direktorat">
            <JudulTahap keterangan="Dua belas bagian direktorat; setiap bagian dapat berisi Direktur, Wakil Direktur, dan anggota">
              <span id="judul-direktorat">Direktorat</span>
            </JudulTahap>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {direktoratPerBagian.map((b) => (
                <div key={b.slug} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 md:p-5" data-blok={b.slug}>
                  <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Ikon nama="account_circle" className="text-sm" />
                    {b.label}
                  </h3>
                  <Piramida
                    anggota={b.anggota.length ? b.anggota : [{ id: `bagian-${b.slug}`, nama: NAMA_BELUM_TERISI, jabatan: `Direktur ${b.label}`, urutan: 1 }]}
                    perBaris={2}
                    label={b.label}
                    kartu={(p) => <KartuAnggota key={p.id} p={p} kelasTambahan={KELAS_KARTU_PIRAMIDA} />}
                  />
                </div>
              ))}
            </div>
            {direktoratTanpaBagian.length ? (
              <div className="mt-8">
                <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4">Direktorat lain</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {direktoratTanpaBagian.map((p) => <KartuAnggota key={p.id} p={p} />)}
                </div>
              </div>
            ) : null}
          </section>

          {/* Tahap 4: Satgas */}
          <section className="mb-16" aria-labelledby="judul-satgas">
            <JudulTahap keterangan="Kepala Satgas, Wakil, Komandan Wilayah/Daerah/Rayon, dan Anggota">
              <span id="judul-satgas">Satuan Tugas (Satgas)</span>
            </JudulTahap>
            {satgas.length
              ? <Piramida anggota={satgas} perBaris={3} label="Satuan Tugas (Satgas)" kartu={(p) => <KartuAnggota key={p.id} p={p} kelasTambahan={KELAS_KARTU_PIRAMIDA} />} />
              : <KeadaanKosong ikon="campaign" judul="Satgas belum terisi" keterangan="Kepala Satgas dan anggotanya akan tampil setelah ditetapkan oleh pengelola lewat Kelola Pengurus." />}
          </section>

        </>
      )}

      {/* Regional Chapters (desain) */}
      <section id="regional">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant">
          <h2 className="font-headline-lg text-headline-lg text-primary">Pimpinan Regional</h2>
          <div className="flex gap-2">
            <Link
              href={hrefSemuaWilayah}
              className="p-2 bg-surface-container-high rounded border border-outline-variant hover:bg-surface-variant transition-colors"
              aria-label={wilayahDipilih === null ? 'Filter wilayah: menampilkan semua wilayah' : `Hapus filter wilayah ${namaWilayahDipilih ?? ''}`.trim()}
            >
              <Ikon nama="filter_list" />
            </Link>
            <Link
              href={hrefPeta}
              className="p-2 bg-primary text-on-primary rounded hover:bg-primary-container transition-colors"
              aria-label={tampilanPeta ? 'Tutup tampilan peta' : 'Buka tampilan peta'}
            >
              <Ikon nama="map" />
            </Link>
          </div>
        </div>
        {tampilanPeta ? (
          // KEPUTUSAN BARU: tampilan peta tidak digambar Stitch; aset peta tidak ada -> penampung peta dalam kartu berkelas sama.
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col mb-4">
            <Image className="w-full h-full object-cover" src="/penampung/peta-penampung.jpg" alt="Peta jangkauan WARKOP NUSANTARA di seluruh Nusantara" width={1200} height={800} />
          </div>
        ) : null}
        {/* RUN QA-3 A3: Dewan Pimpinan Wilayah — satu kartu per PROVINSI (kerangka + pejabat terisi) */}
        <h3 className="font-headline-md text-headline-md text-primary mb-4">Dewan Pimpinan Wilayah (DPW)</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Satu DPW untuk setiap provinsi. Provinsi yang belum memiliki pengurus ditandai belum terisi.</p>
        {dpwPerProvinsi.length === 0 ? (
          <KeadaanKosong
            ikon="location_on"
            judul="Tidak ada provinsi untuk filter ini"
            keterangan="Coba tampilkan semua wilayah."
          >
            <Link href={hrefSemuaWilayah} className="text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md text-sm">
              Tampilkan semua wilayah <Ikon nama="arrow_forward" className="text-[16px]" />
            </Link>
          </KeadaanKosong>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-16">
            {dpwPerProvinsi.map((w) => (
              <div key={w.id} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 md:p-5">
                <h4 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Ikon nama="location_on" className="text-sm" />
                  <Link href={hrefWilayah(w.id)} className="hover:text-primary transition-colors">{w.nama}</Link>
                </h4>
                <div className="flex flex-col gap-3">
                  {w.anggota.length
                    ? w.anggota.map((p) => <KartuAnggota key={p.id} p={p} />)
                    : <KartuAnggota p={{ id: `dpw-${w.id}`, nama: NAMA_BELUM_TERISI, jabatan: `Ketua DPW ${w.nama}` }} />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RUN QA-3 A3: Koordinator Daerah — kabupaten/kota, dikelompokkan per provinsi induk */}
        <h3 className="font-headline-md text-headline-md text-primary mb-4">Koordinator Daerah</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Koordinator tingkat kabupaten/kota, berada di bawah DPW provinsinya. Daerah ditampilkan setelah koordinatornya ditetapkan.</p>
        {kordaPerProvinsi.length === 0 ? (
          <KeadaanKosong
            ikon="location_on"
            judul="Belum ada koordinator daerah"
            keterangan="Koordinator kabupaten/kota akan tampil di sini setelah ditetapkan oleh pengelola lewat Kelola Pengurus."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {kordaPerProvinsi.map((w) => (
              <div key={w.id}>
                <h4 className="font-label-md text-label-md text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Ikon nama="location_on" className="text-sm" />
                  <Link href={hrefWilayah(w.id)} className="hover:text-primary transition-colors">{w.nama}</Link>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {w.anggota.map((p) => <KartuAnggota key={p.id} p={p} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
