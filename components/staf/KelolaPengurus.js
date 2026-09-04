'use client';
// components/staf/KelolaPengurus.js — tabel + formulir + urutan + hapus untuk modul Kelola Pengurus
// (client, karena butuh fetch/state/dialog). Dipakai app/(staf)/staf/pengurus/page.js.
//
// Layar ini TIDAK ada di ZIP desain (REFERENSI 18.4) -> KEPUTUSAN BARU, kelas HANYA dari layar staf ZIP:
//   1. Cetakan tabel   = kelola_artikel_admin/code.html: header halaman (h2 + p + tombol aksi utama
//      bg-primary dengan box-shadow emas), kartu tabel border-tertiary, kepala bg-primary, baris
//      divide-y, lencana status (Published -> "Aktif", Draft -> "Nonaktif"), tombol ikon Edit/Delete, kaki tabel.
//   2. Cetakan formulir = editor_artikel_admin/code.html: panel bg-surface-container-lowest rounded-xl
//      border-tertiary p-6, judul panel h3 font-headline-md text-[20px] + ikon, label melayang
//      (absolute -top-2 left-3 …), input/select rounded-lg px-4 py-3 + ikon expand_more, kotak unggah
//      putus-putus (border-dashed min-h-[200px]), tombol "Simpan" (bg-primary shadow) & "Batal" (border-outline).
//      Textarea tidak ada di layar staf -> memakai kelas input yang sama (rows={4}).
//   3. Formulir tambah/ubah = PANEL INLINE di atas tabel (bukan Dialog) karena bidangnya banyak + pratinjau
//      foto; Dialog (components/ui/Dialog) hanya untuk konfirmasi hapus (preseden AksiArtikel).
//   4. Mekanisme urutan = tombol naik/turun per baris (TANPA pustaka drag-and-drop — aturan paket npm).
//      Ikon expand_less tidak ada di 77 ikon resmi dan ZIP tidak punya kelas rotate -> tombol memakai teks
//      "▲"/"▼" (aria-label jelas) dengan kelas tombol ikon paginasi kelola_pengaduan_admin
//      (p-1 rounded text-outline hover:bg-surface-container disabled:opacity-50). Pertukaran hanya dengan
//      tetangga SE-TINGKAT (pusat/wilayah) karena /struktur mengelompokkan per tingkat; setiap klik langsung
//      PATCH /api/staf/pengurus/urutan {urutan:[id…]} (seluruh daftar, urutan 1..n) lalu router.refresh().
//   5. Foto: POST /api/staf/unggah multipart berkas + tujuan=pengurus -> simpan `jalur`; pratinjau bulat
//      w-20 h-20 rounded-full (kelas avatar dashboard_staff_warkop); foto tabel w-10 h-10 rounded-full
//      (kelas avatar sidebar kelola_pengaduan_admin). Gambar unggahan -> <Image unoptimized> (preseden EditorArtikel).
//   6. Kotak centang "Aktif" memakai kelas checkbox kontak_pengaduan_warkop_nusantara_updated_logo (satu-satunya
//      checkbox di ZIP; layar publik). Pesan galat/sukses memakai kelas pesan FormulirLogin.
//   7. Urutan bawaan pengurus baru = urutan terbesar se-tingkat + 1. Tanpa data -> KeadaanKosong.
// Peran konten_lihat tanpa konten_kelola (pimpinan_wilayah) -> bolehKelola=false: tanpa tombol tambah,
// kolom Aksi, dan formulir (API tetap menolak sendiri).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Ikon from '@/components/ui/Ikon';
import Dialog from '@/components/ui/Dialog';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';

const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
// Lencana status — kelas VERBATIM kelola_artikel_admin ("Published" emas / "Draft" abu).
const KELAS_LENCANA_AKTIF = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim';
const KELAS_LENCANA_NONAKTIF = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant';
// Formulir — kelas VERBATIM editor_artikel_admin.
const KELAS_LABEL = 'absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant';
const KELAS_INPUT = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent';
const KELAS_SELECT = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent appearance-none';
const KELAS_TOMBOL_SIMPAN = 'px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]';
const KELAS_TOMBOL_BATAL = 'px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors';
// Tombol naik/turun — kelas VERBATIM tombol paginasi kelola_pengaduan_admin.
const KELAS_TOMBOL_URUT = 'p-1 rounded text-outline hover:bg-surface-container disabled:opacity-50';
const KELAS_TH = 'px-6 py-4 font-label-md text-label-md border-b border-outline-variant';
const KELAS_TD_TEKS = 'px-6 py-4 hidden md:table-cell text-on-surface-variant font-body-md text-body-md';

const LABEL_TINGKAT = Object.freeze({ pusat: 'Pusat', wilayah: 'Wilayah' });

function formulirKosong(daftar, tingkat = 'pusat') {
  const terbesar = daftar.filter((p) => p.tingkat === tingkat).reduce((m, p) => Math.max(m, p.urutan), 0);
  return { nama: '', jabatan: '', tingkat, wilayah_id: '', foto: null, deskripsi: '', aktif_sejak: '', urutan: String(terbesar + 1), aktif: true };
}

function formulirDari(p) {
  return {
    nama: p.nama,
    jabatan: p.jabatan,
    tingkat: p.tingkat,
    wilayah_id: p.wilayah_id == null ? '' : String(p.wilayah_id),
    foto: p.foto,
    deskripsi: p.deskripsi ?? '',
    aktif_sejak: p.aktif_sejak == null ? '' : String(p.aktif_sejak),
    urutan: String(p.urutan),
    aktif: Boolean(p.aktif),
  };
}

async function bacaBalasan(r) {
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function teksGalat(data, cadangan) {
  return data?.galat ? `${data.galat}${data.kode ? ` (${data.kode})` : ''}` : cadangan;
}

export default function KelolaPengurus({ pengurus, wilayah, bolehKelola }) {
  const router = useRouter();
  // Urutan sementara (optimis) — otomatis dibuang begitu server mengirim `pengurus` baru (referensi berubah).
  const [urutanSementara, setUrutanSementara] = useState({ dasar: null, daftar: null });
  const daftar = urutanSementara.dasar === pengurus ? urutanSementara.daftar : pengurus;
  const [formulir, setFormulir] = useState(null); // null | { id: null|number, nilai }
  const [hapus, setHapus] = useState(null); // null | pengurus
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'sukses', teks}
  const [galatFormulir, setGalatFormulir] = useState(null);
  const [galatUnggah, setGalatUnggah] = useState(null);
  const [galatHapus, setGalatHapus] = useState(null);

  const nilai = formulir?.nilai ?? null;
  const modeUbah = formulir?.id != null;

  function ubahNilai(kunci, v) {
    setFormulir((f) => (f ? { ...f, nilai: { ...f.nilai, [kunci]: v } } : f));
  }

  function bukaTambah() {
    setPesan(null);
    setGalatFormulir(null);
    setGalatUnggah(null);
    setFormulir({ id: null, nilai: formulirKosong(daftar) });
  }
  function bukaUbah(p) {
    setPesan(null);
    setGalatFormulir(null);
    setGalatUnggah(null);
    setFormulir({ id: p.id, nilai: formulirDari(p) });
  }
  function tutupFormulir() {
    if (sibuk) return;
    setFormulir(null);
    setGalatFormulir(null);
    setGalatUnggah(null);
  }

  // --- unggah foto ---------------------------------------------------------
  async function pilihFoto(e) {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas || sibuk) return;
    setGalatUnggah(null);
    setSibuk(true);
    try {
      const form = new FormData();
      form.append('berkas', berkas);
      form.append('tujuan', 'pengurus');
      const r = await fetch('/api/staf/unggah', { method: 'POST', body: form, credentials: 'same-origin' });
      const { ok, data } = await bacaBalasan(r);
      if (ok) ubahNilai('foto', data.jalur);
      else setGalatUnggah(teksGalat(data, 'Foto tidak dapat diunggah'));
    } catch {
      setGalatUnggah('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setSibuk(false);
    }
  }

  // --- simpan (POST / PATCH) --------------------------------------------------
  async function simpan(e) {
    e.preventDefault();
    if (!formulir || sibuk) return;
    setGalatFormulir(null);
    if (nilai.tingkat === 'wilayah' && !nilai.wilayah_id) {
      setGalatFormulir('Pengurus tingkat wilayah wajib memilih wilayah.');
      return;
    }
    const muatan = {
      nama: nilai.nama.trim(),
      jabatan: nilai.jabatan.trim(),
      tingkat: nilai.tingkat,
      wilayah_id: nilai.tingkat === 'wilayah' && nilai.wilayah_id ? Number(nilai.wilayah_id) : null,
      foto: nilai.foto || null,
      deskripsi: nilai.deskripsi.trim() || null,
      aktif_sejak: nilai.aktif_sejak === '' ? null : Number(nilai.aktif_sejak),
      urutan: Number(nilai.urutan) || 0,
      aktif: nilai.aktif,
    };
    setSibuk(true);
    try {
      const r = await fetch(modeUbah ? `/api/staf/pengurus/${formulir.id}` : '/api/staf/pengurus', {
        method: modeUbah ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(muatan),
        credentials: 'same-origin',
      });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        setGalatFormulir(teksGalat(data, 'Pengurus tidak dapat disimpan'));
        return;
      }
      setFormulir(null);
      setPesan({ jenis: 'sukses', teks: modeUbah ? `Data pengurus ${data.pengurus.nama} diperbarui.` : `Pengurus ${data.pengurus.nama} ditambahkan.` });
      router.refresh();
    } catch {
      setGalatFormulir('Tidak dapat menghubungi server. Periksa koneksi Anda.');
    } finally {
      setSibuk(false);
    }
  }

  // --- urutan (naik/turun) -----------------------------------------------------
  function indeksTetangga(i, arah) {
    const j = i + arah;
    if (j < 0 || j >= daftar.length) return -1;
    return daftar[j].tingkat === daftar[i].tingkat ? j : -1;
  }
  async function geser(i, arah) {
    const j = indeksTetangga(i, arah);
    if (j < 0 || sibuk) return;
    const baru = daftar.slice();
    [baru[i], baru[j]] = [baru[j], baru[i]];
    setUrutanSementara({ dasar: pengurus, daftar: baru });
    setPesan(null);
    setSibuk(true);
    try {
      const r = await fetch('/api/staf/pengurus/urutan', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ urutan: baru.map((p) => p.id) }),
        credentials: 'same-origin',
      });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        setUrutanSementara({ dasar: null, daftar: null });
        setPesan({ jenis: 'galat', teks: teksGalat(data, 'Urutan tidak dapat disimpan') });
        return;
      }
      setPesan({ jenis: 'sukses', teks: 'Urutan tersimpan dan langsung berlaku di halaman Struktur Organisasi.' });
      router.refresh();
    } catch {
      setUrutanSementara({ dasar: null, daftar: null });
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setSibuk(false);
    }
  }

  // --- hapus --------------------------------------------------------------------
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
      const r = await fetch(`/api/staf/pengurus/${hapus.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { accept: 'application/json' } });
      const { ok, data } = await bacaBalasan(r);
      if (!ok) {
        setGalatHapus(teksGalat(data, `Gagal menghapus pengurus (HTTP ${r.status}).`));
        return;
      }
      setPesan({ jenis: 'sukses', teks: `Pengurus ${hapus.nama} dihapus.` });
      setHapus(null);
      if (formulir?.id === hapus.id) setFormulir(null);
      router.refresh();
    } catch {
      setGalatHapus('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  return (
    // <main class="flex-1 ml-64 p-margin-desktop min-h-screen"> desain digantikan <main> layout staf;
    // padding p-margin-desktop dibawa pembungkus ini; min-h-screen (=100vh, aturan 5) tidak disalin (preseden Kelola Artikel).
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Kelola Pengurus</h2>
            <p className="text-on-surface-variant mt-2">Susunan kepengurusan yang tampil di halaman Struktur Organisasi.</p>
          </div>
          {bolehKelola ? (
            <button type="button" className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2" style={{ boxShadow: '0 4px 6px -1px rgba(233, 195, 73, 0.2)' }} onClick={bukaTambah} disabled={sibuk}>
              <Ikon nama="add" />
              Tambah Pengurus
            </button>
          ) : null}
        </header>

        {pesan ? (
          <div role="alert" aria-live="polite" className={`${pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES} mb-6`}>{pesan.teks}</div>
        ) : null}

        {/* Formulir tambah/ubah — panel inline berkelas editor_artikel_admin */}
        {bolehKelola && formulir ? (
          <form onSubmit={simpan} className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm mb-6" aria-busy={sibuk}>
            <h3 className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <Ikon nama={modeUbah ? 'edit' : 'person'} />
              {modeUbah ? 'Ubah Pengurus' : 'Tambah Pengurus'}
            </h3>
            <div className="space-y-5">
              <div className="flex p-4 gap-4 bg-surface-container-lowest">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-nama">Nama Lengkap</label>
                  <input className={KELAS_INPUT} id="pengurus-nama" name="nama" type="text" placeholder="Nama pengurus beserta gelar..." value={nilai.nama} onChange={(e) => ubahNilai('nama', e.target.value)} maxLength={150} required disabled={sibuk} />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-jabatan">Jabatan</label>
                  <input className={KELAS_INPUT} id="pengurus-jabatan" name="jabatan" type="text" placeholder="Mis. Ketua Umum" value={nilai.jabatan} onChange={(e) => ubahNilai('jabatan', e.target.value)} maxLength={150} required disabled={sibuk} />
                </div>
              </div>
              <div className="flex p-4 gap-4 bg-surface-container-lowest">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-tingkat">Tingkat</label>
                  <select className={KELAS_SELECT} id="pengurus-tingkat" name="tingkat" value={nilai.tingkat} onChange={(e) => ubahNilai('tingkat', e.target.value)} required disabled={sibuk}>
                    <option value="pusat">Pusat</option>
                    <option value="wilayah">Wilayah</option>
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-wilayah">Wilayah{nilai.tingkat === 'wilayah' ? ' (wajib)' : ' (opsional)'}</label>
                  <select className={KELAS_SELECT} id="pengurus-wilayah" name="wilayah_id" value={nilai.wilayah_id} onChange={(e) => ubahNilai('wilayah_id', e.target.value)} required={nilai.tingkat === 'wilayah'} disabled={sibuk}>
                    <option value="">Pilih Wilayah</option>
                    {wilayah.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.nama}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
              </div>
              {/* Foto — kotak unggah putus-putus editor_artikel_admin */}
              <label htmlFor="pengurus-foto" className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm flex flex-col items-center justify-center border-dashed gap-3 min-h-[200px] cursor-pointer hover:bg-surface-container-low transition-colors group">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="pengurus-foto" name="foto" onChange={pilihFoto} disabled={sibuk} />
                {nilai.foto ? (
                  <Image src={nilai.foto} alt={`Pratinjau foto ${nilai.nama || 'pengurus'}`} width={600} height={600} unoptimized className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-primary-container shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center group-hover:bg-secondary-fixed transition-colors">
                    <Ikon nama="add_photo_alternate" className="text-primary text-[24px]" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-label-md text-label-md text-primary mb-1">{nilai.foto ? 'Ganti Foto Pengurus' : 'Unggah Foto Pengurus'}</p>
                  <p className="font-body-md text-[14px] text-outline">Format JPG, PNG, atau WEBP. Maks 5MB.</p>
                  {galatUnggah ? <p className="font-body-md text-[14px] text-on-error-container" role="alert">{galatUnggah}</p> : null}
                </div>
              </label>
              <div className="relative">
                <label className={KELAS_LABEL} htmlFor="pengurus-deskripsi">Deskripsi (Opsional)</label>
                <textarea className={KELAS_INPUT} id="pengurus-deskripsi" name="deskripsi" rows={4} placeholder="Latar belakang singkat pengurus..." value={nilai.deskripsi} onChange={(e) => ubahNilai('deskripsi', e.target.value)} maxLength={2000} disabled={sibuk} />
              </div>
              <div className="flex p-4 gap-4 bg-surface-container-lowest">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-aktif-sejak">Aktif Sejak (Tahun)</label>
                  <input className={KELAS_INPUT} id="pengurus-aktif-sejak" name="aktif_sejak" type="number" inputMode="numeric" min={1900} max={2100} placeholder="Mis. 2021" value={nilai.aktif_sejak} onChange={(e) => ubahNilai('aktif_sejak', e.target.value)} disabled={sibuk} />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL} htmlFor="pengurus-urutan">Urutan Tampil</label>
                  <input className={KELAS_INPUT} id="pengurus-urutan" name="urutan" type="number" inputMode="numeric" min={0} max={9999} value={nilai.urutan} onChange={(e) => ubahNilai('urutan', e.target.value)} required disabled={sibuk} />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input className="w-4 h-4 text-secondary bg-background border-outline rounded focus:ring-secondary focus:ring-2" id="pengurus-aktif" name="aktif" type="checkbox" checked={nilai.aktif} onChange={(e) => ubahNilai('aktif', e.target.checked)} disabled={sibuk} />
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="pengurus-aktif">Aktif (tampil di halaman Struktur)</label>
                </div>
              </div>
              {galatFormulir ? <div role="alert" className={KELAS_PESAN_GALAT}>{galatFormulir}</div> : null}
              <div className="flex items-center gap-3">
                <button type="submit" className={KELAS_TOMBOL_SIMPAN} disabled={sibuk}>{sibuk ? 'Menyimpan…' : 'Simpan'}</button>
                <button type="button" className={KELAS_TOMBOL_BATAL} onClick={tutupFormulir} disabled={sibuk}>Batal</button>
              </div>
            </div>
          </form>
        ) : null}

        {/* Data Table */}
        {daftar.length === 0 ? (
          <KeadaanKosong ikon="person" judul="Belum ada pengurus" keterangan={bolehKelola ? 'Tambahkan pengurus agar tampil di halaman Struktur Organisasi.' : 'Belum ada data pengurus yang dapat ditampilkan.'} />
        ) : (
          <div className="bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm">
            {/* QA-1 butir 5: pembungkus overflow-x-auto (pola desain dashboard/kelola_pengaduan) agar tabel dapat digulir di layar sempit */}
            <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
              <caption className="sr-only">Daftar pengurus berurutan sesuai tampilan Struktur Organisasi</caption>
              <thead className="bg-primary text-on-primary">
                <tr>
                  <th scope="col" className={KELAS_TH}>Nama</th>
                  <th scope="col" className={`${KELAS_TH} hidden md:table-cell`}>Jabatan</th>
                  <th scope="col" className={`${KELAS_TH} hidden md:table-cell`}>Tingkat</th>
                  <th scope="col" className={`${KELAS_TH} hidden lg:table-cell`}>Wilayah</th>
                  <th scope="col" className={`${KELAS_TH} hidden sm:table-cell`}>Aktif Sejak</th>
                  <th scope="col" className={`${KELAS_TH} hidden sm:table-cell`}>Urutan</th>
                  <th scope="col" className={KELAS_TH}>Status</th>
                  {bolehKelola ? <th scope="col" className={`${KELAS_TH} text-right`}>Aksi</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {daftar.map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
                          {p.foto ? <Image className="w-full h-full object-cover" src={p.foto} alt={`Foto ${p.nama}`} width={600} height={600} unoptimized /> : null}
                        </div>
                        <p className="font-body-md text-body-md font-semibold text-primary truncate max-w-xs" title={p.nama}>{p.nama}</p>
                      </div>
                    </td>
                    <td className={KELAS_TD_TEKS}>{p.jabatan}</td>
                    <td className={KELAS_TD_TEKS}>{LABEL_TINGKAT[p.tingkat] ?? p.tingkat}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-on-surface-variant font-body-md text-body-md">{p.wilayah_nama ?? '—'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-on-surface-variant font-body-md text-body-md">{p.aktif_sejak ?? '—'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-on-surface-variant font-body-md text-body-md">{p.urutan}</td>
                    <td className="px-6 py-4">
                      <span className={p.aktif ? KELAS_LENCANA_AKTIF : KELAS_LENCANA_NONAKTIF}>{p.aktif ? 'Aktif' : 'Nonaktif'}</span>
                    </td>
                    {bolehKelola ? (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button type="button" className={KELAS_TOMBOL_URUT} aria-label={`Naikkan urutan ${p.nama}`} title="Naik" onClick={() => geser(i, -1)} disabled={sibuk || indeksTetangga(i, -1) < 0}>▲</button>
                        <button type="button" className={KELAS_TOMBOL_URUT} aria-label={`Turunkan urutan ${p.nama}`} title="Turun" onClick={() => geser(i, 1)} disabled={sibuk || indeksTetangga(i, 1) < 0}>▼</button>
                        <button type="button" className="text-outline hover:text-secondary transition-colors" title="Edit" aria-label={`Ubah pengurus ${p.nama}`} onClick={() => bukaUbah(p)} disabled={sibuk}><Ikon nama="edit" className="text-xl" /></button>
                        <button type="button" className="text-outline hover:text-error transition-colors" title="Delete" aria-label={`Hapus pengurus ${p.nama}`} onClick={() => { setGalatHapus(null); setHapus(p); }} disabled={sibuk}><Ikon nama="delete" className="text-xl" /></button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant">
              <span>Menampilkan {daftar.length} pengurus ({daftar.filter((p) => p.tingkat === 'pusat').length} pusat, {daftar.filter((p) => p.tingkat === 'wilayah').length} wilayah)</span>
              {bolehKelola ? <span>Urutan tampil mengikuti tombol ▲▼ per tingkat</span> : null}
            </div>
          </div>
        )}

        <Dialog terbuka={Boolean(hapus)} onTutup={tutupHapus} judul="Hapus Pengurus">
          <p className="font-body-md text-body-md text-on-surface">
            Pengurus <strong>{hapus?.nama}</strong> ({hapus?.jabatan}) akan dihapus permanen dan tidak lagi tampil di halaman Struktur Organisasi. Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}
