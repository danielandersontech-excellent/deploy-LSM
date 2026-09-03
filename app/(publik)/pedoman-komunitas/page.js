// app/(publik)/pedoman-komunitas/page.js — halaman teks statis dari pengaturan (REFERENSI 18.3).
import HalamanTeks from '@/components/publik/HalamanTeks';

export const metadata = {
  title: 'Pedoman Komunitas',
  description: 'Aturan main menyampaikan laporan lewat kanal pengaduan WARKOP NUSANTARA.',
};

export default function HalamanPedomanKomunitas() {
  return (
    <HalamanTeks
      kunci="teks_pedoman_komunitas"
      judul="Pedoman Komunitas"
      pembuka="Laporan yang jujur dan berbasis fakta adalah bahan bakar pengawasan sipil."
    />
  );
}
