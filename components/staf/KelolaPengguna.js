'use client';
// components/staf/KelolaPengguna.js — tabel + formulir + dialog Kelola Pengguna (client, karena butuh
// keadaan formulir, dialog konfirmasi, dan fetch). Dirender HANYA untuk superadmin oleh page.js;
// setiap route /api/staf/pengguna* tetap memagari sendiri (requireRole) — tombol bukan pagar.
//
// KEPUTUSAN BARU (layar tidak ada di ZIP, REFERENSI 18.4) — cetakan:
//   kelola_artikel_admin/code.html : kepala halaman (h2 font-headline-lg + p mt-2, tombol aksi kanan),
//                                    kartu tabel border-tertiary, kepala tabel bg-primary, baris hover,
//                                    lencana Published/Draft (dipakai untuk Aktif/Nonaktif & "Wajib ganti
//                                    sandi"), tombol ikon aksi (text-outline hover:text-*), kaki tabel.
//   editor_artikel_admin/code.html : formulir = kartu rounded-xl border-tertiary p-6, label mengambang
//                                    (absolute -top-2 left-3 …), input/select rounded-lg px-4 py-3,
//                                    ikon expand_more pada select, judul panel h3 font-headline-md text-[20px],
//                                    tombol "Simpan Draf" (garis) & "Terbitkan" (bg-primary) untuk Batal/Simpan.
//   kontak_pengaduan_…_updated_logo : kelas checkbox (w-4 h-4 text-secondary … rounded).
//   FormulirLogin                  : kelas kotak pesan galat/sukses.
//   Dialog (components/ui)         : konfirmasi paksa keluar / reset sandi / hapus.
// Aturan lain: baris akun sendiri TIDAK merender tombol hapus, dan pada formulir ubah diri sendiri
// kotak "Aktif" serta select peran terkunci (API juga menolak: 422 DIRI_SENDIRI).
// Setelah setiap mutasi sukses -> router.refresh() agar server component memuat ulang daftar.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import Dialog from '@/components/ui/Dialog';
import KeadaanKosong from '@/components/ui/KeadaanKosong';
import { LABEL_PERAN } from '@/components/staf/SidebarStaf';

const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// Lencana — kelas VERBATIM kelola_artikel_admin ("Published" emas, "Draft" abu).
const KELAS_LENCANA_EMAS = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim';
const KELAS_LENCANA_ABU = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant';

// Formulir — kelas VERBATIM editor_artikel_admin.
const KELAS_LABEL_MENGAMBANG = 'absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant';
const KELAS_INPUT_FORM = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent';
const KELAS_SELECT_FORM = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent appearance-none';
const KELAS_TOMBOL_GARIS = 'px-6 py-2 rounded-lg border border-outline font-label-md text-label-md text-primary hover:bg-surface-container transition-colors';
const KELAS_TOMBOL_ISI = 'px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]';
const KELAS_TH = 'px-6 py-4 font-label-md text-label-md border-b border-outline-variant';
const KELAS_TD_VARIAN = 'px-6 py-4 text-on-surface-variant font-body-md text-body-md';

const SANDI_MIN = 10;

function sandiSah(s) {
  return typeof s === 'string' && s.length >= SANDI_MIN && /[a-zA-Z]/.test(s) && /[0-9]/.test(s);
}

function formulirKosong() {
  return { nama: '', email: '', peran: 'penulis', wilayah_id: '', aktif: true, kata_sandi: '' };
}

async function panggilApi(jalur, metode, muatan) {
  const res = await fetch(jalur, {
    method: metode,
    credentials: 'same-origin',
    headers: { accept: 'application/json', ...(muatan ? { 'content-type': 'application/json' } : {}) },
    body: muatan ? JSON.stringify(muatan) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function KelolaPengguna({ baris, daftarPeran, daftarWilayah, idSaya }) {
  const router = useRouter();
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'sukses', teks}
  const [sibuk, setSibuk] = useState(false);

  // Formulir tambah/ubah: null = tertutup; {mode:'tambah'} | {mode:'ubah', id}
  const [formulir, setFormulir] = useState(null);
  const [nilai, setNilai] = useState(formulirKosong());
  const [galatFormulir, setGalatFormulir] = useState(null);

  // Dialog aksi: {jenis:'paksa-keluar'|'reset-sandi'|'hapus', pengguna}
  const [dialog, setDialog] = useState(null);
  const [sandiBaru, setSandiBaru] = useState('');
  const [galatDialog, setGalatDialog] = useState(null);
  const [saranNonaktif, setSaranNonaktif] = useState(false);

  // Pesan sukses hilang sendiri setelah beberapa detik
  useEffect(() => {
    if (!pesan || pesan.jenis !== 'sukses') return undefined;
    const t = setTimeout(() => setPesan(null), 6000);
    return () => clearTimeout(t);
  }, [pesan]);

  const labelPeran = (p) => LABEL_PERAN[p] ?? p;
  const ubahNilai = (kunci, v) => setNilai((n) => ({ ...n, [kunci]: v }));

  function bukaTambah() {
    setNilai(formulirKosong());
    setGalatFormulir(null);
    setFormulir({ mode: 'tambah' });
  }

  function bukaUbah(u) {
    setNilai({ nama: u.nama, email: u.email, peran: u.peran, wilayah_id: u.wilayah_id ? String(u.wilayah_id) : '', aktif: u.aktif, kata_sandi: '' });
    setGalatFormulir(null);
    setFormulir({ mode: 'ubah', id: u.id, nama: u.nama });
  }

  function tutupFormulir() {
    if (sibuk) return;
    setFormulir(null);
    setGalatFormulir(null);
  }

  async function simpanFormulir(e) {
    e.preventDefault();
    if (sibuk || !formulir) return;
    setGalatFormulir(null);
    if (nilai.nama.trim().length < 3) { setGalatFormulir('Nama wajib diisi (minimal 3 karakter).'); return; }
    if (nilai.peran === 'pimpinan_wilayah' && !nilai.wilayah_id) { setGalatFormulir('Pimpinan wilayah wajib memiliki wilayah.'); return; }
    if (formulir.mode === 'tambah' && !sandiSah(nilai.kata_sandi)) {
      setGalatFormulir(`Kata sandi awal minimal ${SANDI_MIN} karakter dan memuat huruf serta angka.`);
      return;
    }
    const muatan = {
      nama: nilai.nama.trim(),
      email: nilai.email.trim(),
      peran: nilai.peran,
      wilayah_id: nilai.wilayah_id ? Number(nilai.wilayah_id) : null,
      aktif: nilai.aktif,
    };
    if (formulir.mode === 'tambah') muatan.kata_sandi = nilai.kata_sandi;
    setSibuk(true);
    try {
      const r = formulir.mode === 'tambah'
        ? await panggilApi('/api/staf/pengguna', 'POST', muatan)
        : await panggilApi(`/api/staf/pengguna/${formulir.id}`, 'PATCH', muatan);
      if (!r.ok) {
        setGalatFormulir(r.data?.galat ?? `Gagal menyimpan pengguna (HTTP ${r.status}).`);
        return;
      }
      setFormulir(null);
      setPesan({ jenis: 'sukses', teks: formulir.mode === 'tambah' ? `Pengguna ${r.data?.pengguna?.nama ?? muatan.nama} berhasil ditambahkan.` : `Perubahan pada ${muatan.nama} tersimpan.` });
      router.refresh();
    } catch {
      setGalatFormulir('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  function bukaDialog(jenis, u) {
    setSandiBaru('');
    setGalatDialog(null);
    setSaranNonaktif(false);
    setDialog({ jenis, pengguna: u });
  }

  function tutupDialog() {
    if (sibuk) return;
    setDialog(null);
    setGalatDialog(null);
    setSaranNonaktif(false);
  }

  async function jalankanDialog() {
    if (!dialog || sibuk) return;
    const u = dialog.pengguna;
    setGalatDialog(null);
    if (dialog.jenis === 'reset-sandi' && !sandiSah(sandiBaru)) {
      setGalatDialog(`Kata sandi baru minimal ${SANDI_MIN} karakter dan memuat huruf serta angka.`);
      return;
    }
    setSibuk(true);
    try {
      let r;
      if (dialog.jenis === 'paksa-keluar') r = await panggilApi(`/api/staf/pengguna/${u.id}/paksa-keluar`, 'POST', {});
      else if (dialog.jenis === 'reset-sandi') r = await panggilApi(`/api/staf/pengguna/${u.id}/reset-sandi`, 'POST', { kata_sandi_baru: sandiBaru });
      else r = await panggilApi(`/api/staf/pengguna/${u.id}`, 'DELETE');

      if (!r.ok) {
        // 409 PUNYA_DATA: pengguna punya artikel/riwayat -> sarankan nonaktifkan; 422 DIRI_SENDIRI/SUPERADMIN_TERAKHIR: pesan API
        if (dialog.jenis === 'hapus' && r.status === 409 && r.data?.kode === 'PUNYA_DATA') setSaranNonaktif(true);
        setGalatDialog(r.data?.galat ?? `Tindakan gagal (HTTP ${r.status}).`);
        return;
      }
      setDialog(null);
      setSandiBaru('');
      if (dialog.jenis === 'paksa-keluar') {
        if (u.id === idSaya) { router.push('/login'); router.refresh(); return; }
        setPesan({ jenis: 'sukses', teks: `Seluruh sesi ${u.nama} telah dikeluarkan. Token lama tidak berlaku lagi.` });
      } else if (dialog.jenis === 'reset-sandi') {
        setPesan({ jenis: 'sukses', teks: `Kata sandi ${u.nama} disetel ulang. Sesi lamanya dikeluarkan dan ia wajib mengganti kata sandi saat login berikutnya.` });
      } else {
        setPesan({ jenis: 'sukses', teks: `Pengguna ${u.nama} telah dihapus.` });
      }
      router.refresh();
    } catch {
      setGalatDialog('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  /** Dari dialog hapus yang ditolak 409: nonaktifkan akun sebagai gantinya (PATCH aktif:false). */
  async function nonaktifkanDariDialog() {
    if (!dialog || sibuk) return;
    const u = dialog.pengguna;
    setSibuk(true);
    setGalatDialog(null);
    try {
      const r = await panggilApi(`/api/staf/pengguna/${u.id}`, 'PATCH', { aktif: false });
      if (!r.ok) { setGalatDialog(r.data?.galat ?? `Gagal menonaktifkan (HTTP ${r.status}).`); return; }
      setDialog(null);
      setSaranNonaktif(false);
      setPesan({ jenis: 'sukses', teks: `Akun ${u.nama} dinonaktifkan; riwayat kepenulisannya tetap tersimpan.` });
      router.refresh();
    } catch {
      setGalatDialog('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  const ubahDiri = formulir?.mode === 'ubah' && formulir.id === idSaya;
  const judulDialog = dialog?.jenis === 'paksa-keluar' ? 'Paksa Keluar' : dialog?.jenis === 'reset-sandi' ? 'Reset Kata Sandi' : 'Hapus Pengguna';

  return (
    // KEPUTUSAN BARU: <main class="flex-1 ml-64 p-margin-desktop min-h-screen"> desain sudah digantikan
    // <main> layout staf; padding p-margin-desktop dibawa pembungkus ini (preseden app/(staf)/staf/artikel).
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Kelola Pengguna</h2>
            <p className="text-on-surface-variant mt-2">Akun staf, peran, wilayah, dan keamanan sesi.</p>
          </div>
          <button type="button" className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-md hover:bg-primary-container transition-colors flex items-center gap-2" style={{ boxShadow: '0 4px 6px -1px rgba(233, 195, 73, 0.2)' }} onClick={bukaTambah} disabled={sibuk}>
            <Ikon nama="person" />
            Tambah Pengguna
          </button>
        </header>

        {pesan ? (
          <div role="alert" aria-live="polite" className={`${pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES} mb-6`}>
            {pesan.teks}
          </div>
        ) : null}

        {/* Formulir tambah/ubah — cetakan kartu editor_artikel_admin */}
        {formulir ? (
          <form className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm mb-6" onSubmit={simpanFormulir} noValidate aria-labelledby="judul-formulir-pengguna">
            <h3 id="judul-formulir-pengguna" className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <Ikon nama={formulir.mode === 'tambah' ? 'person' : 'edit'} />
              {formulir.mode === 'tambah' ? 'Tambah Pengguna' : `Ubah Pengguna: ${formulir.nama}`}
            </h3>
            {galatFormulir ? <div role="alert" className={`${KELAS_PESAN_GALAT} mb-4`}>{galatFormulir}</div> : null}
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="pengguna-nama">Nama Lengkap</label>
                  <input id="pengguna-nama" name="nama" type="text" className={KELAS_INPUT_FORM} value={nilai.nama} onChange={(e) => ubahNilai('nama', e.target.value)} autoComplete="off" maxLength={100} required disabled={sibuk} />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="pengguna-email">Email Resmi</label>
                  <input id="pengguna-email" name="email" type="email" className={KELAS_INPUT_FORM} value={nilai.email} onChange={(e) => ubahNilai('email', e.target.value)} autoComplete="off" maxLength={190} required disabled={sibuk} />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="pengguna-peran">Peran</label>
                  <select id="pengguna-peran" name="peran" className={KELAS_SELECT_FORM} value={nilai.peran} onChange={(e) => ubahNilai('peran', e.target.value)} disabled={sibuk || ubahDiri}>
                    {daftarPeran.map((p) => (
                      <option key={p} value={p}>{labelPeran(p)}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
                <div className="flex-1 relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="pengguna-wilayah">
                    {nilai.peran === 'pimpinan_wilayah' ? 'Wilayah (wajib)' : 'Wilayah'}
                  </label>
                  <select id="pengguna-wilayah" name="wilayah_id" className={KELAS_SELECT_FORM} value={nilai.wilayah_id} onChange={(e) => ubahNilai('wilayah_id', e.target.value)} disabled={sibuk} required={nilai.peran === 'pimpinan_wilayah'}>
                    <option value="">Pilih Wilayah Terkait</option>
                    {daftarWilayah.map((w) => (
                      <option key={w.id} value={String(w.id)}>{w.nama}</option>
                    ))}
                  </select>
                  <Ikon nama="expand_more" className="absolute right-3 top-3 text-outline pointer-events-none" />
                </div>
              </div>
              {formulir.mode === 'tambah' ? (
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="pengguna-sandi">Kata Sandi Awal</label>
                  <input id="pengguna-sandi" name="kata_sandi" type="password" className={KELAS_INPUT_FORM} value={nilai.kata_sandi} onChange={(e) => ubahNilai('kata_sandi', e.target.value)} autoComplete="new-password" minLength={SANDI_MIN} required disabled={sibuk} aria-describedby="pengguna-sandi-keterangan" />
                  <p id="pengguna-sandi-keterangan" className="font-body-md text-[14px] text-outline mt-1">Minimal {SANDI_MIN} karakter, memuat huruf dan angka. Sampaikan kepada pengguna lewat jalur aman.</p>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <input id="pengguna-aktif" name="aktif" type="checkbox" className="w-4 h-4 text-secondary bg-background border-outline rounded focus:ring-secondary focus:ring-2" checked={nilai.aktif} onChange={(e) => ubahNilai('aktif', e.target.checked)} disabled={sibuk || ubahDiri} />
                <label htmlFor="pengguna-aktif" className="font-label-md text-label-md text-on-surface">Akun aktif (dapat masuk ke ruang staf)</label>
              </div>
              {ubahDiri ? (
                <p className="font-body-md text-[14px] text-outline">Peran dan status aktif akun Anda sendiri tidak dapat diubah dari sini.</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" className={KELAS_TOMBOL_GARIS} onClick={tutupFormulir} disabled={sibuk}>Batal</button>
              <button type="submit" className={KELAS_TOMBOL_ISI} disabled={sibuk} aria-busy={sibuk}>
                {sibuk ? 'Menyimpan…' : formulir.mode === 'tambah' ? 'Simpan Pengguna' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        ) : null}

        {/* Data Table */}
        {baris.length === 0 ? (
          <KeadaanKosong ikon="person" judul="Belum ada pengguna" keterangan="Tambahkan akun staf pertama lewat tombol Tambah Pengguna." />
        ) : (
          <div className="bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Daftar akun staf</caption>
                <thead className="bg-primary text-on-primary">
                  <tr>
                    <th scope="col" className={KELAS_TH}>Nama</th>
                    <th scope="col" className={`${KELAS_TH} hidden md:table-cell`}>Email</th>
                    <th scope="col" className={KELAS_TH}>Peran</th>
                    <th scope="col" className={`${KELAS_TH} hidden lg:table-cell`}>Wilayah</th>
                    <th scope="col" className={KELAS_TH}>Status</th>
                    <th scope="col" className={`${KELAS_TH} hidden sm:table-cell`}>Terakhir Masuk</th>
                    <th scope="col" className={`${KELAS_TH} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {baris.map((u) => {
                    const diriSendiri = u.id === idSaya;
                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                        <td className="px-6 py-4">
                          <p className="font-body-md text-body-md font-semibold text-primary truncate max-w-xs" title={u.nama}>
                            {u.nama}{diriSendiri ? <span className="font-label-md text-[12px] text-on-surface-variant"> (Anda)</span> : null}
                          </p>
                          <p className="font-body-md text-[14px] text-outline md:hidden truncate max-w-xs">{u.email}</p>
                          {u.wajib_ganti_sandi ? (
                            <span className={`${KELAS_LENCANA_ABU} mt-1`}>
                              <Ikon nama="key" className="text-[14px]" />
                              Wajib ganti sandi
                            </span>
                          ) : null}
                        </td>
                        <td className={`${KELAS_TD_VARIAN} hidden md:table-cell`}>{u.email}</td>
                        <td className={KELAS_TD_VARIAN}>{labelPeran(u.peran)}</td>
                        <td className={`${KELAS_TD_VARIAN} hidden lg:table-cell`}>{u.wilayah_nama ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className={u.aktif ? KELAS_LENCANA_EMAS : KELAS_LENCANA_ABU}>
                            {u.aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className={`${KELAS_TD_VARIAN} hidden sm:table-cell`}>{u.terakhir_masuk_teks || 'Belum pernah'}</td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button type="button" className="text-outline hover:text-secondary transition-colors" title="Edit" aria-label={`Ubah pengguna ${u.nama}`} onClick={() => bukaUbah(u)} disabled={sibuk}>
                            <Ikon nama="edit" className="text-xl" />
                          </button>
                          <button type="button" className="text-outline hover:text-primary transition-colors" title="Paksa Keluar" aria-label={`Paksa keluar ${u.nama}`} onClick={() => bukaDialog('paksa-keluar', u)} disabled={sibuk}>
                            <Ikon nama="logout" className="text-xl" />
                          </button>
                          <button type="button" className="text-outline hover:text-primary transition-colors" title="Reset Kata Sandi" aria-label={`Reset kata sandi ${u.nama}`} onClick={() => bukaDialog('reset-sandi', u)} disabled={sibuk}>
                            <Ikon nama="key" className="text-xl" />
                          </button>
                          {diriSendiri ? null : (
                            <button type="button" className="text-outline hover:text-error transition-colors" title="Delete" aria-label={`Hapus pengguna ${u.nama}`} onClick={() => bukaDialog('hapus', u)} disabled={sibuk}>
                              <Ikon nama="delete" className="text-xl" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant">
              <span>Menampilkan {baris.length} pengguna</span>
              <span>{baris.filter((u) => u.aktif).length} aktif</span>
            </div>
          </div>
        )}
      </div>

      {/* Dialog aksi: paksa keluar / reset sandi / hapus */}
      <Dialog terbuka={Boolean(dialog)} onTutup={tutupDialog} judul={judulDialog}>
        {dialog ? (
          <form onSubmit={(e) => { e.preventDefault(); jalankanDialog(); }} noValidate>
            {dialog.jenis === 'paksa-keluar' ? (
              <p className="font-body-md text-body-md text-on-surface">
                Seluruh sesi <strong>{dialog.pengguna.nama}</strong> di semua peramban akan dikeluarkan seketika (token lama dibatalkan). Gunakan bila akun diduga dibobol.
                {dialog.pengguna.id === idSaya ? ' Ini akun Anda sendiri — Anda juga akan keluar dan harus masuk kembali.' : ''}
              </p>
            ) : null}
            {dialog.jenis === 'reset-sandi' ? (
              <div className="space-y-4">
                <p className="font-body-md text-body-md text-on-surface">
                  Setel kata sandi baru untuk <strong>{dialog.pengguna.nama}</strong>. Sesi lamanya akan dikeluarkan dan ia <strong>wajib mengganti kata sandi</strong> saat login berikutnya.
                </p>
                <div className="relative">
                  <label className={KELAS_LABEL_MENGAMBANG} htmlFor="reset-sandi-baru">Kata Sandi Baru</label>
                  <input id="reset-sandi-baru" name="kata_sandi_baru" type="password" className={KELAS_INPUT_FORM} value={sandiBaru} onChange={(e) => setSandiBaru(e.target.value)} autoComplete="new-password" minLength={SANDI_MIN} required disabled={sibuk} aria-describedby="reset-sandi-keterangan" />
                  <p id="reset-sandi-keterangan" className="font-body-md text-[14px] text-outline mt-1">Minimal {SANDI_MIN} karakter, memuat huruf dan angka. Sampaikan lewat jalur aman.</p>
                </div>
              </div>
            ) : null}
            {dialog.jenis === 'hapus' ? (
              <p className="font-body-md text-body-md text-on-surface">
                Pengguna <strong>{dialog.pengguna.nama}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Bila akun memiliki artikel atau riwayat, penghapusan ditolak — nonaktifkan saja.
              </p>
            ) : null}
            {galatDialog ? <div role="alert" className={`${KELAS_PESAN_GALAT} mt-4`}>{galatDialog}</div> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className={KELAS_TOMBOL_GARIS} onClick={tutupDialog} disabled={sibuk}>Batal</button>
              {saranNonaktif ? (
                <button type="button" className={KELAS_TOMBOL_ISI} onClick={nonaktifkanDariDialog} disabled={sibuk}>
                  {sibuk ? 'Memproses…' : 'Nonaktifkan Saja'}
                </button>
              ) : (
                <button type="submit" className={KELAS_TOMBOL_ISI} disabled={sibuk} aria-busy={sibuk}>
                  {sibuk ? 'Memproses…' : dialog.jenis === 'paksa-keluar' ? 'Paksa Keluar' : dialog.jenis === 'reset-sandi' ? 'Setel Ulang' : 'Hapus'}
                </button>
              )}
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
