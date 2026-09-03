// components/ui/Tombol.js — tombol dengan kelas VERBATIM dari layar desain (REFERENSI 18.4:
// komponen ui memakai kelas yang sudah ada di ZIP, tidak memperkenalkan warna/radius baru).
//
//   varian:
//     'primer'  — tombol utama hero beranda ("Sampaikan Pengaduan"), beranda_warkop_nusantara
//     'garis'   — tombol garis tepi hero ("Pelajari Prosedur"), beranda_warkop_nusantara
//     'emas'    — "Masuk Staff" navbar kanonik (REFERENSI 18.3)
//     'ringkas' — "Pantau Semua Kasus" kartu Status Advokasi (tanpa w-full/mt-4 konteksnya)
//     'kirim'   — tombol kirim formulir kontak_pengaduan_..._updated_logo ("Kirim Laporan")
// Tahap 9 (aturan 9): komponen <Tombol> tidak pernah diimpor — dihapus; hanya KELAS_TOMBOL yang dipakai (10 tempat).

export const KELAS_TOMBOL = Object.freeze({
  primer: 'bg-primary text-on-primary hover:bg-primary-container px-8 py-4 rounded-lg font-label-md text-label-md transition-all shadow-[0_4px_14px_0_rgba(39,19,16,0.39)] hover:shadow-[0_6px_20px_rgba(39,19,16,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2',
  garis: 'bg-surface text-primary border border-outline hover:bg-surface-container-low px-8 py-4 rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2',
  emas: 'flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors',
  ringkas: 'py-2 border border-outline rounded text-primary font-label-md text-sm hover:bg-surface-container transition-colors text-center',
  kirim: 'px-6 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50',
});
