'use client';
// components/ui/Dialog.js — dialog modal lewat React Portal (aturan 4 & 6: hamparan layar penuh
// satu pendekatan, tanpa !important). Tinggi hamparan dari useViewportTinggi (aturan 5, bukan 100vh).
// Stitch tidak menggambar dialog -> KEPUTUSAN BARU (REFERENSI 18.4): panel memakai kelas kartu
// login_staff_warkop_nusantara (bg-surface-container-lowest border-outline-variant rounded-lg
// paper-shadow), kepala bg-primary + teks on-primary, hamparan bg-primary/60.
//   <Dialog terbuka={buka} onTutup={() => setBuka(false)} judul="Konfirmasi">…</Dialog>
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Ikon from '@/components/ui/Ikon';
import useViewportTinggi from '@/hooks/useViewportTinggi';

export default function Dialog({ terbuka, onTutup, judul, children, lebar = 'max-w-md' }) {
  const tinggi = useViewportTinggi();
  const idJudul = useId();
  const panelRef = useRef(null);

  // Escape menutup; fokus dipindah ke panel saat terbuka; gulir latar dikunci
  useEffect(() => {
    if (!terbuka) return undefined;
    const sebelumnya = document.activeElement;
    panelRef.current?.focus();
    const tekan = (e) => { if (e.key === 'Escape') onTutup?.(); };
    document.addEventListener('keydown', tekan);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', tekan);
      document.body.style.overflow = overflow;
      if (sebelumnya instanceof HTMLElement) sebelumnya.focus();
    };
  }, [terbuka, onTutup]);

  if (!terbuka || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-[70] bg-primary/60 flex items-center justify-center p-4"
      style={{ height: tinggi ?? undefined, bottom: tinggi == null ? 0 : undefined }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup?.(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        tabIndex={-1}
        className={`relative z-10 w-full ${lebar} bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden focus:outline-none`}
      >
        <div className="bg-primary px-6 py-4 flex items-center justify-between border-b border-outline-variant">
          <h2 id={idJudul} className="font-headline-md text-headline-md text-on-primary tracking-tight">{judul}</h2>
          <button type="button" className="text-on-primary opacity-80 hover:opacity-100 transition-opacity" onClick={onTutup} aria-label="Tutup dialog">
            <Ikon nama="close" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
