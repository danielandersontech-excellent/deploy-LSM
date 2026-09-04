// components/publik/TautanKartu.js — tautan PEREGANG (stretched link) untuk kartu artikel (QA-1 butir 1).
// Desain memberi seluruh kartu gaya bisa-diklik (cursor-pointer, group-hover), tetapi markup hanya menautkan
// teks judul; klik pada gambar/ringkasan/badan kartu tidak membuka artikel (temuan pemilik, reproduksi
// laporan/bukti-qa-1/1-klik-kartu-sebelum-produksi.txt). Komponen ini menaruh <Link> absolut menutupi
// seluruh kartu (kartu wajib `relative`). aria-hidden + tabIndex -1: hanya untuk mouse/sentuh; pengguna
// keyboard & pembaca layar tetap memakai tautan judul yang sudah ada (tanpa tab-stop ganda). KEPUTUSAN BARU.
import Link from 'next/link';

export default function TautanKartu({ href, className = '' }) {
  return <Link href={href} aria-hidden="true" tabIndex={-1} className={`absolute inset-0 z-10 rounded-[inherit] ${className}`.trim()} />;
}
