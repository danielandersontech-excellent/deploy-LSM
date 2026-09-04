# QA-2 — B1 navbar rapi (1280+), B6 filter/paginasi tidak melompat ke atas (client-side navigation tanpa scroll).
import re

def baca(p): return open(p, encoding='utf-8').read()
def tulis(p, s): open(p, 'w', encoding='utf-8').write(s)

# ---------- B6: KirimOtomatis -> router.replace(url, { scroll: false }) alih-alih submit penuh
p = 'components/publik/KirimOtomatis.js'
tulis(p, """'use client';
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
    const tangani = (e) => {
      const el = e.target;
      if (!el.matches('select, input[type="date"]')) return;
      const data = new FormData(form);
      const q = new URLSearchParams();
      for (const [k, v] of data.entries()) { if (typeof v === 'string' && v !== '' && k !== 'halaman') q.set(k, v); }
      const aksi = form.getAttribute('action') || window.location.pathname;
      const url = q.toString() ? `${aksi}?${q}` : aksi;
      router.replace(url, { scroll: false });
    };
    form.addEventListener('change', tangani);
    return () => form.removeEventListener('change', tangani);
  }, [router]);
  return <span ref={ref} hidden />;
}
"""); print('KirimOtomatis: router.replace scroll:false')

# ---------- B6: scroll={false} pada tautan filter/paginasi (paginasi, pil status/kategori, muat lebih banyak)
TARGET = {
    'components/ui/Paginasi.js': r"buatHref\(",
    'app/(publik)/program/page.js': r"kategori|halaman|hrefHalaman|buatHref",
    'app/(publik)/galeri/page.js': r"halaman|buatHref",
    'app/(staf)/staf/pengaduan/page.js': r"hrefHalaman|buatHref|status|hrefStatus",
    'app/(staf)/staf/artikel/page.js': r"buatHref\(halaman|buatHref\(n\)",
}
for p, pola in TARGET.items():
    s = baca(p); baris = s.split('\n'); n = 0
    for i, b in enumerate(baris):
        if '<Link' in b and 'scroll=' not in b and re.search(pola, b) and 'href=' in b and '/staf/artikel/' not in b and '/staf/pengaduan/${' not in b:
            baris[i] = b.replace('<Link', '<Link scroll={false}', 1); n += 1
    tulis(p, '\n'.join(baris)); print(f'scroll={{false}} {p}: {n} tautan')

# ---------- B1: navbar rapi 1280+ (KEPUTUSAN PEMILIK; boleh menyimpang dari desain yang cacat)
p = 'components/publik/NavPublik.js'; s = baca(p)
s = s.replace('<nav className="hidden md:flex items-center gap-6 mt-4 md:mt-0" aria-label="Navigasi utama">',
              '{/* QA-2 B1 (KEPUTUSAN PEMILIK): desain membuat "Berita" menyentuh kotak cari di 1280 px. Jarak item gap-4 (xl: gap-6),\n            teks item satu baris mulai lg, merek satu baris mulai lg, kotak cari w-40 (xl: w-48) -> 7 menu + cari + Masuk Staff rapi 1280-1920. */}\n        <nav className="hidden md:flex items-center gap-4 xl:gap-6 mt-4 md:mt-0" aria-label="Navigasi utama">', 1)
s = s.replace("const KELAS_TAUTAN = 'font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200';",
              "const KELAS_TAUTAN = 'font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200 lg:whitespace-nowrap';")
s = s.replace("const KELAS_TAUTAN_AKTIF = 'font-label-md text-label-md text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90 transition-all duration-150';",
              "const KELAS_TAUTAN_AKTIF = 'font-label-md text-label-md text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90 transition-all duration-150 lg:whitespace-nowrap';")
s = s.replace('className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2 max-w-full" href="/">',
              'className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2 max-w-full lg:whitespace-nowrap lg:shrink-0" href="/">')
s = s.replace('focus:ring-1 focus:ring-secondary w-48 transition-all" placeholder="Cari..." type="text" />',
              'focus:ring-1 focus:ring-secondary w-40 xl:w-48 transition-all" placeholder="Cari..." type="text" />')
tulis(p, s); print('navbar B1:', s.count('lg:whitespace-nowrap'), 'nowrap;', 'w-40 xl:w-48' in s)
