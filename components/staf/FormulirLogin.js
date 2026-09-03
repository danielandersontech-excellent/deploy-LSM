'use client';
// components/staf/FormulirLogin.js — formulir login (client). Kelas persis dari
// login_staff_warkop_nusantara/code.html. Mengirim JSON ke /api/auth/login;
// cookie httpOnly diset server. Keadaan: memuat, galat kredensial (401),
// terlalu banyak percobaan (429), galat server.
import { useState } from 'react';
import Ikon from '@/components/ui/Ikon';

// Kotak pesan: kelas lencana galat/status dari kelola_pengaduan_admin (REFERENSI 10) — KEPUTUSAN BARU
const KELAS_PESAN_GALAT = 'bg-error-container text-on-error-container border border-error/20 rounded px-3 py-2 font-body-md text-body-md text-sm';
const KELAS_PESAN_INFO = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20 rounded px-3 py-2 font-body-md text-body-md text-sm';

export default function FormulirLogin({ lanjut = '/staf/dashboard' }) {
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [pesan, setPesan] = useState(null); // {jenis:'galat'|'info', teks}

  async function kirim(e) {
    e.preventDefault();
    if (memuat) return;
    setMemuat(true);
    setPesan(null);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, kataSandi }),
        credentials: 'same-origin',
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setPesan({ jenis: 'info', teks: `Berhasil masuk sebagai ${data.pengguna?.nama ?? 'staf'}. Mengalihkan…` });
        window.location.assign(lanjut || data.tujuan || '/staf/dashboard');
        return;
      }
      if (r.status === 429) {
        const detik = Number(data.cobaLagiDetik) || 0;
        setPesan({ jenis: 'galat', teks: `Terlalu banyak percobaan masuk. Coba lagi dalam ${detik ? Math.ceil(detik / 60) + ' menit' : 'beberapa menit'}.` });
      } else if (r.status === 401) {
        // Pesan netral dari server: email tidak ada / sandi salah / akun nonaktif tidak dibedakan
        setPesan({ jenis: 'galat', teks: data.galat || 'Email atau kata sandi tidak sesuai' });
      } else {
        setPesan({ jenis: 'galat', teks: data.galat || 'Terjadi kesalahan. Silakan coba lagi.' });
      }
    } catch {
      setPesan({ jenis: 'galat', teks: 'Tidak dapat menghubungi server. Periksa koneksi Anda.' });
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={kirim} noValidate>
      {pesan && (
        <div role="alert" aria-live="polite" className={pesan.jenis === 'galat' ? KELAS_PESAN_GALAT : KELAS_PESAN_INFO}>
          {pesan.teks}
        </div>
      )}
      <div>
        <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="staff-id">ID Staff / Email Resmi</label>
        <div className="relative">
          <Ikon nama="badge" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-DEFAULT focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md text-body-md transition-colors"
            id="staff-id"
            name="staff-id"
            placeholder="Contoh: WN-2024-001"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={memuat}
            required
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Kata Sandi</label>
          <a className="font-label-md text-label-md text-primary hover:text-secondary hover:underline transition-colors" href="/kontak">Lupa Kata Sandi?</a>
        </div>
        <div className="relative">
          <Ikon nama="key" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-DEFAULT focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md text-body-md transition-colors"
            id="password"
            name="password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            disabled={memuat}
            required
          />
        </div>
      </div>
      <button
        className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors paper-shadow mt-4 disabled:opacity-70"
        type="submit"
        disabled={memuat}
        aria-busy={memuat}
      >
        <span>{memuat ? 'Memeriksa…' : 'Masuk Sistem'}</span>
        <Ikon nama="login" className="text-sm" />
      </button>
    </form>
  );
}
