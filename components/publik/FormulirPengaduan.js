'use client';
// components/publik/FormulirPengaduan.js — panel kanan "Formulir Pengaduan Resmi" (client).
// DOM + kelas Tailwind disalin apa adanya dari kontak_pengaduan_warkop_nusantara_updated_logo/code.html
// (REFERENSI 18.2). Perilaku (TAHAP-06 §1–§3):
//   - Kotak anonim dicentang -> keempat input identitas disabled, state-nya dikosongkan, dan saat kirim
//     field identitas TIDAK ADA di FormData (dibangun manual dari susunMuatan(), bukan new FormData(form)).
//   - Honeypot `situs_web` (aria-hidden + sr-only, tabIndex -1) dan `token_formulir` dari server (prop).
//   - Indikator tiga langkah mengikuti bagian yang sedang diisi (fokus / gulir) — formulir tetap satu halaman.
//   - Lampiran: maks 5 berkas, 20 MB/berkas, total 40 MB (validasi klien; server pagar utama), seret-lepas.
//   - "Simpan Draft" -> sessionStorage HANYA kategori/wilayah/deskripsi, tidak pernah identitas.
//   - Setelah 201: panel diganti kartu konfirmasi (nomor kasus besar, salin, tautan /lacak).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Ikon from '@/components/ui/Ikon';
import {
  susunMuatan, validasiKlien, gabungLampiran, formatUkuran, ikonBerkas, KUNCI_DRAF,
} from '@/lib/pengaduanFormulir';

// Kotak pesan: kelas sama seperti components/staf/FormulirLogin.js (KEPUTUSAN BARU Tahap 2, REFERENSI 10).
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_INFO = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// Kelas verbatim dari code.html (dipakai berulang).
const KELAS_INPUT = 'w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0';
const KELAS_BIDANG = 'form-input-focus border-b border-outline-variant transition-colors';
const KELAS_LABEL = 'font-label-md text-label-md text-primary block mb-1';
const KELAS_LINGKARAN_AKTIF = 'w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm';
const KELAS_LINGKARAN_PASIF = 'w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-sm';
const KELAS_LANGKAH_AKTIF = 'font-label-md text-[12px] text-primary';
const KELAS_LANGKAH_PASIF = 'font-label-md text-[12px] text-on-surface-variant';
const KELAS_TOMBOL_GARIS = 'px-6 py-2 rounded-lg font-label-md text-label-md text-primary border border-outline hover:bg-surface-container-high transition-colors';
const KELAS_TOMBOL_KIRIM = 'px-6 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm';

const LANGKAH = [
  { nomor: 1, label: 'Identitas' },
  { nomor: 2, label: 'Detail' },
  { nomor: 3, label: 'Bukti' },
];

// Token formulir harus berumur >= 3 detik di server (lib/tokenFormulir) — tunda bila pelapor terlalu cepat.
const UMUR_TOKEN_MIN_MS = 3_200;

export default function FormulirPengaduan({ tokenFormulir, provinsi = [], kategori = [] }) {
  const [anonim, setAnonim] = useState(false);
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [telepon, setTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [kategoriMasalah, setKategoriMasalah] = useState('');
  const [wilayahId, setWilayahId] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [situsWeb, setSitusWeb] = useState(''); // honeypot, harus tetap kosong
  const [berkas, setBerkas] = useState([]);
  const [langkah, setLangkah] = useState(1);
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'info', teks}
  const [galatBidang, setGalatBidang] = useState(null); // {bidang, pesan}
  const [hasil, setHasil] = useState(null); // balasan 201 {nomorKasus, anonim, lampiran}
  const [tersalin, setTersalin] = useState(false);
  const [seret, setSeret] = useState(false);
  const waktuMuat = useRef(0); // diisi saat terpasang (effect), bukan saat render
  const refBagian = useRef([]);

  // Pulihkan draft (non-identitas) dari sessionStorage saat halaman dibuka lagi — sinkronisasi satu kali
  // dari sistem luar (penyimpanan peramban) ke state; sengaja dilakukan di effect agar HTML server dan
  // klien identik saat hidrasi.
  useEffect(() => {
    waktuMuat.current = Date.now();
    try {
      const mentah = window.sessionStorage.getItem(KUNCI_DRAF);
      if (!mentah) return;
      const draf = JSON.parse(mentah);
      if (draf && typeof draf === 'object') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- pemulihan draft dari sessionStorage (sistem luar), satu kali saat terpasang
        if (typeof draf.kategori === 'string') setKategoriMasalah(draf.kategori);
        if (typeof draf.wilayahId === 'string') setWilayahId(draf.wilayahId);
        if (typeof draf.deskripsi === 'string') setDeskripsi(draf.deskripsi);
        setPesan({ jenis: 'info', teks: 'Draft laporan dipulihkan dari peramban ini (kategori, wilayah, dan deskripsi). Data identitas tidak pernah disimpan.' });
      }
    } catch {
      /* sessionStorage tidak tersedia — abaikan */
    }
  }, []);

  // Indikator langkah mengikuti bagian yang sedang terlihat saat digulir (KEPUTUSAN BARU).
  useEffect(() => {
    if (hasil || typeof IntersectionObserver === 'undefined') return undefined;
    const pengamat = new IntersectionObserver(
      (entri) => {
        const terlihat = entri.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (terlihat.length) setLangkah(Number(terlihat[0].target.dataset.langkah));
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    refBagian.current.forEach((el) => el && pengamat.observe(el));
    return () => pengamat.disconnect();
  }, [hasil]);

  function ubahAnonim(e) {
    const dicentang = e.target.checked;
    setAnonim(dicentang);
    if (dicentang) {
      // Kosongkan identitas dari state — tidak ada yang tersisa untuk dikirim.
      setNama(''); setNik(''); setTelepon(''); setEmail('');
      if (galatBidang && ['nama_pelapor', 'nik_pelapor', 'telepon_pelapor', 'email_pelapor'].includes(galatBidang.bidang)) setGalatBidang(null);
    }
  }

  function tambahBerkas(daftar) {
    const { berkas: gabungan, galat } = gabungLampiran(berkas, Array.from(daftar ?? []));
    setBerkas(gabungan);
    setPesan(galat ? { jenis: 'galat', teks: galat } : null);
  }

  function hapusBerkas(indeks) {
    setBerkas((lama) => lama.filter((_, i) => i !== indeks));
  }

  function simpanDraf() {
    try {
      window.sessionStorage.setItem(KUNCI_DRAF, JSON.stringify({ kategori: kategoriMasalah, wilayahId, deskripsi }));
      setPesan({ jenis: 'info', teks: 'Draft tersimpan di peramban ini (kategori, wilayah, deskripsi). Nama, NIK, telepon, email, dan lampiran TIDAK disimpan.' });
    } catch {
      setPesan({ jenis: 'galat', teks: 'Draft tidak dapat disimpan: penyimpanan peramban tidak tersedia.' });
    }
  }

  function hapusDraf() {
    try { window.sessionStorage.removeItem(KUNCI_DRAF); } catch { /* abaikan */ }
  }

  async function kirim(e) {
    e.preventDefault();
    if (memuat) return;
    setPesan(null);
    setGalatBidang(null);
    const state = { anonim, tokenFormulir, situsWeb, nama, nik, telepon, email, kategori: kategoriMasalah, wilayahId, deskripsi };
    const galatKlien = validasiKlien(state);
    if (galatKlien) {
      setGalatBidang(galatKlien);
      setPesan({ jenis: 'galat', teks: galatKlien.pesan });
      document.getElementById(galatKlien.bidang)?.focus();
      return;
    }
    setMemuat(true);
    try {
      const sisa = UMUR_TOKEN_MIN_MS - (Date.now() - waktuMuat.current);
      if (sisa > 0) await new Promise((selesai) => setTimeout(selesai, sisa));
      // FormData dibangun MANUAL dari state (bukan new FormData(form)): anonim -> identitas tidak ada.
      const formData = new FormData();
      for (const [namaField, nilai] of susunMuatan(state)) formData.append(namaField, nilai);
      for (const b of berkas) formData.append('lampiran', b, b.name);
      const r = await fetch('/api/pengaduan', { method: 'POST', body: formData, credentials: 'same-origin' });
      const data = await r.json().catch(() => ({}));
      if (r.status === 201 && data.nomorKasus) {
        hapusDraf();
        setHasil({ nomorKasus: data.nomorKasus, anonim: Boolean(data.anonim), lampiran: Number(data.lampiran) || 0 });
        window.scrollTo({ top: 0 });
        return;
      }
      if (r.status === 429) {
        setPesan({ jenis: 'galat', teks: data.galat || 'Terlalu banyak kiriman. Coba lagi beberapa saat.' });
      } else if ([400, 413, 415, 422].includes(r.status)) {
        setPesan({ jenis: 'galat', teks: data.galat || 'Laporan belum dapat diterima. Periksa kembali isian Anda.' });
        if (data.bidang) {
          setGalatBidang({ bidang: data.bidang, pesan: data.galat });
          document.getElementById(data.bidang)?.focus();
        }
      } else {
        setPesan({ jenis: 'galat', teks: data.galat || 'Terjadi kesalahan. Silakan coba lagi.' });
      }
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  async function salinNomor() {
    try {
      await navigator.clipboard.writeText(hasil.nomorKasus);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 3000);
    } catch {
      setTersalin(false);
      setPesan({ jenis: 'info', teks: 'Papan klip tidak tersedia, catat nomor kasus di atas secara manual.' });
    }
  }

  const idGalat = (bidang) => (galatBidang?.bidang === bidang ? `galat-${bidang}` : undefined);
  const pesanBidang = (bidang) => (galatBidang?.bidang === bidang
    ? <p id={`galat-${bidang}`} role="alert" className={`${KELAS_PESAN_GALAT} mt-2`}>{galatBidang.pesan}</p>
    : null);

  // ---------- Keadaan konfirmasi (TAHAP-06 §3) — kelas kartu & kepala panel dari layar ini ----------
  if (hasil) {
    return (
      <div className="lg:col-span-8 bg-surface-container-lowest border border-tertiary rounded-lg pressed-paper-shadow" aria-live="polite">
        <div className="bg-primary p-6 rounded-t-lg border-b border-tertiary">
          <h2 className="font-headline-md text-headline-md text-on-primary flex items-center gap-3">
            <Ikon nama="check_circle" className="text-secondary-fixed" terisi />
            Laporan Diterima
          </h2>
          <p className="font-body-md text-body-md text-on-primary-container mt-1">
            {hasil.anonim ? 'Laporan anonim Anda telah tercatat.' : 'Laporan Anda telah tercatat.'}
            {hasil.lampiran > 0 ? ` ${hasil.lampiran} lampiran diterima.` : ''}
          </p>
        </div>
        <div className="p-6 space-y-8">
          <section className="space-y-5">
            <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
              Nomor Kasus Anda
            </h3>
            <p className="font-headline-xl text-headline-xl text-primary" id="nomor-kasus">{hasil.nomorKasus}</p>
            <div className="flex justify-start gap-4">
              <button className={KELAS_TOMBOL_GARIS} type="button" onClick={salinNomor}>
                {tersalin ? 'Tersalin' : 'Salin Nomor'}
              </button>
              <Link className={KELAS_TOMBOL_KIRIM} href={`/lacak?nomor=${encodeURIComponent(hasil.nomorKasus)}`}>
                Lacak Status Laporan
                <Ikon nama="search" className="text-[18px]" />
              </Link>
            </div>
            {pesan && <div role="status" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_INFO}>{pesan.teks}</div>}
          </section>
          <section className="space-y-5 pt-4">
            <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
              Langkah Selanjutnya
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Simpan nomor kasus ini (catat atau tangkap layar). Status laporan dapat dipantau kapan saja di halaman{' '}
              <Link className="font-label-md text-label-md text-primary hover:text-secondary hover:underline transition-colors" href={`/lacak?nomor=${encodeURIComponent(hasil.nomorKasus)}`}>Lacak Laporan</Link>
              {' '}dengan memasukkan nomor kasus di atas.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Perkiraan tindak lanjut: verifikasi awal dalam beberapa hari kerja. Setiap perubahan status tercatat dan dapat dilihat di halaman pelacakan.
            </p>
            {hasil.anonim ? (
              <div className="bg-secondary-fixed/20 border border-secondary-fixed p-4 rounded-lg flex items-center gap-4">
                <div className="bg-secondary text-on-secondary p-3 rounded-full flex-shrink-0">
                  <Ikon nama="security" className="text-[28px]" terisi />
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Laporan Anonim, Simpan Nomor Ini</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Nomor kasus adalah SATU-SATUNYA cara memantau laporan ini. Bila hilang, nomor tidak dapat dipulihkan dengan cara apa pun, karena identitas Anda memang tidak disimpan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-secondary-fixed/20 border border-secondary-fixed p-4 rounded-lg flex items-center gap-4">
                <div className="bg-secondary text-on-secondary p-3 rounded-full flex-shrink-0">
                  <Ikon nama="security" className="text-[28px]" terisi />
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Kerahasiaan Dijamin</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Kontak Anda hanya dipakai petugas berwenang untuk meminta klarifikasi dan tidak pernah ditampilkan di halaman publik.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ---------- Formulir ----------
  return (
    <div className="lg:col-span-8 bg-surface-container-lowest border border-tertiary rounded-lg pressed-paper-shadow">
      {/* Form Header */}
      <div className="bg-primary p-6 rounded-t-lg border-b border-tertiary">
        <h2 className="font-headline-md text-headline-md text-on-primary flex items-center gap-3">
          <Ikon nama="edit_document" className="text-secondary-fixed" terisi />
          Formulir Pengaduan Resmi
        </h2>
        <p className="font-body-md text-body-md text-on-primary-container mt-1">Lengkapi data berikut dengan sebenar-benarnya.</p>
      </div>
      <form className="p-6 space-y-8" onSubmit={kirim} noValidate encType="multipart/form-data">
        <input type="hidden" name="token_formulir" value={tokenFormulir} />
        {/* Honeypot: bot mengisi, manusia tidak melihat */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="situs_web">Situs web (biarkan kosong)</label>
          <input id="situs_web" name="situs_web" type="text" tabIndex={-1} autoComplete="off" value={situsWeb} onChange={(e) => setSitusWeb(e.target.value)} />
        </div>
        {/* Step Indicator (Visual Only) */}
        <div className="flex items-center justify-between relative mb-8" aria-label={`Langkah ${langkah} dari 3`}>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-px bg-outline-variant z-0"></div>
          {LANGKAH.map((l) => (
            <div className="relative z-10 flex flex-col items-center gap-2 bg-surface-container-lowest px-2" key={l.nomor} aria-current={langkah === l.nomor ? 'step' : undefined}>
              <div className={langkah === l.nomor ? KELAS_LINGKARAN_AKTIF : KELAS_LINGKARAN_PASIF}>{l.nomor}</div>
              <span className={langkah === l.nomor ? KELAS_LANGKAH_AKTIF : KELAS_LANGKAH_PASIF}>{l.label}</span>
            </div>
          ))}
        </div>
        {/* Step 1: Identitas Pelapor */}
        <section className="space-y-5" data-langkah="1" ref={(el) => { refBagian.current[0] = el; }} onFocus={() => setLangkah(1)}>
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
            Identitas Pelapor
          </h3>
          {/* Confidentiality Toggle */}
          <div className="bg-surface-container-low p-4 rounded border border-outline-variant flex items-start gap-4">
            <div className="flex items-center h-5 mt-1">
              <input className="w-4 h-4 text-secondary bg-background border-outline rounded focus:ring-secondary focus:ring-2" id="anon-toggle" name="anonim" type="checkbox" checked={anonim} onChange={ubahAnonim} aria-describedby="anon-keterangan" />
            </div>
            <div className="text-sm">
              <label className="font-label-md text-label-md text-primary cursor-pointer" htmlFor="anon-toggle">Sembunyikan Identitas Saya (Laporan Anonim)</label>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1" id="anon-keterangan">Pilih opsi ini jika Anda merasa terancam. Kami menyarankan untuk tetap memberikan kontak agar kami dapat meminta klarifikasi lebih lanjut (kontak akan dirahasiakan).</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="nama_pelapor">Nama Lengkap (Sesuai KTP)</label>
              <input className={KELAS_INPUT} id="nama_pelapor" name="nama_pelapor" placeholder="Masukkan nama lengkap" type="text" autoComplete="name" value={nama} onChange={(e) => setNama(e.target.value)} disabled={anonim || memuat} aria-invalid={galatBidang?.bidang === 'nama_pelapor' || undefined} aria-describedby={idGalat('nama_pelapor')} />
              {pesanBidang('nama_pelapor')}
            </div>
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="nik_pelapor">Nomor Induk Kependudukan (NIK)</label>
              <input className={KELAS_INPUT} id="nik_pelapor" name="nik_pelapor" placeholder="16 digit NIK" type="text" inputMode="numeric" autoComplete="off" value={nik} onChange={(e) => setNik(e.target.value)} disabled={anonim || memuat} aria-invalid={galatBidang?.bidang === 'nik_pelapor' || undefined} aria-describedby={idGalat('nik_pelapor')} />
              {pesanBidang('nik_pelapor')}
            </div>
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="telepon_pelapor">Nomor Telepon / WhatsApp</label>
              <input className={KELAS_INPUT} id="telepon_pelapor" name="telepon_pelapor" placeholder="Contoh: 08123456789" type="tel" autoComplete="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} disabled={anonim || memuat} aria-invalid={galatBidang?.bidang === 'telepon_pelapor' || undefined} aria-describedby={idGalat('telepon_pelapor')} />
              {pesanBidang('telepon_pelapor')}
            </div>
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="email_pelapor">Alamat Email</label>
              <input className={KELAS_INPUT} id="email_pelapor" name="email_pelapor" placeholder="email@contoh.com" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={anonim || memuat} aria-invalid={galatBidang?.bidang === 'email_pelapor' || undefined} aria-describedby={idGalat('email_pelapor')} />
              {pesanBidang('email_pelapor')}
            </div>
          </div>
        </section>
        {/* Step 2: Detail Laporan */}
        <section className="space-y-5 pt-4" data-langkah="2" ref={(el) => { refBagian.current[1] = el; }} onFocus={() => setLangkah(2)}>
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
            Detail Laporan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="kategori_masalah">Kategori Masalah</label>
              <select className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0 appearance-none cursor-pointer" id="kategori_masalah" name="kategori_masalah" value={kategoriMasalah} onChange={(e) => setKategoriMasalah(e.target.value)} disabled={memuat} required aria-invalid={galatBidang?.bidang === 'kategori_masalah' || undefined} aria-describedby={idGalat('kategori_masalah')}>
                <option disabled value="">Pilih Kategori...</option>
                {kategori.map((k) => (
                  <option value={k.slug} key={k.slug}>{k.label}</option>
                ))}
              </select>
              {pesanBidang('kategori_masalah')}
            </div>
            <div className={KELAS_BIDANG}>
              <label className={KELAS_LABEL} htmlFor="wilayah_id">Wilayah Kejadian</label>
              <select className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0 appearance-none cursor-pointer" id="wilayah_id" name="wilayah_id" value={wilayahId} onChange={(e) => setWilayahId(e.target.value)} disabled={memuat} aria-invalid={galatBidang?.bidang === 'wilayah_id' || undefined} aria-describedby={idGalat('wilayah_id')}>
                <option value="">Provinsi / Kota / Kabupaten</option>
                {provinsi.map((w) => (
                  <option value={String(w.id)} key={w.id}>{w.nama}</option>
                ))}
              </select>
              {pesanBidang('wilayah_id')}
            </div>
          </div>
          <div className={KELAS_BIDANG}>
            <label className="font-label-md text-label-md text-primary block mb-2" htmlFor="deskripsi">Deskripsi Lengkap Kejadian</label>
            <textarea className="w-full bg-transparent border border-outline-variant rounded p-3 focus:border-secondary focus:ring-0 font-body-md text-body-md text-on-surface" id="deskripsi" name="deskripsi" placeholder="Ceritakan kronologi kejadian secara detail: Siapa yang terlibat? Kapan terjadinya? Bagaimana situasinya?" rows={5} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} disabled={memuat} required minLength={30} maxLength={10000} aria-invalid={galatBidang?.bidang === 'deskripsi' || undefined} aria-describedby={idGalat('deskripsi')}></textarea>
            {pesanBidang('deskripsi')}
          </div>
        </section>
        {/* Step 3: Bukti Pendukung */}
        <section className="space-y-5 pt-4" data-langkah="3" ref={(el) => { refBagian.current[2] = el; }} onFocus={() => setLangkah(3)}>
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
            Bukti Pendukung
          </h3>
          <label htmlFor="lampiran" className="block">
            <div
              className={`border-2 border-dashed border-outline-variant rounded-lg p-8 text-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group${seret ? ' bg-surface-container-high' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
              onDragLeave={() => setSeret(false)}
              onDrop={(e) => { e.preventDefault(); setSeret(false); tambahBerkas(e.dataTransfer?.files); }}
            >
              <div className="mx-auto w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ikon nama="cloud_upload" className="text-primary text-3xl" />
              </div>
              <p className="font-label-md text-label-md text-primary mb-1">Klik untuk unggah atau seret file ke sini</p>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">Mendukung format: JPG, PNG, PDF, MP4 (Maks. 20MB per file)</p>
              <input
                className="sr-only"
                id="lampiran"
                name="lampiran"
                multiple
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.mp4"
                disabled={memuat}
                onChange={(e) => { tambahBerkas(e.target.files); e.target.value = ''; }}
              />
            </div>
          </label>
          {/* File List Placeholder */}
          <div className={berkas.length ? 'space-y-2' : 'space-y-2 hidden'} id="file-list" aria-live="polite">
            {berkas.map((b, i) => (
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded border border-outline-variant" key={`${b.name}-${b.size}-${i}`}>
                <div className="flex items-center gap-3">
                  <Ikon nama={ikonBerkas(b.name)} className="text-on-surface-variant" />
                  <span className="font-body-md text-body-md text-sm text-on-surface">{b.name} ({formatUkuran(b.size)})</span>
                </div>
                <button className="text-error hover:text-on-error-container" type="button" onClick={() => hapusBerkas(i)} aria-label={`Hapus lampiran ${b.name}`} disabled={memuat}>
                  <Ikon nama="delete" />
                </button>
              </div>
            ))}
          </div>
        </section>
        {pesan && (
          <div role="alert" aria-live="polite" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_INFO}>
            {pesan.teks}
          </div>
        )}
        {/* Form Actions */}
        <div className="pt-6 border-t border-outline-variant flex justify-end gap-4">
          <button className={KELAS_TOMBOL_GARIS} type="button" onClick={simpanDraf} disabled={memuat}>
            Simpan Draft
          </button>
          <button className={`${KELAS_TOMBOL_KIRIM} disabled:opacity-70`} type="submit" disabled={memuat} aria-busy={memuat}>
            {memuat ? 'Mengirim…' : 'Kirim Laporan Resmi'}
            <Ikon nama="send" className="text-[18px]" />
          </button>
        </div>
      </form>
    </div>
  );
}
