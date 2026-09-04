// components/publik/IkonSosial.js — RUN QA-3 E: ikon media sosial untuk footer.
//
// ATURAN K1 (tanpa aset internet) DAN hak merek: ikon di bawah ini DIGAMBAR SENDIRI sebagai SVG inline
// satu warna (currentColor) yang hanya MENGISYARATKAN jenis kanalnya, bukan salinan logo resmi TikTok,
// Instagram, YouTube, atau Facebook. Tidak ada berkas yang diunduh, tidak ada pustaka ikon yang dipasang.
// Bentuknya sengaja sederhana dan seragam (kotak 24x24, garis/bidang tunggal) agar selaras dengan
// keluarga ikon Material Symbols yang dipakai di seluruh situs dan mewarisi warna teks di sekitarnya.
//
// Bila kelak pemilik ingin memakai logo resmi masing-masing platform, itu keputusan pemilik beserta
// kewajiban lisensinya; berkasnya cukup diletakkan di public/ dan komponen ini diarahkan ke sana.

const JALUR = Object.freeze({
  // TikTok: not balok (badan not + bendera) — mengisyaratkan kanal video musik pendek.
  tiktok: 'M9 3h2.2c.3 2 1.6 3.4 3.6 3.7v2.2c-1.3 0-2.5-.4-3.5-1.1v5.6c0 2.8-2.2 5-5 5s-5-2.2-5-5 2.2-5 5-5c.3 0 .6 0 .9.1v2.3a2.7 2.7 0 1 0 1.8 2.6V3Z',
  // Instagram: bingkai persegi membulat + lingkaran lensa + titik kecil.
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.5-2.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z',
  // YouTube: layar membulat mendatar + segitiga putar.
  youtube: 'M12 4.5c3.1 0 5.8.2 7.1.4 1.3.2 2.3 1.2 2.5 2.5.2 1.2.4 2.8.4 4.6s-.2 3.4-.4 4.6a3 3 0 0 1-2.5 2.5c-1.3.2-4 .4-7.1.4s-5.8-.2-7.1-.4a3 3 0 0 1-2.5-2.5C2.2 15.4 2 13.8 2 12s.2-3.4.4-4.6A3 3 0 0 1 4.9 4.9C6.2 4.7 8.9 4.5 12 4.5Zm-2 4v7l6-3.5-6-3.5Z',
  // Facebook: lingkaran dengan huruf f tegak sederhana.
  facebook: 'M12 2a10 10 0 1 0-1.2 19.9v-7h-2.3V12h2.3v-1.9c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.5V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 12 2Z',
});

export const KANAL_SOSIAL = Object.freeze([
  { kunci: 'sosial_tiktok', nama: 'tiktok', label: 'TikTok' },
  { kunci: 'sosial_instagram', nama: 'instagram', label: 'Instagram' },
  { kunci: 'sosial_youtube', nama: 'youtube', label: 'YouTube' },
  { kunci: 'sosial_facebook', nama: 'facebook', label: 'Facebook' },
]);

export default function IkonSosial({ nama, className = '' }) {
  const d = JALUR[nama];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d={d} />
    </svg>
  );
}
