// app/(publik)/faq/page.js — halaman teks statis dari pengaturan (REFERENSI 18.3); pasangan
// tanya-jawab dipisah baris kosong (baris pertama = pertanyaan, sisanya = jawaban).
import HalamanTeks from '@/components/publik/HalamanTeks';

export const metadata = {
  title: 'FAQ',
  description: 'Pertanyaan yang sering diajukan tentang pengaduan, pelacakan kasus, dan prosedur WARKOP NUSANTARA.',
};

export default function HalamanFaq() {
  return (
    <HalamanTeks
      kunci="teks_faq"
      judul="Pertanyaan yang Sering Diajukan"
      pembuka="Prosedur pengaduan, pelacakan nomor kasus, dan perlindungan identitas pelapor, dijawab singkat."
      modeFaq
    />
  );
}
