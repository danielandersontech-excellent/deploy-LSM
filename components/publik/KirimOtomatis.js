'use client';
// components/publik/KirimOtomatis.js — QA-1 butir 2: desain menggambar <select> filter yang LANGSUNG berlaku (tanpa tombol
// "Terapkan"). Formulir tetap <form method="get"> yang bekerja tanpa JavaScript: tombol kirim dirender di dalam <noscript>
// oleh pemanggil, sedangkan komponen ini (tanpa tampilan) mengirim ulang formulir induk saat <select>/<input type=date>
// berubah. Pencarian teks tetap dikirim dengan Enter (perilaku bawaan formulir). KEPUTUSAN BARU.
import { useEffect, useRef } from 'react';

export default function KirimOtomatis() {
  const ref = useRef(null);
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return undefined;
    const tangani = (e) => {
      const el = e.target;
      if (el.matches('select, input[type="date"]')) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.submit();
      }
    };
    form.addEventListener('change', tangani);
    return () => form.removeEventListener('change', tangani);
  }, []);
  return <span ref={ref} hidden />;
}
