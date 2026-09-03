'use client';
// hooks/useViewportTinggi.js — pengganti 100vh (aturan 5, pelajaran Cap Jiki nomor 5).
// Mengukur tinggi viewport yang BENAR-BENAR terlihat lewat window.visualViewport
// (bilah alamat iOS/Android ikut diperhitungkan), dalam piksel, dan mengukur ulang
// saat ukuran berubah atau layar berputar. Pakai untuk hamparan layar penuh
// (Dialog, laci) — jangan pernah menulis 100vh di kelas maupun style.
//
//   const tinggi = useViewportTinggi();           // number | null (null saat render server)
//   <div style={{ height: tinggi ?? undefined }} />
import { useEffect, useState } from 'react';

function ukur() {
  if (typeof window === 'undefined') return null;
  const vv = window.visualViewport;
  return Math.round(vv?.height ?? window.innerHeight);
}

export default function useViewportTinggi() {
  const [tinggi, setTinggi] = useState(null);

  useEffect(() => {
    const perbarui = () => setTinggi(ukur());
    perbarui();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', perbarui);
    vv?.addEventListener('scroll', perbarui);
    window.addEventListener('resize', perbarui);
    window.addEventListener('orientationchange', perbarui);
    return () => {
      vv?.removeEventListener('resize', perbarui);
      vv?.removeEventListener('scroll', perbarui);
      window.removeEventListener('resize', perbarui);
      window.removeEventListener('orientationchange', perbarui);
    };
  }, []);

  return tinggi;
}
