// components/ui/Pemuat.js — indikator memuat. Stitch tidak menggambar keadaan memuat ->
// KEPUTUSAN BARU (REFERENSI 18.4): ikon "pending" (ada di ZIP, kartu program) berputar dengan
// animate-spin, teks font-label-md text-on-surface-variant. role="status" untuk pembaca layar.
import Ikon from '@/components/ui/Ikon';

export default function Pemuat({ teks = 'Memuat…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-8 text-on-surface-variant font-label-md text-label-md${className ? ` ${className}` : ''}`} role="status" aria-live="polite">
      <Ikon nama="pending" className="text-secondary text-3xl animate-spin" />
      <span>{teks}</span>
    </div>
  );
}
