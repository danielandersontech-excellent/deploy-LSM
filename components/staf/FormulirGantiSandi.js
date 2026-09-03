'use client';
// components/staf/FormulirGantiSandi.js — ganti kata sandi sendiri (client). Kelas input/tombol/pesan
// persis FormulirLogin (login_staff_warkop_nusantara). POST /api/staf/ganti-sandi; sukses -> ke dashboard.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Ikon from '@/components/ui/Ikon';

const KELAS_INPUT = 'w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-DEFAULT focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md text-body-md transition-colors';
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_INFO = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

export default function FormulirGantiSandi({ wajib = false }) {
  const router = useRouter();
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState(null);

  async function kirim(e) {
    e.preventDefault();
    if (memuat) return;
    if (baru !== ulang) { setPesan({ jenis: 'galat', teks: 'Ulangi kata sandi baru tidak sama' }); return; }
    setMemuat(true); setPesan(null);
    try {
      const r = await fetch('/api/staf/ganti-sandi', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ kata_sandi_lama: lama, kata_sandi_baru: baru }) });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setPesan({ jenis: 'info', teks: 'Kata sandi berhasil diganti. Mengalihkan ke dashboard…' });
        router.replace('/staf/dashboard');
        router.refresh();
        return;
      }
      setPesan({ jenis: 'galat', teks: data.galat || 'Terjadi kesalahan. Silakan coba lagi.' });
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  const bidang = [
    { id: 'sandi-lama', label: wajib ? 'Kata Sandi Sementara (dari superadmin)' : 'Kata Sandi Lama', nilai: lama, set: setLama, auto: 'current-password' },
    { id: 'sandi-baru', label: 'Kata Sandi Baru (min. 10 karakter, huruf & angka)', nilai: baru, set: setBaru, auto: 'new-password' },
    { id: 'sandi-ulang', label: 'Ulangi Kata Sandi Baru', nilai: ulang, set: setUlang, auto: 'new-password' },
  ];

  return (
    <form className="space-y-6" onSubmit={kirim} noValidate>
      {pesan && (
        <div role="alert" aria-live="polite" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_INFO}>{pesan.teks}</div>
      )}
      {bidang.map((b) => (
        <div key={b.id}>
          <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor={b.id}>{b.label}</label>
          <div className="relative">
            <Ikon nama="key" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input className={KELAS_INPUT} id={b.id} name={b.id} type="password" autoComplete={b.auto} value={b.nilai} onChange={(e) => b.set(e.target.value)} disabled={memuat} required minLength={b.id === 'sandi-lama' ? 1 : 10} />
          </div>
        </div>
      ))}
      <button className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors paper-shadow mt-4 disabled:opacity-70" type="submit" disabled={memuat} aria-busy={memuat}>
        <span>{memuat ? 'Menyimpan…' : 'Simpan Kata Sandi Baru'}</span>
        <Ikon nama="save" className="text-sm" />
      </button>
    </form>
  );
}
