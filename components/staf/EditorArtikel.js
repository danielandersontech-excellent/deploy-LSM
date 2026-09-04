'use client';
// components/staf/EditorArtikel.js — editor artikel (client). DOM + kelas Tailwind VERBATIM dari
// desain/stitch_portal_berita_inklusif/editor_artikel_admin/code.html (isi <main>, tanpa sidebar —
// sidebar kanonik dirender app/(staf)/staf/layout.js). Dipakai oleh:
//   app/(staf)/staf/artikel/baru/page.js  (artikel = null  -> POST  /api/staf/artikel)
//   app/(staf)/staf/artikel/[id]/page.js  (artikel terisi -> PATCH /api/staf/artikel/<id>)
//
// KEPUTUSAN BARU (tidak diatur dokumen):
//   1. Area tulis = div[contentEditable] + document.execCommand — TANPA paket editor (aturan paket npm).
//      Isi dikirim sebagai innerHTML; SANITASI SESUNGGUHNYA di server (lib/validasi/artikel.js ->
//      lib/sanitasi.js). Editor hanya membuang penampung placeholder sebelum kirim.
//   2. Desain tidak punya kolom ringkasan -> editor mengirim ringkasan: '' pada setiap simpan sehingga
//      server SELALU menurunkannya dari isi terbaru (validasiMuatanArtikel: teksPolos(isi, 200)).
//   3. Toggle Draf/Publik hanya INDIKATOR status ('draf' -> Draf aktif, 'terbit' -> Publik aktif,
//      'arsip' -> tidak ada yang aktif + teks sr-only "Status: Arsip"); menerbitkan hanya lewat tombol
//      "Terbitkan" (API /terbitkan). Tanggal Publikasi = terbit_pada (WIB) baca-saja karena diisi server.
//   4. "Penulis (Opsional)" = nama penulis baca-saja (penulis ditentukan sesi, bukan diketik).
//   5. Opsi kosong "Pilih Wilayah Terkait" TIDAK disabled (wilayah opsional di API, harus bisa dikosongkan);
//      "Pilih Kategori" tetap disabled (kategori wajib, aturan 7).
//   6. Setelah POST sukses -> router.replace('/staf/artikel/<id>?tersimpan=1' | '?terbit=1') agar pesan
//      sukses tetap tampil setelah berpindah rute (state klien hilang saat page.js berganti).
//   7. Pratinjau gambar utama (keadaan yang tidak digambar desain): <Image> di dalam kotak putus-putus,
//      kelas `max-h-[200px] w-auto rounded-lg object-contain` (radius/objek dari kelas yang sudah ada di ZIP).
//   8. Tombol hapus chip tag = <button aria-label> membungkus <Ikon nama="close" /> (desain: span ikon).
//   9. Tautan publik memakai dasar NEXT_PUBLIC_APP_URL (host staf tidak melayani /berita — proxy.js).
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';

// Kotak pesan (kelas yang sama dengan FormulirLogin — KEPUTUSAN BARU Tahap 2)
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

const PENAMPUNG_ISI = '<p class="text-outline" data-penampung="1">Mulai menulis isi artikel di sini...</p>';
const KELAS_TOMBOL_TOOLBAR = 'p-2 rounded hover:bg-surface-variant text-on-surface-variant transition-colors';
const KELAS_CHIP = 'inline-flex items-center gap-1 bg-secondary-fixed-dim text-on-secondary-fixed-variant px-2 py-1 rounded font-label-md text-[12px]';
const KELAS_STATUS_AKTIF = 'flex-1 py-1.5 rounded-md text-center font-label-md text-[13px] bg-surface-container-lowest text-primary shadow-sm border border-outline-variant transition-all';
const KELAS_STATUS_PASIF = 'flex-1 py-1.5 rounded-md text-center font-label-md text-[13px] text-on-surface-variant hover:text-primary transition-all';

/** ISO (UTC) -> "YYYY-MM-DDTHH:mm" dalam WIB, tanpa bergantung zona waktu peramban. */
function keDatetimeLocalWIB(iso) {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const w = new Date(t.getTime() + 7 * 60 * 60 * 1000);
  const d = (n) => String(n).padStart(2, '0');
  return `${w.getUTCFullYear()}-${d(w.getUTCMonth() + 1)}-${d(w.getUTCDate())}T${d(w.getUTCHours())}:${d(w.getUTCMinutes())}`;
}

async function bacaBalasan(r) {
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export default function EditorArtikel({
  artikel = null,
  tag = [],
  kategori = [],
  wilayah = [],
  bolehTerbitkan = false,
  bolehSunting = true,
  penulisNama = '',
  dasarUrlPublik = '',
  pesanAwal = null,
}) {
  const router = useRouter();
  const [judul, setJudul] = useState(artikel?.judul ?? '');
  const [kategoriId, setKategoriId] = useState(artikel?.kategori_id ? String(artikel.kategori_id) : '');
  const [wilayahId, setWilayahId] = useState(artikel?.wilayah_id ? String(artikel.wilayah_id) : '');
  const [gambarUtama, setGambarUtama] = useState(artikel?.gambar_utama ?? null);
  const [daftarTag, setDaftarTag] = useState(() => tag.map((t) => (typeof t === 'string' ? t : t.nama)).filter(Boolean));
  const [tagBaru, setTagBaru] = useState('');
  const [status, setStatus] = useState(artikel?.status ?? 'draf');
  const [slug, setSlug] = useState(artikel?.slug ?? '');
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState(pesanAwal); // {jenis:'galat'|'sukses', teks, tautan?}
  const [galatUnggah, setGalatUnggah] = useState(null);
  const isiRef = useRef(null);
  const inputSisipRef = useRef(null);
  // innerHTML awal dipasang SEKALI (useMemo agar React tidak menulis ulang saat re-render)
  const isiAwal = useMemo(() => (artikel?.isi && artikel.isi.trim() ? artikel.isi : PENAMPUNG_ISI), [artikel?.isi]);

  const modeSunting = Boolean(artikel?.id);
  const terkunci = memuat || !bolehSunting;
  const tanggalTerbit = keDatetimeLocalWIB(artikel?.terbit_pada);

  // --- area tulis -----------------------------------------------------------
  function adaPenampung() {
    return Boolean(isiRef.current?.querySelector('[data-penampung]'));
  }
  function saatFokusIsi() {
    if (adaPenampung()) isiRef.current.innerHTML = '<p><br></p>';
  }
  function saatBlurIsi() {
    const el = isiRef.current;
    if (!el) return;
    if (!el.textContent.trim() && !el.querySelector('img')) el.innerHTML = PENAMPUNG_ISI;
  }
  function ambilIsi() {
    if (!isiRef.current || adaPenampung()) return '';
    return isiRef.current.innerHTML;
  }
  function perintah(nama, nilai = null) {
    if (terkunci) return;
    isiRef.current?.focus();
    if (adaPenampung()) isiRef.current.innerHTML = '<p><br></p>';
    document.execCommand(nama, false, nilai);
  }
  function sisipTautan() {
    if (terkunci) return;
    const url = window.prompt('Alamat tautan (harus diawali http:// atau https://):');
    if (!url) return;
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      setPesan({ jenis: 'galat', teks: 'Tautan hanya boleh http:// atau https://' });
      return;
    }
    perintah('createLink', url.trim());
  }

  // --- unggah ---------------------------------------------------------------
  async function unggah(berkas) {
    const form = new FormData();
    form.append('berkas', berkas);
    form.append('tujuan', 'artikel');
    const r = await fetch('/api/staf/unggah', { method: 'POST', body: form, credentials: 'same-origin' });
    return bacaBalasan(r);
  }
  async function pilihGambarUtama(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas || terkunci) return;
    setGalatUnggah(null);
    setMemuat(true);
    try {
      const { ok, data } = await unggah(berkas);
      if (ok) setGambarUtama(data.jalur);
      else setGalatUnggah(data.galat || 'Gambar tidak dapat diunggah');
    } catch {
      setGalatUnggah('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setMemuat(false);
    }
  }
  async function sisipGambar(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas || terkunci) return;
    setMemuat(true);
    try {
      const { ok, data } = await unggah(berkas);
      if (ok) perintah('insertImage', data.jalur);
      else setPesan({ jenis: 'galat', teks: data.galat || 'Gambar tidak dapat diunggah' });
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  // --- tag ------------------------------------------------------------------
  function tambahTag(mentah) {
    const bersih = String(mentah).split(',').map((t) => t.trim()).filter(Boolean);
    if (!bersih.length) return;
    setDaftarTag((lama) => [...new Set([...lama, ...bersih])].slice(0, 10));
    setTagBaru('');
  }
  function saatKetikTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      tambahTag(tagBaru);
    } else if (e.key === 'Backspace' && !tagBaru && daftarTag.length) {
      setDaftarTag((lama) => lama.slice(0, -1));
    }
  }

  // --- simpan / terbitkan ---------------------------------------------------
  function muatan() {
    // ringkasan selalu '' -> server menurunkannya dari isi pada SETIAP simpan (KEPUTUSAN 2);
    // kategori_id angka, tag array — sesuai validasiMuatanArtikel.
    return {
      judul: judul.trim(),
      ringkasan: '',
      isi: ambilIsi(),
      gambar_utama: gambarUtama || null,
      kategori_id: kategoriId ? Number(kategoriId) : null,
      wilayah_id: wilayahId ? Number(wilayahId) : null,
      tag: daftarTag,
    };
  }
  async function simpanKeServer() {
    const url = modeSunting ? `/api/staf/artikel/${artikel.id}` : '/api/staf/artikel';
    const r = await fetch(url, {
      method: modeSunting ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(muatan()),
      credentials: 'same-origin',
    });
    return bacaBalasan(r);
  }
  function teksGalat(data, cadangan) {
    return data?.galat ? `${data.galat}${data.kode ? ` (${data.kode})` : ''}` : cadangan;
  }

  async function simpanDraf() {
    if (terkunci) return;
    setMemuat(true);
    setPesan(null);
    try {
      const { ok, data } = await simpanKeServer();
      if (!ok) {
        setPesan({ jenis: 'galat', teks: teksGalat(data, 'Artikel tidak dapat disimpan') });
        return;
      }
      if (!modeSunting) {
        router.replace(`/staf/artikel/${data.artikel.id}?tersimpan=1`);
        return;
      }
      setStatus(data.artikel.status);
      setSlug(data.artikel.slug);
      setPesan({ jenis: 'sukses', teks: 'Perubahan tersimpan.' });
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  async function terbitkan() {
    if (terkunci || !bolehTerbitkan) return;
    setMemuat(true);
    setPesan(null);
    try {
      const simpan = await simpanKeServer(); // simpan dulu (POST/PATCH), lalu /terbitkan
      if (!simpan.ok) {
        setPesan({ jenis: 'galat', teks: teksGalat(simpan.data, 'Artikel tidak dapat disimpan') });
        return;
      }
      const id = simpan.data.artikel.id;
      const r = await fetch(`/api/staf/artikel/${id}/terbitkan`, { method: 'POST', credentials: 'same-origin' });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        if (!modeSunting) {
          router.replace(`/staf/artikel/${id}?tersimpan=1`); // draf sudah tersimpan walau gagal terbit
          return;
        }
        setPesan({ jenis: 'galat', teks: teksGalat(data, 'Artikel tidak dapat diterbitkan') });
        return;
      }
      if (!modeSunting) {
        router.replace(`/staf/artikel/${id}?terbit=1`);
        return;
      }
      setStatus(data.artikel.status);
      setSlug(data.artikel.slug);
      setPesan({
        jenis: 'sukses',
        teks: data.sudahTerbit ? 'Artikel sudah berstatus terbit.' : 'Artikel berhasil diterbitkan.',
        tautan: `${dasarUrlPublik}/berita/${data.artikel.slug}`,
      });
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  const judulHalaman = modeSunting ? judul.trim() || artikel.judul : 'Tulis Artikel Baru';
  const tautanPesan = pesan?.tautan ?? (pesan?.jenis === 'sukses' && status === 'terbit' && slug ? `${dasarUrlPublik}/berita/${slug}` : null);

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* Canvas Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 shadow-sm px-margin-desktop py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-1">
            <Link href="/staf/artikel">Kelola Artikel</Link>
            <Ikon nama="chevron_right" className="text-[16px]" />
            <span className="text-primary font-bold">Editor Artikel</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{judulHalaman}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {pesan ? (
            <div role="alert" aria-live="polite" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES}>
              {pesan.teks}
              {tautanPesan ? (
                <>
                  {' '}
                  <a className="underline" href={tautanPesan} target="_blank" rel="noopener noreferrer">Lihat di portal publik</a>
                </>
              ) : null}
            </div>
          ) : null}
          {bolehSunting ? (
            <button
              type="button"
              className="px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors"
              onClick={simpanDraf}
              disabled={memuat}
              aria-busy={memuat}
            >
              Simpan Draf
            </button>
          ) : null}
          {bolehSunting && bolehTerbitkan ? (
            <button
              type="button"
              className="px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]"
              onClick={terbitkan}
              disabled={memuat}
              aria-busy={memuat}
            >
              Terbitkan
            </button>
          ) : null}
        </div>
      </header>
      {/* Editor Workspace */}
      {/* QA-1 butir 5: dua kolom baru berdampingan mulai lg (sidebar 320 px + kolom utama tidak muat di 375/768) */}
      <div className="flex-1 p-margin-desktop flex flex-col lg:flex-row gap-gutter max-w-[1600px] mx-auto w-full">
        {/* Left Column: Main Editor */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Title & Meta Inputs */}
          <div className="bg-surface-container-lowest rounded-xl border border-tertiary overflow-hidden flex flex-col shadow-sm">
            <label className="sr-only" htmlFor="judul">Judul Artikel</label>
            <input
              className="w-full border-0 border-b border-outline-variant focus:ring-0 focus:border-secondary-fixed-dim px-6 py-5 font-headline-md text-headline-md text-on-surface placeholder:text-outline bg-transparent transition-colors"
              placeholder="Masukkan Judul Artikel..."
              type="text"
              id="judul"
              name="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              disabled={terkunci}
              maxLength={255}
              required
            />
            <div className="flex p-4 gap-4 bg-surface-container-lowest">
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant" htmlFor="kategori">Kategori</label>
                <select
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent appearance-none"
                  id="kategori"
                  name="kategori_id"
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  disabled={terkunci}
                  required
                >
                  <option disabled value="">Pilih Kategori</option>
                  {kategori.map((k) => (
                    <option key={k.id} value={String(k.id)}>{k.nama}</option>
                  ))}
                </select>
                <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
              </div>
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant" htmlFor="wilayah">Wilayah</label>
                <select
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent appearance-none"
                  id="wilayah"
                  name="wilayah_id"
                  value={wilayahId}
                  onChange={(e) => setWilayahId(e.target.value)}
                  disabled={terkunci}
                >
                  <option value="">Pilih Wilayah Terkait</option>
                  {wilayah.map((w) => (
                    <option key={w.id} value={String(w.id)}>{w.nama}</option>
                  ))}
                </select>
                <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
              </div>
            </div>
          </div>
          {/* Featured Image Upload */}
          <label
            htmlFor="gambar-utama"
            className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm flex flex-col items-center justify-center border-dashed gap-3 min-h-[200px] cursor-pointer hover:bg-surface-container-low transition-colors group"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="gambar-utama"
              name="gambar_utama"
              onChange={pilihGambarUtama}
              disabled={terkunci}
            />
            {gambarUtama ? (
              <Image src={gambarUtama} alt="Pratinjau gambar utama artikel" width={1200} height={800} unoptimized className="max-h-[200px] w-auto rounded-lg object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
                <Ikon nama="add_photo_alternate" className="text-primary text-[24px]" />
              </div>
            )}
            <div className="text-center">
              <p className="font-label-md text-label-md text-primary mb-1">{gambarUtama ? 'Ganti Gambar Utama' : 'Unggah Gambar Utama'}</p>
              <p className="font-body-md text-[14px] text-outline">Format JPG, PNG, atau WEBP. Maks 5MB.</p>
              {galatUnggah ? <p role="alert" className={KELAS_PESAN_GALAT}>{galatUnggah}</p> : null}
            </div>
          </label>
          {/* Rich Text Editor Body */}
          <div className="bg-surface-container-lowest rounded-xl border border-tertiary flex flex-col flex-1 shadow-sm overflow-hidden min-h-[500px]">
            {/* Toolbar */}
            <div className="bg-surface-container-low border-b border-outline-variant p-2 flex items-center gap-1 flex-wrap" role="toolbar" aria-label="Pemformatan teks">
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Bold" aria-label="Tebal" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('bold')}><Ikon nama="format_bold" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Italic" aria-label="Miring" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('italic')}><Ikon nama="format_italic" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Underline" aria-label="Garis bawah" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('underline')}><Ikon nama="format_underlined" className="text-[20px]" /></button>
              <div className="w-px h-6 bg-outline-variant mx-1"></div>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Heading 1" aria-label="Judul tingkat 1" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('formatBlock', 'h1')}><Ikon nama="format_h1" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Heading 2" aria-label="Judul tingkat 2" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('formatBlock', 'h2')}><Ikon nama="format_h2" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Quote" aria-label="Kutipan" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('formatBlock', 'blockquote')}><Ikon nama="format_quote" className="text-[20px]" /></button>
              <div className="w-px h-6 bg-outline-variant mx-1"></div>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Bulleted List" aria-label="Daftar tak berurut" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('insertUnorderedList')}><Ikon nama="format_list_bulleted" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Numbered List" aria-label="Daftar berurut" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => perintah('insertOrderedList')}><Ikon nama="format_list_numbered" className="text-[20px]" /></button>
              <div className="w-px h-6 bg-outline-variant mx-1"></div>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Insert Link" aria-label="Sisipkan tautan" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={sisipTautan}><Ikon nama="link" className="text-[20px]" /></button>
              <button type="button" className={KELAS_TOMBOL_TOOLBAR} title="Insert Image" aria-label="Sisipkan gambar" disabled={terkunci} onMouseDown={(e) => e.preventDefault()} onClick={() => inputSisipRef.current?.click()}><Ikon nama="image" className="text-[20px]" /></button>
              <input ref={inputSisipRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="sisip-gambar" aria-label="Berkas gambar untuk disisipkan" tabIndex={-1} onChange={sisipGambar} disabled={terkunci} />
            </div>
            {/* Editable Area */}
            <div
              ref={isiRef}
              className="p-8 flex-1 font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-0 leading-relaxed max-w-[720px] mx-auto w-full"
              contentEditable={bolehSunting && !memuat}
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Isi artikel"
              onFocus={saatFokusIsi}
              onBlur={saatBlurIsi}
              dangerouslySetInnerHTML={{ __html: isiAwal }}
            />
          </div>
        </div>
        {/* Right Column: Settings Sidebar */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
          {/* Publication Settings */}
          <div className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm">
            <h3 className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <Ikon nama="settings_applications" />
              Pengaturan Publikasi
            </h3>
            <div className="space-y-5">
              {/* Status Toggle */}
              <div>
                <p className="font-label-md text-label-md text-on-surface mb-2">Status Artikel</p>
                <div className="bg-surface-container-high rounded-lg p-1 flex" role="group" aria-label="Status artikel saat ini">
                  <button type="button" className={status === 'draf' ? KELAS_STATUS_AKTIF : KELAS_STATUS_PASIF} aria-pressed={status === 'draf'} disabled>Draf</button>
                  <button type="button" className={status === 'terbit' ? KELAS_STATUS_AKTIF : KELAS_STATUS_PASIF} aria-pressed={status === 'terbit'} disabled>Publik</button>
                </div>
                {status === 'arsip' ? <p className="sr-only">Status: Arsip</p> : null}
              </div>
              {/* Date */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant" htmlFor="terbit-pada">Tanggal Publikasi</label>
                <input
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent"
                  type="datetime-local"
                  id="terbit-pada"
                  name="terbit_pada"
                  value={tanggalTerbit}
                  readOnly
                  aria-describedby="terbit-pada-keterangan"
                />
                <span id="terbit-pada-keterangan" className="sr-only">Waktu Indonesia Barat, diisi otomatis saat artikel diterbitkan</span>
              </div>
              {/* Author Override */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant" htmlFor="penulis">Penulis (Opsional)</label>
                <input
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent"
                  placeholder="Nama Penulis..."
                  type="text"
                  id="penulis"
                  name="penulis"
                  value={artikel?.penulis_nama ?? penulisNama ?? ''}
                  readOnly
                />
              </div>
            </div>
          </div>
          {/* Tags / Metadata */}
          <div className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm">
            <h3 className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <Ikon nama="sell" />
              Label & Kata Kunci
            </h3>
            <div>
              <p className="font-body-md text-[14px] text-outline mb-3">Tambahkan tag untuk memudahkan pencarian (pisahkan dengan koma).</p>
              <div className="border border-outline-variant rounded-lg p-2 flex flex-wrap gap-2 mb-3 bg-transparent focus-within:border-secondary-fixed-dim transition-colors">
                {daftarTag.map((t) => (
                  <span key={t} className={KELAS_CHIP}>
                    {t}
                    <button
                      type="button"
                      className="text-[14px] cursor-pointer hover:text-on-error-container"
                      aria-label={`Hapus tag ${t}`}
                      disabled={terkunci}
                      onClick={() => setDaftarTag((lama) => lama.filter((x) => x !== t))}
                    >
                      <Ikon nama="close" />
                    </button>
                  </span>
                ))}
                <label className="sr-only" htmlFor="tag-baru">Tambah tag</label>
                <input
                  className="flex-1 min-w-[100px] border-0 bg-transparent p-0 focus:ring-0 font-body-md text-[14px]"
                  placeholder="Tambah tag..."
                  type="text"
                  id="tag-baru"
                  name="tag"
                  value={tagBaru}
                  onChange={(e) => setTagBaru(e.target.value)}
                  onKeyDown={saatKetikTag}
                  onBlur={() => tambahTag(tagBaru)}
                  disabled={terkunci}
                  maxLength={40}
                />
              </div>
            </div>
          </div>
          {/* Verification Badge */}
          <div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-xl p-5 flex items-start gap-3">
            <Ikon nama="verified" terisi className="text-secondary" />
            <div>
              <p className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Catatan Verifikasi</p>
              <p className="font-body-md text-[13px] text-on-secondary-fixed-variant/80">Artikel yang diterbitkan akan masuk log pengawasan resmi Warkop Nusantara.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
