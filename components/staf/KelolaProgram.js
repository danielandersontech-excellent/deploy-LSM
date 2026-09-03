'use client';
// components/staf/KelolaProgram.js — Kelola Program (client): daftar tabel + formulir tambah/ubah +
// hapus dengan konfirmasi Dialog. Layar ini TIDAK ada di ZIP -> KEPUTUSAN BARU (REFERENSI 18.4), disusun
// HANYA dari kelas dua cetakan staf:
//   - mode "daftar"   : kelola_artikel_admin/code.html — header halaman (h2 + tombol post_add), kartu tabel
//                       border-tertiary, kepala bg-primary, baris divide-y, tombol aksi ikon, kaki tabel.
//   - mode "formulir" : editor_artikel_admin/code.html — header lengket (remah roti + tombol Simpan/Batal),
//                       kartu input judul besar, select berlabel mengambang, kotak unggah putus-putus,
//                       panel kanan "Pengaturan", kartu catatan verifikasi.
//   - lencana status  : program_kegiatan/code.html (Berjalan = bg-secondary-fixed + pending,
//                       Selesai = bg-surface-dim + check_circle) — sama dengan app/(publik)/program/page.js.
// Alur data: POST/PATCH /api/staf/program[/id] (JSON) -> router.refresh(); DELETE lewat Dialog.
// Gambar: POST /api/staf/unggah (multipart, tujuan=program) -> jalur -> pratinjau next/image.
// Slug baca-saja: dibuat/diperbarui SERVER dari judul (lib/db/program slugUnik), tidak pernah dikirim klien.
//
// KEPUTUSAN BARU rinci (tidak diatur dokumen):
//   1. Formulir inline menggantikan tabel (mode), bukan Dialog — formulir 9 bidang terlalu besar untuk
//      panel max-w-md Dialog; kelasnya persis kolom editor_artikel_admin.
//   2. Textarea ringkasan/isi memakai kelas input/select editor (w-full border border-outline-variant
//      rounded-lg px-4 py-3 …) — ZIP staf tidak punya textarea; tinggi lewat atribut rows.
//   3. Lencana program_kegiatan berkelas `flex`; di sel tabel dibungkus <div class="flex gap-2"> (kelas
//      pembungkus lencana di desain yang sama, tanpa absolute/top-4/left-4) agar lebarnya sesuai isi.
//   4. Baris slug di bawah judul memakai kelas teks bantu editor (font-body-md text-[14px] text-outline).
//   5. Wilayah kosong ditampilkan "—" (program nasional); periode "mulai – selesai", selesai kosong = "Sekarang"
//      (kata dari kartu program_kegiatan "Okt 2023 - Sekarang").
//   6. Tautan "Lihat di portal" memakai dasar NEXT_PUBLIC_APP_URL + /program#program-<slug> (host staf
//      tidak melayani /program — proxy.js), sama dengan EditorArtikel.
//   7. Pesan galat/sukses memakai kelas pesan FormulirLogin (brief Tahap 7).
//   8. Baca-saja (pimpinan_wilayah): tombol tambah/ubah/hapus TIDAK dirender; API tetap memagari.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import Dialog from '@/components/ui/Dialog';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import { formatTanggalID } from '@/lib/utils';

// Kotak pesan (kelas yang sama dengan FormulirLogin — KEPUTUSAN BARU Tahap 2)
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// Lencana status — kelas VERBATIM program_kegiatan/code.html (lihat app/(publik)/program/page.js)
const LENCANA_STATUS = Object.freeze({
  berjalan: { label: 'Berjalan', ikon: 'pending', kelas: 'bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1' },
  selesai: { label: 'Selesai', ikon: 'check_circle', kelas: 'bg-surface-dim text-on-surface font-label-md text-label-md px-3 py-1 rounded-full shadow-sm border border-outline-variant flex items-center gap-1' },
});

// Kelas formulir — VERBATIM editor_artikel_admin/code.html
const KELAS_LABEL_MENGAMBANG = 'absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant';
const KELAS_BIDANG = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent';
const KELAS_SELECT = `${KELAS_BIDANG} appearance-none`;
const KELAS_KARTU = 'bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm';
const KELAS_JUDUL_KARTU = 'font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2';
const KELAS_TOMBOL_SIMPAN = 'px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]';
const KELAS_TOMBOL_BATAL = 'px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors';

const FORMULIR_KOSONG = Object.freeze({
  judul: '', ringkasan: '', isi: '', gambar: null, kategori: '', status: 'berjalan', wilayah_id: '', mulai_pada: '', selesai_pada: '',
});

function formulirDari(p) {
  if (!p) return { ...FORMULIR_KOSONG };
  return {
    judul: p.judul ?? '',
    ringkasan: p.ringkasan ?? '',
    isi: p.isi ?? '',
    gambar: p.gambar ?? null,
    kategori: p.kategori ?? '',
    status: p.status ?? 'berjalan',
    wilayah_id: p.wilayah_id ? String(p.wilayah_id) : '',
    mulai_pada: p.mulai_pada ?? '',
    selesai_pada: p.selesai_pada ?? '',
  };
}

async function bacaBalasan(r) {
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function teksGalat(data, cadangan) {
  return data?.galat ? `${data.galat}${data.kode ? ` (${data.kode})` : ''}` : cadangan;
}

/** "01 Okt 2023 – Sekarang" / "01 Jan 2023 – 30 Jun 2023" / "—" bila keduanya kosong. */
function periode(mulai, selesai) {
  if (!mulai && !selesai) return '—';
  const awal = mulai ? formatTanggalID(mulai) : '…';
  const akhir = selesai ? formatTanggalID(selesai) : 'Sekarang';
  return `${awal} – ${akhir}`;
}

export default function KelolaProgram({ program = [], total = 0, provinsi = [], kategori = [], daftarStatus = [], bolehKelola = false, dasarUrlPublik = '' }) {
  const router = useRouter();
  const [mode, setMode] = useState('daftar'); // 'daftar' | 'formulir'
  const [sedangDiubah, setSedangDiubah] = useState(null); // program yang diubah, null = tambah
  const [formulir, setFormulir] = useState(() => ({ ...FORMULIR_KOSONG }));
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'sukses', teks}
  const [galatUnggah, setGalatUnggah] = useState(null);
  const [targetHapus, setTargetHapus] = useState(null);
  const [sibukHapus, setSibukHapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState(null);

  const labelKategori = (slug) => kategori.find((k) => k.slug === slug)?.label ?? slug;
  const ubahBidang = (nama) => (e) => setFormulir((f) => ({ ...f, [nama]: e.target.value }));

  // --- navigasi mode -------------------------------------------------------
  function bukaTambah() {
    if (!bolehKelola) return;
    setSedangDiubah(null);
    setFormulir({ ...FORMULIR_KOSONG });
    setPesan(null);
    setGalatUnggah(null);
    setMode('formulir');
  }
  function bukaUbah(p) {
    if (!bolehKelola) return;
    setSedangDiubah(p);
    setFormulir(formulirDari(p));
    setPesan(null);
    setGalatUnggah(null);
    setMode('formulir');
  }
  function kembaliKeDaftar() {
    if (memuat) return;
    setMode('daftar');
    setSedangDiubah(null);
    setGalatUnggah(null);
  }

  // --- unggah gambar --------------------------------------------------------
  async function pilihGambar(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas || memuat) return;
    setGalatUnggah(null);
    setMemuat(true);
    try {
      const form = new FormData();
      form.append('berkas', berkas);
      form.append('tujuan', 'program');
      const { ok, data } = await bacaBalasan(await fetch('/api/staf/unggah', { method: 'POST', body: form, credentials: 'same-origin' }));
      if (ok) setFormulir((f) => ({ ...f, gambar: data.jalur }));
      else setGalatUnggah(teksGalat(data, 'Gambar tidak dapat diunggah'));
    } catch {
      setGalatUnggah('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setMemuat(false);
    }
  }

  // --- simpan (POST / PATCH) ------------------------------------------------
  async function simpan(e) {
    e.preventDefault();
    if (memuat || !bolehKelola) return;
    setMemuat(true);
    setPesan(null);
    const muatan = {
      judul: formulir.judul.trim(),
      ringkasan: formulir.ringkasan.trim() || null,
      isi: formulir.isi.trim() || null,
      gambar: formulir.gambar || null,
      kategori: formulir.kategori,
      status: formulir.status,
      wilayah_id: formulir.wilayah_id ? Number(formulir.wilayah_id) : null,
      mulai_pada: formulir.mulai_pada || null,
      selesai_pada: formulir.selesai_pada || null,
    };
    try {
      const url = sedangDiubah ? `/api/staf/program/${sedangDiubah.id}` : '/api/staf/program';
      const { ok, data } = await bacaBalasan(await fetch(url, {
        method: sedangDiubah ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(muatan),
        credentials: 'same-origin',
      }));
      if (!ok) {
        setPesan({ jenis: 'galat', teks: teksGalat(data, 'Program tidak dapat disimpan') });
        return;
      }
      const judulTersimpan = data.program?.judul ?? muatan.judul;
      setPesan({ jenis: 'sukses', teks: sedangDiubah ? `Program "${judulTersimpan}" diperbarui.` : `Program "${judulTersimpan}" ditambahkan.` });
      setMode('daftar');
      setSedangDiubah(null);
      router.refresh();
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  // --- hapus (Dialog -> DELETE) ---------------------------------------------
  function tutupDialogHapus() {
    if (sibukHapus) return;
    setTargetHapus(null);
    setGalatHapus(null);
  }
  async function hapus() {
    if (!targetHapus || !bolehKelola) return;
    setSibukHapus(true);
    setGalatHapus(null);
    try {
      const { ok, data } = await bacaBalasan(await fetch(`/api/staf/program/${targetHapus.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { accept: 'application/json' } }));
      if (!ok) {
        setGalatHapus(teksGalat(data, 'Gagal menghapus program'));
        return;
      }
      setPesan({ jenis: 'sukses', teks: `Program "${targetHapus.judul}" dihapus.` });
      setTargetHapus(null);
      router.refresh();
    } catch {
      setGalatHapus('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibukHapus(false);
    }
  }

  // ===========================================================================
  // MODE FORMULIR — cetakan editor_artikel_admin
  // ===========================================================================
  if (mode === 'formulir' && bolehKelola) {
    const judulHalaman = sedangDiubah ? formulir.judul.trim() || sedangDiubah.judul : 'Tambah Program';
    return (
      <form className="flex flex-col min-h-full pb-12" onSubmit={simpan}>
        {/* Canvas Header */}
        <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 shadow-sm px-margin-desktop py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-1">
              <button type="button" onClick={kembaliKeDaftar} disabled={memuat}>Kelola Program</button>
              <Ikon nama="chevron_right" className="text-[16px]" />
              <span className="text-primary font-bold">{sedangDiubah ? 'Ubah Program' : 'Tambah Program'}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{judulHalaman}</h1>
          </div>
          <div className="flex items-center gap-3">
            {pesan ? (
              <div role="alert" aria-live="polite" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES}>{pesan.teks}</div>
            ) : null}
            <button type="button" className={KELAS_TOMBOL_BATAL} onClick={kembaliKeDaftar} disabled={memuat}>Batal</button>
            <button type="submit" className={KELAS_TOMBOL_SIMPAN} disabled={memuat} aria-busy={memuat}>{memuat ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </header>
        {/* Editor Workspace */}
        <div className="flex-1 p-margin-desktop flex gap-gutter max-w-[1600px] mx-auto w-full">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Title & Meta Inputs */}
            <div className="bg-surface-container-lowest rounded-xl border border-tertiary overflow-hidden flex flex-col shadow-sm">
              <label className="sr-only" htmlFor="program-judul">Judul Program</label>
              <input
                className="w-full border-0 border-b border-outline-variant focus:ring-0 focus:border-secondary-fixed-dim px-6 py-5 font-headline-md text-headline-md text-on-surface placeholder:text-outline bg-transparent transition-colors"
                placeholder="Masukkan Judul Program..."
                type="text"
                id="program-judul"
                name="judul"
                value={formulir.judul}
                onChange={ubahBidang('judul')}
                disabled={memuat}
                minLength={5}
                maxLength={255}
                required
              />
              <div className="flex p-4 gap-4 bg-surface-container-lowest">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-kategori">Kategori</label>
                  <select className={KELAS_SELECT} id="program-kategori" name="kategori" value={formulir.kategori} onChange={ubahBidang('kategori')} disabled={memuat} required>
                    <option disabled value="">Pilih Kategori</option>
                    {kategori.map((k) => (
                      <option key={k.slug} value={k.slug}>{k.label}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-wilayah">Wilayah</label>
                  <select className={KELAS_SELECT} id="program-wilayah" name="wilayah_id" value={formulir.wilayah_id} onChange={ubahBidang('wilayah_id')} disabled={memuat}>
                    <option value="">Pilih Wilayah Terkait</option>
                    {provinsi.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.nama}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Featured Image Upload */}
            <label
              htmlFor="program-gambar"
              className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm flex flex-col items-center justify-center border-dashed gap-3 min-h-[200px] cursor-pointer hover:bg-surface-container-low transition-colors group"
            >
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="program-gambar" name="gambar" onChange={pilihGambar} disabled={memuat} />
              {formulir.gambar ? (
                <Image src={formulir.gambar} alt={`Pratinjau gambar program ${formulir.judul || ''}`.trim()} width={1200} height={800} unoptimized className="max-h-[200px] w-auto rounded-lg object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
                  <Ikon nama="add_photo_alternate" className="text-primary text-[24px]" />
                </div>
              )}
              <div className="text-center">
                <p className="font-label-md text-label-md text-primary mb-1">{formulir.gambar ? 'Ganti Gambar Program' : 'Unggah Gambar Program'}</p>
                <p className="font-body-md text-[14px] text-outline">Format JPG, PNG, atau WEBP. Maks 5MB.</p>
                {galatUnggah ? <p role="alert" className={KELAS_PESAN_GALAT}>{galatUnggah}</p> : null}
              </div>
            </label>
            {formulir.gambar ? (
              <button type="button" className={KELAS_TOMBOL_BATAL} onClick={() => setFormulir((f) => ({ ...f, gambar: null }))} disabled={memuat}>Lepas Gambar</button>
            ) : null}
            {/* Ringkasan & Isi */}
            <div className={KELAS_KARTU}>
              <h3 className={KELAS_JUDUL_KARTU}>
                <Ikon nama="edit_document" />
                Deskripsi Program
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-ringkasan">Ringkasan</label>
                  <textarea className={KELAS_BIDANG} id="program-ringkasan" name="ringkasan" rows={3} maxLength={600} placeholder="Ringkasan singkat yang tampil di kartu program (maks 600 karakter)" value={formulir.ringkasan} onChange={ubahBidang('ringkasan')} disabled={memuat} />
                </div>
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-isi">Isi</label>
                  <textarea className={KELAS_BIDANG} id="program-isi" name="isi" rows={12} maxLength={20000} placeholder="Uraian lengkap program: latar belakang, sasaran, capaian…" value={formulir.isi} onChange={ubahBidang('isi')} disabled={memuat} />
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Settings Sidebar */}
          <div className="w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className={KELAS_KARTU}>
              <h3 className={KELAS_JUDUL_KARTU}>
                <Ikon nama="settings_applications" />
                Pengaturan Program
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-status">Status</label>
                  <select className={KELAS_SELECT} id="program-status" name="status" value={formulir.status} onChange={ubahBidang('status')} disabled={memuat} required>
                    {daftarStatus.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-mulai">Tanggal Mulai</label>
                  <input className={KELAS_BIDANG} type="date" id="program-mulai" name="mulai_pada" value={formulir.mulai_pada} onChange={ubahBidang('mulai_pada')} disabled={memuat} />
                </div>
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-selesai">Tanggal Selesai</label>
                  <input className={KELAS_BIDANG} type="date" id="program-selesai" name="selesai_pada" value={formulir.selesai_pada} min={formulir.mulai_pada || undefined} onChange={ubahBidang('selesai_pada')} disabled={memuat} aria-describedby="program-selesai-keterangan" />
                  <span id="program-selesai-keterangan" className="sr-only">Kosongkan bila program masih berjalan</span>
                </div>
                {sedangDiubah ? (
                  <div className="relative">
                    <label className={KELAS_LABEL_MENGAMBANG} htmlFor="program-slug">Slug (otomatis)</label>
                    <input className={KELAS_BIDANG} type="text" id="program-slug" name="slug" value={sedangDiubah.slug} readOnly aria-describedby="program-slug-keterangan" />
                    <span id="program-slug-keterangan" className="sr-only">Dibuat otomatis oleh server dari judul</span>
                  </div>
                ) : null}
              </div>
            </div>
            {/* Catatan */}
            <div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-xl p-5 flex items-start gap-3">
              <Ikon nama="verified" terisi className="text-secondary" />
              <div>
                <p className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Catatan</p>
                <p className="font-body-md text-[13px] text-on-secondary-fixed-variant/80">Slug dibuat otomatis oleh server dari judul dan menjadi alamat program di portal publik. Program tampil publik segera setelah disimpan.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // ===========================================================================
  // MODE DAFTAR — cetakan kelola_artikel_admin
  // ===========================================================================
  return (
    // <main class="flex-1 ml-64 p-margin-desktop min-h-screen"> desain digantikan <main> layout staf;
    // padding p-margin-desktop dibawa pembungkus ini; min-h-screen (100vh, aturan 5) tidak disalin.
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Kelola Program</h2>
            <p className="text-on-surface-variant mt-2">Daftar program dan kegiatan yang tampil di portal publik.</p>
          </div>
          {bolehKelola ? (
            <button type="button" className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2" style={{ boxShadow: '0 4px 6px -1px rgba(233, 195, 73, 0.2)' }} onClick={bukaTambah}>
              <Ikon nama="post_add" />
              Tambah Program
            </button>
          ) : null}
        </header>
        {pesan ? (
          <div role="alert" aria-live="polite" className={`${pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES} mb-6`}>{pesan.teks}</div>
        ) : null}
        {/* Data Table */}
        {program.length === 0 ? (
          <KeadaanKosong ikon="explore" judul="Belum ada program" keterangan={bolehKelola ? 'Tekan "Tambah Program" untuk membuat program atau kegiatan pertama.' : 'Program dan kegiatan yang dipublikasikan akan tampil di sini.'} />
        ) : (
          <div className="bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary">
                <tr>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">Judul Program</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden md:table-cell">Kategori</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">Status</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden lg:table-cell">Wilayah</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant hidden sm:table-cell">Periode</th>
                  <th scope="col" className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {program.map((p) => {
                  const lencana = LENCANA_STATUS[p.status] ?? LENCANA_STATUS.berjalan;
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                      <td className="px-6 py-4">
                        <p className="font-body-md text-body-md font-semibold text-primary truncate max-w-xs" title={p.judul}>{p.judul}</p>
                        <p className="font-body-md text-[14px] text-outline truncate max-w-xs" title={`Slug: ${p.slug}`}>{p.slug}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-on-surface-variant font-body-md text-body-md">{labelKategori(p.kategori)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className={lencana.kelas}>
                            <Ikon nama={lencana.ikon} className="text-[16px]" /> {lencana.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-on-surface-variant font-body-md text-body-md">{p.wilayah_nama ?? '—'}</td>
                      <td className="px-6 py-4 hidden sm:table-cell text-on-surface-variant font-body-md text-body-md">{periode(p.mulai_pada, p.selesai_pada)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <a className="text-outline hover:text-primary transition-colors" title="Preview" aria-label={`Lihat program ${p.judul} di portal publik`} href={`${dasarUrlPublik}/program#program-${p.slug}`} target="_blank" rel="noopener noreferrer"><Ikon nama="visibility" className="text-xl" /></a>
                        {bolehKelola ? (
                          <>
                            <button type="button" className="text-outline hover:text-secondary transition-colors" title="Edit" aria-label={`Ubah program ${p.judul}`} onClick={() => bukaUbah(p)}><Ikon nama="edit" className="text-xl" /></button>
                            <button type="button" className="text-outline hover:text-error transition-colors" title="Delete" aria-label={`Hapus program ${p.judul}`} onClick={() => { setGalatHapus(null); setTargetHapus(p); }}><Ikon nama="delete" className="text-xl" /></button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant">
              <span>Menampilkan {program.length} dari {total} program</span>
            </div>
          </div>
        )}
      </div>
      {/* Dialog konfirmasi hapus — kelas tombol seperti AksiArtikel (KEPUTUSAN BARU Tahap 5) */}
      <Dialog terbuka={Boolean(targetHapus)} onTutup={tutupDialogHapus} judul="Hapus Program">
        <p className="font-body-md text-body-md text-on-surface">
          Program <strong>{targetHapus?.judul}</strong> akan dihapus permanen dan tidak lagi tampil di portal publik. Tindakan ini tidak dapat dibatalkan.
        </p>
        {galatHapus ? <p className="font-body-md text-body-md text-error mt-4" role="alert">{galatHapus}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={`${KELAS_TOMBOL.ringkas} px-4`} onClick={tutupDialogHapus} disabled={sibukHapus}>Batal</button>
          <button type="button" className={KELAS_TOMBOL.kirim} onClick={hapus} disabled={sibukHapus}>
            <Ikon nama="delete" />
            {sibukHapus ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
