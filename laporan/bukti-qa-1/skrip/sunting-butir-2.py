# QA-1 butir 2 — suntingan kode (dijalankan sekali; disimpan sebagai bukti perubahan yang dilakukan)
import re

def sunting(p, pasangan):
    s = open(p, encoding='utf-8').read()
    for lama, baru in pasangan:
        assert lama in s, (p, lama[:70]); s = s.replace(lama, baru, 1)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)

# 1. Navbar: logo h-8 w-8 seperti desain; merek tanpa nowrap/shrink (desain tidak punya) — item menu muat satu baris
sunting('components/publik/NavPublik.js', [
 ('className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2 max-w-full lg:shrink-0 lg:whitespace-nowrap" href="/">',
  'className="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2 max-w-full" href="/">'),
 ('<Image alt="WARKOP NUSANTARA Logo" className="h-16 w-16 object-contain rounded-full" src="/logo-warkop.png" width={64} height={64} priority />',
  '{/* QA-1: ukuran logo mengikuti desain (h-8 w-8); h-16 sebelumnya membuat merek melebar dan menu turun ke baris kedua di 1280 px */}\n          <Image alt="WARKOP NUSANTARA Logo" className="h-8 w-8 object-cover rounded-full" src="/logo-warkop.png" width={32} height={32} priority />'),
])
# 2. Berita: grid 2 kolom di kolom utama; Terapkan -> noscript + KirimOtomatis
sunting('app/(publik)/berita/page.js', [
 ("import TautanKartu from '@/components/publik/TautanKartu';", "import TautanKartu from '@/components/publik/TautanKartu';\nimport KirimOtomatis from '@/components/publik/KirimOtomatis';"),
 ('            {/* Tombol kirim tidak digambar desain — KEPUTUSAN BARU (sama seperti /program): KELAS_TOMBOL.ringkas + px-4 */}\n            <div className="w-full md:w-auto relative z-10">\n              <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4 w-full`}>Terapkan</button>\n            </div>',
  '            {/* QA-1: desain tanpa tombol — <select> langsung berlaku (KirimOtomatis); tombol hanya tampil tanpa JavaScript */}\n            <KirimOtomatis />\n            <noscript>\n              <div className="w-full md:w-auto relative z-10">\n                <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4 w-full`}>Terapkan</button>\n              </div>\n            </noscript>'),
 ('<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter" aria-label="Daftar artikel">',
  '{/* QA-1: di dalam kolom utama (2/3 lebar) grid mengikuti portal_berita_beranda "Berita Terkini" (md:grid-cols-2 gap-6); lg:grid-cols-3 membuat kartu terjepit & judul terpotong */}\n              <section className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Daftar artikel">'),
])
# 3. Program: select status disembunyikan (tidak digambar desain); Terapkan -> noscript + KirimOtomatis; panah ukuran ikon desain
sunting('app/(publik)/program/page.js', [
 ("import Link from 'next/link';", "import Link from 'next/link';\nimport KirimOtomatis from '@/components/publik/KirimOtomatis';"),
 ('            <label htmlFor="status" className="sr-only">Status program</label>\n            <select id="status" name="status" defaultValue={status}',
  '            {/* QA-1: select status tidak digambar desain -> tidak dirender (parameter ?status= tetap didukung URL/API) */}\n            {status ? <input type="hidden" name="status" value={status} /> : null}\n            {false ? <select id="status" name="status" defaultValue={status}'),
 ('            {/* Tombol kirim tidak digambar desain — KEPUTUSAN BARU: KELAS_TOMBOL.ringkas + px-4 (kelas yang ada di ZIP) */}\n            <button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button>',
  '            <KirimOtomatis />\n            <noscript><button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button></noscript>'),
 ('<Ikon nama="arrow_forward" className="transform group-hover/btn:translate-x-1 transition-transform" />',
  '<Ikon nama="arrow_forward" className="text-2xl transform group-hover/btn:translate-x-1 transition-transform" />'),
])
# 4. Kelola artikel: Terapkan -> noscript + KirimOtomatis
sunting('app/(staf)/staf/artikel/page.js', [
 ('<button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button>', '<KirimOtomatis />\n            <noscript><button type="submit" className={`${KELAS_TOMBOL.ringkas} px-4`}>Terapkan</button></noscript>'),
])
p = 'app/(staf)/staf/artikel/page.js'; s = open(p, encoding='utf-8').read()
if "KirimOtomatis from" not in s:
    s = re.sub(r"^(import [^\n]*;\n)", r"\1import KirimOtomatis from '@/components/publik/KirimOtomatis';\n", s, count=1, flags=re.M)
open(p, 'w', encoding='utf-8').write(s)
# 5. Galeri: dua input tanggal berdampingan (flex-1) agar sejajar dengan kolom lain
p = 'app/(publik)/galeri/page.js'; s = open(p, encoding='utf-8').read()
s = s.replace('<div className="relative flex flex-wrap items-center gap-2">', '<div className="relative flex items-center gap-2">', 1)
s = s.replace('className="w-full bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md" id="date-range"', 'className="w-full min-w-0 flex-1 bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md" id="date-range"', 1)
s = s.replace('className="w-full bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md [&::-webkit-calendar-picker-indicator]:opacity-0" id="date-range-sampai"', 'className="w-full min-w-0 flex-1 bg-surface border border-outline-variant rounded px-4 py-2 text-on-surface focus:border-secondary-fixed-dim focus:ring-0 font-body-md text-body-md [&::-webkit-calendar-picker-indicator]:opacity-0" id="date-range-sampai"', 1)
open(p, 'w', encoding='utf-8').write(s); print('ok galeri')
# 6. Cap air lebih lembut (beranda hero, tentang hero, login latar)
for p in ['app/(publik)/page.js', 'app/(publik)/tentang/page.js', 'app/(auth)/login/page.js']:
    s = open(p, encoding='utf-8').read()
    if p.endswith('tentang/page.js'):
        s = s.replace("style={{ backgroundImage: \"url('/logo-warkop-besar.png')\" }}", "style={{ backgroundImage: \"url('/logo-warkop-cap-air.png')\" }}", 1)
    else:
        s = s.replace('src="/logo-warkop-besar.png"', 'src="/logo-warkop-cap-air.png"', 1)
    open(p, 'w', encoding='utf-8').write(s); print('cap air:', p)
