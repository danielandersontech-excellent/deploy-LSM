// components/ui/Kartu.js — kartu dengan kelas VERBATIM dari layar desain.
//   varian:
//     'artikel'  — kartu artikel beranda (Sorotan Investigasi): rounded-xl, hover shadow
//     'panel'    — isi kartu Status Advokasi beranda (bg-surface-container-low, garis emas bawah)
//     'kertas'   — kartu formulir/kontak kontak_pengaduan_..._updated_logo (rounded-lg, paper-shadow)
//     'polos'    — kartu tabel kelola_artikel_admin (rounded-lg, border tertiary, shadow-sm)
//   as: elemen pembungkus ('div' bawaan; 'article' untuk kartu berita).
export const KELAS_KARTU = Object.freeze({
  artikel: 'group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col',
  panel: 'p-6 flex flex-col h-full bg-surface-container-low border-b-4 border-secondary-fixed',
  kertas: 'bg-surface-container-lowest border border-outline-variant rounded-lg paper-shadow overflow-hidden',
  polos: 'bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm',
});

export default function Kartu({ varian = 'kertas', as: Elemen = 'div', className = '', children, ...props }) {
  const kelas = `${KELAS_KARTU[varian] ?? KELAS_KARTU.kertas}${className ? ` ${className}` : ''}`;
  return <Elemen className={kelas} {...props}>{children}</Elemen>;
}
