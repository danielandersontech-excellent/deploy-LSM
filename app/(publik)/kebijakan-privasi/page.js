// app/(publik)/kebijakan-privasi/page.js — halaman teks statis dari pengaturan (REFERENSI 18.3).
import HalamanTeks from '@/components/publik/HalamanTeks';

export const metadata = {
  title: 'Kebijakan Privasi',
  description: 'Cara WARKOP NUSANTARA melindungi identitas pelapor dan data pengunjung.',
};

export default function HalamanKebijakanPrivasi() {
  return (
    <HalamanTeks
      kunci="teks_kebijakan_privasi"
      judul="Kebijakan Privasi"
      pembuka="Identitas pelapor adalah amanah. Halaman ini menjelaskan bagaimana kami menjaganya."
    />
  );
}
