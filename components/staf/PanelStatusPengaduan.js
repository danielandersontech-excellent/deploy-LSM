'use client';
// components/staf/PanelStatusPengaduan.js — kotak "Tindak Lanjut" halaman detail pengaduan (staf):
// ubah status (catatan internal WAJIB, ≥ 10 karakter) + penugasan petugas. Client component
// karena butuh fetch + router.refresh(). Dirender HANYA untuk peran HAK.pengaduan_ubah_status
// (halaman); API tetap memagari sendiri (requireRole) — pagar utama ada di route.
//   - Status  : POST  /api/staf/pengaduan/<id>/status  { status, catatan }  (buku besar, satu-satunya jalan)
//   - Petugas : PATCH /api/staf/pengaduan/<id>         { petugas_id }
// KEPUTUSAN BARU (REFERENSI 18.4, layar ini tidak ada di ZIP): kartu formulir + kepala kartu
// bg-primary + select/textarea bergaris bawah (.form-input-focus) disalin dari
// kontak_pengaduan_warkop_nusantara_updated_logo/code.html; tombol dari KELAS_TOMBOL.kirim/ringkas.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';
import { KELAS_TOMBOL } from '@/components/ui/Tombol';
import { STATUS_PENGADUAN, labelStatusPengaduan } from '@/lib/kategoriPengaduan';

const CATATAN_MIN = 10;
const KELAS_INPUT = 'w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0 appearance-none cursor-pointer';
const KELAS_LABEL = 'font-label-md text-label-md text-primary block mb-1';

async function bacaGalat(res, bawaan) {
  const muatan = await res.json().catch(() => null);
  return muatan?.galat ?? `${bawaan} (HTTP ${res.status}).`;
}

function Pesan({ pesan }) {
  if (!pesan) return null;
  return (
    <p className={`font-body-md text-body-md ${pesan.jenis === 'galat' ? 'text-error' : 'text-primary'}`} role={pesan.jenis === 'galat' ? 'alert' : 'status'}>
      {pesan.teks}
    </p>
  );
}

export default function PanelStatusPengaduan({ id, statusSaatIni, petugasSaatIni = null, kandidat = [] }) {
  const router = useRouter();
  const [statusTujuan, setStatusTujuan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [sibukStatus, setSibukStatus] = useState(false);
  const [pesanStatus, setPesanStatus] = useState(null); // { jenis: 'galat'|'sukses', teks }
  const [petugas, setPetugas] = useState(petugasSaatIni == null ? '' : String(petugasSaatIni));
  const [sibukPetugas, setSibukPetugas] = useState(false);
  const [pesanPetugas, setPesanPetugas] = useState(null);

  const pilihanStatus = STATUS_PENGADUAN.filter((s) => s.slug !== statusSaatIni);

  async function kirimStatus(e) {
    e.preventDefault();
    setPesanStatus(null);
    const catatanBersih = catatan.replace(/\s+/g, ' ').trim();
    if (!statusTujuan) { setPesanStatus({ jenis: 'galat', teks: 'Pilih status tujuan lebih dulu.' }); return; }
    if (catatanBersih.length < CATATAN_MIN) {
      setPesanStatus({ jenis: 'galat', teks: `Catatan internal wajib diisi (minimal ${CATATAN_MIN} karakter).` });
      return;
    }
    setSibukStatus(true);
    try {
      const res = await fetch(`/api/staf/pengaduan/${id}/status`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ status: statusTujuan, catatan: catatanBersih }),
      });
      if (!res.ok) { setPesanStatus({ jenis: 'galat', teks: await bacaGalat(res, 'Gagal menyimpan perubahan status') }); return; }
      setPesanStatus({ jenis: 'sukses', teks: `Status diubah menjadi "${labelStatusPengaduan(statusTujuan)}" dan tercatat di riwayat.` });
      setStatusTujuan('');
      setCatatan('');
      router.refresh();
    } catch {
      setPesanStatus({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.' });
    } finally {
      setSibukStatus(false);
    }
  }

  async function kirimPetugas(e) {
    e.preventDefault();
    setPesanPetugas(null);
    setSibukPetugas(true);
    try {
      const res = await fetch(`/api/staf/pengaduan/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ petugas_id: petugas === '' ? null : Number(petugas) }),
      });
      if (!res.ok) { setPesanPetugas({ jenis: 'galat', teks: await bacaGalat(res, 'Gagal menyimpan penugasan') }); return; }
      setPesanPetugas({ jenis: 'sukses', teks: petugas === '' ? 'Penugasan dihapus.' : 'Petugas ditugaskan.' });
      router.refresh();
    } catch {
      setPesanPetugas({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.' });
    } finally {
      setSibukPetugas(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-tertiary rounded-lg pressed-paper-shadow">
      {/* Kepala kartu — kelas verbatim "Form Header" kontak_pengaduan */}
      <div className="bg-primary p-6 rounded-t-lg border-b border-tertiary">
        <h2 className="font-headline-md text-headline-md text-on-primary flex items-center gap-3">
          <Ikon nama="update" terisi className="text-secondary-fixed" />
          Tindak Lanjut
        </h2>
        <p className="font-body-md text-body-md text-on-primary-container mt-1">Setiap perubahan status wajib disertai catatan internal dan tercatat di buku besar.</p>
      </div>

      {/* Ubah status */}
      <form className="p-6 space-y-8" onSubmit={kirimStatus}>
        <section className="space-y-5">
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
            Ubah Status
          </h3>
          <div className="form-input-focus border-b border-outline-variant transition-colors">
            <label htmlFor="status-tujuan" className={KELAS_LABEL}>Status tujuan</label>
            <select id="status-tujuan" name="status" required value={statusTujuan} onChange={(e) => setStatusTujuan(e.target.value)} disabled={sibukStatus} className={KELAS_INPUT}>
              <option disabled value="">Pilih status tujuan...</option>
              {pilihanStatus.map((s) => (
                <option key={s.slug} value={s.slug}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-input-focus border-b border-outline-variant transition-colors">
            <label htmlFor="catatan-internal" className="font-label-md text-label-md text-primary block mb-2">Catatan internal (wajib)</label>
            <textarea id="catatan-internal" name="catatan" required minLength={CATATAN_MIN} rows={4} value={catatan} onChange={(e) => setCatatan(e.target.value)} disabled={sibukStatus}
              className="w-full bg-transparent border border-outline-variant rounded p-3 focus:border-secondary focus:ring-0 font-body-md text-body-md text-on-surface"
              placeholder="Alasan perubahan status, temuan lapangan, atau tindak lanjut (minimal 10 karakter)" />
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">Catatan ini hanya terlihat oleh staf dan tidak dapat diubah setelah disimpan.</p>
          </div>
          <Pesan pesan={pesanStatus} />
          <div className="pt-6 border-t border-outline-variant flex justify-end gap-4">
            <button type="submit" className={KELAS_TOMBOL.kirim} disabled={sibukStatus}>
              {sibukStatus ? 'Menyimpan…' : 'Simpan Perubahan Status'}
              <Ikon nama="save" terisi className="text-[18px]" />
            </button>
          </div>
        </section>
      </form>

      {/* Penugasan petugas */}
      <form className="p-6 space-y-8" onSubmit={kirimPetugas}>
        <section className="space-y-5">
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-outline-variant">
            Penugasan Petugas
          </h3>
          <div className="form-input-focus border-b border-outline-variant transition-colors">
            <label htmlFor="petugas-id" className={KELAS_LABEL}>Petugas penanggung jawab</label>
            <select id="petugas-id" name="petugas_id" value={petugas} onChange={(e) => setPetugas(e.target.value)} disabled={sibukPetugas} className={KELAS_INPUT}>
              <option value="">— Belum ditugaskan —</option>
              {kandidat.map((k) => (
                <option key={k.id} value={String(k.id)}>{k.nama} ({k.peran})</option>
              ))}
            </select>
          </div>
          <Pesan pesan={pesanPetugas} />
          <div className="pt-6 border-t border-outline-variant flex justify-end gap-4">
            <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`} disabled={sibukPetugas}>
              {sibukPetugas ? 'Menyimpan…' : 'Simpan Penugasan'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
