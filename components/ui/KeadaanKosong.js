// components/ui/KeadaanKosong.js — keadaan kosong yang rapi (TAHAP-04 uji l), dipakai
// di setiap .map() (REFERENSI 18.2e). Stitch tidak menggambar keadaan kosong -> KEPUTUSAN BARU
// (REFERENSI 18.4): disusun HANYA dari kelas yang sudah ada di ZIP — panel Status Advokasi
// beranda (bg-surface-container-low, border-outline-variant, rounded-lg, p-6/p-8, text-center),
// ikon besar text-3xl text-secondary (kartu Status Advokasi), judul font-headline-md text-lg,
// keterangan font-body-md text-body-md text-on-surface-variant.
import Ikon from '@/components/ui/Ikon';

export default function KeadaanKosong({ ikon = 'article', judul, keterangan = null, className = '', children }) {
  return (
    <div className={`bg-surface-container-low border border-outline-variant rounded-lg p-8 text-center flex flex-col items-center gap-2${className ? ` ${className}` : ''}`} role="status">
      <Ikon nama={ikon} className="text-secondary text-3xl" />
      <h3 className="font-headline-md text-lg text-primary">{judul}</h3>
      {keterangan ? <p className="font-body-md text-body-md text-on-surface-variant">{keterangan}</p> : null}
      {children}
    </div>
  );
}
