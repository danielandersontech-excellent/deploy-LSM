'use client';
// components/staf/FormulirPengaturan.js — formulir Pengaturan situs (client). Layar ini tidak ada
// di ZIP desain (REFERENSI 18.4); kelas HANYA dari dua cetakan staf:
//   - header halaman   : kelola_artikel_admin/code.html (<header> + h2/p)
//   - kartu kelompok   : editor_artikel_admin/code.html panel kanan "Pengaturan Publikasi"
//                        (kartu rounded-xl border-tertiary, h3 berikon, label mengambang, input)
//   - tombol simpan    : tombol "Terbitkan" editor; kotak pesan = kelas FormulirLogin
//   - kotak Catatan    : "Catatan Verifikasi" editor (bg-secondary-fixed/20)
//
// SATU SUMBER: formulir DIBANGKITKAN dari PENGATURAN_DEFINISI (prop `definisi`) — label, tipe
// (angka -> input number, teks -> input text, teks_panjang -> textarea), kelompok -> judul bagian,
// deskripsi -> keterangan kecil. Berkas ini tidak menulis satu pun nama kunci setelan.
//
// KEPUTUSAN BARU (tidak diatur dokumen):
//   1. Satu <form> per kelompok; tombol "Simpan Perubahan" mengirim HANYA kunci kelompok itu ke
//      PATCH /api/staf/pengaturan (JSON). Sukses -> pesan + nilai ternormalisasi dari balasan API +
//      router.refresh(); galat (422 dst.) -> pesan `galat` API di dekat kelompok tersebut.
//   2. Judul kelompok: statistik "Statistik Beranda", kontak "Kontak", profil "Teks Organisasi",
//      halaman_statis "Halaman Teks Statis"; ikon per kelompok dari daftar 77 ikon resmi.
//   3. textarea memakai string kelas input editor (editor tidak punya textarea) + rows={8}.
//   4. Keterangan kunci = kelas teks bantu editor ("font-body-md text-[14px] text-outline") + mt-2 (kelola).
//   5. Tata letak: kolom kiri kartu kelompok (flex-1 flex flex-col gap-6) + kolom kanan 320px berisi
//      kotak Catatan — sama seperti dua kolom editor; pembungkus `flex flex-col md:flex-row` (kelola)
//      agar tidak melebar di layar sempit.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';

// Kotak pesan (kelas yang sama dengan FormulirLogin — KEPUTUSAN BARU Tahap 2)
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_SUKSES = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

// Kelas VERBATIM editor_artikel_admin (panel kanan)
const KELAS_LABEL = 'absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-md text-[12px] text-on-surface-variant';
const KELAS_INPUT = 'w-full border border-outline-variant rounded-lg px-4 py-3 font-body-md text-on-surface focus:ring-0 focus:border-secondary-fixed-dim bg-transparent';
const KELAS_TOMBOL_SIMPAN = 'px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_2px_4px_rgba(39,19,16,0.2)]';

/** Judul bagian + ikon per kelompok definisi. Kelompok baru tanpa entri di sini tetap dirender (judul = nama kelompok). */
const KELOMPOK = Object.freeze({
  statistik: { judul: 'Statistik Beranda', ikon: 'trending_up' },
  kontak: { judul: 'Kontak', ikon: 'contact_phone' },
  profil: { judul: 'Teks Organisasi', ikon: 'account_balance' },
  halaman_statis: { judul: 'Halaman Teks Statis', ikon: 'article' },
});

/** Mengelompokkan definisi menurut `kelompok`, urutan sesuai kemunculan pertama. */
function kelompokkan(definisi) {
  const urutan = [];
  const peta = new Map();
  for (const d of definisi) {
    if (!peta.has(d.kelompok)) { peta.set(d.kelompok, []); urutan.push(d.kelompok); }
    peta.get(d.kelompok).push(d);
  }
  return urutan.map((k) => ({ kelompok: k, judul: KELOMPOK[k]?.judul ?? k, ikon: KELOMPOK[k]?.ikon ?? 'settings', bidang: peta.get(k) }));
}

export default function FormulirPengaturan({ nilaiAwal = {}, definisi = [] }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(() => Object.fromEntries(definisi.map((d) => [d.kunci, nilaiAwal[d.kunci] ?? d.bawaan ?? ''])));
  const [pesan, setPesan] = useState({}); // {kelompok: {jenis: 'sukses'|'galat', teks}}
  const [sibuk, setSibuk] = useState(null); // kelompok yang sedang dikirim
  const daftarKelompok = kelompokkan(definisi);

  function ubah(kunci, v) {
    setNilai((s) => ({ ...s, [kunci]: v }));
  }

  async function simpanKelompok(ev, grup) {
    ev.preventDefault();
    if (sibuk) return;
    setSibuk(grup.kelompok);
    setPesan((p) => ({ ...p, [grup.kelompok]: null }));
    // Hanya kunci kelompok ini yang dikirim — daftar kunci datang dari definisi, bukan ditulis tangan.
    const muatan = Object.fromEntries(grup.bidang.map((d) => [d.kunci, nilai[d.kunci]]));
    try {
      const r = await fetch('/api/staf/pengaturan', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(muatan),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPesan((p) => ({ ...p, [grup.kelompok]: { jenis: 'galat', teks: data.galat || `Gagal menyimpan (HTTP ${r.status}).` } }));
        return;
      }
      if (data.nilai && typeof data.nilai === 'object') setNilai((s) => ({ ...s, ...data.nilai }));
      setPesan((p) => ({ ...p, [grup.kelompok]: { jenis: 'sukses', teks: `Perubahan ${grup.judul} tersimpan.` } }));
      router.refresh();
    } catch {
      setPesan((p) => ({ ...p, [grup.kelompok]: { jenis: 'galat', teks: 'Tidak dapat menghubungi server. Coba lagi.' } }));
    } finally {
      setSibuk(null);
    }
  }

  return (
    // KEPUTUSAN BARU: <main> desain digantikan <main> layout staf; padding p-margin-desktop dibawa pembungkus ini
    // (preseden app/(staf)/staf/artikel/page.js).
    <div className="p-margin-desktop">
      <div className="max-w-container-max mx-auto">
        {/* Header Section — kelola_artikel_admin */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Pengaturan</h2>
            <p className="text-on-surface-variant mt-2">Setelan situs: statistik beranda, kontak, teks organisasi, dan halaman teks statis.</p>
          </div>
        </header>
        {/* Editor Workspace — editor_artikel_admin (dua kolom) */}
        <div className="flex flex-col lg:flex-row gap-gutter w-full">
          {/* Left Column: kartu per kelompok */}
          <div className="flex-1 flex flex-col gap-6">
            {daftarKelompok.map((grup) => {
              const p = pesan[grup.kelompok];
              return (
                <form key={grup.kelompok} onSubmit={(ev) => simpanKelompok(ev, grup)} className="bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm" aria-labelledby={`judul-${grup.kelompok}`}>
                  <h3 id={`judul-${grup.kelompok}`} className="font-headline-md text-[20px] text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
                    <Ikon nama={grup.ikon} />
                    {grup.judul}
                  </h3>
                  <div className="space-y-5">
                    {grup.bidang.map((d) => {
                      const id = `pengaturan-${d.kunci}`;
                      const idKet = `${id}-keterangan`;
                      const umum = {
                        id,
                        name: d.kunci,
                        className: KELAS_INPUT,
                        value: nilai[d.kunci] ?? '',
                        onChange: (e) => ubah(d.kunci, e.target.value),
                        'aria-describedby': d.deskripsi ? idKet : undefined,
                      };
                      return (
                        <div key={d.kunci}>
                          <div className="relative">
                            <label htmlFor={id} className={KELAS_LABEL}>{d.label}</label>
                            {d.tipe === 'teks_panjang' ? (
                              <textarea {...umum} rows={8} />
                            ) : d.tipe === 'angka' ? (
                              <input {...umum} type="number" inputMode="numeric" min={0} step={1} />
                            ) : (
                              <input {...umum} type={d.kunci === 'kontak_email' ? 'email' : 'text'} />
                            )}
                          </div>
                          {d.deskripsi ? <p id={idKet} className="font-body-md text-[14px] text-outline mt-2">{d.deskripsi}</p> : null}
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-3">
                      <button type="submit" className={KELAS_TOMBOL_SIMPAN} disabled={sibuk === grup.kelompok}>
                        {sibuk === grup.kelompok ? 'Menyimpan…' : 'Simpan Perubahan'}
                      </button>
                      {p ? (
                        <div role="alert" aria-live="polite" className={p.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_SUKSES}>{p.teks}</div>
                      ) : null}
                    </div>
                  </div>
                </form>
              );
            })}
          </div>
          {/* Right Column: Catatan */}
          <div className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-xl p-5 flex items-start gap-3">
              <Ikon nama="verified" terisi className="text-secondary" />
              <div>
                <p className="font-label-md text-label-md text-on-secondary-fixed-variant mb-1">Catatan</p>
                <p className="font-body-md text-[13px] text-on-secondary-fixed-variant/80">
                  Seluruh kunci di halaman ini berasal dari <code>lib/pengaturanDefinisi.js</code>, daftar putih tunggal yang juga dipakai validasi tipe dan API. Menambah setelan cukup menambah satu entri di berkas itu; kunci di luar daftar ditolak API dengan pesan jelas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
