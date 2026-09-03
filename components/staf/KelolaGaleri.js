'use client';
// components/staf/KelolaGaleri.js — Kelola Galeri (client): grid kartu berpratinjau + formulir tambah/ubah +
// hapus dengan konfirmasi Dialog. Layar ini TIDAK ada di ZIP -> REFERENSI 18.4, disusun HANYA dari kelas yang
// ada di layar staf/galeri ZIP:
//   - header halaman & tombol tambah      : kelola_artikel_admin/code.html (header "Kelola Artikel", tombol post_add)
//   - panel formulir, input berlabel apung,
//     kotak unggah putus-putus, tombol     : editor_artikel_admin/code.html (Title & Meta Inputs, Featured Image Upload,
//                                            tombol Simpan Draf / Terbitkan, panel "Pengaturan Publikasi")
//   - kartu grid                           : galeri_dokumentasi/code.html (Item 2 = kartu foto kecil, Item 3 = kartu
//                                            video dengan tombol putar); lencana kategori lewat components/ui/Lencana
//   - kotak pesan galat/sukses             : FormulirLogin (bg-error-container … / bg-secondary-fixed …)
// Berkas dikirim MULTIPART (FormData) ke POST /api/staf/galeri dan PATCH /api/staf/galeri/<id> — JSON tidak dipakai
// bila ada berkas. Galat 413/415/422 dari API ditampilkan apa adanya.
//
// KEPUTUSAN BARU (tidak diatur dokumen):
//   1. Formulir = panel INLINE di atas grid (bukan Dialog) memakai kelas panel editor_artikel; digulir ke pandangan
//      saat dibuka. Hapus tetap lewat Dialog (preseden AksiArtikel).
//   2. Tombol ubah/hapus kartu = ikon di pojok kanan atas kartu: pembungkus `absolute top-0 right-0 p-2 z-10`,
//      tombol `rounded-full bg-primary/70 text-on-primary hover:text-secondary-container transition-colors p-2`
//      (kelas tombol pencarian navbar galeri_dokumentasi + lapisan bg-primary/70 kartu video) agar terbaca di atas foto.
//   3. Kartu video tanpa thumbnail memakai penampung /logo-warkop-besar.png + ikon play_arrow; lingkaran putar menjadi
//      tautan ke berkas video (preseden halaman publik /galeri).
//   4. Thumbnail video TIDAK dibangkitkan otomatis (tidak ada ffmpeg/paket video yang diizinkan) — keterangan tampil
//      di kotak unggah thumbnail. Pratinjau gambar terpilih memakai URL objek peramban (dibersihkan saat diganti/ditutup).
//   5. Ukuran berkas diperiksa juga di peramban (> batas -> pesan seperti 413) agar unggahan besar tidak dikirim sia-sia;
//      pagar sesungguhnya tetap API (413/415).
//   6. Semua bidang SELALU dikirim saat PATCH (termasuk tanggal_kegiatan kosong) sehingga nilai lama dari server tidak
//      dipakai ulang secara diam-diam.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import Dialog from '@/components/ui/Dialog';
import Lencana, { varianLencanaGaleri } from '@/components/ui/Lencana';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';

// Kotak pesan (kelas yang sama dengan FormulirLogin — KEPUTUSAN BARU Tahap 2)
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// Kelas VERBATIM editor_artikel_admin (input berlabel apung, kotak unggah, tombol)
const KELAS_LABEL_APUNG = 'absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant';
const KELAS_INPUT_KOTAK = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent';
const KELAS_SELECT_KOTAK = `${KELAS_INPUT_KOTAK} appearance-none`;
const KELAS_KOTAK_UNGGAH = 'bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm flex flex-col items-center justify-center border-dashed gap-3 min-h-[200px] cursor-pointer hover:bg-surface-container-low transition-colors group';
const KELAS_TOMBOL_GARIS = 'px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors';
const KELAS_TOMBOL_UTAMA = 'px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]';
// Tombol aksi di atas kartu (KEPUTUSAN BARU 2)
const KELAS_AKSI_KARTU = 'rounded-full bg-primary/70 text-on-primary hover:text-secondary-container transition-colors p-2';
const KELAS_AKSI_KARTU_HAPUS = 'rounded-full bg-primary/70 text-on-primary hover:text-error transition-colors p-2';

const TERIMA_GAMBAR = 'image/jpeg,image/png,image/webp';
const TERIMA_VIDEO = 'video/mp4';
const PENAMPUNG_VIDEO = '/logo-warkop-besar.png';

function formulirKosong() {
  return { judul: '', deskripsi: '', jenis: 'foto', kategori: '', wilayah_id: '', lokasi: '', tanggal_kegiatan: '' };
}
function formulirDari(g) {
  return { judul: g.judul, deskripsi: g.deskripsi ?? '', jenis: g.jenis, kategori: g.kategori, wilayah_id: g.wilayah_id ?? '', lokasi: g.lokasi ?? '', tanggal_kegiatan: g.tanggal_kegiatan ?? '' };
}
function ukuranMb(byte) {
  return `${(byte / 1024 / 1024).toFixed(1)} MB`;
}
async function bacaBalasan(r) {
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}
function teksGalat(data, status, cadangan) {
  if (data?.galat) return `${data.galat}${data.kode ? ` (${data.kode})` : ''}`;
  if (status === 413) return 'Berkas terlalu besar untuk diunggah (HTTP 413).';
  if (status === 415) return 'Jenis berkas tidak didukung (HTTP 415).';
  return `${cadangan} (HTTP ${status}).`;
}

/** Gambar kartu: thumbnail bila ada, lalu berkas foto; video tanpa thumbnail memakai penampung logo. */
function gambarKartu(g) {
  if (g.thumbnail) return g.thumbnail;
  if (g.jenis === 'video') return PENAMPUNG_VIDEO;
  return g.berkas;
}

/** Pratinjau URL objek untuk berkas gambar yang dipilih di peramban; dibersihkan otomatis. */
function usePratinjauBerkas(berkas) {
  const url = useMemo(() => (berkas && berkas.type.startsWith('image/') ? URL.createObjectURL(berkas) : null), [berkas]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

/** Kotak unggah putus-putus (editor_artikel_admin "Featured Image Upload") dengan pratinjau. */
function KotakUnggah({ id, nama, label, keterangan, accept, berkas, onPilih, jalurLama, jenisLama, disabled, galat }) {
  const pratinjau = usePratinjauBerkas(berkas);
  const gambarLama = jalurLama && jenisLama !== 'video' ? jalurLama : null;
  const tampilGambar = pratinjau ?? gambarLama;
  const ikon = jenisLama === 'video' || accept === TERIMA_VIDEO ? 'play_arrow' : 'add_photo_alternate';
  return (
    <label htmlFor={id} className={`${KELAS_KOTAK_UNGGAH} flex-1`}>
      <input type="file" accept={accept} className="sr-only" id={id} name={nama} onChange={onPilih} disabled={disabled} />
      {tampilGambar ? (
        <Image src={tampilGambar} alt={`Pratinjau ${label.toLowerCase()}`} width={1200} height={800} unoptimized className="max-h-[200px] w-auto rounded-lg object-contain" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
          <Ikon nama={ikon} className="text-primary text-[24px]" />
        </div>
      )}
      <div className="text-center">
        <p className="font-label-md text-label-md text-primary mb-1">{tampilGambar || jalurLama ? `Ganti ${label}` : `Unggah ${label}`}</p>
        <p className="font-body-md text-[14px] text-outline">{keterangan}</p>
        {berkas ? <p className="font-body-md text-[14px] text-outline">{berkas.name} · {ukuranMb(berkas.size)}</p> : null}
        {!berkas && jalurLama ? <p className="font-body-md text-[14px] text-outline">Berkas saat ini: {jalurLama}</p> : null}
        {galat ? <p role="alert" className={KELAS_PESAN_GALAT}>{galat}</p> : null}
      </div>
    </label>
  );
}

export default function KelolaGaleri({ item = [], total = 0, wilayah = [], kategori = [], bolehKelola = false, batasMb = 20 }) {
  const router = useRouter();
  const [formulir, setFormulir] = useState(null); // null | { id: number|null, nilai, lama }
  const [berkas, setBerkas] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [galatBerkas, setGalatBerkas] = useState(null);
  const [galatThumbnail, setGalatThumbnail] = useState(null);
  const [hapus, setHapus] = useState(null); // item yang akan dihapus
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'sukses', teks}
  const [galatHapus, setGalatHapus] = useState(null);
  const [kaliBuka, setKaliBuka] = useState(0); // bertambah setiap formulir dibuka -> pemicu gulir (bukan tiap ketikan)
  const panelRef = useRef(null);
  const batasByte = batasMb * 1024 * 1024;

  useEffect(() => {
    if (kaliBuka > 0 && panelRef.current) panelRef.current.scrollIntoView({ block: 'start' });
  }, [kaliBuka]);

  function bersihkanBerkas() {
    setBerkas(null);
    setThumbnail(null);
    setGalatBerkas(null);
    setGalatThumbnail(null);
  }
  function bukaTambah() {
    setPesan(null);
    bersihkanBerkas();
    setFormulir({ id: null, nilai: formulirKosong(), lama: null });
    setKaliBuka((n) => n + 1);
  }
  function bukaUbah(g) {
    setPesan(null);
    bersihkanBerkas();
    setFormulir({ id: g.id, nilai: formulirDari(g), lama: g });
    setKaliBuka((n) => n + 1);
  }
  function tutupFormulir() {
    if (sibuk) return;
    setFormulir(null);
    bersihkanBerkas();
  }
  function ubahNilai(kunci, nilai) {
    setFormulir((f) => (f ? { ...f, nilai: { ...f.nilai, [kunci]: nilai } } : f));
  }
  function ubahJenis(jenis) {
    // Berkas yang sudah dipilih dibuang karena accept-nya berubah (foto <-> video)
    setBerkas(null);
    setGalatBerkas(null);
    ubahNilai('jenis', jenis);
  }
  function pilihBerkas(e) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    setGalatBerkas(null);
    if (f && f.size > batasByte) {
      setBerkas(null);
      setGalatBerkas(`Berkas melebihi batas ${batasMb} MB (${ukuranMb(f.size)})`);
      return;
    }
    setBerkas(f);
  }
  function pilihThumbnail(e) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    setGalatThumbnail(null);
    if (f && f.size > batasByte) {
      setThumbnail(null);
      setGalatThumbnail(`Thumbnail melebihi batas ${batasMb} MB (${ukuranMb(f.size)})`);
      return;
    }
    setThumbnail(f);
  }

  async function simpan(e) {
    e.preventDefault();
    if (!formulir || sibuk) return;
    const { id, nilai } = formulir;
    if (!id && !berkas) {
      setGalatBerkas('Berkas foto/video wajib diunggah');
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      // Multipart selalu dipakai (API menerima multipart dengan/tanpa berkas); JSON tidak dipakai bila ada berkas.
      const form = new FormData();
      form.append('judul', nilai.judul.trim());
      form.append('deskripsi', nilai.deskripsi.trim());
      form.append('jenis', nilai.jenis);
      form.append('kategori', nilai.kategori);
      form.append('wilayah_id', nilai.wilayah_id);
      form.append('lokasi', nilai.lokasi.trim());
      form.append('tanggal_kegiatan', nilai.tanggal_kegiatan);
      if (berkas) form.append('berkas', berkas);
      if (thumbnail) form.append('thumbnail', thumbnail);
      const r = await fetch(id ? `/api/staf/galeri/${id}` : '/api/staf/galeri', { method: id ? 'PATCH' : 'POST', body: form, credentials: 'same-origin' });
      const { ok, status, data } = await bacaBalasan(r);
      if (!ok) {
        const teks = teksGalat(data, status, id ? 'Dokumentasi tidak dapat disimpan' : 'Dokumentasi tidak dapat ditambahkan');
        if (data?.bidang === 'berkas' || status === 413 || status === 415) setGalatBerkas(teks);
        else setPesan({ jenis: 'galat', teks });
        return;
      }
      const judulTersimpan = data.galeri?.judul ?? nilai.judul;
      setFormulir(null);
      bersihkanBerkas();
      setPesan({ jenis: 'sukses', teks: id ? `Dokumentasi "${judulTersimpan}" diperbarui.` : `Dokumentasi "${judulTersimpan}" ditambahkan.` });
      router.refresh();
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.' });
    } finally {
      setSibuk(false);
    }
  }

  function tutupHapus() {
    if (sibuk) return;
    setHapus(null);
    setGalatHapus(null);
  }
  async function jalankanHapus() {
    if (!hapus || sibuk) return;
    setSibuk(true);
    setGalatHapus(null);
    try {
      const r = await fetch(`/api/staf/galeri/${hapus.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { accept: 'application/json' } });
      const { ok, status, data } = await bacaBalasan(r);
      if (!ok) {
        setGalatHapus(teksGalat(data, status, 'Gagal menghapus dokumentasi'));
        return;
      }
      setPesan({ jenis: 'sukses', teks: `Dokumentasi "${hapus.judul}" dihapus.` });
      if (formulir?.id === hapus.id) setFormulir(null);
      setHapus(null);
      router.refresh();
    } catch {
      setGalatHapus('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  const nilai = formulir?.nilai;
  const modeUbah = Boolean(formulir?.id);
  const jenisVideo = nilai?.jenis === 'video';

  return (
    // KEPUTUSAN BARU (preseden Kelola Artikel): <main> desain digantikan <main> layout staf; padding
    // p-margin-desktop dibawa pembungkus ini; min-h-screen (=100vh, aturan 5) tidak disalin.
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section — kelola_artikel_admin */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Kelola Galeri</h2>
            <p className="text-on-surface-variant mt-2">Dokumentasi foto dan video kegiatan yang tampil di halaman Galeri publik.</p>
          </div>
          {bolehKelola ? (
            <button
              type="button"
              className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2"
              style={{ boxShadow: '0 4px 6px -1px rgba(233, 195, 73, 0.2)' }}
              onClick={bukaTambah}
              disabled={sibuk}
            >
              <Ikon nama="add_photo_alternate" />
              Tambah Dokumentasi
            </button>
          ) : null}
        </header>

        {pesan ? (
          <div role="alert" aria-live="polite" className={`${pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES} mb-6`}>{pesan.teks}</div>
        ) : null}

        {/* Formulir tambah/ubah — panel editor_artikel_admin (KEPUTUSAN BARU 1) */}
        {bolehKelola && formulir ? (
          <form ref={panelRef} onSubmit={simpan} className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm mb-8" aria-labelledby="judul-formulir-galeri" encType="multipart/form-data">
            <h3 id="judul-formulir-galeri" className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <Ikon nama={modeUbah ? 'edit' : 'add_photo_alternate'} />
              {modeUbah ? 'Ubah Dokumentasi' : 'Tambah Dokumentasi'}
            </h3>
            <div className="space-y-5">
              <div className="relative">
                <label className={KELAS_LABEL_APUNG} htmlFor="galeri-judul">Judul</label>
                <input className={KELAS_INPUT_KOTAK} id="galeri-judul" name="judul" type="text" placeholder="Masukkan Judul Dokumentasi..." value={nilai.judul} onChange={(e) => ubahNilai('judul', e.target.value)} maxLength={255} minLength={3} required disabled={sibuk} />
              </div>
              <div className="relative">
                <label className={KELAS_LABEL_APUNG} htmlFor="galeri-deskripsi">Deskripsi</label>
                <textarea className={KELAS_INPUT_KOTAK} id="galeri-deskripsi" name="deskripsi" rows={3} placeholder="Keterangan singkat kegiatan..." value={nilai.deskripsi} onChange={(e) => ubahNilai('deskripsi', e.target.value)} maxLength={2000} disabled={sibuk} />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_APUNG} htmlFor="galeri-jenis">Jenis</label>
                  <select className={KELAS_SELECT_KOTAK} id="galeri-jenis" name="jenis" value={nilai.jenis} onChange={(e) => ubahJenis(e.target.value)} disabled={sibuk}>
                    <option value="foto">Foto</option>
                    <option value="video">Video</option>
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_APUNG} htmlFor="galeri-kategori">Kategori</label>
                  <select className={KELAS_SELECT_KOTAK} id="galeri-kategori" name="kategori" value={nilai.kategori} onChange={(e) => ubahNilai('kategori', e.target.value)} required disabled={sibuk}>
                    <option disabled value="">Pilih Kategori</option>
                    {kategori.map((k) => (
                      <option key={k.slug} value={k.slug}>{k.label}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_APUNG} htmlFor="galeri-wilayah">Wilayah</label>
                  <select className={KELAS_SELECT_KOTAK} id="galeri-wilayah" name="wilayah_id" value={nilai.wilayah_id} onChange={(e) => ubahNilai('wilayah_id', e.target.value)} disabled={sibuk}>
                    <option value="">Pilih Wilayah Terkait</option>
                    {wilayah.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.nama}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_APUNG} htmlFor="galeri-lokasi">Lokasi</label>
                  <input className={KELAS_INPUT_KOTAK} id="galeri-lokasi" name="lokasi" type="text" placeholder="Mis. Balai Desa, Kab. Bogor" value={nilai.lokasi} onChange={(e) => ubahNilai('lokasi', e.target.value)} maxLength={200} disabled={sibuk} />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_APUNG} htmlFor="galeri-tanggal">Tanggal Kegiatan</label>
                  <input className={KELAS_INPUT_KOTAK} id="galeri-tanggal" name="tanggal_kegiatan" type="date" value={nilai.tanggal_kegiatan} onChange={(e) => ubahNilai('tanggal_kegiatan', e.target.value)} disabled={sibuk} />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <KotakUnggah
                  id="galeri-berkas"
                  nama="berkas"
                  label={jenisVideo ? 'Berkas Video' : 'Berkas Foto'}
                  keterangan={jenisVideo ? `Format MP4. Maks ${batasMb}MB.` : `Format JPG, PNG, atau WEBP. Maks ${batasMb}MB.`}
                  accept={jenisVideo ? TERIMA_VIDEO : TERIMA_GAMBAR}
                  berkas={berkas}
                  onPilih={pilihBerkas}
                  jalurLama={modeUbah && formulir.lama.jenis === nilai.jenis ? formulir.lama.berkas : null}
                  jenisLama={nilai.jenis}
                  disabled={sibuk}
                  galat={galatBerkas}
                />
                <KotakUnggah
                  id="galeri-thumbnail"
                  nama="thumbnail"
                  label="Thumbnail (Opsional)"
                  keterangan={jenisVideo
                    ? `Format JPG, PNG, atau WEBP. Maks ${batasMb}MB. Thumbnail video tidak dibangkitkan otomatis — unggah gambar sampul sendiri; tanpa thumbnail kartu memakai penampung logo.`
                    : `Format JPG, PNG, atau WEBP. Maks ${batasMb}MB. Bila kosong, kartu memakai berkas foto.`}
                  accept={TERIMA_GAMBAR}
                  berkas={thumbnail}
                  onPilih={pilihThumbnail}
                  jalurLama={modeUbah ? formulir.lama.thumbnail : null}
                  jenisLama="foto"
                  disabled={sibuk}
                  galat={galatThumbnail}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="font-body-md text-[14px] text-outline">Perubahan langsung tampil di halaman Galeri publik.</p>
                <div className="flex items-center gap-3">
                  <button type="button" className={KELAS_TOMBOL_GARIS} onClick={tutupFormulir} disabled={sibuk}>Batal</button>
                  <button type="submit" className={KELAS_TOMBOL_UTAMA} disabled={sibuk} aria-busy={sibuk}>
                    {sibuk ? 'Menyimpan…' : modeUbah ? 'Simpan Perubahan' : 'Simpan Dokumentasi'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}

        {/* Grid kartu — galeri_dokumentasi (kartu kecil Item 2 / kartu video Item 3) */}
        {item.length === 0 ? (
          <KeadaanKosong ikon="image" judul="Belum ada dokumentasi" keterangan={bolehKelola ? 'Tambahkan foto atau video kegiatan lewat tombol "Tambah Dokumentasi".' : 'Dokumentasi kegiatan akan tampil di sini setelah diunggah redaktur.'} />
        ) : (
          <>
            <p className="text-on-surface-variant mt-2 mb-6">Menampilkan {item.length} dari {total} dokumentasi</p>
            <section className="grid grid-cols-1 md:grid-cols-12 gap-unit auto-rows-[250px]" aria-label="Daftar dokumentasi">
              {item.map((g) => {
                const kat = kategori.find((k) => k.slug === g.kategori) ?? { slug: g.kategori, label: g.kategori, lencana: 'abu' };
                const video = g.jenis === 'video';
                const lokasi = g.lokasi || g.wilayah_nama || null;
                return (
                  <article key={g.id} className={`md:col-span-4 md:row-span-1 relative group overflow-hidden rounded-lg border border-tertiary-fixed-dim bg-surface${video ? ' flex items-center justify-center' : ''}`}>
                    <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105${video ? ' opacity-60' : ''}`} role="img" aria-label={`${g.judul} — ${kat.label}`} style={{ backgroundImage: `url('${gambarKartu(g)}')` }}></div>
                    {video
                      ? <div className="absolute inset-0 bg-primary/70 group-hover:bg-primary/60 transition-colors"></div>
                      : <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>}
                    {video ? (
                      /* Play Button Overlay for Video */
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <a href={g.berkas} target="_blank" rel="noopener noreferrer" aria-label={`Putar video: ${g.judul}`} className="w-16 h-16 rounded-full bg-secondary-fixed/90 flex items-center justify-center shadow-lg border-2 border-secondary pointer-events-auto">
                          <Ikon nama="play_arrow" className="text-on-secondary-fixed-variant text-3xl" />
                        </a>
                      </div>
                    ) : null}
                    {bolehKelola ? (
                      <div className="absolute top-0 right-0 p-2 z-10 flex items-center gap-1">
                        <button type="button" className={KELAS_AKSI_KARTU} title="Edit" aria-label={`Ubah dokumentasi ${g.judul}`} onClick={() => bukaUbah(g)} disabled={sibuk}>
                          <Ikon nama="edit" className="text-xl" />
                        </button>
                        <button type="button" className={KELAS_AKSI_KARTU_HAPUS} title="Delete" aria-label={`Hapus dokumentasi ${g.judul}`} onClick={() => { setGalatHapus(null); setHapus(g); }} disabled={sibuk}>
                          <Ikon nama="delete" className="text-xl" />
                        </button>
                      </div>
                    ) : null}
                    <div className={`absolute bottom-0 left-0 p-4 w-full${video ? ' z-10' : ''}`}>
                      <Lencana varian={varianLencanaGaleri(kat.lencana)}>{kat.label}</Lencana>
                      <h3 className="font-headline-md text-[18px] leading-tight text-on-primary mb-1">{g.judul}</h3>
                      <div className="flex items-center gap-2 mt-2 text-outline-variant text-xs font-label-md">
                        {g.tanggalTampil ? <span className="flex items-center gap-1"><Ikon nama="event" className="text-[14px]" /> {g.tanggalTampil}</span> : null}
                        {lokasi ? <span className="flex items-center gap-1"><Ikon nama="location_on" className="text-[14px]" /> {lokasi}</span> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>

      {/* Dialog hapus — preseden AksiArtikel */}
      <Dialog terbuka={Boolean(hapus)} onTutup={tutupHapus} judul="Hapus Dokumentasi">
        <p className="font-body-md text-body-md text-on-surface">
          Dokumentasi <strong>{hapus?.judul}</strong> akan dihapus permanen dari galeri publik. Tindakan ini tidak dapat dibatalkan.
        </p>
        {galatHapus ? <p className="font-body-md text-body-md text-error mt-4" role="alert">{galatHapus}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={`${KELAS_TOMBOL.ringkas} px-4`} onClick={tutupHapus} disabled={sibuk}>Batal</button>
          <button type="button" className={KELAS_TOMBOL.kirim} onClick={jalankanHapus} disabled={sibuk}>
            <Ikon nama="delete" />
            {sibuk ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
