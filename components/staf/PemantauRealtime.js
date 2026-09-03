'use client';
// components/staf/PemantauRealtime.js — penerapan realtime di antarmuka (TAHAP-08 §7). Realtime = penyempurna:
// halaman tetap server component yang memuat data lewat lib/db; komponen ini hanya MEMICU pemuatan ulang halus
// (`router.refresh()` — Next memuat ulang server component tanpa memindahkan posisi gulir) dan memberi sorotan.
//
// mode 'dashboard'        : setiap pengaduan:baru / pengaduan:status / artikel:terbit -> refresh (dibatasi 1×/1,5 s),
//                           baris/kartu bernomor kasus terbaru disorot sesaat (data-nomor="WRP-…").
// mode 'daftar-pengaduan' : halaman 1 tanpa filter -> refresh + sorotan; sedang menyaring / halaman > 1 ->
//                           daftar TIDAK diubah, muncul penanda "ada N laporan baru — muat ulang" (§7).
// Sambungan pulih setelah terputus -> refresh (menyusul ketinggalan, event yang lewat sudah hilang).
// Sambungan gagal/ditolak -> tanpa galat; hanya penanda kecil bila terputus (§6).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSocket from '@/hooks/useSocket';
import Ikon from '@/components/ui/Ikon';

const KELAS_PENANDA = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-xs font-semibold border border-secondary-fixed-dim';
const KELAS_TERPUTUS = 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-xs font-semibold border border-outline-variant';

export default function PemantauRealtime({ mode = 'dashboard', bebasFilter = true }) {
  const router = useRouter();
  const [tertunda, setTertunda] = useState([]);       // nomor kasus yang belum dimuat (mode daftar saat menyaring)
  const [sorot, setSorot] = useState(null);           // nomor kasus yang disorot sesaat
  const [pesan, setPesan] = useState(null);           // toast halus
  const refWaktu = useRef(0);
  const refTimer = useRef(null);

  // Muat ulang halus, dibatasi 1× per 1,5 s (beban: 20 pengaduan beruntun -> beberapa refresh saja)
  const muatUlang = useCallback(() => {
    const kini = Date.now();
    const jeda = Math.max(0, 1500 - (kini - refWaktu.current));
    clearTimeout(refTimer.current);
    refTimer.current = setTimeout(() => { refWaktu.current = Date.now(); router.refresh(); }, jeda);
  }, [router]);

  const terima = useCallback((jenis, m) => {
    const nomor = m?.nomorKasus ?? null;
    if (mode === 'daftar-pengaduan' && !bebasFilter) {
      // Jangan ubah daftar di bawah tangan pengguna yang menyaring — cukup penanda.
      if (nomor) setTertunda((d) => (d.includes(nomor) ? d : [...d, nomor]));
      return;
    }
    if (nomor) { setSorot(nomor); setTimeout(() => setSorot((s) => (s === nomor ? null : s)), 4000); }
    setPesan(jenis === 'artikel' ? `Artikel terbit: ${m?.judul ?? ''}` : jenis === 'status' ? `${nomor}: ${m?.statusSebelum} → ${m?.statusSesudah}` : `Pengaduan baru ${nomor}${m?.wilayah ? ` · ${m.wilayah}` : ''}`);
    setTimeout(() => setPesan(null), 5000);
    muatUlang();
  }, [mode, bebasFilter, muatUlang]);

  const keadaan = useSocket(
    {
      'pengaduan:baru': (m) => terima('baru', m),
      'pengaduan:status': (m) => terima('status', m),
      'artikel:terbit': (m) => { if (mode === 'dashboard') terima('artikel', m); },
    },
    { onSambungUlang: muatUlang },
  );

  // Sorotan sesaat pada baris bernomor kasus terbaru (setelah refresh, elemen data-nomor ada di DOM)
  useEffect(() => {
    if (!sorot || typeof document === 'undefined') return undefined;
    const el = document.querySelector(`[data-nomor="${sorot}"]`);
    if (!el) return undefined;
    el.classList.add('bg-secondary-fixed');
    const t = setTimeout(() => el.classList.remove('bg-secondary-fixed'), 3000);
    return () => clearTimeout(t);
  }, [sorot, pesan]);

  useEffect(() => () => clearTimeout(refTimer.current), []);

  // KEPUTUSAN BARU: keadaan sambungan dicatat sebagai atribut data-realtime pada <html> (tak tampak; tanpa
  // perubahan visual) agar uji peramban/diagnostik dapat menunggu "tersambung" sebelum memicu kejadian.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.documentElement.dataset.realtime = keadaan;
    return () => { delete document.documentElement.dataset.realtime; };
  }, [keadaan]);

  const adaTertunda = tertunda.length > 0;
  if (!pesan && !adaTertunda && keadaan !== 'terputus') return null;

  return (
    // KEPUTUSAN BARU: penanda diletakkan TETAP (fixed) di sudut kanan bawah, di luar alur dokumen, agar kemunculannya
    // tidak menggeser isi/gulir halaman (uji i: scrollTop sempat bergeser 42 px saat penanda masuk ke alur di atas tabel).
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 max-w-[min(90vw,28rem)]" aria-live="polite">
      {keadaan === 'terputus' ? (
        <span className={KELAS_TERPUTUS}><Ikon nama="update" className="text-[14px]" /> Sambungan langsung terputus — data diperbarui saat tersambung kembali</span>
      ) : null}
      {pesan ? <span className={KELAS_PENANDA}><Ikon nama="fiber_new" className="text-[14px]" /> {pesan}</span> : null}
      {adaTertunda ? (
        <button type="button" className={`${KELAS_PENANDA} hover:bg-secondary-fixed-dim transition-colors`} onClick={() => { setTertunda([]); router.refresh(); }}>
          <Ikon nama="fiber_new" className="text-[14px]" /> Ada {tertunda.length} laporan baru — muat ulang
        </button>
      ) : null}
    </div>
  );
}
