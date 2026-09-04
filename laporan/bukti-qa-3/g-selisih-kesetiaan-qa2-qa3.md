# Selisih kesetiaan 14 layar: QA-2 (dasar) -> QA-3
# Hanya perubahan yang BERTAMBAH hilang; semuanya harus punya alasan penyimpangan sah.

## beranda_warkop_nusantara
- kelas BARU hilang (1): bg-secondary
- kelas yang KEMBALI cocok (1): w-48
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## tentang_kami_warkop_nusantara
- teks BARU hilang (1): Kantor Regional

## struktur_organisasi
- kelas BARU hilang (1): mb-24
- kelas yang KEMBALI cocok (1): hover:text-primary
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## program_kegiatan
- kelas yang KEMBALI cocok (1): w-48
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## galeri_dokumentasi
- kelas BARU hilang (4): bg-secondary, hover:bg-secondary-container, hover:text-on-secondary-container, text-on-secondary
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## kontak_pengaduan_warkop_nusantara_updated_logo
- kelas BARU hilang (2): hover:bg-secondary-container, hover:text-on-secondary-container

## portal_berita_beranda
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## daftar_berita_investigasi
- kelas BARU hilang (4): bg-secondary, hover:bg-secondary-container, hover:text-on-secondary-container, text-on-secondary
- teks BARU hilang (2): Kantor Regional | Masuk Staff

## detail_artikel_investigasi
- teks BARU hilang (2): Kantor Regional | Masuk Staff

9 layar berubah dari 14.

## DASAR KESETIAAN DIPERBARUI: penyimpangan sah RUN QA-3 dan alasannya

Seluruh selisih di atas berasal dari perubahan yang DIPERINTAHKAN PEMILIK, bukan dari kesalahan
konversi layar. Sisa cacat export tetap 0 di 14 layar dan seluruh halaman tetap HTTP 200.

| Yang hilang dari desain | Layar terdampak | Butir | Alasan (keputusan pemilik) |
|---|---|---|---|
| teks "Masuk Staff" | 8 layar publik | C | Tombol masuk staf dihapus dari seluruh situs publik. Halaman masuk tetap ada lewat URL langsung, alamatnya sengaja tidak diiklankan kepada pengunjung |
| kelas `bg-secondary`, `text-on-secondary`, `hover:bg-secondary-container`, `hover:text-on-secondary-container` | beranda, galeri, daftar berita, kontak | C | Kelas milik tombol "Masuk Staff" yang dihapus. Kelas ini tidak dipakai elemen lain pada layar tersebut |
| teks "Kantor Regional" | 8 layar publik | D2 | Tautan cepat footer diganti "Kantor Pusat" yang menuju petunjuk arah Google Maps |
| kelas `mb-24` | struktur_organisasi | A1 | Milik blok "Kerangka DPW, DPD, dan DPC" yang ditiadakan; DPC dihapus dari sistem dan kerangka DPW kini dirender per provinsi di bagian regional |

Yang KEMBALI cocok dengan desain (perbaikan, bukan penyimpangan):
| Kelas | Layar | Sebab |
|---|---|---|
| `w-48` | beranda, program | Ruang bekas tombol "Masuk Staff" dipakai melebarkan kotak cari menjadi w-48, yang justru sama dengan desain |
| `hover:text-primary` | struktur_organisasi | Nama provinsi pada blok DPW kini tautan ber-hover, seperti kartu regional desain |

CATATAN: perubahan footer D1 (latar membentang penuh) TIDAK menghilangkan satu kelas desain pun.
Kelas yang sama hanya dipindah: latar/garis ke elemen <footer> terluar, kelas kontainer ke <div> di
dalamnya. Karena pembanding kesetiaan menghitung kemunculan kelas di seluruh dokumen, hasilnya tetap.
