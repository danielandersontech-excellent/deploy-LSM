// components/ui/Lencana.js — lencana. Kelas VERBATIM dari ZIP.
//
// 1) Status pengaduan (REFERENSI 10, dari kelola_pengaduan_admin/code.html):
//      <Lencana status="baru" />  -> label + kelas sesuai tabel; pembungkus selalu
//      "inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-xs".
//      'diverifikasi' dan 'ditolak' tidak digambar -> KEPUTUSAN BARU (sudah ditetapkan REFERENSI 10).
// 2) Varian lain (prop `varian`) untuk kategori galeri dan lencana beranda:
//      'galeri-emas' / 'galeri-merah' / 'galeri-abu'  — galeri_dokumentasi/code.html
//      'investigasi' — "Investigasi Khusus" beranda (bg-error), 'kategori' — "Pelayanan Publik" beranda
import { labelStatusPengaduan } from '@/lib/kategoriPengaduan';

const PEMBUNGKUS_STATUS = 'inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-xs';

export const KELAS_STATUS_PENGADUAN = Object.freeze({
  baru: 'bg-error-container text-on-error-container border border-error/20',
  diverifikasi: 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/20',
  diproses: 'bg-secondary-container text-on-secondary-container border border-secondary/20',
  selesai: 'bg-surface-container-highest text-on-surface border border-outline-variant',
  ditolak: 'bg-inverse-surface text-inverse-on-surface border border-outline',
});

export const KELAS_LENCANA = Object.freeze({
  'galeri-emas': 'inline-block bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-[12px] px-3 py-1 rounded-full mb-3 uppercase tracking-wider border border-secondary-fixed-dim shadow-sm',
  'galeri-merah': 'inline-block bg-error-container text-on-error-container font-label-md text-[10px] px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider border border-error/20',
  'galeri-abu': 'inline-block bg-tertiary-container text-on-tertiary-container font-label-md text-[10px] px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider border border-tertiary-fixed-dim',
  investigasi: 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error text-on-error font-label-md text-xs shadow-sm',
  kategori: 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-primary font-label-md text-[10px] uppercase border border-outline-variant shadow-sm',
});

/** Peta lencana kategori galeri (lib/kategoriGaleri.js: 'emas' | 'merah' | 'abu'). */
export function varianLencanaGaleri(lencana) {
  return `galeri-${lencana === 'emas' || lencana === 'merah' ? lencana : 'abu'}`;
}

export default function Lencana({ status = null, varian = null, className = '', children, ...props }) {
  if (status) {
    const kelasStatus = KELAS_STATUS_PENGADUAN[status] ?? KELAS_STATUS_PENGADUAN.selesai;
    return (
      <span className={`${PEMBUNGKUS_STATUS} ${kelasStatus}${className ? ` ${className}` : ''}`} {...props}>
        {children ?? labelStatusPengaduan(status)}
      </span>
    );
  }
  const kelas = KELAS_LENCANA[varian] ?? KELAS_LENCANA.kategori;
  return <span className={`${kelas}${className ? ` ${className}` : ''}`} {...props}>{children}</span>;
}
