'use client';
// components/publik/TombolBagikan.js — dua tombol "Social Share Bar (Inline)" dari
// detail_artikel_investigasi/code.html. DOM + kelas disalin apa adanya; perubahan 18.2:
// (a) span material-symbols -> <Ikon>, (f) JSX. Butuh keadaan peramban (Web Share API,
// clipboard) sehingga menjadi client component kecil; halaman tetap server component.
//
// KEPUTUSAN BARU (desain tidak menentukan perilaku tombol):
//   - "share": Web Share API (navigator.share) bila tersedia (ponsel/Chromium); bila tidak,
//     membuka WhatsApp https://wa.me/?text=<judul + URL> di tab baru.
//   - "link": salin URL halaman ke papan klip (navigator.clipboard) dan umumkan lewat
//     wilayah sr-only role="status" (tidak mengubah tampilan). Tanpa dukungan clipboard
//     -> fallback membuka mailto: berisi tautan.
//   - aria-label diterjemahkan (aturan bahasa Indonesia untuk teks UI): "Bagikan artikel",
//     "Salin tautan". URL diambil dari window.location.href saat diklik agar benar di balik proxy.
import { useState } from 'react';
import Ikon from '@/components/ui/Ikon';

const KELAS_TOMBOL = 'w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-secondary hover:text-white transition-colors';

export default function TombolBagikan({ judul, ringkasan = '' }) {
  const [status, setStatus] = useState('');

  async function bagikan() {
    const url = window.location.href;
    const teks = ringkasan ? `${judul} — ${ringkasan}` : judul;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: judul, text: teks, url });
        setStatus('Artikel dibagikan.');
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // pengguna membatalkan
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${judul} ${url}`)}`, '_blank', 'noopener');
  }

  async function salinTautan() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Tautan disalin ke papan klip.');
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(judul)}&body=${encodeURIComponent(url)}`;
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button aria-label="Bagikan artikel" className={KELAS_TOMBOL} type="button" onClick={bagikan}>
        <Ikon nama="share" />
      </button>
      <button aria-label="Salin tautan" className={KELAS_TOMBOL} type="button" onClick={salinTautan}>
        <Ikon nama="link" />
      </button>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
    </div>
  );
}
