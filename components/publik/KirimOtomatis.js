'use client';
// components/publik/KirimOtomatis.js — QA-1 butir 2: desain menggambar <select> filter yang LANGSUNG berlaku (tanpa tombol
// "Terapkan"). Formulir tetap <form method="get"> yang bekerja tanpa JavaScript: tombol kirim dirender di dalam <noscript>
// oleh pemanggil. Komponen ini (tanpa tampilan) menerapkan filter saat <select>/<input type=date> berubah.
// QA-2 B6 (KEPUTUSAN PEMILIK): penerapan lewat NAVIGASI KLIEN (router.replace dengan scroll:false) sehingga posisi gulir
// dipertahankan, bukan requestSubmit() yang memuat ulang halaman ke atas. Pencarian teks tetap Enter (kirim formulir).
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function KirimOtomatis() {
  const ref = useRef(null);
  const router = useRouter();
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return undefined;
    const terapkan = () => {
      const data = new FormData(form);
      const q = new URLSearchParams();
      for (const [k, v] of data.entries()) { if (typeof v === 'string' && v !== '' && k !== 'halaman') q.set(k, v); }
      const aksi = form.getAttribute('action') || window.location.pathname;
      const url = q.toString() ? `${aksi}?${q}` : aksi;
      router.replace(url, { scroll: false });
    };
    const tangani = (e) => { if (e.target.matches('select, input[type="date"]')) terapkan(); };
    // tombol "Terapkan"/Enter pada pencarian juga lewat navigasi klien (posisi gulir tetap); tanpa JS tetap GET biasa
    const kirim = (e) => { e.preventDefault(); terapkan(); };
    form.addEventListener('change', tangani); form.addEventListener('submit', kirim);
    return () => { form.removeEventListener('change', tangani); form.removeEventListener('submit', kirim); };
  }, [router]);
  return <span ref={ref} hidden />;
}
